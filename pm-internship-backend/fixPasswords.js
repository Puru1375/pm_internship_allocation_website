const pool = require('./config/db');
const bcrypt = require('bcryptjs');

const fix = async () => {
  // The password you want to use for logging in
  const newPassword = '1234567890'; 
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

  try {
    // Update all test users to have this valid hashed password
    await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE email IN ('test_comp@test.com', 'gen_high@test.com', 'gen_mid@test.com', 'sc_low@test.com')`, 
      [hash]
    );
    console.log('✅ Passwords updated! You can now login with "password123"');
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

fix();