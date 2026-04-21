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
  rails = 2,        // ADD: persisted rails value
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


      // ========== PLAINTEXT PANEL ==========

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
          
          // Build the visual lesson
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
            </div>
          \`;
          
          outputContent.innerHTML = lessonHTML;
          
          // Animate letter pairs
          const mappingContainer = document.getElementById('letterMapping');
          result.mapping.forEach((pair, index) => {
            const delay = 1.6 + (index * 0.4);
            const pairEl = document.createElement('div');
            pairEl.className = pair.isSpace ? 'letter-pair space' : 'letter-pair';
            pairEl.style.animationDelay = delay + 's';
            
            if (!pair.isSpace) {
              pairEl.innerHTML = \`
                <span class="letter-single">\${escapeHtml(pair.original)}</span>
                <span class="letter-arrow">→</span>
                <span class="letter-single">\${escapeHtml(pair.cipher)}</span>
                <span class="letter-explanation">\${escapeHtml(pair.explanation)}</span>
              \`;
              mappingContainer.appendChild(pairEl);
            }
          });
        } catch (error) {
          outputContent.innerHTML = \`<section class="error"><strong>Error:</strong> \${escapeHtml(error.message)}</section>\`;
        }
      });

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
    </script>
  </body>
  </html>
`;
}

module.exports = { landingPage, cipherOptions };