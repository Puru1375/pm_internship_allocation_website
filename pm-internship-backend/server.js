// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const path = require('path');
const cookieParser = require('cookie-parser');

const runAllocationAlgorithm = require('./utils/allocationEngine');
const runExpiryCheck = require('./utils/expiryEngine');

dotenv.config();

// Try to load scoreWorker, but don't fail if Redis is unavailable
try {
  require('./queues/scoreWorker');
  console.log('✅ Score Worker initialized');
} catch (err) {
  console.warn('⚠️ Score Worker disabled (Redis may not be available)');
}

const app = express();

/* ─────────────────────────────
   ✅ MIDDLEWARE
───────────────────────────── */

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",             // Local Frontend
  "http://localhost:5174",
  "https://pminternshipallocation.vercel.app",    // <--- REPLACE THIS with your actual Vercel App URL
  "https://pminternshipallocation.vercel.app",// Add any other variations if you renamed it
  "https://pminternship.online",
  "https://www.pminternship.online" // Add your custom domain if you have one
];

// ✅ CORS Configuration - Allow localhost origins
app.use(
  cors({
    origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      // If the origin is NOT in the list, log it so you can see what url is being blocked
      console.log("Blocked by CORS:", origin); 
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/* ─────────────────────────────
   ✅ CRON JOBS
───────────────────────────── */

cron.schedule('0 * * * *', async () => {
  try {
    await runExpiryCheck();
    await runAllocationAlgorithm();
  } catch (err) {
    console.error('❌ Cron job failed:', err.message);
  }
});

/* ─────────────────────────────
   ✅ ROUTES
───────────────────────────── */

// Auth
app.use('/api/auth', require('./routes/authRoutes'));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Core APIs
app.use('/api/intern', require('./routes/internRoutes'));
app.use('/api/company', require('./routes/companyRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin/analytics', require('./routes/analyticsRoutes'));
app.use('/api/map', require('./routes/mapRoutes'));

// Manual trigger (admin use)
app.post('/api/admin/trigger-allocation', async (req, res) => {
  await runAllocationAlgorithm();
  res.json({ message: 'Allocation Engine triggered successfully' });
});

/* ─────────────────────────────
   ✅ GLOBAL ERROR HANDLER
───────────────────────────── */

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

/* ─────────────────────────────
   ✅ START SERVER
───────────────────────────── */

/* ─────────────────────────────
   ✅ UNHANDLED ERROR HANDLERS
───────────────────────────── */

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('✅ All routes loaded - JWE encryption fixed');
});
