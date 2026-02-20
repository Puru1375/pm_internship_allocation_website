const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwtService = require('../auth/JwtService');
const crypto = require('crypto');
// const { sendEmail } = require('../utils/emailService');  // ✅ COMMENTED OUT - Email service disabled
const { recordFailedAttempt, clearFailedAttempts, getRemainingAttempts, MAX_ATTEMPTS } = require('../middleware/rateLimitMiddleware');
const { verifyCaptcha } = require('../utils/captchaVerifier');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ✅ Updated: Generate JWE token instead of JWT
async function generateSecureToken(userId) {
  const claims = jwtService.buildClaims(userId);
  const signedJwt = jwtService.signJwt(claims);
  const encryptedJwe = await jwtService.encryptJwt(signedJwt);
  return encryptedJwe;
}

// @desc    Register a new user
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
  const { 
    email, password, role, fullName,
    // Company-specific fields
    companyType, description, websiteUrl, address, city, state, pincode, gstNumber, panNumber
  } = req.body;

  try {
    // Validate required fields
    if (!email || !password || !role || !fullName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate company-specific fields
    if (role === 'company') {
      if (!companyType || !description || !address || !city || !state || !pincode || !gstNumber || !panNumber) {
        console.error('Missing company fields:', { companyType, description, address, city, state, pincode, gstNumber, panNumber });
        return res.status(400).json({ message: 'All company details are required for registration' });
      }
    }

    // Normalize email (case-insensitive)
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists (case-insensitive)
    const userExists = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60000); // 10 mins from now

    // Check if email service is enabled
    const ENABLE_EMAIL_SERVICE = (process.env.ENABLE_EMAIL_SERVICE === 'true');
    const isVerified = !ENABLE_EMAIL_SERVICE; // Auto-verify if email is disabled

    // Insert user
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, role, otp_code, otp_expires_at, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [normalizedEmail, hashedPassword, role, otp, expiry, isVerified]
    );
    const userId = newUser.rows[0].id;

    // Create profile based on role
    if (role === 'intern') {
      await pool.query(
        'INSERT INTO intern_profiles (user_id, name, email, profile_completion) VALUES ($1, $2, $3, $4)',
        [userId, fullName, normalizedEmail, 0]
      );
      console.log('✅ Intern profile created with profile_completion initialized to 0');
    } else if (role === 'company') {
      console.log('Inserting company profile:', { userId, fullName, companyType, description, websiteUrl, address, city, state, pincode, gstNumber, panNumber });
      
      await pool.query(
        `INSERT INTO company_profiles 
        (user_id, company_name, company_type, description, website_url, address, city, state, pincode, gst_number, pan_number, verification_status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')`,
        [userId, fullName, companyType, description, websiteUrl || null, address, city, state, pincode, gstNumber, panNumber]
      );
      
      console.log('Company profile created successfully for user:', userId);
    }

