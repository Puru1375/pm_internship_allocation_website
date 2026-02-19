const { Pool } = require('pg');
const config = require('../config/config');

if (!config.database.password || typeof config.database.password !== 'string') {
  console.warn('⚠️ DB_PASSWORD not set; using fallback value from config.');
}

const pool = new Pool(config.database);

pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};