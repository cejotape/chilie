// Bot de Automa: activación por código, control de los días de soporte y revisiones en hilos privados.
import { randomBytes } from 'node:crypto';
import {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  PermissionFlagsBits,
  ThreadAutoArchiveDuration,
} from 'discord.js';
import { BRAND_COLOR, SUPPORT_DAYS, RESPONSE_HOURS, TICKET_FIELDS, ROLES, CATEGORIES } from './config.mjs';
import { load, save } from './store.mjs';
import { attach } from './remote.mjs';

// Este módulo se usa desde run.mjs (en local) y desde el servidor de Chilie (en Render).
// Nunca llama a process.exit: si algo falla, lanza un error y quien lo arranca decide.
const DAY = 24 * 60 * 60 * 1000;
const EPHEMERAL = { flags: MessageFlags.Ephemeral };
// GuildMessages solo se usa para ver cuándo otra copia del bot escribe en #datos-bot.
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
let store;
let GUILD_ID;
let expiryTimer;

// Los ids de roles y canales se buscan por nombre en el propio servidor, así el bot
// funciona en una máquina nueva sin copiar el store.json de quien ejecutó el setup.
async function resolveIds(guild) {
  const roles = await guild.roles.fetch();
  for (const def of ROLES) {
    const role = roles.find((r) => r.name === def.name && !r.managed);
    if (!role) throw new Error(`Falta el rol "${def.name}". Ejecuta el setup.`);
    store.ids.roles[def.key] = role.id;
  }
  const channels = await guild.channels.fetch();
  for (const cat of CATEGORIES) {
    const category = channels.find((c) => c && c.type === ChannelType.GuildCategory && c.name === cat.name);
    if (!category) throw new Error(`Falta la categoría "${cat.name}". Ejecuta el setup.`);
    for (const def of cat.channels) {
      const ch = channels.find((c) => c && c.name === def.name && c.type === def.type && c.parentId === category.id);
      if (!ch) throw new Error(`Falta el canal "${def.name}". Ejecuta el setup.`);
      store.ids.channels[def.key] = ch.id;
    }
  }
  // Guardado silencioso: resolver ids no es un cambio de datos, y no debe hacer que un
  // almacén recién creado (vacío) parezca más nuevo que la copia guardada en Discord.
  save(store, { silent: true });
}

const daysLeft = (until) => Math.max(0, Math.ceil((until - Date.now()) / DAY));
const normalize = (code) => code.trim().toUpperCase().replace(/\s+/g, '');
const newCode = () => {
  const part = () => randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
  return `AUT-${part()}-${part()}`;
};

async function audit(text) {
  try {
    const channel = await client.channels.fetch(store.ids.channels.registro);
    await channel.send({ content: text, allowedMentions: { parse: [] } });
  } catch (err) {
    console.error('No se pudo escribir en #registro:', err.message);
  }
}

async function grant(member, days, source) {
  const roles = [store.ids.roles.premium];
  if (days > 0) roles.push(store.ids.roles.soporte);
  await member.roles.add(roles, `Automa: ${source}`);
  store.members[member.id] = {
    activatedAt: Date.now(),
    supportUntil: Date.now() + days * DAY,
    expired: days === 0,
    source,
  };
  save(store);
}

// ---------- Comandos ----------

async function cmdActivar(interaction) {
  if (store.members[interaction.user.id]) {
    return interaction.reply({ content: 'Tu acceso ya está activado. Con `/soporte` ves los días que te quedan.', ...EPHEMERAL });
  }
  const code = normalize(interaction.options.getString('codigo', true));
  const entry = store.codes[code];
  if (!entry || entry.usedBy) {
    await audit(`⚠️ Código no válido probado por <@${interaction.user.id}>`);
    return interaction.reply({
      content: 'Ese código no es válido o ya se ha usado. Cópialo tal cual del email; si sigue fallando, contesta a ese email.',
      ...EPHEMERAL,
    });
  }
  // Se marca antes de dar los roles para que el mismo código no pueda usarse dos veces a la vez.
  entry.usedBy = interaction.user.id;
  entry.usedAt = Date.now();
  save(store);
  try {
    await grant(interaction.member, SUPPORT_DAYS, `código ${code}`);
  } catch (err) {
    entry.usedBy = null;
    entry.usedAt = null;
    save(store);
    throw err;
  }
  await audit(`✅ Alta de <@${interaction.user.id}> con el código \`${code}\``);
  return interaction.reply({
    content: [
      '**Acceso activado.** Ya ves todos los canales.',
      `• Preséntate en <#${store.ids.channels.presentaciones}>.`,
      `• Pide la revisión de tu caso en <#${store.ids.channels.abrirRevision}>. Tienes ${SUPPORT_DAYS} días de soporte.`,
    ].join('\n'),
    ...EPHEMERAL,
  });
}

