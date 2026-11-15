// Planificador: cada minuto mira si toca publicar el post de la empresa o algún repost.
//
// Ante la duda, no publica: si el servidor se cae justo mientras LinkedIn recibe un post,
// al arrancar no se sabe si llegó a salir, así que no se reintenta solo y se avisa por correo.
// Es preferible saltarse un post a publicarlo dos veces.

const config = require('./config');
const estado = require('./estado');

const MIN = 60 * 1000;
const MAX_INTENTOS = 3;
const ESPERA_REINTENTO = 20 * MIN;

function crear({ anthropic, mailer, api = require('./api'), contenido = require('./contenido'),
                 imagen = require('./imagen'), ahora = () => Date.now() }) {
  let ocupado = false;

  // ── Tiempo (hora de Madrid) ──────────────────────────────
  const formato = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  function madrid(ms) {
    const p = Object.fromEntries(formato.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
    return { fecha: `${p.year}-${p.month}-${p.day}`, minutos: Number(p.hour) * 60 + Number(p.minute) };
  }
  const aMinutos = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const dias = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

  // ── Avisos por correo ────────────────────────────────────
  async function avisar(asunto, texto) {
    console.log(`[LinkedIn] ${asunto}`);
    if (!mailer) return;
    try {
      await mailer.sendMail({
        from: `"Chilie IA · LinkedIn" <${process.env.SMTP_USER}>`,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        subject: `LinkedIn: ${asunto}`,
        text: `${texto}\n\nPanel: ${config.baseUrl}/linkedin`,
      });
    } catch (err) {
      console.error('[LinkedIn] No se ha podido enviar el aviso:', err.message);
    }
  }
  // Como avisar, pero como mucho una vez al día por cada clave.
  async function avisarUnaVez(clave, asunto, texto) {
    const hoy = madrid(ahora()).fecha;
    if (estado.leer().avisos[clave] === hoy) return;
    estado.cambiar(e => { e.avisos[clave] = hoy; });
    await avisar(asunto, texto);
  }

  // ── Claves ───────────────────────────────────────────────
  // Devuelve una clave válida de la cuenta o null (y avisa) si hay que volver a conectarla.
  async function tokenDe(id) {
    let c = estado.leer().cuentas[id];
    const nombre = config.cuentas[id].nombre;
    const enlace = `${config.baseUrl}/linkedin`;
    if (!c?.token) {
      await avisarUnaVez(`sin-${id}`, `falta conectar la cuenta de ${nombre}`,
        `La cuenta de ${nombre} no está conectada, así que no se puede publicar en su nombre. Se conecta desde el panel: ${enlace}`);
      return null;
    }
    if (c.expira - ahora() < 5 * 24 * 60 * MIN && c.refresh && (!c.refreshExpira || c.refreshExpira > ahora())) {
      try {
        const nuevo = await api.renovarToken(c.refresh);
        estado.cambiar(e => { Object.assign(e.cuentas[id], nuevo, { refresh: nuevo.refresh || c.refresh }); });
        c = estado.leer().cuentas[id];
      } catch (err) {
        console.error(`[LinkedIn] No se ha podido renovar la clave de ${id}:`, err.message);
      }
    }
    if (c.expira <= ahora() + 5 * MIN) {
      await avisarUnaVez(`caducada-${id}`, `el permiso de ${nombre} ha caducado`,
        `LinkedIn da permisos de 60 días y el de ${nombre} ha caducado. Hasta que vuelva a autorizar desde el panel no se publica en su nombre: ${enlace}`);
      return null;
    }
    return c.token;
  }

  async function revisarCaducidades() {
    for (const id of Object.keys(config.cuentas)) {
      const c = estado.leer().cuentas[id];
      if (!c?.token || c.refresh) continue;
      const quedan = Math.floor((c.expira - ahora()) / (24 * 60 * MIN));
      if ([7, 3, 1].includes(quedan)) {
        await avisarUnaVez(`caduca-${id}`, `el permiso de ${config.cuentas[id].nombre} caduca en ${quedan === 1 ? '1 día' : `${quedan} días`}`,
          `Para que no se corte la publicación, ${config.cuentas[id].nombre} tiene que volver a autorizar desde el panel (un clic si tiene LinkedIn abierto): ${config.baseUrl}/linkedin`);
      }
    }
  }

  // ── Post de la empresa ───────────────────────────────────
  // Genera texto e imagen sin publicar nada (también lo usa la vista previa del panel).
  async function preparar() {
    const e = estado.leer();
    const tema = contenido.siguienteTema(e);
    const anteriores = e.publicaciones.filter(p => p.urn).slice(-8);
    const borrador = await contenido.redactarPost(anthropic, tema, anteriores);
    const png = imagen.generar({ ...borrador, variante: e.publicaciones.length });
    return { tema, ...borrador, png };
  }

  async function publicarPost() {
    const token = await tokenDe(config.cuentaEmpresa);
    const org = estado.leer().orgUrn;
    if (!token) throw new Error('La cuenta que administra la página no está conectada.');
    if (!org) throw new Error('No se sabe cuál es la página de empresa. Vuelve a conectar la cuenta administradora o define LINKEDIN_ORG_ID.');

    const { tema, titular, etiqueta, texto, png } = await preparar();
    const img = await api.subirImagen(token, org, png);

    // Se apunta ANTES de llamar a LinkedIn: si el proceso muere en medio, queda constancia.
    const ts = ahora();
    const pub = {
      id: String(ts), ts, fecha: madrid(ts).fecha, tema: tema.id, titular, etiqueta, texto,
      estado: 'publicando', urn: null, reposts: {},
      azar: Object.fromEntries(Object.keys(config.cuentas).map(id => [id, Math.floor(Math.random() * 25)])),
    };
    estado.cambiar(e => { e.publicaciones.push(pub); });
    const quitar = () => estado.cambiar(e => { e.publicaciones = e.publicaciones.filter(p => p.id !== pub.id); });
    // Si la marca no ha quedado guardada, no se publica: sin ella un reinicio podría duplicar el post.
    try { await estado.guardado(); } catch (err) { quitar(); throw new Error(`No se ha podido guardar el estado: ${err.message}`); }

    let urn;
    try {
      urn = await api.crearPost(token, { author: org, texto, imagen: img, alt: titular });
    } catch (err) {
      // LinkedIn ha contestado con un error: seguro que no se ha publicado.
      if (err.status) quitar();
      throw err;
    }

    estado.cambiar(e => {
      const p = e.publicaciones.find(x => x.id === pub.id);
      p.estado = 'publicado';
      p.urn = urn;
      if (tema.especial) e.temaEspecial = null; else e.indiceTema += 1;
    });
    await avisar(`publicado "${titular}"`, `${texto}\n\n${api.enlacePost(urn)}`);
    return estado.leer().publicaciones.find(x => x.id === pub.id);
  }

  // ── Reposts ──────────────────────────────────────────────
  async function repostear(pub, id) {
    const token = await tokenDe(id);
    if (!token) return false;
    const cuenta = config.cuentas[id];
    const otros = Object.values(pub.reposts).filter(r => r.urn).map(r => r.texto);
    const texto = await contenido.redactarComentario(anthropic, cuenta, pub, otros);

    estado.cambiar(e => { e.publicaciones.find(p => p.id === pub.id).reposts[id] = { estado: 'publicando', texto, ts: ahora() }; });
    const quitar = () => estado.cambiar(e => { delete e.publicaciones.find(p => p.id === pub.id).reposts[id]; });
    try { await estado.guardado(); } catch (err) { quitar(); throw new Error(`No se ha podido guardar el estado: ${err.message}`); }
    let urn;
    try {
      urn = await api.crearPost(token, { author: estado.leer().cuentas[id].urn, texto, parent: pub.urn });
    } catch (err) {
      if (err.status) quitar();
      throw err;
    }
    estado.cambiar(e => { Object.assign(e.publicaciones.find(p => p.id === pub.id).reposts[id], { estado: 'publicado', urn }); });
    console.log(`[LinkedIn] Repost de ${id} publicado: ${api.enlacePost(urn)}`);
    return true;
  }

  // Lleva la cuenta de fallos de una tarea: tras MAX_INTENTOS se rinde y avisa una vez.
  async function conReintentos(clave, nombre, fn) {
    const reg = estado.leer().intentos?.[clave] || { n: 0, ultimo: 0 };
    if (reg.n >= MAX_INTENTOS || ahora() - reg.ultimo < ESPERA_REINTENTO) return;
    try {
      await fn();
      estado.cambiar(e => { if (e.intentos) delete e.intentos[clave]; });
    } catch (err) {
      const n = reg.n + 1;
      estado.cambiar(e => { (e.intentos ||= {})[clave] = { n, ultimo: ahora() }; });
      console.error(`[LinkedIn] ${nombre}, intento ${n}:`, err.message);
      if (n >= MAX_INTENTOS) await avisar(`ha fallado ${nombre}`, `Después de ${MAX_INTENTOS} intentos no ha salido. Último error:\n${err.message}`);
    }
  }

  // ── Lo que se hace cada minuto ───────────────────────────
  async function tick() {
    if (ocupado) return;
    ocupado = true;
    try {
      const e = estado.leer();
      if (!config.activo || e.pausado) return;
      const t = ahora();
      const { fecha, minutos } = madrid(t);
      const ultima = e.publicaciones.at(-1);

      // Un post que se quedó a medias: no se toca nada hasta que alguien lo mire.
      if (ultima?.estado === 'publicando') {
        if (t - ultima.ts > 10 * MIN) {
          await avisarUnaVez(`dudoso-${ultima.id}`, 'revisa el último post',
            `El servidor se reinició mientras publicaba "${ultima.titular}" y no se sabe si llegó a salir. Míralo en la página de LinkedIn y, desde el panel, marca si salió o no; hasta entonces la publicación automática está parada.`);
        }
        return;
      }

      await revisarCaducidades();

      // 1) Post de la empresa
      const toca = !ultima || dias(ultima.fecha, fecha) >= config.intervaloDias;
      if (toca && minutos >= aMinutos(config.horaPost) && minutos < aMinutos(config.horaLimite)) {
        await conReintentos(`post-${fecha}`, 'el post de la empresa', publicarPost);
        return;
      }

      // 2) Reposts del último post, cada uno a su hora
      if (!ultima?.urn || t - ultima.ts > 48 * 60 * MIN) return;
      const [desde, hasta] = config.ventanaRepost.map(aMinutos);
      if (minutos < desde || minutos >= hasta) return;
      for (const [id, cuenta] of Object.entries(config.cuentas)) {
        if (ultima.reposts[id]) continue;
        if (t < ultima.ts + (cuenta.retrasoMin + (ultima.azar?.[id] || 0)) * MIN) continue;
        await conReintentos(`repost-${ultima.id}-${id}`, `el repost de ${cuenta.nombre}`, () => repostear(ultima, id));
      }
    } catch (err) {
      console.error('[LinkedIn] Error en el planificador:', err.message);
    } finally {
      ocupado = false;
    }
  }

  // Publica ahora mismo desde el panel, sin esperar al día ni a la hora.
  async function publicarAhora() {
    if (ocupado) throw new Error('Hay otra publicación en marcha. Prueba en un minuto.');
    if (estado.leer().publicaciones.at(-1)?.estado === 'publicando') throw new Error('Hay un post pendiente de revisar.');
    ocupado = true;
    try { return await publicarPost(); } finally { ocupado = false; }
  }

  // Cuándo saldrá el próximo post, para enseñarlo en el panel.
  function proximo() {
    const e = estado.leer();
    const ultima = e.publicaciones.at(-1);
    if (!ultima) return `hoy o mañana a las ${config.horaPost}`;
    const d = new Date(Date.parse(`${ultima.fecha}T12:00:00Z`) + config.intervaloDias * 86400000);
    return `${d.toISOString().slice(0, 10)} a las ${config.horaPost}`;
  }

  return { tick, preparar, publicarAhora, proximo, madrid };
}

module.exports = { crear };
