import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { apiRegister, apiVerifyEmail, apiCheckEmail } from '../../services/api';

export default function RegisterInternPage() {
  const [step, setStep] = useState('register'); // register -> verify
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [displayOtp, setDisplayOtp] = useState(''); // ✅ OTP to display on screen
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const emailCheckTimeout = useRef(null);
  const verifyRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 'verify' && verifyRef.current) {
      setTimeout(() => {
        verifyRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [step]);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePassword = (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(val);
  const validatePhone = (val) => val && val.replace(/\D/g, '').length >= 10;

  // Check email availability with debouncing
  const checkEmailAvailability = async (emailValue) => {
    if (!validateEmail(emailValue)) return;
    
    setCheckingEmail(true);
    try {
      const res = await apiCheckEmail(emailValue.trim().toLowerCase());
      if (!res.available) {
        setFieldErrors((prev) => ({ ...prev, email: 'Email already registered. Please login.' }));
      } else {
        setFieldErrors((prev) => {
          const { email, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error('Email check failed:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateField = (name, value, ctx = {}) => {
    const val = value ?? '';
    const current = { fullName, email, phone, password, confirmPassword, ...ctx };

    switch (name) {
      case 'fullName':
        if (!val.trim()) return 'Full name is required';
        if (val.trim().length < 2) return 'Full name must be at least 2 characters';
        return null;
      case 'email':
        if (!val.trim()) return 'Email is required';
        if (!validateEmail(val)) return 'Enter a valid email';
        return null;
      case 'phone':
        if (!validatePhone(val)) return 'Enter a valid phone (min 10 digits)';
        return null;
      case 'password':
        if (!val) return 'Password is required';
        if (!validatePassword(val)) return 'Must include upper, lower, number, special, 8+ chars';
        if (current.confirmPassword && current.confirmPassword !== val) return null; // handled in confirmPassword
        return null;
      case 'confirmPassword':
        if (!val) return 'Confirm your password';
        if (val !== current.password) return 'Passwords do not match';
        return null;
      default:
        return null;
    }
  };

  const validateFields = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    else if (fullName.trim().length < 2) errs.fullName = 'Full name must be at least 2 characters';

    if (!email.trim()) errs.email = 'Email is required';
    else if (!validateEmail(email)) errs.email = 'Enter a valid email';

    if (!validatePhone(phone)) errs.phone = 'Enter a valid phone (min 10 digits)';

    if (!password) errs.password = 'Password is required';
    else if (!validatePassword(password)) errs.password = 'Must include upper, lower, number, special, 8+ chars';

    if (!confirmPassword) errs.confirmPassword = 'Confirm your password';
    else if (confirmPassword !== password) errs.confirmPassword = 'Passwords do not match';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!validateFields()) {
      setError('Please fix the highlighted fields');
      return;
    }

    // Don't proceed if email is already taken
    if (fieldErrors.email) {
      setError('Please use a different email address');
      return;
    }

    try {
      setLoading(true);
      const res = await apiRegister({
        role: 'intern',////////////////////////////
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ''),
        password
      });

      if (res?.success) {
        setStep('verify');
        setDisplayOtp(res?.otp || ''); // ✅ Get OTP from response
        setMessage(res.message || 'Your 6-digit OTP is shown below. Please enter it to verify your email.');
      } else {
        // Handle backend error
        const errorMsg = res?.message || 'Registration failed';
        
        // Check if it's a duplicate email error
        if (errorMsg.toLowerCase().includes('already exists') || 
            errorMsg.toLowerCase().includes('already registered')) {
          setFieldErrors((prev) => ({ ...prev, email: 'Email already registered. Please login.' }));
          setError('This email is already registered. Please use a different email or login.');
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Intern register error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp || otp.length !== 6) {
      return setError('Enter the 6-digit OTP');
    }

    try {
      setLoading(true);
      const res = await apiVerifyEmail(email.trim().toLowerCase(), otp);

      if (res?.success) {
        setSuccess(true);
        setMessage('Email verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1800);
      } else {
        setError(res?.message || 'Verification failed');
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto text-green-600 mb-4" size={48} />
          <p className="text-lg font-semibold text-slate-900">Registration Complete!</p>
          <p className="text-slate-600 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg shadow-blue-100/30 p-8 md:p-10">
        <Link to="/login" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 text-sm font-medium">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
            <Mail className="text-blue-600" size={28} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {step === 'verify' ? 'Verify Your Email' : 'Create Intern Account'}
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            {step === 'verify' 
              ? 'We sent a 6-digit code to your email' 
              : 'Sign up to find internships and manage your applications.'}
          </p>
          {step === 'verify' && (
            <span className="mt-3 inline-flex items-center px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-100">
              Step 2 of 2: Verify Email
            </span>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex gap-3 mb-4">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1 text-sm text-red-800">{error}</div>
          </div>
        )}

        {message && (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50 flex gap-3 mb-4">
            <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1 text-sm text-green-800">{message}</div>
          </div>
        )}

        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  const next = e.target.value;
                  setFullName(next);
                  setFieldErrors((prev) => ({ ...prev, fullName: validateField('fullName', next) }));
                }}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                placeholder="Jane Doe"
              />
              {fieldErrors.fullName && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {fieldErrors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2" htmlFor="email">Email</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const next = e.target.value;
                    setEmail(next);
                    const error = validateField('email', next);
                    setFieldErrors((prev) => ({ ...prev, email: error }));
                    
                    // Debounced email availability check
                    if (emailCheckTimeout.current) {
                      clearTimeout(emailCheckTimeout.current);
                    }
                    if (!error && next.trim()) {
                      emailCheckTimeout.current = setTimeout(() => {
                        checkEmailAvailability(next);
                      }, 800);
                    }
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                  placeholder="you@example.com"
                />
                {checkingEmail && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="animate-spin text-blue-500" size={20} />
                  </div>
                )}
              </div>
              {fieldErrors.email && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2" htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^0-9]/g, '').slice(0, 15);
                  setPhone(next);
                  setFieldErrors((prev) => ({ ...prev, phone: validateField('phone', next) }));
                }}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                placeholder="9876543210"
              />
              {fieldErrors.phone && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {fieldErrors.phone}
                </p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-800 mb-2" htmlFor="password">Password</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  const next = e.target.value;
                  setPassword(next);
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: validateField('password', next, { confirmPassword }),
                    confirmPassword: prev.confirmPassword ? validateField('confirmPassword', confirmPassword, { password: next }) : prev.confirmPassword
                  }));
                }}
                disabled={loading}
                className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-10 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-800 mb-2" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  const next = e.target.value;
                  setConfirmPassword(next);
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: validateField('confirmPassword', next, { password })
                  }));
                }}
                disabled={loading}
                className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                placeholder="Re-enter password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                className="absolute right-3 top-10 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {fieldErrors.password && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {fieldErrors.password}
                </p>
              )}
              {confirmPassword && confirmPassword === password && !fieldErrors.confirmPassword && !fieldErrors.password && (
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Passwords match
                </p>
              )}
              {fieldErrors.confirmPassword && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
            </button>

            <p className="text-sm text-slate-600 text-center">
              Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Login</Link>
            </p>
          </form>
        )}

        {step === 'verify' && (
          <form ref={verifyRef} onSubmit={handleVerify} className="space-y-5">
            {/* ✅ OTP Display Div - Show the verification code */}
            {displayOtp && (
              <div className="p-4 sm:p-6 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
                <div className="text-center mb-4">
                  <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">Your Verification Code</p>
                  <div className="text-4xl sm:text-5xl font-bold text-green-600 tracking-widest font-mono">{displayOtp}</div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-3">Valid for 10 minutes</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-xs sm:text-sm text-slate-700 text-center">
                    <span className="font-semibold">👉 Enter this code below</span>
                  </p>
                </div>
              </div>
            )}

            <div className="text-center text-slate-700 text-sm">
              Enter the OTP shown above to activate your account.
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2" htmlFor="otp">OTP</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                maxLength={6}
                disabled={loading}
                className="w-full px-4 py-3 text-center tracking-[0.5em] text-lg font-mono rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                placeholder="000000"
              />
              <p className="text-xs text-slate-500 mt-1 text-center">{otp.length}/6 digits</p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Email'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('register');
                setOtp('');
                setMessage('');
                setError('');
              }}
              className="w-full text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              ← Back to details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
