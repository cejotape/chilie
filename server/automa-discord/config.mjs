// Definición del servidor: roles, canales, permisos y textos. Cambia aquí y vuelve a ejecutar `npm run setup`.
import { ChannelType, PermissionFlagsBits as P } from 'discord.js';

export const SERVER_NAME = 'Automa';
export const BRAND_COLOR = 0x5b5bd6;
export const SUPPORT_DAYS = 30;
export const RESPONSE_HOURS = 48;

// Se crean en este orden: el primero queda arriba.
export const ROLES = [
  { key: 'fundador', name: 'Fundador', color: 0xe8590c, hoist: true, permissions: [P.Administrator] },
  {
    key: 'equipo',
    name: 'Equipo',
    color: 0x2f9e44,
    hoist: true,
    mentionable: true,
    permissions: [P.ManageMessages, P.ManageThreads, P.ModerateMembers, P.KickMembers, P.ViewAuditLog],
  },
  { key: 'premium', name: 'Premium', color: BRAND_COLOR, hoist: true, permissions: [] },
  { key: 'soporte', name: 'Soporte activo', color: 0xf59f00, hoist: false, permissions: [] },
];

// Tipos de acceso. `everyone` es el rol @everyone: quien entra sin activar su código.
const TEAM = [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageMessages, P.ManageThreads, P.SendMessagesInThreads];
const NO_WRITE = [P.SendMessages, P.CreatePublicThreads, P.CreatePrivateThreads];

export function overwrites(access, ids) {
  const team = { id: ids.equipo, allow: TEAM };
  switch (access) {
    case 'publico-lectura':
      return [{ id: ids.everyone, allow: [P.ViewChannel, P.ReadMessageHistory], deny: [...NO_WRITE, P.AddReactions] }, team];
    case 'publico-comandos':
      return [
        { id: ids.everyone, allow: [P.ViewChannel, P.ReadMessageHistory, P.UseApplicationCommands], deny: [...NO_WRITE, P.AddReactions] },
        team,
      ];
    case 'premium':
      return [
        { id: ids.everyone, deny: [P.ViewChannel] },
        { id: ids.premium, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks, P.AddReactions] },
        team,
      ];
    case 'premium-lectura':
      return [
        { id: ids.everyone, deny: [P.ViewChannel] },
        { id: ids.premium, allow: [P.ViewChannel, P.ReadMessageHistory, P.AddReactions], deny: NO_WRITE },
        team,
      ];
    case 'premium-voz':
      return [
        { id: ids.everyone, deny: [P.ViewChannel] },
        { id: ids.premium, allow: [P.ViewChannel, P.Connect, P.Speak, P.Stream] },
        { id: ids.equipo, allow: [P.ViewChannel, P.Connect, P.Speak, P.MuteMembers, P.MoveMembers] },
      ];
    case 'soporte-lectura':
      return [
        { id: ids.everyone, deny: [P.ViewChannel] },
        { id: ids.soporte, allow: [P.ViewChannel, P.ReadMessageHistory], deny: NO_WRITE },
        team,
      ];
    case 'soporte-hilos':
      return [
        { id: ids.everyone, deny: [P.ViewChannel] },
        {
          id: ids.soporte,
          allow: [P.ViewChannel, P.ReadMessageHistory, P.SendMessagesInThreads, P.AttachFiles, P.EmbedLinks],
          deny: NO_WRITE,
        },
        team,
      ];
    case 'equipo':
      return [{ id: ids.everyone, deny: [P.ViewChannel] }, team];
    default:
      throw new Error(`Acceso desconocido: ${access}`);
  }
}

const text = ChannelType.GuildText;
const voice = ChannelType.GuildVoice;

