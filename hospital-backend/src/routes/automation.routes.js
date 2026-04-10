const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/automation.controller')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')

// n8n calls these (secured by API key in production, open for now)
router.get('/due-reminders',      ctrl.getDueReminders)
router.post('/reminder-status',   ctrl.updateReminderStatus)

// Twilio voice webhooks (no auth – Twilio calls these)
router.get('/twiml/reminder',     ctrl.getVoiceTwiml)
router.post('/twiml/reminder',    ctrl.getVoiceTwiml)
router.post('/twiml/gather',      ctrl.handleGather)

// Admin only
router.get('/workflow-status',    authMiddleware, roleMiddleware('admin'), ctrl.getWorkflowStatus)

module.exports = router
