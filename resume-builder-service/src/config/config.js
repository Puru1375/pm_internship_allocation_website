require('dotenv').config();
const path = require('path');

/**
 * ✅ Database Configuration
 * Supports:
 * - Supabase / Cloud DB via DATABASE_URL
 * - Local PostgreSQL via individual DB_* env variables
 */

const getDatabaseConfig = () => {
  // DATABASE_URL (Supabase/Cloud) - REQUIRED
  if (!process.env.DATABASE_URL) {
    throw new Error(
      '❌ DATABASE_URL environment variable is required for database connection. ' +
      'Set DATABASE_URL to your Supabase PostgreSQL connection string.'
    );
  }

  console.log('✅ Using DATABASE_URL for Supabase connection');
  return {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
};

module.exports = {
  port: process.env.PORT || 5004,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: getDatabaseConfig(),
  
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