export const CATEGORIES = [
  {
    name: 'INICIO',
    access: 'publico-lectura',
    channels: [
      { key: 'bienvenida', name: 'bienvenida', type: text, access: 'publico-lectura', topic: 'Qué es este servidor y cómo entrar.' },
      { key: 'normas', name: 'normas', type: text, access: 'publico-lectura', topic: 'Las normas de la comunidad.' },
      { key: 'activar', name: 'activar-acceso', type: text, access: 'publico-comandos', topic: 'Escribe /activar y tu código para entrar.' },
      { key: 'anuncios', name: 'anuncios', type: text, access: 'premium-lectura', topic: 'Novedades del kit y del servidor.' },
    ],
  },
  {
    name: 'COMUNIDAD',
    access: 'premium',
    channels: [
      { key: 'presentaciones', name: 'presentaciones', type: text, access: 'premium', topic: 'Quién eres, qué servicio has elegido y para qué tipo de negocio.' },
      { key: 'general', name: 'general', type: text, access: 'premium', topic: 'Conversación general.' },
      { key: 'avances', name: 'avances', type: text, access: 'premium', topic: 'Tu primera muestra, tu primera respuesta, tu primer cliente.' },
      { key: 'dudas', name: 'dudas-entre-miembros', type: text, access: 'premium', topic: 'Ayuda entre miembros. Para una revisión del equipo, usa #abrir-revision.' },
      { key: 'sala', name: 'Sala común', type: voice, access: 'premium-voz' },
    ],
  },
  {
    name: 'TALLER',
    access: 'premium',
    channels: [
      { key: 'muestras', name: 'muestras', type: text, access: 'premium', topic: 'Enseña tu muestra y pide opinión.' },
      { key: 'captacion', name: 'captacion', type: text, access: 'premium', topic: 'Mensajes de contacto, seguimientos y llamadas.' },
      { key: 'prompts', name: 'prompts-y-skills', type: text, access: 'premium', topic: 'Mejoras y variantes de los prompts y skills del kit.' },
      { key: 'automatizaciones', name: 'automatizaciones', type: text, access: 'premium', topic: 'n8n, agentes y flujos.' },
    ],
  },
  {
    name: 'SOPORTE',
    access: 'soporte-lectura',
    channels: [
      { key: 'abrirRevision', name: 'abrir-revision', type: text, access: 'soporte-lectura', topic: 'Pide aquí la revisión de tu caso.' },
      { key: 'revisiones', name: 'revisiones', type: text, access: 'soporte-hilos', topic: 'Cada revisión es un hilo privado entre tú y el equipo.' },
    ],
  },
  {
    name: 'EQUIPO',
    access: 'equipo',
    channels: [
      { key: 'equipo', name: 'equipo', type: text, access: 'equipo', topic: 'Coordinación interna.' },
      { key: 'registro', name: 'registro', type: text, access: 'equipo', topic: 'Altas, caducidades y revisiones. Lo escribe el bot.' },
    ],
  },
];

// Mensajes fijos. `key` identifica el mensaje para editarlo en vez de duplicarlo al repetir el setup.
export const PANELS = [
  {
    key: 'bienvenida',
    channel: 'bienvenida',
    title: 'Bienvenido a Automa',
    description: [
      'Este es el servidor privado de quienes tienen **Automa Premium**.',
      '',
      '**Para entrar**',
      '1. Lee <#{normas}>.',
      '2. Ve a <#{activar}> y escribe `/activar` con el código que recibiste por email.',
      '',
      '**Qué hay dentro**',
      '• Comunidad con el resto de miembros.',
      '• Taller para enseñar muestras y mensajes de contacto.',
      `• Revisión de tu caso por el equipo durante ${SUPPORT_DAYS} días, con respuesta en ${RESPONSE_HOURS} horas laborables.`,
    ].join('\n'),
  },
  {
    key: 'normas',
    channel: 'normas',
    title: 'Normas',
    description: [
      '**1. Respeto.** Se critica el trabajo, no a la persona.',
      '**2. Sin promesas de dinero.** Nada de "gana X al mes" ni capturas de ingresos sin contexto. Cuenta qué hiciste y qué pasó.',
      '**3. Sin spam.** Nada de enlaces de afiliado, captación para otros cursos ni mensajes privados no pedidos.',
      '**4. El contenido del kit no se comparte fuera.** Tu acceso es personal.',
      '**5. Datos de clientes.** Tapa nombres, teléfonos y cualquier dato personal antes de subir una captura.',
      '**6. Cada cosa en su canal.** Las revisiones del equipo se piden en <#{abrirRevision}>, no por privado.',
      '',
      'El equipo puede retirar el acceso a quien incumpla estas normas.',
    ].join('\n'),
  },
  {
    key: 'activar',
    channel: 'activar',
    title: 'Activa tu acceso',
    description: [
      'Escribe aquí el comando `/activar` y pega el código que te llegó por email con la compra.',
      '',
      'El código es de un solo uso y queda ligado a tu cuenta de Discord.',
      `Al activarlo se abren los canales y empiezan a contar tus ${SUPPORT_DAYS} días de soporte.`,
      '',
      'Solo tú ves la respuesta del comando. Si el código no funciona, contesta al email de la compra.',
    ].join('\n'),
  },
  {
    key: 'soporte',
    channel: 'abrirRevision',
    title: 'Revisión de tu caso',
    description: [
      'Pulsa el botón y rellena el formulario. Se abrirá un hilo privado entre tú y el equipo.',
      '',
      '**Ten a mano**',
      '1. Tu oferta en una frase.',
      '2. Tu muestra o un enlace a ella.',
      '3. Tus últimos mensajes de contacto y qué respuesta tuvieron.',
      '4. Cuántos negocios has contactado y en cuántos días.',
      '5. Tu duda concreta.',
      '',
      `Respondemos en un máximo de ${RESPONSE_HOURS} horas en días laborables. Una revisión abierta cada vez.`,
      'Con `/soporte` ves los días que te quedan.',
    ].join('\n'),
    button: { id: 'ticket_open', label: 'Abrir revisión' },
  },
];

// Campos del formulario de revisión (Discord admite cinco como máximo).
export const TICKET_FIELDS = [
  { id: 'oferta', label: 'Tu oferta en una frase', long: false },
  { id: 'muestra', label: 'Tu muestra (enlace o descripción)', long: false },
  { id: 'mensajes', label: 'Últimos mensajes enviados y respuestas', long: true },
  { id: 'volumen', label: 'Negocios contactados y en cuántos días', long: false },
  { id: 'duda', label: 'Tu duda concreta', long: true },
];
