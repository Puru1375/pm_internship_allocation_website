require('dotenv').config();
const path = require('path');

const dbPassword = process.env.DB_PASSWORD;

module.exports = {
  port: process.env.PORT || 5004,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pm_internship_db',
    user: process.env.DB_USER || 'postgres',
    // Ensure password is always a string; fall back to example value for local dev
    password: (typeof dbPassword === 'string' && dbPassword.length > 0) 
      ? dbPassword 
      : 'Purvanshu13',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '7d'
  },
  
  storage: {
    resumePath: process.env.RESUME_STORAGE_PATH || path.join(__dirname, '../../public/resumes'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
  },
  
  pdf: {
    chromiumPath: process.env.CHROMIUM_PATH
  }
};