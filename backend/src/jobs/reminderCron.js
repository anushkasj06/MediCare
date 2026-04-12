const cron = require('node-cron')
const Reminder = require('../models/Reminder')
const { NotificationLog } = require('../models/index')
const User = require('../models/User')
const logger = require('../utils/logger')
const { sendSms, makeVoiceCall } = require('../utils/twilio')
const { sendEmail } = require('../utils/email')

const MAX_RETRY_ATTEMPTS = 3
const BASE_RETRY_MINUTES = 5
const REMINDER_DISPATCH_CRON = process.env.REMINDER_DISPATCH_CRON || '* * * * *'

const isPrivateOrLocalHostname = (hostname = '') => {
  const host = String(hostname || '').toLowerCase()

  if (!host) return true
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true
  if (host.endsWith('.local')) return true

  if (/^10\./.test(host)) return true
  if (/^192\.168\./.test(host)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true

  return false
}

const isPublicHttpUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    return !isPrivateOrLocalHostname(parsed.hostname)
  } catch (_) {
    return false
  }
}

const escapeXml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const getRetryDelayMinutes = (attemptNumber) => {
  const safeAttempt = Math.max(1, attemptNumber)
  return BASE_RETRY_MINUTES * (2 ** (safeAttempt - 1))
}

const buildBackendBaseUrl = () => {
  const fromEnv = process.env.BACKEND_PUBLIC_URL || process.env.API_BASE_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return `http://localhost:${process.env.PORT || 5000}`
}

const buildStatusCallbackUrl = (reminderId, channel) => {
  const rawBase = process.env.TWILIO_STATUS_CALLBACK_URL || `${buildBackendBaseUrl()}/api/automation/twilio/status`

  if (!isPublicHttpUrl(rawBase)) {
    logger.warn('Skipping Twilio status callback URL because backend URL is local/private. Set TWILIO_STATUS_CALLBACK_URL to a public URL to enable callbacks.')
    return null
  }

  try {
    const url = new URL(rawBase)
    url.searchParams.set('reminderId', reminderId.toString())
    url.searchParams.set('channel', channel)
    return url.toString()
  } catch (_) {
    return null
  }
}

const buildVoiceTwimlUrl = (reminderId) => {
  const configuredUrl = process.env.TWILIO_VOICE_URL
  const frontendHosts = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(v => v.trim())
    .map(v => {
      try {
        return new URL(v).host
      } catch (_) {
        return null
      }
    })
    .filter(Boolean)

  if (configuredUrl) {
    try {
      const parsed = new URL(configuredUrl)
      if (frontendHosts.includes(parsed.host)) {
        logger.warn('TWILIO_VOICE_URL points to a frontend origin. Falling back to inline TwiML for local call flow.')
      } else if (isPublicHttpUrl(configuredUrl)) {
        parsed.searchParams.set('reminderId', reminderId.toString())
        return parsed.toString()
      } else {
        logger.warn('TWILIO_VOICE_URL is not publicly accessible. Falling back to inline TwiML for local call flow.')
      }
    } catch (_) {
      logger.warn('TWILIO_VOICE_URL is invalid. Falling back to inline TwiML for local call flow.')
    }
  }

  const backendTwimlBase = `${buildBackendBaseUrl()}/api/automation/twiml/reminder`
  if (isPublicHttpUrl(backendTwimlBase)) {
    const twimlUrl = new URL(backendTwimlBase)
    twimlUrl.searchParams.set('reminderId', reminderId.toString())
    return twimlUrl.toString()
  }

  return null
}

