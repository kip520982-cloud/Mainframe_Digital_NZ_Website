const { DEMOS, session, inviteCode, requireOrigin, respond, readBody } = require('../lib/access.cjs');
module.exports = (req, res) => {
  if (req.method !== 'POST') return respond(res, 405, { error: 'Method not allowed' });
  if (!requireOrigin(req)) return respond(res, 403, { error: 'Invalid origin' });
  if (session(req)?.role !== 'owner') return respond(res, 401, { error: 'Owner access required' });
  const { demo, days } = readBody(req);
  if (!DEMOS[demo]) return respond(res, 400, { error: 'Unknown demo' });
  if (!DEMOS[demo].url) return respond(res, 409, { error: 'This demo is not yet online' });
  const duration = Number(days);
  if (![1, 7, 30].includes(duration)) return respond(res, 400, { error: 'Choose 1, 7, or 30 days' });
  const exp = Math.floor(Date.now() / 1000) + duration * 86400;
  const code = inviteCode(demo, exp);
  return respond(res, 200, { code, expiresAt: new Date(exp * 1000).toISOString(), demo });
};
