const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Target password and files
const PASSWORD = 'aws-traffic-2026';
const SRC_DIR = path.join(__dirname, 'src-viz');
const DIST_DIR = path.join(__dirname, 'aws-architecture-viz');

// Ensure source and output directories exist
if (!fs.existsSync(SRC_DIR)) {
  console.error(`Error: Source directory ${SRC_DIR} does not exist.`);
  process.exit(1);
}
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// OpenSSL-compatible AES-256-CBC Hashing & Encryption (matching CryptoJS.AES.encrypt)
function encryptCryptoJS(text, password) {
  const salt = crypto.randomBytes(8);
  
  // Derive key and IV (CryptoJS EVP_BytesToKey standard)
  let derived = Buffer.alloc(0);
  let current = Buffer.alloc(0);
  const passwordBuffer = Buffer.from(password, 'utf8');
  
  while (derived.length < 48) { // 32 bytes key + 16 bytes IV
    const hash = crypto.createHash('md5');
    hash.update(current);
    hash.update(passwordBuffer);
    hash.update(salt);
    current = hash.digest();
    derived = Buffer.concat([derived, current]);
  }
  
  const key = derived.subarray(0, 32);
  const iv = derived.subarray(32, 48);
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let ciphertext = cipher.update(text, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  
  // OpenSSL header prefix: "Salted__" + 8-byte salt
  const saltedPrefix = Buffer.from('Salted__', 'utf8');
  const combined = Buffer.concat([saltedPrefix, salt, Buffer.from(ciphertext, 'base64')]);
  return combined.toString('base64');
}

// Generate the self-decrypting wrapper HTML
function generateWrapperHTML(pageTitle, encryptedPayload) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} — Security Gateway</title>
  
  <!-- Premium Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  
  <!-- CryptoJS Decryptor -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>

  <style>
    :root {
      --bg-dark: #05070f;
      --bg-panel: rgba(10, 15, 28, 0.85);
      --border-color: rgba(255, 255, 255, 0.05);
      --border-glow: rgba(0, 245, 255, 0.15);
      --color-primary: #00f5ff;
      --color-secondary: #9d4edd;
      --color-text: #f3f4f6;
      --color-text-muted: #8b9bb4;
      --font-outfit: 'Outfit', sans-serif;
      --font-inter: 'Inter', sans-serif;
      --font-mono: 'Fira Code', monospace;
      --glow-cyan: 0 0 20px rgba(0, 245, 255, 0.2);
      --glow-purple: 0 0 20px rgba(157, 78, 221, 0.2);
    }

    html.light-theme {
      --bg-dark: #f2efe9;
      --bg-panel: rgba(243, 240, 234, 0.85);
      --border-color: rgba(110, 96, 92, 0.12);
      --border-glow: rgba(212, 138, 151, 0.25);
      --color-primary: #000000;
      --color-secondary: #d48a97;
      --color-text: #1a1a1a;
      --color-text-muted: #6e605c;
      --glow-cyan: 0 0 15px rgba(0, 0, 0, 0.08);
      --glow-purple: 0 0 15px rgba(212, 138, 151, 0.15);
    }

    body {
      background-color: var(--bg-dark);
      color: var(--color-text);
      font-family: var(--font-inter);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0;
      overflow: hidden;
      position: relative;
    }

    /* Grid overlay background */
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(to right, rgba(0, 245, 255, 0.012) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 245, 255, 0.012) 1px, transparent 1px);
      background-size: 40px 40px;
      z-index: -2;
      pointer-events: none;
    }
    html.light-theme::before {
      background-image: 
        linear-gradient(to right, rgba(212, 138, 151, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(212, 138, 151, 0.04) 1px, transparent 1px);
    }

    /* Floating radial glows */
    .glow-bg-1 {
      position: absolute;
      top: -10%;
      left: -10%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(0, 245, 255, 0.04) 0%, transparent 70%);
      z-index: -1;
      pointer-events: none;
    }
    html.light-theme .glow-bg-1 {
      background: radial-gradient(circle, rgba(212, 138, 151, 0.09) 0%, transparent 70%);
    }

    /* Topbar Header */
    .topbar {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      padding: 0.75rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      background: rgba(5, 7, 15, 0.4);
      backdrop-filter: blur(10px);
      z-index: 100;
    }
    html.light-theme .topbar {
      background: rgba(242, 239, 233, 0.4);
    }

    .btn-back {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-text-muted);
      border: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.02);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      text-decoration: none;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-back:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: rgba(0, 245, 255, 0.05);
      transform: translateX(-3px);
    }
    html.light-theme .btn-back:hover {
      background: rgba(212, 138, 151, 0.05);
      border-color: var(--color-secondary);
      color: var(--color-secondary);
    }

    /* Theme Toggle */
    .theme-toggle-btn {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      color: var(--color-text-muted);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .theme-toggle-btn:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: rgba(0, 245, 255, 0.05);
      transform: translateY(-2px) rotate(15deg);
    }
    html.light-theme .theme-toggle-btn:hover {
      background: rgba(212, 138, 151, 0.1);
      border-color: var(--color-secondary);
      color: var(--color-secondary);
    }
    .theme-toggle-btn svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
    }
    .theme-toggle-btn .sun-icon { display: block; }
    .theme-toggle-btn .moon-icon { display: none; }
    html.light-theme .theme-toggle-btn .sun-icon { display: none; }
    html.light-theme .theme-toggle-btn .moon-icon { display: block; }

    /* Login Card container */
    #auth-container {
      width: 100%;
      max-width: 440px;
      padding: 3rem 2.5rem;
      background: rgba(10, 15, 28, 0.75);
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      border: 1px solid rgba(0, 245, 255, 0.15);
      border-radius: 16px;
      box-shadow: 0 0 40px rgba(0, 245, 255, 0.08), inset 0 0 20px rgba(255, 255, 255, 0.02);
      font-family: var(--font-outfit), sans-serif;
      text-align: center;
      z-index: 10;
      position: relative;
      animation: auth-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    html.light-theme #auth-container {
      background: rgba(243, 240, 234, 0.85);
      border-color: rgba(110, 96, 92, 0.2);
      box-shadow: 0 10px 40px rgba(110, 96, 92, 0.1);
    }

    @keyframes auth-fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes auth-shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .auth-shake-anim {
      animation: auth-shake 0.4s ease-in-out;
      border-color: rgba(239, 68, 68, 0.5) !important;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.2) !important;
    }
    .auth-input-focus {
      border-color: var(--color-primary) !important;
      box-shadow: 0 0 15px var(--border-glow) !important;
    }

    #auth-container h2 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #f3f4f6;
      margin: 0 0 0.5rem 0;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #f3f4f6 0%, #8b9bb4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    html.light-theme #auth-container h2 {
      background: linear-gradient(135deg, #1a1a1a 0%, #6e605c 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    #auth-password {
      width: 100%;
      padding: 14px 16px;
      background: rgba(5, 7, 15, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      color: #f3f4f6;
      font-family: var(--font-mono);
      font-size: 0.95rem;
      outline: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: center;
    }
    html.light-theme #auth-password {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(110, 96, 92, 0.2);
      color: #1a1a1a;
    }

    #auth-form button {
      background: linear-gradient(135deg, #00f5ff 0%, #9d4edd 100%);
      color: #05070f;
      border: none;
      padding: 14px;
      font-weight: 700;
      font-size: 0.95rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(0, 245, 255, 0.25);
      font-family: var(--font-outfit), sans-serif;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 0.5rem;
      width: 100%;
    }
    html.light-theme #auth-form button {
      background: linear-gradient(135deg, #1a1a1a 0%, #d48a97 100%);
      color: #f2efe9;
      box-shadow: 0 4px 15px rgba(212, 138, 151, 0.2);
    }
  </style>
  <script>
    // Restore theme preference immediately
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    }
  </script>
