// Estado persistente: claves de LinkedIn, historial de publicaciones y cola de temas.
//
// Con LINKEDIN_DATABASE_URL se guarda en una base de datos Postgres externa (una sola fila
// con todo el JSON), que es lo que se usa en Render porque su disco se borra en cada
// despliegue. Sin esa variable se guarda en un archivo de config.dataDir (para local).
//
// El estado vive en memoria: iniciar() lo carga una vez, cambiar() lo modifica y lanza el
// guardado, y guardado() permite esperar a que lo último esté de verdad escrito.

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
let pool = null;
let cola = Promise.resolve();

async function iniciar() {
  if (cache) return cache;
  let guardado = null;
  if (config.databaseUrl) {
    const { Pool } = require('pg');
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(config.databaseUrl);
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: local ? false : { rejectUnauthorized: false },
      max: 2,
    });
    pool.on('error', err => console.error('[LinkedIn] Base de datos:', err.message));
    await pool.query(`create table if not exists linkedin_estado (
      id int primary key, datos jsonb not null, actualizado timestamptz not null default now())`);
    guardado = (await pool.query('select datos from linkedin_estado where id = 1')).rows[0]?.datos || null;
  } else {
    try { guardado = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')); }
    catch (err) { if (err.code !== 'ENOENT') throw err; }
  }
  cache = { ...structuredClone(INICIAL), ...(guardado || {}) };
  return cache;
}

function leer() {
  if (!cache) throw new Error('El estado de LinkedIn todavía no está cargado.');
  return cache;
}

async function escribir() {
  const datos = JSON.stringify(cache);
  if (pool) {
    await pool.query(
      `insert into linkedin_estado (id, datos, actualizado) values (1, $1::jsonb, now())
       on conflict (id) do update set datos = excluded.datos, actualizado = now()`, [datos]);
  } else {
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.writeFileSync(ARCHIVO + '.tmp', datos);
    fs.renameSync(ARCHIVO + '.tmp', ARCHIVO);
  }
}

// Aplica un cambio y lanza el guardado. fn recibe el estado y lo modifica en el sitio.
function cambiar(fn) {
  const e = leer();
  fn(e);
  if (e.publicaciones.length > 80) e.publicaciones = e.publicaciones.slice(-80);
  cola = cola.catch(() => {}).then(escribir);
  cola.catch(err => console.error('[LinkedIn] No se ha podido guardar el estado:', err.message));
  return e;
}

// Se resuelve cuando el último cambio está guardado; falla si no se ha podido guardar.
const guardado = () => cola;

const destino = () => (config.databaseUrl ? 'base de datos externa' : ARCHIVO);

module.exports = { iniciar, leer, cambiar, guardado, destino };
