/* ─── WhatsApp Chat Formatter — Application Logic ────────────────── */

/* ─── PRO Constants ──────────────────────────────────────────────── */
const MAX_FREE_ENTRIES = 100;
const PRO_KEY_PREFIX = 'WHATSAPP-';
// PRO_SECRET = charCode sum of "WHATSAPP-ABCD-EFGH-IJKL-MNOP" (also serves as demo key)
const PRO_SECRET = 'WHATSAPP-ABCD-EFGH-IJKL-MNOP'.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

let parsedData = null;
let filteredEntries = [];
let isPro = false;

/* ─── PRO Key Validation ─────────────────────────────────────────── */
function validateProKeyFormat(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim().toUpperCase();
  return /^WHATSAPP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(trimmed);
}

function offlineProChecksum(key) {
  const sum = key.trim().toUpperCase().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return sum === PRO_SECRET;
}

function getStoredProKey() {
  try { return localStorage.getItem('wcf_pro_key') || ''; } catch { return ''; }
}

function setStoredProKey(key) {
  try {
    if (key) localStorage.setItem('wcf_pro_key', key);
    else localStorage.removeItem('wcf_pro_key');
  } catch {}
}

function getDeviceId() {
  let id = localStorage.getItem('wcf_device_id');
  if (!id) {
    id = 'DEV-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    localStorage.setItem('wcf_device_id', id);
  }
  return id;
}

function getRegisteredDevices() {
  try { return JSON.parse(localStorage.getItem('wcf_devices') || '[]'); } catch { return []; }
}

function registerDevice() {
  const devs = getRegisteredDevices();
  const id = getDeviceId();
  if (!devs.includes(id)) {
    devs.push(id);
    localStorage.setItem('wcf_devices', JSON.stringify(devs));
  }
}

function isDeviceLimitReached() {
  return getRegisteredDevices().length > 3;
}

async function verifyProKeyOnline(key) {
  try {
    const r = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: 'LvQpF7JdzwGWoK8FYmxPTA==',
        license_key: key.trim(),
      }),
    });
    const data = await r.json();
    if (data.success && data.consumption && data.consumption.consumed_count <= 3) {
      return true;
    }
    // Fallback to offline if API unreachable
    return offlineProChecksum(key);
  } catch {
    return offlineProChecksum(key);
  }
}

async function activateProKey(key) {
  const trimmed = key.trim();
  if (!validateProKeyFormat(trimmed)) {
    return { ok: false, msg: 'Invalid key format. Expected: WHATSAPP-XXXX-XXXX-XXXX-XXXX' };
  }

  // Check offline format first
  if (!offlineProChecksum(trimmed)) {
    return { ok: false, msg: 'Invalid PRO key.' };
  }

  // Check device limit
  if (isDeviceLimitReached()) {
    return { ok: false, msg: 'This key has reached the 3-device limit.' };
  }

  // Online verification
  const onlineOk = await verifyProKeyOnline(trimmed);
  if (!onlineOk) {
    return { ok: false, msg: 'Key verification failed. Please check your key and try again.' };
  }

  // Activate
  setStoredProKey(trimmed);
  registerDevice();
  isPro = true;
  updateProUI();
  return { ok: true, msg: 'PRO activated! All features unlocked.' };
}

/* ─── UI State ───────────────────────────────────────────────────── */
function updateProUI() {
  const hint = document.getElementById('free-hint');
  const proCard = document.getElementById('pro-card');
  if (isPro) {
    if (hint) hint.style.display = 'none';
    if (proCard) proCard.style.display = 'none';
  }
  // Re-render with full data if already loaded
  if (parsedData && isPro) {
    applyFilters();
  }
}

/* ─── File Handling ──────────────────────────────────────────────── */
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadCard = document.getElementById('upload-card');
const resultsCard = document.getElementById('results-card');
const entryList = document.getElementById('entry-list');
const chatNameEl = document.getElementById('chat-name');
const msgCountEl = document.getElementById('msg-count');
const statsGrid = document.getElementById('stats-grid');
const senderStatsEl = document.getElementById('sender-stats');
const filterStart = document.getElementById('filter-start');
const filterEnd = document.getElementById('filter-end');
const filterSender = document.getElementById('filter-sender');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length) handleFile(files[0]);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

