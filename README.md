# Hospital Appointment & Prescription Management System Blueprint

## 1. Project Overview

This document is a complete implementation blueprint for a **Hospital Appointment Booking and Smart Follow-Up System**.

### Core features

* Patient registration, login, profile, and medical record access
* Doctor registration, profile management, document upload, and verification workflow
* Appointment booking, slot checking, confirmation, rescheduling, cancellation
* Prescription upload by doctor into patient account
* Centralized medical history in one place
* Reminder engine for medication doses, appointment reminders, and follow-up calls/messages
* AI-assisted follow-up workflow using n8n + Twilio
* Role-based dashboards for **Patient**, **Doctor**, and **Admin**
* JWT-based authentication and authorization

### Suggested stack

* **Frontend:** React + Vite + JSX + Tailwind CSS
* **Backend:** Node.js + Express.js
* **Database:** MongoDB + Mongoose
* **Auth:** JWT + bcrypt
* **File Storage:** Cloudinary / AWS S3 / Firebase Storage
* **Automation:** n8n
* **Communication:** Twilio (SMS/voice)
* **Optional AI voice follow-up:** Vapi

---

# 2. User Roles

## 2.1 Patient

Can:

* Register/login
* Search doctors
* Book appointment
* View appointments
* View prescriptions
* View medical history
* Manage reminders
* Receive SMS/call reminders
* Chat with assistant
* Edit profile

## 2.2 Doctor

Can:

* Register/login
* Submit verification documents
* Update professional profile
* Set availability slots
* View incoming appointments
* Confirm/reject/reschedule appointments
* View patient record if authorized
* Upload prescription to patient account
* Add consultation notes and medical history record
* Set medicine schedule / follow-up plan

## 2.3 Admin

Can:

* View all users
* Verify or reject doctors
* Block/unblock accounts
* View reports/logs
* View workflow and reminder logs
* Manage platform settings

---

# 3. High-Level System Flow

## 3.1 Patient flow

1. Patient lands on website
2. Registers or logs in
3. Completes profile
4. Searches doctor by specialization/location/hospital/availability
5. Opens doctor profile
6. Checks available slots
7. Books appointment
8. Gets booking confirmation
9. Doctor confirms appointment
10. After consultation doctor uploads prescription and record
11. System creates medication reminders + follow-up schedule
12. Patient receives SMS/call/reminder notifications
13. Patient can see complete timeline in medical history

## 3.2 Doctor flow

1. Doctor registers
2. Fills professional details
3. Uploads license, degree certificate, ID proof
4. Status becomes `pending verification`
5. Admin reviews and approves/rejects
6. Once verified, doctor sets availability
7. Receives appointment requests
8. Confirms/rejects appointment
9. Opens patient case
10. Adds consultation notes
11. Uploads prescription
12. Sets medicine schedule / follow-up / review date
13. Backend triggers reminder workflow

## 3.3 Admin flow

1. Admin logs in
2. Views dashboard stats
3. Opens doctor verification queue
4. Reviews submitted documents
5. Approves/rejects doctor
6. Monitors users, reminders, calls, appointments, reports

---

# 4. Frontend Architecture

## 4.1 Suggested folder structure

```text
src/
  api/
    axios.js
    authApi.js
    doctorApi.js
    patientApi.js
    appointmentApi.js
    prescriptionApi.js
    reminderApi.js
    adminApi.js
  app/
    store.js
  components/
    common/
    auth/
    layout/
    forms/
    dashboard/
    doctor/
    patient/
    admin/
    chatbot/
    medical/
  pages/
    public/
    auth/
    patient/
    doctor/
    admin/
    shared/
  routes/
    AppRoutes.jsx
    ProtectedRoute.jsx
    RoleRoute.jsx
  hooks/
  utils/
  context/
  assets/
  main.jsx
  App.jsx
```

---

# 5. Frontend Pages, Components, Inputs, and Flows

## 5.1 Public pages

### 5.1.1 Landing Page

**Purpose:** product intro, CTA, doctor search preview, trust section

**Sections/components**

* Navbar
* Hero section
* Search doctor quick form
* Why choose us
* Features cards
* Verified doctors section
* Testimonials
* Footer
* Floating chatbot button

**Data shown**

* doctorCount
* patientCount
* verifiedDoctorCount
* specialties list

---

### 5.1.2 About Page

* Platform intro
* Vision
* How it works
* Privacy and security section

### 5.1.3 Contact Page

* Contact form
* Help details
* FAQ accordion

### 5.1.4 Doctor Listing Page

**Filters**

* specialization
* city
* hospital
* language
* fee range
* rating
* availability date
* verified only

**Components**

* SearchBar
* FilterSidebar
* DoctorCard list
* Pagination

**DoctorCard fields**

* doctorId
* profileImage
* fullName
* specialization
* qualifications
* experienceYears
* hospitalName
* consultationFee
* ratingAverage
* verifiedBadge
* nextAvailableSlot

---

### 5.1.5 Doctor Details Page

**Sections**

* Basic profile
* About doctor
* Qualifications
* Languages
* Hospital/clinic info
* Available slots
* Reviews
* Book appointment CTA

