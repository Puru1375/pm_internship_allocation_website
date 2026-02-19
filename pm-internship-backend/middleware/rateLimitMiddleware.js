// Rate limiting middleware for login attempts
// Tracks failed login attempts and implements cooldown period

const loginAttempts = new Map(); // Store: { email: { count, firstAttempt, lockedUntil } }

const MAX_ATTEMPTS = 4; // Maximum allowed failed attempts
const COOLDOWN_PERIOD = 60 * 60 * 1000; // 1 hour in milliseconds
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window for counting attempts

/**
 * Middleware to rate limit login attempts
 * Blocks user after MAX_ATTEMPTS failed logins for COOLDOWN_PERIOD
 */
const loginRateLimiter = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const attemptData = loginAttempts.get(normalizedEmail);

  console.log(`\n🔍 Rate Limiter Check for: ${normalizedEmail}`);
  console.log(`📊 Current attempt data:`, attemptData);
  console.log(`⏰ Current time:`, new Date(now).toLocaleString());

  // Check if user is currently locked out
  if (attemptData && attemptData.lockedUntil && attemptData.lockedUntil > now) {
    const remainingTime = Math.ceil((attemptData.lockedUntil - now) / 1000 / 60); // minutes
    console.log(`🔒 USER IS LOCKED! Remaining time: ${remainingTime} minutes`);
    console.log(`🔒 Locked until:`, new Date(attemptData.lockedUntil).toLocaleString());
    return res.status(429).json({ 
      message: `Too many failed login attempts. Please try again in ${remainingTime} minutes.`,
      lockedUntil: attemptData.lockedUntil,
      remainingMinutes: remainingTime
    });
  }

  // Reset if cooldown period has passed
  if (attemptData && attemptData.lockedUntil && attemptData.lockedUntil <= now) {
    console.log(`✅ Cooldown expired, resetting attempts`);
    loginAttempts.delete(normalizedEmail);
  }

  // Reset if attempt window has expired
  if (attemptData && attemptData.firstAttempt && (now - attemptData.firstAttempt) > ATTEMPT_WINDOW) {
    console.log(`✅ Attempt window expired (15 mins), resetting attempts`);
    loginAttempts.delete(normalizedEmail);
  }

  console.log(`✅ Rate limiter passed, proceeding to login\n`);

  // Attach email to request for use in success/failure handlers
  req.attemptEmail = normalizedEmail;
  next();
};

/**
 * Record a failed login attempt
 * Call this after password verification fails
 */
const recordFailedAttempt = (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const attemptData = loginAttempts.get(normalizedEmail);

  if (!attemptData) {
    // First failed attempt
    loginAttempts.set(normalizedEmail, {
      count: 1,
      firstAttempt: now,
      lockedUntil: null
    });
    console.log(`⚠️ Failed login attempt 1/${MAX_ATTEMPTS} for: ${normalizedEmail}`);
  } else {
    // Increment failed attempts
    attemptData.count += 1;
    console.log(`⚠️ Failed login attempt ${attemptData.count}/${MAX_ATTEMPTS} for: ${normalizedEmail}`);

    // Lock account if max attempts reached
    if (attemptData.count >= MAX_ATTEMPTS) {
      attemptData.lockedUntil = now + COOLDOWN_PERIOD;
      console.log(`🔒 Account locked for 1 hour: ${normalizedEmail}`);
    }

    loginAttempts.set(normalizedEmail, attemptData);
  }

  return attemptData?.count || 1;
};

/**
 * Clear failed attempts on successful login
 */
const clearFailedAttempts = (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  if (loginAttempts.has(normalizedEmail)) {
    loginAttempts.delete(normalizedEmail);
    console.log(`✅ Cleared failed attempts for: ${normalizedEmail}`);
  }
};

/**
 * Get remaining attempts before lockout
 */
const getRemainingAttempts = (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const attemptData = loginAttempts.get(normalizedEmail);
  
  if (!attemptData) {
    return MAX_ATTEMPTS;
  }

  return Math.max(0, MAX_ATTEMPTS - attemptData.count);
};

module.exports = {
  loginRateLimiter,
  recordFailedAttempt,
  clearFailedAttempts,
  getRemainingAttempts,
  MAX_ATTEMPTS
};
