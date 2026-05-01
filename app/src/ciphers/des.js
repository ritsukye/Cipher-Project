const CryptoJS = require('crypto-js');

const IV_LENGTH = 8;

/**
 * Encrypts text using DES-CBC.
 *
 * @param {string} text      - Letters-only plaintext (no spaces)
 * @param {string} keyString - Exactly 8 ASCII characters
 * @returns {{ ciphertext: string, iv: string }}
 */
function desCipher(text, keyString) {
  if (Buffer.byteLength(keyString, 'utf8') !== 8) {
    throw new Error('DES key must be exactly 8 characters.');
  }

  // Generate random 8-byte IV
  const ivBuffer = require('crypto').randomBytes(IV_LENGTH);

  // Convert to CryptoJS format
  const key = CryptoJS.enc.Utf8.parse(keyString);
  const iv = CryptoJS.enc.Hex.parse(ivBuffer.toString('hex'));

  const encrypted = CryptoJS.DES.encrypt(
    text,
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );

  return {
    ciphertext: encrypted.ciphertext.toString().toUpperCase(),
    iv: ivBuffer.toString('hex').toUpperCase(),
  };
}

module.exports = { desCipher };