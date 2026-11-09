title: Facturas en PDF: cómo extraer los datos con IA y dejar de teclearlos
cat: auto
author: Iñigo
excerpt: Pasar a mano los datos de facturas es lento y propenso a errores. Cómo funciona la extracción con IA paso a paso, qué precisión esperar y qué revisar.
updated: 2026-11-10
---
Fin de trimestre. Una pila de facturas de proveedores en PDF, algunas escaneadas, otras fotografiadas con el móvil, y alguien de tu equipo pasando a mano proveedor, fecha, base imponible, IVA y total a una hoja o al programa de contabilidad. Dos o tres horas por cada cien facturas, y algún error que aparece cuando la gestoría pregunta.

Es una de las tareas que mejor resuelve la IA hoy. Este artículo explica cómo funciona paso a paso, qué precisión puedes esperar de verdad, qué hay que revisar siempre y cómo encaja con la factura electrónica que viene.

## La respuesta corta

Un sistema de extracción con IA lee cada factura (PDF, escaneado o foto), identifica los campos (emisor, NIF, número, fecha, bases, impuestos, total y, si quieres, las líneas), comprueba que los números cuadran, detecta duplicados y guarda los datos donde tú trabajes, con un enlace al original. Lo que no cuadra o no está claro pasa a revisión humana. El equipo deja de teclear y pasa a revisar: cinco minutos en lugar de cinco horas.

## Cómo funciona, paso a paso

1. **Las facturas llegan** a un correo concreto (facturas@tuempresa.com), a una carpeta compartida o a un canal de WhatsApp del equipo. No hace falta que nadie las ordene antes.
2. **Se separan y se preparan.** Un correo puede traer tres facturas; un PDF puede tener dos páginas de una misma factura. El sistema las separa, endereza los escaneados torcidos y mejora las fotos.
3. **Un modelo de IA lee cada documento**, aunque cada proveedor use un formato distinto, e identifica los campos: emisor y su NIF, número de factura, fecha de emisión y de vencimiento, conceptos, base imponible por tipo de IVA, retención si la hay, total y forma de pago.
4. **Se comprueba que cuadra:** que la suma de bases más impuestos dé el total, que el NIF tenga un formato válido, que la fecha sea razonable, que el proveedor exista en tu lista y que la factura no esté ya registrada (mismo emisor y mismo número).
5. **Los datos se guardan** en la hoja, en el programa de contabilidad o en el ERP, con un enlace al PDF original, y el proveedor nuevo se da de alta si no existía.
6. **Lo dudoso se marca** para que una persona lo revise: un total que no cuadra, un NIF que no se lee bien, un proveedor desconocido, una cantidad fuera de lo habitual para ese proveedor.
7. **Se avisa:** un resumen diario o semanal de lo registrado, lo pendiente de revisar y lo rechazado.

## Qué precisión puedes esperar

Con facturas en PDF generadas por ordenador (la mayoría de las que recibe una pyme), la lectura de los campos principales es casi perfecta. Con escaneados de buena calidad, muy alta. Donde baja es con fotos de móvil mal hechas, tickets arrugados, facturas manuscritas o documentos con sellos encima del total.

Por eso la clave no está en el paso 3 sino en el 4: **las comprobaciones**. Un sistema bien montado no "acierta siempre"; detecta cuándo no está seguro y lo manda a revisar. La métrica que importa no es el porcentaje de campos bien leídos, sino el porcentaje de facturas que se registran solas sin error, que en una pyme con proveedores habituales suele quedar entre el 85 y el 95 %, con el resto revisado en segundos porque el sistema ya dice qué no cuadra.

## Qué ganas

- El equipo deja de teclear y pasa a **revisar**, que es un trabajo distinto y mucho más corto.
- Los datos llegan **el mismo día**, no a final de trimestre. Sabes lo que debes y lo que vence sin esperar a la gestoría.
- Se detectan **facturas duplicadas** antes de pagarlas dos veces, y proveedores que facturan distinto de lo acordado.
- Cada apunte lleva **enlace al original**, así que buscar una factura deja de ser abrir carpetas.
- La gestoría recibe los datos **en el formato que necesita**, sin que nadie los transcriba.

