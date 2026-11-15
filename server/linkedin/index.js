// Automatización de LinkedIn: rutas del panel, conexión de cuentas (OAuth) y arranque del
// planificador. Se monta desde server.js con require('./linkedin')(app, { anthropic, mailer }).
//
// Todo va protegido con LINKEDIN_ADMIN_KEY: en el panel se pasa como ?clave=… y en las
// llamadas del propio panel como cabecera x-linkedin-key.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('./config');
const estado = require('./estado');
const api = require('./api');
const { crear } = require('./planificador');

module.exports = function montar(app, { anthropic, mailer }) {
  const plan = crear({ anthropic, mailer });
  const r = express.Router();
  const pendientes = new Map();   // state de OAuth → { cuenta, t }

  const claveValida = dada => {
    if (!config.adminKey || typeof dada !== 'string') return false;
    const a = crypto.createHash('sha256').update(dada).digest();
    const b = crypto.createHash('sha256').update(config.adminKey).digest();
    return crypto.timingSafeEqual(a, b);
  };
  let listo = false, errorInicio = '';
  const protegido = (req, res, next) => {
    if (!claveValida(req.get('x-linkedin-key') || req.query.clave)) {
      return res.status(config.adminKey ? 403 : 503).send(config.adminKey ? 'Clave incorrecta.' : 'Falta definir LINKEDIN_ADMIN_KEY en el servidor.');
    }
    if (!listo) return res.status(503).json({ error: errorInicio ? `No se ha podido cargar el estado: ${errorInicio}` : 'Arrancando, prueba en unos segundos.' });
    next();
  };
  const pagina = (titulo, cuerpo) => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${titulo}</title><body style="font:17px/1.5 system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px;color:#0E0E12"><h1 style="font-size:24px">${titulo}</h1>${cuerpo}</body>`;

  // ── Panel ────────────────────────────────────────────────
  r.get('/', protegido, (_req, res) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
    res.send(fs.readFileSync(path.join(__dirname, 'panel.html'), 'utf8'));
  });

  r.get('/api/estado', protegido, (_req, res) => {
    const e = estado.leer();
    const sinConfigurar = ['clientId', 'clientSecret'].filter(k => !config[k]);
    res.json({
      activo: config.activo,
      pausado: e.pausado,
      sinConfigurar,
      redirectUri: config.redirectUri,
      pagina: e.orgUrn,
      proximo: plan.proximo(),
      temaEspecial: e.temaEspecial?.texto || '',
      cuentas: Object.entries(config.cuentas).map(([id, c]) => {
        const g = e.cuentas[id];
        return {
          id, nombre: c.nombre, empresa: id === config.cuentaEmpresa,
          conectada: Boolean(g?.token),
          comoQuien: g?.nombre || '',
          caduca: g?.token ? new Date(g.expira).toISOString().slice(0, 10) : null,
          diasRestantes: g?.token ? Math.floor((g.expira - Date.now()) / 86400000) : null,
          seRenuevaSola: Boolean(g?.refresh),
        };
      }),
      publicaciones: e.publicaciones.slice(-10).reverse().map(p => ({
        id: p.id, fecha: p.fecha, titular: p.titular, estado: p.estado, texto: p.texto,
        enlace: p.urn ? api.enlacePost(p.urn) : null,
        reposts: Object.fromEntries(Object.entries(p.reposts).map(([id, x]) =>
          [id, { estado: x.estado, texto: x.texto, enlace: x.urn ? api.enlacePost(x.urn) : null }])),
      })),
    });
  });

  r.post('/api/pausa', protegido, (req, res) => {
    estado.cambiar(e => { e.pausado = Boolean(req.body?.pausado); });
    res.json({ ok: true });
  });

  // Tema especial: lo que se escriba aquí es de lo que trata el siguiente post.
  r.post('/api/tema', protegido, (req, res) => {
    const texto = String(req.body?.texto || '').trim().slice(0, 4000);
    estado.cambiar(e => { e.temaEspecial = texto ? { texto, creado: Date.now() } : null; });
    res.json({ ok: true });
  });

  r.post('/api/vista-previa', protegido, async (_req, res) => {
    try {
      const { titular, etiqueta, texto, png } = await plan.preparar();
      res.json({ titular, etiqueta, texto, imagen: `data:image/png;base64,${png.toString('base64')}` });
    } catch (err) {
      console.error('[LinkedIn] Vista previa:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  r.post('/api/publicar', protegido, async (_req, res) => {
    try {
      const pub = await plan.publicarAhora();
      res.json({ ok: true, enlace: api.enlacePost(pub.urn) });
    } catch (err) {
      console.error('[LinkedIn] Publicar ahora:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Resolver un post que se quedó a medias por un reinicio: salio=true lo da por publicado
  // (sin reposts, porque no se conoce su identificador); salio=false lo descarta y se reintenta.
  r.post('/api/resolver', protegido, (req, res) => {
    estado.cambiar(e => {
      const p = e.publicaciones.at(-1);
      if (p?.estado !== 'publicando') return;
      if (req.body?.salio) { p.estado = 'publicado'; e.indiceTema += 1; }
      else e.publicaciones.pop();
    });
    res.json({ ok: true });
  });

  // ── Conexión de cuentas ──────────────────────────────────
  r.get('/conectar/:cuenta', protegido, (req, res) => {
    const cuenta = config.cuentas[req.params.cuenta];
    if (!cuenta) return res.status(404).send('Esa cuenta no existe.');
    if (!config.clientId || !config.clientSecret) {
      return res.status(503).send(pagina('Falta configurar la app', '<p>Define LINKEDIN_CLIENT_ID y LINKEDIN_CLIENT_SECRET en Render.</p>'));
    }
    for (const [k, v] of pendientes) if (Date.now() - v.t > 15 * 60 * 1000) pendientes.delete(k);
    const state = crypto.randomBytes(24).toString('hex');
    pendientes.set(state, { cuenta: req.params.cuenta, t: Date.now() });
    res.redirect(api.urlAutorizacion(cuenta.scopes, state));
  });

  r.get('/callback', async (req, res) => {
    if (!listo) return res.status(503).send(pagina('Servidor arrancando', '<p>Vuelve a intentarlo en unos segundos desde el panel.</p>'));
    const pend = pendientes.get(String(req.query.state || ''));
    pendientes.delete(String(req.query.state || ''));
    if (!pend || Date.now() - pend.t > 15 * 60 * 1000) {
      return res.status(400).send(pagina('Enlace caducado', '<p>Vuelve a abrir el enlace de conexión desde el panel.</p>'));
    }
    if (String(req.query.error || '').startsWith('invalid_scope')) {
      return res.status(400).send(pagina('LinkedIn aún no ha dado acceso a la app',
        '<p>La app todavía no tiene concedidos los permisos que pide (el producto Community Management API está pendiente de aprobación). No hay nada que arreglar: cuando LinkedIn confirme el acceso por correo, vuelve a pulsar Conectar en el panel.</p>'));
    }
    if (req.query.error || !req.query.code) {
      return res.status(400).send(pagina('No se ha conectado', '<p>LinkedIn no ha dado permiso. Puedes volver a intentarlo desde el panel.</p>'));
    }
    try {
      const token = await api.canjearCodigo(String(req.query.code));
      const quien = await api.perfil(token.token);
      let orgUrn = null, aviso = '';
      if (pend.cuenta === config.cuentaEmpresa) {
        if (config.orgId) orgUrn = `urn:li:organization:${config.orgId}`;
        else {
          const paginas = await api.paginasAdministradas(token.token).catch(() => []);
          if (paginas.length === 1) orgUrn = paginas[0];
          else aviso = paginas.length
            ? '<p><strong>Administras varias páginas.</strong> Define LINKEDIN_ORG_ID en Render con el número de la de Chilie y vuelve a conectar.</p>'
            : '<p><strong>No se ha encontrado ninguna página administrada.</strong> Define LINKEDIN_ORG_ID en Render con el número de la página de Chilie y vuelve a conectar.</p>';
        }
      }
      estado.cambiar(e => {
        e.cuentas[pend.cuenta] = { ...token, ...quien, conectada: Date.now() };
        if (orgUrn) e.orgUrn = orgUrn;
        for (const k of Object.keys(e.avisos)) if (k.endsWith(`-${pend.cuenta}`)) delete e.avisos[k];
      });
      const dias = Math.round((token.expira - Date.now()) / 86400000);
      res.send(pagina('Cuenta conectada', `<p>Listo${quien.nombre ? `, ${quien.nombre}` : ''}. El permiso dura ${dias} días${token.refresh ? ' y se renueva solo' : '; unos días antes llegará un correo para renovarlo'}.</p>${aviso}<p>Ya puedes cerrar esta pestaña.</p>`));
    } catch (err) {
      console.error('[LinkedIn] Conexión:', err.message);
      res.status(500).send(pagina('No se ha podido conectar', `<p>${String(err.message).replace(/[<>&]/g, '')}</p>`));
    }
  });

  app.use('/linkedin', r);

  // ── Planificador ─────────────────────────────────────────
  // Hasta que el estado no está cargado no se publica nada ni se atiende el panel.
  estado.iniciar().then(() => {
    listo = true;
    setInterval(() => plan.tick(), 60 * 1000).unref();
    console.log(`  LinkedIn: ${config.activo ? 'activo' : 'apagado (LINKEDIN_ENABLED)'} · datos en ${estado.destino()}`);
    if (!config.databaseUrl && process.env.RENDER) {
      console.warn('⚠  LinkedIn: sin LINKEDIN_DATABASE_URL los permisos y el historial se pierden en cada despliegue.');
    }
  }).catch(err => {
    errorInicio = err.message;
    console.error('[LinkedIn] No se ha podido cargar el estado; no se publicará nada:', err.message);
  });
  return plan;
};
