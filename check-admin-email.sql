-- Run this SQL query in your PostgreSQL database to check admin users

-- Check current admin users and their emails
SELECT id, email, role, created_at 
FROM users 
WHERE role = 'admin';

-- If you need to update your admin email to viyomjagtap2@gmail.com, run:
-- UPDATE users SET email = 'viyomjagtap2@gmail.com' WHERE role = 'admin' AND id = YOUR_ADMIN_ID;

-- To verify the update:
-- SELECT id, email, role FROM users WHERE role = 'admin';
