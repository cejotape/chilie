// Configuración de la automatización de LinkedIn. Todo lo que cambia entre local y Render
// viene de variables de entorno; lo demás (cuentas, horarios, temas) se edita aquí.

const path = require('path');
const env = process.env;

const base = env.RENDER_EXTERNAL_URL || `http://localhost:${env.PORT || 3001}`;

module.exports = {
  // Interruptor general: sin LINKEDIN_ENABLED=true el planificador no publica nada
  // (el panel y la conexión de cuentas funcionan igual, para poder dejarlo preparado).
  activo: env.LINKEDIN_ENABLED === 'true',

  clientId:     env.LINKEDIN_CLIENT_ID || '',
  clientSecret: env.LINKEDIN_CLIENT_SECRET || '',
  adminKey:     env.LINKEDIN_ADMIN_KEY || '',
  baseUrl:      base,
  redirectUri:  env.LINKEDIN_REDIRECT_URI || `${base}/linkedin/callback`,

  // Versión de la API de LinkedIn (AAAAMM). Cada versión dura un año: subirla una vez al año.
  version: env.LINKEDIN_API_VERSION || '202610',

  // Id numérico de la página de empresa. Si se deja vacío se averigua al conectar la cuenta
  // administradora (vale cuando esa persona solo administra una página).
  orgId: env.LINKEDIN_ORG_ID || '',

  // Carpeta donde se guardan las claves de LinkedIn y el historial. En Render tiene que ser
  // un disco persistente (/var/data): el disco normal se borra en cada despliegue.
  dataDir: env.LINKEDIN_DATA_DIR || path.join(__dirname, '..', '.data'),

  modelo: env.LINKEDIN_MODEL || 'claude-opus-5-5',

  intervaloDias: Number(env.LINKEDIN_INTERVAL_DAYS) || 3,
  horaPost:      env.LINKEDIN_POST_TIME || '09:00',   // hora de Madrid
  horaLimite:    '20:00',                             // después de esta hora ya no se publica el post del día
  ventanaRepost: ['08:00', '22:00'],                  // los reposts solo salen en esta franja

  // Cuenta cuyo permiso de administrador se usa para publicar como la página de empresa.
  cuentaEmpresa: 'inigo',

  // Cuentas personales. retrasoMin = minutos después del post de empresa a los que repostea
  // (se le suman hasta 25 minutos al azar para que no salga siempre a la misma hora exacta).
  cuentas: {
    inigo: {
      nombre: 'Iñigo Iza',
      rol: 'cofundador de Chilie IA, lleva la ingeniería: arquitectura, backend e integraciones',
      voz: 'Técnico pero llano. Habla desde lo que ve al construir los sistemas: qué falla, qué funciona, qué decisiones se toman por dentro.',
      retrasoMin: 150,
      scopes: env.LINKEDIN_SCOPES_INIGO || 'r_basicprofile w_member_social w_organization_social rw_organization_admin',
    },
    carlos: {
      nombre: 'Carlos Jiménez',
      rol: 'cofundador de Chilie IA, lleva producto y diseño: cómo lo vive el cliente final y el negocio que lo contrata',
      voz: 'Cercano y de negocio. Habla desde lo que ve en las conversaciones con clientes y en cómo usa la gente los sistemas.',
      retrasoMin: 420,
      scopes: env.LINKEDIN_SCOPES_CARLOS || 'r_basicprofile w_member_social',
    },
  },
};
