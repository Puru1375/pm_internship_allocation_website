// Google reCAPTCHA verification utility
const https = require('https');
const querystring = require('querystring');

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'; // Test secret key

/**
 * Map reCAPTCHA error codes to user-friendly messages
 */
const ERROR_MESSAGES = {
  'missing-input-secret': 'CAPTCHA configuration error. Please contact support.',
  'invalid-input-secret': 'CAPTCHA configuration error. Please contact support.',
  'missing-input-response': 'CAPTCHA verification required. Please try again.',
  'invalid-input-response': 'CAPTCHA verification failed. Please refresh and try again.',
  'bad-request': 'Invalid CAPTCHA request. Please refresh the page.',
  'timeout-or-duplicate': 'CAPTCHA expired or already used. Please verify again.'
};

/**
 * Verify reCAPTCHA token with Google
 * @param {string} token - reCAPTCHA token from frontend
 * @param {string} remoteip - User's IP address (optional)
 * @returns {Promise<{success: boolean, score?: number, action?: string, message?: string}>}
 */
async function verifyCaptcha(token, remoteip = null) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.log('❌ CAPTCHA: Missing or invalid token');
        return resolve({
          success: false,
          message: 'CAPTCHA verification required. Please complete the verification.'
        });
      }

      // Check if using test key in production
      if (process.env.NODE_ENV === 'production' && RECAPTCHA_SECRET_KEY === '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe') {
        console.warn('⚠️ WARNING: Using test reCAPTCHA key in production!');
      }

      // Build request data
      const postData = querystring.stringify({
        secret: RECAPTCHA_SECRET_KEY,
        response: token.trim(),
        ...(remoteip && { remoteip })
      });

      const options = {
        hostname: 'www.google.com',
        port: 443,
        path: '/recaptcha/api/siteverify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000 // 10 second timeout
      };

      console.log('🤖 Verifying CAPTCHA with Google...');

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const duration = Date.now() - startTime;
          
          try {
            const result = JSON.parse(data);
            console.log(`📋 CAPTCHA verification completed in ${duration}ms:`, {
              success: result.success,
              hostname: result.hostname,
              challenge_ts: result.challenge_ts,
              errors: result['error-codes']
            });

            if (!result.success) {
              const errorCodes = result['error-codes'] || [];
              const errorCode = errorCodes[0] || 'unknown-error';
              const errorMessage = ERROR_MESSAGES[errorCode] || 'CAPTCHA verification failed. Please try again.';
              
              console.error(`❌ CAPTCHA verification failed: ${errorCode}`, errorCodes);
              
              return resolve({
                success: false,
                message: errorMessage,
                errors: errorCodes,
                errorCode: errorCode
              });
            }

            // Successful verification
            console.log(`✅ CAPTCHA verified successfully in ${duration}ms`);
            
            return resolve({
              success: true,
              hostname: result.hostname,
              challenge_ts: result.challenge_ts,
              score: result.score, // Only for v3
              action: result.action // Only for v3
            });
            
          } catch (parseError) {
            console.error('❌ Error parsing CAPTCHA response:', parseError);
            console.error('Raw response:', data);
            return resolve({
              success: false,
              message: 'Failed to parse CAPTCHA verification response. Please try again.'
            });
          }
        });
      });

      req.on('error', (error) => {
        const duration = Date.now() - startTime;
        console.error(`❌ CAPTCHA verification request error after ${duration}ms:`, error.message);
        return resolve({
          success: false,
          message: 'Network error during CAPTCHA verification. Please check your connection and try again.'
        });
      });

      req.on('timeout', () => {
        req.destroy();
        console.error('❌ CAPTCHA verification timeout after 10s');
        return resolve({
          success: false,
          message: 'CAPTCHA verification timed out. Please try again.'
        });
      });

      req.write(postData);
      req.end();

    } catch (error) {
      console.error('❌ CAPTCHA verification error:', error);
      return resolve({
        success: false,
        message: 'CAPTCHA verification failed due to server error. Please try again.'
      });
    }
  });
}

/**
 * Middleware to verify CAPTCHA (optional helper)
 */
const verifyCaptchaMiddleware = async (req, res, next) => {
  const { captchaToken } = req.body;
  
  const result = await verifyCaptcha(captchaToken, req.ip);
  
  if (!result.success) {
    return res.status(400).json({
      message: result.message || 'CAPTCHA verification failed',
      error: 'CAPTCHA_VERIFICATION_FAILED'
    });
  }
  
  // Store verification result in request
  req.captchaVerified = true;
  req.captchaResult = result;
  next();
};

module.exports = { verifyCaptcha, verifyCaptchaMiddleware };
