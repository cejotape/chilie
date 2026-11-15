// Redacción con Claude: el post de la página de empresa y el comentario con el que cada
// socio lo repostea. Los temas rotan; un "tema especial" escrito en el panel pasa por delante.

const config = require('./config');

const WEB = 'https://www.chilieia.com';

// Lo que Chilie vende, tal y como está en la web. Es lo único que el modelo puede afirmar.
const EMPRESA = `Chilie IA es un estudio de software e inteligencia artificial de Madrid que trabaja para pymes de toda España. Lo fundaron Iñigo Iza (ingeniería) y Carlos Jiménez (producto y diseño); lo diseñan y lo programan ellos, sin intermediarios ni subcontratas.

Qué vende:
- Agentes de voz con IA: cogen el teléfono las 24 horas, resuelven dudas, reservan citas sobre la agenda real, hacen llamadas de recordatorio y pasan la llamada a una persona cuando hace falta. Se presentan siempre como asistente virtual.
- Chatbots con IA para web, WhatsApp (API oficial de Meta) e Instagram: responden con la información real del negocio, cualifican contactos, reservan citas y gestionan pedidos.
- Automatización de procesos: correo que se clasifica y se responde (primero como borrador), contactos del formulario al CRM, facturas en PDF leídas sin teclear, recordatorios, informes y avisos al equipo. Con n8n o código propio.
- Software a medida: paneles internos, CRMs, portales de clientes y aplicaciones web instalables en el móvil. Primera versión útil en torno a dos semanas.

Cómo trabaja: llamada de 45 minutos, propuesta por escrito en 24 horas con plazo y presupuesto cerrados, y 30 días de soporte en todos los proyectos.
Sectores habituales: clínicas (dentales, veterinarias, estética), inmobiliarias, restaurantes, alquiler vacacional, tiendas online, asesorías y despachos, academias y gimnasios, reformas, barberías.
En ${WEB}/demos hay diez asistentes de ejemplo que se pueden probar.`;

const REGLAS = `Reglas que no se rompen:
- No inventes clientes, casos reales, testimonios, cifras de resultados ni porcentajes. Si quieres ilustrar algo, usa una situación corriente contada como ejemplo ("una clínica que recibe llamadas mientras atiende en el mostrador"), nunca como caso real con números.
- No cites estadísticas ni estudios, porque no puedes comprobarlos.
- No des precios.
- No prometas resultados ni plazos más allá de lo que dice la descripción de la empresa.
- Español de España, de tú. Frases claras, sin palabrería de marketing ("revoluciona", "lleva tu negocio al siguiente nivel", "en la era de la IA") y sin frases hechas de LinkedIn.
- Texto plano: LinkedIn no interpreta Markdown. Nada de asteriscos, almohadillas de título ni listas con guiones; si hace falta enumerar, una idea por línea.
- Sin emojis.`;

