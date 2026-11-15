# Automa — bot de Discord

Bot del servidor privado de Automa Premium: canjea códigos de activación, controla los 30 días de soporte y abre las revisiones en hilos privados.

El código fuente original, el script que construye el servidor (`setup`) y la documentación completa están en el proyecto `tiktokchilie/discord`. Estos tres archivos son una copia: si cambias algo, cámbialo allí y vuelve a copiarlos.

## Cómo se arranca

`server.js` lo carga al iniciar si `AUTOMA_DISCORD_ENABLED` vale `true`. Si falla, lo anota en el log y el resto del servidor sigue funcionando.

## Variables de entorno

| Variable | Valor |
|---|---|
| `AUTOMA_DISCORD_ENABLED` | `true` para arrancarlo |
| `AUTOMA_DISCORD_TOKEN` | Token del bot (Developer Portal de Discord) |
| `AUTOMA_GUILD_ID` | ID del servidor de Discord |
| `AUTOMA_DATA_DIR` | Carpeta de datos. En Render, `/var/data/automa` (disco persistente) |

## Datos

Códigos, altas y fechas de fin de soporte se guardan en `AUTOMA_DATA_DIR/store.json`. Esa carpeta tiene que estar en un disco persistente: sin él, cada despliegue borra los datos.

## Una sola copia en marcha

No arranques el bot en local (`npm start` en `tiktokchilie/discord`) mientras esté activo aquí: las dos copias responderían a los mismos comandos y cada una guardaría sus datos por separado.
