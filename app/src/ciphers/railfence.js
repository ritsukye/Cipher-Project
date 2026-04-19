/**
 * Rail Fence Cipher
 * Encrypts plaintext by writing it in a zigzag across `rails` rows,
 * then reading each row left-to-right.
 *
 * @param {string} text  - The plaintext to encrypt
 * @param {number} rails - Number of rails (must be >= 2)
 * @returns {string} ciphertext
 */
function railFenceCipher(text, rails) {
  const numRails = Number(rails);

  if (!Number.isFinite(numRails) || numRails < 2) {
    throw new Error('Rails must be a number >= 2.');
  }

  if (numRails >= text.length) {
    // With more rails than characters the fence is trivially the plaintext
    return text;
  }

  // Build an array of strings, one per rail
  const fence = Array.from({ length: numRails }, () => []);

  let rail = 0;
  let direction = 1; // +1 going down, -1 going up

  for (const char of text) {
    fence[rail].push(char);

    // Bounce at top and bottom rails
    if (rail === 0) direction = 1;
    if (rail === numRails - 1) direction = -1;

    rail += direction;
  }

  return fence.map(r => r.join('')).join('');
}

module.exports = { railFenceCipher };