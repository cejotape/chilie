title: Latencia en agentes de voz: por qué cada medio segundo cuenta
cat: voz
author: Iñigo
excerpt: En una conversación telefónica, un silencio de dos segundos ya resulta raro. Qué provoca el retraso en un agente de voz y qué se puede hacer para que la conversación fluya.
---
En una conversación entre personas, el silencio entre que uno termina de hablar y el otro responde es muy corto, a menudo menos de medio segundo. Estamos tan acostumbrados que cualquier pausa más larga nos parece extraña: pensamos que no nos han oído, repetimos o hablamos encima.

Por eso, en un agente de voz, la **latencia** (el tiempo que tarda en responder) es una de las cosas más importantes.

## De dónde sale el retraso

Cada respuesta de un agente pasa por varios pasos:

1. **Detectar que la persona ha terminado de hablar.** Si el agente espera demasiado, pierde tiempo; si se precipita, interrumpe.
2. **Convertir la voz en texto.**
3. **Pensar la respuesta** con el modelo de IA y, si hace falta, consultar un sistema (la agenda, por ejemplo).
4. **Convertir el texto en voz.**
5. **Enviar el audio** por la línea telefónica.

Cada paso suma unos cientos de milisegundos.

## Qué se puede hacer

- **Elegir modelos rápidos** para la conversación. Un modelo más potente pero más lento empeora la experiencia más de lo que mejora las respuestas.
- **Empezar a hablar antes de terminar de pensar**: generar la voz de la primera frase mientras se escribe el resto.
- **Servidores cerca** de tus clientes. Los datos que cruzan medio mundo añaden retraso.
- **Frases puente** cuando hay que consultar algo: "Déjeme que mire la agenda..." suena natural y cubre la espera.
- **Ajustar la detección de fin de turno** según el tipo de cliente: con personas mayores, por ejemplo, conviene dar algo más de margen.

## Interrupciones

Un buen agente también tiene que **dejarse interrumpir**. Si el cliente dice "no, no, el jueves no" mientras el agente habla, este debe callar y escuchar, como haría una persona.

> En voz no basta con responder bien. Hay que responder bien y a tiempo.

Si quieres comprobar la diferencia, [escríbenos](/contacto) y te lo enseñamos en directo con un agente de voz.
