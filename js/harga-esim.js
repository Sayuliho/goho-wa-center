// ============================================================
// HARGA SIM/ESIM — Panel, Aviroam, eSIM Access, iRoamly
// Revisi: Logika baru lama perjalanan + Section Rekomendasi
//         + Tabel Lengkap (Total Data / Kuota Harian)
//         + eSIM Access info lengkap + Riwayat + Beli
// ============================================================

// ── Global state ────────────────────────────────────────────
let hargaData   = [];
let hargaLoaded = false;

// ── Master country list ──────────────────────────────────────
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
  { display: 'Lithuania', iroamly: 'lithuania', iso: 'LT', aviroam: ['lithuania'] },
  { display: 'Malta', iroamly: 'malta', iso: 'MT', aviroam: ['malta'] },
  { display: 'Netherlands', iroamly: 'netherlands', iso: 'NL', aviroam: ['netherlands'] },
  { display: 'Norway', iroamly: 'norway', iso: 'NO', aviroam: ['norway'] },
  { display: 'Poland', iroamly: 'poland', iso: 'PL', aviroam: ['poland'] },
  { display: 'Portugal', iroamly: 'portugal', iso: 'PT', aviroam: ['portugal'] },
  { display: 'Romania', iroamly: 'romania', iso: 'RO', aviroam: ['romania'] },
  { display: 'Slovakia', iroamly: 'slovakia', iso: 'SK', aviroam: ['slovakia'] },
  { display: 'Slovenia', iroamly: 'slovenia', iso: 'SI', aviroam: ['slovenia'] },
  { display: 'South Africa', iroamly: 'south-africa', iso: 'ZA', aviroam: ['south africa'] },
  { display: 'Mongolia', iroamly: 'mongolia', iso: 'MN', aviroam: ['mongolia'] },
  { display: 'Ghana', iroamly: 'ghana', iso: 'GH', aviroam: ['ghana'] },
  { display: 'Sri Lanka', iroamly: 'sri-lanka', iso: 'LK', aviroam: ['sri lanka'] },
  { display: 'Pakistan', iroamly: 'pakistan', iso: 'PK', aviroam: ['pakistan'] },
  { display: 'Nigeria', iroamly: 'nigeria', iso: 'NG', aviroam: ['nigeria'] },
  { display: 'Serbia', iroamly: 'serbia', iso: 'RS', aviroam: ['serbia'] },
  { display: 'Tanzania', iroamly: 'tanzania', iso: 'TZ', aviroam: ['tanzania'] },
  { display: 'Brunei', iroamly: 'brunei', iso: 'BN', aviroam: ['brunei'] },
  { display: 'Uruguay', iroamly: 'uruguay', iso: 'UY', aviroam: ['uruguay'] },
  { display: 'Chile', iroamly: 'chile', iso: 'CL', aviroam: ['chile'] },
  { display: 'Mexico', iroamly: 'mexico', iso: 'MX', aviroam: ['mexico'] },
  { display: 'Laos', iroamly: 'laos', iso: 'LA', aviroam: ['laos'] },
  { display: 'Brazil', iroamly: 'brazil', iso: 'BR', aviroam: ['brazil'] },
  { display: 'Mauritius', iroamly: 'mauritius', iso: 'MU', aviroam: ['mauritius'] },
  { display: 'Morocco', iroamly: 'morocco', iso: 'MA', aviroam: ['morocco'] },
  { display: 'Jordan', iroamly: 'jordan', iso: 'JO', aviroam: ['jordan'] },
  { display: 'Canada', iroamly: 'canada', iso: 'CA', aviroam: ['canada'] },
  { display: 'Bahrain', iroamly: 'bahrain', iso: 'BH', aviroam: ['bahrain'] },
  { display: 'Australia', iroamly: 'australia', iso: 'AU', aviroam: ['australia'] },
  { display: 'New Zealand', iroamly: 'new-zealand', iso: 'NZ', aviroam: ['new zealand'] },
  { display: 'Azerbaijan', iroamly: 'azerbaijan', iso: 'AZ', aviroam: ['azerbaijan'] },
  { display: 'Argentina', iroamly: 'argentina', iso: 'AR', aviroam: ['argentina'] },
  { display: 'Armenia', iroamly: 'armenia', iso: 'AM', aviroam: ['armenia'] },
  { display: 'Oman', iroamly: 'oman', iso: 'OM', aviroam: ['oman'] },
  { display: 'Bangladesh', iroamly: 'bangladesh', iso: 'BD', aviroam: ['bangladesh'] },
  { display: 'Russia', iroamly: 'russia', iso: 'RU', aviroam: ['russia'] },
  { display: 'Hong Kong', iroamly: 'hong-kong', iso: 'HK', aviroam: ['hong kong', 'hongkong'] },
  { display: 'Nepal', iroamly: 'nepal', iso: 'NP', aviroam: ['nepal'] },
  { display: 'Colombia', iroamly: 'colombia', iso: 'CO', aviroam: ['colombia'] },
  { display: 'Maldives', iroamly: 'maldives', iso: 'MV', aviroam: ['maldives'] },
  { display: 'Israel', iroamly: 'israel', iso: 'IL', aviroam: ['israel'] },
  { display: 'Macau', iroamly: 'macau', iso: 'MO', aviroam: ['macau'] },
  { display: 'Kenya', iroamly: 'kenya', iso: 'KE', aviroam: ['kenya'] },
  { display: 'Georgia', iroamly: 'georgia', iso: 'GE', aviroam: ['georgia'] },
  { display: 'Ecuador', iroamly: 'ecuador', iso: 'EC', aviroam: ['ecuador'] },
];

// ── iRoamly region map ───────────────────────────────────────
const IROAMLY_COUNTRY_MAP = {
  'Japan': 'japan', 'Korea': 'south-korea', 'Malaysia': 'malaysia',
  'Singapore': 'singapore', 'Thailand': 'thailand', 'China': 'china',
  'Hong Kong': 'hong-kong', 'Taiwan': 'taiwan', 'Indonesia': 'indonesia',
  'Philippines': 'philippines', 'Vietnam': 'vietnam', 'Cambodia': 'cambodia',
  'India': 'india', 'Australia': 'australia', 'New Zealand': 'new-zealand',
  'United Kingdom': 'united-kingdom', 'United States': 'united-states',
  'Saudi Arabia': 'saudi-arabia', 'United Arab Emirates': 'united-arab-emirates',
  'Turkey': 'turkey', 'Egypt': 'egypt', 'France': 'france', 'Germany': 'germany',
  'Italy': 'italy', 'Spain': 'spain', 'Netherlands': 'netherlands',
  'Switzerland': 'switzerland', 'Canada': 'canada', 'Mexico': 'mexico',
  'Macau': 'macau', 'Bangladesh': 'bangladesh', 'Pakistan': 'pakistan',
  'Sri Lanka': 'sri-lanka', 'Nepal': 'nepal', 'Brunei': 'brunei',
  'Mongolia': 'mongolia', 'Qatar': 'qatar', 'Kuwait': 'kuwait',
  'Bahrain': 'bahrain', 'Jordan': 'jordan', 'Israel': 'israel',
  'Morocco': 'morocco', 'South Africa': 'south-africa', 'Kenya': 'kenya',
  'Nigeria': 'nigeria', 'Brazil': 'brazil', 'Argentina': 'argentina',
  'Chile': 'chile', 'Portugal': 'portugal', 'Greece': 'greece',
  'Poland': 'poland', 'Austria': 'austria', 'Sweden': 'sweden',
  'Norway': 'norway', 'Denmark': 'denmark', 'Finland': 'finland',
  'Belgium': 'belgium', 'Hungary': 'hungary', 'Romania': 'romania',
  'Georgia': 'georgia', 'Ecuador': 'ecuador', 'Colombia': 'colombia',
  'Maldives': 'maldives', 'Oman': 'oman', 'Azerbaijan': 'azerbaijan',
  'Armenia': 'armenia', 'Russia': 'russia',
};

function iroamlyGetRegion(countryName) {
  if (!countryName) return null;
  if (IROAMLY_COUNTRY_MAP[countryName]) return IROAMLY_COUNTRY_MAP[countryName];
  const lower = countryName.toLowerCase();
  for (const [name, region] of Object.entries(IROAMLY_COUNTRY_MAP)) {
    if (lower.includes(name.toLowerCase())) return region;
  }
  return null;
}

