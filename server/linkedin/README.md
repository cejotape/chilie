# LinkedIn automático

Cada 3 días, a las 9:00 (hora de Madrid), el servidor publica un post con imagen en la página
de empresa de Chilie IA. Ese mismo día Iñigo lo repostea unas dos horas y media después y
Carlos por la tarde, cada uno con un comentario propio. Nadie revisa nada antes: el texto lo
redacta Claude y sale directamente.

Panel: `https://chilie-chatbot.onrender.com/linkedin?clave=LA_CLAVE`

Desde el panel se conectan las cuentas, se ve lo publicado, se pausa, se pide una vista previa
y se escribe el **tema especial**: lo que se ponga ahí (un proyecto, una novedad) es de lo que
trata el siguiente post, una sola vez.

## Puesta en marcha

### 1. App de LinkedIn

1. En <https://developer.linkedin.com> crear una app **nueva**, asociada a la página de Chilie IA.
   El nombre no puede contener "Linked" ni "In".
2. En la pestaña *Settings*, verificar la app con la página (lo aprueba un superadministrador
   de la página).
3. En *Products*, pedir **Community Management API**. Tiene que ser el único producto de la
   app; si la app ya tiene otro, la opción sale en gris. LinkedIn pide datos de la empresa
   (razón social, dirección, web, política de privacidad, correo corporativo) y lo revisa a mano:
   puede tardar días. Sin esta aprobación no se puede publicar como página.
4. En *Auth*, añadir como *Authorized redirect URL* exactamente:
   `https://chilie-chatbot.onrender.com/linkedin/callback`
5. Copiar *Client ID* y *Client Secret*.

### 2. Render (servicio `chilie-chatbot`)

- Los permisos de LinkedIn y el historial se guardan en una **base de datos Postgres externa**
  (el disco de Render se borra en cada despliegue). Vale cualquier Postgres gratuito, por
  ejemplo Supabase o Neon: crear un proyecto y copiar su cadena de conexión
  (`postgresql://usuario:contraseña@host:5432/base`). La tabla `linkedin_estado` se crea sola.
- Variables de entorno:

| Variable | Valor |
|---|---|
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | los de la app |
| `LINKEDIN_ADMIN_KEY` | una contraseña larga inventada: es la clave del panel |
| `LINKEDIN_DATABASE_URL` | la cadena de conexión del Postgres externo |
| `LINKEDIN_ENABLED` | `false` al principio; `true` cuando todo esté conectado |
| `LINKEDIN_ORG_ID` | opcional: el número de la página (el de la dirección `linkedin.com/company/NÚMERO/admin`). Solo hace falta si Iñigo administra más de una página |

### 3. Conectar las cuentas

1. Iñigo abre el panel y pulsa **Conectar** en su fila. Su permiso sirve para su perfil y para
   publicar como la página.
2. Carlos abre el mismo panel (con la misma clave) con **su** LinkedIn abierto en el navegador
   y pulsa **Conectar** en la suya.
3. En el panel, **Ver cómo quedaría** enseña un post de ejemplo sin publicar nada.
4. Poner `LINKEDIN_ENABLED=true`. El primer post sale ese mismo día si es entre las 9:00 y
   las 20:00, o a las 9:00 del día siguiente.

## Mantenimiento

- **Permisos de 60 días.** LinkedIn solo da permisos de 60 días (salvo que conceda renovación
  automática a la app). Llega un correo 7, 3 y 1 días antes; se renueva pulsando
  *Volver a autorizar* en el panel. Si caduca, esa cuenta deja de publicar hasta que se renueve.
- **Correos.** Van a la misma bandeja que el formulario de contacto: uno por cada post publicado
  (con el texto y el enlace) y uno cuando algo falla tres veces seguidas.
- **Post a medias.** Si el servidor se reinicia justo mientras publica, no reintenta solo, para
  no duplicar. Avisa por correo y en el panel se marca si el post llegó a salir o no.
- **Versión de la API.** `LINKEDIN_API_VERSION` (por defecto `202610`). LinkedIn retira cada
  versión al año: hay que subirla antes de octubre de 2027.

## Qué cambiar y dónde

| Para cambiar… | Archivo |
|---|---|
| Cada cuántos días, a qué hora, cuánto tardan los reposts, la voz de cada socio | `config.js` |
| Los temas que rotan y las reglas de redacción (no inventar clientes ni cifras, sin precios) | `contenido.js` |
| El diseño de la imagen | `imagen.js` |
| Cuándo se publica y qué pasa cuando algo falla | `planificador.js` |

## Sin probar contra LinkedIn real

El planificador, el panel y la imagen están probados en local. Las llamadas a LinkedIn están
escritas según su documentación pero no se han podido ejecutar hasta tener la app aprobada.
En la primera publicación real conviene mirar dos cosas que la documentación no confirma:
que un perfil personal puede repostear el post de la página por esta vía, y que el enlace del
texto queda bien.
