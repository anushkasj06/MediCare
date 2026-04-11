const nodemailer = require('nodemailer')
const logger = require('./logger')

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from:    process.env.EMAIL_FROM || '"Hospital App" <no-reply@hospital.com>',
      to,
      subject,
      html,
      text,
    })
    logger.info(`Email sent to ${to}: ${info.messageId}`)
    return info
  } catch (err) {
    logger.error(`Email send error: ${err.message}`)
    throw err
  }
}

const emailTemplates = {
  verifyEmail: (name, link) => ({
    subject: 'Verify your email – Hospital App',
    html: `<h2>Hi ${name},</h2><p>Please verify your email by clicking the link below:</p>
           <a href="${link}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Verify Email</a>
           <p>This link expires in 24 hours.</p>`,
  }),
  resetPassword: (name, link) => ({
    subject: 'Reset your password – Hospital App',
    html: `<h2>Hi ${name},</h2><p>Click the link below to reset your password:</p>
           <a href="${link}" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a>
           <p>This link expires in 1 hour.</p>`,
  }),
  doctorVerified: (name) => ({
    subject: 'Your doctor account has been verified – Hospital App',
    html: `<h2>Congratulations Dr. ${name}!</h2>
           <p>Your account has been verified. You can now start accepting appointments.</p>`,
  }),
  doctorRejected: (name, reason) => ({
    subject: 'Doctor verification update – Hospital App',
    html: `<h2>Hi Dr. ${name},</h2>
           <p>Unfortunately your verification was not approved.</p>
           <p><strong>Reason:</strong> ${reason}</p>
           <p>Please re-submit the required documents.</p>`,
  }),
  appointmentConfirmed: (patientName, doctorName, date, time) => ({
    subject: 'Appointment Confirmed – Hospital App',
    html: `<h2>Hi ${patientName},</h2>
           <p>Your appointment with <strong>Dr. ${doctorName}</strong> is confirmed.</p>
           <p><strong>Date:</strong> ${date}<br><strong>Time:</strong> ${time}</p>`,
  }),
  appointmentCancelled: (patientName, doctorName, date) => ({
    subject: 'Appointment Cancelled – Hospital App',
    html: `<h2>Hi ${patientName},</h2>
           <p>Your appointment with <strong>Dr. ${doctorName}</strong> on <strong>${date}</strong> has been cancelled.</p>`,
  }),
}

module.exports = { sendEmail, emailTemplates }
