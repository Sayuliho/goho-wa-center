const API = 'https://goho-proxy.gohotravel.workers.dev';
let currentStaff = null, currentRoom = null, currentTab = 'aktif', currentMainTab = 'chat';
let allChats = [], allRoomsCache = [], allContactsCache = [];
let currentContactNoWa = '', currentContactNama = '';
let pollInterval = null, lastMsgCount = 0, unreadCounts = {}, lastSeenAt = {};
let currentFlightDate = null; // tanggal terbang aktif untuk hitung ADT/CHD/INF di Multi Pax — null = belum terdeteksi, fallback ke hari ini

// ===================== SESSION MANAGEMENT =====================
function saveSession(staff) {
  const session = { staff: staff, expiry: Date.now() + (8 * 60 * 60 * 1000) };
  try { localStorage.setItem('goho_session', JSON.stringify(session)); } catch(e) {}
}
function loadSession() {
  try {
    const raw = localStorage.getItem('goho_session');
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (Date.now() > s.expiry) { localStorage.removeItem('goho_session'); return null; }
    return s.staff;
  } catch(e) { try { localStorage.removeItem('goho_session'); } catch(e2) {} return null; }
}
function clearSession() { try { localStorage.removeItem('goho_session'); } catch(e) {} }
function initApp(staff) {
  currentStaff = staff;
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  document.getElementById('nav-name').textContent = currentStaff.nama;
  document.getElementById('nav-av').textContent = currentStaff.nama.substring(0,2).toUpperCase();
  // Tampilkan main-tabs untuk semua role (chat, contacts, layanan)
  document.getElementById('main-tabs').classList.add('visible');

  if (currentStaff.role === 'OWNER') {
    document.getElementById('nav-badge').classList.remove('hidden');
    document.getElementById('nav-av').classList.add('owner');
    // Owner: tampilkan tab Dashboard & Semua Chat
    document.querySelectorAll('.owner-only').forEach(el => el.style.display = 'flex');
  }
  startPolling(); loadChats(); showSoundActivation();
loadTicker();
setInterval(loadTicker, 5 * 60 * 1000);
  initClipboardPaste();
}
function doLogout() {
  if (!confirm('Logout dari GOHO WA Center?')) return;
  clearSession(); location.reload();
}
window.addEventListener('DOMContentLoaded', () => {
  const saved = loadSession();
  if (saved) initApp(saved);
});

// ===================== UTILS =====================
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; resetDraggedModal(id); }
function escH(str) { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
async function apiGet(params) {
  params._t = Date.now();
  const query = new URLSearchParams(params).toString();
  try { const r = await fetch('https://goho-proxy.gohotravel.workers.dev?' + query, { method: 'GET', cache: 'no-store' }); return JSON.parse(await r.text()); }
  catch(e) { return {ok: false, msg: e.toString()}; }
}
async function apiPost(body) {
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  } catch(e) {
    console.error('[apiPost] error:', e.toString());
    return { ok: false, msg: 'Network error: ' + e.toString() };
  }
}
function autoExpandTextarea(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; }

// ===================== PWA =====================
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); }); }
function updateAppBadge(count) { if ('setAppBadge' in navigator) { if (count > 0) navigator.setAppBadge(count).catch(() => {}); else navigator.clearAppBadge().catch(() => {}); } }

// ===================== LOGIN =====================
async function doLogin() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  if (!u || !p) return;
  try {
    const res = await apiGet({action: 'login', username: u, password: p});
    if (res.ok) { saveSession(res.staff); initApp(res.staff); }
    else { document.getElementById('login-error').classList.remove('hidden'); }
  } catch(e) { document.getElementById('login-error').classList.remove('hidden'); }
}
document.getElementById('password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

// ===================== MAIN TABS =====================
function switchMainTab(tab) {
  currentMainTab = tab;
  ['chat','contacts','dashboard','allchats','layanan'].forEach(t => {
    document.getElementById('mtab-' + t)?.classList.toggle('active', t === tab);
    const page = document.getElementById('page-' + t);
    if (page) { page.style.display = t === tab ? 'flex' : 'none'; page.classList.toggle('active', t === tab); }
  });
  const chatPage = document.getElementById('page-chat');
  if (chatPage) chatPage.style.display = tab === 'chat' ? 'flex' : 'none';
  if (tab === 'contacts') loadContacts();
  if (tab === 'dashboard') loadOwnerStats();
  if (tab === 'allchats') loadAllChats();
}

// ===================== LAYANAN DROPDOWN =====================
function toggleLayananDropdown(e) {
  e && e.stopPropagation();
  const dd = document.getElementById('layanan-dropdown');
  const chev = document.getElementById('layanan-chevron');
  const isOpen = dd.classList.contains('open');
  closeLayananDropdown();
  if (!isOpen) {
    const btn = document.getElementById('mtab-layanan');
    const rect = btn.getBoundingClientRect();
    dd.style.left = rect.left + 'px';
    dd.style.top  = (rect.bottom + 2) + 'px';
    dd.classList.add('open');
    if (chev) chev.style.transform = 'rotate(180deg)';
  }
}

function closeLayananDropdown() {
  const dd = document.getElementById('layanan-dropdown');
  const chev = document.getElementById('layanan-chevron');
  if (dd) dd.classList.remove('open');
  if (chev) chev.style.transform = 'rotate(0deg)';
}

function pilihLayanan(type) {
  closeLayananDropdown();
  const labels = { twac: 'TWAC Taiwan', sgcard: 'SG Card Singapore', allin: 'All-in Indonesia' };
  if (type === 'mdac') {
    openMdacModal();
  } else if (type === 'harga') {
    openHargaModal();
  } else if (type === 'alli') {
    quickArrivalIndonesia('','','','', currentRoom ? currentRoom.nama : '');
  } else {
    showToast('🚧 ' + (labels[type] || type) + ' — coming soon');
  }
}

// Tutup dropdown kalau klik di luar area tombol & dropdown
document.addEventListener('click', function(e) {
  const dd = document.getElementById('layanan-dropdown');
  const btn = document.getElementById('mtab-layanan');
  if (dd && btn && !btn.contains(e.target) && !dd.contains(e.target)) {
    closeLayananDropdown();
  }
});

// ===================== SOUND & NOTIFICATION =====================
let lastWaitingRooms = new Set();
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    function beep(freq, start, duration) {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.8, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + duration);
    }
    beep(880, 0.0, 0.18); beep(880, 0.25, 0.18); beep(1050, 0.5, 0.25);
  } catch(e) {}
}
function unlockAudio() {
  try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const buf = ctx.createBuffer(1,1,22050); const src = ctx.createBufferSource(); src.buffer=buf; src.connect(ctx.destination); src.start(0); ctx.resume(); } catch(e) {}
  document.removeEventListener('click', unlockAudio); document.removeEventListener('keydown', unlockAudio);
}
document.addEventListener('click', unlockAudio); document.addEventListener('keydown', unlockAudio);
function showSoundActivation() {
  const btn = document.createElement('div'); btn.id = 'sound-btn'; btn.innerHTML = '🔔 Aktifkan Suara Notif';
  btn.style.cssText = 'position:fixed;top:56px;right:12px;background:#0F6E56;color:white;padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;z-index:9998;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
  btn.onclick = function() { unlockAudio(); playNotifSound(); btn.innerHTML = '✅ Suara Aktif'; btn.style.background = '#666'; setTimeout(() => btn.remove(), 2000); };
  document.body.appendChild(btn);
  setTimeout(() => { unlockAudio(); const b = document.getElementById('sound-btn'); if (b) { b.innerHTML = '✅ Suara Aktif'; b.style.background = '#666'; setTimeout(() => b.remove(), 1500); } }, 3000);
}
function showNotifPopup(nama, noWa, roomId) {
  const old = document.getElementById('notif-popup'); if (old) old.remove();
  const popup = document.createElement('div'); popup.id = 'notif-popup';
  popup.innerHTML = `<div style="display:flex;align-items:flex-start;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">💬</div><div style="flex:1;"><div style="font-weight:600;font-size:13px;margin-bottom:2px;">Chat Baru Masuk!</div><div style="font-size:12px;color:#555;">${escH(nama)}</div><div style="font-size:11px;color:#888;">${noWa}</div></div><button onclick="dismissNotif()" style="background:none;border:none;font-size:16px;color:#999;cursor:pointer;line-height:1;">✕</button></div><button onclick="goToChat('${roomId}')" style="margin-top:8px;width:100%;padding:6px;background:#0F6E56;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:var(--font);">Buka Chat →</button>`;
  popup.style.cssText = 'position:fixed;bottom:24px;right:24px;background:white;border-radius:12px;padding:14px;width:280px;box-shadow:0 8px 30px rgba(0,0,0,0.15);z-index:9999;border:1px solid rgba(0,0,0,0.08);';
  document.body.appendChild(popup); setTimeout(() => dismissNotif(), 8000);
}
function dismissNotif() { const p = document.getElementById('notif-popup'); if (p) p.remove(); }
async function goToChat(roomId) {
  dismissNotif(); if (currentStaff.role === 'OWNER') switchMainTab('chat');
  currentTab = 'aktif'; setActiveTab('aktif'); await loadChats(false);
  setTimeout(() => { const chat = allChats.find(c => c.roomId === roomId); if (chat) openChat(roomId); }, 400);
}
function updateGlobalBadge(totalUnread) {
  const badge = document.getElementById('mtab-chat-badge'); const tabBadge = document.getElementById('badge-aktif');
  if (totalUnread > 0) { if (badge) { badge.textContent = totalUnread; badge.classList.remove('hidden'); } if (tabBadge) { tabBadge.textContent = totalUnread; tabBadge.classList.remove('hidden'); } document.title = '(' + totalUnread + ') GOHO WA Center'; }
  else { if (badge) badge.classList.add('hidden'); if (tabBadge) tabBadge.classList.add('hidden'); document.title = 'GOHO WA Center'; }
  updateAppBadge(totalUnread);
}
function checkNewChats(waitingChats) {
  const newWaitingIds = new Set(waitingChats.map(c => c.roomId));
  const brandNew = waitingChats.filter(c => !lastWaitingRooms.has(c.roomId));
  if (brandNew.length > 0 && lastWaitingRooms.size > 0) { playNotifSound(); const first = brandNew[0]; showNotifPopup(first.nama, first.noWa, first.roomId); }
  lastWaitingRooms = newWaitingIds;
}

// ===================== POLLING (PATCH v1 - hemat resource) =====================
// Perubahan dari versi sebelumnya:
// 1. Interval lebih longgar: 2s→5s (msg), 3s→10s (chatlist), 6s→15s (waiting)
// 2. loadStats() tidak lagi jalan SETIAP siklus 10 detik —
//    sekarang ikut siklus 10 detik tapi hanya kalau tab visible
// 3. Page Visibility API: polling dihentikan kalau tab gak fokus,
//    tapi polling notif (waiting queue) tetap jalan pelan (30s) supaya
//    suara notif masih bunyi walau staff pindah tab
// 4. Begitu tab aktif lagi, langsung 1x fetch supaya data instant segar

let _pollMsg     = null;  // interval: fetch pesan aktif
let _pollChat    = null;  // interval: reload chat list + stats
let _pollWaiting = null;  // interval: waiting queue (notif)
let _pollWaitingBg = null; // interval: waiting queue saat tab background (lebih pelan)

function startPolling() {
  // Ambil snapshot waiting rooms saat pertama login
  apiGet({action: 'getWaitingQueue'}).then(res => {
    if (res.ok) lastWaitingRooms = new Set(res.data.map(c => c.roomId));
  });

  _startForegroundPolls();

  // Page Visibility: hentikan/nyalakan poll saat tab focus berubah
  document.addEventListener('visibilitychange', _onVisibilityChange);
}

function _startForegroundPolls() {
  _stopForegroundPolls();

  // Poll pesan setiap 5 detik (hanya kalau ada chat terbuka)
  _pollMsg = setInterval(() => {
    if (currentRoom) fetchMessages(currentRoom.roomId, 0, false);
  }, 5000);

  // Poll chat list + stats setiap 10 detik
  _pollChat = setInterval(() => {
    loadStats();
    if (currentMainTab === 'chat')      loadChats(false);
    if (currentMainTab === 'dashboard') loadOwnerStats();
  }, 10000);

  // Poll waiting queue setiap 15 detik (notif suara)
  _pollWaiting = setInterval(async () => {
    try {
      const res = await apiGet({action: 'getWaitingQueue'});
      if (res.ok) checkNewChats(res.data);
    } catch(e) {}
  }, 15000);

  // Hentikan background poll kalau ada (tab baru aktif)
  _stopBackgroundPolls();
}

function _stopForegroundPolls() {
  if (_pollMsg)     { clearInterval(_pollMsg);     _pollMsg     = null; }
  if (_pollChat)    { clearInterval(_pollChat);    _pollChat    = null; }
  if (_pollWaiting) { clearInterval(_pollWaiting); _pollWaiting = null; }
}

function _startBackgroundPolls() {
  _stopBackgroundPolls();

  // Tab background: hanya polling waiting queue setiap 30 detik
  // supaya notif suara tetap bisa bunyi walau staff di tab lain
  _pollWaitingBg = setInterval(async () => {
    try {
      const res = await apiGet({action: 'getWaitingQueue'});
      if (res.ok) checkNewChats(res.data);
    } catch(e) {}
  }, 30000);
}

function _stopBackgroundPolls() {
  if (_pollWaitingBg) { clearInterval(_pollWaitingBg); _pollWaitingBg = null; }
}

function _onVisibilityChange() {
  if (document.hidden) {
    // Tab tidak terlihat → hentikan poll berat, ganti ke poll ringan
    _stopForegroundPolls();
    _startBackgroundPolls();
  } else {
    // Tab aktif lagi → langsung refresh sekali, lalu nyalakan poll normal
    _stopBackgroundPolls();
    _startForegroundPolls();

    // Langsung refresh sekali supaya data tidak stale saat staff balik
    loadStats();
    if (currentMainTab === 'chat')      loadChats(false);
    if (currentMainTab === 'dashboard') loadOwnerStats();
    if (currentRoom) fetchMessages(currentRoom.roomId, 0, false);

    // Juga cek waiting queue sekali biar badge langsung update
    apiGet({action: 'getWaitingQueue'}).then(res => {
      if (res.ok) checkNewChats(res.data);
    }).catch(() => {});
  }
}


// ===================== CHAT LIST =====================
async function loadChats(showLoading = true) {
  if (showLoading) document.getElementById('chat-list').innerHTML = '<div class="loading">Memuat...</div>';
  try {
    let res;
    if (currentTab === 'aktif') {
      // Semua staff dan owner lihat semua chat aktif
      res = await apiGet({action: 'getAllChats'});
    } else { res = await apiGet({action: 'getClosedChats'}); }
    if (res.ok) {
      allChats = res.data || [];
      if (allContactsCache.length === 0 && currentTab === 'aktif') { try { const cRes = await apiGet({action: 'getAllCustomers', query: ''}); allContactsCache = cRes.customers || []; } catch(e) {} }
      allChats = allChats.map(c => { const contact = allContactsCache.find(ct => (ct.noWa || ct.no_wa) === c.noWa); if (contact && contact.nama) c.nama = contact.nama; return c; });
      allChats.sort((a, b) => { const ta = a.lastMsgAt ? new Date(a.lastMsgAt).getTime() : 0; const tb = b.lastMsgAt ? new Date(b.lastMsgAt).getTime() : 0; return tb - ta; });
      allChats.forEach(c => { if (c.unreadCount !== undefined) unreadCounts[c.roomId] = c.unreadCount; });
      renderChatList(allChats);
      const totalUnread = Object.values(unreadCounts).reduce((s, v) => s + v, 0);
      updateGlobalBadge(totalUnread);
    }
    loadStats();
  } catch(e) { document.getElementById('chat-list').innerHTML = '<div class="empty-state">Gagal memuat data</div>'; }
}
function switchTab(tab) { currentTab = tab; setActiveTab(tab); loadChats(); }
function setActiveTab(tab) { ['aktif','arsip'].forEach(t => document.getElementById('tab-' + t)?.classList.toggle('active', t === tab)); }
function filterChats() { const q = document.getElementById('search-input').value.toLowerCase(); renderChatList(allChats.filter(c => String(c.nama).toLowerCase().includes(q) || String(c.noWa).toLowerCase().includes(q))); }
function getChatStatusClass(c) { if (c.status === 'WAITING' && c.handledBy === 'BOT') return 'status-bot'; if (c.status === 'WAITING') return 'status-needhuman'; if (c.status === 'NEED_HUMAN') return 'status-needhuman'; return 'status-assigned'; }
function getProdukClass(p) { p = (p||'').toLowerCase(); if (p.includes('tiket')) return 'p-tiket'; if (p.includes('hotel')) return 'p-hotel'; if (p.includes('tour')) return 'p-tour'; if (p.includes('atraksi')) return 'p-atraksi'; return 'p-tiket'; }
function getStatusClass(s) { if (s === 'WAITING') return 'p-wait'; if (s === 'ASSIGNED') return 'p-assign'; if (s === 'FOLLOW_UP') return 'p-follow'; if (s === 'BOOKED') return 'p-booked'; if (s === 'NEED_HUMAN') return 'p-alert'; return 'p-assign'; }
function getAvatarClass(n) { const cls = ['av-a','av-b','av-c','av-d']; let h = 0; for (let c of String(n)) h += c.charCodeAt(0); return cls[h % cls.length]; }
function getInitials(n) { return String(n).split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase(); }
function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgStart  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays  = Math.round((todayStart - msgStart) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12: false});
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()];
}
function renderChatList(chats) {
  const el = document.getElementById('chat-list');
  if (!chats || !chats.length) { el.innerHTML = currentTab === 'arsip' ? '<div class="empty-state">Tidak ada chat di arsip</div>' : '<div class="empty-state">Tidak ada chat aktif</div>'; return; }
  el.innerHTML = chats.map(c => renderChatItem(c)).join('');
}
function renderChatItem(c) {
  const isSelected = currentRoom && currentRoom.roomId === c.roomId;
  const statusClass = getChatStatusClass(c); const unread = unreadCounts[c.roomId] || 0;
  const isBot = c.handledBy === 'BOT' || (c.status === 'WAITING' && !c.assignedTo);
  let statusLabel = c.status;
  if (c.status === 'WAITING' && isBot) statusLabel = 'BOT';
  else if (c.status === 'WAITING') statusLabel = 'MENUNGGU';
  else if (c.status === 'ASSIGNED') statusLabel = 'DITANGANI';
  else if (c.status === 'NEED_HUMAN') statusLabel = 'PERLU STAFF';
  else if (c.status === 'CLOSED') statusLabel = 'ARSIP';
  return `<div class="ci ${statusClass} ${isSelected ? 'selected' : ''}" onclick="openChat('${c.roomId}')">
    <div class="av ${getAvatarClass(c.nama)}">${getInitials(c.nama)}</div>
    <div class="ci-right">
      <div class="ci-row1"><span class="ci-name">${escH(c.nama)}</span><span class="ci-time">${formatTime(c.lastMsgAt)}</span></div>
      <div class="ci-row2"><span class="ci-prev">${escH(c.lastMsg || '...')}</span>${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}</div>
      <div class="ci-row3">
  <span class="pill ${getStatusClass(c.status)}">${statusLabel}</span>
  ${c.produk ? `<span class="pill ${getProdukClass(c.produk)}">${c.produk}</span>` : ''}
  ${c.assignedTo ? `<span class="ci-handler">👤 ${escH(c.assignedTo)}</span>` : ''}
  ${c.menitTunggu > 10 ? `<span class="pill p-alert">${c.menitTunggu} mnt</span>` : ''}
  ${c.deviceLabel === 'WA2' ? `<span class="pill" style="background:#1d4ed8;color:white;font-size:9px;">📱 WA2</span>` : `<span class="pill" style="background:#0F6E56;color:white;font-size:9px;">📱 WA1</span>`}
</div>
    </div>
  </div>`;
}

