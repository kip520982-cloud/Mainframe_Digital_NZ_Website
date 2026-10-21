const { DEMOS, session, respond } = require('../lib/access.cjs');
module.exports = (req, res) => {
  if (req.method !== 'GET') return respond(res, 405, { error: 'Method not allowed' });
  const current = session(req);
  if (!current) return respond(res, 200, { role: null, demos: [] });
  const ids = current.role === 'owner' ? Object.keys(DEMOS) : [current.demo];
  return respond(res, 200, { role: current.role, demos: ids.map(id => ({ id, ...DEMOS[id], url: undefined })) });
};
