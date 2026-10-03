// ============================================================
// MDAC — Malaysia Digital Arrival Card
// Depends on: apiGet(), escH(), showToast(), getInitials(),
//             makeModalDraggable(), loadFotoPreview(),
//             showFotoPopup(), hideFotoPopup()
//             currentRoom (global dari core.js)
// ============================================================

var mdacBookingInfo = null;
var mdacPaxList     = [];
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
  var pnr         = document.getElementById('mdac-pnr').value.trim().toUpperCase();
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
    document.getElementById('mdac-result-nama').textContent     = b.namaTamu    || '-';
    document.getElementById('mdac-result-maskapai').textContent = b.maskapai    || '-';
    document.getElementById('mdac-result-flight').textContent   = b.kodeFlight  || '-';
    document.getElementById('mdac-result-rute').textContent     = b.rute        || '-';
    document.getElementById('mdac-result-tgl').textContent      = b.tglTerbang  || '-';
    resultBox.classList.add('show');

    // Auto-fill kontak dari noWa customer di chat aktif (kalau belum diisi)
    var kontakInput = document.getElementById('mdac-kontak');
    if (!kontakInput.value && currentRoom && currentRoom.noWa) {
      kontakInput.value = currentRoom.noWa.toString().replace(/\D/g,'');
    }

    // Auto-fill tanggal pulang kalau tiket PP dan tgl pulang sudah ada di booking
    var tglPulangInput = document.getElementById('mdac-tgl-pulang');
    if (b.jenisTiket && b.jenisTiket.indexOf('PP') !== -1 && b.tglPulang) {
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
          '<div class="mpx-result-foto" id="mdac-foto-' + p.passengerId + '" ' +
            'onclick="event.stopPropagation();showFotoPopup(event,\'mdac-foto-' + p.passengerId + '\')" ' +
            'onmouseenter="showFotoPopup(event,\'mdac-foto-' + p.passengerId + '\')" ' +
            'onmouseleave="hideFotoPopup()">' + getInitials(p.namaLengkap) + '</div>' +
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
  if (!mdacBookingInfo)      { showToast('Cari PNR yang valid dulu'); return; }
  if (mdacPaxList.length === 0) { showToast('Tambahkan minimal 1 peserta'); return; }

  var alamat        = document.getElementById('mdac-alamat').value.trim();
  var state         = document.getElementById('mdac-state').value.trim();
  var city          = document.getElementById('mdac-city').value.trim();
  var postcode      = document.getElementById('mdac-postcode').value.trim();
  var accommodation = document.getElementById('mdac-accommodation').value.trim();
  var email         = document.getElementById('mdac-email').value.trim();
  var kontak        = document.getElementById('mdac-kontak').value.trim();
  var tglPulang     = document.getElementById('mdac-tgl-pulang').value.trim();

  if (!alamat || !email || !kontak)  { showToast('Lengkapi alamat, email, dan nomor kontak'); return; }
  if (!tglPulang)                    { showToast('Isi tanggal kembali / keluar dari Malaysia'); return; }

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
    lines.push('Nama            : ' + p.namaLengkap);
    lines.push('No Paspor       : ' + (p.noPaspor      || '-'));
    lines.push('Tgl Lahir       : ' + (p.tglLahir      || '-'));
    lines.push('Sex             : ' + kelamin);
    lines.push('Exp Paspor      : ' + (p.expiryPaspor  || '-'));
    lines.push('Kewarganegaraan : ' + kewarganegaraan);
    lines.push('Tempat Lahir    : ' + kewarganegaraan);
    lines.push('');
  });

  var ringkasanText = lines.join('\n');
  var summaryBox    = document.getElementById('mdac-summary-box');
  summaryBox.textContent  = ringkasanText;
  summaryBox.style.display = 'block';

  // Kirim ke Chrome Extension via postMessage
  var _mdacMsg   = { type: 'GOHO_MDAC_DATA', ringkasan: ringkasanText };
  var _mdacRetry = 0;
  var _mdacSend  = function() {
    window.postMessage(_mdacMsg, '*');
    if (_mdacRetry++ < 3) setTimeout(_mdacSend, 300);
  };
  _mdacSend();

  window.open('https://imigresen-online.imi.gov.my/mdac/main?registerMain', '_blank');
  showToast('✅ Data dikirim ke extension — form MDAC dibuka otomatis');
}