// ===================== OPEN CHAT =====================
async function openChat(roomId) {
  const chat = allChats.find(c => c.roomId === roomId); if (!chat) return;
  if (chat.status === 'WAITING' || chat.status === 'NEED_HUMAN') {
    const res = await apiPost({action: 'assignChat', roomId: chat.roomId, staffName: currentStaff.nama});
    if (res.ok) { chat.status = 'ASSIGNED'; chat.assignedTo = currentStaff.nama; }
  }
  currentRoom = chat; lastMsgCount = 0; unreadCounts[roomId] = 0;
  currentFlightDate = null; // reset setiap ganti chat — diisi ulang oleh loadSmartContext()
  updateGlobalBadge(Object.values(unreadCounts).reduce((s, v) => s + v, 0));
  if (docPanelOpen) { docPanelOpen = false; document.getElementById('doc-panel').classList.remove('active'); document.getElementById('doc-panel-btn').classList.remove('active-panel'); document.getElementById('info-panel-content').style.display = 'flex'; }
  document.getElementById('chat-empty').classList.add('hidden'); document.getElementById('chat-active').classList.remove('hidden');
  document.getElementById('notes-panel').style.display = 'flex';
  document.getElementById('ct-av').textContent = getInitials(chat.nama); document.getElementById('ct-name').textContent = chat.nama;
  document.getElementById('ct-wa').textContent = chat.noWa; document.getElementById('ct-status').textContent = chat.status;
  document.getElementById('ct-by').textContent = chat.assignedTo ? '· ' + chat.assignedTo : '';
  document.getElementById('np-produk').textContent = chat.produk || '-';
  document.getElementById('np-status') && (document.getElementById('np-status').innerHTML = `<span class="pill ${getStatusClass(chat.status)}">${chat.status}</span>`);
  document.getElementById('chat-area').innerHTML = '<div class="loading">Memuat pesan...</div>';
  renderActionRow(chat);
// Pesan dan info customer langsung — SmartContext delay 2 detik
// supaya chat terbuka cepat dulu, baru context di-load background
Promise.all([
  loadMessages(roomId, true),
  loadCustomerInfoPanel(chat.noWa)
]);
setTimeout(() => {
  if (currentRoom && currentRoom.roomId === roomId) {
    loadSmartContext(roomId, chat.noWa);
  }
}, 2000);
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.add('slide-out');
  renderChatList(allChats);
  initClipboardPaste();
}
async function loadCustomerInfoPanel(noWa) {
  try {
    const res = await apiGet({action: 'getCustomer', noWa});
    const panel = document.getElementById('np-customer-info'); const histBlock = document.getElementById('np-history-block');
    if (res.customer) {
      const c = res.customer;
      if (c.nama) { panel.style.display = 'block'; document.getElementById('np-customer-name').textContent = c.nama; document.getElementById('np-customer-booking').textContent = c.totalBooking ? c.totalBooking + 'x booking' : 'Belum ada booking'; }
      else { panel.style.display = 'none'; }
      histBlock.style.display = 'block'; document.getElementById('np-history-loading').textContent = 'memuat...'; document.getElementById('np-history-list').innerHTML = ''; loadPanelBookingHistory(noWa);
    } else { panel.style.display = 'none'; histBlock.style.display = 'none'; }
  } catch(e) {}
  loadPanelNotes(noWa);
}
async function loadPanelNotes(noWa) {
  const el = document.getElementById('np-notes');
  if (!el) return;
  try {
    const res = await apiGet({ action: 'getSmartNotes', noWa });
    const notes = res.notes || [];
    if (!notes.length) { el.innerHTML = ''; return; }
    const tagEmoji = { TODO: '📌', INFO: 'ℹ️', PENTING: '⚠️', DONE: '✅' };
    el.innerHTML = notes.map((n, i) => {
      const preview = (n.text||n.note||'').substring(0,40) + ((n.text||n.note||'').length > 40 ? '...' : '');
      const dl = n.deadline ? ' · <span style="color:#c05c00;font-size:9px;">📅 ' + formatDeadline(n.deadline) + '</span>' : '';
      return `<div onclick="showNoteModal('${escH(noWa)}')" style="display:flex;gap:6px;align-items:flex-start;padding:5px 0;border-bottom:1px solid var(--border);cursor:pointer;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
        <span style="font-size:10px;color:var(--text-muted);min-width:16px;flex-shrink:0;">${i+1}.</span>
        <div style="flex:1;min-width:0;">
          <span style="font-size:10px;">${tagEmoji[n.tag]||'📝'}</span>
          <span style="font-size:11px;color:var(--text);">${escH(preview)}</span>
          ${dl}
        </div>
      </div>`;
    }).join('');
  } catch(e) {}
}
async function loadPanelBookingHistory(noWa) {
  try {
    const res = await apiGet({action: 'getBookingHistory', noWa});
    const loading = document.getElementById('np-history-loading'); const list = document.getElementById('np-history-list'); if (!loading || !list) return;
    if (res.history && res.history.length > 0) {
      loading.textContent = res.total + ' booking';
      const icon = {PESAWAT:'✈️', HOTEL:'🏨', TOUR:'🌴', ATRAKSI:'🎡'};
      const parseDate = s => { if (!s) return 0; const [d,m,y] = s.split('/'); return new Date(+y,+m-1,+d).getTime(); };
      const sorted = [...res.history].sort((a,b) => parseDate(b.tglEvent) - parseDate(a.tglEvent));
      list.innerHTML = sorted.map(h => `<div style="padding:5px 0;border-bottom:1px solid var(--border);font-size:11px;"><div style="font-weight:600;color:var(--text);">${icon[h.tipe]||'📋'} ${escH(h.detail)}</div><div style="color:var(--text-muted);">📅 ${h.tglEvent} · ${escH(h.extra)}</div></div>`).join('');
    } else { loading.textContent = ''; list.innerHTML = '<div style="font-size:11px;color:var(--text-hint);">Belum ada booking</div>'; }
  } catch(e) { const l = document.getElementById('np-history-loading'); if (l) l.textContent = ''; }
}
function openContactFromChat() {
  if (!currentRoom) return; if (currentStaff.role === 'OWNER') switchMainTab('contacts');
  currentContactNoWa = currentRoom.noWa; currentContactNama = currentRoom.nama; openContactDetail(currentRoom.noWa, currentRoom.nama);
}
function renderActionRow(chat) {
  const row = document.getElementById('action-row'); const reply = document.getElementById('reply-row'); const uploadBar = document.getElementById('upload-bar');
  const isMyChat = chat.assignedTo === currentStaff.nama; const isOwner = currentStaff.role === 'OWNER';
  const isUnassigned = !chat.assignedTo || chat.status === 'WAITING';

  if (isMyChat || isOwner) {
    // Chat milik sendiri atau owner — full action
    row.innerHTML = `<button class="abtn abtn-note" onclick="showNoteInput()"><i class="ti ti-notes"></i> Catatan</button><button class="abtn abtn-multipax" onclick="toggleMultiPax()"><i class="ti ti-users"></i> Multi Pax</button><button class="abtn abtn-booked" onclick="tandaiBooked()"><i class="ti ti-check"></i> Booked</button><button class="abtn abtn-lepas" onclick="lepasChat()"><i class="ti ti-logout"></i> Lepas</button><button class="abtn abtn-selesai" onclick="selesaiChat()"><i class="ti ti-circle-check"></i> Selesai</button>`;
    reply.style.display = 'flex';
  } else if (isUnassigned) {
    // Belum ada yang handle — tampilkan tombol Ambil Chat
    row.innerHTML = `<button class="abtn abtn-booked" onclick="ambilChat()" style="background:#0F6E56;"><i class="ti ti-hand-finger"></i> Ambil Chat</button>`;
    reply.style.display = 'none'; uploadBar.classList.remove('show');
  } else {
    // Di-handle staff lain — tampilkan info + tombol Ambil Chat
    row.innerHTML = `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;"><span style="font-size:11px;color:var(--text-muted);">Di-handle oleh <strong>${escH(chat.assignedTo)}</strong></span><button class="abtn abtn-lepas" onclick="ambilChat()" style="padding:4px 10px;font-size:11px;"><i class="ti ti-hand-finger"></i> Ambil</button></div>`;
    reply.style.display = 'none'; uploadBar.classList.remove('show');
  }
}

async function ambilChat() {
  if (!currentRoom) return;
  const res = await apiPost({action: 'assignChat', roomId: currentRoom.roomId, staffName: currentStaff.nama});
  if (res.ok) {
    currentRoom.assignedTo = currentStaff.nama;
    currentRoom.status = 'ASSIGNED';
    renderActionRow(currentRoom);
    loadChats(false);
    showToast('✅ Chat diambil oleh ' + currentStaff.nama);
  } else {
    showToast('Gagal ambil chat: ' + (res.msg || ''));
  }
}

// ===================== MESSAGES =====================
let msgOffset = 0;

// Cache gambar supaya tidak fetch ulang tiap polling → gambar steady tidak kedip
const imgCache = {};

// IntersectionObserver untuk lazy load gambar di bubble
const imgObserver = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const fileId = el.dataset.fileId;
      const mimeType = el.dataset.mime || 'image/jpeg';
      if (!fileId) return;

      // Sudah di-cache? Langsung tampil, tidak perlu fetch
      if (imgCache[fileId]) {
        el.dataset.loaded = '1';
        const _fid = fileId; const _fna = el.dataset.nama || 'gambar';
        el.innerHTML = '<img src="' + imgCache[fileId] + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="openImgPreview(\'' + imgCache[_fid] + '\',\'' + _fid + '\',\'' + _fna + '\',\'\')">';
        imgObserver.unobserve(el);
        return;
      }

      if (el.dataset.loaded) return;
      el.dataset.loaded = '1';
      imgObserver.unobserve(el);

      // Tampil spinner saat loading
      el.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">⏳</div>';

      fetch('https://goho-proxy.gohotravel.workers.dev?action=getImageBase64&fileId=' + encodeURIComponent(fileId))
        .then(r => r.json())
        .then(data => {
          if (data.base64) {
            const src = 'data:' + (data.mimeType || mimeType) + ';base64,' + data.base64;
            // Batas cache 50 gambar
if (Object.keys(imgCache).length >= 50) {
  delete imgCache[Object.keys(imgCache)[0]];
}
imgCache[fileId] = src; // simpan ke cache
            const _fid = fileId; const _fna = el.dataset.nama || 'gambar';
            el.innerHTML = '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="openImgPreview(\'' + src + '\',\'' + _fid + '\',\'' + _fna + '\',\'\')">';
          } else {
            el.innerHTML = '<div style="padding:8px;font-size:11px;color:#aaa;">🖼️ Gambar tidak tersedia</div>';
          }
        }).catch(() => {
          el.innerHTML = '<div style="padding:8px;font-size:11px;color:#aaa;">🖼️ Gagal load</div>';
        });
    }
  });
}, { threshold: 0.1 }) : null;

// Set berisi msgId yang sudah di-render — untuk diff agar tidak replace DOM
const renderedMsgIds = new Set();

async function loadMessages(roomId, forceScroll) {
  msgOffset = 0;
  renderedMsgIds.clear(); // reset saat buka chat baru
  await fetchMessages(roomId, 0, forceScroll);
}
async function loadMoreMessages(roomId) {
  const area = document.getElementById('chat-area');
  const prevHeight = area.scrollHeight;
  msgOffset += 50;
  await fetchMessages(roomId, msgOffset, false, true);
  area.scrollTop = area.scrollHeight - prevHeight;
}
async function fetchMessages(roomId, offset, forceScroll, prepend = false) {
  try {
    const res = await apiGet({action: 'getChatMessages', roomId, offset});
    if (!res.ok) return;
    if (!currentRoom || currentRoom.roomId !== roomId) return;

    const area = document.getElementById('chat-area');
    const isNearBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 100;
    const hasNewMessages = res.total > lastMsgCount;
    const hasMore = res.total > offset + 50;

    if (prepend) {
      // Muat pesan lebih lama — tambah di atas
      const btn = document.getElementById('load-more-btn'); if (btn) btn.remove();
      const html = res.data.map(m => renderBubble(m)).join('');
      area.insertAdjacentHTML('afterbegin', html);
      res.data.forEach(m => renderedMsgIds.add(m.msgId));
    } else if (forceScroll || renderedMsgIds.size === 0) {
      // Pertama kali buka chat — render semua sekaligus
      area.innerHTML = res.data.map(m => renderBubble(m)).join('');
      renderedMsgIds.clear();
      res.data.forEach(m => renderedMsgIds.add(m.msgId));
    } else {
      // Polling — hanya tambah pesan yang belum ada, DOM lama tidak disentuh
      const newMsgs = res.data.filter(m => !renderedMsgIds.has(m.msgId));
      if (newMsgs.length > 0) {
        const html = newMsgs.map(m => renderBubble(m)).join('');
        area.insertAdjacentHTML('beforeend', html);
        newMsgs.forEach(m => renderedMsgIds.add(m.msgId));
      }
    }

    if (hasMore && !document.getElementById('load-more-btn')) {
      area.insertAdjacentHTML('afterbegin', `<div id="load-more-btn" style="text-align:center;padding:8px;"><button onclick="loadMoreMessages('${roomId}')" style="padding:6px 16px;border:1px solid var(--border);border-radius:20px;background:white;font-size:11px;color:var(--text-muted);cursor:pointer;font-family:var(--font);">↑ Muat pesan lebih lama</button></div>`);
    }

    if (forceScroll || isNearBottom || hasNewMessages) area.scrollTop = area.scrollHeight;
    lastMsgCount = res.total;

    // Inject gambar dari cache, observe sisanya
    area.querySelectorAll('.b-img-lazy[data-file-id]').forEach(el => {
      if (el.dataset.loaded) return;
      const fid = el.dataset.fileId;
      if (fid && imgCache[fid]) {
        el.dataset.loaded = '1';
        const _fna = el.dataset.nama || 'gambar';
        el.innerHTML = '<img src="' + imgCache[fid] + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="openImgPreview(\'' + imgCache[fid] + '\',\'' + fid + '\',\'' + _fna + '\',\'\')">';
      } else if (imgObserver) {
        imgObserver.observe(el);
      }
    });

  } catch(e) { console.error('fetchMessages error:', e); }
}

// ===================== MEDIA PREVIEW & FORWARD =====================
let _previewFileId = '', _previewFileName = '', _previewMediaUrl = '';

function openImgPreview(src, fileId, namaFile, mediaUrl) {
  _previewFileId  = fileId  || '';
  _previewFileName = namaFile || '';
  _previewMediaUrl = mediaUrl || '';
  document.getElementById('img-preview-src').src  = src;
  document.getElementById('img-preview-name').textContent = namaFile || '';
  const modal = document.getElementById('modal-img-preview');
  imgEditorReset();
  modal.style.display = 'flex';
}
function closeImgPreview() {
  document.getElementById('modal-img-preview').style.display = 'none';
  document.getElementById('img-preview-src').src = '';
}
// =====================================================
// GOHO IMAGE EDITOR — tambahkan di app.js
// Tempelkan SETELAH fungsi closeImgPreview() yang sudah ada
// =====================================================

// ---- State image editor ----
let _imgRotation = 0;   // derajat (bisa desimal, bebas)
let _imgZoom = 1.0;     // scale factor
let _cropMode = false;
let _cropDragging = false;
let _cropStart = { x: 0, y: 0 };
let _cropRect = null;   // {x,y,w,h} dalam piksel di layar (relatif ke crop-overlay)
window._croppedBase64 = null;   // hasil crop — dibaca submitSaveMedia()
window._croppedMimeType = null;

// ---- Reset saat buka lightbox baru ----
// Panggil ini di openImgPreview() — GANTI baris:
//   document.getElementById('modal-img-preview').style.display = 'flex';
// Jadi:
//   imgEditorReset(); document.getElementById('modal-img-preview').style.display = 'flex';
function imgEditorReset() {
  _imgRotation = 0;
  _imgZoom = 1.0;
  _cropMode = false;
  _cropRect = null;
  _cropDragging = false;
  window._croppedBase64 = null;
  window._croppedMimeType = null;

  const slider = document.getElementById('rotate-slider');
  if (slider) { slider.value = 0; }
  const sliderLabel = document.getElementById('rotate-slider-label');
  if (sliderLabel) sliderLabel.textContent = '0°';
  const zoomLabel = document.getElementById('zoom-label');
  if (zoomLabel) zoomLabel.textContent = '100%';

  _applyImgTransform();
  _exitCropMode();
}

// ---- Apply transform ke <img> ----
function _applyImgTransform() {
  const img = document.getElementById('img-preview-src');
  if (!img) return;
  img.style.transform = `rotate(${_imgRotation}deg) scale(${_imgZoom})`;
  const zoomLabel = document.getElementById('zoom-label');
  if (zoomLabel) zoomLabel.textContent = Math.round(_imgZoom * 100) + '%';
}

// ---- Rotate ----
function imgRotate(deg) {
  _imgRotation = (_imgRotation + deg) % 360;
  // Sync slider (clamp ke -180..180 supaya tidak out of range)
  let sliderVal = _imgRotation % 360;
  if (sliderVal > 180) sliderVal -= 360;
  if (sliderVal < -180) sliderVal += 360;
  const slider = document.getElementById('rotate-slider');
  if (slider) slider.value = sliderVal;
  const sliderLabel = document.getElementById('rotate-slider-label');
  if (sliderLabel) sliderLabel.textContent = Math.round(_imgRotation) + '°';
  _applyImgTransform();
  _clearCropBox(); // crop lama tidak valid lagi setelah rotate
}

function imgRotateSlider(val) {
  _imgRotation = parseFloat(val);
  const sliderLabel = document.getElementById('rotate-slider-label');
  if (sliderLabel) sliderLabel.textContent = Math.round(_imgRotation) + '°';
  _applyImgTransform();
  _clearCropBox();
}

// ---- Zoom ----
function imgZoom(delta) {
  _imgZoom = Math.min(5, Math.max(0.2, _imgZoom + delta));
  _applyImgTransform();
  _clearCropBox();
}

// Zoom dengan scroll mouse di area gambar
document.addEventListener('wheel', function(e) {
  const modal = document.getElementById('modal-img-preview');
  if (!modal || modal.style.display === 'none') return;
  if (_cropMode) return; // jangan zoom saat crop mode
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.12 : 0.12;
  imgZoom(delta);
}, { passive: false, capture: false });

function imgResetTransform() {
  _imgRotation = 0; _imgZoom = 1.0;
  const slider = document.getElementById('rotate-slider');
  if (slider) slider.value = 0;
  const sliderLabel = document.getElementById('rotate-slider-label');
  if (sliderLabel) sliderLabel.textContent = '0°';
  _applyImgTransform();
  _clearCropBox();
}

// ---- Crop Mode ----
function toggleCropMode() {
  _cropMode = !_cropMode;
  const btn = document.getElementById('btn-crop-toggle');
  const overlay = document.getElementById('crop-overlay');
  if (_cropMode) {
    btn.classList.add('crop-active');
    btn.textContent = '✂️ Crop ON';
    overlay.style.display = 'block';
    _clearCropBox();
  } else {
    _exitCropMode();
  }
}

function _exitCropMode() {
  _cropMode = false;
  const btn = document.getElementById('btn-crop-toggle');
  const overlay = document.getElementById('crop-overlay');
  if (btn) { btn.classList.remove('crop-active'); btn.textContent = '✂️ Crop'; }
  if (overlay) overlay.style.display = 'none';
  _clearCropBox();
}

function _clearCropBox() {
  _cropRect = null;
  const box = document.getElementById('crop-box');
  if (box) box.style.display = 'none';
}

// ---- Crop drag (mouse) ----
function cropStart(e) {
  if (!_cropMode) return;
  e.preventDefault();
  _cropDragging = true;
  const rect = e.currentTarget.getBoundingClientRect();
  _cropStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  _clearCropBox();
}
function cropMove(e) {
  if (!_cropDragging) return;
  e.preventDefault();
  const rect = e.currentTarget.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  _drawCropBox(_cropStart.x, _cropStart.y, cx, cy, rect.width, rect.height);
}
function cropEnd(e) {
  if (!_cropDragging) return;
  _cropDragging = false;
  const box = document.getElementById('crop-box');
  if (box && box.style.display !== 'none') {
    const bRect = box.getBoundingClientRect();
    const oRect = document.getElementById('crop-overlay').getBoundingClientRect();
    _cropRect = {
      x: parseFloat(box.style.left),
      y: parseFloat(box.style.top),
      w: parseFloat(box.style.width),
      h: parseFloat(box.style.height),
      overlayW: oRect.width,
      overlayH: oRect.height
    };
  }
}

// ---- Crop drag (touch) ----
function cropTouchStart(e) {
  if (!_cropMode) return;
  e.preventDefault();
  const t = e.touches[0];
  const rect = e.currentTarget.getBoundingClientRect();
  _cropDragging = true;
  _cropStart = { x: t.clientX - rect.left, y: t.clientY - rect.top };
  _clearCropBox();
}
function cropTouchMove(e) {
  if (!_cropDragging) return;
  e.preventDefault();
  const t = e.touches[0];
  const rect = e.currentTarget.getBoundingClientRect();
  const cx = t.clientX - rect.left;
  const cy = t.clientY - rect.top;
  _drawCropBox(_cropStart.x, _cropStart.y, cx, cy, rect.width, rect.height);
}
function cropTouchEnd(e) { cropEnd(e); }

function _drawCropBox(x1, y1, x2, y2, maxW, maxH) {
  const box = document.getElementById('crop-box');
  if (!box) return;
  const left = Math.max(0, Math.min(x1, x2));
  const top  = Math.max(0, Math.min(y1, y2));
  const w    = Math.min(Math.abs(x2 - x1), maxW - left);
  const h    = Math.min(Math.abs(y2 - y1), maxH - top);
  if (w < 8 || h < 8) return;
  box.style.display = 'block';
  box.style.left   = left + 'px';
  box.style.top    = top  + 'px';
  box.style.width  = w    + 'px';
  box.style.height = h    + 'px';
}

// ---- Simpan: crop (kalau ada) atau full (dengan rotate/zoom) ----
async function saveCropOrFull() {
  const img = document.getElementById('img-preview-src');
  if (!img || !img.src) { showToast('Tidak ada gambar untuk disimpan'); return; }

  await new Promise(resolve => { if (img.complete) resolve(); else img.onload = resolve; });

  const canvas  = document.createElement('canvas');
  const ctx     = canvas.getContext('2d');
  const natW    = img.naturalWidth;
  const natH    = img.naturalHeight;
  const rad     = _imgRotation * Math.PI / 180;
  const absCos  = Math.abs(Math.cos(rad));
  const absSin  = Math.abs(Math.sin(rad));

  // Ukuran canvas setelah rotate (tanpa zoom — zoom hanya CSS display)
  const rotW = Math.round(natW * absCos + natH * absSin);
  const rotH = Math.round(natW * absSin + natH * absCos);

  if (_cropRect && _cropRect.w > 8 && _cropRect.h > 8) {
    // ---- MODE CROP ----
    // 1. Render gambar full ke canvas (dengan rotate, TANPA zoom — zoom hanya CSS)
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width  = rotW;
    fullCanvas.height = rotH;
    const fctx = fullCanvas.getContext('2d');
    fctx.translate(rotW / 2, rotH / 2);
    fctx.rotate(rad);
    fctx.drawImage(img, -natW / 2, -natH / 2); // tanpa scale zoom

    // 2. Ukuran gambar yang TAMPIL di layar (setelah CSS transform: rotate+scale)
    //    getBoundingClientRect() sudah memperhitungkan CSS transform
    const imgEl  = document.getElementById('img-preview-src');
    const overlay = document.getElementById('crop-overlay');
    const iRect  = imgEl.getBoundingClientRect();   // ukuran tampil di layar
    const oRect  = overlay.getBoundingClientRect();

    // Ukuran gambar yang ditampilkan di layar (sudah kena zoom CSS)
    const dispW = iRect.width;
    const dispH = iRect.height;

    // Skala dari layar ke canvas (rotated, tanpa zoom)
    const scaleX = rotW / dispW;
    const scaleY = rotH / dispH;

    // Offset gambar di dalam overlay
    const imgOffX = iRect.left - oRect.left;
    const imgOffY = iRect.top  - oRect.top;

    // Koordinat crop di canvas
    const cropX = Math.max(0, (_cropRect.x - imgOffX) * scaleX);
    const cropY = Math.max(0, (_cropRect.y - imgOffY) * scaleY);
    const cropW = Math.min(_cropRect.w * scaleX, rotW - cropX);
    const cropH = Math.min(_cropRect.h * scaleY, rotH - cropY);

    canvas.width  = Math.round(cropW);
    canvas.height = Math.round(cropH);
    ctx.drawImage(fullCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  } else {
    // ---- MODE FULL (rotate saja, tanpa crop, tanpa zoom) ----
    canvas.width  = rotW;
    canvas.height = rotH;
    ctx.translate(rotW / 2, rotH / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -natW / 2, -natH / 2);
  }

  const mimeType = 'image/jpeg';
  const b64 = canvas.toDataURL(mimeType, 0.97).split(',')[1];
  window._croppedBase64   = b64;
  window._croppedMimeType = mimeType;

  openSaveModal();
}

// =====================================================
// PATCH submitSaveMedia — tambahkan 5 baris ini
// TEPAT SETELAH baris: "let base64, fileType;"
// di dalam fungsi submitSaveMedia() yang sudah ada
// =====================================================
//
//   // Crop/edited result dari image editor?
//   if (window._croppedBase64) {
//     base64    = window._croppedBase64;
//     fileType  = window._croppedMimeType || 'image/jpeg';
//     window._croppedBase64   = null;
//     window._croppedMimeType = null;
//   } else if (_previewFileId) {
//     ... kode lama if (_previewFileId) ...
//
// Lihat instruksi di PATCH_submitSaveMedia.txt

// =====================================================
// OCR BADGE — render di doc panel setelah file disimpan
// =====================================================

// Dipanggil dari submitSaveMedia() setelah res.ok, sebelum reload doc panel
// Simpan docId terakhir yang disimpan supaya bisa langsung scan OCR
let _lastSavedDocId = null;

function markDocOcrPending(docId, namaFile) {
  _lastSavedDocId = docId;
  // Badge akan tampil di renderDocList() — data dari server sudah include ocrStatus
  // Untuk feedback instan sebelum reload, kita simpan state lokal
}

// Render badge OCR — dipanggil dari renderDocList() per item
// Tambahkan ini ke dalam loop renderDocList di app.js yang sudah ada,
// tepat setelah variable safeId, safeFile, safeName:
//
//   const ocrStatus = d.ocrStatus || 'none'; // 'none' | 'pending' | 'done'
//   const ocrBadge = ocrStatus === 'done'
//     ? '<span class="doc-ocr-badge ocr-done" title="OCR sudah selesai">✓ OCR</span>'
//     : ocrStatus === 'pending'
//       ? `<span class="doc-ocr-badge ocr-pending" onclick="runDocOcr('${safeId}','${safeFile}','${safeName}')" title="Klik untuk scan OCR paspor">📷 Scan OCR</span>`
//       : '';
//
// Dan ganti baris html += `<div class="doc-item">...` dengan:
//   html += `<div class="doc-item"><div class="doc-item-icon">...</div>
//            <div class="doc-item-info"><div class="doc-item-name" ...>
//              ${escH(truncateFileName(d.namaFile, 22))}
//            </div>${ocrBadge}</div>...`
//
// Lihat instruksi lengkap di PATCH_renderDocList.txt

// ---- Trigger OCR dari badge ----
async function runDocOcr(docId, fileId, namaFile) {
  if (!confirm('Scan OCR paspor "' + namaFile + '"?\nData akan otomatis masuk ke PASSENGER_LIST.\nPastikan foto sudah jelas sebelum scan.')) return;
  showToast('⏳ Sedang scan OCR...');
  // Retry helper untuk handle GAS cold start
  async function apiPostWithRetry(body, maxRetry = 2) {
    for (let i = 0; i <= maxRetry; i++) {
      try {
        const res = await apiPost(body);
        if (res && typeof res === 'object') return res;
      } catch(e) {
        if (i < maxRetry) { await new Promise(r => setTimeout(r, 2000)); continue; }
        throw e;
      }
    }
  }
  try {
    const { base64, fileType } = await getBase64FromFileId(fileId);
    const res = await apiPostWithRetry({
      action: 'ocrPaspor',
      docId,
      fileId,
      namaFile,
      base64Image: base64,
      mediaType: fileType,
      noWa: currentDocNoWa || (currentRoom ? currentRoom.noWa : ''),
      staffName: currentStaff ? currentStaff.nama : ''
    });
    if (res.ok) {
      showToast('✅ OCR selesai! Data masuk ke Penumpang.');
      // Set ocrStatus done di D1
      try { await apiPost({ action: 'setDocOcrStatus', fileId, status: 'done' }); } catch(_) {}
      // Reload doc panel supaya badge update
      if (docPanelOpen && currentRoom) loadDocPanel(currentRoom.noWa);
    } else {
      showToast('❌ OCR gagal: ' + (res.msg || 'Error'));
    }
  } catch(e) {
    showToast('Error OCR: ' + e.toString());
  }
}


// Ambil base64 dari fileId (cache atau fetch)
async function getBase64FromFileId(fileId) {
  if (imgCache[fileId]) {
    const src = imgCache[fileId];
    return { base64: src.split(',')[1], fileType: src.match(/data:([^;]+)/)?.[1] || 'image/jpeg' };
  }
  const res = await fetch('https://goho-proxy.gohotravel.workers.dev?action=getImageBase64&fileId=' + encodeURIComponent(fileId));
  const data = await res.json();
  return { base64: data.base64, fileType: data.mimeType || 'image/jpeg' };
}

let _saveSearchTimer = null;

// ============================================================
// v32: DRAGGABLE MODAL
// Membuat modal-box di dalam suatu modal overlay bisa digeser bebas
// dengan klik-tahan-drag di mana saja di area modal-box, KECUALI di
// atas elemen interaktif (input/select/textarea/button/label) supaya
// staff tetap bisa mengetik/klik normal di dalamnya.
// Hanya aktif untuk mouse (desktop) — di touch device (HP/tablet)
// drag dimatikan supaya tidak mengganggu scroll/tap normal.
// Posisi modal otomatis reset ke tengah setiap kali ditutup, karena
// kita hanya menambah transform sementara lewat inline style yang
// dibuang lagi saat modal disembunyikan (lihat resetDraggedModal()).
// ============================================================
const _draggableInitialized = {};

function isInteractiveElement(el) {
  if (!el) return false;
  const tag = (el.tagName || '').toUpperCase();
  return ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'LABEL', 'A'].includes(tag);
}

