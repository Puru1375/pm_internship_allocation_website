import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Mail, AlertCircle, CheckCircle2, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { apiForgotPassword, apiResetPassword } from '../../services/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email'); // 'email' → 'verify' → 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const validateEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const getPasswordStrength = (pwd) => {
    if (pwd.length < 8) return { text: 'Weak', color: 'text-red-600' };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (strength < 2) return { text: 'Weak', color: 'text-red-600' };
    if (strength < 3) return { text: 'Medium', color: 'text-yellow-600' };
    return { text: 'Strong', color: 'text-green-600' };
  };

  const handleGoBackToEmail = () => {
    setStep('email');
    setError('');
    setMessage('');
    setOtp('');
  };

  const handleGoBackToVerify = () => {
    setStep('verify');
    setError('');
    setMessage('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmailFormat(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const res = await apiForgotPassword(email.trim().toLowerCase());

      if (res?.message) {
        setMessage(res.message);
        setTimeout(() => {
          setStep('verify');
          setMessage('');
        }, 500);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      
      if (err.message?.toLowerCase().includes('not found')) {
        setError('No account found with this email address');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setMessage('OTP verified! Now set your new password.');
    setTimeout(() => {
      setStep('reset');
      setMessage('');
    }, 1000);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await apiResetPassword(email.trim().toLowerCase(), otp, newPassword);

      if (res?.message) {
        setSuccess(true);
        setTimeout(() => navigate('/login?reset=success'), 2000);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      
      if (err.message?.toLowerCase().includes('invalid') || err.message?.toLowerCase().includes('expired')) {
        setError('Invalid or expired OTP. Please request a new one.');
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto text-green-600 mb-4" size={48} />
          <p className="text-lg font-semibold text-slate-900">Password Reset Successful!</p>
          <p className="text-slate-600 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <Link 
          to="/login" 
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 font-medium text-sm"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/20 p-8 md:p-10">
          {/* STEP 1: Email Entry */}
          {step === 'email' && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
                  <Mail className="text-blue-600" size={28} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Forgot Password?</h1>
                <p className="text-slate-600 text-sm md:text-base">
                  Enter your email to receive an OTP code.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSendOTP} className="space-y-5">
                {/* Error */}
                {error && (
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex gap-3 animate-in fade-in">
                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-red-900 font-semibold text-sm">Error</p>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Message */}
                {message && (
                  <div className="p-4 rounded-xl border border-green-200 bg-green-50 flex gap-3 animate-in fade-in">
                    <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-green-900 font-semibold text-sm">Success</p>
                      <p className="text-green-700 text-sm mt-1">{message}</p>
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    disabled={loading}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-900 placeholder:text-slate-400 outline-none ${
                      error
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-slate-200 focus:border-blue-500'
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      Send OTP
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'verify' && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
                  <Lock className="text-blue-600" size={28} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Verify OTP</h1>
                <p className="text-slate-600 text-sm md:text-base">
                  Enter the 6-digit code sent to <span className="font-semibold text-slate-900">{email}</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                {/* Error */}
                {error && (
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex gap-3 animate-in fade-in">
                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-red-900 font-semibold text-sm">Error</p>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Message */}
                {message && (
                  <div className="p-4 rounded-xl border border-green-200 bg-green-50 flex gap-3 animate-in fade-in">
                    <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-green-900 font-semibold text-sm">Success</p>
                      <p className="text-green-700 text-sm mt-1">{message}</p>
                    </div>
                  </div>
                )}

                {/* OTP Input */}
                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-slate-900 mb-2">
                    Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                      setError('');
                    }}
                    maxLength={6}
                    disabled={loading}
                    placeholder="000000"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-900 placeholder:text-slate-400 outline-none tracking-widest text-center text-2xl font-mono ${
                      error
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : otp.length === 6
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-slate-200 focus:border-blue-500'
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  <p className="text-slate-500 text-xs mt-2 text-center">
                    {otp.length}/6 digits entered
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Verify OTP
                    </>
                  )}
                </button>

                {/* Back button */}
                <button
                  type="button"
                  onClick={handleGoBackToEmail}
                  disabled={loading}
                  className="w-full text-slate-600 hover:text-slate-900 font-medium text-sm mt-2 disabled:opacity-50"
                >
                  ← Back to Email
                </button>
              </form>
            </>
          )}

          {/* STEP 3: Password Reset */}
          {step === 'reset' && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
                  <Lock className="text-green-600" size={28} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Reset Password</h1>
                <p className="text-slate-600 text-sm md:text-base">
                  Create a new strong password for your account.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* Error */}
                {error && (
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex gap-3 animate-in fade-in">
                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-red-900 font-semibold text-sm">Error</p>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Message */}
                {message && (
                  <div className="p-4 rounded-xl border border-green-200 bg-green-50 flex gap-3 animate-in fade-in">
                    <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-green-900 font-semibold text-sm">Success</p>
                      <p className="text-green-700 text-sm mt-1">{message}</p>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div className="relative">
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-900 mb-2">
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    disabled={loading}
                    placeholder="Enter strong password"
                    className={`w-full px-4 py-3 pr-10 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-900 placeholder:text-slate-400 outline-none ${
                      error
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-slate-200 focus:border-blue-500'
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-4 top-10 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {newPassword && (
                    <p className={`text-xs mt-1 font-semibold ${getPasswordStrength(newPassword).color}`}>
                      Strength: {getPasswordStrength(newPassword).text}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-900 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    disabled={loading}
                    placeholder="Confirm your password"
                    className={`w-full px-4 py-3 pr-10 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-900 placeholder:text-slate-400 outline-none ${
                      error
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : confirmPassword && newPassword === confirmPassword
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-slate-200 focus:border-blue-500'
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    className="absolute right-4 top-10 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Passwords match
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      Reset Password
                    </>
                  )}
                </button>

                {/* Back button */}
                <button
                  type="button"
                  onClick={handleGoBackToVerify}
                  disabled={loading}
                  className="w-full text-slate-600 hover:text-slate-900 font-medium text-sm mt-2 disabled:opacity-50"
                >
                  ← Back to Verify OTP
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
