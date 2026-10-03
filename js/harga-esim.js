// ============================================================
// HARGA SIM/ESIM — Panel, Aviroam, eSIM Access, iRoamly
// Depends on: apiGet(), apiPost(), escH(), showToast(),
//             closeModal(), makeModalDraggable()
//             currentStaff (global dari core.js)
// ============================================================

// ===================== HARGA SIM/ESIM =====================
let hargaData = [];
// MASTER COUNTRY LIST — GohoTravel eSIM
// Source: iRoamly official list + ISO mapping untuk eSIM Access + keyword untuk Aviroam
// Format: { display, iroamly, iso, aviroam_keywords[] }

const GOHO_COUNTRIES = [
  { display: 'Korea', iroamly: 'south-korea', iso: 'KR', aviroam: ['korea selatan', 'south korea'] },
  { display: 'United Arab Emirates', iroamly: 'united-arab-emirates', iso: 'AE', aviroam: ['emirates', 'uae', 'dubai'] },
  { display: 'Philippines', iroamly: 'philippines', iso: 'PH', aviroam: ['philippines'] },
  { display: 'United States', iroamly: 'united-states', iso: 'US', aviroam: ['united states', 'usa', 'america'] },
  { display: 'Japan', iroamly: 'japan', iso: 'JP', aviroam: ['japan'] },
  { display: 'Saudi Arabia', iroamly: 'saudi-arabia', iso: 'SA', aviroam: ['saudi arabia'] },
  { display: 'Taiwan', iroamly: 'taiwan', iso: 'TW', aviroam: ['taiwan'] },
  { display: 'Turkey', iroamly: 'turkey', iso: 'TR', aviroam: ['turkey'] },
  { display: 'India', iroamly: 'india', iso: 'IN', aviroam: ['india'] },
  { display: 'United Kingdom', iroamly: 'united-kingdom', iso: 'GB', aviroam: ['united kingdom', 'uk', 'britain', 'england'] },
  { display: 'Cambodia', iroamly: 'cambodia', iso: 'KH', aviroam: ['cambodia'] },
  { display: 'Malaysia', iroamly: 'malaysia', iso: 'MY', aviroam: ['malaysia'] },
  { display: 'Thailand', iroamly: 'thailand', iso: 'TH', aviroam: ['thailand'] },
  { display: 'Ireland', iroamly: 'ireland', iso: 'IE', aviroam: ['ireland'] },
  { display: 'Singapore', iroamly: 'singapore', iso: 'SG', aviroam: ['singapore'] },
  { display: 'Indonesia', iroamly: 'indonesia', iso: 'ID', aviroam: ['indonesia'] },
  { display: 'Vietnam', iroamly: 'vietnam', iso: 'VN', aviroam: ['vietnam'] },
  { display: 'Albania', iroamly: 'albania', iso: 'AL', aviroam: ['albania'] },
  { display: 'Egypt', iroamly: 'egypt', iso: 'EG', aviroam: ['egypt'] },
  { display: 'Kazakhstan', iroamly: 'kazakhstan', iso: 'KZ', aviroam: ['kazakhstan'] },
  { display: 'Ukraine', iroamly: 'ukraine', iso: 'UA', aviroam: ['ukraine'] },
  { display: 'Estonia', iroamly: 'estonia', iso: 'EE', aviroam: ['estonia'] },
  { display: 'Uzbekistan', iroamly: 'uzbekistan', iso: 'UZ', aviroam: ['uzbekistan'] },
  { display: 'China', iroamly: 'china', iso: 'CN', aviroam: ['china'] },
  { display: 'Montenegro', iroamly: 'montenegro', iso: 'ME', aviroam: ['montenegro'] },
  { display: 'Qatar', iroamly: 'qatar', iso: 'QA', aviroam: ['qatar'] },
  { display: 'Kuwait', iroamly: 'kuwait', iso: 'KW', aviroam: ['kuwait'] },
  { display: 'Denmark', iroamly: 'denmark', iso: 'DK', aviroam: ['denmark'] },
  { display: 'Bulgaria', iroamly: 'bulgaria', iso: 'BG', aviroam: ['bulgaria'] },
  { display: 'Croatia', iroamly: 'croatia', iso: 'HR', aviroam: ['croatia'] },
  { display: 'Iceland', iroamly: 'iceland', iso: 'IS', aviroam: ['iceland'] },
  { display: 'Liechtenstein', iroamly: 'liechtenstein', iso: 'LI', aviroam: ['liechtenstein'] },
  { display: 'Hungary', iroamly: 'hungary', iso: 'HU', aviroam: ['hungary'] },
  { display: 'Luxembourg', iroamly: 'luxembourg', iso: 'LU', aviroam: ['luxembourg'] },
  { display: 'Cyprus', iroamly: 'cyprus', iso: 'CY', aviroam: ['cyprus'] },
  { display: 'Austria', iroamly: 'austria', iso: 'AT', aviroam: ['austria'] },
  { display: 'Greece', iroamly: 'greece', iso: 'GR', aviroam: ['greece'] },
  { display: 'Germany', iroamly: 'germany', iso: 'DE', aviroam: ['germany'] },
  { display: 'Italy', iroamly: 'italy', iso: 'IT', aviroam: ['italy'] },
  { display: 'Latvia', iroamly: 'latvia', iso: 'LV', aviroam: ['latvia'] },
  { display: 'France', iroamly: 'france', iso: 'FR', aviroam: ['france'] },
  { display: 'Spain', iroamly: 'spain', iso: 'ES', aviroam: ['spain'] },
  { display: 'Sweden', iroamly: 'sweden', iso: 'SE', aviroam: ['sweden'] },
  { display: 'Switzerland', iroamly: 'switzerland', iso: 'CH', aviroam: ['switzerland'] },
  { display: 'Belgium', iroamly: 'belgium', iso: 'BE', aviroam: ['belgium'] },
  { display: 'Czech Republic', iroamly: 'czech-republic', iso: 'CZ', aviroam: ['czech republic'] },
  { display: 'Finland', iroamly: 'finland', iso: 'FI', aviroam: ['finland'] },
  { display: 'French Guiana', iroamly: 'french-guiana', iso: 'GF', aviroam: ['french guiana'] },
  { display: 'Lithuania', iroamly: 'lithuania', iso: 'LT', aviroam: ['lithuania'] },
  { display: 'Malta', iroamly: 'malta', iso: 'MT', aviroam: ['malta'] },
  { display: 'Netherlands', iroamly: 'netherlands', iso: 'NL', aviroam: ['netherlands'] },
  { display: 'Norway', iroamly: 'norway', iso: 'NO', aviroam: ['norway'] },
  { display: 'Poland', iroamly: 'poland', iso: 'PL', aviroam: ['poland'] },
  { display: 'Portugal', iroamly: 'portugal', iso: 'PT', aviroam: ['portugal'] },
  { display: 'Romania', iroamly: 'romania', iso: 'RO', aviroam: ['romania'] },
  { display: 'Slovakia', iroamly: 'slovakia', iso: 'SK', aviroam: ['slovakia'] },
  { display: 'Slovenia', iroamly: 'slovenia', iso: 'SI', aviroam: ['slovenia'] },
  { display: 'Réunion', iroamly: 'reunion', iso: 'RE', aviroam: ['reunion', 'réunion'] },
  { display: 'Gibraltar', iroamly: 'gibraltar', iso: 'GI', aviroam: ['gibraltar'] },
  { display: 'Bosnia and Herzegovina', iroamly: 'bosnia-and-herzegovina', iso: 'BA', aviroam: ['bosnia and herzegovina'] },
  { display: 'North Macedonia', iroamly: 'north-macedonia', iso: 'MK', aviroam: ['north macedonia'] },
  { display: 'Isle of Man', iroamly: 'isle-of-man', iso: 'IM', aviroam: ['isle of man'] },
  { display: 'Jersey', iroamly: 'jersey', iso: 'JE', aviroam: ['jersey'] },
  { display: 'Congo Dem. Rep', iroamly: 'congo', iso: 'CD', aviroam: ['congo dem', 'democratic republic'] },
  { display: 'South Africa', iroamly: 'south-africa', iso: 'ZA', aviroam: ['south africa'] },
  { display: 'Mongolia', iroamly: 'mongolia', iso: 'MN', aviroam: ['mongolia'] },
  { display: 'Afghanistan', iroamly: 'afghanistan', iso: 'AF', aviroam: ['afghanistan'] },
  { display: 'Ecuador', iroamly: 'ecuador', iso: 'EC', aviroam: ['ecuador'] },
  { display: 'Georgia', iroamly: 'georgia', iso: 'GE', aviroam: ['georgia'] },
  { display: 'Guam', iroamly: 'guam', iso: 'GU', aviroam: ['guam'] },
  { display: 'Kenya', iroamly: 'kenya', iso: 'KE', aviroam: ['kenya'] },
  { display: 'Madagascar', iroamly: 'madagascar', iso: 'MG', aviroam: ['madagascar'] },
  { display: 'Malawi', iroamly: 'malawi', iso: 'MW', aviroam: ['malawi'] },
  { display: 'Peru', iroamly: 'peru', iso: 'PE', aviroam: ['peru'] },
  { display: 'Niger', iroamly: 'niger', iso: 'NE', aviroam: ['niger'] },
  { display: 'Northern Mariana Islands (incl. Saipan)', iroamly: 'saipan', iso: 'MP', aviroam: ['saipan', 'northern mariana'] },
  { display: 'Ghana', iroamly: 'ghana', iso: 'GH', aviroam: ['ghana'] },
  { display: 'Sri Lanka', iroamly: 'sri-lanka', iso: 'LK', aviroam: ['sri lanka'] },
  { display: 'Pakistan', iroamly: 'pakistan', iso: 'PK', aviroam: ['pakistan'] },
  { display: 'Dominican Republic', iroamly: 'dominican-republic', iso: 'DO', aviroam: ['dominican republic'] },
  { display: 'Nigeria', iroamly: 'nigeria', iso: 'NG', aviroam: ['nigeria'] },
  { display: 'Serbia', iroamly: 'serbia', iso: 'RS', aviroam: ['serbia'] },
  { display: 'Sudan', iroamly: 'sudan', iso: 'SD', aviroam: ['sudan'] },
  { display: 'Tanzania', iroamly: 'tanzania', iso: 'TZ', aviroam: ['tanzania'] },
  { display: 'Brunei', iroamly: 'brunei', iso: 'BN', aviroam: ['brunei'] },
  { display: 'Uganda', iroamly: 'uganda', iso: 'UG', aviroam: ['uganda'] },
  { display: 'Uruguay', iroamly: 'uruguay', iso: 'UY', aviroam: ['uruguay'] },
  { display: 'Chile', iroamly: 'chile', iso: 'CL', aviroam: ['chile'] },
  { display: 'Mexico', iroamly: 'mexico', iso: 'MX', aviroam: ['mexico'] },
  { display: 'Laos', iroamly: 'laos', iso: 'LA', aviroam: ['laos'] },
  { display: 'Brazil', iroamly: 'brazil', iso: 'BR', aviroam: ['brazil'] },
  { display: 'Guernsey', iroamly: 'guernsey', iso: 'GG', aviroam: ['guernsey'] },
  { display: 'Mauritius', iroamly: 'mauritius', iso: 'MU', aviroam: ['mauritius'] },
  { display: 'Morocco', iroamly: 'morocco', iso: 'MA', aviroam: ['morocco'] },
  { display: 'Jordan', iroamly: 'jordan', iso: 'JO', aviroam: ['jordan'] },
  { display: 'Balkan Peninsula', iroamly: 'balkan-peninsula', iso: null, aviroam: ['balkan'] },
  { display: 'Moldova', iroamly: 'moldova', iso: 'MD', aviroam: ['moldova'] },
  { display: 'Algeria', iroamly: 'algeria', iso: 'DZ', aviroam: ['algeria'] },
  { display: 'Chad', iroamly: 'chad', iso: 'TD', aviroam: ['chad'] },
  { display: 'Republic of the Congo', iroamly: 'congo-republic', iso: 'CG', aviroam: ['republic of the congo', 'congo republic'] },
  { display: 'Gabon', iroamly: 'gabon', iso: 'GA', aviroam: ['gabon'] },
  { display: 'Tunisia', iroamly: 'tunisia', iso: 'TN', aviroam: ['tunisia'] },
  { display: 'Canada', iroamly: 'canada', iso: 'CA', aviroam: ['canada'] },
  { display: 'Bahrain', iroamly: 'bahrain', iso: 'BH', aviroam: ['bahrain'] },
  { display: 'Australia', iroamly: 'australia', iso: 'AU', aviroam: ['australia'] },
  { display: 'New Zealand', iroamly: 'new-zealand', iso: 'NZ', aviroam: ['new zealand'] },
  { display: 'Azerbaijan', iroamly: 'azerbaijan', iso: 'AZ', aviroam: ['azerbaijan'] },
  { display: 'Argentina', iroamly: 'argentina', iso: 'AR', aviroam: ['argentina'] },
  { display: 'Armenia', iroamly: 'armenia', iso: 'AM', aviroam: ['armenia'] },
  { display: 'Faroe Islands', iroamly: 'faroe-islands', iso: 'FO', aviroam: ['faroe islands'] },
  { display: 'Andorra', iroamly: 'andorra', iso: 'AD', aviroam: ['andorra'] },
  { display: 'Oman', iroamly: 'oman', iso: 'OM', aviroam: ['oman'] },
  { display: 'Bangladesh', iroamly: 'bangladesh', iso: 'BD', aviroam: ['bangladesh'] },
  { display: 'Russia', iroamly: 'russia', iso: 'RU', aviroam: ['russia'] },
  { display: 'Hong Kong', iroamly: 'hong-kong', iso: 'HK', aviroam: ['hong kong', 'hongkong'] },
  { display: 'Kyrgyzstan', iroamly: 'kyrgyzstan', iso: 'KG', aviroam: ['kyrgyzstan'] },
  { display: 'Turks and Caicos Islands', iroamly: 'turks-and-caicos-islands', iso: 'TC', aviroam: ['turks and caicos islands'] },
  { display: 'Saint Vincent and the Grenadines', iroamly: 'saint-vincent-and-the-grenadines', iso: 'VC', aviroam: ['saint vincent and the grenadines'] },
  { display: 'Saint Kitts and Nevis', iroamly: 'saint-kitts-and-nevis', iso: 'KN', aviroam: ['saint kitts and nevis'] },
  { display: 'Antigua and Barbuda', iroamly: 'antigua-and-barbuda', iso: 'AG', aviroam: ['antigua and barbuda'] },
  { display: 'Saint Lucia', iroamly: 'saint-lucia', iso: 'LC', aviroam: ['saint lucia'] },
  { display: 'Grenada', iroamly: 'grenada', iso: 'GD', aviroam: ['grenada'] },
  { display: 'Guadeloupe', iroamly: 'guadeloupe', iso: 'GP', aviroam: ['guadeloupe'] },
  { display: 'Nepal', iroamly: 'nepal', iso: 'NP', aviroam: ['nepal'] },
  { display: 'Paraguay', iroamly: 'paraguay', iso: 'PY', aviroam: ['paraguay'] },
  { display: 'Cayman Islands', iroamly: 'cayman-islands', iso: 'KY', aviroam: ['cayman islands'] },
  { display: 'Colombia', iroamly: 'colombia', iso: 'CO', aviroam: ['colombia'] },
  { display: 'Dominica', iroamly: 'dominica', iso: 'DM', aviroam: ['dominica'] },
  { display: 'Anguilla', iroamly: 'anguilla', iso: 'AI', aviroam: ['anguilla'] },
  { display: 'Barbados', iroamly: 'barbados', iso: 'BB', aviroam: ['barbados'] },
  { display: 'Liberia', iroamly: 'liberia', iso: 'LR', aviroam: ['liberia'] },
  { display: 'Aruba', iroamly: 'aruba', iso: 'AW', aviroam: ['aruba'] },
  { display: 'Bermuda', iroamly: 'bermuda', iso: 'BM', aviroam: ['bermuda'] },
  { display: 'Cameroon', iroamly: 'cameroon', iso: 'CM', aviroam: ['cameroon'] },
  { display: 'Fiji', iroamly: 'fiji', iso: 'FJ', aviroam: ['fiji'] },
  { display: 'Guatemala', iroamly: 'guatemala', iso: 'GT', aviroam: ['guatemala'] },
  { display: 'Haiti', iroamly: 'haiti', iso: 'HT', aviroam: ['haiti'] },
  { display: 'Honduras', iroamly: 'honduras', iso: 'HN', aviroam: ['honduras'] },
  { display: 'Martinique', iroamly: 'martinique', iso: 'MQ', aviroam: ['martinique'] },
  { display: 'Mozambique', iroamly: 'mozambique', iso: 'MZ', aviroam: ['mozambique'] },
  { display: 'Nicaragua', iroamly: 'nicaragua', iso: 'NI', aviroam: ['nicaragua'] },
  { display: 'Seychelles', iroamly: 'seychelles', iso: 'SC', aviroam: ['seychelles'] },
  { display: 'Sierra Leone', iroamly: 'sierra-leone', iso: 'SL', aviroam: ['sierra leone'] },
  { display: 'Tonga', iroamly: 'tonga', iso: 'TO', aviroam: ['tonga'] },
  { display: 'Zambia', iroamly: 'zambia', iso: 'ZM', aviroam: ['zambia'] },
  { display: 'Papua New Guinea', iroamly: 'papua-new-guinea', iso: 'PG', aviroam: ['papua new guinea'] },
  { display: "Cote d'Ivoire", iroamly: 'cote-d-ivoire', iso: 'CI', aviroam: ['ivory coast', "cote d'ivoire", 'cote divoire'] },
  { display: 'Rwanda', iroamly: 'rwanda', iso: 'RW', aviroam: ['rwanda'] },
  { display: 'Eswatini', iroamly: 'eswatini', iso: 'SZ', aviroam: ['eswatini'] },
  { display: 'Trinidad and Tobago', iroamly: 'trinidad-and-tobago', iso: 'TT', aviroam: ['trinidad and tobago'] },
  { display: 'Vanuatu', iroamly: 'vanuatu', iso: 'VU', aviroam: ['vanuatu'] },
  { display: 'Yemen', iroamly: 'yemen', iso: 'YE', aviroam: ['yemen'] },
  { display: 'Belarus', iroamly: 'belarus', iso: 'BY', aviroam: ['belarus'] },
  { display: 'Costa Rica', iroamly: 'costa-rica', iso: 'CR', aviroam: ['costa rica'] },
  { display: 'El Salvador', iroamly: 'el-salvador', iso: 'SV', aviroam: ['el salvador'] },
  { display: 'Panama', iroamly: 'panama', iso: 'PA', aviroam: ['panama'] },
  { display: 'Tajikistan', iroamly: 'tajikistan', iso: 'TJ', aviroam: ['tajikistan'] },
  { display: 'Macau', iroamly: 'macau', iso: 'MO', aviroam: ['macau'] },
  { display: 'Saint Barthelemy', iroamly: 'saint-barthelemy', iso: 'BL', aviroam: ['saint barthelemy'] },
  { display: 'Saint Martin', iroamly: 'saint-martin', iso: 'MF', aviroam: ['saint martin'] },
  { display: 'Maldives', iroamly: 'maldives', iso: 'MV', aviroam: ['maldives'] },
  { display: 'Israel', iroamly: 'israel', iso: 'IL', aviroam: ['israel'] },
  { display: 'Monaco', iroamly: 'monaco', iso: 'MC', aviroam: ['monaco'] },
  { display: 'San Marino', iroamly: 'san-marino', iso: 'SM', aviroam: ['san marino'] },
  { display: 'Vatican City', iroamly: 'vatican-city', iso: 'VA', aviroam: ['vatican city'] },
];


