// ============================================================
// CRUISE — Dream Cruises Price Tool
// Depends on: apiGet(), apiPost(), escH(), showToast(),
//             hargaFmtIDR() (dari harga section app.js)
//             currentStaff (global dari core.js)
// ============================================================

// ============================================================
// DREAM CRUISES — Price Tool
// ============================================================
function getKonfieAktif() {
  try {
    const saved = localStorage.getItem('cruise_konfie_aktif');
    return saved ? JSON.parse(saved) : null;
  } catch(e) { return null; }
}

function parseDateDMY(s) {
  const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
                  Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
  const m = s.trim().match(/^(\d+)-([A-Za-z]+)-(\d{4})$/);
  if (!m) return null;
  const mo = months[m[2]];
  return mo ? `${m[3]}-${mo}-${m[1].padStart(2,'0')}` : null;
}

function toggleKonfie(namaPromo, isAktif) {
  try {
    const saved = JSON.parse(localStorage.getItem('cruise_konfie_aktif') || '{}');
    saved[namaPromo] = isAktif;
    localStorage.setItem('cruise_konfie_aktif', JSON.stringify(saved));
  } catch(e) {}
}

function getKonfieHidden() {
  try { return JSON.parse(localStorage.getItem('cruise_konfie_hidden') || '[]'); } catch(e) { return []; }
}

function hideKonfie(namaPromo) {
  const hidden = getKonfieHidden();
  if (!hidden.includes(namaPromo)) hidden.push(namaPromo);
  localStorage.setItem('cruise_konfie_hidden', JSON.stringify(hidden));
  loadKonfieList();
}

function unhideAllKonfie() {
  localStorage.removeItem('cruise_konfie_hidden');
  loadKonfieList();
}

