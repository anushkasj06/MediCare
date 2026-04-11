const mongoose = require('mongoose')

const doctorDocumentSchema = new mongoose.Schema({
  doctorId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentType:    { type: String, enum: ['license','degree','idProof','profilePhoto','other'], required: true },
  fileUrl:         { type: String, required: true },
  fileName:        { type: String },
  fileType:        { type: String },
  fileSize:        { type: Number },
  uploadedAt:      { type: Date, default: Date.now },
  verificationNote:{ type: String, default: '' },
  status:          { type: String, enum: ['submitted','approved','rejected'], default: 'submitted' },
}, { timestamps: true })

module.exports = mongoose.model('DoctorDocument', doctorDocumentSchema)
