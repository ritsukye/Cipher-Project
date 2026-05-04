function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCipherOptions(selectedCipher) {
  return cipherOptions.map(({ value, label }) => {
    const selected = (value === selectedCipher) ? ' selected' : '';
    return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`;
  }).join('');
}

function renderParameterPanel(selectedCipher, shift, rails, key, iv, keyword = '') {
  if (selectedCipher === 'caesar') {
    return `
      <label for="shift">
        Shift
        <input id="shift" name="shift" type="number" min=1 max=25 onkeydown="return event.keyCode !== 189" value="${escapeHtml(String(shift))}" />
      </label>
      <p class="helper">Amount to shift letters by (minimum 1).</p>
    `;
  }

  if (selectedCipher === 'playfair') {
    return `
      <label for="keyword">
        Keyword
        <input id="keyword" name="keyword" type="text" maxlength="25" placeholder="e.g. MONARCHY" value="${escapeHtml(String(keyword))}" />
      </label>
      <p class="helper">Letters only. I and J share a cell in the 5×5 square.</p>
    `;
  }

  if (selectedCipher === 'railfence') {
    return `
      <label for="rails">
        Rails
        <input id="rails" name="rails" type="number" min=2 max=20 value="${escapeHtml(String(rails))}" />
      </label>
      <p class="helper">Number of rows in the zigzag (minimum 2).</p>
    `;
  }

  // REPLACE the AES block (lines 40–67):
  if (selectedCipher === 'aes') {
    const displayKey = key.length > 16 ? key.slice(0, 16) : key;
    const wasTruncated = key.length > 16;
    return `
      <label for="key">
        Key (16 characters)
        <input
          id="key"
          name="key"
          type="text"
          placeholder="e.g. MySecretKey12345"
          value="${escapeHtml(displayKey)}"
          autocomplete="off"
        />
      </label>
      ${wasTruncated ? `<p class="helper warning">Your key was truncated to 16 characters.</p>` : ''}
      <p class="helper">
        Up to 16 ASCII characters — anything longer will be shortened to fit.
        Keep this secret: anyone with the key can decrypt the output.
      </p>
      ${iv ? `
        <label>Initialisation Vector (IV)
          <input type="text" readonly value="${escapeHtml(iv)}" />
        </label>
        <p class="helper">
          A random value generated each encryption. Needed to decrypt alongside the key.
        </p>
      ` : ''}
    `;
  }

// REPLACE the DES block (add after the AES block):
  if (selectedCipher === 'des') {
    const displayKey = key.length > 8 ? key.slice(0, 8) : key;
    const wasTruncated = key.length > 8;
    return `
      <label for="key">
        Key (8 characters)
        <input
          id="key"
          name="key"
          type="text"
          placeholder="e.g. mysecret"
          value="${escapeHtml(displayKey)}"
          autocomplete="off"
        />
      </label>
      ${wasTruncated ? `<p class="helper warning">Your key was truncated to 8 characters.</p>` : ''}
      <p class="helper">
        Up to 8 ASCII characters — anything longer will be shortened to fit.
      </p>
      ${iv ? `
        <label>Initialisation Vector (IV)
          <input type="text" readonly value="${escapeHtml(iv)}" />
        </label>
        <p class="helper">
          A random value generated each encryption. Needed alongside the key to decrypt.
        </p>
      ` : ''}
    `;
  }

  return `
    <div class="placeholder">
      <strong>Parameters coming soon</strong>
      <p>${escapeHtml(getPlaceholderMessage(selectedCipher))}</p>
    </div>
  `;
}

function getPlaceholderMessage(selectedCipher) {
  switch (selectedCipher) {
    case 'aes':
      return 'AES controls will appear here later.';
    case 'playfair':
      return 'Playfair controls will appear here later.';
    default:
      return 'This cipher is not wired up yet.';
  }
}

const cipherOptions = [
  { value: 'caesar', label: 'Caesar Cipher' },
  { value: 'aes', label: 'AES' },
  { value: 'des',    label: 'DES' },
  { value: 'playfair', label: 'Playfair' },
  { value: 'railfence', label: 'Rail Fence' },
];

function landingPage ({
  plaintext = '',
  shift = 0,
  rails = 2,
  key          = '',  
  iv           = '',   
  ciphertext   = '',
  explanation  = '',   
  error = '',
  selectedCipher = '',
  keyword = '',     
}={}) {
return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cipher Project</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe7;
        --panel: #fffdf9;
        --text: #1f2933;
        --muted: #52606d;
        --accent: #c2410c;
        --accent-dark: #9a3412;
        --border: #e7d8c9;
      }

      * {
        box-sizing: border-box;
      }

      .helper.warning {
        color: #c2410c;
        font-weight: 600;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: Georgia, "Times New Roman", serif;
        color: var(--text);
        background:
          radial-gradient(circle at top, rgba(194, 65, 12, 0.15), transparent 32%),
          linear-gradient(180deg, #f8f1e8 0%, var(--bg) 100%);
        display: grid;
        place-items: center;
        padding: 24px;
      }

      main {
        width: min(1180px, 100%);
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 32px;
        box-shadow: 0 20px 50px rgba(31, 41, 51, 0.08);
      }

      h1 {
        margin: 0 0 12px;
        font-size: clamp(2rem, 5vw, 3.25rem);
        line-height: 1;
      }

      p {
        margin: 0 0 24px;
        color: var(--muted);
        font-size: 1rem;
      }

      form {
        display: grid;
        gap: 24px;
      }

      .workspace {
        display: grid;
        grid-template-rows: auto auto;
        gap: 16px;
      }

      .workspace-top {
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(240px, 1fr);
        gap: 16px;
        align-items: start;
      }

      .workspace-bottom {
        display: grid;
        grid-template-columns: 1fr;
      }

      .panel {
        display: grid;
        gap: 14px;
        padding: 20px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.72);
      }

      .panel h2 {
        margin: 0;
        font-size: 1.1rem;
      }

      .panel p {
        margin: 0;
        font-size: 0.95rem;
      }

      p.helper {
        margin-top: 0.75rem;
        line-height: 1.5rem;
      }

      .parameters {
        align-content: start;
        background: linear-gradient(180deg, #fffaf4 0%, #fff 100%);
      }

      label {
        display: grid;
        gap: 8px;
        font-weight: 600;
      }

      textarea,
      input,
      select,
      button {
        font: inherit;
      }

      textarea,
      input,
      select {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 14px 16px;
        background: #fff;
        color: var(--text);
      }

      textarea {
        height: 140px;
        resize: none;
      }


      /* ========== PLAINTEXT PANEL ========== */

      .plaintext-container {
        display: grid;
        gap: 8px;
      }

      .textarea-wrapper {
        position: relative;
      }

      .textarea-wrapper textarea {
        width: 100%;
        padding-bottom: 52px;
      }

      .plaintext-button {
        position: absolute;
        bottom: 12px;
        right: 12px;
        margin: 0;
      }

      button {
        border: none;
        border-radius: 999px;
        padding: 14px 20px;
        background: var(--accent);
        color: white;
        cursor: pointer;
        font-weight: 700;
        transition: background 160ms ease, transform 160ms ease;
        justify-self: start;
      }

      button:hover {
        background: var(--accent-dark);
        transform: translateY(-1px);
      }

      .error {
        padding: 18px;
        border-radius: 16px;
      }

      .error {
        background: #fff1f2;
        border: 1px solid #fda4af;
        color: #9f1239;
      }

      .output {
        background: #fff7ed;
        border-color: #fdba74;
      }

      .output code,
      .placeholder {
        display: block;
        min-height: 220px;
        padding: 16px;
        border-radius: 14px;
        background: #fff;
        border: 1px dashed var(--border);
      }

      .placeholder p {
        margin: 0;
        font-size: 0.92rem;
        color: var(--muted);
      }

      code {
        white-space: pre-wrap;
        word-break: break-word;
        font-family: "Courier New", monospace;
        font-size: 0.98rem;
      }

      @media (max-width: 720px) {
        .workspace-top {
          grid-template-columns: 1fr;
        }
      }

      .lesson {
        min-height: 220px;
        padding: 16px;
        border-radius: 14px;
        background: #fff;
        border: 1px dashed var(--border);
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .lesson-step {
        opacity: 0;
        animation: fadeIn 0.8s ease-out forwards;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .lesson-title {
        font-weight: 700;
        color: var(--accent);
        font-size: 0.95rem;
        margin: 0;
      }

      .original-text {
        font-family: "Courier New", monospace;
        font-size: 1.1rem;
        letter-spacing: 2px;
        color: var(--text);
      }

      .cipher-explanation {
        font-size: 0.92rem;
        color: var(--muted);
        line-height: 1.5;
        font-style: italic;
        margin: 0;
      }

      .letter-mapping {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .letter-pair {
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        animation: fadeIn 0.5s ease-out forwards;
      }

      .letter-single {
        font-family: "Courier New", monospace;
        font-weight: 700;
        font-size: 0.95rem;
        padding: 4px 8px;
        background: #f0f0f0;
        border-radius: 4px;
        min-width: 28px;
        text-align: center;
      }

      .letter-arrow {
        color: var(--accent);
        font-weight: 700;
      }

      .letter-explanation {
        font-size: 0.88rem;
        color: var(--muted);
        font-style: italic;
      }

      .cipher-stream {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      .stream-cell {
        font-family: "Courier New", monospace;
        font-weight: 700;
        font-size: 1rem;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background: #f0f0f0;
        color: transparent;
        transition: color 0.3s ease, background 0.3s ease;
      }

      .stream-cell-visible {
        color: var(--accent);
        background: #ffe4d6;
      }

      .zigzag-grid {
        overflow-x: auto;
        padding: 12px 0;
      }

      .zigzag-row {
        display: flex;
        gap: 4px;
        margin-bottom: 4px;
      }

      .zigzag-cell {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Courier New", monospace;
        font-weight: 700;
        font-size: 0.9rem;
        border-radius: 6px;
        flex-shrink: 0;
        position: relative;
      }

      .zigzag-cell.filled {
        background: #f0f0f0;
        color: var(--text);
      }

      .zigzag-cell.empty {
        background: transparent;
        color: transparent;
      }

      .zigzag-cell.highlighted {
        background: #ffe4d6;
        color: var(--accent);
      }

      .zigzag-svg-wrapper {
        position: relative;
        margin-bottom: 4px;
      }

      .zigzag-svg-wrapper svg {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        overflow: visible;
      }

      .zigzag-path {
        fill: none;
        stroke: var(--accent);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 2000;
        stroke-dashoffset: 2000;
        transition: stroke-dashoffset 0.05s linear;
      }

      .explanation {
        margin-top: 8px;
        padding: 16px 20px;
        border-radius: 14px;
        background: #fff;
        border: 1px solid var(--border);
        font-size: 0.93rem;
        color: var(--muted);
      }

      .explanation h3 {
        margin: 0 0 10px;
        font-size: 1rem;
        color: var(--text);
      }

      .explanation p {
        margin: 0 0 8px;
        line-height: 1.6;
      }

      .explanation p:last-child {
        margin-bottom: 0;
      }

      .explanation strong {
        color: var(--text);
      }
    </style>
  </head>

  <body>
    <main>
      <h1>Cipher Project</h1>
      <p>Choose a cipher, enter plaintext, adjust its parameters, and view the ciphertext from left to right.</p>

      <form id="encryptForm" method="post">
        <div class="workspace">
          <div class="workspace-top">
            <section class="panel">
              <h2>Plaintext</h2>
              <div class="plaintext-container">
                <label for="plaintext">Message</label>
                <div class="textarea-wrapper">
                  <textarea id="plaintext" name="plaintext" placeholder="Type your message here...">${escapeHtml(plaintext)}</textarea>
                  <button type="submit" class="plaintext-button">Encrypt</button>
                </div>
              </div>
              <p class="helper"> <b> Caesar, Playfair, and Rail Fence </b> only allow letters in input. Any non-letter characters will be deleted. </p>
            </section>

            <section class="panel parameters">
              <h2>Parameters</h2>
              <label for="cipher">
                Cipher
                <select id="cipher" name="cipher">
                  ${renderCipherOptions(selectedCipher)}
                </select>
              </label>
              <div id="parameterFields">
                ${renderParameterPanel(selectedCipher, shift, rails, key, iv, keyword)}
              </div>
              ${error ? `<section class="error"><strong>Error:</strong> ${escapeHtml(error)}</section>` : ''}
            </section>
          </div>

          <div class="workspace-bottom">
            <section class="panel output">
              <h2>Ciphertext</h2>
              <p>Encrypted output appears here.</p>
              <div id="outputContent">
                <code>${escapeHtml(ciphertext || 'Your ciphertext will appear here.')}</code>
              </div>
              ${explanation ? `
              <section class="explanation">
                <h3>How this cipher works</h3>
                ${explanation}
              </section>
            ` : ''}
            </section>
          </div>
        </div>
      </form>
    </main>

    <script>
      const form = document.getElementById('encryptForm');
      const outputContent = document.getElementById('outputContent');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = {
          plaintext: formData.get('plaintext'),
          shift: formData.get('shift') || '0',
          rails: formData.get('rails') || '2',
          key: formData.get('key') || '',
          cipher: formData.get('cipher'),
          keyword: formData.get('keyword') || '',
        };

        try {
          const response = await fetch('/api/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            outputContent.innerHTML = \`<section class="error"><strong>Error:</strong> \${escapeHtml(errorData.error)}</section>\`;
            return;
          }

          const result = await response.json();

          if (data.cipher === 'railfence') {
            renderRailFence(result);
          } else if (data.cipher === 'aes') {
            renderAes(result);
          } else if (data.cipher === 'playfair') {
            renderPlayfair(result);
          } else if (data.cipher === 'des') {
            renderDes(result);
          } else {
            renderCaesar(result);
          }

        } catch (error) {
          outputContent.innerHTML = \`<section class="error"><strong>Error:</strong> \${escapeHtml(error.message)}</section>\`;
        }
      });

      function renderCaesar(result) {
        const lessonHTML = \`
          <div class="lesson">
            <div class="lesson-step" style="animation-delay: 0s">
              <p class="lesson-title">Original Text</p>
              <div class="original-text">\${escapeHtml(result.plaintext)}</div>
            </div>
            <div class="lesson-step" style="animation-delay: 0.6s">
              <p class="lesson-title">How It Works</p>
              <p class="cipher-explanation">\${escapeHtml(result.explanation)}</p>
            </div>
            <div class="lesson-step" style="animation-delay: 1.2s">
              <p class="lesson-title">Transformation</p>
              <div class="letter-mapping" id="letterMapping"></div>
            </div>
            <div id="ciphertextStep" style="opacity: 0;">
              <p class="lesson-title">Ciphertext</p>
              <div class="original-text" id="finalCiphertext"></div>
            </div>
          </div>
        \`;
        outputContent.innerHTML = lessonHTML;

        const mappingContainer = document.getElementById('letterMapping');
        const nonSpacePairs = result.mapping.filter(p => !p.isSpace);

        nonSpacePairs.forEach((pair, index) => {
          const delay = 1.6 + (index * 0.4);
          const pairEl = document.createElement('div');
          pairEl.className = 'letter-pair';
          pairEl.style.animationDelay = delay + 's';
          pairEl.innerHTML = \`
            <span class="letter-single">\${escapeHtml(pair.original)}</span>
            <span class="letter-arrow">→</span>
            <span class="letter-single">\${escapeHtml(pair.cipher)}</span>
            <span class="letter-explanation">\${escapeHtml(pair.explanation)}</span>
          \`;
          mappingContainer.appendChild(pairEl);

          if (index === nonSpacePairs.length - 1) {
            const revealDelay = (delay + 0.6) * 1000;
            setTimeout(() => {
              const step = document.getElementById('ciphertextStep');
              const final = document.getElementById('finalCiphertext');
              if (step && final) {
                final.textContent = result.ciphertext;
                step.style.transition = 'opacity 0.8s ease-out';
                step.style.opacity = '1';
              }
            }, revealDelay);
          }
        });
      }

      function renderAes(result) {
        outputContent.innerHTML = \`
          <div class="lesson">
            <div class="lesson-step" style="animation-delay: 0s">
              <p class="lesson-title">Original Text</p>
              <div class="original-text">\${escapeHtml(result.plaintext)}</div>
            </div>
            <div class="lesson-step" style="animation-delay: 0.6s">
              <p class="lesson-title">How It Works</p>
              <p class="cipher-explanation">\${escapeHtml(result.explanation)}</p>
            </div>
            <div class="lesson-step" style="animation-delay: 1.2s">
              <p class="lesson-title">Initialisation Vector (IV)</p>
              <div class="original-text">\${escapeHtml(result.iv)}</div>
              <p class="cipher-explanation" style="margin-top:6px">Random value generated each encryption. Both the key and IV are needed to decrypt.</p>
            </div>
            <div class="lesson-step" style="animation-delay: 1.8s">
              <p class="lesson-title">Ciphertext</p>
              <div class="original-text">\${escapeHtml(result.ciphertext)}</div>
            </div>
          </div>
        \`;
      }

      function renderDes(result) {
        outputContent.innerHTML = \`
          <div class="lesson">
            <div class="lesson-step" style="animation-delay: 0s">
              <p class="lesson-title">Original Text</p>
              <div class="original-text">\${escapeHtml(result.plaintext)}</div>
            </div>
            <div class="lesson-step" style="animation-delay: 0.6s">
              <p class="lesson-title">How It Works</p>
              <p class="cipher-explanation">\${escapeHtml(result.explanation)}</p>
            </div>
            <div class="lesson-step" style="animation-delay: 1.2s">
              <p class="lesson-title">Step 1 — Initial Permutation (IP)</p>
              <p class="cipher-explanation">The 64-bit input block is shuffled by a fixed table before any rounds begin. This is purely a bitwise reordering — a legacy design artifact that adds no security on its own.</p>
            </div>
            <div class="lesson-step" style="animation-delay: 1.8s">
              <p class="lesson-title">Step 2 — 16 Feistel Rounds</p>
              <p class="cipher-explanation">The block is split into a 32-bit Left half and Right half. Each round: the Right half is expanded to 48 bits, XOR'd with a round subkey, compressed through 8 S-boxes back to 32 bits, permuted, then XOR'd with the Left half. The halves then swap.</p>
            </div>
            <div class="lesson-step" style="animation-delay: 2.4s">
              <p class="lesson-title">Step 3 — S-boxes (Substitution)</p>
              <p class="cipher-explanation">Each of the 8 S-boxes takes a 6-bit input and outputs 4 bits using a fixed lookup table. This is DES's only non-linear step and the source of its resistance to algebraic attacks.</p>
            </div>
            <div class="lesson-step" style="animation-delay: 3.0s">
              <p class="lesson-title">Step 4 — Key Schedule</p>
              <p class="cipher-explanation">Your key has every 8th bit stripped as a parity bit, leaving 56 effective bits. These are split, shifted, and permuted to produce 16 unique 48-bit subkeys — one per round.</p>
            </div>
            <div class="lesson-step" style="animation-delay: 3.6s">
              <p class="lesson-title">Step 5 — Final Permutation (FP)</p>
              <p class="cipher-explanation">After round 16, the halves swap one last time and pass through the inverse of the Initial Permutation to produce the final 64-bit ciphertext block.</p>
            </div>
            <div class="lesson-step" style="animation-delay: 4.2s">
              <p class="lesson-title">⚠️ A note on DES security</p>
              <p class="cipher-explanation">DES's 56-bit effective key can be brute-forced in hours with modern hardware. It is included here for educational purposes only. For real encryption, use AES.</p>
            </div>
            <div class="lesson-step" style="animation-delay: 4.8s">
              <p class="lesson-title">Initialisation Vector (IV)</p>
              <div class="original-text">\${escapeHtml(result.iv)}</div>
              <p class="cipher-explanation" style="margin-top:6px">Random value generated each encryption. Both the key and IV are required to decrypt.</p>
            </div>
            <div class="lesson-step" style="animation-delay: 5.4s">
              <p class="lesson-title">Ciphertext</p>
              <div class="original-text">\${escapeHtml(result.ciphertext)}</div>
            </div>
          </div>
        \`;
      }

      function renderRailFence(result) {
        const { plaintext, explanation, mapping, railAssignments, rails, rowOrder } = result;
        if (!railAssignments || !mapping) {
          outputContent.innerHTML = \`<section class="error"><strong>Error:</strong> Server response missing railAssignments or mapping.</section>\`;
          return;
        }
        const letters = plaintext.replace(/ /g, '').split('');
        const numCols = letters.length;

        const grid = Array.from({ length: rails }, () => Array(numCols).fill(null));
        railAssignments.forEach((rail, col) => {
          grid[rail][col] = letters[col];
        });

        const lessonHTML = \`
          <div class="lesson">
            <div class="lesson-step" style="animation-delay: 0s">
              <p class="lesson-title">Original Text</p>
              <div class="original-text">\${escapeHtml(plaintext)}</div>
            </div>
            <div class="lesson-step" style="animation-delay: 0.6s">
              <p class="lesson-title">How It Works</p>
              <p class="cipher-explanation">\${escapeHtml(explanation)}</p>
            </div>
            <div class="lesson-step" style="animation-delay: 1.2s">
              <p class="lesson-title">Zigzag Grid</p>
              <div class="zigzag-svg-wrapper" id="zigzagWrapper">
                <div class="zigzag-grid" id="zigzagGrid"></div>
              </div>
            </div>
            <div class="lesson-step" style="animation-delay: 1.8s">
              <p class="lesson-title">Transformation — reading row by row</p>
              <div class="cipher-stream" id="cipherStream"></div>
            </div>
            <div id="ciphertextStep" style="opacity: 0;">
              <p class="lesson-title">Ciphertext</p>
              <div class="original-text" id="finalCiphertext"></div>
            </div>
          </div>
        \`;
        outputContent.innerHTML = lessonHTML;

        // Build grid cells
        const zigzagGrid = document.getElementById('zigzagGrid');
        const cellEls = Array.from({ length: rails }, () => Array(numCols).fill(null));

        for (let r = 0; r < rails; r++) {
          const row = document.createElement('div');
          row.className = 'zigzag-row';
          for (let c = 0; c < numCols; c++) {
            const cell = document.createElement('div');
            cell.className = grid[r][c] !== null ? 'zigzag-cell filled' : 'zigzag-cell empty';
            cell.textContent = grid[r][c] !== null ? grid[r][c] : '';
            cellEls[r][c] = cell;
            row.appendChild(cell);
          }
          zigzagGrid.appendChild(row);
        }

        // Pre-populate cipher stream with empty slots in rowOrder sequence
        const cipherStream = document.getElementById('cipherStream');
        const streamCells = [];
        rowOrder.forEach((col) => {
          const span = document.createElement('span');
          span.className = 'stream-cell';
          span.textContent = '';
          cipherStream.appendChild(span);
          streamCells.push({ span, col });
        });

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            drawZigzagPath(cellEls, railAssignments, rowOrder, numCols, rails);
            animateRailFenceTransform(mapping, railAssignments, rowOrder, cellEls, streamCells, result.ciphertext);
          });
        });
      }


      // ====================== RENDER PLAYFAIR ======================
      function renderPlayfair(result) {
        const letters = result.plaintext.toUpperCase().replace(/ /g, '').replace(/J/g, 'I');
        const digraphs = [];
        let i = 0;
        while (i < letters.length) {
          const a = letters[i];
          const b = letters[i + 1];
          if (b === undefined) {
            digraphs.push({ a, b: a === 'X' ? 'Q' : 'X', padded: true, repeated: false });
            i += 1;
          } else if (a === b) {
            digraphs.push({ a, b: a === 'X' ? 'Q' : 'X', padded: false, repeated: true });
            i += 1;
          } else {
            digraphs.push({ a, b, padded: false, repeated: false });
            i += 2;
          }
        }

        const keyword = (result.keyword || '').toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
        const seen = new Set();
        const squareLetters = [];
        const normalized = keyword + 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
        for (const ch of normalized) {
          if (!seen.has(ch)) { seen.add(ch); squareLetters.push(ch); }
        }
        const square = Array.from({ length: 5 }, (_, r) => squareLetters.slice(r * 5, r * 5 + 5));
        const keywordSet = new Set(keyword.split(''));

        function findPos(ch) {
          for (let r = 0; r < 5; r++)
            for (let c = 0; c < 5; c++)
              if (square[r][c] === ch) return [r, c];
          return [-1, -1];
        }

        function encryptDigraph(a, b) {
          const [ar, ac] = findPos(a);
          const [br, bc] = findPos(b);
          let rule, ca, cb, car, cac, cbr, cbc;

          if (ar === br) {
            rule = 'Same row — shift right';
            cac = (ac + 1) % 5;
            cbc = (bc + 1) % 5;
            car = ar;
            cbr = br;
            ca = square[car][cac];
            cb = square[cbr][cbc];
          } else if (ac === bc) {
            rule = 'Same column — shift down';
            car = (ar + 1) % 5;
            cbr = (br + 1) % 5;
            cac = ac;
            cbc = bc;
            ca = square[car][cac];
            cb = square[cbr][cbc];
          } else {
            rule = 'Rectangle — swap columns';
            car = ar;
            cbr = br;
            cac = bc;
            cbc = ac;
            ca = square[car][cac];
            cb = square[cbr][cbc];
          }

          return { rule, ca, cb, ar, ac, br, bc, car, cac, cbr, cbc };
        }

        const pairs = digraphs.map(d => ({ ...d, ...encryptDigraph(d.a, d.b) }));

        const gridHTML1 = square.map(row =>
          row.map(ch => {
            const isKw = keywordSet.has(ch);
            return \`<div class="pf-cell \${isKw ? 'pf-cell-keyword' : 'pf-cell-fill'}">\${escapeHtml(ch)}</div>\`;
          }).join('')
        ).join('');

        const digraphHTML = digraphs.map(pair => {
          const bClass = (pair.repeated || pair.padded) ? 'filler' : '';
          const note = pair.repeated ? \`<div class="digraph-note">repeated — filler inserted</div>\`
            : pair.padded ? \`<div class="digraph-note">odd letter — filler inserted</div>\` : '';
          return \`
            <div class="digraph-pair">
              <div class="digraph-note-wrapper">\${note}</div>
              <div class="digraph-cells">
                <span class="digraph-cell">\${escapeHtml(pair.a)}</span>
                <span class="digraph-cell \${bClass}">\${escapeHtml(pair.b)}</span>
              </div>
            </div>\`;
        }).join('');

        // Plain grid for encryption step
        const plainGridHTML = square.map((row, r) =>
          row.map((ch, c) =>
            \`<div class="pf-cell pf-cell-plain" id="pgc-\${r}-\${c}">\${escapeHtml(ch)}</div>\`
          ).join('')
        ).join('');

        const pairsNavHTML = pairs.map((p, idx) =>
          \`<button type="button" class="pair-btn \${idx === 0 ? 'active' : ''}" data-idx="\${idx}">\${escapeHtml(p.a)}\${escapeHtml(p.b)}</button>\`
        ).join('');

        const lessonHTML = \`
          <style>
            .digraph-row { display:flex; flex-wrap:wrap; gap:12px; margin-top:8px; align-items:flex-end; }
            .digraph-pair { display:flex; flex-direction:column; align-items:center; gap:4px; }
            .digraph-note-wrapper { min-height:20px; display:flex; align-items:flex-end; }
            .digraph-note { font-size:0.72rem; color:#dc2626; font-style:italic; text-align:center; max-width:90px; }
            .digraph-cells { display:flex; gap:3px; }
            .digraph-cell { font-family:"Courier New",monospace; font-weight:700; font-size:1rem; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:6px; background:#f0f0f0; color:var(--text); }
            .digraph-cell.filler { color:#dc2626; }
            .pf-grid { display:grid; grid-template-columns:repeat(5,40px); gap:5px; margin-top:10px; }
            .pf-cell { width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-family:"Courier New",monospace; font-weight:700; font-size:1rem; border-radius:7px; transition: font-size 0.25s ease, background 0.3s ease, color 0.3s ease; }
            .pf-cell-keyword { background:#ffe4d6; color:var(--accent); border:1.5px solid #fdba74; }
            .pf-cell-fill { background:#f0f0f0; color:var(--text); }
            .pf-cell-plain { background:#f0f0f0; color:var(--text); }
            .pf-cell-plain.pulse { font-size:1.35rem; background:#e0e0e0; }
            .pf-cell-plain.result { background:#ffe4d6; color:var(--accent); }
            .pf-legend { display:flex; gap:16px; margin-top:10px; font-size:0.85rem; color:var(--muted); align-items:center; }
            .pf-legend-dot { width:14px; height:14px; border-radius:3px; display:inline-block; margin-right:5px; }
            .encrypt-step { display:flex; gap:24px; align-items:flex-start; margin-top:10px; flex-wrap:wrap; }
            .pair-nav { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
            .pair-btn { font-family:"Courier New",monospace; font-weight:700; font-size:0.9rem; padding:4px 10px; border-radius:6px; border:1.5px solid var(--border); background:#f0f0f0; cursor:pointer; color:var(--text); }
            .pair-btn.active { background:var(--accent); color:#fff; border-color:var(--accent); }
            .enc-panel { flex:1; min-width:180px; display:flex; flex-direction:column; gap:10px; justify-content:center; }
            .enc-rule { font-size:0.88rem; font-weight:700; color:var(--accent); margin:0; }
            .enc-arrow-row { display:flex; align-items:center; gap:10px; font-family:"Courier New",monospace; font-size:1.1rem; font-weight:700; }
            .enc-arrow { font-size:1.4rem; color:var(--accent); }
            .enc-letter { width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:7px; background:#f0f0f0; }
            .enc-letter.out { background:#ffe4d6; color:var(--accent); }
          </style>
          <div class="lesson">
            <div class="lesson-step" style="animation-delay:0s">
              <p class="lesson-title">Original Text</p>
              <div class="original-text">\${escapeHtml(result.plaintext.toUpperCase())}</div>
            </div>
            <div class="lesson-step" style="animation-delay:0.4s">
              <p class="lesson-title">How It Works</p>
              <p class="cipher-explanation">\${escapeHtml(result.explanation)}</p>
            </div>
            <div class="lesson-step" style="animation-delay:0.8s">
              <p class="lesson-title">Plaintext split into digraphs</p>
              <div class="digraph-row">\${digraphHTML}</div>
            </div>
            <div class="lesson-step" style="animation-delay:1.2s">
              <p class="lesson-title">5×5 Key Square</p>
              <p class="cipher-explanation">Built from keyword "\${escapeHtml((result.keyword||'').toUpperCase())}", then filled with remaining letters (I and J share a cell).</p>
              <div class="pf-grid">\${gridHTML1}</div>
              <div class="pf-legend">
                <span><span class="pf-legend-dot" style="background:#ffe4d6;border:1.5px solid #fdba74;"></span>From keyword</span>
                <span><span class="pf-legend-dot" style="background:#f0f0f0;"></span>Remaining alphabet</span>
              </div>
            </div>
            <div class="lesson-step" style="animation-delay:1.6s">
              <p class="lesson-title">Encrypting each digraph</p>
              <div class="pair-nav">\${pairsNavHTML}</div>
              <div class="encrypt-step">
                <div class="pf-grid" id="plainGrid">\${plainGridHTML}</div>
                <div class="enc-panel" id="encPanel">
                  <p class="enc-rule" id="encRule"></p>
                  <div class="enc-arrow-row">
                    <div class="enc-letter" id="encInA"></div>
                    <div class="enc-letter" id="encInB"></div>
                    <span class="enc-arrow">→</span>
                    <div class="enc-letter out" id="encOutA"></div>
                    <div class="enc-letter out" id="encOutB"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="lesson-step" style="animation-delay:2s">
              <p class="lesson-title">Ciphertext</p>
              <div class="original-text">\${escapeHtml(result.ciphertext.toUpperCase())}</div>
            </div>
          </div>
        \`;
        outputContent.innerHTML = lessonHTML;

        function clearGrid() {
          document.querySelectorAll('.pf-cell-plain').forEach(el => {
            el.classList.remove('pulse', 'result');
          });
        }

        function showPair(idx) {
          clearGrid();
          const p = pairs[idx];

          // Update nav buttons
          document.querySelectorAll('.pair-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === idx);
          });

          // Update panel text
          document.getElementById('encRule').textContent = p.rule;
          document.getElementById('encInA').textContent = p.a;
          document.getElementById('encInB').textContent = p.b;
          document.getElementById('encOutA').textContent = p.ca;
          document.getElementById('encOutB').textContent = p.cb;

          // Pulse input cells
          const cellA = document.getElementById(\`pgc-\${p.ar}-\${p.ac}\`);
          const cellB = document.getElementById(\`pgc-\${p.br}-\${p.bc}\`);
          if (cellA) cellA.classList.add('pulse');
          if (cellB) cellB.classList.add('pulse');

          // After pulse, highlight output cells
          setTimeout(() => {
            if (cellA) cellA.classList.remove('pulse');
            if (cellB) cellB.classList.remove('pulse');

            const outA = document.getElementById(\`pgc-\${p.car}-\${p.cac}\`);
            const outB = document.getElementById(\`pgc-\${p.cbr}-\${p.cbc}\`);
            if (outA) outA.classList.add('result');
            if (outB) outB.classList.add('result');

            // Fade out result highlight
            setTimeout(() => {
              if (outA) outA.classList.remove('result');
              if (outB) outB.classList.remove('result');
            }, 1200);
          }, 600);
        }

        // Wire up buttons
        document.querySelectorAll('.pair-btn').forEach((btn, idx) => {
          btn.addEventListener('click', () => showPair(idx));
        });

        // Show first pair after the step fades in
        setTimeout(() => showPair(0), 1800);
      }

      function drawZigzagPath(cellEls, railAssignments, rowOrder, numCols, rails) {
        const wrapper = document.getElementById('zigzagWrapper');
        const grid = document.getElementById('zigzagGrid');
        const gridRect = grid.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();

        // Points in row-by-row reading order
        const points = rowOrder.map(col => {
          const r = railAssignments[col];
          const cell = cellEls[r][col];
          const cellRect = cell.getBoundingClientRect();
          return {
            x: cellRect.left - wrapperRect.left + cellRect.width / 2,
            y: cellRect.top - wrapperRect.top + cellRect.height / 2,
          };
        });

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', gridRect.width);
        svg.setAttribute('height', gridRect.height);
        svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;overflow:visible;';

        const pathD = points.map((p, i) => \`\${i === 0 ? 'M' : 'L'} \${p.x} \${p.y}\`).join(' ');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.classList.add('zigzag-path');

        svg.appendChild(path);
        wrapper.appendChild(svg);

        const pathLength = path.getTotalLength();
        path.style.strokeDasharray = pathLength;
        path.style.strokeDashoffset = pathLength;

        wrapper._path = path;
        wrapper._pathLength = pathLength;
        wrapper._totalPoints = points.length;
      }

      function animateRailFenceTransform(mapping, railAssignments, rowOrder, cellEls, streamCells, ciphertext) {
        const wrapper = document.getElementById('zigzagWrapper');
        const nonSpacePairs = mapping.filter(p => !p.isSpace);
        const baseDelay = 2600;
        const perLetterDelay = 400;

        rowOrder.forEach((col, stepIndex) => {
          setTimeout(() => {
            // Highlight grid cell
            const r = railAssignments[col];
            const cell = cellEls[r][col];
            if (cell) cell.className = 'zigzag-cell highlighted';

            // Advance SVG line
            if (wrapper._path && wrapper._totalPoints > 1) {
              const fraction = stepIndex / (wrapper._totalPoints - 1);
              const offset = wrapper._pathLength * (1 - fraction);
              wrapper._path.style.transition = \`stroke-dashoffset \${perLetterDelay * 0.8}ms linear\`;
              wrapper._path.style.strokeDashoffset = stepIndex === rowOrder.length - 1 ? 0 : Math.max(0, offset);
            }

            // Reveal the cipher letter in the stream
            // ciphertext is in rowOrder sequence already, so stepIndex maps directly
            const ciphertextLetters = ciphertext.replace(/ /g, '');
            if (streamCells[stepIndex]) {
              const span = streamCells[stepIndex].span;
              span.textContent = ciphertextLetters[stepIndex] || '';
              span.classList.add('stream-cell-visible');
            }

            // After last letter, reveal final ciphertext
            if (stepIndex === rowOrder.length - 1) {
              setTimeout(() => {
                const step = document.getElementById('ciphertextStep');
                const final = document.getElementById('finalCiphertext');
                if (step && final) {
                  final.textContent = ciphertext;
                  step.style.transition = 'opacity 0.8s ease-out';
                  step.style.opacity = '1';
                }
              }, perLetterDelay + 200);
            }
          }, baseDelay + stepIndex * perLetterDelay);
        });
      }
        function escapeHtml(value) {
          return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        ${getPlaceholderMessage.toString()}
        ${renderParameterPanel.toString()}

        function renderParameterFields(cipher) {
          return renderParameterPanel(cipher, 0, 2, '', '', '');
        }

        document.getElementById('cipher').addEventListener('change', function () {
          document.getElementById('parameterFields').innerHTML = renderParameterFields(this.value);
        });
    </script>
  </body>
  </html>
`;
}

module.exports = { landingPage, cipherOptions };
