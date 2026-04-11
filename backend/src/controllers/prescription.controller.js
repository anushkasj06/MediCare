const Prescription = require('../models/Prescription')
const Reminder = require('../models/Reminder')
const User = require('../models/User')
const { sendSuccess, sendError } = require('../utils/response')
const { buildUploadedFileUrl } = require('../config/cloudinary')

const normalizeReminderChannel = (value) => {
  if (!value) return 'sms'
  if (Array.isArray(value)) return value[0] || 'sms'

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed[0] || 'sms'
    } catch (_) {}
    return value
  }

  return 'sms'
}

// POST /api/prescriptions/upload  (doctor)
exports.uploadPrescription = async (req, res) => {
  const {
    patientId, appointmentId, notes, expiryDate,
    followUpDate, followUpType, followUpNotes,
    createReminder, reminderChannel,
  } = req.body

  let medications = []
  try {
    medications = typeof req.body.medications === 'string'
      ? JSON.parse(req.body.medications)
      : req.body.medications || []
  } catch (_) {}

  const patient = await User.findOne({ _id: patientId, role: 'patient' })
  if (!patient) return sendError(res, 404, 'Patient not found')

  const fileData = req.file
    ? { fileUrl: buildUploadedFileUrl(req, req.file), fileName: req.file.originalname, fileType: req.file.mimetype, fileSize: req.file.size }
    : {}

  const prescription = await Prescription.create({
    patientId,
    doctorId: req.user._id,
    appointmentId: appointmentId || undefined,
    ...fileData,
    notes: notes || '',
    expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    medications,
    followUp: {
      date:  followUpDate  ? new Date(followUpDate) : undefined,
      type:  followUpType  || '',
      notes: followUpNotes || '',
    },
  })

  // Auto-create medication reminders
  if ((createReminder === true || createReminder === 'true') && medications.length) {
    const channel = normalizeReminderChannel(reminderChannel)
    const reminderDocs = []

    for (const med of medications) {
      if (!med.reminderEnabled) continue
      const times = med.medicineTimes || ['morning']
      const timeMap = { morning: '08:00', afternoon: '13:00', night: '21:00', evening: '18:00' }

      for (const t of times) {
        const startDate = med.startDate ? new Date(med.startDate) : new Date()
        const [h, m]    = (timeMap[t] || '08:00').split(':').map(Number)
        startDate.setHours(h, m, 0, 0)

        reminderDocs.push({
          patientId, doctorId: req.user._id,
          prescriptionId: prescription._id, medicationId: med._id,
          type: 'medication',
          title: `Take ${med.medicineName} ${med.dosage}${med.dosageUnit || 'mg'}`,
          description: `${med.beforeAfterFood?.replace('_',' ')} – ${med.instructions || ''}`,
          scheduledTime: startDate,
          repeat: med.durationDays > 1 ? 'daily' : 'once',
          channel, status: 'pending', source: 'prescription', createdBy: req.user._id,
        })
      }
    }

    if (reminderDocs.length) await Reminder.insertMany(reminderDocs)
  }

  // Create follow-up reminder
  if (followUpDate && (createReminder === true || createReminder === 'true')) {
    await Reminder.create({
      patientId, doctorId: req.user._id, prescriptionId: prescription._id,
      type: 'follow-up',
      title: `Follow-up appointment due`,
      description: followUpNotes || 'Your follow-up date is approaching',
      scheduledTime: new Date(new Date(followUpDate).setDate(new Date(followUpDate).getDate() - 1)),
      channel: normalizeReminderChannel(reminderChannel),
      status: 'pending', source: 'prescription', createdBy: req.user._id,
    })
  }

  const populated = await Prescription.findById(prescription._id)
    .populate('doctorId', 'fullName profilePicture')
    .populate('patientId', 'fullName')

  sendSuccess(res, 201, 'Prescription uploaded successfully', populated)
}

// GET /api/prescriptions/:id
exports.getPrescription = async (req, res) => {
  const pres = await Prescription.findById(req.params.id)
    .populate('doctorId', 'fullName profilePicture')
    .populate('patientId', 'fullName email')
    .populate('appointmentId', 'appointmentDate appointmentTime')

  if (!pres) return sendError(res, 404, 'Prescription not found')

  const isPatient = pres.patientId._id.toString() === req.user._id.toString()
  const isDoctor  = pres.doctorId._id.toString()  === req.user._id.toString()
  if (!isPatient && !isDoctor && req.user.role !== 'admin') return sendError(res, 403, 'Access denied')

  sendSuccess(res, 200, 'Prescription', pres)
}

// DELETE /api/prescriptions/:id  (doctor only)
exports.deletePrescription = async (req, res) => {
  const pres = await Prescription.findOne({ _id: req.params.id, doctorId: req.user._id })
  if (!pres) return sendError(res, 404, 'Prescription not found or not authorized')
  await pres.deleteOne()
  sendSuccess(res, 200, 'Prescription deleted')
}

// GET /api/prescriptions/patient/:patientId
exports.getPatientPrescriptions = async (req, res) => {
  const { patientId } = req.params
  // Access: the patient themselves, or the doctor, or admin
  if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
    return sendError(res, 403, 'Access denied')
  }
  const prescriptions = await Prescription.find({ patientId })
    .populate('doctorId', 'fullName profilePicture')
    .sort({ uploadedAt: -1 })
  sendSuccess(res, 200, 'Patient prescriptions', prescriptions)
}

// GET /api/prescriptions/doctor/:doctorId
exports.getDoctorPrescriptions = async (req, res) => {
  if (req.user._id.toString() !== req.params.doctorId && req.user.role !== 'admin') {
    return sendError(res, 403, 'Access denied')
  }
  const prescriptions = await Prescription.find({ doctorId: req.params.doctorId })
    .populate('patientId', 'fullName email phone')
    .sort({ uploadedAt: -1 })
  sendSuccess(res, 200, 'Doctor prescriptions', prescriptions)
}

// POST /api/prescriptions/:id/share
exports.sharePrescription = async (req, res) => {
  const pres = await Prescription.findOne({ _id: req.params.id, patientId: req.user._id })
  if (!pres) return sendError(res, 404, 'Prescription not found')
  // Return the file URL to share
  sendSuccess(res, 200, 'Prescription share link', { shareUrl: pres.fileUrl })
}

// GET /api/prescriptions/:id/download
exports.downloadPrescription = async (req, res) => {
  const pres = await Prescription.findById(req.params.id)
  if (!pres) return sendError(res, 404, 'Prescription not found')
  const isOwner = pres.patientId.toString() === req.user._id.toString() || pres.doctorId.toString() === req.user._id.toString()
  if (!isOwner && req.user.role !== 'admin') return sendError(res, 403, 'Access denied')
  sendSuccess(res, 200, 'Download URL', { downloadUrl: pres.fileUrl, fileName: pres.fileName })
}
