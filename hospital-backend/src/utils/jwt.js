const jwt = require('jsonwebtoken')

const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' })

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' })

const signEmailToken = (payload) =>
  jwt.sign(payload, process.env.JWT_EMAIL_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EMAIL_EXPIRY || '1d',
  })

const verifyToken = (token, secret) =>
  jwt.verify(token, secret || process.env.JWT_SECRET)

module.exports = { signAccessToken, signRefreshToken, signEmailToken, verifyToken }
