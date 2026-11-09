title: RGPD y asistentes de IA: lo que tienes que saber antes de poner un bot a hablar con tus clientes
cat: ia
author: Carlos
excerpt: Un asistente de IA trata datos personales como cualquier otro sistema. Los puntos de protección de datos que revisamos en cada proyecto, en lenguaje claro.
seo: RGPD y asistentes de IA: lo que debes saber
updated: 2026-11-10
---
Cuando un cliente escribe a tu asistente su nombre, su teléfono o el motivo de su cita, está compartiendo datos personales. El RGPD se aplica igual que si lo hubiera escrito en un formulario o se lo hubiera dicho a tu recepcionista. Y cuando el asistente es de voz, además se graba o se transcribe una conversación, que también es dato personal.

Esto no es asesoramiento legal, pero sí la lista completa de puntos que revisamos en cada proyecto antes de que un bot hable con un solo cliente. Si tienes delegado de protección de datos o asesoría, pásasela: es la conversación que deberíais tener.

## La respuesta corta

Un asistente de IA cumple el RGPD si informa a quien habla con él, pide solo los datos necesarios, los trata con proveedores con los que tienes contrato, los guarda el tiempo justo, los protege y permite que la persona ejerza sus derechos. Nada de esto es nuevo; lo nuevo es que ahora intervienen un modelo de IA y, a menudo, varios proveedores, y hay que saber qué hace cada uno con los datos.

## 1. Informar al usuario

El cliente debe saber quién trata sus datos, para qué y dónde puede consultar más información. Lo habitual es un mensaje breve al inicio de la conversación con un enlace a tu política de privacidad, y en voz, una frase corta al descolgar. Y, desde luego, decir que está hablando con un asistente virtual: lo exige el Reglamento Europeo de IA desde agosto de 2026 (lo explicamos en [qué cambia para una pyme](/blog/ai-act-agosto-2026)), y lo pide el sentido común.

Si grabas las llamadas, hay que decirlo. Si solo las transcribes y no guardas el audio, también conviene decirlo, porque es menos intrusivo y la gente lo agradece.

## 2. Pedir solo lo necesario

Si para reservar una cita basta con nombre y teléfono, no pidas la fecha de nacimiento. Si para dar un presupuesto basta con el tipo de servicio, no pidas la dirección. Cuantos menos datos, menos riesgo y menos trabajo después. Es el principio de minimización, y en un asistente se aplica escribiendo bien sus instrucciones: qué debe pedir, qué no debe pedir nunca y qué hacer si el cliente da más de lo necesario (no guardarlo).

## 3. Saber dónde van los datos

Un asistente usa varios servicios: el modelo de IA, la plataforma de mensajería o telefonía, tu CRM, quizá una base de datos. Hay que saber, de cada uno:

- **Qué proveedores** intervienen y qué datos ve cada uno.
- **Si tratan los datos dentro o fuera de la Unión Europea**, y con qué garantías (cláusulas contractuales tipo, el marco de privacidad UE-EE. UU. si el proveedor está adherido).
- **Si usan tus datos para entrenar sus modelos.** En las versiones empresariales y de API de los principales proveedores de IA esto viene desactivado o se puede desactivar, pero hay que comprobarlo y guardar la evidencia.
- **Cuánto tiempo retienen los datos** ellos, aparte de lo que retengas tú.

Con cada proveedor que trate datos por tu cuenta necesitas un **contrato de encargado del tratamiento** (el artículo 28 del RGPD). Los grandes lo ofrecen en sus condiciones; guárdalo. Y en tu registro de actividades de tratamiento, el asistente es una actividad más.

## 4. Base jurídica

¿Por qué puedes tratar esos datos? Normalmente porque el cliente te los da para que le prestes un servicio (ejecución de un contrato o medidas precontractuales) o por tu interés legítimo en atenderle. Si el asistente va a hacer algo más, como enviarle ofertas después, eso necesita su propia base, normalmente el consentimiento, y hay que pedirlo aparte. No mezcles "te reservo la cita" con "te apunto a la newsletter".

