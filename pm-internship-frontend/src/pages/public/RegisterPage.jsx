import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiVerifyEmail, apiCheckEmailAvailability, apiUploadCompanyDocs, apiLogin } from '../../services/api';
import { clearStoredToken } from '../../utils/cryptoUtils';
import { Loader2, Eye, EyeOff, User, Building2, ShieldAlert, AlertCircle, CheckCircle2, Mail } from 'lucide-react';

export default function RegisterPage({ initialRole = 'intern', allowRoleSwitch = true }) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState('register');
  const [companyStep, setCompanyStep] = useState(1); // 1: account, 2: company info, 3: address & compliance, 4: documents
  const companyProgress = Math.round((companyStep / 4) * 100);
  const [companyDocs, setCompanyDocs] = useState({
    hrSign: null,
    ceoSign: null,
    registrationDoc: null
  });
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [displayOtp, setDisplayOtp] = useState(''); // ✅ OTP received from backend to display on screen
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailValid, setEmailValid] = useState(null); // null = not checked, true = valid, false = invalid
  const [docUploading, setDocUploading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const logoUrl = '/skillbridge_logo.png';

  // Form State
  const [role, setRole] = useState(initialRole); // 'intern', 'company'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyType: '',
    description: '',
    websiteUrl: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: ''
  });
  const [emailCheckTimeout, setEmailCheckTimeout] = useState(null);

  const clearErrors = () => {
    setError('');
    setMessage('');
    setValidationErrors({});
  };

  const handleRoleSelect = (nextRole) => {
    if (!allowRoleSwitch) return;
    setRole(nextRole);
    clearErrors();
  };

  const validateEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);
  const validatePhone = (phone) => phone && phone.replace(/\D/g, '').length >= 10;

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

  // Input sanitization helper
  const sanitizeInput = (value, type = 'text') => {
    if (!value) return '';
    
    const trimmed = value.trim();
    
    switch (type) {
      case 'name':
        // Remove multiple spaces, keep only letters, spaces, dots, hyphens, apostrophes
        return trimmed.replace(/\s+/g, ' ').replace(/[^a-zA-Z\s.'-]/g, '');
      
      case 'email':
        // Convert to lowercase, remove spaces
        return trimmed.toLowerCase().replace(/\s/g, '');
      
      case 'phone':
        // Keep only digits
        return value.replace(/\D/g, '');
      
      case 'alphanumeric':
        // Remove special characters except space
        return trimmed.replace(/[^a-zA-Z0-9\s]/g, '');
      
      case 'uppercase':
        // Convert to uppercase, remove spaces
        return trimmed.toUpperCase().replace(/\s/g, '');
      
      case 'number':
        // Keep only digits
        return value.replace(/\D/g, '');
      
      case 'url':
        // Remove spaces
        return trimmed.replace(/\s/g, '');
      
      default:
        // Default: just trim and normalize spaces
        return trimmed.replace(/\s+/g, ' ');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Apply appropriate sanitization based on field
    let sanitizedValue = value;
    
    if (name === 'fullName') {
      sanitizedValue = sanitizeInput(value, 'name');
    } else if (name === 'phone') {
      sanitizedValue = sanitizeInput(value, 'phone');
    } else if (name === 'gstNumber' || name === 'panNumber') {
      sanitizedValue = sanitizeInput(value, 'uppercase');
    } else if (name === 'pincode') {
      sanitizedValue = sanitizeInput(value, 'number');
    } else if (name === 'websiteUrl') {
      sanitizedValue = sanitizeInput(value, 'url');
    } else if (name === 'city' || name === 'state') {
      sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    setValidationErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, email: value }));
    setValidationErrors((prev) => ({ ...prev, email: null }));
    setEmailValid(null);

    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }

    if (!value || !value.trim()) {
      setEmailChecking(false);
      return;
    }

    if (!validateEmailFormat(value)) {
      setEmailChecking(false);
      setValidationErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    setEmailChecking(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await apiCheckEmailAvailability(value);
        if (res?.available === false) {
          setEmailValid(false);
          setValidationErrors((prev) => ({ ...prev, email: 'This email is already registered' }));
        } else {
          setEmailValid(true);
        }
      } catch (err) {
        console.error('Email availability check failed:', err);
        setEmailValid(null);
        // Don't show error for network issues during typing
      } finally {
        setEmailChecking(false);
      }
    }, 400);

    setEmailCheckTimeout(timeoutId);
  };

  const handleDocUpload = async (field, file) => {
    if (!file) {
      setValidationErrors((prev) => ({ ...prev, [field]: 'Please select a file' }));
      return;
    }
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setValidationErrors((prev) => ({ ...prev, [field]: 'Only PDF, JPG, and PNG files are allowed' }));
      return;
    }
    
    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setValidationErrors((prev) => ({ ...prev, [field]: `File size (${sizeMB}MB) exceeds 5MB limit` }));
      return;
    }

    // Validate file name
    if (file.name.length > 255) {
      setValidationErrors((prev) => ({ ...prev, [field]: 'File name is too long' }));
      return;
    }
    
    try {
      // Store file for later upload (after user is authenticated)
      setCompanyDocs((prev) => ({
        ...prev,
        [field]: {
          name: file.name,
          file: file, // Store the actual file object
          uploaded: false
        }
      }));
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    } catch (err) {
      console.error('Error storing document:', err);
      setValidationErrors((prev) => ({ ...prev, [field]: 'Failed to process file. Please try again' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.fullName || !formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    } else if (formData.fullName.trim().length > 100) {
      errors.fullName = 'Full name must not exceed 100 characters';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.fullName.trim())) {
      errors.fullName = 'Full name can only contain letters, spaces, dots, hyphens, and apostrophes';
    }

    // Email validation
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmailFormat(formData.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (emailValid === false) {
      errors.email = 'This email is already registered';
    }

    // Phone validation
    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Phone number must be at least 10 digits';
    } else if (formData.phone.replace(/\D/g, '').length > 15) {
      errors.phone = 'Phone number is too long';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character';
    } else if (formData.password.length > 128) {
      errors.password = 'Password is too long (max 128 characters)';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Company-specific validations
    if (role === 'company') {
      if (!formData.companyType || !formData.companyType.trim()) {
        errors.companyType = 'Company type is required';
      }
      
      if (!formData.description || !formData.description.trim()) {
        errors.description = 'Company description is required';
      } else if (formData.description.trim().length < 50) {
        errors.description = `Description must be at least 50 characters (${formData.description.trim().length}/50)`;
      } else if (formData.description.trim().length > 1000) {
        errors.description = 'Description is too long (max 1000 characters)';
      }

      if (!formData.address || !formData.address.trim()) {
        errors.address = 'Address is required';
      } else if (formData.address.trim().length < 10) {
        errors.address = 'Please enter a complete address';
      }

      if (!formData.city || !formData.city.trim()) {
        errors.city = 'City is required';
      } else if (!/^[a-zA-Z\s]+$/.test(formData.city.trim())) {
        errors.city = 'City name can only contain letters and spaces';
      }

      if (!formData.state || !formData.state.trim()) {
        errors.state = 'State is required';
      } else if (!/^[a-zA-Z\s]+$/.test(formData.state.trim())) {
        errors.state = 'State name can only contain letters and spaces';
      }

      if (!formData.pincode || !formData.pincode.trim()) {
        errors.pincode = 'Pincode is required';
      } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
        errors.pincode = 'Pincode must be exactly 6 digits';
      }

      if (!formData.gstNumber || !formData.gstNumber.trim()) {
        errors.gstNumber = 'GST Number is required for verification';
      } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber.trim())) {
        errors.gstNumber = 'Please enter a valid GST Number (e.g., 22AAAAA0000A1Z5)';
      }

      if (!formData.panNumber || !formData.panNumber.trim()) {
        errors.panNumber = 'PAN Number is required for verification';
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.trim())) {
        errors.panNumber = 'Please enter a valid PAN Number (e.g., ABCDE1234F)';
      }
    }

    // Role validation
    if (!role || !['intern', 'company'].includes(role)) {
      errors.role = 'Please select a valid role';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCompanyStep = (currentStep) => {
    const errors = {};

    // Step 1: Account Details
    if (currentStep >= 1) {
      if (!formData.fullName || !formData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (formData.fullName.trim().length < 2) {
        errors.fullName = 'Full name must be at least 2 characters';
      } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.fullName.trim())) {
        errors.fullName = 'Full name can only contain letters and spaces';
      }

      if (!formData.email || !formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!validateEmailFormat(formData.email)) {
        errors.email = 'Please enter a valid email address';
      } else if (emailValid === false) {
        errors.email = 'This email is already registered';
      }

      if (!formData.phone || !formData.phone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!validatePhone(formData.phone)) {
        errors.phone = 'Phone number must be at least 10 digits';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (!validatePassword(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, number, and special character';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    // Step 2: Company Information
    if (currentStep >= 2) {
      if (!formData.companyType || !formData.companyType.trim()) {
        errors.companyType = 'Company type is required';
      }

      if (!formData.description || !formData.description.trim()) {
        errors.description = 'Company description is required';
      } else if (formData.description.trim().length < 50) {
        errors.description = `Description must be at least 50 characters (${formData.description.trim().length}/50)`;
      } else if (formData.description.trim().length > 1000) {
        errors.description = 'Description is too long (max 1000 characters)';
      }

      if (formData.websiteUrl && formData.websiteUrl.trim()) {
        const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;
        if (!urlPattern.test(formData.websiteUrl.trim())) {
          errors.websiteUrl = 'Please enter a valid website URL';
        }
      }
    }

    // Step 3: Address & Compliance
    if (currentStep >= 3) {
      if (!formData.address || !formData.address.trim()) {
        errors.address = 'Address is required';
      } else if (formData.address.trim().length < 10) {
        errors.address = 'Please enter a complete address';
      }

      if (!formData.city || !formData.city.trim()) {
        errors.city = 'City is required';
      }

      if (!formData.state || !formData.state.trim()) {
        errors.state = 'State is required';
      }

      if (!formData.pincode || !formData.pincode.trim()) {
        errors.pincode = 'Pincode is required';
      } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
        errors.pincode = 'Pincode must be exactly 6 digits';
      }

      if (!formData.gstNumber || !formData.gstNumber.trim()) {
        errors.gstNumber = 'GST Number is required';
      } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber.trim())) {
        errors.gstNumber = 'Please enter a valid GST Number';
      }

      if (!formData.panNumber || !formData.panNumber.trim()) {
        errors.panNumber = 'PAN Number is required';
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.trim())) {
        errors.panNumber = 'Please enter a valid PAN Number';
      }
    }

    // Step 4: Documents
    if (currentStep >= 4) {
      if (!companyDocs.hrSign?.file) {
        errors.hrSign = 'HR signature document is required';
      }
      if (!companyDocs.ceoSign?.file) {
        errors.ceoSign = 'CEO signature document is required';
      }
      if (!companyDocs.registrationDoc?.file) {
        errors.registrationDoc = 'Company registration document is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** Handles registration submission */
  const handleRegister = async (e) => {
    try {
      e.preventDefault();
      clearErrors();

      // Check if email availability check is still in progress
      if (emailChecking) {
        setError('Please wait while we verify email availability');
        return;
      }

      // Validate role selection
      if (!role) {
        setError('Please select a role (Intern or Company)');
        return;
      }

      if (!['intern', 'company'].includes(role)) {
        setError('Invalid role selected. Please refresh and try again.');
        return;
      }

      // Company multi-step validation
      if (role === 'company') {
        const isValidStep = validateCompanyStep(companyStep);
        if (!isValidStep) {
          setError('Please fix the errors below before continuing');
          // Scroll to first error
          const firstErrorField = document.querySelector('.border-red-500, .text-red-500');
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
        
        // Continue to next step if not on final step
        if (companyStep < 4) {
          setCompanyStep((s) => s + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } else {
        // Intern single-step validation
        if (!validateForm()) {
          setError('Please fix the errors below before submitting');
          // Scroll to first error
          const firstErrorField = document.querySelector('.border-red-500, .text-red-500');
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
      }

      // Sanitize and prepare registration data
      try {
        const registrationData = {
          ...formData,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.replace(/\D/g, ''), // Remove non-digits
          fullName: formData.fullName.trim().replace(/\s+/g, ' '), // Normalize spaces
          role: role.trim().toLowerCase()
        };

        // Additional sanitization for company data
        if (role === 'company') {
          registrationData.companyType = formData.companyType?.trim();
          registrationData.description = formData.description?.trim().replace(/\s+/g, ' ');
          registrationData.address = formData.address?.trim().replace(/\s+/g, ' ');
          registrationData.city = formData.city?.trim();
          registrationData.state = formData.state?.trim();
          registrationData.pincode = formData.pincode?.trim();
          registrationData.gstNumber = formData.gstNumber?.trim().toUpperCase();
          registrationData.panNumber = formData.panNumber?.trim().toUpperCase();
          if (formData.websiteUrl?.trim()) {
            registrationData.websiteUrl = formData.websiteUrl.trim();
          }
        }

        setLoading(true);
        setError('');

        const res = await register(registrationData);

        if (res.success) {
          const emailToVerify = res.data?.email || registrationData.email;
          const otpFromResponse = res.data?.otp || '';  // ✅ Get OTP from backend response
          
          if (!emailToVerify) {
            throw new Error('Registration succeeded but verification email is missing. Please contact support.');
          }

          setVerificationEmail(emailToVerify);
          setDisplayOtp(otpFromResponse);  // ✅ Set the OTP to display on screen
          setStep('verify');
          setLoading(false);

          if (role === 'company') {
            setMessage(
              res.data?.message ||
              `Registration successful! Your 6-digit verification code is shown below. After verification, your documents will be uploaded automatically.`
            );
          } else {
            setMessage(
              res.data?.message || 
              `Registration successful! Your 6-digit verification code is shown below. Please enter it to verify your email.`
            );
          }
        } else {
          setLoading(false);
          
          // Handle specific error messages
          const errorMsg = res.message || 'Registration failed. Please try again.';
          
          if (errorMsg.toLowerCase().includes('email already exists') || 
              errorMsg.toLowerCase().includes('email is already registered')) {
            setValidationErrors((prev) => ({ ...prev, email: 'This email is already registered' }));
            setError('This email is already registered. Please use a different email or try logging in.');
          } else if (errorMsg.toLowerCase().includes('phone')) {
            setValidationErrors((prev) => ({ ...prev, phone: errorMsg }));
            setError(errorMsg);
          } else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('timeout')) {
            setError('Network error. Please check your connection and try again.');
          } else {
            setError(errorMsg);
          }
        }
      } catch (dataErr) {
        console.error('Data preparation error:', dataErr);
        setLoading(false);
        setError('Failed to prepare registration data. Please check your inputs and try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setLoading(false);
      setDocUploading(false);
      
      // Handle different error types
      if (err.message?.toLowerCase().includes('network') || 
          err.message?.toLowerCase().includes('fetch') ||
          err.name === 'NetworkError') {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message?.toLowerCase().includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else if (err.message?.toLowerCase().includes('server')) {
        setError('Server error. Please try again later or contact support if the problem persists.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    }
  };

  /** Handles OTP verification */
  const handleVerify = async (e) => {
    try {
      e.preventDefault();

      // Validate verification email
      if (!verificationEmail || !verificationEmail.trim()) {
        setError('Verification email is missing. Please go back and register again.');
        return;
      }

      // Validate OTP input
      if (!otp || !otp.trim()) {
        setError('Please enter the 6-digit OTP sent to your email');
        return;
      }

      const otpTrimmed = otp.trim();
      
      if (otpTrimmed.length !== 6) {
        setError('OTP must be exactly 6 digits');
        return;
      }

      if (!/^\d+$/.test(otpTrimmed)) {
        setError('OTP must contain only numbers');
        return;
      }

      setError('');
      setMessage('');
      setVerifying(true);

      try {
        const res = await apiVerifyEmail(verificationEmail, otpTrimmed);
        
        if (!res) {
          throw new Error('No response from server. Please try again.');
        }

        const isCompany = role === 'company';
        setMessage(res.message || 'Email verified successfully!');

        // Intern flow: just redirect to login
        if (!isCompany) {
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Registration complete! Please login to continue.',
                email: verificationEmail 
              } 
            });
          }, 1500);
          return;
        }

        // Company flow: check if documents need to be uploaded
        const hasDocuments = companyDocs.hrSign?.file || companyDocs.ceoSign?.file || companyDocs.registrationDoc?.file;

        if (!hasDocuments) {
          setMessage('Email verified! Please login and upload your company verification documents from the dashboard.');
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Please upload your company verification documents from the dashboard.',
                email: verificationEmail 
              } 
            });
          }, 2000);
          return;
        }

        // Company with documents: auto-login and upload
        try {
          setDocUploading(true);
          setMessage('Email verified! Logging in to upload your documents...');

          // Validate password is still available
          if (!formData.password) {
            throw new Error('Session expired. Please login manually and upload documents from your dashboard.');
          }

          // Login to obtain token
          const loginRes = await apiLogin(verificationEmail, formData.password);
          
          if (!loginRes?.success) {
            throw new Error(loginRes?.message || 'Login failed after verification. Please login manually.');
          }

          // Prepare document upload
          const formDataUpload = new FormData();
          let uploadedCount = 0;

          if (companyDocs.hrSign?.file) {
            formDataUpload.append('hr_sign', companyDocs.hrSign.file);
            uploadedCount++;
          }
          if (companyDocs.ceoSign?.file) {
            formDataUpload.append('ceo_sign', companyDocs.ceoSign.file);
            uploadedCount++;
          }
          if (companyDocs.registrationDoc?.file) {
            formDataUpload.append('registration_doc', companyDocs.registrationDoc.file);
            uploadedCount++;
          }

          if (uploadedCount === 0) {
            throw new Error('No documents to upload. Please login and upload from your dashboard.');
          }

          setMessage(`Uploading ${uploadedCount} document(s)...`);

          await apiUploadCompanyDocs(formDataUpload);

          setMessage('Documents uploaded successfully! Redirecting to login...');
          
          // Clear token after successful upload
          clearStoredToken();
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Verification complete! Documents uploaded. Your account is pending admin approval.',
                email: verificationEmail 
              } 
            });
          }, 2000);

        } catch (uploadErr) {
          console.error('Company document upload failed:', uploadErr);
          
          // Clear token on error
          clearStoredToken();
          
          // Provide specific error messages
          let uploadErrorMsg = 'Document upload failed. ';
          
          if (uploadErr.message?.toLowerCase().includes('network') || 
              uploadErr.message?.toLowerCase().includes('fetch')) {
            uploadErrorMsg += 'Network error. Please login and upload from your dashboard.';
          } else if (uploadErr.message?.toLowerCase().includes('size') || 
                     uploadErr.message?.toLowerCase().includes('large')) {
            uploadErrorMsg += 'One or more files are too large. Please login and upload smaller files from your dashboard.';
          } else if (uploadErr.message?.toLowerCase().includes('type') || 
                     uploadErr.message?.toLowerCase().includes('format')) {
            uploadErrorMsg += 'Invalid file format. Please login and upload valid documents from your dashboard.';
          } else if (uploadErr.message?.toLowerCase().includes('unauthorized') || 
                     uploadErr.message?.toLowerCase().includes('token')) {
            uploadErrorMsg += 'Session expired. Please login and upload from your dashboard.';
          } else {
            uploadErrorMsg += uploadErr.message || 'Please login and upload from your dashboard.';
          }
          
          setError(uploadErrorMsg);
          
          // Still redirect to login after showing error briefly
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Please login and upload your verification documents.',
                email: verificationEmail 
              } 
            });
          }, 3000);

        } finally {
          setDocUploading(false);
          setVerifying(false);
        }

      } catch (verifyErr) {
        console.error('Verification API error:', verifyErr);
        
        // Handle specific verification errors
        let errorMsg = '';
        
        if (verifyErr.message?.toLowerCase().includes('invalid otp') || 
            verifyErr.message?.toLowerCase().includes('incorrect otp')) {
          errorMsg = 'Invalid OTP. Please check the code sent to your email and try again.';
        } else if (verifyErr.message?.toLowerCase().includes('expired')) {
          errorMsg = 'OTP has expired. Please request a new OTP by registering again.';
        } else if (verifyErr.message?.toLowerCase().includes('network') || 
                   verifyErr.message?.toLowerCase().includes('fetch')) {
          errorMsg = 'Network error. Please check your connection and try again.';
        } else if (verifyErr.message?.toLowerCase().includes('timeout')) {
          errorMsg = 'Request timed out. Please try again.';
        } else if (verifyErr.message?.toLowerCase().includes('already verified')) {
          errorMsg = 'This email is already verified. Please login to continue.';
          setTimeout(() => navigate('/login', { state: { email: verificationEmail } }), 2000);
        } else {
          errorMsg = verifyErr.message || 'Verification failed. Please check your OTP and try again.';
        }
        
        setError(errorMsg);
        throw verifyErr; // Re-throw to be caught by outer catch
      }

    } catch (err) {
      console.error('Verification error:', err);
      
      // Only set error if not already set
      if (!error) {
        if (err.message?.toLowerCase().includes('network')) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError(err.message || 'Verification failed. Please try again.');
        }
      }
    } finally {
      setVerifying(false);
      setDocUploading(false);
    }
  };

  /** Handles OTP resend */
  const handleResendOTP = async () => {
    try {
      if (!verificationEmail || !verificationEmail.trim()) {
        setError('Email is missing. Please go back and register again.');
        return;
      }

      // Prevent spam clicking
      if (verifying || loading) {
        return;
      }

      setError('');
      setMessage('');
      setLoading(true);

      // Call register again with existing data to trigger new OTP
      const registrationData = {
        ...formData,
        email: verificationEmail,
        role: role.trim().toLowerCase()
      };

      const res = await register(registrationData);

      setLoading(false);

      if (res.success) {
        setMessage(`New OTP sent to ${verificationEmail}. Please check your email.`);
        setOtp(''); // Clear existing OTP input
      } else {
        if (res.message?.toLowerCase().includes('already verified')) {
          setError('This email is already verified. Please login to continue.');
          setTimeout(() => navigate('/login', { state: { email: verificationEmail } }), 2000);
        } else {
          setError(res.message || 'Failed to resend OTP. Please try again.');
        }
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setLoading(false);
      
      if (err.message?.toLowerCase().includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to resend OTP. Please try again or contact support.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-slate-50 flex items-center justify-center p-3 sm:p-4 md:p-8 font-sans overflow-x-hidden">
      
      {/* Main Container */}
      <div className="w-full max-w-7xl grid md:grid-cols-2 gap-6 md:gap-12 items-center overflow-x-hidden">
        
        {/* --- LEFT COLUMN: Branding (Identical to Login Page) --- */}
        <div className="hidden md:block pr-4 lg:pr-8 space-y-4 lg:space-y-6">
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
            Find Your Perfect <br /> Internship
          </h1>
          
          <p className="text-base text-slate-600 max-w-md leading-relaxed">
            Post internships, discover exceptional students, and build your team with the brightest minds from across the country.
          </p>

           <div className="w-full h-64 rounded-xl overflow-hidden shadow-lg relative mt-8">
             <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-purple-500 to-pink-500"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-center">
                 <Building2 className="text-white mx-auto mb-3" size={48} />
                 <p className="text-white font-semibold text-lg">Grow Your Team</p>
               </div>
             </div>
          </div>
        </div>


        {/* --- RIGHT COLUMN: Registration Form --- */}
        <div className="w-full max-w-md mx-auto px-2 sm:px-0 overflow-x-hidden">
            
          {/* Tab Switcher (The Magic Part) */}
          <div className="bg-slate-100 p-1 rounded-lg flex mb-6">
            <Link to="/login" className="flex-1 text-slate-500 hover:text-slate-700 py-2 rounded-md text-sm font-medium text-center transition-all">
                Sign In
            </Link>
            <button className="flex-1 bg-white text-slate-900 shadow-sm py-2 rounded-md text-sm font-semibold transition-all cursor-default">
                Register
            </button>
          </div>

          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Create Account</h2>
            {step === 'verify' && (
              <span className="text-[10px] sm:text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">Step 2 of 2: Verify</span>
            )}
          </div>

          {/* Role Selection - Only show in register step when switching allowed */}
          {allowRoleSwitch && step === 'register' && (
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('intern')}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    role === 'intern'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <User className={`mx-auto mb-1 sm:mb-2 ${role === 'intern' ? 'text-blue-600' : 'text-slate-400'}`} size={20} />
                  <div className={`font-semibold text-xs sm:text-sm ${role === 'intern' ? 'text-blue-600' : 'text-slate-700'}`}>Intern</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Find opportunities</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('company')}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    role === 'company'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Building2 className={`mx-auto mb-1 sm:mb-2 ${role === 'company' ? 'text-blue-600' : 'text-slate-400'}`} size={20} />
                  <div className={`font-semibold text-xs sm:text-sm ${role === 'company' ? 'text-blue-600' : 'text-slate-700'}`}>Company</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Post internships</div>
                </button>
              </div>
            </div>
          )}

          {/* Registration Form - Show only in 'register' step */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 sm:space-y-5 p-3 mb-4 sm:mb-6 w-full overflow-x-hidden">

            {/* Error Banner */}
            {error && (
              <div className="p-3 sm:p-4 rounded-xl border border-red-200 bg-red-50 flex gap-2 sm:gap-3 animate-in fade-in">
                <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-red-900 font-semibold text-xs sm:text-sm">Registration Error</p>
                  <p className="text-red-700 text-xs sm:text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {message && (
              <div className="p-3 sm:p-4 rounded-xl border border-green-200 bg-green-50 flex gap-2 sm:gap-3 animate-in fade-in">
                <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-green-900 font-semibold text-xs sm:text-sm">Success!</p>
                  <p className="text-green-700 text-xs sm:text-sm mt-1">{message}</p>
                </div>
              </div>
            )}

            {role !== 'company' && (
              <>
                {/* Dynamic Name Input with Floating Label */}
                <div className="relative ">
              <input 
                type="text" 
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={loading}
                placeholder=" "
                className={`peer w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-800 outline-none bg-transparent pr-10 `}
                required 
              />
              <label 
                htmlFor="fullName"
                className={`absolute left-3 transition-all pointer-events-none ${
                  validationErrors.fullName ? 'text-red-600' : 'text-slate-500 peer-focus:text-blue-500'
                } 
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                ${formData.fullName ? '-top-2.5 left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
              >
                {role === 'company' ? 'Company Name' : 'Full Name'}
              </label>
              {validationErrors.fullName && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {validationErrors.fullName}
                </p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Email Input with Real-time Validation and Floating Label */}
                <div className="relative">
                    <input 
                        type="email" 
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleEmailChange}
                        disabled={loading}
                        placeholder=" "
                        className={`peer w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-800 outline-none bg-transparent pr-10 ${
                          validationErrors.email 
                            ? 'border-red-300 focus:border-red-500' 
                            : emailValid === true
                            ? 'border-green-300 focus:border-green-500'
                            : 'border-slate-300 focus:border-blue-500'
                        } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        required 
                    />
                    <label 
                      htmlFor="email"
                      className={`absolute left-3 transition-all pointer-events-none ${
                        validationErrors.email ? 'text-red-600' : emailValid === true ? 'text-green-600' : 'text-slate-500 peer-focus:text-blue-500'
                      } 
                      peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                      peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                      ${formData.email ? '-top-2.5 left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
                    >
                      Email
                    </label>
                    {/* Email Status Icons */}
                    {emailChecking && (
                      <Loader2 className="absolute right-3 top-3.5 text-blue-600 animate-spin" size={18} />
                    )}
                    {!emailChecking && emailValid === true && (
                      <CheckCircle2 className="absolute right-3 top-3.5 text-green-600" size={18} />
                    )}
                    {!emailChecking && emailValid === false && (
                      <AlertCircle className="absolute right-3 top-3.5 text-red-600" size={18} />
                    )}
                    {validationErrors.email && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {validationErrors.email}
                      </p>
                    )}
                    {!validationErrors.email && emailValid === true && (
                      <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Email is available
                      </p>
                    )}
                </div>

                {/* Phone Input with Floating Label */}
                <div className="relative">
                    <input 
                        type="tel" 
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder=" "
                        className={`peer w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-800 outline-none bg-transparent ${
                          validationErrors.phone 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-slate-300 focus:border-blue-500'
                        } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        required 
                    />
                    <label 
                      htmlFor="phone"
                      className={`absolute left-3 transition-all pointer-events-none ${
                        validationErrors.phone ? 'text-red-600' : 'text-slate-500 peer-focus:text-blue-500'
                      } 
                      peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                      peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                      ${formData.phone ? '-top-2.5 left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
                    >
                      Phone
                    </label>
                    {validationErrors.phone && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {validationErrors.phone}
                      </p>
                    )}
                </div>
            </div>

            {/* Password Input with Floating Label */}
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                placeholder=" "
                className={`peer w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-800 outline-none bg-transparent pr-10 ${
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
                peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                ${formData.password ? '-top-2.5 left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
              >
                Password
              </label>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {formData.password && !validationErrors.password && (
                <p className={`text-xs mt-1 font-semibold ${getPasswordStrength(formData.password).color}`}>
                  Password Strength: {getPasswordStrength(formData.password).text}
                </p>
              )}
              {validationErrors.password && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {validationErrors.password}
                </p>
              )}
              {!validationErrors.password && formData.password && (
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <p className="font-medium">Password must contain:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <p className={formData.password.length >= 8 ? 'text-green-600' : 'text-slate-400'}>
                      ✓ At least 8 characters
                    </p>
                    <p className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                      ✓ One uppercase letter
                    </p>
                    <p className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                      ✓ One lowercase letter
                    </p>
                    <p className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                      ✓ One number
                    </p>
                    <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                      ✓ One special character
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input with Floating Label */}
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                placeholder=" "
                className={`peer w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-800 outline-none bg-transparent pr-10 ${
                  validationErrors.confirmPassword 
                    ? 'border-red-300 focus:border-red-500' 
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-green-300 focus:border-green-500'
                    : 'border-slate-300 focus:border-blue-500'
                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                required 
              />
              <label 
                htmlFor="confirmPassword"
                className={`absolute left-3 transition-all pointer-events-none ${
                  validationErrors.confirmPassword 
                    ? 'text-red-600' 
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'text-green-600'
                    : 'text-slate-500 peer-focus:text-blue-500'
                } 
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                ${formData.confirmPassword ? '-top-2.5 left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
              >
                Confirm Password
              </label>
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {formData.confirmPassword && formData.password === formData.confirmPassword && !validationErrors.confirmPassword && (
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Passwords match
                </p>
              )}
              {validationErrors.confirmPassword && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {validationErrors.confirmPassword}
                </p>
              )}
            </div>
              </>
            )}

            {/* Company-Specific Fields - Multi Step */}
            {role === 'company' && (
              <>
                {/* <div className="p-3 mb-3 rounded-lg border border-blue-100 bg-blue-50/70 text-xs text-slate-800 flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-semibold">Tip</div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900 text-sm">Company verification in four easy steps.</p>
                    <p>Account details → Company info → Address & compliance → Document uploads. Navigate back anytime before final submission.</p>
                  </div>
                </div> */}

                {/* Stepper */}
                <div className="pt-3 sm:pt-4 border-t border-slate-200 w-full overflow-x-hidden">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 w-full">
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-600 w-12 sm:w-16">Progress</div>
                    <div className="flex-1 h-1.5 sm:h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all" style={{ width: `${companyProgress}%` }} />
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 w-8 sm:w-10 text-right">{companyProgress}%</div>
                  </div>
                  <div className="flex items-center mb-3 sm:mb-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <div
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold border shrink-0 ${
                            companyStep === s
                              ? 'bg-blue-600 text-white border-blue-600'
                              : companyStep > s
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {s}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                            companyStep === s ? 'text-blue-700' : 'text-slate-500'
                          }`}
                        >
                          {s === 1 ? 'Account' : s === 2 ? 'Info' : s === 3 ? 'Address' : 'Docs'}
                        </span>
                        {s < 4 && <div className="w-4 sm:w-8 h-px bg-slate-200 mx-1 sm:mx-2" />}
                      </div>
                    ))}
                  </div>

                  {companyStep === 1 && (
                    <div>
                      <div className="mb-3 sm:mb-5 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white">
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
                          <User size={18} className="text-blue-600" />
                          Account & Contact
                        </h3>

                        <div className="space-y-4 w-full">
                          {/* Dynamic Name Input with Floating Label */}
                          <div className="relative">
                            <input 
                              type="text" 
                              id="fullName"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleChange}
                              disabled={loading}
                              placeholder=" "
                              className={`peer w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-800 outline-none bg-transparent ${
                                validationErrors.fullName 
                                  ? 'border-red-300 focus:border-red-500' 
                                  : 'border-slate-300 focus:border-blue-500'
                              } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                              required 
                            />
                            <label 
                              htmlFor="fullName"
                              className={`absolute left-3 transition-all pointer-events-none ${
                                validationErrors.fullName ? 'text-red-600' : 'text-slate-500 peer-focus:text-blue-500'
                              } 
                              peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                              peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                              ${formData.fullName ? '-top-2.5 left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
                            >
                              Company Name
                            </label>
                            {validationErrors.fullName && (
                              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={14} /> {validationErrors.fullName}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="relative">
                              <input 
                                type="email" 
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleEmailChange}
                                disabled={loading}
                                placeholder=" "
                                className={`peer w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-800 outline-none bg-transparent pr-10 ${
                                  validationErrors.email 
                                    ? 'border-red-300 focus:border-red-500' 
                                    : emailValid === true
                                    ? 'border-green-300 focus:border-green-500'
                                    : 'border-slate-300 focus:border-blue-500'
                                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                required 
                              />
                              <label 
                                htmlFor="email"
                                className={`absolute left-3 transition-all pointer-events-none ${
                                  validationErrors.email ? 'text-red-600' : emailValid === true ? 'text-green-600' : 'text-slate-500 peer-focus:text-blue-500'
                                } 
                                peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                                peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                                ${formData.email ? '-top-2.5 left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
                              >
                                Work Email
                              </label>
                              {emailChecking && (
                                <Loader2 className="absolute right-3 top-3.5 text-blue-600 animate-spin" size={18} />
                              )}
                              {!emailChecking && emailValid === true && (
                                <CheckCircle2 className="absolute right-3 top-3.5 text-green-600" size={18} />
                              )}
                              {!emailChecking && emailValid === false && (
                                <AlertCircle className="absolute right-3 top-3.5 text-red-600" size={18} />
                              )}
                              {validationErrors.email && (
                                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                  <AlertCircle size={14} /> {validationErrors.email}
                                </p>
                              )}
                              {!validationErrors.email && emailValid === true && (
                                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                                  <CheckCircle2 size={14} /> Email is available
                                </p>
                              )}
                            </div>

                            <div className="relative">
                              <input 
                                type="tel" 
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder=" "
                                className={`peer w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-800 outline-none bg-transparent ${
                                  validationErrors.phone 
                                    ? 'border-red-300 focus:border-red-500' 
                                    : 'border-slate-300 focus:border-blue-500'
                                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                required 
                              />
                              <label 
                                htmlFor="phone"
                                className={`absolute left-3 transition-all pointer-events-none ${
                                  validationErrors.phone ? 'text-red-600' : 'text-slate-500 peer-focus:text-blue-500'
                                } 
                                peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                                peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                                ${formData.phone ? '-top-2.5 left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
                              >
                                Phone
                              </label>
                              {validationErrors.phone && (
                                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                  <AlertCircle size={14} /> {validationErrors.phone}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="relative">
                              <input 
                                type={showPassword ? "text" : "password"} 
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder=" "
                                className={`peer w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-800 outline-none bg-transparent pr-10 ${
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
                                peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                                ${formData.password ? '-top-2.5 left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
                              >
                                Password
                              </label>
                              <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                              >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                              {formData.password && !validationErrors.password && (
                                <p className={`text-xs mt-1 font-semibold ${getPasswordStrength(formData.password).color}`}>
                                  Password Strength: {getPasswordStrength(formData.password).text}
                                </p>
                              )}
                              {validationErrors.password && (
                                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                  <AlertCircle size={14} /> {validationErrors.password}
                                </p>
                              )}
                              {!validationErrors.password && formData.password && (
                                <div className="text-xs text-slate-600 mt-2 space-y-1">
                                  <p className="font-medium">Password must contain:</p>
                                  <div className="grid grid-cols-2 gap-1">
                                    <p className={formData.password.length >= 8 ? 'text-green-600' : 'text-slate-400'}>
                                      ✓ At least 8 characters
                                    </p>
                                    <p className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                                      ✓ One uppercase letter
                                    </p>
                                    <p className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                                      ✓ One lowercase letter
                                    </p>
                                    <p className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                                      ✓ One number
                                    </p>
                                    <p className={/[!@#$%^&*()_+\-=[]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                                      ✓ One special character
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="relative">
                              <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder=" "
                                className={`peer w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-in-out text-slate-800 outline-none bg-transparent pr-10 ${
                                  validationErrors.confirmPassword 
                                    ? 'border-red-300 focus:border-red-500' 
                                    : formData.confirmPassword && formData.password === formData.confirmPassword
                                    ? 'border-green-300 focus:border-green-500'
                                    : 'border-slate-300 focus:border-blue-500'
                                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                required 
                              />
                              <label 
                                htmlFor="confirmPassword"
                                className={`absolute left-3 transition-all pointer-events-none ${
                                  validationErrors.confirmPassword 
                                    ? 'text-red-600' 
                                    : formData.confirmPassword && formData.password === formData.confirmPassword
                                    ? 'text-green-600'
                                    : 'text-slate-500 peer-focus:text-blue-500'
                                } 
                                peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                                peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white
                                ${formData.confirmPassword ? '-top-2.5 left-3 text-xs px-1 bg-white' : 'top-3 text-sm'}`}
                              >
                                Confirm Password
                              </label>
                              <button 
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={loading}
                                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                              >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                              {formData.confirmPassword && formData.password === formData.confirmPassword && !validationErrors.confirmPassword && (
                                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                                  <CheckCircle2 size={14} /> Passwords match
                                </p>
                              )}
                              {validationErrors.confirmPassword && (
                                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                  <AlertCircle size={14} /> {validationErrors.confirmPassword}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {companyStep === 2 && (
                    <div>
                      <div className="mb-3 sm:mb-5 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white">
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
                          <Building2 size={18} className="text-blue-600" />
                          Company Information
                        </h3>

                      {/* Company Type */}
                      <div className="mb-3 sm:mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                          Company Type {validationErrors.companyType && <span className="text-red-600">*</span>}
                        </label>
                        <select
                          name="companyType"
                          value={formData.companyType}
                          onChange={handleChange}
                          disabled={loading}
                          className={`w-full px-4 py-3 rounded-xl border transition-all text-slate-800 outline-none ${
                            validationErrors.companyType
                              ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
                              : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                          } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <option value="">Select company type</option>
                          <option value="Startup">Startup</option>
                          <option value="SME">SME (Small & Medium Enterprise)</option>
                          <option value="MNC">MNC (Multinational Corporation)</option>
                          <option value="Government">Government</option>
                          <option value="NGO">NGO (Non-Profit)</option>
                          <option value="Other">Other</option>
                        </select>
                        {validationErrors.companyType && (
                          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={14} /> {validationErrors.companyType}
                          </p>
                        )}
                      </div>

                      {/* Company Description */}
                      <div className="mb-3 sm:mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                          Company Description {validationErrors.description && <span className="text-red-600">*</span>}
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          disabled={loading}
                          rows={3}
                          placeholder="Tell us about your company (min 50 characters)"
                          className={`w-full px-4 py-3 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400 outline-none resize-none ${
                            validationErrors.description
                              ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
                              : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                          } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {validationErrors.description ? (
                            <p className="text-red-600 text-xs flex items-center gap-1">
                              <AlertCircle size={14} /> {validationErrors.description}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-500">{formData.description.length}/50 characters</p>
                          )}
                        </div>
                      </div>

                      {/* Website URL */}
                      <div className="mb-3 sm:mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                          Website URL (Optional)
                        </label>
                        <input
                          type="url"
                          name="websiteUrl"
                          value={formData.websiteUrl}
                          onChange={handleChange}
                          disabled={loading}
                          placeholder="https://www.example.com"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 transition-all text-slate-800 placeholder:text-slate-400 outline-none"
                        />
                      </div>
                      </div>
                    </div>
                  )}

                  {companyStep === 3 && (
                    <div>
                      <div className="mb-3 sm:mb-5 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white">
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
                          <Building2 size={18} className="text-blue-600" />
                          Address & Compliance
                        </h3>

                      {/* Address Fields */}
                      <div className="mb-3 sm:mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                          Address {validationErrors.address && <span className="text-red-600">*</span>}
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          disabled={loading}
                          placeholder="Street address"
                          className={`w-full px-4 py-3 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400 outline-none ${
                            validationErrors.address
                              ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
                              : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                          } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {validationErrors.address && (
                          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={14} /> {validationErrors.address}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                            City {validationErrors.city && <span className="text-red-600">*</span>}
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="City"
                            className={`w-full px-4 py-3 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400 outline-none ${
                              validationErrors.city
                                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                          />
                          {validationErrors.city && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle size={14} /> {validationErrors.city}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                            State {validationErrors.state && <span className="text-red-600">*</span>}
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="State"
                            className={`w-full px-4 py-3 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400 outline-none ${
                              validationErrors.state
                                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                          />
                          {validationErrors.state && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle size={14} /> {validationErrors.state}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                            Pincode {validationErrors.pincode && <span className="text-red-600">*</span>}
                          </label>
                          <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="PIN"
                            className={`w-full px-4 py-3 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400 outline-none ${
                              validationErrors.pincode
                                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                          />
                          {validationErrors.pincode && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle size={14} /> {validationErrors.pincode}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* GST and PAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                            GST Number {validationErrors.gstNumber && <span className="text-red-600">*</span>}
                          </label>
                          <input
                            type="text"
                            name="gstNumber"
                            value={formData.gstNumber}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="GST Number"
                            className={`w-full px-4 py-3 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400 outline-none ${
                              validationErrors.gstNumber
                                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                          />
                          {validationErrors.gstNumber && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle size={14} /> {validationErrors.gstNumber}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                            PAN Number {validationErrors.panNumber && <span className="text-red-600">*</span>}
                          </label>
                          <input
                            type="text"
                            name="panNumber"
                            value={formData.panNumber}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="PAN Number"
                            className={`w-full px-4 py-3 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400 outline-none ${
                              validationErrors.panNumber
                                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                          />
                          {validationErrors.panNumber && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle size={14} /> {validationErrors.panNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>
                  )}

                  {companyStep === 4 && (
                    <div>
                      <div className="mb-3 sm:mb-5 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white">
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
                          <Building2 size={18} className="text-blue-600" />
                          Upload Verification Documents
                        </h3>

                      <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg border border-blue-200 bg-blue-50 text-[10px] sm:text-xs text-slate-700">
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm">📄 Document Upload Information</p>
                        <p className="mt-1">Accepted files: PDF, JPG, PNG (max 5 MB each)</p>
                        <p className="mt-1 text-blue-700 font-medium">Documents will be uploaded automatically after registration for admin verification.</p>
                        {docUploading && (
                          <p className="mt-2 text-blue-700 font-semibold flex items-center gap-2 text-xs">
                            <Loader2 size={14} className="animate-spin" /> Uploading documents... please wait
                          </p>
                        )}
                      </div>

                      {['hrSign', 'ceoSign', 'registrationDoc'].map((field) => {
                        const labels = {
                          hrSign: 'HR Sign (PDF/JPG/PNG)',
                          ceoSign: 'CEO Sign (PDF/JPG/PNG)',
                          registrationDoc: 'Registration Document (PDF/JPG/PNG)',
                        };
                        return (
                          <div className="mb-3 sm:mb-4" key={field}>
                            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                              {labels[field]} <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleDocUpload(field, e.target.files?.[0])}
                              disabled={loading}
                              className={`w-full px-4 py-3 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400 outline-none ${
                                validationErrors[field]
                                  ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
                                  : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                              } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                            {companyDocs[field]?.name && (
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                                  <CheckCircle2 size={14} />
                                  Selected
                                </span>
                                <span className="text-slate-600 truncate">{companyDocs[field].name}</span>
                              </div>
                            )}
                            {validationErrors[field] && (
                              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={14} /> {validationErrors[field]}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      <p className="text-[10px] sm:text-xs text-slate-500">These documents are required for company verification.</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3">
              {role === 'company' && companyStep > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    clearErrors();
                    setCompanyStep((s) => Math.max(1, s - 1));
                  }}
                  className="sm:w-40 w-full border border-slate-200 bg-white text-slate-800 font-semibold py-3.5 rounded-xl transition-all hover:border-slate-300 active:scale-[0.98]"
                >
                  Back
                </button>
              )}
              <button 
                type="submit" 
                disabled={loading || verifying || step === 'verify' || emailChecking || emailValid === false || docUploading} 
                className="flex-1 bg-[#1D4ED8] hover:bg-blue-800 disabled:bg-slate-300 text-white font-semibold py-3 sm:py-3.5 text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:text-slate-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Creating Account...
                  </>
                ) : step === 'verify' ? (
                  <>
                    <Mail size={20} />
                    Awaiting Verification
                  </>
                ) : role === 'company' && companyStep < 4 ? (
                  `Next: Step ${companyStep + 1}/4`
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 sm:mx-4 text-slate-400 text-xs sm:text-sm">or register with</span>
                <div className="grow border-t border-slate-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <button 
                  type="button" 
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors font-medium text-slate-700 bg-white text-xs sm:text-base"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    Google
                </button>
                <button 
                  type="button" 
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors font-medium text-slate-700 bg-white text-xs sm:text-base"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="#0077b5" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    LinkedIn
                </button>
            </div>
            </form>
          )}

          {/* OTP Verification Form - Show only in 'verify' step */}
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-3 sm:space-y-5 mb-4 sm:mb-6">
              
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
                      <span className="font-semibold">👉 Enter this code below</span> or click the copy button to paste it
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3 sm:p-4 rounded-xl border border-blue-100 bg-white shadow-sm flex flex-col gap-2 sm:gap-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                    <Mail size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-slate-900">Verify Your Email</div>
                    <div className="text-[10px] sm:text-xs text-slate-600">Enter the 6-digit code shown above to activate your account.</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    disabled={verifying || docUploading}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Enter 6-digit code"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={verifying || docUploading || !otp || otp.length !== 6}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    {verifying || docUploading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        {docUploading ? 'Uploading...' : 'Verifying...'}
                      </>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
                
                {/* Resend OTP Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <p className="text-[10px] sm:text-xs text-slate-500">Code expired?</p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading || verifying || docUploading}
                    className="text-[10px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 sm:p-4 rounded-xl border border-red-200 bg-red-50 flex gap-2 sm:gap-3 animate-in fade-in">
                  <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <p className="text-red-900 font-semibold text-xs sm:text-sm">Verification Error</p>
                    <p className="text-red-700 text-xs sm:text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {message && (
                <div className="p-3 sm:p-4 rounded-xl border border-green-200 bg-green-50 flex gap-2 sm:gap-3 animate-in fade-in">
                  <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <p className="text-green-900 font-semibold text-xs sm:text-sm">Success!</p>
                    <p className="text-green-700 text-xs sm:text-sm mt-1">{message}</p>
                  </div>
                </div>
              )}

              {/* Back to Registration */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('register');
                    setOtp('');
                    setDisplayOtp('');  // ✅ Clear displayed OTP
                    setError('');
                    setMessage('');
                  }}
                  disabled={verifying || docUploading}
                  className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed font-medium"
                >
                  ← Back to Registration
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}