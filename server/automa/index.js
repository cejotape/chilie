/**
 * Automa — venta y entrega.
 *
 *   POST /api/automa/checkout  → crea la sesión de pago en Stripe y devuelve su URL
 *   POST /api/automa/webhook   → Stripe avisa del pago; aquí se entrega la compra
 *   GET  /api/automa/config    → dice a la landing si la venta está activa
 *
 * Entrega: invitación a los repos privados de GitHub, correo con el PDF y, en premium,
 * enlace al Discord con un código de activación. Ver README.md.
 *
 * Debe registrarse ANTES de express.json(): el webhook necesita el cuerpo sin procesar
 * para comprobar la firma de Stripe.
 */

const crypto  = require('crypto');
const express = require('express');

const PLANS = {
  base:    { name: 'Automa',         amount: 2500, repos: ['base'] },
  premium: { name: 'Automa Premium', amount: 8900, repos: ['base', 'premium'] },
};

// Se vende en España y fuera de la Unión Europea: estos son los demás países de la UE.
const EU_EXCEPT_SPAIN = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'SE']);
const isBlockedCountry = (code) => Boolean(code) && EU_EXCEPT_SPAIN.has(String(code).toUpperCase());

// Las claves se pegan a mano en el panel y a veces llegan con espacios, saltos de línea o el
// nombre de la variable delante: se extrae solo la clave.
const pick = (value, pattern) => { const m = pattern.exec(String(value || '')); return m ? m[0] : ''; };

const env = () => ({
  stripeKey:     pick(process.env.AUTOMA_STRIPE_SECRET_KEY, /[sr]k_(?:live|test)_[A-Za-z0-9]+/),
  webhookSecret: pick(process.env.AUTOMA_STRIPE_WEBHOOK_SECRET, /whsec_[A-Za-z0-9]+/),
  siteUrl:       (process.env.AUTOMA_SITE_URL || '').replace(/\/+$/, ''),
  ghToken:       process.env.AUTOMA_GITHUB_TOKEN,
  ghOwner:       process.env.AUTOMA_GITHUB_OWNER,
  repos: {
    base:    process.env.AUTOMA_GITHUB_REPO_BASE    || 'automa-base',
    premium: process.env.AUTOMA_GITHUB_REPO_PREMIUM || 'automa-premium',
  },
  pdfPath: process.env.AUTOMA_PDF_PATH || 'guia-automa.pdf',
});

const log = (...args) => console.log('[automa-venta]', ...args);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Stripe ────────────────────────────────────────────────

// Stripe espera los parámetros anidados como a[b][c]=valor.
function formEncode(obj, prefix, out = new URLSearchParams()) {
  for (const [key, value] of Object.entries(obj)) {
    const name = prefix ? `${prefix}[${key}]` : key;
    if (value !== null && typeof value === 'object') formEncode(value, name, out);
    else if (value !== undefined) out.append(name, String(value));
  }
  return out;
}

async function createCheckoutSession(planKey, cfg) {
  const plan = PLANS[planKey];
  const params = {
    mode: 'payment',
    locale: 'es',
    success_url: `${cfg.siteUrl}/gracias.html?plan=${planKey}`,
    cancel_url:  `${cfg.siteUrl}/#precios`,
    line_items: [{
      quantity: 1,
      price_data: { currency: 'eur', unit_amount: plan.amount, product_data: { name: plan.name } },
    }],
    custom_fields: [{
      key: 'github',
      type: 'text',
      optional: true,
      label: { type: 'custom', custom: 'Tu usuario de GitHub (si tienes)' },
    }],
    custom_text: {
      submit: { message: 'Disponible en España y fuera de la Unión Europea. Recibirás el acceso por correo al momento. Al ser contenido digital de acceso inmediato, no admite desistimiento.' },
    },
    metadata: {
      producto: 'automa',
      plan: planKey,
      // El comprador marca la casilla en la landing antes de llegar aquí.
      renuncia_desistimiento: new Date().toISOString(),
    },
  };
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formEncode(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe respondió ${res.status}`);
  return data.url;
}

// Comprueba la cabecera Stripe-Signature: t=<segundos>,v1=<hmac de "t.cuerpo">
function verifyStripeSignature(rawBody, header, secret, toleranceSec = 300) {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.`).update(rawBody).digest('hex');
  const exp = Buffer.from(expected, 'hex');
  return signatures.some((sig) => {
    const got = Buffer.from(sig, 'hex');
    return got.length === exp.length && crypto.timingSafeEqual(got, exp);
  });
}

