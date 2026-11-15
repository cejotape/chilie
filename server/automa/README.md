# Automa — venta y entrega

Cobra Automa con Stripe y entrega la compra sin intervención manual.

## Rutas

| Ruta | Qué hace |
|---|---|
| `GET /api/automa/config` | Dice a la landing si la venta está activa |
| `POST /api/automa/checkout` | Recibe `{ plan: "base" \| "premium", consent: true }` y devuelve la URL de pago de Stripe |
| `POST /api/automa/webhook` | Stripe avisa aquí del pago. Se comprueba la firma y se entrega |

Los precios (25 € y 89 €) están en `PLANS`, al principio de `index.js`. No hace falta crear productos en Stripe.

## Qué se entrega

1. **GitHub:** invitación de solo lectura al repo `automa-base` (y a `automa-premium` en el plan premium), si el comprador dio su usuario en el pago.
2. **Correo al comprador** con la guía en PDF adjunta. El PDF se descarga en el momento del repo privado `automa-base`; no está en este repo porque este repo es público.
3. **Premium:** el correo incluye el enlace al Discord y un código de activación de un solo uso, que genera el bot (`server/automa-discord/`).

Si algo no se puede entregar (no dio usuario de GitHub, falla una invitación, el bot no está en marcha), el comprador recibe igualmente el correo y llega un aviso a `CONTACT_EMAIL` con lo que queda pendiente. Si lo que falla es el correo al comprador, se responde con error para que Stripe reintente.

Stripe puede repetir un mismo aviso: los pedidos entregados se anotan en el almacén del bot y no se entregan dos veces. No se guarda el correo del comprador; está en Stripe.

## Variables de entorno

| Variable | Valor |
|---|---|
| `AUTOMA_STRIPE_SECRET_KEY` | Clave secreta de Stripe (`sk_live_…`, o `sk_test_…` para probar) |
| `AUTOMA_STRIPE_WEBHOOK_SECRET` | Secreto de firma del webhook (`whsec_…`) |
| `AUTOMA_SITE_URL` | Dirección de la landing, sin barra final. Se usa para volver tras el pago |
| `AUTOMA_GITHUB_OWNER` | Usuario u organización dueña de los repos privados |
| `AUTOMA_GITHUB_TOKEN` | Token de GitHub con permiso de administración sobre esos dos repos |
| `AUTOMA_GITHUB_REPO_BASE` / `AUTOMA_GITHUB_REPO_PREMIUM` | Opcionales. Por defecto, `automa-base` y `automa-premium` |
| `AUTOMA_PDF_PATH` | Opcional. Ruta del PDF dentro de `automa-base`. Por defecto, `guia-automa.pdf` |

Sin `AUTOMA_STRIPE_SECRET_KEY` o `AUTOMA_SITE_URL`, el pago responde 503 y la landing muestra que la venta no está activa. Usa también `SMTP_USER`, `SMTP_PASS` y `CONTACT_EMAIL`, que ya tiene el servidor.

Si la landing se sirve desde un dominio que no sea chilieia.com, añádelo a `ALLOWED_ORIGINS`.

## Configurar el webhook en Stripe

En Stripe → Developers → Webhooks, añade un destino:

- URL: `https://chilie-chatbot.onrender.com/api/automa/webhook`
- Eventos: `checkout.session.completed` y `checkout.session.async_payment_succeeded`

Copia el secreto de firma (`whsec_…`) en `AUTOMA_STRIPE_WEBHOOK_SECRET`.

## Probar

Con las claves de prueba de Stripe (`sk_test_…` y el `whsec_…` del webhook de prueba), haz una compra con la tarjeta `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.
