import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaError, setCaptchaError] = useState(false);
  const captchaRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const logoUrl = '/skillbridge_logo.png';

  // CAPTCHA site key (Replace with your own from Google reCAPTCHA)
  const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key - replace in production

  useEffect(() => {
    // Load reCAPTCHA and render it programmatically
    const loadCaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.render && captchaRef.current) {
        try {
          // Clear any existing widget
          if (captchaRef.current.children.length === 0) {
            window.grecaptcha.render(captchaRef.current, {
              sitekey: RECAPTCHA_SITE_KEY,
              callback: onCaptchaChange,
              'expired-callback': onCaptchaExpired,
              'error-callback': onCaptchaError,
              theme: 'light',
              size: 'normal'
            });
            console.log('✅ reCAPTCHA widget rendered');
          }
        } catch (err) {
          console.error('Error rendering reCAPTCHA:', err);
        }
      }
    };

    // Wait for grecaptcha to be ready
    if (window.grecaptcha && window.grecaptcha.ready) {
      window.grecaptcha.ready(() => {
        loadCaptcha();
      });
    } else {
      // Fallback: wait for script to load
      const checkInterval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          clearInterval(checkInterval);
          window.grecaptcha.ready(() => {
            loadCaptcha();
          });
        }
      }, 100);

      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
  }, []);

  /**
   * Handle CAPTCHA verification success
   */
  const onCaptchaChange = (token) => {
    console.log('✅ CAPTCHA verified successfully');
    setCaptchaToken(token);
    setCaptchaError(false);
    
    // Clear CAPTCHA validation error
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.captcha;
      return newErrors;
    });
  };

  /**
   * Handle CAPTCHA expiration
   */
  const onCaptchaExpired = () => {
    console.log('⚠️ CAPTCHA expired - please verify again');
    setCaptchaToken(null);
    setCaptchaError(true);
    setValidationErrors(prev => ({
      ...prev,
      captcha: 'CAPTCHA expired. Please verify again.'
    }));
  };

  /**
   * Handle CAPTCHA error
   */
  const onCaptchaError = () => {
    console.error('❌ CAPTCHA error occurred');
    setCaptchaToken(null);
    setCaptchaError(true);
    setValidationErrors(prev => ({
      ...prev,
      captcha: 'CAPTCHA error. Please refresh and try again.'
    }));
  };

  /**
   * Reset CAPTCHA widget
   */
  const resetCaptcha = () => {
    if (window.grecaptcha) {
      try {
        window.grecaptcha.reset();
        setCaptchaToken(null);
        setCaptchaError(false);
        console.log('🔄 CAPTCHA reset');
      } catch (err) {
        console.error('Error resetting CAPTCHA:', err);
      }
    }
  };

  /**
   * Validates email format
   * @param {string} emailValue - Email to validate
   * @returns {boolean} - True if valid
   */
  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  /**
   * Validates password strength
   * @param {string} passwordValue - Password to validate
   * @returns {boolean} - True if valid
   */
  const validatePassword = (passwordValue) => {
    return passwordValue && passwordValue.length >= 6;
  };

  /**
   * Validates all form fields
   * @returns {boolean} - True if all fields are valid
   */
  const validateForm = () => {
    const errors = {};

    // Validate email
    if (!email || !email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!password || !password.trim()) {
      errors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Validate CAPTCHA
    if (!captchaToken) {
      errors.captcha = 'Please complete the CAPTCHA verification';
      setCaptchaError(true);
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Clears all error messages
   */
  const clearErrors = () => {
    setError(null);
    setValidationErrors({});
    setSuccess(false);
    setCaptchaError(false);
  };

  /**
   * Handles user login with comprehensive error handling
   */
  const handleLogin = async (e) => {
    try {
      e.preventDefault();
      clearErrors();
      setLoading(true);

      // Validate form before submission
      if (!validateForm()) {
        setError('Please fix the errors below and try again');
        setLoading(false);
        return;
      }

      // Sanitize inputs
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      // Attempt login with CAPTCHA token
      const result = await login(trimmedEmail, trimmedPassword, captchaToken);
      console.log('Login result:', result);
      
      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from server');
      }

      if (result.success) {
        setSuccess(true);
        const selectedRole = result.userRole;
        
        // Navigate based on role with error handling
        try {
          // Add small delay to show success message
          setTimeout(() => {
            if (selectedRole === 'admin') {
              navigate('/admin');
            } else if (selectedRole === 'company') {
              navigate('/company');
            } else if (selectedRole === 'intern') {
              navigate('/intern');
            } else {
              throw new Error(`Unknown role: ${selectedRole}`);
            }
          }, 800);
        } catch (navErr) {
          console.error('Navigation error:', navErr);
          setError('Failed to navigate to dashboard. Please try again.');
          setSuccess(false);
        }
      } else {
        // Handle login failure - could be role mismatch, invalid credentials, or rate limit
        let errorMessage = result.message || 'Login failed. Please check your credentials and role.';
        
        // Check if rate limited
        if (result.isRateLimited && result.remainingMinutes) {
          errorMessage = `🔒 Account Locked!\n\nToo many failed login attempts.\nPlease try again in ${result.remainingMinutes} minutes.`;
        } else if (result.remainingAttempts !== undefined && result.remainingAttempts >= 0) {
          // Show remaining attempts
          if (result.remainingAttempts === 0) {
            errorMessage = `🔒 Account Locked!\n\nYou have exceeded the maximum login attempts.\nPlease wait 1 hour before trying again.`;
          } else if (result.remainingAttempts <= 2) {
            errorMessage = `⚠️ Invalid credentials!\n\nYou have ${result.remainingAttempts} attempt${result.remainingAttempts === 1 ? '' : 's'} remaining before your account is temporarily locked.`;
          } else {
            errorMessage = `Invalid credentials. ${result.remainingAttempts} attempts remaining.`;
          }
        }
        
        setError(errorMessage);
        console.error('Login error:', errorMessage);
        
        // Reset CAPTCHA on failed login
        resetCaptcha();
      }
    } catch (err) {
      // Handle unexpected errors
      console.error('Login exception:', err);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      // Check for CAPTCHA-specific errors
      if (err.message && err.message.includes('CAPTCHA')) {
        errorMessage = err.message;
        setCaptchaError(true);
        setValidationErrors(prev => ({
          ...prev,
          captcha: 'CAPTCHA verification failed. Please try again.'
        }));
      } else if (err instanceof TypeError) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSuccess(false);
      
      // Reset CAPTCHA on error
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles email input change with validation
   */
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    clearErrors();
    
    // Real-time validation
    if (value && !validateEmail(value)) {
      setValidationErrors(prev => ({
        ...prev,
        email: 'Invalid email format'
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  /**
   * Handles password input change
   */
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    clearErrors();
    
    // Real-time validation
    if (value && !validatePassword(value)) {
      setValidationErrors(prev => ({
        ...prev,
        password: 'Password must be at least 6 characters'
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  /**
   * Handles role selection with validation
   */
  // const handleRoleChange = (selectedRole) => {
  //   try {
  //     if (!selectedRole || !['intern', 'company', 'admin'].includes(selectedRole)) {
  //       setError('Invalid role selected');
  //       return;
  //     }
  //     setRole(selectedRole);
  //     clearErrors();
  //   } catch (err) {
  //     console.error('Role selection error:', err);
  //     setError('Failed to change role. Please try again.');
  //   }
  // };

  /**
   * Handles password visibility toggle
   */
  const handleTogglePasswordVisibility = () => {
    try {
      setShowPassword(!showPassword);
    } catch (err) {
      console.error('Toggle password error:', err);
    }
  };

  return (
    <div className="bg-white md:bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      
      {/* Main Container */}
      <div className="w-full max-w-7xl grid md:grid-cols-2 gap-12 items-center">
        
        {/* --- LEFT COLUMN: Branding & Context --- */}
        <div className="hidden md:block pr-8 space-y-6">
          {/* Logo */}
          <div className="h-16 flex items-center border-b border-transparent md:border-none">
          <img src={logoUrl} alt="SkillBridge Logo" style={{height: "110px", width: "180px"}}/>
          <div className="flex flex-col ml-2">
            {/* <span className="text-base text-slate-900 font-bold tracking-tight">SkillBridge</span> */}
            {/* <span className="text-[10px] text-slate-500 -mt-0.5">
              {user?.role === 'intern' ? 'Student Portal' : user?.role === 'company' ? 'Company Portal' : user?.role === 'admin' ? 'Admin Portal' : 'Dashboard'}
            </span> */}
          </div>
          {/* <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-slate-400">
            <X size={20} />
          </button> */}
        </div>

          <h1 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">
            Connecting Talent with <br /> Opportunity
          </h1>
          
          <p className="text-base text-slate-600 max-w-md leading-relaxed">
            The premier platform for students to find meaningful internships and for employers to discover the next generation of talent.
          </p>

          {/* Gradient Box (Matches the image style) */}
          <div className="w-full h-64 rounded-xl overflow-hidden shadow-sm relative mt-8">
             <div className="absolute inset-0 bg-linear-to-br from-[#3b5d88] via-[#8aa1c2] to-[#d6c9d8]"></div>
          </div>
        </div>


        {/* --- RIGHT COLUMN: Login Form --- */}
        <div className="w-full max-w-md mx-auto">

          {/* Error Message Banner with Enhanced Role Validation Info */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 animate-in fade-in">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-red-900 font-semibold text-sm">Login Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                {error.includes('Invalid credentials for') && (
                  <p className="text-red-600 text-xs mt-2 font-medium">
                    💡 Hint: Try a different role or verify your email and password
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Message Banner */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 animate-in fade-in">
              <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-green-900 font-semibold text-sm">Login Successful</p>
                <p className="text-green-700 text-sm mt-1">Redirecting to dashboard...</p>
              </div>
            </div>
          )}
            
          {/* Segmented Control (Tabs) */}
          <div className="bg-slate-100 p-1 rounded-lg flex mb-6">
            <button className="flex-1 bg-white text-slate-900 shadow-sm py-2 rounded-md text-sm font-semibold transition-all">
                Sign In
            </button>
            <Link to="/register" className="flex-1 text-slate-500 hover:text-slate-700 py-2 rounded-md text-sm font-medium text-center transition-all">
                Register
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input with Floating Label */}
            <div className="relative">
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                placeholder=" "
                className={`peer w-full px-4 py-3 rounded-lg border-2 transition-all text-slate-800 text-sm outline-none bg-transparent ${
                  validationErrors.email 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-slate-300 focus:border-blue-500'
                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                required 
              />
              <label 
                htmlFor="email"
                className={`absolute left-3 transition-all pointer-events-none ${
                  validationErrors.email ? 'text-red-600' : 'text-slate-500 peer-focus:text-blue-500'
                } 
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                ${email ? 'top-[-10px] left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
              >
                Email or phone
              </label>
              {validationErrors.email && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Input with Floating Label */}
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                placeholder=" "
                className={`peer w-full px-4 py-3 rounded-lg border-2 transition-all text-slate-800 text-sm outline-none bg-transparent ${
                  validationErrors.password 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-slate-300 focus:border-blue-500'
                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                required 
              />
              <label 
                htmlFor="password"
                className={`absolute left-3 transition-all pointer-events-none ${
                  validationErrors.password ? 'text-red-600' : 'text-slate-500 peer-focus:text-blue-500'
                } 
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                ${password ? 'top-[-10px] left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
              >
                Password
              </label>
              <button 
                type="button"
                onClick={handleTogglePasswordVisibility}
                disabled={loading}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <Link to="/forgot-password" className="absolute mt-2 right-3 top-[-32px] text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Forgot?
              </Link>
              {validationErrors.password && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {validationErrors.password}
                </p>
              )}
            </div>

            {/* reCAPTCHA Widget - Enhanced */}
            <div className="py-4">
              <div className="flex flex-col items-center">
                {/* Info text */}
                <div className="flex items-center gap-2 mb-3 text-slate-600 text-sm">
                  <Shield size={16} className="text-blue-600" />
                  <span>Verify you're human to continue</span>
                </div>
                
                {/* CAPTCHA container */}
                <div 
                  ref={captchaRef}
                  className={`transition-all duration-200 rounded-lg ${
                    captchaError 
                      ? 'ring-2 ring-red-500 ring-offset-2' 
                      : captchaToken 
                        ? 'ring-2 ring-green-500 ring-offset-2' 
                        : ''
                  }`}
                  style={{ 
                    transform: captchaError ? 'scale(0.98)' : 'scale(1)',
                    transition: 'transform 0.2s ease'
                  }}
                />
                
                {/* Success indicator */}
                {captchaToken && !captchaError && (
                  <div className="mt-3 flex items-center gap-2 text-green-600 text-sm font-medium animate-fade-in">
                    <CheckCircle2 size={16} />
                    <span>Verification successful!</span>
                  </div>
                )}
                
                {/* Error messages */}
                {(captchaError || validationErrors.captcha) && (
                  <div className="mt-3 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                      <AlertCircle size={16} />
                      <span>{validationErrors.captcha || 'Please complete the CAPTCHA'}</span>
                    </div>
                    {captchaError && (
                      <button
                        type="button"
                        onClick={resetCaptcha}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Click here to reload CAPTCHA
                      </button>
                    )}
                  </div>
                )}
                
                {/* Loading fallback */}
                {!window.grecaptcha && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Loading verification...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || success}
              className="w-full bg-[#1D4ED8] hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Signing In...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={20} />
                  Redirecting...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="grow border-t border-slate-200"></div>
              <span className="shrink mx-4 text-slate-400 text-sm">or sign in with</span>
              <div className="grow border-t border-slate-200"></div>
            </div>

            {/* Social Buttons with Error Handling */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button" 
                disabled={loading}
                onClick={() => {
                  try {
                    console.log('Google sign-in clicked');
                  } catch (err) {
                    console.error('Social login error:', err);
                    setError('Social login is not available at the moment');
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors font-medium text-slate-700 bg-white"
              >
                {/* Google Icon SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Google</span>
              </button>
              <button 
                type="button" 
                disabled={loading}
                onClick={() => {
                  try {
                    console.log('LinkedIn sign-in clicked');
                  } catch (err) {
                    console.error('Social login error:', err);
                    setError('Social login is not available at the moment');
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors font-medium text-slate-700 bg-white"
              >
                {/* LinkedIn Icon SVG */}
                <svg className="w-5 h-5" fill="#0077b5" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>LinkedIn</span>
              </button>
            </div>

            {/* Help Text */}
            {/* <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-xs">
                <strong>Demo Credentials:</strong> Use email: puru@gmail.com, password: 1234567890
              </p>
            </div> */}

          </form>
        </div>
      </div>
    </div>
  );
}