// src/utils/cryptoUtils.js

/**
 * JWE Token Storage Utility
 * Backend sends JWE (JSON Web Encryption) tokens that are already encrypted
 * Frontend just needs to store and retrieve them without additional encryption
 */

/**
 * Store JWE token in localStorage
 * @param {string} jweToken - JWE token from backend (already encrypted)
 */
export function storeJweToken(jweToken) {
  try {
    if (!jweToken || typeof jweToken !== 'string') {
      throw new Error('Invalid JWE token');
    }
    localStorage.setItem('pm_portal_token', jweToken);
    return jweToken;
  } catch (error) {
    console.error('Failed to store JWE token:', error);
    throw error;
  }
}

/**
 * Retrieve JWE token from localStorage
 * @returns {string|null} - JWE token or null if not found
 */
export function retrieveJweToken() {
  try {
    const jweToken = localStorage.getItem('pm_portal_token');
    return jweToken || null;
  } catch (error) {
    console.error('Failed to retrieve JWE token:', error);
    return null;
  }
}

/**
 * Validate JWE token format (basic check)
 * JWE compact serialization has 5 parts separated by dots
 * @param {string} token - Token to validate
 * @returns {boolean} - True if token appears to be a valid JWE
 */
export function isValidJweFormat(token) {
  if (!token || typeof token !== 'string') return false;
  
  // JWE compact serialization format: header.encrypted_key.iv.ciphertext.tag
  const parts = token.split('.');
  return parts.length === 5;
}

/**
 * Clear stored token
 */
export function clearStoredToken() {
  localStorage.removeItem('pm_portal_token');
}

/**
 * Check if browser supports required features
 * (Keeping for compatibility, though JWE is handled by backend)
 */
export function isCryptoAvailable() {
  return !!(window.crypto && window.crypto.subtle);
}

// Legacy exports for backward compatibility
export const storeEncryptedToken = storeJweToken;
export const retrieveDecryptedToken = retrieveJweToken;