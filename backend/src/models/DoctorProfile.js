const mongoose = require('mongoose')

const availableSlotSchema = new mongoose.Schema({
  dayOfWeek:   { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
  isAvailable: { type: Boolean, default: true },
  startTime:   { type: String },
  endTime:     { type: String },
  slotDuration:{ type: Number, default: 30 }, // minutes
  maxPatients: { type: Number, default: 10 },
  breakStart:  { type: String },
  breakEnd:    { type: String },
}, { _id: false })

const doctorProfileSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true },
  qualifications: [{ type: String }],
  experienceYears:{ type: Number, default: 0 },
  licenseNumber:  { type: String, required: true },
  licenseExpiry:  { type: Date },
  hospitalName:   { type: String, default: '' },
  clinicAddress:  { type: String, default: '' },
  consultationFee:{ type: Number, default: 0 },
  languages:      [{ type: String }],
  about:          { type: String, default: '' },
  servicesOffered:[{ type: String }],
  verificationStatus: { type: String, enum: ['pending','verified','rejected'], default: 'pending' },
  verificationSubmittedAt: { type: Date },
  verificationDate: { type: Date },
  verifiedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String, default: '' },
  ratingAverage:   { type: Number, default: 0 },
  totalReviews:    { type: Number, default: 0 },
  availableSlots:  [availableSlotSchema],
}, { timestamps: true })

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema)
