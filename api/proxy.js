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
    // ===== ROUTE KHUSUS: getImageBase64 =====
    // Ambil gambar dari Google Drive → konversi ke base64
    // Dipanggil dari viewer.html sebelum OCR
    if (req.method === 'GET' && req.query.action === 'getImageBase64') {
      const fileId = req.query.fileId;
      if (!fileId) {
        return res.status(400).json({ error: 'fileId missing' });
      }

      // Ambil gambar via thumbnail Drive (lebih cepat, resolusi cukup untuk OCR)
      const thumbUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
      const driveResp = await fetch(thumbUrl, { redirect: 'follow' });

      if (!driveResp.ok) {
        return res.status(502).json({ error: 'Gagal ambil gambar dari Drive' });
      }

      const buffer = await driveResp.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      // Claude API hanya terima: image/jpeg, image/png, image/gif, image/webp
      const rawMime = driveResp.headers.get('content-type') || '';
      const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const mimeType = validMimes.find(m => rawMime.includes(m)) || 'image/jpeg';

      return res.status(200).json({ base64, mimeType });
    }

    // ===== ROUTE NORMAL: forward ke Apps Script =====
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
    res.status(500).json({ ok: false, msg: e.toString() });
  }
}
