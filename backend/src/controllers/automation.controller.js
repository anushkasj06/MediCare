const Reminder = require('../models/Reminder')
const { NotificationLog } = require('../models/index')
const { sendSuccess, sendError } = require('../utils/response')
const { normalizeTwilioStatus } = require('../utils/twilio')
const logger = require('../utils/logger')

const MAX_RETRY_ATTEMPTS = 3
const BASE_RETRY_MINUTES = 5

const getRetryDelayMinutes = (attemptNumber) => {
  const safeAttempt = Math.max(1, attemptNumber)
  return BASE_RETRY_MINUTES * (2 ** (safeAttempt - 1))
}

const mapProviderStatusToLogStatus = (rawStatus) => {
  const value = String(rawStatus || '').toLowerCase()

  if (!value) return 'pending'
  if (['failed', 'undelivered', 'busy', 'no-answer', 'canceled'].includes(value)) return 'failed'
  if (['delivered', 'read', 'completed', 'answered'].includes(value)) return 'delivered'
  if (['sent'].includes(value)) return 'sent'

  return 'pending'
}

const escapeXml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

exports.getDueReminders = async (req, res) => {
  const now = new Date()
  const fiveMin = new Date(now.getTime() + 5 * 60 * 1000)

  const reminders = await Reminder.find({
    status: { $in: ['pending', 'snoozed'] },
    scheduledTime: { $lte: fiveMin },
    optOut: false,
    $or: [
      { nextAttemptAt: { $exists: false } },
      { nextAttemptAt: null },
      { nextAttemptAt: { $lte: now } },
    ],
  })
    .populate('patientId', 'fullName phone email')
    .populate('doctorId', 'fullName')
    .sort({ scheduledTime: 1 })
    .limit(100)

  sendSuccess(res, 200, 'Due reminders', reminders)
}

exports.updateReminderStatus = async (req, res) => {
  const { reminderId, status, providerMessageId, errorMessage } = req.body
  if (!reminderId || !status) return sendError(res, 400, 'reminderId and status are required')

  const reminder = await Reminder.findById(reminderId)
  if (!reminder) return sendError(res, 404, 'Reminder not found')

  const normalizedStatus = normalizeTwilioStatus(status)
  const attempts = (reminder.attempts || 0) + 1

  reminder.attempts = attempts
  reminder.lastAttemptAt = new Date()

  if (normalizedStatus === 'failed') {
    if (attempts < MAX_RETRY_ATTEMPTS) {
      const delayMinutes = getRetryDelayMinutes(attempts)
      reminder.status = 'pending'
      reminder.nextAttemptAt = new Date(Date.now() + delayMinutes * 60 * 1000)
    } else {
      reminder.status = 'failed'
      reminder.nextAttemptAt = undefined
    }
  } else {
    reminder.status = reminder.repeat === 'once' ? 'completed' : 'sent'
    reminder.nextAttemptAt = undefined
  }

  await reminder.save()

  const logStatus = mapProviderStatusToLogStatus(status)

  await NotificationLog.create({
    userId: reminder.patientId,
    type: reminder.channel,
    title: reminder.title,
    body: reminder.description,
    provider: 'twilio',
    providerMessageId: providerMessageId || '',
    status: logStatus,
    sentAt: logStatus === 'failed' ? undefined : new Date(),
    deliveredAt: logStatus === 'delivered' ? new Date() : undefined,
    failedAt: logStatus === 'failed' ? new Date() : undefined,
    errorMessage: errorMessage || '',
    metadata: { source: 'n8n-webhook', reminderId },
  })

  sendSuccess(res, 200, 'Status updated')
}

exports.getVoiceTwiml = async (req, res) => {
  const { reminderId } = req.query
  const reminder = await Reminder.findById(reminderId).populate('patientId', 'fullName')

  const rawMessage = reminder
    ? `Hello ${reminder.patientId?.fullName || 'there'}. ${reminder.title}. ${reminder.description}. Press 1 if noted, press 9 to snooze.`
    : 'This is a health reminder from your hospital app.'
  const message = escapeXml(rawMessage)

  res.set('Content-Type', 'text/xml')
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${message}</Say>
  <Gather numDigits="1" action="/api/automation/twiml/gather?reminderId=${reminderId}" method="POST">
    <Say voice="alice">Press 1 if you have noted this, or press 9 to snooze.</Say>
  </Gather>
  <Say voice="alice">We did not receive your input. Goodbye.</Say>
</Response>`)
}

exports.handleGather = async (req, res) => {
  const { Digits } = req.body
  const { reminderId } = req.query

  if (reminderId) {
    if (Digits === '1') {
      await Reminder.findByIdAndUpdate(reminderId, { status: 'completed', patientResponse: 'confirmed' })
    } else if (Digits === '9') {
      const newTime = new Date(Date.now() + 15 * 60 * 1000)
      await Reminder.findByIdAndUpdate(reminderId, { status: 'snoozed', scheduledTime: newTime, patientResponse: 'snoozed' })
    }
  }

  const responseMessage = Digits === '1'
    ? 'Thank you. Stay healthy!'
    : Digits === '9'
      ? 'Reminder snoozed for 15 minutes. Take care!'
      : 'Input not recognized. Goodbye.'

  res.set('Content-Type', 'text/xml')
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(responseMessage)}</Say>
</Response>`)
}

