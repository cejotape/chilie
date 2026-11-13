// ── /pide: formulario corto para quien llega desde un reel ──
// La dirección lleva la palabra del vídeo: /pide?v=plan. Cada palabra tiene su título y sus
// preguntas; si la palabra no existe se usa "_general". Para un vídeo nuevo, añadir una entrada.
// Las respuestas llegan por correo con el mismo servicio que el formulario de /contacto.
(() => {
  const API_BASE = 'https://chilie-chatbot.onrender.com';

  const FORMULARIOS = {
    _general: {
      titulo: 'Cuéntanos tu caso y te escribimos.',
      sub: 'Un minuto. Lo leemos Iñigo o Carlos y te contestamos en menos de 24 horas.',
      preguntas: [
        { id: 'interes', texto: '¿Qué te interesa?', multi: true,
          opciones: ['Agente de voz', 'Chatbot', 'Automatización', 'Software a medida', 'Aún no lo sé'] },
        { id: 'problema', texto: '¿Qué tarea le quita más tiempo a tu equipo?', libre: true, obligatoria: true,
          ejemplo: 'Por ejemplo: perdemos llamadas a mediodía y las citas se apuntan a mano.' },
      ],
    },
    // Reel "De la llamada al lanzamiento" (13-nov-2026): pide el plan de dos semanas para su negocio
    plan: {
      titulo: 'Tu plan de dos semanas, por escrito.',
      sub: 'Dinos a qué te dedicas y qué quieres quitarte de encima. Te escribimos en menos de 24 horas para ver cómo lo haríamos en tu negocio.',
      preguntas: [
        { id: 'sector', texto: '¿A qué se dedica tu negocio?',
          opciones: ['Clínica', 'Inmobiliaria', 'Restaurante', 'Alquiler vacacional', 'Tienda online', 'Otro'] },
        { id: 'problema', texto: '¿Qué te quita más tiempo hoy?', multi: true,
          opciones: ['Coger el teléfono', 'Contestar WhatsApp y correo', 'Apuntar y confirmar citas', 'Copiar datos a mano', 'Otra cosa'] },
        { id: 'detalle', texto: 'Cuéntanoslo en una frase', libre: true,
          ejemplo: 'Por ejemplo: somos dos en recepción y a mediodía no llegamos al teléfono.' },
      ],
    },
    // Reel del agente de voz que atiende con la clínica cerrada
    llamadas: {
      titulo: 'Que ninguna llamada se quede sin coger.',
      sub: 'Cuéntanos cómo atendéis el teléfono y te decimos cómo lo cogería un agente de voz en tu negocio.',
      preguntas: [
        { id: 'sector', texto: '¿A qué se dedica tu negocio?',
          opciones: ['Clínica', 'Inmobiliaria', 'Restaurante', 'Taller', 'Alquiler', 'Otro'] },
        { id: 'volumen', texto: '¿Cuántas llamadas recibís al día, más o menos?',
          opciones: ['Menos de 10', 'De 10 a 30', 'De 30 a 100', 'Más de 100', 'No lo sé'] },
        { id: 'cuando', texto: '¿Cuándo se os escapan?', multi: true,
          opciones: ['A mediodía', 'Fuera de horario', 'Fines de semana', 'Cuando hay mucha gente', 'No lo sé'] },
      ],
    },
  };

  const form = document.getElementById('pideForm');
  if (!form) return;
  const clave = (new URLSearchParams(location.search).get('v') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
  const F = FORMULARIOS[clave] || FORMULARIOS._general;
  const origen = FORMULARIOS[clave] ? clave.toUpperCase() : 'general';

  document.getElementById('pageTitle').textContent = F.titulo;
  document.getElementById('pageSub').textContent = F.sub;
  if (FORMULARIOS[clave]) document.getElementById('pideSello').textContent = 'Has comentado ' + origen;

  // Pinta las preguntas del vídeo con los mismos componentes que /contacto
  const caja = document.getElementById('pidePreguntas');
  const el = (tag, attrs = {}, text) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (text != null) n.textContent = text;
    return n;
  };
  F.preguntas.forEach((q, i) => {
    const fs = el('fieldset', { class: 'brief-block' });
    const lg = el('legend', { class: 'brief-q' });
    lg.append(el('span', {}, String(i + 1)), document.createTextNode(q.texto));
    fs.append(lg);
    if (q.libre) {
      const campo = el('div', { class: 'field' });
      const ta = el('textarea', { id: 'q_' + q.id, name: 'q_' + q.id, rows: '3', placeholder: q.ejemplo || '', 'aria-label': q.texto });
      ta.style.minHeight = '110px';
      campo.append(ta, el('p', { class: 'field-err', id: 'q_' + q.id + 'Err' }));
      fs.append(campo);
    } else {
      if (q.multi) fs.append(el('p', { class: 'brief-hint' }, 'Marca todas las que encajen.'));
      const grupo = el('div', { class: 'pick', 'data-name': q.id });
      if (q.multi) grupo.setAttribute('data-multi', '');
      q.opciones.forEach(o => grupo.append(el('button', { type: 'button', 'aria-pressed': 'false', value: o }, o)));
      grupo.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const on = btn.getAttribute('aria-pressed') !== 'true';
        if (!q.multi) grupo.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', String(on));
      });
      fs.append(grupo);
    }
    caja.append(fs);
  });
  document.getElementById('pideNumContacto').textContent = String(F.preguntas.length + 1);

  const status = document.getElementById('pideStatus');
  const done = document.getElementById('pideDone');
  const send = form.querySelector('.brief-submit');
  const setError = (input, msg) => {
    const err = document.getElementById(input.id + 'Err');
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    if (err) err.textContent = msg || '';
  };
  const reglas = {
    nombre: v => v.length >= 2 || 'Escribe tu nombre.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Revisa el correo: falta la @ o el dominio (por ejemplo, nombre@empresa.es).',
  };
  Object.keys(reglas).forEach(id => form[id].addEventListener('input', () => setError(form[id], '')));
  form.consent.addEventListener('change', () => setError(form.consent, ''));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let first = null;
    F.preguntas.filter(q => q.libre && q.obligatoria).forEach(q => {
      const ta = form['q_' + q.id];
      const ok = ta.value.trim().length >= 5;
      setError(ta, ok ? '' : 'Cuéntanoslo aunque sea en una frase.');
      if (!ok && !first) first = ta;
    });
    for (const [id, check] of Object.entries(reglas)) {
      const ok = check(form[id].value.trim());
      setError(form[id], ok === true ? '' : ok);
      if (ok !== true && !first) first = form[id];
    }
    if (!form.consent.checked) {
      setError(form.consent, 'Necesitamos que aceptes la política de privacidad para poder responderte.');
      first ||= form.consent;
    }
    if (first) { first.focus(); return; }

    // El correo que recibimos: de qué vídeo viene y cada pregunta con su respuesta
    const lineas = ['Viene de Instagram · vídeo: ' + origen, ''];
    F.preguntas.forEach(q => {
      const r = q.libre
        ? form['q_' + q.id].value.trim()
        : [...caja.querySelectorAll(`.pick[data-name="${q.id}"] [aria-pressed="true"]`)].map(b => b.value).join(', ');
      lineas.push(q.texto, '→ ' + (r || '(sin responder)'), '');
    });
    const tel = form.telefono.value.trim();
    if (tel) lineas.push('Teléfono: ' + tel);

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
          como: 'Instagram · reel ' + origen,
          mensaje: lineas.join('\n').trim(),
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error();
      form.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      done.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    } catch {
      status.className = 'brief-status is-error';
      status.innerHTML = 'No se ha podido enviar. Escríbenos a <a href="mailto:hola@chilieia.com">hola@chilieia.com</a> y te contestamos igual.';
      send.disabled = false;
    }
  });
})();
