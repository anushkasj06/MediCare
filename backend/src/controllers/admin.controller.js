const User = require('../models/User')
const DoctorProfile = require('../models/DoctorProfile')
const DoctorDocument = require('../models/DoctorDocument')
const Appointment = require('../models/Appointment')
const Reminder = require('../models/Reminder')
const { AuditLog, NotificationLog } = require('../models/index')
const { sendSuccess, sendError } = require('../utils/response')
const { sendEmail, emailTemplates } = require('../utils/email')
const { paginate } = require('../utils/helpers')

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  const [
    totalUsers, totalDoctors, verifiedDoctors, pendingVerifications,
    totalAppointments, activeReminders, failedNotifications,
  ] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    User.countDocuments({ role: 'doctor' }),
    DoctorProfile.countDocuments({ verificationStatus: 'verified' }),
    DoctorProfile.countDocuments({ verificationStatus: 'pending' }),
    Appointment.countDocuments(),
    Reminder.countDocuments({ status: 'pending' }),
    NotificationLog.countDocuments({ status: 'failed' }),
  ])

  sendSuccess(res, 200, 'Admin stats', {
    totalUsers, totalDoctors, verifiedDoctors, pendingVerifications,
    totalAppointments, activeReminders, failedNotifications,
  })
}

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  const { role, isActive, isBlocked, page = 1, limit = 20, search } = req.query
  const { skip, limit: lim } = paginate(null, page, limit)
  const filter = {}
  if (role)     filter.role     = role
  if (isActive  !== undefined) filter.isActive  = isActive  === 'true'
  if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true'
  if (search)   filter.$or = [
    { fullName: { $regex: search, $options: 'i' } },
    { email:    { $regex: search, $options: 'i' } },
  ]

  const [users, total] = await Promise.all([
    User.find(filter).select('-passwordHash').skip(skip).limit(lim).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ])
  sendSuccess(res, 200, 'Users', users, { total, page: parseInt(page), limit: lim })
}

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash')
  if (!user) return sendError(res, 404, 'User not found')

  let extra = {}
  if (user.role === 'doctor') extra.profile = await DoctorProfile.findOne({ userId: user._id })

  sendSuccess(res, 200, 'User details', { user, ...extra })
}

// POST /api/admin/users/:id/block
exports.blockUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true }).select('-passwordHash')
  if (!user) return sendError(res, 404, 'User not found')
  sendSuccess(res, 200, 'User blocked', user)
}

// POST /api/admin/users/:id/unblock
exports.unblockUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true }).select('-passwordHash')
  if (!user) return sendError(res, 404, 'User not found')
  sendSuccess(res, 200, 'User unblocked', user)
}

// GET /api/admin/doctors/pending
exports.getPendingDoctors = async (req, res) => {
  const pending = await DoctorProfile.find({ verificationStatus: 'pending' })
    .populate('userId', 'fullName email phone profilePicture createdAt')
    .sort({ verificationSubmittedAt: 1 })
  sendSuccess(res, 200, 'Pending verifications', pending)
}

// POST /api/admin/doctors/:id/verify
exports.verifyDoctor = async (req, res) => {
  const { notes } = req.body
  const profile = await DoctorProfile.findOneAndUpdate(
    { userId: req.params.id },
    {
      verificationStatus: 'verified',
      verificationDate: new Date(),
      verifiedBy: req.user._id,
      rejectionReason: '',
    },
    { new: true }
  ).populate('userId', 'fullName email')

  if (!profile) return sendError(res, 404, 'Doctor not found')

  // Activate user account
  await User.findByIdAndUpdate(req.params.id, { isActive: true })

  // Update all submitted docs to approved
  await DoctorDocument.updateMany({ doctorId: req.params.id }, { status: 'approved', verificationNote: notes || '' })

  // Send email
  try {
    await sendEmail({ to: profile.userId.email, ...emailTemplates.doctorVerified(profile.userId.fullName) })
  } catch (_) {}

  sendSuccess(res, 200, 'Doctor verified successfully', profile)
}

// POST /api/admin/doctors/:id/reject
exports.rejectDoctor = async (req, res) => {
  const { reason } = req.body
  if (!reason) return sendError(res, 400, 'Rejection reason is required')

  const profile = await DoctorProfile.findOneAndUpdate(
    { userId: req.params.id },
    { verificationStatus: 'rejected', rejectionReason: reason },
    { new: true }
  ).populate('userId', 'fullName email')

  if (!profile) return sendError(res, 404, 'Doctor not found')

  await DoctorDocument.updateMany({ doctorId: req.params.id }, { status: 'rejected', verificationNote: reason })

  try {
    await sendEmail({ to: profile.userId.email, ...emailTemplates.doctorRejected(profile.userId.fullName, reason) })
  } catch (_) {}

  sendSuccess(res, 200, 'Doctor rejected', profile)
}

// GET /api/admin/reports/appointments
exports.getAppointmentsReport = async (req, res) => {
  const { dateFrom, dateTo } = req.query
  const filter = {}
  if (dateFrom || dateTo) {
    filter.appointmentDate = {}
    if (dateFrom) filter.appointmentDate.$gte = new Date(dateFrom)
    if (dateTo)   filter.appointmentDate.$lte = new Date(dateTo)
  }

  const [total, byStatus] = await Promise.all([
    Appointment.countDocuments(filter),
    Appointment.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ])

  sendSuccess(res, 200, 'Appointments report', { total, byStatus })
}

// GET /api/admin/reports/users
exports.getUsersReport = async (req, res) => {
  const byRole = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ])
  const newToday = await User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } })
  sendSuccess(res, 200, 'Users report', { byRole, newToday })
}

// GET /api/admin/logs
exports.getLogs = async (req, res) => {
  const { page = 1, limit = 50 } = req.query
  const { skip, limit: lim } = paginate(null, page, limit)

  const [logs, total] = await Promise.all([
    AuditLog.find().populate('actorId', 'fullName email role').sort({ createdAt: -1 }).skip(skip).limit(lim),
    AuditLog.countDocuments(),
  ])
  sendSuccess(res, 200, 'Audit logs', logs, { total, page: parseInt(page), limit: lim })
}

// ── Admin Settings ────────────────────────────────────────────
let platformSettings = {
  platformName:           'CareConnect',
  supportEmail:           'support@careconnect.in',
  supportPhone:           '+91 99999 00000',
  appointmentSlotMinutes: 30,
  maxBookingDaysAhead:    30,
  enableSmsReminders:     true,
  enableEmailReminders:   true,
  enableVoiceCalls:       false,
  doctorVerificationDays: 2,
  maintenanceMode:        false,
}

exports.getSettings = async (req, res) => {
  sendSuccess(res, 200, 'Settings', platformSettings)
}

exports.updateSettings = async (req, res) => {
  Object.keys(platformSettings).forEach(key => {
    if (req.body[key] !== undefined) platformSettings[key] = req.body[key]
  })
  sendSuccess(res, 200, 'Settings updated', platformSettings)
}
