const { clearSession, requireOrigin, respond } = require('../lib/access.cjs');
module.exports = (req, res) => {
  if (req.method !== 'POST') return respond(res, 405, { error: 'Method not allowed' });
  if (!requireOrigin(req)) return respond(res, 403, { error: 'Invalid origin' });
  clearSession(res);
  return respond(res, 200, { ok: true });
};
