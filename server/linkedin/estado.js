// Estado persistente: claves de LinkedIn, historial de publicaciones y cola de temas.
// Es un único JSON en config.dataDir. Se escribe a un temporal y se renombra, para que un
// corte a mitad de escritura no deje el archivo roto.

const fs = require('fs');
const path = require('path');
const config = require('./config');

const ARCHIVO = path.join(config.dataDir, 'linkedin.json');
const INICIAL = {
  pausado: false,
  cuentas: {},          // { inigo: { token, expira, urn, nombre, refresh? }, carlos: {...} }
  orgUrn: '',
  publicaciones: [],    // la más reciente al final
  indiceTema: 0,
  temaEspecial: null,   // { texto, creado }
  avisos: {},           // último día en que se mandó cada aviso, para no repetirlos
};

let cache = null;

function leer() {
  if (cache) return cache;
  try {
    cache = { ...structuredClone(INICIAL), ...JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')) };
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[LinkedIn] No se ha podido leer el estado:', err.message);
    cache = structuredClone(INICIAL);
  }
  return cache;
}

function guardar() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  const tmp = ARCHIVO + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, ARCHIVO);
}

// Aplica un cambio y lo guarda. fn recibe el estado y lo modifica en el sitio.
function cambiar(fn) {
  const e = leer();
  fn(e);
  if (e.publicaciones.length > 80) e.publicaciones = e.publicaciones.slice(-80);
  guardar();
  return e;
}

module.exports = { leer, cambiar, ARCHIVO };
