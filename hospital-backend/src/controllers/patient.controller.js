const User = require('../models/User')
const Appointment = require('../models/Appointment')
const Prescription = require('../models/Prescription')
const MedicalHistory = require('../models/MedicalHistory')
const Reminder = require('../models/Reminder')
const { NotificationLog } = require('../models/index')
const { sendSuccess, sendError } = require('../utils/response')
const { paginate } = require('../utils/helpers')

// GET /api/patients/profile/me
exports.getProfile = async (req, res) => {
  sendSuccess(res, 200, 'Patient profile', req.user.toSafeObject())
}

// PUT /api/patients/profile/me
exports.updateProfile = async (req, res) => {
  const allowedFields = [
    'fullName','phone','profilePicture','dateOfBirth','gender','bloodGroup',
    'address','emergencyContact','allergies','chronicConditions',
  ]
  const updates = {}
  allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-passwordHash')
  sendSuccess(res, 200, 'Profile updated', user)
}

// GET /api/patients/appointments
exports.getAppointments = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query
  const { skip, limit: lim } = paginate(null, page, limit)
  const filter = { patientId: req.user._id }
  if (status) filter.status = status

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('doctorId', 'fullName profilePicture')
      .populate({ path: 'doctorId', select: 'fullName profilePicture' })
      .sort({ appointmentDate: -1 })
      .skip(skip).limit(lim),
    Appointment.countDocuments(filter),
  ])

  // Attach doctor profiles
  const DoctorProfile = require('../models/DoctorProfile')
  const result = await Promise.all(appointments.map(async a => {
    const dp = await DoctorProfile.findOne({ userId: a.doctorId }).select('specialization hospitalName consultationFee')
    return { ...a.toObject(), doctorProfile: dp }
  }))

  sendSuccess(res, 200, 'Appointments', result, { total, page: parseInt(page), limit: lim })
}

// GET /api/patients/prescriptions
exports.getPrescriptions = async (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const { skip, limit: lim } = paginate(null, page, limit)

  const [prescriptions, total] = await Promise.all([
    Prescription.find({ patientId: req.user._id })
      .populate('doctorId', 'fullName profilePicture')
      .sort({ uploadedAt: -1 }).skip(skip).limit(lim),
    Prescription.countDocuments({ patientId: req.user._id }),
  ])
  sendSuccess(res, 200, 'Prescriptions', prescriptions, { total, page: parseInt(page), limit: lim })
}

// GET /api/patients/medical-history
exports.getMedicalHistory = async (req, res) => {
  const { page = 1, limit = 10, dateFrom, dateTo, recordType } = req.query
  const { skip, limit: lim } = paginate(null, page, limit)
  const filter = { patientId: req.user._id }
  if (recordType) filter.recordType = recordType
  if (dateFrom || dateTo) {
    filter.createdAt = {}
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
    if (dateTo)   filter.createdAt.$lte = new Date(dateTo)
  }

  const [records, total] = await Promise.all([
    MedicalHistory.find(filter)
      .populate('doctorId', 'fullName profilePicture')
      .sort({ createdAt: -1 }).skip(skip).limit(lim),
    MedicalHistory.countDocuments(filter),
  ])
  sendSuccess(res, 200, 'Medical history', records, { total, page: parseInt(page), limit: lim })
}

// GET /api/patients/reminders
exports.getReminders = async (req, res) => {
  const { type, status, page = 1, limit = 20 } = req.query
  const filter = { patientId: req.user._id }
  if (type)   filter.type   = type
  if (status) filter.status = status

  const reminders = await Reminder.find(filter).sort({ scheduledTime: 1 })
  sendSuccess(res, 200, 'Reminders', reminders)
}

// POST /api/patients/reminders
exports.createReminder = async (req, res) => {
  const { title, description, type, scheduledTime, repeat, channel, repeatConfig } = req.body

  const reminder = await Reminder.create({
    patientId: req.user._id,
    title, description, type,
    scheduledTime: new Date(scheduledTime),
    repeat:   repeat   || 'once',
    channel:  channel  || 'sms',
    repeatConfig: repeatConfig || {},
    status:   'pending',
    source:   'manual',
    createdBy: req.user._id,
  })

  sendSuccess(res, 201, 'Reminder created', reminder)
}

// PUT /api/patients/reminders/:id
exports.updateReminder = async (req, res) => {
  const reminder = await Reminder.findOneAndUpdate(
    { _id: req.params.id, patientId: req.user._id },
    req.body,
    { new: true }
  )
  if (!reminder) return sendError(res, 404, 'Reminder not found')
  sendSuccess(res, 200, 'Reminder updated', reminder)
}

// DELETE /api/patients/reminders/:id
exports.deleteReminder = async (req, res) => {
  const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, patientId: req.user._id })
  if (!reminder) return sendError(res, 404, 'Reminder not found')
  sendSuccess(res, 200, 'Reminder deleted')
}

// GET /api/patients/notifications
exports.getNotifications = async (req, res) => {
  const notifications = await NotificationLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50)
  sendSuccess(res, 200, 'Notifications', notifications)
}

// GET /api/patients/dashboard
exports.getDashboard = async (req, res) => {
  const patientId = req.user._id
  const now       = new Date()

  const [
    upcomingAppointments,
    totalAppointments,
    activeMedications,
    nextReminder,
    unreadNotifications,
    latestRecord,
  ] = await Promise.all([
    Appointment.find({ patientId, status: { $in: ['pending','confirmed'] }, appointmentDate: { $gte: now } })
      .populate('doctorId', 'fullName profilePicture')
      .sort({ appointmentDate: 1 }).limit(5),
    Appointment.countDocuments({ patientId }),
    Prescription.find({ patientId, 'followUp.date': { $gte: now } }).limit(5),
    Reminder.findOne({ patientId, status: 'pending', scheduledTime: { $gte: now } }).sort({ scheduledTime: 1 }),
    NotificationLog.countDocuments({ userId: patientId, status: 'sent' }),
    MedicalHistory.findOne({ patientId }).sort({ createdAt: -1 }).populate('doctorId', 'fullName'),
  ])

  sendSuccess(res, 200, 'Dashboard data', {
    totalAppointments,
    upcomingAppointments,
    activeMedications,
    nextReminder,
    unreadNotifications,
    latestRecord,
    user: req.user.toSafeObject(),
  })
}
