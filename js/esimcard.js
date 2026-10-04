// ============================================================
// eSIMCard — Purchase, Riwayat, Cek Usage, Topup
// Depends on: apiGet(), apiPost(), escH(), showToast(),
//             hargaFmtIDR() (dari harga-esim.js)
//             currentStaff (global dari core.js)
// ============================================================

// ============================================================
// eSIMCard PURCHASE FLOW
// ============================================================

// ============================================================
// eSIMCard RIWAYAT & SETTING EMAIL
// ============================================================

async function esimcardOpenRiwayat() {
  // Buat modal riwayat
  let modal = document.getElementById('esimcard-riwayat-modal');
  if (modal) { modal.remove(); }

  modal = document.createElement('div');
  modal.id = 'esimcard-riwayat-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;padding:24px;width:480px;max-width:95vw;font-family:var(--font);box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:14px;color:var(--text);">📋 Riwayat Pembelian eSIMCard</h3>
        <button onclick="document.getElementById('esimcard-riwayat-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <div id="ec-riwayat-list" style="font-size:12px;color:var(--text-muted);">⏳ Memuat riwayat...</div>
    </div>`;
  document.body.appendChild(modal);

  try {
    const res = await fetch('https://goho-proxy.gohotravel.workers.dev?action=getEsimcardOrders');
    const data = await res.json();
    const listEl = document.getElementById('ec-riwayat-list');
    if (!listEl) return;

    if (!data.ok || !data.orders?.length) {
      listEl.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">Belum ada transaksi</div>';
      return;
    }

    // Render sebagai list compact — klik "Buka" untuk expand detail
    listEl.innerHTML = data.orders.map((o, idx) => {
      const tgl = o.created_at ? new Date(o.created_at).toLocaleString('id-ID', { dateStyle:'short', timeStyle:'short' }) : '-';
      const namaLine = o.nama_pembeli
        ? `👤 ${escH(o.nama_pembeli)}${o.hp_pembeli ? ' · ' + escH(o.hp_pembeli) : ''}`
        : escH(o.package_name || '-');
      const paketLine = o.nama_pembeli ? `<div style="font-size:10px;color:var(--text);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escH(o.package_name || '-')}</div>` : '';
      return `
        <div style="border:1px solid var(--border);border-radius:8px;margin-bottom:6px;overflow:hidden;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;cursor:pointer;background:#f8fafc;" onclick="ecToggleRiwayat(${idx})">
            <div style="flex:1;min-width:0;">
              <div style="font-size:11px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${namaLine}</div>
              ${paketLine}
              <div style="font-size:10px;color:var(--text-muted);">${tgl}${o.staff ? ' · ' + escH(o.staff) : ''} · <span style="color:#166534;">${escH(o.status||'Released')}</span></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;margin-left:8px;flex-shrink:0;">
              <button id="ec-rw-btn-${idx}" style="font-size:10px;padding:3px 10px;background:#2563eb;color:white;border:none;border-radius:4px;cursor:pointer;">▶ Buka</button>
              <button onclick="ecCheckUsage(${idx},event)" style="font-size:10px;padding:3px 10px;background:#0891b2;color:white;border:none;border-radius:4px;cursor:pointer;">📊 Sisa Data</button>
              <button onclick="ecCheckTopup(${idx},event)" style="font-size:10px;padding:3px 10px;background:#16a34a;color:white;border:none;border-radius:4px;cursor:pointer;">🔄 Topup</button>
            </div>
          </div>
          <div id="ec-rw-detail-${idx}" style="display:none;padding:12px;border-top:1px solid var(--border);">
            <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:6px;">${escH(o.package_name || '-')}</div>
            ${o.nama_pembeli ? `<div style="font-size:10px;color:#2563eb;font-weight:600;margin-bottom:8px;">👤 ${escH(o.nama_pembeli)}${o.hp_pembeli ? ' · ' + escH(o.hp_pembeli) : ''}</div>` : ''}
            ${o.lpa_string ? `
            <div style="text-align:center;margin-bottom:8px;">
              <div id="rw-qr-${o.id}" style="display:inline-block;padding:6px;background:white;border:1px solid #e2e8f0;border-radius:6px;"></div>
              <div style="display:flex;gap:6px;justify-content:center;margin-top:6px;flex-wrap:wrap;">
                <button onclick="ecCopy('${escH(o.lpa_string)}',this)" style="font-size:10px;padding:3px 8px;background:#e2e8f0;border:none;border-radius:4px;cursor:pointer;">📋 Copy LPA</button>
                <button onclick="ecDownloadQR('rw-qr-${o.id}','esim-${escH(o.iccid||'qr')}.png')" style="font-size:10px;padding:3px 8px;background:#2563eb;color:white;border:none;border-radius:4px;cursor:pointer;">⬇️ Download QR</button>
                <button onclick="ecCopyPesanWA(${idx})" style="font-size:10px;padding:3px 8px;background:#16a34a;color:white;border:none;border-radius:4px;cursor:pointer;">📲 Copy Pesan WA</button>
              </div>
            </div>` : ''}
            <div style="font-size:10px;color:#64748b;margin-bottom:6px;">
              ICCID: <b>${escH(o.iccid || '-')}</b>
              <button onclick="ecCopy('${escH(o.iccid||'')}',this)" style="font-size:9px;padding:1px 4px;background:#e2e8f0;border:none;border-radius:3px;cursor:pointer;margin-left:4px;">📋</button>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${o.link_ios ? `<a href="${escH(o.link_ios)}" target="_blank" style="font-size:10px;background:#2563eb;color:white;padding:3px 8px;border-radius:4px;text-decoration:none;">🍎 iPhone</a>` : ''}
              ${o.link_android ? `<a href="${escH(o.link_android)}" target="_blank" style="font-size:10px;background:#16a34a;color:white;padding:3px 8px;border-radius:4px;text-decoration:none;">🤖 Android</a>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Simpan data orders ke window untuk dipakai ecCopyPesanWA
    window._ecOrders = data.orders;

    // Tidak auto-generate QR — generate saat di-expand saja (lihat ecToggleRiwayat)

  } catch(e) {
    const listEl = document.getElementById('ec-riwayat-list');
    if (listEl) listEl.innerHTML = `<div style="color:var(--red);">Error: ${escH(e.message)}</div>`;
  }
}

