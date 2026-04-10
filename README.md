# Hospital Fullstack

This repository contains:

- `hospital-app` - React + Vite frontend
- `hospital-backend` - Node.js + Express + MongoDB backend

## What was fixed

Before this integration pass, the project had a few setup blockers:

- the frontend was missing `package.json`
- the frontend router had broken lazy imports and invalid route wiring
- shared frontend utilities referenced missing files
- some common components had prop mismatches that caused runtime issues
- the doctor module had compile/runtime errors
- the backend seed script pointed to the wrong model path
- backend CORS handling was too rigid for local integration

The codebase is now wired so the frontend builds successfully and the backend app loads correctly.

## Blueprint alignment summary

The project now matches the main blueprint modules:

- patient auth, dashboard, appointments, prescriptions, medical history, reminders, profile, notifications
- doctor auth, profile, verification, availability, appointments, patient details, prescription upload, medical record entry
- admin dashboard, doctor verification queue, users, logs, reports, settings
- backend APIs for auth, doctors, patients, appointments, prescriptions, medical history, reminders, chatbot, admin, automation

Public marketing pages from the blueprint are present in lightweight form:

- `/`
- `/about`
- `/contact`
- `/faq`

The `/doctors` public flow currently redirects into the booking experience instead of having a fully separate public doctor catalog/details implementation.

## Prerequisites

Install:

- Node.js LTS
- npm

Verify:

```bash
node --version
npm --version
```

## Backend setup

Go to:

```bash
cd hospital-backend
```

Install dependencies:

```bash
npm install
```

Update `hospital-backend/.env`.

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

- the backend starts without Cloudinary/Gmail/Twilio filled in
- upload/email/SMS features need those credentials before they can work end-to-end

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

Health checks:

- `http://localhost:5000/health`
- `http://localhost:5000/api/health`

## Frontend setup

Open a second terminal:

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

## Local run flow

Start both apps:

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

## Main accounts and flows

Admin:

- login with `admin@hospital.com` / `Admin@123456`

Patient:

- register from `/register/patient`
- login and access patient dashboard

Doctor:

- register from `/register/doctor`
- submit verification docs
- admin approves from `/admin/doctors/pending`

## Build and verification

Verified during this integration:

- frontend production build: `npm run build` in `hospital-app`
- backend app load: `node -e "require('./src/app')"`
- backend seed: `npm run seed`

## Important notes

- CORS is configured for local frontend origins and supports `withCredentials`
- frontend API calls use `VITE_API_URL`
- token refresh remains wired through the frontend axios client
- if MongoDB Atlas blocks access, allow your IP or allow access from anywhere for development
- if uploads fail later, add Cloudinary credentials to the backend `.env`
- if emails fail later, add Gmail app password credentials to the backend `.env`

## Folder structure

```text
hospital-fullstack/
├── hospital-app/
└── hospital-backend/
```
