# 🏥 Hospital Appointment & Prescription Management System

Full-stack healthcare platform with appointment booking, prescription management, medical history, automated reminders, and role-based dashboards for Patients, Doctors, and Admins.

---

## 📁 Project Structure

```
frontend/              ← React + Vite frontend
backend/               ← Node.js + Express backend (this repo)
```

For deployment instructions (Render + Vercel), see `../DEPLOYMENT.md`.

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env      # Fill in your credentials (see below)
npm run seed              # Creates default admin account
npm run dev               # Starts on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
# .env is already configured to point at http://localhost:5000/api
npm run dev               # Starts on http://localhost:5173
```

---

## ⚙️ Environment Variables (`.env`)

| Variable | Description | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | ✅ |
| `JWT_EMAIL_SECRET` | Email token secret | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS + email links | ✅ |
| `CLOUDINARY_CLOUD_NAME` | For file uploads | ⚠️ Needed for file uploads |
| `CLOUDINARY_API_KEY` | Cloudinary key | ⚠️ |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | ⚠️ |
| `EMAIL_USER` | Gmail address for email sending | ⚠️ Needed for emails |
| `EMAIL_PASS` | Gmail App Password (16-char) | ⚠️ |
| `TWILIO_ACCOUNT_SID` | Twilio for SMS/calls | 📱 Optional |
| `TWILIO_AUTH_TOKEN` | Twilio auth | 📱 Optional |
| `TWILIO_PHONE_NUMBER` | Twilio phone | 📱 Optional |

> **Note:** If Twilio is not configured, SMS reminders are mock-logged to console. The app still works fully.

---

## 👤 Default Admin Account

After running `npm run seed`:
- **Email:** `admin@hospital.com`
- **Password:** `Admin@123456`
- ⚠️ Change this immediately in production!

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/patient` | Register patient |
| POST | `/api/auth/register/doctor` | Register doctor |
| POST | `/api/auth/login` | Login (all roles) |
| POST | `/api/auth/refresh-token` | Refresh JWT |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET  | `/api/auth/verify-email/:token` | Verify email |

### Doctors (Public)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/doctors` | List doctors (filters: specialization, city, fee, etc.) |
| GET | `/api/doctors/:id` | Doctor profile |
| GET | `/api/doctors/available-slots?doctorId=&date=` | Available time slots |

### Patient Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/patients/dashboard` | Dashboard summary |
| GET/PUT | `/api/patients/profile/me` | Profile |
| GET | `/api/patients/appointments` | Appointments list |
| GET | `/api/patients/prescriptions` | Prescriptions |
| GET | `/api/patients/medical-history` | Medical history |
| CRUD | `/api/patients/reminders` | Reminders |

### Appointments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/:id` | Get appointment |
| DELETE | `/api/appointments/:id` | Cancel (patient) |
| POST | `/api/appointments/:id/confirm` | Confirm (doctor) |
| POST | `/api/appointments/:id/reschedule` | Reschedule |

### Prescriptions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/prescriptions/upload` | Upload (doctor, multipart) |
| GET | `/api/prescriptions/patient/:id` | Patient prescriptions |
| GET | `/api/prescriptions/:id/download` | Download link |

### Medical History
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/medical-history` | Add record (doctor) |
| GET | `/api/medical-history/:patientId` | Patient history |
| GET | `/api/medical-history/:patientId/timeline` | Timeline view |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform stats |
| GET | `/api/admin/doctors/pending` | Verification queue |
| POST | `/api/admin/doctors/:id/verify` | Verify doctor |
| POST | `/api/admin/doctors/:id/reject` | Reject doctor |
| GET | `/api/admin/users` | All users |
| POST | `/api/admin/users/:id/block` | Block user |
| GET | `/api/admin/logs` | Audit logs |

---

## 🔐 Authentication Flow

1. Register → JWT `accessToken` (15min) + `refreshToken` (7 days) returned
2. Frontend stores in `localStorage` via Redux
3. Axios interceptor auto-attaches `Bearer` token
4. On 401, interceptor silently refreshes token
5. Doctor accounts start as `pending` → Admin must verify before they can accept appointments

---

## ⏰ Reminder Automation

- Cron runs every **5 minutes** to dispatch due reminders
- Cron runs every **30 minutes** for 24h appointment reminders
- Medication reminders auto-created when doctor uploads prescription
- If Twilio configured: sends real SMS/calls; otherwise logs to console
- Failed reminders retry up to 3 times with 15-minute backoff

---

## 📦 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Redux Toolkit |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (access + refresh tokens) + bcryptjs |
| Files | Cloudinary (prescriptions, doctor docs, profile photos) |
| Email | Nodemailer (Gmail SMTP) |
| SMS/Voice | Twilio (optional) |
| Scheduling | node-cron |
| Logging | Winston |

---

## 🏗️ Development Phases Completed

- ✅ Phase 1: Auth & roles (patient, doctor, admin)
- ✅ Phase 2: Doctor verification & listing
- ✅ Phase 3: Appointment booking, slots, confirm/cancel/reschedule
- ✅ Phase 4: Prescription upload + medical history
- ✅ Phase 5: Reminder engine (cron + Twilio-ready)
- ✅ Phase 6: Admin dashboard + audit logs + chatbot

---

## 📝 Notes

- **Cloudinary**: Required for file uploads. Without it, file upload endpoints will fail.
- **Gmail**: Enable 2FA and generate an [App Password](https://support.google.com/accounts/answer/185833).
- **MongoDB IP whitelist**: In Atlas, allow `0.0.0.0/0` for dev or your server IP for production.
