// middleware/authMiddleware.js
const pool = require('../config/db');
const jwtService = require('../auth/JwtService');

/**
 * ✅ Enhanced Authentication Middleware
 * Supports both JWE (new) and JWT (fallback for migration)
 */
const protect = async (req, res, next) => {
  try {
    // 1. Check for Authorization Header
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = req.headers.authorization.split(' ')[1];
    let decoded;

    /**
     * ✅ PRIMARY: Try JWE (Encrypted Token)
     */
    try {
      console.log('🔐 Attempting to decrypt JWE token...');
      // Step 1: Decrypt JWE to get signed JWT
      const signedJwt = await jwtService.decryptJwe(token);
      console.log('✅ JWE decrypted successfully');
      console.log('📝 Decrypted JWT (first 50 chars):', signedJwt.substring(0, 50));
      console.log('📝 Decrypted JWT length:', signedJwt.length);
      
      // Step 2: Verify the signed JWT
      decoded = jwtService.verifyJwt(signedJwt);
      console.log('✅ JWT verified successfully, userId:', decoded.sub);
    } catch (jweError) {
      console.error('❌ JWE decryption/verification failed:', jweError.message);
      /**
       * ⚠️ FALLBACK: Try old JWT format (for migration period)
       * Remove this block after all users have migrated to JWE
       */
      console.warn('Attempting JWT fallback format...');
      
      try {
        const jwt = require('jsonwebtoken');
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('⚠️ Using deprecated JWT format - please re-login for JWE');
      } catch (jwtError) {
        console.error('❌ Both JWE and JWT verification failed');
        return res.status(401).json({ 
          message: 'Invalid or expired token. Please login again.' 
        });
      }
    }

    // 2. Extract User ID (supports both formats)
    const userId = decoded.sub || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token structure' });
    }

    // 3. Fetch User from Database
    const user = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'User not found or has been deleted' });
    }

    // 4. Attach User to Request
    req.user = user.rows[0];
    
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(401).json({ message: 'Authentication failed. Please login again.' });
  }
};

/**
 * ✅ Optional: Role-Based Access Control Middleware
 * Usage: router.get('/admin-route', protect, requireRole('admin'), handler)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = { protect, requireRole };