function resetDraggedModal(modalId) {
  const box = document.querySelector('#' + modalId + ' .modal-box');
  if (box) {
    box.style.transform = '';
    box.removeAttribute('data-drag-x');
    box.removeAttribute('data-drag-y');
  }
}

function makeModalDraggable(modalId) {
  // Hanya pasang listener sekali per modal, supaya tidak dobel kalau
  // openSaveModal() dipanggil berkali-kali dalam satu sesi.
  if (_draggableInitialized[modalId]) {
    resetDraggedModal(modalId); // tetap reset posisi setiap kali dibuka ulang
    return;
  }
  _draggableInitialized[modalId] = true;

  const overlay = document.getElementById(modalId);
  const box = overlay ? overlay.querySelector('.modal-box') : null;
  if (!overlay || !box) return;

  let isDraggingModal = false;
  let startX = 0, startY = 0;
  let baseX = 0, baseY = 0;

  box.style.cursor = 'grab';

  box.addEventListener('mousedown', (e) => {
    if (isInteractiveElement(e.target)) return; // jangan drag kalau klik input/button/dll
    isDraggingModal = true;
    startX = e.clientX;
    startY = e.clientY;
    baseX = parseFloat(box.dataset.dragX || '0');
    baseY = parseFloat(box.dataset.dragY || '0');
    box.style.cursor = 'grabbing';
    box.style.transition = 'none';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingModal) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newX = baseX + dx;
    const newY = baseY + dy;
    box.style.transform = 'translate(' + newX + 'px, ' + newY + 'px)';
    box.dataset.dragX = newX;
    box.dataset.dragY = newY;
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingModal) {
      isDraggingModal = false;
      box.style.cursor = 'grab';
    }
  });
}

function openSaveModal() {
  if (!_previewFileId && !_previewMediaUrl) { showToast('Tidak ada file untuk disimpan'); return; }
  // Deteksi ekstensi dari file asli
  const origName = _previewFileName || '';
  const dotIdx = origName.lastIndexOf('.');
  window._saveFileExt = dotIdx >= 0 ? origName.substring(dotIdx).toLowerCase() : '.jpg';
  // Kosongkan nama — staff cukup input nama orang saja
  document.getElementById('save-file-name').value = '';
  document.getElementById('save-file-name').placeholder = 'Contoh: Murni';
  document.getElementById('save-file-preview').textContent = '';
  document.getElementById('save-kategori').value = 'Paspor';
  document.getElementById('save-target').value = 'aktif';
  document.getElementById('save-custom-nowa-row').style.display = 'none';
  document.getElementById('save-contact-search').value = '';
  document.getElementById('save-contact-results').style.display = 'none';
  document.getElementById('modal-save-media').style.display = 'flex';
  if (window.matchMedia && !window.matchMedia('(pointer: coarse)').matches) {
    makeModalDraggable('modal-save-media');
  }
}

// Preview nama file otomatis saat staff ketik nama atau ganti kategori
function updateSaveFilePreview() {
  const nama = (document.getElementById('save-file-name').value || '').trim();
  const kat  = document.getElementById('save-kategori').value;
  const ext  = window._saveFileExt || '.jpg';
  const prefixMap = { 'Paspor':'Paspor', 'KTP':'KTP', 'Visa':'Visa', 'Tiket':'Tiket', 'Hotel':'Hotel', 'Lainnya':'' };
  const prefix  = prefixMap[kat] || '';
  const preview = document.getElementById('save-file-preview');
  if (!preview) return;
  if (!nama) { preview.textContent = ''; return; }
  const finalName = prefix ? prefix + '_' + nama + ext : nama + ext;
  preview.textContent = '→ ' + finalName;
}

function toggleSaveTarget(val) {
  document.getElementById('save-custom-nowa-row').style.display = val === 'lain' ? 'block' : 'none';
  document.getElementById('save-contact-search').value = '';
  document.getElementById('save-contact-results').style.display = 'none';
}

function searchSaveContact(query) {
  clearTimeout(_saveSearchTimer);
  const results = document.getElementById('save-contact-results');
  if (!query || query.trim().length < 2) { results.style.display = 'none'; return; }
  _saveSearchTimer = setTimeout(() => {
    const q = query.toLowerCase();
    const matches = allContactsCache.filter(c =>
      String(c.nama || '').toLowerCase().includes(q) ||
      String(c.noWa || '').toLowerCase().includes(q)
    ).slice(0, 6);
    if (!matches.length) { results.innerHTML = '<div style="padding:8px;font-size:11px;color:var(--text-muted);">Tidak ditemukan</div>'; results.style.display = 'block'; return; }
    results.innerHTML = matches.map(c => `<div onclick="selectSaveContact('${escH(c.noWa)}','${escH(c.nama||c.noWa)}')" style="padding:8px 10px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='white'"><div style="width:28px;height:28px;border-radius:50%;background:var(--green-mid);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0;">${getInitials(c.nama||c.noWa)}</div><div><div style="font-weight:600;">${escH(c.nama||c.noWa)}</div><div style="font-size:10px;color:var(--text-muted);">${c.noWa}</div></div></div>`).join('');
    results.style.display = 'block';
  }, 300);
}

function selectSaveContact(noWa, nama) {
  document.getElementById('save-contact-search').value = nama + ' (' + noWa + ')';
  document.getElementById('save-contact-search').dataset.selectedNowa = noWa;
  document.getElementById('save-contact-results').style.display = 'none';
}

async function submitSaveMedia() {
  const namaInput = document.getElementById('save-file-name').value.trim();
  if (!namaInput) { showToast('Nama wajib diisi'); return; }
  const ext = window._saveFileExt || '.jpg';
  const kategori = document.getElementById('save-kategori').value;
  const prefixMap = { 'Paspor':'Paspor', 'KTP':'KTP', 'Visa':'Visa', 'Tiket':'Tiket', 'Hotel':'Hotel', 'Lainnya':'' };
  const prefix = prefixMap[kategori] || '';
  const namaFile = prefix ? prefix + '_' + namaInput + ext : namaInput + ext;
  const target   = document.getElementById('save-target').value;
  let noWaTujuan = currentRoom ? currentRoom.noWa : '';
  if (target === 'lain') {
    const searchEl = document.getElementById('save-contact-search');
    noWaTujuan = searchEl.dataset.selectedNowa || searchEl.value.trim();
    if (!noWaTujuan) { showToast('Pilih customer tujuan dulu'); return; }
  }
  const btn = document.getElementById('save-media-btn');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader spin"></i> Menyimpan...';
  try {
    let base64, fileType;
    if (window._croppedBase64) {
      base64    = window._croppedBase64;
      fileType  = window._croppedMimeType || 'image/jpeg';
      window._croppedBase64   = null;
      window._croppedMimeType = null;
    } else if (_previewFileId) {
      ({ base64, fileType } = await getBase64FromFileId(_previewFileId));
    } else if (_previewMediaUrl) {
      // Coba ambil fileId dari Drive URL
      const fileIdMatch = _previewMediaUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        ({ base64, fileType } = await getBase64FromFileId(fileIdMatch[1]));
      } else {
        // Fonnte URL — fetch via worker proxy (CORS)
        const proxyUrl = 'https://goho-proxy.gohotravel.workers.dev?action=fetchMediaUrl&url=' + encodeURIComponent(_previewMediaUrl);
        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error('Gagal fetch file dari URL');
        const blob = await resp.blob();
        fileType = blob.type || 'image/jpeg';
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } else {
      throw new Error('Tidak ada file untuk disimpan');
    }
    const res = await apiPost({ action: 'saveCustomerDoc', noWa: noWaTujuan, kategori, namaFile, fileType, fileData: base64, uploadedBy: currentStaff.nama, keterangan: 'Disimpan dari bubble chat' });
    if (res.ok) {
      showToast('✅ Tersimpan ke Dokumen ' + (target === 'lain' ? noWaTujuan : 'Customer') + '!');
      closeModal('modal-save-media');
      if (docPanelOpen && target === 'aktif') loadDocPanel(currentRoom ? currentRoom.noWa : '');
    } else { showToast('Gagal simpan: ' + (res.msg || '')); }
  } catch(e) { showToast('Error: ' + e.toString()); }
  finally { btn.disabled = false; btn.innerHTML = '<i class="ti ti-device-floppy"></i> Simpan'; }
}
 
let _fwdSearchTimer = null;

function openForwardModal() {
  if (!_previewFileId) { showToast('Tidak ada file untuk di-forward'); return; }
  document.getElementById('forward-file-rename').value = _previewFileName || '';
  document.getElementById('forward-contact-search').value = '';
  document.getElementById('forward-contact-search').dataset.selectedNowa = '';
  document.getElementById('forward-contact-results').style.display = 'none';
  document.getElementById('modal-forward').style.display = 'flex';
  // v32: drag support, sama seperti modal-save-media — hanya desktop
  if (window.matchMedia && !window.matchMedia('(pointer: coarse)').matches) {
    makeModalDraggable('modal-forward');
  }
}

function searchForwardContact(query) {
  clearTimeout(_fwdSearchTimer);
  const results = document.getElementById('forward-contact-results');
  if (!query || query.trim().length < 2) { results.style.display = 'none'; return; }
  _fwdSearchTimer = setTimeout(() => {
    const q = query.toLowerCase();
    const matches = allContactsCache.filter(c =>
      String(c.nama || '').toLowerCase().includes(q) ||
      String(c.noWa || '').toLowerCase().includes(q)
    ).slice(0, 6);
    if (!matches.length) { results.innerHTML = '<div style="padding:8px;font-size:11px;color:var(--text-muted);">Tidak ditemukan</div>'; results.style.display = 'block'; return; }
    results.innerHTML = matches.map(c => `<div onclick="selectForwardContact('${escH(c.noWa)}','${escH(c.nama||c.noWa)}')" style="padding:8px 10px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='white'"><div style="width:28px;height:28px;border-radius:50%;background:var(--green-mid);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0;">${getInitials(c.nama||c.noWa)}</div><div><div style="font-weight:600;">${escH(c.nama||c.noWa)}</div><div style="font-size:10px;color:var(--text-muted);">${c.noWa}</div></div></div>`).join('');
    results.style.display = 'block';
  }, 300);
}

function selectForwardContact(noWa, nama) {
  document.getElementById('forward-contact-search').value = nama + ' (' + noWa + ')';
  document.getElementById('forward-contact-search').dataset.selectedNowa = noWa;
  document.getElementById('forward-contact-results').style.display = 'none';
}

async function submitForward() {
  const searchEl  = document.getElementById('forward-contact-search');
  const noWaTujuan = searchEl.dataset.selectedNowa || searchEl.value.trim();
  const namaFile   = document.getElementById('forward-file-rename').value.trim() || _previewFileName;
  if (!noWaTujuan) { showToast('Pilih atau ketik nomor WA tujuan'); return; }
  if (!namaFile)   { showToast('Nama file wajib diisi'); return; }
  const btn = document.getElementById('forward-send-btn');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader spin"></i> Mengirim...';
  try {
    const { base64, fileType } = await getBase64FromFileId(_previewFileId);
    const res = await apiPost({ action: 'forwardFile', noWa: noWaTujuan, fileData: base64, fileName: namaFile, fileType, staffName: currentStaff.nama });
    if (res.ok) { showToast('✅ File berhasil di-forward ke ' + noWaTujuan); closeModal('modal-forward'); }
    else { showToast('Gagal forward: ' + (res.msg || '')); }
  } catch(e) { showToast('Error: ' + e.toString()); }
  finally { btn.disabled = false; btn.innerHTML = '<i class="ti ti-send"></i> Kirim'; }
}

function renderBubble(m) {
  const isStaff = m.sender === 'STAFF'; const isBot = m.sender === 'BOT'; const cls = isStaff ? 'b-staff' : (isBot ? 'b-bot' : 'b-cust');

  // Deteksi pesan file biasa (PDF / non-gambar)
  const fileMatch = m.message && typeof m.message === 'string' && m.message.match(/^📎 (.+)\n(https?:\/\/.+)$/);
  if (fileMatch) {
    const fileName = fileMatch[1]; const fileUrl = fileMatch[2]; const ispdf = fileName.toLowerCase().endsWith('.pdf');
    const checkmark = isStaff ? '<span class="b-checkmark">✓</span>' : '';
    const delBtn = `<button onclick="deleteBubbleMsg('${escH(m.msgId)}')" style="background:none;border:none;cursor:pointer;font-size:10px;color:#ccc;padding:0 2px;line-height:1;" title="Hapus pesan">🗑️</button>`;
    return `<div class="bw ${isStaff?'right':''}" id="msg-${escH(m.msgId)}"><div class="bubble ${cls}">${isBot && !isStaff ? `<div class="b-bot-lbl">GOHO Bot</div>` : ''}<div class="b-file"><i class="ti ti-${ispdf?'file-type-pdf':'file'}"></i><div class="b-file-info"><div class="b-file-name">${escH(fileName)}</div><a class="b-file-link" href="${escH(fileUrl)}" target="_blank">📥 Download / Lihat</a></div></div><div class="b-meta">${formatTime(m.timestamp)}${checkmark}${delBtn}</div></div></div>`;
  }

  // Deteksi pesan dokumen dari customer (MEDIA_URL ada, message = [Dokumen/PDF] atau [Dokumen/...])
  const isDocMsg = m.message && typeof m.message === 'string' && m.message.match(/\[Dokumen/i);
  if (isDocMsg && m.mediaUrl) {
    const fileName = m.mediaFilename || 'Dokumen';
    const fileUrl = m.mediaUrl;
    const ext = (m.mediaExtension || fileName.split('.').pop() || '').toLowerCase();
    const ispdf = ext === 'pdf';
    const isImg = ['jpg','jpeg','png','webp'].includes(ext);
    const checkmark = isStaff ? '<span class="b-checkmark">✓</span>' : '';
    const delBtn = `<button onclick="deleteBubbleMsg('${escH(m.msgId)}')" style="background:none;border:none;cursor:pointer;font-size:10px;color:#ccc;padding:0 2px;line-height:1;" title="Hapus pesan">🗑️</button>`;
    const _fid = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] || '';
    const mediaActions = !isStaff ? `<div style="display:flex;gap:4px;margin-top:4px;">
      <button onclick="saveBubbleMedia('${_fid}','${escH(fileName)}','${escH(fileUrl)}')" style="font-size:10px;padding:2px 8px;border:1px solid #ccc;border-radius:5px;background:white;cursor:pointer;">💾 Simpan</button>
      <button onclick="openDocBlob('${_fid}','${escH(fileName)}')" style="font-size:10px;padding:2px 8px;border:1px solid #ccc;border-radius:5px;background:white;cursor:pointer;">📄 Buka</button>
    </div>` : '';
    if (isImg) {
      return `<div class="bw ${isStaff?'right':''}" id="msg-${escH(m.msgId)}"><div class="bubble ${cls}">${isBot && !isStaff ?`<div class="b-bot-lbl">GOHO Bot</div>`:''}<div class="b-img-lazy" data-file-id="${escH(_fid)}" data-mime="image/jpeg" data-nama="${escH(fileName)}" style="width:200px;height:140px;border-radius:8px;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="openDocBlob('${escH(_fid)}','${escH(fileName)}',true)">🖼️</div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">${escH(fileName)}</div>${mediaActions}<div class="b-meta">${formatTime(m.timestamp)}${checkmark}${delBtn}</div></div></div>`;
    }
    return `<div class="bw ${isStaff?'right':''}" id="msg-${escH(m.msgId)}"><div class="bubble ${cls}">${isBot && !isStaff ?`<div class="b-bot-lbl">GOHO Bot</div>`:''}<div class="b-file"><i class="ti ti-${ispdf?'file-type-pdf':'file'}"></i><div class="b-file-info"><div class="b-file-name">${escH(fileName)}</div>${mediaActions}</div></div><div class="b-meta">${formatTime(m.timestamp)}${checkmark}${delBtn}</div></div></div>`;
  }

  // Deteksi gambar dari mediaUrl langsung (Fonnte URL / fallback gagal upload Drive)
  const isDirectImg = m.mediaUrl &&
    ['jpg','jpeg','png','webp'].includes((m.mediaExtension || '').toLowerCase()) &&
    !(m.message && m.message.match(/^\[IMG:([^:]+):(.+)\]$/));
  if (isDirectImg) {
    const fileName = m.mediaFilename || 'gambar';
    const checkmark = isStaff ? '<span class="b-checkmark">✓</span>' : '';
    const delBtn = `<button onclick="deleteBubbleMsg('${escH(m.msgId)}')" style="background:none;border:none;cursor:pointer;font-size:10px;color:#ccc;padding:0 2px;line-height:1;" title="Hapus pesan">🗑️</button>`;
    const mediaActions = !isStaff ? `<div style="display:flex;gap:4px;margin-top:4px;">
      <button onclick="saveBubbleMedia('','${escH(fileName)}','${escH(m.mediaUrl)}')" style="font-size:10px;padding:2px 8px;border:1px solid #ccc;border-radius:5px;background:white;cursor:pointer;">💾 Simpan</button>
    </div>` : '';
    return `<div class="bw ${isStaff?'right':''}" id="msg-${escH(m.msgId)}">
      <div class="bubble ${cls}">
        ${isBot && !isStaff ? `<div class="b-bot-lbl">GOHO Bot</div>` : ''}
        <img src="${escH(m.mediaUrl)}"
          style="width:200px;height:140px;border-radius:8px;object-fit:cover;display:block;cursor:pointer;"
          onclick="window.open('${escH(m.mediaUrl)}','_blank')"
          onerror="this.style.display='none';this.nextSibling.style.display='block'">
        <span style="display:none;color:#999;font-size:11px;">📷 ${escH(fileName)}</span>
        ${mediaActions}
        <div class="b-meta">${formatTime(m.timestamp)}${checkmark}${delBtn}</div>
      </div>
    </div>`;
  }

  // Deteksi pesan gambar dengan fileId (format: [IMG:fileId:namaFile])
  const imgMatch = m.message && typeof m.message === 'string' && m.message.match(/^\[IMG:([^:]+):(.+)\]$/);
  if (imgMatch) {
    const fileId = imgMatch[1]; const namaFile = imgMatch[2];
    const checkmark = isStaff ? '<span class="b-checkmark">✓</span>' : '';
    const mediaActions = !isStaff ? `<div style="display:flex;gap:4px;margin-top:4px;">
      <button onclick="saveBubbleMedia('${escH(fileId)}','${escH(namaFile)}')" style="font-size:10px;padding:2px 8px;border:1px solid #ccc;border-radius:5px;background:white;cursor:pointer;">💾 Simpan</button>
      <button onclick="forwardBubbleMedia('${escH(fileId)}','${escH(namaFile)}')" style="font-size:10px;padding:2px 8px;border:1px solid #ccc;border-radius:5px;background:white;cursor:pointer;">📤 Forward</button>
    </div>` : '';
    const delBtnImg = `<button onclick="deleteBubbleMsg('${escH(m.msgId)}')" style="background:none;border:none;cursor:pointer;font-size:10px;color:#ccc;padding:0 2px;line-height:1;" title="Hapus pesan">🗑️</button>`;
    if (imgCache[fileId]) {
      return `<div class="bw ${isStaff?'right':''}" id="msg-${escH(m.msgId)}"><div class="bubble ${cls}">${isBot && !isStaff ? `<div class="b-bot-lbl">GOHO Bot</div>` : ''}<div class="b-img-lazy" data-file-id="${escH(fileId)}" data-loaded="1" style="width:200px;height:140px;border-radius:8px;overflow:hidden;"><img src="${imgCache[fileId]}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="openImgPreview('${imgCache[fileId]}','${escH(fileId)}','${escH(namaFile)}','')"></div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">${escH(namaFile)}</div>${mediaActions}<div class="b-meta">${formatTime(m.timestamp)}${checkmark}${delBtnImg}</div></div></div>`;
    }
    return `<div class="bw ${isStaff?'right':''}" id="msg-${escH(m.msgId)}"><div class="bubble ${cls}">${isBot && !isStaff ? `<div class="b-bot-lbl">GOHO Bot</div>` : ''}<div class="b-img-lazy" data-file-id="${escH(fileId)}" data-mime="image/jpeg" data-nama="${escH(namaFile)}">🖼️</div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">${escH(namaFile)}</div>${mediaActions}<div class="b-meta">${formatTime(m.timestamp)}${checkmark}${delBtnImg}</div></div></div>`;
  }

  // Bubble teks biasa
  const checkmark = isStaff ? '<span class="b-checkmark">✓</span>' : '';
  const delBtnTxt = `<button onclick="deleteBubbleMsg('${escH(m.msgId)}')" style="background:none;border:none;cursor:pointer;font-size:10px;color:#ccc;padding:0 2px;line-height:1;" title="Hapus pesan">🗑️</button>`;
  return `<div class="bw ${isStaff?'right':''}" id="msg-${escH(m.msgId)}"><div class="bubble ${cls}">${isBot && !isStaff ? `<div class="b-bot-lbl">GOHO Bot</div>` : ''}<div class="b-txt">${escH(m.message)}</div><div class="b-meta">${formatTime(m.timestamp)}${checkmark}${delBtnTxt}</div></div></div>`;
}



