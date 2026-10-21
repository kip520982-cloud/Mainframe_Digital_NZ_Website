const { DEMOS, session, token, respond } = require('../lib/access.cjs');
module.exports = (req, res) => {
  if (req.method !== 'GET') return respond(res, 405, { error: 'Method not allowed' });
  const current = session(req);
  const id = req.query.demo;
  if (!current || !DEMOS[id] || (current.role !== 'owner' && current.demo !== id)) return respond(res, 403, { error: 'Access denied' });
  if (!DEMOS[id].url) return respond(res, 409, { error: 'This demo is not yet online' });
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (DEMOS[id].direct) return res.redirect(302, DEMOS[id].url);
  const ticket = token({ kind: 'handoff', demo: id, exp: Math.floor(Date.now() / 1000) + 60 });
  const destination = new URL('/access', DEMOS[id].url);
  destination.searchParams.set('ticket', ticket);
  return res.redirect(302, destination.toString());
};
