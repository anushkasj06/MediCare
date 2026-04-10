const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  fullName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role:      { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
  profilePicture: { type: String, default: null },
  dateOfBirth: { type: Date },
  gender:    { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  bloodGroup: { type: String, default: '' },
  address: {
    street:  { type: String, default: '' },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  emergencyContact: {
    name:         { type: String, default: '' },
    phone:        { type: String, default: '' },
    relationship: { type: String, default: '' },
  },
  allergies:          [{ type: String }],
  chronicConditions:  [{ type: String }],
  emailVerified:  { type: Boolean, default: false },
  phoneVerified:  { type: Boolean, default: false },
  isActive:       { type: Boolean, default: true },
  isBlocked:      { type: Boolean, default: false },
  lastLogin:      { type: Date },
  consentAccepted:{ type: Boolean, default: false },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  next()
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  return obj
}

module.exports = mongoose.model('User', userSchema)