function ecToggleRiwayat(idx) {
  const detail = document.getElementById('ec-rw-detail-' + idx);
  const btn    = document.getElementById('ec-rw-btn-' + idx);
  if (!detail) return;
  const isOpen = detail.style.display !== 'none';
  detail.style.display = isOpen ? 'none' : 'block';
  btn.textContent = isOpen ? '▶ Buka' : '▼ Tutup';
  // Generate QR saat pertama dibuka
  if (!isOpen && window._ecOrders?.[idx]?.lpa_string) {
    setTimeout(() => ecGenerateQR(window._ecOrders[idx].lpa_string, 'rw-qr-' + window._ecOrders[idx].id), 100);
  }
}

function ecCopyPesanWA(idx) {
  const o = window._ecOrders?.[idx];
  if (!o) return;
  const nama = o.nama_pembeli ? `Halo ${o.nama_pembeli}` : 'Halo Kak';
  const paket = o.package_name || 'eSIM';
  let pesan = `${nama} 😊\n\nBerikut eSIM kamu:\n📦 Paket: ${paket}\n\n`;
  if (o.link_ios || o.link_android) {
    pesan += `📲 *Install eSIM:*\n`;
    if (o.link_ios)     pesan += `• iPhone: ${o.link_ios}\n`;
    if (o.link_android) pesan += `• Android: ${o.link_android}\n`;
  }
  pesan += `\n📶 eSIM aktif otomatis saat pertama connect ke jaringan.\nSelamat berlibur! ✈️`;
  navigator.clipboard.writeText(pesan).then(() => {
    const btn = document.querySelector(`#ec-rw-detail-${idx} button[onclick="ecCopyPesanWA(${idx})"]`);
    if (btn) { const ori = btn.textContent; btn.textContent = '✅ Tersalin!'; setTimeout(() => btn.textContent = ori, 1800); }
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = pesan; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  });
}

// Alias untuk tombol navbar
function ecOpenRiwayatPanel() { esimcardOpenRiwayat(); }

