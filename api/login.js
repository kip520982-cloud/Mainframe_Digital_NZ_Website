const { compareCode, setSession, requireOrigin, respond, readBody, rateLimited, recordFailure } = require('../lib/access.cjs');
module.exports = (req, res) => {
  if (req.method !== 'POST') return respond(res, 405, { error: 'Method not allowed' });
  if (!requireOrigin(req)) return respond(res, 403, { error: 'Invalid origin' });
  if (rateLimited(req)) return respond(res, 429, { error: 'Too many attempts. Wait a few minutes and try again.' });
  if (!compareCode(readBody(req).code)) { recordFailure(req); return respond(res, 401, { error: 'Invalid code' }); }
  setSession(res, 'owner');
  return respond(res, 200, { ok: true });
};