// Temas fijos. Se recorren en orden y se vuelve a empezar; el modelo recibe los últimos
// posts para no repetir ángulo cuando un tema vuelve a tocar.
const TEMAS = [
  { id: 'voz-llamadas',   etiqueta: 'Agentes de voz',     url: '/agentes-de-voz-ia',  enfoque: 'Las llamadas que un negocio pequeño no llega a coger (en pleno servicio, fuera de horario) y qué hace un agente de voz con ellas.' },
  { id: 'ia-por-donde',   etiqueta: 'IA para empresas',   url: '/servicios',          enfoque: 'Por dónde empezar con la IA en una pyme: elegir una tarea repetitiva concreta en vez de "poner IA".' },
  { id: 'chat-whatsapp',  etiqueta: 'Chatbots',           url: '/chatbots-ia',        enfoque: 'Un chatbot en WhatsApp que responde con la información real del negocio, frente a los menús de botones de siempre.' },
  { id: 'auto-correo',    etiqueta: 'Automatización',     url: '/automatizacion-ia',  enfoque: 'El correo y los formularios que hoy alguien copia a mano al CRM o a una hoja de cálculo.' },
  { id: 'sector-clinicas', etiqueta: 'Clínicas',          url: '/sectores/clinicas',  enfoque: 'La recepción de una clínica: citas, confirmaciones y recordatorios sin que nadie tenga que dejar el mostrador.' },
  { id: 'soft-medida',    etiqueta: 'Software a medida',  url: '/software-a-medida',  enfoque: 'Cuándo compensa un panel o una herramienta hecha a medida frente a adaptar el negocio a un programa genérico.' },
  { id: 'voz-natural',    etiqueta: 'Agentes de voz',     url: '/agentes-de-voz-ia',  enfoque: 'Qué tiene que hacer bien un agente de voz para no molestar: decir que es una IA, no alargar, pasar la llamada a una persona a tiempo.' },
  { id: 'sector-inmo',    etiqueta: 'Inmobiliarias',      url: '/sectores/inmobiliarias', enfoque: 'Las llamadas de los portales inmobiliarios: cualificar y agendar visitas sin perder al interesado.' },
  { id: 'chat-leads',     etiqueta: 'Chatbots',           url: '/chatbots-ia',        enfoque: 'Los contactos que llegan a la web fuera de horario y se enfrían antes de que nadie responda.' },
  { id: 'como-trabajamos', etiqueta: 'Cómo trabajamos',   url: '/nosotros',           enfoque: 'Cómo es encargar un proyecto a Chilie: una llamada, propuesta cerrada en 24 horas, y hablas con quien lo programa.' },
  { id: 'sector-resto',   etiqueta: 'Restaurantes',       url: '/sectores/restaurantes', enfoque: 'Reservas por teléfono y WhatsApp en pleno servicio, cuando nadie puede coger el teléfono.' },
  { id: 'auto-facturas',  etiqueta: 'Automatización',     url: '/automatizacion-ia',  enfoque: 'Tareas de oficina que se repiten cada semana: facturas en PDF, informes, recordatorios, avisos al equipo.' },
  { id: 'demos',          etiqueta: 'Demos',              url: '/demos',              enfoque: 'Probar antes de decidir: los asistentes de ejemplo de la web y qué mirar al probar uno.' },
  { id: 'sector-vacacional', etiqueta: 'Alquiler vacacional', url: '/sectores/alquiler-vacacional', enfoque: 'Huéspedes que escriben a cualquier hora y en varios idiomas, y qué debe llegar de verdad al responsable de guardia.' },
  { id: 'ia-humano',      etiqueta: 'IA para empresas',   url: '/servicios',          enfoque: 'Qué debe seguir haciendo una persona y qué no: la IA para lo repetitivo, el equipo para lo que importa.' },
];

function textoDe(mensaje) {
  if (mensaje.stop_reason === 'refusal') throw new Error('El modelo ha rechazado la petición.');
  if (mensaje.stop_reason === 'max_tokens') throw new Error('La respuesta del modelo se ha cortado.');
  return mensaje.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
}

function jsonDe(texto) {
  const a = texto.indexOf('{'), b = texto.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('El modelo no ha devuelto JSON.');
  return JSON.parse(texto.slice(a, b + 1));
}

async function pedir(anthropic, system, user) {
  const mensaje = await anthropic.messages.create({
    model: config.modelo,
    max_tokens: 8000,
    output_config: { effort: 'medium' },
    system,
    messages: [{ role: 'user', content: user }],
  });
  return textoDe(mensaje);
}

// Elige el tema del próximo post sin gastar nada: el especial si hay, si no el que toca.
function siguienteTema(estado) {
  if (estado.temaEspecial?.texto) {
    return { id: 'especial', etiqueta: '', url: '', enfoque: estado.temaEspecial.texto, especial: true };
  }
  return TEMAS[estado.indiceTema % TEMAS.length];
}