// ── Parse package type dari nama ────────────────────────────
function detectPackageType(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('unlimited premium')) return { type: 'daily', gbPerDay: 3 };
  if (n.includes('unlimited plus'))    return { type: 'daily', gbPerDay: 2 };
  if (n.includes('unlimited'))         return { type: 'daily', gbPerDay: 1 };
  if (n.includes('/day') || n.includes('per day') || n.includes('daily')) return { type: 'daily', gbPerDay: null };
  const gbMatch = n.match(/(\d+(?:\.\d+)?)\s*gb/i);
  if (gbMatch) return { type: 'total', gb: parseFloat(gbMatch[1]) };
  const mbMatch = n.match(/(\d+)\s*mb/i);
  if (mbMatch) return { type: 'total', gb: parseFloat(mbMatch[1]) / 1024 };
  return { type: 'total', gb: null };
}

function parsePackageNotes(name) {
  const notes = [];
  const n = (name || '').toLowerCase();
  if (n.includes('nonhkip')) notes.push('⚠️ Tidak berlaku di HK/India/Pakistan');
  if (n.includes('iij'))     notes.push('📡 Jaringan IIJ');
  if (n.includes('ntt'))     notes.push('📡 Jaringan NTT');
  if (n.includes('docomo'))  notes.push('📡 Docomo');
  return notes;
}

function isRegionalPackage(pkg) {
  const name = (pkg.name || pkg.packageName || '').toLowerCase();
  const locList = pkg.locationNetworkList || pkg.locationList || [];
  const REGIONAL_KW = ['asia', 'global', 'worldwide', 'multi', ' & ', ' countries', 'aukus', 'europe'];
  return locList.length > 2 || REGIONAL_KW.some(kw => name.includes(kw));
}

// ── Helpers ─────────────────────────────────────────────────
function hargaGetKurs()   { return parseFloat(window._appSettings?.esim_kurs_usd || localStorage.getItem('esim_kurs_usd') || '16000'); }
function hargaGetMarkup() { return parseFloat(window._appSettings?.esim_markup_pct || localStorage.getItem('esim_markup_pct') || '20'); }
function hargaFmtIDR(v)   { return v ? 'Rp ' + Number(v).toLocaleString('id-ID') : '—'; }
function hargaGetLamaPerjalanan() { return parseInt(document.getElementById('h-lama-perjalanan')?.value) || 0; }

