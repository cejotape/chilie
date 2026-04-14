/* ================================================
   CHILIE IA — script.js
   Progressive enhancement: content visible by default.
   GSAP hides elements programmatically after confirming
   libraries loaded — never via static CSS alone.
   ================================================ */

// ── Lenis smooth scroll ────────────────────────────────────
// CRITICAL: gsap.ticker ONLY — never mix with requestAnimationFrame
let lenis;
if (typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.85,
  });
  if (typeof gsap !== 'undefined') {
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
  }
}

// ── Navbar ─────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Mobile nav ─────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );
}

// ── Custom cursor ──────────────────────────────────────────
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
if (cursor && cursorRing && window.matchMedia('(hover:hover)').matches) {
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function tick() {
    rx += (mx - rx) * 0.14; ry += (my - ry) * 0.14;
    cursor.style.left     = mx + 'px'; cursor.style.top     = my + 'px';
    cursorRing.style.left = rx + 'px'; cursorRing.style.top = ry + 'px';
    requestAnimationFrame(tick);
  })();
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.classList.add('on'); cursorRing.classList.add('on'); });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('on'); cursorRing.classList.remove('on'); });
  });
}

// ── Scroll animations ──────────────────────────────────────
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced) {

    // Hero entrance: plays on load, not on scroll
    const heroEls = document.querySelectorAll('.hero-content .fade-up');
    if (heroEls.length) {
      gsap.set(heroEls, { opacity: 0, y: 40 });
      gsap.to(heroEls, {
        opacity: 1, y: 0,
        duration: 1.25, ease: 'power3.out', stagger: 0.18, delay: 0.2,
        clearProps: 'opacity,transform',
      });
    }

    // Section-grouped reveals
    // Each section's reveal children are hidden by GSAP (not CSS) and
    // revealed once as a group when the section enters. once:true means
    // they stay visible forever — no re-triggering on scroll back.
    const SECTION_SEL = [
      '.section', '.section-alt', '.statement', '.stats-section',
      '.cta-block', '.page-hero', '.contact-section',
    ].join(',');

    document.querySelectorAll(SECTION_SEL).forEach(section => {
      const els = Array.from(
        section.querySelectorAll('.fade-up, .section-title, .section-sub')
      ).filter(el => !el.closest('.hero-content'));
      if (!els.length) return;

      gsap.set(els, { opacity: 0, y: 30 });
      ScrollTrigger.create({
        trigger: section,
        start: 'top 82%',
        once: true,
        onEnter() {
          gsap.to(els, {
            opacity: 1, y: 0,
            duration: 1.15, ease: 'power3.out', stagger: 0.09,
            clearProps: 'opacity,transform',
          });
        },
      });
    });

    // Stats counters
    document.querySelectorAll('.count-val[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter() {
          const o = { v: 0 };
          gsap.to(o, {
            v: target, duration: 1.8, ease: 'power2.out',
            onUpdate: () => { el.textContent = Math.round(o.v); },
          });
        },
      });
    });

    // Servicios: one-time fade-in per section + image parallax
    // The parallax (scrub) makes images drift at a slower rate than text,
    // giving the "Apple-style depth" effect as you scroll through services.
    document.querySelectorAll('.service-detail-section').forEach(section => {
      const fadeEls = Array.from(
        section.querySelectorAll('.detail-info, .visual-box .fade-up, .check-list li, .svc-n')
      );
      if (fadeEls.length) {
        gsap.set(fadeEls, { opacity: 0, y: 36 });
        ScrollTrigger.create({
          trigger: section, start: 'top 80%', once: true,
          onEnter() {
            gsap.to(fadeEls, {
              opacity: 1, y: 0,
              duration: 1.2, ease: 'power3.out', stagger: 0.1,
              clearProps: 'opacity,transform',
            });
          },
        });
      }

      // Image parallax — skip demo chat widgets, only real image boxes
      const visual = section.querySelector('.visual-box:not(.is-demo)');
      if (visual) {
        gsap.to(visual, {
          y: -55, ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom', end: 'bottom top',
            scrub: 2,
          },
        });
      }
    });

    // Process steps: staggered line-by-line
    document.querySelectorAll('.process-list').forEach(list => {
      const steps = list.querySelectorAll('.process-step');
      gsap.set(steps, { opacity: 0, y: 24 });
      ScrollTrigger.create({
        trigger: list, start: 'top 80%', once: true,
        onEnter() {
          gsap.to(steps, {
            opacity: 1, y: 0,
            duration: 0.9, ease: 'power3.out', stagger: 0.13,
            clearProps: 'opacity,transform',
          });
        },
      });
    });

  } // end if !prefersReduced
} // end if gsap