let hargaLoaded = false;

// FIX 1: openHargaModal → floating panel (bisa chat sambil lihat harga)
function openHargaModal() {
  const panel = document.getElementById('panel-harga');
  if (!panel) return;
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';

  const isMobile = window.innerWidth < 600;
  if (isMobile) {
    // Mobile: lebar penuh layar, posisi kiri atas
    panel.style.width  = (window.innerWidth - 16) + 'px';
    panel.style.height = '85vh';
    panel.style.left   = '8px';
    panel.style.top    = '72px';
    panel.style.right  = 'auto';
  } else {
    // Desktop: restore ukuran dari localStorage
    const savedW = localStorage.getItem('hargaPanel_w');
    const savedH = localStorage.getItem('hargaPanel_h');
    if (savedW) panel.style.width  = savedW;
    if (savedH) panel.style.height = savedH;
    // Clamp posisi supaya tidak keluar layar
    const rect = panel.getBoundingClientRect();
    if (rect.left < 0) { panel.style.left = '8px'; panel.style.right = 'auto'; }
    if (rect.right > window.innerWidth) { panel.style.left = Math.max(8, window.innerWidth - panel.offsetWidth - 8) + 'px'; panel.style.right = 'auto'; }
  }

  // Observer untuk simpan ukuran saat di-resize (hanya desktop)
  if (!panel._resizeObserver && !isMobile) {
    panel._resizeObserver = new ResizeObserver(() => {
      localStorage.setItem('hargaPanel_w', panel.style.width  || panel.offsetWidth  + 'px');
      localStorage.setItem('hargaPanel_h', panel.style.height || panel.offsetHeight + 'px');
    });
    panel._resizeObserver.observe(panel);
  }

  // Load settings dari D1 dulu, baru load data harga
  hargaLoadSettings().then(() => {
    if (!hargaLoaded) loadHargaData();
  });
  initHargaPanelDrag();
  initHargaPanelResize();
}

