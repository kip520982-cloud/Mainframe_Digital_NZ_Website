(() => {
  'use strict';
  const owner = location.pathname === '/admin' || location.pathname === '/admin.html';
  const $ = id => document.getElementById(id);
  const login = $('login-panel');
  const workspace = $('workspace');
  const logout = $('logout');
  async function api(path, options) {
    const res = await fetch(`/api/${path}`, { credentials: 'same-origin', cache: 'no-store', ...options });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  function card(demo) {
    const article = document.createElement('article'); article.className = 'demo-card';
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `${demo.status} / ${demo.id}`;
    const title = document.createElement('h2'); title.textContent = demo.name;
    const desc = document.createElement('p'); desc.textContent = demo.description;
    const row = document.createElement('div'); row.className = 'row';
    const link = document.createElement('a'); link.className = 'button'; link.href = `/api/open?demo=${encodeURIComponent(demo.id)}`; link.textContent = 'Open prototype ↗';
    row.append(link); article.append(meta, title, desc, row); return article;
  }
  async function refresh() {
    try {
      const state = await api('session');
      const allowed = owner ? state.role === 'owner' : state.role === 'guest' || state.role === 'owner';
      login.classList.toggle('hide', allowed);
      workspace.classList.toggle('hide', !allowed);
      logout.classList.toggle('hide', !allowed);
      if (!allowed) return;
      const grid = $('demo-grid'); grid.replaceChildren(...state.demos.map(card));
      if (owner) {
        const select = $('share-demo'); select.replaceChildren();
        for (const demo of state.demos) {
          const option = document.createElement('option'); option.value = demo.id; option.textContent = demo.name; select.append(option);
        }
      }
    } catch { $('login-message').textContent = 'Unable to connect. Please try again.'; }
  }
  const form = owner ? $('login-form') : $('redeem-form');
  form.addEventListener('submit', async event => {
    event.preventDefault(); $('login-message').textContent = '';
    const input = owner ? $('admin-code') : $('client-code');
    try {
      await api(owner ? 'login' : 'redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: input.value.trim() }) });
      input.value = ''; await refresh();
    } catch (error) { $('login-message').textContent = error.message; }
  });
  logout.addEventListener('click', async () => { try { await api('logout', { method: 'POST' }); await refresh(); } catch { /* Retry remains available */ } });
  if (owner) {
    $('share-form').addEventListener('submit', async event => {
      event.preventDefault(); $('share-message').textContent = ''; $('code-box').style.display = 'none';
      try {
        const result = await api('share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ demo: $('share-demo').value, days: Number($('share-days').value) }) });
        $('share-code').textContent = result.code;
        $('code-expiry').textContent = `Expires ${new Date(result.expiresAt).toLocaleString()}`;
        $('code-box').style.display = 'block';
      } catch (error) { $('share-message').textContent = error.message; }
    });
    $('copy-code').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText($('share-code').textContent); $('copy-code').textContent = 'Copied ✓'; }
      catch { $('copy-code').textContent = 'Select the code above to copy'; }
    });
  }
  refresh();
})();
