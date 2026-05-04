/**
 * Caesar Cipher
 * Encrypts plaintext by shifting letters to the right x amount of times.
 * - I and J share a cell
 * - Digraphs (letter pairs) are encrypted by the position rules:
 *   same row → shift right, same col → shift down, rectangle → swap columns
 *
 * @param {string} text    - Plaintext (letters only, spaces stripped by caller)
 * @param {int} shift - Amount to shift by
 * @returns {string} ciphertext (uppercase)
 */
 
function caesarCipher(text, shift) {
  const normalizedShift = ((Number(shift) % 26) + 26) % 26;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= 'a' && char <= 'z' ? 97 : 65;
    const shiftedCode = ((char.charCodeAt(0) - base + normalizedShift) % 26) + base;
    return String.fromCharCode(shiftedCode);
  });
}

module.exports = { caesarCipher };
