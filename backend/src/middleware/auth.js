const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { sendError } = require('../utils/response')

// Verify JWT access token
const authMiddleware = async (req, res, next) => {
  try {
    let token = null

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken
    }

    if (!token) return sendError(res, 401, 'No token provided')

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-passwordHash')

    if (!user)        return sendError(res, 401, 'User not found')
    if (user.isBlocked) return sendError(res, 403, 'Account has been blocked')
    if (!user.isActive) return sendError(res, 403, 'Account is deactivated')

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return sendError(res, 401, 'Token expired')
    return sendError(res, 401, 'Invalid token')
  }
}

// Role-based access control
const roleMiddleware = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return sendError(res, 403, `Access denied. Required role: ${roles.join(' or ')}`)
  }
  next()
}

// Only verified doctors
const doctorVerifiedMiddleware = async (req, res, next) => {
  if (req.user.role !== 'doctor') return next()
  const DoctorProfile = require('../models/DoctorProfile')
  const profile = await DoctorProfile.findOne({ userId: req.user._id })
  if (!profile || profile.verificationStatus !== 'verified') {
    return sendError(res, 403, 'Doctor account not verified yet')
  }
  next()
}

// Owner or admin/doctor with authorization
const ownerOrRoleMiddleware = (...roles) => (req, res, next) => {
  const paramId = req.params.patientId || req.params.userId || req.params.id
  if (
    req.user._id.toString() === paramId ||
    roles.includes(req.user.role)
  ) return next()
  return sendError(res, 403, 'Access denied')
}

module.exports = { authMiddleware, roleMiddleware, doctorVerifiedMiddleware, ownerOrRoleMiddleware }
