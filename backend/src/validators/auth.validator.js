const { body, param, query } = require('express-validator')

const validatePatientRegister = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().isMobilePhone().withMessage('Valid phone number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/).withMessage('Password must contain uppercase, number, and special character'),
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match')
    return true
  }),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date required'),
  body('consentAccepted').custom(value => {
    if (value === true || value === 'true') return true
    throw new Error('Consent is required')
  }),
]

const validateDoctorRegister = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
]

const validateLogin = [
  body('emailOrPhone').trim().notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
]

const validateForgotPassword = [
  body('email').isEmail().withMessage('Valid email is required'),
]

const validateResetPassword = [
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.newPassword) throw new Error('Passwords do not match')
    return true
  }),
]

const validateSendPhoneOtp = [
  body('phone').trim().notEmpty().withMessage('Phone is required')
    .isMobilePhone().withMessage('Valid phone number is required'),
]

const validateConfirmPhoneOtp = [
  body('phone').trim().notEmpty().withMessage('Phone is required')
    .isMobilePhone().withMessage('Valid phone number is required'),
  body('otp').trim().isLength({ min: 4, max: 8 }).withMessage('Valid OTP is required'),
]

module.exports = {
  validatePatientRegister,
  validateDoctorRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateSendPhoneOtp,
  validateConfirmPhoneOtp,
}
