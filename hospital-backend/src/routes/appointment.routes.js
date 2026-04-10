const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/appointment.controller')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const { validateAppointment, validateReschedule } = require('../validators/appointment.validator')
const handleValidation = require('../middleware/validate')

router.use(authMiddleware)

// Public-ish (auth required)
router.get('/check-availability',  ctrl.checkAvailability)
router.get('/available-slots',     ctrl.checkAvailability)

// Patient creates appointment
router.post('/',  roleMiddleware('patient'), validateAppointment, handleValidation, ctrl.createAppointment)

router.get('/:appointmentId',    ctrl.getAppointment)
router.put('/:appointmentId',    roleMiddleware('patient'), ctrl.updateAppointment)
router.delete('/:appointmentId', roleMiddleware('patient'), ctrl.cancelAppointment)

router.post('/:appointmentId/confirm',    roleMiddleware('doctor'), ctrl.confirmAppointment)
router.post('/:appointmentId/reschedule', validateReschedule, handleValidation, ctrl.rescheduleAppointment)

module.exports = router