## Dónde encaja con lo que ya usas

La extracción es la mitad del trabajo; la otra mitad es dejar los datos donde sirvan. Las opciones habituales:

- **Hoja de cálculo** compartida con la gestoría, si hoy trabajáis así. Es el punto de partida más rápido.
- **Programa de contabilidad o facturación** (Holded, Sage, a3, Contasimple, Odoo y similares) por su API o por importación, con el proveedor y las cuentas que correspondan.
- **ERP** propio o a medida, para empresas con almacén, pedidos y albaranes que cruzar con la factura.

Y el flujo se monta con las mismas herramientas de automatización de siempre; en [n8n, Zapier o Make](/blog/n8n-zapier-make) explicamos cuál usamos para esto y por qué.

## Qué tener en cuenta antes de empezar

- **Tu gestoría:** confirma con ella el formato en que necesita los datos y qué campos son imprescindibles. Es mejor preguntarlo antes que rehacerlo después.
- **Las facturas de siempre:** empieza por los veinte proveedores que más facturas te mandan; cubren la mayor parte del volumen y tienen formato estable.
- **Albaranes y tickets:** se pueden leer igual, pero tienen menos estructura. Si los necesitas, díselo a quien te lo monte desde el principio.
- **Protección de datos:** una factura tiene datos personales (nombres, NIF de autónomos). Aplican las mismas reglas que a cualquier sistema; en [RGPD y asistentes de IA](/blog/rgpd-asistentes-ia) está la lista.
- **La facturación electrónica:** en España se avanza hacia la factura electrónica obligatoria entre empresas y hacia sistemas de facturación verificables. Cuando llegue del todo, muchas facturas vendrán ya en formato estructurado (XML), y lo que hoy es lectura de PDF pasará a ser lectura de datos. Un sistema bien montado se adapta a los dos: lee el XML si viene, y el PDF si no. En [Verifactu y factura electrónica: qué fechas valen hoy](/blog/verifactu-factura-electronica-calendario) tienes el calendario actualizado.

## Un ejemplo

Una empresa de instalaciones recibe unas 300 facturas de proveedores al mes, entre material, subcontratas y suministros. Antes: una persona dedicaba dos mañanas a la semana a pasarlas al programa, y la gestoría encontraba cada trimestre una docena de errores. Después: las facturas llegan a un correo, el sistema registra solas el 90 %, marca una treintena para revisar (casi todas por proveedores nuevos o importes atípicos), y la persona las repasa en media hora el viernes. Los duplicados, que antes se pagaban y se reclamaban, ahora se paran en la entrada.

## Preguntas frecuentes

### ¿Lee facturas en otros idiomas?

Sí. Los modelos actuales leen facturas en inglés, francés, portugués o alemán igual de bien, y normalizan las fechas y los importes al formato que uses.

### ¿Y las facturas manuscritas?

Las lee con menos fiabilidad, así que van casi siempre a revisión. Si son pocas, compensa; si son muchas, conviene pedir a esos proveedores que facturen en digital.

### ¿Cuánto cuesta?

Un flujo de entrada de facturas es una automatización de nivel intermedio: desarrollo cerrado que depende de con qué programa se conecte y cuántas comprobaciones quieras, más un coste de IA por documento de unos céntimos. En [automatización de procesos con IA](/automatizacion-ia) explicamos cómo lo presupuestamos.

### ¿Cuánto tarda en estar funcionando?

Con una hoja o un programa con API, en torno a dos semanas, con pruebas sobre tus facturas reales antes de activarlo.

> Automatizar la entrada de facturas no elimina la revisión; la convierte en algo de cinco minutos en lugar de cinco horas.

Si tu equipo pierde horas cada trimestre con esto, [cuéntanos cómo lo hacéis hoy](/contacto) y te decimos qué se puede automatizar y qué no.
