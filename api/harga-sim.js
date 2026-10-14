const GAS_URL = 'https://script.google.com/macros/s/AKfycbycdw7-ZYJaPY5J2varxb82LagiCKAlmDfkLOxCZZYEZwi5ZrpH9GLkZYFX-fg6se2t/exec';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet({ request }) {
  try {
    const resp = await fetch(GAS_URL + '?action=getHargaSim', {
      redirect: 'follow',
      headers: { 'Cache-Control': 'no-cache' },
    });

    const text = await resp.text();

    // Detect HTML error page from GAS
    if (text.trim().startsWith('<')) {
      return new Response(JSON.stringify({ ok: false, msg: 'GAS returned HTML — action not found or auth required' }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, msg: 'GAS response not JSON: ' + text.slice(0, 100) }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, msg: e.toString() }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