async function cmdSoporte(interaction) {
  const m = store.members[interaction.user.id];
  if (!m) {
    return interaction.reply({ content: `Aún no has activado tu acceso. Hazlo en <#${store.ids.channels.activar}>.`, ...EPHEMERAL });
  }
  const left = daysLeft(m.supportUntil);
  const content =
    left > 0
      ? `Te quedan **${left} días** de soporte (hasta el <t:${Math.floor(m.supportUntil / 1000)}:D>).`
      : 'Tu periodo de soporte ha terminado. Sigues teniendo acceso a la comunidad y al taller.';
  return interaction.reply({ content, ...EPHEMERAL });
}

async function cmdCodigo(interaction) {
  const count = interaction.options.getInteger('cantidad') ?? 1;
  const codes = [];
  while (codes.length < count) {
    const code = newCode();
    if (store.codes[code]) continue;
    store.codes[code] = { createdAt: Date.now(), createdBy: interaction.user.id, usedBy: null, usedAt: null };
    codes.push(code);
  }
  save(store);
  await audit(`🔑 <@${interaction.user.id}> ha generado ${count} código(s)`);
  return interaction.reply({ content: `Códigos de un solo uso:\n\`\`\`\n${codes.join('\n')}\n\`\`\``, ...EPHEMERAL });
}

async function cmdAlta(interaction) {
  const user = interaction.options.getUser('usuario', true);
  const days = interaction.options.getInteger('dias') ?? SUPPORT_DAYS;
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply({ content: 'Ese usuario no está en el servidor.', ...EPHEMERAL });
  await grant(member, days, `alta manual de ${interaction.user.tag}`);
  await audit(`✅ Alta manual de <@${user.id}> por <@${interaction.user.id}> (${days} días de soporte)`);
  return interaction.reply({ content: `Acceso premium dado a <@${user.id}> con ${days} días de soporte.`, ...EPHEMERAL });
}

// ---------- Revisiones ----------

async function openTicketForm(interaction) {
  if (!interaction.member.roles.cache.has(store.ids.roles.soporte)) {
    return interaction.reply({ content: 'Tu periodo de soporte no está activo.', ...EPHEMERAL });
  }
  const openId = store.tickets[interaction.user.id];
  if (openId) {
    const thread = await client.channels.fetch(openId).catch(() => null);
    if (thread && !thread.archived) {
      return interaction.reply({ content: `Ya tienes una revisión abierta: <#${openId}>. Ciérrala antes de abrir otra.`, ...EPHEMERAL });
    }
    delete store.tickets[interaction.user.id];
    save(store);
  }
  const modal = new ModalBuilder().setCustomId('ticket_form').setTitle('Revisión de tu caso');
  for (const f of TICKET_FIELDS) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(f.id)
          .setLabel(f.label)
          .setStyle(f.long ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setMaxLength(f.long ? 1000 : 300)
          .setRequired(true),
      ),
    );
  }
  return interaction.showModal(modal);
}

async function createTicket(interaction) {
  await interaction.deferReply(EPHEMERAL);
  const parent = await client.channels.fetch(store.ids.channels.revisiones);
  const thread = await parent.threads.create({
    name: `revision-${interaction.user.username}`.slice(0, 90),
    type: ChannelType.PrivateThread,
    invitable: false,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    reason: `Revisión de ${interaction.user.tag}`,
  });
  await thread.members.add(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(`Revisión de ${interaction.user.username}`)
    .addFields(TICKET_FIELDS.map((f) => ({ name: f.label, value: interaction.fields.getTextInputValue(f.id).slice(0, 1024) })))
    .setFooter({ text: `Respuesta en un máximo de ${RESPONSE_HOURS} horas en días laborables` });
  const close = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar revisión').setStyle(ButtonStyle.Secondary),
  );
  await thread.send({
    content: `<@${interaction.user.id}> <@&${store.ids.roles.equipo}>`,
    embeds: [embed],
    components: [close],
    allowedMentions: { users: [interaction.user.id], roles: [store.ids.roles.equipo] },
  });
  await thread.send('Puedes añadir aquí capturas o enlaces. Tapa los datos personales de terceros antes de subirlos.');

  store.tickets[interaction.user.id] = thread.id;
  save(store);
  await audit(`📝 Revisión abierta por <@${interaction.user.id}>: <#${thread.id}>`);
  return interaction.editReply(`Revisión abierta: <#${thread.id}>`);
}

