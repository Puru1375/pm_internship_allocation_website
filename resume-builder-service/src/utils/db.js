const { Pool } = require('pg');
const config = require('../config/config');

/**
 * ✅ Database Pool
 * Supports both Supabase (DATABASE_URL) and Local PostgreSQL
 */
const pool = new Pool(config.database);

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

// Initial connection attempt
connectWithRetry();

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};