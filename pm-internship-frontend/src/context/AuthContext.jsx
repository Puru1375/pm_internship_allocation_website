// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { apiLogin, apiRegister, apiLogout } from "../services/api";
import { 
  retrieveJweToken, 
  clearStoredToken,
  isValidJweFormat
} from "../utils/cryptoUtils";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize user from stored data and validate JWE token
    const initializeUser = async () => {
      try {
        const storedUserData = localStorage.getItem("pm_portal_user");
        const storedCompletion = localStorage.getItem("pm_profile_completion");
        
        if (storedCompletion !== null) {
          const parsed = Number(storedCompletion);
          const finalValue = Number.isFinite(parsed) ? parsed : 0;
          setProfileCompletion(finalValue);
        }
        
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          
          // Verify JWE token exists and has valid format
          const jweToken = retrieveJweToken();
          if (jweToken) {
            // Token exists - verify format
            if (isValidJweFormat(jweToken)) {
              setUser(userData);
            } else {
              // Token format is invalid - clear and logout
              console.warn('❌ Invalid JWE token format - logging out');
              localStorage.removeItem("pm_portal_user");
              clearStoredToken();
            }
          } else {
            // No token found - clear user data
            console.debug('ℹ️ No JWE token found - user not logged in or session expired');
            localStorage.removeItem("pm_portal_user");
            clearStoredToken();
          }
        }
        // If no stored user data, that's fine - user hasn't logged in yet
      } catch (err) {
        console.error('Failed to initialize user:', err);
        localStorage.removeItem("pm_portal_user");
        localStorage.removeItem("pm_profile_completion");
        clearStoredToken();
        setProfileCompletion(0);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  /**
   * Update profile completion in context and storage
   * Called after profile updates to immediately reflect changes
   */
  const updateProfileCompletion = (newCompletion) => {
    const numCompletion = Number(newCompletion);
    console.log('🔄 Updating profile completion:', newCompletion, '-> Number:', numCompletion);
    const finalCompletion = Number.isFinite(numCompletion) ? numCompletion : 0;
    console.log('✅ Profile completion updated to:', finalCompletion);
    setProfileCompletion(finalCompletion);
    localStorage.setItem("pm_profile_completion", finalCompletion.toString());
  };

  /**
   * Login handler with JWE token
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} captchaToken - reCAPTCHA token
   * @returns {object} - { success: boolean, message?: string, userRole?: string }
   */
  const login = async (email, password, captchaToken) => {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!captchaToken) {
        throw new Error('Please complete the CAPTCHA verification');
      }

      // Call API - JWE token storage is handled in apiLogin
      const userData = await apiLogin(email, password, captchaToken);

      console.log('🔐 Login API response:', userData);
      console.log('📊 Response keys:', Object.keys(userData));
      console.log('📊 profile_completion in response:', userData.profile_completion);

      // Validate response
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid response from server');
      }

      // Check if login was successful
      if (!userData.success) {
        throw new Error(userData.message || 'Login failed');
      }

      // Get user role from response
      const userRole = userData.role || userData.userRole;

      if (!userRole) {
        throw new Error('User role not provided by server');
      }

      // Store user data (JWE token is stored separately in localStorage)
      const userWithRole = {
        ...userData.user,
        role: userRole,
        email: userData.user?.email || email
      };
      console.log('Login successful - user data:', userData);

      setUser(userWithRole);
      // Store profile completion score from login response
      const loginCompletion = Number(userData.profile_completion);
      console.log('Login response profile_completion:', userData.profile_completion, '-> Number:', loginCompletion);
      const finalCompletion = Number.isFinite(loginCompletion) ? loginCompletion : 0;
      console.log('Final profile completion stored:', finalCompletion);
      setProfileCompletion(finalCompletion);
      localStorage.setItem("pm_portal_user", JSON.stringify(userWithRole));
      localStorage.setItem("pm_profile_completion", finalCompletion.toString());
      
      return { 
        success: true, 
        userRole: userRole,
        profileCompletion: finalCompletion
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Clean up on error
      clearStoredToken();
      localStorage.removeItem("pm_portal_user");
      
      // Extract rate limit info from error object
      const remainingAttempts = error.remainingAttempts;
      const remainingMinutes = error.remainingMinutes;
      const isRateLimited = error.status === 429;
      
      let message = error.message || 'Login failed. Please try again.';
      
      // Add rate limit details to message if available
      if (isRateLimited && remainingMinutes) {
        message = `Too many failed login attempts. Please try again in ${remainingMinutes} minutes.`;
      } else if (remainingAttempts !== undefined && remainingAttempts > 0) {
        message = `${message}\nRemaining attempts: ${remainingAttempts}`;
      }
      
      return { 
        success: false, 
        message: message,
        remainingAttempts: remainingAttempts,
        remainingMinutes: remainingMinutes,
        isRateLimited: isRateLimited
      };
    }
  };

  /**
   * Registration handler
   * @param {object} data - Registration data
   * @returns {object} - { success: boolean, message?: string, data?: object }
   */
  const register = async (data) => {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid registration data');
      }

      const res = await apiRegister(data);
      
      if (!res) {
        throw new Error('Invalid response from server');
      }

      return { 
        success: true, 
        data: res 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  };

  /**
   * Logout handler with token cleanup
   */
  const logout = async () => {
    try {
      // Call logout API to invalidate session on server
      await apiLogout();
      
      // Clear local state
      setUser(null);
      setProfileCompletion(0);
      localStorage.removeItem("pm_portal_user");
      localStorage.removeItem("pm_profile_completion");
      clearStoredToken();
      
      // Redirect to login
      window.location.href = "/login";
    } catch (err) {
      console.error('Logout error:', err);
      
      // Still clear local data even if API call fails
      setUser(null);
      setProfileCompletion(0);
      localStorage.removeItem("pm_portal_user");
      localStorage.removeItem("pm_profile_completion");
      clearStoredToken();
      
      // Redirect to login
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profileCompletion,
      updateProfileCompletion,
      login, 
      register, 
      logout, 
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};