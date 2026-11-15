// Copia persistente de los datos dentro de Discord.
//
// El bot guarda su store.json como adjunto de un mensaje en #datos-bot (canal que solo ven
// los administradores). Al arrancar en una máquina nueva o tras un despliegue, lo recupera
// de ahí, así que no hace falta disco persistente en el servidor.
//
// Si hay dos copias del bot en marcha (por ejemplo, durante un despliegue), la más antigua
// se retira en cuanto ve escribir a la más nueva, para que no respondan las dos.
import { empty, save, setAfterSave } from './store.mjs';

const FILE_NAME = 'store.json';
const me = { startedAt: Date.now(), id: Math.random().toString(36).slice(2, 8) };

let client;
let store;
let channel;
let message = null;
let onRetire = () => {};
let retired = false;
let uploading = false;
let dirty = false;

const header = () => `automa-store v1 | inicio=${me.startedAt} | instancia=${me.id} | guardado=${store.updatedAt ?? 0}`;

function parseHeader(content) {
  const m = /inicio=(\d+) \| instancia=(\w+)/.exec(content ?? '');
  return m ? { startedAt: Number(m[1]), id: m[2] } : null;
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar la copia de datos (${res.status})`);
  return res.json();
}

// Sustituye el contenido del almacén en memoria conservando los ids ya resueltos.
function adopt(remote) {
  const ids = store.ids;
  for (const key of Object.keys(store)) delete store[key];
  Object.assign(store, empty(), remote, { ids });
  save(store, { silent: true });
}

async function upload() {
  if (retired) return;
  if (uploading) {
    dirty = true;
    return;
  }
  uploading = true;
  try {
    do {
      dirty = false;
      const payload = {
        content: header(),
        files: [{ attachment: Buffer.from(JSON.stringify(store), 'utf8'), name: FILE_NAME }],
      };
      message = message ? await message.edit({ ...payload, attachments: [] }) : await channel.send(payload);
    } while (dirty && !retired);
  } catch (err) {
    console.error('[automa-discord] No se pudo guardar la copia de datos en Discord:', err.message);
  } finally {
    uploading = false;
  }
}

async function onForeignWrite(data, other) {
  if (other.startedAt > me.startedAt) {
    retired = true;
    console.log('[automa-discord] Hay una copia más nueva del bot en marcha: esta se retira.');
    await onRetire();
    return;
  }
  // Una copia más antigua ha escrito después de que esta arrancase: se recogen sus datos
  // y se vuelve a escribir para que esa copia se retire.
  const url = data.attachments?.[0]?.url;
  if (url) {
    const remote = await download(url);
    if ((remote.updatedAt ?? 0) > (store.updatedAt ?? 0)) adopt(remote);
  }
  await upload();
}

export async function attach({ client: c, store: s, channelId, retire }) {
  client = c;
  store = s;
  onRetire = retire;
  channel = await client.channels.fetch(channelId);

  const recent = await channel.messages.fetch({ limit: 25 });
  message = recent.find((m) => m.author.id === client.user.id && m.attachments.some((a) => a.name === FILE_NAME)) ?? null;
  if (message) {
    const remote = await download(message.attachments.find((a) => a.name === FILE_NAME).url);
    if ((remote.updatedAt ?? 0) >= (store.updatedAt ?? 0)) {
      adopt(remote);
      console.log('[automa-discord] Datos recuperados de #datos-bot');
    }
  }

  client.on('raw', (packet) => {
    if (packet.t !== 'MESSAGE_UPDATE' && packet.t !== 'MESSAGE_CREATE') return;
    const d = packet.d;
    if (d.channel_id !== channel.id || d.author?.id !== client.user.id) return;
    const other = parseHeader(d.content);
    if (!other || other.id === me.id || retired) return;
    onForeignWrite(d, other).catch((err) => console.error('[automa-discord] Error al sincronizar datos:', err.message));
  });

  setAfterSave(() => {
    upload();
  });
  await upload();
}
