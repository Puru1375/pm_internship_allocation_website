import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Building2, ArrowLeft } from 'lucide-react';
import { apiRegister, apiVerifyEmail, apiLogin, apiUploadCompanyDocs, apiCheckEmail } from '../../services/api';
import { clearStoredToken } from '../../utils/cryptoUtils';

export default function RegisterCompanyPage() {
  const [step, setStep] = useState('register');
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [hrSign, setHrSign] = useState(null);
  const [ceoSign, setCeoSign] = useState(null);
  const [registrationDoc, setRegistrationDoc] = useState(null);
  const [otp, setOtp] = useState('');
  const [displayOtp, setDisplayOtp] = useState(''); // ✅ OTP to display on screen
  const [loading, setLoading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const emailCheckTimeout = useRef(null);
  const navigate = useNavigate();

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePassword = (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(val);
  const validatePhone = (val) => val && val.replace(/\D/g, '').length >= 10;

  const validateField = (name, value) => {
    const val = value ?? '';
    switch (name) {
      case 'companyName':
        if (!val.trim()) return 'Company name is required';
        return null;
      case 'companyType':
        if (!val.trim()) return 'Company type is required';
        return null;
      case 'description':
        if (!val.trim()) return 'Description is required';
        if (val.trim().length < 50) return 'Description must be at least 50 characters';
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
        return null;
      case 'confirmPassword':
        if (!val) return 'Confirm your password';
        if (val !== password) return 'Passwords do not match';
        return null;
      case 'gstNumber':
        if (!val.trim()) return 'GST number is required';
        return null;
      case 'panNumber':
        if (!val.trim()) return 'PAN number is required';
        return null;
      case 'address':
        if (!val.trim()) return 'Address is required';
        return null;
      case 'city':
        if (!val.trim()) return 'City is required';
        return null;
      case 'state':
        if (!val.trim()) return 'State is required';
        return null;
      case 'pincode':
        if (!/^\d{6}$/.test(val)) return 'Pincode must be 6 digits';
        return null;
      default:
        return null;
    }
  };

  const checkEmailAvailability = async (emailValue) => {
    if (!validateEmail(emailValue)) return;
    
    setCheckingEmail(true);
    try {
      const res = await apiCheckEmail(emailValue.trim().toLowerCase());
      if (!res.available) {
        setFieldErrors((prev) => ({ ...prev, email: 'Email already registered. Please login.' }));
      } else {
        setFieldErrors((prev) => {
          const { email: _, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error('Email check failed:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateFile = (file) => {
    if (!file) return 'File is required';
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) return 'Only PDF, JPG, and PNG files are allowed';
    if (file.size > 5 * 1024 * 1024) return 'File size must be under 5MB';
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!companyName.trim()) return setError('Company name is required');
    if (!companyType.trim()) return setError('Company type is required');
    if (!description.trim() || description.trim().length < 50) return setError('Description must be at least 50 characters');
    if (!email.trim() || !validateEmail(email)) return setError('Enter a valid email');
    if (!validatePhone(phone)) return setError('Enter a valid phone (min 10 digits)');
    if (!validatePassword(password)) return setError('Password needs uppercase, lowercase, number, special char, 8+ chars');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (!gstNumber.trim()) return setError('GST number is required');
    if (!panNumber.trim()) return setError('PAN number is required');
    if (!address.trim()) return setError('Address is required');
    if (!city.trim()) return setError('City is required');
    if (!state.trim()) return setError('State is required');
    if (!/^\d{6}$/.test(pincode)) return setError('Pincode must be 6 digits');
    
    if (fieldErrors.email) return setError('Please use a different email address');
    
    const hrErr = validateFile(hrSign);
    const ceoErr = validateFile(ceoSign);
    const regErr = validateFile(registrationDoc);
    if (hrErr) return setError(`HR sign: ${hrErr}`);
    if (ceoErr) return setError(`CEO sign: ${ceoErr}`);
    if (regErr) return setError(`Company document: ${regErr}`);
    
    if (websiteUrl && websiteUrl.trim()) {
      const urlPattern = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+[\w.,@?^=%&:/~+#-]*$/;
      if (!urlPattern.test(websiteUrl.trim())) return setError('Enter a valid website URL');
    }

    try {
      setLoading(true);
      const res = await apiRegister({
        role: 'company',
        fullName: companyName.trim(),
        companyType: companyType.trim(),
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ''),
        password,
        gstNumber: gstNumber.trim(),
        panNumber: panNumber.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim()
      });

      if (res?.success) {
        setMessage(res.message || 'Your 6-digit OTP is shown below. Please enter it to verify your email.');
        setDisplayOtp(res?.otp || ''); // ✅ Get OTP from response
        setStep('verify');
      } else {
        setError(res?.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Company register error:', err);
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
        if (hrSign || ceoSign || registrationDoc) {
          try {
            setDocUploading(true);
            setMessage('Email verified! Logging in to upload documents...');

            const loginRes = await apiLogin(email.trim().toLowerCase(), password);
            if (!loginRes?.success) {
              throw new Error(loginRes?.message || 'Login failed after verification. Please login and upload documents from dashboard.');
            }

            const formDataUpload = new FormData();
            formDataUpload.append('hr_sign', hrSign);
            formDataUpload.append('ceo_sign', ceoSign);
            formDataUpload.append('registration_doc', registrationDoc);

            setMessage('Uploading documents...');
            await apiUploadCompanyDocs(formDataUpload);

            setMessage('Documents uploaded! Redirecting to login...');
            clearStoredToken();
          } catch (uploadErr) {
            console.error('Company doc upload error:', uploadErr);
            setError(uploadErr.message || 'Document upload failed. Please login and upload from dashboard.');
            clearStoredToken();
          } finally {
            setDocUploading(false);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
          }
        } else {
          setSuccess(true);
          setMessage('Email verified! Redirecting to login...');
          setTimeout(() => navigate('/login'), 1800);
        }
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
          <p className="text-lg font-semibold text-slate-900">Company Registration Complete!</p>
          <p className="text-slate-600 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg shadow-blue-100/30 p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <Link to="/login" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium">
            <ArrowLeft size={16} /> Back to Login
          </Link>
          {step === 'verify' && (
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">Step 2 of 2: Verify Email</span>
          )}
        </div>

        <div className="flex items-start gap-4 md:gap-6 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100">
            <Building2 className="text-blue-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Register Your Company</h1>
            <p className="text-slate-600 mt-1 text-sm md:text-base">Post internships and manage applicants with your company account.</p>
          </div>
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
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCompanyName(next);
                    setFieldErrors((prev) => ({ ...prev, companyName: validateField('companyName', next) }));
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                  placeholder="Acme Pvt Ltd"
                />
                {fieldErrors.companyName && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.companyName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Company Type</label>
                <input
                  type="text"
                  value={companyType}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCompanyType(next);
                    setFieldErrors((prev) => ({ ...prev, companyType: validateField('companyType', next) }));
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                  placeholder="IT Services"
                />
                {fieldErrors.companyType && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.companyType}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Company Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  const next = e.target.value;
                  setDescription(next);
                  setFieldErrors((prev) => ({ ...prev, description: validateField('description', next) }));
                }}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none resize-none"
                placeholder="Describe your company and what you do"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 50 characters</p>
              {fieldErrors.description && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.description}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Website (Optional)</label>
                <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} disabled={loading} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none" placeholder="https://example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Work Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const next = e.target.value;
                      setEmail(next);
                      const error = validateField('email', next);
                      setFieldErrors((prev) => ({ ...prev, email: error }));
                      if (emailCheckTimeout.current) clearTimeout(emailCheckTimeout.current);
                      if (!error && next.trim()) {
                        emailCheckTimeout.current = setTimeout(() => checkEmailAvailability(next), 800);
                      }
                    }}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                    placeholder="hr@example.com"
                  />
                  {checkingEmail && <div className="absolute right-3 top-3"><Loader2 className="animate-spin text-blue-500" size={20} /></div>}
                </div>
                {fieldErrors.email && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.email}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Phone</label>
                <input
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
                {fieldErrors.phone && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.phone}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      const next = e.target.value;
                      setPassword(next);
                      setFieldErrors((prev) => ({ ...prev, password: validateField('password', next), confirmPassword: prev.confirmPassword ? validateField('confirmPassword', confirmPassword) : null }));
                    }}
                    disabled={loading}
                    className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                    placeholder="Create password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading} className="absolute right-3 top-10 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  {fieldErrors.password && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.password}</p>}
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Confirm</label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      const next = e.target.value;
                      setConfirmPassword(next);
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: validateField('confirmPassword', next) }));
                    }}
                    disabled={loading}
                    className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                    placeholder="Re-enter"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading} className="absolute right-3 top-10 text-slate-400 hover:text-slate-600">{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  {confirmPassword && confirmPassword === password && !fieldErrors.confirmPassword && !fieldErrors.password && <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={14} /> Passwords match</p>}
                  {fieldErrors.confirmPassword && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">GST Number</label>
                <input type="text" value={gstNumber} onChange={(e) => { const next = e.target.value; setGstNumber(next); setFieldErrors((prev) => ({ ...prev, gstNumber: validateField('gstNumber', next) })); }} disabled={loading} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none" placeholder="e.g. 27AAPPU0123ABC1Z0" />
                {fieldErrors.gstNumber && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.gstNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">PAN Number</label>
                <input type="text" value={panNumber} onChange={(e) => { const next = e.target.value.toUpperCase(); setPanNumber(next); setFieldErrors((prev) => ({ ...prev, panNumber: validateField('panNumber', next) })); }} disabled={loading} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none" placeholder="e.g. AAAAP0001A" />
                {fieldErrors.panNumber && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.panNumber}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Address</label>
                <input type="text" value={address} onChange={(e) => { const next = e.target.value; setAddress(next); setFieldErrors((prev) => ({ ...prev, address: validateField('address', next) })); }} disabled={loading} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none" placeholder="Street, Area" />
                {fieldErrors.address && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.address}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input type="text" value={city} onChange={(e) => { const next = e.target.value.replace(/[^a-zA-Z\s]/g, ''); setCity(next); setFieldErrors((prev) => ({ ...prev, city: validateField('city', next) })); }} disabled={loading} className="px-3 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none w-full" placeholder="City" />
                  {fieldErrors.city && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.city}</p>}
                </div>
                <div>
                  <input type="text" value={state} onChange={(e) => { const next = e.target.value.replace(/[^a-zA-Z\s]/g, ''); setState(next); setFieldErrors((prev) => ({ ...prev, state: validateField('state', next) })); }} disabled={loading} className="px-3 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none w-full" placeholder="State" />
                  {fieldErrors.state && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.state}</p>}
                </div>
                <div>
                  <input type="text" value={pincode} onChange={(e) => { const next = e.target.value.replace(/[^0-9]/g, '').slice(0, 6); setPincode(next); setFieldErrors((prev) => ({ ...prev, pincode: validateField('pincode', next) })); }} disabled={loading} className="px-3 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none w-full" placeholder="Pincode" />
                  {fieldErrors.pincode && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {fieldErrors.pincode}</p>}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">HR Sign (PDF/JPG/PNG, &lt;5MB)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setHrSign(e.target.files?.[0] || null)} disabled={loading} className="block w-full text-sm text-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">CEO Sign (PDF/JPG/PNG, &lt;5MB)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setCeoSign(e.target.files?.[0] || null)} disabled={loading} className="block w-full text-sm text-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Company Document (PDF/JPG/PNG, &lt;5MB)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setRegistrationDoc(e.target.files?.[0] || null)} disabled={loading} className="block w-full text-sm text-slate-700" />
              </div>
            </div>

            <button type="submit" disabled={loading || docUploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Company Account'}
            </button>

            <p className="text-sm text-slate-600 text-center">Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Login</Link></p>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-5">
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

            <div className="text-center text-slate-700 text-sm">Enter the OTP shown above to activate your account.</div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} maxLength={6} disabled={loading} className="w-full px-4 py-3 text-center tracking-[0.5em] text-lg font-mono rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none" placeholder="000000" />
              <p className="text-xs text-slate-500 mt-1 text-center">{otp.length}/6 digits</p>
            </div>
            <button type="submit" disabled={loading || docUploading || otp.length !== 6} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
              {loading || docUploading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Email'}
            </button>
            <button type="button" onClick={() => { setStep('register'); setOtp(''); setMessage(''); setError(''); }} className="w-full text-slate-600 hover:text-slate-900 text-sm font-medium">← Back to details</button>
          </form>
        )}
      </div>
    </div>
  );
}
