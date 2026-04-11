const logger = require('./logger')

let cachedClient = null

const isTwilioConfigured = () => {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  )
}

const getTwilioClient = () => {
  if (!isTwilioConfigured()) return null

  if (!cachedClient) {
    const twilio = require('twilio')
    cachedClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  }

  return cachedClient
}

const normalizePhone = (phone = '') => {
  if (!phone || typeof phone !== 'string') return ''

  const trimmed = phone.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('+')) return trimmed

  const digits = trimmed.replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

const normalizeTwilioStatus = (status = '') => {
  const value = String(status || '').toLowerCase()

  if (!value) return 'pending'

  if (['queued', 'accepted', 'scheduled', 'sending', 'ringing', 'initiated', 'in-progress'].includes(value)) {
    return 'pending'
  }

  if (['sent', 'delivered', 'read', 'completed', 'answered'].includes(value)) {
    return 'delivered'
  }

  if (['failed', 'undelivered', 'busy', 'no-answer', 'canceled'].includes(value)) {
    return 'failed'
  }

  return 'pending'
}

const sendSms = async ({ to, message, statusCallbackUrl } = {}) => {
  const formattedTo = normalizePhone(to)
  const body = String(message || '').trim()

  if (!formattedTo) throw new Error('Phone number is required for SMS')
  if (!body) throw new Error('Message body is required for SMS')

  const client = getTwilioClient()
  if (!client) {
    logger.info(`[TWILIO MOCK][SMS] to=${formattedTo} message=${body}`)
    return {
      sid: `MOCK_SMS_${Date.now()}`,
      status: 'sent',
      provider: 'system',
      isMock: true,
      channel: 'sms',
    }
  }

  const payload = {
    to: formattedTo,
    from: process.env.TWILIO_PHONE_NUMBER,
    body,
  }

  if (statusCallbackUrl) payload.statusCallback = statusCallbackUrl

  const result = await client.messages.create(payload)

  return {
    sid: result.sid,
    status: result.status,
    provider: 'twilio',
    isMock: false,
    channel: 'sms',
  }
}

const makeVoiceCall = async ({ to, twimlUrl, statusCallbackUrl } = {}) => {
  const formattedTo = normalizePhone(to)

  if (!formattedTo) throw new Error('Phone number is required for voice call')
  if (!twimlUrl) throw new Error('TwiML URL is required for voice call')

  const client = getTwilioClient()
  if (!client) {
    logger.info(`[TWILIO MOCK][CALL] to=${formattedTo} twimlUrl=${twimlUrl}`)
    return {
      sid: `MOCK_CALL_${Date.now()}`,
      status: 'completed',
      provider: 'system',
      isMock: true,
      channel: 'call',
    }
  }

  const payload = {
    to: formattedTo,
    from: process.env.TWILIO_PHONE_NUMBER,
    url: twimlUrl,
    method: 'POST',
  }

  if (statusCallbackUrl) {
    payload.statusCallback = statusCallbackUrl
    payload.statusCallbackMethod = 'POST'
    payload.statusCallbackEvent = ['initiated', 'ringing', 'answered', 'completed']
  }

  const result = await client.calls.create(payload)

  return {
    sid: result.sid,
    status: result.status,
    provider: 'twilio',
    isMock: false,
    channel: 'call',
  }
}

const sendOtp = async (phone, code, statusCallbackUrl) => {
  const message = `Your Medicare verification code is ${code}. It expires in 10 minutes.`
  return sendSms({ to: phone, message, statusCallbackUrl })
}

module.exports = {
  isTwilioConfigured,
  getTwilioClient,
  normalizePhone,
  normalizeTwilioStatus,
  sendSms,
  makeVoiceCall,
  sendOtp,
}
