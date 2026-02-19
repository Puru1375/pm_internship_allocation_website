import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { apiResetPassword } from '../../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const validatePassword = (password) => 
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);

  const getPasswordStrength = (password) => {
    const score = [/[a-z]/, /[A-Z]/, /\d/, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/].reduce(
      (acc, regex) => acc + (regex.test(password) ? 1 : 0),
      0
    ) + (password.length >= 12 ? 1 : 0);

    if (!password) return { text: 'Weak', color: 'text-slate-400' };
    if (score >= 4) return { text: 'Strong', color: 'text-green-600' };
    if (score >= 3) return { text: 'Good', color: 'text-amber-600' };
    return { text: 'Weak', color: 'text-red-600' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    if (!password) {
      setError('Please enter a new password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    if (!confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiResetPassword(token, password);

      if (res?.success || res?.message) {
        setMessage(res.message || 'Password reset successfully!');
        setSubmitted(true);
        
        // Redirect after 2 seconds
        setTimeout(() => navigate('/login', { 
          state: { message: 'Password reset successful! Please login with your new password.' } 
        }), 2000);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      
      if (err.message?.toLowerCase().includes('invalid') || err.message?.toLowerCase().includes('expired')) {
        setError('This password reset link is invalid or has expired. Please request a new one.');
      } else if (err.message?.toLowerCase().includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <Link 
          to="/login" 
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 font-medium text-sm"
        >
          ← Back to Login
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/20 p-8 md:p-10">
          {!submitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
                  <Lock className="text-blue-600" size={28} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Reset Password</h1>
                <p className="text-slate-600 text-sm md:text-base">
                  Create a new strong password to secure your account.
                </p>
              </div>

              {/* Form */}
              {error && !token ? (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-center">
                  <AlertCircle className="text-red-600 mx-auto mb-2" size={24} />
                  <p className="text-red-900 font-semibold text-sm mb-1">{error}</p>
                  <p className="text-red-700 text-sm mb-4">
                    Please request a new password reset link.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                  >
                    Request New Link
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
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

                  {/* Password Input */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        disabled={loading}
                        placeholder="Create a strong password"
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
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {/* Password Strength */}
                    {password && (
                      <>
                        <p className={`text-xs mt-2 font-semibold ${getPasswordStrength(password).color}`}>
                          Strength: {getPasswordStrength(password).text}
                        </p>
                        <div className="text-xs text-slate-600 mt-3 space-y-1">
                          <p className="font-medium">Password must contain:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <p className={password.length >= 8 ? 'text-green-600' : 'text-slate-400'}>
                              ✓ At least 8 characters
                            </p>
                            <p className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-slate-400'}>
                              ✓ One uppercase letter
                            </p>
                            <p className={/[a-z]/.test(password) ? 'text-green-600' : 'text-slate-400'}>
                              ✓ One lowercase letter
                            </p>
                            <p className={/[0-9]/.test(password) ? 'text-green-600' : 'text-slate-400'}>
                              ✓ One number
                            </p>
                            <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-slate-400'}>
                              ✓ One special character
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-900 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError('');
                        }}
                        disabled={loading}
                        placeholder="Re-enter your password"
                        className={`w-full px-4 py-3 pr-10 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-900 placeholder:text-slate-400 outline-none ${
                          confirmPassword && password === confirmPassword
                            ? 'border-green-300 focus:border-green-500'
                            : error
                            ? 'border-red-300 focus:border-red-500 bg-red-50'
                            : 'border-slate-200 focus:border-blue-500'
                        } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {/* Password Match Status */}
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-red-600 text-xs mt-2 font-medium">✗ Passwords do not match</p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-green-600 text-xs mt-2 font-medium flex items-center gap-1">
                        <CheckCircle2 size={14} /> Passwords match
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-6"
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
                </form>
              )}
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                  <CheckCircle2 className="text-green-600" size={32} />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Password Reset Successful!</h2>
                
                <p className="text-slate-600 mb-6">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-slate-700">
                  <p className="font-semibold mb-2">✓ What's next:</p>
                  <ul className="text-left space-y-2">
                    <li>• You'll be redirected to login shortly</li>
                    <li>• Sign in with your email and new password</li>
                    <li>• Your account is now secure</li>
                  </ul>
                </div>

                {/* Redirect Link */}
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Go to Login
                </Link>

                <p className="text-slate-500 text-sm mt-4">
                  Redirecting in 2 seconds...
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-slate-600 text-sm">
          <p>
            Having trouble?{' '}
            <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