**Components**

* DoctorProfileHeader
* QualificationList
* AvailabilityCalendar
* SlotPicker
* ReviewList
* BookingSummaryBox

---

## 5.2 Authentication pages

### 5.2.1 Role Selection Page

Choose:

* Patient
* Doctor
* Admin (no public signup, only login)

### 5.2.2 Patient Register Page

**Fields**

* fullName
* email
* phone
* password
* confirmPassword
* dateOfBirth
* gender
* address
* emergencyContactName
* emergencyContactPhone
* emergencyContactRelation
* consentAccepted

**Components**

* RegisterForm
* PasswordStrengthMeter
* OTPModal (optional)
* TermsCheckbox

### 5.2.3 Doctor Register Page

**Basic account fields**

* fullName
* email
* phone
* password
* confirmPassword

**Professional fields**

* specialization
* qualifications[]
* experienceYears
* licenseNumber
* licenseExpiry
* hospitalName
* consultationFee
* languages[]
* about
* clinicAddress

**Document upload fields**

* medicalLicenseFile
* degreeCertificateFile[]
* governmentIdFile
* profilePhoto

**Components**

* DoctorRegisterForm
* MultiStepForm
* DocumentUploader
* AvailabilitySetupPreview

### 5.2.4 Login Page

**Fields**

* emailOrPhone
* password
* rememberMe

**Components**

* LoginForm
* SocialLoginButtons (optional)
* ForgotPasswordLink

### 5.2.5 Forgot Password Page

* email

### 5.2.6 Reset Password Page

* newPassword
* confirmPassword

### 5.2.7 Verify Email / Verify Phone Page

* OTP input
* resend OTP button

---

# 6. Shared Layout Components

## 6.1 Common reusable components

* Button
* Input
* Select
* TextArea
* Modal
* Drawer
* Badge
* Table
* Pagination
* Loader
* EmptyState
* ErrorState
* ConfirmDialog
* Toast
* FileUploader
* DatePicker
* TimeSlotPicker
* SearchInput
* FilterPanel
* StatusChip
* Avatar
* Breadcrumb
* Tabs
* Timeline
* StatCard
* SummaryCard
* NotificationBell
* ChatbotWidget

## 6.2 Layout components

* PublicLayout
* AuthLayout
* DashboardLayout
* Sidebar
* Topbar
* MobileBottomNav
* ProfileDropdown

---

# 7. Patient Frontend Module

## 7.1 Patient Dashboard Page

**Widgets**

* Upcoming appointments
* Next dose reminder
* Active prescriptions count
* Medical history summary
* Recent doctor notes
* Unread notifications

**Quick action buttons**

* Book Appointment
* View Prescriptions
* Medical History
* Set Reminder
* Chat Support

**Components**

* PatientStatsGrid
* UpcomingAppointmentsCard
* TodayMedicationCard
* RecentPrescriptionsTable
* ReminderTimelineWidget
* HealthAlertsCard

**Data fields needed**

* totalAppointments
* upcomingAppointments[]
* activeMedications[]
* nextReminderAt
* unreadNotificationCount
* latestMedicalRecord

---

## 7.2 Book Appointment Page

**Flow**

1. Search doctor
2. Apply filters
3. Choose doctor
4. Pick date
5. View slots
6. Submit reason
7. Confirm booking
8. Payment optional later

**Form fields**

* doctorId
* appointmentDate
* appointmentTime
* appointmentType
* reasonForVisit
* symptoms[]
* attachment[] optional

**Components**

* DoctorSearchBar
* DoctorFilterPanel
* DoctorSelectionCard
* SlotCalendar
* AppointmentReasonForm
* BookingReviewCard

---

## 7.3 Patient Appointments Page

**Tabs**

* Upcoming
* Pending
* Confirmed
* Completed
* Cancelled

**Actions**

* View details
* Cancel
* Reschedule
* Join video call (future)
* Download receipt (future)

**List fields**

* appointmentId
* doctorName
* specialization
* date
* time
* type
* status
* reason

---

## 7.4 Patient Prescription Page

**Sections**

* Active prescriptions
* Past prescriptions
* Shared prescriptions

**Each prescription card fields**

* prescriptionId
* fileName
* uploadedAt
* doctorName
* appointmentDate
* medications[]
* expiryDate
* notes

**Actions**

* View file
* Download
* Share
* View medication schedule

**Components**

* PrescriptionFilterBar
* PrescriptionCard
* MedicationList
* SharePrescriptionModal
* FilePreviewModal

---

## 7.5 Patient Medical History Page

**Sections**

* Timeline view
* Condition summary
* Allergies and chronic conditions
* Lab reports
* Visit notes

**Filters**

* date range
* doctor
* record type
* condition

**Record fields**

* medicalRecordId
* diagnosis
* symptoms[]
* treatmentPlan
* medications[]
* labReports[]
* vitals
* followUpDate
* doctorName
* createdAt

**Components**

* MedicalTimeline
* ConditionSummaryCard
* VisitRecordCard
* VitalsPanel
* LabReportViewer
* ExportButton

---

