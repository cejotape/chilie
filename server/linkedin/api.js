// Cliente mínimo de la API oficial de LinkedIn: OAuth, subida de imagen, post y repost.
// Documentación: learn.microsoft.com/linkedin/marketing/community-management/shares/posts-api

const config = require('./config');

const AUTH  = 'https://www.linkedin.com/oauth/v2';
const API   = 'https://api.linkedin.com';
const pausa = ms => new Promise(r => setTimeout(r, ms));

class ErrorLinkedIn extends Error {
  constructor(status, cuerpo, donde) {
    super(`LinkedIn ${status} en ${donde}: ${String(cuerpo).slice(0, 400)}`);
    this.status = status;
  }
}

async function llamar(metodo, url, token, cuerpo) {
  const res = await fetch(url, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': config.version,
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await res.text();
  if (!res.ok) throw new ErrorLinkedIn(res.status, texto, `${metodo} ${new URL(url).pathname}`);
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch (_e) { /* respuesta sin cuerpo JSON */ }
  return { json, id: res.headers.get('x-restli-id') };
}

// ── OAuth ──────────────────────────────────────────────────
function urlAutorizacion(scopes, state) {
  const q = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: scopes,
  });
  return `${AUTH}/authorization?${q}`;
}

async function pedirToken(params) {
  const res = await fetch(`${AUTH}/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, client_id: config.clientId, client_secret: config.clientSecret }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new ErrorLinkedIn(res.status, json.error_description || json.error || 'sin access_token', 'accessToken');
  }
  return {
    token:   json.access_token,
    expira:  Date.now() + (json.expires_in || 0) * 1000,
    // Solo las apps a las que LinkedIn se lo concede reciben refresh_token; si no viene,
    // hay que volver a autorizar a mano cada 60 días.
    refresh: json.refresh_token || null,
    refreshExpira: json.refresh_token_expires_in ? Date.now() + json.refresh_token_expires_in * 1000 : null,
    scope:   json.scope || '',
  };
}

const canjearCodigo  = code    => pedirToken({ grant_type: 'authorization_code', code, redirect_uri: config.redirectUri });
const renovarToken   = refresh => pedirToken({ grant_type: 'refresh_token', refresh_token: refresh });

// Quién es el dueño del token. /v2/me vale con r_basicprofile (app de Community Management);
// /v2/userinfo vale con "Sign In with LinkedIn" (openid profile).
async function perfil(token) {
  try {
    const { json } = await llamar('GET', `${API}/v2/me`, token);
    const nombre = [json.localizedFirstName, json.localizedLastName].filter(Boolean).join(' ');
    return { urn: `urn:li:person:${json.id}`, nombre };
  } catch (err) {
    if (err.status !== 403 && err.status !== 401) throw err;
    const { json } = await llamar('GET', `${API}/v2/userinfo`, token);
    return { urn: `urn:li:person:${json.sub}`, nombre: json.name || '' };
  }
}

// Páginas de empresa que administra el dueño del token.
async function paginasAdministradas(token) {
  const { json } = await llamar('GET',
    `${API}/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`, token);
  return (json?.elements || []).map(e => e.organization || e.organizationTarget).filter(Boolean);
}

// ── Imagen ─────────────────────────────────────────────────
// Devuelve el urn:li:image listo para usar en un post.
async function subirImagen(token, owner, png) {
  const { json } = await llamar('POST', `${API}/rest/images?action=initializeUpload`, token,
    { initializeUploadRequest: { owner } });
  const { uploadUrl, image } = json.value;

  const subida = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' },
    body: png,
  });
  if (!subida.ok) throw new ErrorLinkedIn(subida.status, await subida.text(), 'subida de imagen');

  // LinkedIn procesa la imagen después de subirla. Si se publica antes de que termine y el
  // procesado falla, el post queda invisible; por eso se espera a que esté disponible.
  for (let i = 0; i < 20; i++) {
    await pausa(i === 0 ? 1500 : 3000);
    const { json: estado } = await llamar('GET', `${API}/rest/images/${encodeURIComponent(image)}`, token);
    if (estado?.status === 'AVAILABLE') return image;
    if (estado?.status === 'PROCESSING_FAILED') throw new Error('LinkedIn no ha podido procesar la imagen.');
  }
  throw new Error('La imagen sigue procesándose en LinkedIn después de un minuto.');
}

// ── Texto ──────────────────────────────────────────────────
// El campo commentary usa el formato "little": estos caracteres hay que escaparlos siempre,
// salvo la almohadilla de un hashtag (#palabra), que se deja tal cual para que LinkedIn lo enlace.
function escapar(texto) {
  return String(texto).replace(/[|{}@\[\]()<>\\*_~]|#(?![\p{L}\p{N}])/gu, '\\$&');
}

// ── Posts ──────────────────────────────────────────────────
// author: urn de la página (urn:li:organization:…) o de la persona (urn:li:person:…).
// Con `parent` es un repost de ese post, con `texto` como comentario.
async function crearPost(token, { author, texto, imagen, alt, parent }) {
  const cuerpo = {
    author,
    commentary: escapar(texto),
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };
  if (imagen) cuerpo.content = { media: { id: imagen, altText: String(alt || '').slice(0, 300) } };
  if (parent) cuerpo.reshareContext = { parent };

  const { id } = await llamar('POST', `${API}/rest/posts`, token, cuerpo);
  if (!id) throw new Error('LinkedIn ha aceptado el post pero no ha devuelto su identificador.');
  return id;   // urn:li:share:… o urn:li:ugcPost:…
}

const enlacePost = urn => `https://www.linkedin.com/feed/update/${urn}`;

module.exports = {
  ErrorLinkedIn, urlAutorizacion, canjearCodigo, renovarToken, perfil, paginasAdministradas,
  subirImagen, crearPost, escapar, enlacePost,
};
