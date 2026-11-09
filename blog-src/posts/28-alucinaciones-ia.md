title: Por qué la IA a veces se inventa cosas y cómo evitarlo en tu negocio
cat: ia
author: Carlos
excerpt: Las "alucinaciones" son el mayor miedo de quien pone una IA a hablar con clientes. Por qué ocurren, siete medidas que las reducen al mínimo y cómo comprobarlo.
updated: 2026-11-10
---
Es la pregunta que nos hacen en casi todas las primeras reuniones: "¿Y si el asistente se inventa un precio?". Es una preocupación legítima. Los modelos de IA pueden generar respuestas que suenan seguras y son falsas. A eso se le llama "alucinación", y ha protagonizado más de un titular: el chatbot de una aerolínea que prometió un descuento inexistente y que un tribunal obligó a cumplir, o asistentes que citan normativas que no existen.

La buena noticia es que, en un asistente de empresa bien diseñado, se puede reducir muchísimo. No con magia, sino con siete medidas concretas que explicamos aquí, y con una forma de comprobar que funcionan antes de que hable con un solo cliente.

## La respuesta corta

Un modelo de lenguaje se inventa cosas cuando le preguntan algo que no sabe y no tiene instrucciones claras de decir que no lo sabe. En un asistente de empresa se evita dándole tu información real, consultando los datos vivos (precios, agenda, pedidos) en el momento en vez de "recordarlos", limitándolo a tu negocio, diciéndole exactamente qué hacer cuando no sabe, pidiéndole que cite de dónde saca cada respuesta y revisando conversaciones las primeras semanas. Con eso, los errores pasan de habituales a raros, y de invisibles a detectables.

## Por qué ocurre

Un modelo de lenguaje está entrenado para escribir la continuación más probable de un texto. Es extraordinariamente bueno en eso, y precisamente por eso, si le preguntas algo que no sabe, tiende a dar una respuesta **plausible** en lugar de decir "no lo sé". No miente a propósito: rellena el hueco con lo que suena bien.

Hay tres situaciones típicas en un negocio:

- **Falta la información.** El cliente pregunta si hay aparcamiento y nadie se lo dijo al asistente. El modelo "deduce" que sí, porque muchos negocios lo tienen.
- **La información es ambigua o antigua.** Hay dos precios en dos documentos, uno de 2024 y otro actual. El modelo elige uno.
- **La pregunta sale del tema.** Alguien pregunta al asistente de una clínica dental por la cuota de autónomos. El modelo, que "sabe de todo", responde, y responde mal.

Los modelos actuales alucinan bastante menos que los de hace dos años, pero el problema no desaparece solo. Se gestiona con diseño.

## Cómo se evita: siete medidas

### 1. Darle la información correcta y completa

El asistente debe responder **a partir de tu información**, no de lo que "sabe" en general. Si la respuesta está en tu base de conocimiento, la usará; si no está, no tiene de dónde sacarla. Por eso es tan importante que esa información sea completa, esté al día y no se contradiga. Lo explicamos con detalle en [qué darle a tu chatbot para que no se invente nada](/blog/base-de-conocimiento-chatbot). La regla práctica: si una pregunta se repite y el asistente no la sabe, la respuesta va a la base de conocimiento ese mismo día.

### 2. Instrucciones claras de qué hacer si no sabe

Una de las instrucciones más importantes es: "Si no encuentras la respuesta en la información del negocio, dilo con naturalidad y ofrece pasar con el equipo o tomar nota para que te llamen". Con esa regla bien escrita, el comportamiento cambia por completo: el modelo deja de rellenar huecos porque tiene una salida mejor. Y añadimos la contraria: "Nunca des precios, plazos o condiciones que no estén en la información".

### 3. Consultar datos reales en lugar de recordarlos

Precios, disponibilidad, estado de un pedido, huecos de la agenda: nada de eso debe estar "en la memoria" del asistente, sino consultarse en tu sistema en el momento, con una herramienta. El asistente no dice "creo que hay hueco el jueves"; mira la agenda y dice "hay hueco el jueves a las 17:00". **Lo que se consulta no se inventa.** Es la medida más eficaz de todas, y es la diferencia entre un bot que informa y uno que actúa.