## 7.6 Patient Reminder Page

**Types**

* medicine reminders
* appointment reminders
* follow-up reminders
* refill reminders

**Fields**

* reminderId
* title
* description
* type
* scheduledTime
* repeat
* channel
* status

**Actions**

* create
* edit
* delete
* snooze
* pause

**Components**

* ReminderTable
* ReminderFormModal
* ReminderCalendarView
* ChannelBadge

---

## 7.7 Patient Profile Page

**Fields**

* fullName
* email
* phone
* profilePicture
* dob
* gender
* address
* emergencyContact
* allergies[]
* chronicConditions[]
* bloodGroup

**Components**

* ProfileForm
* EmergencyContactForm
* AccountSecurityCard
* LinkedDoctorsList

---

## 7.8 Patient Notification Center

**Sections**

* Appointment alerts
* Prescription uploaded alerts
* Reminder sent alerts
* Follow-up call logs

---

# 8. Doctor Frontend Module

## 8.1 Doctor Dashboard Page

**Widgets**

* Today appointments count
* Pending confirmations
* Upcoming appointments
* Patients seen this week
* Pending prescription uploads
* Verification status

**Components**

* DoctorStatsGrid
* TodayScheduleTable
* PendingAppointmentsWidget
* VerificationStatusCard
* QuickPrescriptionAction

---

## 8.2 Doctor Verification Status Page

**Shows**

* application status: pending / verified / rejected
* submitted documents list
* rejection reason
* re-upload document option

**Components**

* VerificationStepper
* UploadedDocumentsTable
* ReSubmitDocsForm

---

## 8.3 Doctor Profile Management Page

**Fields**

* fullName
* profilePhoto
* specialization
* qualifications[]
* experienceYears
* licenseNumber
* hospitalName
* consultationFee
* clinicAddress
* about
* languages[]
* services[]

**Components**

* DoctorProfileForm
* QualificationEditor
* AvailabilityEditor
* ClinicInfoCard

---

## 8.4 Doctor Availability Management Page

**Purpose**
Doctor sets weekly schedule and break slots.

**Fields**

* dayOfWeek
* isAvailable
* startTime
* endTime
* slotDuration
* maxPatients
* breakStart
* breakEnd

**Components**

* WeeklyAvailabilityGrid
* SlotDurationSelector
* DayToggle
* HolidayBlockForm

---

## 8.5 Doctor Appointments Page

**Tabs**

* New requests
* Confirmed
* Completed
* Cancelled
* No-show

**Actions**

* confirm
* reject
* reschedule
* view patient profile
* start consultation note
* upload prescription
* mark completed

**Appointment details fields**

* appointmentId
* patientId
* patientName
* age
* gender
* reason
* symptoms[]
* date
* time
* type
* status

**Components**

* AppointmentQueueTable
* AppointmentStatusActions
* PatientMiniCard
* ConsultationDrawer

---

## 8.6 Doctor Patient Details Page

**Sections**

* Patient basic profile
* Appointment summary
* Past consultations
* Prescriptions
* Medical history
* Allergies/chronic conditions

**Actions**

* add note
* upload prescription
* create medical record
* schedule follow-up

**Components**

* PatientHeaderCard
* MedicalHistoryTimeline
* PastPrescriptionsPanel
* NoteEditor
* FollowUpPlanForm

---

## 8.7 Upload Prescription Page / Modal

**Form fields**

* patientId
* appointmentId
* prescriptionFile
* medications[]

  * medicineName
  * dosage
  * frequency
  * durationDays
  * medicineTime[] (morning/afternoon/night/custom)
  * beforeAfterFood
  * startDate
  * endDate
* notes
* followUpDate
* createReminder boolean
* reminderChannel[]

**Components**

* PrescriptionUploadForm
* MedicationRepeater
* FileUploadDropzone
* FollowUpScheduler
* ReviewAndSubmitPanel

---

## 8.8 Add Medical Record Page / Modal

**Fields**

* patientId
* appointmentId
* diagnosis
* symptoms[]
* treatment
* medications[]
* labReports[]
* vitals

  * bloodPressure
  * heartRate
  * temperature
  * weight
  * oxygenLevel optional
* followUpDate
* doctorNotes

**Components**

* MedicalRecordForm
* VitalsInputGroup
* LabReportUploader

---

# 9. Admin Frontend Module

## 9.1 Admin Dashboard Page

**Widgets**

* total users
* total doctors
* verified doctors
* pending verifications
* total appointments
* active reminders
* failed call count
* system health

**Components**

* AdminStatsCards
* VerificationQueuePreview
* AppointmentsChart
* UserGrowthChart
* WorkflowLogWidget

---

## 9.2 Doctor Verification Queue Page

**Table fields**

* doctorId
* doctorName
* specialization
* licenseNumber
* submittedAt
* status

**Actions**

* view profile
* open documents
* approve
* reject
* request resubmission

**Components**

* VerificationTable
* DocumentPreviewModal
* VerificationDecisionModal

---

## 9.3 User Management Page

**Filters**

* role
* active/inactive
* verified/unverified
* created date

**Actions**

