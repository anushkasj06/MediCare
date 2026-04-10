const crypto = require('crypto')
const User = require('../models/User')
const DoctorProfile = require('../models/DoctorProfile')
const { RefreshToken } = require('../models/index')
const { signAccessToken, signRefreshToken, signEmailToken, verifyToken } = require('../utils/jwt')
const { sendEmail, emailTemplates } = require('../utils/email')
const { generateOtp } = require('../utils/helpers')
const { sendSuccess, sendError } = require('../utils/response')

// OTP store (in production use Redis)
const otpStore = new Map()

// POST /api/auth/register/patient
exports.registerPatient = async (req, res) => {
  const {
    fullName, email, phone, password, dateOfBirth, gender,
    address, emergencyContact, allergies, chronicConditions, consentAccepted,
  } = req.body

  const existing = await User.findOne({ $or: [{ email }, { phone }] })
  if (existing) {
    const field = existing.email === email ? 'email' : 'phone'
    return sendError(res, 409, `${field} already registered`, [{ field, message: 'Already in use' }])
  }

  const user = await User.create({
    fullName, email, phone,
    passwordHash: password,
    role: 'patient',
    dateOfBirth, gender,
    address: address || {},
    emergencyContact: emergencyContact || {},
    allergies: allergies || [],
    chronicConditions: chronicConditions || [],
    consentAccepted: consentAccepted === true || consentAccepted === 'true',
  })

  // Send verification email
  const emailToken = signEmailToken({ id: user._id, purpose: 'verify-email' })
  const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailToken}`
  try {
    const tmpl = emailTemplates.verifyEmail(user.fullName, verifyLink)
    await sendEmail({ to: user.email, ...tmpl })
  } catch (_) {}

  const accessToken  = signAccessToken(user._id)
  const refreshToken = signRefreshToken(user._id)
  await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 7*24*60*60*1000) })

  sendSuccess(res, 201, 'Patient registered successfully', {
    user: user.toSafeObject(),
    token: accessToken,
    refreshToken,
  })
}

// POST /api/auth/register/doctor
exports.registerDoctor = async (req, res) => {
  const {
    fullName, email, phone, password,
    specialization, qualifications, experienceYears, licenseNumber, licenseExpiry,
    hospitalName, consultationFee, languages, about, clinicAddress,
  } = req.body

  const existing = await User.findOne({ $or: [{ email }, { phone }] })
  if (existing) {
    const field = existing.email === email ? 'email' : 'phone'
    return sendError(res, 409, `${field} already registered`, [{ field, message: 'Already in use' }])
  }

  const user = await User.create({
    fullName, email, phone,
    passwordHash: password,
    role: 'doctor',
    consentAccepted: true,
  })

  await DoctorProfile.create({
    userId: user._id,
    specialization,
    qualifications: qualifications || [],
    experienceYears: experienceYears || 0,
    licenseNumber,
    licenseExpiry,
    hospitalName:   hospitalName || '',
    clinicAddress:  clinicAddress || '',
    consultationFee: consultationFee || 0,
    languages:  languages || [],
    about:      about || '',
    verificationStatus: 'pending',
    verificationSubmittedAt: new Date(),
  })

  const accessToken  = signAccessToken(user._id)
  const refreshToken = signRefreshToken(user._id)
  await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 7*24*60*60*1000) })

  sendSuccess(res, 201, 'Doctor registered. Pending admin verification.', {
    user: user.toSafeObject(),
    token: accessToken,
    refreshToken,
  })
}

// POST /api/auth/login
exports.login = async (req, res) => {
  const { emailOrPhone, password } = req.body

  const user = await User.findOne({
    $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
  })

  if (!user)                       return sendError(res, 401, 'Invalid credentials')
  if (user.isBlocked)              return sendError(res, 403, 'Account has been blocked')
  if (!user.isActive)              return sendError(res, 403, 'Account is deactivated')

  const isMatch = await user.comparePassword(password)
  if (!isMatch)                    return sendError(res, 401, 'Invalid credentials')

  user.lastLogin = new Date()
  await user.save()

  const accessToken  = signAccessToken(user._id)
  const refreshToken = signRefreshToken(user._id)

  await RefreshToken.deleteMany({ userId: user._id })
  await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 7*24*60*60*1000) })

  // Attach doctor profile if doctor
  let doctorProfile = null
  if (user.role === 'doctor') {
    doctorProfile = await DoctorProfile.findOne({ userId: user._id })
  }

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000,
    sameSite: 'strict',
  })

  sendSuccess(res, 200, 'Login successful', {
    user: user.toSafeObject(),
    token: accessToken,
    refreshToken,
    doctorProfile,
  })
}

// POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return sendError(res, 400, 'Refresh token required')

  const stored = await RefreshToken.findOne({ token: refreshToken, revoked: false })
  if (!stored || stored.expiresAt < new Date()) return sendError(res, 401, 'Invalid or expired refresh token')

  const decoded     = verifyToken(refreshToken)
  const accessToken = signAccessToken(decoded.id)
  const newRefresh  = signRefreshToken(decoded.id)

  stored.revoked = true
  await stored.save()
  await RefreshToken.create({ userId: decoded.id, token: newRefresh, expiresAt: new Date(Date.now() + 7*24*60*60*1000) })

  sendSuccess(res, 200, 'Token refreshed', { token: accessToken, refreshToken: newRefresh })
}

// POST /api/auth/logout
exports.logout = async (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    await RefreshToken.deleteMany({ token: refreshToken })
  }
  res.clearCookie('accessToken')
  sendSuccess(res, 200, 'Logged out successfully')
}

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })
  // Always return success to prevent email enumeration
  if (user) {
    const token = signEmailToken({ id: user._id, purpose: 'reset-password' })
    const link  = `${process.env.FRONTEND_URL}/reset-password/${token}`
    try {
      const tmpl = emailTemplates.resetPassword(user.fullName, link)
      await sendEmail({ to: user.email, ...tmpl })
    } catch (_) {}
  }
  sendSuccess(res, 200, 'If the email exists, a reset link has been sent')
}

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  const { token } = req.params
  const { newPassword } = req.body

  let decoded
  try {
    decoded = verifyToken(token, process.env.JWT_EMAIL_SECRET || process.env.JWT_SECRET)
  } catch {
    return sendError(res, 400, 'Invalid or expired reset token')
  }

  if (decoded.purpose !== 'reset-password') return sendError(res, 400, 'Invalid token purpose')

  const user = await User.findById(decoded.id)
  if (!user) return sendError(res, 404, 'User not found')

  user.passwordHash = newPassword
  await user.save()

  sendSuccess(res, 200, 'Password reset successfully')
}

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user._id)

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) return sendError(res, 400, 'Current password is incorrect')

  user.passwordHash = newPassword
  await user.save()

  sendSuccess(res, 200, 'Password changed successfully')
}

// GET /api/auth/verify-email/:token
exports.verifyEmail = async (req, res) => {
  const { token } = req.params
  let decoded
  try {
    decoded = verifyToken(token, process.env.JWT_EMAIL_SECRET || process.env.JWT_SECRET)
  } catch {
    return sendError(res, 400, 'Invalid or expired verification token')
  }

  if (decoded.purpose !== 'verify-email') return sendError(res, 400, 'Invalid token')

  const user = await User.findByIdAndUpdate(decoded.id, { emailVerified: true }, { new: true })
  if (!user) return sendError(res, 404, 'User not found')

  sendSuccess(res, 200, 'Email verified successfully')
}

// POST /api/auth/verify-phone/send-otp
exports.sendPhoneOtp = async (req, res) => {
  const { phone } = req.body
  const otp = generateOtp(6)
  otpStore.set(phone, { otp, expires: Date.now() + 10 * 60 * 1000 })

  // In production, send via Twilio
  console.log(`OTP for ${phone}: ${otp}`) // dev only

  sendSuccess(res, 200, 'OTP sent successfully')
}

// POST /api/auth/verify-phone/confirm-otp
exports.confirmPhoneOtp = async (req, res) => {
  const { phone, otp } = req.body
  const stored = otpStore.get(phone)

  if (!stored || stored.expires < Date.now()) return sendError(res, 400, 'OTP expired')
  if (stored.otp !== otp) return sendError(res, 400, 'Invalid OTP')

  otpStore.delete(phone)
  await User.findOneAndUpdate({ phone }, { phoneVerified: true })

  sendSuccess(res, 200, 'Phone verified successfully')
}

// GET /api/auth/me
exports.getMe = async (req, res) => {
  let extra = {}
  if (req.user.role === 'doctor') {
    extra.doctorProfile = await DoctorProfile.findOne({ userId: req.user._id })
  }
  sendSuccess(res, 200, 'Current user', { user: req.user.toSafeObject(), ...extra })
}
