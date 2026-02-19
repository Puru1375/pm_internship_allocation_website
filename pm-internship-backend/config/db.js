// db.js
const { Pool } = require('pg');
require('dotenv').config();

/**
 * ✅ Database Configuration
 * Supports:
 * - Docker (POSTGRES_*)
 * - Local .env (DB_*)
 */
const pool = new Pool({
  user: process.env.POSTGRES_USER || process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.POSTGRES_DB || process.env.DB_NAME,
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,

  // ✅ Safe pool defaults (won't break current system)
  max: 20,                     // max clients in pool
  idleTimeoutMillis: 30000,    // close idle clients after 30s
  connectionTimeoutMillis: 5000, // fail fast if DB down
});

/**
 * ✅ Retry-safe Connection Logic
 * Ensures backend survives DB restarts (Docker / local)
 */
const connectWithRetry = () => {
  console.log('⏳ Attempting to connect to PostgreSQL...');

  pool
    .connect()
    .then((client) => {
      console.log('✅ PostgreSQL connected successfully');
      client.release();
    })
    .catch((err) => {
      console.error(
        '❌ PostgreSQL connection failed. Retrying in 5 seconds...\n',
        err.message
      );
      setTimeout(connectWithRetry, 5000);
    });
};

// 🔁 Initial connection attempt
connectWithRetry();

/**
 * ✅ Backward-Compatible Export
 * - Existing code using db.query() will WORK unchanged
 * - New features can use getClient() for transactions
 */
module.exports = {
  /**
   * Run a SQL query
   * @param {string} text
   * @param {Array} params
   */
  query: (text, params) => pool.query(text, params),

  /**
   * ✅ Optional: Get raw client (for transactions)
   */
  getClient: () => pool.connect(),

  /**
   * ✅ Optional: Graceful shutdown support
   */
  close: async () => {
    console.log('🔌 Closing PostgreSQL pool...');
    await pool.end();
  },
};
