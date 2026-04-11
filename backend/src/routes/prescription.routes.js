const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/prescription.controller')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const { uploadPrescription } = require('../config/cloudinary')

router.use(authMiddleware)

// Doctor uploads prescription
router.post('/upload',
  roleMiddleware('doctor'),
  uploadPrescription.single('prescriptionFile'),
  ctrl.uploadPrescription
)

// Patient or doctor views
router.get('/patient/:patientId', ctrl.getPatientPrescriptions)
router.get('/doctor/:doctorId',   ctrl.getDoctorPrescriptions)
router.get('/:id',                ctrl.getPrescription)
router.delete('/:id',             roleMiddleware('doctor'), ctrl.deletePrescription)
router.post('/:id/share',         roleMiddleware('patient'), ctrl.sharePrescription)
router.get('/:id/download',       ctrl.downloadPrescription)

module.exports = router
