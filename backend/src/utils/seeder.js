require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://anushkasjadhav1_db_user:anushkasjadhav1_db_user@cluster0.b6poakk.mongodb.net/hospital_db?appName=Cluster0'

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅  Connected to MongoDB')

  const User = require('../models/User')

  // Check if admin exists
  const existing = await User.findOne({ role: 'admin' })
  if (existing) {
    console.log(`ℹ️   Admin already exists: ${existing.email}`)
    await mongoose.disconnect()
    return
  }

  const admin = await User.create({
    fullName:     'Super Admin',
    email:        'admin@hospital.com',
    phone:        '9000000000',
    passwordHash: 'Admin@123456',   // will be hashed by pre-save hook
    role:         'admin',
    isActive:     true,
    emailVerified:true,
    phoneVerified:true,
    consentAccepted: true,
  })

  console.log('🏥  Admin user created:')
  console.log('    Email   :', admin.email)
  console.log('    Password: Admin@123456')
  console.log('    Role    :', admin.role)
  console.log('\n⚠️   CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!\n')

  await mongoose.disconnect()
  console.log('✅  Done')
}

seed().catch(err => {
  console.error('Seed error:', err)
  process.exit(1)
})