exports.handleTwilioStatusCallback = async (req, res) => {
  const providerMessageId = req.body.MessageSid || req.body.SmsSid || req.body.CallSid || ''
  const providerStatus = req.body.MessageStatus || req.body.SmsStatus || req.body.CallStatus || 'queued'
  const errorMessage = req.body.ErrorMessage || req.body.MessageStatusError || req.body.CallStatusError || ''
  const reminderId = req.query.reminderId || req.body.reminderId
  const channel = req.query.channel || (req.body.CallSid ? 'call' : 'sms')

  const normalizedStatus = normalizeTwilioStatus(providerStatus)
  const logStatus = mapProviderStatusToLogStatus(providerStatus)

  let reminder = null
  if (reminderId) {
    reminder = await Reminder.findById(reminderId)
  }

  if (reminder) {
    const baseUpdates = { lastAttemptAt: new Date() }

    if (normalizedStatus === 'failed') {
      const attempts = Math.max(reminder.attempts || 0, 1)
      const canRetry = attempts < MAX_RETRY_ATTEMPTS

      if (canRetry) {
        const delayMinutes = getRetryDelayMinutes(attempts)
        baseUpdates.status = 'pending'
        baseUpdates.nextAttemptAt = new Date(Date.now() + delayMinutes * 60 * 1000)
      } else {
        baseUpdates.status = 'failed'
        baseUpdates.nextAttemptAt = undefined
      }
    } else if (['pending', 'snoozed'].includes(reminder.status)) {
      baseUpdates.status = reminder.repeat === 'once' ? 'completed' : 'sent'
      baseUpdates.nextAttemptAt = undefined
    }

    await Reminder.findByIdAndUpdate(reminder._id, baseUpdates)

    const existing = providerMessageId
      ? await NotificationLog.findOne({ providerMessageId }).sort({ createdAt: -1 })
      : null

    if (existing) {
      existing.status = logStatus
      existing.deliveredAt = logStatus === 'delivered' ? new Date() : existing.deliveredAt
      existing.failedAt = logStatus === 'failed' ? new Date() : existing.failedAt
      existing.errorMessage = errorMessage || existing.errorMessage
      existing.metadata = {
        ...(existing.metadata || {}),
        callbackPayload: req.body,
        callbackChannel: channel,
      }
      await existing.save()
    } else {
      await NotificationLog.create({
        userId: reminder.patientId,
        type: channel,
        title: reminder.title,
        body: reminder.description,
        provider: 'twilio',
        providerMessageId,
        status: logStatus,
        sentAt: logStatus === 'failed' ? undefined : new Date(),
        deliveredAt: logStatus === 'delivered' ? new Date() : undefined,
        failedAt: logStatus === 'failed' ? new Date() : undefined,
        errorMessage,
        metadata: {
          reminderId: reminder._id,
          callbackPayload: req.body,
          callbackChannel: channel,
        },
      })
    }
  } else {
    logger.warn(`Twilio callback received without valid reminder mapping. providerMessageId=${providerMessageId}`)
  }

  sendSuccess(res, 200, 'Twilio callback processed', {
    reminderId: reminderId || null,
    providerMessageId,
    providerStatus,
  })
}

exports.getWorkflowStatus = async (req, res) => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [sent, failed, pending] = await Promise.all([
    NotificationLog.countDocuments({
      status: { $in: ['sent', 'delivered'] },
      $or: [
        { sentAt: { $gte: last24h } },
        { deliveredAt: { $gte: last24h } },
      ],
    }),
    NotificationLog.countDocuments({ status: 'failed', failedAt: { $gte: last24h } }),
    Reminder.countDocuments({ status: 'pending' }),
  ])
  sendSuccess(res, 200, 'Workflow status', { last24h: { sent, failed }, pendingReminders: pending })
}