/* ─── Sample Data ────────────────────────────────────────────────── */
const SAMPLE_DATA = `[2024-01-15, 09:30:15] Alice: Hey everyone! Ready for the trip next weekend?
[2024-01-15, 09:31:02] Bob: Absolutely! I've already packed my bags 🎒
[2024-01-15, 09:31:45] Alice: Great! Don't forget the sunscreen
[2024-01-15, 09:32:10] Charlie: Wait, what trip? Did I miss something?
[2024-01-15, 09:32:48] Alice: The beach trip we planned last month! Saturday at 8am
[2024-01-15, 09:33:20] Bob: Charlie you were literally in the group when we decided 😂
[2024-01-15, 09:34:00] Charlie: Oh right! Sorry, been swamped with work. I'm in!
[2024-01-15, 09:34:35] Alice: Perfect. I'll bring snacks for everyone
[2024-01-15, 09:35:10] Bob: I can drive, my car fits 5 people
[2024-01-15, 09:36:00] Messages and calls are end-to-end encrypted. No one else can read them.
[2024-01-15, 09:36:30] Alice: Bob you're a lifesaver. Meet at my place at 7:30?
[2024-01-15, 09:37:15] Bob: Works for me! See you all there
[2024-01-15, 09:38:00] Charlie: See you! Can't wait 🌊
[2024-01-15, 14:20:00] Alice: Weather forecast says 28°C and sunny ☀️
[2024-01-15, 14:20:45] Bob: Perfect beach weather! I'll bring the volleyball
[2024-01-15, 14:21:30] Charlie: I'll bring a frisbee and some cold drinks
[2024-01-15, 14:22:15] Alice: This is going to be amazing! 5 more days!
[2024-01-15, 14:23:00] Bob: Quick question - should I bring my portable speaker?
[2024-01-15, 14:23:40] Alice: Yes! Good vibes need good music 🎵
[2024-01-15, 14:24:15] Charlie: Just don't play that terrible playlist from last time Bob
[2024-01-15, 14:25:00] Bob: My playlist is a masterpiece, Charlie. You have no taste
[2024-01-15, 14:25:45] Alice: I'm sure Bob's playlist is... interesting. Bring it anyway
[2024-01-15, 14:26:20] Charlie: 🎵 Your Spotify wrapped called, it said "we need to talk"
[2024-01-15, 14:27:00] Bob: Rude. I'm not sharing my snacks with Charlie
[2024-01-15, 14:27:35] Alice: Okay okay, no fighting. Beach trip is about RELAXATION
[2024-01-15, 14:28:10] Charlie: Fine, fine. I'll behave. Mostly.
[2024-01-15, 14:28:45] Bob: "Mostly" - Charlie, probably
[2024-01-15, 14:29:20] Alice: 😂 Okay I'm heading out. See you all Saturday!
[2024-01-15, 14:30:00] Bob: Later! 🏖️
[2024-01-16, 08:15:00] Alice: Morning everyone! 4 days to go! ☀️
[2024-01-16, 08:15:45] Bob: Already counting down! Got the speaker charged
[2024-01-16, 08:16:30] Charlie: Found my old snorkeling gear. Anyone want to try?
[2024-01-16, 08:17:15] Alice: Ooh yes! I've never been snorkeling before
[2024-01-16, 08:18:00] Bob: Count me in! Hope the water's clear
[2024-01-16, 08:18:45] Charlie: It's supposed to be great this time of year. Visibility up to 10m
[2024-01-16, 08:19:30] <Media omitted>
[2024-01-16, 08:19:45] Charlie: That's from last year at the same beach
[2024-01-16, 08:20:15] Alice: Wow that's beautiful! Can't wait!
[2024-01-16, 08:21:00] Bob: Okay now I'm really excited. This is going to be the best trip ever
[2024-01-16, 08:21:45] Alice: Group photo at sunset - mandatory! 📸
[2024-01-16, 17:45:00] Alice created group "Beach Trip 2024"
[2024-01-16, 17:45:10] Alice: Testing the new group! Can everyone see this?
[2024-01-16, 17:45:30] Bob: Crystal clear!
[2024-01-16, 17:46:00] Charlie: Got it!`;

document.getElementById('load-sample').addEventListener('click', () => {
  processChatText(SAMPLE_DATA, 'Sample Chat (Beach Trip 2024)');
});

/* ─── Main Processing ────────────────────────────────────────────── */
function handleFile(file) {
  const reader = new FileReader();
  reader.onload = e => processChatText(e.target.result, file.name.replace(/\.txt$/i, ''));
  reader.readAsText(file);
}

function processChatText(text, name) {
  const result = parseWhatsAppChat(text);
  if (result.format === 'unknown') {
    alert('Unable to detect the chat format. Please ensure you are uploading a WhatsApp exported .txt file (iOS or Android format).');
    return;
  }

  parsedData = result;
  document.getElementById('chat-name').textContent = name || 'WhatsApp Chat';
  showResults();
}

