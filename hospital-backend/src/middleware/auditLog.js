const { AuditLog } = require('../models/index')

const auditLog = (action, resourceType) => async (req, res, next) => {
  const originalJson = res.json.bind(res)
  res.json = function (body) {
    if (body?.success && req.user) {
      AuditLog.create({
        actorId:      req.user._id,
        actorRole:    req.user.role,
        action,
        resourceType,
        resourceId:   req.params?.id || body?.data?._id,
        metadata:     { method: req.method, url: req.originalUrl },
        ipAddress:    req.ip,
        userAgent:    req.headers['user-agent'],
      }).catch(() => {}) // fire and forget
    }
    return originalJson(body)
  }
  next()
}

module.exports = auditLog
