const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/auth.controller')
const { authMiddleware } = require('../middleware/auth')
const {
  validatePatientRegister,
  validateDoctorRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateSendPhoneOtp,
  validateConfirmPhoneOtp,
} = require('../validators/auth.validator')
const handleValidation = require('../middleware/validate')

router.post('/register/patient', validatePatientRegister, handleValidation, ctrl.registerPatient)
router.post('/register/doctor',  validateDoctorRegister,  handleValidation, ctrl.registerDoctor)
router.post('/login',            validateLogin,           handleValidation, ctrl.login)
router.post('/refresh-token',    ctrl.refreshToken)
router.post('/logout',           ctrl.logout)
router.post('/forgot-password',  validateForgotPassword,  handleValidation, ctrl.forgotPassword)
router.post('/reset-password/:token', validateResetPassword, handleValidation, ctrl.resetPassword)
router.post('/change-password',  authMiddleware, ctrl.changePassword)
router.get('/verify-email/:token', ctrl.verifyEmail)
router.post('/verify-phone/send-otp', validateSendPhoneOtp, handleValidation, ctrl.sendPhoneOtp)
router.post('/verify-phone/confirm-otp', validateConfirmPhoneOtp, handleValidation, ctrl.confirmPhoneOtp)
router.get('/me', authMiddleware, ctrl.getMe)

module.exports = router
