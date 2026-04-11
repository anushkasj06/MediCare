const crypto = require('crypto')

// Generate numeric OTP
const generateOtp = (length = 6) => {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}

// Generate available time slots for a day
const generateSlots = (startTime, endTime, durationMinutes, breakStart, breakEnd) => {
  const slots = []
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const toTimeStr = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0')
    const m = (mins % 60).toString().padStart(2, '0')
    return `${h}:${m}`
  }

  let current = toMinutes(startTime)
  const end = toMinutes(endTime)
  const bStart = breakStart ? toMinutes(breakStart) : null
  const bEnd   = breakEnd   ? toMinutes(breakEnd)   : null

  while (current + durationMinutes <= end) {
    if (bStart && bEnd && current >= bStart && current < bEnd) {
      current = bEnd
      continue
    }
    slots.push(toTimeStr(current))
    current += durationMinutes
  }
  return slots
}

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// Get day of week name from date
const getDayOfWeek = (date) => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  return days[new Date(date).getDay()]
}

// Paginate helper
const paginate = (query, page = 1, limit = 10) => {
  const skip = (parseInt(page) - 1) * parseInt(limit)
  return { skip, limit: parseInt(limit) }
}

module.exports = { generateOtp, generateSlots, formatDate, getDayOfWeek, paginate }