## 5. Cuidado con los datos especiales

Salud, datos de menores, información financiera, orientación sexual, creencias. Si tu asistente va a tocar estos temas (una clínica, una asesoría, una academia infantil), hay que extremar las medidas: limitar lo que se guarda, reforzar la seguridad, valorar si hace falta una evaluación de impacto y, en salud, que el asistente no dé nunca consejo médico ni guarde más de lo imprescindible para la cita. En nuestros agentes para clínicas, por ejemplo, el motivo de consulta se guarda en una categoría general, no en texto libre.

## 6. Guardar lo justo, el tiempo justo

Define cuánto tiempo se guardan las conversaciones y bórralas cuando ya no hagan falta. Un plazo habitual es el que necesites para resolver incidencias y mejorar el asistente (semanas o pocos meses), y después conservar solo lo que haga falta para el servicio (la cita, el pedido) en tu sistema de siempre. Guardarlo todo "por si acaso" no es una buena política y, además, multiplica el daño si algo se filtra.

## 7. Seguridad

Lo básico: conexiones cifradas, accesos con usuario y contraseña (y segundo factor) a los paneles donde se ven las conversaciones, registro de quién accede, y que el asistente no muestre a un cliente datos de otro (es un error más común de lo que parece cuando el bot tiene acceso a una base de datos). En [seguridad básica en software a medida](/blog/seguridad-software-a-medida) está la lista completa de lo que deberías exigir a quien te lo monte.

## 8. Permitir que el usuario ejerza sus derechos

Si un cliente pide acceder a sus datos, rectificarlos o borrarlos, tienes que poder encontrar sus conversaciones y hacerlo en el plazo legal (un mes, ampliable). Eso exige que las conversaciones estén asociadas a un identificador (el teléfono, el correo) y que haya una forma sencilla de localizarlas y eliminarlas, también en los proveedores que las retengan.

## 9. Decisiones automatizadas

Si el asistente toma decisiones con efectos relevantes para la persona (aprobar o denegar algo, fijar un precio distinto según quién llame), el RGPD da derecho a intervención humana y a explicación. Para la mayoría de asistentes de atención esto no aplica: informan, reservan y derivan. Pero si el tuyo va a "decidir", que lo decida una persona o que la persona pueda pedir revisión.

## 10. El traspaso a humano también es protección de datos

Cuando el asistente pasa la conversación a una persona de tu equipo, esa persona ve los datos. Que sea quien debe verlos, que el resumen no incluya más de lo necesario y que quede registrado. En [cuándo debe un asistente pasarte con una persona](/blog/traspaso-a-humano) explicamos cómo hacerlo bien.

## Lista de comprobación antes de lanzar

1. Mensaje inicial que informa y dice que es un asistente virtual.
2. Política de privacidad actualizada con el asistente y sus proveedores.
3. Contratos de encargado con cada proveedor, guardados.
4. Entrenamiento con tus datos desactivado en el proveedor de IA, comprobado.
5. Lista de datos que el asistente pide, y de los que no debe pedir nunca.
6. Plazo de conservación definido y borrado automático configurado.
7. Acceso al panel de conversaciones restringido y con segundo factor.
8. Procedimiento para localizar y borrar las conversaciones de una persona.
9. Si hay datos de salud o menores: revisión con tu asesor y, si procede, evaluación de impacto.
10. Registro de actividades de tratamiento actualizado.

> La privacidad no es un freno para la IA. Un asistente bien diseñado desde el principio cumple sin que el cliente note nada, y suele tratar menos datos que el formulario de contacto que ya tenías.

Te recomendamos revisar estos puntos con tu asesor de protección de datos. Si quieres saber cómo lo resolvemos técnicamente en nuestros proyectos (dónde se alojan los datos, qué proveedores usamos y qué desactivamos), [pregúntanos](/contacto) y te lo contamos con detalle.
