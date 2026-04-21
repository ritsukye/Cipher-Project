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

// ADD rails parameter here
function renderParameterPanel(selectedCipher, shift, rails) {
  if (selectedCipher === 'caesar') {
    return `
      <label for="shift">
        Shift
        <input id="shift" name="shift" type="number" min=0 max=25 onkeydown="return event.keyCode !== 189" value="${escapeHtml(String(shift))}" />
      </label>
      <p class="helper">Letters only. Spaces are preserved in output.</p>
    `;
  }

  if (selectedCipher === 'railfence') {
    return `
      <label for="rails">
        Rails
        <!-- value is now populated from the server — persists across submits -->
        <input id="rails" name="rails" type="number" min="2" max="20" value="${escapeHtml(String(rails))}" />
      </label>
      <p class="helper">Number of rows in the zigzag (minimum 2). Letters only; spaces are preserved.</p>
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
  { value: 'playfair', label: 'Playfair' },
  { value: 'railfence', label: 'Rail Fence' },
];

function landingPage ({
  plaintext = '',
  shift = 0,
  rails = 2,
  ciphertext = '',
  error = '',
  selectedCipher = 'caesar',
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

      .placeholder p,
      .helper {
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
            </section>

            <section class="panel parameters">
              <h2>Parameters</h2>
              <label for="cipher">
                Cipher
                <select id="cipher" name="cipher">
                  ${renderCipherOptions(selectedCipher)}
                </select>
              </label>
              ${renderParameterPanel(selectedCipher, shift, rails)}
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
          cipher: formData.get('cipher'),
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

        document.getElementById('cipher').addEventListener('change', function () {
          const cipher = this.value;
          const paramsSection = document.querySelector('.parameters');
          
          // Remove existing dynamic input (shift or rails)
          paramsSection.querySelectorAll('label:not([for="cipher"]), .placeholder, .helper').forEach(el => el.remove());

          if (cipher === 'caesar') {
            paramsSection.insertAdjacentHTML('beforeend', \`
              <label for="shift">
                Shift
                <input id="shift" name="shift" type="number" min="0" max="25" value="0" />
              </label>
              <p class="helper">Letters only. Spaces are preserved in output.</p>
            \`);
          } else if (cipher === 'railfence') {
            paramsSection.insertAdjacentHTML('beforeend', \`
              <label for="rails">
                Rails
                <input id="rails" name="rails" type="number" min="2" max="20" value="2" />
              </label>
              <p class="helper">Number of rows in the zigzag (minimum 2). Letters only; spaces are preserved.</p>
            \`);
          } else {
            paramsSection.insertAdjacentHTML('beforeend', \`
              <div class="placeholder">
                <strong>Parameters coming soon</strong>
                <p>This cipher is not wired up yet.</p>
              </div>
            \`);
          }
        });

        
    </script>
  </body>
  </html>
`;
}

module.exports = { landingPage, cipherOptions };