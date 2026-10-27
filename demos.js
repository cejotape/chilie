/* ============================================================
   CHILIE — Demos
   Un solo chat que cambia de negocio. Cada negocio guarda su
   propia conversación y responde letra a letra (streaming).
   ============================================================ */

(function () {
  'use strict';

  const API_BASE = 'https://chilie-chatbot.onrender.com';
  const CHAT_API = location.hostname === 'localhost' ? 'http://localhost:3001' : API_BASE;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Negocios de ejemplo: sus prompts viven en server/server.js (DEMO_SYSTEM_PROMPTS)
  const DEMOS = [
    { id: 'vet', ini: 'VV', name: 'Clínica Veterinaria Vidal', sector: 'Clínica veterinaria', where: 'Madrid',
      hi: '¡Hola! Soy el asistente virtual de Clínica Veterinaria Vidal. Puedo ayudarte con nuestros servicios, precios, horarios y cómo pedir cita. ¿En qué te ayudo?',
      qr: ['¿Cuánto cuesta vacunar a mi perro?', '¿Tenéis urgencias?', 'Quiero pedir una cita'] },
    { id: 'dental', ini: 'DA', name: 'Clínica Dental Azul', sector: 'Clínica dental', where: 'Barcelona',
      hi: 'Hola, soy el asistente de Clínica Dental Azul. La primera visita es gratuita e incluye diagnóstico completo. ¿Tienes alguna consulta?',
      qr: ['¿La primera visita es gratis?', '¿Cuánto cuesta un implante?', '¿Tenéis financiación?'] },
    { id: 'real', ini: 'IC', name: 'Inmobiliaria Cerro', sector: 'Inmobiliaria', where: 'Sur de Madrid',
      hi: 'Hola, soy el asistente de Inmobiliaria Cerro. Trabajo en Leganés, Getafe, Fuenlabrada y Móstoles. ¿Buscas comprar, vender o alquilar?',
      qr: ['¿Cuánto cuesta un piso en Leganés?', '¿Cuáles son vuestros honorarios?', '¿Ayudáis con la hipoteca?'] },
    { id: 'ecom', ini: 'TN', name: 'Tienda Nativa', sector: 'Tienda online', where: 'Online',
      hi: '¡Hola! Soy el asistente de Tienda Nativa. Puedo ayudarte con tu pedido, envíos, devoluciones y nuestros productos. ¿En qué te ayudo?',
      qr: ['¿Cuánto tarda mi pedido?', '¿Cómo hago una devolución?', '¿Los productos son naturales?'] },
    { id: 'restaurant', ini: 'RV', name: 'Restaurante Villarejo', sector: 'Restaurante', where: 'Bilbao',
      hi: '¡Bienvenido a Restaurante Villarejo! Puedo ayudarte con la carta, precios, horarios, alérgenos y reservas. ¿Qué necesitas?',
      qr: ['¿Cuánto cuesta el menú del día?', 'Quiero reservar para 4', '¿Tenéis opciones vegetarianas?'] },
    { id: 'law', ini: 'MA', name: 'Martínez & Asociados', sector: 'Despacho de abogados', where: 'Sevilla',
      hi: 'Buenas, soy el asistente del Despacho Martínez & Asociados. Te oriento sobre derecho laboral, civil y de familia, y sobre cómo trabajamos. ¿En qué puedo ayudarte?',
      qr: ['Tengo un despido, ¿podéis ayudarme?', '¿Cuánto cuesta un divorcio?', '¿Hacéis primera consulta?'] },
    { id: 'hair', ini: 'BN', name: 'Barbería Nómada', sector: 'Barbería', where: 'Malasaña, Madrid',
      hi: '¡Buenas! Soy el asistente de Barbería Nómada. Te cuento servicios, precios, barberos y cómo reservar tu turno. ¿Qué necesitas?',
      qr: ['¿Cuánto cuesta un corte?', '¿Cómo reservo turno?', '¿Hacéis barba también?'] },
    { id: 'gym', ini: 'GF', name: 'Gym Factor', sector: 'Gimnasio', where: 'Valencia',
      hi: '¡Hola! Soy el asistente de Gym Factor. Te informo de tarifas, clases y entrenamiento personal. ¿Qué te gustaría saber?',
      qr: ['¿Cuánto cuesta la mensualidad?', '¿Qué clases tenéis?', '¿Tenéis entrenador personal?'] },
    { id: 'academy', ini: 'AI', name: 'Academia Impulso Digital', sector: 'Formación online', where: 'Online',
      hi: '¡Hola! Soy el asistente de Academia Impulso Digital. Te ayudo a encontrar el curso que encaja contigo y te cuento precios y financiación. ¿Qué quieres aprender?',
      qr: ['¿Cuál es el mejor curso para empezar?', '¿Hay financiación?', '¿Ayudáis a encontrar trabajo?'] },
    { id: 'home', ini: 'RA', name: 'Reformas Alcázar', sector: 'Reformas', where: 'Zaragoza',
      hi: 'Hola, soy el asistente de Reformas Alcázar. Te oriento sobre precios, plazos y cómo funciona la visita técnica gratuita. ¿Qué reforma tienes en mente?',
      qr: ['¿Cuánto cuesta reformar un baño?', '¿Cuánto tarda una reforma?', '¿Hacéis visita gratuita?'] },
  ];

  const list = document.getElementById('labList');
  const chatEl = document.querySelector('.lab-chat');
  const log = document.getElementById('labLog');
  const qrEl = document.getElementById('labQr');
  const form = document.getElementById('labForm');
  const input = document.getElementById('labInput');
  const sendBtn = form.querySelector('.chat-send');
  const avEl = document.getElementById('labAv');
  const nameEl = document.getElementById('labName');
  const whereEl = document.getElementById('labWhere');

  // Cada negocio guarda su conversación y lo que se ve en pantalla
  const state = {};
  DEMOS.forEach(d => { state[d.id] = { history: [{ role: 'assistant', content: d.hi }], html: '', asked: false }; });
  let current = null;
  let waiting = false;

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const format = s => esc(s).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  function addMsg(html, who) {
    const p = document.createElement('p');
    p.className = 'msg msg--' + who;
    p.innerHTML = html;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    return p;
  }

  function renderQuickReplies(d) {
    qrEl.innerHTML = '';
    if (state[d.id].asked) return;
    d.qr.forEach(q => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = q;
      b.addEventListener('click', () => send(q));
      qrEl.appendChild(b);
    });
  }

  function select(d, focus) {
    if (waiting || (current && current.id === d.id)) return;
    if (current) state[current.id].html = log.innerHTML;
    current = d;

    [...list.children].forEach(btn => {
      const on = btn.dataset.id === d.id;
      btn.setAttribute('aria-selected', String(on));
      btn.tabIndex = on ? 0 : -1;
    });

    const apply = () => {
      avEl.textContent = d.ini;
      nameEl.textContent = d.name;
      whereEl.textContent = 'Asistente virtual · ' + d.where;
      log.innerHTML = state[d.id].html;
      if (!log.innerHTML) addMsg(format(d.hi), 'bot');
      log.scrollTop = log.scrollHeight;
      renderQuickReplies(d);
      chatEl.classList.remove('is-switching');
    };
    if (reduceMotion || !log.innerHTML) apply();
    else { chatEl.classList.add('is-switching'); setTimeout(apply, 180); }
    if (focus) input.focus({ preventScroll: true });
  }

  // Lista de negocios como pestañas (flechas para moverse)
  DEMOS.forEach(d => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lab-item';
    b.role = 'tab';
    b.dataset.id = d.id;
    b.setAttribute('aria-controls', 'labLog');
    b.innerHTML = `<span class="lab-av" aria-hidden="true">${d.ini}</span><b>${esc(d.name)}</b><small>${esc(d.sector)} · ${esc(d.where)}</small>`;
    b.addEventListener('click', () => select(d, false));
    list.appendChild(b);
  });
  list.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const i = DEMOS.findIndex(d => d.id === current.id);
    const next = DEMOS[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : DEMOS.length - 1)) % DEMOS.length];
    select(next, false);
    list.querySelector(`[data-id="${next.id}"]`).focus();
  });

  // Respuesta en streaming, escrita letra a letra (mismo ritmo que el chat de la home)
  async function streamReply(out, d, history) {
    let res;
    try {
      res = await fetch(CHAT_API + '/api/demo-chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoId: d.id, messages: history }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      if (CHAT_API !== API_BASE && err.name === 'TypeError') return null;
      throw err;
    }
    const type = res.headers.get('content-type') || '';
    if (res.status === 404 || (res.ok && !type.includes('text/event-stream'))) return null;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'error');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', full = '', shown = 0, carry = 0, last = performance.now();
    let streamDone = false, cancelled = false;

    const typed = new Promise(resolve => {
      const tick = now => {
        if (cancelled) return resolve();
        const backlog = full.length - shown;
        if (backlog > 0) {
          carry += ((now - last) / 1000) * (reduceMotion ? 1e6 : Math.max(60, backlog * 3));
          const n = Math.min(backlog, Math.floor(carry));
          if (n > 0) {
            carry -= n;
            shown += n;
            out.innerHTML = format(full.slice(0, shown));
            log.scrollTop = log.scrollHeight;
          }
        } else carry = 0;
        last = now;
        if (streamDone && shown >= full.length) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();
        for (const ev of events) {
          const line = ev.split('\n').find(l => l.startsWith('data: '));
          if (!line) continue;
          const msg = JSON.parse(line.slice(6));
          if (msg.error) throw new Error(msg.error);
          if (msg.t) full += msg.t;
        }
      }
    } catch (err) {
      cancelled = true;
      throw err;
    } finally {
      streamDone = true;
    }
    await typed;
    return full;
  }

  async function send(text) {
    text = text.trim();
    if (waiting || !text) return;
    const d = current;
    const st = state[d.id];
    waiting = true;
    sendBtn.disabled = true;
    st.asked = true;
    qrEl.innerHTML = '';
    addMsg(esc(text), 'user');
    st.history.push({ role: 'user', content: text });
    if (st.history.length > 16) st.history.splice(0, st.history.length - 16);
    const out = addMsg('', 'bot');
    out.classList.add('msg--typing');

    try {
      let reply = await streamReply(out, d, st.history);
      if (reply === null) {
        // Servidor sin streaming: respuesta completa de una vez
        const res = await fetch(API_BASE + '/api/demo-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demoId: d.id, messages: st.history }),
          signal: AbortSignal.timeout(25000),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'error');
        reply = data.reply || '';
        out.innerHTML = format(reply);
      }
      st.history.push({ role: 'assistant', content: reply });
    } catch (err) {
      st.history.pop();
      out.textContent = 'Ahora mismo no puedo responder. Inténtalo de nuevo en un momento.';
    }
    out.classList.remove('msg--typing');
    log.scrollTop = log.scrollHeight;
    waiting = false;
    sendBtn.disabled = false;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value;
    input.value = '';
    send(q);
  });

  // Se puede entrar directamente a un negocio con /demos#dental
  const fromHash = DEMOS.find(d => d.id === location.hash.slice(1));
  select(fromHash || DEMOS[0], false);
})();
