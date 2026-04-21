/**
 * Playfair Cipher
 * Encrypts plaintext using a 5x5 key square built from a keyword.
 * - I and J share a cell
 * - Digraphs (letter pairs) are encrypted by the position rules:
 *   same row → shift right, same col → shift down, rectangle → swap columns
 *
 * @param {string} text    - Plaintext (letters only, spaces stripped by caller)
 * @param {string} keyword - Keyword used to build the 5x5 square
 * @returns {string} ciphertext (uppercase)
 */
function playfairCipher(text, keyword) {
  const square = buildSquare(keyword);
  const prepared = prepareText(text);
  const digraphs = makeDigraphs(prepared);

  return digraphs.map(([a, b]) => encryptDigraph(a, b, square)).join('');
}

function buildSquare(keyword) {
  const seen = new Set();
  const letters = [];

  const normalized = (keyword + 'ABCDEFGHIKLMNOPQRSTUVWXYZ')
    .toUpperCase()
    .replace(/J/g, 'I')
    .replace(/[^A-Z]/g, '');

  for (const ch of normalized) {
    if (!seen.has(ch)) {
      seen.add(ch);
      letters.push(ch);
    }
  }

  // Return as 5x5 grid (array of 5 rows, each with 5 chars)
  return Array.from({ length: 5 }, (_, r) => letters.slice(r * 5, r * 5 + 5));
}

function prepareText(text) {
  return text
    .toUpperCase()
    .replace(/J/g, 'I')
    .replace(/[^A-Z]/g, '');
}

function makeDigraphs(text) {
  const digraphs = [];
  let i = 0;
  while (i < text.length) {
    const a = text[i];
    const b = text[i + 1];

    if (b === undefined) {
      // Odd letter out — pad with X (or Q if the letter is already X)
      digraphs.push([a, a === 'X' ? 'Q' : 'X']);
      i += 1;
    } else if (a === b) {
      // Same-letter digraph — insert filler and don't advance b
      digraphs.push([a, a === 'X' ? 'Q' : 'X']);
      i += 1;
    } else {
      digraphs.push([a, b]);
      i += 2;
    }
  }
  return digraphs;
}

function findPosition(ch, square) {
  for (let r = 0; r < 5; r++) {
    const c = square[r].indexOf(ch);
    if (c !== -1) return [r, c];
  }
  throw new Error(`Character '${ch}' not found in square`);
}

function encryptDigraph(a, b, square) {
  const [ar, ac] = findPosition(a, square);
  const [br, bc] = findPosition(b, square);

  if (ar === br) {
    // Same row — shift right (wrap)
    return square[ar][(ac + 1) % 5] + square[br][(bc + 1) % 5];
  }
  if (ac === bc) {
    // Same column — shift down (wrap)
    return square[(ar + 1) % 5][ac] + square[(br + 1) % 5][bc];
  }
  // Rectangle — swap columns
  return square[ar][bc] + square[br][ac];
}

module.exports = { playfairCipher, buildSquare };