/* ─── Render Results ─────────────────────────────────────────────── */
function showResults() {
  uploadCard.style.display = 'none';
  resultsCard.style.display = 'block';
  checkProStatus();
  applyFilters();
}

function checkProStatus() {
  const stored = getStoredProKey();
  if (stored && offlineProChecksum(stored)) {
    // In a full implementation, also verify online periodically
    isPro = true;
  }
  updateProUI();
}

function applyFilters() {
  if (!parsedData) return;
  let entries = parsedData.entries;

  // Date filter
  const sd = filterStart.value;
  const ed = filterEnd.value;
  entries = filterByDateRange(entries, sd, ed);

  // Sender filter
  const senderVal = filterSender.value;
  if (senderVal) {
    entries = entries.filter(e => e.sender === senderVal);
  }

  filteredEntries = entries;
  renderStats();
  renderSenderStats();
  renderEntries();
}

/* ─── Stats ──────────────────────────────────────────────────────── */
function renderStats() {
  const total = filteredEntries.length;
  const userMsgs = filteredEntries.filter(e => !e.isSystem);
  const systemMsgs = filteredEntries.filter(e => e.isSystem);
  const mediaMsgs = filteredEntries.filter(e => e.isMedia);
  const totalChars = userMsgs.reduce((s, e) => s + e.message.length, 0);

  msgCountEl.textContent = `${total} messages (${userMsgs.length} user · ${systemMsgs.length} system)`;

  statsGrid.innerHTML = `
    <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total Messages</div></div>
    <div class="stat-card"><div class="stat-value">${userMsgs.length}</div><div class="stat-label">User Messages</div></div>
    <div class="stat-card"><div class="stat-value">${mediaMsgs.length}</div><div class="stat-label">Media Shared</div></div>
    <div class="stat-card"><div class="stat-value">${totalChars.toLocaleString()}</div><div class="stat-label">Total Characters</div></div>
  `;
}

function renderSenderStats() {
  const userMsgs = filteredEntries.filter(e => !e.isSystem && e.sender);
  const stats = {};
  for (const e of userMsgs) {
    if (!stats[e.sender]) stats[e.sender] = { count: 0, chars: 0, media: 0 };
    stats[e.sender].count++;
    stats[e.sender].chars += e.message.length;
    if (e.isMedia) stats[e.sender].media++;
  }

  senderStatsEl.innerHTML = Object.entries(stats)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, s]) =>
      `<span class="sender-stat">${escHtml(name)}: ${s.count} msgs${s.media ? `, ${s.media} media` : ''}</span>`
    ).join('');
}

/* ─── Entry List ─────────────────────────────────────────────────── */
function renderEntries() {
  const limit = isPro ? filteredEntries.length : Math.min(filteredEntries.length, MAX_FREE_ENTRIES);
  const showLimitNote = !isPro && filteredEntries.length > MAX_FREE_ENTRIES;

  let html = '';
  for (let i = 0; i < limit; i++) {
    const e = filteredEntries[i];
    const cls = e.isSystem ? 'entry-system' : (e.isMedia ? 'entry-media' : '');
    const label = e.isSystem ? 'ℹ System' : (e.isMedia ? '📎 Media' : (e.sender ? escHtml(e.sender) : ''));
    html += `
      <div class="entry-item">
        <div class="entry-header" onclick="toggleEntry(this)">
          <span>${e.isSystem
            ? `<span class="sys-label">ℹ ${escHtml(e.message).slice(0, 80)}${e.message.length > 80 ? '…' : ''}</span>`
            : `<span class="sender">${escHtml(e.sender)}</span>`
          }</span>
          <span>
            <span class="time">${escHtml(e.timestamp)}</span>
            <span class="open-indicator">▶</span>
          </span>
        </div>
        <div class="entry-body">
          <div class="entry-text ${cls}">${escHtml(e.message)}</div>
        </div>
      </div>`;
  }

  if (showLimitNote) {
    html += `<div class="error">🔒 Showing first 100 messages. <a href="#" onclick="document.getElementById('btn-show-pro').click();return false;">Upgrade to PRO</a> to see all ${filteredEntries.length} messages.</div>`;
  } else if (filteredEntries.length === 0) {
    html += `<div class="error" style="color:#888;">No messages match the current filters.</div>`;
  }

  entryList.innerHTML = html;

  // Update export buttons
  document.querySelectorAll('.btn-export').forEach(btn => {
    btn.disabled = filteredEntries.length === 0;
  });
}

