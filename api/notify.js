// Vercel Serverless Function: api/notify.js
// Expects environment variables: TELEGRAM_TOKEN, TELEGRAM_CHAT_ID
// Receives POST JSON with at least: { type: 'entry'|'exit'|'panic'|'camouflage', timestamp, ua?, entryTimestamp?, durationMs? }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ error: 'Missing TELEGRAM_TOKEN or TELEGRAM_CHAT_ID environment variables' });
  }

  let body = {};
  try {
    body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const type = (body.type || '').toString();
  const ua = (body.ua || req.headers['user-agent'] || 'Unknown').toString();

  // Get client IP from headers
  let ip = '';
  try {
    const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
    if (forwarded) ip = forwarded.split(',')[0].trim();
    else if (req.socket && req.socket.remoteAddress) ip = req.socket.remoteAddress || '';
    if (ip && ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  } catch (e) {
    ip = '';
  }

  async function fetchGeo(ipAddress) {
    try {
      const target = ipAddress ? `https://ipapi.co/${encodeURIComponent(ipAddress)}/json/` : 'https://ipapi.co/json/';
      const resp = await fetch(target, { method: 'GET' });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data;
    } catch (e) {
      return null;
    }
  }

  function detectDevice(uaString) {
    const lower = (uaString || '').toLowerCase();
    if (/mobile|iphone|android|blackberry|bb10|opera mini|windows phone/.test(lower)) return 'Mobile';
    if (/ipad|tablet/.test(lower)) return 'Tablet';
    return 'Desktop';
  }

  function formatBaghdadTime(isoString) {
    try {
      const dt = isoString ? new Date(isoString) : new Date();
      return dt.toLocaleString('ar-IQ', {
        timeZone: 'Asia/Baghdad',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return new Date().toISOString();
    }
  }

  const geo = await fetchGeo(ip);
  const city = geo && geo.city ? geo.city : 'Unknown';
  const country = geo && geo.country_name ? geo.country_name : 'Unknown';
  const ipUsed = ip || (geo && geo.ip) || 'Unknown';
  const device = detectDevice(ua);
  const timeStr = formatBaghdadTime(body.timestamp || new Date().toISOString());

  // helper to escape HTML special chars to avoid breaking parse_mode
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  let telegramText = '';
  try {
    if (type === 'entry') {
      telegramText =
`🔔 <b>إشعار دخول إلى الصفحة السرية</b>

⏰ <b>الوقت:</b> ${escapeHtml(timeStr)}
📍 <b>الموقع:</b> ${escapeHtml(city)}, ${escapeHtml(country)}, ${escapeHtml(ipUsed)}
📱 <b>الجهاز:</b> ${escapeHtml(device)}`;

    } else if (type === 'exit') {
      let durationMs = 0;
      if (typeof body.durationMs === 'number') durationMs = body.durationMs;
      else if (body.entryTimestamp) {
        const start = Date.parse(body.entryTimestamp) || 0;
        const now = Date.parse(body.timestamp) || Date.now();
        durationMs = Math.max(0, now - start);
      }
      const mins = Math.floor(durationMs / 60000);
      const secs = Math.floor((durationMs % 60000) / 1000);
      const durStr = `${mins} دقيقة و ${secs} ثانية`;
      telegramText =
`🚪 <b>إشعار خروج من الصفحة السرية</b>

⏰ <b>وقت الخروج:</b> ${escapeHtml(timeStr)}
⏱ <b>مدة البقاء:</b> ${escapeHtml(durStr)}`;

    } else if (type === 'panic') {
      telegramText =
`🚨 <b>إشعار تفعيل زر الطوارئ (Panic)</b>

⏰ <b>الوقت:</b> ${escapeHtml(timeStr)}
📍 <b>الموقع:</b> ${escapeHtml(city)}, ${escapeHtml(country)}, ${escapeHtml(ipUsed)}
📱 <b>الجهاز:</b> ${escapeHtml(device)}

🔒 <b>الحالة:</b> تم تفعيل وضع الطوارئ وإخفاء المحتوى فوراً.`;

    } else if (type === 'camouflage') {
      telegramText =
`🎭 <b>إشعار تفعيل زر التمويه (Camouflage)</b>

⏰ <b>الوقت:</b> ${escapeHtml(timeStr)}
📍 <b>الموقع:</b> ${escapeHtml(city)}, ${escapeHtml(country)}, ${escapeHtml(ipUsed)}
📱 <b>الجهاز:</b> ${escapeHtml(device)}

🔄 <b>الحالة:</b> قام المستخدم بتفعيل وضع التمويه للواجهة.`;

    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // Send to Telegram
    const tgUrl = `https://api.telegram.org/bot${encodeURIComponent(TELEGRAM_BOT_TOKEN)}/sendMessage`;
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: telegramText,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    const tgResp = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!tgResp.ok) {
      const errText = await tgResp.text().catch(()=>'<no body>');
      console.error('Telegram API error', tgResp.status, errText);
      return res.status(502).json({ error: 'Failed to send to Telegram', details: errText });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('notify error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
