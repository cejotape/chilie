# Automa — bot de Discord

Bot del servidor privado de Automa Premium: canjea códigos de activación, controla los 30 días de soporte y abre las revisiones en hilos privados.

El código fuente original, el script que construye el servidor (`setup`) y la documentación completa están en el proyecto `tiktokchilie/discord`. Estos archivos son una copia: si cambias algo, cámbialo allí y vuelve a copiarlos.

## Cómo se arranca

`server.js` lo carga al iniciar si `AUTOMA_DISCORD_ENABLED` vale `true`. Si falla, lo anota en el log y el resto del servidor sigue funcionando.

## Variables de entorno

| Variable | Valor |
|---|---|
| `AUTOMA_DISCORD_ENABLED` | `true` para arrancarlo |
| `AUTOMA_DISCORD_TOKEN` | Token del bot (Developer Portal de Discord) |
| `AUTOMA_GUILD_ID` | ID del servidor de Discord |
| `AUTOMA_DATA_DIR` | Carpeta de caché local. En Render, `/tmp/automa` |

## Datos: no hace falta disco

Códigos, altas y fechas de fin de soporte se guardan como un archivo adjunto en el canal `#datos-bot` del propio servidor de Discord, que solo ven los administradores. Cada cambio se sube al momento, y al arrancar el bot recupera los datos de ahí. La carpeta `AUTOMA_DATA_DIR` es solo una caché y puede borrarse en cada despliegue.

No escribas ni borres nada en `#datos-bot`: si se borra ese mensaje con el bot parado, se pierden los datos.

## Una sola copia en marcha

Si arrancan dos copias del bot (en un despliegue, o si alguien lo lanza en local), la más antigua se retira sola en cuanto ve a la nueva.
