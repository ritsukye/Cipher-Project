const express = require('express');
const { landingPage, cipherOptions } = require('./public/utility.js');  // fix: was incorrectly destructuring non-exports
const { railFenceCipher } = require('./src/ciphers/railfence.js');
const { playfairCipher } = require('./src/ciphers/playfair.js');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: false }));

// Strips non-letter characters except spaces, preserving space positions
function lettersAndSpacesOnly(text) {
  return text.replace(/[^a-zA-Z ]/g, '');
}

function caesarCipher(text, shift) {
  const normalizedShift = ((Number(shift) % 26) + 26) % 26;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= 'a' && char <= 'z' ? 97 : 65;
    const shiftedCode = ((char.charCodeAt(0) - base + normalizedShift) % 26) + base;
    return String.fromCharCode(shiftedCode);
  });
}

app.get('/', (req, res) => {
  const { cipher = 'caesar' } = req.query;
  res.send(landingPage({ selectedCipher: cipher }));
});

app.post('/', (req, res) => {
  const { plaintext = '', shift = '0', rails = '2', keyword = '', cipher = 'caesar' } = req.body;

  // Sanitize: letters and spaces only (applies to all ciphers)
  const sanitized = lettersAndSpacesOnly(plaintext);

  if (cipher === 'railfence') {
    const numericRails = Number(rails);

    if (!Number.isFinite(numericRails) || numericRails < 2) {
      res.status(400).send(landingPage({
        plaintext: sanitized,
        selectedCipher: cipher,
        rails: rails,
        error: 'Rails must be a valid number >= 2.',
      }));
      return;
    }

    // Encrypt only the letters, then reinsert spaces at their original positions
    const lettersOnly = sanitized.replace(/ /g, '');
    const encryptedLetters = railFenceCipher(lettersOnly, numericRails);
    const ciphertext = reinsertSpaces(sanitized, encryptedLetters);

    res.send(landingPage({
      plaintext: sanitized,
      selectedCipher: cipher,
      rails: numericRails,
      ciphertext,
    }));
    return;
  }

  if (cipher === 'caesar') {
    const numericShift = Number(shift);

    if (!Number.isFinite(numericShift)) {
      res.status(400).send(landingPage({
        plaintext: sanitized,
        shift,
        selectedCipher: cipher,
        error: 'Please enter a valid number for the shift.',
      }));
      return;
    }

    // Encrypt only the letters, then reinsert spaces
    const lettersOnly = sanitized.replace(/ /g, '');
    const encryptedLetters = caesarCipher(lettersOnly, numericShift);
    const ciphertext = reinsertSpaces(sanitized, encryptedLetters);

    res.send(landingPage({
      plaintext: sanitized,
      shift: numericShift,
      selectedCipher: cipher,
      ciphertext,
    }));
    return;
  }

  if (cipher === 'playfair') {
    if (!keyword.trim()) {
      res.status(400).send(landingPage({
        plaintext: sanitized,
        keyword,
        selectedCipher: cipher,
        error: 'Please enter a keyword.',
      }));
      return;
    }

    const lettersOnly = sanitized.replace(/ /g, '');
    const ciphertext = playfairCipher(lettersOnly, keyword);

    res.send(landingPage({
      plaintext: sanitized,
      keyword,
      selectedCipher: cipher,
      ciphertext,
    }));
    return;
  }

  // Fallback for unimplemented ciphers
  res.send(landingPage({
    plaintext: sanitized,
    shift,
    rails,
    keyword,
    selectedCipher: cipher,
    ciphertext: `${cipherOptions.find((o) => o.value === cipher)?.label || 'Selected cipher'} is not implemented yet.`,
  }));
});

/**
 * Given the original (sanitized) text with spaces and a string of
 * encrypted letters (spaces removed), reinserts spaces at their
 * original positions.
 *
 * e.g. original="HE LO", encrypted="FCJB" → "FC JB"
 */
function reinsertSpaces(original, encryptedLetters) {
  let letterIndex = 0;
  return original.split('').map(char => {
    if (char === ' ') return ' ';
    return encryptedLetters[letterIndex++] ?? '';
  }).join('');
}

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});