async function loadKonfieList() {
  const el = document.getElementById('cruise-konfie-list');
  if (!el) return;
  try {
    const res = await apiGet({ action: 'getHargaCruise', mode: 'konfie' });
    if (!res.ok || !res.data || res.data.length === 0) {
      el.innerHTML = '<div style="padding:10px;font-size:11px;color:var(--text-muted);">Tidak ada konfie ditemukan</div>';
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const saved = getKonfieAktif();
    const hidden = getKonfieHidden();

    const defaultAktif = {};
    res.data.forEach(k => {
      const exp = k.bookingSampai ? parseDateDMY(k.bookingSampai) : null;
      defaultAktif[k.nama_promo] = exp ? exp >= today : true;
    });
    // Validasi: hapus konfie lama yang sudah tidak ada di D1
const validPromos = new Set(res.data.map(k => k.nama_promo));
let aktifMap = saved || defaultAktif;
if (saved) {
  // Hapus entry yang tidak ada di D1 lagi
  let changed = false;
  Object.keys(aktifMap).forEach(promo => {
    if (!validPromos.has(promo)) {
      delete aktifMap[promo];
      changed = true;
    }
  });
  // Tambah konfie baru yang belum ada di localStorage
  res.data.forEach(k => {
    if (!(k.nama_promo in aktifMap)) {
      const exp = k.bookingSampai ? parseDateDMY(k.bookingSampai) : null;
      aktifMap[k.nama_promo] = exp ? exp >= today : true;
      changed = true;
    }
  });
  if (changed) localStorage.setItem('cruise_konfie_aktif', JSON.stringify(aktifMap));
} else {
  localStorage.setItem('cruise_konfie_aktif', JSON.stringify(aktifMap));
}

    const visible = res.data.filter(k => !hidden.includes(k.nama_promo));
    const hiddenCount = res.data.length - visible.length;

    let html = '';
    visible.forEach(k => {
      const exp = k.bookingSampai ? parseDateDMY(k.bookingSampai) : null;
      const isExpired = exp && exp < today;
      const daysLeft = exp ? Math.ceil((new Date(exp) - new Date(today)) / 86400000) : null;
      let statusBadge = '';
      if (isExpired) {
        statusBadge = '<span style="background:#fee2e2;color:#dc2626;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;">❌ Expired</span>';
      } else if (daysLeft !== null && daysLeft <= 7) {
        statusBadge = `<span style="background:#fef3c7;color:#d97706;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;">⚠️ ${daysLeft}hr lagi</span>`;
      } else {
        statusBadge = '<span style="background:#dcfce7;color:#16a34a;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;">✅ Aktif</span>';
      }
      const checked = aktifMap[k.nama_promo] !== false ? 'checked' : '';
      const hideBtn = isExpired
        ? `<button onclick="hideKonfie('${k.nama_promo}')" title="Sembunyikan"
            style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--text-muted);padding:0 4px;flex-shrink:0;">🗑</button>`
        : '';
      html += `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border);${isExpired ? 'opacity:0.6;' : ''}">
        <input type="checkbox" ${checked} onchange="toggleKonfie('${k.nama_promo}', this.checked)"
          style="width:16px;height:16px;accent-color:var(--primary);flex-shrink:0;cursor:pointer;">
        <div style="flex:1;min-width:0;cursor:pointer;" onclick="this.previousElementSibling.click()">
          <div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k.nama_promo}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${k.cruise_line} · s/d ${k.bookingSampai || '-'}</div>
        </div>
        <div style="flex-shrink:0;">${statusBadge}</div>
        ${hideBtn}
      </div>`;
    });

    if (hiddenCount > 0) {
      html += `<div style="padding:8px 12px;text-align:center;">
        <button onclick="unhideAllKonfie()"
          style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--text-muted);text-decoration:underline;">
          Tampilkan ${hiddenCount} konfie tersembunyi
        </button>
      </div>`;
    }

    const discAgen = localStorage.getItem('cruise_disc_agen_pct') || '0';
    html += `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8fafc;border-top:2px solid var(--border);">
      <span style="font-size:12px;font-weight:600;color:var(--text);flex:1;">💰 Disc Agen (%)</span>
      <input type="number" id="cruise-disc-agen-input" value="${discAgen}" min="0" max="30" step="0.5"
        style="width:70px;padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px;text-align:center;"
        onchange="saveCruiseDiscAgen(this.value)">
    </div>`;
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="padding:10px;font-size:11px;color:red;">Gagal memuat konfie</div>';
  }
}
function saveCruiseDiscAgen(val) {
  const v = parseFloat(val) || 0;
  localStorage.setItem('cruise_disc_agen_pct', String(v));
  showToast('Disc agen disimpan: ' + v + '%');
}

function getCruiseDiscAgen() {
  return parseFloat(localStorage.getItem('cruise_disc_agen_pct') || '0');
}
async function lihatRuteCruise(rute, btnEl) {
  // Toggle — kalau sudah tampil, tutup
  const existing = btnEl.parentElement.parentElement.querySelector('.rute-panel');
  if (existing) { existing.remove(); btnEl.textContent = '🗺 rute'; return; }

  btnEl.textContent = '⏳';
  try {
    const res = await apiGet({ action: 'getItineraryCruise', rute });
    if (!res.ok || !res.data.length) { btnEl.textContent = '🗺 rute'; return; }

    let html = `<div class="rute-panel" style="margin-top:6px;background:white;border:1px solid var(--border);border-radius:8px;overflow:hidden;font-size:11px;">`;
    html += `<div style="padding:6px 10px;background:#f0fdf4;font-weight:600;color:#0F6E56;font-size:11px;">🗺 ${rute}</div>`;
    html += `<table style="width:100%;border-collapse:collapse;">`;
    html += `<tr style="background:#f8f9fa;"><th style="padding:4px 8px;text-align:left;color:var(--text-muted);font-weight:600;">Hari</th><th style="padding:4px 8px;text-align:left;color:var(--text-muted);font-weight:600;">Tujuan</th><th style="padding:4px 8px;text-align:center;color:var(--text-muted);font-weight:600;">ETA</th><th style="padding:4px 8px;text-align:center;color:var(--text-muted);font-weight:600;">ETD</th></tr>`;

    res.data.forEach(r => {
      const note = r.note ? `<span style="color:#f59e0b;font-size:9px;"> *</span>` : '';
      html += `<tr style="border-top:1px solid #f0f0f0;">
        <td style="padding:4px 8px;color:var(--text-muted);">${r.day_name}</td>
        <td style="padding:4px 8px;font-weight:500;">${r.destination}${note}</td>
        <td style="padding:4px 8px;text-align:center;color:var(--text-muted);">${r.eta || '-'}</td>
        <td style="padding:4px 8px;text-align:center;color:var(--text-muted);">${r.etd || '-'}</td>
      </tr>`;
    });

    // Catatan khusus
    const notes = res.data.filter(r => r.note);
    if (notes.length) {
      notes.forEach(r => {
        html += `<tr><td colspan="4" style="padding:3px 8px;font-size:9px;color:#f59e0b;">* ${r.note}</td></tr>`;
      });
    }

    html += `</table></div>`;
    btnEl.textContent = '🗺 rute';
    btnEl.insertAdjacentHTML('afterend', html);
  } catch(e) {
    btnEl.textContent = '🗺 rute';
  }
}

async function openCruiseModal() {
  const panel = document.getElementById('modal-cruise');
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  // Mobile: lebar penuh layar
  if (window.innerWidth < 600) {
    panel.style.width  = (window.innerWidth - 16) + 'px';
    panel.style.left   = '8px';
    panel.style.top    = '72px';
    panel.style.right  = 'auto';
  } else {
    // Desktop: clamp posisi supaya tidak keluar layar
    panel.style.right = 'auto';
    setTimeout(() => {
      const rect = panel.getBoundingClientRect();
      if (rect.left < 0) panel.style.left = '8px';
      if (rect.right > window.innerWidth) panel.style.left = Math.max(8, window.innerWidth - panel.offsetWidth - 8) + 'px';
    }, 10);
  }
  initCruisePanelDrag();
  // Load konfie list
  loadKonfieList();
  // Reset mode selector
  document.getElementById('cruise-mode-selector').style.display = 'block';
  document.getElementById('cruise-termurah-mode').style.display = 'none';
  document.getElementById('cruise-spesifik-mode').style.display = 'none';
  document.getElementById('btn-mode-termurah').style.background = 'var(--bg)';
  document.getElementById('btn-mode-termurah').style.borderColor = 'var(--border)';
  document.getElementById('btn-mode-spesifik').style.background = 'var(--bg)';
  document.getElementById('btn-mode-spesifik').style.borderColor = 'var(--border)';
  // Reset spesifik mode
  document.getElementById('cruise-tgl-group').style.display = 'none';
  document.getElementById('cruise-kabin-group').style.display = 'none';
  document.getElementById('cruise-pax-group').style.display = 'none';
  document.getElementById('cruise-hasil').style.display = 'none';
  document.getElementById('cruise-promo-info').style.display = 'none';
  document.getElementById('cruise-promo-info').innerHTML = '';
  document.getElementById('cruise-rute').value = '';
  document.getElementById('cruise-rute').innerHTML = '<option value="">-- Memuat rute... --</option>';
  try {
    const res = await apiGet({ action: 'getHargaCruise', mode: 'rute' });
    if (res.ok && res.data) {
      const sel = document.getElementById('cruise-rute');
      sel.innerHTML = '<option value="">-- Pilih Rute --</option>';
      res.data.forEach(r => {
        sel.innerHTML += `<option value="${r}">${r}</option>`;
      });
    }
  } catch(e) {
    showToast('Gagal memuat rute cruise');
  }
}

function closeCruiseModal() {
  document.getElementById('modal-cruise').style.display = 'none';
}

// ===================== CRUISE PANEL DRAG =====================
let _cruisePanelDragInit = false;
function initCruisePanelDrag() {
  const panel = document.getElementById('modal-cruise');
  const header = document.getElementById('cruise-panel-header');
  if (!panel || !header) return;
  if (_cruisePanelDragInit) return; // posisi sudah di-set di openCruiseModal
  _cruisePanelDragInit = true;

  let isDragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

  function dragStart(cx, cy) {
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    startX = cx; startY = cy;
    startLeft = rect.left; startTop = rect.top;
    panel.style.right = '';
    panel.style.left = startLeft + 'px';
    panel.style.top  = startTop  + 'px';
    header.style.cursor = 'grabbing';
  }
  function dragMove(cx, cy) {
    if (!isDragging) return;
    const newLeft = Math.max(0, Math.min(startLeft + cx - startX, window.innerWidth  - panel.offsetWidth));
    const newTop  = Math.max(0, Math.min(startTop  + cy - startY, window.innerHeight - panel.offsetHeight));
    panel.style.left = newLeft + 'px';
    panel.style.top  = newTop  + 'px';
  }
  function dragEnd() { if (isDragging) { isDragging = false; header.style.cursor = 'grab'; } }

  header.addEventListener('mousedown', (e) => { if (e.target.tagName === 'BUTTON') return; dragStart(e.clientX, e.clientY); e.preventDefault(); });
  window.addEventListener('mousemove', (e) => dragMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', dragEnd);
  // Touch support
  header.addEventListener('touchstart', (e) => { if (e.target.tagName === 'BUTTON') return; const t = e.touches[0]; dragStart(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchmove', (e) => { if (!isDragging) return; const t = e.touches[0]; dragMove(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
  window.addEventListener('touchend', dragEnd);
}

function setCruiseMode(mode) {
  // Sembunyikan mode selector
  document.getElementById('cruise-mode-selector').style.display = 'none';
  document.getElementById('cruise-termurah-mode').style.display = 'none';
  document.getElementById('cruise-spesifik-mode').style.display = 'none';

  if (mode === 'termurah') {
    document.getElementById('cruise-termurah-mode').style.display = 'block';
    document.getElementById('tm-hasil').style.display = 'none';
    document.getElementById('tm-hasil').innerHTML = '';
  } else {
    document.getElementById('cruise-spesifik-mode').style.display = 'block';
    // Load rute kalau belum ada
    const sel = document.getElementById('cruise-rute');
    if (sel.options.length <= 1) {
      loadCruiseRute();
    }
  }
}

async function loadCruiseRute() {
  const sel = document.getElementById('cruise-rute');
  sel.innerHTML = '<option value="">-- Memuat rute... --</option>';
  try {
    const res = await apiGet({ action: 'getHargaCruise', mode: 'rute' });
    if (res.ok && res.data) {
      sel.innerHTML = '<option value="">-- Pilih Rute --</option>';
      res.data.forEach(r => { sel.innerHTML += `<option value="${r}">${r}</option>`; });
    }
  } catch(e) { showToast('Gagal memuat rute cruise'); }
}

async function cariCruiseTermurahBaru() {
  const cruiseLine = document.getElementById('tm-cruise-line').value;
  const bulanDari  = document.getElementById('tm-bulan-dari').value;
  const bulanSampai= document.getElementById('tm-bulan-sampai').value;
  const malam      = document.getElementById('tm-malam').value;
  const kabin      = document.getElementById('tm-kabin').value;
  const paxDewasa  = document.getElementById('tm-pax1').value;
  const paxAnak    = document.getElementById('tm-pax3').value;

  const hasilEl = document.getElementById('tm-hasil');
  hasilEl.style.display = 'block';
  hasilEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);">🔍 Mencari harga termurah...</div>';

  const konfieAktif = getKonfieAktif();
  const konfieFilter = konfieAktif ? Object.keys(konfieAktif).filter(k => konfieAktif[k]).join('||') : '';

  try {
    const res = await apiGet({
      action: 'getHargaCruise', mode: 'termurah',
      cruiseLine, bulanDari, bulanSampai, malam, kabin,
      paxDewasa, paxAnak, paxInfant: '0',
      konfieAktif: konfieFilter,
      discAgen: getCruiseDiscAgen()
    });

    if (!res.ok || !res.data || res.data.length === 0) {
      hasilEl.innerHTML = '<div style="color:var(--text-muted);text-align:center;font-size:12px;padding:12px;">Tidak ada data untuk filter ini</div>';
      return;
    }

    const fmt = n => Number(n).toLocaleString('id-ID');
    const fmtIDR = n => 'Rp ' + Math.round(n/1000000*10)/10 + 'jt';
    const minHarga = res.data[0].totalJualSGD;

    // Simpan data untuk dipakai saat klik expand
    window._tmData = { res: res.data, paxDewasa, paxAnak };

    let html = `<div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:10px;">
      📋 ${res.data.length} hasil — sorted termurah</div>`;

    res.data.forEach((d, idx) => {
      const isCheapest = d.totalJualSGD === minHarga;
      const badge = isCheapest ? '<span style="background:#10b981;color:white;font-size:10px;padding:2px 6px;border-radius:4px;margin-left:4px;">TERMURAH</span>' : '';
      const eventBadge = d.isEvent ? '<span style="background:#f59e0b;color:white;font-size:10px;padding:2px 6px;border-radius:4px;margin-left:4px;">EVENT</span>' : '';

      html += `<div style="border:1px solid ${isCheapest ? '#10b981' : 'var(--border)'};border-radius:8px;margin-bottom:8px;overflow:hidden;background:${isCheapest ? '#f0fdf4' : 'var(--bg)'};">
        <div onclick="toggleTmDetail(${idx})" style="padding:10px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-weight:700;font-size:13px;">${d.tgl} ${badge}${eventBadge}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${d.rute} · ${d.malam}N · ${d.kabin}</div>
            <div style="font-size:11px;color:var(--text-muted);">${d.promo}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800;font-size:15px;color:var(--primary);">SGD ${fmt(d.totalJualSGD)}</div>
            <div style="font-size:11px;color:var(--text-muted);">≈ ${fmtIDR(d.totalJualIDR)}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:4px;">▼ detail</div>
            <div onclick="event.stopPropagation();lihatRuteCruise('${d.rute}',this)" style="font-size:10px;color:var(--blue);margin-top:3px;cursor:pointer;">🗺 rute</div>
          </div>
        </div>
        <div id="tm-detail-${idx}" style="display:none;border-top:1px solid var(--border);padding:10px 12px;background:var(--bg-secondary);">
          <div style="color:var(--text-muted);font-size:11px;">⏳ Memuat...</div>
        </div>
      </div>`;
    });

    hasilEl.innerHTML = html;

  } catch(e) {
    hasilEl.innerHTML = '<div style="color:red;font-size:12px;">Error: ' + e.message + '</div>';
  }
}

async function toggleTmDetail(idx) {
  const detailEl = document.getElementById(`tm-detail-${idx}`);
  if (!detailEl) return;

  // Toggle
  if (detailEl.style.display === 'block') {
    detailEl.style.display = 'none';
    return;
  }

  detailEl.style.display = 'block';

  // Kalau sudah ada isi (bukan loading), skip fetch
  if (!detailEl.innerHTML.includes('Memuat')) return;

  // Ambil data dari cache
  const d = window._tmData.res[idx];
  const paxDewasa = window._tmData.paxDewasa;
  const paxAnak   = window._tmData.paxAnak;

  try {
    const konfieAktif = getKonfieAktif();
    const konfieFilter = konfieAktif ? Object.keys(konfieAktif).filter(k => konfieAktif[k]).join('||') : '';

    const res = await apiGet({
      action: 'getHargaCruise', mode: 'harga',
      rute: d.rute, tgl: d.tgl, kabin: d.kabin,
      paxDewasa, paxAnak, paxInfant: '0',
      konfieAktif: konfieFilter,
      discAgen: getCruiseDiscAgen()
    });

    if (!res.ok || !res.data) {
      detailEl.innerHTML = '<div style="color:red;font-size:11px;">Gagal memuat detail</div>';
      return;
    }

    const dd = Array.isArray(res.data) ? res.data[0] : res.data;
    const fmt = n => Number(n).toLocaleString('id-ID');
    const fmtIDR = n => 'Rp ' + Math.round(n/1000000*10)/10 + 'jt';
    let html = `<div style="font-size:12px;">`;
    // Breakdown per pax
    (dd.breakdown || []).forEach(b => {
      const note = b.note ? ` <span style="color:#10b981;font-size:10px;">(${b.note})</span>` : '';
      html += `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border);">
        <span style="color:var(--text-secondary);">${b.label}${note}</span>
        <span>SGD ${fmt(b.hargaJual)}</span>
      </div>`;
    });
    // Port charges
    html += `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border);">
      <span style="color:var(--text-secondary);">Port Charges (${parseInt(paxDewasa)+parseInt(paxAnak)}×)</span>
      <span>SGD ${fmt(dd.portCharges)}</span>
    </div>`;

    // Total
    html += `<div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:700;font-size:13px;">
      <span>Total Harga Jual</span>
      <span style="color:var(--primary);">SGD ${fmt(dd.totalJualSGD)}</span>
    </div>`;
    html += `<div style="text-align:right;font-size:11px;color:var(--text-muted);">≈ ${fmtIDR(dd.totalJualIDR)}</div>`;

    // Gratuity
    if (dd.totalGratuity > 0) {
      html += `<div style="margin-top:6px;font-size:11px;color:#f59e0b;">⚠️ Gratuity: SGD ${fmt(dd.gratuityPerMalam)}/org/malam ≈ SGD ${fmt(dd.totalGratuity)} total</div>`;
    }

    html += `</div>`;
    detailEl.innerHTML = html;

  } catch(e) {
    detailEl.innerHTML = '<div style="color:red;font-size:11px;">Error: ' + e.message + '</div>';
  }
}


async function onCruiseRuteChange() {
  const rute = document.getElementById('cruise-rute').value;
  if (!rute) return;

  document.getElementById('cruise-tgl-group').style.display = 'block';
  document.getElementById('cruise-kabin-group').style.display = 'none';
  document.getElementById('cruise-pax-group').style.display = 'none';
  document.getElementById('cruise-hasil').style.display = 'none';

  const sel = document.getElementById('cruise-tgl');
  sel.innerHTML = '<option value="">-- Memuat tanggal... --</option>';

  try {
    const res = await apiGet({ action: 'getHargaCruise', mode: 'tanggal', rute });
    if (res.ok && res.data) {
      sel.innerHTML = '<option value="">-- Pilih Tanggal --</option>';
      res.data.forEach(t => {
        sel.innerHTML += `<option value="${t}">${t}</option>`;
      });
    }
  } catch(e) {
    showToast('Gagal memuat tanggal');
  }
}

async function onCruiseTglChange() {
  const rute = document.getElementById('cruise-rute').value;
  const tgl  = document.getElementById('cruise-tgl').value;
  if (!tgl) return;

  document.getElementById('cruise-kabin-group').style.display = 'none';
  document.getElementById('cruise-pax-group').style.display = 'none';
  document.getElementById('cruise-hasil').style.display = 'none';
  document.getElementById('cruise-promo-info').style.display = 'none';
  const elToggle = document.getElementById('cruise-toggle-termurah');
  const elPanel  = document.getElementById('cruise-termurah-panel');
  const elHasil  = document.getElementById('cruise-termurah-hasil');
  const elMode   = document.getElementById('cruise-mode-termurah');
  if (elToggle) elToggle.style.display = 'none';
  if (elPanel)  elPanel.style.display  = 'none';
  if (elHasil)  elHasil.style.display  = 'none';
  if (elMode)   elMode.checked = false;

  const sel = document.getElementById('cruise-kabin');
  sel.innerHTML = '<option value="">-- Memuat kabin... --</option>';

  try {
    const res = await apiGet({ action: 'getHargaCruise', mode: 'kabin', rute, tgl });
    if (res.ok && res.data) {
      sel.innerHTML = '<option value="">-- Pilih Kabin --</option>';
      res.data.forEach(k => { sel.innerHTML += `<option value="${k}">${k}</option>`; });

      // Populate ct-kabin untuk mode Cari Termurah
      const ctKabin = document.getElementById('ct-kabin');
      if (ctKabin) {
        ctKabin.innerHTML = '<option value="">-- Pilih Kabin --</option>';
        res.data.forEach(k => { ctKabin.innerHTML += `<option value="${k}">${k}</option>`; });
      }

      document.getElementById('cruise-kabin-group').style.display = 'block';
      document.getElementById('cruise-pax-group').style.display = 'block';
      const elTgl = document.getElementById('cruise-toggle-termurah');
      if (elTgl) elTgl.style.display = 'block';
    }
  } catch(e) { showToast('Gagal memuat kabin'); }

  // Show/hide paxtype — default tampil (hide kalau tidak perlu)
  const paxtypeRow = document.getElementById('cruise-paxtype-row');
  if (paxtypeRow) paxtypeRow.style.display = 'block';
}

function onCruiseModeToggle() {
  const checked = document.getElementById('cruise-mode-termurah').checked;
  document.getElementById('cruise-kabin-group').style.display = checked ? 'none' : 'block';
  document.getElementById('cruise-pax-group').style.display   = checked ? 'none' : 'block';
  document.getElementById('cruise-hasil').style.display       = 'none';
  document.getElementById('cruise-termurah-panel').style.display = checked ? 'block' : 'none';
  document.getElementById('cruise-termurah-hasil').style.display = 'none';
}

async function cariCruiseTermurah() {
  const rute    = document.getElementById('cruise-rute').value;
  const kabin   = document.getElementById('ct-kabin').value;
  const pax1st  = document.getElementById('ct-pax1').value;
  const pax3rd  = document.getElementById('ct-pax3').value;
  const paxtype = document.getElementById('ct-paxtype').value;

  if (!rute) { showToast('Pilih rute dulu'); return; }
  if (!kabin) { showToast('Pilih tipe kabin dulu'); return; }

  const hasilEl = document.getElementById('cruise-termurah-hasil');
  hasilEl.style.display = 'block';
  hasilEl.innerHTML = '<div style="text-align:center;padding:14px;color:var(--text-muted);"><i class="ti ti-loader spin"></i> Scanning semua tanggal...</div>';

  try {
    const res = await apiGet({
      action: 'getHargaCruise', mode: 'termurah',
      rute, kabin,
      paxDewasa: pax1st,
      paxAnak: pax3rd,
      paxInfant: '0',
      pax1st, pax3rd, paxType: paxtype
    });

    if (!res.ok || !res.data || res.data.length === 0) {
      hasilEl.innerHTML = '<div style="color:var(--text-muted);text-align:center;font-size:12px;padding:12px;">Tidak ada data untuk kombinasi ini</div>';
      return;
    }

    const fmt    = n => Number(n).toLocaleString('en-SG');
    const fmtIDR = n => {
      const jt = n / 1000000;
      return jt >= 1 ? 'Rp ' + jt.toFixed(1).replace('.0','') + 'jt' : 'Rp ' + Number(n).toLocaleString('id-ID');
    };

    const paxDesc = parseInt(pax1st) + (parseInt(pax3rd) > 0 ? `+${pax3rd} ${paxtype}` : '') + ' pax';

    const rows = res.data.map((d, i) => {
      const medal   = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span style="display:inline-block;width:20px;text-align:center;font-size:11px;color:var(--text-muted);">${i+1}</span>`;
      const evBadge = d.isEvent ? '<span style="background:#e07b00;color:white;font-size:9px;padding:1px 5px;border-radius:8px;margin-left:4px;">EVENT</span>' : '';
      return `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:8px 6px;font-size:12px;white-space:nowrap;">${medal}</td>
          <td style="padding:8px 6px;">
            <div style="font-size:12px;font-weight:600;">${d.tgl}${evBadge}</div>
            <div style="font-size:10px;color:var(--text-muted);">${d.promo} · ${d.malam} malam</div>
          </td>
          <td style="padding:8px 6px;text-align:right;">
            <div style="font-size:13px;font-weight:700;color:var(--primary);">SGD ${fmt(d.totalJualSGD)}</div>
            <div style="font-size:10px;color:var(--text-muted);">${fmtIDR(d.totalJualIDR)}</div>
          </td>
        </tr>`;
    }).join('');

    hasilEl.innerHTML = `
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">
        ${rute} · ${kabin} · ${paxDesc} — Top ${res.data.length} termurah
      </div>
      <div style="background:var(--bg-secondary);border-radius:8px;overflow:hidden;border:1px solid var(--border);">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:var(--bg);border-bottom:1px solid var(--border);">
              <th style="padding:6px;font-size:10px;color:var(--text-muted);font-weight:600;text-align:left;">#</th>
              <th style="padding:6px;font-size:10px;color:var(--text-muted);font-weight:600;text-align:left;">TANGGAL · PROMO</th>
              <th style="padding:6px;font-size:10px;color:var(--text-muted);font-weight:600;text-align:right;">HARGA</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  } catch(e) {
    hasilEl.innerHTML = `<div style="color:red;text-align:center;font-size:12px;">Error: ${e.toString()}</div>`;
  }
}

async function hitungHargaCruise() {
  const rute    = document.getElementById('cruise-rute').value;
  const tgl     = document.getElementById('cruise-tgl').value;
  const kabin   = document.getElementById('cruise-kabin').value;
  const pax1st  = document.getElementById('cruise-pax1').value;
  const pax3rd  = document.getElementById('cruise-pax3').value;
  const paxtype = document.getElementById('cruise-paxtype').value;
  const infant  = document.getElementById('cruise-infant').value;

  if (!rute || !tgl || !kabin) {
    showToast('Lengkapi rute, tanggal, dan kabin dulu');
    return;
  }

  const hasilEl = document.getElementById('cruise-hasil');
  hasilEl.style.display = 'block';
  hasilEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);"><i class="ti ti-loader spin"></i> Menghitung harga...</div>';

  try {
    const konfieAktif = getKonfieAktif();
    const konfieFilter = konfieAktif ? Object.keys(konfieAktif).filter(k => konfieAktif[k]).join('||') : '';
    const res = await apiGet({ action: 'getHargaCruise',
      mode: 'harga', rute, tgl, kabin,
      paxDewasa: pax1st,
      paxAnak: pax3rd,
      paxInfant: infant,
      pax1st, pax3rd, paxType: paxtype, infant,
      konfieAktif: konfieFilter,
      discAgen: getCruiseDiscAgen()
    });

    if (!res.ok) {
      hasilEl.innerHTML = `<div style="color:red;text-align:center;">${res.msg || 'Data tidak ditemukan'}</div>`;
      return;
    }

    const fmt    = n => Number(n).toLocaleString('en-SG');
    const fmtIDR = n => 'Rp ' + Number(n).toLocaleString('id-ID');
    const totalPax = parseInt(pax1st) + parseInt(pax3rd) + parseInt(infant);

    // ── MULTI PROMO: tampilkan card pilihan dulu ──────────────
    if (res.multiPromo && Array.isArray(res.data)) {
      const promos = res.data;
      const lowestSGD = Math.min(...promos.map(p => p.totalJualSGD));
      let cardsHTML = `
        <div style="margin-bottom:10px;">
          <div style="font-size:11px;color:var(--text-muted);">${rute} | ${tgl} | ${kabin} | ${parseInt(pax1st)+parseInt(pax3rd)+parseInt(infant)} pax</div>
          <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-top:4px;">Pilih promo yang akan digunakan:</div>
        </div>`;
      promos.forEach((p, i) => {
        const isLowest = p.totalJualSGD === lowestSGD;
        const evBadge  = p.prioritas === 'EVENT'
          ? '<span style="background:#e07b00;color:white;font-size:9px;padding:1px 6px;border-radius:10px;margin-left:6px;">EVENT</span>' : '';
        const lowestBadge = isLowest
          ? '<span style="background:#0a7;color:white;font-size:9px;padding:1px 6px;border-radius:10px;margin-left:6px;">TERMURAH</span>' : '';
        cardsHTML += `
          <div onclick="showDetailPromo(${i})" style="cursor:pointer;border:2px solid ${isLowest?'#0a7':'var(--border)'};border-radius:10px;padding:12px 14px;margin-bottom:8px;background:${isLowest?'#f0fff8':'var(--surface)'};display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:13px;font-weight:700;">${p.promo}${evBadge}${lowestBadge}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Booking s/d: ${p.bookingSampai || '-'}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:16px;font-weight:700;color:${isLowest?'#0a7':'var(--primary)'};">SGD ${fmt(p.totalJualSGD)}</div>
              <div style="font-size:10px;color:var(--text-muted);">≈ ${fmtIDR(p.totalJualIDR)}</div>
            </div>
          </div>`;
      });
      cardsHTML += `<div style="font-size:10px;color:var(--text-muted);text-align:center;margin-top:4px;">Klik promo untuk lihat breakdown lengkap</div>`;
      hasilEl.innerHTML = cardsHTML;

      // Simpan data promo untuk diakses saat klik
      hasilEl._promoData = promos;
      hasilEl._paxInfo   = { pax1st, pax3rd, paxtype, infant, totalPax, fmt, fmtIDR };
      return;
    }

    // ── SINGLE PROMO: tampilkan breakdown langsung ────────────
    renderBreakdownCruise(hasilEl, res.data, { pax1st, pax3rd, paxtype, infant, totalPax, fmt, fmtIDR });

  } catch(e) {
    hasilEl.innerHTML = `<div style="color:red;text-align:center;">Error: ${e.toString()}</div>`;
  }
}

function showDetailPromo(idx) {
  const hasilEl = document.getElementById('cruise-hasil');
  const promos  = hasilEl._promoData;
  const info    = hasilEl._paxInfo;
  if (!promos || !promos[idx]) return;

  // Tombol back
  const backBtn = `<div onclick="renderPromoCards()" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--primary);margin-bottom:12px;">
    <i class="ti ti-arrow-left"></i> Kembali ke pilihan promo
  </div>`;
  hasilEl.innerHTML = backBtn;

  const container = document.createElement('div');
  hasilEl.appendChild(container);
  renderBreakdownCruise(container, promos[idx], info);
}

function renderPromoCards() {
  const hasilEl = document.getElementById('cruise-hasil');
  const promos  = hasilEl._promoData;
  const info    = hasilEl._paxInfo;
  if (!promos) return;

  const fmt    = info.fmt;
  const fmtIDR = info.fmtIDR;
  const lowestSGD = Math.min(...promos.map(p => p.totalJualSGD));
  const rute  = document.getElementById('cruise-rute').value;
  const tgl   = document.getElementById('cruise-tgl').value;
  const kabin = document.getElementById('cruise-kabin').value;

  let cardsHTML = `
    <div style="margin-bottom:10px;">
      <div style="font-size:11px;color:var(--text-muted);">${rute} | ${tgl} | ${kabin} | ${info.totalPax} pax</div>
      <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-top:4px;">Pilih promo yang akan digunakan:</div>
    </div>`;
  promos.forEach((p, i) => {
    const isLowest = p.totalJualSGD === lowestSGD;
    const evBadge  = p.prioritas === 'EVENT'
      ? '<span style="background:#e07b00;color:white;font-size:9px;padding:1px 6px;border-radius:10px;margin-left:6px;">EVENT</span>' : '';
    const lowestBadge = isLowest
      ? '<span style="background:#0a7;color:white;font-size:9px;padding:1px 6px;border-radius:10px;margin-left:6px;">TERMURAH</span>' : '';
    cardsHTML += `
      <div onclick="showDetailPromo(${i})" style="cursor:pointer;border:2px solid ${isLowest?'#0a7':'var(--border)'};border-radius:10px;padding:12px 14px;margin-bottom:8px;background:${isLowest?'#f0fff8':'var(--surface)'};display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:13px;font-weight:700;">${p.promo}${evBadge}${lowestBadge}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Booking s/d: ${p.bookingSampai || '-'}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:16px;font-weight:700;color:${isLowest?'#0a7':'var(--primary)'};">SGD ${fmt(p.totalJualSGD)}</div>
          <div style="font-size:10px;color:var(--text-muted);">≈ ${fmtIDR(p.totalJualIDR)}</div>
        </div>
      </div>`;
  });
  cardsHTML += `<div style="font-size:10px;color:var(--text-muted);text-align:center;margin-top:4px;">Klik promo untuk lihat breakdown lengkap</div>`;
  hasilEl.innerHTML = cardsHTML;
  hasilEl._promoData = promos;
  hasilEl._paxInfo   = info;
}

function renderBreakdownCruise(container, d, info) {
  const { pax1st, pax3rd, paxtype, infant, totalPax, fmt, fmtIDR } = info;
  let paxDetail = '';
  if (d.breakdown && d.breakdown.length > 0) {
    d.breakdown.forEach(b => {
      const noteStr = b.note ? ` <span style="color:#0a7;font-size:10px;">(${b.note})</span>` : '';
      paxDetail += `<div style="display:flex;justify-content:space-between;">
        <span>${b.label}${noteStr}</span>
        <span>SGD ${fmt(b.hargaJual)}</span>
      </div>`;
    });
  }
  const diskonInfo  = d.diskonCabin ? `<div style="display:flex;justify-content:space-between;color:#0a7;"><span>Diskon Kabin</span><span>SGD ${fmt(d.diskonCabin)}</span></div>` : '';
  const evBadge     = d.prioritas === 'EVENT' ? '<span style="background:#e07b00;color:white;font-size:9px;padding:2px 6px;border-radius:10px;margin-left:6px;">PROMO EVENT</span>' : '';
  const catatanInfo = d.catatan ? `<div style="margin-top:8px;font-size:11px;color:#e07b00;">📌 ${d.catatan}</div>` : '';

  container.innerHTML = `
    <div style="margin-bottom:10px;">
      <div style="font-size:11px;color:var(--text-muted);">PROMO</div>
      <div style="font-size:13px;font-weight:700;">${d.promo}${evBadge}</div>
      <div style="font-size:10px;color:var(--text-muted);">${d.rute} | ${d.tgl} | ${d.kabin} | ${d.malam} malam</div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:10px;margin-bottom:10px;font-size:12px;display:flex;flex-direction:column;gap:6px;">
      ${paxDetail}
      <div style="display:flex;justify-content:space-between;"><span>Port Charges (${totalPax}×)</span><span>SGD ${fmt(d.portCharges/totalPax)} × ${totalPax} = <b>SGD ${fmt(d.portCharges)}</b></span></div>
      ${diskonInfo}
    </div>
    <div style="border-top:2px solid var(--primary);padding-top:10px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);">
        <span>Harga Publish</span><span>SGD ${fmt(d.totalPublishSGD)}</span>
      </div>
      ${d.discPct > 0 ? `<div style="font-size:10px;color:#0a7;text-align:right;">Disc agen ${d.discPct}% sudah termasuk</div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:var(--primary);margin-top:4px;">
        <span>Total Harga Jual</span><span>SGD ${fmt(d.totalJualSGD)}</span>
      </div>
      <div style="text-align:right;font-size:11px;color:var(--text-muted);margin-top:2px;">
        ≈ ${fmtIDR(d.totalJualIDR)} <span style="font-size:10px;">(kurs SGD 1 = IDR ${fmt(d.kurs)})</span>
      </div>
      <div style="margin-top:8px;padding:8px;background:#fff8e1;border-radius:6px;font-size:11px;color:#7a5c00;">
        ⚠️ Harga IDR untuk referensi saja. Harga final dikonfirmasi saat booking.<br>
        💳 Gratuity: SGD ${fmt(d.gratuityPerMalam)}/pax/malam (bayar di kapal) ≈ SGD ${fmt(d.totalGratuity)} total
      </div>
      ${catatanInfo}
    </div>`;
}


