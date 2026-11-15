// Almacén en un archivo JSON: ids del servidor, códigos, miembros y revisiones abiertas.
// El archivo local es solo una caché: la copia que sobrevive a los despliegues es la que
// remote.mjs guarda en el canal #datos-bot del propio servidor de Discord.
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.env.AUTOMA_DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const file = join(dir, 'store.json');

export const empty = () => ({
  updatedAt: 0,
  ids: { roles: {}, channels: {} },
  messages: {},
  codes: {},
  members: {},
  tickets: {},
});

export function load() {
  if (!existsSync(file)) return empty();
  return { ...empty(), ...JSON.parse(readFileSync(file, 'utf8')) };
}

let afterSave = null;
export function setAfterSave(fn) {
  afterSave = fn;
}

// `silent` guarda solo en local, sin cambiar la fecha ni avisar a la copia remota.
export function save(data, { silent = false } = {}) {
  if (!silent) data.updatedAt = Date.now();
  mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  renameSync(tmp, file);
  if (!silent && afterSave) afterSave();
}
