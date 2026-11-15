// Almacén en un archivo JSON: ids del servidor, códigos, miembros y revisiones abiertas.
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// En el servidor, AUTOMA_DATA_DIR apunta al disco persistente; en local se usa ../data.
const dir = process.env.AUTOMA_DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const file = join(dir, 'store.json');

const empty = () => ({
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

export function save(data) {
  mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  renameSync(tmp, file);
}
