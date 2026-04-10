const { v4: uuidv4 } = require('uuid')
const { ChatLog } = require('../models/index')
const { sendSuccess, sendError } = require('../utils/response')

const faqData = [
  { q: 'How do I book an appointment?', a: 'Go to Book Appointment, search for a doctor, select a date and time slot, fill in your reason, and confirm.' },
  { q: 'How can I view my prescriptions?', a: 'Navigate to the Prescriptions section in your patient dashboard to view all prescriptions uploaded by your doctor.' },
  { q: 'How do I cancel an appointment?', a: 'Go to My Appointments, find the appointment you want to cancel, and click the Cancel button.' },
  { q: 'Can I reschedule an appointment?', a: 'Yes! Go to My Appointments, click on the appointment, and select Reschedule to pick a new date and time.' },
  { q: 'How do I set medication reminders?', a: 'Go to Reminders in your dashboard and create a new reminder with the medicine name, time, and frequency.' },
  { q: 'How do I view my medical history?', a: 'Go to Medical History in your patient dashboard to see all your past consultations and records.' },
  { q: 'What should I do if I forget my password?', a: 'Click on Forgot Password on the login page, enter your email, and follow the reset link sent to your inbox.' },
  { q: 'How do I update my profile?', a: 'Go to My Profile in your dashboard and click Edit to update your information.' },
]

// Simple intent detection
const detectIntent = (message) => {
  const m = message.toLowerCase()
  if (m.includes('book') || m.includes('appointment')) return 'book_appointment'
  if (m.includes('cancel'))      return 'cancel_appointment'
  if (m.includes('reschedule'))  return 'reschedule_appointment'
  if (m.includes('prescription') || m.includes('medicine')) return 'prescription'
  if (m.includes('remind'))      return 'reminder'
  if (m.includes('history') || m.includes('record'))  return 'medical_history'
  if (m.includes('password'))    return 'password'
  if (m.includes('profile'))     return 'profile'
  if (m.includes('doctor'))      return 'find_doctor'
  return 'general'
}

const intentResponses = {
  book_appointment:    'To book an appointment: go to Book Appointment → search for your doctor → pick an available slot → fill in reason → confirm.',
  cancel_appointment:  'To cancel: go to My Appointments → find your appointment → click Cancel.',
  reschedule_appointment: 'To reschedule: go to My Appointments → click on your appointment → select Reschedule.',
  prescription:        'Your prescriptions are in the Prescriptions section of your dashboard. Your doctor uploads them after consultation.',
  reminder:            'You can set reminders in the Reminders section. You can get notified via SMS, call, or push notification.',
  medical_history:     'Your complete medical history is in the Medical History section, including diagnoses, prescriptions, and lab reports.',
  password:            'Use Forgot Password on the login page. A reset link will be sent to your registered email.',
  profile:             'Update your profile from the My Profile section in your dashboard.',
  find_doctor:         'Use the Doctors page to search by specialization, city, or hospital. You can filter by availability, fees, and ratings.',
  general:             'I can help you with booking appointments, viewing prescriptions, medical history, reminders, and more. What do you need help with?',
}

// POST /api/chatbot/session
exports.createSession = async (req, res) => {
  const sessionId = uuidv4()
  sendSuccess(res, 201, 'Session created', { sessionId })
}

// POST /api/chatbot/query
exports.query = async (req, res) => {
  const { sessionId, message } = req.body
  if (!message) return sendError(res, 400, 'Message is required')

  const intent   = detectIntent(message)
  const response = intentResponses[intent] || intentResponses.general
  const confidence = 0.8

  // Check FAQ for better match
  const msgLower = message.toLowerCase()
  const faqMatch = faqData.find(f => {
    const words = f.q.toLowerCase().split(' ').filter(w => w.length > 3)
    return words.some(w => msgLower.includes(w))
  })

  const finalResponse = faqMatch ? faqMatch.a : response

  // Save to chat log
  if (req.user) {
    await ChatLog.create({
      userId: req.user._id,
      sessionId: sessionId || 'anonymous',
      query: message,
      response: finalResponse,
      intent, confidence,
    })
  }

  sendSuccess(res, 200, 'Chatbot response', {
    sessionId,
    message:  finalResponse,
    intent,
    confidence,
    suggestions: ['Book Appointment', 'View Prescriptions', 'Medical History', 'Set Reminder'],
  })
}

// GET /api/chatbot/session/:id
exports.getSession = async (req, res) => {
  const logs = await ChatLog.find({ sessionId: req.params.id, userId: req.user._id }).sort({ createdAt: 1 })
  sendSuccess(res, 200, 'Session history', logs)
}

// POST /api/chatbot/feedback
exports.submitFeedback = async (req, res) => {
  const { sessionId, rating, feedback } = req.body
  await ChatLog.updateMany({ sessionId, userId: req.user._id }, { rating, feedback })
  sendSuccess(res, 200, 'Feedback saved')
}

// GET /api/chatbot/faq
exports.getFaq = async (req, res) => {
  sendSuccess(res, 200, 'FAQ', faqData)
}
