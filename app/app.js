const express = require('express');
const { landingPage, cipherOptions } = require('./public/utility.js');
const { caesarCipher } = require('./src/ciphers/caesar.js')
const { railFenceCipher } = require('./src/ciphers/railfence.js');
const { playfairCipher } = require('./src/ciphers/playfair.js');
const { aesCipher } = require('./src/ciphers/aes.js');
const { desCipher } = require('./src/ciphers/des.js');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// ── Helpers ───────────────────────────────────────────────────────────────────

function lettersAndSpacesOnly(text) {
  return text.replace(/[^a-zA-Z ]/g, '');
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
    case 'des':
      return 'DES splits your message into 64-bit blocks and runs each through 16 rounds of permutations, substitutions, and XOR operations using subkeys derived from your 8-character key.';
    default:
      return 'Cipher explanation not available yet.';
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET / — serve the landing page
app.get('/', (req, res) => {
  const { cipher = 'caesar' } = req.query;
  res.send(landingPage({ selectedCipher: cipher }));
});

// POST / — handles the rare case where JS is disabled and the form submits natively.
// Redirects to GET / so the user always gets a proper page rather than a JSON error.
app.post('/', (req, res) => {
  res.redirect('/');
});

// POST /api/encrypt — the main JSON API used by the fetch() call in utility.js
app.post('/api/encrypt', (req, res) => {
  var { plaintext = '', shift = '0', rails = '2', cipher = '', keyword = '', key = '' } = req.body;

  const sanitized = lettersAndSpacesOnly(plaintext);
  const lettersOnly = sanitized.replace(/ /g, '');

  if (!sanitized) {
    return res.status(400).json({ error: 'Please input plaintext.' });
  }

  // ── AES ──
  if (cipher === 'aes') {
    const trimmedKey = key.slice(0, 16);  // silently truncate if too long

    if (Buffer.byteLength(trimmedKey, 'utf8') < 1) {
      return res.status(400).json({ error: 'Please enter a key for AES encryption.' });
    }
    // Pad with spaces if shorter than 16 so Node crypto doesn't throw
    const paddedKey = trimmedKey.padEnd(16, ' ');

    try {
      const { ciphertext, iv } = aesCipher(lettersOnly, paddedKey);
      return res.json({
        plaintext: sanitized,
        ciphertext,
        iv,
        keyUsed: trimmedKey,
        explanation: getCipherExplanation('aes', {}),
      });
    } catch (err) {
      return res.status(500).json({ error: `Encryption failed: ${err.message}` });
    }
  }

  // ── DES ──
  if (cipher === 'des') {
    const trimmedKey = key.slice(0, 8);  // silently truncate if too long

    if (Buffer.byteLength(trimmedKey, 'utf8') < 1) {
      return res.status(400).json({ error: 'Please enter a key for DES encryption.' });
    }
    // Pad with spaces if shorter than 8
    const paddedKey = trimmedKey.padEnd(8, ' ');

    try {
      const { ciphertext, iv } = desCipher(lettersOnly, paddedKey);
      return res.json({
        plaintext: sanitized,
        ciphertext,
        iv,
        keyUsed: trimmedKey,
        explanation: getCipherExplanation('des', {}),
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

    if (!Number.isFinite(numericShift) || shift < 1) {
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

  // ── Playfair ──
  if (cipher === 'playfair') {

    if (Buffer.byteLength(keyword, 'utf8') < 1) {
      return res.status(400).json({ error: 'Please enter a keyword for Playfair encryption.' });
    }

    const ciphertext = playfairCipher(lettersOnly, keyword);

    return res.json({
      plaintext: sanitized,
      ciphertext,
      keyword,
      explanation: 'The plaintext is arranged into digraphs (letter pairs) and encrypted using a 5×5 key square built from the keyword. Same-row letters shift right, same-column letters shift down, and rectangle pairs swap columns.',
    });
  }

  // ── Fallback ──
  return res.json({
    plaintext: sanitized,
    ciphertext: `${cipherOptions.find((o) => o.value === cipher)?.label || 'Selected cipher'} is not implemented yet.`,
    explanation: '',
  });
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
