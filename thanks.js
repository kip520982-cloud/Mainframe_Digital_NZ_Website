(()=>{'use strict';
const n=(new URLSearchParams(location.search).get('name')||'').replace(/[^\p{L}\p{M}' .-]/gu,'').trim().slice(0,40);
const el=document.getElementById('ty-name');if(el&&n)el.textContent=', '+n;
if(n)document.title='Thanks, '+n+' — Mainframe Digital';
})();