async function deleteBubbleMsg(msgId) {
  if (!msgId) return;
  if (!confirm('Hapus pesan ini dari dashboard? Pesan yang sudah terkirim ke customer tidak terpengaruh.')) return;
  try {
    const res = await apiPost({ action: 'deleteMessage', msgId });
    if (res.ok) {
      const el = document.getElementById('msg-' + msgId);
      if (el) el.remove();
      renderedMsgIds.delete(msgId);
      showToast('Pesan dihapus dari dashboard');
    } else {
      showToast('Gagal hapus: ' + (res.msg || ''));
    }
  } catch(e) {
    showToast('Error: ' + e.toString());
  }
}

async function openDocBlob(fileId, fileName, isImage) {
  if (!fileId) { showToast('File ID tidak ditemukan'); return; }
  const btn = event && event.target ? event.target : null;
  const origLabel = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
  try {
    const res = await apiGet({ action: 'getImageBase64', fileId });
    if (!res.ok) { showToast('Gagal ambil file: ' + (res.msg || '')); return; }
    const mimeType = res.mimeType || (fileName && fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    const src = 'data:' + mimeType + ';base64,' + res.base64;
    if (isImage || mimeType.startsWith('image/')) {
      _previewFileId = fileId; _previewFileName = fileName || ''; _previewMediaUrl = '';
      document.getElementById('img-preview-src').src = src;
      document.getElementById('img-preview-name').textContent = fileName || '';
      document.getElementById('modal-img-preview').style.display = 'flex';
    } else {
      openPdfModal(src, fileName);
    }
  } catch(e) { showToast('Error: ' + e.toString()); }
  finally { if (btn) { btn.disabled = false; btn.textContent = origLabel || '📄 Buka'; } }
}

function openPdfModal(src, fileName) {
  let modal = document.getElementById('modal-pdf-viewer');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-pdf-viewer';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:10000;flex-direction:column;align-items:center;justify-content:center;';
    modal.innerHTML = `<div style="position:absolute;top:12px;right:12px;display:flex;gap:8px;"><button id="pdf-modal-dl" style="background:#25D366;border:none;color:white;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">⬇️ Download</button><button onclick="closePdfModal()" style="background:rgba(255,255,255,0.15);border:none;color:white;padding:8px 14px;border-radius:8px;font-size:14px;cursor:pointer;">✕</button></div><iframe id="pdf-modal-frame" style="width:95vw;height:88vh;border:none;border-radius:8px;background:white;margin-top:44px;"></iframe><div id="pdf-modal-name" style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:8px;"></div>`;
    document.body.appendChild(modal);
  }
  const frame = document.getElementById('pdf-modal-frame');
  const dlBtn = document.getElementById('pdf-modal-dl');
  document.getElementById('pdf-modal-name').textContent = fileName || '';
  frame.src = src;
  dlBtn.onclick = () => { const a = document.createElement('a'); a.href = src; a.download = fileName || 'dokumen.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  modal.style.display = 'flex';
}

function closePdfModal() {
  const modal = document.getElementById('modal-pdf-viewer');
  if (modal) { modal.style.display = 'none'; const f = document.getElementById('pdf-modal-frame'); if (f) f.src = ''; }
}

function saveBubbleMedia(fileId, namaFile, mediaUrl) {
  _previewFileId = fileId || ''; _previewFileName = namaFile; _previewMediaUrl = mediaUrl || '';
  openSaveModal();
}
function forwardBubbleMedia(fileId, namaFile) {
  _previewFileId = fileId; _previewFileName = namaFile; _previewMediaUrl = '';
  openForwardModal();
}
async function lepasChat() { if (!currentRoom) return; const res = await apiPost({action: 'releaseChat', roomId: currentRoom.roomId}); if (res.ok) { showToast('Chat dilepas'); closeCurrentChat(); } }
async function selesaiChat() { if (!currentRoom) return; if (!confirm('Tandai chat ini selesai? Chat akan dipindah ke Arsip.')) return; const res = await apiPost({action: 'closeChat', roomId: currentRoom.roomId}); if (res.ok) { showToast('Chat selesai → Arsip'); closeCurrentChat(); } }
function closeCurrentChat() {
  currentRoom = null; lastMsgCount = 0;
  document.getElementById('chat-active').classList.add('hidden'); document.getElementById('chat-empty').classList.remove('hidden'); document.getElementById('notes-panel').style.display = 'none';
  if (docPanelOpen) { docPanelOpen = false; document.getElementById('doc-panel').classList.remove('active'); document.getElementById('doc-panel-btn').classList.remove('active-panel'); document.getElementById('info-panel-content').style.display = 'flex'; }
  loadChats(false);
}
async function tandaiBooked() { if (!currentRoom) return; const res = await apiPost({action: 'markBooked', roomId: currentRoom.roomId}); if (res.ok) { showToast('Ditandai Booked'); currentRoom.status = 'BOOKED'; renderActionRow(currentRoom); loadChats(false); } }
async function kirimPesan() {
  if (!currentRoom) return;
  const input = document.getElementById('reply-input');
  const msg = input.value.trim();
  if (!msg) return;

  // Optimistic UI: tampilkan pesan langsung tanpa tunggu server
  input.value = ''; input.style.height = 'auto';
  const tempId = 'TEMP-' + Date.now();
  const area = document.getElementById('chat-area');
  area.insertAdjacentHTML('beforeend', `<div class="bw right" id="${tempId}"><div class="bubble b-staff"><div class="b-txt">${escH(msg)}</div><div class="b-meta">${formatTime(new Date().toISOString())} <span style="color:#bbb;font-size:9px;">⏳</span></div></div></div>`);
  area.scrollTop = area.scrollHeight;
  renderedMsgIds.add(tempId);

  try {
    const res = await apiPost({action: 'sendMessage', roomId: currentRoom.roomId, staffName: currentStaff.nama, noWa: currentRoom.noWa, message: msg});
    if (res.ok) {
      const tempEl = document.getElementById(tempId);
      if (tempEl) { tempEl.remove(); renderedMsgIds.delete(tempId); }
      lastMsgCount = 0;
      await fetchMessages(currentRoom.roomId, 0, true);
      loadChats(false);
    } else {
      const tempEl = document.getElementById(tempId);
      if (tempEl) tempEl.querySelector('.b-staff').style.opacity = '0.5';
      showToast('Gagal kirim pesan');
      input.value = msg; autoExpandTextarea(input);
    }
  } catch(e) {
    const tempEl = document.getElementById(tempId);
    if (tempEl) tempEl.querySelector('.b-staff').style.opacity = '0.5';
    showToast('Gagal kirim pesan');
    input.value = msg; autoExpandTextarea(input);
  }
}
function handleReplyKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } }
function showNoteInput() { if (!currentRoom) return; showNoteModal(currentRoom.noWa); }
function backToList() { document.getElementById('sidebar').classList.remove('slide-out'); currentRoom = null; lastMsgCount = 0; }
function refreshAll() { loadChats(); showToast('Diperbarui'); }

// ===================== FILE UPLOAD =====================
async function handleFileUpload(input) {
  if (!input.files || !input.files.length) return;
  if (!currentRoom) { showToast('Pilih chat dulu'); input.value = ''; return; }
  const files = Array.from(input.files);
  const bar = document.getElementById('upload-bar');
  const status = document.getElementById('upload-status');
  bar.classList.add('show');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > 10 * 1024 * 1024) { showToast(file.name + ' terlalu besar, skip'); continue; }
    status.textContent = `Mengupload ${i+1}/${files.length}: ${file.name}...`;
    try {
      const base64 = await fileToBase64(file);
      const res = await apiPost({action: 'sendFile', roomId: currentRoom.roomId, staffName: currentStaff.nama, noWa: currentRoom.noWa, fileName: file.name, fileType: file.type || 'application/octet-stream', fileData: base64, deviceLabel: currentRoom.deviceLabel || 'WA2'});
      console.log('sendFile result:', JSON.stringify(res));
      if (!res.ok) showToast('Gagal kirim: ' + file.name);
    } catch(e) { showToast('Error: ' + file.name); }
  }

  status.textContent = `✅ ${files.length} file berhasil dikirim!`;
  setTimeout(() => bar.classList.remove('show'), 3000);
  lastMsgCount = 0;
  await loadMessages(currentRoom.roomId, true);
  loadChats(false);
  input.value = '';
}
function fileToBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = () => reject(new Error('Gagal membaca file')); reader.readAsDataURL(file); }); }
// ===================== CLIPBOARD PASTE (Ctrl+V gambar) =====================
function initClipboardPaste() {
  const input = document.getElementById('reply-input');
  if (!input) return;

  input.addEventListener('paste', async function(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault(); // jangan paste sebagai teks
        if (!currentRoom) { showToast('Pilih chat dulu'); return; }

        const file = item.getAsFile();
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { showToast('Gambar terlalu besar, maksimal 10MB'); return; }

        // Tampilkan preview di atas input
        showPastePreview(file);
        return;
      }
    }
  });
}

let _pasteFile = null;

function showPastePreview(file) {
  _pasteFile = file;
  const reader = new FileReader();
  reader.onload = function(e) {
    const existing = document.getElementById('paste-preview-bar');
    if (existing) existing.remove();

    const bar = document.createElement('div');
    bar.id = 'paste-preview-bar';
    bar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f0fdf4;border-top:1px solid #bbf7d0;';
    bar.innerHTML = `
      <img src="${e.target.result}" style="height:48px;width:48px;object-fit:cover;border-radius:6px;border:1px solid #ccc;">
      <span style="font-size:12px;color:#555;flex:1;">Screenshot siap dikirim</span>
      <button onclick="sendPasteImage()" style="background:#0F6E56;color:white;border:none;padding:5px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);">Kirim</button>
      <button onclick="cancelPaste()" style="background:none;border:none;font-size:16px;color:#999;cursor:pointer;">✕</button>
    `;

    const replyRow = document.getElementById('reply-row');
    replyRow.insertBefore(bar, replyRow.firstChild);
  };
  reader.readAsDataURL(file);
}

async function sendPasteImage() {
  if (!_pasteFile || !currentRoom) return;

  const fileToSend = _pasteFile; // simpan dulu sebelum di-clear
  cancelPaste(); // baru clear preview

  const bar = document.getElementById('upload-bar');
  const status = document.getElementById('upload-status');
  bar.classList.add('show');
  status.textContent = 'Mengirim screenshot...';

  try {
    const base64 = await fileToBase64(fileToSend);
    const ext = fileToSend.type.split('/')[1] || 'png';
    const fileName = 'screenshot-' + Date.now() + '.' + ext;

    const res = await apiPost({
      action: 'sendFile',
      roomId: currentRoom.roomId,
      staffName: currentStaff.nama,
      noWa: currentRoom.noWa,
      fileName,
      fileType: fileToSend.type,
      fileData: base64
    });

    if (res.ok) {
      status.textContent = '✅ Screenshot berhasil dikirim!';
      setTimeout(() => bar.classList.remove('show'), 3000);
      lastMsgCount = 0;
      await loadMessages(currentRoom.roomId, true);
      loadChats(false);
    } else {
      status.textContent = '❌ Gagal: ' + (res.msg || 'Error');
      setTimeout(() => bar.classList.remove('show'), 4000);
      showToast('Gagal kirim screenshot');
    }
  } catch(e) {
    status.textContent = '❌ Error: ' + e.toString();
    setTimeout(() => bar.classList.remove('show'), 4000);
  }
}

function cancelPaste() {
  _pasteFile = null;
  const bar = document.getElementById('paste-preview-bar');
  if (bar) bar.remove();
}

// ===================== NEW CHAT =====================
let newChatTarget = { noWa: '', nama: '' };
function openNewChatModal(noWa, nama) { newChatTarget = { noWa, nama }; document.getElementById('nc-av').textContent = getInitials(nama || noWa); document.getElementById('nc-nama').textContent = nama || noWa; document.getElementById('nc-nowa').textContent = noWa; document.getElementById('nc-pesan').value = ''; document.getElementById('modal-new-chat').style.display = 'flex'; setTimeout(() => document.getElementById('nc-pesan').focus(), 150); }
function openNewChatFromDetail() { closeModal('modal-detail'); openNewChatModal(currentContactNoWa, currentContactNama); }
async function submitNewChat() {
  const pesan = document.getElementById('nc-pesan').value.trim(); if (!pesan) { showToast('Pesan tidak boleh kosong'); return; }
  const btn = document.getElementById('nc-send-btn'); btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader spin"></i> Mengirim...';
  try {
    const res = await apiPost({action: 'startNewChat', noWa: newChatTarget.noWa, nama: newChatTarget.nama, message: pesan, staffName: currentStaff.nama});
    if (res.ok) { closeModal('modal-new-chat'); showToast('✅ Pesan terkirim ke ' + newChatTarget.nama); if (currentStaff.role === 'OWNER') switchMainTab('chat'); currentTab = 'aktif'; setActiveTab('aktif'); await loadChats(false); if (res.roomId) setTimeout(() => openChat(res.roomId), 600); }
    else { showToast('Gagal kirim: ' + (res.msg || 'Error')); }
  } catch(e) { showToast('Error: ' + e.toString()); }
  finally { btn.disabled = false; btn.innerHTML = '<i class="ti ti-send"></i> Kirim'; }
}

