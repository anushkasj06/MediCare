const Appointment = require('../models/Appointment')
const DoctorProfile = require('../models/DoctorProfile')
const Reminder = require('../models/Reminder')
const { NotificationLog } = require('../models/index')
const User = require('../models/User')
const { sendSuccess, sendError } = require('../utils/response')
const { generateSlots, getDayOfWeek } = require('../utils/helpers')
const { sendSms } = require('../utils/twilio')
const logger = require('../utils/logger')

const formatAppointmentDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// POST /api/appointments
exports.createAppointment = async (req, res) => {
  const { doctorId, appointmentDate, appointmentTime, appointmentType, reasonForVisit, symptoms, patientNotes } = req.body

  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' })
  if (!doctor) return sendError(res, 404, 'Doctor not found')

  const doctorProfile = await DoctorProfile.findOne({ userId: doctorId })
  if (!doctorProfile || doctorProfile.verificationStatus !== 'verified') {
    return sendError(res, 400, 'Doctor is not verified for appointments')
  }

  // Check for conflicts
  const apptDate = new Date(appointmentDate)
  const existing = await Appointment.findOne({
    doctorId,
    appointmentDate: apptDate,
    appointmentTime,
    status: { $in: ['pending','confirmed'] },
  })
  if (existing) return sendError(res, 409, 'This slot is already booked', [{ field: 'appointmentTime', message: 'Selected slot is unavailable' }])

  // Check day is in doctor availability
  const dayName   = getDayOfWeek(appointmentDate)
  const dayConfig = doctorProfile.availableSlots.find(s => s.dayOfWeek === dayName && s.isAvailable)
  if (!dayConfig) return sendError(res, 400, 'Doctor is not available on this day')

  // Calculate end time
  const [h, m]  = appointmentTime.split(':').map(Number)
  const endMins = h * 60 + m + (dayConfig.slotDuration || 30)
  const endTime = `${Math.floor(endMins / 60).toString().padStart(2,'0')}:${(endMins % 60).toString().padStart(2,'0')}`

  const appointment = await Appointment.create({
    patientId: req.user._id,
    doctorId,
    appointmentDate: apptDate,
    appointmentTime,
    endTime,
    durationMinutes: dayConfig.slotDuration || 30,
    status: 'pending',
    appointmentType: appointmentType || 'in-person',
    reasonForVisit,
    symptoms: symptoms || [],
    patientNotes: patientNotes || '',
    bookedBy: 'self',
  })

  // Create appointment reminders
  const before24h = new Date(apptDate)
  before24h.setDate(before24h.getDate() - 1)
  const [apptHour] = appointmentTime.split(':').map(Number)
  before24h.setHours(apptHour, 0, 0, 0)

  await Reminder.create({
    patientId: req.user._id, doctorId, appointmentId: appointment._id,
    type: 'appointment', title: `Appointment reminder – Dr. ${doctor.fullName}`,
    description: `Your appointment is tomorrow at ${appointmentTime}`,
    scheduledTime: before24h, channel: 'sms', status: 'pending', source: 'appointment',
    createdBy: req.user._id,
  })

  try {
    const smsBody = `Appointment confirmed with Dr. ${doctor.fullName} on ${formatAppointmentDate(apptDate)} at ${appointmentTime}.`
    const sms = await sendSms({ to: req.user.phone, message: smsBody })

    await NotificationLog.create({
      userId: req.user._id,
      type: 'sms',
      title: 'Appointment confirmation',
      body: smsBody,
      provider: sms.provider,
      providerMessageId: sms.sid || '',
      status: sms.isMock ? 'sent' : 'pending',
      sentAt: new Date(),
      metadata: { appointmentId: appointment._id, trigger: 'appointment-booking' },
    })
  } catch (err) {
    logger.error(`Failed to send appointment confirmation SMS: ${err.message}`)
  }

  sendSuccess(res, 201, 'Appointment booked successfully', appointment)
}

// GET /api/appointments/check-availability
exports.checkAvailability = async (req, res) => {
  const { doctorId, date } = req.query
  if (!doctorId || !date) return sendError(res, 400, 'doctorId and date required')

  const booked = await Appointment.find({
    doctorId,
    appointmentDate: new Date(date),
    status: { $in: ['pending','confirmed'] },
  }).select('appointmentTime')

  sendSuccess(res, 200, 'Booked slots', booked.map(a => a.appointmentTime))
}