* block
* unblock
* view details
* reset password link send

---

## 9.4 Reports Page

**Reports**

* appointments report
* doctor verification report
* reminders delivery report
* patient engagement report

---

## 9.5 System Logs / Automation Logs Page

**Shows**

* API logs
* login attempts
* reminder dispatch logs
* Twilio delivery status
* call attempt results
* n8n workflow runs

---

# 10. Frontend Route Map

## Public routes

* /
* /about
* /contact
* /doctors
* /doctors/:id
* /faq

## Auth routes

* /select-role
* /login
* /register/patient
* /register/doctor
* /verify-email
* /verify-phone
* /forgot-password
* /reset-password/:token

## Patient routes

* /patient/dashboard
* /patient/appointments
* /patient/appointments/book
* /patient/prescriptions
* /patient/medical-history
* /patient/reminders
* /patient/notifications
* /patient/profile

## Doctor routes

* /doctor/dashboard
* /doctor/profile
* /doctor/verification
* /doctor/availability
* /doctor/appointments
* /doctor/patients/:patientId
* /doctor/prescriptions/new
* /doctor/medical-records/new

## Admin routes

* /admin/dashboard
* /admin/doctors/pending
* /admin/users
* /admin/reports
* /admin/logs
* /admin/settings

---

# 11. Frontend State Management

## Auth state

* user
* token
* refreshToken
* role
* isAuthenticated
* loading

## Patient state

* dashboardSummary
* appointments
* prescriptions
* medicalHistory
* reminders
* notifications

## Doctor state

* profile
* verificationStatus
* availability
* appointments
* currentPatient

## Admin state

* stats
* users
* pendingDoctors
* reports
* logs

---

# 12. Backend Architecture

## 12.1 Suggested backend folder structure

```text
server/
  src/
    config/
    controllers/
    routes/
    services/
    models/
    middleware/
    utils/
    validators/
    jobs/
    docs/
    app.js
    server.js
```

## 12.2 Modules

* auth
* users
* doctors
* patients
* appointments
* prescriptions
* medicalHistory
* reminders
* chatbot
* admin
* notifications
* automation
* files
* auditLogs

---

# 13. Database Design (MongoDB Models)

## 13.1 User model

```js
{
  _id,
  fullName,
  email,
  phone,
  passwordHash,
  role, // patient | doctor | admin
  profilePicture,
  dateOfBirth,
  gender,
  bloodGroup,
  address: {
    street,
    city,
    state,
    zipCode,
    country
  },
  emergencyContact: {
    name,
    phone,
    relationship
  },
  allergies: [String],
  chronicConditions: [String],
  emailVerified,
  phoneVerified,
  isActive,
  isBlocked,
  lastLogin,
  consentAccepted,
  createdAt,
  updatedAt
}
```

## 13.2 DoctorProfile model

```js
{
  _id,
  userId,
  specialization,
  qualifications: [String],
  experienceYears,
  licenseNumber,
  licenseExpiry,
  hospitalName,
  clinicAddress,
  consultationFee,
  languages: [String],
  about,
  servicesOffered: [String],
  verificationStatus, // pending verified rejected
  verificationSubmittedAt,
  verificationDate,
  verifiedBy,
  rejectionReason,
  ratingAverage,
  totalReviews,
  availableSlots: [
    {
      dayOfWeek,
      isAvailable,
      startTime,
      endTime,
      slotDuration,
      maxPatients,
      breakStart,
      breakEnd
    }
  ],
  createdAt,
  updatedAt
}
```

## 13.3 DoctorDocument model

```js
{
  _id,
  doctorId,
  documentType, // license degree idProof profilePhoto other
  fileUrl,
  fileName,
  fileType,
  fileSize,
  uploadedAt,
  verificationNote,
  status // submitted approved rejected
}
```

## 13.4 Appointment model

```js
{
  _id,
  patientId,
  doctorId,
  appointmentDate,
  appointmentTime,
  endTime,
  durationMinutes,
  status, // pending confirmed completed cancelled rejected no-show
  appointmentType, // in-person video phone
  reasonForVisit,
  symptoms: [String],
  patientNotes,
  doctorNotes,
  bookedBy, // self admin
  confirmedAt,
  cancelledAt,
  cancellationReason,
  rescheduledFrom,
  reminderStatus: {
    before24h,
    before2h
  },
  createdAt,
  updatedAt
}
```

## 13.5 Prescription model

```js
{
  _id,
  patientId,
  doctorId,
  appointmentId,
  fileUrl,
  fileName,
  fileType,
  fileSize,
  ocrText,
  notes,
  expiryDate,
  uploadedAt,
  tags: [String],
  medications: [
    {
      medicineName,
      dosage,
      dosageUnit,
      frequencyPerDay,
      medicineTimes: [String],
      beforeAfterFood,
      durationDays,
      startDate,
      endDate,
      instructions,
      reminderEnabled
    }
  ],
  followUp: {
    date,
    type, // appointment call sms
    notes
  },
  createdAt,
  updatedAt
}
```

## 13.6 MedicalHistory model

