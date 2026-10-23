// Public enquiry + scorecard endpoint for the marketing site.
// Deliberately standalone: it does not use lib/access.cjs or anything from the /admin portal.
//
// Env (all optional; nothing breaks if they are missing):
//   SMTP_USER, SMTP_PASS   Google Workspace mailbox + app password. When missing, submissions are
//                          logged to the function logs and the visitor still gets a success response.
//   SMTP_HOST, SMTP_PORT   default smtp.gmail.com:465 (override only for local testing)
//   ENQUIRY_TO             default kieran@mainframe.kiwi
//   LEADS_WEBHOOK_URL      optional free lead log, e.g. a Google Apps Script web app that appends to a Sheet
//   SEND_LEAD_EMAILS       set to "0" to stop auto-replies/results emails to the visitor
'use strict';

const PLAYBOOK_PATH = '/guides/ai-growth-playbook-nz-fa7379e4.pdf';
const TO = () => process.env.ENQUIRY_TO || 'kieran@mainframe.kiwi';

const SERVICES = {
  apps: 'iOS & Android app',
  business: 'Custom business app (CRM, CMS, client portal)',
  website: 'Smart website',
  automation: 'Workflow automation',
  ai: 'AI setup & team training',
  unsure: 'Not sure yet',
};
const INDUSTRIES = ['Trades & home services', 'Professional services', 'Property management', 'Healthcare & clinics', 'Hospitality & retail', 'Startup', 'Other'];
const TEAM = ['', 'Just me', '2–10', '11–50', '50+'];
const START = ['', 'ASAP', 'Next 1–3 months', 'Just exploring'];
const HEARD = ['', 'Google', 'ChatGPT or another AI assistant', 'LinkedIn', 'Referral', 'Other'];
const BANDS = ['Getting started', 'Ready for quick wins', 'Ready to scale'];

// Basic per-IP rate limit. In-memory, so it is per warm instance only (good enough to stop
// casual floods; not a security boundary).
const WINDOW_MS = 10 * 60 * 1000, MAX_PER_WINDOW = 5;
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < WINDOW_MS)) hits.delete(k);
  return list.length > MAX_PER_WINDOW;
}

const clean = (v, max = 200) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);
const oneLine = (v, max) => clean(v, max).replace(/[\r\n]+/g, ' ');
const isEmail = v => /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]{2,}$/.test(v) && v.length <= 254;
const pick = (v, list) => (list.includes(v) ? v : '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function readBody(req) {
  const isForm = String(req.headers['content-type'] || '').includes('application/x-www-form-urlencoded');
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return { body: req.body, form: isForm };
  let raw = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : null;
  if (raw == null) {
    raw = '';
    for await (const chunk of req) { raw += chunk; if (raw.length > 64 * 1024) throw new Error('too large'); }
  }
  if (isForm) {
    const p = new URLSearchParams(raw), out = {};
    for (const k of new Set(p.keys())) { const all = p.getAll(k); out[k] = all.length > 1 || k === 'interests' ? all : all[0]; }
    return { body: out, form: true };
  }
  return { body: raw ? JSON.parse(raw) : {}, form: false };
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients (curl); browsers always send Origin on POST
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  try { return new URL(origin).host === host; } catch { return false; }
}