</head>
<body>
  <div class="glow-bg-1"></div>
  
  <header class="topbar">
    <a href="../index.html" class="btn-back">← Back to Portfolio</a>
    <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle light/dark theme">
      <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
      <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
    </button>
  </header>

  <div id="auth-container">
    <div style="
      width: 64px;
      height: 64px;
      background: rgba(0, 245, 255, 0.08);
      border: 1px solid rgba(0, 245, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem auto;
      font-size: 1.75rem;
      box-shadow: 0 0 20px rgba(0, 245, 255, 0.1);
    ">🔒</div>
    
    <h2>Security Gateway</h2>
    
    <p style="
      color: #8b9bb4;
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0 0 2rem 0;
    ">
      The system architecture diagrams and failover topologies are encrypted. Please enter the security key to decrypt and view.
    </p>
    
    <form id="auth-form" style="display: flex; flex-direction: column; gap: 1rem;">
      <input 
        type="password" 
        id="auth-password" 
        placeholder="Enter Authorization Key" 
        autocomplete="current-password"
        required
      />
      
      <div id="auth-error" style="
        color: #ef4444;
        font-size: 0.85rem;
        min-height: 1.2rem;
        transition: all 0.3s ease;
        opacity: 0;
        margin-top: -0.25rem;
        text-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
      ">
        Access Denied: Invalid Security Key
      </div>
      
      <button type="submit">Decrypt & Enter</button>
    </form>
  </div>

  <script>
    // Theme toggle handling
    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-theme');
      if (document.documentElement.classList.contains('light-theme')) {
        localStorage.setItem('portfolio-theme', 'light');
      } else {
        localStorage.setItem('portfolio-theme', 'dark');
      }
    });

    const input = document.getElementById('auth-password');
    const container = document.getElementById('auth-container');
    const form = document.getElementById('auth-form');
    const errorEl = document.getElementById('auth-error');

    input.focus();
    input.addEventListener('focus', () => input.classList.add('auth-input-focus'));
    input.addEventListener('blur', () => input.classList.remove('auth-input-focus'));

    // Encrypted content data (Base64 payload compatible with CryptoJS)
    const ciphertext = "${encryptedPayload}";

    // SHA-256 hash of the password "aws-traffic-2026"
    const CORRECT_HASH = 'f2e15f71628034ebfe8c173d060d205ca5f92b3367592a301caccc7aca6e19e6';

    // Cookie management helpers for session authentication
    function setSessionCookie(name, value) {
      try {
        // Set cookie without expires attribute to make it a session cookie.
        // On local file:// protocol, setting cookies may fail, so sessionStorage is used as fallback.
        document.cookie = name + "=" + encodeURIComponent(value) + "; path=/; SameSite=Strict";
      } catch (e) {
        console.warn("Failed to set session cookie:", e);
      }
    }

    // Get cookie utility
    function getCookie(name) {
      try {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
      } catch (e) {
        console.warn("Failed to get session cookie:", e);
      }
      return null;
    }

    // Erase cookie utility
    function eraseCookie(name) {
      try {
        document.cookie = name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      } catch (e) {}
    }

    // Decrypt and replace document stream
    function decryptAndRender(passwordVal) {
      try {
        const decrypted = CryptoJS.AES.decrypt(ciphertext, passwordVal);
        const decryptedHtml = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (decryptedHtml.startsWith('<!DOCTYPE html>') || decryptedHtml.includes('html') || decryptedHtml.length > 500) {
          // Success! Save auth parameters to Session Cookie and sessionStorage for tab/session sync
          setSessionCookie('portfolio_auth_key', passwordVal);
          try {
            sessionStorage.setItem('portfolio_auth_key', passwordVal);
          } catch (e) {}

          // For local testing on file:// protocol (which isolates sessionStorage per file path),
          // fallback to localStorage so the credentials remain universal without prompting again.
          // On HTTP/HTTPS production, we keep it session-only by removing localStorage credentials.
          try {
            if (window.location.protocol === 'file:') {
              localStorage.setItem('portfolio_auth_key', passwordVal);
              localStorage.setItem('portfolio_auth_token', CORRECT_HASH);
            } else {
              localStorage.removeItem('portfolio_auth_key');
              localStorage.removeItem('portfolio_auth_token');
            }
          } catch (e) {}
          
          // Re-write document stream with decrypted markup
          document.open();
          document.write(decryptedHtml);
          document.close();
          return true;
        }
      } catch (e) {
        // Fall through on decryption failure
      }
      return false;
    }

    // Auto-decrypt if valid session credentials exist
    const savedKey = getCookie('portfolio_auth_key') || 
                     sessionStorage.getItem('portfolio_auth_key') || 
                     (window.location.protocol === 'file:' ? localStorage.getItem('portfolio_auth_key') : null);
    if (savedKey) {
      const success = decryptAndRender(savedKey);
      if (!success) {
        eraseCookie('portfolio_auth_key');
        try {
          sessionStorage.removeItem('portfolio_auth_key');
          localStorage.removeItem('portfolio_auth_key');
          localStorage.removeItem('portfolio_auth_token');
        } catch (e) {}
      }
    }

    // Submit listener
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredValue = input.value;
      const success = decryptAndRender(enteredValue);
      
      if (!success) {
        // Shake container and display error feedback
        container.classList.remove('auth-shake-anim');
        void container.offsetWidth; // Reflow trigger
        container.classList.add('auth-shake-anim');
        errorEl.style.opacity = '1';
        input.value = '';
        input.focus();
        setTimeout(() => {
          container.classList.remove('auth-shake-anim');
        }, 400);
      }
    });
  </script>
</body>
</html>`;
}

// Read from src-viz, encrypt, and output to aws-architecture-viz
function runBuild() {
  console.log("Starting secure static page compilation (AES-256)...");
  
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`Source directory ${SRC_DIR} not found.`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(SRC_DIR).filter(file => file.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(SRC_DIR, file);
    const destPath = path.join(DIST_DIR, file);
    
    console.log(`Processing: ${file}...`);
    const rawContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract page title or fallback
    const titleMatch = rawContent.match(/<title>(.*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1] : "Protected Page";
    
    // Encrypt the contents
    const encrypted = encryptCryptoJS(rawContent, PASSWORD);
    
    // Generate the wrapped HTML content
    const wrappedHTML = generateWrapperHTML(pageTitle, encrypted);
    
    // Write out the encrypted page
    fs.writeFileSync(destPath, wrappedHTML, 'utf8');
    console.log(`-> Secured successfully -> ${destPath}`);
  });
  
  console.log("\nDone! All portfolio subpages are now encrypted and secured.");
}

runBuild();