```js
{
  _id,
  patientId,
  doctorId,
  appointmentId,
  diagnosis,
  symptoms: [String],
  treatment,
  medicationsSnapshot: [
    {
      medicineName,
      dosage,
      frequency,
      durationDays
    }
  ],
  labReports: [
    {
      fileUrl,
      fileName,
      uploadedAt
    }
  ],
  vitals: {
    bloodPressure,
    heartRate,
    temperature,
    weight,
    oxygenLevel
  },
  followUpDate,
  doctorNotes,
  visitSummary,
  recordType, // consultation diagnosis lab followup discharge
  createdAt,
  updatedAt
}
```

## 13.7 Reminder model

```js
{
  _id,
  patientId,
  doctorId,
  appointmentId,
  prescriptionId,
  medicationId,
  type, // medication appointment follow-up refill custom
  title,
  description,
  scheduledTime,
  timezone,
  repeat, // once daily weekly monthly custom
  repeatConfig,
  channel, // sms call email push whatsapp
  status, // pending scheduled sent failed cancelled snoozed completed
  attempts,
  lastAttemptAt,
  nextAttemptAt,
  patientResponse,
  optOut,
  source, // manual prescription appointment system
  createdBy,
  createdAt,
  updatedAt
}
```

## 13.8 NotificationLog model

```js
{
  _id,
  userId,
  type, // sms call email push in-app
  title,
  body,
  provider, // twilio system
  providerMessageId,
  status,
  sentAt,
  deliveredAt,
  failedAt,
  errorMessage,
  metadata
}
```

## 13.9 ChatLog model

```js
{
  _id,
  userId,
  sessionId,
  query,
  response,
  intent,
  confidence,
  context,
  rating,
  feedback,
  createdAt
}
```

## 13.10 AuditLog model

```js
{
  _id,
  actorId,
  actorRole,
  action,
  resourceType,
  resourceId,
  metadata,
  ipAddress,
  userAgent,
  createdAt
}
```

## 13.11 RefreshToken model (optional)

```js
{
  _id,
  userId,
  token,
  expiresAt,
  revoked,
  createdAt
}
```

---

# 14. Backend Controllers and Responsibilities

## 14.1 Auth controller

Handles:

* register patient
* register doctor
* login
* refresh token
* logout
* verify email
* send OTP
* confirm OTP
* forgot password
* reset password
* change password

## 14.2 Patient controller

Handles:

* get/update patient profile
* get patient appointments
* get prescriptions
* get medical history
* get reminders
* create/update/delete personal reminders

## 14.3 Doctor controller

Handles:

* get doctor list
* get doctor detail
* get own profile
* update doctor profile
* submit verification
* upload docs
* update availability
* get appointments
* appointment confirm/reject/complete
* get patient details

## 14.4 Appointment controller

Handles:

* create appointment
* check availability
* get available slots
* get appointment detail
* update appointment
* cancel
* reschedule
* confirm appointment

## 14.5 Prescription controller

Handles:

* upload prescription file
* attach medicines
* get prescription detail
* list patient prescriptions
* list doctor prescriptions
* download
* delete
* share
* auto-create reminders from medicines

## 14.6 Medical history controller

Handles:

* add record
* update record
* get patient history
* get specific record
* timeline view
* conditions summary
* export pdf

## 14.7 Reminder controller

Handles:

* create reminder
* update reminder
* delete reminder
* snooze reminder
* get reminders
* dispatch due reminders

## 14.8 Admin controller

Handles:

* get users
* block/unblock user
* get pending doctors
* approve/reject doctor
* stats
* reports
* settings
* logs

## 14.9 Automation controller

Handles:

* get workflow status
* trigger workflow manually
* webhook endpoints for n8n/twilio callbacks

---

# 15. JWT Role-Based Security Flow

## 15.1 Roles

* patient
* doctor
* admin

## 15.2 Middleware

* `authMiddleware` → verifies JWT
* `roleMiddleware(...roles)` → only allowed roles
* `doctorVerifiedMiddleware` → only verified doctors for receiving appointments
* `ownerOrRoleMiddleware` → patient can only access own record unless doctor/admin has permission
* `rateLimitMiddleware`
* `auditLogMiddleware`

## 15.3 Token strategy

* accessToken: short expiry
* refreshToken: longer expiry
* store access token in HTTP-only cookie or secure strategy
* rotate refresh token on refresh

---

# 16. API Specification

## 16.1 Auth APIs

### POST /api/auth/register/patient

**Body**

```json
{
  "fullName": "Anushka Jadhav",
  "email": "anushka@example.com",
  "phone": "9999999999",
  "password": "StrongPass@123",
  "dateOfBirth": "2004-01-01",
  "gender": "female",
  "address": {
    "street": "abc",
    "city": "Pune",
    "state": "Maharashtra",
    "zipCode": "411001",
    "country": "India"
  },
  "emergencyContact": {
    "name": "Sunil",
    "phone": "8888888888",
    "relationship": "father"
  },
  "consentAccepted": true
}
```

### POST /api/auth/register/doctor

**Body**

