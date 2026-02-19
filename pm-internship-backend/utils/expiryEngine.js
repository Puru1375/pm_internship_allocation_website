const pool = require('../config/db');

const runExpiryCheck = async () => {
  console.log('⏳ Checking for Expired Jobs...');

  try {
    // Update jobs where deadline has passed AND status is still Active
    const result = await pool.query(`
      UPDATE jobs 
      SET status = 'Closed' 
      WHERE status = 'Active' 
      AND deadline < NOW()
      RETURNING id, title
    `);

    if (result.rowCount > 0) {
      console.log(`🔒 Auto-Closed ${result.rowCount} jobs due to deadline expiry.`);
      result.rows.forEach(job => console.log(`   - ${job.title}`));
    }

  } catch (err) {
    console.error('Expiry Check Error:', err.message);
  }
};

module.exports = runExpiryCheck;