// ── GitHub ────────────────────────────────────────────────

const ghHeaders = (cfg, accept = 'application/vnd.github+json') => ({
  Authorization: `Bearer ${cfg.ghToken}`,
  Accept: accept,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'automa-venta',
});

// Acepta "usuario", "@usuario" o la URL del perfil. Devuelve null si no parece un usuario válido.
function cleanGithubUser(raw) {
  if (!raw) return null;
  const user = String(raw).trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/^@/, '').replace(/\/.*$/, '');
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(user) ? user : null;
}

async function inviteToRepos(user, repoKeys, cfg) {
  for (const key of repoKeys) {
    const res = await fetch(`https://api.github.com/repos/${cfg.ghOwner}/${cfg.repos[key]}/collaborators/${user}`, {
      method: 'PUT',
      headers: { ...ghHeaders(cfg), 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission: 'pull' }),
    });
    // 201 = invitación enviada, 204 = ya tenía acceso
    if (res.status !== 201 && res.status !== 204) {
      throw new Error(`GitHub ${res.status} al invitar a ${cfg.repos[key]}`);
    }
  }
}

// El PDF vive en el repo privado (este repo es público y no puede contenerlo).
async function fetchPdf(cfg) {
  const res = await fetch(`https://api.github.com/repos/${cfg.ghOwner}/${cfg.repos.base}/contents/${cfg.pdfPath}`, {
    headers: ghHeaders(cfg, 'application/vnd.github.raw'),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} al descargar el PDF`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Bot de Discord (códigos premium y registro de pedidos) ─

async function getBot() {
  if (process.env.AUTOMA_DISCORD_ENABLED !== 'true') return null;
  try {
    const bot = await import('../automa-discord/bot.mjs');
    return bot.isRunning() ? bot : null;
  } catch (err) {
    log('No se pudo cargar el bot:', err.message);
    return null;
  }
}

// ── Correo al comprador ───────────────────────────────────

function buildEmail({ plan, planKey, github, discord, hasPdf, cfg }) {
  const repoUrl = (key) => `https://github.com/${cfg.ghOwner}/${cfg.repos[key]}`;
  const blocks = [];

  blocks.push({
    title: 'La guía en PDF',
    text: hasPdf
      ? 'Va adjunta a este correo. Empieza por "Empieza aquí": son diez minutos.'
      : 'No hemos podido adjuntarla ahora mismo. Te la enviamos en un correo aparte en menos de 24 horas.',
  });

  if (github.invited) {
    const links = plan.repos.map(repoUrl).join(' y ');
    blocks.push({
      title: 'El repositorio privado',
      text: `Hemos invitado a tu usuario de GitHub (${github.user}). Acepta la invitación desde el correo que te envía GitHub o entrando en ${links}. Ahí están los prompts, las skills y las actualizaciones.`,
    });
  } else {
    blocks.push({
      title: 'El repositorio privado',
      text: 'Para darte acceso al repositorio con los prompts, las skills y las actualizaciones necesitamos tu usuario de GitHub. Si no tienes cuenta, créala gratis en https://github.com/signup y responde a este correo con tu nombre de usuario.',
    });
  }

  if (planKey === 'premium') {
    blocks.push({
      title: 'El Discord y tus 30 días de soporte',
      text: discord
        ? `1. Entra en el servidor: ${discord.invite}\n2. En el canal #activar-acceso escribe /activar y pega este código: ${discord.code}\n\nEl código es de un solo uso. Tus 30 días de soporte empiezan a contar cuando lo activas.`
        : 'Estamos preparando tu acceso al Discord. Te enviamos el enlace y tu código de activación en un correo aparte en menos de 24 horas.',
    });
  }

  const intro = `Gracias por tu compra de ${plan.name}. Aquí tienes todo lo que incluye.`;
  const outro = 'Si algo no te llega o no funciona, responde a este correo.\n\nAl tratarse de contenido digital con acceso inmediato, que solicitaste al comprar, la compra no admite desistimiento.';

  const text = [intro, ...blocks.map((b) => `${b.title.toUpperCase()}\n${b.text}`), outro].join('\n\n');
  const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#5b5bd6">$1</a>').replace(/\n/g, '<br>');
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1c1c1c;max-width:560px">
<p>${esc(intro)}</p>
${blocks.map((b) => `<h3 style="margin:24px 0 6px;font-size:16px">${esc(b.title)}</h3><p style="margin:0">${linkify(b.text)}</p>`).join('\n')}
<p style="margin-top:28px;color:#555;font-size:13px">${linkify(outro)}</p>
</div>`;
  return { text, html };
}

// ── Entrega ───────────────────────────────────────────────

const memoryOrders = new Map();   // respaldo si el bot (y su almacén) no está en marcha
const inFlight = new Set();

async function fulfil(session, mailer) {
  const cfg = env();
  const planKey = session.metadata?.plan;
  const plan = PLANS[planKey];
  const email = session.customer_details?.email;
  if (!plan || !email) throw new Error(`Pedido ${session.id} sin plan o sin correo`);
  if (!mailer) throw new Error('El correo (SMTP) no está configurado');

  const bot = await getBot();
  const previous = bot ? bot.getOrder(session.id) : memoryOrders.get(session.id);
  if (previous?.delivered) return { repeated: true };

  // País de facturación que el comprador indica en Stripe. Si es de la UE y no es España,
  // no se entrega: se avisa al comprador y al administrador, que hace el reembolso en Stripe.
  const country = session.customer_details?.address?.country;
  if (isBlockedCountry(country)) {
    const record = { plan: planKey, createdAt: Date.now(), code: null, delivered: true, blocked: country };
    if (bot) bot.setOrder(session.id, record);
    else memoryOrders.set(session.id, record);
    await mailer.sendMail({
      from:    `"Automa" <${process.env.SMTP_USER}>`,
      to:      email,
      replyTo: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: 'Tu pedido de Automa se ha cancelado',
      text:    'Gracias por tu interés en Automa.\n\nAhora mismo solo vendemos en España y en países de fuera de la Unión Europea, y tu pago se ha hecho desde un país en el que no está disponible. Hemos cancelado el pedido y te devolvemos el importe completo en los próximos días, al mismo medio de pago.\n\nSi crees que es un error, responde a este correo.',
    });
    await mailer.sendMail({
      from:    `"Automa" <${process.env.SMTP_USER}>`,
      to:      process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: `Automa: hay que REEMBOLSAR un pedido (${country})`,
      text:    `Pedido no entregado por país no permitido (${country}).\n\nComprador: ${email}\nPedido de Stripe: ${session.id}\nPago: ${session.payment_intent || 'ver en Stripe'}\n\nHaz el reembolso completo desde el panel de Stripe. Al comprador ya se le ha avisado de que se le devuelve el dinero.`,
    });
    if (bot) await bot.notify(`⛔ Pedido de **${plan.name}** no entregado: país no permitido (${country}). Hay que reembolsarlo en Stripe.`);
    return { blocked: country, problems: [] };
  }

  const problems = [];

  // 1. GitHub
  const github = { user: cleanGithubUser(session.custom_fields?.find((f) => f.key === 'github')?.text?.value), invited: false };
  if (github.user && cfg.ghToken && cfg.ghOwner) {
    try {
      await inviteToRepos(github.user, plan.repos, cfg);
      github.invited = true;
    } catch (err) {
      problems.push(`Invitación a GitHub de "${github.user}": ${err.message}`);
    }
  } else if (!github.user) {
    problems.push('El comprador no dio usuario de GitHub: hay que invitarle a mano cuando responda al correo.');
  } else {
    problems.push('Faltan AUTOMA_GITHUB_TOKEN o AUTOMA_GITHUB_OWNER: no se ha invitado a GitHub.');
  }

  // 2. Discord (solo premium). Se reutiliza el código si un intento anterior ya lo generó.
  let discord = null;
  if (planKey === 'premium') {
    if (bot) {
      try {
        const code = previous?.code ?? bot.createCode(`pedido ${session.id}`);
        bot.setOrder(session.id, { plan: planKey, createdAt: Date.now(), code, delivered: false });
        discord = { code, invite: await bot.inviteUrl() };
      } catch (err) {
        problems.push(`Código de Discord: ${err.message}`);
      }
    } else {
      problems.push('El bot de Discord no está en marcha: hay que enviar a mano el enlace y un código (/codigo).');
    }
  }

  // 3. PDF
  let pdf = null;
  if (cfg.ghToken && cfg.ghOwner) {
    try {
      pdf = await fetchPdf(cfg);
    } catch (err) {
      problems.push(`PDF: ${err.message}`);
    }
  } else {
    problems.push('Sin acceso a GitHub no se puede adjuntar el PDF: hay que enviarlo a mano.');
  }

  // 4. Correo al comprador. Si falla, se lanza el error para que Stripe reintente.
  const { text, html } = buildEmail({ plan, planKey, github, discord, hasPdf: Boolean(pdf), cfg });
  await mailer.sendMail({
    from:    `"Automa" <${process.env.SMTP_USER}>`,
    to:      email,
    replyTo: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
    subject: `Tu acceso a ${plan.name}`,
    text,
    html,
    attachments: pdf ? [{ filename: 'guia-automa.pdf', content: pdf, contentType: 'application/pdf' }] : [],
  });

  // 5. Registro. No se guarda el correo del comprador: ya está en Stripe.
  const record = { plan: planKey, createdAt: previous?.createdAt ?? Date.now(), code: discord?.code ?? null, delivered: true };
  if (bot) bot.setOrder(session.id, record);
  else memoryOrders.set(session.id, record);

  if (bot) {
    await bot.notify(`🛒 Venta de **${plan.name}** entregada${problems.length ? ` con ${problems.length} aviso(s)` : ''}`);
  }
  if (problems.length) {
    await mailer.sendMail({
      from:    `"Automa" <${process.env.SMTP_USER}>`,
      to:      process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: `Automa: una venta necesita atención (${plan.name})`,
      text:    `Comprador: ${email}\nPedido de Stripe: ${session.id}\n\nPendiente:\n- ${problems.join('\n- ')}`,
    }).catch((err) => log('No se pudo avisar al administrador:', err.message));
  }
  return { problems };
}

// ── Rutas ─────────────────────────────────────────────────

module.exports = function automaVenta(app, { getMailer }) {
  app.get('/api/automa/config', (_req, res) => {
    const cfg = env();
    res.json({ enabled: Boolean(cfg.stripeKey && cfg.siteUrl) });
  });

  app.post('/api/automa/checkout', express.json({ limit: '2kb' }), async (req, res) => {
    const cfg = env();
    if (!cfg.stripeKey || !cfg.siteUrl) return res.status(503).json({ error: 'La venta aún no está activa.' });
    const { plan, consent } = req.body || {};
    if (!Object.hasOwn(PLANS, plan)) return res.status(400).json({ error: 'Plan no válido.' });
    if (consent !== true) return res.status(400).json({ error: 'Tienes que aceptar las condiciones para continuar.' });
    // Primer filtro, antes de pagar: el país que detecta la red de Render (cabecera de Cloudflare).
    // Si la cabecera no llega, se deja pasar; el webhook vuelve a comprobarlo con el país de facturación.
    if (isBlockedCountry(req.get('cf-ipcountry'))) {
      return res.status(403).json({ error: 'Automa solo está disponible en España y en países de fuera de la Unión Europea.' });
    }
    try {
      res.json({ url: await createCheckoutSession(plan, cfg) });
    } catch (err) {
      log('Error al crear el pago:', err.message);
      res.status(502).json({ error: 'No se ha podido iniciar el pago. Inténtalo de nuevo en un minuto.' });
    }
  });

  app.post('/api/automa/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
    const cfg = env();
    if (!verifyStripeSignature(req.body, req.get('stripe-signature'), cfg.webhookSecret)) {
      return res.status(400).send('Firma no válida');
    }
    let event;
    try {
      event = JSON.parse(req.body.toString('utf8'));
    } catch {
      return res.status(400).send('Cuerpo no válido');
    }
    const session = event.data?.object;
    const isPaid =
      (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') &&
      session?.payment_status === 'paid' &&
      session?.metadata?.producto === 'automa';
    if (!isPaid) return res.json({ received: true });

    if (inFlight.has(session.id)) return res.json({ received: true });
    inFlight.add(session.id);
    try {
      const result = await fulfil(session, getMailer());
      log(`Pedido ${session.id}:`, result.repeated ? 'ya estaba entregado' : result.blocked ? `no entregado, país ${result.blocked}` : `entregado (${result.problems.length} avisos)`);
      res.json({ received: true });
    } catch (err) {
      // Un 500 hace que Stripe lo reintente más tarde.
      log(`Pedido ${session.id} sin entregar:`, err.message);
      res.status(500).send('Entrega fallida');
    } finally {
      inFlight.delete(session.id);
    }
  });
};

// Para las pruebas
module.exports._internals = { verifyStripeSignature, formEncode, cleanGithubUser, buildEmail, PLANS };
