/* ============================================================
   CHILIE — Home
   Barra que toma el color de cada capítulo, entradas por sección,
   lámparas de la centralita, asistente en vivo, etapas y cierre.
   ============================================================ */

(function () {
  'use strict';

  const API_BASE = 'https://chilie-chatbot.onrender.com';
  // En local, el chat usa el servidor de server/ (puerto 3001) si está levantado
  const CHAT_API = location.hostname === 'localhost' ? 'http://localhost:3001' : API_BASE;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── La barra toma el campo que tiene debajo ───────────────
  const bar = document.getElementById('bar');
  const fields = [...document.querySelectorAll('main [data-field], footer[data-field]')];

  function fieldUnderBar() {
    const y = bar.offsetHeight / 2;
    let current = 'white';
    for (const el of fields) {
      const r = el.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) current = el.dataset.field;
    }
    // El hero son dos campos: la barra está siempre sobre el de arriba
    if (window.scrollY < window.innerHeight * 0.4) current = 'white';
    if (bar.dataset.field !== current) bar.dataset.field = current;
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { fieldUnderBar(); ticking = false; });
  }, { passive: true });
  fieldUnderBar();

  // ── Menú en teléfono ───────────────────────────────────────
  const menuBtn = document.getElementById('barMenu');
  const links = document.getElementById('barLinks');
  menuBtn?.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Cerrar' : 'Menú';
  });

  // ── Entradas: título, texto, imagen, escalonados ──────────
  const groups = [
    ['.jacks', '.jack-list li, .flow'],
    ['.stair', '.stair-note'],
    ['.board-wrap', '.tile'],
    ['.ask', '.ask-lead, .ask-try, .ask-example, .chat'],
    ['.about', '.about-lead, .about-facts, .person'],
    ['.faq', '.faq-list details'],
    ['.close', '.close-lead, .close-form'],
    ['.foot', '.foot-tile'],
    // Páginas interiores
    ['.page-hero', '.page-sub, .svc-index a'],
    ['.svc', '.svc-lead, .svc-features > div, .svc-for, .svc-visual'],
    ['.combo', '.combo-lead'],
    ['.tools', '.tools-list'],
    ['.lab', '.lab-pick, .lab-chat'],
    ['.voice', '.voice-lead, .voice-btn'],
    ['.team', '.founder'],
    ['.origin', '.origin-step'],
    ['.ways', '.way'],
    ['.stack', '.stack-list, .stack-note'],
  ];
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.querySelectorAll('.rise').forEach(el => el.classList.add('is-in'));
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    for (const [sel, kids] of groups) {
      document.querySelectorAll(sel).forEach(section => {
        section.querySelectorAll(kids).forEach((el, i) => {
          el.classList.add('rise');
          el.style.setProperty('--i', Math.min(i, 8));
        });
        io.observe(section);
      });
    }
  } else {
    document.querySelectorAll('.svc-visual').forEach(el => el.classList.add('is-in'));
  }

  // ── Titulares que suben palabra a palabra desde una máscara ─
  const wordTargets = [...document.querySelectorAll('.hero-title, .page-title, .jacks-title, .stair-text > span, .proc-title, .tile--title h2, .ask-title, .about-title, .faq-title, .close-title, .svc-title, .combo-title, .tools-title, .voice-title, .origin-title, .ways-title, .stack-title, .founder-name')];
  function splitWords(el) {
    let n = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
            wi.style.setProperty('--wi', n++);
            w.append(wi); frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
  }
  if (!reduceMotion) {
    wordTargets.forEach(el => { splitWords(el); el.classList.add('words'); });
    // La portada entra sin esperar al scroll
    const lead = document.querySelector('.hero-title, .page-title');
    requestAnimationFrame(() => lead?.classList.add('is-in'));
    if ('IntersectionObserver' in window) {
      const wio = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); wio.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -10% 0px' });
      wordTargets.filter(el => el !== lead).forEach(el => wio.observe(el));
    } else wordTargets.forEach(el => el.classList.add('is-in'));
  }

  // ── Servicios: la vía de la cita se dibuja al aparecer ────
  const rail = document.getElementById('comboRail');
  if (rail) {
    [...rail.children].forEach((li, k) => li.style.setProperty('--k', k));
    if (reduceMotion || !('IntersectionObserver' in window)) rail.classList.add('is-on');
    else {
      const rio = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { rail.classList.add('is-on'); rio.disconnect(); }
      }, { rootMargin: '0px 0px -20% 0px' });
      rio.observe(rail);
    }
  }

  // ── Lámparas: se encienden en orden, como llamadas entrando ─
  const lamps = [...document.querySelectorAll('.lamp')];
  if (lamps.length) {
    if (reduceMotion) {
      lamps.forEach(l => l.classList.add('is-lit'));
    } else {
      let n = 0;
      setInterval(() => {
        lamps.forEach((l, i) => l.classList.toggle('is-lit', i === n % lamps.length || i === (n + 2) % lamps.length));
        n++;
      }, 1400);
    }
  }

  // ── Portada: el agente atiende una llamada, contado en cuatro fases ─
  // Llamada entrante → conversación subtitulada → cita → confirmación y agenda
  const vx = document.getElementById('vx');
  if (vx) {
    const who = document.getElementById('vxWho');
    const line = document.getElementById('vxLine');
    const cards = [...vx.querySelectorAll('.vx-card')];
    const steps = [...vx.querySelectorAll('.vx-steps li')];
    const script = [
      ['them', 'Laura', 'Hola, quería pedir cita para una limpieza.'],
      ['us', 'Agente de Chilie', 'Claro. Tengo hueco el jueves a las 11:30. ¿Te la reservo?'],
      ['them', 'Laura', 'Perfecto, sí.'],
    ];
    let timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const step = n => steps.forEach((li, k) => li.classList.toggle('is-on', k < n));

    // Cada frase entra palabra a palabra, desde un leve desenfoque
    function say(by, name, text) {
      line.classList.add('is-leaving');
      at(320, () => {
        line.classList.remove('is-on', 'is-leaving');
        line.dataset.by = by;
        line.innerHTML = text.split(' ').map((w, k) => `<span class="w" style="--k:${k}">${w}</span>`).join(' ');
        who.textContent = name;
        vx.dataset.s = by;
        void line.offsetWidth; // fija el estado inicial para que la entrada se anime
        line.classList.add('is-on');
      });
    }
    function finalState() {
      vx.dataset.s = 'done';
      line.classList.remove('is-on');
      cards.forEach(c => c.classList.add('is-on'));
      step(4);
    }
    function reset() {
      timers.forEach(clearTimeout); timers = [];
      vx.classList.remove('is-out');
      vx.dataset.s = 'ring';
      who.textContent = 'Llamada entrante · Laura Martín';
      line.className = 'vx-line'; line.innerHTML = '';
      cards.forEach(c => c.classList.remove('is-on'));
      step(1);
    }
    function run() {
      reset();
      at(2600, () => { step(2); say(...script[0]); });
      at(5200, () => say(...script[1]));
      at(8600, () => say(...script[2]));
      at(10400, () => { line.classList.add('is-leaving'); vx.dataset.s = 'done'; step(3); });
      at(10900, () => cards[0].classList.add('is-on'));
      at(11900, () => { cards[1].classList.add('is-on'); step(4); });
      at(12700, () => cards[2].classList.add('is-on'));
      at(16200, () => vx.classList.add('is-out'));
      at(16900, run);
    }

    // ?hero=done congela el final (para revisar el diseño)
    const freeze = new URLSearchParams(location.search).get('hero');
    if (reduceMotion || freeze === 'done') finalState();
    else if (freeze === 'us') { step(2); say(...script[1]); }
    else if ('IntersectionObserver' in window) {
      let running = false;
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; run(); }
        else if (!e.isIntersecting && running) { running = false; reset(); }
      }, { threshold: 0.3 }).observe(vx);
    } else run();
  }

  // ── El tablero vive mientras se ve ────────────────────────
  const board = document.querySelector('.board');
  const sw = document.querySelector('.ui-switch');
  const callState = document.querySelector('.ui-call-state');
  const callRes = document.querySelector('.ui-call-res');
  const bubbles = [...document.querySelectorAll('.ui-bubble')];
  const waitChip = document.querySelector('.ui-chip--wait');
  const mailState = document.querySelector('.ui-mail-state');
  const figure = document.querySelector('.ui-figure-num');
  let boardTimers = [];
  let figureDone = false;

  function countUp(el, to, ms) {
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / ms);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function boardCycle() {
    // Llamada: entra, se atiende, se reserva
    callState.lastChild.textContent = 'Llamada entrante…';
    callState.classList.add('is-ringing');
    callRes.classList.add('is-hidden');
    boardTimers.push(setTimeout(() => {
      callState.lastChild.textContent = 'Llamada atendida';
      callState.classList.remove('is-ringing');
    }, 1600));
    boardTimers.push(setTimeout(() => callRes.classList.remove('is-hidden'), 2400));
    // Chat: pregunta y respuesta
    bubbles.forEach(b => b.classList.add('is-hidden'));
    boardTimers.push(setTimeout(() => bubbles[0]?.classList.remove('is-hidden'), 500));
    boardTimers.push(setTimeout(() => bubbles[1]?.classList.remove('is-hidden'), 1900));
    // Correo: se escribe solo
    mailState.textContent = 'Escribiendo respuesta…';
    boardTimers.push(setTimeout(() => { mailState.textContent = 'Respondido automáticamente'; }, 2200));
    // Agenda: la cita pendiente se confirma
    waitChip.textContent = 'Pendiente';
    waitChip.classList.add('ui-chip--wait');
    boardTimers.push(setTimeout(() => { waitChip.textContent = 'Confirmada'; waitChip.classList.remove('ui-chip--wait'); }, 3000));
    // Recordatorio
    sw.classList.add('is-off');
    boardTimers.push(setTimeout(() => sw.classList.remove('is-off'), 1200));
  }

  if (board && !reduceMotion && 'IntersectionObserver' in window) {
    // El texto de estado de la llamada va en su propio nodo para poder cambiarlo
    callState.append(document.createTextNode(''));
    callState.childNodes.forEach(n => { if (n.nodeType === 3 && n !== callState.lastChild) n.textContent = ''; });
    let loop;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!figureDone) { figureDone = true; countUp(figure, 37, 1600); }
        boardCycle();
        loop = setInterval(boardCycle, 6500);
      } else {
        clearInterval(loop);
        boardTimers.forEach(clearTimeout);
        boardTimers = [];
      }
    }, { threshold: 0.25 }).observe(board);
  }

  // ── Asistente en vivo: un chat de verdad contra el bot ────
  const askForm = document.getElementById('askForm');
  const askInput = document.getElementById('askInput');
  const askLog = document.getElementById('askLog');
  const askSend = askForm?.querySelector('.chat-send');
  const history = [];
  let waiting = false;

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function format(s) {
    return esc(s).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }
  function addMsg(html, who) {
    const p = document.createElement('p');
    p.className = 'msg msg--' + who;
    p.innerHTML = html;
    askLog.appendChild(p);
    askLog.scrollTop = askLog.scrollHeight;
    return p;
  }

  async function ask(question) {
    question = question.trim();
    if (waiting || !question) return;
    waiting = true;
    askSend.disabled = true;
    addMsg(esc(question), 'user');
    history.push({ role: 'user', content: question });
    if (history.length > 16) history.splice(0, history.length - 16);
    const out = addMsg('', 'bot');
    out.classList.add('msg--typing');

    try {
      let reply;
      try {
        reply = await streamReply(out);
      } catch (err) {
        // Servidor sin streaming (aún no desplegado): respuesta completa de una vez
        if (err.name !== 'NoStream') throw err;
        const res = await fetch(API_BASE + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: AbortSignal.timeout(25000),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'error');
        reply = data.reply || '';
        await typeOut(out, reply.replace(/\[BOOK_CALL:[^\]]+\]/, '').trim());
      }

      history.push({ role: 'assistant', content: reply });
      const book = reply.match(/\[BOOK_CALL:name=([^,\]]+),email=([^\]]+)\]/);
      out.classList.remove('msg--typing');
      if (book) {
        const url = 'https://calendly.com/chilieagencia/30min?name=' + encodeURIComponent(book[1].trim()) + '&email=' + encodeURIComponent(book[2].trim());
        out.insertAdjacentHTML('beforeend', `<br><a class="btn btn-ink" href="${url}" target="_blank" rel="noopener">Elegir hora para la llamada</a>`);
      }
    } catch (err) {
      history.pop();
      out.classList.remove('msg--typing');
      out.innerHTML = 'Ahora mismo no puedo responder. Escríbenos a <a href="mailto:chilieagencia@gmail.com">chilieagencia@gmail.com</a> y te contestamos en menos de 24 horas.';
    }
    askLog.scrollTop = askLog.scrollHeight;
    waiting = false;
    askSend.disabled = false;
  }

  // Lee la respuesta a trozos y la pinta según llega. Devuelve el texto completo.
  async function streamReply(out) {
    let res;
    try {
      res = await fetch(CHAT_API + '/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      // Servidor local apagado: se usa el de producción
      if (CHAT_API !== API_BASE && err.name === 'TypeError') { const e = new Error('no stream'); e.name = 'NoStream'; throw e; }
      throw err;
    }
    const type = res.headers.get('content-type') || '';
    if (res.status === 404 || (res.ok && !type.includes('text/event-stream'))) {
      const e = new Error('no stream'); e.name = 'NoStream'; throw e;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'error');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    let streamDone = false;
    let cancelled = false;

    // Máquina de escribir: enseña lo recibido letra a letra a ritmo constante
    // (unas 60 letras por segundo) y acelera solo si se acumula mucho texto.
    let shown = 0;
    let last = performance.now();
    let carry = 0;
    const typed = new Promise(resolve => {
      const tick = now => {
        if (cancelled) return resolve();
        // El marcador de reserva nunca se enseña, ni a medias
        const visible = full.replace(/\[BOOK[\s\S]*$/, '').trimEnd();
        const backlog = visible.length - shown;
        if (backlog > 0) {
          const perSecond = reduceMotion ? 1e6 : Math.max(60, backlog * 3);
          carry += ((now - last) / 1000) * perSecond;
          const n = Math.min(backlog, Math.floor(carry));
          if (n > 0) {
            carry -= n;
            shown += n;
            out.innerHTML = format(visible.slice(0, shown));
            askLog.scrollTop = askLog.scrollHeight;
          }
        } else carry = 0;
        last = now;
        if (streamDone && shown >= visible.length) resolve();
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

  function typeOut(el, text) {
    if (reduceMotion) { el.classList.remove('msg--typing'); el.innerHTML = format(text); return Promise.resolve(); }
    // La respuesta ya ha llegado entera: se escribe en 500 ms como mucho, sea cual sea su largo
    return new Promise(resolve => {
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / 500);
        el.innerHTML = format(text.slice(0, Math.ceil(text.length * p)));
        askLog.scrollTop = askLog.scrollHeight;
        if (p < 1) requestAnimationFrame(step);
        else { el.classList.remove('msg--typing'); resolve(); }
      };
      requestAnimationFrame(step);
    });
  }

  askForm?.addEventListener('submit', e => {
    e.preventDefault();
    const q = askInput.value;
    askInput.value = '';
    ask(q);
  });
  document.querySelectorAll('.ask-example').forEach(btn => {
    btn.addEventListener('click', () => { ask(btn.textContent); askInput.focus({ preventScroll: true }); });
  });

  // ── Proceso: la secuencia avanza con el scroll ────────────
  const proc = document.getElementById('proceso');
  const procStages = [...document.querySelectorAll('.proc-stage')];
  const procButtons = [...document.querySelectorAll('#procNav button')];
  const procBar = document.getElementById('procBar');
  const pinned = () => window.matchMedia('(min-width: 761px)').matches;
  let procIndex = -1;

  function setProcStage(i) {
    if (i === procIndex) return;
    procIndex = i;
    procStages.forEach((s, n) => s.classList.toggle('is-active', n === i));
    procButtons.forEach((b, n) => {
      if (n === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
  }

  function procProgress() {
    if (!proc || !pinned()) return;
    const r = proc.getBoundingClientRect();
    const total = proc.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    procBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    setProcStage(Math.min(procStages.length - 1, Math.floor(p * procStages.length)));
  }

  if (proc) {
    if (pinned()) setProcStage(0);
    else procStages.forEach(s => s.classList.add('is-active'));
    let procTick = false;
    window.addEventListener('scroll', () => {
      if (procTick) return;
      procTick = true;
      requestAnimationFrame(() => { procProgress(); procTick = false; });
    }, { passive: true });
    window.addEventListener('resize', () => {
      if (!pinned()) procStages.forEach(s => s.classList.add('is-active'));
      else { procIndex = -1; procProgress(); }
    });
    procProgress();
    // Las pestañas llevan al punto de la secuencia de cada etapa
    procButtons.forEach((b, n) => b.addEventListener('click', () => {
      const total = proc.offsetHeight - window.innerHeight;
      const top = proc.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + total * ((n + 0.5) / procStages.length), behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
  }

  // Las animaciones del diagrama se paran si el usuario pide menos movimiento
  if (reduceMotion) document.querySelectorAll('.flow svg').forEach(svg => svg.pauseAnimations?.());

  // ── Cierre: correo para que te llamemos ───────────────────────────────
  const closeForm = document.getElementById('closeForm');
  const closeEmail = document.getElementById('closeEmail');
  const closeHelp = document.getElementById('closeHelp');
  const closeSend = closeForm?.querySelector('.close-send');
  const helpDefault = closeHelp?.innerHTML;

  closeEmail?.addEventListener('input', () => {
    closeEmail.removeAttribute('aria-invalid');
    closeHelp.className = 'close-help';
    closeHelp.innerHTML = helpDefault;
  });

  closeForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = closeEmail.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      closeEmail.setAttribute('aria-invalid', 'true');
      closeHelp.className = 'close-help is-error';
      closeHelp.textContent = 'Revisa el correo: falta la @ o el dominio (por ejemplo, nombre@empresa.es).';
      closeEmail.focus();
      return;
    }
    closeSend.disabled = true;
    closeHelp.className = 'close-help';
    closeHelp.textContent = 'Enviando…';
    try {
      const res = await fetch(API_BASE + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Contacto rápido (home)',
          email,
          mensaje: 'Ha dejado su correo en la home para que le llamemos.',
          como: 'Formulario rápido de la home',
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error();
      closeHelp.className = 'close-help is-ok';
      closeHelp.textContent = 'Recibido. Te escribimos en menos de 24 horas para buscar un hueco.';
      closeEmail.value = '';
    } catch {
      closeHelp.className = 'close-help is-error';
      closeHelp.innerHTML = 'No se ha podido enviar. Escríbenos a <a href="mailto:chilieagencia@gmail.com?subject=Quiero%20que%20me%20llam%C3%A9is">chilieagencia@gmail.com</a> y te contestamos igual.';
    }
    closeSend.disabled = false;
  });

  // ── Fotos del equipo: si aún no están, quedan las iniciales ─
  document.querySelectorAll('img.face').forEach(img => {
    const drop = () => img.remove();
    if (img.complete && img.naturalWidth === 0) drop();
    else img.addEventListener('error', drop);
  });

  // ── Videollamada: el turno de palabra pasa de uno a otro ──
  const callTiles = [...document.querySelectorAll('.call-grid .call-tile')];
  if (callTiles.length === 2 && !reduceMotion) {
    let turn = 0;
    setInterval(() => {
      if (!callTiles[0].closest('.proc-stage')?.classList.contains('is-active')) return;
      turn = 1 - turn;
      callTiles.forEach((t, n) => t.classList.toggle('is-speaking', n === turn));
    }, 2600);
  }

  // ── Hora de Madrid en el pie ──────────────────────────────
  const clock = document.getElementById('clock');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 30000);
  }

  // ── Cookies ───────────────────────────────────────────────
  const banner = document.getElementById('cookieBanner');
  try {
    if (banner && localStorage.getItem('cookie_consent') === null) {
      banner.hidden = false;
      const done = v => { try { localStorage.setItem('cookie_consent', v); } catch {} banner.hidden = true; };
      document.getElementById('cookieAccept').addEventListener('click', () => done('accepted'));
      document.getElementById('cookieReject').addEventListener('click', () => done('rejected'));
    }
  } catch {}
})();