// ══════════════════════════════════════════════════════════
//  SERVICE DEMO WIDGETS
//  Animated scripted conversations inside .svc-chat[data-demo]
//  Triggered once on scroll-into-view, then loop indefinitely.
// ══════════════════════════════════════════════════════════

(function initDemos() {
  const DEMOS = {
    '1': [
      { role: 'bot',  text: '¡Hola! Soy el asistente de soporte. ¿En qué puedo ayudarte?' },
      { role: 'user', text: '¿Cuál es vuestro horario de atención?' },
      { role: 'bot',  text: 'Atendemos de lunes a viernes de 9h a 18h. Fuera de ese horario, recibo tu consulta y te respondo en menos de 2 horas.' },
      { role: 'user', text: '¿Hacéis envíos a Canarias?' },
      { role: 'bot',  text: 'Sí, con envío estándar en 5-7 días hábiles. ¿Quieres que te prepare un presupuesto?' },
    ],
    '2': [
      { role: 'bot',  text: 'Hola, ¿buscas información sobre nuestros servicios para empresas?' },
      { role: 'user', text: 'Sí, gestionamos unos 200 leads al mes pero se nos escapan muchos.' },
      { role: 'bot',  text: 'Con 200 leads mensuales, la cualificación automática puede reducir ese escape en más del 60%. ¿Usáis algún CRM actualmente?' },
      { role: 'user', text: 'Sí, HubSpot.' },
      { role: 'bot',  text: 'Perfecto, integramos directamente con HubSpot. ¿Te envío la ficha técnica a tu email?' },
    ],
    '3': [
      { role: 'bot',  text: 'Hola, puedo ayudarte a gestionar tu cita. ¿Qué día te viene bien?' },
      { role: 'user', text: 'El próximo martes por la tarde.' },
      { role: 'bot',  text: 'Tengo disponibles las 16:00, las 17:00 y las 18:30. ¿Cuál prefieres?' },
      { role: 'user', text: 'Las 17:00 perfecto.' },
      { role: 'bot',  text: '✓ Cita confirmada: martes a las 17:00. Te envío recordatorio 24h antes.' },
    ],
    '4': [
      { role: 'bot',  text: '¡Hola! ¿Te ayudo con el estado de tu pedido?' },
      { role: 'user', text: 'Sí, el #84721. Lleva 4 días y no ha llegado.' },
      { role: 'bot',  text: 'Tu pedido salió ayer del almacén. Está en reparto y llega mañana antes de las 14h. El transportista ya tiene tu teléfono.' },
      { role: 'user', text: '¿Puedo cambiarlo a un punto de recogida?' },
      { role: 'bot',  text: 'Claro. Te mando el enlace para elegir el punto más cercano a tu dirección.' },
    ],
    '5': [
      { role: 'bot',  text: 'Soporte técnico — ¿cuál es el problema que tienes?' },
      { role: 'user', text: 'No puedo iniciar sesión, me dice "credenciales incorrectas".' },
      { role: 'bot',  text: '¿Estás usando el email con el que te registraste? A veces se usa un alias distinto.' },
      { role: 'user', text: 'Creo que sí, pero no estoy seguro.' },
      { role: 'bot',  text: 'Te envío un enlace de restablecimiento a todos los emails asociados a tu cuenta. Revisa también la carpeta de spam.' },
    ],
    '6': [
      { role: 'bot',  text: 'Hola 👋 Soy el asistente de Inmobiliaria Sol. ¿Buscas piso para comprar o alquilar?' },
      { role: 'user', text: 'Alquiler, para el verano.' },
      { role: 'bot',  text: 'Tengo disponibles 3 apartamentos en primera línea para julio y agosto. ¿Cuántas personas sois?' },
      { role: 'user', text: '4 adultos y 2 niños.' },
      { role: 'bot',  text: 'Perfecto. Tengo un apartamento de 3 habitaciones en Retiro y otro en Chamberí. ¿Prefieres alguna zona?' },
    ],
  };

  // Delays (ms) between messages
  const PAUSE_USER = 900;   // gap before user message appears
  const PAUSE_BOT  = 1400;  // typing indicator visible before bot message
  const PAUSE_LOOP = 10000;  // pause at end before restarting

  function createMsg(role, text, widget) {
    const el = document.createElement('div');
    el.className = 'svc-msg ' + (role === 'bot' ? 'bot' : 'user');
    el.textContent = text;
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    const body = widget.querySelector('.svc-chat-body');
    const typing = body.querySelector('.svc-typing');
    body.insertBefore(el, typing);
    // Trigger reflow then animate in
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function showTyping(widget) {
    widget.querySelector('.svc-typing').style.display = 'flex';
    const body = widget.querySelector('.svc-chat-body');
    body.scrollTop = body.scrollHeight;
  }

  function hideTyping(widget) {
    widget.querySelector('.svc-typing').style.display = 'none';
  }

  function clearMsgs(widget) {
    widget.querySelectorAll('.svc-msg').forEach(el => el.remove());
  }

  function playScript(widget, script, idx, onDone) {
    if (idx >= script.length) { onDone(); return; }
    const step = script[idx];

    if (step.role === 'bot') {
      showTyping(widget);
      setTimeout(() => {
        hideTyping(widget);
        createMsg('bot', step.text, widget);
        setTimeout(() => playScript(widget, script, idx + 1, onDone), PAUSE_USER);
      }, PAUSE_BOT);
    } else {
      createMsg('user', step.text, widget);
      setTimeout(() => playScript(widget, script, idx + 1, onDone), PAUSE_USER);
    }
  }

  function startDemo(widget) {
    clearMsgs(widget);
    hideTyping(widget);
    const key = widget.dataset.demo;
    const script = DEMOS[key];
    if (!script) return;
    // Brief pause before starting
    setTimeout(() => {
      playScript(widget, script, 0, () => {
        // Loop after pause
        setTimeout(() => startDemo(widget), PAUSE_LOOP);
      });
    }, 600);
  }

  document.querySelectorAll('.svc-chat[data-demo]').forEach(widget => {
    let started = false;
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: widget,
        start: 'top 85%',
        once: true,
        onEnter() {
          if (!started) { started = true; startDemo(widget); }
        },
      });
    } else {
      // Fallback: start immediately if ScrollTrigger unavailable
      startDemo(widget);
    }
  });
})();


