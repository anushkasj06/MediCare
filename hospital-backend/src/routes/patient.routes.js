const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/patient.controller')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const { validateReminder } = require('../validators/appointment.validator')
const handleValidation     = require('../middleware/validate')

router.use(authMiddleware, roleMiddleware('patient'))

router.get('/dashboard',           ctrl.getDashboard)
router.get('/profile/me',          ctrl.getProfile)
router.put('/profile/me',          ctrl.updateProfile)
router.get('/appointments',        ctrl.getAppointments)
router.get('/prescriptions',       ctrl.getPrescriptions)
router.get('/medical-history',     ctrl.getMedicalHistory)
router.get('/notifications',       ctrl.getNotifications)

router.get('/reminders',           ctrl.getReminders)
router.post('/reminders',          validateReminder, handleValidation, ctrl.createReminder)
router.put('/reminders/:id',       ctrl.updateReminder)
router.delete('/reminders/:id',    ctrl.deleteReminder)

module.exports = router
