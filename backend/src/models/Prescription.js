const mongoose = require('mongoose')

const medicationSchema = new mongoose.Schema({
  medicineName:    { type: String, required: true },
  dosage:          { type: String },
  dosageUnit:      { type: String, default: 'mg' },
  frequencyPerDay: { type: Number, default: 1 },
  medicineTimes:   [{ type: String }],
  beforeAfterFood: { type: String, enum: ['before_food','after_food','with_food','any'], default: 'any' },
  durationDays:    { type: Number },
  startDate:       { type: Date },
  endDate:         { type: Date },
  instructions:    { type: String, default: '' },
  reminderEnabled: { type: Boolean, default: true },
}, { _id: true })

const prescriptionSchema = new mongoose.Schema({
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  fileUrl:       { type: String },
  fileName:      { type: String },
  fileType:      { type: String },
  fileSize:      { type: Number },
  ocrText:       { type: String, default: '' },
  notes:         { type: String, default: '' },
  expiryDate:    { type: Date },
  uploadedAt:    { type: Date, default: Date.now },
  tags:          [{ type: String }],
  medications:   [medicationSchema],
  followUp: {
    date:  { type: Date },
    type:  { type: String, enum: ['appointment','call','sms',''], default: '' },
    notes: { type: String, default: '' },
  },
}, { timestamps: true })

prescriptionSchema.index({ patientId: 1, uploadedAt: -1 })

module.exports = mongoose.model('Prescription', prescriptionSchema)