function validate(b) {
  const errors = {};
  const type = b.type === 'scorecard' ? 'scorecard' : 'enquiry';
  const d = {
    type,
    first_name: oneLine(b.first_name, 80),
    business: oneLine(b.business, 120),
    email: oneLine(b.email, 254).toLowerCase(),
    page: oneLine(b.page, 300),
    utm_source: oneLine(b.utm_source, 100),
    utm_medium: oneLine(b.utm_medium, 100),
    utm_campaign: oneLine(b.utm_campaign, 100),
    referrer: oneLine(b.referrer, 300),
  };
  if (!d.first_name) errors.first_name = 'Please add your first name.';
  if (!d.business) errors.business = 'Please add your business name.';
  if (!isEmail(d.email)) errors.email = 'Please add a valid email address.';
  if (type === 'enquiry') {
    d.mobile = oneLine(b.mobile, 40);
    if (d.mobile && !/^[+()\d\s-]{6,20}$/.test(d.mobile)) errors.mobile = 'That mobile number doesn\'t look right.';
    d.website = oneLine(b.website, 200);
    d.industry = pick(oneLine(b.industry, 60), INDUSTRIES);
    if (!d.industry) errors.industry = 'Please choose an industry.';
    const ints = (Array.isArray(b.interests) ? b.interests : b.interests ? [b.interests] : []).map(x => oneLine(x, 20)).filter(x => SERVICES[x]);
    d.interests = [...new Set(ints)];
    if (!d.interests.length) errors.interests = 'Please choose at least one option.';
    d.slowing = clean(b.slowing, 2000);
    d.team_size = pick(oneLine(b.team_size, 20), TEAM);
    d.start = pick(oneLine(b.start, 30), START);
    d.heard = pick(oneLine(b.heard, 40), HEARD);
    d.service = SERVICES[oneLine(b.service, 20)] ? oneLine(b.service, 20) : '';
  } else {
    const s = b.score || {};
    const total = Number(s.total);
    d.score = {
      total: Number.isInteger(total) && total >= 0 && total <= 21 ? total : null,
      band: pick(oneLine(s.band, 40), BANDS),
      goal: oneLine(s.goal, 80),
      answers: Array.isArray(s.answers) ? s.answers.slice(0, 8).map(a => oneLine(a, 120)) : [],
      recommendations: Array.isArray(s.recommendations) ? s.recommendations.slice(0, 3).map(r => ({ title: oneLine(r && r.title, 120), body: clean(r && r.body, 600) })) : [],
    };
    if (d.score.total == null || !d.score.band) errors.score = 'Missing scorecard result.';
  }
  return { d, errors };
}

function summaryText(d) {
  const L = [];
  if (d.type === 'enquiry') {
    L.push(`New free consultation request`, '',
      `Name: ${d.first_name}`, `Business: ${d.business}`, `Email: ${d.email}`, `Mobile: ${d.mobile || '-'}`, `Website: ${d.website || '-'}`, `Industry: ${d.industry}`,
      `Interested in: ${d.interests.map(k => SERVICES[k]).join('; ')}`, `What's slowing them down: ${d.slowing || '-'}`,
      `Team size: ${d.team_size || '-'}`, `Hoping to start: ${d.start || '-'}`, `Heard about us: ${d.heard || '-'}`, `Service preselected: ${d.service || '-'}`);
  } else {
    L.push(`New AI Opportunity Scorecard result`, '', `Name: ${d.first_name}`, `Business: ${d.business}`, `Email: ${d.email}`,
      `Score: ${d.score.total}/21 (${d.score.band})`, `Goal: ${d.score.goal || '-'}`, '', 'Answers:', ...d.score.answers.map((a, i) => `  Q${i + 1}: ${a}`),
      '', 'Top recommendations shown:', ...d.score.recommendations.map((r, i) => `  ${i + 1}. ${r.title}`));
  }
  L.push('', `Page: ${d.page || '-'}`, `UTM: ${[d.utm_source, d.utm_medium, d.utm_campaign].map(x => x || '-').join(' / ')}`, `Referrer: ${d.referrer || '-'}`, `Received: ${d.received}`);
  return L.join('\n');
}

function leadEmail(d, origin) {
  const pdf = origin + PLAYBOOK_PATH;
  if (d.type === 'enquiry') {
    const text = [`Hi ${d.first_name},`, '', `Thanks for booking a free consultation with Mainframe Digital. We've got your message. Here's what happens next:`, '',
      `1. We read it today and reply within one business day, from a real person.`,
      `2. A free 30-minute consultation, by video or phone, about how ${d.business} works today.`,
      `3. Within two business days of that, a free demo of what we'd build: the two or three things we'd build or automate first. Yours to keep.`, '',
      `While you wait, here's our AI Growth Playbook for NZ businesses: ${pdf}`, '', `Just reply to this email if there's anything else we should know.`, '', `Kieran Stapleton`, `Founder, Mainframe Digital`, `mainframe.kiwi`].join('\n');
    return { subject: 'Got your message – Mainframe Digital', text };
  }
  const s = d.score;
  const text = [`Hi ${d.first_name},`, '', `Here are your AI Opportunity Scorecard results for ${d.business}.`, '', `Score: ${s.total} out of 21 – ${s.band}`, '',
    'The three changes we would look at first:', ...s.recommendations.flatMap((r, i) => [`${i + 1}. ${r.title}`, `   ${r.body}`]), '',
    `Your AI Growth Playbook (PDF): ${pdf}`, '', `Want to talk it through? Book a free consultation and we'll show you a free demo of what we'd build: ${origin}/#contact`, '',
    `Kieran Stapleton`, `Founder, Mainframe Digital`].join('\n');
  return { subject: `Your AI Opportunity Score: ${s.total}/21 – Mainframe Digital`, text };
}