// ===================== CONTACT BOOK =====================
async function loadContacts(query) {
  const list = document.getElementById('contact-list');
  if (allContactsCache.length === 0 || query === undefined) { list.innerHTML = '<div class="loading">Memuat...</div>'; try { const res = await apiGet({action: 'getAllCustomers', query: ''}); allContactsCache = res.customers || []; } catch(e) { list.innerHTML = '<div class="empty-state">Gagal memuat</div>'; return; } }
  const q = (query !== undefined ? query : (document.getElementById('contact-search')?.value || '')).toLowerCase().trim();
  const filtered = q ? allContactsCache.filter(c => String(c.nama||'').toLowerCase().includes(q) || String(c.noWa||'').toLowerCase().includes(q) || String(c.kota||'').toLowerCase().includes(q)) : allContactsCache;
  if (filtered.length > 0) { list.innerHTML = filtered.map(c => `<div class="contact-card" onclick="openContactDetail('${escH(c.noWa)}', '${escH(c.nama)}')"><div class="contact-avatar">${String(c.nama || '?').charAt(0).toUpperCase()}</div><div class="contact-info"><div class="contact-name">${c.nama ? escH(c.nama) : '<span style="color:var(--text-hint);font-style:italic;">Belum ada nama</span>'}</div><div class="contact-wa">📱 ${c.noWa}</div><div class="contact-meta">${c.kota ? '📍 '+escH(c.kota)+' · ' : ''}WA</div></div><div class="contact-actions">${c.totalBooking > 0 ? `<div class="contact-badge">${c.totalBooking}x booking</div>` : ''}<button class="btn-chat" onclick="event.stopPropagation();openNewChatModal('${escH(c.noWa)}','${escH(c.nama)}')"><i class="ti ti-message-circle"></i> Chat</button></div></div>`).join(''); }
  else { list.innerHTML = '<div class="empty-state">Belum ada contact</div>'; }
}
function searchContacts() { loadContacts(document.getElementById('contact-search')?.value || ''); }
function showAddContact() { allContactsCache = []; document.getElementById('modal-contact-title').textContent = 'Tambah Contact'; ['c-nama','c-nowa','c-email','c-kota','c-catatan','c-original-nowa'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); document.getElementById('modal-contact').style.display = 'flex'; }
async function submitContact() {
  const nama = document.getElementById('c-nama').value.trim(); const noWa = document.getElementById('c-nowa').value.trim(); if (!nama || !noWa) { alert('Nama dan No WA wajib diisi'); return; }
  try { const res = await apiPost({action: 'saveCustomer', nama, noWa, email: document.getElementById('c-email').value.trim(), kota: document.getElementById('c-kota').value.trim(), catatan: document.getElementById('c-catatan').value.trim()}); if (res.ok || res.success) { allContactsCache = []; closeModal('modal-contact'); loadContacts(); showToast('Contact disimpan!'); } else showToast('Gagal menyimpan'); } catch(e) { showToast('Error: ' + e); }
}
async function openContactDetail(noWa, nama) {
  currentContactNoWa = noWa; currentContactNama = nama || noWa;
  document.getElementById('detail-name').textContent = nama || noWa; document.getElementById('detail-nowa').textContent = noWa;
  ['detail-email','detail-kota','detail-booking','detail-catatan'].forEach(id => { document.getElementById(id).textContent = '-'; });
  document.getElementById('booking-history').innerHTML = '<button class="btn-secondary" style="width:100%;margin-top:4px;" onclick="loadBookingHistory()">🔍 Muat Riwayat Booking</button>';
  document.getElementById('passenger-list').innerHTML = '<div class="loading">Klik tab untuk muat...</div>';
  document.getElementById('modal-detail').style.display = 'flex'; showInnerTabById('riwayat');
  try { const res = await apiGet({action: 'getCustomer', noWa}); if (res.customer) { const c = res.customer; document.getElementById('detail-email').textContent = c.email || '-'; document.getElementById('detail-kota').textContent = c.kota || '-'; document.getElementById('detail-booking').textContent = c.totalBooking || 0; document.getElementById('detail-catatan').textContent = c.catatan || '-'; } } catch(e) {}
}
async function loadBookingHistory() {
  const box = document.getElementById('booking-history'); box.innerHTML = '<div class="loading">Memuat riwayat...</div>'; window._bookingRaw = null;
  try { const res = await apiGet({action: 'getBookingHistory', noWa: currentContactNoWa}); if (res.history && res.history.length > 0) { window._bookingRaw = res.history; document.getElementById('detail-booking').textContent = res.total; renderBookingHistory(res.history, 'all'); } else { box.innerHTML = '<div class="empty-state">Belum ada riwayat booking</div>'; } } catch(e) { box.innerHTML = '<div class="empty-state">Gagal memuat riwayat</div>'; }
}
function renderBookingHistory(history, periode) {
  const box = document.getElementById('booking-history'); const icon = {PESAWAT:'✈️', HOTEL:'🏨', TOUR:'🌴', ATRAKSI:'🎡'};
  const monthNames = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const years = [...new Set(history.map(h => { if (!h.tglBeli) return ''; const p = h.tglBeli.split('/'); return p[2] || ''; }).filter(Boolean))].sort().reverse();
  const months = [...new Set(history.map(h => { if (!h.tglBeli) return ''; const p = h.tglBeli.split('/'); return (p[2] && p[1]) ? p[2] + '-' + p[1] : ''; }).filter(Boolean))].sort().reverse();
  let filtered = history;
  if (periode && periode !== 'all') { if (periode.length === 4) { filtered = history.filter(h => h.tglBeli && h.tglBeli.split('/')[2] === periode); } else { const [yr, mo] = periode.split('-'); filtered = history.filter(h => { if (!h.tglBeli) return false; const p = h.tglBeli.split('/'); return p[2] === yr && p[1] === mo; }); } }
  const filterHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;"><span style="font-size:11px;color:var(--text-muted);">Periode:</span><select id="filter-periode" onchange="applyBookingFilter()" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:11px;font-family:var(--font);outline:none;"><option value="all" ${periode==='all'?'selected':''}>Semua</option><optgroup label="Per Tahun">${years.map(y => `<option value="${y}" ${periode===y?'selected':''}>${y}</option>`).join('')}</optgroup><optgroup label="Per Bulan">${months.map(m => { const [yr, mo] = m.split('-'); const label = monthNames[parseInt(mo)] + ' ' + yr; return `<option value="${m}" ${periode===m?'selected':''}>${label}</option>`; }).join('')}</optgroup></select><span style="font-size:11px;color:var(--text-muted);">${filtered.length} dari ${history.length} booking</span></div>`;
  if (!filtered.length) { box.innerHTML = filterHTML + '<div class="empty-state">Tidak ada booking di periode ini</div>'; return; }
  box.innerHTML = filterHTML + filtered.map(h => `<div class="history-item"><div class="history-tipe">${icon[h.tipe]||'📋'} ${h.tipe}</div><div class="history-detail">${escH(h.detail)}</div><div class="history-meta">📅 ${h.tglEvent} &nbsp;|&nbsp; 🛒 ${h.tglBeli} &nbsp;|&nbsp; ${escH(h.extra)}</div><div class="history-meta">Tamu: ${escH(h.namaTamu)}</div></div>`).join('');
}
function applyBookingFilter() { if (!window._bookingRaw) return; renderBookingHistory(window._bookingRaw, document.getElementById('filter-periode').value); }
async function loadPassengers() {
  const list = document.getElementById('passenger-list'); list.innerHTML = '<div class="loading">Memuat...</div>';
  try { const res = await apiGet({action: 'getPassengers', noWa: currentContactNoWa}); if (res.passengers && res.passengers.length > 0) { list.innerHTML = res.passengers.map(p => `<div class="history-item"><div class="history-tipe">👤 ${escH(p.namaLengkap)}</div><div class="history-meta">${p.jenisKelamin==='L'?'♂️':'♀️'} &nbsp;|&nbsp; Lahir: ${p.tglLahir||'-'}</div><div class="history-meta">KTP: ${p.noKtp||'-'} &nbsp;|&nbsp; Paspor: ${p.noPaspor||'-'} (exp: ${p.expiryPaspor||'-'})</div></div>`).join(''); } else { list.innerHTML = '<div class="empty-state">Belum ada data penumpang</div>'; } } catch(e) {}
}
function showInnerTab(tab, e) { if (e) { document.querySelectorAll('.inner-tab').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); } showInnerTabById(tab); }
function waFromContact() { window.open('https://wa.me/' + currentContactNoWa, '_blank'); }
function editContact() { allContactsCache = []; closeModal('modal-detail'); document.getElementById('modal-contact-title').textContent = 'Edit Contact'; document.getElementById('c-nama').value = currentContactNama; document.getElementById('c-nowa').value = currentContactNoWa; document.getElementById('c-original-nowa').value = currentContactNoWa; document.getElementById('modal-contact').style.display = 'flex'; }
function showAddPassenger() { document.getElementById('modal-passenger').style.display = 'flex'; }
async function submitPassenger() {
  const nama = document.getElementById('p-nama').value.trim(); if (!nama) { alert('Nama lengkap wajib diisi'); return; }
  try { const res = await apiPost({action: 'savePassenger', noWaCustomer: currentContactNoWa, namaLengkap: nama, jenisKelamin: document.getElementById('p-jk').value, tglLahir: document.getElementById('p-tgl').value, noKtp: document.getElementById('p-ktp').value.trim(), noPaspor: document.getElementById('p-paspor').value.trim(), expiryPaspor: document.getElementById('p-expiry').value, kewarganegaraan: document.getElementById('p-warga').value.trim()}); if (res.success) { closeModal('modal-passenger'); loadPassengers(); showToast('Penumpang disimpan!'); } } catch(e) { showToast('Error: ' + e); }
}
// ===================== STATS =====================
async function loadStats() {
  try {
    const res = await apiGet({action: 'getStats'});
    if (!res.ok) return;
    const s = res.stats || res.data || {};
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val || 0; };
    el('stat-bot',     s.bot     || 0);
    el('stat-waiting', s.waiting || 0);
    el('stat-active',  s.assigned || s.active || 0);
    el('stat-selesai', s.closed  || s.selesai || 0);
  } catch(e) {}
}

// ===================== OWNER DASHBOARD =====================
async function loadOwnerStats() {
  try {
    const res = await apiGet({action: 'getOwnerStats'}); if (!res.success) return; const s = res.stats;
    document.getElementById('kpi-waiting').textContent = s.waiting; document.getElementById('kpi-active').textContent = s.assigned + s.followUp; document.getElementById('kpi-booked').textContent = s.booked; document.getElementById('kpi-closed').textContent = s.closed; document.getElementById('kpi-customers').textContent = s.totalCustomers;
    const alertBox = document.getElementById('alert-box');
    if (res.alertChats && res.alertChats.length > 0) { alertBox.style.display = 'block'; document.getElementById('alert-list').innerHTML = res.alertChats.map(a => `<div class="alert-item"><span>${a.roomId} — ${escH(a.namaCustomer)} (${a.menitWaiting} mnt)</span><button class="alert-assign" onclick="quickAssign('${a.roomId}')">Assign</button></div>`).join(''); } else { alertBox.style.display = 'none'; }
    const grid = document.getElementById('staff-grid');
    if (res.staffStats && res.staffStats.length > 0) { grid.innerHTML = res.staffStats.map(s => `<div class="staff-card"><div class="staff-card-name"><div class="av av-b" style="width:28px;height:28px;font-size:10px;">${getInitials(s.nama)}</div>${escH(s.nama)} <span class="staff-role">${s.role}</span></div><div class="staff-stats"><div class="stat-row">Active: <span>${s.assigned}</span></div><div class="stat-row">Booked: <span>${s.booked}</span></div><div class="stat-row">Closed: <span>${s.closed}</span></div></div></div>`).join(''); } else { grid.innerHTML = '<div class="empty-state">Belum ada data staff</div>'; }
  } catch(e) {}
}

// ===================== ALL CHATS =====================
async function loadAllChats() {
  const list = document.getElementById('all-chats-list'); list.innerHTML = '<div class="loading">Memuat...</div>';
  try { const res = await apiGet({action: 'getAllChatsOwner'}); allRoomsCache = res.rooms || []; const staffSet = new Set(allRoomsCache.map(r => r.assignedTo).filter(Boolean)); const sel = document.getElementById('filter-staff'); sel.innerHTML = '<option value="">Semua Staff</option>' + [...staffSet].map(s => `<option value="${s}">${s}</option>`).join(''); renderAllChats(allRoomsCache); } catch(e) { list.innerHTML = '<div class="empty-state">Gagal memuat</div>'; }
}
function filterAllChats() { const sf = document.getElementById('filter-status').value; const stf = document.getElementById('filter-staff').value; let filtered = allRoomsCache; if (sf) filtered = filtered.filter(r => r.status === sf); if (stf) filtered = filtered.filter(r => r.assignedTo === stf); renderAllChats(filtered); }
function renderAllChats(rooms) {
  const list = document.getElementById('all-chats-list'); const sc = {WAITING:'p-wait',ASSIGNED:'p-assign',FOLLOW_UP:'p-follow',BOOKED:'p-booked',CLOSED:'p-assign'};
  if (!rooms.length) { list.innerHTML = '<div class="empty-state">Tidak ada chat</div>'; return; }
  list.innerHTML = rooms.map(r => `<div class="contact-card"><div class="av ${getAvatarClass(r.namaCustomer)}">${getInitials(r.namaCustomer)}</div><div class="contact-info"><div class="contact-name">${escH(r.namaCustomer)} <span class="pill ${sc[r.status]||'p-assign'}" style="margin-left:4px;">${r.status}</span></div><div class="contact-wa">📱 ${r.noWa} ${r.assignedTo ? '· '+escH(r.assignedTo) : ''}</div><div class="contact-meta">${escH(r.lastMessage||'-')}</div></div><button class="btn-secondary btn-sm" onclick="quickAssign('${r.roomId}')">Assign</button></div>`).join('');
}
async function quickAssign(roomId) { const staffName = prompt('Assign ke staff (masukkan nama):'); if (!staffName) return; try { const res = await apiPost({action: 'assignChatOwner', roomId, staffName}); if (res.success) { showToast(res.message); loadAllChats(); loadOwnerStats(); } } catch(e) { showToast('Gagal assign'); } }

// ===================== DOCUMENT HUB =====================
let docPanelOpen = false, currentDocNoWa = '', allDocsCache = [], currentDocTab = 'semua';
function toggleDocPanel() {
  docPanelOpen = !docPanelOpen; const panel = document.getElementById('doc-panel'); const btn = document.getElementById('doc-panel-btn'); const infoCont = document.getElementById('info-panel-content');
  if (docPanelOpen) { panel.classList.add('active'); btn.classList.add('active-panel'); infoCont.style.display = 'none'; if (currentRoom) loadDocPanel(currentRoom.noWa); }
  else { panel.classList.remove('active'); btn.classList.remove('active-panel'); infoCont.style.display = 'flex'; }
}
async function loadDocPanel(noWa) {
  currentDocNoWa = noWa; currentDocTab = 'semua';
  document.querySelectorAll('.doc-tab').forEach((t,i) => t.classList.toggle('active', i===0));
  document.getElementById('doc-list').innerHTML = '<div class="doc-empty">Memuat dokumen...</div>';
  try { const res = await apiGet({ action: 'getCustomerDocs', noWa }); if (res.ok) { allDocsCache = res.docs || []; document.getElementById('doc-total').textContent = allDocsCache.length + ' file'; renderDocList(allDocsCache); } else { document.getElementById('doc-list').innerHTML = '<div class="doc-empty">Gagal memuat dokumen</div>'; } } catch(e) { document.getElementById('doc-list').innerHTML = '<div class="doc-empty">Error memuat</div>'; }
}
function switchDocTab(tab, el) { currentDocTab = tab; document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active')); if (el) el.classList.add('active'); renderDocList(tab === 'semua' ? allDocsCache : allDocsCache.filter(d => d.kategori === tab)); }
function getDocIcon(namaFile, kategori) { const ext = (namaFile || '').split('.').pop().toLowerCase(); if (ext === 'pdf') return '📄'; if (['jpg','jpeg','png'].includes(ext)) return '🖼️'; if (kategori === 'Identitas') return '🪪'; if (kategori === 'Tiket & Voucher') return '✈️'; return '📁'; }
function formatDocDate(isoStr) { if (!isoStr) return ''; try { const d = new Date(isoStr); return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }); } catch(e) { return ''; } }
function isImageFile(namaFile) { const ext = (namaFile || '').split('.').pop().toLowerCase(); return ['jpg','jpeg','png','gif','webp','bmp'].includes(ext); }
function truncateFileName(nama, maxLen) {
  if (!nama || nama.length <= maxLen) return nama;
  const ext = nama.lastIndexOf('.');
  if (ext > 0) { const base = nama.substring(0, ext); const extPart = nama.substring(ext); return base.substring(0, maxLen - extPart.length - 2) + '..' + extPart; }
  return nama.substring(0, maxLen) + '..';
}
async function downloadDoc(fileId, namaFile, btn) {
  if (!fileId) { showToast('File ID tidak ditemukan'); return; }
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader spin" style="font-size:12px;"></i>'; }
  try {
    const res = await apiGet({ action: 'getImageBase64', fileId });
    if (!res.ok) { showToast('Gagal ambil file: ' + (res.msg || '')); return; }
    const mimeType = res.mimeType || (namaFile && namaFile.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    const byteChars = atob(res.base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = namaFile || 'dokumen';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    showToast('⬇️ ' + (namaFile || 'File') + ' tersimpan ke Downloads');
  } catch(e) {
    showToast('Error download: ' + e.toString());
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
  }
}
function renderDocList(docs) {
  const el = document.getElementById('doc-list');
  if (!docs || docs.length === 0) { el.innerHTML = '<div class="doc-empty">Belum ada dokumen<br><span style="font-size:10px;">Klik Upload untuk tambah</span></div>'; return; }
  const groups = {}; docs.forEach(d => { if (!groups[d.kategori]) groups[d.kategori] = []; groups[d.kategori].push(d); });
  let html = '';
  Object.keys(groups).forEach(kat => {
    html += `<div class="doc-category-title"><span>${kat}</span><span style="font-size:9px;">${groups[kat].length} file</span></div>`;
    groups[kat].forEach(d => {
      const safeId = escH(d.docId); const safeFile = escH(d.fileId); const safeName = escH(d.namaFile);
      const isImg = isImageFile(d.namaFile);
      const ocrStatus = d.ocrStatus || 'none';
      const ocrBadge  = ocrStatus === 'done'
        ? '<span class="doc-ocr-badge ocr-done" title="Sudah di-OCR">✓ OCR</span>'
        : (isImg && ocrStatus === 'pending')
          ? `<span class="doc-ocr-badge ocr-pending" onclick="runDocOcr('${safeId}','${safeFile}','${safeName}')" title="Klik untuk scan OCR">📷 Scan OCR</span>`
          : '';
      html += `<div class="doc-item"><div class="doc-item-icon">${getDocIcon(d.namaFile, d.kategori)}</div><div class="doc-item-info"><div class="doc-item-name" title="${safeName}">${escH(truncateFileName(d.namaFile, 22))}${ocrBadge}</div></div><div class="doc-item-acts">${isImg ? `<div class="doc-act-btn" onclick="openPiP('${safeFile}','${safeName}','${safeId}')" title="Buka Passport Viewer">🪟</div>` : ''}<div class="doc-act-btn" onclick="openSendDocModal('${safeId}','${safeFile}','${safeName}')" title="Kirim ke tamu">📤</div><div class="doc-act-btn danger" onclick="deleteDoc('${safeId}','${safeFile}')" title="Hapus">🗑️</div></div></div>`;
    });
  });
  el.innerHTML = html;
}
async function handleDocUpload(input) {
  if (!input.files || !input.files[0]) return; if (!currentRoom) { showToast('Pilih chat dulu'); input.value = ''; return; }
  const file = input.files[0]; if (file.size > 15 * 1024 * 1024) { showToast('File terlalu besar, maksimal 15MB'); input.value = ''; return; }
  const kat = prompt('Pilih kategori:\n1 = Paspor\n2 = KTP\n3 = Visa\n4 = Tiket\n5 = Hotel\n6 = Lainnya\n\nKetik 1–6:');
  const katMap = { '1': 'Paspor', '2': 'KTP', '3': 'Visa', '4': 'Tiket', '5': 'Hotel', '6': 'Lainnya' }; const kategori = katMap[kat] || 'Lainnya';
  const label = document.getElementById('doc-upload-label'); label.innerHTML = '<i class="ti ti-loader spin" style="font-size:14px;"></i> Mengupload...';
  try {
    const base64 = await fileToBase64(file);
    const res = await apiPost({action: 'saveCustomerDoc', noWa: currentRoom.noWa, kategori, namaFile: file.name, fileType: file.type || 'application/octet-stream', fileData: base64, uploadedBy: currentStaff.nama, keterangan: '', ocrStatus: kategori === 'Paspor' ? 'pending' : 'none'});
    if (res.ok) { showToast('✅ ' + file.name + ' tersimpan!'); loadDocPanel(currentRoom.noWa); } else { showToast('Gagal upload: ' + (res.msg || 'Error')); }
  } catch(e) { showToast('Error: ' + e.toString()); }
  finally { label.innerHTML = `<i class="ti ti-upload" style="font-size:14px;"></i> Upload Dokumen<input type="file" id="doc-file-input" style="display:none;" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onchange="handleDocUpload(this)">`; input.value = ''; }
}
function viewDoc(fileId) { if (!fileId) return; window.open('https://drive.google.com/file/d/' + fileId + '/view', '_blank'); }
// State untuk modal kirim dokumen
let _sendDocId = '', _sendDocFileId = '', _sendDocNama = '';
let _sendDocSearchTimer = null;

function openSendDocModal(docId, fileId, namaFile) {
  _sendDocId = docId; _sendDocFileId = fileId; _sendDocNama = namaFile;
  document.getElementById('send-doc-file-name').textContent = namaFile;
  document.getElementById('send-doc-target').value = 'aktif';
  document.getElementById('send-doc-custom-row').style.display = 'none';
  document.getElementById('send-doc-search').value = '';
  document.getElementById('send-doc-results').style.display = 'none';
  document.getElementById('send-doc-results').innerHTML = '';
  document.getElementById('modal-send-doc').style.display = 'flex';
}

function toggleSendDocTarget(val) {
  document.getElementById('send-doc-custom-row').style.display = val === 'lain' ? 'block' : 'none';
  document.getElementById('send-doc-search').value = '';
  document.getElementById('send-doc-results').style.display = 'none';
}

function searchSendDocContact(query) {
  clearTimeout(_sendDocSearchTimer);
  const results = document.getElementById('send-doc-results');
  if (!query || query.trim().length < 2) { results.style.display = 'none'; return; }
  _sendDocSearchTimer = setTimeout(() => {
    const q = query.toLowerCase();
    const matches = allContactsCache.filter(c =>
      String(c.nama || '').toLowerCase().includes(q) ||
      String(c.noWa || '').toLowerCase().includes(q)
    ).slice(0, 6);
    if (!matches.length) { results.innerHTML = '<div style="padding:8px;font-size:11px;color:var(--text-muted);">Tidak ditemukan</div>'; results.style.display = 'block'; return; }
    results.innerHTML = matches.map(c => `<div onclick="selectSendDocContact('${escH(c.noWa)}','${escH(c.nama||c.noWa)}')" style="padding:8px 10px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='white'"><div style="width:28px;height:28px;border-radius:50%;background:var(--green-mid);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0;">${getInitials(c.nama||c.noWa)}</div><div><div style="font-weight:600;">${escH(c.nama||c.noWa)}</div><div style="font-size:10px;color:var(--text-muted);">${c.noWa}</div></div></div>`).join('');
    results.style.display = 'block';
  }, 300);
}

function selectSendDocContact(noWa, nama) {
  document.getElementById('send-doc-search').value = nama + ' (' + noWa + ')';
  document.getElementById('send-doc-search').dataset.selectedNowa = noWa;
  document.getElementById('send-doc-results').style.display = 'none';
}

async function submitSendDoc() {
  const target = document.getElementById('send-doc-target').value;
  let noWaTujuan = currentRoom ? currentRoom.noWa : '';
  let roomIdTujuan = currentRoom ? currentRoom.roomId : '';
  if (target === 'lain') {
    const searchEl = document.getElementById('send-doc-search');
    noWaTujuan = searchEl.dataset.selectedNowa || searchEl.value.trim();
    if (!noWaTujuan) { showToast('Pilih customer tujuan dulu'); return; }
    roomIdTujuan = '';
  }
  const btn = document.getElementById('send-doc-submit-btn');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader spin"></i> Mengirim...';
  try {
    const res = await apiPost({action: 'sendDocToCustomer', noWa: noWaTujuan, fileId: _sendDocFileId, namaFile: _sendDocNama, roomId: roomIdTujuan, staffName: currentStaff.nama});
    if (res.ok) {
      showToast('✅ Dokumen berhasil dikirim!');
      closeModal('modal-send-doc');
      if (target === 'aktif' && currentRoom) { lastMsgCount = 0; loadMessages(currentRoom.roomId, true); }
    } else { showToast('❌ Gagal: ' + (res.msg || '')); }
  } catch(e) { showToast('Error: ' + e.toString()); }
  finally { btn.disabled = false; btn.innerHTML = '<i class="ti ti-send"></i> Kirim'; }
}

async function sendDocToCustomer(docId, fileId, namaFile) {
  openSendDocModal(docId, fileId, namaFile);
}
async function deleteDoc(docId, fileId) {
  if (!confirm('Hapus dokumen ini? File akan dihapus permanen dari Drive.')) return;
  try { const res = await apiPost({ action: 'deleteCustomerDoc', docId, fileId }); if (res.ok) { showToast('Dokumen dihapus'); loadDocPanel(currentDocNoWa); } else { showToast('Gagal hapus: ' + (res.msg || '')); } } catch(e) { showToast('Error: ' + e.toString()); }
}

// ===================== PiP FLOATING VIEWER =====================
function openPiP(fileId, namaFile, docId) {
  if (!fileId) return;
  const nama = currentRoom ? currentRoom.nama : '';
  const noWa = currentRoom ? currentRoom.noWa : '';
  const params = new URLSearchParams({ fileId, docName: namaFile || '', nama, noWa, docId: docId || '' });
  const url = '/viewer.html?' + params.toString();
  const pw = Math.min(960, window.screen.width - 80);
  const ph = Math.min(720, window.screen.height - 80);
  const px = Math.round((window.screen.width - pw) / 2);
  const py = Math.round((window.screen.height - ph) / 2);
  window.open(url, 'goho_passport_viewer',
    'width='+pw+',height='+ph+',left='+px+',top='+py+
    ',resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no');
  showToast('🪟 Membuka GOHO Passport Viewer...');
}

const MASKAPAI_EMOJI = { 'LION': '🦁', 'BATIK': '🦋', 'WINGS': '🪽', 'AIRASIA': '🔴', 'CITILINK': '🟢', 'GARUDA': '🦅', 'SRIWIJAYA': '🔵', 'NAM': '✈️' };
function getMaskapaiEmoji(nama) { const upper = (nama||'').toUpperCase(); for (const key of Object.keys(MASKAPAI_EMOJI)) { if (upper.includes(key)) return MASKAPAI_EMOJI[key]; } return '✈️'; }
function formatHarga(num) { if (!num || num===0) return ''; return 'Rp ' + Number(num).toLocaleString('id-ID'); }
async function loadSmartContext(roomId, noWa) {
  const block = document.getElementById('np-context-block'); const list = document.getElementById('np-context-list'); const loading = document.getElementById('np-context-loading'); if (!block||!list) return;
  block.style.display = 'block'; loading.textContent = 'scanning...'; list.innerHTML = '<div class="context-scanning"><span class="poll-dot"></span> Mendeteksi kode booking...</div>';
  try {
    const res = await apiGet({action:'getBookingContext', roomId, noWa});
    if (res.ok && res.bookings && res.bookings.length > 0) {
      loading.textContent = res.bookings.length + ' booking';
      list.innerHTML = res.bookings.map(b => renderContextCard(b)).join('');
      if (res.bookings[0].tglTerbang) currentFlightDate = parseFlightDateForAge(res.bookings[0].tglTerbang);
      if (multiPaxOpen) renderMultiPaxList(); // refresh badge kalau panel Multi Pax sedang dibuka
      return;
    }

    // Fallback: belum ada kode PNR yang disebut di chat — coba cari booking aktif langsung by noWa
    loading.textContent = 'cek booking aktif...';
    const upRes = await apiGet({action:'getUpcomingBooking', noWa});
    if (upRes.ok && upRes.bookings && upRes.bookings.length > 0) {
      loading.textContent = upRes.bookings.length + ' booking (tanpa kode)';
      list.innerHTML = upRes.bookings.map(b => renderUpcomingCard(b)).join('');
      if (upRes.bookings[0].tglEvent) currentFlightDate = parseFlightDateForAge(upRes.bookings[0].tglEvent);
      if (multiPaxOpen) renderMultiPaxList(); // refresh badge kalau panel Multi Pax sedang dibuka
      return;
    }

    loading.textContent = '';
    list.innerHTML = '<div class="context-none">Belum ada kode booking terdeteksi</div>';
  } catch(e) { loading.textContent = ''; list.innerHTML = '<div class="context-none">Error loading konteks</div>'; }
}
function renderContextCard(b) {
  const emoji = getMaskapaiEmoji(b.maskapai); const allKodes = (b.allKodes||[b.kode]).join(' · ');
  return `<div class="context-booking-card"><div class="context-maskapai"><span>${emoji} ${escH(b.maskapai)}</span><span style="font-size:9px;color:var(--text-hint);">${escH(b.tglTerbang)}</span></div><div class="context-kode">${escH(allKodes)}</div><div class="context-rute">✈️ ${escH(b.jurusan)}</div><div class="context-detail">👤 ${escH(b.nama)}<br>🛒 Beli: ${escH(b.tglBeli)}${b.harga ? ' · ' + formatHarga(b.harga) : ''}${b.noInv&&b.noInv!=='-' ? '<br>📋 '+escH(b.noInv) : ''}</div><div class="context-action-row"><button class="ctx-btn ctx-btn-checkin" onclick="quickCheckin('${escH(b.kode)}','${escH(b.maskapai)}','${escH(b.jurusan)}')">🛫 Check-in</button><button class="ctx-btn ctx-btn-arrival" onclick="quickArrival('${escH(b.jurusan)}')">📋 Arrival Card</button><button class="ctx-btn ctx-btn-beacukai" onclick="quickBeaCukai()">🛃 Bea Cukai</button><button class="ctx-btn ctx-btn-arrival" onclick="quickArrivalIndonesia('${escH(b.maskapai)}','${escH(b.kodeFlight)}','${escH(b.jurusan)}','${escH(b.tglTerbang)}','${escH(b.nama)}')">🛬 Arrival ID</button></div></div>`;
}
// v28: Card untuk hasil fallback getUpcomingBooking — TANPA kode PNR terverifikasi dari chat.
// Sengaja dibedakan visual (border abu-abu, label "tanpa kode", warning) supaya staff tahu
// data ini belum dicocokkan ke chat customer, beda dengan renderContextCard yang sudah verified.
function renderUpcomingCard(b) {
  return `<div class="context-booking-card" style="border-left:3px solid #999;">
    <div class="context-maskapai"><span>📋 ${escH(b.tipe)}</span><span style="font-size:9px;color:var(--text-hint);">${escH(b.tglEventFmt)}</span></div>
    <div class="context-rute">👤 ${escH(b.namaTamu)}</div>
    <div class="context-detail">${escH(b.detail)}</div>
    <div style="font-size:9px;color:#b8860b;margin-top:4px;">⚠️ Tanpa kode PNR dari chat — cocokkan manual sebelum dipakai</div>
  </div>`;
}
function quickCheckin(kode, maskapai, jurusan) {
  const urls = {'LION':'https://checkin.lionair.co.id','AIRASIA':'https://www.airasia.com/check-in/v2/en/gb','CITILINK':'https://www.citilink.co.id/check-in','GARUDA':'https://www.garuda-indonesia.com/id/id/garuda-online/check-in','BATIK':'https://www.batikair.com/id/id/check-in'};
  const upper = (maskapai||'').toUpperCase(); let url = null;
  for (const key of Object.keys(urls)) { if (upper.includes(key)) { url = urls[key]; break; } }
  if (url) { window.open(url,'_blank'); showToast('🛫 Buka halaman check-in '+maskapai); } else showToast('URL check-in belum tersedia untuk '+maskapai);
}
function quickArrival(jurusan) {
  const arrivalInfo = {'KUL':{nama:'MDAC',url:'https://imigresen-online.imi.gov.my/mdac'},'PEN':{nama:'MDAC',url:'https://imigresen-online.imi.gov.my/mdac'},'BKK':{nama:'TDAC',url:'https://tdac.immigration.go.th'},'DMK':{nama:'TDAC',url:'https://tdac.immigration.go.th'},'SIN':{nama:'SGAC',url:'https://eservices.ica.gov.sg/sgarrivalcard'},'TPE':{nama:'TWAC',url:'https://niaspeedy.immigration.gov.tw'},'PEK':{nama:'CDAC',url:'https://s.nia.gov.cn'},'PVG':{nama:'CDAC',url:'https://s.nia.gov.cn'},'ICN':{nama:'e-Arrival Card Korea',url:'https://www.hikorea.go.kr'},'NRT':{nama:'Visit Japan Web',url:'https://vjw-lp.digital.go.jp'},'HND':{nama:'Visit Japan Web',url:'https://vjw-lp.digital.go.jp'},'HKG':{nama:'Arrival Card HK',url:'https://www.immd.gov.hk'}};
  const iataMatch = (jurusan||'').toUpperCase().match(/[A-Z]{3}/g); if (!iataMatch) { showToast('Rute tidak terdeteksi'); return; }
  const dest = iataMatch[iataMatch.length-1]; const info = arrivalInfo[dest];
  if (info) { window.open(info.url,'_blank'); showToast('📋 Buka '+info.nama+' untuk '+dest); } else showToast('Info arrival card untuk '+dest+' belum tersedia');
}
function quickBeaCukai() { window.open('https://ecd.beacukai.go.id','_blank'); showToast('🛃 Buka e-CD Bea Cukai Indonesia'); }
function quickArrivalIndonesia(maskapai, kodeFlight, jurusan, tglTerbang, namaTamu) {
  openAlliModal();
}

const BANDARA_WILAYAH = {
  'KNO': { provinsi: 'SUMATERA UTARA',   kota: 'KOTA MEDAN',         alamat: 'MEDAN' },
  'MES': { provinsi: 'SUMATERA UTARA',   kota: 'KOTA MEDAN',         alamat: 'MEDAN' },
  'CGK': { provinsi: 'DKI JAKARTA',      kota: 'JAKARTA',            alamat: 'JAKARTA' },
  'HLP': { provinsi: 'DKI JAKARTA',      kota: 'JAKARTA',            alamat: 'JAKARTA' },
  'DPS': { provinsi: 'BALI',             kota: 'KOTA DENPASAR',      alamat: 'DENPASAR' },
  'SUB': { provinsi: 'JAWA TIMUR',       kota: 'KOTA SURABAYA',      alamat: 'SURABAYA' },
  'UPG': { provinsi: 'SULAWESI SELATAN', kota: 'KOTA MAKASSAR',      alamat: 'MAKASSAR' },
  'PDG': { provinsi: 'SUMATERA BARAT',   kota: 'KOTA PADANG',        alamat: 'PADANG' },
  'PLM': { provinsi: 'SUMATERA SELATAN', kota: 'KOTA PALEMBANG',     alamat: 'PALEMBANG' },
  'BPN': { provinsi: 'KALIMANTAN TIMUR', kota: 'KOTA BALIKPAPAN',    alamat: 'BALIKPAPAN' },
  'PKU': { provinsi: 'RIAU',             kota: 'KOTA PEKANBARU',     alamat: 'PEKANBARU' },
  'BTH': { provinsi: 'KEPULAUAN RIAU',   kota: 'KOTA BATAM',         alamat: 'BATAM' },
  'BDO': { provinsi: 'JAWA BARAT',       kota: 'KOTA BANDUNG',       alamat: 'BANDUNG' },
  'JOG': { provinsi: 'DI YOGYAKARTA',    kota: 'KOTA YOGYAKARTA',    alamat: 'YOGYAKARTA' },
  'SOC': { provinsi: 'JAWA TENGAH',      kota: 'KOTA SURAKARTA',     alamat: 'SOLO' },
  'MDC': { provinsi: 'SULAWESI UTARA',   kota: 'KOTA MANADO',        alamat: 'MANADO' },
  'PNK': { provinsi: 'KALIMANTAN BARAT', kota: 'KOTA PONTIANAK',     alamat: 'PONTIANAK' },
  'AMQ': { provinsi: 'MALUKU',           kota: 'KOTA AMBON',         alamat: 'AMBON' },
  'DJJ': { provinsi: 'PAPUA',            kota: 'KOTA JAYAPURA',      alamat: 'JAYAPURA' },
  'TIM': { provinsi: 'PAPUA',            kota: 'MIMIKA',             alamat: 'TIMIKA' },
  'MLG': { provinsi: 'JAWA TIMUR',       kota: 'KOTA MALANG',        alamat: 'MALANG' },
  'TKG': { provinsi: 'LAMPUNG',          kota: 'KOTA BANDAR LAMPUNG',alamat: 'BANDAR LAMPUNG' },
};

function deteksiWilayahDariRute(rute) {
  if (!rute) return null;
  const parts  = rute.toUpperCase().replace(/\s/g,'').split('-');
  const tujuan = parts[parts.length - 1].substring(0, 3);
  return BANDARA_WILAYAH[tujuan] || null;
}

let _alliBookingData = null;
let _alliPaxList     = [];
let _alliSearchTimer = null;

function openAlliModal() {
  const oldModal = document.getElementById('modal-alli');
  if (oldModal) oldModal.remove();
  let modal = document.getElementById('modal-alli');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-alli';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-box modal-wide">
        <div class="modal-header">
          <h3>🛬 Arrival Card Indonesia</h3>
          <button onclick="closeModal('modal-alli')">✕</button>
        </div>
        <div class="modal-body">
          <div id="alli-step1">
            <div class="form-group">
              <label>Kode PNR Booking</label>
              <input type="text" id="alli-pnr" placeholder="Contoh: ABC123" style="text-transform:uppercase" onblur="cariPnrAlli()">
            </div>
            <div id="alli-pnr-notfound" style="display:none;color:#b3261e;font-size:12px;margin-top:-8px;margin-bottom:8px;">❌ PNR tidak ditemukan di sistem.</div>
            <div id="alli-pnr-result" style="display:none;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px;font-size:12px;margin-bottom:12px;">
              ✅ <b id="alli-result-nama"></b> — <span id="alli-result-maskapai"></span> <span id="alli-result-flight"></span><br>
              Rute: <span id="alli-result-rute"></span> | Terbang: <span id="alli-result-tgl"></span>
            </div>
            <div class="form-group" style="position:relative;">
              <label>Cari & Tambah Peserta</label>
              <input type="text" id="alli-search-pax" placeholder="Ketik nama peserta..." oninput="searchPaxAlli(this.value)" autocomplete="off">
              <div id="alli-search-results" style="display:none;position:absolute;top:100%;left:0;right:0;background:white;border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:100;max-height:200px;overflow-y:auto;"></div>
            </div>
            <div id="alli-pax-list" style="margin-bottom:12px;"></div>
            <div class="form-group">
              <label>Email Customer</label>
              <input type="text" id="alli-email" placeholder="email@example.com">
            </div>
            <div class="form-group">
              <label>No WA / Kontak</label>
              <input type="text" id="alli-kontak" placeholder="628xxxxxxxxxx">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div class="form-group">
                <label>Jumlah Bagasi</label>
                <input type="number" id="alli-bagasi" value="1" min="1" max="20">
              </div>
              <div class="form-group">
                <label>No Kursi (opsional)</label>
                <input type="text" id="alli-kursi" placeholder="cth: 12A">
              </div>
            </div>
          </div>
          <div id="alli-step2" style="display:none;">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Cek & edit data sebelum dikirim ke extension:</div>
            <textarea id="alli-ringkasan-text" style="width:100%;height:260px;font-size:11px;font-family:monospace;padding:8px;border:1px solid var(--border);border-radius:6px;resize:vertical;outline:none;"></textarea>
            <div style="font-size:10px;color:#e07b00;margin-top:6px;">⚠️ Pastikan Email sudah terisi sebelum kirim.</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--border);">
          <button onclick="closeModal('modal-alli')" style="flex:1;padding:8px;border:1px solid var(--border);border-radius:6px;background:white;cursor:pointer;font-family:var(--font);">Batal</button>
          <button id="alli-btn-preview" onclick="alliPreviewRingkasan()" style="flex:2;padding:8px;border:none;border-radius:6px;background:#1a4d8f;color:white;font-weight:600;cursor:pointer;font-family:var(--font);">👁 Preview Ringkasan</button>
          <button id="alli-btn-kirim" onclick="submitAlliData()" style="display:none;flex:2;padding:8px;border:none;border-radius:6px;background:#1a4d8f;color:white;font-weight:600;cursor:pointer;font-family:var(--font);">🛬 Kirim & Buka Form</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  // Reset
  document.getElementById('alli-step1').style.display = 'block';
  document.getElementById('alli-step2').style.display = 'none';
  document.getElementById('alli-btn-preview').style.display = 'block';
  document.getElementById('alli-btn-kirim').style.display   = 'none';
  document.getElementById('alli-pnr').value = '';
  document.getElementById('alli-pnr-result').style.display   = 'none';
  document.getElementById('alli-pnr-notfound').style.display = 'none';
  document.getElementById('alli-search-pax').value = '';
  document.getElementById('alli-search-results').style.display = 'none';
  document.getElementById('alli-pax-list').innerHTML = '';
  document.getElementById('alli-email').value  = '';
  document.getElementById('alli-bagasi').value = '1';
  document.getElementById('alli-kursi').value  = '';
  _alliBookingData = null;
  _alliPaxList     = [];
  modal.style.display = 'flex';
}

async function cariPnrAlli() {
  const pnr      = document.getElementById('alli-pnr').value.trim().toUpperCase();
  const notfound = document.getElementById('alli-pnr-notfound');
  const result   = document.getElementById('alli-pnr-result');
  notfound.style.display = 'none';
  result.style.display   = 'none';
  _alliBookingData = null;
  if (!pnr) return;
  try {
    const res = await apiGet({ action: 'cariBookingPnrMdac', kodePnr: pnr });
    if (!res.found || !res.bookings || !res.bookings.length) { notfound.style.display = 'block'; return; }
    const b = res.bookings[0];
    // PP: tgl kedatangan = tglPulang | OW: tgl kedatangan = tglTerbang
    const tglDatang    = (b.jenisTiket === 'PP' && b.tglPulang)    ? b.tglPulang    : b.tglTerbang;
    const flightDatang = (b.jenisTiket === 'PP' && b.flightPulang) ? b.flightPulang : b.kodeFlight;
    _alliBookingData = {
    maskapai:   b.maskapai,
    kodeFlight: flightDatang,
    rute:       b.rute,
    tglTerbang: tglDatang,
    namaTamu:   b.namaTamu,
    jenisTiket: b.jenisTiket,
    };
    document.getElementById('alli-result-nama').textContent     = b.namaTamu   || '-';
    document.getElementById('alli-result-maskapai').textContent = b.maskapai   || '-';
    document.getElementById('alli-result-flight').textContent   = flightDatang  || '-';
    document.getElementById('alli-result-rute').textContent     = b.rute       || '-';
    document.getElementById('alli-result-tgl').textContent      = tglDatang    || '-';
    // Auto-fill kontak dari chat aktif
    if (currentRoom && currentRoom.noWa) {
      document.getElementById('alli-kontak') && (document.getElementById('alli-kontak').value = currentRoom.noWa);
    }
    result.style.display = 'block';
  } catch(e) { notfound.style.display = 'block'; }
}

function searchPaxAlli(query) {
  clearTimeout(_alliSearchTimer);
  const results = document.getElementById('alli-search-results');
  if (!query || query.trim().length < 2) { results.style.display = 'none'; return; }
  _alliSearchTimer = setTimeout(async () => {
    try {
      const res = await apiGet({ action: 'getPassengersByName', query: query.trim() });
      if (!res.ok || !res.passengers || !res.passengers.length) {
        results.innerHTML = '<div style="padding:8px 10px;font-size:11px;color:var(--text-muted);">Tidak ditemukan</div>';
        results.style.display = 'block'; return;
      }
      window._alliSearchOptions = res.passengers;
      results.innerHTML = res.passengers.map((p, i) =>
        `<div onclick="pilihPaxAlli(${i})" style="padding:8px 10px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='white'">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--green-mid);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;">${getInitials(p.namaLengkap)}</div>
          <div><div style="font-weight:600;">${escH(p.namaLengkap)}</div><div style="font-size:10px;color:var(--text-muted);">${p.noPaspor||'-'} · ${p.tglLahir||'-'}</div></div>
        </div>`
      ).join('');
      results.style.display = 'block';
    } catch(e) {}
  }, 350);
}

function pilihPaxAlli(idx) {
  const p = window._alliSearchOptions[idx];
  if (!p) return;
  if (_alliPaxList.find(x => x.noPaspor === p.noPaspor && p.noPaspor)) { showToast('Peserta sudah ditambahkan'); return; }
  _alliPaxList.push(p);
  document.getElementById('alli-search-pax').value = '';
  document.getElementById('alli-search-results').style.display = 'none';
  renderAlliPaxList();
}

function hapusPaxAlli(idx) {
  _alliPaxList.splice(idx, 1);
  renderAlliPaxList();
}

function renderAlliPaxList() {
  const list = document.getElementById('alli-pax-list');
  if (!_alliPaxList.length) { list.innerHTML = ''; return; }
  list.innerHTML = _alliPaxList.map((p, i) =>
    `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:12px;">
      <span style="font-weight:600;">${i+1}. ${escH(p.namaLengkap)}</span>
      <span style="color:var(--text-muted);font-size:10px;">${p.noPaspor||'-'}</span>
      <button onclick="hapusPaxAlli(${i})" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#dc2626;font-size:14px;">✕</button>
    </div>`
  ).join('');
}

function alliPreviewRingkasan() {
  if (!_alliBookingData)   { showToast('Cari PNR dulu'); return; }
  if (!_alliPaxList.length){ showToast('Tambahkan minimal 1 peserta'); return; }
  const b      = _alliBookingData;
  const email  = document.getElementById('alli-email').value.trim();
  const bagasi = document.getElementById('alli-bagasi').value || '1';
  const kursi  = document.getElementById('alli-kursi').value.trim();
  const noWa   = currentRoom ? currentRoom.noWa : '';
  const wilayah  = deteksiWilayahDariRute(b.rute);
  const provinsi = wilayah ? wilayah.provinsi : 'SUMATERA UTARA';
  const kota     = wilayah ? wilayah.kota     : 'KOTA MEDAN';
  const alamat   = wilayah ? wilayah.alamat   : 'MEDAN';
  let lines = [];
  lines.push('=== RINGKASAN DATA ARRIVAL CARD INDONESIA ===');
  lines.push('Maskapai   : ' + (b.maskapai   || ''));
  lines.push('No Flight  : ' + (b.kodeFlight || b.noFlight || b.kode || ''));
  lines.push('Rute       : ' + (b.rute       || ''));
  lines.push('Tgl Datang : ' + (b.tglTerbang || ''));
  lines.push('Provinsi   : ' + provinsi);
  lines.push('Kota       : ' + kota);
  lines.push('Alamat     : ' + alamat);
  lines.push('Email      : ' + email);
  lines.push('Kontak     : ' + ((document.getElementById('alli-kontak') ? document.getElementById('alli-kontak').value.trim() : '') || (currentRoom ? currentRoom.noWa : '') || noWa));
  lines.push('Jml Bagasi : ' + bagasi);
  if (kursi) lines.push('No Kursi   : ' + kursi);
  lines.push('');
  _alliPaxList.forEach((p, i) => {
    const isLaki = p.jenisKelamin === 'L' || p.jenisKelamin === 'Laki-laki';
    lines.push('--- Peserta ' + (i+1) + ' ---');
    lines.push('Nama         : ' + p.namaLengkap);
    lines.push('No Paspor    : ' + (p.noPaspor    || ''));
    lines.push('Tgl Lahir    : ' + (p.tglLahir    || ''));
    lines.push('Sex          : ' + (isLaki ? 'MALE' : 'FEMALE'));
    lines.push('Exp Paspor   : ' + (p.expiryPaspor || ''));
    lines.push('');
  });
  document.getElementById('alli-ringkasan-text').value = lines.join('\n');
  document.getElementById('alli-step1').style.display    = 'none';
  document.getElementById('alli-step2').style.display    = 'block';
  document.getElementById('alli-btn-preview').style.display = 'none';
  document.getElementById('alli-btn-kirim').style.display   = 'block';
}

function submitAlliData() {
  const text = document.getElementById('alli-ringkasan-text').value.trim();
  if (!text) { showToast('Data kosong'); return; }
  const msg = { type: 'GOHO_ALLI_DATA', ringkasan: text };
  let retry = 0;
  const send = () => { window.postMessage(msg, '*'); if (retry++ < 3) setTimeout(send, 300); };
  send();
  window.open('https://allindonesia.imigrasi.go.id/arrival-card-submission/personal-information', '_blank');
  closeModal('modal-alli');
  showToast('✅ Data dikirim ke extension AllIndonesia');
}

// ===================== MULTI PAX =====================
let multiPaxOpen = false;
let multiPaxList = [];
let mpxSearchTimer = null;
let _mpxSearchOptions = [];
const fotoCache = {};

function toggleMultiPax() {
  multiPaxOpen = !multiPaxOpen;
  const overlay = document.getElementById('multipax-overlay');
  overlay.classList.toggle('active', multiPaxOpen);
  if (multiPaxOpen) { setTimeout(() => document.getElementById('mpx-search').focus(), 200); }
  else { document.getElementById('mpx-results').classList.remove('show'); }
}
function handleMultiPaxOverlayClick(e) { if (e.target === document.getElementById('multipax-overlay')) toggleMultiPax(); }

function searchPassenger(query) {
  clearTimeout(mpxSearchTimer);
  const results = document.getElementById('mpx-results');
  if (!query || query.trim().length < 2) { results.classList.remove('show'); return; }
  mpxSearchTimer = setTimeout(async () => {
    results.innerHTML = '<div style="padding:8px 12px;font-size:11px;color:var(--text-muted);">Mencari...</div>';
    results.classList.add('show');
    try {
      const res = await apiGet({ action: 'getPassengersByName', query: query.trim() });
      if (!res.ok || !res.passengers || res.passengers.length === 0) {
        results.innerHTML = `<div style="padding:8px 12px;font-size:11px;color:var(--text-muted);">Tidak ditemukan</div><div class="mpax-add-manual" onclick="showManualForm()"><i class="ti ti-plus" style="font-size:12px;"></i> Input manual</div>`;
        return;
      }
      _mpxSearchOptions = res.passengers;
   results.innerHTML = res.passengers.map((p, idx) => `
  <div class="mpx-result-item" onclick="addPassengerToList(${idx})">
    <div class="mpx-result-foto" id="foto-${p.passengerId}" onclick="event.stopPropagation();openPasporLightboxFromFoto('foto-${escH(p.passengerId)}')" style="cursor:zoom-in;">${getInitials(p.namaLengkap)}</div>
    <div class="mpx-result-info">
      <div class="mpx-result-nama">${escH(p.namaLengkap)}</div>
      <div class="mpx-result-paspor">${p.noPaspor || '-'} · ${formatMpxDate(p.tglLahir) || '-'}</div>
    </div>
  </div>`).join('') +
  `<div class="mpax-add-manual" onclick="showManualForm()"><i class="ti ti-plus" style="font-size:12px;"></i> Input manual</div>`;
      res.passengers.forEach(p => { if (p.fotoFileId) loadFotoPreview(p.passengerId, p.fotoFileId); });
    } catch(e) {
      results.innerHTML = '<div style="padding:8px 12px;font-size:11px;color:var(--red);">Error: ' + e.message + '</div>';
    }
  }, 400);
}

async function loadFotoPreview(passengerId, fotoFileId) {
  if (!fotoFileId) return;
  if (fotoCache[fotoFileId]) { setFotoEl(passengerId, fotoCache[fotoFileId]); return; }
  try {
    const res = await fetch('https://goho-proxy.gohotravel.workers.dev?action=getImageBase64&fileId=' + encodeURIComponent(fotoFileId));
    const data = await res.json();
    if (data.base64) {
      const src = 'data:' + (data.mimeType || 'image/jpeg') + ';base64,' + data.base64;
      fotoCache[fotoFileId] = src; setFotoEl(passengerId, src);
    }
  } catch(e) {}
}
function setFotoEl(passengerId, src) {
  var elId = passengerId.indexOf('foto-') === 0 || passengerId.indexOf('mdac-foto-') === 0
    ? passengerId
    : 'foto-' + passengerId;
  const el = document.getElementById(elId);
  if (el) el.innerHTML = '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" onclick="openPasporLightboxFromImg(this)">';
}
function openPasporLightboxFromFoto(elId) {
  const el = document.getElementById(elId);
  const img = el ? el.querySelector('img') : null;
  if (!img) return;
  openPasporLightboxFromImg(img);
}

function openPasporLightboxFromImg(imgEl) {
  const overlay = document.getElementById('mpx-foto-popup');
  const popImg = document.getElementById('mpx-foto-popup-img');
  popImg.src = imgEl.src;
  overlay.style.display = 'flex';
}

function addPassengerToList(idx) {
  const p = _mpxSearchOptions[idx];
  if (!p) return;
  if (multiPaxList.find(x => x.passengerId === p.passengerId)) { showToast('Penumpang sudah ditambahkan'); return; }
  multiPaxList.push(p);
  document.getElementById('mpx-search').value = '';
  document.getElementById('mpx-results').classList.remove('show');
  renderMultiPaxList();
}
function removePassenger(idx) { multiPaxList.splice(idx, 1); renderMultiPaxList(); }

// Helper pisah nama: kata pertama = depan, sisanya = belakang
function splitNama(namaLengkap) {
  const parts = (namaLengkap || '').trim().split(/\s+/);
  const depan    = parts[0] || '-';
  const belakang = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || '-';
  return { depan, belakang };
}

// State expand/collapse per pax index
let mpxExpandedIdx = 0; // default pax pertama expand

function toggleMpxCard(idx) {
  mpxExpandedIdx = (mpxExpandedIdx === idx) ? -1 : idx;
  renderMultiPaxList();
}

// Parse tanggal terbang dari berbagai format (DD/MM/YYYY atau ISO) jadi Date object
function parseFlightDateForAge(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}

// Hitung umur penumpang pada tanggal referensi (tanggal terbang kalau ada, fallback hari ini)
function calcPaxAgeInfo(tglLahirStr) {
  const lahir = parseFlightDateForAge(tglLahirStr);
  if (!lahir) return null;
  const ref = currentFlightDate || new Date();
  const isEstimate = !currentFlightDate;
  let age = ref.getFullYear() - lahir.getFullYear();
  const m = ref.getMonth() - lahir.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < lahir.getDate())) age -= 1;
  let tipe = 'ADT';
  if (age < 2) tipe = 'INF';
  else if (age < 12) tipe = 'CHD';
  return { age, tipe, isEstimate };
}

function paxTypeBadgeHtml(tglLahirStr) {
  const info = calcPaxAgeInfo(tglLahirStr);
  if (!info) return '';
  const colorMap = { ADT: '#1a6b4a', CHD: '#a16207', INF: '#7e22ce' };
  const bg = colorMap[info.tipe] || '#444';
  const estimateMark = info.isEstimate ? ' title="Estimasi dari tanggal hari ini — tgl terbang belum terdeteksi"' : '';
  const estimateText = info.isEstimate ? '~' : '';
  return `<span${estimateMark} style="background:${bg};color:white;font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px;margin-right:4px;white-space:nowrap;">${estimateText}${info.tipe} · ${info.age}th</span>`;
}

function renderMultiPaxList() {
  const list = document.getElementById('mpx-list');
  const count = document.getElementById('mpx-count');
  count.textContent = multiPaxList.length > 0 ? multiPaxList.length + ' pax' : '';
  if (multiPaxList.length === 0) {
    list.innerHTML = '<div class="mpx-empty">Cari dan tambah penumpang<br><span style="font-size:10px;">Ketik nama di kolom search</span></div>';
    return;
  }
  list.innerHTML = multiPaxList.map((p, i) => {
    const { depan, belakang } = splitNama(p.namaLengkap);
    const isLaki = p.jenisKelamin === 'L' || p.jenisKelamin === 'Laki-laki';
    const isPrmp = p.jenisKelamin === 'P' || p.jenisKelamin === 'Perempuan';
    const title  = isLaki ? 'MR' : isPrmp ? 'MRS' : '';
    const titleBadge = title ? `<span style="background:#1a6b4a;color:white;font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;margin-right:4px;">${title}</span>` : '';
    const paxTypeBadge = paxTypeBadgeHtml(p.tglLahir);
    const isExpanded = mpxExpandedIdx === i;
    const paspor = p.noPaspor || '';

    // Collapsed row — klik untuk expand
    const collapsedRow = `<div class="mpx-collapsed-row" onclick="toggleMpxCard(${i})" style="display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;background:${isExpanded?'#1a4a35':'#0d2b1f'};border-radius:${isExpanded?'10px 10px 0 0':'10px'};transition:background 0.15s;">
      <div style="width:22px;height:22px;border-radius:50%;background:#25D366;color:white;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</div>
      ${titleBadge}${paxTypeBadge}
    <div style="flex:1;font-size:12px;font-weight:600;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escH(p.namaLengkap)}</div>
      ${paspor ? `<span style="font-size:10px;color:rgba(255,255,255,0.5);flex-shrink:0;">${escH(paspor)}</span>` : ''}
      <span style="font-size:11px;color:rgba(255,255,255,0.4);flex-shrink:0;margin-left:4px;">${isExpanded ? '▲' : '▼'}</span>
      <button onclick="event.stopPropagation();removePassenger(${i})" style="background:rgba(255,255,255,0.1);border:none;color:rgba(255,255,255,0.6);width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>
    </div>`;

    // Expanded detail — field berurutan sesuai form airline
    const expandedDetail = isExpanded ? `<div style="background:#0a1f16;border-radius:0 0 10px 10px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;border-top:1px solid rgba(255,255,255,0.08);">
      <div style="display:flex;gap:4px;margin-bottom:2px;">
        <button onclick="copyPaxData(${i})" style="flex:1;background:#25D366;border:none;color:white;padding:5px 8px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font);">📋 Copy Semua</button>
      </div>
      ${mpxFieldAirline('Title', title || '-')}
      ${mpxFieldAirline('Given Name', depan)}
      ${mpxFieldAirline('Last Name', belakang)}
      ${mpxFieldAirline('Nationality', p.kewarganegaraan)}
      ${mpxFieldAirline('Tgl Lahir', p.tglLahir)}
      ${mpxFieldAirline('No Paspor', p.noPaspor)}
      ${mpxFieldAirline('Expired', p.expiryPaspor)}
    </div>` : '';

    return `<div style="margin-bottom:6px;">${collapsedRow}${expandedDetail}</div>`;
  }).join('');
}

function mpxFieldAirline(label, value) {
  if (!value) return '';
  const safe = escH(value);
  return `<div style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:6px;background:rgba(255,255,255,0.04);">
    <span style="font-size:10px;color:rgba(255,255,255,0.4);width:82px;flex-shrink:0;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;">${label}</span>
    <span style="flex:1;font-size:12px;color:white;font-weight:500;">${safe}</span>
    <button class="mpx-copy-btn" onclick="copyField(this,'${safe}')" title="Salin" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);width:26px;height:26px;border-radius:5px;cursor:pointer;font-size:11px;flex-shrink:0;">📋</button>
  </div>`;
}

function copyPaxData(idx) {
  const p = multiPaxList[idx]; if (!p) return;
  const { depan, belakang } = splitNama(p.namaLengkap);
  const isLaki = p.jenisKelamin === 'L' || p.jenisKelamin === 'Laki-laki';
  const isPrmp = p.jenisKelamin === 'P' || p.jenisKelamin === 'Perempuan';
  const title  = isLaki ? 'MR' : isPrmp ? 'MRS' : '-';
  const lines = [
    'TITLE     : ' + title,
    'GIVEN NAME: ' + depan,
    'LAST NAME : ' + belakang,
    'PASPOR    : ' + (p.noPaspor || '-'),
    'TGL LAHIR : ' + (p.tglLahir || '-'),
    'EXPIRED   : ' + (p.expiryPaspor || '-'),
    'NATIONALITY: ' + (p.kewarganegaraan || '-'),
    'KELAMIN   : ' + (isLaki ? 'M' : isPrmp ? 'F' : '-'),
  ].join('\n');
  navigator.clipboard.writeText(lines).then(() => { showToast('✅ Data ' + p.namaLengkap + ' tersalin!'); }).catch(() => {
    const el = document.createElement('textarea'); el.value = lines; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    showToast('✅ Data ' + p.namaLengkap + ' tersalin!');
  });
}

function mpxField(label, value) {
  if (!value) return '';
  const safe = escH(value);
  return `<div class="mpx-field"><span class="mpx-field-label">${label}</span><span class="mpx-field-value">${safe}</span><button class="mpx-copy-btn" onclick="copyField(this,'${safe}')" title="Salin">📋</button></div>`;
}
function copyField(btn, value) {
  navigator.clipboard.writeText(value).then(() => { btn.classList.add('copied'); btn.textContent = '✓'; setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '📋'; }, 1500); }).catch(() => {
    const el = document.createElement('textarea'); el.value = value; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    btn.classList.add('copied'); btn.textContent = '✓'; setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '📋'; }, 1500);
  });
}
function showManualForm() { document.getElementById('mpx-results').classList.remove('show'); document.getElementById('mpx-manual-form').classList.add('show'); document.getElementById('mpx-m-nama').focus(); }
function hideManualForm() { document.getElementById('mpx-manual-form').classList.remove('show'); ['mpx-m-nama','mpx-m-paspor','mpx-m-lahir','mpx-m-expired','mpx-m-nat'].forEach(id => { document.getElementById(id).value = ''; }); }
function addManualPassenger() {
  const nama = document.getElementById('mpx-m-nama').value.trim();
  if (!nama) { showToast('Nama lengkap wajib diisi'); return; }
  const p = { passengerId: 'MANUAL-' + Date.now(), namaLengkap: nama, noPaspor: document.getElementById('mpx-m-paspor').value.trim(), tglLahir: document.getElementById('mpx-m-lahir').value.trim(), expiryPaspor: document.getElementById('mpx-m-expired').value.trim(), kewarganegaraan: document.getElementById('mpx-m-nat').value.trim() || 'INDONESIA', jenisKelamin: '', fotoFileId: '' };
  multiPaxList.push(p); hideManualForm(); renderMultiPaxList(); showToast('✅ ' + nama + ' ditambahkan');
}
function formatMpxDate(val) {
  if (!val) return '';
  if (String(val).includes('T') || (String(val).includes('-') && !String(val).includes('/'))) {
    try { const d = new Date(val); if (!isNaN(d.getTime())) return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear(); } catch(e) {}
  }
  return val;
}
function showFotoPopup(e, passengerId) {
  var elId = passengerId.indexOf('foto-') === 0 || passengerId.indexOf('mdac-foto-') === 0 ? passengerId : 'foto-' + passengerId;
  const el = document.getElementById(elId); const img = el ? el.querySelector('img') : null; if (!img) return;
  const popup = document.getElementById('mpx-foto-popup'); document.getElementById('mpx-foto-popup-img').src = img.src;
  const rect = e.target.getBoundingClientRect();
  popup.style.display = 'block'; popup.style.left = Math.min(rect.right + 8, window.innerWidth - 320) + 'px'; popup.style.top = Math.max(8, rect.top - 80) + 'px';
}
function hideFotoPopup() { document.getElementById('mpx-foto-popup').style.display = 'none'; }
async function manualLookupKode() {
  const kode = prompt('Masukkan kode booking maskapai (6 huruf):'); if (!kode||!kode.trim()) return;
  const clean = kode.trim().toUpperCase(); if (!/^[A-Z]{6}$/.test(clean)) { showToast('Kode harus tepat 6 huruf'); return; }
  showToast('Mencari kode '+clean+'...');
  try { const res = await apiGet({action:'lookupKode', kode:clean}); if (res.found) { const block = document.getElementById('np-context-block'); const list = document.getElementById('np-context-list'); const loading = document.getElementById('np-context-loading'); block.style.display = 'block'; loading.textContent = 'manual lookup'; list.innerHTML = renderContextCard(res) + list.innerHTML; showToast('✅ Kode '+clean+' ditemukan!'); } else { showToast('❌ Kode '+clean+' tidak ditemukan'); } } catch(e) { showToast('Error: '+e.toString()); }
}

// ===================== DOKUMEN DI MODAL KONTAK =====================
let modalDocCache = [];
function showInnerTabById(tab) {
  document.getElementById('inner-riwayat').style.display = tab === 'riwayat' ? 'block' : 'none';
  document.getElementById('inner-passenger').style.display = tab === 'passenger' ? 'block' : 'none';
  document.getElementById('inner-dokumen').style.display = tab === 'dokumen' ? 'block' : 'none';
  if (tab === 'passenger') loadPassengers();
  if (tab === 'dokumen') loadModalDocs();
}
async function loadModalDocs() {
  if (!currentContactNoWa) return;
  const loading = document.getElementById('modal-doc-loading'); const empty = document.getElementById('modal-doc-empty'); const list = document.getElementById('modal-doc-list');
  list.innerHTML = ''; loading.style.display = 'block'; empty.style.display = 'none';
  try {
    const res = await apiGet({ action: 'getCustomerDocs', noWa: currentContactNoWa });
    loading.style.display = 'none';
    if (!res.ok || !res.docs || res.docs.length === 0) { empty.style.display = 'block'; return; }
    modalDocCache = res.docs;
    res.docs.forEach(doc => {
      const ext = (doc.namaFile || '').split('.').pop().toLowerCase();
      const isImg = ['jpg','jpeg','png','webp'].includes(ext); const isPdf = ext === 'pdf';
      const icon = isPdf ? '📄' : isImg ? '🖼️' : '📎';
      const uploadedAt = doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}) : '-';
      const ocrStatus = doc.ocrStatus || 'none';
      const ocrBadge = ocrStatus === 'done'
        ? '<span class="doc-ocr-badge ocr-done" title="Sudah di-OCR">✓ OCR</span>'
        : (isImg && ocrStatus === 'pending')
          ? `<span class="doc-ocr-badge ocr-pending" onclick="runDocOcr('${escH(doc.docId)}','${escH(doc.fileId)}','${escH(doc.namaFile)}')" title="Klik untuk scan OCR">📷 Scan OCR</span>`
          : '';
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:var(--bg);border:1px solid var(--border);';
      div.innerHTML = `<span style="font-size:20px;flex-shrink:0;">${icon}</span><div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escH(doc.namaFile)}">${escH(doc.namaFile)}${ocrBadge}</div><div style="font-size:10px;color:var(--text-muted);">${escH(doc.kategori)} · ${uploadedAt}</div></div><div style="display:flex;gap:4px;flex-shrink:0;"><button onclick="downloadDoc('${doc.fileId}','${escH(doc.namaFile)}',this)" title="Download" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:12px;">⬇️</button><button onclick="modalOpenViewer('${doc.fileId}','${escH(doc.namaFile)}')" title="Buka Viewer" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:12px;">🪟</button><button onclick="modalSendDoc('${doc.docId}','${doc.fileId}','${escH(doc.namaFile)}')" title="Kirim via WA" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:12px;">📤</button><button onclick="modalDeleteDoc('${doc.docId}','${doc.fileId}',this)" title="Hapus" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:12px;">🗑️</button></div>`;
      list.appendChild(div);
    });
  } catch(e) { loading.style.display = 'none'; empty.style.display = 'block'; }
}
function modalViewDoc(fileId, namaFile) {
  if (!fileId) return;
  const ext = (namaFile || '').split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','webp'].includes(ext)) { const params = new URLSearchParams({ fileId, docName: namaFile, nama: currentContactNama, noWa: currentContactNoWa }); window.open('/viewer.html?' + params.toString(), '_blank'); }
  else { window.open('https://drive.google.com/file/d/' + fileId + '/view', '_blank'); }
}
function modalOpenViewer(fileId, namaFile) {
  if (!fileId) return;
  const params = new URLSearchParams({ fileId, docName: namaFile || '', nama: currentContactNama || '', noWa: currentContactNoWa || '' });
  const pw = Math.min(960, window.screen.width - 80); const ph = Math.min(720, window.screen.height - 80);
  const px = Math.round((window.screen.width - pw) / 2); const py = Math.round((window.screen.height - ph) / 2);
  window.open('/viewer.html?' + params.toString(), 'goho_passport_viewer', 'width='+pw+',height='+ph+',left='+px+',top='+py+',resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no');
  showToast('🪟 Membuka GOHO Passport Viewer...');
}
async function modalSendDoc(docId, fileId, namaFile) {
  if (!currentContactNoWa) { showToast('Tidak ada nomor WA customer'); return; }
  if (!confirm('Kirim "' + namaFile + '" ke ' + currentContactNama + ' via WA?')) return;
  showToast('Mengirim...');
  try { const res = await apiPost({ action: 'sendDocToCustomer', noWa: currentContactNoWa, fileId, namaFile, roomId: '', staffName: currentStaff?.nama || 'STAFF' }); showToast(res.ok ? '✅ Dokumen terkirim!' : '❌ Gagal: ' + (res.msg || '')); } catch(e) { showToast('Error: ' + e.toString()); }
}
async function modalDeleteDoc(docId, fileId, btn) {
  if (!confirm('Hapus dokumen ini? File akan dihapus permanen.')) return;
  try {
    const res = await apiPost({ action: 'deleteCustomerDoc', docId, fileId });
    if (res.ok) { btn.closest('div[style]').remove(); const list = document.getElementById('modal-doc-list'); if (!list.children.length) document.getElementById('modal-doc-empty').style.display = 'block'; showToast('🗑️ Dokumen dihapus'); }
    else { showToast('Gagal hapus: ' + (res.msg || '')); }
  } catch(e) { showToast('Error: ' + e.toString()); }
}
async function handleModalDocUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0]; if (file.size > 15 * 1024 * 1024) { showToast('File maksimal 15MB'); input.value = ''; return; }
  const kategori = document.getElementById('modal-doc-kategori').value; const label = input.closest('label');
  label.innerHTML = '<i class="ti ti-loader spin" style="font-size:13px;"></i> Uploading...'; label.style.background = '#555';
  try {
    const base64 = await fileToBase64(file);
    const res = await apiPost({ action: 'saveCustomerDoc', noWa: currentContactNoWa, kategori, namaFile: file.name, fileType: file.type || 'application/octet-stream', fileData: base64, uploadedBy: currentStaff?.nama || 'STAFF', keterangan: '' });
    if (res.ok) { showToast('✅ ' + file.name + ' tersimpan!'); loadModalDocs(); } else { showToast('Gagal upload: ' + (res.msg || '')); }
  } catch(e) { showToast('Error: ' + e.toString()); }
  finally { label.style.background = 'var(--green-mid)'; label.innerHTML = '<i class="ti ti-upload" style="font-size:13px;"></i>&nbsp;Upload<input type="file" id="modal-doc-file-input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style="display:none;" onchange="handleModalDocUpload(this)">'; input.value = ''; }
}