### 4. Límites de tema

Un asistente que solo habla de tu negocio tiene muchas menos ocasiones de equivocarse que uno que opina de todo. Le decimos explícitamente de qué habla y de qué no, y qué responde si le preguntan otra cosa ("eso no te lo puedo responder; puedo ayudarte con citas, horarios y servicios"). También evita que alguien lo use para otra cosa a tu costa.

### 5. Que cite de dónde lo saca

En asistentes con mucha información (manuales, catálogos, normativa interna), pedimos al modelo que indique de qué documento o apartado sale cada respuesta. Eso hace dos cosas: le obliga a apoyarse en la información en lugar de inventar, y permite a tu equipo comprobar en segundos si la respuesta es correcta al revisar conversaciones.

### 6. Un modelo adecuado y bien configurado

No todos los modelos alucinan igual, y la configuración importa: un modelo "creativo" sirve para escribir anuncios, no para dar precios. Para atención al cliente usamos modelos rápidos, configurados para ser conservadores, que responden corto y se ciñen a lo que tienen. En [modelo de IA rápido o el más potente](/blog/modelo-ia-rapido-o-potente) contamos por qué casi siempre gana el rápido.

### 7. Revisar las conversaciones

Las primeras semanas hay que leer conversaciones reales, no una muestra: todas las que acaben sin resolver y una de cada tantas del resto. Cualquier respuesta dudosa indica un hueco de información o una instrucción que mejorar. Después, una revisión semanal de las marcadas como dudosas basta. En [cómo saber si tu chatbot funciona](/blog/medir-un-chatbot) explicamos qué métricas miramos y cómo detectar una alucinación sin leerlo todo.

## Cómo comprobarlo antes de lanzar

Antes de que el asistente hable con un cliente, le hacemos una batería de preguntas trampa, y te recomendamos que tú también:

- **Preguntas cuya respuesta no está en la información.** "¿Tenéis aparcamiento?" cuando no se lo has dicho. Debe decir que no lo sabe, no inventar.
- **Preguntas con premisa falsa.** "¿Sigue el descuento del 20 % de este mes?" cuando no existe tal descuento. Debe corregir, no seguir la corriente.
- **Preguntas fuera de tema.** Debe declinar con amabilidad.
- **Peticiones de datos concretos.** Precio, hueco, estado del pedido. Debe consultar y responder con el dato real, o decir que lo comprobará.
- **Insistencia.** "Venga, dame un precio aproximado aunque sea." Debe mantenerse.

Si falla alguna, se ajusta la instrucción o la información y se repite. En [cómo probar un agente de voz](/blog/probar-agente-de-voz) hay un guion parecido para los asistentes telefónicos.

## Qué hacer si pese a todo se equivoca

Pasará alguna vez, igual que se equivoca una persona nueva en recepción. Lo que importa es que sea raro, detectable y corregible:

1. Que el cliente siempre pueda pedir hablar con una persona, y que el asistente lo ofrezca cuando dude. En [cuándo debe un asistente pasarte con una persona](/blog/traspaso-a-humano) explicamos cómo.
2. Que el equipo vea las conversaciones y pueda contactar con el cliente para corregir.
3. Que la corrección vaya a la base de conocimiento o a las instrucciones, para que no se repita.
4. Que el asistente se presente como asistente virtual y tu política lo deje claro: una información orientativa de un asistente no es una oferta vinculante. Eso no te exime de corregir el error, pero evita malentendidos.

> El objetivo no es un asistente que lo sepa todo, sino uno que sepa lo que no sabe.

## ¿Se puede llegar a cero?

Ningún sistema es perfecto, tampoco las personas. Pero con estas medidas, los errores pasan a ser raros y fáciles de detectar, y el asistente comete menos errores de información que un equipo que atiende de memoria. Haz la prueba: entra en nuestras [demos](/demos) e intenta que el asistente se invente algo. Y si quieres que revisemos cómo está configurado el tuyo, [escríbenos](/contacto).
