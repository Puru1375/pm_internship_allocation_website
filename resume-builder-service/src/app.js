const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler.middleware');

// Routes
const resumeRoutes = require('./routes/resume.routes');

const app = express();

/* -------------------- Middleware -------------------- */
app.use(helmet({
  contentSecurityPolicy: false // Required for Puppeteer PDFs
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* -------------------- Static Files -------------------- */
app.use(
  '/resumes',
  express.static(path.join(__dirname, '../public/resumes'))
);

/* -------------------- Health Check -------------------- */
app.get('/health', (req, res) => {
  res.json({
    service: 'resume-builder-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/* -------------------- API Routes -------------------- */
app.use('/api/resumes', resumeRoutes);

/* -------------------- 404 Handler -------------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/* -------------------- Error Handler -------------------- */
app.use(errorHandler);

/* -------------------- Start Server -------------------- */
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Resume Builder Service running on port ${PORT}`);
  console.log(`📦 Environment: ${config.nodeEnv}`);
});

module.exports = app;
