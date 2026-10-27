// ── Blog: filtrar el archivo por tema ──────────────────────
(() => {
  const chips = [...document.querySelectorAll('.chips button')];
  const rows = [...document.querySelectorAll('.archive .post-row')];
  const months = [...document.querySelectorAll('.archive .month')];
  const empty = document.querySelector('.archive-empty');
  if (!chips.length) return;

  function show(cat) {
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.cat === cat)));
    rows.forEach(r => { r.hidden = cat !== 'all' && r.dataset.cat !== cat; });
    months.forEach(m => { m.hidden = !m.querySelector('.post-row:not([hidden])'); });
    empty.hidden = months.some(m => !m.hidden);
    history.replaceState(null, '', cat === 'all' ? location.pathname : `#${cat}`);
  }

  chips.forEach(c => c.addEventListener('click', () => show(c.dataset.cat)));
  const initial = location.hash.slice(1);
  if (chips.some(c => c.dataset.cat === initial)) show(initial);
})();
