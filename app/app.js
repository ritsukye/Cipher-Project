const express = require('express');
const { landingPage, cipherOptions } = require('./public/utility.js');  // fix: was incorrectly destructuring non-exports
const { railFenceCipher } = require('./src/ciphers/railfence.js');

const app = express();
const port = 3000;

app.use(express.json());
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
  res.send(landingPage());
});

app.post('/', (req, res) => {
  const { plaintext = '', shift = '0', rails = '2', cipher = 'caesar' } = req.body;

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

  // Fallback for unimplemented ciphers
  res.send(landingPage({
    plaintext: sanitized,
    shift,
    rails,
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

function generateLetterMapping(original, ciphertext, cipher, params) {
  const mapping = [];
  let originalIndex = 0;
  let ciphertextIndex = 0;

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
        explanation = `'${origChar.toUpperCase()}' placed on rail ${params.railAssignments?.[originalIndex] ?? '?'} → '${cipherChar.toUpperCase()}'`;
      }
      mapping.push({ original: origChar, cipher: cipherChar, isSpace: false, explanation });
      originalIndex++;
      ciphertextIndex++;
    }
  }

  return mapping;
}

// Get cipher explanation
function getCipherExplanation(cipher, params) {
  switch(cipher) {
    case 'caesar':
      return `Each letter is shifted ${params.shift} position${params.shift === 1 ? '' : 's'} forward in the alphabet. When a letter reaches the end, it wraps around to the beginning.`;
    case 'railfence':
      return `The text is arranged in ${params.rails} rows in a zigzag pattern, then read row by row to produce the ciphertext.`;
    default:
      return 'Cipher explanation not available yet.';
  }
}

app.post('/api/encrypt', (req, res) => {
  const { plaintext = '', shift = '0', rails = '2', cipher = 'caesar' } = req.body;
  
  const sanitized = lettersAndSpacesOnly(plaintext);
  
  if (cipher === 'railfence') {
    const numericRails = Number(rails);
    
    if (!Number.isFinite(numericRails) || numericRails < 2) {
      return res.status(400).json({ error: 'Rails must be a valid number >= 2.' });
    }
    
    const lettersOnly = sanitized.replace(/ /g, '');
    const encryptedLetters = railFenceCipher(lettersOnly, numericRails);
    const ciphertext = reinsertSpaces(sanitized, encryptedLetters);
    
    return res.json({
      plaintext: sanitized,
      ciphertext,
      explanation: getCipherExplanation(cipher, { rails: numericRails }),
      mapping: generateLetterMapping(sanitized, ciphertext, 'railfence', { rails: numericRails }),    });
  }
  
  if (cipher === 'caesar') {
    const numericShift = Number(shift);
    
    if (!Number.isFinite(numericShift)) {
      return res.status(400).json({ error: 'Please enter a valid number for the shift.' });
    }
    
    const lettersOnly = sanitized.replace(/ /g, '');
    const encryptedLetters = caesarCipher(lettersOnly, numericShift);
    const ciphertext = reinsertSpaces(sanitized, encryptedLetters);
    
    return res.json({
      plaintext: sanitized,
      ciphertext,
      explanation: getCipherExplanation(cipher, { shift: numericShift }),
      mapping: generateLetterMapping(sanitized, ciphertext, 'caesar', { shift: numericShift }),
    });

  }
  
  res.status(400).json({
    error: `${cipherOptions.find((o) => o.value === cipher)?.label || 'Selected cipher'} is not implemented yet.`,
  });
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});