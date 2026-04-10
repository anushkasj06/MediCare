# Hospital Appointment & Prescription Management System

This repository contains a fullstack hospital workflow project based on the blueprint for a hospital appointment booking and smart follow-up system.

## Project Structure

- `hospital-app` - React + Vite frontend
- `hospital-backend` - Node.js + Express + MongoDB backend

## Implemented Scope

The current project includes the main blueprint flows for:

- patient registration, login, dashboard, appointments, prescriptions, reminders, profile, notifications
- doctor registration, profile, verification, availability, appointments, patient details, prescription upload, medical record entry
- admin dashboard, doctor verification queue, users, logs, reports, settings
- public pages for home, doctors, about, FAQ, and contact

## What Was Fixed During Integration

Before integration, the project had a few blockers:

- missing frontend `package.json`
- broken route wiring and lazy imports
- missing shared frontend utility exports
- several shared component/runtime mismatches
- doctor module compile/runtime issues
- backend seeder import path issue
- rigid local CORS handling

The codebase is now wired so the frontend builds successfully and the backend app loads correctly.

## Prerequisites

Install:

- Node.js LTS
- npm

Verify:

```bash
node --version
npm --version
```

## Backend Setup

```bash
cd hospital-backend
npm install
```

Create and update `hospital-backend/.env`.

Minimum required values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EMAIL_SECRET=your_email_jwt_secret
FRONTEND_URL=http://localhost:5173
```

Optional for later:

- Cloudinary credentials for uploads
- Gmail SMTP credentials for emails
- Twilio credentials for SMS/voice

Notes:

- backend startup works without Cloudinary, Gmail, or Twilio configured
- uploads, emails, and SMS need those credentials for full production behavior

Seed the admin user:

```bash
npm run seed
```

Default seeded admin:

- Email: `admin@hospital.com`
- Password: `Admin@123456`

Run the backend:

```bash
npm run dev
```

Expected local API base:

```text
http://localhost:5000/api
```

## Frontend Setup

```bash
cd hospital-app
npm install
```

The frontend `.env` should contain:

```env
VITE_API_URL=http://localhost:5000/api
```

Run the frontend:

```bash
npm run dev
```

Expected local app:

```text
http://localhost:5173
```

## Local Run Flow

Start both apps.

Terminal 1:

```bash
cd hospital-backend
npm run dev
```

Terminal 2:

```bash
cd hospital-app
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Main Accounts and Flows

Admin:

- login with `admin@hospital.com` / `Admin@123456`

Patient:

- register from `/register/patient`
- login and access patient dashboard

Doctor:

- register from `/register/doctor`
- submit verification docs
- admin approves from `/admin/doctors/pending`

## Public Routes

- `/`
- `/doctors`
- `/about`
- `/faq`
- `/contact`

## Build and Verification

Verified during integration:

- frontend production build with `npm run build` in `hospital-app`
- backend app load
- backend seed flow

## Important Notes

- CORS is configured for local frontend origins
- frontend API calls use `VITE_API_URL`
- if MongoDB Atlas blocks access, allow your IP or allow access from anywhere for development
- if uploads fail later, add Cloudinary credentials to the backend `.env`
- if emails fail later, add Gmail app password credentials to the backend `.env`

## Blueprint Alignment Note

This repository follows the hospital fullstack blueprint for:

- role-based architecture
- verified doctor workflow
- appointment lifecycle handling
- prescription and reminder linkage
- medical history centralization
- admin monitoring and reporting

Some blueprint ideas remain lightweight in the current implementation, especially the public doctor discovery experience, which is intentionally simpler than a full production doctor catalog/details system.