// ── Cek Sisa Data eSIMCard ────────────────────────────────
async function ecCheckUsage(idx, e) {
  if (e) e.stopPropagation();
  const o = window._ecOrders?.[idx];
  if (!o) return;
  const btn = e?.target;
  const oriText = btn?.textContent || '📊 Sisa Data';

  // Tampil loading di bawah row
  let usageEl = document.getElementById('ec-usage-' + idx);
  if (!usageEl) {
    const rowEl = btn?.closest('[style*="border:1px solid"]');
    if (rowEl) {
      usageEl = document.createElement('div');
      usageEl.id = 'ec-usage-' + idx;
      usageEl.style.cssText = 'padding:8px 12px;background:#f0f9ff;border-top:1px solid #bae6fd;font-size:11px;';
      rowEl.appendChild(usageEl);
    }
  }
  if (!usageEl) return;

  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }
  usageEl.style.display = 'block';
  usageEl.innerHTML = '⏳ Mengecek sisa data...';

  try {
    const res = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimCardUsage&simId=${encodeURIComponent(o.sim_id)}`);
    const data = await res.json();
    if (!data.ok || !data.usage) {
      usageEl.innerHTML = `<span style="color:#dc2626;">❌ Gagal cek usage: ${escH(data.msg || 'Error')}</span>`;
    } else {
      const u = data.usage;
      const init = u.initial_data_quantity;
      const rem  = u.rem_data_quantity;
      const unit = u.rem_data_unit || 'GB';
      const isUnlim = rem === 'Unlimited' || init === 'Unlimited';
      if (isUnlim) {
        usageEl.innerHTML = `<span style="color:#0891b2;">📶 Data: <b>Unlimited</b></span>`;
      } else {
        const remNum  = parseFloat(rem)  || 0;
        const initNum = parseFloat(init) || 0;
        const usedNum = Math.max(0, initNum - remNum);
        const pct     = initNum > 0 ? Math.round((remNum / initNum) * 100) : 0;
        const color   = pct > 50 ? '#16a34a' : pct > 20 ? '#d97706' : '#dc2626';
        usageEl.innerHTML = `
          <div style="margin-bottom:4px;">📶 Sisa: <b style="color:${color};">${remNum}${unit}</b> / ${initNum}${unit}</div>
          <div style="background:#e2e8f0;border-radius:4px;height:6px;overflow:hidden;">
            <div style="background:${color};height:100%;width:${pct}%;transition:width 0.3s;"></div>
          </div>
          <div style="font-size:10px;color:#64748b;margin-top:3px;">Terpakai: ${usedNum.toFixed(2)}${unit} (${100-pct}%)</div>`;
      }
    }
  } catch(err) {
    usageEl.innerHTML = `<span style="color:#dc2626;">❌ Error: ${escH(err.message)}</span>`;
  } finally {
    if (btn) { btn.textContent = oriText; btn.disabled = false; }
  }
}

// ── Topup eSIMCard ────────────────────────────────────────
async function ecCheckTopup(idx, e) {
  if (e) e.stopPropagation();
  const o = window._ecOrders?.[idx];
  if (!o || !o.iccid) {
    alert('ICCID tidak tersedia untuk eSIM ini.');
    return;
  }
  const btn = e?.target;
  const oriText = btn?.textContent || '🔄 Topup';
  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

  try {
    // Step 1: cek apakah bisa di-topup
    const res = await fetch('https://goho-proxy.gohotravel.workers.dev?action=esimcardCanTopup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'esimcardCanTopup', iccid: o.iccid })
    });
    const data = await res.json();

    if (!data.ok) {
      alert(`❌ Gagal cek topup: ${data.msg || 'Error'}`);
      return;
    }
    if (!data.topup_available) {
      alert('❌ eSIM ini tidak bisa di-topup saat ini.\n\nKemungkinan paket masih aktif atau eSIM belum diinstall.');
      return;
    }

    // Step 2: topup tersedia — extract negara dari package_name
    // Format: "10GB eSIM Data for 10 Days for Japan" → "Japan"
    const pkgName = o.package_name || '';
    const countryMatch = pkgName.match(/for ([A-Za-z\s]+)$/i);
    const countryName  = countryMatch ? countryMatch[1].trim() : '';

    // Cari di GOHO_COUNTRIES
    const countryObj = countryName
      ? GOHO_COUNTRIES.find(c => c.display?.toLowerCase() === countryName.toLowerCase() || c.name?.toLowerCase() === countryName.toLowerCase())
      : null;

    // Tutup modal riwayat
    document.getElementById('esimcard-riwayat-modal')?.remove();

    if (!countryObj) {
      alert(`✅ eSIM ini bisa di-topup!\n\nSilakan buka panel Harga SIM, cari negara secara manual, dan pilih paket yang diinginkan.\n\nIccid: ${o.iccid}`);
      return;
    }

    // Step 3: buka panel harga dan auto-select negara
    // Simpan ICCID untuk dipakai saat purchase topup
    window._ecTopupIccid  = o.iccid;
    window._ecTopupSimId  = o.sim_id;
    window._ecTopupOldPkg = o.package_name;

    // Buka panel harga, set negara ke negara eSIM yang mau di-topup
    await openHargaModal();
    setTimeout(() => {
      const input = document.getElementById('harga-country-input');
      if (input) {
        input.value = countryObj.display || countryName;
        input.dispatchEvent(new Event('input'));
        // Pilih baris pertama yang match
        setTimeout(() => {
          const firstItem = document.querySelector('#harga-country-list .harga-country-item');
          if (firstItem) firstItem.click();
        }, 300);
      }
    }, 400);

  } catch(err) {
    alert(`❌ Error: ${err.message}`);
  } finally {
    if (btn) { btn.textContent = oriText; btn.disabled = false; }
  }
}

async function esimcardOpenSettingEmail() {
  // Ambil setting email saat ini
  let currentEmail = '';
  try {
    const res = await fetch('https://goho-proxy.gohotravel.workers.dev?action=getSetting&key=esimcard_email');
    const data = await res.json();
    currentEmail = data.value || '';
  } catch(e) {}

  const modal = document.createElement('div');
  modal.id = 'esimcard-email-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;padding:24px;width:380px;max-width:95vw;font-family:var(--font);box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:14px;color:var(--text);">⚙️ Setting Email eSIMCard</h3>
        <button onclick="document.getElementById('esimcard-email-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">
        Email ini digunakan sebagai penerima notifikasi QR code dari eSIMCard setelah pembelian berhasil.
      </div>
      <div style="margin-bottom:16px;">
        <label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:4px;">Email penerima QR eSIMCard</label>
        <input id="ec-setting-email" type="email" value="${escH(currentEmail)}" placeholder="contoh: gohotravel@gmail.com"
          style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:var(--font);outline:none;">
      </div>
      <div id="ec-email-status" style="display:none;margin-bottom:12px;font-size:11px;"></div>
      <div style="display:flex;gap:8px;">
        <button onclick="document.getElementById('esimcard-email-modal').remove()"
          style="flex:1;padding:9px;background:#f1f5f9;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:var(--font);">
          Batal
        </button>
        <button onclick="esimcardSaveEmail()"
          style="flex:2;padding:9px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);">
          💾 Simpan
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function esimcardSaveEmail() {
  const email = document.getElementById('ec-setting-email')?.value?.trim();
  const statusEl = document.getElementById('ec-email-status');
  if (!email) { alert('Email tidak boleh kosong'); return; }

  statusEl.style.display = 'block';
  statusEl.style.cssText = 'display:block;margin-bottom:12px;font-size:11px;color:#6366f1;background:#ede9fe;padding:8px;border-radius:6px;';
  statusEl.textContent = '⏳ Menyimpan...';

  try {
    const res = await fetch('https://goho-proxy.gohotravel.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveSetting', key: 'esimcard_email', value: email })
    });
    const data = await res.json();
    if (data.ok) {
      statusEl.style.cssText = 'display:block;margin-bottom:12px;font-size:11px;color:#166534;background:#dcfce7;padding:8px;border-radius:6px;';
      statusEl.textContent = '✅ Email berhasil disimpan!';
      setTimeout(() => document.getElementById('esimcard-email-modal')?.remove(), 1500);
    } else {
      throw new Error(data.msg || 'Gagal simpan');
    }
  } catch(e) {
    statusEl.style.cssText = 'display:block;margin-bottom:12px;font-size:11px;color:#991b1b;background:#fee2e2;padding:8px;border-radius:6px;';
    statusEl.textContent = '❌ Error: ' + e.message;
  }
}

function esimcardOpenBeli(pkgStr) {
  let pkg;
  try { pkg = typeof pkgStr === 'string' ? JSON.parse(pkgStr) : pkgStr; }
  catch(e) { alert('Error parse paket: ' + e.message); return; }

  const modal = document.createElement('div');
  modal.id = 'esimcard-beli-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;padding:24px;width:420px;max-width:95vw;font-family:var(--font);box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:92vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:14px;color:var(--text);">🛒 Beli eSIMCard</h3>
        <button onclick="document.getElementById('esimcard-beli-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px;">${escH(pkg.name || '')}</div>
        <div style="font-size:11px;color:var(--text-muted);">${escH(String(pkg.dataQty))} · ${pkg.validity} hari</div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="font-size:11px;color:var(--text-muted);">Beli: <b style="color:var(--text);">${hargaFmtIDR(pkg.buyIDR)}</b> <span style="font-size:10px;">(USD ${pkg.buyUSD.toFixed(2)})</span></span>
          <span style="font-size:11px;color:var(--text-muted);">Jual: <b style="color:#2563eb;">${hargaFmtIDR(pkg.sellIDR)}</b></span>
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px;">👤 Data Pembeli <span style="font-weight:400;color:var(--text-muted);">(opsional)</span></div>
        <input id="ec-nama-pembeli" type="text" placeholder="Nama tamu (mis: Budi Santoso)"
          style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:var(--font);margin-bottom:6px;outline:none;" />
        <input id="ec-hp-pembeli" type="text" placeholder="No HP / WA (mis: 08123456789)"
          style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:var(--font);outline:none;" />
      </div>
      <div id="ec-status" style="display:none;margin-bottom:12px;"></div>
      <div style="display:flex;gap:8px;">
        <button onclick="document.getElementById('esimcard-beli-modal').remove()"
          style="flex:1;padding:9px;background:#f1f5f9;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:var(--font);">
          Batal
        </button>
        <button id="ec-beli-btn" onclick="esimcardDoPurchase('${pkg.id}', '${escH(pkg.name)}')"
          style="flex:2;padding:9px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);">
          ✅ Konfirmasi Beli
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function ecCopy(text, btnEl) {
  navigator.clipboard.writeText(text).then(() => {
    const ori = btnEl.textContent; btnEl.textContent = '✅';
    setTimeout(() => { btnEl.textContent = ori; }, 1500);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    const ori = btnEl.textContent; btnEl.textContent = '✅';
    setTimeout(() => { btnEl.textContent = ori; }, 1500);
  });
}

function ecGenerateQR(lpaString, containerId) {
  if (!lpaString || !containerId) return;
  const el = document.getElementById(containerId);
  if (!el) return;
  const doGen = () => {
    el.innerHTML = '';
    new QRCode(el, { text: lpaString, width: 180, height: 180, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
  };
  if (typeof QRCode === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = doGen;
    document.head.appendChild(script);
  } else { doGen(); }
}

function ecDownloadQR(containerId, filename) {
  const el = document.getElementById(containerId);
  const canvas = el?.querySelector('canvas');
  if (!canvas) { alert('QR belum siap, coba lagi'); return; }
  const a = document.createElement('a');
  a.download = filename || 'esim-qr.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function ecSaveOrder(simData, fallbackSimId, packageId, packageName) {
  const namaPembeli = document.getElementById('ec-nama-pembeli')?.value?.trim() || '';
  const hpPembeli   = document.getElementById('ec-hp-pembeli')?.value?.trim() || '';
  fetch('https://goho-proxy.gohotravel.workers.dev', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'saveEsimcardOrder',
      simId: simData.id || fallbackSimId || '',
      iccid: simData.iccid || '',
      packageId: packageId || '',
      packageName: packageName || '',
      lpaString: simData.qr_code_text || '',
      linkIos: simData.universal_link || '',
      linkAndroid: simData.android_universal_link || '',
      smdpAddress: simData.smdp_address || '',
      activationCode: simData.matching_id || '',
      status: simData.status || 'Released',
      staff: currentStaff?.nama || '',
      namaPembeli: namaPembeli,
      hpPembeli: hpPembeli
    })
  }).catch(e => console.log('Save order error:', e));
}

function ecShowPurchaseResult(statusEl, beliBtn, sim, packageName) {
  beliBtn.style.background = '#16a34a';
  beliBtn.textContent = '✅ Berhasil!';
  beliBtn.disabled = true;

  const iccid   = sim.iccid    || '-';
  const simId   = sim.id       || '-';
  const lpa     = sim.qr_code_text || '';
  const smdp    = sim.smdp_address || '';
  const matchId = sim.matching_id  || '';
  const linkIos = sim.universal_link || '';
  const linkAnd = sim.android_universal_link || '';
  const status  = sim.status   || 'Released';
  const bundle  = sim.last_bundle || packageName || '-';

  const rowCopy = (label, val) => val && val !== '-' ? `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f1f5f9;">
      <span style="font-size:10px;color:#64748b;min-width:90px;">${label}</span>
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:10px;font-weight:600;color:#1e293b;word-break:break-all;text-align:right;max-width:220px;">${escH(val)}</span>
        <button onclick="ecCopy('${escH(val).replace(/'/g,"\'")}',this)"
          style="font-size:9px;padding:2px 5px;background:#e2e8f0;border:none;border-radius:3px;cursor:pointer;flex-shrink:0;">📋</button>
      </div>
    </div>` : '';

  const qrId = 'ec-qr-' + Date.now();

  statusEl.style.display = 'block';
  statusEl.innerHTML = `
    <div style="background:#dcfce7;border-radius:8px;padding:10px 12px;margin-bottom:10px;color:#166534;font-weight:700;font-size:12px;">
      ✅ Pembelian berhasil! eSIM siap diinstall.
    </div>
    ${lpa ? `
    <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:10px;text-align:center;">
      <div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:8px;">📷 QR Code eSIM</div>
      <div id="${qrId}" style="display:inline-block;padding:8px;background:white;border:1px solid #e2e8f0;border-radius:8px;"></div>
      <div style="font-size:10px;color:#64748b;margin-top:6px;">Scan QR ini untuk install eSIM</div>
      <div style="display:flex;gap:6px;justify-content:center;margin-top:8px;">
        <button onclick="ecCopy('${escH(lpa)}',this)" style="font-size:10px;padding:4px 10px;background:#e2e8f0;border:none;border-radius:4px;cursor:pointer;">📋 Copy LPA</button>
        <button onclick="ecDownloadQR('${qrId}','esim-qr.png')" style="font-size:10px;padding:4px 10px;background:#2563eb;color:white;border:none;border-radius:4px;cursor:pointer;">⬇️ Download QR</button>
      </div>
    </div>` : ''}
    <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:10px;">
      <div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:6px;">📱 Info eSIM</div>
      ${rowCopy('Paket', bundle)}
      ${rowCopy('Status', status)}
      ${rowCopy('ICCID', iccid)}
      ${rowCopy('eSIM ID', simId)}
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:10px;">
      <div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:8px;">🔧 Cara Install</div>
      ${linkIos ? `<a href="${escH(linkIos)}" target="_blank" style="display:block;background:#2563eb;color:white;text-align:center;padding:8px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;margin-bottom:6px;">🍎 Install di iPhone</a>` : ''}
      ${linkAnd ? `<a href="${escH(linkAnd)}" target="_blank" style="display:block;background:#16a34a;color:white;text-align:center;padding:8px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;margin-bottom:8px;">🤖 Install di Android</a>` : ''}
      ${smdp && matchId ? `
      <div style="border-top:1px solid #e2e8f0;padding-top:8px;">
        <div style="font-size:10px;font-weight:600;color:#64748b;margin-bottom:4px;">📝 Install Manual</div>
        ${rowCopy('SM-DP+ Address', smdp)}
        ${rowCopy('Activation Code', matchId)}
        ${lpa ? rowCopy('LPA String', lpa) : ''}
      </div>` : ''}
    </div>
    ${(linkIos || linkAnd || lpa) ? `
    <div style="background:#f0fdf4;border-radius:8px;padding:10px 12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <div style="font-size:11px;font-weight:700;color:#166534;">💬 Pesan WA untuk Customer</div>
        <button onclick="ecCopy(document.getElementById('ec-wa-msg').innerText,this)" style="font-size:10px;padding:3px 8px;background:#16a34a;color:white;border:none;border-radius:4px;cursor:pointer;">📋 Copy</button>
      </div>
      <div id="ec-wa-msg" style="font-size:11px;color:#1e293b;line-height:1.6;white-space:pre-wrap;background:white;border-radius:6px;padding:8px;border:1px solid #bbf7d0;">eSIM Anda sudah siap! 🎉

Paket: ${escH(bundle)}
ICCID: ${escH(iccid)}

*Cara install:*
${linkIos ? `📱 iPhone: ${linkIos}` : ''}
${linkAnd ? `📱 Android: ${linkAnd}` : ''}
${smdp ? `
📝 Manual:
SM-DP+ Address: ${smdp}
Activation Code: ${matchId}` : ''}

eSIM aktif otomatis saat pertama connect ke jaringan.
Selamat berlibur! ✈️</div>
    </div>` : ''}
  `;
  if (lpa) setTimeout(() => ecGenerateQR(lpa, qrId), 100);

  // Simpan/update ke D1 — dipanggil di sini agar data sudah lengkap (termasuk kasus polling)
  ecSaveOrder(sim, sim.id || '', '', packageName);
}

async function ecFetchSimData(simId, statusEl, beliBtn, packageName) {
  statusEl.innerHTML = `<div style="background:#fef3c7;border-radius:8px;padding:10px 12px;font-size:11px;color:#92400e;">⏳ eSIM sedang diproses... Mengecek status dalam 15 detik.</div>`;
  let attempts = 0;
  const maxAttempts = 10;
  const poll = async () => {
    attempts++;
    try {
      const res = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimCardSim&simId=${encodeURIComponent(simId)}`);
      const data = await res.json();
      const sim = data.raw?.data?.sim || data.sim || {};
      if (sim.status === 'Released' || sim.qr_code_text || sim.universal_link) {
        ecShowPurchaseResult(statusEl, beliBtn, sim, packageName);
      } else if (attempts < maxAttempts) {
        statusEl.innerHTML = `<div style="background:#fef3c7;border-radius:8px;padding:10px 12px;font-size:11px;color:#92400e;">⏳ eSIM sedang diproses... Cek ke-${attempts}/${maxAttempts}. Harap tunggu.</div>`;
        setTimeout(poll, 15000);
      } else {
        statusEl.innerHTML = `<div style="background:#fee2e2;border-radius:8px;padding:10px 12px;font-size:11px;color:#991b1b;">⚠️ eSIM masih diproses. Cek di portal eSIMCard.<br><b>SIM ID: ${escH(simId)}</b></div>`;
      }
    } catch(e) { if (attempts < maxAttempts) setTimeout(poll, 15000); }
  };
  setTimeout(poll, 15000);
}