// ===================== SMART NOTES =====================
window._snNoWa = '';
window._snTag  = 'TODO';
function selectNoteTag(el, tag) {
  window._snTag = tag;
  document.querySelectorAll('#modal-smart-notes .sn-tag').forEach(t => t.style.opacity = '0.5');
  el.style.opacity = '1'; el.style.fontWeight = '700';
}
function showNoteModal(noWa) {
  if (!noWa) { showToast('Pilih chat dulu'); return; }
  window._snNoWa = noWa; window._snTag = 'TODO';
  document.querySelectorAll('#modal-smart-notes .sn-tag').forEach((t, i) => { t.style.opacity = i === 0 ? '1' : '0.5'; t.style.fontWeight = i === 0 ? '700' : '500'; });
  const textEl = document.getElementById('sn-text'); if (textEl) textEl.value = '';
  document.getElementById('modal-smart-notes').style.display = 'flex';
  loadNotes(noWa);
}
async function submitNote(noWa) {
  const text = document.getElementById('sn-text')?.value.trim();
  if (!text) { showToast('Catatan tidak boleh kosong'); return; }
  if (!noWa) { showToast('Tidak ada customer yang dipilih'); return; }
  try {
    const deadline = document.getElementById('sn-deadline')?.value || null;
    const res = await apiPost({ action: 'saveSmartNote', noWa, text, tag: window._snTag || 'TODO', staffName: currentStaff?.nama || 'STAFF', deadline: deadline || null });
    if (res.ok || res.success) { document.getElementById('sn-text').value = ''; const dlEl = document.getElementById('sn-deadline'); if (dlEl) dlEl.value = ''; showToast('✅ Catatan disimpan!'); loadNotes(noWa); loadTicker(); }
    else { showToast('Gagal simpan: ' + (res.msg || 'Error')); }
  } catch(e) { showToast('Error: ' + e.toString()); }
}
async function loadNotes(noWa) {
  const listEl = document.getElementById('sn-notes-list'); const countEl = document.getElementById('sn-count');
  if (!listEl) return;
  listEl.innerHTML = '<div class="loading" style="padding:12px;">Memuat...</div>';
  try {
    const res = await apiGet({ action: 'getSmartNotes', noWa });
    const notes = res.notes || res.data || [];
    if (countEl) countEl.textContent = notes.length + ' catatan';
    if (!notes.length) { listEl.innerHTML = '<div style="font-size:11px;color:var(--text-hint);text-align:center;padding:16px;">Belum ada catatan</div>'; return; }
    const tagClass = { TODO: 'sn-tag-todo', INFO: 'sn-tag-info', PENTING: 'sn-tag-penting', DONE: 'sn-tag-done' };
    const tagEmoji = { TODO: '📌', INFO: 'ℹ️', PENTING: '⚠️', DONE: '✅' };
    listEl.innerHTML = notes.map(n => {
  const nid = escH(n.noteId||n.id||'');
  const nwa = escH(noWa);
  const ntag = n.tag||'INFO';
  const ntxt = escH(n.text||n.catatan||'');
  const ndl = n.deadline ? ' · 📅 ' + formatDeadline(n.deadline) : '';
  const isDone = ntag === 'DONE';
  return `<div class="sn-note-item" id="sn-note-${nid}">
    <div style="margin-bottom:4px;">
      <span class="sn-tag ${tagClass[ntag]||'sn-tag-info'}" style="font-size:9px;padding:2px 7px;">${tagEmoji[ntag]||'📝'} ${ntag}</span>
      ${ndl ? `<span style="font-size:9px;color:var(--text-muted);">${ndl}</span>` : ''}
    </div>
    <div class="sn-note-text">${ntxt}</div>
    <div class="sn-note-footer">
      <span class="sn-note-meta">${escH(n.staffName||'')} · ${n.createdAt?new Date(n.createdAt).toLocaleDateString('id-ID'):''}</span>
      <div style="display:flex;gap:4px;">
        ${!isDone ? `<button class="sn-done-btn" onclick="doneNote('${nid}','${nwa}')">✓ Done</button>` : '<span style="font-size:10px;color:var(--green-mid);">✅ Selesai</span>'}
        <button onclick="editSmartNote('${nid}','${nwa}')" style="background:none;border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;">✏️</button>
        <button onclick="deleteSmartNote('${nid}','${nwa}')" style="background:none;border:1px solid #fca5a5;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;color:#dc2626;">🗑️</button>
      </div>
    </div>
  </div>`;
}).join('');
  } catch(e) { listEl.innerHTML = '<div style="font-size:11px;color:var(--red);text-align:center;padding:12px;">Gagal memuat catatan</div>'; }
}
async function doneNote(noteId, noWa) {
  if (!noteId) return;
  try {
    const res = await apiPost({ action: 'doneSmartNote', noteId, noWa });
    if (res.ok || res.success) { showToast('✅ Catatan ditandai selesai'); loadNotes(noWa || window._snNoWa); }
    else { showToast('Gagal: ' + (res.msg || '')); }
  } catch(e) { showToast('Error: ' + e.toString()); }
}
async function editSmartNote(noteId, noWa) {
  const item = document.getElementById('sn-note-' + noteId);
  if (!item) return;
  const currentText = item.querySelector('.sn-note-text')?.textContent || '';
  const newText = prompt('Edit catatan:', currentText);
  if (!newText || !newText.trim()) return;
  const newDeadline = prompt('Tanggal expired (YYYY-MM-DD, kosongkan kalau tidak ada):', '');
  try {
    const res = await apiPost({ action: 'editSmartNote', noteId, text: newText.trim(), deadline: newDeadline || null });
    if (res.ok || res.success) { showToast('✅ Catatan diupdate!'); loadNotes(noWa); loadTicker(); }
    else showToast('Gagal: ' + (res.msg || ''));
  } catch(e) { showToast('Error: ' + e.toString()); }
}

