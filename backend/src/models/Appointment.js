const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
  patientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, required: true },
  endTime:         { type: String },
  durationMinutes: { type: Number, default: 30 },
  status: {
    type: String,
    enum: ['pending','confirmed','completed','cancelled','rejected','no-show'],
    default: 'pending',
  },
  appointmentType: { type: String, enum: ['in-person','video','phone'], default: 'in-person' },
  reasonForVisit:  { type: String, required: true },
  symptoms:        [{ type: String }],
  patientNotes:    { type: String, default: '' },
  doctorNotes:     { type: String, default: '' },
  bookedBy:        { type: String, enum: ['self','admin'], default: 'self' },
  confirmedAt:     { type: Date },
  cancelledAt:     { type: Date },
  cancellationReason: { type: String, default: '' },
  rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  reminderStatus: {
    before24h: { type: Boolean, default: false },
    before2h:  { type: Boolean, default: false },
  },
}, { timestamps: true })

appointmentSchema.index({ doctorId: 1, appointmentDate: 1, appointmentTime: 1 })
appointmentSchema.index({ patientId: 1, status: 1 })

module.exports = mongoose.model('Appointment', appointmentSchema)