async function esimcardDoPurchase(packageId, packageName) {
  const statusEl = document.getElementById('ec-status');
  const beliBtn  = document.getElementById('ec-beli-btn');
  beliBtn.disabled = true;
  beliBtn.textContent = '⏳ Memproses...';
  statusEl.style.display = 'block';
  statusEl.innerHTML = `<div style="background:#ede9fe;border-radius:8px;padding:10px 12px;font-size:11px;color:#6366f1;">⏳ Mengirim request ke eSIMCard...</div>`;
  try {
    const res = await fetch('https://goho-proxy.gohotravel.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'esimcardPurchase', packageId, packageName })
    });
    const data = await res.json();
    if (data.ok) {
      const simApplied = data.raw?.data?.sim_applied;
      const sim        = data.raw?.data?.sim || {};
      const simId      = data.raw?.data?.sim_id || sim.id || '';
      if (simApplied === true && sim.id) {
        ecShowPurchaseResult(statusEl, beliBtn, sim, packageName);
      } else if (simId) {
        beliBtn.textContent = '⏳ Menunggu...';
        ecFetchSimData(simId, statusEl, beliBtn, packageName);
      } else {
        beliBtn.style.background = '#16a34a';
        beliBtn.textContent = '✅ Berhasil!';
        statusEl.innerHTML = `<div style="background:#dcfce7;border-radius:8px;padding:10px;font-size:11px;color:#166534;">✅ Pembelian berhasil!<br><span style="font-size:10px;color:#64748b;">Data eSIM sedang diproses.</span></div>`;
      }
      console.log('[eSIMCard Purchase]', data);

      // Simpan ke D1 hanya kalau sim_applied true dan data sudah lengkap.
      // Kalau sim_applied false (polling), save dipanggil dari ecShowPurchaseResult setelah polling selesai.
      if (simApplied === true && sim.id) {
        ecSaveOrder(sim, data.raw?.data?.sim_id || '', packageId, packageName);
      }

    } else {
      throw new Error(data.msg || data.error || 'Purchase gagal');
    }
  } catch(e) {
    statusEl.innerHTML = `<div style="background:#fee2e2;border-radius:8px;padding:10px;font-size:11px;color:#991b1b;">❌ Error: ${escH(e.message)}</div>`;
    beliBtn.disabled = false;
    beliBtn.textContent = '✅ Coba Lagi';
    beliBtn.style.background = '#2563eb';
  }
}



// loadEsimCardPrice dipindah ke harga-esim.js

