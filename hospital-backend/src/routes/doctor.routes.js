const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/doctor.controller')
const { authMiddleware, roleMiddleware, doctorVerifiedMiddleware } = require('../middleware/auth')
const { uploadDoctorDocs } = require('../config/cloudinary')

// Public routes
router.get('/',                       ctrl.getDoctors)
router.get('/available-slots',        ctrl.getAvailableSlots)
router.get('/availability/:doctorId', ctrl.getDoctorAvailability)
// Doctor auth routes
router.use(authMiddleware, roleMiddleware('doctor'))

router.get('/profile/me',    ctrl.getMyProfile)
router.put('/profile/me',    ctrl.updateMyProfile)
router.put('/availability',  ctrl.updateAvailability)

router.get('/appointments',                              doctorVerifiedMiddleware, ctrl.getDoctorAppointments)
router.patch('/appointments/:appointmentId/status',      doctorVerifiedMiddleware, ctrl.updateAppointmentStatus)

router.get('/verify/status', ctrl.getVerificationStatus)
router.post('/verify/submit',
  uploadDoctorDocs.fields([
    { name: 'medicalLicenseFile',      maxCount: 1  },
    { name: 'degreeCertificateFiles',  maxCount: 5  },
    { name: 'governmentIdFile',        maxCount: 1  },
    { name: 'profilePhoto',            maxCount: 1  },
  ]),
  ctrl.submitVerification
)

router.get('/patients/:patientId', doctorVerifiedMiddleware, ctrl.getPatientDetails)

router.get('/:doctorId', ctrl.getDoctorById)

module.exports = router
