(() => {
  'use strict';
  const grid = document.getElementById('demo-grid');
  const message = document.getElementById('gallery-message');

  function card(demo) {
    const article = document.createElement('article');
    article.className = 'demo-card';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${demo.status} / ${demo.id}`;
    const title = document.createElement('h2');
    title.textContent = demo.name;
    const desc = document.createElement('p');
    desc.textContent = demo.description;
    const row = document.createElement('div');
    row.className = 'row';
    const link = document.createElement('a');
    link.className = 'button';
    link.href = `/api/open?demo=${encodeURIComponent(demo.id)}`;
    link.textContent = 'Open prototype ↗';
    row.append(link);
    article.append(meta, title, desc, row);
    return article;
  }

  fetch('/api/session', { cache: 'no-store' })
    .then(async response => {
      if (!response.ok) throw new Error('Unable to load prototypes. Please try again.');
      return response.json();
    })
    .then(({ demos }) => {
      grid.replaceChildren(...demos.map(card));
      if (!demos.length) message.textContent = 'No prototypes are available right now.';
    })
    .catch(error => { message.textContent = error.message; });
})();