// GET /api/appointments/:appointmentId
exports.getAppointment = async (req, res) => {
  const appt = await Appointment.findById(req.params.appointmentId)
    .populate('patientId', 'fullName email phone profilePicture dateOfBirth gender')
    .populate('doctorId',  'fullName email phone profilePicture')

  if (!appt) return sendError(res, 404, 'Appointment not found')

  // Only patient or doctor of this appointment
  const isOwner = appt.patientId._id.toString() === req.user._id.toString()
  const isDoc   = appt.doctorId._id.toString()  === req.user._id.toString()
  if (!isOwner && !isDoc && req.user.role !== 'admin') return sendError(res, 403, 'Access denied')

  sendSuccess(res, 200, 'Appointment details', appt)
}

// PUT /api/appointments/:appointmentId
exports.updateAppointment = async (req, res) => {
  const appt = await Appointment.findOne({ _id: req.params.appointmentId, patientId: req.user._id })
  if (!appt) return sendError(res, 404, 'Appointment not found')
  if (['completed','cancelled','rejected'].includes(appt.status)) {
    return sendError(res, 400, 'Cannot update a finalized appointment')
  }

  const allowedUpdates = ['reasonForVisit','symptoms','patientNotes','appointmentType']
  allowedUpdates.forEach(f => { if (req.body[f] !== undefined) appt[f] = req.body[f] })
  await appt.save()

  sendSuccess(res, 200, 'Appointment updated', appt)
}

// DELETE /api/appointments/:appointmentId  (cancel by patient)
exports.cancelAppointment = async (req, res) => {
  const { cancellationReason } = req.body
  const appt = await Appointment.findOne({ _id: req.params.appointmentId, patientId: req.user._id })
  if (!appt) return sendError(res, 404, 'Appointment not found')
  if (['completed','cancelled','rejected'].includes(appt.status)) {
    return sendError(res, 400, 'Appointment already finalized')
  }

  appt.status = 'cancelled'
  appt.cancelledAt = new Date()
  appt.cancellationReason = cancellationReason || 'Cancelled by patient'
  await appt.save()

  // Cancel related reminders
  await Reminder.updateMany({ appointmentId: appt._id, status: 'pending' }, { status: 'cancelled' })

  sendSuccess(res, 200, 'Appointment cancelled', appt)
}

// POST /api/appointments/:appointmentId/confirm  (doctor)
exports.confirmAppointment = async (req, res) => {
  const appt = await Appointment.findOne({ _id: req.params.appointmentId, doctorId: req.user._id })
  if (!appt) return sendError(res, 404, 'Appointment not found')

  appt.status = 'confirmed'
  appt.confirmedAt = new Date()
  if (req.body.doctorNotes) appt.doctorNotes = req.body.doctorNotes
  await appt.save()

  sendSuccess(res, 200, 'Appointment confirmed', appt)
}

// POST /api/appointments/:appointmentId/reschedule
exports.rescheduleAppointment = async (req, res) => {
  const { appointmentDate, appointmentTime, reason } = req.body
  const appt = await Appointment.findOne({
    _id: req.params.appointmentId,
    $or: [{ patientId: req.user._id }, { doctorId: req.user._id }],
  })
  if (!appt) return sendError(res, 404, 'Appointment not found')

  // Check new slot availability
  const conflict = await Appointment.findOne({
    _id: { $ne: appt._id },
    doctorId: appt.doctorId,
    appointmentDate: new Date(appointmentDate),
    appointmentTime,
    status: { $in: ['pending','confirmed'] },
  })
  if (conflict) return sendError(res, 409, 'New slot is already booked')

  const newAppt = await Appointment.create({
    ...appt.toObject(),
    _id: undefined,
    appointmentDate: new Date(appointmentDate),
    appointmentTime,
    status: 'pending',
    rescheduledFrom: appt._id,
    cancellationReason: '',
    cancelledAt: undefined,
    confirmedAt: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  })

  appt.status = 'cancelled'
  appt.cancellationReason = reason || 'Rescheduled'
  appt.cancelledAt = new Date()
  await appt.save()

  sendSuccess(res, 201, 'Appointment rescheduled', newAppt)
}