function initHargaPanelResize() {
  const panel  = document.getElementById('panel-harga');
  const handle = document.getElementById('panel-harga-resize');
  if (!panel || !handle) return;

  handle.addEventListener('mousedown', function(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = panel.offsetWidth;
    const startH = panel.offsetHeight;

    function onMove(e) {
      const newW = Math.max(400, startW + (e.clientX - startX));
      const newH = Math.max(300, startH + (e.clientY - startY));
      panel.style.width  = newW + 'px';
      panel.style.height = newH + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      localStorage.setItem('hargaPanel_w', panel.style.width);
      localStorage.setItem('hargaPanel_h', panel.style.height);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

async function hargaLoadSettings() {
  try {
    const keys = ['esim_kurs_usd', 'esim_markup_pct'];
    if (!window._appSettings) window._appSettings = {};
    for (const key of keys) {
      const res = await fetch(`${API}?action=getSetting&key=${key}`);
      const data = await res.json();
      if (data.ok && data.value !== null) {
        window._appSettings[key] = data.value;
        localStorage.setItem(key, data.value);
      }
    }
    // Sync ke input
    const kursEl   = document.getElementById('h-kurs-usd');
    const markupEl = document.getElementById('h-markup-pct');
    if (kursEl)   kursEl.value   = window._appSettings['esim_kurs_usd']   || localStorage.getItem('esim_kurs_usd')   || '16000';
    if (markupEl) markupEl.value = window._appSettings['esim_markup_pct'] || localStorage.getItem('esim_markup_pct') || '20';
  } catch(e) { console.warn('[hargaLoadSettings]', e); }
}

async function hargaSaveSetting(key, value) {
  if (!window._appSettings) window._appSettings = {};
  window._appSettings[key] = value;
  localStorage.setItem(key, value);
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveSetting', key, value })
    });
  } catch(e) { console.warn('[hargaSaveSetting]', e); }
}

function closeHargaPanel() {
  const panel = document.getElementById('panel-harga');
  if (panel) panel.style.display = 'none';
}

function hargaReset() {
  document.getElementById('h-country-search').value = '';
  document.getElementById('h-country').value = '';
  document.getElementById('h-country-dropdown').style.display = 'none';
  const selD = document.getElementById('h-day');
  const selP = document.getElementById('h-pkg');
  selD.innerHTML = '<option value="">— Semua durasi —</option>';
  selD.disabled = true;
  selP.innerHTML = '<option value="">— Semua paket —</option>';
  selP.disabled = true;
  document.getElementById('h-result').innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara — lalu durasi <b>atau</b> paket data</div>';
  document.getElementById('h-loading').style.display = 'none';
  window._aviroamRows = null;
  window._selectedCountry = null;
  window._esimcardCache = {};
  window._esimAccessCache = {};
  window._iroamlyCache = {};
}

function initHargaPanelDrag() {
  const panel = document.getElementById('panel-harga');
  const header = document.getElementById('panel-harga-header');
  if (!panel || !header || header._dragInit) return;
  header._dragInit = true;
  let isDragging = false, startX, startY, origLeft, origTop;
  function dragStart(cx, cy) {
    isDragging = true;
    startX = cx; startY = cy;
    const rect = panel.getBoundingClientRect();
    origLeft = rect.left; origTop = rect.top;
    header.style.cursor = 'grabbing';
  }
  function dragMove(cx, cy) {
    if (!isDragging) return;
    const newLeft = Math.max(0, Math.min(origLeft + cx - startX, window.innerWidth  - panel.offsetWidth));
    const newTop  = Math.max(0, Math.min(origTop  + cy - startY, window.innerHeight - panel.offsetHeight));
    panel.style.left = newLeft + 'px';
    panel.style.top  = newTop  + 'px';
    panel.style.right = 'auto';
  }
  function dragEnd() { if (isDragging) { isDragging = false; header.style.cursor = 'grab'; } }
  header.addEventListener('mousedown', (e) => { dragStart(e.clientX, e.clientY); e.preventDefault(); });
  document.addEventListener('mousemove', (e) => dragMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', dragEnd);
  // Touch support
  header.addEventListener('touchstart', (e) => { const t = e.touches[0]; dragStart(t.clientX, t.clientY); }, { passive: true });
  document.addEventListener('touchmove', (e) => { if (!isDragging) return; const t = e.touches[0]; dragMove(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
  document.addEventListener('touchend', dragEnd);
}

async function loadHargaData() {
  const loading = document.getElementById('h-loading');
  const result  = document.getElementById('h-result');
  result.innerHTML = '';

  // Coba load dari cache localStorage dulu (instan)
  const CACHE_VERSION = 'v2'; // increment ini kalau struktur data berubah
  try {
    const cached = localStorage.getItem('hargaData_cache');
    const cachedAt = parseInt(localStorage.getItem('hargaData_cache_at') || '0');
    const cachedVer = localStorage.getItem('hargaData_cache_ver') || '';
    const cacheAge = Date.now() - cachedAt;
    if (cached && cacheAge < 30 * 60 * 1000 && cachedVer === CACHE_VERSION) { // cache 30 menit
      hargaData = JSON.parse(cached);
      hargaLoaded = true;
      window._hargaCountries = GOHO_COUNTRIES.map(c => c.display);
      result.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara — lalu durasi <b>atau</b> paket data</div>';
      loading.style.display = 'none';
      // Fetch di background untuk update cache
      fetchHargaDataBackground();
      return;
    }
  } catch(e) {}

  // Tidak ada cache — fetch dan tampilkan loading
  loading.style.display = 'block';
  await fetchHargaDataBackground();
  loading.style.display = 'none';
  result.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara — lalu durasi <b>atau</b> paket data</div>';
}

async function fetchHargaDataBackground() {
  try {
    const res = await apiGet({ action: 'getHargaSim' });
    if (res.ok && res.data && res.data.length > 0) {
      hargaData = res.data.map(r => {
        r[0] = (r[0] || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        return r;
      });
      hargaLoaded = true;
      window._hargaCountries = GOHO_COUNTRIES.map(c => c.display);
      // Simpan ke cache
      try {
        localStorage.setItem('hargaData_cache', JSON.stringify(hargaData));
        localStorage.setItem('hargaData_cache_at', Date.now().toString());
        localStorage.setItem('hargaData_cache_ver', CACHE_VERSION);
      } catch(e) {}
    }
  } catch(e) {
    hargaLoaded = true;
    window._hargaCountries = GOHO_COUNTRIES.map(c => c.display);
  }
}

// FIX 3: Searchable country dropdown
function hargaShowCountryDropdown() {
  hargaFilterCountry(document.getElementById('h-country-search').value);
}

function hargaFilterCountry(query) {
  const dd = document.getElementById('h-country-dropdown');
  const countries = window._hargaCountries || [];
  const q = (query || '').toLowerCase().trim();
  const filtered = q ? countries.filter(c => c.toLowerCase().includes(q)) : countries;
  if (!filtered.length || !hargaLoaded) { dd.style.display = 'none'; return; }
  window._hargaFiltered = filtered.slice(0, 30);
  dd.innerHTML = window._hargaFiltered.map((c, i) =>
    `<div onclick="hargaSelectByIndex(${i})" style="padding:8px 10px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border);" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='white'">${c}</div>`
  ).join('');
  dd.style.display = 'block';
}

function hargaSelectByIndex(i) {
  const country = window._hargaFiltered[i];
  if (!country) return;
  document.getElementById('h-country-search').value = country;
  document.getElementById('h-country').value = country;
  document.getElementById('h-country-dropdown').style.display = 'none';
  // Simpan object negara yang dipilih
  window._selectedCountry = GOHO_COUNTRIES.find(c => c.display === country) || null;
  hargaUpdateDay();
}

function hargaSelectCountry(country) {
  const clean = (country || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  document.getElementById('h-country-search').value = clean;
  document.getElementById('h-country').value = clean;
  document.getElementById('h-country-dropdown').style.display = 'none';
  window._selectedCountry = GOHO_COUNTRIES.find(c => c.display === clean) || null;
  hargaUpdateDay();
}

// Tutup dropdown dengan delay supaya klik item sempat terjadi dulu
document.getElementById('h-country-search') && document.getElementById('h-country-search').addEventListener('blur', function() {
  setTimeout(() => {
    const dd = document.getElementById('h-country-dropdown');
    if (dd) dd.style.display = 'none';
  }, 200);
});

document.addEventListener('click', function(e) {
  const dd = document.getElementById('h-country-dropdown');
  const inp = document.getElementById('h-country-search');
  if (dd && inp && !dd.contains(e.target) && e.target !== inp) dd.style.display = 'none';
});
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


// hargaUpdateDay — populate durasi + paket saat negara dipilih, kedua dropdown langsung enable
function hargaUpdateDay() {
  const displayName = document.getElementById('h-country').value;
  const countryObj  = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === displayName);
  const selD = document.getElementById('h-day');
  const selP = document.getElementById('h-pkg');
  selD.innerHTML = '<option value="">— Semua durasi —</option>';
  selP.innerHTML = '<option value="">— Semua paket —</option>';
  selD.disabled = !displayName;
  selP.disabled = !displayName;
  if (!displayName) {
    document.getElementById('h-result').innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara — lalu durasi <b>atau</b> paket data</div>';
    return;
  }
  window._esimcardCache = {};
  window._esimAccessCache = {};
  window._iroamlyCache = {};

  const avKeywords = countryObj?.aviroam || [displayName.toLowerCase()];
  let aviroamRows = hargaData.filter(r => {
    const name = (r[0] || '').toLowerCase().trim();
    return avKeywords.some(kw => name === kw.toLowerCase());
  });
  if (!aviroamRows.length) {
    aviroamRows = hargaData.filter(r => {
      const name = (r[0] || '').toLowerCase();
      return avKeywords.some(kw => name.includes(kw)) && name.length <= 35;
    });
  }
  if (!aviroamRows.length) {
    aviroamRows = hargaData.filter(r => {
      const name = (r[0] || '').toLowerCase();
      return avKeywords.some(kw => name.includes(kw));
    });
  }
  window._aviroamRows = aviroamRows;

  const avDays = [...new Set(aviroamRows.map(r => r[2]))].sort((a,b) => a-b);
  const stdDays = [1,2,3,4,5,6,7,8,9,10,12,14,15,20,25,30];
  const days = avDays.length ? avDays : stdDays;
  days.forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d + ' hari'; selD.appendChild(o); });

  const allPkgs = [...new Set(aviroamRows.map(r => r[1]).filter(Boolean))];
  if (allPkgs.length) {
    allPkgs.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; selP.appendChild(o); });
  } else {
    ['500MB / day','1GB / day','2GB / day','3GB / day','5GB','10GB','20GB','30GB','50GB','Unlimited'].forEach(p => {
      const o = document.createElement('option'); o.value = p; o.textContent = p; selP.appendChild(o);
    });
  }
  document.getElementById('h-result').innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih durasi <b>atau</b> paket data untuk melihat harga</div>';
}

// Handler saat durasi berubah — rebuild paket dropdown lalu auto-search
function hargaOnDayChange() {
  const d = parseInt(document.getElementById('h-day').value);
  const selP = document.getElementById('h-pkg');
  const currentPkg = selP.value;
  const rowsForDay = d ? (window._aviroamRows || []).filter(r => r[2] === d) : (window._aviroamRows || []);
  const pkgs = [...new Set(rowsForDay.map(r => r[1]).filter(Boolean))];
  selP.innerHTML = '<option value="">— Semua paket —</option>';
  if (pkgs.length) {
    pkgs.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; selP.appendChild(o); });
  } else {
    ['500MB / day','1GB / day','2GB / day','3GB / day','5GB','10GB','20GB','30GB','50GB','Unlimited'].forEach(p => {
      const o = document.createElement('option'); o.value = p; o.textContent = p; selP.appendChild(o);
    });
  }
  if (currentPkg && selP.querySelector(`option[value="${currentPkg}"]`)) selP.value = currentPkg;
  const country = document.getElementById('h-country').value;
  if (country && d) hargaShowResult();
}

