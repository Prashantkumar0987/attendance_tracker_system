# AttendTrack — Smart Attendance Management System

A full-stack attendance tracking system built with **React**, **Node.js/Express**, and **MongoDB**.

## 🏗️ Project Structure
```
attendance_tracker_system/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── routes/
│   ├── server.js
│   └── .env          ← Configure this!
└── frontend/         # React + Vite
    └── src/
        ├── api/
        ├── components/
        ├── context/
        └── pages/
```

## 🚀 Quick Start

### 1. Configure Backend `.env`
```bash
# backend/.env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/attendance_tracker
JWT_SECRET=your_secure_secret_here
JWT_EXPIRES_IN=7d
```

### 2. Start Backend
```bash
cd backend
npm run dev
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

Visit: **http://localhost:5173**

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login + get JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/students` | List students (paginated) |
| POST | `/api/students` | Add student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Remove student |
| POST | `/api/attendance` | Mark attendance (bulk) |
| GET | `/api/attendance` | Get attendance records |
| GET | `/api/attendance/analytics` | Dashboard analytics |
| GET | `/api/attendance/report/:studentId` | Student report |

## 🔐 Roles
- **admin** — full access (add/delete students, view all)
- **teacher** — mark attendance, add students, view reports

## ☁️ Deployment
- **Frontend** → Vercel (`vercel --prod` in /frontend)
- **Backend** → Render/Railway (set env vars in dashboard)
- **Database** → MongoDB Atlas (free tier)
