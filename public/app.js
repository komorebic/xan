const thread = document.getElementById('thread');
const emptyState = document.getElementById('empty-state');
const composer = document.getElementById('composer');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send-btn');
const status = document.getElementById('status');
const clearBtn = document.getElementById('clear-btn');
const appTitle = document.getElementById('app-title');

const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsOverlay = document.getElementById('settings-overlay');
const saveSettingsBtn = document.getElementById('save-settings');
const resetSettingsBtn = document.getElementById('reset-settings');
const nameInput = document.getElementById('setting-name');
const modelSelect = document.getElementById('setting-model');
const systemInput = document.getElementById('setting-system');
const swatchesEl = document.getElementById('swatches');
const themeToggleEl = document.getElementById('theme-toggle');

const DEFAULTS = {
  name: 'Xanthos',
  accent: '#B8863B',
  theme: 'light',
  model: 'gemini-2.5-flash',
  system: '',
};

let history = [];
let settings = loadSettings();

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('xanthos-settings') || '{}');
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings() {
  localStorage.setItem('xanthos-settings', JSON.stringify(settings));
}

function applySettings() {
  document.documentElement.style.setProperty('--accent', settings.accent);
  document.documentElement.setAttribute('data-theme', settings.theme);
  appTitle.textContent = settings.name || DEFAULTS.name;
  document.title = settings.name || DEFAULTS.name;

  // Reflect into the settings form
  nameInput.value = settings.name === DEFAULTS.name ? '' : settings.name;
  modelSelect.value = settings.model;
  systemInput.value = settings.system;

  swatchesEl.querySelectorAll('.swatch').forEach((sw) => {
    sw.classList.toggle('selected', sw.dataset.accent.toLowerCase() === settings.accent.toLowerCase());
  });

  themeToggleEl.querySelectorAll('.segment').forEach((seg) => {
    seg.classList.toggle('active', seg.dataset.theme === settings.theme);
  });
}

applySettings();

function autoGrow() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 160) + 'px';
}
input.addEventListener('input', autoGrow);

function scrollToBottom() {
  thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
}

function renderMessage(role, text) {
  emptyState.style.display = 'none';
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = role === 'user' ? 'You' : (settings.name || DEFAULTS.name);
  const body = document.createElement('span');
  body.textContent = text;
  el.appendChild(label);
  el.appendChild(body);
  thread.appendChild(el);
  scrollToBottom();
  return el;
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'typing';
  el.id = 'typing-indicator';
  el.innerHTML = '<span></span><span></span><span></span>';
  thread.appendChild(el);
  scrollToBottom();
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

async function sendMessage(text) {
  history.push({ role: 'user', content: text });
  renderMessage('user', text);

  input.value = '';
  autoGrow();
  sendBtn.disabled = true;
  status.textContent = 'thinking';
  status.classList.add('thinking');
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: history,
        model: settings.model,
        system: settings.system || undefined,
      }),
    });
    const data = await res.json();

    hideTyping();

    if (!res.ok) {
      renderMessage('assistant', `Error: ${data.error || 'something went wrong'}`);
    } else {
      history.push({ role: 'assistant', content: data.text });
      renderMessage('assistant', data.text);
    }
  } catch (err) {
    hideTyping();
    renderMessage('assistant', 'Network error — is the server running?');
  } finally {
    sendBtn.disabled = false;
    status.textContent = 'ready';
    status.classList.remove('thinking');
  }
}

composer.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  sendMessage(text);
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

clearBtn.addEventListener('click', () => {
  const msgs = thread.querySelectorAll('.msg, .typing');
  if (msgs.length === 0) return;

  thread.style.transition = 'opacity 0.2s ease';
  thread.style.opacity = '0';

  setTimeout(() => {
    history = [];
    thread.innerHTML = '';
    thread.appendChild(emptyState);
    emptyState.style.display = 'flex';
    thread.style.opacity = '1';
  }, 200);
});

/* --- Settings modal --- */

function openSettings() {
  applySettings();
  settingsOverlay.classList.add('open');
}

function closeSettings() {
  settingsOverlay.classList.remove('open');
}

settingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);

settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) closeSettings();
});

swatchesEl.querySelectorAll('.swatch').forEach((sw) => {
  sw.addEventListener('click', () => {
    swatchesEl.querySelectorAll('.swatch').forEach((s) => s.classList.remove('selected'));
    sw.classList.add('selected');
    // Live preview
    document.documentElement.style.setProperty('--accent', sw.dataset.accent);
  });
});

themeToggleEl.querySelectorAll('.segment').forEach((seg) => {
  seg.addEventListener('click', () => {
    themeToggleEl.querySelectorAll('.segment').forEach((s) => s.classList.remove('active'));
    seg.classList.add('active');
    // Live preview
    document.documentElement.setAttribute('data-theme', seg.dataset.theme);
  });
});

saveSettingsBtn.addEventListener('click', () => {
  const selectedSwatch = swatchesEl.querySelector('.swatch.selected');
  const selectedTheme = themeToggleEl.querySelector('.segment.active');

  settings = {
    name: nameInput.value.trim() || DEFAULTS.name,
    accent: selectedSwatch ? selectedSwatch.dataset.accent : settings.accent,
    theme: selectedTheme ? selectedTheme.dataset.theme : settings.theme,
    model: modelSelect.value,
    system: systemInput.value.trim(),
  };

  saveSettings();
  applySettings();
  closeSettings();
});

resetSettingsBtn.addEventListener('click', () => {
  settings = { ...DEFAULTS };
  saveSettings();
  applySettings();
});