// Handler saat paket berubah — auto-search
function hargaOnPkgChange() {
  const country = document.getElementById('h-country').value;
  const pkg = document.getElementById('h-pkg').value;
  if (country && pkg) hargaShowResult();
}

// hargaUpdatePkg — legacy stub
function hargaUpdatePkg() { hargaOnDayChange(); }
// FIX 2: hargaUpdatePkg — hanya tampil paket yang tersedia untuk negara + durasi ini
function hargaUpdatePkg() {
  const d = parseInt(document.getElementById('h-day').value);
  const selP = document.getElementById('h-pkg');
  selP.innerHTML = '<option value="">— Pilih durasi <b>atau</b> paket data untuk melihat harga —</option>';
  selP.disabled = !d;
  document.getElementById('h-result').innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih durasi <b>atau</b> paket data untuk melihat harga</div>';
  if (!d) return;

  // Ambil paket dari Aviroam untuk durasi EXACT ini saja
  const rowsForDay = (window._aviroamRows || []).filter(r => r[2] === d);
  const pkgs = [...new Set(rowsForDay.map(r => r[1]).filter(Boolean))];

  if (pkgs.length) {
    // Ada data Aviroam — tampilkan nama paket asli
    pkgs.forEach(p => {
      const o = document.createElement('option');
      o.value = p; o.textContent = p;
      selP.appendChild(o);
    });
  } else {
    // Tidak ada data Aviroam untuk durasi ini
    // Tampilkan pilihan generic supaya eSIM Access & iRoamly tetap bisa dicari
    selP.innerHTML += '<option value="__noaviroam__" disabled style="color:#999">— Aviroam tidak punya paket ini —</option>';
    ['500MB / day','1GB / day','2GB / day','3GB / day',
     '5GB','10GB','20GB','30GB','50GB','Unlimited'].forEach(p => {
      const o = document.createElement('option');
      o.value = p; o.textContent = p;
      selP.appendChild(o);
    });
  }
}

