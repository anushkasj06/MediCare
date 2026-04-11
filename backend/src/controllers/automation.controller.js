const Reminder = require('../models/Reminder')
const { NotificationLog } = require('../models/index')
const { sendSuccess, sendError } = require('../utils/response')
const logger = require('../utils/logger')

// GET /api/automation/due-reminders  (called by n8n cron)
exports.getDueReminders = async (req, res) => {
  const now     = new Date()
  const fiveMin = new Date(now.getTime() + 5 * 60 * 1000)

  const reminders = await Reminder.find({
    status: { $in: ['pending', 'snoozed'] },
    scheduledTime: { $lte: fiveMin },
    optOut: false,
  })
    .populate('patientId', 'fullName phone email')
    .populate('doctorId',  'fullName')
    .limit(100)

  sendSuccess(res, 200, 'Due reminders', reminders)
}

// POST /api/automation/reminder-status  (webhook from n8n after sending)
exports.updateReminderStatus = async (req, res) => {
  const { reminderId, status, providerMessageId, errorMessage } = req.body

  const reminder = await Reminder.findById(reminderId)
  if (!reminder) return sendError(res, 404, 'Reminder not found')

  reminder.status       = status
  reminder.attempts     = (reminder.attempts || 0) + 1
  reminder.lastAttemptAt = new Date()

  if (status === 'failed' && reminder.attempts < 3) {
    reminder.status       = 'pending'
    reminder.nextAttemptAt = new Date(Date.now() + 15 * 60 * 1000)
  }

  await reminder.save()

  // Log notification
  await NotificationLog.create({
    userId:            reminder.patientId,
    type:              reminder.channel,
    title:             reminder.title,
    body:              reminder.description,
    provider:          'twilio',
    providerMessageId: providerMessageId || '',
    status:            status === 'sent' ? 'sent' : 'failed',
    sentAt:            new Date(),
    errorMessage:      errorMessage || '',
  })

  sendSuccess(res, 200, 'Status updated')
}

// POST /api/automation/twiml/reminder  (Twilio voice webhook - returns TwiML)
exports.getVoiceTwiml = async (req, res) => {
  const { reminderId } = req.query
  const reminder = await Reminder.findById(reminderId).populate('patientId', 'fullName')

  const message = reminder
    ? `Hello ${reminder.patientId?.fullName || 'there'}. ${reminder.title}. ${reminder.description}. Press 1 if noted, press 9 to snooze.`
    : 'This is a health reminder from your hospital app.'

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

// POST /api/automation/twiml/gather  (Twilio digit input callback)
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

  res.set('Content-Type', 'text/xml')
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${Digits === '1' ? 'Thank you. Stay healthy!' : 'Reminder snoozed for 15 minutes. Take care!'}</Say>
</Response>`)
}

// GET /api/automation/workflow-status
exports.getWorkflowStatus = async (req, res) => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [sent, failed, pending] = await Promise.all([
    NotificationLog.countDocuments({ status: 'sent',   sentAt: { $gte: last24h } }),
    NotificationLog.countDocuments({ status: 'failed', sentAt: { $gte: last24h } }),
    Reminder.countDocuments({ status: 'pending' }),
  ])
  sendSuccess(res, 200, 'Workflow status', { last24h: { sent, failed }, pendingReminders: pending })
}
