// ── Contacto: formulario por pasos ─────────────────────────
(() => {
  const API_BASE = 'https://chilie-chatbot.onrender.com';
  const form = document.getElementById('briefForm');
  if (!form) return;
  const done = document.getElementById('briefDone');
  const status = document.getElementById('briefStatus');
  const send = form.querySelector('.brief-submit');

  // Botones de elección: los de data-multi admiten varias respuestas
  form.querySelectorAll('.pick').forEach(group => {
    const multi = group.hasAttribute('data-multi');
    group.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const on = btn.getAttribute('aria-pressed') !== 'true';
      if (!multi) group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', String(on));
    });
  });
  const picked = name => [...form.querySelectorAll(`.pick[data-name="${name}"] [aria-pressed="true"]`)].map(b => b.value);

  const fields = {
    mensaje: v => v.length >= 5 || 'Cuéntanos aunque sea en una frase qué te gustaría resolver.',
    nombre: v => v.length >= 2 || 'Escribe tu nombre.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Revisa el correo: falta la @ o el dominio (por ejemplo, nombre@empresa.es).',
  };
  const setError = (el, msg) => {
    const err = document.getElementById(el.id + 'Err');
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    if (err) err.textContent = msg || '';
  };
  // El error se limpia en cuanto la persona corrige, sin esperar al envío
  Object.keys(fields).forEach(id => form[id].addEventListener('input', () => setError(form[id], '')));
  form.consent.addEventListener('change', () => setError(form.consent, ''));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let first = null;
    for (const [id, check] of Object.entries(fields)) {
      const ok = check(form[id].value.trim());
      setError(form[id], ok === true ? '' : ok);
      if (ok !== true && !first) first = form[id];
    }
    if (!form.consent.checked) {
      setError(form.consent, 'Necesitamos que aceptes la política de privacidad para poder responderte.');
      first ||= form.consent;
    }
    if (first) { first.focus(); return; }

    const servicios = picked('servicios');
    const mensaje = (servicios.length ? `Le interesa: ${servicios.join(', ')}\n\n` : '') + form.mensaje.value.trim();
    send.disabled = true;
    status.className = 'brief-status';
    status.textContent = 'Enviando…';
    try {
      const res = await fetch(API_BASE + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.value.trim(),
          email: form.email.value.trim(),
          empresa: form.empresa.value.trim(),
          presupuesto: picked('presupuesto')[0] || '',
          prioridad: picked('prioridad')[0] || '',
          como: form.como.value,
          mensaje,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error();
      form.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      done.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    } catch {
      status.className = 'brief-status is-error';
      status.innerHTML = 'No se ha podido enviar. Escríbenos a <a href="mailto:chilieagencia@gmail.com">chilieagencia@gmail.com</a> y te contestamos igual.';
      send.disabled = false;
    }
  });
})();
