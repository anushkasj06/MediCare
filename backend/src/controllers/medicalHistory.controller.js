const MedicalHistory = require('../models/MedicalHistory')
const User = require('../models/User')
const Appointment = require('../models/Appointment')
const { sendSuccess, sendError } = require('../utils/response')
const { paginate } = require('../utils/helpers')

// POST /api/medical-history  (doctor)
exports.addRecord = async (req, res) => {
  const {
    patientId, appointmentId, diagnosis, symptoms, treatment,
    medicationsSnapshot, vitals, followUpDate, doctorNotes, visitSummary, recordType,
  } = req.body

  const patient = await User.findOne({ _id: patientId, role: 'patient' })
  if (!patient) return sendError(res, 404, 'Patient not found')

  // Build lab reports from uploaded files
  const labReports = []
  if (req.files?.labReports) {
    req.files.labReports.forEach(f => labReports.push({
      fileUrl: f.path, fileName: f.originalname, uploadedAt: new Date(),
    }))
  }

  const record = await MedicalHistory.create({
    patientId,
    doctorId: req.user._id,
    appointmentId: appointmentId || undefined,
    diagnosis, symptoms: symptoms || [],
    treatment: treatment || '',
    medicationsSnapshot: medicationsSnapshot || [],
    labReports,
    vitals: vitals || {},
    followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    doctorNotes:  doctorNotes  || '',
    visitSummary: visitSummary || '',
    recordType:   recordType   || 'consultation',
  })

  // Mark appointment as completed if provided
  if (appointmentId) {
    await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' })
  }

  const populated = await MedicalHistory.findById(record._id)
    .populate('doctorId', 'fullName profilePicture')
    .populate('patientId', 'fullName')

  sendSuccess(res, 201, 'Medical record added', populated)
}

// PUT /api/medical-history/:id  (doctor who created it)
exports.updateRecord = async (req, res) => {
  const record = await MedicalHistory.findOne({ _id: req.params.id, doctorId: req.user._id })
  if (!record) return sendError(res, 404, 'Record not found or not authorized')

  const fields = ['diagnosis','symptoms','treatment','medicationsSnapshot','vitals','followUpDate','doctorNotes','visitSummary','recordType']
  fields.forEach(f => { if (req.body[f] !== undefined) record[f] = req.body[f] })
  await record.save()

  sendSuccess(res, 200, 'Medical record updated', record)
}

// GET /api/medical-history/:patientId
exports.getPatientHistory = async (req, res) => {
  const { patientId } = req.params
  const { page = 1, limit = 10, recordType, dateFrom, dateTo } = req.query
  const { skip, limit: lim } = paginate(null, page, limit)

  // Access check
  if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
    return sendError(res, 403, 'Access denied')
  }

  const filter = { patientId }
  if (recordType)   filter.recordType = recordType
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

// GET /api/medical-history/record/:id
exports.getRecord = async (req, res) => {
  const record = await MedicalHistory.findById(req.params.id)
    .populate('doctorId', 'fullName profilePicture')
    .populate('patientId', 'fullName email')
    .populate('appointmentId', 'appointmentDate appointmentTime')

  if (!record) return sendError(res, 404, 'Record not found')

  const isPatient = record.patientId._id.toString() === req.user._id.toString()
  const isDoctor  = record.doctorId._id.toString()  === req.user._id.toString()
  if (!isPatient && !isDoctor && req.user.role !== 'admin') return sendError(res, 403, 'Access denied')

  sendSuccess(res, 200, 'Medical record', record)
}

// GET /api/medical-history/:patientId/timeline
exports.getTimeline = async (req, res) => {
  const { patientId } = req.params
  if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
    return sendError(res, 403, 'Access denied')
  }

  const records = await MedicalHistory.find({ patientId })
    .populate('doctorId', 'fullName')
    .select('diagnosis recordType createdAt doctorId followUpDate visitSummary')
    .sort({ createdAt: -1 })

  sendSuccess(res, 200, 'Timeline', records)
}

// GET /api/medical-history/:patientId/conditions
exports.getConditions = async (req, res) => {
  const { patientId } = req.params
  if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
    return sendError(res, 403, 'Access denied')
  }

  const records   = await MedicalHistory.find({ patientId }).select('diagnosis symptoms')
  const diagnoses = [...new Set(records.flatMap(r => [r.diagnosis]))]
  const symptoms  = [...new Set(records.flatMap(r => r.symptoms))]
  const patient   = await User.findById(patientId).select('allergies chronicConditions bloodGroup')

  sendSuccess(res, 200, 'Conditions summary', { diagnoses, symptoms, ...patient?.toObject() })
}

// GET /api/medical-history/:id/export
exports.exportRecord = async (req, res) => {
  const record = await MedicalHistory.findById(req.params.id)
    .populate('doctorId', 'fullName')
    .populate('patientId', 'fullName dateOfBirth gender')

  if (!record) return sendError(res, 404, 'Record not found')
  // Return JSON for client to generate PDF
  sendSuccess(res, 200, 'Export data', record)
}