// Send verification email (COMMENTED OUT - Email service disabled)
    // try {
    //   if (ENABLE_EMAIL_SERVICE) {
    //     await sendEmail(normalizedEmail, "Verify Your Account - SkillBridge", `...`);
    //   } else {
    //     console.log("📧 [EMAIL SERVICE DISABLED] Skipping verification email. User auto-verified.");
    //   }
    // } catch (emailError) {
    //   if (ENABLE_EMAIL_SERVICE) {
    //     console.error("⚠️ Email sending failed:", emailError.message);
    //     await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    //     return res.status(400).json({ 
    //       message: emailError.message || "Invalid Email Address. Could not send OTP." 
    //     });
    //   }
    // }

    // Success - Return OTP in response (for development)
    const successMessage = role === 'company' 
      ? 'Registration successful! Your company profile will be reviewed by admin.' 
      : 'Registration successful!';

    const responseData = { 
      success: true,
      message: successMessage,
      userId, 
      email: normalizedEmail,
      // ✅ Always show OTP since email service is disabled - display in page for user to verify
      otp: otp,
      otpExpiresIn: '10 minutes',
      nextStep: 'Please enter the OTP below to verify your email'
    };

    res.status(201).json(responseData);

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Normalize email for case-insensitive lookup
    const normalizedEmail = email.trim().toLowerCase();
    const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (userResult.rows.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = userResult.rows[0];

    // Check OTP Match
    if (user.otp_code !== otp.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP. Please check and try again.',
        attemptsRemaining: 3  // Could implement actual attempt tracking
      });
    }

    // Check OTP Expiry
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please register again.' 
      });
    }

    // Mark Verified
    await pool.query('UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE id = $1', [user.id]);

    res.json({ 
      success: true, 
      message: 'Email Verified Successfully! You can now login.',
      userId: user.id,
      verified: true
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user & get JWE token
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
  const { email, password, captchaToken } = req.body;

  console.log('🔐 Login attempt for:', email);

  try {
    // 1. Verify CAPTCHA first (before any database queries)
    console.log('🤖 Verifying CAPTCHA...');
    
    if (!captchaToken) {
      console.log('❌ CAPTCHA token missing');
      return res.status(400).json({ 
        message: 'CAPTCHA verification is required. Please complete the verification.',
        error: 'CAPTCHA_REQUIRED'
      });
    }

    const captchaResult = await verifyCaptcha(captchaToken, req.ip);
    
    if (!captchaResult.success) {
      console.log('❌ CAPTCHA verification failed:', captchaResult.message);
      return res.status(400).json({ 
        message: captchaResult.message || 'CAPTCHA verification failed. Please try again.',
        error: 'CAPTCHA_VERIFICATION_FAILED',
        errorCode: captchaResult.errorCode
      });
    }
    
    console.log('✅ CAPTCHA verified successfully');

    // Normalize email for case-insensitive lookup
    const normalizedEmail = email.trim().toLowerCase();
    
    // 1. Check User
    console.log('📝 Checking user in database...');
    const user = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (user.rows.length === 0) {
      console.log('❌ User not found');
      const attemptCount = recordFailedAttempt(normalizedEmail);
      const remaining = getRemainingAttempts(normalizedEmail);
      return res.status(400).json({ 
        message: 'Invalid credentials',
        remainingAttempts: remaining,
        attemptsUsed: attemptCount
      });
    }
    console.log('✅ User found:', user.rows[0].id);

    // 2. Check Password
    console.log('🔑 Verifying password...');
    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      const attemptCount = recordFailedAttempt(normalizedEmail);
      const remaining = getRemainingAttempts(normalizedEmail);
      return res.status(400).json({ 
        message: 'Invalid credentials',
        remainingAttempts: remaining,
        attemptsUsed: attemptCount
      });
    }
    console.log('✅ Password verified');

    // Clear any previous failed attempts on successful login
    clearFailedAttempts(normalizedEmail);

    if (!user.rows[0].is_verified) {
      console.log('❌ Email not verified');
      return res.status(403).json({ message: 'Email not verified. Please verify your account.' });
    }
    console.log('✅ Email is verified');

    // 3. Company admin verification gating
    // Allow login for Pending/Under Review so documents can be uploaded; block only if Rejected
    if (user.rows[0].role === 'company') {
      const companyProfile = await pool.query('SELECT verification_status FROM company_profiles WHERE user_id = $1', [user.rows[0].id]);
      if (companyProfile.rows.length > 0) {
        const status = companyProfile.rows[0].verification_status;
        if (status === 'Rejected') {
          return res.status(403).json({ message: 'Your company was rejected. Please contact support.' });
        }
      }
    }

    // 4. Get specific profile details
    console.log('📋 Fetching profile data for role:', user.rows[0].role);
    let profileData = {};
    let profileCompletion = 0;
    
    if (user.rows[0].role === 'intern') {
        try {
            const p = await pool.query('SELECT name, id, profile_completion FROM intern_profiles WHERE user_id = $1', [user.rows[0].id]);
            console.log('📊 Intern profile query result:', p.rows[0]);
            if(p.rows.length > 0) {
                profileData = { name: p.rows[0].name, profileId: p.rows[0].id };
                const rawCompletion = p.rows[0].profile_completion;
                console.log('📊 Raw profile_completion from DB:', rawCompletion, 'Type:', typeof rawCompletion, 'Is NULL?:', rawCompletion === null, 'Is undefined?:', rawCompletion === undefined);
                profileCompletion = (rawCompletion !== null && rawCompletion !== undefined) ? Number(rawCompletion) : 0;
                console.log('✅ Intern profile found, final completion score to send:', profileCompletion);
            }
        } catch (profileErr) {
            console.warn('⚠️ Error fetching profile_completion (column may not exist):', profileErr.message);
            // Fallback: try without profile_completion column
            const p = await pool.query('SELECT name, id FROM intern_profiles WHERE user_id = $1', [user.rows[0].id]);
            if(p.rows.length > 0) {
                profileData = { name: p.rows[0].name, profileId: p.rows[0].id };
                profileCompletion = 0;
                console.log('✅ Intern profile found (using fallback), completion:', profileCompletion);
            }
        }
    } else if (user.rows[0].role === 'company') {
        const p = await pool.query('SELECT company_name, id FROM company_profiles WHERE user_id = $1', [user.rows[0].id]);
        if(p.rows.length > 0) {
            profileData = { name: p.rows[0].company_name, profileId: p.rows[0].id };
            console.log('✅ Company profile found');
        }
    }

    // ✅ Generate JWE token (encrypted)
    console.log('🔐 Generating JWE token...');
    let jweToken;
    try {
      jweToken = await generateSecureToken(user.rows[0].id);
      console.log('✅ JWE token generated successfully for user:', user.rows[0].id);
      console.log('📦 Token length:', jweToken.length, 'chars');
    } catch (jweError) {
      console.error('❌ JWE token generation failed:', jweError);
      console.error('❌ Error stack:', jweError.stack);
      return res.status(500).json({ 
        message: 'Failed to generate authentication token',
        error: process.env.NODE_ENV === 'development' ? jweError.message : undefined
      });
    }

    console.log('✅ Sending successful login response with profile_completion:', profileCompletion);
    res.json({
      success: true,
      id: user.rows[0].id,
      email: user.rows[0].email,
      role: user.rows[0].role,
      profile_completion: profileCompletion,
      ...profileData,
      token: jweToken  // ✅ Returns encrypted JWE token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Normalize email for case-insensitive lookup
    const normalizedEmail = email.trim().toLowerCase();
    const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    // Generate OTP
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60000); // 10 mins

    // Store OTP in database
    await pool.query('UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE email = $3', [otp, expiry, normalizedEmail]);

    // Send Email with OTP (COMMENTED OUT - Email service disabled)
    // try {
    //   await sendEmail(normalizedEmail, "Password Reset OTP - SkillBridge", `...`);
    //   res.json({ message: 'OTP sent to your email' });
    // } catch (err) {
    //   console.error(err);
    //   res.status(500).json({ message: 'Server error' });
    // }

    // ✅ Return OTP in response for development
    res.json({ 
      success: true,
      message: 'OTP generated for password reset',
      email: normalizedEmail,
      // ✅ Show OTP in development
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      expiresIn: '10 minutes'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Validate required fields
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Fetch user
    const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = userResult.rows[0];

    // Check OTP validity
    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check OTP expiry
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP
    await pool.query(
      'UPDATE users SET password_hash = $1, otp_code = NULL, otp_expires_at = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Check if email is available (not registered)
 * @route   POST /api/auth/check-email
 * @access  Public
 */
exports.checkEmailAvailability = async (req, res) => {
  const { email } = req.query; // Changed from req.body to req.query for GET request

  try {
    // Validate email input
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        available: false,
        message: 'Email is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        available: false,
        message: 'Invalid email format' 
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email exists in database
    const result = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (result.rows.length > 0) {
      // Email already registered
      return res.status(200).json({ 
        available: false,
        message: 'This email is already registered. Please use a different email or login.' 
      });
    }

    // Email is available
    res.status(200).json({ 
      available: true,
      message: 'Email is available for registration' 
    });

  } catch (err) {
    console.error('Check email error:', err);
    res.status(500).json({ 
      available: false,
      message: 'Failed to check email availability. Please try again.' 
    });
  }
};