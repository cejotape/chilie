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
    // Reel "El correo se contesta solo" (14-nov-2026): la bandeja que se clasifica y se responde sola
    correo: {
      titulo: 'Que el correo de siempre se conteste solo.',
      sub: 'Cuéntanos cómo es vuestra bandeja y te decimos qué se puede clasificar y responder sin que nadie lo abra. Te escribimos en menos de 24 horas.',
      preguntas: [
        { id: 'volumen', texto: '¿Cuántos correos entran al día en la bandeja general, más o menos?',
          opciones: ['Menos de 20', 'De 20 a 50', 'De 50 a 200', 'Más de 200', 'No lo sé'] },
        { id: 'tipos', texto: '¿Qué llega más?', multi: true,
          opciones: ['Peticiones de presupuesto', 'Reservas y citas', 'Dudas de siempre', 'Facturas de proveedores', 'Incidencias', 'Otra cosa'] },
        { id: 'detalle', texto: '¿Qué pasa hoy con esos correos?', libre: true,
          ejemplo: 'Por ejemplo: los contesta una persona cuando puede y algunos se quedan días sin respuesta.' },
      ],
    },
    // Reel "El menú que pierde clientes" (15-nov-2026): del chatbot de botones al que entiende, reserva y traspasa
    botones: {
      titulo: 'Que tu chat entienda lo que le escriben.',
      sub: 'Cuéntanos por dónde te escriben tus clientes y qué preguntan, y te decimos qué resolvería un chatbot con IA en tu negocio. Te escribimos en menos de 24 horas.',
      preguntas: [
        { id: 'canal', texto: '¿Por dónde te escriben tus clientes?', multi: true,
          opciones: ['WhatsApp', 'Instagram', 'La web', 'Correo', 'Otro'] },
        { id: 'piden', texto: '¿Qué te piden más?', multi: true,
          opciones: ['Citas y cambios de hora', 'Precios y horarios', 'Estado de un pedido', 'Reservas', 'Otra cosa'] },
        { id: 'ahora', texto: '¿Quién contesta hoy esos mensajes?', libre: true,
          ejemplo: 'Por ejemplo: tenemos un menú de opciones en WhatsApp y al final contesta recepción cuando puede.' },
      ],
    },
    // Reel "Un pedido, cuatro sitios" (16-nov-2026): del Excel, el correo y la libreta a un solo panel
    panel: {
      titulo: 'Todo lo de tu negocio, en una sola pantalla.',
      sub: 'Cuéntanos dónde apuntáis hoy los pedidos, las citas o los clientes y te decimos cómo sería un panel hecho para vosotros. Te escribimos en menos de 24 horas.',
      preguntas: [
        { id: 'sitios', texto: '¿Dónde lleváis hoy el trabajo del día a día?', multi: true,
          opciones: ['Hoja de cálculo', 'Correo', 'WhatsApp', 'Papel', 'Un programa que se queda corto', 'Otro'] },
        { id: 'usuarios', texto: '¿Cuántas personas lo usarían?',
          opciones: ['De 1 a 3', 'De 4 a 10', 'De 11 a 30', 'Más de 30', 'No lo sé'] },
        { id: 'detalle', texto: '¿Qué te gustaría ver de un vistazo?', libre: true,
          ejemplo: 'Por ejemplo: en qué punto está cada pedido sin tener que preguntar a tres personas.' },
      ],
    },
    // Reel "No quieren hablar con una máquina" (17-nov-2026): las cuatro dudas sobre el agente de voz
    tono: {
      titulo: 'Que tu teléfono se coja al primer tono.',
      sub: 'Cuéntanos cómo atendéis hoy las llamadas y qué duda te frena, y te decimos cómo lo cogería un agente de voz en tu negocio. Te escribimos en menos de 24 horas.',
      preguntas: [
        { id: 'cuando', texto: '¿Cuándo se os quedan llamadas sin coger?', multi: true,
          opciones: ['Fuera de horario', 'A mediodía', 'Cuando hay gente en el local', 'Fines de semana', 'No lo sé'] },
        { id: 'duda', texto: '¿Qué te preocupa de que conteste un agente de voz?', multi: true,
          opciones: ['Que suene a máquina', 'Que no pase la llamada a una persona', 'Tener que cambiar de número', 'El precio', 'Nada, quiero probarlo'] },
        { id: 'detalle', texto: '¿Para qué te llaman más tus clientes?', libre: true,
          ejemplo: 'Por ejemplo: para pedir cita, cambiarla o preguntar precios y horarios.' },
      ],
    },
    // Reel "Las facturas se leen solas" (18-nov-2026): lo claro pasa solo y lo dudoso lo revisa una persona
    facturas: {
      titulo: 'Que nadie teclee una factura más.',
      sub: 'Cuéntanos cómo os llegan las facturas y dónde las apuntáis, y te decimos qué se puede leer y pasar solo en tu negocio. Te escribimos en menos de 24 horas.',
      preguntas: [
        { id: 'volumen', texto: '¿Cuántas facturas de proveedores os llegan al mes, más o menos?',
          opciones: ['Menos de 20', 'De 20 a 100', 'De 100 a 500', 'Más de 500', 'No lo sé'] },
        { id: 'destino', texto: '¿Dónde las apuntáis hoy?', multi: true,
          opciones: ['Hoja de cálculo', 'Programa de facturación', 'Las lleva la gestoría', 'Papel', 'Otro'] },
        { id: 'detalle', texto: '¿Quién las teclea y cuánto tiempo le lleva?', libre: true,
          ejemplo: 'Por ejemplo: administración pasa un par de mañanas a fin de mes copiando importes a la hoja.' },
      ],
    },
    // Reel "Black Friday en tu chat" (19-nov-2026): un día de campaña en el chat de una tienda online
    tienda: {
      titulo: 'Que tu tienda conteste también en plena campaña.',
      sub: 'Cuéntanos por dónde os escriben y qué os preguntan más, y te decimos qué podría contestar un chatbot consultando tu tienda. Te escribimos en menos de 24 horas.',
      preguntas: [
        { id: 'canal', texto: '¿Por dónde os escriben vuestros clientes?', multi: true,
          opciones: ['WhatsApp', 'Instagram', 'Chat de la web', 'Correo', 'Otro'] },
        { id: 'preguntas', texto: '¿Qué os preguntan más?', multi: true,
          opciones: ['Tallas y stock', 'Dónde está mi pedido', 'Envíos y plazos', 'Cambios y devoluciones', 'Otra cosa'] },
        { id: 'detalle', texto: '¿Con qué está montada tu tienda y quién contesta hoy los mensajes?', libre: true,
          ejemplo: 'Por ejemplo: Shopify; contestamos entre dos cuando podemos, y en campaña no damos abasto.' },
      ],
    },
    // Reel "El contacto del portal se enfría" (20-nov-2026): del portal inmobiliario al CRM, con resumen, aviso y primera respuesta
    portal: {
      titulo: 'Que ningún contacto del portal se enfríe.',
      sub: 'Cuéntanos por dónde os llegan los contactos y quién los contesta, y te decimos qué puede entrar y responderse solo en tu inmobiliaria. Te escribimos en menos de 24 horas.',
      preguntas: [
        { id: 'origen', texto: '¿Por dónde os llegan los contactos?', multi: true,
          opciones: ['Portales inmobiliarios', 'Formulario de la web', 'WhatsApp', 'Teléfono', 'Otro'] },
        { id: 'tiempo', texto: '¿Cuánto tardáis en dar la primera respuesta?',
          opciones: ['Minutos', 'Un par de horas', 'El mismo día', 'Al día siguiente', 'No lo sé'] },
        { id: 'detalle', texto: '¿Dónde apuntáis hoy cada contacto y quién lo hace?', libre: true,
          ejemplo: 'Por ejemplo: los copiamos del correo al CRM cuando volvemos de las visitas.' },
      ],
    },
    // Reel "La cena de grupo sin contestar" (20-nov-2026): chatbot de WhatsApp para restaurantes (carta, mesas libres, alergias, reserva y traspaso al encargado)
    mesa: {
      titulo: 'Que ninguna reserva se quede sin contestar.',
      sub: 'Cuéntanos por dónde os piden mesa y quién contesta en pleno servicio, y te decimos qué puede responder y reservar solo un chatbot en tu restaurante. Te escribimos en menos de 24 horas.',
      preguntas: [
        { id: 'canal', texto: '¿Por dónde os piden mesa?', multi: true,
          opciones: ['WhatsApp', 'Teléfono', 'Instagram', 'La web', 'Otro'] },
        { id: 'quien', texto: '¿Quién contesta los mensajes durante el servicio?',
          opciones: ['Quien puede, entre mesa y mesa', 'El encargado', 'Se contestan al cerrar', 'Muchos se quedan sin contestar'] },
        { id: 'detalle', texto: '¿Dónde apuntáis hoy las reservas y qué os preguntan más?', libre: true,
          ejemplo: 'Por ejemplo: en una libreta y en la app de reservas; preguntan por el menú de grupo y los alérgenos.' },
      ],
    },
    // Reel "Lo que te han contado de un programa propio" (26-nov-2026): software a medida, mito y realidad (plazo, licencias por usuario y cambiarlo todo)
    medida: {
      titulo: 'Un programa hecho a tu forma de trabajar.',
      sub: 'Cuéntanos qué lleváis hoy en hojas de cálculo o en programas que no se hablan, y te decimos si compensa hacerlo a medida o si te vale una herramienta estándar. Te escribimos en menos de 24 horas.',
      preguntas: [
        { id: 'hoy', texto: '¿Dónde lo lleváis hoy?', multi: true,
          opciones: ['Hojas de cálculo', 'Un programa genérico', 'Varios programas que no se hablan', 'Correo y WhatsApp', 'Papel'] },
        { id: 'equipo', texto: '¿Cuántas personas lo usarían?',
          opciones: ['De 1 a 5', 'De 6 a 15', 'De 16 a 50', 'Más de 50'] },
        { id: 'detalle', texto: '¿Qué tarea te gustaría tener en una sola pantalla?', libre: true,
          ejemplo: 'Por ejemplo: pedidos, incidencias y avisos al cliente, que hoy están en tres sitios.' },
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