// ══════════════════════════════════════════════════════════
//  BACKGROUND CANVAS SYSTEM
//  Fixed canvas with mix-blend-mode:screen — floating squares
//  glow over every section without blocking readability.
//  Driven by gsap.ticker so timing is consistent with Lenis.
// ══════════════════════════════════════════════════════════
(function initBackground() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  let W = 0, H = 0;
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // ── Palette ──────────────────────────────────────────
  // Three tiers of the accent — weighted toward brand blue.
  // Works with mix-blend-mode:screen on #080B13 backgrounds.
  const COLORS = [
    '#5B5EF5', '#5B5EF5', '#5B5EF5',  // brand accent (3×)
    '#8082FF', '#8082FF',              // lighter accent (2×)
    '#A8AAFF',                         // highlight (1×)
  ];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  // 4 depth layers: back (large/slow/dim) → front (small/fast/bright).
  // Mobile uses 3 lighter layers.
  const LAYERS = isMobile
    ? [
        { n: 4,  sMin: 16, sMax: 24, vMin: .06, vMax: .11, aMin: .14, aMax: .22 },
        { n: 8,  sMin: 6,  sMax: 13, vMin: .14, vMax: .23, aMin: .22, aMax: .32 },
        { n: 7,  sMin: 2,  sMax: 6,  vMin: .26, vMax: .38, aMin: .28, aMax: .40 },
      ]
    : [
        { n: 6,  sMin: 18, sMax: 28, vMin: .05, vMax: .10, aMin: .12, aMax: .18 },
        { n: 9,  sMin: 8,  sMax: 17, vMin: .12, vMax: .22, aMin: .18, aMax: .28 },
        { n: 13, sMin: 3,  sMax: 8,  vMin: .22, vMax: .36, aMin: .24, aMax: .36 },
        { n: 8,  sMin: 1,  sMax: 3,  vMin: .36, vMax: .52, aMin: .30, aMax: .44 },
      ];

  // All particles drift SE (≈45°) with a ±20° spread — composed, not random.
  const particles = LAYERS.flatMap(def =>
    Array.from({ length: def.n }, () => {
      const angle = Math.PI * 0.22 + rnd(-0.35, 0.35);
      const speed = rnd(def.vMin, def.vMax);
      return {
        x:  rnd(0, W),
        y:  rnd(0, H),
        s:  rnd(def.sMin, def.sMax),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot:        rnd(0, Math.PI * 2),
        rotSpeed:   isMobile ? 0 : rnd(-0.0018, 0.0018),
        phase:      rnd(0, Math.PI * 2),   // opacity sine phase
        phaseSpeed: rnd(0.003, 0.009),
        baseAlpha:  rnd(def.aMin, def.aMax),
        color:      COLORS[Math.floor(Math.random() * COLORS.length)],
        hollow:     Math.random() < 0.18,  // 18% wireframe squares
      };
    })
  );

  // ── Section-driven intensity ─────────────────────────
  const bgState = { boost: 1.0 };

  // Fade the canvas in after hero entrance has played
  if (typeof gsap !== 'undefined') {
    gsap.to(canvas, { opacity: 1, duration: 2.8, delay: 0.8, ease: 'power2.inOut' });
  } else {
    canvas.style.opacity = '1';
  }

  if (typeof ScrollTrigger !== 'undefined') {
    // Statement section: gentle lift
    const stmtEl = document.querySelector('.statement');
    if (stmtEl) {
      ScrollTrigger.create({
        trigger: stmtEl, start: 'top 62%', end: 'bottom 40%',
        onEnter:     () => gsap.to(bgState, { boost: 1.3, duration: 1.8, ease: 'power2.inOut' }),
        onLeave:     () => gsap.to(bgState, { boost: 1.0, duration: 1.8, ease: 'power2.inOut' }),
        onEnterBack: () => gsap.to(bgState, { boost: 1.3, duration: 1.8, ease: 'power2.inOut' }),
        onLeaveBack: () => gsap.to(bgState, { boost: 1.0, duration: 1.8, ease: 'power2.inOut' }),
      });
    }

    // Stats: one-time burst as counters animate
    const statsEl = document.querySelector('.stats-section');
    if (statsEl) {
      ScrollTrigger.create({
        trigger: statsEl, start: 'top 68%', once: true,
        onEnter() {
          gsap.to(bgState, {
            boost: 2.0, duration: 0.9, ease: 'power3.out',
            onComplete: () => gsap.to(bgState, { boost: 1.1, duration: 3.2, ease: 'power2.inOut' }),
          });
        },
      });
    }

    // CTA: sustained intensity while in view
    const ctaEl = document.querySelector('.cta-block');
    if (ctaEl) {
      ScrollTrigger.create({
        trigger: ctaEl, start: 'top 72%', end: 'bottom 28%',
        onEnter:     () => gsap.to(bgState, { boost: 1.8, duration: 2.2, ease: 'power2.inOut' }),
        onLeave:     () => gsap.to(bgState, { boost: 1.0, duration: 2.0, ease: 'power2.inOut' }),
        onEnterBack: () => gsap.to(bgState, { boost: 1.8, duration: 2.2, ease: 'power2.inOut' }),
        onLeaveBack: () => gsap.to(bgState, { boost: 1.0, duration: 2.0, ease: 'power2.inOut' }),
      });
    }
  }

  // ── Render ────────────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, W, H);
    const b = bgState.boost;

    for (const p of particles) {
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.rotSpeed;
      p.phase += p.phaseSpeed;

      // Seamless wrap at canvas edges
      const m = p.s + 2;
      if      (p.x >  W + m) p.x = -m;
      else if (p.x < -m)     p.x =  W + m;
      if      (p.y >  H + m) p.y = -m;
      else if (p.y < -m)     p.y =  H + m;

      // Alpha: base × section boost × slow sine pulse
      const alpha = Math.min(p.baseAlpha * b * (0.55 + 0.45 * Math.sin(p.phase)), 0.90);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const hs = p.s * 0.5;
      if (p.hollow) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth   = 1;
        ctx.strokeRect(-hs, -hs, p.s, p.s);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-hs, -hs, p.s, p.s);
      }
      ctx.restore();
    }
  }

  // Plug into gsap.ticker — same timing bus as Lenis
  if (typeof gsap !== 'undefined') {
    gsap.ticker.add(render);
  } else {
    (function loop() { render(); requestAnimationFrame(loop); })();
  }
})();


