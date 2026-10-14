// Serve Aviroam SIM/eSIM pricing data from static JSON
// Data source: data/harga-sim.json (generated from Excel Aviroam)
// No dependency on GAS for this action.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet({ request, env }) {
  try {
    // Read static JSON file bundled with Pages deployment
    const url = new URL(request.url);
    const origin = url.origin;
    const jsonUrl = origin + '/data/harga-sim.json';

    const resp = await fetch(jsonUrl);
    if (!resp.ok) {
      return new Response(JSON.stringify({ ok: false, msg: 'harga-sim.json not found: ' + resp.status }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const text = await resp.text();
    return new Response(text, {
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