// ===== HARGA v2: kurs & markup helpers =====
function hargaGetKurs() {
  return parseFloat(window._appSettings?.esim_kurs_usd || localStorage.getItem('esim_kurs_usd') || '16000');
}
function hargaGetMarkup() {
  return parseFloat(window._appSettings?.esim_markup_pct || localStorage.getItem('esim_markup_pct') || '20');
}
function hargaFmtIDR(v) {
  return v ? 'Rp ' + Number(v).toLocaleString('id-ID') : '—';
}
function hargaRowAviroam(label, value, type) {
  const color = type === 'customer' ? '#1d4ed8' : '#166534';
  const bg    = type === 'customer' ? '#dbeafe'  : '#dcfce7';
  const badge = type === 'customer' ? 'Customer' : 'Agen';
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);">
    <span style="font-size:11px;color:var(--text-muted);">${label} <span style="background:${bg};color:${color};font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;">${badge}</span></span>
    <span style="font-size:13px;font-weight:600;color:${color};">${value}</span>
  </div>`;
}

async function hargaShowResult() {
  const displayName = document.getElementById('h-country').value;
  const p = document.getElementById('h-pkg').value;   // '' = semua paket
  const d = parseInt(document.getElementById('h-day').value) || 0; // 0 = semua durasi
  const resultEl = document.getElementById('h-result');
  if (!displayName) { resultEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara dulu</div>'; return; }
  if (!p && !d) { resultEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih durasi <b>atau</b> paket data untuk melihat harga</div>'; return; }

  const countryObj = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === displayName);

  const avKeywords = countryObj?.aviroam || [displayName.toLowerCase()];
  const genericPkgs = ['500MB / day','1GB / day','2GB / day','3GB / day','5GB','10GB','20GB','30GB','50GB','Unlimited'];
  const isGenericPkg = genericPkgs.includes(p);
  let avRows = [];
  if (!isGenericPkg) {
    const src = window._aviroamRows || hargaData;
    const matchDur = (r) => !d || r[2] === d;
    const matchPkg = (r) => !p || r[1] === p;
    avRows = src.filter(r => {
      const name = (r[0] || '').toLowerCase().trim();
      return matchDur(r) && matchPkg(r) && avKeywords.some(kw => name === kw.toLowerCase());
    });
    if (!avRows.length) {
      avRows = src.filter(r => {
        const name = (r[0] || '').toLowerCase();
        return matchDur(r) && matchPkg(r) && avKeywords.some(kw => name.includes(kw)) && name.length <= 35;
      });
    }
    if (!avRows.length) {
      avRows = src.filter(r => {
        const name = (r[0] || '').toLowerCase();
        return matchDur(r) && matchPkg(r) && avKeywords.some(kw => name.includes(kw));
      });
    }
  }
  // Dedup berdasarkan negara+paket+durasi (bukan negara saja)
  const avRowsUniq = avRows.filter((r, i, arr) =>
    arr.findIndex(x => x[0] === r[0] && x[1] === r[1] && x[2] === r[2]) === i
  );
  const row = avRowsUniq[0] || null;
  const [,,,,,, esimPar] = row || [null,null,d,0,0,0,0];
  const effectiveDay = d || (row ? row[2] : 7);
  const c = displayName;

  const kurs   = hargaGetKurs();
  const markup = hargaGetMarkup();

  // Sync input values dari localStorage saat render
  const kursEl   = document.getElementById('h-kurs-usd');
  const markupEl = document.getElementById('h-markup-pct');
  if (kursEl)   kursEl.value   = kurs;
  if (markupEl) markupEl.value = markup;

  // Build Aviroam cards — satu card per kategori
  const aviroamCards = avRowsUniq.length === 0
    ? '<div style="font-size:11px;color:var(--text-muted);">Data tidak tersedia</div>'
    : avRowsUniq.map(r => {
        const [,,,simPub, simPar, esimPub, esimPar] = r;
        const rowDur = r[2] ? `${r[2]} hari` : '';
        const rowPkg = r[1] ? escH(r[1]) : '';
        const badgeExtra = (!d || !p) ? `<span style="font-size:9px;color:#0369a1;background:#e0f2fe;border-radius:3px;padding:1px 5px;margin-left:4px;">${[rowDur, rowPkg].filter(Boolean).join(' · ')}</span>` : '';
        return `
          <div style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:8px;">
            <div style="margin-bottom:6px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
              <div style="font-size:9px;color:#6366f1;background:#ede9fe;border-radius:4px;padding:2px 6px;display:inline-block;">🌏 ${escH(r[0])}</div>
              ${badgeExtra}
            </div>
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.4px;">SIM Card</div>
            ${hargaRowAviroam('Publish', hargaFmtIDR(simPub), 'customer')}
            ${hargaRowAviroam('Partner', hargaFmtIDR(simPar), 'agen')}
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);margin:6px 0 4px;text-transform:uppercase;letter-spacing:0.4px;">eSIM</div>
            ${hargaRowAviroam('Publish', hargaFmtIDR(esimPub), 'customer')}
            ${hargaRowAviroam('Partner', hargaFmtIDR(esimPar), 'agen')}
          </div>`;
      }).join('');

  const summaryParts = [];
  if (d) summaryParts.push(`${d} hari`);
  if (p) summaryParts.push(escH(p));
  const summaryLabel = summaryParts.length ? summaryParts.join(' &bull; ') : 'Semua paket';

  resultEl.innerHTML = `
    <div style="display:inline-block;background:var(--bg);border:1px solid var(--border);border-radius:6px;font-size:11px;padding:3px 10px;color:var(--text-muted);margin-bottom:1rem;">${summaryLabel}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">

      <!-- KIRI: Aviroam -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px;">🌐 Aviroam</div>
        ${aviroamCards}
      </div>

      <!-- TENGAH: eSIM Access -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;">📡 eSIM Access</div>
        <div id="esim-access-result" style="font-size:12px;color:var(--text-muted);">
          <i class="ti ti-loader spin"></i> Memuat...
        </div>
      </div>

      <!-- KANAN: iRoamly -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;">🟣 iRoamly</div>
        <div id="iroamly-result" style="font-size:12px;color:var(--text-muted);">
          <i class="ti ti-loader spin"></i> Memuat...
        </div>
      </div>

      <!-- KANAN 2: eSIMCard -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;">🟦 eSIMCard</div>
        <div style="display:flex;gap:6px;margin-bottom:8px;">
          <button onclick="esimcardOpenRiwayat()" style="font-size:10px;padding:4px 10px;background:#f1f5f9;border:1px solid var(--border);border-radius:5px;cursor:pointer;font-family:var(--font);">📋 Riwayat eSIM</button>
          <button onclick="esimcardOpenSettingEmail()" style="font-size:10px;padding:4px 10px;background:#f1f5f9;border:1px solid var(--border);border-radius:5px;cursor:pointer;font-family:var(--font);">⚙️ Setting Email</button>
        </div>
        <div id="esimcard-result" style="font-size:12px;color:var(--text-muted);">
          <i class="ti ti-loader spin"></i> Memuat...
        </div>
      </div>

    </div>`;

  // Fetch eSIM Access, iRoamly & eSIMCard (async, tidak block render Aviroam)
  loadEsimAccessPrice(c, effectiveDay, kurs, markup, parseFloat(esimPar) || 0);
  loadIroamlyPrice(c, effectiveDay, kurs, markup, parseFloat(esimPar) || 0);
  loadEsimCardPrice(c, effectiveDay, kurs, markup, parseFloat(esimPar) || 0);
}

// Mapping nama negara Aviroam → ISO code eSIM Access
const ESIM_COUNTRY_MAP = {
  'Malaysia': 'MY', 'China': 'CN', 'Singapore': 'SG', 'Thailand': 'TH',
  'Japan': 'JP', 'South Korea': 'KR', 'Korea': 'KR', 'Hong Kong': 'HK',
  'Taiwan': 'TW', 'Indonesia': 'ID', 'Philippines': 'PH', 'Vietnam': 'VN',
  'Cambodia': 'KH', 'Myanmar': 'MM', 'Laos': 'LA', 'Brunei': 'BN',
  'India': 'IN', 'Australia': 'AU', 'New Zealand': 'NZ', 'United Kingdom': 'GB',
  'UK': 'GB', 'USA': 'US', 'United States': 'US', 'Europe': 'EU',
  'Saudi Arabia': 'SA', 'UAE': 'AE', 'United Arab Emirates': 'AE',
  'Turkey': 'TR', 'Egypt': 'EG', 'France': 'FR', 'Germany': 'DE',
  'Italy': 'IT', 'Spain': 'ES', 'Netherlands': 'NL', 'Switzerland': 'CH',
  'Canada': 'CA', 'Mexico': 'MX', 'Brazil': 'BR', 'Argentina': 'AR',
  'South Africa': 'ZA', 'Kenya': 'KE', 'Morocco': 'MA',
  'Bangladesh': 'BD', 'Pakistan': 'PK', 'Sri Lanka': 'LK', 'Nepal': 'NP',
  'Macau': 'MO', 'Macao': 'MO', 'Russia': 'RU', 'Kazakhstan': 'KZ',
};

async function loadEsimAccessPrice(countryDisplay, day, kurs, markup, aviroamPartnerEsim) {
  const el = document.getElementById('esim-access-result');
  if (!el) return;
  try {
    const countryObjEA = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === countryDisplay);
    const code = countryObjEA?.iso || countryDisplay.toUpperCase().substring(0, 2);
    const selDay = parseInt(document.getElementById('h-day')?.value) || 0;
    const selPkg = (document.getElementById('h-pkg')?.value || '').trim();

    const cacheKey = `esimaccess_pkgs_${code}`;
    let rawPackages = window._esimAccessCache?.[cacheKey];
    if (!rawPackages) {
      const res = await fetch(
        `https://goho-proxy.gohotravel.workers.dev?action=getEsimPackages&country=${encodeURIComponent(code)}`
      );
      const data = await res.json();
      if (!data.ok || !data.data || data.data.success === false) {
        const errMsg = data.data?.errorMsg || 'Negara tidak didukung';
        el.innerHTML = `<span style="font-size:11px;color:var(--text-muted);">eSIM Access: ${escH(errMsg)}</span>`;
        return;
      }
      rawPackages = data.data?.packageList || data.data?.obj || data.packages || [];
      if (!rawPackages.length) {
        el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket tersedia</span>';
        return;
      }
      if (!window._esimAccessCache) window._esimAccessCache = {};
      window._esimAccessCache[cacheKey] = rawPackages;
    }

    const ESIM_REGIONAL_KW = ['asia', 'global', 'worldwide', 'multi', ' & ', ' and '];
    const singlePkgs = rawPackages.filter(p => {
      const name = (p.name || p.packageName || p.slug || '').toLowerCase();
      return !ESIM_REGIONAL_KW.some(kw => name.includes(kw));
    });
    let packages = singlePkgs.length ? singlePkgs : rawPackages;

    if (selDay) packages = packages.filter(p => parseInt(p.duration || p.day || 0) === selDay);
    if (selPkg) {
      const selLower = selPkg.toLowerCase();
      const isUnlimited = selLower.includes('unlimited');
      const gbMatch = selLower.match(/(\d+)\s*gb/i);
      const gbVal = gbMatch ? parseInt(gbMatch[1]) : null;
      packages = packages.filter(p => {
        const name = (p.name || p.packageName || '').toLowerCase();
        if (isUnlimited && gbVal) return name.includes('unlimited') || name.includes(gbVal + 'gb') || name.includes(gbVal + ' gb');
        if (isUnlimited) return name.includes('unlimited');
        if (gbVal) return name.includes(gbVal + 'gb') || name.includes(gbVal + ' gb');
        return true;
      });
    }

    if (!packages.length) {
      el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket cocok untuk filter ini</span>';
      return;
    }

    packages.sort((a, b) => {
      const dd = parseInt(a.duration || a.day || 0) - parseInt(b.duration || b.day || 0);
      return dd !== 0 ? dd : (a.name || '').localeCompare(b.name || '');
    });

    const byDay = new Map();
    packages.forEach(pkg => {
      const d2 = parseInt(pkg.duration || pkg.day || 0);
      if (!byDay.has(d2)) byDay.set(d2, []);
      byDay.get(d2).push(pkg);
    });

    let html = '';
    byDay.forEach((dayPkgs, validity) => {
      if (byDay.size > 1) {
        html += `<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 4px;padding-bottom:4px;border-bottom:1px solid var(--border);">📅 ${validity} Hari</div>`;
      }
      dayPkgs.forEach(pkg => {
        const buyUSD  = parseFloat(pkg.price || pkg.retailPrice || 0) / 10000;
        const buyIDR  = Math.round(buyUSD * kurs);
        const sellIDR = Math.round(buyIDR * (1 + markup / 100));
        const isCheaper = aviroamPartnerEsim > 0 && sellIDR < aviroamPartnerEsim;
        const border = isCheaper ? '2px solid #10b981' : '1px solid var(--border)';
        const bg     = isCheaper ? '#f0fdf4' : 'white';
        const cheapBadge = isCheaper ? '<span style="background:#10b981;color:white;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;margin-left:4px;">LEBIH MURAH</span>' : '';
        const pkgName = escH(pkg.name || pkg.packageName || pkg.slug || '-');
        const pkgDay  = pkg.duration || pkg.day || validity;
        const locList = pkg.locationNetworkList || pkg.locationList || [];
        const coverageEA = locList.length > 1 ? locList.map(l => escH(l.locationName || l.name || l.locationCode || '')).filter(Boolean).join(' · ') : '';
        html += `<div style="border:${border};border-radius:8px;padding:8px 10px;margin-bottom:7px;background:${bg};">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:2px;"><span style="font-size:11px;font-weight:600;color:var(--text);">${pkgName}</span>${cheapBadge}</div>
          ${coverageEA ? `<div style="font-size:9px;color:#6366f1;background:#ede9fe;border-radius:4px;padding:2px 6px;margin-bottom:4px;display:inline-block;">🌏 ${coverageEA}</div>` : ''}
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:5px;">${pkgDay} hari</div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;">
            <span style="font-size:10px;color:var(--text-muted);">Beli <span style="font-size:9px;">(USD ${buyUSD.toFixed(2)})</span></span>
            <span style="font-size:12px;font-weight:600;color:var(--text);">${hargaFmtIDR(buyIDR)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-top:1px solid var(--border);">
            <span style="font-size:10px;color:var(--text-muted);">Jual <span style="font-size:9px;">(+${markup}%)</span></span>
            <span style="font-size:13px;font-weight:700;color:#1d4ed8;">${hargaFmtIDR(sellIDR)}</span>
          </div>
        </div>`;
      });
    });
    el.innerHTML = html || '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket cocok</span>';
  } catch(e) {
    if (el) el.innerHTML = `<span style="font-size:11px;color:var(--red);">Error: ${e.message}</span>`;
  }
}