async function sendMail(d, origin) {
  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!user || !pass) return { sent: false, reason: 'smtp-not-configured' };
  const nodemailer = require('nodemailer');
  const port = Number(process.env.SMTP_PORT || 465);
  const t = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
  const from = `"Mainframe Digital" <${user}>`;
  const text = summaryText(d);
  await t.sendMail({ from, to: TO(), replyTo: `"${d.first_name.replace(/"/g, '')}" <${d.email}>`,
    subject: d.type === 'enquiry' ? `Free consultation request: ${d.first_name}, ${d.business}` : `Scorecard ${d.score.total}/21: ${d.first_name}, ${d.business}`,
    text, html: `<pre style="font:14px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap">${esc(text)}</pre>` });
  let lead = 'skipped';
  if (process.env.SEND_LEAD_EMAILS !== '0') {
    try { const m = leadEmail(d, origin); await t.sendMail({ from, to: d.email, replyTo: TO(), subject: m.subject, text: m.text }); lead = 'sent'; }
    catch (e) { lead = 'failed: ' + e.message; }
  }
  return { sent: true, lead };
}

async function webhook(d) {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return 'not-configured';
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d), signal: AbortSignal.timeout(8000) });
    return r.ok ? 'ok' : 'http ' + r.status;
  } catch (e) { return 'failed: ' + e.message; }
}

function reply(res, status, obj, form, location) {
  if (form && location) { res.statusCode = 303; res.setHeader('Location', location); res.setHeader('Cache-Control', 'no-store'); return res.end(); }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

module.exports = async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(res, 405, { ok: false, error: 'Method not allowed' }); }
  if (!sameOrigin(req)) return reply(res, 403, { ok: false, error: 'Invalid origin' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return reply(res, 429, { ok: false, error: 'Too many requests. Please try again in a few minutes, or email hello@mainframe.kiwi.' });

  let body, form;
  try { ({ body, form } = await readBody(req)); } catch { return reply(res, 400, { ok: false, error: 'Invalid request body' }); }
  if (!body || typeof body !== 'object') return reply(res, 400, { ok: false, error: 'Invalid request body' });

  // Honeypot: humans never see or fill this. Pretend success so bots learn nothing.
  if (clean(body.company_reference)) {
    console.log('[enquiry] honeypot triggered; dropped', JSON.stringify({ ip, type: body.type || 'enquiry' }));
    return reply(res, 200, { ok: true }, form, '/thanks');
  }

  const { d, errors } = validate(body);
  if (Object.keys(errors).length) return reply(res, 400, { ok: false, errors }, form, '/?error=1#contact');
  d.received = new Date().toISOString();
  d.ip = ip;

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
  let mail;
  try { mail = await sendMail(d, origin); } catch (e) { mail = { sent: false, reason: 'smtp-error: ' + e.message }; }
  const hook = await webhook(d);
  if (!mail.sent) console.log('[enquiry] NOT EMAILED (' + mail.reason + '). Full submission:\n' + JSON.stringify(d, null, 2));
  else console.log('[enquiry] emailed', JSON.stringify({ type: d.type, to: TO(), lead: mail.lead, webhook: hook, received: d.received }));
  if (hook !== 'not-configured' && hook !== 'ok') console.log('[enquiry] lead webhook ' + hook);

  const thanks = d.type === 'enquiry' ? '/thanks?name=' + encodeURIComponent(d.first_name) : '/thanks?from=scorecard&name=' + encodeURIComponent(d.first_name);
  return reply(res, 200, { ok: true, next: thanks }, form, thanks);
};