// ══════════════════════════════════════════════════════════
//  CHATBOT
//  All responses generated via OpenAI API (server/server.js).
//  Quick replies are conversation starters, not decision trees.
//  The server must be running: cd server && node server.js
// ══════════════════════════════════════════════════════════

const chatToggle   = document.getElementById('chatToggle');
const chatWindow   = document.getElementById('chatWindow');
const chatClose    = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const quickReplies = document.getElementById('quickReplies');
const userInput    = document.getElementById('userInput');
const chatSend     = document.getElementById('chatSend');

if (chatToggle && chatWindow) {

  const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/chat'
    : '/api/chat';
  const history  = [];   // [{ role: 'user'|'assistant', content: string }]
  let isWaiting  = false;
  let chatOpened = false;

  // ── UI ──────────────────────────────────────────────────
  function addMessage(text, role = 'bot') {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.innerHTML = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
  }

  function showTyping() {
    if (document.getElementById('typingIndicator')) return;
    const el = document.createElement('div');
    el.className = 'chat-msg bot'; el.id = 'typingIndicator';
    el.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTyping() { document.getElementById('typingIndicator')?.remove(); }

  function setQuickReplies(labels) {
    if (!quickReplies) return;
    quickReplies.innerHTML = '';
    labels.forEach(label => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        quickReplies.innerHTML = '';
        if (!handleLocalAction(label)) sendToAPI(label);
      });
      quickReplies.appendChild(btn);
    });
  }

  // ── Calendly popup ─────────────────────────────────────
  function openCalendlyPopup(name, email) {
    const url = 'https://calendly.com/chilieagencia/30min'
      + '?name=' + encodeURIComponent(name)
      + '&email=' + encodeURIComponent(email);

    function launch() {
      Calendly.initPopupWidget({ url });
    }

    if (typeof Calendly !== 'undefined') {
      launch();
    } else {
      if (!document.querySelector('link[href*="calendly"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://assets.calendly.com/assets/external/widget.css';
        document.head.appendChild(link);
      }
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.onload = launch;
      document.head.appendChild(script);
    }
  }

  // Local actions that don't need API (navigation shortcuts)
  function handleLocalAction(label) {
    if (label === 'Ir al formulario de contacto') {
      addMessage(label, 'user');
      addMessage('Redirigiendo al formulario…');
      const href = document.querySelector('a[href*="contacto"]')?.href || 'pages/contacto.html';
      setTimeout(() => { window.location.href = href; }, 700);
      return true;
    }
    return false;
  }

  // ── OpenAI API ─────────────────────────────────────────
  async function sendToAPI(userText) {
    if (isWaiting) return;
    isWaiting = true;

    addMessage(userText, 'user');
    if (quickReplies) quickReplies.innerHTML = '';

    history.push({ role: 'user', content: userText });
    // Keep history bounded to avoid sending too many tokens
    if (history.length > 20) history.splice(0, history.length - 20);

    showTyping();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: AbortSignal.timeout(14000),
      });

      removeTyping();

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        addMessage(e.error || 'No he podido procesar tu mensaje. Inténtalo de nuevo.');
        history.pop();
        isWaiting = false;
        return;
      }

      const data  = await res.json();
      const reply = data.reply || 'No he recibido respuesta del servidor.';

      // Check for Calendly booking marker
      const bookMatch = reply.match(/\[BOOK_CALL:name=([^,\]]+),email=([^\]]+)\]/);
      if (bookMatch) {
        const cleanReply = reply.replace(/\[BOOK_CALL:[^\]]+\]/, '').trim();
        addMessage(cleanReply || 'Perfecto, ahora puedes elegir el horario que mejor te venga.');
        history.push({ role: 'assistant', content: reply });
        openCalendlyPopup(bookMatch[1].trim(), bookMatch[2].trim());
      } else {
        addMessage(reply);
        history.push({ role: 'assistant', content: reply });
      }

      // After first exchange, suggest follow-up topics
      if (history.length === 2) {
        setTimeout(() => setQuickReplies([
          '¿Cómo se calcula el presupuesto?',
          '¿Cuánto tiempo tarda en estar listo?',
          'Quiero reservar una llamada',
        ]), 500);
      }

    } catch (err) {
      removeTyping();
      history.pop();
      const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
      if (isTimeout) {
        addMessage('La respuesta está tardando demasiado. Escríbenos directamente a **chilieagencia@gmail.com** — respondemos en menos de 24 horas.');
      } else {
        addMessage('El asistente no está disponible ahora mismo. Puedes escribirnos a **chilieagencia@gmail.com** o usar el formulario de contacto.');
        setTimeout(() => setQuickReplies(['Ir al formulario de contacto']), 350);
      }
    }

    isWaiting = false;
  }

  // ── Init ───────────────────────────────────────────────
  function initChat() {
    chatMessages.innerHTML = '';
    history.length = 0;
    if (quickReplies) quickReplies.innerHTML = '';

    addMessage('¡Hola! Soy el asistente de Chilie IA.\n\nEstoy aquí para ayudarte a entender qué tipo de chatbot o automatización encajaría mejor con tu negocio. ¿Con qué puedo ayudarte?');
    setTimeout(() => setQuickReplies([
      'Quiero reservar una llamada',
      '¿Qué tipo de chatbot necesito?',
      'Tengo una tienda online',
      'Quiero automatizar la atención al cliente',
    ]), 350);
  }

  // ── Open / Close ───────────────────────────────────────
  function openChat() {
    chatWindow.classList.add('open');
    chatToggle.classList.add('active');
    if (!chatOpened) { chatOpened = true; initChat(); }
  }
  function closeChat() {
    chatWindow.classList.remove('open');
    chatToggle.classList.remove('active');
  }

  chatToggle.addEventListener('click', () =>
    chatWindow.classList.contains('open') ? closeChat() : openChat()
  );
  chatClose?.addEventListener('click', closeChat);

  // ── Send ───────────────────────────────────────────────
  function sendMessage() {
    const text = (userInput?.value || '').trim();
    if (!text || isWaiting) return;
    userInput.value = '';
    if (!handleLocalAction(text)) sendToAPI(text);
  }
  chatSend?.addEventListener('click', sendMessage);
  userInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
}


