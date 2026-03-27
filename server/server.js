/**
 * Chilie IA — Server
 * Node.js + Express + OpenAI (chat) + Nodemailer (contact form)
 *
 * Setup:
 *   cd server
 *   npm install
 *   cp .env.example .env  (then fill in your values)
 *   node server.js
 *
 * Production: this server also serves the static frontend from the parent
 * directory, so a single Render Web Service covers everything.
 */

const path       = require('path');
const express    = require('express');
const cors       = require('cors');
const nodemailer = require('nodemailer');
const OpenAI     = require('openai');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ───────────────────────────────────────────────────
// Needed only when frontend is served from a different origin
// (e.g. local dev with live-reload). In production both frontend
// and API share the same origin, so CORS is a no-op.
app.use(cors({
  origin(origin, cb) {
    if (!origin || origin === 'null') return cb(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    const extra = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
      : [];
    if (extra.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['POST', 'GET'],
}));
app.use(express.json({ limit: '10kb' }));

// ── OpenAI ────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Nodemailer (Gmail SMTP + App Password) ────────────────
const mailer = (process.env.SMTP_USER && process.env.SMTP_PASS)
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

// ── System prompt ─────────────────────────────────────────
const SYSTEM_PROMPT = `Eres el asistente pre-ventas de Chilie IA, una agencia especializada en chatbots de inteligencia artificial a medida, basada en Madrid, España.

PERSONALIDAD Y TONO
- Profesional, directo y cercano. Como un buen asesor de negocios, no un vendedor agresivo.
- Conciso: 2-4 frases normalmente. Más detalle solo cuando la pregunta lo requiere.
- Sin emojis. Responde siempre en español.
- Habla en segunda persona (tú / tu negocio).

QUIÉNES SOMOS
Chilie IA fue fundada por Iñigo (arquitecto backend, Node.js) y Carlos (frontend y UX). Somos un equipo pequeño y técnico — cuando un cliente habla con Chilie, habla directamente con quien construye su sistema. Sin intermediarios ni subcontratas.
Stack: Node.js, OpenAI GPT-4o, n8n, WhatsApp Business API, Supabase, Pinecone, MySQL, Render.

SERVICIOS
1. Chatbots de atención al cliente — Resuelven dudas, gestionan incidencias y escalan al humano cuando tiene sentido. Web y WhatsApp.
2. Cualificación y captura de leads — Preguntas adaptativas, detección de intención de compra, entrega al CRM.
3. Sistemas de reservas y citas — Gestión de agenda, confirmaciones y recordatorios automáticos.
4. Asistentes de e-commerce — Estado de pedidos, recuperación de carritos, recomendaciones de producto.
5. Soporte técnico nivel 1 — Diagnóstico guiado, apertura de tickets, base de conocimiento técnico.
6. Chatbot para WhatsApp Business — API oficial, mensajes proactivos, conversación bidireccional.

PRECIOS — REGLA ABSOLUTA
NUNCA des precios, ni fijos, ni orientativos, ni rangos.
Cada chatbot se diseña y construye completamente a medida. El coste depende de:
- La complejidad de los flujos conversacionales
- El número y tipo de integraciones necesarias (CRM, base de datos, WhatsApp, etc.)
- El volumen esperado de conversaciones
- Los canales requeridos (web, WhatsApp, otros)
- El nivel de personalización del diseño conversacional y la lógica de negocio
Cuando alguien pregunte por precio, explica esto con naturalidad y dirige hacia una propuesta gratuita sin compromiso.

PROCESO
1. Llamada de diagnóstico (45 min) — Entendemos el negocio y sus procesos.
2. Propuesta de arquitectura (24h) — Diseño del sistema y presupuesto personalizado. Sin compromiso.
3. Desarrollo y entrenamiento (5-10 días hábiles).
4. Testing conjunto con escenarios reales.
5. Despliegue + 30 días de soporte incluido.

TU OBJETIVO
Actuar como asesor consultivo. Ayuda al visitante a entender:
- Si un chatbot tiene sentido para su negocio concreto
- Qué tipo de solución aportaría más valor en su caso
- Qué impacto operativo puede esperar (tickets reducidos, leads cualificados, horas ahorradas)
- Por qué la solución debe ser a medida y no una herramienta genérica
- Por qué el precio requiere evaluación personalizada

Cuando el interés sea genuino, orienta hacia: chilieagencia@gmail.com o el formulario de contacto.

LIMITACIONES
- No inventes integraciones, casos de uso o funcionalidades no descritas aquí.
- Si no sabes algo muy específico, di que es mejor hablarlo directamente con el equipo.
- Nunca prometas plazos ni resultados exactos sin conocer el proyecto.
- Nunca des precios bajo ninguna circunstancia.`;

// ── Rate limiting (in-memory) ─────────────────────────────
const requestCounts = new Map();
const RATE_LIMIT    = 20;
const RATE_WINDOW   = 60 * 1000;

function rateLimit(req, res, next) {
  const ip  = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return next();
  }

  const data = requestCounts.get(ip);
  if (now > data.resetAt) {
    data.count = 1;
    data.resetAt = now + RATE_WINDOW;
    return next();
  }

  if (data.count >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Demasiadas peticiones. Espera un momento.' });
  }

  data.count++;
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetAt) requestCounts.delete(ip);
  }
}, 5 * 60 * 1000);

