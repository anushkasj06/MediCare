const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/reminder.controller')
const { authMiddleware } = require('../middleware/auth')
const { validateReminder } = require('../validators/appointment.validator')
const handleValidation     = require('../middleware/validate')

router.use(authMiddleware)

router.get('/',          ctrl.getReminders)
router.post('/',         validateReminder, handleValidation, ctrl.createReminder)
router.put('/:id',       ctrl.updateReminder)
router.delete('/:id',    ctrl.deleteReminder)
router.post('/:id/snooze', ctrl.snoozeReminder)

module.exports = router
