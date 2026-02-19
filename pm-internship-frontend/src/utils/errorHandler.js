/**
 * Centralized Error Handling Utility
 * Provides consistent error messages and formatting across the app
 */

export const ErrorHandler = {
  /**
   * Parse error from different sources (fetch, API, etc.)
   */
  parseError: (error) => {
    // Network error
    if (error instanceof TypeError) {
      return 'Network error. Please check your internet connection.';
    }

    // Custom error message
    if (error.message) {
      return error.message;
    }

    // Generic fallback
    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Handle API error responses
   */
  handleApiError: async (response) => {
    try {
      const errorData = await response.json();
      if (errorData.message) {
        throw new Error(errorData.message);
      }
    } catch (parseError) {
      // If JSON parsing fails, use HTTP status
      const statusMessages = {
        400: 'Bad request. Please check your input.',
        401: 'Unauthorized. Please log in again.',
        403: 'Access forbidden.',
        404: 'Resource not found.',
        409: 'Conflict with existing data.',
        500: 'Server error. Please try again later.',
        503: 'Service unavailable. Please try again later.',
      };
      throw new Error(statusMessages[response.status] || `Error: ${response.statusText}`);
    }
  },

  /**
   * Validate email format
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address.';
    }
    return null;
  },

  /**
   * Validate password strength
   */
  validatePassword: (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    return null;
  },

  /**
   * Get user-friendly error messages for common issues
   */
  getUserFriendlyMessage: (error) => {
    const errorString = (error.message || error.toString()).toLowerCase();

    if (errorString.includes('network')) {
      return 'Network connection failed. Please check your internet.';
    }
    if (errorString.includes('unauthorized') || errorString.includes('not authorized')) {
      return 'Your session has expired. Please log in again.';
    }
    if (errorString.includes('already exists')) {
      return 'This email is already registered.';
    }
    if (errorString.includes('not found')) {
      return 'The requested resource was not found.';
    }
    if (errorString.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    return ErrorHandler.parseError(error);
  },
};

export default ErrorHandler;
