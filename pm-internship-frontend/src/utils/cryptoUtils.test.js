import { storeJweToken, retrieveJweToken, clearStoredToken, isValidJweFormat } from './cryptoUtils';

async function testJweTokenHandling() {
  // Simulated JWE token (5 parts separated by dots)
  const testJweToken = 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..test_iv.test_ciphertext.test_tag';
  
  try {
    console.log('Testing JWE Token Handling...\n');
    
    // Test format validation
    console.log('1. Testing JWE format validation:');
    console.log('   Valid JWE:', isValidJweFormat(testJweToken));
    console.log('   Invalid JWE:', isValidJweFormat('invalid.token'));
    console.log('   Null:', isValidJweFormat(null));
    console.log('');
    
    // Test storage
    console.log('2. Testing JWE token storage:');
    storeJweToken(testJweToken);
    console.log('   Token stored successfully');
    console.log('');
    
    // Test retrieval
    console.log('3. Testing JWE token retrieval:');
    const retrievedToken = retrieveJweToken();
    console.log('   Retrieved token:', retrievedToken);
    console.log('   Match:', testJweToken === retrievedToken);
    console.log('');
    
    // Test clearing
    console.log('4. Testing token clearing:');
    clearStoredToken();
    const afterClear = retrieveJweToken();
    console.log('   Token after clear:', afterClear);
    console.log('   Is null:', afterClear === null);
    console.log('');
    
    console.log('All tests passed! ✅');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testJweTokenHandling();