// ── Chat input validation ─────────────────────────────────
function validateMessages(messages) {
  if (!Array.isArray(messages)) return false;
  if (messages.length > 20) return false;
  for (const msg of messages) {
    if (!msg.role || !msg.content) return false;
    if (!['user', 'assistant'].includes(msg.role)) return false;
    if (typeof msg.content !== 'string') return false;
    if (msg.content.length > 2000) return false;
  }
  return true;
}

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Chilie IA', timestamp: new Date().toISOString() });
});

// ── Chat endpoint ─────────────────────────────────────────
app.post('/api/chat', rateLimit, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !validateMessages(messages)) {
    return res.status(400).json({ error: 'Formato de mensaje inválido.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Servidor no configurado. Contacta con el equipo.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model:      process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages:   [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 350,
      temperature: 0.7,
      stream:     false,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) throw new Error('Empty response from OpenAI');

    res.json({ reply });

  } catch (err) {
    console.error('[Chat Error]', err.message);
    if (err.status === 429) return res.status(429).json({ error: 'El servicio está saturado. Inténtalo en unos segundos.' });
    if (err.status === 401) return res.status(500).json({ error: 'Error de configuración del servidor.' });
    res.status(500).json({ error: 'No he podido procesar tu mensaje. Inténtalo de nuevo.' });
  }
});

// ── Contact form endpoint ─────────────────────────────────
app.post('/api/contact', rateLimit, async (req, res) => {
  const { nombre, email, empresa, presupuesto, prioridad, como, mensaje } = req.body;

  // Server-side validation
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Email inválido.' });
  }
  if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length < 5) {
    return res.status(400).json({ error: 'El mensaje es obligatorio.' });
  }

  const safe = {
    nombre:      nombre.trim().slice(0, 200),
    email:       email.trim().slice(0, 200),
    empresa:     String(empresa  || '').trim().slice(0, 200) || '—',
    presupuesto: String(presupuesto || '—').slice(0, 100),
    prioridad:   String(prioridad   || '—').slice(0, 100),
    como:        String(como        || '—').slice(0, 100),
    mensaje:     mensaje.trim().slice(0, 5000),
  };

  if (!mailer) {
    console.log('[Contact Form] SMTP not configured. Submission received:');
    console.log(JSON.stringify(safe, null, 2));
    return res.status(500).json({
      error: 'El formulario no está configurado aún. Escríbenos directamente a chilieagencia@gmail.com',
    });
  }

  const recipient = process.env.CONTACT_EMAIL || process.env.SMTP_USER;

  const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  try {
    await mailer.sendMail({
      from:    `"Chilie IA Web" <${process.env.SMTP_USER}>`,
      to:      recipient,
      replyTo: safe.email,
      subject: `Nuevo lead: ${safe.nombre} — ${safe.empresa !== '—' ? safe.empresa : safe.email}`,
      text: [
        `Nombre:        ${safe.nombre}`,
        `Email:         ${safe.email}`,
        `Empresa:       ${safe.empresa}`,
        `Presupuesto:   ${safe.presupuesto}`,
        `Urgencia:      ${safe.prioridad}`,
        `Cómo conoció:  ${safe.como}`,
        '',
        'Mensaje:',
        safe.mensaje,
      ].join('\n'),
      html: `
        <h2 style="font-family:sans-serif;margin-bottom:16px">Nuevo lead — chilie.com</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:6px 14px;font-weight:600;color:#555;white-space:nowrap">Nombre</td><td style="padding:6px 14px">${escHtml(safe.nombre)}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:6px 14px;font-weight:600;color:#555;white-space:nowrap">Email</td><td style="padding:6px 14px"><a href="mailto:${escHtml(safe.email)}">${escHtml(safe.email)}</a></td></tr>
          <tr><td style="padding:6px 14px;font-weight:600;color:#555;white-space:nowrap">Empresa</td><td style="padding:6px 14px">${escHtml(safe.empresa)}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:6px 14px;font-weight:600;color:#555;white-space:nowrap">Presupuesto</td><td style="padding:6px 14px">${escHtml(safe.presupuesto)}</td></tr>
          <tr><td style="padding:6px 14px;font-weight:600;color:#555;white-space:nowrap">Urgencia</td><td style="padding:6px 14px">${escHtml(safe.prioridad)}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:6px 14px;font-weight:600;color:#555;white-space:nowrap">Cómo conoció</td><td style="padding:6px 14px">${escHtml(safe.como)}</td></tr>
        </table>
        <h3 style="font-family:sans-serif">Mensaje</h3>
        <pre style="background:#f5f5f5;padding:16px;border-radius:4px;font-size:14px;white-space:pre-wrap;font-family:sans-serif;line-height:1.5">${escHtml(safe.mensaje)}</pre>
      `,
    });

    res.json({ ok: true });

  } catch (err) {
    console.error('[Contact Email Error]', err.message);
    res.status(500).json({ error: 'Error al enviar el mensaje. Escríbenos directamente a chilieagencia@gmail.com' });
  }
});

// ── Serve static frontend ─────────────────────────────────
// The frontend lives one level up from this server/ directory.
// This means a single Render Web Service handles both the site
// and the API — no separate static site deploy needed.
app.use(express.static(path.join(__dirname, '..')));

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✓ Chilie IA server running on port ${PORT}`);
  console.log(`  Local:  http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('\n⚠  OPENAI_API_KEY not set — chatbot will not work.');
  }
  if (!mailer) {
    console.warn('⚠  SMTP_USER / SMTP_PASS not set — contact form will not send email.');
  }
});
