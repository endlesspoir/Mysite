import http from 'node:http';
import assert from 'node:assert/strict';

process.env.APPWRITE_FUNCTION_PROJECT_ID = 'test-project';
process.env.APPWRITE_FUNCTION_API_ENDPOINT = 'http://127.0.0.1:9099/v1';
process.env.LEADS_DB_ID = 'novespoir';
process.env.LEADS_TABLE_ID = 'leads';
process.env.ALLOWED_ORIGINS = 'https://novespoir.tech';
delete process.env.TELEGRAM_BOT_TOKEN;
delete process.env.TELEGRAM_CHAT_ID;
delete process.env.NOTIFY_WEBHOOK_URL;
process.env.RATE_LIMIT_MAX = '20';

const rows = [];
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    if (req.method === 'POST' && req.url.startsWith('/v1/tablesdb/')) {
      rows.push(JSON.parse(body || '{}'));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ $id: `row-${rows.length}` }));
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'not found' }));
  });
});
await new Promise(resolve => server.listen(9099, '127.0.0.1', resolve));

const { default: handler } = await import('./src/main.js');

const makeReq = (overrides = {}) => {
  const body = overrides.body ?? {
    name: 'Иван',
    contact: '@ivan_test',
    service: 'sites',
    serviceLabel: 'Сайт или лендинг',
    budget: 'medium',
    budgetLabel: 'Средний проект',
    message: 'Нужен лендинг для услуги с формой заявки.',
    consent: true,
    company: '',
    elapsedMs: 5000,
    lang: 'ru',
    page: 'https://novespoir.tech/',
    landing: 'https://novespoir.tech/?utm_source=tiktok',
    referrer: 'https://www.tiktok.com/',
    utm: { source: 'tiktok', campaign: 'launch', ttclid: 'abc123' }
  };
  return {
    method: overrides.method || 'POST',
    path: overrides.path || '/lead',
    headers: {
      origin: overrides.origin === undefined ? 'https://novespoir.tech' : overrides.origin,
      'content-type': 'application/json',
      'user-agent': 'test-agent',
      'x-appwrite-key': 'test-key',
      'x-appwrite-client-ip': overrides.ip || '10.0.0.1',
      'x-appwrite-country-code': 'RU',
      ...(overrides.headers || {})
    },
    bodyText: JSON.stringify(body),
    bodyJson: body
  };
};

const makeRes = () => ({
  json(body, status = 200, headers = {}) { return { body, status, headers }; },
  text(body, status = 200, headers = {}) { return { body, status, headers }; },
  empty() { return { body: '', status: 204, headers: {} }; }
});

const invoke = async (overrides = {}) => {
  const logs = [];
  const errors = [];
  const result = await handler({
    req: makeReq(overrides),
    res: makeRes(),
    log: (...args) => logs.push(args.join(' ')),
    error: (...args) => errors.push(args.join(' '))
  });
  return { ...result, logs, errors };
};

// 1. Preflight
let r = await invoke({ method: 'OPTIONS' });
assert.equal(r.status, 204);
assert.equal(r.headers['access-control-allow-origin'], 'https://novespoir.tech');

// 2. Bad origin
r = await invoke({ origin: 'https://evil.example' });
assert.equal(r.status, 403);
assert.equal(r.body.error, 'origin_not_allowed');

// 3. Health
r = await invoke({ method: 'GET', path: '/health' });
assert.equal(r.status, 200);
assert.equal(r.body.storage, true);
assert.equal(r.body.notify, false);

// 4. Valid lead
r = await invoke();
assert.equal(r.status, 200, JSON.stringify(r));
assert.equal(r.body.ok, true);
assert.equal(r.body.id, 'row-1');
assert.equal(rows.length, 1);
assert.equal(rows[0].data.name, 'Иван');
assert.equal(rows[0].data.contact, '@ivan_test');
assert.equal(rows[0].data.status, 'new');
const storedPayload = JSON.parse(rows[0].data.payload);
assert.equal(storedPayload.utm.source, 'tiktok');
assert.equal(storedPayload.utm.ttclid, 'abc123');
assert.equal(storedPayload.country, 'RU');
assert.equal(storedPayload.consent, true);

// 5. Missing name
r = await invoke({ body: { ...JSON.parse(makeReq().bodyText), name: '' } });
assert.equal(r.status, 400);
assert.deepEqual(r.body.fields, ['name']);
assert.equal(rows.length, 1);

// 6. Honeypot
r = await invoke({ body: { ...JSON.parse(makeReq().bodyText), company: 'spam-bot' } });
assert.equal(r.status, 200);
assert.equal(r.body.ok, true);
assert.equal(rows.length, 1);

// 7. Too fast
r = await invoke({ body: { ...JSON.parse(makeReq().bodyText), elapsedMs: 200 } });
assert.equal(r.status, 200);
assert.equal(rows.length, 1);

// 8. Rate limit with a unique IP and max 2
process.env.RATE_LIMIT_MAX = '2';
r = await invoke({ ip: '10.9.9.9' });
assert.equal(r.status, 200);
r = await invoke({ ip: '10.9.9.9' });
assert.equal(r.status, 200);
r = await invoke({ ip: '10.9.9.9' });
assert.equal(r.status, 429);
assert.equal(r.body.error, 'rate_limited');
process.env.RATE_LIMIT_MAX = '20';

// 9. Storage unavailable + Telegram fallback
delete process.env.LEADS_DB_ID;
delete process.env.LEADS_TABLE_ID;
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.TELEGRAM_CHAT_ID = '123456';
const fetchCalls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  fetchCalls.push({ url: String(url), options });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
};
r = await invoke({ ip: '10.8.8.8' });
assert.equal(r.status, 200, JSON.stringify(r));
assert.equal(r.body.ok, true);
assert.equal(r.body.stored, false);
assert.equal(r.body.notified, true);
assert.equal(fetchCalls.length, 1);
assert.ok(fetchCalls[0].url.includes('api.telegram.org'));

// 10. No storage and no notify -> 503
delete process.env.TELEGRAM_BOT_TOKEN;
delete process.env.TELEGRAM_CHAT_ID;
r = await invoke({ ip: '10.7.7.7' });
assert.equal(r.status, 503);
assert.equal(r.body.error, 'storage_unavailable');

globalThis.fetch = originalFetch;
server.close();
console.log(`All checks passed. Rows created: ${rows.length}`);
console.log('Sample log:', r.logs?.[0] || '(none)');