// Mapping nama negara Aviroam → region_index iRoamly
const IROAMLY_COUNTRY_MAP = {
  'Japan': 'japan', 'South Korea': 'south-korea', 'Korea': 'south-korea',
  'Malaysia': 'malaysia', 'Singapore': 'singapore', 'Thailand': 'thailand',
  'China': 'china', 'Hong Kong': 'hong-kong', 'Taiwan': 'taiwan',
  'Indonesia': 'indonesia', 'Philippines': 'philippines', 'Vietnam': 'vietnam',
  'Cambodia': 'cambodia', 'Myanmar': 'myanmar', 'India': 'india',
  'Australia': 'australia', 'New Zealand': 'new-zealand',
  'United Kingdom': 'united-kingdom', 'UK': 'united-kingdom',
  'USA': 'united-states', 'United States': 'united-states',
  'Saudi Arabia': 'saudi-arabia', 'UAE': 'united-arab-emirates',
  'United Arab Emirates': 'united-arab-emirates', 'Turkey': 'turkey',
  'Egypt': 'egypt', 'France': 'france', 'Germany': 'germany',
  'Italy': 'italy', 'Spain': 'spain', 'Netherlands': 'netherlands',
  'Switzerland': 'switzerland', 'Canada': 'canada', 'Mexico': 'mexico',
  'Macau': 'macau', 'Macao': 'macau', 'Bangladesh': 'bangladesh',
  'Pakistan': 'pakistan', 'Sri Lanka': 'sri-lanka', 'Nepal': 'nepal',
  'Brunei': 'brunei', 'Laos': 'laos', 'Mongolia': 'mongolia',
  'Qatar': 'qatar', 'Kuwait': 'kuwait', 'Bahrain': 'bahrain',
  'Jordan': 'jordan', 'Israel': 'israel', 'Morocco': 'morocco',
  'South Africa': 'south-africa', 'Kenya': 'kenya', 'Nigeria': 'nigeria',
  'Brazil': 'brazil', 'Argentina': 'argentina', 'Chile': 'chile',
  'Portugal': 'portugal', 'Greece': 'greece', 'Poland': 'poland',
  'Czech': 'czech-republic', 'Austria': 'austria', 'Sweden': 'sweden',
  'Norway': 'norway', 'Denmark': 'denmark', 'Finland': 'finland',
  'Belgium': 'belgium', 'Hungary': 'hungary', 'Romania': 'romania',
};

