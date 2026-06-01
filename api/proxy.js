export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const baseUrl = 'https://script.google.com/macros/s/AKfycbycdw7-ZYJaPY5J2varxb82LagiCKAlmDfkLOxCZZYEZwi5ZrpH9GLkZYFX-fg6se2t/exec';

  try {
    if (req.method === 'GET') {
      const params = new URLSearchParams(req.query);
      const url = baseUrl + '?' + params.toString();
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await response.text();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(data);

    } else if (req.method === 'POST') {
  let bodyData = req.body;
  if (typeof bodyData === 'string') {
    bodyData = JSON.parse(bodyData);
  }
  const response = await fetch(baseUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyData)
  });
  const data = await response.text();
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(data);
}
  } catch(e) {
    res.status(500).json({ok: false, msg: e.toString()});
  }
}
