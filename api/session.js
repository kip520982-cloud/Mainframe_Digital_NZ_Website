const { DEMOS, respond } = require('../lib/access.cjs');
module.exports = (req, res) => {
  if (req.method !== 'GET') return respond(res, 405, { error: 'Method not allowed' });
  const demos = Object.entries(DEMOS)
    .filter(([, demo]) => Boolean(demo.url))
    .map(([id, demo]) => ({ id, name: demo.name, description: demo.description, status: demo.status }));
  return respond(res, 200, { demos });
};
