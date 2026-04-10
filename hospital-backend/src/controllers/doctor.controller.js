const User = require('../models/User')
const DoctorProfile = require('../models/DoctorProfile')
const DoctorDocument = require('../models/DoctorDocument')
const Appointment = require('../models/Appointment')
const { sendSuccess, sendError } = require('../utils/response')
const { generateSlots, getDayOfWeek, paginate } = require('../utils/helpers')

// GET /api/doctors  (public)
exports.getDoctors = async (req, res) => {
  const { specialization, city, hospital, language, feeMin, feeMax, rating, verified, page = 1, limit = 10, search } = req.query
  const { skip, limit: lim } = paginate(null, page, limit)

  const profileFilter = {}
  if (specialization) profileFilter.specialization = { $regex: specialization, $options: 'i' }
  if (hospital)       profileFilter.hospitalName   = { $regex: hospital, $options: 'i' }
  if (language)       profileFilter.languages      = { $in: [new RegExp(language, 'i')] }
  if (feeMin || feeMax) {
    profileFilter.consultationFee = {}
    if (feeMin) profileFilter.consultationFee.$gte = Number(feeMin)
    if (feeMax) profileFilter.consultationFee.$lte = Number(feeMax)
  }
  if (rating) profileFilter.ratingAverage = { $gte: Number(rating) }
  if (verified === 'true') profileFilter.verificationStatus = 'verified'

  const profiles = await DoctorProfile.find(profileFilter)
    .populate({
      path: 'userId',
      select: 'fullName profilePicture email',
      match: search ? { fullName: { $regex: search, $options: 'i' } } : {},
    })
    .skip(skip).limit(lim).sort({ ratingAverage: -1 })

  const filtered = profiles.filter(p => p.userId)
  const total    = await DoctorProfile.countDocuments(profileFilter)

  sendSuccess(res, 200, 'Doctors fetched', filtered, { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) })
}

// GET /api/doctors/:doctorId  (public)
exports.getDoctorById = async (req, res) => {
  const { doctorId } = req.params
  const user = await User.findById(doctorId).select('-passwordHash')
  if (!user || user.role !== 'doctor') return sendError(res, 404, 'Doctor not found')

  const profile = await DoctorProfile.findOne({ userId: doctorId })
  sendSuccess(res, 200, 'Doctor details', { user, profile })
}

// GET /api/doctors/profile/me
exports.getMyProfile = async (req, res) => {
  const profile = await DoctorProfile.findOne({ userId: req.user._id })
  sendSuccess(res, 200, 'Doctor profile', { user: req.user.toSafeObject(), profile })
}

// PUT /api/doctors/profile/me
exports.updateMyProfile = async (req, res) => {
  const allowedFields = ['fullName','profilePicture','phone']
  const userUpdates   = {}
  allowedFields.forEach(f => { if (req.body[f] !== undefined) userUpdates[f] = req.body[f] })

  const profileFields = ['specialization','qualifications','experienceYears','hospitalName',
    'clinicAddress','consultationFee','languages','about','servicesOffered']
  const profileUpdates = {}
  profileFields.forEach(f => { if (req.body[f] !== undefined) profileUpdates[f] = req.body[f] })

  const [user, profile] = await Promise.all([
    Object.keys(userUpdates).length   ? User.findByIdAndUpdate(req.user._id, userUpdates, { new: true }).select('-passwordHash') : User.findById(req.user._id).select('-passwordHash'),
    Object.keys(profileUpdates).length ? DoctorProfile.findOneAndUpdate({ userId: req.user._id }, profileUpdates, { new: true }) : DoctorProfile.findOne({ userId: req.user._id }),
  ])

  sendSuccess(res, 200, 'Profile updated', { user, profile })
}

// PUT /api/doctors/availability
exports.updateAvailability = async (req, res) => {
  const { availableSlots } = req.body
  if (!Array.isArray(availableSlots)) return sendError(res, 400, 'availableSlots must be an array')

  const profile = await DoctorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { availableSlots },
    { new: true }
  )
  sendSuccess(res, 200, 'Availability updated', profile)
}

// GET /api/doctors/availability/:doctorId  (public)
exports.getDoctorAvailability = async (req, res) => {
  const profile = await DoctorProfile.findOne({ userId: req.params.doctorId }).select('availableSlots')
  if (!profile) return sendError(res, 404, 'Doctor not found')
  sendSuccess(res, 200, 'Availability', profile.availableSlots)
}

// GET /api/doctors/appointments
exports.getDoctorAppointments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const { skip, limit: lim } = paginate(null, page, limit)
  const filter = { doctorId: req.user._id }
  if (status) filter.status = status

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'fullName email phone profilePicture dateOfBirth gender')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip).limit(lim),
    Appointment.countDocuments(filter),
  ])

  sendSuccess(res, 200, 'Appointments', appointments, { total, page: parseInt(page), limit: lim })
}

