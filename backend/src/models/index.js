const mongoose = require('mongoose')

// Notification Log
const notificationLogSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:             { type: String, enum: ['sms','call','email','push','in-app'], required: true },
  title:            { type: String },
  body:             { type: String },
  provider:         { type: String, enum: ['twilio','system','email'], default: 'system' },
  providerMessageId:{ type: String },
  status:           { type: String, enum: ['sent','delivered','failed','pending'], default: 'pending' },
  sentAt:           { type: Date },
  deliveredAt:      { type: Date },
  failedAt:         { type: Date },
  errorMessage:     { type: String },
  metadata:         { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

// Chat Log
const chatLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  query:     { type: String, required: true },
  response:  { type: String },
  intent:    { type: String },
  confidence:{ type: Number },
  context:   { type: mongoose.Schema.Types.Mixed },
  rating:    { type: Number, min: 1, max: 5 },
  feedback:  { type: String },
}, { timestamps: true })

// Audit Log
const auditLogSchema = new mongoose.Schema({
  actorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole:    { type: String },
  action:       { type: String, required: true },
  resourceType: { type: String },
  resourceId:   { type: mongoose.Schema.Types.ObjectId },
  metadata:     { type: mongoose.Schema.Types.Mixed },
  ipAddress:    { type: String },
  userAgent:    { type: String },
}, { timestamps: true })

// Refresh Token
const refreshTokenSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:     { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revoked:   { type: Boolean, default: false },
}, { timestamps: true })

module.exports = {
  NotificationLog: mongoose.model('NotificationLog', notificationLogSchema),
  ChatLog:         mongoose.model('ChatLog', chatLogSchema),
  AuditLog:        mongoose.model('AuditLog', auditLogSchema),
  RefreshToken:    mongoose.model('RefreshToken', refreshTokenSchema),
}
