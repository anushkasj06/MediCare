require('dotenv').config()
const app       = require('./app')
const connectDB = require('./config/db')
const logger    = require('./utils/logger')

// Connect to MongoDB then start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000

  const server = app.listen(PORT, () => {
    logger.info(`🏥  Hospital API running on port ${PORT}`)
    logger.info(`📦  Environment : ${process.env.NODE_ENV || 'development'}`)
    logger.info(`🔗  Health check: http://localhost:${PORT}/health`)
  })

  // Start cron jobs after DB connection
  require('./jobs/reminderCron')

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} received – shutting down`)
    server.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`)
  })
})