const buildInlineReminderTwiml = (reminder, patient) => {
  const patientName = escapeXml(patient?.fullName || 'there')
  const title = escapeXml(reminder?.title || 'Health reminder')
  const description = escapeXml(reminder?.description || '')

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello ${patientName}. This is a reminder from Medicare.</Say>
  <Pause length="1" />
  <Say voice="alice">${title}.</Say>
  ${description ? `<Say voice="alice">${description}.</Say>` : ''}
  <Say voice="alice">Thank you. Take care.</Say>
</Response>`
}

const scheduleRetry = async (reminder, attempts) => {
  const canRetry = attempts < MAX_RETRY_ATTEMPTS
  const delayMinutes = getRetryDelayMinutes(attempts)

  await Reminder.findByIdAndUpdate(reminder._id, {
    status: canRetry ? 'pending' : 'failed',
    attempts,
    lastAttemptAt: new Date(),
    nextAttemptAt: canRetry ? new Date(Date.now() + delayMinutes * 60 * 1000) : undefined,
  })

  return { canRetry, delayMinutes }
}

const processReminder = async (reminder) => {
  const patient = await User.findById(reminder.patientId).select('fullName phone email')
  if (!patient) {
    await Reminder.findByIdAndUpdate(reminder._id, { status: 'failed' })
    return
  }

  let providerMessageId = null
  let provider = 'system'
  let notificationStatus = 'sent'

  try {
    if (reminder.channel === 'sms') {
      const sms = await sendSms({
        to: patient.phone,
        message: `${reminder.title}. ${reminder.description}`,
        statusCallbackUrl: buildStatusCallbackUrl(reminder._id, 'sms'),
      })

      providerMessageId = sms.sid
      provider = sms.provider
      notificationStatus = sms.isMock ? 'sent' : 'pending'
    } else if (reminder.channel === 'call') {
      const twimlUrl = buildVoiceTwimlUrl(reminder._id)
      const call = await makeVoiceCall({
        to: patient.phone,
        twimlUrl,
        twiml: twimlUrl ? undefined : buildInlineReminderTwiml(reminder, patient),
        statusCallbackUrl: buildStatusCallbackUrl(reminder._id, 'call'),
      })

      providerMessageId = call.sid
      provider = call.provider
      notificationStatus = call.isMock ? 'sent' : 'pending'
    } else if (reminder.channel === 'email') {
      await sendEmail({
        to: patient.email,
        subject: reminder.title,
        html: `<p>Hi ${patient.fullName},</p><p>${reminder.description}</p>`,
      })
      provider = 'email'
      notificationStatus = 'sent'
    } else {
      logger.info(`[CHANNEL MOCK][${reminder.channel}] userId=${patient._id} title=${reminder.title}`)
    }

    const newStatus = reminder.repeat === 'once' ? 'completed' : 'sent'
    await Reminder.findByIdAndUpdate(reminder._id, {
      status: newStatus,
      attempts: (reminder.attempts || 0) + 1,
      lastAttemptAt: new Date(),
      nextAttemptAt: undefined,
    })

    if (reminder.repeat !== 'once') {
      const next = new Date(reminder.scheduledTime)
      if (reminder.repeat === 'daily') next.setDate(next.getDate() + 1)
      if (reminder.repeat === 'weekly') next.setDate(next.getDate() + 7)
      if (reminder.repeat === 'monthly') next.setMonth(next.getMonth() + 1)

      await Reminder.create({
        ...reminder.toObject(),
        _id: undefined,
        __v: undefined,
        status: 'pending',
        scheduledTime: next,
        attempts: 0,
        lastAttemptAt: undefined,
        nextAttemptAt: undefined,
        patientResponse: '',
        createdAt: undefined,
        updatedAt: undefined,
      })
    }

    await NotificationLog.create({
      userId: patient._id,
      type: reminder.channel,
      title: reminder.title,
      body: reminder.description,
      provider,
      providerMessageId: providerMessageId || '',
      status: notificationStatus,
      sentAt: new Date(),
      metadata: { reminderId: reminder._id },
    })

    logger.info(`Reminder dispatched [${reminder.channel}] to ${patient.fullName}: ${reminder.title}`)
  } catch (err) {
    const attempts = (reminder.attempts || 0) + 1
    const { canRetry, delayMinutes } = await scheduleRetry(reminder, attempts)

    await NotificationLog.create({
      userId: patient._id,
      type: reminder.channel,
      title: reminder.title,
      body: reminder.description,
      provider: reminder.channel === 'email'
        ? 'email'
        : ['sms', 'call'].includes(reminder.channel)
          ? 'twilio'
          : 'system',
      status: 'failed',
      failedAt: new Date(),
      errorMessage: err.message,
      metadata: { reminderId: reminder._id },
    })

    if (canRetry) {
      logger.warn(`Reminder dispatch failed (retry in ${delayMinutes} min): ${err.message}`)
    } else {
      logger.error(`Reminder dispatch failed permanently: ${err.message}`)
    }
  }
}

const dispatchDueReminders = async () => {
  try {
    const now = new Date()

    const dueReminders = await Reminder.find({
      status: { $in: ['pending', 'snoozed'] },
      scheduledTime: { $lte: now },
      optOut: false,
      $or: [
        { nextAttemptAt: { $exists: false } },
        { nextAttemptAt: null },
        { nextAttemptAt: { $lte: now } },
      ],
    })
      .sort({ scheduledTime: 1 })
      .limit(50)

    if (!dueReminders.length) return

    logger.info(`Dispatching ${dueReminders.length} due reminder(s)`)
    await Promise.allSettled(dueReminders.map(processReminder))
  } catch (err) {
    logger.error(`Cron dispatch error: ${err.message}`)
  }
}

const scheduleAppointmentReminders = async () => {
  try {
    const Appointment = require('../models/Appointment')
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 5 * 60 * 1000)
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000)

    const upcoming = await Appointment.find({
      status: 'confirmed',
      appointmentDate: { $gte: in23h, $lte: in24h },
      'reminderStatus.before24h': false,
    })
      .populate('patientId', 'fullName phone email')
      .populate('doctorId', 'fullName')

    for (const appt of upcoming) {
      try {
        const msg = `Reminder: You have an appointment with Dr. ${appt.doctorId?.fullName} tomorrow at ${appt.appointmentTime}. Hospital App.`
        const sms = await sendSms({ to: appt.patientId.phone, message: msg })

        await Appointment.findByIdAndUpdate(appt._id, { 'reminderStatus.before24h': true })

        await NotificationLog.create({
          userId: appt.patientId._id,
          type: 'sms',
          title: 'Appointment reminder',
          body: msg,
          provider: sms.provider,
          providerMessageId: sms.sid || '',
          status: sms.isMock ? 'sent' : 'pending',
          sentAt: new Date(),
          metadata: { appointmentId: appt._id, trigger: '24h-appointment-reminder' },
        })

        logger.info(`24h appointment reminder dispatched for ${appt.patientId.fullName}`)
      } catch (e) {
        logger.error(`Appointment reminder error: ${e.message}`)
      }
    }
  } catch (err) {
    logger.error(`scheduleAppointmentReminders error: ${err.message}`)
  }
}

cron.schedule(REMINDER_DISPATCH_CRON, dispatchDueReminders, {
  scheduled: true,
  timezone: 'Asia/Kolkata',
})

cron.schedule('*/30 * * * *', scheduleAppointmentReminders, {
  scheduled: true,
  timezone: 'Asia/Kolkata',
})

logger.info(`Cron jobs registered: reminder dispatch (${REMINDER_DISPATCH_CRON}) | appointment reminders (30min)`)

module.exports = { dispatchDueReminders, scheduleAppointmentReminders }