async function closeTicket(interaction) {
  const thread = interaction.channel;
  if (!thread?.isThread()) return interaction.reply({ content: 'Este botón solo funciona dentro de una revisión.', ...EPHEMERAL });
  const ownerId = Object.keys(store.tickets).find((id) => store.tickets[id] === thread.id);
  const isTeam = interaction.member.permissions.has(PermissionFlagsBits.ManageThreads);
  if (interaction.user.id !== ownerId && !isTeam) {
    return interaction.reply({ content: 'Solo puede cerrarla quien la abrió o el equipo.', ...EPHEMERAL });
  }
  await interaction.reply(`Revisión cerrada por <@${interaction.user.id}>.`);
  if (ownerId) {
    delete store.tickets[ownerId];
    save(store);
  }
  await thread.setLocked(true, 'Revisión cerrada');
  await thread.setArchived(true, 'Revisión cerrada');
  await audit(`📁 Revisión cerrada: ${thread.name}`);
}

// ---------- Caducidad del soporte ----------

async function expireSupport() {
  const guild = await client.guilds.fetch(GUILD_ID);
  for (const [userId, m] of Object.entries(store.members)) {
    if (m.expired || m.supportUntil > Date.now()) continue;
    try {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) {
        await member.roles.remove(store.ids.roles.soporte, 'Automa: fin del periodo de soporte');
        await member
          .send(
            `Tu periodo de soporte de Automa (${SUPPORT_DAYS} días) ha terminado. Sigues teniendo acceso a la comunidad y al taller del servidor.`,
          )
          .catch(() => {});
      }
      m.expired = true;
      save(store);
      await audit(`⌛ Fin del soporte de <@${userId}>`);
    } catch (err) {
      console.error(`No se pudo caducar el soporte de ${userId}:`, err.message);
    }
  }
}

// ---------- Arranque ----------

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.inCachedGuild() || interaction.guildId !== GUILD_ID) return;
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'activar') return await cmdActivar(interaction);
      if (interaction.commandName === 'soporte') return await cmdSoporte(interaction);
      if (interaction.commandName === 'codigo') return await cmdCodigo(interaction);
      if (interaction.commandName === 'alta') return await cmdAlta(interaction);
    }
    if (interaction.isButton() && interaction.customId === 'ticket_open') return await openTicketForm(interaction);
    if (interaction.isButton() && interaction.customId === 'ticket_close') return await closeTicket(interaction);
    if (interaction.isModalSubmit() && interaction.customId === 'ticket_form') return await createTicket(interaction);
  } catch (err) {
    console.error('Error en una interacción:', err);
    const msg = { content: 'Algo ha fallado. Inténtalo de nuevo; si se repite, avisa al equipo.', ...EPHEMERAL };
    if (interaction.isRepliable()) {
      await (interaction.deferred || interaction.replied ? interaction.followUp(msg) : interaction.reply(msg)).catch(() => {});
    }
  }
});

client.on(Events.Error, (err) => console.error('[automa-discord] Error del cliente:', err.message));

export async function start({ token, guildId }) {
  if (!token || !guildId) throw new Error('Faltan DISCORD_TOKEN o GUILD_ID');
  GUILD_ID = guildId;
  store = load();
  const ready = new Promise((resolve) => client.once(Events.ClientReady, resolve));
  await client.login(token);
  await ready;
  await resolveIds(await client.guilds.fetch(guildId));
  await attach({
    client,
    store,
    channelId: store.ids.channels.datos,
    retire: async () => {
      clearInterval(expiryTimer);
      await client.destroy();
    },
  });
  console.log(`[automa-discord] Bot en marcha como ${client.user.tag}`);
  expireSupport().catch((err) => console.error(err));
  expiryTimer = setInterval(() => expireSupport().catch((err) => console.error(err)), 60 * 60 * 1000);
  expiryTimer.unref();
}
