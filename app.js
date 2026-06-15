const API = '/api/proxy';
let currentStaff = null, currentRoom = null, currentTab = 'aktif', currentMainTab = 'chat';
let allChats = [], allRoomsCache = [], allContactsCache = [];
let currentContactNoWa = '', currentContactNama = '';
let pollInterval = null, lastMsgCount = 0, unreadCounts = {}, lastSeenAt = {};

// ===================== SESSION MANAGEMENT =====================
function saveSession(staff) {
  const session = { staff: staff, expiry: Date.now() + (30 * 24 * 60 * 60 * 1000) };
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
  if (currentStaff.role === 'OWNER') {
    document.getElementById('nav-badge').classList.remove('hidden');
    document.getElementById('nav-av').classList.add('owner');
    document.getElementById('main-tabs').classList.add('visible');
  }
  startPolling(); loadChats(); showSoundActivation();
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
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function escH(str) { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
async function apiGet(params) {
  params._t = Date.now();
  const query = new URLSearchParams(params).toString();
  try { const r = await fetch('/api/proxy?' + query, { method: 'GET', cache: 'no-store' }); return JSON.parse(await r.text()); }
  catch(e) { return {ok: false, msg: e.toString()}; }
}
async function apiPost(body) { const r = await fetch(API, { method: 'POST', body: JSON.stringify(body) }); return r.json(); }
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
  ['chat','contacts','dashboard','allchats'].forEach(t => {
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

// ===================== POLLING =====================
function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  apiGet({action: 'getWaitingQueue'}).then(res => { if (res.ok) lastWaitingRooms = new Set(res.data.map(c => c.roomId)); });
  pollInterval = setInterval(() => { loadStats(); if (currentRoom) loadMessages(currentRoom.roomId, false); if (currentMainTab === 'chat') loadChats(false); if (currentMainTab === 'dashboard') loadOwnerStats(); }, 4000);
  setInterval(async () => { try { const res = await apiGet({action: 'getWaitingQueue'}); if (res.ok) checkNewChats(res.data); } catch(e) {} }, 5000);
}
async function loadStats() {
  try { const res = await apiGet({action: 'getDashboardStats'}); if (res.ok) { document.getElementById('stat-bot').textContent = res.data.bot || 0; document.getElementById('stat-waiting').textContent = res.data.waiting || 0; document.getElementById('stat-active').textContent = res.data.active || 0; document.getElementById('stat-selesai').textContent = res.data.selesai || 0; } } catch(e) {}
}

// ===================== CHAT LIST =====================
async function loadChats(showLoading = true) {
  if (showLoading) document.getElementById('chat-list').innerHTML = '<div class="loading">Memuat...</div>';
  try {
    let res;
    if (currentTab === 'aktif') {
      if (currentStaff.role === 'OWNER') { res = await apiGet({action: 'getAllChats'}); }
      else {
        const [waitRes, myRes] = await Promise.all([apiGet({action: 'getWaitingQueue'}), apiGet({action: 'getMyChats', staffName: currentStaff.nama})]);
        const combined = []; const seen = new Set();
        [...(waitRes.data || []), ...(myRes.data || [])].forEach(c => { if (!seen.has(c.roomId)) { seen.add(c.roomId); combined.push(c); } });
        res = { ok: true, data: combined };
      }
    } else { res = await apiGet({action: 'getClosedChats'}); }
    if (res.ok) {
      allChats = res.data || [];
      if (allContactsCache.length === 0) { try { const cRes = await apiGet({action: 'getAllCustomers', query: ''}); allContactsCache = cRes.customers || []; } catch(e) {} }
      allChats = allChats.map(c => { const contact = allContactsCache.find(ct => ct.noWa === c.noWa); if (contact && contact.nama) c.nama = contact.nama; return c; });
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
      </div>
    </div>
  </div>`;
}

// ===================== OPEN CHAT =====================
async function openChat(roomId) {
  const chat = allChats.find(c => c.roomId === roomId); if (!chat) return;
  if ((chat.status === 'WAITING' || chat.status === 'NEED_HUMAN') && !chat.assignedTo) {
    const res = await apiPost({action: 'assignChat', roomId: chat.roomId, staffName: currentStaff.nama});
    if (res.ok) { chat.status = 'ASSIGNED'; chat.assignedTo = currentStaff.nama; }
  }
  currentRoom = chat; lastMsgCount = 0; unreadCounts[roomId] = 0;
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
  loadCustomerInfoPanel(chat.noWa); loadSmartContext(chat.roomId, chat.noWa); renderActionRow(chat);
  await loadMessages(roomId, true);
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.add('slide-out');
  renderChatList(allChats);
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
}
async function loadPanelBookingHistory(noWa) {
  try {
    const res = await apiGet({action: 'getBookingHistory', noWa});
    const loading = document.getElementById('np-history-loading'); const list = document.getElementById('np-history-list'); if (!loading || !list) return;
    if (res.history && res.history.length > 0) {
      loading.textContent = res.total + ' booking';
      const icon = {PESAWAT:'✈️', HOTEL:'🏨', TOUR:'🌴', ATRAKSI:'🎡'};
      list.innerHTML = res.history.map(h => `<div style="padding:5px 0;border-bottom:1px solid var(--border);font-size:11px;"><div style="font-weight:600;color:var(--text);">${icon[h.tipe]||'📋'} ${escH(h.detail)}</div><div style="color:var(--text-muted);">📅 ${h.tglEvent} · ${escH(h.extra)}</div></div>`).join('');
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
  if (isMyChat || isOwner) {
    row.innerHTML = `<button class="abtn abtn-note" onclick="showNoteInput()"><i class="ti ti-notes"></i> Catatan</button><button class="abtn abtn-multipax" onclick="toggleMultiPax()"><i class="ti ti-users"></i> Multi Pax</button><button class="abtn abtn-booked" onclick="tandaiBooked()"><i class="ti ti-check"></i> Booked</button><button class="abtn abtn-lepas" onclick="lepasChat()"><i class="ti ti-logout"></i> Lepas</button><button class="abtn abtn-selesai" onclick="selesaiChat()"><i class="ti ti-circle-check"></i> Selesai</button>`;
    reply.style.display = 'flex';
  } else { row.innerHTML = `<div style="font-size:11px;color:var(--text-muted);padding:4px;">Di-handle oleh ${escH(chat.assignedTo)}</div>`; reply.style.display = 'none'; uploadBar.classList.remove('show'); }
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
        el.innerHTML = '<img src="' + imgCache[fileId] + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="window.open(this.src,\'_blank\')">';
        imgObserver.unobserve(el);
        return;
      }

      if (el.dataset.loaded) return;
      el.dataset.loaded = '1';
      imgObserver.unobserve(el);

      // Tampil spinner saat loading
      el.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">⏳</div>';

      fetch('/api/proxy?action=getImageBase64&fileId=' + encodeURIComponent(fileId))
        .then(r => r.json())
        .then(data => {
          if (data.base64) {
            const src = 'data:' + (data.mimeType || mimeType) + ';base64,' + data.base64;
            imgCache[fileId] = src; // simpan ke cache
            el.innerHTML = '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="window.open(this.src,\'_blank\')">';
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
        el.innerHTML = '<img src="' + imgCache[fid] + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="window.open(this.src,\'_blank\')">';
      } else if (imgObserver) {
        imgObserver.observe(el);
      }
    });

  } catch(e) { console.error('fetchMessages error:', e); }
}

function renderBubble(m) {
  const isStaff = m.sender === 'STAFF'; const isBot = m.sender === 'BOT'; const cls = isStaff ? 'b-staff' : (isBot ? 'b-bot' : 'b-cust');

  // Deteksi pesan file biasa (PDF / non-gambar)
  const fileMatch = m.message && typeof m.message === 'string' && m.message.match(/^📎 (.+)\n(https?:\/\/.+)$/);
  if (fileMatch) {
    const fileName = fileMatch[1]; const fileUrl = fileMatch[2]; const ispdf = fileName.toLowerCase().endsWith('.pdf');
    const checkmark = isStaff ? '<span class="b-checkmark">✓</span>' : '';
    return `<div class="bw ${isStaff?'right':''}"><div class="bubble ${cls}">${isBot ? `<div class="b-bot-lbl">GOHO Bot</div>` : ''}<div class="b-file"><i class="ti ti-${ispdf?'file-type-pdf':'file'}"></i><div class="b-file-info"><div class="b-file-name">${escH(fileName)}</div><a class="b-file-link" href="${escH(fileUrl)}" target="_blank">📥 Download / Lihat</a></div></div><div class="b-meta">${formatTime(m.timestamp)}${checkmark}</div></div></div>`;
  }

  // Deteksi pesan gambar dengan fileId (format: [IMG:fileId:namaFile])
  const imgMatch = m.message && typeof m.message === 'string' && m.message.match(/^\[IMG:([^:]+):(.+)\]$/);
  if (imgMatch) {
    const fileId = imgMatch[1]; const namaFile = imgMatch[2];
    const checkmark = isStaff ? '<span class="b-checkmark">✓</span>' : '';
    // Kalau sudah di cache, render langsung tanpa placeholder
    if (imgCache[fileId]) {
      return `<div class="bw ${isStaff?'right':''}"><div class="bubble ${cls}">${isBot ? `<div class="b-bot-lbl">GOHO Bot</div>` : ''}<div class="b-img-lazy" data-file-id="${escH(fileId)}" data-loaded="1" style="width:200px;height:140px;border-radius:8px;overflow:hidden;"><img src="${imgCache[fileId]}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="window.open(this.src,'_blank')"></div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">${escH(namaFile)}</div><div class="b-meta">${formatTime(m.timestamp)}${checkmark}</div></div></div>`;
    }
    return `<div class="bw ${isStaff?'right':''}"><div class="bubble ${cls}">${isBot ? `<div class="b-bot-lbl">GOHO Bot</div>` : ''}<div class="b-img-lazy" data-file-id="${escH(fileId)}" data-mime="image/jpeg">🖼️</div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">${escH(namaFile)}</div><div class="b-meta">${formatTime(m.timestamp)}${checkmark}</div></div></div>`;
  }

  // Bubble teks biasa
  const checkmark = isStaff ? '<span class="b-checkmark">✓</span>' : '';
  return `<div class="bw ${isStaff?'right':''}"><div class="bubble ${cls}">${isBot ? `<div class="b-bot-lbl">GOHO Bot</div>` : ''}<div class="b-txt">${escH(m.message)}</div><div class="b-meta">${formatTime(m.timestamp)}${checkmark}</div></div></div>`;
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
  if (!currentRoom) return; const input = document.getElementById('reply-input'); const msg = input.value.trim(); if (!msg) return;
  input.value = ''; input.style.height = 'auto';
  const res = await apiPost({action: 'sendMessage', roomId: currentRoom.roomId, staffName: currentStaff.nama, noWa: currentRoom.noWa, message: msg});
  if (res.ok) { lastMsgCount = 0; await loadMessages(currentRoom.roomId, true); loadChats(false); }
  else { showToast('Gagal kirim pesan'); input.value = msg; autoExpandTextarea(input); }
}
function handleReplyKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } }
async function showNoteInput() { const note = prompt('Catatan internal:'); if (!note || !note.trim()) return; const res = await apiPost({action: 'addNote', roomId: currentRoom.roomId, staffName: currentStaff.nama, note: note.trim()}); if (res.ok) showToast('Catatan disimpan'); }
function backToList() { document.getElementById('sidebar').classList.remove('slide-out'); currentRoom = null; lastMsgCount = 0; }
function refreshAll() { loadChats(); showToast('Diperbarui'); }

// ===================== FILE UPLOAD =====================
async function handleFileUpload(input) {
  if (!input.files || !input.files[0]) return; if (!currentRoom) { showToast('Pilih chat dulu'); input.value = ''; return; }
  const file = input.files[0]; if (file.size > 10 * 1024 * 1024) { showToast('File terlalu besar, maksimal 10MB'); input.value = ''; return; }
  const bar = document.getElementById('upload-bar'); const status = document.getElementById('upload-status'); bar.classList.add('show'); status.textContent = 'Mengupload ' + file.name + '...';
  try {
    const base64 = await fileToBase64(file);
    const res = await apiPost({action: 'sendFile', roomId: currentRoom.roomId, staffName: currentStaff.nama, noWa: currentRoom.noWa, fileName: file.name, fileType: file.type || 'application/octet-stream', fileData: base64});
    if (res.ok) { status.textContent = '✅ ' + file.name + ' berhasil dikirim!'; setTimeout(() => bar.classList.remove('show'), 3000); lastMsgCount = 0; await loadMessages(currentRoom.roomId, true); loadChats(false); showToast('File berhasil dikirim ke customer'); }
    else { status.textContent = '❌ Gagal: ' + (res.msg || 'Error'); setTimeout(() => bar.classList.remove('show'), 4000); showToast('Gagal kirim file: ' + (res.msg || '')); }
  } catch(e) { status.textContent = '❌ Error: ' + e.toString(); setTimeout(() => bar.classList.remove('show'), 4000); }
  finally { input.value = ''; }
}
function fileToBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = () => reject(new Error('Gagal membaca file')); reader.readAsDataURL(file); }); }

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
  if (filtered.length > 0) { list.innerHTML = filtered.map(c => `<div class="contact-card" onclick="openContactDetail('${escH(c.noWa)}', '${escH(c.nama)}')"><div class="contact-avatar">${(c.nama || '?').charAt(0).toUpperCase()}</div><div class="contact-info"><div class="contact-name">${c.nama ? escH(c.nama) : '<span style="color:var(--text-hint);font-style:italic;">Belum ada nama</span>'}</div><div class="contact-wa">📱 ${c.noWa}</div><div class="contact-meta">${c.kota ? '📍 '+escH(c.kota)+' · ' : ''}${c.source || 'WA'}</div></div><div class="contact-actions">${c.totalBooking > 0 ? `<div class="contact-badge">${c.totalBooking}x booking</div>` : ''}<button class="btn-chat" onclick="event.stopPropagation();openNewChatModal('${escH(c.noWa)}','${escH(c.nama)}')"><i class="ti ti-message-circle"></i> Chat</button></div></div>`).join(''); }
  else { list.innerHTML = '<div class="empty-state">Belum ada contact</div>'; }
}
function searchContacts() { loadContacts(document.getElementById('contact-search')?.value || ''); }
function showAddContact() { allContactsCache = []; document.getElementById('modal-contact-title').textContent = 'Tambah Contact'; ['c-nama','c-nowa','c-email','c-kota','c-catatan','c-original-nowa'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); document.getElementById('modal-contact').style.display = 'flex'; }
async function submitContact() {
  const nama = document.getElementById('c-nama').value.trim(); const noWa = document.getElementById('c-nowa').value.trim(); if (!nama || !noWa) { alert('Nama dan No WA wajib diisi'); return; }
  try { const res = await apiPost({action: 'saveCustomer', nama, noWa, email: document.getElementById('c-email').value.trim(), kota: document.getElementById('c-kota').value.trim(), catatan: document.getElementById('c-catatan').value.trim(), source: 'MANUAL'}); if (res.success) { allContactsCache = []; closeModal('modal-contact'); loadContacts(); showToast('Contact disimpan!'); } else showToast('Gagal menyimpan'); } catch(e) { showToast('Error: ' + e); }
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
function editContact() { allContactsCache = []; closeModal('modal-detail'); document.getElementById('modal-contact-title').textContent = 'Edit Contact'; document.getElementById('c-nowa').value = currentContactNoWa; document.getElementById('c-original-nowa').value = currentContactNoWa; document.getElementById('modal-contact').style.display = 'flex'; }
function showAddPassenger() { document.getElementById('modal-passenger').style.display = 'flex'; }
async function submitPassenger() {
  const nama = document.getElementById('p-nama').value.trim(); if (!nama) { alert('Nama lengkap wajib diisi'); return; }
  try { const res = await apiPost({action: 'savePassenger', noWaCustomer: currentContactNoWa, namaLengkap: nama, jenisKelamin: document.getElementById('p-jk').value, tglLahir: document.getElementById('p-tgl').value, noKtp: document.getElementById('p-ktp').value.trim(), noPaspor: document.getElementById('p-paspor').value.trim(), expiryPaspor: document.getElementById('p-expiry').value, kewarganegaraan: document.getElementById('p-warga').value.trim()}); if (res.success) { closeModal('modal-passenger'); loadPassengers(); showToast('Penumpang disimpan!'); } } catch(e) { showToast('Error: ' + e); }
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
function renderDocList(docs) {
  const el = document.getElementById('doc-list');
  if (!docs || docs.length === 0) { el.innerHTML = '<div class="doc-empty">Belum ada dokumen<br><span style="font-size:10px;">Klik Upload untuk tambah</span></div>'; return; }
  const groups = {}; docs.forEach(d => { if (!groups[d.kategori]) groups[d.kategori] = []; groups[d.kategori].push(d); });
  let html = '';
  Object.keys(groups).forEach(kat => {
    html += `<div class="doc-category-title"><span>${kat}</span><span style="font-size:9px;">${groups[kat].length} file</span></div>`;
    groups[kat].forEach(d => {
      const safeId = escH(d.docId); const safeFile = escH(d.fileId); const safeName = escH(d.namaFile);
      html += `<div class="doc-item"><div class="doc-item-icon">${getDocIcon(d.namaFile, d.kategori)}</div><div class="doc-item-info"><div class="doc-item-name" title="${safeName}">${escH(truncateFileName(d.namaFile, 26))}</div></div><div class="doc-item-acts"><div class="doc-act-btn" onclick="viewDoc('${safeFile}')" title="Lihat">👁️</div><div class="doc-act-btn" onclick="sendDocToCustomer('${safeId}','${safeFile}','${safeName}')" title="Kirim ke tamu">📤</div>${isImageFile(d.namaFile) ? `<div class="doc-act-btn" onclick="openPiP('${safeFile}','${safeName}')" title="Buka Floating Viewer">🪟</div>` : ''}<div class="doc-act-btn danger" onclick="deleteDoc('${safeId}','${safeFile}')" title="Hapus">🗑️</div></div></div>`;
    });
  });
  el.innerHTML = html;
}
async function handleDocUpload(input) {
  if (!input.files || !input.files[0]) return; if (!currentRoom) { showToast('Pilih chat dulu'); input.value = ''; return; }
  const file = input.files[0]; if (file.size > 15 * 1024 * 1024) { showToast('File terlalu besar, maksimal 15MB'); input.value = ''; return; }
  const kat = prompt('Pilih kategori:\n1 = Identitas (KTP/Paspor/Visa)\n2 = Tiket & Voucher\n3 = Lainnya\n\nKetik 1, 2, atau 3:');
  const katMap = { '1': 'Identitas', '2': 'Tiket & Voucher', '3': 'Lainnya' }; const kategori = katMap[kat] || 'Lainnya';
  const label = document.getElementById('doc-upload-label'); label.innerHTML = '<i class="ti ti-loader spin" style="font-size:14px;"></i> Mengupload...';
  try {
    const base64 = await fileToBase64(file);
    const res = await apiPost({action: 'saveCustomerDoc', noWa: currentRoom.noWa, kategori, namaFile: file.name, fileType: file.type || 'application/octet-stream', fileData: base64, uploadedBy: currentStaff.nama, keterangan: ''});
    if (res.ok) { showToast('✅ ' + file.name + ' tersimpan!'); loadDocPanel(currentRoom.noWa); } else { showToast('Gagal upload: ' + (res.msg || 'Error')); }
  } catch(e) { showToast('Error: ' + e.toString()); }
  finally { label.innerHTML = `<i class="ti ti-upload" style="font-size:14px;"></i> Upload Dokumen<input type="file" id="doc-file-input" style="display:none;" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onchange="handleDocUpload(this)">`; input.value = ''; }
}
function viewDoc(fileId) { if (!fileId) return; window.open('https://drive.google.com/file/d/' + fileId + '/view', '_blank'); }
async function sendDocToCustomer(docId, fileId, namaFile) {
  if (!currentRoom) { showToast('Pilih chat dulu'); return; } if (!confirm('Kirim "' + namaFile + '" ke ' + currentRoom.nama + '?')) return;
  showToast('Mengirim...');
  try { const res = await apiPost({action: 'sendDocToCustomer', noWa: currentRoom.noWa, fileId, namaFile, roomId: currentRoom.roomId, staffName: currentStaff.nama}); if (res.ok) { showToast('✅ Dokumen berhasil dikirim!'); lastMsgCount = 0; loadMessages(currentRoom.roomId, true); } else { showToast('❌ Gagal: ' + (res.msg || '')); } } catch(e) { showToast('Error: ' + e.toString()); }
}
async function deleteDoc(docId, fileId) {
  if (!confirm('Hapus dokumen ini? File akan dihapus permanen dari Drive.')) return;
  try { const res = await apiPost({ action: 'deleteCustomerDoc', docId, fileId }); if (res.ok) { showToast('Dokumen dihapus'); loadDocPanel(currentDocNoWa); } else { showToast('Gagal hapus: ' + (res.msg || '')); } } catch(e) { showToast('Error: ' + e.toString()); }
}

// ===================== PiP FLOATING VIEWER =====================
function openPiP(fileId, namaFile) {
  if (!fileId) return;
  const nama = currentRoom ? currentRoom.nama : '';
  const noWa = currentRoom ? currentRoom.noWa : '';
  const params = new URLSearchParams({ fileId, docName: namaFile || '', nama, noWa });
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
    if (!res.ok||!res.bookings||res.bookings.length===0) { loading.textContent = ''; list.innerHTML = '<div class="context-none">Belum ada kode booking terdeteksi</div>'; return; }
    loading.textContent = res.bookings.length + ' booking'; list.innerHTML = res.bookings.map(b => renderContextCard(b)).join('');
  } catch(e) { loading.textContent = ''; list.innerHTML = '<div class="context-none">Error loading konteks</div>'; }
}
function renderContextCard(b) {
  const emoji = getMaskapaiEmoji(b.maskapai); const allKodes = (b.allKodes||[b.kode]).join(' · ');
  return `<div class="context-booking-card"><div class="context-maskapai"><span>${emoji} ${escH(b.maskapai)}</span><span style="font-size:9px;color:var(--text-hint);">${escH(b.tglTerbang)}</span></div><div class="context-kode">${escH(allKodes)}</div><div class="context-rute">✈️ ${escH(b.jurusan)}</div><div class="context-detail">👤 ${escH(b.nama)}<br>🛒 Beli: ${escH(b.tglBeli)}${b.harga ? ' · ' + formatHarga(b.harga) : ''}${b.noInv&&b.noInv!=='-' ? '<br>📋 '+escH(b.noInv) : ''}</div><div class="context-action-row"><button class="ctx-btn ctx-btn-checkin" onclick="quickCheckin('${escH(b.kode)}','${escH(b.maskapai)}','${escH(b.jurusan)}')">🛫 Check-in</button><button class="ctx-btn ctx-btn-arrival" onclick="quickArrival('${escH(b.jurusan)}')">📋 Arrival Card</button><button class="ctx-btn ctx-btn-beacukai" onclick="quickBeaCukai()">🛃 Bea Cukai</button></div></div>`;
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

// ===================== MULTI PAX =====================
let multiPaxOpen = false;
let multiPaxList = [];
let mpxSearchTimer = null;
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
      results.innerHTML = res.passengers.map(p => `
        <div class="mpx-result-item" onclick="addPassengerToList(${JSON.stringify(p).replace(/"/g, '&quot;')})">
          <div class="mpx-result-foto" id="foto-${p.passengerId}" onclick="showFotoPopup(event,'${p.passengerId}')" onmouseenter="showFotoPopup(event,'${p.passengerId}')" onmouseleave="hideFotoPopup()">${getInitials(p.namaLengkap)}</div>
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
    const res = await fetch('/api/proxy?action=getImageBase64&fileId=' + encodeURIComponent(fotoFileId));
    const data = await res.json();
    if (data.base64) {
      const src = 'data:' + (data.mimeType || 'image/jpeg') + ';base64,' + data.base64;
      fotoCache[fotoFileId] = src; setFotoEl(passengerId, src);
    }
  } catch(e) {}
}
function setFotoEl(passengerId, src) { const el = document.getElementById('foto-' + passengerId); if (el) el.innerHTML = '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;">'; }

function addPassengerToList(p) {
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
  const belakang = parts.length > 1 ? parts.slice(1).join(' ') : '-';
  return { depan, belakang };
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
    return `<div class="mpx-card">
      <div class="mpx-card-header">
        <div class="mpx-card-num">${i + 1}</div>
        <div class="mpx-card-nama">${escH(p.namaLengkap)}</div>
        <button onclick="copyPaxData(${i})" style="background:#25D366;border:none;color:white;padding:3px 8px;border-radius:5px;font-size:10px;font-weight:600;cursor:pointer;font-family:var(--font);white-space:nowrap;">📋 Copy</button>
        <button class="mpx-card-remove" onclick="removePassenger(${i})">✕</button>
      </div>
      <div class="mpx-name-row">
        <div class="mpx-name-half">
          <div class="mpx-name-half-label">Nama Depan</div>
          <div class="mpx-name-half-row">
            <span class="mpx-name-half-val">${escH(depan)}</span>
            <button class="mpx-copy-btn" onclick="copyField(this,'${escH(depan)}')" title="Salin">📋</button>
          </div>
        </div>
        <div class="mpx-name-half">
          <div class="mpx-name-half-label">Nama Belakang</div>
          <div class="mpx-name-half-row">
            <span class="mpx-name-half-val">${escH(belakang)}</span>
            <button class="mpx-copy-btn" onclick="copyField(this,'${escH(belakang)}')" title="Salin">📋</button>
          </div>
        </div>
      </div>
      <div class="mpx-fields">
        ${mpxField('Paspor', p.noPaspor)}
        ${mpxField('Tgl Lahir', p.tglLahir)}
        ${mpxField('Expired', p.expiryPaspor)}
        ${mpxField('Nationality', p.kewarganegaraan)}
        ${p.jenisKelamin ? mpxField('Kelamin', p.jenisKelamin === 'L' ? 'Laki-laki' : p.jenisKelamin === 'P' ? 'Perempuan' : p.jenisKelamin) : ''}
      </div>
    </div>`;
  }).join('');
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
  const el = document.getElementById('foto-' + passengerId); const img = el ? el.querySelector('img') : null; if (!img) return;
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
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:var(--bg);border:1px solid var(--border);';
      div.innerHTML = `<span style="font-size:20px;flex-shrink:0;">${icon}</span><div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escH(doc.namaFile)}">${escH(doc.namaFile)}</div><div style="font-size:10px;color:var(--text-muted);">${escH(doc.kategori)} · ${uploadedAt}</div></div><div style="display:flex;gap:4px;flex-shrink:0;"><button onclick="modalViewDoc('${doc.fileId}','${escH(doc.namaFile)}')" title="Lihat" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:12px;">👁️</button>${isImg ? `<button onclick="modalOpenViewer('${doc.fileId}','${escH(doc.namaFile)}')" title="Buka Passport Viewer" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:12px;">🪟</button>` : ''}<button onclick="modalSendDoc('${doc.docId}','${doc.fileId}','${escH(doc.namaFile)}')" title="Kirim via WA" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:12px;">📤</button><button onclick="modalDeleteDoc('${doc.docId}','${doc.fileId}',this)" title="Hapus" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:12px;">🗑️</button></div>`;
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
  finally { label.style.background = ''; label.innerHTML = '<i class="ti ti-upload" style="font-size:13px;"></i>&nbsp;Upload<input type="file" id="modal-doc-file-input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style="position:absolute;width:0;height:0;opacity:0;" onchange="handleModalDocUpload(this)">'; input.value = ''; }
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
    const res = await apiPost({ action: 'saveSmartNote', noWa, text, tag: window._snTag || 'TODO', staffName: currentStaff?.nama || 'STAFF' });
    if (res.ok || res.success) { document.getElementById('sn-text').value = ''; showToast('✅ Catatan disimpan!'); loadNotes(noWa); }
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
    listEl.innerHTML = notes.map(n => `<div class="sn-note-item" id="sn-note-${escH(n.noteId||n.id||'')}"><div style="margin-bottom:4px;"><span class="sn-tag ${tagClass[n.tag]||'sn-tag-info'}" style="font-size:9px;padding:2px 7px;">${tagEmoji[n.tag]||'📝'} ${n.tag||'INFO'}</span></div><div class="sn-note-text">${escH(n.text||n.catatan||'')}</div><div class="sn-note-footer"><span class="sn-note-meta">${escH(n.staffName||'')} · ${n.createdAt?new Date(n.createdAt).toLocaleDateString('id-ID'):''}</span>${n.tag!=='DONE'?`<button class="sn-done-btn" onclick="doneNote('${escH(n.noteId||n.id||'')}','${escH(noWa)}')">✓ Done</button>`:'<span style="font-size:10px;color:var(--green-mid);">✅ Selesai</span>'}</div></div>`).join('');
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
