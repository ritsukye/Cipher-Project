const express = require('express');
const { landingPage, cipherOptions } = require('./public/utility.js');
const { railFenceCipher } = require('./src/ciphers/railfence.js');
const { playfairCipher } = require('./src/ciphers/playfair.js');
const { aesCipher } = require('./src/ciphers/aes.js');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function reinsertSpaces(original, encryptedLetters) {
  let letterIndex = 0;
  return original.split('').map(char => {
    if (char === ' ') return ' ';
    return encryptedLetters[letterIndex++] ?? '';
  }).join('');
}

function getRailAssignments(length, rails) {
  const assignments = [];
  let rail = 0;
  let direction = 1;
  for (let i = 0; i < length; i++) {
    assignments.push(rail);
    if (rail === rails - 1) direction = -1;
    if (rail === 0) direction = 1;
    rail += direction;
  }
  return assignments;
}

function generateLetterMapping(original, ciphertext, cipher, params) {
  const mapping = [];
  let originalIndex = 0;
  let ciphertextIndex = 0;
  let letterCount = 0;

  while (originalIndex < original.length && ciphertextIndex < ciphertext.length) {
    const origChar = original[originalIndex];
    const cipherChar = ciphertext[ciphertextIndex];

    if (origChar === ' ') {
      mapping.push({ original: ' ', cipher: ' ', isSpace: true });
      originalIndex++;
      ciphertextIndex++;
    } else {
      let explanation = '';
      if (cipher === 'caesar') {
        explanation = `'${origChar.toUpperCase()}' shifted by ${params.shift} → '${cipherChar.toUpperCase()}'`;
      } else if (cipher === 'railfence') {
        const railNum = params.railAssignments?.[letterCount] ?? '?';
        explanation = `'${origChar.toUpperCase()}' on rail ${typeof railNum === 'number' ? railNum + 1 : '?'} → cipher position '${cipherChar.toUpperCase()}'`;
      }
      mapping.push({ original: origChar, cipher: cipherChar, isSpace: false, explanation });
      originalIndex++;
      ciphertextIndex++;
      letterCount++;
    }
  }
  return mapping;
}

function getCipherExplanation(cipher, params) {
  switch (cipher) {
    case 'caesar':
      return `Each letter is shifted ${params.shift} position${params.shift === 1 ? '' : 's'} forward in the alphabet. When a letter reaches the end, it wraps around to the beginning.`;
    case 'railfence':
      return `The text is arranged in ${params.rails} rows in a zigzag pattern, then read row by row to produce the ciphertext.`;
    case 'aes':
      return 'AES-128 arranges your message into a 4×4 grid of bytes, then scrambles it across 10 rounds of SubBytes, ShiftRows, MixColumns, and AddRoundKey operations.';
    default:
      return 'Cipher explanation not available yet.';
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  const { cipher = 'caesar' } = req.query;
  res.send(landingPage({ selectedCipher: cipher }));
});

app.post('/api/encrypt', (req, res) => {
  var { plaintext = '', shift = '0', rails = '2', cipher = 'caesar', key = '' } = req.body;

  const sanitized = lettersAndSpacesOnly(plaintext);
  const lettersOnly = sanitized.replace(/ /g, '');

  // ── AES ──
  if (cipher === 'aes') {
    // const trimmedKey = key.slice(0, 16);
    key = "abcdefghijklmnop"
    trimmedKey = "abcdefghijklmnop"

    if (Buffer.from(key, 'binary').length !== 16) {
      return res.status(400).json({ error: 'AES-128 requires a key that is exactly 16 characters long. Your string has ' + Buffer.from(key, 'binary').length + ' characters.' });
    }

    try {
      const { ciphertext, iv } = aesCipher(lettersOnly, trimmedKey);
      return res.json({
        plaintext: sanitized,
        ciphertext,
        iv,
        explanation: getCipherExplanation('aes', {}),
      });
    } catch (err) {
      return res.status(500).json({ error: `Encryption failed: ${err.message}` });
    }
  }

  // ── Rail Fence ──
  if (cipher === 'railfence') {
    const numericRails = Number(rails);

    if (!Number.isFinite(numericRails) || numericRails < 2) {
      return res.status(400).json({ error: 'Rails must be a valid number >= 2.' });
    }

    const encryptedLetters = railFenceCipher(lettersOnly, numericRails);
    const ciphertext = reinsertSpaces(sanitized, encryptedLetters);
    const railAssignments = getRailAssignments(lettersOnly.length, numericRails);

    const rowOrder = [];
    for (let r = 0; r < numericRails; r++) {
      railAssignments.forEach((rail, idx) => {
        if (rail === r) rowOrder.push(idx);
      });
    }

    return res.json({
      plaintext: sanitized,
      ciphertext,
      explanation: getCipherExplanation('railfence', { rails: numericRails }),
      mapping: generateLetterMapping(sanitized, ciphertext, 'railfence', { railAssignments }),
      railAssignments,
      rails: numericRails,
      rowOrder,
    });
  }

  // ── Caesar ──
  if (cipher === 'caesar') {
    const numericShift = Number(shift);

    if (!Number.isFinite(numericShift)) {
      return res.status(400).json({ error: 'Please enter a valid number for the shift.' });
    }

    const encryptedLetters = caesarCipher(lettersOnly, numericShift);
    const ciphertext = reinsertSpaces(sanitized, encryptedLetters);

    return res.json({
      plaintext: sanitized,
      ciphertext,
      explanation: getCipherExplanation('caesar', { shift: numericShift }),
      mapping: generateLetterMapping(sanitized, ciphertext, 'caesar', { shift: numericShift }),
    });
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

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});