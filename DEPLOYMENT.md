# Deployment Guide: Frontend on Vercel, Backend on Render

This project can be deployed as two separate services:
- Backend: Render web service from the `backend` folder
- Frontend: Vercel project from the `frontend` folder

## 1) Deploy backend on Render

### Option A: Use `render.yaml` (recommended)
1. Push this repository to GitHub.
2. In Render, choose New > Blueprint.
3. Select this repository.
4. Render reads `render.yaml` and creates the backend service.
5. Fill all env vars marked as secret (`sync: false`) in Render dashboard.

### Option B: Manual web service
Create a new Web Service with these values:
- Root Directory: `backend`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`

Set backend environment variables in Render:
- Required:
  - `NODE_ENV=production`
  - `MONGODB_URI=<your mongo uri>`
  - `JWT_SECRET=<long random secret>`
  - `JWT_EMAIL_SECRET=<long random secret>`
  - `FRONTEND_URL=https://your-frontend.vercel.app`
- Recommended:
  - `BACKEND_PUBLIC_URL=https://your-backend.onrender.com`
- Optional (feature based):
  - Cloudinary keys for uploads
  - Email SMTP values for email flows
  - Twilio values for SMS/call reminders

After deploy, verify:
- `https://your-backend.onrender.com/health`
- `https://your-backend.onrender.com/api/health`

If you need multiple frontend origins for CORS, you can set `FRONTEND_URL` as comma-separated values.
Example: `https://your-frontend.vercel.app,https://your-preview.vercel.app`
The first URL is used for email links.

## 2) Deploy frontend on Vercel

1. In Vercel, import this repository.
2. Set Project Root Directory to `frontend`.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add env var:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
7. Deploy.

This repo already includes `frontend/vercel.json` for SPA route rewrites.

## 3) Connect both apps

After Vercel gives you the final domain:
1. Update Render `FRONTEND_URL` to your Vercel URL.
2. Redeploy backend.

If you add a custom frontend domain later, update `FRONTEND_URL` again.

## 4) Production checklist

- Rotate all secrets if any were ever committed locally.
- Ensure MongoDB Atlas network access allows Render outbound IPs or uses broad allowlist with strong credentials.
- Enable Cloudinary if you need persistent file storage (Render local disk is ephemeral).
- Keep `VITE_API_URL` with `/api` suffix.
- Do not include trailing slash in `FRONTEND_URL`.

## 5) Local development still works

Local defaults continue to work:
- Frontend falls back to `http://localhost:5000/api` when `VITE_API_URL` is missing.
- Backend CORS still allows localhost development origins.
