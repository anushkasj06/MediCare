const cron    = require('node-cron')
const Reminder = require('../models/Reminder')
const { NotificationLog } = require('../models/index')
const User    = require('../models/User')
const logger  = require('../utils/logger')

// ─── Twilio SMS helper ────────────────────────────────────────────────────────
const sendSms = async (to, body) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    logger.info(`[SMS MOCK] To: ${to} | Message: ${body}`)
    return { sid: 'MOCK_' + Date.now() }
  }
  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  return twilio.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })
}

// ─── Email helper ─────────────────────────────────────────────────────────────
const { sendEmail } = require('../utils/email')

// ─── Process a single reminder ────────────────────────────────────────────────
const processReminder = async (reminder) => {
  const patient = await User.findById(reminder.patientId).select('fullName phone email')
  if (!patient) {
    await Reminder.findByIdAndUpdate(reminder._id, { status: 'failed' })
    return
  }

  let providerMessageId = null
  let success = false

  try {
    if (reminder.channel === 'sms' || reminder.channel === 'call') {
      const msg = await sendSms(patient.phone, `${reminder.title}. ${reminder.description}`)
      providerMessageId = msg.sid
      success = true
    } else if (reminder.channel === 'email') {
      await sendEmail({
        to:      patient.email,
        subject: reminder.title,
        html:    `<p>Hi ${patient.fullName},</p><p>${reminder.description}</p>`,
      })
      success = true
    } else {
      // push / whatsapp — log as sent (integrate separately)
      logger.info(`[PUSH MOCK] userId=${patient._id} | ${reminder.title}`)
      success = true
    }

    // Update reminder status
    const newStatus = reminder.repeat === 'once' ? 'completed' : 'sent'
    await Reminder.findByIdAndUpdate(reminder._id, {
      status:        newStatus,
      attempts:      (reminder.attempts || 0) + 1,
      lastAttemptAt: new Date(),
    })

    // For repeating reminders, schedule next occurrence
    if (reminder.repeat !== 'once') {
      const next = new Date(reminder.scheduledTime)
      if (reminder.repeat === 'daily')   next.setDate(next.getDate() + 1)
      if (reminder.repeat === 'weekly')  next.setDate(next.getDate() + 7)
      if (reminder.repeat === 'monthly') next.setMonth(next.getMonth() + 1)

      await Reminder.create({
        ...reminder.toObject(),
        _id:           undefined,
        status:        'pending',
        scheduledTime: next,
        attempts:      0,
        lastAttemptAt: undefined,
        nextAttemptAt: undefined,
        patientResponse: '',
      })
    }

    // Log notification
    await NotificationLog.create({
      userId:            patient._id,
      type:              reminder.channel,
      title:             reminder.title,
      body:              reminder.description,
      provider:          reminder.channel === 'sms' ? 'twilio' : 'system',
      providerMessageId: providerMessageId || '',
      status:            'sent',
      sentAt:            new Date(),
    })

    logger.info(`✅ Reminder sent [${reminder.channel}] to ${patient.fullName} — ${reminder.title}`)
  } catch (err) {
    logger.error(`❌ Reminder failed: ${err.message}`)
    const attempts = (reminder.attempts || 0) + 1
    await Reminder.findByIdAndUpdate(reminder._id, {
      status:        attempts >= 3 ? 'failed' : 'pending',
      attempts,
      lastAttemptAt: new Date(),
      nextAttemptAt: attempts < 3 ? new Date(Date.now() + 15 * 60 * 1000) : undefined,
    })

    await NotificationLog.create({
      userId:       patient._id,
      type:         reminder.channel,
      title:        reminder.title,
      body:         reminder.description,
      provider:     'twilio',
      status:       'failed',
      failedAt:     new Date(),
      errorMessage: err.message,
    })
  }
}

// ─── Main dispatch function ───────────────────────────────────────────────────
const dispatchDueReminders = async () => {
  try {
    const now = new Date()

    const dueReminders = await Reminder.find({
      status:        { $in: ['pending', 'snoozed'] },
      scheduledTime: { $lte: now },
      optOut:        false,
    }).limit(50)

    if (!dueReminders.length) return

    logger.info(`⏰ Dispatching ${dueReminders.length} due reminder(s)`)
    await Promise.allSettled(dueReminders.map(processReminder))
  } catch (err) {
    logger.error(`Cron dispatch error: ${err.message}`)
  }
}

// ─── Appointment reminder scheduler ──────────────────────────────────────────
const scheduleAppointmentReminders = async () => {
  try {
    const Appointment = require('../models/Appointment')
    const now         = new Date()
    const in24h       = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 5 * 60 * 1000)
    const in23h       = new Date(now.getTime() + 23 * 60 * 60 * 1000)

    // Appointments happening in ~24 hours that haven't been reminded
    const upcoming = await Appointment.find({
      status:          'confirmed',
      appointmentDate: { $gte: in23h, $lte: in24h },
      'reminderStatus.before24h': false,
    }).populate('patientId', 'fullName phone email')
      .populate('doctorId',  'fullName')

    for (const appt of upcoming) {
      try {
        const msg = `Reminder: You have an appointment with Dr. ${appt.doctorId?.fullName} tomorrow at ${appt.appointmentTime}. Hospital App.`
        await sendSms(appt.patientId.phone, msg)
        await Appointment.findByIdAndUpdate(appt._id, { 'reminderStatus.before24h': true })
        logger.info(`📅 24h appointment reminder sent for ${appt.patientId.fullName}`)
      } catch (e) {
        logger.error(`Appointment reminder error: ${e.message}`)
      }
    }
  } catch (err) {
    logger.error(`scheduleAppointmentReminders error: ${err.message}`)
  }
}

// ─── Register cron jobs ───────────────────────────────────────────────────────
// Every 5 minutes: check for due reminders
cron.schedule('*/5 * * * *', dispatchDueReminders, {
  scheduled:  true,
  timezone:   'Asia/Kolkata',
})

// Every 30 minutes: check for upcoming appointment 24h reminders
cron.schedule('*/30 * * * *', scheduleAppointmentReminders, {
  scheduled:  true,
  timezone:   'Asia/Kolkata',
})

logger.info('⏰ Cron jobs registered: reminder dispatch (5min) | appointment reminders (30min)')

module.exports = { dispatchDueReminders, scheduleAppointmentReminders }