```json
{
  "fullName": "Dr. Meera Patil",
  "email": "doctor@example.com",
  "phone": "7777777777",
  "password": "StrongPass@123",
  "specialization": "Cardiologist",
  "qualifications": ["MBBS", "MD"],
  "experienceYears": 8,
  "licenseNumber": "LIC12345",
  "licenseExpiry": "2028-12-31",
  "hospitalName": "City Care Hospital",
  "consultationFee": 800,
  "languages": ["English", "Hindi", "Marathi"],
  "about": "Experienced heart specialist"
}
```

### POST /api/auth/login

```json
{
  "emailOrPhone": "doctor@example.com",
  "password": "StrongPass@123",
  "rememberMe": true
}
```

### POST /api/auth/refresh-token

### POST /api/auth/logout

### POST /api/auth/forgot-password

### POST /api/auth/reset-password/:token

### POST /api/auth/change-password

### GET /api/auth/verify-email/:token

### POST /api/auth/verify-phone/send-otp

### POST /api/auth/verify-phone/confirm-otp

---

## 16.2 Doctor APIs

### GET /api/doctors

Query params:

* specialization
* city
* hospital
* language
* feeMin
* feeMax
* rating
* verified=true
* page
* limit

### GET /api/doctors/:doctorId

### GET /api/doctors/profile/me

### PUT /api/doctors/profile/me

### PUT /api/doctors/availability

### GET /api/doctors/availability/:doctorId

### GET /api/doctors/appointments

### PATCH /api/doctors/appointments/:appointmentId/status

**Body**

```json
{
  "status": "confirmed",
  "doctorNotes": "Please come fasting for blood test"
}
```

### POST /api/doctors/verify/submit

multipart form-data:

* medicalLicenseFile
* degreeCertificateFiles[]
* governmentIdFile
* profilePhoto

### GET /api/doctors/verify/status

### GET /api/doctors/patients/:patientId

---

## 16.3 Patient APIs

### GET /api/patients/profile/me

### PUT /api/patients/profile/me

### GET /api/patients/appointments

### GET /api/patients/prescriptions

### GET /api/patients/medical-history

### GET /api/patients/reminders

### POST /api/patients/reminders

```json
{
  "title": "Vitamin D",
  "description": "Take after breakfast",
  "type": "medication",
  "scheduledTime": "2026-04-10T08:00:00.000Z",
  "repeat": "daily",
  "channel": "sms"
}
```

### PUT /api/patients/reminders/:id

### DELETE /api/patients/reminders/:id

---

## 16.4 Appointment APIs

### POST /api/appointments

```json
{
  "doctorId": "doctor_id",
  "appointmentDate": "2026-04-12",
  "appointmentTime": "11:00",
  "appointmentType": "in-person",
  "reasonForVisit": "Fever and weakness",
  "symptoms": ["fever", "fatigue"]
}
```

### GET /api/appointments/:appointmentId

### PUT /api/appointments/:appointmentId

### DELETE /api/appointments/:appointmentId

### GET /api/appointments/check-availability?doctorId=...&date=...

### GET /api/appointments/available-slots?doctorId=...&date=...

### POST /api/appointments/:appointmentId/confirm

### POST /api/appointments/:appointmentId/reschedule

```json
{
  "appointmentDate": "2026-04-15",
  "appointmentTime": "12:30",
  "reason": "Doctor unavailable"
}
```

---

## 16.5 Prescription APIs

### POST /api/prescriptions/upload

multipart/form-data:

* patientId
* doctorId
* appointmentId
* prescriptionFile
* notes
* expiryDate
* medications (JSON stringified array)
* followUpDate
* createReminder
* reminderChannel[]

**medications example**

```json
[
  {
    "medicineName": "Paracetamol",
    "dosage": "500",
    "dosageUnit": "mg",
    "frequencyPerDay": 3,
    "medicineTimes": ["morning", "afternoon", "night"],
    "beforeAfterFood": "after_food",
    "durationDays": 5,
    "startDate": "2026-04-10",
    "endDate": "2026-04-15",
    "instructions": "Take after meal",
    "reminderEnabled": true
  }
]
```

### GET /api/prescriptions/:id

### DELETE /api/prescriptions/:id

### GET /api/prescriptions/patient/:patientId

### GET /api/prescriptions/doctor/:doctorId

### POST /api/prescriptions/:id/share

### GET /api/prescriptions/:id/download

---

## 16.6 Medical History APIs

### GET /api/medical-history/:patientId

### GET /api/medical-history/record/:id

### POST /api/medical-history

```json
{
  "patientId": "patient_id",
  "doctorId": "doctor_id",
  "appointmentId": "appointment_id",
  "diagnosis": "Viral fever",
  "symptoms": ["fever", "body pain"],
  "treatment": "Rest and hydration",
  "medicationsSnapshot": [
    {
      "medicineName": "Paracetamol",
      "dosage": "500mg",
      "frequency": "3 times a day",
      "durationDays": 5
    }
  ],
  "vitals": {
    "bloodPressure": "120/80",
    "heartRate": 84,
    "temperature": 100.2,
    "weight": 58
  },
  "followUpDate": "2026-04-16",
  "doctorNotes": "Review after 5 days"
}
```

