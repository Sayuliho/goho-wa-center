// ============================================================
// HARGA SIM/ESIM — Panel, Aviroam, eSIM Access, iRoamly
// Logika baru: filter durasi >= lama perjalanan
// Tampilan: 4 kolom card (Aviroam, eSIM Access, iRoamly, eSIMCard)
// ============================================================

// hargaData & hargaLoaded — pakai var agar bisa di-share antar file tanpa konflik
var hargaData   = typeof hargaData   !== 'undefined' ? hargaData   : [];
var hargaLoaded = typeof hargaLoaded !== 'undefined' ? hargaLoaded : false;

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

const IROAMLY_REGIONS = {
  'hong-kong-and-macau': 'Hong Kong · Macau',
  'usa-ca': 'USA · Canada',
  'southeast-asia-4-countries': 'Singapore · Malaysia · Indonesia · Thailand',
  'au-nz': 'Australia · New Zealand',
  'singapore-malaysia-thailand': 'Singapore · Malaysia · Thailand',
  'usa-canada-mexico': 'USA · Canada · Mexico',
  'europe-34-countries': 'Europe 34 Countries',
  'asia-12-countries': 'Asia 12 Countries',
  'middle-east-5-countries': 'Middle East 5 Countries',
  'china-mainland-hong-kong-macau': 'China · Hong Kong · Macau',
  'south-america-8-countries': 'South America 8 Countries',
  'africa-18-countries': 'Africa 18 Countries',
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

function parsePackageNotes(name) {
  const notes = [];
  const n = (name || '').toLowerCase();
  if (n.includes('nonhkip')) notes.push('🌐 IP Exit: bukan HK');
  if (n.includes('iij'))     notes.push('IIJ');
  if (n.includes('ntt'))     notes.push('NTT');
  return notes;
}

// ── Helpers ──────────────────────────────────────────────────
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

// ── Panel setup ───────────────────────────────────────────────
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
  } catch(e) {}
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
  window._eaPkgCache      = {};
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

// ── Data loading ──────────────────────────────────────────────
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

// ── Country dropdown ──────────────────────────────────────────
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
  window._esimAccessCache = {};
  window._iroamlyCache    = {};
  hargaShowResult();
}

