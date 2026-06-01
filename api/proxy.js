export default async function handler(req, res) {
  const { action, ...rest } = req.query;
  
  let url = `https://script.google.com/macros/s/AKfycbycdw7-ZYJaPY5J2varxb82LagiCKAlmDfkLOxCZZYEZwi5ZrpH9GLkZYFX-fg6se2t/exec`;
  
  const params = new URLSearchParams(req.query);
  url = url + '?' + params.toString();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const data = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.status(200).send(data);
  } catch(e) {
    res.status(500).json({ok: false, msg: e.toString()});
  }
}
