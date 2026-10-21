const crypto = require('node:crypto');

const DEMOS = Object.freeze({
  'colon-care-crm': {
    name: 'AI Agent Control Desk',
    description: 'Colon Care Centre prototype — synthetic-data control desk for agents, workflows and clinic operations.',
    status: 'Prototype',
    url: process.env.COLON_CARE_DEMO_URL || '',
  },
  'colon-care-website': {
    name: 'Colon Care Centre website',
    description: 'The public front-end started for the Colon Care Centre in Morningside.',
    status: 'Prototype',
    url: process.env.COLON_CARE_SITE_URL || 'https://colon-care-centre-preview.vercel.app',
    direct: true,
  },
});
function secret() {
  const value = process.env.MAINFRAME_SESSION_SECRET || '';
  if (value.length < 32) throw new Error('MAINFRAME_SESSION_SECRET must be at least 32 characters');
  return value;
}

function sign(data) {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

function token(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function verify(value) {
  if (typeof value !== 'string' || value.length > 1500) return null;
  const parts = value.split('.');
  if (parts.length !== 2) return null;
  const [body, mac] = parts;
  if (!body || !mac) return null;
  const expected = sign(body);
  const actual = Buffer.from(mac);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!Number.isSafeInteger(data.exp) || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch { return null; }
}

function eightDigitCode(demo, expDay) {
  const mac = crypto.createHmac('sha256', secret()).update(`mf-code:1:${demo}:${expDay}`).digest();
  return String(mac.readUInt32BE(0) % 100000000).padStart(8, '0');
}

function inviteCode(demo, exp) {
  if (!DEMOS[demo]) throw new Error('Unknown demo');
  return eightDigitCode(demo, Math.floor(exp / 86400));
}

function verifyInviteCode(code) {
  const normalized = typeof code === 'string' ? code.trim() : '';
  if (!/^\d{8}$/.test(normalized)) return null;
  const today = Math.floor(Date.now() / 86400000);
  let match = null;
  for (const demo of Object.keys(DEMOS)) {
    for (let expDay = today; expDay <= today + 30; expDay += 1) {
      const expected = eightDigitCode(demo, expDay);
      const left = Buffer.from(normalized);
      const right = Buffer.from(expected);
      if (left.length === right.length && crypto.timingSafeEqual(left, right)) match = { demo, exp: (expDay + 1) * 86400 };
    }
  }
  return match && match.exp > Math.floor(Date.now() / 1000) ? match : null;
}

function compareCode(input) {
  const expected = process.env.MAINFRAME_ADMIN_CODE || '';
  if (!/^\d{8}$/.test(expected) || typeof input !== 'string' || !/^\d{8}$/.test(input.trim())) return false;
  const a = crypto.createHash('sha256').update(input.trim()).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

const failures = new Map();
function rateLimited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'local').split(',')[0].trim() || 'local';
  const now = Date.now();
  const hits = (failures.get(ip) || []).filter(time => now - time < 10 * 60 * 1000);
  failures.set(ip, hits);
  return hits.length >= 8;
}
function recordFailure(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'local').split(',')[0].trim() || 'local';
  const now = Date.now();
  const hits = (failures.get(ip) || []).filter(time => now - time < 10 * 60 * 1000);
  hits.push(now);
  failures.set(ip, hits);
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(part => {
    const i = part.indexOf('=');
    if (i < 0) return ['', ''];
    try { return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1))]; }
    catch { return ['', '']; }
  }));
}

function session(req) {
  const data = verify(cookies(req).mf_session);
  if (!data || data.kind !== 'session') return null;
  if (data.role === 'owner') return { role: 'owner' };
  if (data.role === 'guest' && DEMOS[data.demo]) return { role: 'guest', demo: data.demo };
  return null;
}

function setSession(res, role, demo) {
  const exp = Math.floor(Date.now() / 1000) + (role === 'owner' ? 12 * 3600 : 24 * 3600);
  const value = token({ kind: 'session', role, demo: demo || null, exp });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `mf_session=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${role === 'owner' ? 43200 : 86400}${secure}`);
}

function clearSession(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `mf_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

function requireOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

function respond(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(data);
}

function readBody(req) {
  return req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
}

module.exports = { DEMOS, token, verify, inviteCode, verifyInviteCode, compareCode, rateLimited, recordFailure, session, setSession, clearSession, requireOrigin, respond, readBody };
