require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const studentRoutes = require('./src/routes/students');
const attendanceRoutes = require('./src/routes/attendance');

const app = express();

// ====================
// 🔒 Rate Limiting
// ====================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ====================
// 🌐 Middleware
// ====================
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ====================
// 📌 Routes
// ====================
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

// ====================
// ❤️ Health Check
// ====================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Attendance Tracker API is running.',
    timestamp: new Date()
  });
});

// ====================
// ❌ 404 Handler
// ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`
  });
});

// ====================
// ⚠️ Global Error Handler
// ====================
app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ====================
// 🚀 DB + Server Start
// ====================
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    let uri = process.env.MONGODB_URI;

    // ❌ If no cloud DB, fallback to local
    if (!uri) {
      console.log('⚠️ No MONGODB_URI found, using local MongoDB...');
      uri = 'mongodb://127.0.0.1:27017/attendance';
    }

    console.log('🔌 Connecting to MongoDB...');
    console.log('DB Type:', uri.startsWith('mongodb+srv') ? 'Atlas (Cloud)' : 'Local');

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB Connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