// PATCH /api/doctors/appointments/:appointmentId/status
exports.updateAppointmentStatus = async (req, res) => {
  const { appointmentId } = req.params
  const { status, doctorNotes, cancellationReason } = req.body

  const validStatuses = ['confirmed','rejected','completed','cancelled','no-show']
  if (!validStatuses.includes(status)) return sendError(res, 400, 'Invalid status')

  const appt = await Appointment.findOne({ _id: appointmentId, doctorId: req.user._id })
  if (!appt) return sendError(res, 404, 'Appointment not found')

  appt.status = status
  if (doctorNotes)        appt.doctorNotes = doctorNotes
  if (cancellationReason) appt.cancellationReason = cancellationReason
  if (status === 'confirmed') appt.confirmedAt = new Date()
  if (status === 'cancelled') appt.cancelledAt = new Date()
  await appt.save()

  // Send email notification to patient
  try {
    const patient = await User.findById(appt.patientId)
    const doctor  = req.user
    const { sendEmail, emailTemplates } = require('../utils/email')
    if (status === 'confirmed') {
      await sendEmail({ to: patient.email, ...emailTemplates.appointmentConfirmed(patient.fullName, doctor.fullName, appt.appointmentDate.toDateString(), appt.appointmentTime) })
    } else if (status === 'cancelled' || status === 'rejected') {
      await sendEmail({ to: patient.email, ...emailTemplates.appointmentCancelled(patient.fullName, doctor.fullName, appt.appointmentDate.toDateString()) })
    }
  } catch (_) {}

  sendSuccess(res, 200, 'Appointment status updated', appt)
}

// POST /api/doctors/verify/submit
exports.submitVerification = async (req, res) => {
  const files = req.files || {}

  const docEntries = []
  if (files.medicalLicenseFile?.[0]) {
    docEntries.push({ doctorId: req.user._id, documentType: 'license', fileUrl: files.medicalLicenseFile[0].path, fileName: files.medicalLicenseFile[0].originalname, fileType: files.medicalLicenseFile[0].mimetype, fileSize: files.medicalLicenseFile[0].size })
  }
  if (files.governmentIdFile?.[0]) {
    docEntries.push({ doctorId: req.user._id, documentType: 'idProof', fileUrl: files.governmentIdFile[0].path, fileName: files.governmentIdFile[0].originalname, fileType: files.governmentIdFile[0].mimetype, fileSize: files.governmentIdFile[0].size })
  }
  if (files.profilePhoto?.[0]) {
    docEntries.push({ doctorId: req.user._id, documentType: 'profilePhoto', fileUrl: files.profilePhoto[0].path, fileName: files.profilePhoto[0].originalname, fileType: files.profilePhoto[0].mimetype, fileSize: files.profilePhoto[0].size })
    await User.findByIdAndUpdate(req.user._id, { profilePicture: files.profilePhoto[0].path })
  }
  if (files.degreeCertificateFiles) {
    files.degreeCertificateFiles.forEach(f => {
      docEntries.push({ doctorId: req.user._id, documentType: 'degree', fileUrl: f.path, fileName: f.originalname, fileType: f.mimetype, fileSize: f.size })
    })
  }

  if (docEntries.length) await DoctorDocument.insertMany(docEntries)

  await DoctorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { verificationStatus: 'pending', verificationSubmittedAt: new Date() }
  )

  sendSuccess(res, 200, 'Verification documents submitted. Pending admin review.')
}

// GET /api/doctors/verify/status
exports.getVerificationStatus = async (req, res) => {
  const profile = await DoctorProfile.findOne({ userId: req.user._id }).select('verificationStatus rejectionReason verificationSubmittedAt')
  const docs    = await DoctorDocument.find({ doctorId: req.user._id })
  sendSuccess(res, 200, 'Verification status', { profile, documents: docs })
}

// GET /api/doctors/patients/:patientId
exports.getPatientDetails = async (req, res) => {
  const { patientId } = req.params

  // Check doctor has an appointment with this patient
  const hasAccess = await Appointment.findOne({
    doctorId: req.user._id,
    patientId,
    status: { $in: ['confirmed', 'completed', 'pending'] },
  })
  if (!hasAccess) return sendError(res, 403, 'You do not have access to this patient')

  const MedicalHistory = require('../models/MedicalHistory')
  const Prescription   = require('../models/Prescription')

  const [patient, appointments, prescriptions, medicalHistory] = await Promise.all([
    User.findById(patientId).select('-passwordHash'),
    Appointment.find({ patientId, doctorId: req.user._id }).sort({ appointmentDate: -1 }).limit(10),
    Prescription.find({ patientId, doctorId: req.user._id }).sort({ uploadedAt: -1 }),
    MedicalHistory.find({ patientId }).sort({ createdAt: -1 }).limit(20),
  ])

  sendSuccess(res, 200, 'Patient details', { patient, appointments, prescriptions, medicalHistory })
}

// GET /api/doctors/available-slots (public)
exports.getAvailableSlots = async (req, res) => {
  const { doctorId, date } = req.query
  if (!doctorId || !date) return sendError(res, 400, 'doctorId and date are required')

  const profile = await DoctorProfile.findOne({ userId: doctorId })
  if (!profile) return sendError(res, 404, 'Doctor not found')

  const dayName   = getDayOfWeek(date)
  const dayConfig = profile.availableSlots.find(s => s.dayOfWeek === dayName && s.isAvailable)
  if (!dayConfig) return sendSuccess(res, 200, 'No slots', [])

  const allSlots = generateSlots(
    dayConfig.startTime, dayConfig.endTime,
    dayConfig.slotDuration, dayConfig.breakStart, dayConfig.breakEnd
  )

  // Remove booked slots
  const booked = await Appointment.find({
    doctorId,
    appointmentDate: new Date(date),
    status: { $in: ['pending','confirmed'] },
  }).select('appointmentTime')

  const bookedTimes = booked.map(a => a.appointmentTime)
  const available   = allSlots.filter(s => !bookedTimes.includes(s))

  sendSuccess(res, 200, 'Available slots', available)
}
