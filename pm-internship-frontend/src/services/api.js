// src/services/api.js

import { storeJweToken, retrieveJweToken, clearStoredToken, isValidJweFormat } from '../utils/cryptoUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const RESUME_API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RESUME_API_URL) || 'http://localhost:5004/api/resumes';

/* =========================================================
   COMMON CONFIG
========================================================= */
const jsonConfig = {
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
};

/**
 * Get headers with JWE authorization token
 */
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Get JWE token from localStorage and send in Authorization header
  const jweToken = retrieveJweToken();
  if (jweToken) {
    headers['Authorization'] = `Bearer ${jweToken}`;
  }
  
  return headers;
}

function getResumeHeaders(contentType = 'application/json') {
  const headers = {};
  if (contentType) headers['Content-Type'] = contentType;
  const jweToken = retrieveJweToken();
  if (jweToken) headers['Authorization'] = `Bearer ${jweToken}`;
  return headers;
}

/**
 * Handle API response with error checking
 */
async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    
    // Handle 401 Unauthorized - clear token and redirect to login
    if (res.status === 401) {
      console.warn('Token expired or invalid - logging out');
      clearStoredToken();
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    
    // Create error with additional properties preserved
    const error = new Error(err.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.remainingAttempts = err.remainingAttempts;
    error.attemptsUsed = err.attemptsUsed;
    error.lockedUntil = err.lockedUntil;
    error.remainingMinutes = err.remainingMinutes;
    throw error;
  }
  return await res.json();
}

/* =========================================================
   AUTH
========================================================= */

/**
 * Login with email and password
 * Backend returns JWE (encrypted JWT) token
 */
export const apiLogin = async (email, password, captchaToken) => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      ...jsonConfig,
      method: 'POST',
      body: JSON.stringify({ email, password, captchaToken })
    });

    // Handle rate limiting (429) specially
    if (res.status === 429) {
      const data = await res.json();
      const error = new Error(data.message || 'Too many login attempts. Please try again later.');
      error.status = 429;
      error.remainingMinutes = data.remainingMinutes;
      error.lockedUntil = data.lockedUntil;
      throw error;
    }

    // Handle other failed responses (400, 403, etc.)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const error = new Error(data.message || 'Login failed');
      error.status = res.status;
      error.remainingAttempts = data.remainingAttempts;
      error.attemptsUsed = data.attemptsUsed;
      throw error;
    }

    const data = await res.json();
    
    console.log('🔐 Raw login response from backend:', data);
    console.log('📊 Backend profile_completion value:', data.profile_completion);
    
    // Backend returns JWE token - store it directly
    if (data.token) {
      // Validate JWE format
      if (!isValidJweFormat(data.token)) {
        console.warn('Token received is not in valid JWE format');
      }
      storeJweToken(data.token);
    }
    
    // Return standardized response
    const response = {
      success: true,
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        profileId: data.profileId
      },
      role: data.role,
      userRole: data.role, // For compatibility
      profile_completion: data.profile_completion || 0  // Ensure it defaults to 0
    };
    
    console.log('🎯 Returning from apiLogin:', response);
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    // Re-throw with all properties preserved
    throw error;
  }
};

/**
 * Register new user
 */
export const apiRegister = async (data) => {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      ...jsonConfig,
      method: 'POST',
      body: JSON.stringify(data)
    });

    return await handleResponse(res);
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Check if email is already registered
 */
