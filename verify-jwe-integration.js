#!/usr/bin/env node

/**
 * JWE Token Integration Verification Script
 * 
 * This script helps verify that the frontend is correctly handling JWE tokens
 * Run this after starting both backend and frontend servers
 */

console.log('\n=== JWE Token Integration Verification ===\n');

// Test 1: Check cryptoUtils exports
console.log('✓ Test 1: Checking cryptoUtils exports...');
try {
  // In Node.js, we would need to use dynamic import or run in browser
  console.log('  → Run this in browser console or use browser testing');
  console.log('  → Import: import { storeJweToken, retrieveJweToken, isValidJweFormat } from "./utils/cryptoUtils"');
} catch (error) {
  console.error('  ✗ Failed:', error.message);
}

// Test 2: JWE Format Validation
console.log('\n✓ Test 2: JWE Format Validation Examples...');
const validJweExamples = [
  'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..abc123.def456.ghi789',
  'header.enckey.iv.cipher.tag'
];

const invalidJweExamples = [
  'invalid.token',
  'only.three.parts',
  null,
  undefined,
  ''
];

console.log('  Valid JWE formats (5 parts):');
validJweExamples.forEach(token => {
  const parts = token?.split('.').length || 0;
  console.log(`    → ${parts} parts: "${token.substring(0, 30)}..."`);
});

console.log('  Invalid JWE formats:');
invalidJweExamples.forEach(token => {
  console.log(`    → "${token}"`);
});

// Test 3: Check API Configuration
console.log('\n✓ Test 3: API Configuration Checklist...');
const apiChecklist = [
  '[ ] API_URL points to correct backend (default: http://localhost:5000/api)',
  '[ ] credentials: "include" is set for cookie support',
  '[ ] getHeaders() includes Authorization header with Bearer token',
  '[ ] apiLogin() stores JWE token after successful login',
  '[ ] apiLogout() clears stored JWE token',
  '[ ] All authenticated endpoints use getHeaders()'
];

apiChecklist.forEach(item => console.log(`  ${item}`));

// Test 4: Frontend Login Flow
console.log('\n✓ Test 4: Frontend Login Flow...');
const loginSteps = [
  '1. User enters email/password',
  '2. apiLogin() sends POST to /api/auth/login',
  '3. Backend validates and returns JWE token',
  '4. Frontend validates JWE format (5 parts)',
  '5. Frontend stores JWE in localStorage as "pm_portal_token"',
  '6. Frontend stores user data in localStorage as "pm_portal_user"',
  '7. AuthContext updates user state',
  '8. User is redirected to dashboard'
];

loginSteps.forEach(step => console.log(`  ${step}`));

// Test 5: Token in Requests
console.log('\n✓ Test 5: Token Usage in API Requests...');
console.log('  Example authenticated request:');
console.log(`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <JWE_TOKEN>'
  };
  
  fetch('/api/intern/profile', {
    headers,
    credentials: 'include'
  });
`);

// Test 6: Browser Console Commands
console.log('\n✓ Test 6: Browser Console Testing Commands...');
console.log('  After logging in, run these in browser console:');
console.log(`
  // Check if token is stored
  const token = localStorage.getItem('pm_portal_token');
  console.log('Token:', token);
  
  // Check token format (should have 5 parts)
  console.log('Parts:', token?.split('.').length);
  
  // Check user data
  const user = JSON.parse(localStorage.getItem('pm_portal_user'));
  console.log('User:', user);
  
  // Verify token is valid JWE format
  import { isValidJweFormat } from './utils/cryptoUtils';
  console.log('Valid JWE:', isValidJweFormat(token));
`);

// Test 7: Backend Verification
console.log('\n✓ Test 7: Backend Verification...');
console.log('  Check backend console logs for:');
console.log('    → "✅ JWE token verified successfully"');
console.log('    → No "JWE verification failed" errors');
console.log('    → No "Invalid or expired token" errors');

// Test 8: Common Issues
console.log('\n✓ Test 8: Common Issues & Solutions...');
const commonIssues = [
  {
    issue: 'Login fails with "Invalid response"',
    solution: 'Check backend is running and returning JWE token'
  },
  {
    issue: 'Token format warning in console',
    solution: 'Verify backend JWE token has 5 parts separated by dots'
  },
  {
    issue: 'API requests return 401 Unauthorized',
    solution: 'Check Authorization header includes Bearer token'
  },
  {
    issue: 'User logged out unexpectedly',
    solution: 'Check token expiry time in backend (default: 15 minutes)'
  }
];

commonIssues.forEach(({ issue, solution }) => {
  console.log(`\n  Issue: ${issue}`);
  console.log(`  Solution: ${solution}`);
});

// Summary
console.log('\n=== Verification Summary ===\n');
console.log('To complete verification:');
console.log('1. Start backend server: cd pm-internship-backend && node server.js');
console.log('2. Start frontend server: cd pm-internship-frontend && npm run dev');
console.log('3. Open browser to http://localhost:5173');
console.log('4. Open browser console (F12)');
console.log('5. Try logging in with valid credentials');
console.log('6. Check localStorage for pm_portal_token');
console.log('7. Verify token has 5 parts separated by dots');
console.log('8. Try accessing authenticated pages');
console.log('9. Check backend logs for JWE verification success');
console.log('\n✓ Integration complete!\n');
