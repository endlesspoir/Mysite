import { Client, TablesDB, ID } from 'node-appwrite';

const SERVICE_KEYS = new Set([
  'consult', 'sites', 'bots', 'ai', 'backend',
  'mobile', 'integrations', 'web3', 'mvp'
]);
const BUDGET_KEYS = new Set(['unknown', 'small', 'medium', 'large', 'complex']);
const DEFAULTS = {
  allowedOrigins: 'https://novespoir.tech,https://www.novespoir.tech,https://novespoir.appwrite.network',
  rateWindowMs: 10 * 60 * 1000,
  rateMax: 8
};

const rateBuckets = new Map();

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

const cleanSingleLine = (value, maxLength) => String(value ?? '')
  .replace(/[\u0000-\u001F\u007F]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

const cleanMessage = (value, maxLength) => String(value ?? '')
  .replace(/\u0000/g, '')
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n')
  .trim()
  .slice(0, maxLength);

const getAllowedOrigins = () => String(process.env.ALLOWED_ORIGINS || DEFAULTS.allowedOrigins)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = origin => {
  if (!origin) return true;

  const allowed = getAllowedOrigins();
  if (allowed.includes('*') || allowed.includes(origin)) return true;

  try {
    const url = new URL(origin);
    if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
      return true;
    }
    if (url.protocol === 'https:' && (
      url.hostname === 'novespoir.appwrite.network' ||
      url.hostname.endsWith('.novespoir.appwrite.network')
    )) {
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
};

const corsHeaders = origin => {
  const headers = {
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'cache-control': 'no-store',
    'vary': 'Origin'
  };
  if (!origin) {
    headers['access-control-allow-origin'] = '*';
  } else if (isAllowedOrigin(origin)) {
    headers['access-control-allow-origin'] = origin;
  }
  return headers;
};

const clientIp = req => {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return String(
    req.headers['x-appwrite-client-ip'] ||
    req.headers['x-real-ip'] ||
    forwarded ||
    'unknown'
  ).slice(0, 80);
};

const isRateLimited = ip => {
  const now = Date.now();
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || DEFAULTS.rateWindowMs);
  const max = Number(process.env.RATE_LIMIT_MAX || DEFAULTS.rateMax);
  const recent = (rateBuckets.get(ip) || []).filter(timestamp => now - timestamp < windowMs);

  if (recent.length >= max) {
    rateBuckets.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateBuckets.set(ip, recent);

  if (rateBuckets.size > 1000) {
    for (const [key, timestamps] of rateBuckets.entries()) {
      if (!timestamps.length || now - timestamps[timestamps.length - 1] > windowMs) {
        rateBuckets.delete(key);
      }
    }
  }

  return false;
};

const telegramLinkFor = contact => {
  const value = String(contact || '').trim();
  const username = value.startsWith('@') ? value.slice(1) : value;
  if (/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(username)) {
    return `https://t.me/${username}`;
  }
  return '';
};

const notifyOwner = async (lead, log) => {
  let delivered = false;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    try {
      const lines = [
        '🆕 <b>Новая заявка с сайта</b>',
        `<b>Имя:</b> ${escapeHtml(lead.name)}`,
        `<b>Контакт:</b> ${escapeHtml(lead.contact)}`,
        `<b>Услуга:</b> ${escapeHtml(lead.serviceLabel || lead.service)}`,
        `<b>Масштаб:</b> ${escapeHtml(lead.budgetLabel || lead.budget)}`,
        `<b>Язык:</b> ${lead.lang.toUpperCase()}`,
        '',
        `<b>Задача:</b>\n${escapeHtml(lead.message.slice(0, 2400))}`,
        '',
        `<b>Страница:</b> ${escapeHtml(lead.page || '—')}`,
        `<b>Источник:</b> ${escapeHtml(lead.utm.source || lead.utm.ref || 'direct')}`,
        `<b>Кампания:</b> ${escapeHtml(lead.utm.campaign || '—')}`
      ];

      const telegramUrl = telegramLinkFor(lead.contact);
      const body = {
        chat_id: chatId,
        text: lines.join('\n').slice(0, 4000),
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true }
      };
      if (telegramUrl) {
        body.reply_markup = {
          inline_keyboard: [[{ text: '💬 Написать клиенту', url: telegramUrl }]]
        };
      }

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });
      if (response.ok) {
        delivered = true;
      } else {
        log(`Telegram notification failed with HTTP ${response.status}`);
      }
    } catch (error) {
      log(`Telegram notification error: ${error.message}`);
    }
  }

  const webhook = process.env.NOTIFY_WEBHOOK_URL;
  if (webhook) {
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'lead.created', lead }),
        signal: AbortSignal.timeout(8000)
      });
      if (response.ok) {
        delivered = true;
      } else {
        log(`Webhook notification failed with HTTP ${response.status}`);
      }
    } catch (error) {
      log(`Webhook notification error: ${error.message}`);
    }
  }

  return delivered;
};