export const apiCheckEmail = async (email) => {
  try {
    const res = await fetch(`${API_URL}/auth/check-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    return await handleResponse(res);
  } catch (error) {
    console.error('Email check error:', error);
    throw error;
  }
};

/**
 * Logout user and clear JWE token
 */
export const apiLogout = async () => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders()
    });
    
    // Clear JWE token from localStorage
    clearStoredToken();
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear token even if request fails
    clearStoredToken();
  }
};

/**
 * Verify email with OTP
 */
export const apiVerifyEmail = async (email, otp) => {
  try {
    const res = await fetch(`${API_URL}/auth/verify-email`, {
      ...jsonConfig,
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });

    return await handleResponse(res);
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
};

/**
 * Check email availability
 */
export const apiCheckEmailAvailability = async (email) => {
  try {
    const res = await fetch(`${API_URL}/auth/check-email?email=${encodeURIComponent(email)}`, {
      ...jsonConfig,
      method: 'GET'
    });

    return await handleResponse(res);
  } catch (error) {
    console.error('Email check error:', error);
    throw error;
  }
};

/**
 * Forgot password - request password reset link
 */
export const apiForgotPassword = async (email) => {
  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      ...jsonConfig,
      method: 'POST',
      body: JSON.stringify({ email })
    });

    return await handleResponse(res);
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

/**
 * Reset password - submit OTP and new password
 */
export const apiResetPassword = async (email, otp, newPassword) => {
  try {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      ...jsonConfig,
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword })
    });

    return await handleResponse(res);
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

/* =========================================================
   INTERN
========================================================= */

export const apiGetProfile = async () => {
  const res = await fetch(`${API_URL}/intern/profile`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiUpdateProfile = async (data) => {
  const res = await fetch(`${API_URL}/intern/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
};

export const apiUploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  const res = await fetch(`${API_URL}/intern/resume/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData
    // Don't set Content-Type header - browser will set it with boundary
  });
  return await handleResponse(res);
};

export const apiGetJobs = async () => {
  const res = await fetch(`${API_URL}/jobs`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetJobById = async (jobId) => {
  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiApplyJob = async (jobId) => {
  const res = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetMyApplications = async () => {
  const res = await fetch(`${API_URL}/intern/applications`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetRecommendedJobs = async () => {
  const res = await fetch(`${API_URL}/jobs/recommendations`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGenerateResumeAI = async (data) => {
  const res = await fetch(`${API_URL}/intern/resume/enhance`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
};

/* =========================================================
   COMPANY
========================================================= */

export const apiGetCompanyProfile = async () => {
  const res = await fetch(`${API_URL}/company/profile`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiUpdateCompanyProfile = async (data) => {
  const res = await fetch(`${API_URL}/company/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
};

export const apiUploadCompanyDocs = async (formData) => {
  // Get JWE token for authorization
  const jweToken = retrieveJweToken();
  
  if (!jweToken) {
    throw new Error('Authentication required. Please login first.');
  }
  
  const res = await fetch(`${API_URL}/upload/docs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jweToken}`
      // No Content-Type header! Browser sets multipart/form-data boundary automatically
    },
    credentials: 'include',
    body: formData
  });

  return await handleResponse(res);
};

export const apiGetCompanyPostings = async () => {
  const res = await fetch(`${API_URL}/company/postings`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiPostJob = async (jobData) => {
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(jobData)
  });
  return await handleResponse(res);
};

export const apiUpdateJob = async (jobId, jobData) => {
  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(jobData)
  });
  return await handleResponse(res);
};