// Smart mapping untuk nama regional Aviroam yang mengandung nama negara
function iroamlyGetRegion(countryName) {
  if (!countryName) return null;
  // Exact match dulu
  if (IROAMLY_COUNTRY_MAP[countryName]) return IROAMLY_COUNTRY_MAP[countryName];
  // Cari nama negara yang terkandung dalam string (prioritas urutan map)
  const lower = countryName.toLowerCase();
  for (const [name, region] of Object.entries(IROAMLY_COUNTRY_MAP)) {
    if (lower.includes(name.toLowerCase())) return region;
  }
  return null;
}


// iRoamly regional coverage — dari tab region xlsx
const IROAMLY_REGIONS = {
  'hong-kong-and-macau': 'Hong Kong · Macau',
  'usa-ca': 'USA · Canada',
  'southeast-asia-4-countries': 'Singapore · Malaysia · Indonesia · Thailand',
  'au-nz': 'Australia · New Zealand',
  'singapore-malaysia-thailand': 'Singapore · Malaysia · Thailand',
  'usa-canada-mexico': 'USA · Canada · Mexico',
  'central-asia-4-countries': 'Kazakhstan · Kyrgyzstan · Pakistan · Uzbekistan',
  'south-america-8-countries': 'Brazil · Argentina · Chile · Peru · Paraguay · Uruguay · Ecuador · Colombia',
  'china-mainland-hong-kong-macau': 'China · Hong Kong · Macau',
  'africa-18-countries': 'Algeria · Chad · Congo · Egypt · Gabon · Ghana · Kenya · Madagascar · Malawi · Mauritius · Morocco · Niger · Nigeria · Réunion · Tanzania · Tunisia · Uganda',
  'south-america-6-countries': 'Brazil · Argentina · Chile · Ecuador · Peru · Uruguay',
  'singapore-malaysia': 'Singapore · Malaysia',
  'africa-6-countries': 'Algeria · Tunisia · Egypt · South Africa · Ghana · Réunion',
  'europe-34-countries': 'Austria · Belgium · Bulgaria · Switzerland · Cyprus · Czech Republic · Germany · Denmark · Spain · Estonia · Finland · France · UK · Greece · Croatia · Hungary · Ireland · Iceland · Italy · Liechtenstein · Lithuania · Luxembourg · Latvia · Moldova · Malta · Netherlands · Norway · Portugal · Romania · Slovakia · Slovenia · Sweden · Ukraine',
  'saipan-guam': 'Saipan · Guam',
  'asia-12-countries': 'Asia 12 Countries',
  'middle-east-5-countries': 'Middle East 5 Countries',
};

