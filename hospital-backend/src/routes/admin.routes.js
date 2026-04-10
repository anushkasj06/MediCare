const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/admin.controller')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')

router.use(authMiddleware, roleMiddleware('admin'))

router.get('/stats',                    ctrl.getStats)

router.get('/users',                    ctrl.getUsers)
router.get('/users/:id',                ctrl.getUserById)
router.post('/users/:id/block',         ctrl.blockUser)
router.post('/users/:id/unblock',       ctrl.unblockUser)

router.get('/doctors/pending',          ctrl.getPendingDoctors)
router.post('/doctors/:id/verify',      ctrl.verifyDoctor)
router.post('/doctors/:id/reject',      ctrl.rejectDoctor)

router.get('/reports/appointments',     ctrl.getAppointmentsReport)
router.get('/reports/users',            ctrl.getUsersReport)

router.get('/logs',                     ctrl.getLogs)

router.get('/settings',                 ctrl.getSettings)
router.put('/settings',                 ctrl.updateSettings)

module.exports = router