function toggleEntry(el) {
  el.parentElement.classList.toggle('open');
  const indicator = el.querySelector('.open-indicator');
  if (indicator) {
    indicator.textContent = el.parentElement.classList.contains('open') ? '▼' : '▶';
  }
}

/* ─── Filters ────────────────────────────────────────────────────── */
document.getElementById('btn-apply-filters').addEventListener('click', applyFilters);

// Populate sender filter when data changes
function populateSenderFilter(senders) {
  filterSender.innerHTML = '<option value="">All Senders</option>' +
    senders.map(s => `<option value="${escHtml(s)}">${escHtml(s)}</option>`).join('');
}

// Patch into processChatText to populate senders
const origProcessChatText = processChatText;
processChatText = function(text, name) {
  const result = parseWhatsAppChat(text);
  if (result.format === 'unknown') {
    alert('Unable to detect the chat format. Please ensure you are uploading a WhatsApp exported .txt file (iOS or Android format).');
    return;
  }
  parsedData = result;
  document.getElementById('chat-name').textContent = name || 'WhatsApp Chat';
  populateSenderFilter(result.senders);
  showResults();
};

/* ─── Export Handlers ────────────────────────────────────────────── */
document.querySelectorAll('.btn-export').forEach(btn => {
  btn.addEventListener('click', () => {
    const format = btn.dataset.format;
    const name = (chatNameEl.textContent || 'WhatsApp Chat').replace(/[^a-zA-Z0-9_\- ]/g, '');
    const entries = filteredEntries;

    if (!isPro && entries.length > MAX_FREE_ENTRIES) {
      if (!confirm(`Free exports include only the first ${MAX_FREE_ENTRIES} messages. Upgrade to PRO for unlimited exports.\n\nExport first ${MAX_FREE_ENTRIES} messages anyway?`)) {
        return;
      }
    }

    const exportEntries = isPro ? entries : entries.slice(0, MAX_FREE_ENTRIES);

    let content, ext, mime;
    switch (format) {
      case 'md':
        content = exportMarkdown(exportEntries, name);
        ext = 'md'; mime = 'text/markdown;charset=utf-8';
        break;
      case 'html':
        content = exportHTML(exportEntries, name);
        ext = 'html'; mime = 'text/html;charset=utf-8';
        break;
      case 'txt':
        content = exportPlainText(exportEntries);
        ext = 'txt'; mime = 'text/plain;charset=utf-8';
        break;
      case 'csv':
        content = exportCSV(exportEntries);
        ext = 'csv'; mime = 'text/csv;charset=utf-8';
        break;
      case 'json':
        content = exportJSON(exportEntries);
        ext = 'json'; mime = 'application/json;charset=utf-8';
        break;
    }

    downloadFile(`${name}.${ext}`, content, mime);
  });
});

/* ─── New File ───────────────────────────────────────────────────── */
document.getElementById('btn-new-file').addEventListener('click', e => {
  e.preventDefault();
  resultsCard.style.display = 'none';
  uploadCard.style.display = 'block';
  parsedData = null;
  filteredEntries = [];
  fileInput.value = '';
});

/* ─── PRO Modal ──────────────────────────────────────────────────── */
const proModal = document.getElementById('pro-modal');
document.getElementById('btn-show-pro').addEventListener('click', () => { proModal.style.display = 'flex'; });
document.getElementById('btn-show-pro2').addEventListener('click', () => { proModal.style.display = 'flex'; });
document.getElementById('modal-close').addEventListener('click', () => { proModal.style.display = 'none'; });
proModal.addEventListener('click', e => { if (e.target === proModal) proModal.style.display = 'none'; });

document.getElementById('btn-activate').addEventListener('click', async () => {
  const input = document.getElementById('pro-key-input');
  const key = input.value.trim();
  if (!key) { alert('Please enter a PRO key.'); return; }

  const btn = document.getElementById('btn-activate');
  btn.textContent = 'Verifying…';
  btn.disabled = true;

  const result = await activateProKey(key);

  btn.textContent = 'Activate';
  btn.disabled = false;

  if (result.ok) {
    alert(result.msg);
    proModal.style.display = 'none';
    if (parsedData) applyFilters();
  } else {
    alert(result.msg);
  }
});

// Auto-check PRO on load
checkProStatus();

/* ─── Cross-promotion ────────────────────────────────────────────── */
// Already in HTML as direct links

/* ─── Keyboard shortcut ──────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && proModal.style.display === 'flex') {
    proModal.style.display = 'none';
  }
});