export const apiDeleteJob = async (jobId) => {
  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetApplicants = async () => {
  const res = await fetch(`${API_URL}/jobs/applicants`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetApplicantById = async (id) => {
  const res = await fetch(`${API_URL}/company/applicant/${id}`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiUpdateApplicantStatus = async (id, status) => {
  const res = await fetch(`${API_URL}/company/application/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status })
  });
  return await handleResponse(res);
};

export const apiDownloadOfferLetter = async (applicantId) => {
  const res = await fetch(`${API_URL}/company/offer-letter/${applicantId}/download`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  
  if (!res.ok) throw new Error('Download failed');
  
  // Handle PDF download
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `offer-letter-${applicantId}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const apiSendOfferLetter = async (applicantId) => {
  const res = await fetch(`${API_URL}/company/offer-letter/${applicantId}/send`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

/* =========================================================
   ADMIN
========================================================= */

export const apiGetStats = async () => {
  const res = await fetch(`${API_URL}/admin/stats`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetAnalytics = async () => {
  const res = await fetch(`${API_URL}/admin/analytics`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetMapData = async () => {
  const res = await fetch(`${API_URL}/map`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetPendingCompanies = async () => {
  const res = await fetch(`${API_URL}/admin/verify/companies`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetCompanyForVerification = async (companyId) => {
  const res = await fetch(`${API_URL}/admin/verify/company/${companyId}`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiVerifyCompanyByAdmin = async (companyId) => {
  const res = await fetch(`${API_URL}/admin/verify/company/${companyId}`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status: 'Verified' })
  });
  return await handleResponse(res);
};

export const apiRejectCompany = async (companyId, reason) => {
  const res = await fetch(`${API_URL}/admin/verify/company/${companyId}/reject`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ reason })
  });
  return await handleResponse(res);
};

export const apiGetPendingInterns = async () => {
  const res = await fetch(`${API_URL}/admin/verify/interns`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetInternForVerification = async (internId) => {
  const res = await fetch(`${API_URL}/admin/verify/intern/${internId}`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiVerifyInternByAdmin = async (internId) => {
  const res = await fetch(`${API_URL}/admin/verify/intern/${internId}`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status: 'Active' })
  });
  return await handleResponse(res);
};

export const apiBanIntern = async (internId, reason) => {
  const res = await fetch(`${API_URL}/admin/verify/intern/${internId}/ban`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ reason })
  });
  return await handleResponse(res);
};

export const apiTriggerAllocation = async () => {
  const res = await fetch(`${API_URL}/admin/trigger-allocation`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetAllocationMatches = async () => {
  const res = await fetch(`${API_URL}/admin/allocation/matches`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiConfirmAllocation = async (id) => {
  const res = await fetch(`${API_URL}/admin/allocation/${id}/confirm`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetCertificates = async () => {
  const res = await fetch(`${API_URL}/certificates`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetCertificateById = async (certificateId) => {
  const res = await fetch(`${API_URL}/certificates/${certificateId}`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiIssueCertificate = async (internId, internshipId, companyId) => {
  const res = await fetch(`${API_URL}/certificates/issue`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ internId, internshipId, companyId })
  });
  return await handleResponse(res);
};

export const apiRevokeCertificate = async (certificateId, reason) => {
  const res = await fetch(`${API_URL}/certificates/${certificateId}/revoke`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ reason })
  });
  return await handleResponse(res);
};

export const apiRevalidateCertificate = async (certificateId) => {
  const res = await fetch(`${API_URL}/certificates/${certificateId}/revalidate`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetCompletedInternships = async () => {
  const res = await fetch(`${API_URL}/admin/completed-internships`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiGetNotifications = async () => {
  const res = await fetch(`${API_URL}/notifications`, {
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

export const apiMarkNotificationsRead = async () => {
  const res = await fetch(`${API_URL}/notifications/read`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include'
  });
  return await handleResponse(res);
};

/* =========================================================
   RESUME BUILDER SERVICE (separate microservice on port 5004)
========================================================= */

export const apiResumeGetTemplates = async () => {
  const res = await fetch(`${RESUME_API_URL}/templates`, {
    headers: getResumeHeaders(null)
  });
  return await handleResponse(res);
};

export const apiResumeGetTemplatePreview = async (templateId) => {
  const res = await fetch(`${RESUME_API_URL}/templates/${templateId}/preview`, {
    headers: getResumeHeaders(null)
  });
  if (!res.ok) throw new Error(`Preview failed (${res.status})`);
  return await res.text();
};

export const apiResumePreview = async (internId, templateId, payload = {}) => {
  const res = await fetch(`${RESUME_API_URL}/preview/${internId}/${templateId}`, {
    method: 'POST',
    headers: getResumeHeaders('application/json'),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Preview failed (${res.status})`);
  return await res.text();
};

export const apiResumeGenerate = async (internId, templateId, payload = {}) => {
  const res = await fetch(`${RESUME_API_URL}/generate/${internId}/${templateId}`, {
    method: 'POST',
    headers: getResumeHeaders('application/json'),
    body: JSON.stringify(payload)
  });
  return await handleResponse(res);
};

export const apiResumeDownloadHistory = async (internId) => {
  const res = await fetch(`${RESUME_API_URL}/history/${internId}`, {
    headers: getResumeHeaders(null)
  });
  return await handleResponse(res);
};

export const apiSendCertificateEmail = async (certificateId) => {
  const res = await fetch(`${API_URL}/certificates/${certificateId}/send`, {
    method: 'POST',
    headers: getHeaders()
  });

  if (!res.ok) throw new Error('Failed to send email');
  return await res.json();
};