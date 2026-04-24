# Deployment Guide

This project is split into:
- Backend API in `backend`
- React frontend in `frontend`

## 1) Deploy Backend on Render

### Option A: Blueprint deploy (recommended)
1. Push current code to GitHub.
2. In Render, click New > Blueprint.
3. Select this repo.
4. Render auto-detects `render.yaml` from project root.
5. Set env vars in Render dashboard:
   - `USER_ID`
   - `EMAIL_ID`
   - `COLLEGE_ROLL_NUMBER`
6. Deploy.

### Option B: Manual web service
1. New > Web Service.
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the same 3 env vars above.

After deploy, your API URL looks like:
- `https://<your-backend>.onrender.com/bfhl`

## 2) Deploy Frontend on Vercel

1. Import repo in Vercel.
2. Set project root to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env var:
   - `VITE_API_URL` = your Render backend BFHL endpoint
     - Example: `https://<your-backend>.onrender.com/bfhl`
6. Deploy.

`frontend/vercel.json` is already added for SPA routing.

## 3) Quick local sanity check before deploy

### Backend
```powershell
cd backend
npm install
npm start
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

Open frontend URL shown by Vite (usually `http://localhost:5173`) and verify requests hit backend.

## 4) Submission links to keep ready
- Public GitHub repo URL
- Live backend URL (`/bfhl`)
- Live frontend URL