// ── Contact form ───────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
if (contactForm) {

  // Clear field error as soon as the user starts correcting it
  contactForm.querySelectorAll('input, textarea, select').forEach(field => {
    field.addEventListener('input', () => {
      const group = field.closest('.form-group');
      if (!group) return;
      group.classList.remove('has-error');
      group.querySelectorAll('.form-error-msg').forEach(e => e.remove());
    });
  });

  function setFieldError(id, msg) {
    const field = document.getElementById(id);
    if (!field) return;
    const group = field.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    if (!group.querySelector('.form-error-msg')) {
      const el = document.createElement('span');
      el.className = 'form-error-msg';
      el.textContent = msg;
      group.appendChild(el);
    }
  }

  function clearAllErrors() {
    contactForm.querySelectorAll('.form-group.has-error').forEach(g => {
      g.classList.remove('has-error');
      g.querySelectorAll('.form-error-msg').forEach(e => e.remove());
    });
    const feedback = document.getElementById('formFeedback');
    if (feedback) { feedback.textContent = ''; feedback.className = ''; }
  }

  const CONTACT_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3001/api/contact'
      : '/api/contact';

  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    clearAllErrors();

    const btn        = contactForm.querySelector('button[type="submit"]');
    const feedback   = document.getElementById('formFeedback');
    const nombre     = document.getElementById('nombre')?.value.trim();
    const email      = document.getElementById('email')?.value.trim();
    const empresa    = document.getElementById('empresa')?.value.trim() || '';
    const presupuesto = document.getElementById('presupuesto')?.value || '';
    const prioridad  = document.getElementById('prioridad')?.value || '';
    const como       = document.getElementById('como')?.value || '';
    const mensaje    = document.getElementById('mensaje')?.value.trim();

    // Validate in display order (top → bottom), focus first error
    let firstError = null;
    if (!nombre)  { setFieldError('nombre', 'El nombre es obligatorio.'); firstError = firstError || 'nombre'; }
    if (!email)   { setFieldError('email',  'El email es obligatorio.');  firstError = firstError || 'email'; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    setFieldError('email',  'Introduce un email válido.'); firstError = firstError || 'email'; }
    if (!mensaje) { setFieldError('mensaje','Cuéntanos qué proceso quieres automatizar.'); firstError = firstError || 'mensaje'; }
    const privacyBox = document.getElementById('privacyConsent');
    if (privacyBox && !privacyBox.checked) { setFieldError('privacyConsent','Debes aceptar la política de privacidad.'); firstError = firstError || 'privacyConsent'; }

    if (firstError) { document.getElementById(firstError)?.focus(); return; }

    const orig = btn.innerHTML;
    btn.textContent = 'Enviando…'; btn.disabled = true;
    if (feedback) { feedback.textContent = ''; feedback.className = ''; }

    try {
      const res = await fetch(CONTACT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre, email, empresa, presupuesto, prioridad, como, mensaje }),
        signal:  AbortSignal.timeout(15000),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (feedback) {
          feedback.textContent = data.error || 'No hemos podido enviar tu mensaje. Escríbenos directamente a chilieagencia@gmail.com';
          feedback.className = 'error';
        }
        btn.innerHTML = orig; btn.disabled = false;
        return;
      }

      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>Enviado';
      if (feedback) {
        feedback.textContent = 'Mensaje recibido. Iñigo o Carlos te responden en menos de 24 horas.';
        feedback.className = 'success';
      }
      contactForm.reset();
      setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 6000);

    } catch (err) {
      const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
      if (feedback) {
        feedback.textContent = isTimeout
          ? 'La petición tardó demasiado. Escríbenos directamente a chilieagencia@gmail.com'
          : 'Error de conexión. Escríbenos directamente a chilieagencia@gmail.com';
        feedback.className = 'error';
      }
      btn.innerHTML = orig; btn.disabled = false;
    }
  });
}

// ── Cookie consent banner ──────────────────────────────────
(function() {
  var banner = document.getElementById('cookieBanner');
  var acceptBtn = document.getElementById('cookieAccept');
  var rejectBtn = document.getElementById('cookieReject');
  if (!banner || !acceptBtn || !rejectBtn) return;
  if (localStorage.getItem('cookie_consent') !== null) return;
  banner.classList.add('visible');
  acceptBtn.addEventListener('click', function() {
    localStorage.setItem('cookie_consent', 'accepted');
    banner.classList.remove('visible');
  });
  rejectBtn.addEventListener('click', function() {
    localStorage.setItem('cookie_consent', 'rejected');
    banner.classList.remove('visible');
  });
})();
