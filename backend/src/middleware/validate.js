const { validationResult } = require('express-validator')
const { sendError } = require('../utils/response')

const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(e => ({ field: e.path, message: e.msg }))
    return sendError(res, 400, 'Validation failed', formatted)
  }
  next()
}

module.exports = handleValidation