function hargaRowAviroam(label, value, type) {
  const color = type === 'customer' ? '#1d4ed8' : '#166534';
  const bg    = type === 'customer' ? '#dbeafe'  : '#dcfce7';
  const badge = type === 'customer' ? 'Customer' : 'Agen';
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);">
    <span style="font-size:11px;color:var(--text-muted);">${label} <span style="background:${bg};color:${color};font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;">${badge}</span></span>
    <span style="font-size:13px;font-weight:600;color:${color};">${value}</span>
  </div>`;
}

// ── Panel setup ──────────────────────────────────────────────
function openHargaModal() {
  const panel = document.getElementById('panel-harga');
  if (!panel) return;
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  const isMobile = window.innerWidth < 600;
  if (isMobile) {
    panel.style.width  = (window.innerWidth - 16) + 'px';
    panel.style.height = '85vh';
    panel.style.left   = '8px';
    panel.style.top    = '72px';
    panel.style.right  = 'auto';
  } else {
    const savedW = localStorage.getItem('hargaPanel_w');
    const savedH = localStorage.getItem('hargaPanel_h');
    if (savedW) panel.style.width  = savedW;
    if (savedH) panel.style.height = savedH;
    const rect = panel.getBoundingClientRect();
    if (rect.left < 0) { panel.style.left = '8px'; panel.style.right = 'auto'; }
    if (rect.right > window.innerWidth) { panel.style.left = Math.max(8, window.innerWidth - panel.offsetWidth - 8) + 'px'; panel.style.right = 'auto'; }
  }
  if (!panel._resizeObserver && !isMobile) {
    panel._resizeObserver = new ResizeObserver(() => {
      localStorage.setItem('hargaPanel_w', panel.style.width  || panel.offsetWidth  + 'px');
      localStorage.setItem('hargaPanel_h', panel.style.height || panel.offsetHeight + 'px');
    });
    panel._resizeObserver.observe(panel);
  }
  hargaLoadSettings().then(() => { if (!hargaLoaded) loadHargaData(); });
  initHargaPanelDrag();
  initHargaPanelResize();
}

function initHargaPanelResize() {
  const panel  = document.getElementById('panel-harga');
  const handle = document.getElementById('panel-harga-resize');
  if (!panel || !handle) return;
  handle.addEventListener('mousedown', function(e) {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startW = panel.offsetWidth, startH = panel.offsetHeight;
    function onMove(e) {
      panel.style.width  = Math.max(400, startW + (e.clientX - startX)) + 'px';
      panel.style.height = Math.max(300, startH + (e.clientY - startY)) + 'px';
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
      const res  = await fetch(`${API}?action=getSetting&key=${key}`);
      const data = await res.json();
      if (data.ok && data.value !== null) {
        window._appSettings[key] = data.value;
        localStorage.setItem(key, data.value);
      }
    }
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
    await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'saveSetting', key, value }) });
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
  const lamaEl = document.getElementById('h-lama-perjalanan');
  if (lamaEl) lamaEl.value = '';
  document.getElementById('h-result').innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara dan lama perjalanan</div>';
  document.getElementById('h-loading').style.display = 'none';
  window._aviroamRows = null;
  window._selectedCountry = null;
  window._esimcardCache   = {};
  window._esimAccessCache = {};
  window._iroamlyCache    = {};
  window._eaAllPackages   = null;
  window._irAllPackages   = null;
}

function initHargaPanelDrag() {
  const panel  = document.getElementById('panel-harga');
  const header = document.getElementById('panel-harga-header');
  if (!panel || !header || header._dragInit) return;
  header._dragInit = true;
  let isDragging = false, startX, startY, origLeft, origTop;
  function dragStart(cx, cy) {
    isDragging = true; startX = cx; startY = cy;
    const rect = panel.getBoundingClientRect();
    origLeft = rect.left; origTop = rect.top;
    header.style.cursor = 'grabbing';
  }
  function dragMove(cx, cy) {
    if (!isDragging) return;
    panel.style.left  = Math.max(0, Math.min(origLeft + cx - startX, window.innerWidth  - panel.offsetWidth))  + 'px';
    panel.style.top   = Math.max(0, Math.min(origTop  + cy - startY, window.innerHeight - panel.offsetHeight)) + 'px';
    panel.style.right = 'auto';
  }
  function dragEnd() { if (isDragging) { isDragging = false; header.style.cursor = 'grab'; } }
  header.addEventListener('mousedown', (e) => { dragStart(e.clientX, e.clientY); e.preventDefault(); });
  document.addEventListener('mousemove', (e) => dragMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', dragEnd);
  header.addEventListener('touchstart', (e) => { const t = e.touches[0]; dragStart(t.clientX, t.clientY); }, { passive: true });
  document.addEventListener('touchmove', (e) => { if (!isDragging) return; const t = e.touches[0]; dragMove(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
  document.addEventListener('touchend', dragEnd);
}

// ── Data loading ─────────────────────────────────────────────
async function loadHargaData() {
  const loading = document.getElementById('h-loading');
  const result  = document.getElementById('h-result');
  result.innerHTML = '';
  const CACHE_VERSION = 'v2';
  try {
    const cached    = localStorage.getItem('hargaData_cache');
    const cachedAt  = parseInt(localStorage.getItem('hargaData_cache_at') || '0');
    const cachedVer = localStorage.getItem('hargaData_cache_ver') || '';
    if (cached && (Date.now() - cachedAt) < 30 * 60 * 1000 && cachedVer === CACHE_VERSION) {
      hargaData = JSON.parse(cached);
      hargaLoaded = true;
      window._hargaCountries = GOHO_COUNTRIES.map(c => c.display);
      result.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara dan lama perjalanan</div>';
      loading.style.display = 'none';
      fetchHargaDataBackground();
      return;
    }
  } catch(e) {}
  loading.style.display = 'block';
  await fetchHargaDataBackground();
  loading.style.display = 'none';
  result.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara dan lama perjalanan</div>';
}

async function fetchHargaDataBackground() {
  try {
    const res = await apiGet({ action: 'getHargaSim' });
    if (res.ok && res.data && res.data.length > 0) {
      hargaData = res.data.map(r => { r[0] = (r[0] || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(); return r; });
      hargaLoaded = true;
      window._hargaCountries = GOHO_COUNTRIES.map(c => c.display);
      try {
        localStorage.setItem('hargaData_cache', JSON.stringify(hargaData));
        localStorage.setItem('hargaData_cache_at', Date.now().toString());
        localStorage.setItem('hargaData_cache_ver', 'v2');
      } catch(e) {}
    }
  } catch(e) { hargaLoaded = true; window._hargaCountries = GOHO_COUNTRIES.map(c => c.display); }
}

// ── Country dropdown ─────────────────────────────────────────
function hargaShowCountryDropdown() { hargaFilterCountry(document.getElementById('h-country-search').value); }

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
  window._selectedCountry = GOHO_COUNTRIES.find(c => c.display === country) || null;
  hargaOnCountryChange();
}

function hargaSelectCountry(country) {
  const clean = (country || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  document.getElementById('h-country-search').value = clean;
  document.getElementById('h-country').value = clean;
  document.getElementById('h-country-dropdown').style.display = 'none';
  window._selectedCountry = GOHO_COUNTRIES.find(c => c.display === clean) || null;
  hargaOnCountryChange();
}

function hargaOnCountryChange() {
  // Reset cache paket saat negara berubah
  window._eaAllPackages = null;
  window._irAllPackages = null;
  hargaShowResult();
}

// Tutup dropdown saat blur
document.addEventListener('DOMContentLoaded', function() {
  const inp = document.getElementById('h-country-search');
  if (inp) {
    inp.addEventListener('blur', function() {
      setTimeout(() => { const dd = document.getElementById('h-country-dropdown'); if (dd) dd.style.display = 'none'; }, 200);
    });
  }
});
document.addEventListener('click', function(e) {
  const dd  = document.getElementById('h-country-dropdown');
  const inp = document.getElementById('h-country-search');
  if (dd && inp && !dd.contains(e.target) && e.target !== inp) dd.style.display = 'none';
});

// ── Lama perjalanan input handler ────────────────────────────
function hargaOnLamaChange() {
  // Debounce 500ms
  clearTimeout(window._lamaTimer);
  window._lamaTimer = setTimeout(() => {
    hargaShowResult();
  }, 500);
}

// Legacy stubs — dipanggil dari index.html
function hargaUpdateDay()    { hargaShowResult(); }
function hargaOnDayChange()  { hargaShowResult(); }
function hargaOnPkgChange()  { hargaShowResult(); }
function hargaUpdatePkg()    { hargaShowResult(); }

// ── MAIN: hargaShowResult ────────────────────────────────────
async function hargaShowResult() {
  const displayName = document.getElementById('h-country')?.value || '';
  const lamaHari    = hargaGetLamaPerjalanan();
  const resultEl    = document.getElementById('h-result');
  if (!displayName) { resultEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara dulu</div>'; return; }
  if (!lamaHari)    { resultEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Isi lama perjalanan (hari)</div>'; return; }

  const kurs   = hargaGetKurs();
  const markup = hargaGetMarkup();
  const countryObj = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === displayName);

  // Sync kurs/markup ke input
  const kursEl   = document.getElementById('h-kurs-usd');
  const markupEl = document.getElementById('h-markup-pct');
  if (kursEl)   kursEl.value   = kurs;
  if (markupEl) markupEl.value = markup;

  // Aviroam rows — filter durasi >= lamaHari
  const avKeywords = countryObj?.aviroam || [displayName.toLowerCase()];
  const src = window._aviroamRows || hargaData;
  let avRows = src.filter(r => {
    const name = (r[0] || '').toLowerCase().trim();
    const rowDur = r[2] || 0;
    return rowDur >= lamaHari && avKeywords.some(kw => name.includes(kw.toLowerCase()));
  });
  // Dedup
  avRows = avRows.filter((r, i, arr) => arr.findIndex(x => x[0] === r[0] && x[1] === r[1] && x[2] === r[2]) === i);

  const row = avRows[0] || null;
  const [,,,,,, esimPar] = row || [];

  // Render frame dulu — kolom eSIM load async
  resultEl.innerHTML = `
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:12px;font-weight:600;color:var(--text);">${escH(displayName)}</span>
      <span style="font-size:11px;background:#ede9fe;color:#6366f1;border-radius:4px;padding:2px 8px;">${lamaHari} hari perjalanan</span>
      <span style="font-size:10px;color:var(--text-muted);">Paket durasi ≥ ${lamaHari} hari ditampilkan</span>
    </div>

    <!-- SECTION 1: REKOMENDASI -->
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
        🏆 REKOMENDASI TERBAIK
        <span style="font-size:10px;font-weight:400;color:var(--text-muted);">sort by harga termurah</span>
      </div>
      <div id="h-rekomendasi" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
        <div style="font-size:11px;color:var(--text-muted);padding:12px;"><i class="ti ti-loader spin"></i> Memuat...</div>
      </div>
    </div>

    <!-- SECTION 2: TABEL LENGKAP -->
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <div style="font-size:11px;font-weight:700;color:var(--text);">📊 SEMUA PAKET</div>
        <div style="display:flex;gap:4px;">
          <button id="htab-total" onclick="hargaSwitchTab('total')" style="font-size:10px;padding:3px 10px;border:1px solid #6366f1;border-radius:4px;background:#6366f1;color:white;cursor:pointer;font-family:var(--font);">Total Data</button>
          <button id="htab-daily" onclick="hargaSwitchTab('daily')" style="font-size:10px;padding:3px 10px;border:1px solid var(--border);border-radius:4px;background:white;color:var(--text);cursor:pointer;font-family:var(--font);">Kuota Harian</button>
        </div>
      </div>
      <div id="h-tabel-total" style="display:block;">
        <div style="font-size:11px;color:var(--text-muted);padding:12px;"><i class="ti ti-loader spin"></i> Memuat tabel...</div>
      </div>
      <div id="h-tabel-daily" style="display:none;">
        <div style="font-size:11px;color:var(--text-muted);padding:12px;"><i class="ti ti-loader spin"></i> Memuat tabel...</div>
      </div>
    </div>`;

  // Load semua data async
  loadHargaRekomendasi(displayName, lamaHari, kurs, markup, parseFloat(esimPar) || 0, avRows, countryObj);
  loadHargaTabelTotal(displayName, lamaHari, kurs, markup, countryObj, avRows);
  loadHargaTabelDaily(displayName, lamaHari, kurs, markup, avRows);
}

function hargaSwitchTab(tab) {
  document.getElementById('h-tabel-total').style.display = tab === 'total' ? 'block' : 'none';
  document.getElementById('h-tabel-daily').style.display = tab === 'daily' ? 'block' : 'none';
  document.getElementById('htab-total').style.background = tab === 'total' ? '#6366f1' : 'white';
  document.getElementById('htab-total').style.color      = tab === 'total' ? 'white'   : 'var(--text)';
  document.getElementById('htab-daily').style.background = tab === 'daily' ? '#6366f1' : 'white';
  document.getElementById('htab-daily').style.color      = tab === 'daily' ? 'white'   : 'var(--text)';
}

// ── Section 1: Rekomendasi ───────────────────────────────────
async function loadHargaRekomendasi(country, lamaHari, kurs, markup, aviroamPartnerEsim, avRows, countryObj) {
  const el = document.getElementById('h-rekomendasi');
  if (!el) return;

  // Kumpulkan semua paket dari semua supplier
  const allItems = [];

  // Aviroam eSIM
  avRows.forEach(r => {
    const [,pkg, dur,, simPar, esimPub, esimPar2] = r;
    const pkgType = detectPackageType(pkg || '');
    if (pkgType.type === 'total') {
      allItems.push({ supplier: 'Aviroam', type: 'eSIM', name: escH(pkg || ''), dur: dur || 0, buyIDR: parseFloat(esimPub) || 0, sellIDR: parseFloat(esimPar2) || 0, gbPerDay: null, totalGb: pkgType.gb, canBuy: false, badge: '' });
    }
  });

  // eSIM Access
  try {
    const eaPkgs = await getEsimAccessPackages(countryObj, lamaHari);
    eaPkgs.forEach(p => {
      const buyUSD = p.priceRaw / 10000;
      const buyIDR = Math.round(buyUSD * kurs);
      const sellIDR = Math.round(buyIDR * (1 + markup / 100));
      const pkgType = detectPackageType(p.name);
      if (pkgType.type === 'total') {
        allItems.push({ supplier: 'eSIM Access', type: 'eSIM', name: escH(p.name), dur: p.duration || 0, buyIDR, sellIDR, totalGb: pkgType.gb, speed: p.speed, canBuy: true, packageCode: p.packageCode, volumeFormatted: p.volumeFormatted, badge: '' });
      }
    });
  } catch(e) {}

  // iRoamly
  try {
    const irPkgs = await getIroamlyPackages(countryObj, lamaHari);
    irPkgs.forEach(p => {
      const buyUSD = parseFloat(p.credit || 0);
      const buyIDR = Math.round(buyUSD * kurs);
      const sellIDR = Math.round(buyIDR * (1 + markup / 100));
      const pkgType = detectPackageType(p.data || '');
      if (pkgType.type === 'total') {
        allItems.push({ supplier: 'iRoamly', type: 'eSIM', name: escH(p.data || ''), dur: parseInt(p.duration) || 0, buyIDR, sellIDR, totalGb: pkgType.gb, operator: p.operator, canBuy: false, badge: '' });
      }
    });
  } catch(e) {}

  if (!allItems.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:12px;">Tidak ada paket untuk ' + lamaHari + ' hari</div>';
    return;
  }

  // Sort by harga jual ASC
  allItems.sort((a, b) => (a.sellIDR || a.buyIDR) - (b.sellIDR || b.buyIDR));

  // Ambil 5 teratas
  const top5 = allItems.slice(0, 5);

  // Badge
  if (top5[0]) top5[0].badge = '🥇 TERMURAH';
  // Best value = GB terbanyak dengan harga reasonable
  const withGb = top5.filter(x => x.totalGb);
  if (withGb.length > 1) {
    withGb.sort((a, b) => (b.totalGb / (b.sellIDR || b.buyIDR || 1)) - (a.totalGb / (a.sellIDR || a.buyIDR || 1)));
    const bestVal = top5.find(x => x === withGb[0]);
    if (bestVal && !bestVal.badge) bestVal.badge = '⭐ BEST VALUE';
  }

  const supplierColor = { 'eSIM Access': '#6366f1', 'iRoamly': '#7c3aed', 'eSIMCard': '#1d4ed8', 'Aviroam': '#0369a1' };

  el.innerHTML = top5.map(item => {
    const color  = supplierColor[item.supplier] || '#374151';
    const harga  = item.sellIDR || item.buyIDR;
    const gbInfo = item.totalGb ? `${item.totalGb}GB` : (item.volumeFormatted || '');
    const durInfo = item.dur ? `${item.dur} hari` : '';
    const badgeHtml = item.badge ? `<div style="font-size:9px;font-weight:700;background:#fef3c7;color:#92400e;border-radius:3px;padding:2px 6px;margin-bottom:4px;display:inline-block;">${item.badge}</div>` : '';
    const buyBtn = item.canBuy && item.packageCode
      ? `<button onclick="esimAccessOpenBeli(${JSON.stringify(JSON.stringify({packageCode:item.packageCode,name:item.name,priceUSD:(item.buyIDR/kurs),buyIDR:item.buyIDR,sellIDR:item.sellIDR,duration:item.dur,volumeFormatted:item.volumeFormatted||'',speed:item.speed||''}))})"
           style="width:100%;margin-top:6px;padding:5px;background:${color};color:white;border:none;border-radius:5px;font-size:10px;font-weight:600;cursor:pointer;font-family:var(--font);">📡 Beli</button>`
      : '';

    return `<div style="min-width:160px;max-width:180px;flex-shrink:0;border:1px solid var(--border);border-radius:8px;padding:10px;background:white;">
      ${badgeHtml}
      <div style="font-size:10px;font-weight:700;color:${color};margin-bottom:2px;">${item.supplier}</div>
      <div style="font-size:10px;color:var(--text);margin-bottom:4px;line-height:1.3;">${item.name}</div>
      <div style="font-size:9px;color:var(--text-muted);margin-bottom:6px;">${[gbInfo, durInfo].filter(Boolean).join(' · ')}</div>
      <div style="font-size:13px;font-weight:700;color:${color};">${hargaFmtIDR(harga)}</div>
      ${buyBtn}
    </div>`;
  }).join('');
}

// ── Section 2: Tabel Total Data ──────────────────────────────
async function loadHargaTabelTotal(country, lamaHari, kurs, markup, countryObj, avRows) {
  const el = document.getElementById('h-tabel-total');
  if (!el) return;

  const rows = []; // { supplier, type, name, dur, buyIDR, sellIDR, totalGb, info, canBuy, packageCode }

  // Aviroam SIM Card & eSIM
  avRows.forEach(r => {
    const [negara, pkg, dur,, simPub, esimPub, esimPar2] = r;
    const pkgType = detectPackageType(pkg || '');
    if (pkgType.type !== 'total') return;
    rows.push({ supplier: 'Aviroam', type: 'SIM Card', name: escH(pkg || ''), dur: dur || 0, buyIDR: parseFloat(simPub) || 0, sellIDR: 0, totalGb: pkgType.gb, info: escH(negara || ''), canBuy: false, isAviroam: true, simPub: parseFloat(simPub)||0, simPar: parseFloat(r[4])||0, esimPub: parseFloat(esimPub)||0, esimPar: parseFloat(esimPar2)||0 });
  });

  // eSIM Access
  try {
    const eaPkgs = await getEsimAccessPackages(countryObj, lamaHari);
    eaPkgs.forEach(p => {
      const pkgType = detectPackageType(p.name);
      if (pkgType.type !== 'total') return;
      const buyUSD = p.priceRaw / 10000;
      const buyIDR = Math.round(buyUSD * kurs);
      const sellIDR = Math.round(buyIDR * (1 + markup / 100));
      const notes = parsePackageNotes(p.name);
      const isRegional = isRegionalPackage(p);
      const regionLabel = isRegional ? '🌏 Multi-negara' : '';
      rows.push({ supplier: 'eSIM Access', type: 'eSIM', name: escH(p.name), dur: p.duration || 0, buyIDR, sellIDR, totalGb: pkgType.gb, info: [p.speed || '', notes.join(' '), regionLabel].filter(Boolean).join(' · '), canBuy: true, packageCode: p.packageCode, volumeFormatted: p.volumeFormatted, speed: p.speed });
    });
  } catch(e) {}

  // iRoamly
  try {
    const irPkgs = await getIroamlyPackages(countryObj, lamaHari);
    irPkgs.forEach(p => {
      const pkgType = detectPackageType(p.data || '');
      if (pkgType.type !== 'total') return;
      const buyUSD = parseFloat(p.credit || 0);
      const buyIDR = Math.round(buyUSD * kurs);
      const sellIDR = Math.round(buyIDR * (1 + markup / 100));
      const canHotspot = p.hotspot !== false;
      rows.push({ supplier: 'iRoamly', type: 'eSIM', name: escH(p.data || ''), dur: parseInt(p.duration) || 0, buyIDR, sellIDR, totalGb: pkgType.gb, info: `${escH(p.operator||'')} · ${escH(p.network_type||'4G')} · Hotspot:${canHotspot?'✅':'❌'}`, canBuy: false });
    });
  } catch(e) {}

  // eSIMCard (dari esimcard.js)
  // Data ini di-load terpisah oleh loadEsimCardPrice
  // Kita tampilkan placeholder dulu
  rows.push({ _esimcardPlaceholder: true });

  // Sort: durasi ASC, lalu harga ASC
  const sortedRows = rows.filter(r => !r._esimcardPlaceholder).sort((a, b) => {
    const dd = (a.dur || 0) - (b.dur || 0);
    return dd !== 0 ? dd : (a.buyIDR || 0) - (b.buyIDR || 0);
  });

  if (!sortedRows.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:12px;">Tidak ada paket Total Data</div>';
    loadEsimCardPrice(country, lamaHari, kurs, markup, 0, true);
    return;
  }

  const supplierColor = { 'eSIM Access': '#6366f1', 'iRoamly': '#7c3aed', 'eSIMCard': '#1d4ed8', 'Aviroam': '#0369a1' };

  let html = `<div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#f8fafc;border-bottom:2px solid var(--border);">
          <th style="text-align:left;padding:6px 8px;font-weight:600;color:var(--text-muted);">Supplier</th>
          <th style="text-align:left;padding:6px 8px;font-weight:600;color:var(--text-muted);">Paket</th>
          <th style="text-align:center;padding:6px 8px;font-weight:600;color:var(--text-muted);">Dur</th>
          <th style="text-align:right;padding:6px 8px;font-weight:600;color:var(--text-muted);">Beli</th>
          <th style="text-align:right;padding:6px 8px;font-weight:600;color:var(--text-muted);">Jual</th>
          <th style="padding:6px 8px;"></th>
        </tr>
      </thead>
      <tbody>`;

  sortedRows.forEach(r => {
    const color = supplierColor[r.supplier] || '#374151';
    if (r.isAviroam) {
      // Aviroam: 1 row per paket dengan 2 harga
      html += `<tr style="border-bottom:1px solid var(--border);">
        <td style="padding:6px 8px;"><span style="color:${color};font-weight:600;">${r.supplier}</span><br><span style="font-size:9px;color:var(--text-muted);">SIM+eSIM</span></td>
        <td style="padding:6px 8px;">${r.name}<br><span style="font-size:9px;color:var(--text-muted);">${r.info}</span></td>
        <td style="padding:6px 8px;text-align:center;">${r.dur}hr</td>
        <td style="padding:6px 8px;text-align:right;">
          <div style="font-size:10px;color:#0369a1;">SIM: ${hargaFmtIDR(r.simPub)}</div>
          <div style="font-size:10px;color:#166534;">eSIM: ${hargaFmtIDR(r.esimPub)}</div>
        </td>
        <td style="padding:6px 8px;text-align:right;">
          <div style="font-size:10px;color:#0369a1;">${hargaFmtIDR(r.simPar)}</div>
          <div style="font-size:10px;color:#166534;">${hargaFmtIDR(r.esimPar)}</div>
        </td>
        <td style="padding:6px 8px;"><span style="font-size:9px;color:var(--text-muted);">Info saja</span></td>
      </tr>`;
    } else {
      const buyBtn = r.canBuy && r.packageCode
        ? `<button onclick="esimAccessOpenBeli(${JSON.stringify(JSON.stringify({packageCode:r.packageCode,name:r.name,priceUSD:(r.buyIDR/kurs),buyIDR:r.buyIDR,sellIDR:r.sellIDR,duration:r.dur,volumeFormatted:r.volumeFormatted||'',speed:r.speed||''}))})"
             style="font-size:10px;padding:3px 8px;background:${color};color:white;border:none;border-radius:4px;cursor:pointer;font-family:var(--font);white-space:nowrap;">Beli</button>`
        : `<span style="font-size:9px;color:var(--text-muted);">eSIM</span>`;
      html += `<tr style="border-bottom:1px solid var(--border);">
        <td style="padding:6px 8px;"><span style="color:${color};font-weight:600;">${r.supplier}</span></td>
        <td style="padding:6px 8px;">${r.name}<br><span style="font-size:9px;color:var(--text-muted);">${r.info || ''}</span></td>
        <td style="padding:6px 8px;text-align:center;">${r.dur}hr</td>
        <td style="padding:6px 8px;text-align:right;font-weight:600;">${hargaFmtIDR(r.buyIDR)}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;color:${color};">${hargaFmtIDR(r.sellIDR || r.buyIDR)}</td>
        <td style="padding:6px 8px;">${buyBtn}</td>
      </tr>`;
    }
  });

  // eSIMCard rows (load async, placeholder)
  html += `<tr id="htabel-esimcard-rows"><td colspan="6" style="padding:8px;font-size:11px;color:var(--text-muted);"><i class="ti ti-loader spin"></i> Memuat eSIMCard...</td></tr>`;
  html += `</tbody></table></div>`;
  el.innerHTML = html;

  // Load eSIMCard async dan inject ke tabel
  loadEsimCardIntoTable(country, lamaHari, kurs, markup, supplierColor['eSIMCard']);
}

// ── Section 2: Tabel Kuota Harian ───────────────────────────
async function loadHargaTabelDaily(country, lamaHari, kurs, markup, avRows) {
  const el = document.getElementById('h-tabel-daily');
  if (!el) return;

  const dailyItems = []; // { supplier, name, gbPerDay, dur, buyIDR, simPub, simPar, esimPub, esimPar, isAviroam, canBuy }

  // Aviroam — per hari (1GB/day, 2GB/day, dll)
  avRows.forEach(r => {
    const [negara, pkg, dur,, simPub, esimPub, esimPar2] = r;
    const pkgType = detectPackageType(pkg || '');
    if (pkgType.type !== 'daily') return;
    dailyItems.push({ supplier: 'Aviroam', name: escH(pkg || ''), gbPerDay: pkgType.gbPerDay, dur: dur || 0, simPub: parseFloat(simPub)||0, simPar: parseFloat(r[4])||0, esimPub: parseFloat(esimPub)||0, esimPar: parseFloat(esimPar2)||0, isAviroam: true, canBuy: false });
  });

  // eSIMCard Unlimited — tambah via placeholder
  dailyItems.push({ _esimcardDailyPlaceholder: true });

  if (!dailyItems.filter(x => !x._esimcardDailyPlaceholder).length) {
    el.innerHTML = `<div id="h-daily-esimcard"><div style="font-size:11px;color:var(--text-muted);padding:12px;"><i class="ti ti-loader spin"></i> Memuat eSIMCard Unlimited...</div></div>`;
    loadEsimCardDailyIntoSection(country, lamaHari, kurs, markup, avRows);
    return;
  }

  // Group by gbPerDay
  const groups = {};
  dailyItems.filter(x => !x._esimcardDailyPlaceholder).forEach(item => {
    const key = item.gbPerDay || 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  let html = '';
  Object.entries(groups).sort((a,b) => (parseFloat(a[0])||0) - (parseFloat(b[0])||0)).forEach(([gb, items]) => {
    const label = gb === 'unknown' ? 'Kuota Harian' : `${gb}GB / hari`;
    html += `<div style="margin-bottom:12px;">
      <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--border);">📶 ${label}</div>`;
    items.forEach(item => {
      if (item.isAviroam) {
        html += `<div style="border:1px solid var(--border);border-radius:7px;padding:8px 10px;margin-bottom:6px;">
          <div style="font-size:11px;font-weight:600;color:#0369a1;">🌐 Aviroam · ${item.dur} hari</div>
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px;">${item.name}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
            <div style="font-size:10px;">SIM Card Customer: <b>${hargaFmtIDR(item.simPub)}</b></div>
            <div style="font-size:10px;">SIM Card Partner: <b style="color:#166534;">${hargaFmtIDR(item.simPar)}</b></div>
            <div style="font-size:10px;">eSIM Customer: <b>${hargaFmtIDR(item.esimPub)}</b></div>
            <div style="font-size:10px;">eSIM Partner: <b style="color:#166534;">${hargaFmtIDR(item.esimPar)}</b></div>
          </div>
        </div>`;
      }
    });
    html += `</div>`;
  });

  // eSIMCard daily placeholder
  html += `<div id="h-daily-esimcard"><div style="font-size:11px;color:var(--text-muted);"><i class="ti ti-loader spin"></i> Memuat eSIMCard Unlimited...</div></div>`;
  el.innerHTML = html;

  loadEsimCardDailyIntoSection(country, lamaHari, kurs, markup, avRows);
}

