const mongoose = require('mongoose')

const reminderSchema = new mongoose.Schema({
  patientId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appointmentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  medicationId:   { type: mongoose.Schema.Types.ObjectId },
  type: {
    type: String,
    enum: ['medication','appointment','follow-up','refill','custom'],
    required: true,
  },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  scheduledTime: { type: Date, required: true },
  timezone:      { type: String, default: 'Asia/Kolkata' },
  repeat: {
    type: String,
    enum: ['once','daily','weekly','monthly','custom'],
    default: 'once',
  },
  repeatConfig: { type: mongoose.Schema.Types.Mixed },
  channel: {
    type: String,
    enum: ['sms','call','email','push','whatsapp'],
    default: 'sms',
  },
  status: {
    type: String,
    enum: ['pending','scheduled','sent','failed','cancelled','snoozed','completed'],
    default: 'pending',
  },
  attempts:      { type: Number, default: 0 },
  lastAttemptAt: { type: Date },
  nextAttemptAt: { type: Date },
  patientResponse:{ type: String, default: '' },
  optOut:        { type: Boolean, default: false },
  source: {
    type: String,
    enum: ['manual','prescription','appointment','system'],
    default: 'manual',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

reminderSchema.index({ patientId: 1, scheduledTime: 1, status: 1 })

module.exports = mongoose.model('Reminder', reminderSchema)