async function loadIroamlyPrice(country, day, kurs, markup, aviroamPartnerEsim) {
  const el = document.getElementById('iroamly-result');
  if (!el) return;
  try {
    const countryObj2 = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === country);
    const region = countryObj2?.iroamly || iroamlyGetRegion(country);
    if (!region) {
      el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Negara tidak tersedia di iRoamly</span>';
      return;
    }
    const selDay = parseInt(document.getElementById('h-day')?.value) || 0;
    const selPkg = (document.getElementById('h-pkg')?.value || '').trim();

    const cacheKey = `iroamly_pkgs_${region}`;
    let rawData = window._iroamlyCache?.[cacheKey];
    if (!rawData) {
      const res = await fetch(
        `https://goho-proxy.gohotravel.workers.dev?action=getIroamlyPackages&region=${encodeURIComponent(region)}`
      );
      const data = await res.json();
      if (!data.ok || !data.data || !data.data.length) {
        el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket tersedia</span>';
        return;
      }
      rawData = data.data;
      if (!window._iroamlyCache) window._iroamlyCache = {};
      window._iroamlyCache[cacheKey] = rawData;
    }

    const totalPkgs = rawData.filter(p => p.type === 'Total');
    let allPkgs = totalPkgs.length ? totalPkgs : rawData;

    if (selDay) allPkgs = allPkgs.filter(p => parseInt(p.duration) === selDay);
    if (selPkg) {
      const selLower = selPkg.toLowerCase();
      const isUnlimited = selLower.includes('unlimited');
      const gbMatch = selLower.match(/(\d+)\s*gb/i);
      const gbVal = gbMatch ? parseInt(gbMatch[1]) : null;
      allPkgs = allPkgs.filter(p => {
        const dataStr = (p.data || '').toLowerCase();
        if (isUnlimited && gbVal) return dataStr.includes('unlimited') || dataStr.includes(gbVal + 'gb') || dataStr.includes(gbVal + ' gb');
        if (isUnlimited) return dataStr.includes('unlimited');
        if (gbVal) return dataStr.includes(gbVal + 'gb') || dataStr.includes(gbVal + ' gb');
        return true;
      });
    }

    if (!allPkgs.length) {
      el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket cocok untuk filter ini</span>';
      return;
    }

    allPkgs.sort((a, b) => {
      const dd = parseInt(a.duration) - parseInt(b.duration);
      return dd !== 0 ? dd : (a.data || '').localeCompare(b.data || '');
    });

    const byDay = new Map();
    allPkgs.forEach(pkg => {
      const d2 = parseInt(pkg.duration);
      if (!byDay.has(d2)) byDay.set(d2, []);
      byDay.get(d2).push(pkg);
    });

    let html = '';
    byDay.forEach((dayPkgs, validity) => {
      if (byDay.size > 1) {
        html += `<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 4px;padding-bottom:4px;border-bottom:1px solid var(--border);">📅 ${validity} Hari</div>`;
      }
      dayPkgs.forEach(pkg => {
        const buyUSD  = parseFloat(pkg.credit || 0);
        const buyIDR  = Math.round(buyUSD * kurs);
        const sellIDR = Math.round(buyIDR * (1 + markup / 100));
        const isCheaper = aviroamPartnerEsim > 0 && sellIDR < aviroamPartnerEsim;
        const border = isCheaper ? '2px solid #10b981' : '1px solid var(--border)';
        const bg     = isCheaper ? '#f0fdf4' : 'white';
        const cheapBadge = isCheaper ? '<span style="background:#10b981;color:white;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;margin-left:4px;">LEBIH MURAH</span>' : '';
        const dataLabel  = escH(pkg.data || '-');
        const planType   = pkg.plan_type && pkg.plan_type !== 'default' ? ` · ${escH(pkg.plan_type)}` : '';
        const operator   = escH(pkg.operator || '');
        const coverageIR = IROAMLY_REGIONS[pkg.region_index || ''] || '';
        const network    = escH(pkg.network_type || pkg.network || '4G');
        const canHotspot = pkg.hotspot !== false;
        const dayQuota   = pkg.day_quota || pkg.daily_quota || '';
        const throttleSpd = pkg.throttle_speed || '';
        let speedInfo = '';
        if (dayQuota) speedInfo = `${escH(String(dayQuota))}/hari full speed, sisanya throttle`;
        else if (throttleSpd) speedInfo = `Setelah kuota: ${escH(throttleSpd)}`;
        html += `<div style="border:${border};border-radius:8px;padding:8px 10px;margin-bottom:7px;background:${bg};">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:4px;">
            <span style="font-size:11px;font-weight:600;color:var(--text);">${dataLabel} · ${validity}h</span>
            ${cheapBadge}
          </div>
          ${coverageIR ? `<div style="font-size:9px;color:#6366f1;background:#ede9fe;border-radius:4px;padding:2px 6px;margin-bottom:4px;display:inline-block;">🌏 ${coverageIR}</div>` : ''}
          <div style="font-size:9px;color:var(--text-muted);margin-bottom:4px;">${operator}${planType}</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;">
            <span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">📶 ${network}</span>
            <span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">🔥 Hotspot: ${canHotspot ? '✅' : '❌'}</span>
          </div>
          ${speedInfo ? `<div style="font-size:9px;color:#b45309;background:#fef3c7;border-radius:3px;padding:2px 6px;margin-bottom:4px;display:inline-block;">⚡ ${speedInfo}</div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;">
            <span style="font-size:10px;color:var(--text-muted);">Beli <span style="font-size:9px;">(USD ${buyUSD.toFixed(2)})</span></span>
            <span style="font-size:12px;font-weight:600;color:var(--text);">${hargaFmtIDR(buyIDR)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-top:1px solid var(--border);">
            <span style="font-size:10px;color:var(--text-muted);">Jual <span style="font-size:9px;">(+${markup}%)</span></span>
            <span style="font-size:13px;font-weight:700;color:#7c3aed;">${hargaFmtIDR(sellIDR)}</span>
          </div>
        </div>`;
      });
    });
    el.innerHTML = html || '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket cocok</span>';
  } catch(e) {
    if (el) el.innerHTML = `<span style="font-size:11px;color:var(--red);">Error: ${e.message}</span>`;
  }
}
