const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads')
const ensureUploadDir = (folder) => {
  const dir = path.join(uploadsRoot, folder)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

const createDiskStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureUploadDir(folder)),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, name)
  },
})

// Doctor document uploads
const doctorDocStorage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'hospital/doctor-documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto',
      },
    })
  : createDiskStorage('doctor-documents')

// Prescription uploads
const prescriptionStorage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'hospital/prescriptions',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto',
      },
    })
  : createDiskStorage('prescriptions')

// Lab report uploads
const labReportStorage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'hospital/lab-reports',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto',
      },
    })
  : createDiskStorage('lab-reports')

// Profile photo uploads
const profilePhotoStorage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'hospital/profile-photos',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 500, height: 500, crop: 'fill' }],
      },
    })
  : createDiskStorage('profile-photos')

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed'), false)
  }
}

const uploadDoctorDocs  = multer({ storage: doctorDocStorage,    fileFilter, limits: { fileSize: 10 * 1024 * 1024 } })
const uploadPrescription = multer({ storage: prescriptionStorage,  fileFilter, limits: { fileSize: 10 * 1024 * 1024 } })
const uploadLabReport    = multer({ storage: labReportStorage,     fileFilter, limits: { fileSize: 10 * 1024 * 1024 } })
const uploadProfilePhoto = multer({ storage: profilePhotoStorage,  fileFilter, limits: { fileSize: 5  * 1024 * 1024 } })

const buildUploadedFileUrl = (req, file) => {
  if (!file) return ''
  if (hasCloudinaryConfig) return file.path
  return `${req.protocol}://${req.get('host')}/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`
}

module.exports = {
  cloudinary,
  hasCloudinaryConfig,
  uploadDoctorDocs,
  uploadPrescription,
  uploadLabReport,
  uploadProfilePhoto,
  buildUploadedFileUrl,
}