const storeLead = async (lead, req, log) => {
  const databaseId = process.env.LEADS_DB_ID;
  const tableId = process.env.LEADS_TABLE_ID;
  if (!databaseId || !tableId) {
    log('Storage is not configured: LEADS_DB_ID / LEADS_TABLE_ID are missing');
    return { stored: false, reason: 'db_not_configured' };
  }

  const endpoint = String(process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .replace(/\/+$/, '');
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const apiKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY;

  if (!projectId || !apiKey) {
    log('Storage is not configured: Appwrite project ID or execution key is missing');
    return { stored: false, reason: 'appwrite_env_missing' };
  }

  let payload = JSON.stringify(lead);
  if (payload.length > 18000) {
    payload = JSON.stringify({
      ...lead,
      message: lead.message.slice(0, 2000),
      page: lead.page.slice(0, 300),
      landing: lead.landing.slice(0, 300),
      referrer: lead.referrer.slice(0, 300),
      userAgent: ''
    });
  }

  try {
    const client = new Client()
      .setEndpoint(endpoint.endsWith('/v1') ? endpoint : `${endpoint}/v1`)
      .setProject(projectId)
      .setKey(apiKey);

    const tablesDB = new TablesDB(client);
    const row = await tablesDB.createRow({
      databaseId,
      tableId,
      rowId: ID.unique(),
      data: {
        kind: lead.kind,
        name: lead.name,
        contact: lead.contact,
        message: lead.message,
        status: 'new',
        payload: payload.slice(0, 20000)
      }
    });

    return { stored: true, id: row.$id };
  } catch (error) {
    log(`Lead storage error: ${error.message}`);
    return { stored: false, reason: 'storage_error' };
  }
};

export default async ({ req, res, log, error }) => {
  const origin = String(req.headers.origin || '');
  const headers = corsHeaders(origin);
  const path = (req.path || '/').replace(/\/+$/, '') || '/';

  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) {
      return res.json({ ok: false, error: 'origin_not_allowed' }, 403, headers);
    }
    return res.text('', 204, headers);
  }

  if (path === '/health' && req.method === 'GET') {
    return res.json({
      ok: true,
      service: 'novespoir-leads',
      storage: Boolean(process.env.LEADS_DB_ID && process.env.LEADS_TABLE_ID),
      notify: Boolean(
        (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) ||
        process.env.NOTIFY_WEBHOOK_URL
      )
    }, 200, headers);
  }

  if (!['/', '/lead', '/leads'].includes(path)) {
    return res.json({ ok: false, error: 'not_found' }, 404, headers);
  }

  if (origin && !isAllowedOrigin(origin)) {
    return res.json({ ok: false, error: 'origin_not_allowed' }, 403, headers);
  }

  if (req.method !== 'POST') {
    return res.json({ ok: false, error: 'method_not_allowed' }, 405, {
      ...headers,
      'allow': 'POST, OPTIONS'
    });
  }

  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.includes('application/json')) {
    return res.json({ ok: false, error: 'unsupported_media_type' }, 415, headers);
  }

  const bodyText = String(req.bodyText || '');
  if (bodyText.length > 25000) {
    return res.json({ ok: false, error: 'payload_too_large' }, 413, headers);
  }

  let body = req.bodyJson;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    try {
      body = JSON.parse(bodyText || '{}');
    } catch (parseError) {
      return res.json({ ok: false, error: 'invalid_json' }, 400, headers);
    }
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.json({ ok: false, error: 'invalid_json' }, 400, headers);
  }

  // Bots that fill the hidden field get a believable success response and no row.
  if (String(body.company || '').trim() !== '') {
    log('Honeypot triggered; lead ignored');
    return res.json({ ok: true }, 200, headers);
  }

  const name = cleanSingleLine(body.name, 80);
  const contact = cleanSingleLine(body.contact, 160);
  const message = cleanMessage(body.message, 4000);
  const consent = body.consent === true || body.consent === 'true';
  const service = SERVICE_KEYS.has(String(body.service || '')) ? String(body.service) : 'consult';
  const budget = BUDGET_KEYS.has(String(body.budget || '')) ? String(body.budget) : 'unknown';

  const invalidFields = [];
  if (name.length < 2) invalidFields.push('name');
  if (contact.length < 3) invalidFields.push('contact');
  if (message.length < 5) invalidFields.push('message');
  if (!consent) invalidFields.push('consent');

  if (invalidFields.length) {
    return res.json({ ok: false, error: 'invalid_request', fields: invalidFields }, 400, headers);
  }

  const elapsedMs = Number(body.elapsedMs);
  if (Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs < 1200) {
    log('Form submitted too quickly; lead ignored');
    return res.json({ ok: true }, 200, headers);
  }

  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return res.json({ ok: false, error: 'rate_limited' }, 429, {
      ...headers,
      'retry-after': '600'
    });
  }

  const utmInput = body.utm && typeof body.utm === 'object' && !Array.isArray(body.utm) ? body.utm : {};
  const lead = {
    kind: 'site',
    name,
    contact,
    service,
    serviceLabel: cleanSingleLine(body.serviceLabel, 100),
    budget,
    budgetLabel: cleanSingleLine(body.budgetLabel, 100),
    message,
    consent: true,
    lang: body.lang === 'en' ? 'en' : 'ru',
    page: cleanSingleLine(body.page, 500),
    landing: cleanSingleLine(body.landing, 500),
    referrer: cleanSingleLine(body.referrer, 500),
    utm: {
      source: cleanSingleLine(utmInput.source, 200),
      medium: cleanSingleLine(utmInput.medium, 200),
      campaign: cleanSingleLine(utmInput.campaign, 200),
      content: cleanSingleLine(utmInput.content, 200),
      term: cleanSingleLine(utmInput.term, 200),
      ttclid: cleanSingleLine(utmInput.ttclid, 300),
      yclid: cleanSingleLine(utmInput.yclid, 300),
      gclid: cleanSingleLine(utmInput.gclid, 300),
      fbclid: cleanSingleLine(utmInput.fbclid, 300),
      ref: cleanSingleLine(utmInput.ref, 300)
    },
    country: cleanSingleLine(req.headers['x-appwrite-country-code'], 8),
    userAgent: cleanSingleLine(req.headers['user-agent'], 300),
    createdAt: new Date().toISOString()
  };

  log(`Lead received: service=${lead.service} lang=${lead.lang} country=${lead.country || 'unknown'}`);

  const storage = await storeLead(lead, req, log);
  if (!storage.stored) {
    log(`Storage unavailable (${storage.reason}); trying owner notification fallback`);
    const notified = await notifyOwner(lead, log);
    if (!notified) {
      error('Lead could not be stored or delivered');
      return res.json({ ok: false, error: 'storage_unavailable' }, 503, headers);
    }
    return res.json({ ok: true, stored: false, notified: true }, 200, headers);
  }

  // A failed notification must not lose a successfully stored lead.
  await notifyOwner(lead, log);

  return res.json({ ok: true, id: storage.id }, 200, headers);
};