async function deleteSmartNote(noteId, noWa) {
  if (!confirm('Hapus catatan ini permanen?')) return;
  try {
    const res = await apiPost({ action: 'deleteSmartNote', noteId });
    if (res.ok || res.success) { showToast('🗑️ Catatan dihapus!'); loadNotes(noWa); loadTicker(); }
    else showToast('Gagal: ' + (res.msg || ''));
  } catch(e) { showToast('Error: ' + e.toString()); }
}
// ===================== HARGA SIM/ESIM =====================
let hargaData = [];
let hargaLoaded = false;

function openHargaModal() {
  document.getElementById('modal-harga').style.display = 'flex';
  if (!hargaLoaded) loadHargaData();
}

async function loadHargaData() {
  const loading = document.getElementById('h-loading');
  const result  = document.getElementById('h-result');
  loading.style.display = 'block';
  result.innerHTML = '';
  try {
    const res = await apiGet({ action: 'getHargaSim' });
    if (!res.ok || !res.data || res.data.length === 0) {
      loading.style.display = 'none';
      result.innerHTML = '<div style="color:var(--text-muted);font-size:12px;">Data harga belum tersedia. Jalankan Sync Harga di Apps Script dulu.</div>';
      return;
    }
    hargaData = res.data;
    hargaLoaded = true;
    loading.style.display = 'none';
    const sel = document.getElementById('h-country');
    const countries = [...new Set(hargaData.map(r => r[0]))].sort();
    sel.innerHTML = '<option value="">— Pilih negara —</option>';
    countries.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
    result.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara, paket, dan durasi</div>';
  } catch(e) {
    loading.style.display = 'none';
    result.innerHTML = '<div style="color:var(--red);font-size:12px;">Gagal memuat: ' + e.toString() + '</div>';
  }
}

function hargaUpdateDay() {
  const c = document.getElementById('h-country').value;
  const selD = document.getElementById('h-day');
  const selP = document.getElementById('h-pkg');
  selD.innerHTML = '<option value="">— Pilih durasi —</option>';
  selP.innerHTML = '<option value="">— Pilih paket —</option>';
  selD.disabled = !c; selP.disabled = true;
  document.getElementById('h-result').innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih durasi dan paket</div>';
  if (!c) return;
  const days = [...new Set(hargaData.filter(r => r[0] === c).map(r => r[2]))].sort((a,b) => a-b);
  days.forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d + ' hari'; selD.appendChild(o); });
}