### PUT /api/medical-history/:id

### GET /api/medical-history/:patientId/timeline

### GET /api/medical-history/:patientId/conditions

### GET /api/medical-history/:id/export

---

## 16.7 Reminder APIs

### GET /api/reminders

### POST /api/reminders

### PUT /api/reminders/:id

### DELETE /api/reminders/:id

### POST /api/reminders/:id/snooze

```json
{
  "minutes": 15
}
```

---

## 16.8 Chatbot APIs

### POST /api/chatbot/session

### POST /api/chatbot/query

```json
{
  "sessionId": "session_123",
  "message": "How do I book an appointment?"
}
```

### GET /api/chatbot/session/:id

### POST /api/chatbot/feedback

### GET /api/chatbot/faq

---

## 16.9 Admin APIs

### GET /api/admin/stats

### GET /api/admin/users

### GET /api/admin/users/:id

### POST /api/admin/users/:id/block

### POST /api/admin/users/:id/unblock

### GET /api/admin/doctors/pending

### POST /api/admin/doctors/:id/verify

```json
{
  "notes": "All documents valid"
}
```

### POST /api/admin/doctors/:id/reject

```json
{
  "reason": "License document unclear"
}
```

### GET /api/admin/reports/appointments

### GET /api/admin/reports/users

### GET /api/admin/logs

### GET /api/admin/settings

### PUT /api/admin/settings

---

# 17. Exact Coordination Mapping Between Frontend and Backend

## 17.1 Example: Doctor registration mapping

### Frontend form fields

* fullName
* email
* phone
* password
* specialization
* qualifications[]
* experienceYears
* licenseNumber
* licenseExpiry
* hospitalName
* consultationFee
* languages[]
* about
* medicalLicenseFile
* degreeCertificateFiles[]
* governmentIdFile

### Backend expected fields

Same names should be preserved in request body / form-data to avoid mismatch.

---

## 17.2 Example: Appointment booking mapping

### Frontend payload

* doctorId
* appointmentDate
* appointmentTime
* appointmentType
* reasonForVisit
* symptoms[]

### Backend model mapping

* doctorId -> Appointment.doctorId
* appointmentDate -> Appointment.appointmentDate
* appointmentTime -> Appointment.appointmentTime
* appointmentType -> Appointment.appointmentType
* reasonForVisit -> Appointment.reasonForVisit
* symptoms[] -> Appointment.symptoms[]

---

## 17.3 Example: Prescription upload mapping

### Frontend form

* patientId
* appointmentId
* prescriptionFile
* medications[]
* notes
* followUpDate
* createReminder
* reminderChannel[]

### Backend storage

* prescriptionFile -> fileUrl/fileName/fileType/fileSize
* medications[] -> Prescription.medications[]
* followUpDate -> Prescription.followUp.date
* createReminder -> trigger reminder service

---

# 18. Reminder and Follow-Up Automation Design

## 18.1 Reminder sources

* Appointment created -> appointment reminders
* Prescription uploaded -> medicine reminders
* Doctor sets follow-up date -> follow-up reminder/call
* Admin/system custom reminder

## 18.2 Reminder dispatch logic

1. Reminder created in DB
2. n8n cron checks due reminders every minute / 5 minutes
3. Fetch reminders with status `pending` and `scheduledTime <= now`
4. Send through selected channel
5. Update NotificationLog and Reminder status
6. Retry failed attempts
7. Save patient response if callback received

---

# 19. n8n Workflow Design

## 19.1 Workflow 1: Appointment reminder

**Trigger:** Cron or webhook

**Steps**

1. Query due appointment reminders from backend API
2. Loop through reminders
3. Send SMS using Twilio node or HTTP request
4. Update backend via webhook `/api/automation/reminder-status`
5. Log success/failure

## 19.2 Workflow 2: Medication dose reminder

**Trigger:** Cron every 5 minutes

**Steps**

1. Fetch due medication reminders
2. Send SMS or voice reminder
3. If patient misses response, schedule retry
4. Store outcome in DB

## 19.3 Workflow 3: Follow-up AI call

**Trigger:** followUpDate/time reached

**Steps**

1. Fetch patient, doctor, prescription context
2. Send request to Vapi or Twilio voice flow
3. Ask scripted questions:

   * Did you take medicines on time?
   * Are you feeling better?
   * Do you want to book a follow-up appointment?
4. Save call summary
5. Escalate if patient says symptoms worse

## 19.4 Workflow 4: Doctor verification notification

**Trigger:** admin approves/rejects doctor

**Steps**

1. Send email
2. Send SMS
3. Create in-app notification

---

# 20. Twilio Integration Design

## 20.1 Use cases

* OTP verification
* Appointment confirmation SMS
* Reminder SMS
* Automated voice call
* Delivery status callback

## 20.2 Backend services needed

* `sendSms(to, message)`
* `makeVoiceCall(to, twimlUrl)`
* `sendOtp(phone, code)`
* `verifyOtp(phone, code)`
* `handleDeliveryCallback()`

## 20.3 Twilio-related DB logging

Store:

