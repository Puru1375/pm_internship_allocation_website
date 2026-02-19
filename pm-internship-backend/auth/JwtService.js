// auth/jwtService.js
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { CompactEncrypt, compactDecrypt } = require('jose');
const crypto = require('crypto');

require('dotenv').config();

/**
 * RSA KEYS (Signing)
 */
const privateKey = fs.readFileSync(
  path.resolve(process.env.JWT_PRIVATE_KEY_PATH),
  'utf8'
);

const publicKey = fs.readFileSync(
  path.resolve(process.env.JWT_PUBLIC_KEY_PATH),
  'utf8'
);

/**
 * AES-256 KEY (Encryption)
 * Must be 32 bytes base64url
 */
let JWE_KEY;
try {
  // The key should be 32 bytes for A256GCM
  const keyBuffer = Buffer.from(process.env.JWE_SECRET_KEY, 'base64url');
  
  if (keyBuffer.length !== 32) {
    console.warn(`⚠️  JWE_SECRET_KEY is ${keyBuffer.length} bytes, expected 32 bytes`);
    console.warn('⚠️  Generating a new 32-byte key...');
    // Generate a proper 32-byte key
    const newKey = crypto.randomBytes(32);
    JWE_KEY = crypto.createSecretKey(newKey);
    console.log('✅ Generated JWE key (base64url):', newKey.toString('base64url'));
    console.log('⚠️  Please update your .env file with: JWE_SECRET_KEY=' + newKey.toString('base64url'));
  } else {
    JWE_KEY = crypto.createSecretKey(keyBuffer);
    console.log('✅ JWE key loaded successfully');
  }
} catch (error) {
  console.error('❌ Failed to load JWE_SECRET_KEY:', error.message);
  console.log('⚠️  Generating a new 32-byte key...');
  const newKey = crypto.randomBytes(32);
  JWE_KEY = crypto.createSecretKey(newKey);
  console.log('✅ Generated JWE key (base64url):', newKey.toString('base64url'));
  console.log('⚠️  Please update your .env file with: JWE_SECRET_KEY=' + newKey.toString('base64url'));
}

const ISSUER = process.env.JWT_ISSUER;
const AUDIENCE = process.env.JWT_AUDIENCE;
const EXP_MIN = Number(process.env.JWT_EXPIRES_IN_MINUTES || 1440); // Default 24 hours

/**
 * ✅ Build MINIMAL claims
 */
function buildClaims(userId) {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: String(userId),
    iss: ISSUER,
    aud: AUDIENCE,
    iat: now,
    exp: now + EXP_MIN * 60,
    jti: crypto.randomUUID(),
  };
}

/**
 * ✅ Step 1: Sign JWT (RS256)
 */
function signJwt(claims) {
  const token = jwt.sign(claims, privateKey, {
    algorithm: 'RS256',
    // Don't add issuer/audience here - they're already in claims
  });
  console.log('📝 Signed JWT (first 50 chars):', token.substring(0, 50));
  console.log('📝 Signed JWT length:', token.length);
  return token;
}

/**
 * ✅ Step 2: Encrypt JWT → JWE
 */
async function encryptJwt(signedJwt) {
  try {
    // Use Buffer instead of TextEncoder for Node.js
    const payload = Buffer.from(signedJwt, 'utf-8');
    
    const jwe = await new CompactEncrypt(payload)
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .encrypt(JWE_KEY);
    
    return jwe;
  } catch (error) {
    console.error('❌ JWE encryption failed:', error);
    throw new Error(`JWE encryption failed: ${error.message}`);
  }
}

/**
 * ✅ Step 3: Decrypt JWE
 */
async function decryptJwe(jweToken) {
  try {
    if (!jweToken) {
      throw new Error('No JWE token provided');
    }
    
    const { plaintext } = await compactDecrypt(jweToken, JWE_KEY);
    
    // Convert Uint8Array to string properly
    const decoder = new TextDecoder();
    const jwtString = decoder.decode(plaintext);
    
    console.log('📝 Decrypted JWT (first 50 chars):', jwtString.substring(0, 50));
    console.log('📝 Decrypted JWT length:', jwtString.length);
    
    return jwtString;
  } catch (error) {
    console.error('❌ JWE decryption error:', error.message);
    throw new Error(`JWE decryption failed: ${error.message}`);
  }
}

/**
 * ✅ Step 4: Verify Signed JWT
 */
function verifyJwt(signedJwt) {
  return jwt.verify(signedJwt, publicKey, {
    algorithms: ['RS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

module.exports = {
  buildClaims,
  signJwt,
  encryptJwt,
  decryptJwe,
  verifyJwt,
};