function hargaUpdatePkg() {
  const c = document.getElementById('h-country').value;
  const d = parseInt(document.getElementById('h-day').value);
  const selP = document.getElementById('h-pkg');
  selP.innerHTML = '<option value="">— Pilih paket —</option>';
  selP.disabled = !d;
  document.getElementById('h-result').innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih paket</div>';
  if (!d) return;
  const pkgs = [...new Set(hargaData.filter(r => r[0] === c && r[2] === d).map(r => r[1]))];
  pkgs.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; selP.appendChild(o); });
}

function hargaShowResult() {
  const c = document.getElementById('h-country').value;
  const p = document.getElementById('h-pkg').value;
  const d = parseInt(document.getElementById('h-day').value);
  const resultEl = document.getElementById('h-result');
  if (!c || !p || !d) { resultEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih semua filter</div>'; return; }
  const row = hargaData.find(r => r[0] === c && r[1] === p && r[2] === d);
  if (!row) { resultEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Data tidak tersedia untuk kombinasi ini</div>'; return; }
  const [,, day, simPub, simPar, esimPub, esimPar] = row;
  const fmt = v => v ? 'Rp ' + Number(v).toLocaleString('id-ID') : '—';
  resultEl.innerHTML = `
    <div style="display:inline-block;background:var(--bg);border:1px solid var(--border);border-radius:6px;font-size:11px;padding:3px 10px;color:var(--text-muted);margin-bottom:1rem;">${d} hari &bull; ${escH(p)}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:10px;">💳 SIM Card</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:12px;color:var(--text-muted);">Publish <span style="background:#dbeafe;color:#1d4ed8;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:600;margin-left:4px;">Customer</span></span>
          <span style="font-size:15px;font-weight:600;color:#1d4ed8;">${fmt(simPub)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
          <span style="font-size:12px;color:var(--text-muted);">Partner <span style="background:#dcfce7;color:#166534;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:600;margin-left:4px;">Agen</span></span>
          <span style="font-size:15px;font-weight:600;color:var(--text);">${fmt(simPar)}</span>
        </div>
      </div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:10px;">📱 eSIM</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:12px;color:var(--text-muted);">Publish <span style="background:#dbeafe;color:#1d4ed8;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:600;margin-left:4px;">Customer</span></span>
          <span style="font-size:15px;font-weight:600;color:#1d4ed8;">${fmt(esimPub)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
          <span style="font-size:12px;color:var(--text-muted);">Partner <span style="background:#dcfce7;color:#166534;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:600;margin-left:4px;">Agen</span></span>
          <span style="font-size:15px;font-weight:600;color:var(--text);">${fmt(esimPar)}</span>
        </div>
      </div>
    </div>`;
}
// ===================== MDAC =====================
var mdacBookingInfo = null;
var mdacPaxList = [];
var mdacSearchTimer = null;

function openMdacModal() {
  mdacBookingInfo = null;
  mdacPaxList = [];
  document.getElementById('mdac-pnr').value = '';
  document.getElementById('mdac-pnr-result').classList.remove('show');
  document.getElementById('mdac-pnr-notfound').classList.remove('show');
  document.getElementById('mdac-search-pax').value = '';
  document.getElementById('mdac-search-results').classList.remove('show');
  document.getElementById('mdac-pax-list').innerHTML = '';
  document.getElementById('mdac-alamat').value = '';
  document.getElementById('mdac-state').value = '';
  document.getElementById('mdac-city').value = '';
  document.getElementById('mdac-postcode').value = '';
  document.getElementById('mdac-accommodation').value = 'Hotel';
  document.getElementById('mdac-email').value = '';
  document.getElementById('mdac-kontak').value = '';
  document.getElementById('mdac-tgl-pulang').value = '';
  document.getElementById('mdac-summary-box').style.display = 'none';
  document.getElementById('modal-mdac').style.display = 'flex';
  // Auto-fill no kontak dari chat aktif
  if (currentRoom && currentRoom.noWa) {
    var noWaClean = currentRoom.noWa.toString().replace(/\D/g,'');
    document.getElementById('mdac-kontak').value = noWaClean;
  }
  if (window.matchMedia && !window.matchMedia('(pointer: coarse)').matches) {
    makeModalDraggable('modal-mdac');
  }
}

async function cariPnrMdac() {
  var pnr = document.getElementById('mdac-pnr').value.trim().toUpperCase();
  var notfoundBox = document.getElementById('mdac-pnr-notfound');
  var resultBox   = document.getElementById('mdac-pnr-result');
  notfoundBox.classList.remove('show');
  resultBox.classList.remove('show');
  mdacBookingInfo = null;
  if (!pnr) return;

  try {
    var res = await apiGet({ action: 'cariBookingPnrMdac', kodePnr: pnr });
    if (!res.found || !res.bookings || res.bookings.length === 0) {
      notfoundBox.classList.add('show');
      return;
    }
    var b = res.bookings[0];
    mdacBookingInfo = b;
    document.getElementById('mdac-result-nama').textContent     = b.namaTamu || '-';
    document.getElementById('mdac-result-maskapai').textContent = b.maskapai || '-';
    document.getElementById('mdac-result-flight').textContent   = b.kodeFlight || '-';
    document.getElementById('mdac-result-rute').textContent     = b.rute || '-';
    document.getElementById('mdac-result-tgl').textContent      = b.tglTerbang || '-';
    resultBox.classList.add('show');
    
    // Auto-fill kontak dari noWa customer di chat aktif (kalau belum diisi)
    var kontakInput = document.getElementById('mdac-kontak');
    if (!kontakInput.value && currentRoom && currentRoom.noWa) {
      kontakInput.value = currentRoom.noWa.toString().replace(/\D/g,'');
    }

    // v33: auto-fill tanggal pulang kalau tiket PP dan tgl pulang sudah ada di booking.
    // Kalau one-way atau tgl pulang kosong, biarkan field kosong supaya staff isi manual
    // (estimasi lama tinggal), JANGAN dipaksa isi supaya tidak salah data.
    var tglPulangInput = document.getElementById('mdac-tgl-pulang');
    if (b.jenisTiket && b.jenisTiket.indexOf('PP') !== -1 && b.tglPulang) {
      // Konversi dd/MM/yyyy -> yyyy-MM-dd untuk input type="date"
      var parts = b.tglPulang.split('/');
      if (parts.length === 3) {
        tglPulangInput.value = parts[2] + '-' + parts[1] + '-' + parts[0];
      }
    } else {
      tglPulangInput.value = '';
    }
  } catch (e) {
    notfoundBox.classList.add('show');
  }
}


function searchPaxMdac(query) {
  clearTimeout(mdacSearchTimer);
  var results = document.getElementById('mdac-search-results');
  if (!query || query.trim().length < 2) { results.classList.remove('show'); return; }
  mdacSearchTimer = setTimeout(async function() {
    try {
      var res = await apiGet({ action: 'getPassengersByName', query: query.trim() });
      if (!res.ok || !res.passengers || res.passengers.length === 0) {
        results.innerHTML = '<div style="padding:8px 10px;font-size:12px;color:var(--text-muted);">Tidak ditemukan</div>';
        results.classList.add('show');
        return;
      }
      results.innerHTML = res.passengers.map(function(p, idx) {
        return '<div class="mpx-result-item" onclick="pilihPaxMdac(' + idx + ')">' +
          '<div class="mpx-result-foto" id="mdac-foto-' + p.passengerId + '" onclick="event.stopPropagation();showFotoPopup(event,\'mdac-foto-' + p.passengerId + '\')" onmouseenter="showFotoPopup(event,\'mdac-foto-' + p.passengerId + '\')" onmouseleave="hideFotoPopup()">' + getInitials(p.namaLengkap) + '</div>' +
          '<div class="mpx-result-info">' +
            '<div class="mpx-result-nama">' + escH(p.namaLengkap) + '</div>' +
            '<div class="mpx-result-paspor">' + (p.noPaspor || '-') + ' · ' + (p.tglLahir || '-') + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      window._mdacSearchOptions = res.passengers;
      results.classList.add('show');
      res.passengers.forEach(function(p) {
        if (p.fotoFileId) loadFotoPreview('mdac-foto-' + p.passengerId, p.fotoFileId);
      });
    } catch(e) {
      results.innerHTML = '<div style="padding:8px 10px;font-size:12px;color:var(--red);">Error mencari</div>';
      results.classList.add('show');
    }
  }, 350);
}
function pilihPaxMdac(idx) {
  var p = window._mdacSearchOptions[idx];
  if (!p) return;
  if (mdacPaxList.find(function(x) { return x.noPaspor === p.noPaspor && p.noPaspor; })) {
    showToast('Peserta ini sudah ditambahkan');
    return;
  }
  mdacPaxList.push(p);
  document.getElementById('mdac-search-pax').value = '';
  document.getElementById('mdac-search-results').classList.remove('show');
  renderMdacPaxList();
}

function hapusPaxMdac(idx) {
  mdacPaxList.splice(idx, 1);
  renderMdacPaxList();
}

function renderMdacPaxList() {
  var list = document.getElementById('mdac-pax-list');
  if (mdacPaxList.length === 0) {
    list.innerHTML = '<div style="font-size:11px;color:var(--text-hint);padding:8px 0;">Belum ada peserta ditambahkan</div>';
    return;
  }
  list.innerHTML = mdacPaxList.map(function(p, i) {
    return '<div class="mdac-pax-card"><b>' + (i+1) + '.</b> ' + escH(p.namaLengkap) +
      ' <span style="color:var(--text-muted);font-size:11px;">(' + (p.noPaspor||'-') + ')</span>' +
      '<button onclick="hapusPaxMdac(' + i + ')" title="Hapus">✕</button></div>';
  }).join('');
}

function prosesMdac() {
  if (!mdacBookingInfo) { showToast('Cari PNR yang valid dulu'); return; }
  if (mdacPaxList.length === 0) { showToast('Tambahkan minimal 1 peserta'); return; }
  var alamat        = document.getElementById('mdac-alamat').value.trim();
  var state         = document.getElementById('mdac-state').value.trim();
  var city          = document.getElementById('mdac-city').value.trim();
  var postcode      = document.getElementById('mdac-postcode').value.trim();
  var accommodation = document.getElementById('mdac-accommodation').value.trim();
  var email         = document.getElementById('mdac-email').value.trim();
  var kontak        = document.getElementById('mdac-kontak').value.trim();
  if (!alamat || !email || !kontak) { showToast('Lengkapi alamat, email, dan nomor kontak'); return; }

  // v33 MDAC: tanggal kembali (Date of Departure) — diisi staff di field
  // mdac-tgl-pulang (lihat HTML baru), karena belum ada kolom one-way/PP
  // di Form Responses 1. Field ini WAJIB untuk form MDAC asli.
  var tglPulang = document.getElementById('mdac-tgl-pulang').value.trim();
  if (!tglPulang) { showToast('Isi tanggal kembali / keluar dari Malaysia'); return; }

  var lines = [];
  lines.push('=== RINGKASAN DATA MDAC ===');
  lines.push('Maskapai   : ' + mdacBookingInfo.maskapai);
  lines.push('No Flight  : ' + mdacBookingInfo.kodeFlight);
  lines.push('Rute       : ' + mdacBookingInfo.rute);
  lines.push('Tgl Datang : ' + mdacBookingInfo.tglTerbang);
  lines.push('Tgl Pulang : ' + tglPulang);
  lines.push('Mode Travel: AIR');
  lines.push('Last Port  : INDONESIA');
  lines.push('Accommodation : ' + accommodation);
  lines.push('Alamat/Hotel  : ' + alamat);
  if (state)    lines.push('State         : ' + state);
  if (city)     lines.push('City          : ' + city);
  if (postcode) lines.push('Postcode      : ' + postcode);
  lines.push('Email         : ' + email);
  lines.push('Kontak        : ' + kontak);
  lines.push('');
  mdacPaxList.forEach(function(p, i) {
    var kelamin = p.jenisKelamin === 'L' || p.jenisKelamin === 'Laki-laki' ? 'MALE'
                : p.jenisKelamin === 'P' || p.jenisKelamin === 'Perempuan' ? 'FEMALE'
                : '-';
    var kewarganegaraan = p.kewarganegaraan || 'INDONESIA';
    lines.push('--- Peserta ' + (i+1) + ' ---');
    lines.push('Nama         : ' + p.namaLengkap);
    lines.push('No Paspor    : ' + (p.noPaspor || '-'));
    lines.push('Tgl Lahir    : ' + (p.tglLahir || '-'));
    lines.push('Sex          : ' + kelamin);
    lines.push('Exp Paspor   : ' + (p.expiryPaspor || '-'));
    lines.push('Kewarganegaraan: ' + kewarganegaraan);
    lines.push('Tempat Lahir : ' + kewarganegaraan); // asumsi tempat lahir = kewarganegaraan
    lines.push('');
  });

  var ringkasanText = lines.join('\n');
  var summaryBox = document.getElementById('mdac-summary-box');
  summaryBox.textContent = ringkasanText;
  summaryBox.style.display = 'block';

  var _mdacMsg = { type: 'GOHO_MDAC_DATA', ringkasan: ringkasanText };
  var _mdacRetry = 0;
  var _mdacSend = function() {
  window.postMessage(_mdacMsg, '*');
  if (_mdacRetry++ < 3) setTimeout(_mdacSend, 300);
  };
  _mdacSend();

  window.open('https://imigresen-online.imi.gov.my/mdac/main?registerMain', '_blank');
  showToast('✅ Data dikirim ke extension — form MDAC dibuka otomatis');
  }

// ===================== TICKER REMINDER =====================
let _tickerReminders = [];

async function loadTicker() {
  try {
    const res = await apiGet({ action: 'getReminders' });
    if (!res.ok || !res.reminders || res.reminders.length === 0) {
      document.getElementById('ticker-bar').style.display = 'none';
      return;
    }
    _tickerReminders = res.reminders;
    const tagEmoji = { TODO: '📌', INFO: 'ℹ️', PENTING: '⚠️', DONE: '✅' };
    const parts = res.reminders.map(r => {
      const emoji = tagEmoji[r.tag] || '📌';
      const tgl = r.deadline ? ' · ' + formatDeadline(r.deadline) : '';
      return emoji + ' ' + escH(r.namaCustomer) + ': ' + escH(r.text) + tgl;
    });
    document.getElementById('ticker-text').innerHTML = parts.join('<span style="color:#f59e0b; margin:0 30px; font-weight:900;">┃</span>');
    const bar = document.getElementById('ticker-bar');
const track = document.getElementById('ticker-track');
bar.style.display = 'block';
track.style.animation = 'none';
track.offsetHeight;
track.style.animation = '';
  } catch(e) {}
}

function formatDeadline(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.round((d - today) / 86400000);
    if (diff === 0) return '⚡ HARI INI';
    if (diff === 1) return '⏰ Besok';
    if (diff <= 3) return '⏳ ' + diff + ' hari lagi';
    return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short' });
  } catch(e) { return dateStr; }
}

function openReminderModal() {
  if (!_tickerReminders.length) return;
  const tagEmoji = { TODO: '📌', INFO: 'ℹ️', PENTING: '⚠️', DONE: '✅' };
  const tagColor = { TODO: '#854d0e', INFO: '#1e3a5f', PENTING: '#7f1d1d', DONE: '#14532d' };
  const html = _tickerReminders.map(r => `
    <div style="padding:10px 12px;border-radius:8px;background:var(--bg);border:1px solid var(--border);margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="background:${tagColor[r.tag]||'#333'};color:white;font-size:9px;padding:2px 7px;border-radius:4px;font-weight:700;">${tagEmoji[r.tag]||'📌'} ${r.tag}</span>
        <span style="font-size:11px;font-weight:600;color:var(--text);">${escH(r.namaCustomer)}</span>
        <span style="margin-left:auto;font-size:10px;color:${r.deadline?'#c05c00':'var(--text-muted)'};">${formatDeadline(r.deadline)}</span>
      </div>
      <div style="font-size:12px;color:var(--text);">${escH(r.text)}</div>
    </div>`).join('');
  let modal = document.getElementById('modal-reminders');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-reminders';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML = `<div class="modal-box modal-sm">
      <div class="modal-header"><h3>🔔 Reminder Aktif</h3><button onclick="closeModal('modal-reminders')">✕</button></div>
      <div class="modal-body" id="modal-reminders-body" style="max-height:400px;overflow-y:auto;"></div>
    </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('modal-reminders-body').innerHTML = html;
  modal.style.display = 'flex';
}

// ===================== GLOBAL REMINDER MODAL =====================
let _grType = 'global';
let _grTag = 'TODO';
let _grSelectedNoWa = '';
let _grSearchTimer = null;

function openGlobalReminderModal() {
  _grType = 'global'; _grTag = 'TODO'; _grSelectedNoWa = '';
  document.getElementById('gr-text').value = '';
  document.getElementById('gr-deadline').value = '';
  document.getElementById('gr-customer-search').value = '';
  document.getElementById('gr-customer-selected').style.display = 'none';
  document.getElementById('gr-customer-row').style.display = 'none';
  document.getElementById('gr-customer-results').style.display = 'none';
  setGrType('global');
  document.getElementById('modal-global-reminder').style.display = 'flex';
  loadGrList();
}

function setGrType(type) {
  _grType = type;
  const btnGlobal = document.getElementById('gr-type-global');
  const btnCustomer = document.getElementById('gr-type-customer');
  const customerRow = document.getElementById('gr-customer-row');
  if (type === 'global') {
    btnGlobal.style.background = 'var(--green-mid)'; btnGlobal.style.color = 'white'; btnGlobal.style.borderColor = 'var(--green-mid)';
    btnCustomer.style.background = 'white'; btnCustomer.style.color = 'var(--text)'; btnCustomer.style.borderColor = 'var(--border)';
    customerRow.style.display = 'none';
  } else {
    btnCustomer.style.background = 'var(--green-mid)'; btnCustomer.style.color = 'white'; btnCustomer.style.borderColor = 'var(--green-mid)';
    btnGlobal.style.background = 'white'; btnGlobal.style.color = 'var(--text)'; btnGlobal.style.borderColor = 'var(--border)';
    customerRow.style.display = 'block';
  }
}

function setGrTag(el, tag) {
  _grTag = tag;
  document.querySelectorAll('#modal-global-reminder .sn-tag').forEach(t => { t.style.opacity = '0.5'; t.style.fontWeight = '500'; });
  el.style.opacity = '1'; el.style.fontWeight = '700';
}

function searchGrContact(query) {
  clearTimeout(_grSearchTimer);
  const results = document.getElementById('gr-customer-results');
  if (!query || query.trim().length < 2) { results.style.display = 'none'; return; }
  _grSearchTimer = setTimeout(() => {
    const q = query.toLowerCase();
    const matches = allContactsCache.filter(c =>
      String(c.nama||'').toLowerCase().includes(q) ||
      String(c.noWa||'').toLowerCase().includes(q)
    ).slice(0, 6);
    if (!matches.length) { results.innerHTML = '<div style="padding:8px;font-size:11px;color:var(--text-muted);">Tidak ditemukan</div>'; results.style.display = 'block'; return; }
    results.innerHTML = matches.map(c => `<div onclick="selectGrContact('${escH(c.noWa)}','${escH(c.nama||c.noWa)}')" style="padding:8px 10px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='white'"><div style="width:28px;height:28px;border-radius:50%;background:var(--green-mid);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;">${getInitials(c.nama||c.noWa)}</div><div><div style="font-weight:600;">${escH(c.nama||c.noWa)}</div><div style="font-size:10px;color:var(--text-muted);">${c.noWa}</div></div></div>`).join('');
    results.style.display = 'block';
  }, 300);
}

function selectGrContact(noWa, nama) {
  _grSelectedNoWa = noWa;
  document.getElementById('gr-customer-search').value = nama + ' (' + noWa + ')';
  document.getElementById('gr-customer-results').style.display = 'none';
  const sel = document.getElementById('gr-customer-selected');
  sel.textContent = '✅ ' + nama + ' · ' + noWa;
  sel.style.display = 'block';
}

async function submitGlobalReminder() {
  const text = document.getElementById('gr-text').value.trim();
  if (!text) { showToast('Isi reminder tidak boleh kosong'); return; }
  const noWa = _grType === 'customer' ? _grSelectedNoWa : 'GLOBAL';
  if (_grType === 'customer' && !noWa) { showToast('Pilih customer dulu'); return; }
  const deadline = document.getElementById('gr-deadline').value || null;
  try {
    const res = await apiPost({ action: 'saveSmartNote', noWa, text, tag: _grTag, staffName: currentStaff?.nama || 'STAFF', deadline });
    if (res.ok || res.success) {
      showToast('✅ Reminder disimpan!');
      document.getElementById('gr-text').value = '';
      document.getElementById('gr-deadline').value = '';
      _grSelectedNoWa = '';
      document.getElementById('gr-customer-selected').style.display = 'none';
      document.getElementById('gr-customer-search').value = '';
      loadGrList();
      loadTicker();
    } else showToast('Gagal: ' + (res.msg || ''));
  } catch(e) { showToast('Error: ' + e.toString()); }
}

async function loadGrList() {
  const el = document.getElementById('gr-list');
  const countEl = document.getElementById('gr-count');
  if (!el) return;
  el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:8px;">Memuat...</div>';
  try {
    const res = await apiGet({ action: 'getReminders' });
    const all = res.reminders || [];
    countEl.textContent = all.length + ' aktif';
    if (!all.length) { el.innerHTML = '<div style="font-size:11px;color:var(--text-hint);text-align:center;padding:16px;">Belum ada reminder aktif</div>'; return; }
    const tagEmoji = { TODO: '📌', INFO: 'ℹ️', PENTING: '⚠️' };
    const tagColor = { TODO: '#854d0e', INFO: '#1e3a5f', PENTING: '#7f1d1d' };
    el.innerHTML = all.map(r => `
      <div style="padding:8px 10px;border-radius:8px;background:var(--bg);border:1px solid var(--border);margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="background:${tagColor[r.tag]||'#333'};color:white;font-size:9px;padding:1px 6px;border-radius:4px;font-weight:700;">${tagEmoji[r.tag]||'📌'} ${r.tag}</span>
          <span style="font-size:10px;font-weight:600;color:var(--text);">${escH(r.namaCustomer === 'GLOBAL' ? '🌐 Internal' : r.namaCustomer)}</span>
          ${r.deadline ? `<span style="margin-left:auto;font-size:10px;color:#c05c00;">${formatDeadline(r.deadline)}</span>` : ''}
        </div>
        <div style="font-size:11px;color:var(--text);margin-bottom:4px;">${escH(r.text)}</div>
        <div style="display:flex;gap:4px;justify-content:flex-end;">
          <button onclick="deleteGrReminder(${r.noteId})" style="background:none;border:1px solid #fca5a5;border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer;color:#dc2626;">🗑️ Hapus</button>
        </div>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div style="font-size:11px;color:var(--red);padding:8px;">Gagal memuat</div>'; }
}

async function deleteGrReminder(noteId) {
  if (!confirm('Hapus reminder ini?')) return;
  try {
    const res = await apiPost({ action: 'deleteSmartNote', noteId: String(noteId) });
    if (res.ok || res.success) { showToast('🗑️ Reminder dihapus!'); loadGrList(); loadTicker(); }
    else showToast('Gagal: ' + (res.msg || ''));
  } catch(e) { showToast('Error: ' + e.toString()); }
}
