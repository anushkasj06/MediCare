const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/chatbot.controller')
const { authMiddleware } = require('../middleware/auth')

router.get('/faq',              ctrl.getFaq)
router.post('/session',         ctrl.createSession)
router.post('/query',           authMiddleware, ctrl.query)
router.get('/session/:id',      authMiddleware, ctrl.getSession)
router.post('/feedback',        authMiddleware, ctrl.submitFeedback)

module.exports = router
