const crypto = require('crypto');

const AES_ALGORITHM = 'aes-128-cbc';
const IV_LENGTH = 16; // AES block size in bytes

/**
 * Encrypts text using AES-128-CBC.
 * Spaces are stripped before encryption (caller handles reinsertion).
 *
 * @param {string} text      - Letters-only plaintext (no spaces)
 * @param {string} keyString - Exactly 16 ASCII characters (128-bit key)
 * @returns {{ ciphertext: string, iv: string }} hex-encoded ciphertext and IV
 */


function aesCipher(text, keyString) {
  if (Buffer.byteLength(keyString, 'utf8') !== 16) {
    throw new Error('AES-128 key must be exactly 16 characters.');
  }

  const key = Buffer.from(keyString, 'utf8');
  const iv  = crypto.randomBytes(IV_LENGTH);  // fresh random IV every encrypt
  console.log('Algorithm:', AES_ALGORITHM);
  console.log('Key Buffer:', key, 'Length:', key.length);
  console.log('IV Buffer:', iv, 'Length:', iv.length);


  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  return {
    ciphertext: encrypted.toString('hex').toUpperCase(),
    iv: iv.toString('hex').toUpperCase(),
  };
}

module.exports = { aesCipher };