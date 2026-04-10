const Reminder = require('../models/Reminder')
const { sendSuccess, sendError } = require('../utils/response')

// GET /api/reminders
exports.getReminders = async (req, res) => {
  const { type, status } = req.query
  const filter = {}

  if (req.user.role === 'patient') filter.patientId = req.user._id
  else if (req.user.role === 'doctor') filter.doctorId = req.user._id

  if (type)   filter.type   = type
  if (status) filter.status = status

  const reminders = await Reminder.find(filter).sort({ scheduledTime: 1 })
  sendSuccess(res, 200, 'Reminders', reminders)
}

// POST /api/reminders
exports.createReminder = async (req, res) => {
  const { patientId, title, description, type, scheduledTime, repeat, channel, repeatConfig } = req.body

  const targetPatient = patientId || req.user._id

  const reminder = await Reminder.create({
    patientId: targetPatient,
    doctorId:  req.user.role === 'doctor' ? req.user._id : undefined,
    title, description, type,
    scheduledTime: new Date(scheduledTime),
    repeat:   repeat   || 'once',
    channel:  channel  || 'sms',
    repeatConfig: repeatConfig || {},
    status: 'pending', source: 'manual', createdBy: req.user._id,
  })

  sendSuccess(res, 201, 'Reminder created', reminder)
}

// PUT /api/reminders/:id
exports.updateReminder = async (req, res) => {
  const filter = { _id: req.params.id }
  if (req.user.role === 'patient') filter.patientId = req.user._id

  const reminder = await Reminder.findOneAndUpdate(filter, req.body, { new: true })
  if (!reminder) return sendError(res, 404, 'Reminder not found')
  sendSuccess(res, 200, 'Reminder updated', reminder)
}

// DELETE /api/reminders/:id
exports.deleteReminder = async (req, res) => {
  const filter = { _id: req.params.id }
  if (req.user.role === 'patient') filter.patientId = req.user._id

  const reminder = await Reminder.findOneAndDelete(filter)
  if (!reminder) return sendError(res, 404, 'Reminder not found')
  sendSuccess(res, 200, 'Reminder deleted')
}

// POST /api/reminders/:id/snooze
exports.snoozeReminder = async (req, res) => {
  const { minutes = 15 } = req.body
  const reminder = await Reminder.findOne({ _id: req.params.id, patientId: req.user._id })
  if (!reminder) return sendError(res, 404, 'Reminder not found')

  const newTime = new Date(reminder.scheduledTime.getTime() + minutes * 60 * 1000)
  reminder.scheduledTime = newTime
  reminder.status = 'snoozed'
  await reminder.save()

  sendSuccess(res, 200, `Reminder snoozed for ${minutes} minutes`, reminder)
}