// Devuelve { titular, etiqueta, texto } para el post de la página de empresa.
async function redactarPost(anthropic, tema, anteriores) {
  const system = `Escribes las publicaciones de LinkedIn de la página de empresa de Chilie IA. El objetivo es que dueños y responsables de pymes españolas se reconozcan en el problema, comenten y, si les encaja, entren en la web o escriban.

${EMPRESA}

${REGLAS}

Forma del post:
- Entre 700 y 1.300 caracteres.
- La primera línea tiene que funcionar sola: es lo único que se ve antes de "ver más". Una situación concreta o una afirmación con la que alguien pueda no estar de acuerdo; nunca una pregunta retórica ni un "¿Sabías que…?".
- Párrafos de una a tres líneas, separados por una línea en blanco.
- Habla la empresa: "nosotros", "en Chilie".
- Termina con una pregunta concreta que alguien pueda contestar desde su experiencia en un comentario, y en la línea siguiente el enlace que se te indica, tal cual.
- Última línea: dos o tres hashtags en español, sin tildes, pegados a la almohadilla (#automatizacion).

Responde solo con un objeto JSON, sin nada antes ni después:
{"titular": "frase para la imagen del post, de 4 a 9 palabras, sin punto final, que se entienda sin leer el texto", "etiqueta": "categoría de 1 a 3 palabras para la imagen", "texto": "el post completo"}`;

  const previos = anteriores.length
    ? `Publicaciones recientes de la página (no repitas arranque, ejemplo ni pregunta final):\n${anteriores.map(p => `- ${p.titular}: ${String(p.texto).split('\n')[0]}`).join('\n')}`
    : 'Es la primera publicación de la página.';

  const encargo = tema.especial
    ? `Tema de hoy, pedido por el equipo (los datos que da aquí el equipo sí puedes usarlos tal cual, incluidos nombres y cifras):\n${tema.enfoque}\n\nEnlace para el final: ${WEB}/contacto, salvo que el encargo indique otro.`
    : `Tema de hoy: ${tema.enfoque}\nEtiqueta para la imagen: ${tema.etiqueta}\nEnlace para el final: ${WEB}${tema.url}`;

  const r = jsonDe(await pedir(anthropic, system, `${encargo}\n\n${previos}`));
  const titular = String(r.titular || '').trim();
  const texto = String(r.texto || '').trim();
  if (titular.length < 8 || titular.length > 110) throw new Error('El titular generado no es válido.');
  if (texto.length < 300 || texto.length > 2800) throw new Error(`El texto generado no tiene una longitud válida (${texto.length}).`);
  return { titular, etiqueta: String(r.etiqueta || tema.etiqueta || 'IA para empresas').trim().slice(0, 40), texto };
}

// Comentario con el que una persona repostea el post de la empresa. otros: comentarios que
// ya han puesto los demás socios en ese mismo post, para no decir lo mismo.
async function redactarComentario(anthropic, cuenta, post, otros) {
  const system = `Escribes en nombre de ${cuenta.nombre}, ${cuenta.rol}. Va a compartir en su perfil personal de LinkedIn una publicación de la página de su empresa y necesita el comentario que la acompaña.

${EMPRESA}

Su voz: ${cuenta.voz}

${REGLAS}

Forma del comentario:
- Entre 200 y 450 caracteres, uno o dos párrafos cortos.
- En primera persona del singular. Tiene que sonar a alguien que añade algo suyo, no a alguien que anuncia que su empresa ha publicado. No resumas el post ni lo presentes ("os dejo", "os comparto", "nuevo post").
- Aporta un matiz, una observación del día a día de su trabajo o una opinión que el post no dice. Sin inventar anécdotas con clientes concretos.
- Sin enlaces y sin hashtags: el post compartido ya los lleva.

Responde solo con el texto del comentario, sin comillas ni nada más.`;

  const ya = otros.length
    ? `\n\nOtro socio ya lo ha compartido con este comentario; el tuyo tiene que ir por otro lado:\n${otros.map(t => `"${t}"`).join('\n')}`
    : '';
  const texto = (await pedir(anthropic, system, `Publicación de Chilie IA que va a compartir:\n\n${post.texto}${ya}`))
    .replace(/^["«]|["»]$/g, '').trim();
  if (texto.length < 60 || texto.length > 1200) throw new Error(`El comentario generado no tiene una longitud válida (${texto.length}).`);
  return texto;
}

module.exports = { TEMAS, siguienteTema, redactarPost, redactarComentario };
