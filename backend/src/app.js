require('dotenv').config()
require('express-async-errors')

const express      = require('express')
const cors         = require('cors')
const helmet       = require('helmet')
const morgan       = require('morgan')
const cookieParser = require('cookie-parser')
const rateLimit    = require('express-rate-limit')
const path = require('path')

const { errorHandler, notFound } = require('./middleware/errorHandler')
const logger = require('./utils/logger')

// Route imports
const authRoutes          = require('./routes/auth.routes')
const doctorRoutes        = require('./routes/doctor.routes')
const patientRoutes       = require('./routes/patient.routes')
const appointmentRoutes   = require('./routes/appointment.routes')
const prescriptionRoutes  = require('./routes/prescription.routes')
const medicalHistoryRoutes= require('./routes/medicalHistory.routes')
const reminderRoutes      = require('./routes/reminder.routes')
const adminRoutes         = require('./routes/admin.routes')
const chatbotRoutes       = require('./routes/chatbot.routes')
const automationRoutes    = require('./routes/automation.routes')

const app = express()

const DEFAULT_PROD_FRONTEND_URL = 'https://medicare-phi-two.vercel.app'

const configuredOrigins = (process.env.FRONTEND_URL || DEFAULT_PROD_FRONTEND_URL)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const allowedOrigins = Array.from(new Set([
  ...configuredOrigins,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
]))

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
}))
app.options('*', cors())

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_MAX       || '100'),
  message:  { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders:   false,
})
app.use('/api/', limiter)

// Stricter limiter for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts' },
})
app.use('/api/auth/', authLimiter)

// ─── Parsers ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: msg => logger.info(msg.trim()) },
  }))
}

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Hospital API is running', timestamp: new Date().toISOString() })
})

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OK', env: process.env.NODE_ENV })
})

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes)
app.use('/api/doctors',        doctorRoutes)
app.use('/api/patients',       patientRoutes)
app.use('/api/appointments',   appointmentRoutes)
app.use('/api/prescriptions',  prescriptionRoutes)
app.use('/api/medical-history',medicalHistoryRoutes)
app.use('/api/reminders',      reminderRoutes)
app.use('/api/admin',          adminRoutes)
app.use('/api/chatbot',        chatbotRoutes)
app.use('/api/automation',     automationRoutes)

// ─── 404 & Error handler ─────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

module.exports = app
