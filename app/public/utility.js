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
function renderParameterPanel(selectedCipher, shift, rails, keyword) {
  if (selectedCipher === 'caesar') {
    return `
      <label for="shift">
        Shift
        <input id="shift" name="shift" type="number" min=0 max=25 onkeydown="return event.keyCode !== 189" value="${escapeHtml(String(shift))}" />
      </label>
      <p class="helper">Letters only. Spaces are preserved in output.</p>
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
  keyword = '',
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
        grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.9fr) minmax(0, 1.4fr);
        gap: 20px;
        align-items: stretch;
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
        min-height: 220px;
        resize: vertical;
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

      @media (max-width: 920px) {
        .workspace {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>

  <body>
    <main>
      <h1>Cipher Project</h1>
      <p>Choose a cipher, enter plaintext, adjust its parameters, and view the ciphertext from left to right.</p>

      <form method="post" action="/">
        <section class="workspace">
          <section class="panel">
            <h2>Plaintext</h2>
            <label for="plaintext">
              Message
              <textarea id="plaintext" name="plaintext" placeholder="Type your message here...">${escapeHtml(plaintext)}</textarea>
            </label>
          </section>

          <section class="panel parameters">
            <h2>Parameters</h2>
            <label for="cipher">
              Cipher
              <select id="cipher" name="cipher" onchange="window.location='/?cipher='+this.value">
                ${renderCipherOptions(selectedCipher)}
              </select>
            </label>
            <!-- CHANGE: pass rails as third argument -->
            ${renderParameterPanel(selectedCipher, shift, rails, keyword)}
            ${error ? `<section class="error"><strong>Error:</strong> ${escapeHtml(error)}</section>` : ''}
          </section>

          <section class="panel output">
            <h2>Ciphertext</h2>
            <p>Encrypted output appears here.</p>
            <code>${escapeHtml(ciphertext || 'Your ciphertext will appear here.')}</code>
          </section>
        </section>

        <button type="submit">Encrypt Text</button>
      </form>
    </main>
  </body>
  </html>
`;
}

module.exports = { landingPage, cipherOptions };