const { DEMOS, token, respond } = require('../lib/access.cjs');
module.exports = (req, res) => {
  if (req.method !== 'GET') return respond(res, 405, { error: 'Method not allowed' });
  const id = req.query.demo;
  if (!DEMOS[id]) return respond(res, 404, { error: 'Unknown demo' });
  if (!DEMOS[id].url) return respond(res, 409, { error: 'This demo is not yet online' });
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (DEMOS[id].direct) return res.redirect(302, DEMOS[id].url);
  const ticket = token({ kind: 'handoff', demo: id, exp: Math.floor(Date.now() / 1000) + 60 });
  const destination = new URL('/access', DEMOS[id].url);
  destination.searchParams.set('ticket', ticket);
  return res.redirect(302, destination.toString());
};
