const mongoose = require('mongoose')

const medicalHistorySchema = new mongoose.Schema({
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  diagnosis:     { type: String, required: true },
  symptoms:      [{ type: String }],
  treatment:     { type: String, default: '' },
  medicationsSnapshot: [{
    medicineName: { type: String },
    dosage:       { type: String },
    frequency:    { type: String },
    durationDays: { type: Number },
  }],
  labReports: [{
    fileUrl:    { type: String },
    fileName:   { type: String },
    uploadedAt: { type: Date, default: Date.now },
  }],
  vitals: {
    bloodPressure: { type: String },
    heartRate:     { type: Number },
    temperature:   { type: Number },
    weight:        { type: Number },
    oxygenLevel:   { type: Number },
  },
  followUpDate:  { type: Date },
  doctorNotes:   { type: String, default: '' },
  visitSummary:  { type: String, default: '' },
  recordType: {
    type: String,
    enum: ['consultation','diagnosis','lab','followup','discharge'],
    default: 'consultation',
  },
}, { timestamps: true })

medicalHistorySchema.index({ patientId: 1, createdAt: -1 })

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema)
