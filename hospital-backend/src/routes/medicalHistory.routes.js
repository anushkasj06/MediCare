const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/medicalHistory.controller')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const { uploadLabReport } = require('../config/cloudinary')

router.use(authMiddleware)

// Doctor adds / updates records
router.post('/',
  roleMiddleware('doctor'),
  uploadLabReport.fields([{ name: 'labReports', maxCount: 10 }]),
  ctrl.addRecord
)
router.put('/:id', roleMiddleware('doctor'), ctrl.updateRecord)

// Shared access (patient sees own, doctor sees linked patients, admin sees all)
router.get('/record/:id',              ctrl.getRecord)
router.get('/:patientId/timeline',     ctrl.getTimeline)
router.get('/:patientId/conditions',   ctrl.getConditions)
router.get('/:id/export',              ctrl.exportRecord)
router.get('/:patientId',              ctrl.getPatientHistory)

module.exports = router
