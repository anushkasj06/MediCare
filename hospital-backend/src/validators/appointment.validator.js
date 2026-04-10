const { body, param, query } = require('express-validator')

const validateAppointment = [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time HH:MM is required'),
  body('appointmentType').isIn(['in-person','video','phone']).withMessage('Invalid appointment type'),
  body('reasonForVisit').trim().notEmpty().withMessage('Reason for visit is required'),
]

const validateReschedule = [
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time required'),
]

const validateReminder = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['medication','appointment','follow-up','refill','custom']).withMessage('Invalid reminder type'),
  body('scheduledTime').isISO8601().withMessage('Valid scheduled time is required'),
  body('channel').isIn(['sms','call','email','push','whatsapp']).withMessage('Invalid channel'),
]

module.exports = { validateAppointment, validateReschedule, validateReminder }