* providerMessageId
* toPhone
* channel
* messageBody
* callSid
* status
* sentAt
* deliveredAt
* failureReason

## 20.4 Voice call reminder script example

“Hello, this is a health reminder from Care Hospital. This is your 8 PM medicine dose reminder for Paracetamol 500 mg. Please take your medicine after food. Press 1 if taken, press 2 if skipped.”

---

# 21. Backend Services Layer

## 21.1 AuthService

* hash password
* compare password
* sign access token
* sign refresh token
* generate email token
* generate OTP

## 21.2 DoctorService

* create doctor profile
* submit verification
* update availability
* compute visible slots

## 21.3 AppointmentService

* check slot conflict
* book slot
* reschedule
* cancel
* confirm
* create appointment reminder jobs

## 21.4 PrescriptionService

* upload file
* save prescription
* parse medications payload
* optional OCR process
* create medication reminders

## 21.5 MedicalHistoryService

* add consultation record
* build patient timeline
* export PDF summary

## 21.6 ReminderService

* create reminder
* create recurring reminders
* snooze reminder
* mark sent/failed
* retry failed reminders

## 21.7 NotificationService

* send email
* send sms
* send voice call
* send in-app notification

## 21.8 AutomationService

* trigger n8n workflow
* receive webhook updates
* map workflow result to reminder status

## 21.9 AuditService

* save all sensitive actions and record access logs

---

# 22. Backend Validation Rules

## 22.1 User validation

* valid email
* unique email
* unique phone
* password strong

## 22.2 Doctor validation

* licenseNumber required
* specialization required
* at least one proof document required
* cannot accept appointments until verificationStatus = verified

## 22.3 Appointment validation

* appointment date not in past
* slot must exist in doctor availability
* no double booking
* only patient can create own appointment

## 22.4 Prescription validation

* patientId required
* doctorId required
* file required
* medication array format valid
* followUpDate optional but must be future date

## 22.5 Reminder validation

* scheduledTime required
* channel valid
* repeat enum valid

---

# 23. Important Business Rules

1. Only verified doctors can appear bookable.
2. Doctor signup does not mean immediately active doctor account.
3. Admin approval is mandatory for doctor verification.
4. Patient can only view own records.
5. Doctor can only access patients linked through appointment/authorized access.
6. Prescription upload should create medical and reminder linkage.
7. If reminder fails, retry up to configured attempts.
8. All record access must be logged.
9. Sensitive files should not be publicly accessible.
10. Medicine schedule must be stored in structured form, not only file upload.

---

# 24. Suggested UI-to-API Mapping Table

## Patient dashboard

* GET `/api/patients/profile/me`
* GET `/api/patients/appointments`
* GET `/api/patients/prescriptions`
* GET `/api/patients/reminders`

## Doctor dashboard

* GET `/api/doctors/profile/me`
* GET `/api/doctors/appointments`
* GET `/api/doctors/verify/status`

## Admin dashboard

* GET `/api/admin/stats`
* GET `/api/admin/doctors/pending`
* GET `/api/admin/logs`

---

# 25. Recommended Development Phases

## Phase 1 - Core auth and roles

* register/login
* JWT auth
* role-based routes
* patient and doctor profile

## Phase 2 - Doctor verification + listing

* doctor document upload
* admin approval flow
* doctor list page
* doctor details page

## Phase 3 - Appointment booking

* availability
* slot check
* book/confirm/cancel/reschedule
* notifications

## Phase 4 - Prescription + medical history

* upload prescription
* structured medication form
* doctor notes
* patient history timeline

## Phase 5 - Reminder engine

* reminders model
* n8n flows
* Twilio SMS/call
* follow-up tracking

## Phase 6 - Admin + logs + chatbot

* verification queue
* logs/reports
* chatbot widget

---

# 26. Best Practice Notes for Team Coordination

## Frontend team should keep

* exact same field names as API contract
* common enums in one shared file
* one status dictionary used everywhere
* reusable forms for doctor/patient/reminder modules

## Backend team should keep

* Swagger/OpenAPI docs
* consistent response shape
* centralized validation
* centralized error handler
* audit logs for sensitive operations

## Shared team agreement

* API contract document frozen before full dev
* payload examples shared in Postman collection
* status enums fixed early
* file upload field names finalized early

---

# 27. Standard API Response Shape

## Success

```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {},
  "meta": {}
}
```

## Error

```json
{
  "success": false,
  "message": "Slot already booked",
  "errors": [
    {
      "field": "appointmentTime",
      "message": "Selected slot is unavailable"
    }
  ]
}
```

---

# 28. Final Implementation Notes

This project should be built like a real production healthcare workflow, not just a simple booking app.

So the most important design principles are:

* strong role separation
* verified doctor flow
* structured medicine schedule data
* patient history centralization
* automation-ready reminders
* exact frontend/backend data contract
* secure file/document handling
* full audit logging

---

# 29. Optional Future Improvements

* video consultation
* online payment gateway
* OCR extraction from prescriptions
* WhatsApp reminders
* multilingual chatbot
* family account support
* lab integration
* pharmacy delivery integration
* wearable sync
* AI symptom triage assistant