function hargaSelectCountry(country) {
  const clean = (country || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  document.getElementById('h-country-search').value = clean;
  document.getElementById('h-country').value = clean;
  document.getElementById('h-country-dropdown').style.display = 'none';
  window._selectedCountry = GOHO_COUNTRIES.find(c => c.display === clean) || null;
  window._esimAccessCache = {};
  window._iroamlyCache    = {};
  hargaShowResult();
}

document.addEventListener('DOMContentLoaded', function() {
  const inp = document.getElementById('h-country-search');
  if (inp) inp.addEventListener('blur', function() {
    setTimeout(() => { const dd = document.getElementById('h-country-dropdown'); if (dd) dd.style.display = 'none'; }, 200);
  });
});
document.addEventListener('click', function(e) {
  const dd  = document.getElementById('h-country-dropdown');
  const inp = document.getElementById('h-country-search');
  if (dd && inp && !dd.contains(e.target) && e.target !== inp) dd.style.display = 'none';
});

// ── Lama perjalanan input handler ─────────────────────────────
function hargaOnLamaChange() {
  clearTimeout(window._lamaTimer);
  window._lamaTimer = setTimeout(() => hargaShowResult(), 600);
}

// Legacy stubs
function hargaUpdateDay()   { hargaShowResult(); }
function hargaOnDayChange() { hargaShowResult(); }
function hargaOnPkgChange() { hargaShowResult(); }
function hargaUpdatePkg()   { hargaShowResult(); }

// ── MAIN hargaShowResult — 4 kolom card ──────────────────────
async function hargaShowResult() {
  const displayName = document.getElementById('h-country')?.value || '';
  const lamaHari    = hargaGetLamaPerjalanan();
  const resultEl    = document.getElementById('h-result');
  if (!displayName) { resultEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Pilih negara dulu</div>'; return; }
  if (!lamaHari)    { resultEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Isi lama perjalanan (hari)</div>'; return; }

  const kurs       = hargaGetKurs();
  const markup     = hargaGetMarkup();
  const countryObj = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === displayName);

  // Sync input
  const kursEl   = document.getElementById('h-kurs-usd');
  const markupEl = document.getElementById('h-markup-pct');
  if (kursEl)   kursEl.value   = kurs;
  if (markupEl) markupEl.value = markup;

  const avKeywords = countryObj?.aviroam || [displayName.toLowerCase()];
  const src = window._aviroamRows || hargaData;
  const MULTI_KW = ['multi region', 'asia pacific', 'multi-region', 'global', 'worldwide'];

  let avRows = src.filter(r => {
    const name   = (r[0] || '').toLowerCase().trim();
    const rowDur = r[2] || 0;
    if (rowDur < lamaHari) return false;
    if (MULTI_KW.some(kw => name.includes(kw))) return false;
    return avKeywords.some(kw => {
      const k = kw.toLowerCase();
      if (name === k) return true;
      if (name.startsWith(k)) {
        const rest = name.slice(k.length).trim();
        if (!rest) return true;
        const hasOtherCountry = ['hongkong', 'hong kong', 'macau', 'macao', 'korea', 'taiwan',
          'japan', 'thailand', 'singapore', 'malaysia', 'vietnam', 'indonesia',
          'australia', 'india', 'pakistan', 'europe', 'america', 'africa'].some(c => rest.includes(c));
        return !hasOtherCountry;
      }
      return false;
    });
  });
  avRows = avRows.filter((r, i, arr) => arr.findIndex(x => x[0] === r[0] && x[1] === r[1] && x[2] === r[2]) === i);
  avRows.sort((a, b) => (a[2] || 0) - (b[2] || 0));

  const row     = avRows[0] || null;
  const esimPar = row ? parseFloat(row[6]) || 0 : 0;
  const c       = displayName;

  let aviroamCards = '';
  if (!avRows.length) {
    aviroamCards = `<div style="font-size:11px;color:var(--text-muted);">Tidak ada paket ${lamaHari} hari atau lebih di Aviroam</div>`;
  } else {
    const avByDur = new Map();
    avRows.forEach(r => {
      const d = r[2] || 0;
      if (!avByDur.has(d)) avByDur.set(d, []);
      avByDur.get(d).push(r);
    });
    avByDur.forEach((rows, dur) => {
      const isExactDur = dur === lamaHari;
      aviroamCards += `<div style="font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.5px;margin:${aviroamCards ? '12px' : '0'} 0 6px;padding-bottom:4px;border-bottom:2px solid var(--border);">
        📅 ${dur} Hari${!isExactDur ? ' <span style="font-size:9px;font-weight:500;color:#6366f1;text-transform:none;">(perbandingan)</span>' : ''}
      </div>`;
      rows.forEach(r => {
        const [,, rowDurAv, simPub, simPar, esimPub, esimPar2] = r;
        const pkg = r[1] || '';
        const durColor = isExactDur ? '#0369a1' : '#6366f1';
        const durBg    = isExactDur ? '#e0f2fe' : '#ede9fe';
        const durLabel = `<span style="font-size:9px;background:${durBg};color:${durColor};border-radius:3px;padding:1px 5px;font-weight:600;">${rowDurAv} hari</span>`;
        aviroamCards += `
          <div style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:8px;">
            <div style="margin-bottom:6px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
              <div style="font-size:9px;color:#6366f1;background:#ede9fe;border-radius:4px;padding:2px 6px;display:inline-block;">🌏 ${escH(r[0])}</div>
              ${pkg ? `<span style="font-size:9px;color:#0369a1;background:#e0f2fe;border-radius:3px;padding:1px 5px;">${escH(pkg)}</span>` : ''}
              ${durLabel}
            </div>
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.4px;">SIM Card</div>
            ${hargaRowAviroam('Publish', hargaFmtIDR(simPub), 'customer')}
            ${hargaRowAviroam('Partner', hargaFmtIDR(simPar), 'agen')}
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);margin:6px 0 4px;text-transform:uppercase;letter-spacing:0.4px;">eSIM</div>
            ${hargaRowAviroam('Publish', hargaFmtIDR(esimPub), 'customer')}
            ${hargaRowAviroam('Partner', hargaFmtIDR(esimPar2), 'agen')}
          </div>`;
      });
    });
  }

  resultEl.innerHTML = `
    <div style="font-size:11px;background:#f1f5f9;border-radius:6px;padding:4px 10px;color:var(--text-muted);margin-bottom:12px;display:inline-block;">
      ${escH(displayName)} · ${lamaHari} hari
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px;">🌐 Aviroam</div>
        ${aviroamCards}
      </div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;">📡 eSIM Access</div>
        <div id="esim-access-result" style="font-size:12px;color:var(--text-muted);">
          <i class="ti ti-loader spin"></i> Memuat...
        </div>
      </div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;">🟣 iRoamly</div>
        <div id="iroamly-result" style="font-size:12px;color:var(--text-muted);">
          <i class="ti ti-loader spin"></i> Memuat...
        </div>
      </div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;">🟦 eSIMCard</div>
        <div id="esimcard-result" style="font-size:12px;color:var(--text-muted);">
          <i class="ti ti-loader spin"></i> Memuat...
        </div>
      </div>
    </div>`;

  loadEsimAccessPrice(c, lamaHari, kurs, markup, esimPar);
  loadIroamlyPrice(c, lamaHari, kurs, markup, esimPar);
  loadEsimCardPrice(c, lamaHari, kurs, markup, esimPar);
}

// ── eSIM Access price loader ──────────────────────────────────
async function loadEsimAccessPrice(countryDisplay, lamaHari, kurs, markup, aviroamPartnerEsim) {
  const el = document.getElementById('esim-access-result');
  if (!el) return;
  try {
    const countryObj = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === countryDisplay);
    const code = countryObj?.iso;
    if (!code) { el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Negara tidak tersedia</span>'; return; }

    const cacheKey = `ea_${code}`;
    let rawPackages = window._esimAccessCache?.[cacheKey];
    if (!rawPackages) {
      const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimAccessPackages&locationCode=${code}`);
      const data = await res.json();
      if (!data.ok || !data.packages?.length) {
        el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket tersedia</span>';
        return;
      }
      rawPackages = data.packages;
      if (!window._esimAccessCache) window._esimAccessCache = {};
      window._esimAccessCache[cacheKey] = rawPackages;
    }

    const REGIONAL_KW = ['asia', 'global', 'worldwide', 'global139', 'global (', 'asia-20', 'aukus', 'oceania'];
    const isPure = p => {
      const name = (p.name || '').toLowerCase();
      const locList = p.locationNetworkList || [];
      return !REGIONAL_KW.some(kw => name.includes(kw)) && locList.length <= 2;
    };
    const purePkgs = rawPackages.filter(isPure);
    const workingPkgs = (purePkgs.length ? purePkgs : rawPackages).filter(p => parseInt(p.duration || 0) >= lamaHari);

    if (!workingPkgs.length) {
      el.innerHTML = `<div style="font-size:11px;color:var(--text-muted);">Tidak ada paket eSIM Access untuk ≥ ${lamaHari} hari</div>`;
      return;
    }

    const byDurEA = new Map();
    workingPkgs.forEach(p => {
      const d = parseInt(p.duration || 0);
      if (!byDurEA.has(d)) byDurEA.set(d, []);
      byDurEA.get(d).push(p);
    });
    [...byDurEA.keys()].sort((a,b) => a-b).forEach(d => {
      byDurEA.get(d).sort((a,b) => (a.priceRaw||0) - (b.priceRaw||0));
    });

    let html = '';
    [...byDurEA.entries()].sort((a,b) => a[0]-b[0]).forEach(([dur, pkgs]) => {
      const isExactDur = dur === lamaHari;
      html += `<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin:${html?'10px':'0'} 0 6px;padding-bottom:4px;border-bottom:1px solid var(--border);">
        📅 ${dur} Hari${!isExactDur ? ' <span style="font-size:9px;font-weight:400;color:#6366f1;">(perbandingan)</span>' : ''}
      </div>`;
      pkgs.forEach(pkg => {
        const buyUSD  = (pkg.priceRaw || 0) / 10000;
        const buyIDR  = Math.round(buyUSD * kurs);
        const sellIDR = Math.round(buyIDR * (1 + markup / 100));
        const isCheaper  = aviroamPartnerEsim > 0 && sellIDR < aviroamPartnerEsim;
        const border = isCheaper ? '2px solid #10b981' : '1px solid var(--border)';
        const bg     = isCheaper ? '#f0fdf4' : 'white';
        const cheapBadge = isCheaper ? '<span style="background:#10b981;color:white;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;margin-left:4px;">LEBIH MURAH</span>' : '';
        const notes   = parsePackageNotes(pkg.name || '');
        const noteHtml = notes.length ? `<div style="font-size:9px;color:#b45309;background:#fef3c7;border-radius:3px;padding:2px 6px;margin-bottom:4px;display:inline-block;">${notes.join(' · ')}</div>` : '';
        const locList = pkg.locationNetworkList || [];
        const ops     = locList.flatMap(l => (l.operatorList || l.networkList || []).map(n => n.operatorName || '')).filter(Boolean).slice(0, 3);
        const opStr   = ops.length ? ops.join(' · ') : '';
        const pkgId  = 'ea-' + (pkg.packageCode||'').replace(/[^a-zA-Z0-9]/g,'_');
        window._eaPkgCache = window._eaPkgCache || {};
        window._eaPkgCache[pkgId] = { packageCode: pkg.packageCode||'', name: pkg.name||'', priceUSD: buyUSD, buyIDR, sellIDR, duration: dur, volumeFormatted: pkg.volumeFormatted||'', speed: pkg.speed||'' };
        html += `<div style="border:${border};border-radius:8px;padding:8px 10px;margin-bottom:7px;background:${bg};">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:2px;">
            <span style="font-size:11px;font-weight:600;color:var(--text);">${escH(pkg.name||'-')}</span>${cheapBadge}
          </div>
          ${noteHtml}
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;">
            ${pkg.speed ? `<span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">📶 ${escH(pkg.speed)}</span>` : ''}
            ${pkg.volumeFormatted ? `<span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">📦 ${escH(pkg.volumeFormatted)}</span>` : ''}
            ${pkg.hotspot ? `<span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">🔥 Hotspot: ✅</span>` : ''}
            ${pkg.smsStatus === 1 ? `<span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">💬 SMS</span>` : ''}
            ${pkg.supportsTopUp ? `<span style="font-size:9px;background:#d1fae5;color:#065f46;border-radius:3px;padding:1px 6px;">🔄 Top-up</span>` : ''}
            ${pkg.activeType === 2 ? `<span style="font-size:9px;background:#e0f2fe;color:#0369a1;border-radius:3px;padding:1px 6px;">⚡ Auto-aktif</span>` : `<span style="font-size:9px;background:#f1f5f9;color:#374151;border-radius:3px;padding:1px 6px;">🖐 Aktif manual</span>`}
            ${pkg.unusedValidTime ? `<span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">⏳ Valid ${pkg.unusedValidTime}h sebelum pakai</span>` : ''}
            ${pkg.ipExport && /^[A-Z]{2}$/.test(pkg.ipExport) && pkg.ipExport !== 'HK' ? `<span style="font-size:9px;background:#f1f5f9;color:#374151;border-radius:3px;padding:1px 6px;">🌐 IP Exit: ${escH(pkg.ipExport)}</span>` : ''}
            ${pkg.fupPolicy ? `<span style="font-size:9px;background:#fef9c3;color:#713f12;border-radius:3px;padding:1px 6px;">⚡ FUP</span>` : ''}
          </div>
          ${opStr ? `<div style="font-size:9px;color:#6366f1;margin-bottom:4px;">📡 ${escH(opStr)}</div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;">
            <span style="font-size:10px;color:var(--text-muted);">Beli <span style="font-size:9px;">(USD ${buyUSD.toFixed(2)})</span></span>
            <span style="font-size:12px;font-weight:600;color:var(--text);">${hargaFmtIDR(buyIDR)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-top:1px solid var(--border);margin-bottom:4px;">
            <span style="font-size:10px;color:var(--text-muted);">Jual <span style="font-size:9px;">(+${markup}%)</span></span>
            <span style="font-size:13px;font-weight:700;color:#6366f1;">${hargaFmtIDR(sellIDR)}</span>
          </div>
          <button onclick="esimAccessOpenBeliById('${pkgId}')" style="width:100%;padding:5px;background:#6366f1;color:white;border:none;border-radius:5px;font-size:10px;font-weight:600;cursor:pointer;font-family:var(--font);">📡 Beli eSIM Access</button>
        </div>`;
      });
    });
    el.innerHTML = html || '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket</span>';
  } catch(e) {
    if (el) el.innerHTML = `<span style="font-size:11px;color:var(--red);">Error: ${escH(e.message)}</span>`;
  }
}