// ── eSIM Access package fetcher ──────────────────────────────
async function getEsimAccessPackages(countryObj, lamaHari) {
  const iso = countryObj?.iso;
  if (!iso) return [];
  const cacheKey = `ea_${iso}`;
  if (window._eaAllPackages?.[cacheKey]) {
    return filterEsimAccessByLama(window._eaAllPackages[cacheKey], lamaHari);
  }
  try {
    const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimAccessPackages&locationCode=${iso}`);
    const data = await res.json();
    if (!data.ok || !data.packages) return [];
    if (!window._eaAllPackages) window._eaAllPackages = {};
    window._eaAllPackages[cacheKey] = data.packages;
    return filterEsimAccessByLama(data.packages, lamaHari);
  } catch(e) { return []; }
}

function filterEsimAccessByLama(packages, lamaHari) {
  return packages.filter(p => (p.duration || 0) >= lamaHari);
}

// ── iRoamly package fetcher ──────────────────────────────────
async function getIroamlyPackages(countryObj, lamaHari) {
  const region = countryObj?.iroamly || iroamlyGetRegion(countryObj?.display || '');
  if (!region) return [];
  const cacheKey = `ir_${region}`;
  if (window._irAllPackages?.[cacheKey]) {
    return filterIroamlyByLama(window._irAllPackages[cacheKey], lamaHari);
  }
  try {
    const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getIroamlyPackages&region=${encodeURIComponent(region)}`);
    const data = await res.json();
    if (!data.ok || !data.data) return [];
    const totalPkgs = data.data.filter(p => p.type === 'Total');
    const pkgs = totalPkgs.length ? totalPkgs : data.data;
    if (!window._irAllPackages) window._irAllPackages = {};
    window._irAllPackages[cacheKey] = pkgs;
    return filterIroamlyByLama(pkgs, lamaHari);
  } catch(e) { return []; }
}