// ── iRoamly price loader ──────────────────────────────────────
async function loadIroamlyPrice(country, lamaHari, kurs, markup, aviroamPartnerEsim) {
  const el = document.getElementById('iroamly-result');
  if (!el) return;
  try {
    const countryObj = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === country);
    const region = countryObj?.iroamly || iroamlyGetRegion(country);
    if (!region) { el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Negara tidak tersedia di iRoamly</span>'; return; }

    const cacheKey = `ir_${region}`;
    let rawData = window._iroamlyCache?.[cacheKey];
    if (!rawData) {
      const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getIroamlyPackages&region=${encodeURIComponent(region)}`);
      const data = await res.json();
      if (!data.ok || !data.data?.length) { el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket tersedia</span>'; return; }
      rawData = data.data;
      if (!window._iroamlyCache) window._iroamlyCache = {};
      window._iroamlyCache[cacheKey] = rawData;
    }

    const totalPkgs = rawData.filter(p => p.type === 'Total');
    const workIR    = (totalPkgs.length ? totalPkgs : rawData).filter(p => parseInt(p.duration) >= lamaHari);
    if (!workIR.length) { el.innerHTML = `<div style="font-size:11px;color:var(--text-muted);">Tidak ada paket iRoamly untuk ≥ ${lamaHari} hari</div>`; return; }

    const byDurIR = new Map();
    workIR.forEach(p => {
      const d = parseInt(p.duration);
      if (!byDurIR.has(d)) byDurIR.set(d, []);
      byDurIR.get(d).push(p);
    });

    let html = '';
    [...byDurIR.entries()].sort((a,b) => a[0]-b[0]).forEach(([validity, dayPkgs]) => {
      const isExactDur = validity === lamaHari;
      html += `<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin:${html?'10px':'0'} 0 6px;padding-bottom:4px;border-bottom:1px solid var(--border);">
        📅 ${validity} Hari${!isExactDur ? ' <span style="font-size:9px;font-weight:400;color:#7c3aed;">(perbandingan)</span>' : ''}
      </div>`;
      dayPkgs.sort((a, b) => parseFloat(a.credit||0) - parseFloat(b.credit||0));
      dayPkgs.forEach(pkg => {
        const buyUSD  = parseFloat(pkg.credit || 0);
        const buyIDR  = Math.round(buyUSD * kurs);
        const sellIDR = Math.round(buyIDR * (1 + markup / 100));
        const isCheaper  = aviroamPartnerEsim > 0 && sellIDR < aviroamPartnerEsim;
        const border = isCheaper ? '2px solid #10b981' : '1px solid var(--border)';
        const bg     = isCheaper ? '#f0fdf4' : 'white';
        const cheapBadge = isCheaper ? '<span style="background:#10b981;color:white;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;margin-left:4px;">LEBIH MURAH</span>' : '';
        const canHotspot = pkg.hotspot !== false;
        const coverage   = IROAMLY_REGIONS[pkg.region_index || ''] || '';
        const dayQuota   = pkg.day_quota || pkg.daily_quota || '';
        const speedInfo  = dayQuota ? `${dayQuota}/hari full speed` : '';
        html += `<div style="border:${border};border-radius:8px;padding:8px 10px;margin-bottom:7px;background:${bg};">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:4px;">
            <span style="font-size:11px;font-weight:600;color:var(--text);">${escH(pkg.data||'-')} · ${validity}h</span>${cheapBadge}
          </div>
          ${coverage ? `<div style="font-size:9px;color:#6366f1;background:#ede9fe;border-radius:4px;padding:2px 6px;margin-bottom:4px;display:inline-block;">🌏 ${escH(coverage)}</div>` : ''}
          <div style="font-size:9px;color:var(--text-muted);margin-bottom:4px;">${escH(pkg.operator||'')}</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;">
            <span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">📶 ${escH(pkg.network_type||'4G')}</span>
            <span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">🔥 Hotspot: ${canHotspot?'✅':'❌'}</span>
          </div>
          ${speedInfo ? `<div style="font-size:9px;color:#b45309;background:#fef3c7;border-radius:3px;padding:2px 6px;margin-bottom:4px;display:inline-block;">⚡ ${escH(speedInfo)}</div>` : ''}
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
    el.innerHTML = html || '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket</span>';
  } catch(e) {
    if (el) el.innerHTML = `<span style="font-size:11px;color:var(--red);">Error: ${escH(e.message)}</span>`;
  }
}

// ── loadEsimCardPrice ─────────────────────────────────────────
async function loadEsimCardPrice(country, lamaHari, kurs, markup, aviroamPartnerEsim) {
  const el = document.getElementById('esimcard-result');
  if (!el) return;
  try {
    const countryObj = window._selectedCountry || GOHO_COUNTRIES.find(c => c.display === country);
    const iso = (countryObj?.iso || '').toLowerCase();
    if (!iso) { el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Negara tidak tersedia di eSIMCard</span>'; return; }

    const cacheKey = `esimcard_pkgs_${iso}`;
    let pkgs = window._esimcardCache?.[cacheKey];
    if (!pkgs) {
      const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimCardPricing&country=${iso}`);
      const data = await res.json();
      if (!data.ok || !data.data?.data?.length) { el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket tersedia</span>'; return; }
      pkgs = data.data.data;
      if (!window._esimcardCache) window._esimcardCache = {};
      window._esimcardCache[cacheKey] = pkgs;
    }

    function pkgDataLabel(pkg) {
      const qty  = pkg.data_quantity;
      const name = (pkg.name || '').toLowerCase();
      if (qty > 0) return `${qty}${pkg.data_unit || 'GB'}`;
      if (name.includes('premium')) return 'Unlimited Premium';
      if (name.includes('plus'))    return 'Unlimited Plus';
      return 'Unlimited';
    }

    const filteredEC = pkgs.filter(p => parseInt(p.package_validity || 0) >= lamaHari);
    if (!filteredEC.length) { el.innerHTML = `<div style="font-size:11px;color:var(--text-muted);">Tidak ada paket eSIMCard untuk ≥ ${lamaHari} hari</div>`; return; }

    filteredEC.sort((a, b) => {
      const dd = parseInt(a.package_validity) - parseInt(b.package_validity);
      return dd !== 0 ? dd : parseFloat(a.price||0) - parseFloat(b.price||0);
    });

    const byDurEC = new Map();
    filteredEC.forEach(p => {
      const d = parseInt(p.package_validity || 0);
      if (!byDurEC.has(d)) byDurEC.set(d, []);
      byDurEC.get(d).push(p);
    });

    let html = '';
    [...byDurEC.entries()].sort((a,b) => a[0]-b[0]).forEach(([validity, dayPkgs]) => {
      const isExactDur = validity === lamaHari;
      html += `<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin:${html?'10px':'0'} 0 6px;padding-bottom:4px;border-bottom:1px solid var(--border);">
        📅 ${validity} Hari${!isExactDur ? ' <span style="font-size:9px;font-weight:400;color:#1d4ed8;">(perbandingan)</span>' : ''}
      </div>`;
      dayPkgs.forEach(pkg => {
        const buyUSD   = parseFloat(pkg.price || 0);
        const buyIDR   = Math.round(buyUSD * kurs);
        const sellIDR  = Math.round(buyIDR * (1 + markup / 100));
        const dataQty  = pkgDataLabel(pkg);
        const isCheaper = aviroamPartnerEsim > 0 && sellIDR < aviroamPartnerEsim;
        const border = isCheaper ? '2px solid #10b981' : '1px solid var(--border)';
        const bg     = isCheaper ? '#f0fdf4' : 'white';
        const cheapBadge = isCheaper ? '<span style="background:#10b981;color:white;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;margin-left:4px;">LEBIH MURAH</span>' : '';
        const canRenew = pkg.can_renew === true;
        const canHotspot = pkg.tether === true;
        const coverageArr    = pkg.coverage || pkg.network_coverage || [];
        const operators      = [...new Set(coverageArr.map(n => n.network_code || n.network_name || '').filter(Boolean))];
        const operatorStr    = operators.slice(0, 4).join(' · ');
        let connectivity = pkg.connectivity || '';
        if (!connectivity && coverageArr.length) {
          const hasG5 = coverageArr.some(n => n.five_G || n.fiv_5G);
          const hasG4 = coverageArr.some(n => n.four_G || n['for-4G']);
          const hasG3 = coverageArr.some(n => n.three_g || n.th_3G);
          connectivity = hasG5 ? '2G,3G,4G,5G' : hasG4 ? '2G,3G,4G' : hasG3 ? '2G,3G' : '4G';
        }
        const isThrottle  = pkg.throttle === true;
        const throttleSpd = pkg.throttle_speed || '';
        const unthrottle  = pkg.unthrottle_data || '';
        let speedInfo = '';
        if (isThrottle && unthrottle && unthrottle !== 'Unlimited') {
          speedInfo = `${escH(unthrottle)}/hari full speed → throttle ${escH(throttleSpd || '256kbps')}`;
        } else if (isThrottle && throttleSpd) {
          speedInfo = `Setelah kuota: throttle ${escH(throttleSpd)}`;
        } else if (!isThrottle && pkg.data_quantity <= 0) {
          speedInfo = 'Full speed unlimited (tanpa throttle)';
        }
        const actType = pkg.activation_type || '';
        const actInfo = actType === 'manual' ? 'Aktivasi manual via link' : 'Aktif otomatis saat data pertama dipakai';
        const pkgDataStr  = escH(JSON.stringify({ id: pkg.id, name: pkg.name||'', dataQty, validity, buyUSD, buyIDR, sellIDR }));

        html += `<div style="border:${border};border-radius:8px;padding:8px 10px;margin-bottom:7px;background:${bg};">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:4px;">
            <span style="font-size:11px;font-weight:600;color:var(--text);">${escH(dataQty)} · ${validity}h</span>${cheapBadge}
          </div>
          <div style="font-size:9px;color:var(--text-muted);margin-bottom:4px;">${escH(pkg.name||'')}</div>
          ${operatorStr ? `<div style="font-size:9px;color:var(--text-muted);margin-bottom:4px;">📡 ${escH(operatorStr)}</div>` : ''}
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;">
            ${connectivity ? `<span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">📶 ${escH(connectivity)}</span>` : ''}
            <span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">🔥 Hotspot: ${canHotspot?'✅':'❌'}</span>
            <span style="font-size:9px;background:#f1f5f9;border-radius:3px;padding:1px 6px;">🔄 Perpanjang: ${canRenew?'✅':'❌'}</span>
          </div>
          ${speedInfo ? `<div style="font-size:9px;color:#b45309;background:#fef3c7;border-radius:3px;padding:2px 6px;margin-bottom:4px;display:inline-block;">⚡ ${speedInfo}</div>` : ''}
          <div style="font-size:9px;color:var(--text-muted);margin-bottom:2px;">🔌 ${escH(actInfo)}</div>
          <div style="font-size:9px;color:var(--text-muted);margin-bottom:5px;">⏳ Aktivasi kartu maks. 30 hari</div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;">
            <span style="font-size:10px;color:var(--text-muted);">Beli <span style="font-size:9px;">(USD ${buyUSD.toFixed(2)})</span></span>
            <span style="font-size:12px;font-weight:600;color:var(--text);">${hargaFmtIDR(buyIDR)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-top:1px solid var(--border);">
            <span style="font-size:10px;color:var(--text-muted);">Jual <span style="font-size:9px;">(+${markup}%)</span></span>
            <span style="font-size:13px;font-weight:700;color:#2563eb;">${hargaFmtIDR(sellIDR)}</span>
          </div>
          <button onclick="esimcardOpenBeli('${pkgDataStr}')" style="width:100%;margin-top:8px;padding:7px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font);">🛒 Beli eSIMCard</button>
        </div>`;
      });
    });
    el.innerHTML = html || '<span style="font-size:11px;color:var(--text-muted);">Tidak ada paket cocok</span>';
  } catch(e) {
    if (el) el.innerHTML = `<span style="font-size:11px;color:var(--red);">Error: ${escH(e.message)}</span>`;
  }
}

// ── Riwayat Gabungan (eSIMCard + eSIM Access) ─────────────────
async function esimOpenRiwayatGabungan() {
  const old = document.getElementById('esim-riwayat-gabungan-modal');
  if (old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'esim-riwayat-gabungan-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;width:560px;max-width:96vw;font-family:var(--font);box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:92vh;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border);flex-shrink:0;">
        <h3 style="margin:0;font-size:14px;color:var(--text);">📋 Riwayat eSIM</h3>
        <div style="display:flex;align-items:center;gap:8px;">
          <button onclick="esimcardOpenSettingEmail()" style="font-size:10px;padding:4px 10px;background:#f1f5f9;border:1px solid var(--border);border-radius:5px;cursor:pointer;font-family:var(--font);">⚙️ Setting Email</button>
          <button onclick="document.getElementById('esim-riwayat-gabungan-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-muted);">✕</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;padding:10px 20px;border-bottom:1px solid var(--border);flex-shrink:0;">
        <button onclick="esimRiwayatFilterTab('semua')" id="rw-tab-semua" style="font-size:11px;padding:4px 12px;background:#6366f1;color:white;border:none;border-radius:5px;cursor:pointer;font-family:var(--font);">Semua</button>
        <button onclick="esimRiwayatFilterTab('esimcard')" id="rw-tab-esimcard" style="font-size:11px;padding:4px 12px;background:#f1f5f9;border:1px solid var(--border);color:var(--text);border-radius:5px;cursor:pointer;font-family:var(--font);">🟦 eSIMCard</button>
        <button onclick="esimRiwayatFilterTab('esimaccess')" id="rw-tab-esimaccess" style="font-size:11px;padding:4px 12px;background:#f1f5f9;border:1px solid var(--border);color:var(--text);border-radius:5px;cursor:pointer;font-family:var(--font);">📡 eSIM Access</button>
      </div>
      <div id="esim-rw-list" style="overflow-y:auto;flex:1;padding:12px 16px;">
        <div style="text-align:center;padding:20px;font-size:12px;color:var(--text-muted);"><i class="ti ti-loader spin"></i> Memuat riwayat...</div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const [ecRes, eaRes] = await Promise.allSettled([
    fetch(`${API}?action=getEsimcardOrders&limit=50`).then(r => r.json()),
    fetch('https://goho-proxy.gohotravel.workers.dev?action=getEsimAccessOrders&limit=50').then(r => r.json())
  ]);

  window._rwEcOrders = ecRes.status === 'fulfilled' && ecRes.value.ok ? (ecRes.value.orders || []) : [];
  window._rwEaOrders = eaRes.status === 'fulfilled' && eaRes.value.ok ? (eaRes.value.orders || []) : [];
  window._eaOrders = window._rwEaOrders;

  esimRiwayatFilterTab('semua');
}

function esimRiwayatFilterTab(tab) {
  ['semua','esimcard','esimaccess'].forEach(t => {
    const btn = document.getElementById(`rw-tab-${t}`);
    if (!btn) return;
    btn.style.background = t === tab ? '#6366f1' : '#f1f5f9';
    btn.style.color      = t === tab ? 'white'   : 'var(--text)';
    btn.style.border     = t === tab ? 'none'     : '1px solid var(--border)';
  });

  const listEl = document.getElementById('esim-rw-list');
  if (!listEl) return;

  const ecOrders = window._rwEcOrders || [];
  const eaOrders = window._rwEaOrders || [];

  const allItems = [
    ...ecOrders.map(o => ({ ...o, _supplier: 'esimcard' })),
    ...eaOrders.map(o => ({ ...o, _supplier: 'esimaccess' }))
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const filtered = tab === 'semua' ? allItems : allItems.filter(o => o._supplier === tab);

  if (!filtered.length) {
    listEl.innerHTML = '<div style="text-align:center;padding:20px;font-size:12px;color:var(--text-muted);">Belum ada riwayat</div>';
    return;
  }

  const statusColor = { 'ACTIVE': '#166534', 'RELEASED': '#1e40af', 'PENDING': '#92400e', 'DEPLETED': '#6b7280', 'CANCELLED': '#991b1b', 'REVOKED': '#991b1b' };

  listEl.innerHTML = filtered.map((o, idx) => {
    const isEc  = o._supplier === 'esimcard';
    const tgl   = o.created_at ? new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-';
    const sc    = statusColor[o.status] || '#6b7280';
    const suppLabel = isEc
      ? '<span style="font-size:9px;background:#dbeafe;color:#1d4ed8;border-radius:3px;padding:1px 5px;font-weight:700;">🟦 eSIMCard</span>'
      : '<span style="font-size:9px;background:#ede9fe;color:#6366f1;border-radius:3px;padding:1px 5px;font-weight:700;">📡 eSIM Access</span>';
    // FIX: prioritaskan catatan sebelum package_code untuk eSIM Access
    const paket = isEc ? (o.package_name || o.catatan || '-') : (o.package_name || o.catatan || o.package_code || '-');
    const nama  = isEc ? (o.nama_pembeli || o.nama_customer || '-') : (o.nama_customer || '-');
    const noWa  = isEc ? (o.hp_pembeli || '') : (o.no_wa_customer || o.noWa || '');
    const hargaBeli = o.harga_beli || o.hargaBeli || 0;
    const detailId = `rw-detail-${o._supplier}-${idx}`;
    const btnId    = `rw-btn-${o._supplier}-${idx}`;

    return `
      <div style="border:1px solid var(--border);border-radius:8px;margin-bottom:8px;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:#f8fafc;cursor:pointer;" onclick="esimRwToggle('${detailId}','${btnId}')">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">${suppLabel}<span style="font-size:11px;font-weight:700;color:var(--text);">${escH(nama !== '-' ? nama : (noWa || '-'))}</span>${noWa && nama !== '-' ? `<span style="font-size:10px;color:var(--text-muted);">· ${escH(noWa)}</span>` : ''}</div>
            <div style="font-size:10px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escH(paket)}</div>
            <div style="font-size:10px;color:${sc};font-weight:600;">${o.status||'PENDING'} · ${tgl} · ${escH(o.staff||'')}${hargaBeli ? ' · <span style="color:#166534;">Beli: Rp ' + Number(hargaBeli).toLocaleString('id-ID') + '</span>' : ''}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-left:8px;flex-shrink:0;">
            <button id="${btnId}" style="font-size:10px;padding:3px 10px;background:#6366f1;color:white;border:none;border-radius:4px;cursor:pointer;">▶ Buka</button>
            <button onclick="esimRwSisaData('${o._supplier}',${idx},event)" style="font-size:10px;padding:3px 10px;background:#0891b2;color:white;border:none;border-radius:4px;cursor:pointer;">📊 Sisa Data</button>
          </div>
        </div>
        <div id="${detailId}" style="display:none;padding:12px;border-top:1px solid var(--border);">
          ${esimRwDetailHtml(o, isEc, idx)}
        </div>
      </div>`;
  }).join('');
}

function esimRwDetailHtml(o, isEc, idx) {
  const iccid    = o.iccid || '-';
  const orderNo  = o.order_no || o.esim_tran_no || '-';
  const qr       = o.qr_code_url || o.qrcode_url || '';
  const shortUrl = o.short_url || o.activation_url || '';
  const hargaBeli = o.harga_beli || o.hargaBeli || 0;
  let html = '';
  if (qr) {
    html += `<div style="text-align:center;margin-bottom:10px;">
      <img src="${escH(qr)}" style="width:150px;height:150px;border:1px solid var(--border);border-radius:8px;padding:4px;background:white;" onerror="this.style.display='none'"/>
      <div style="display:flex;gap:6px;justify-content:center;margin-top:6px;">
        ${shortUrl ? `<a href="${escH(shortUrl)}" target="_blank" style="font-size:10px;padding:3px 8px;background:#6366f1;color:white;border-radius:4px;text-decoration:none;">🔗 Link</a>` : ''}
        <button onclick="esimRwCopy('${escH(qr)}',this)" style="font-size:10px;padding:3px 8px;background:#e2e8f0;border:none;border-radius:4px;cursor:pointer;">📋 Copy URL QR</button>
      </div>
    </div>`;
  }
  html += `<div style="font-size:10px;margin-bottom:4px;">ICCID: <b>${escH(iccid)}</b>
    ${iccid !== '-' ? `<button onclick="esimRwCopy('${escH(iccid)}',this)" style="font-size:9px;padding:1px 4px;background:#e2e8f0;border:none;border-radius:3px;cursor:pointer;margin-left:4px;">📋</button>` : ''}
  </div>
  <div style="font-size:10px;margin-bottom:4px;">Order No: <b>${escH(orderNo)}</b></div>
  ${hargaBeli ? `<div style="font-size:10px;margin-bottom:8px;color:#166534;">Harga Beli: <b>Rp ${Number(hargaBeli).toLocaleString('id-ID')}</b></div>` : '<div style="margin-bottom:8px;"></div>'}
  <div id="rw-usage-${o._supplier}-${idx}"></div>`;

  // eSIM Access: tambah tombol live status + actions
  if (!isEc) {
    html += `<div id="rw-ea-profile-${idx}" style="margin-bottom:6px;"></div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">
      <button onclick="esimRwLoadEaProfile(${idx})" style="font-size:10px;padding:4px 10px;background:#6366f1;color:white;border:none;border-radius:4px;cursor:pointer;font-family:var(--font);">🔄 Status Live</button>
      <button onclick="esimRwEaAction('suspend',${idx},this)" style="font-size:10px;padding:4px 10px;background:#f59e0b;color:white;border:none;border-radius:4px;cursor:pointer;font-family:var(--font);">⏸ Suspend</button>
      <button onclick="esimRwEaAction('unsuspend',${idx},this)" style="font-size:10px;padding:4px 10px;background:#0891b2;color:white;border:none;border-radius:4px;cursor:pointer;font-family:var(--font);">▶ Aktifkan</button>
      <button onclick="esimRwEaAction('revoke',${idx},this)" style="font-size:10px;padding:4px 10px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-family:var(--font);">🗑 Revoke</button>
      <button onclick="esimRwEaAction('cancel',${idx},this)" style="font-size:10px;padding:4px 10px;background:#6b7280;color:white;border:none;border-radius:4px;cursor:pointer;font-family:var(--font);">❌ Cancel Order</button>
    </div>`;
  }

  if (iccid !== '-') {
    html += `<button onclick="esimRwCopyWA('${o._supplier}',${idx})" style="width:100%;margin-top:8px;padding:7px;background:#16a34a;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font);">📲 Copy Pesan WA Customer</button>`;
  }
  return html;
}

async function esimRwLoadEaProfile(idx) {
  const allItems = [
    ...(window._rwEcOrders || []).map(o => ({ ...o, _supplier: 'esimcard' })),
    ...(window._rwEaOrders || []).map(o => ({ ...o, _supplier: 'esimaccess' }))
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const filtered = allItems.filter(o => o._supplier === 'esimaccess');
  const o = filtered[idx];
  const profileEl = document.getElementById(`rw-ea-profile-${idx}`);
  if (!profileEl || !o) return;
  if (!o.order_no && !o.esim_tran_no) {
    profileEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);">Order No tidak tersedia</div>';
    return;
  }
  profileEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);"><i class="ti ti-loader spin"></i> Mengambil status live...</div>';
  try {
    const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimAccessQuery&orderNo=${encodeURIComponent(o.order_no||'')}`);
    const data = await res.json();
    if (!data.ok || !data.esimList?.length) {
      profileEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);">Data profil tidak tersedia</div>';
      return;
    }
    const e = data.esimList[0];
    const smdpColor  = { 'RELEASED': '#1d4ed8', 'INSTALLED': '#166534', 'ENABLED': '#166534', 'DELETED': '#991b1b' };
    const esimColor  = { '1': '#166534', '0': '#6b7280' };
    const smdpLabel  = e.smdpStatus || '-';
    const esimLabel  = e.esimStatus === '1' ? '✅ Aktif' : (e.esimStatus === '0' ? '⏸ Nonaktif' : e.esimStatus || '-');
    const sc         = smdpColor[smdpLabel] || '#374151';
    const ec         = esimColor[e.esimStatus] || '#374151';
    const device     = [e.brandName, e.model].filter(Boolean).join(' ');
    const osType     = e.osType === '1' ? 'iOS' : e.osType === '2' ? 'Android' : (e.osType || '');
    const installed  = e.installedTime ? e.installedTime.replace('T', ' ').substring(0, 16) : '';
    const expired    = e.expiredTime || e.expired_time || '';
    profileEl.innerHTML = `
      <div style="background:#f8fafc;border-radius:6px;padding:8px;font-size:10px;margin-bottom:4px;">
        <div style="font-weight:700;color:#374151;margin-bottom:6px;">📡 Status Live eSIM</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">
          <span style="background:#e0e7ff;color:${sc};border-radius:3px;padding:1px 6px;font-weight:600;">SMDP: ${escH(smdpLabel)}</span>
          <span style="background:#f0fdf4;color:${ec};border-radius:3px;padding:1px 6px;font-weight:600;">${escH(esimLabel)}</span>
          ${osType ? `<span style="background:#f1f5f9;border-radius:3px;padding:1px 6px;">${escH(osType)}</span>` : ''}
        </div>
        ${device ? `<div>📱 Perangkat: <b>${escH(device)}</b></div>` : ''}
        ${installed ? `<div>📅 Install: ${escH(installed)}</div>` : ''}
        ${expired ? `<div>⏱ Expired: ${escH(expired.replace('T',' ').substring(0,16))}</div>` : ''}
        ${e.appleInstallUrl ? `<div style="margin-top:4px;"><a href="${escH(e.appleInstallUrl)}" target="_blank" style="color:#6366f1;font-size:10px;">🍎 Link Install iOS</a></div>` : ''}
        ${e.googlePlayUrl ? `<div><a href="${escH(e.googlePlayUrl)}" target="_blank" style="color:#16a34a;font-size:10px;">🤖 Link Install Android</a></div>` : ''}
      </div>`;
  } catch(err) {
    profileEl.innerHTML = `<div style="font-size:10px;color:var(--red);">Error: ${escH(err.message)}</div>`;
  }
}

async function esimRwEaAction(action, idx, btnEl) {
  const allItems = [
    ...(window._rwEcOrders || []).map(o => ({ ...o, _supplier: 'esimcard' })),
    ...(window._rwEaOrders || []).map(o => ({ ...o, _supplier: 'esimaccess' }))
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const filtered = allItems.filter(o => o._supplier === 'esimaccess');
  const o = filtered[idx];
  if (!o) return;

  const actionLabel = { suspend: 'Suspend', unsuspend: 'Aktifkan', revoke: 'Revoke', cancel: 'Cancel Order' };
  const actionMap   = { suspend: 'esimAccessSuspend', unsuspend: 'esimAccessUnsuspend', revoke: 'esimAccessRevoke', cancel: 'esimAccessCancel' };
  const needConfirm = action === 'revoke' || action === 'cancel';
  if (needConfirm && !confirm(`Yakin ingin ${actionLabel[action]} eSIM ini? Tindakan ini tidak bisa dibatalkan.`)) return;

  const oriText = btnEl.textContent;
  btnEl.disabled = true; btnEl.textContent = '⏳';
  try {
    const body = { action: actionMap[action] };
    if (action === 'cancel')                        body.orderNo      = o.order_no;
    else if (action === 'revoke' || action === 'suspend' || action === 'unsuspend') body.esimTranNo = o.esim_tran_no;
    const res  = await fetch('https://goho-proxy.gohotravel.workers.dev', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.msg || 'Aksi gagal');
    showToast(`✅ ${actionLabel[action]} berhasil`);
    btnEl.textContent = '✅';
    setTimeout(() => { btnEl.textContent = oriText; btnEl.disabled = false; }, 2000);
  } catch(err) {
    showToast(`❌ ${escH(err.message)}`);
    btnEl.textContent = oriText; btnEl.disabled = false;
  }
}

function esimRwToggle(detailId, btnId) {
  const d = document.getElementById(detailId);
  const b = document.getElementById(btnId);
  if (!d) return;
  const open = d.style.display !== 'none';
  d.style.display = open ? 'none' : 'block';
  if (b) b.textContent = open ? '▶ Buka' : '▼ Tutup';
}

function esimRwCopy(text, btnEl) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea'); ta.value = text;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  });
  const ori = btnEl.textContent; btnEl.textContent = '✅';
  setTimeout(() => { btnEl.textContent = ori; }, 1500);
}

async function esimRwSisaData(supplier, idx, e) {
  if (e) e.stopPropagation();
  const allItems = [
    ...(window._rwEcOrders || []).map(o => ({ ...o, _supplier: 'esimcard' })),
    ...(window._rwEaOrders || []).map(o => ({ ...o, _supplier: 'esimaccess' }))
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const filtered = allItems.filter(o => o._supplier === supplier);
  const o = filtered[idx];
  if (!o) return;

  const detailId = `rw-detail-${supplier}-${idx}`;
  const btnId    = `rw-btn-${supplier}-${idx}`;
  const detail   = document.getElementById(detailId);
  if (detail && detail.style.display === 'none') esimRwToggle(detailId, btnId);

  const usageEl = document.getElementById(`rw-usage-${supplier}-${idx}`);
  if (!usageEl) return;
  usageEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);"><i class="ti ti-loader spin"></i> Cek sisa data...</div>';

  try {
    if (supplier === 'esimaccess') {
      if (!o.esim_tran_no) { usageEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);">esimTranNo tidak tersedia</div>'; return; }
      const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimAccessUsage&esimTranNo=${encodeURIComponent(o.esim_tran_no)}`);
      const data = await res.json();
      if (!data.ok || !data.usageList?.length) { usageEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);">Data tidak tersedia</div>'; return; }
      const u = data.usageList[0];
      usageEl.innerHTML = `<div style="background:#f0fdf4;border-radius:6px;padding:8px;font-size:10px;margin-bottom:6px;">
        <div style="font-weight:700;color:#166534;margin-bottom:4px;">📊 Sisa Data (eSIM Access)</div>
        <div>Total: <b>${u.totalDataFormatted||u.totalVolumeFormatted||'-'}</b> · Terpakai: <b>${u.dataUsageFormatted||u.usedVolumeFormatted||'-'}</b></div>
        <div style="color:#166534;font-weight:600;margin-top:2px;">Sisa: <b>${u.remainingFormatted||'-'}</b></div>
        ${u.lastUpdateTime ? `<div style="color:#92400e;margin-top:2px;">Update: ${u.lastUpdateTime.replace('T',' ').substring(0,16)}</div>` : ''}
        <div style="background:#e2e8f0;border-radius:3px;height:5px;margin-top:6px;">
          <div style="background:#16a34a;border-radius:3px;height:5px;width:${Math.min(100,u.usagePct||0)}%;"></div>
        </div>
      </div>`;
    } else {
      if (!o.iccid) { usageEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);">ICCID tidak tersedia</div>'; return; }
      const res  = await fetch(`${API}?action=getEsimcardUsage&iccid=${encodeURIComponent(o.iccid)}`);
      const data = await res.json();
      if (!data.ok || !data.usage) { usageEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);">Data usage tidak tersedia dari eSIMCard</div>'; return; }
      const u = data.usage;
      const sisa = u.remaining || u.remainingFormatted || '-';
      const total = u.total || u.totalFormatted || '-';
      const pct   = u.usagePct || 0;
      usageEl.innerHTML = `<div style="background:#f0fdf4;border-radius:6px;padding:8px;font-size:10px;margin-bottom:6px;">
        <div style="font-weight:700;color:#166534;margin-bottom:4px;">📊 Sisa Data (eSIMCard)</div>
        <div>Total: <b>${total}</b></div>
        <div style="color:#166534;font-weight:600;margin-top:2px;">Sisa: <b>${sisa}</b></div>
        <div style="background:#e2e8f0;border-radius:3px;height:5px;margin-top:6px;">
          <div style="background:#16a34a;border-radius:3px;height:5px;width:${Math.min(100,pct)}%;"></div>
        </div>
      </div>`;
    }
  } catch(err) {
    if (usageEl) usageEl.innerHTML = `<div style="font-size:10px;color:var(--red);">Error: ${escH(err.message)}</div>`;
  }
}

function esimRwCopyWA(supplier, idx) {
  const allItems = [
    ...(window._rwEcOrders || []).map(o => ({ ...o, _supplier: 'esimcard' })),
    ...(window._rwEaOrders || []).map(o => ({ ...o, _supplier: 'esimaccess' }))
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const filtered = allItems.filter(o => o._supplier === supplier);
  const o = filtered[idx];
  if (!o) return;
  const nama  = o.nama_customer ? `Halo ${o.nama_customer}` : 'Halo Kak';
  // FIX: prioritaskan catatan sebelum package_code
  const paket = o.package_name || o.catatan || o.package_code || '-';
  const iccid = o.iccid || '-';
  const link  = o.short_url || o.activation_url || '';
  let pesan   = `${nama} 😊\n\neSIM Anda sudah siap!\n📦 Paket: ${paket}\nICCID: ${iccid}\n`;
  if (link) pesan += `📱 Scan QR: ${link}\n`;
  pesan += '\neSIM aktif otomatis saat pertama connect ke jaringan.\nSelamat berlibur! ✈️';
  navigator.clipboard.writeText(pesan).then(() => showToast('✅ Pesan WA tersalin!')).catch(() => {
    const ta = document.createElement('textarea'); ta.value = pesan;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✅ Pesan WA tersalin!');
  });
}

// ── eSIM Access Riwayat (standalone) ──
async function esimAccessOpenRiwayat() { esimOpenRiwayatGabungan(); }

async function _esimAccessOpenRiwayatLama() {
  const old = document.getElementById('esimaccess-riwayat-modal');
  if (old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'esimaccess-riwayat-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;padding:24px;width:500px;max-width:95vw;font-family:var(--font);box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:14px;color:var(--text);">📡 Riwayat eSIM Access</h3>
        <button onclick="document.getElementById('esimaccess-riwayat-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;">✕</button>
      </div>
      <div id="ea-riwayat-list"><i class="ti ti-loader spin"></i> Memuat...</div>
    </div>`;
  document.body.appendChild(modal);
  try {
    const res  = await fetch('https://goho-proxy.gohotravel.workers.dev?action=getEsimAccessOrders&limit=50');
    const data = await res.json();
    const listEl = document.getElementById('ea-riwayat-list');
    if (!listEl) return;
    if (!data.ok || !data.orders?.length) { listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Belum ada transaksi</div>'; return; }
    window._eaOrders = data.orders;
    const statusColor = { 'ACTIVE': '#166534', 'RELEASED': '#1e40af', 'PENDING': '#92400e', 'DEPLETED': '#6b7280', 'CANCELLED': '#991b1b' };
    listEl.innerHTML = data.orders.map((o, idx) => {
      const tgl = o.created_at ? new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-';
      const sc  = statusColor[o.status] || '#6b7280';
      return `
        <div style="border:1px solid var(--border);border-radius:8px;margin-bottom:6px;overflow:hidden;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:#f8fafc;cursor:pointer;" onclick="eaToggleRiwayat(${idx})">
            <div>
              <div style="font-size:11px;font-weight:700;">${escH(o.nama_customer || o.no_wa_customer || '-')}</div>
              <div style="font-size:10px;color:var(--text-muted);">${escH(o.catatan || o.package_code||'-')} · ${tgl}</div>
              <div style="font-size:10px;color:${sc};font-weight:600;">${o.status||'PENDING'}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <button id="ea-rw-btn-${idx}" style="font-size:10px;padding:3px 10px;background:#6366f1;color:white;border:none;border-radius:4px;cursor:pointer;">▶ Buka</button>
              <button onclick="eaCheckUsage(${idx},event)" style="font-size:10px;padding:3px 10px;background:#0891b2;color:white;border:none;border-radius:4px;cursor:pointer;">📊 Sisa Data</button>
            </div>
          </div>
          <div id="ea-rw-detail-${idx}" style="display:none;padding:12px;border-top:1px solid var(--border);">
            ${o.qr_code_url ? `<div style="text-align:center;margin-bottom:10px;">
              <img src="${escH(o.qr_code_url)}" style="width:160px;height:160px;border:1px solid var(--border);border-radius:8px;padding:6px;" onerror="this.style.display='none'"/>
              <div style="display:flex;gap:6px;justify-content:center;margin-top:6px;">
                ${o.short_url ? `<a href="${escH(o.short_url)}" target="_blank" style="font-size:10px;padding:3px 8px;background:#6366f1;color:white;border-radius:4px;text-decoration:none;">🔗 Link</a>` : ''}
                <button onclick="eaCopyRw('${escH(o.qr_code_url)}',this)" style="font-size:10px;padding:3px 8px;background:#e2e8f0;border:none;border-radius:4px;cursor:pointer;">📋 Copy URL</button>
              </div>
            </div>` : ''}
            <div style="font-size:10px;margin-bottom:4px;">ICCID: <b>${escH(o.iccid||'-')}</b>
              ${o.iccid ? `<button onclick="eaCopyRw('${escH(o.iccid)}',this)" style="font-size:9px;padding:1px 4px;background:#e2e8f0;border:none;border-radius:3px;cursor:pointer;margin-left:4px;">📋</button>` : ''}
            </div>
            <div style="font-size:10px;margin-bottom:8px;">Order No: <b>${escH(o.order_no||'-')}</b></div>
            <div id="ea-usage-${idx}"></div>
            ${o.iccid ? `<button onclick="eaCopyPesanWA(${idx})" style="width:100%;margin-top:8px;padding:7px;background:#16a34a;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">📲 Copy Pesan WA</button>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    const listEl = document.getElementById('ea-riwayat-list');
    if (listEl) listEl.innerHTML = `<div style="color:var(--red);">Error: ${escH(e.message)}</div>`;
  }
}

function eaToggleRiwayat(idx) {
  const d = document.getElementById(`ea-rw-detail-${idx}`);
  const b = document.getElementById(`ea-rw-btn-${idx}`);
  if (!d) return;
  const open = d.style.display !== 'none';
  d.style.display = open ? 'none' : 'block';
  if (b) b.textContent = open ? '▶ Buka' : '▼ Tutup';
}

function eaCopyRw(text, btnEl) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea'); ta.value = text;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  }).finally(() => {
    const ori = btnEl.textContent; btnEl.textContent = '✅';
    setTimeout(() => { btnEl.textContent = ori; }, 1500);
  });
}

async function eaCheckUsage(idx, e) {
  if (e) e.stopPropagation();
  const o = window._eaOrders?.[idx];
  if (!o?.esim_tran_no) { showToast('esimTranNo tidak ada'); return; }
  const usageEl = document.getElementById(`ea-usage-${idx}`);
  if (!usageEl) return;
  usageEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);"><i class="ti ti-loader spin"></i> Cek...</div>';
  try {
    const res  = await fetch(`https://goho-proxy.gohotravel.workers.dev?action=getEsimAccessUsage&esimTranNo=${encodeURIComponent(o.esim_tran_no)}`);
    const data = await res.json();
    if (!data.ok || !data.usageList?.length) { usageEl.innerHTML = '<div style="font-size:10px;color:var(--text-muted);">Data tidak tersedia</div>'; return; }
    const u = data.usageList[0];
    usageEl.innerHTML = `
      <div style="background:#f0fdf4;border-radius:6px;padding:8px;font-size:10px;margin-bottom:6px;">
        <div style="font-weight:700;color:#166534;margin-bottom:4px;">📊 Sisa Data</div>
        <div>Total: <b>${u.totalDataFormatted||u.totalVolumeFormatted||'-'}</b> · Terpakai: <b>${u.dataUsageFormatted||u.usedVolumeFormatted||'-'}</b></div>
        <div style="color:#166534;font-weight:600;margin-top:2px;">Sisa: <b>${u.remainingFormatted||'-'}</b></div>
        <div style="background:#e2e8f0;border-radius:3px;height:5px;margin-top:6px;">
          <div style="background:#16a34a;border-radius:3px;height:5px;width:${Math.min(100,u.usagePct||0)}%;"></div>
        </div>
      </div>`;
  } catch(e2) { usageEl.innerHTML = `<div style="font-size:10px;color:var(--red);">Error</div>`; }
}

function eaCopyPesanWA(idx) {
  const o = window._eaOrders?.[idx];
  if (!o) return;
  const nama = o.nama_customer ? `Halo ${o.nama_customer}` : 'Halo Kak';
  // FIX: prioritaskan catatan sebelum package_code
  const paket = o.catatan || o.package_code || '-';
  let pesan  = `${nama} 😊\n\neSIM Anda sudah siap!\n📦 Paket: ${paket}\nICCID: ${o.iccid||'-'}\n`;
  if (o.short_url) pesan += `📱 Scan QR: ${o.short_url}\n`;
  pesan += '\neSIM aktif otomatis saat pertama connect ke jaringan.\nSelamat berlibur! ✈️';
  navigator.clipboard.writeText(pesan).then(() => showToast('✅ Pesan WA tersalin!')).catch(() => {
    const ta = document.createElement('textarea'); ta.value = pesan;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✅ Pesan WA tersalin!');
  });
}

// ── eSIM Access Beli ──────────────────────────────────────────
function esimAccessOpenBeliById(pkgId) {
  const pkg = window._eaPkgCache?.[pkgId];
  if (!pkg) { showToast('Data paket tidak ditemukan'); return; }
  esimAccessOpenBeli(pkg);
}

function esimAccessOpenBeli(pkgStr) {
  let pkg;
  try { pkg = typeof pkgStr === 'string' ? JSON.parse(pkgStr) : pkgStr; } catch(e) { showToast('Error: ' + e.message); return; }
  const old = document.getElementById('esimaccess-beli-modal');
  if (old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'esimaccess-beli-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;padding:24px;width:420px;max-width:95vw;font-family:var(--font);box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:92vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:14px;">📡 Beli eSIM Access</h3>
        <button onclick="document.getElementById('esimaccess-beli-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;">✕</button>
      </div>
      <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;margin-bottom:4px;">${escH(pkg.name||'')}</div>
        <div style="font-size:11px;color:var(--text-muted);">${escH(pkg.volumeFormatted||'')} · ${pkg.duration||''} hari ${pkg.speed?'· '+escH(pkg.speed):''}</div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="font-size:11px;">Beli: <b>${hargaFmtIDR(pkg.buyIDR)}</b> <span style="font-size:10px;color:var(--text-muted);">(USD ${(pkg.priceUSD||0).toFixed(2)})</span></span>
          <span style="font-size:11px;">Jual: <b style="color:#2563eb;">${hargaFmtIDR(pkg.sellIDR)}</b></span>
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:11px;font-weight:600;margin-bottom:6px;">👤 Data Pembeli <span style="font-weight:400;color:var(--text-muted);">(opsional)</span></div>
        <input id="ea-nama-pembeli" type="text" placeholder="Nama tamu (mis: Budi Santoso)" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:var(--font);margin-bottom:6px;outline:none;"/>
        <input id="ea-hp-pembeli" type="text" placeholder="No HP / WA (mis: 08123456789)" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:var(--font);outline:none;"/>
      </div>
      <div id="ea-status" style="display:none;margin-bottom:12px;"></div>
      <div style="display:flex;gap:8px;">
        <button onclick="document.getElementById('esimaccess-beli-modal').remove()" style="flex:1;padding:9px;background:#f1f5f9;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:var(--font);">Batal</button>
        <button id="ea-beli-btn" onclick="esimAccessDoPurchase('${escH(pkg.packageCode||'')}','${escH(pkg.name||'')}',${pkg.buyIDR||0})" style="flex:2;padding:9px;background:#6366f1;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);">✅ Konfirmasi Beli</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

// FIX: tambah parameter buyIDR
async function esimAccessDoPurchase(packageCode, packageName, buyIDR) {
  const statusEl = document.getElementById('ea-status');
  const beliBtn  = document.getElementById('ea-beli-btn');
  if (!statusEl || !beliBtn) return;
  const nama = document.getElementById('ea-nama-pembeli')?.value?.trim() || '';
  const hp   = document.getElementById('ea-hp-pembeli')?.value?.trim() || '';
  beliBtn.disabled = true; beliBtn.textContent = '⏳ Memproses...';
  statusEl.style.display = 'block';
  statusEl.innerHTML = '<div style="background:#ede9fe;border-radius:8px;padding:10px;font-size:11px;color:#6366f1;">⏳ Mengirim order...</div>';
  try {
    const res  = await fetch('https://goho-proxy.gohotravel.workers.dev', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'esimAccessOrder',
        packageCode,
        count: 1,
        noWaCustomer: hp ? '62' + hp.replace(/^0/,'').replace(/\D/g,'') : '',
        namaCustomer: nama,
        staff: currentStaff?.nama || '',
        catatan: packageName,
        hargaBeli: buyIDR || 0   // FIX: simpan harga beli
      })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.msg || 'Order gagal');
    statusEl.innerHTML = `<div style="background:#fef3c7;border-radius:8px;padding:10px;font-size:11px;color:#92400e;">⏳ Order dikirim (${escH(data.orderNo)}). Mengambil QR...</div>`;
    setTimeout(() => eaPollResult(data.orderNo, statusEl, beliBtn, packageName, 1), 3000);
  } catch(e) {
    statusEl.innerHTML = `<div style="background:#fee2e2;border-radius:8px;padding:10px;font-size:11px;color:#991b1b;">❌ ${escH(e.message)}</div>`;
    beliBtn.disabled = false; beliBtn.textContent = '✅ Coba Lagi';
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
      beliBtn.style.background = '#16a34a'; beliBtn.textContent = '✅ Berhasil!'; beliBtn.disabled = true;
      statusEl.innerHTML = `
        <div style="background:#dcfce7;border-radius:8px;padding:10px;color:#166534;font-weight:700;font-size:12px;margin-bottom:8px;">✅ Pembelian berhasil!</div>
        ${data.qrCodeUrl ? `<div style="text-align:center;margin-bottom:10px;background:#f8fafc;border-radius:8px;padding:10px;">
          <img src="${escH(data.qrCodeUrl)}" style="width:150px;height:150px;border:1px solid var(--border);border-radius:8px;padding:4px;" onerror="this.style.display='none'"/>
          <div style="display:flex;gap:6px;justify-content:center;margin-top:6px;">
            ${data.shortUrl ? `<a href="${escH(data.shortUrl)}" target="_blank" style="font-size:10px;padding:3px 8px;background:#6366f1;color:white;border-radius:4px;text-decoration:none;">🔗 Link</a>` : ''}
          </div>
        </div>` : ''}
        <div style="background:#f8fafc;border-radius:8px;padding:10px;font-size:10px;margin-bottom:8px;">
          <div>Paket: <b>${escH(packageName)}</b></div>
          <div>ICCID: <b>${escH(data.iccid)}</b></div>
          ${data.expiredTime ? `<div>Expired: <b>${data.expiredTime.replace('T',' ').substring(0,16)}</b></div>` : ''}
          ${data.totalVolumeFormatted ? `<div>Kapasitas: <b>${data.totalVolumeFormatted}</b></div>` : ''}
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="font-size:11px;font-weight:700;color:#166534;">💬 Pesan WA</div>
            <button onclick="navigator.clipboard.writeText(document.getElementById('ea-wa-new').innerText).then(()=>showToast('✅ Tersalin!'))" style="font-size:10px;padding:3px 8px;background:#16a34a;color:white;border:none;border-radius:4px;cursor:pointer;">📋 Copy</button>
          </div>
          <div id="ea-wa-new" style="font-size:11px;line-height:1.6;white-space:pre-wrap;background:white;border-radius:6px;padding:8px;border:1px solid #bbf7d0;">eSIM Anda sudah siap! 🎉

Paket: ${escH(packageName)}
ICCID: ${escH(data.iccid||'-')}
${data.expiredTime ? 'Expired: '+data.expiredTime.replace('T',' ').substring(0,16) : ''}
${data.shortUrl ? '📱 Scan QR: '+data.shortUrl : ''}

eSIM aktif otomatis saat pertama connect ke jaringan.
Selamat berlibur! ✈️</div>
        </div>`;
    } else if (attempt < maxAttempts) {
      statusEl.innerHTML = `<div style="background:#fef3c7;border-radius:8px;padding:10px;font-size:11px;color:#92400e;">⏳ Diproses... (${attempt}/${maxAttempts})</div>`;
      setTimeout(() => eaPollResult(orderNo, statusEl, beliBtn, packageName, attempt + 1), 5000);
    } else {
      statusEl.innerHTML = `<div style="background:#fee2e2;border-radius:8px;padding:10px;font-size:11px;color:#991b1b;">⚠️ Masih diproses. Order No: <b>${escH(orderNo)}</b><br>Cek di Riwayat eSIM Access.</div>`;
    }
  } catch(err) {
    if (attempt < maxAttempts) setTimeout(() => eaPollResult(orderNo, statusEl, beliBtn, packageName, attempt + 1), 5000);
  }
}