function filterIroamlyByLama(packages, lamaHari) {
  return packages.filter(p => (parseInt(p.duration) || 0) >= lamaHari);
}

// ── eSIMCard inject ke tabel total ──────────────────────────
async function loadEsimCardIntoTable(country, lamaHari, kurs, markup, color) {
  const el = document.getElementById('htabel-esimcard-rows');
  if (!el) return;
  try {
    const countryObj = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === country);
    const iso = (countryObj?.iso || '').toLowerCase();
    if (!iso) { el.innerHTML = '<tr><td colspan="6" style="padding:8px;font-size:11px;color:var(--text-muted);">eSIMCard: negara tidak tersedia</td></tr>'; return; }
    const cacheKey = `esimcard_pkgs_${iso}`;
    let pkgs = window._esimcardCache?.[cacheKey];
    if (!pkgs) {
      const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimCardPricing&country=${iso}`);
      const data = await res.json();
      if (!data.ok || !data.data?.data?.length) { el.innerHTML = '<tr><td colspan="6" style="padding:8px;font-size:11px;color:var(--text-muted);">eSIMCard: tidak ada paket</td></tr>'; return; }
      pkgs = data.data.data;
      if (!window._esimcardCache) window._esimcardCache = {};
      window._esimcardCache[cacheKey] = pkgs;
    }

    // Filter paket total data saja, durasi >= lamaHari
    const totalPkgs = pkgs.filter(p => {
      const name = (p.name || '').toLowerCase();
      const dur  = parseInt(p.package_validity || p.duration || 0);
      const pkgType = detectPackageType(p.name || '');
      return pkgType.type === 'total' && dur >= lamaHari;
    }).sort((a, b) => {
      const da = parseInt(a.package_validity || a.duration || 0);
      const db = parseInt(b.package_validity || b.duration || 0);
      return da !== db ? da - db : 0;
    });

    if (!totalPkgs.length) { el.innerHTML = '<tr><td colspan="6" style="padding:8px;font-size:11px;color:var(--text-muted);">eSIMCard: tidak ada paket Total Data</td></tr>'; return; }

    el.outerHTML = totalPkgs.map(p => {
      const dur     = parseInt(p.package_validity || p.duration || 0);
      const buyUSD  = parseFloat(p.cost || 0);
      const buyIDR  = Math.round(buyUSD * kurs);
      const sellIDR = Math.round(buyIDR * (1 + markup / 100));
      const name    = escH(p.name || '');
      const op      = escH(p.network_provider || p.operator || '');
      const pkgDataStr = escH(JSON.stringify({ id: p.id, name: p.name || '', dataQty: p.data_quantity || '', validity: dur, buyUSD, buyIDR, sellIDR }).replace(/'/g,"&#39;"));
      return `<tr style="border-bottom:1px solid var(--border);">
        <td style="padding:6px 8px;"><span style="color:${color};font-weight:600;">eSIMCard</span></td>
        <td style="padding:6px 8px;">${name}<br><span style="font-size:9px;color:var(--text-muted);">${op}</span></td>
        <td style="padding:6px 8px;text-align:center;">${dur}hr</td>
        <td style="padding:6px 8px;text-align:right;font-weight:600;">${hargaFmtIDR(buyIDR)}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;color:${color};">${hargaFmtIDR(sellIDR)}</td>
        <td style="padding:6px 8px;"><button onclick="esimcardOpenBeli('${pkgDataStr}')" style="font-size:10px;padding:3px 8px;background:${color};color:white;border:none;border-radius:4px;cursor:pointer;font-family:var(--font);">Beli</button></td>
      </tr>`;
    }).join('');
  } catch(e) {
    if (el) el.outerHTML = `<tr><td colspan="6" style="padding:8px;font-size:11px;color:var(--red);">eSIMCard error: ${escH(e.message)}</td></tr>`;
  }
}

// ── eSIMCard daily inject ────────────────────────────────────
async function loadEsimCardDailyIntoSection(country, lamaHari, kurs, markup, avRows) {
  const el = document.getElementById('h-daily-esimcard');
  if (!el) return;
  try {
    const countryObj = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === country);
    const iso = (countryObj?.iso || '').toLowerCase();
    if (!iso) { el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);">eSIMCard: negara tidak tersedia</div>'; return; }
    const cacheKey = `esimcard_pkgs_${iso}`;
    let pkgs = window._esimcardCache?.[cacheKey];
    if (!pkgs) {
      const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimCardPricing&country=${iso}`);
      const data = await res.json();
      if (!data.ok || !data.data?.data?.length) { el.innerHTML = ''; return; }
      pkgs = data.data.data;
      if (!window._esimcardCache) window._esimcardCache = {};
      window._esimcardCache[cacheKey] = pkgs;
    }

    // Filter paket daily/unlimited
    const dailyPkgs = pkgs.filter(p => {
      const dur  = parseInt(p.package_validity || p.duration || 0);
      const pkgType = detectPackageType(p.name || '');
      return pkgType.type === 'daily' && dur >= lamaHari;
    }).sort((a, b) => {
      const ta = detectPackageType(a.name || '');
      const tb = detectPackageType(b.name || '');
      return (ta.gbPerDay || 0) - (tb.gbPerDay || 0);
    });

    if (!dailyPkgs.length) { el.innerHTML = ''; return; }

    // Group by gbPerDay
    const groups = {};
    dailyPkgs.forEach(p => {
      const pt = detectPackageType(p.name || '');
      const key = pt.gbPerDay || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    let html = '';
    Object.entries(groups).sort((a,b) => (parseFloat(a[0])||0) - (parseFloat(b[0])||0)).forEach(([gb, items]) => {
      const label = gb === 'unknown' ? 'Unlimited' : `${gb}GB/hari`;
      html += `<div style="margin-bottom:12px;">
        <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--border);">🟦 eSIMCard · ${label}</div>`;
      items.forEach(p => {
        const dur    = parseInt(p.package_validity || p.duration || 0);
        const buyUSD = parseFloat(p.cost || 0);
        const buyIDR = Math.round(buyUSD * kurs);
        const sellIDR = Math.round(buyIDR * (1 + markup / 100));
        const pkgDataStr = escH(JSON.stringify({ id: p.id, name: p.name||'', dataQty: p.data_quantity||'', validity: dur, buyUSD, buyIDR, sellIDR }).replace(/'/g,"&#39;"));
        html += `<div style="border:1px solid var(--border);border-radius:7px;padding:8px 10px;margin-bottom:6px;">
          <div style="font-size:11px;font-weight:600;color:var(--text);">${escH(p.name||'')}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">${escH(p.network_provider||'')} · ${dur} hari</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:10px;color:var(--text-muted);">Beli: <b>${hargaFmtIDR(buyIDR)}</b></div>
              <div style="font-size:12px;font-weight:700;color:#1d4ed8;">Jual: ${hargaFmtIDR(sellIDR)}</div>
            </div>
            <button onclick="esimcardOpenBeli('${pkgDataStr}')" style="font-size:10px;padding:5px 10px;background:#1d4ed8;color:white;border:none;border-radius:5px;cursor:pointer;font-family:var(--font);">🛒 Beli</button>
          </div>
        </div>`;
      });
      html += '</div>';
    });
    el.innerHTML = html;
  } catch(e) { if (el) el.innerHTML = ''; }
}

// ── loadEsimCardPrice (legacy stub — dipanggil dari kode lama) ──
async function loadEsimCardPrice(country, day, kurs, markup, aviroamPartnerEsim, skipRender) {
  // Fungsi ini masih dipanggil dari esimcard.js / kode lama
  // Di UI baru sudah dihandle oleh loadEsimCardIntoTable
  // Stub agar tidak error
  if (skipRender) return;
}

// ── eSIM Access Riwayat ──────────────────────────────────────
async function esimAccessOpenRiwayat() {
  let modal = document.getElementById('esimaccess-riwayat-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'esimaccess-riwayat-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;padding:24px;width:500px;max-width:95vw;font-family:var(--font);box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:14px;color:var(--text);">📡 Riwayat eSIM Access</h3>
        <button onclick="document.getElementById('esimaccess-riwayat-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <div id="ea-riwayat-list" style="font-size:12px;color:var(--text-muted);"><i class="ti ti-loader spin"></i> Memuat...</div>
    </div>`;
  document.body.appendChild(modal);

  try {
    const res  = await fetch('https://goho-proxy.gohotravel.workers.dev?action=getEsimAccessOrders&limit=50');
    const data = await res.json();
    const listEl = document.getElementById('ea-riwayat-list');
    if (!listEl) return;
    if (!data.ok || !data.orders?.length) {
      listEl.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">Belum ada transaksi eSIM Access</div>';
      return;
    }
    window._eaOrders = data.orders;
    listEl.innerHTML = data.orders.map((o, idx) => {
      const tgl = o.created_at ? new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-';
      const statusColor = { 'ACTIVE': '#166534', 'RELEASED': '#1e40af', 'PENDING': '#92400e', 'DEPLETED': '#6b7280', 'CANCELLED': '#991b1b', 'REVOKED': '#991b1b' };
      const sc = statusColor[o.status] || '#6b7280';
      return `
        <div style="border:1px solid var(--border);border-radius:8px;margin-bottom:6px;overflow:hidden;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;cursor:pointer;background:#f8fafc;" onclick="eaToggleRiwayat(${idx})">
            <div style="flex:1;min-width:0;">
              <div style="font-size:11px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${escH(o.nama_customer || o.no_wa_customer || '-')}
              </div>
              <div style="font-size:10px;color:var(--text-muted);">${escH(o.package_code || '-')} · ${tgl}</div>
              <div style="font-size:10px;color:${sc};font-weight:600;">${o.status || 'PENDING'}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;margin-left:8px;flex-shrink:0;">
              <button id="ea-rw-btn-${idx}" style="font-size:10px;padding:3px 10px;background:#6366f1;color:white;border:none;border-radius:4px;cursor:pointer;">▶ Buka</button>
              <button onclick="eaCheckUsage(${idx},event)" style="font-size:10px;padding:3px 10px;background:#0891b2;color:white;border:none;border-radius:4px;cursor:pointer;">📊 Sisa Data</button>
            </div>
          </div>
          <div id="ea-rw-detail-${idx}" style="display:none;padding:12px;border-top:1px solid var(--border);">
            ${o.qr_code_url ? `
            <div style="text-align:center;margin-bottom:10px;">
              <img src="${escH(o.qr_code_url)}" style="width:160px;height:160px;border:1px solid var(--border);border-radius:8px;background:white;padding:6px;" onerror="this.style.display='none'"/>
              <div style="display:flex;gap:6px;justify-content:center;margin-top:6px;">
                ${o.short_url ? `<a href="${escH(o.short_url)}" target="_blank" style="font-size:10px;padding:3px 8px;background:#6366f1;color:white;border-radius:4px;text-decoration:none;">🔗 Buka Link</a>` : ''}
                <button onclick="eaCopyRw('${escH(o.qr_code_url)}',this)" style="font-size:10px;padding:3px 8px;background:#e2e8f0;border:none;border-radius:4px;cursor:pointer;">📋 Copy URL</button>
              </div>
            </div>` : ''}
            <div style="font-size:10px;color:#64748b;margin-bottom:4px;">
              ICCID: <b>${escH(o.iccid || '-')}</b>
              ${o.iccid ? `<button onclick="eaCopyRw('${escH(o.iccid)}',this)" style="font-size:9px;padding:1px 4px;background:#e2e8f0;border:none;border-radius:3px;cursor:pointer;margin-left:4px;">📋</button>` : ''}
            </div>
            <div style="font-size:10px;color:#64748b;margin-bottom:4px;">Order No: <b>${escH(o.order_no || '-')}</b></div>
            <div style="font-size:10px;color:#64748b;margin-bottom:8px;">eSIM Tran No: <b>${escH(o.esim_tran_no || '-')}</b></div>
            <div id="ea-usage-${idx}"></div>
            ${o.iccid ? `
            <button onclick="eaCopyPesanWA(${idx})" style="width:100%;margin-top:8px;padding:7px;background:#16a34a;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font);">📲 Copy Pesan WA Customer</button>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    const listEl = document.getElementById('ea-riwayat-list');
    if (listEl) listEl.innerHTML = `<div style="color:var(--red);">Error: ${escH(e.message)}</div>`;
  }
}

function eaToggleRiwayat(idx) {
  const detail = document.getElementById(`ea-rw-detail-${idx}`);
  const btn    = document.getElementById(`ea-rw-btn-${idx}`);
  if (!detail) return;
  const isOpen = detail.style.display !== 'none';
  detail.style.display = isOpen ? 'none' : 'block';
  if (btn) btn.textContent = isOpen ? '▶ Buka' : '▼ Tutup';
}

function eaCopyRw(text, btnEl) {
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

async function eaCheckUsage(idx, e) {
  if (e) e.stopPropagation();
  const o = window._eaOrders?.[idx];
  if (!o || !o.esim_tran_no) { showToast('esimTranNo tidak ada'); return; }
  const usageEl = document.getElementById(`ea-usage-${idx}`);
  if (!usageEl) return;
  usageEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);"><i class="ti ti-loader spin"></i> Cek sisa data...</div>';
  try {
    const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimAccessUsage&esimTranNo=${encodeURIComponent(o.esim_tran_no)}`);
    const data = await res.json();
    if (!data.ok || !data.usageList?.length) { usageEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);">Data usage tidak tersedia</div>'; return; }
    const u = data.usageList[0];
    usageEl.innerHTML = `
      <div style="background:#f0fdf4;border-radius:6px;padding:8px;font-size:10px;">
        <div style="font-weight:700;color:#166534;margin-bottom:4px;">📊 Sisa Data</div>
        <div>Total: <b>${u.totalVolumeFormatted}</b></div>
        <div>Terpakai: <b>${u.usedVolumeFormatted}</b> (${u.usagePct}%)</div>
        <div style="color:#166534;font-weight:600;">Sisa: <b>${u.remainingFormatted}</b></div>
        ${u.expiredTime ? `<div style="color:#92400e;">Expired: ${u.expiredTime.replace('T',' ').substring(0,16)}</div>` : ''}
        <div style="background:#e2e8f0;border-radius:3px;height:6px;margin-top:6px;">
          <div style="background:#16a34a;border-radius:3px;height:6px;width:${Math.min(100,u.usagePct)}%;"></div>
        </div>
      </div>`;
  } catch(e2) { usageEl.innerHTML = `<div style="font-size:10px;color:var(--red);">Error: ${escH(e2.message)}</div>`; }
}

function eaCopyPesanWA(idx) {
  const o = window._eaOrders?.[idx];
  if (!o) return;
  const nama  = o.nama_customer ? `Halo ${o.nama_customer}` : 'Halo Kak';
  const paket = o.package_code || 'eSIM';
  let pesan = `${nama} 😊\n\neSIM Anda sudah siap!\n📦 Paket: ${paket}\nICCID: ${o.iccid || '-'}\n\n`;
  if (o.short_url) pesan += `📱 Scan QR / buka link: ${o.short_url}\n`;
  if (o.qr_code_url) pesan += `📷 QR Code: ${o.qr_code_url}\n`;
  pesan += '\neSIM aktif otomatis saat pertama connect ke jaringan.\nSelamat berlibur! ✈️';
  navigator.clipboard.writeText(pesan).then(() => showToast('✅ Pesan WA tersalin!')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = pesan; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✅ Pesan WA tersalin!');
  });
}

// ── eSIM Access Beli ─────────────────────────────────────────
function esimAccessOpenBeli(pkgStr) {
  let pkg;
  try { pkg = typeof pkgStr === 'string' ? JSON.parse(pkgStr) : pkgStr; }
  catch(e) { alert('Error parse paket: ' + e.message); return; }
  const old = document.getElementById('esimaccess-beli-modal');
  if (old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'esimaccess-beli-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;padding:24px;width:420px;max-width:95vw;font-family:var(--font);box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:92vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:14px;color:var(--text);">📡 Beli eSIM Access</h3>
        <button onclick="document.getElementById('esimaccess-beli-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px;">${escH(pkg.name || '')}</div>
        <div style="font-size:11px;color:var(--text-muted);">${escH(pkg.volumeFormatted || '')} · ${pkg.duration || ''} hari ${pkg.speed ? '· ' + escH(pkg.speed) : ''}</div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="font-size:11px;color:var(--text-muted);">Beli: <b style="color:var(--text);">${hargaFmtIDR(pkg.buyIDR)}</b> <span style="font-size:10px;">(USD ${(pkg.priceUSD||0).toFixed(2)})</span></span>
          <span style="font-size:11px;color:var(--text-muted);">Jual: <b style="color:#2563eb;">${hargaFmtIDR(pkg.sellIDR)}</b></span>
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px;">👤 Data Pembeli <span style="font-weight:400;color:var(--text-muted);">(opsional)</span></div>
        <input id="ea-nama-pembeli" type="text" placeholder="Nama tamu" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:var(--font);margin-bottom:6px;outline:none;"/>
        <input id="ea-hp-pembeli" type="text" placeholder="No HP / WA" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:var(--font);outline:none;"/>
      </div>
      <div id="ea-status" style="display:none;margin-bottom:12px;"></div>
      <div style="display:flex;gap:8px;">
        <button onclick="document.getElementById('esimaccess-beli-modal').remove()" style="flex:1;padding:9px;background:#f1f5f9;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:var(--font);">Batal</button>
        <button id="ea-beli-btn" onclick="esimAccessDoPurchase('${escH(pkg.packageCode)}','${escH(pkg.name)}')" style="flex:2;padding:9px;background:#6366f1;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);">✅ Konfirmasi Beli</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function esimAccessDoPurchase(packageCode, packageName) {
  const statusEl = document.getElementById('ea-status');
  const beliBtn  = document.getElementById('ea-beli-btn');
  if (!statusEl || !beliBtn) return;
  const namaPembeli = document.getElementById('ea-nama-pembeli')?.value?.trim() || '';
  const hpPembeli   = document.getElementById('ea-hp-pembeli')?.value?.trim() || '';
  beliBtn.disabled  = true;
  beliBtn.textContent = '⏳ Memproses...';
  statusEl.style.display = 'block';
  statusEl.innerHTML = '<div style="background:#ede9fe;border-radius:8px;padding:10px 12px;font-size:11px;color:#6366f1;">⏳ Mengirim order ke eSIM Access...</div>';
  try {
    const res  = await fetch('https://goho-proxy.gohotravel.workers.dev', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'esimAccessOrder', packageCode, count: 1, noWaCustomer: hpPembeli ? '62' + hpPembeli.replace(/^0/,'').replace(/\D/g,'') : '', namaCustomer: namaPembeli, staff: currentStaff?.nama || '', catatan: packageName })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.msg || 'Order gagal');
    const orderNo = data.orderNo;
    statusEl.innerHTML = `<div style="background:#fef3c7;border-radius:8px;padding:10px 12px;font-size:11px;color:#92400e;">⏳ Order berhasil (${escH(orderNo)}). Mengambil QR code...</div>`;
    beliBtn.textContent = '⏳ Menunggu...';
    setTimeout(() => eaPollResult(orderNo, statusEl, beliBtn, packageName, 1), 3000);
  } catch(e) {
    statusEl.innerHTML = `<div style="background:#fee2e2;border-radius:8px;padding:10px;font-size:11px;color:#991b1b;">❌ ${escH(e.message)}</div>`;
    beliBtn.disabled    = false;
    beliBtn.textContent = '✅ Coba Lagi';
  }
}

async function eaPollResult(orderNo, statusEl, beliBtn, packageName, attempt) {
  const maxAttempts = 8;
  try {
    const res  = await fetch('https://goho-proxy.gohotravel.workers.dev', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'esimAccessPollOrder', orderNo })
    });
    const data = await res.json();
    if (data.ok && data.iccid) {
      beliBtn.style.background = '#16a34a';
      beliBtn.textContent      = '✅ Berhasil!';
      beliBtn.disabled         = true;
      const qrId = 'ea-qr-' + Date.now();
      statusEl.innerHTML = `
        <div style="background:#dcfce7;border-radius:8px;padding:10px 12px;margin-bottom:10px;color:#166534;font-weight:700;font-size:12px;">✅ Pembelian berhasil!</div>
        ${data.qrCodeUrl ? `
        <div style="text-align:center;margin-bottom:10px;background:#f8fafc;border-radius:8px;padding:12px;">
          <img src="${escH(data.qrCodeUrl)}" style="width:160px;height:160px;border:1px solid var(--border);border-radius:8px;background:white;padding:6px;" onerror="this.style.display='none'"/>
          <div style="display:flex;gap:6px;justify-content:center;margin-top:8px;">
            ${data.shortUrl ? `<a href="${escH(data.shortUrl)}" target="_blank" style="font-size:10px;padding:4px 10px;background:#6366f1;color:white;border-radius:4px;text-decoration:none;">🔗 Buka Link</a>` : ''}
          </div>
        </div>` : ''}
        <div style="background:#f8fafc;border-radius:8px;padding:10px;margin-bottom:10px;font-size:10px;">
          <div>Paket: <b>${escH(packageName)}</b></div>
          <div>ICCID: <b>${escH(data.iccid)}</b></div>
          <div>Status: <b>${escH(data.statusLabel||'')}</b></div>
          ${data.expiredTime ? `<div>Expired: <b>${data.expiredTime.replace('T',' ').substring(0,16)}</b></div>` : ''}
          ${data.totalVolumeFormatted ? `<div>Kapasitas: <b>${data.totalVolumeFormatted}</b></div>` : ''}
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="font-size:11px;font-weight:700;color:#166534;">💬 Pesan WA Customer</div>
            <button onclick="navigator.clipboard.writeText(document.getElementById('ea-wa-msg-new').innerText).then(()=>showToast('✅ Tersalin!'))" style="font-size:10px;padding:3px 8px;background:#16a34a;color:white;border:none;border-radius:4px;cursor:pointer;">📋 Copy</button>
          </div>
          <div id="ea-wa-msg-new" style="font-size:11px;color:#1e293b;line-height:1.6;white-space:pre-wrap;background:white;border-radius:6px;padding:8px;border:1px solid #bbf7d0;">eSIM Anda sudah siap! 🎉

Paket: ${escH(packageName)}
ICCID: ${escH(data.iccid || '-')}
${data.expiredTime ? 'Expired: ' + data.expiredTime.replace('T',' ').substring(0,16) : ''}
${data.shortUrl ? '📱 Scan QR: ' + data.shortUrl : ''}

eSIM aktif otomatis saat pertama connect ke jaringan.
Selamat berlibur! ✈️</div>
        </div>`;
    } else if (attempt < maxAttempts) {
      statusEl.innerHTML = `<div style="background:#fef3c7;border-radius:8px;padding:10px 12px;font-size:11px;color:#92400e;">⏳ Sedang diproses... Cek ke-${attempt}/${maxAttempts}</div>`;
      setTimeout(() => eaPollResult(orderNo, statusEl, beliBtn, packageName, attempt + 1), 5000);
    } else {
      statusEl.innerHTML = `<div style="background:#fee2e2;border-radius:8px;padding:10px 12px;font-size:11px;color:#991b1b;">⚠️ eSIM masih diproses.<br><b>Order No: ${escH(orderNo)}</b><br>Cek di Riwayat eSIM Access.</div>`;
    }
  } catch(err) {
    if (attempt < maxAttempts) setTimeout(() => eaPollResult(orderNo, statusEl, beliBtn, packageName, attempt + 1), 5000);
  }
}

// ── Legacy stubs untuk index.html ───────────────────────────
function hargaOnDayChange()  { hargaShowResult(); }
function hargaOnPkgChange()  { hargaShowResult(); }
