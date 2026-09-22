# Cómo contribuir

Gracias por mirar el código. Antes de abrir un pull request, una cosa.

## La licencia

Este repositorio es **código publicado para auditoría, con todos los derechos
reservados** ([LICENSE](LICENSE)). Un aporte sólo puede entrar si su autor
le otorga al titular los derechos para incorporarlo bajo esos términos.

Por eso, al abrir un PR, incluí esta línea en la descripción:

```
Acepto los términos de CONTRIBUTING.md para este aporte.
```

Con eso declarás dos cosas:

**a) Que el aporte es tuyo.** Que lo escribiste vos, o que tenés derecho a
entregarlo, y que no estás copiando código de un tercero con otra licencia.
Es el sentido del [Developer Certificate of Origin](https://developercertificate.org/),
que también podés dejar asentado firmando tus commits con `git commit -s`.

**b) Que autorizás a incorporarlo.** Que le otorgás a Luis Javier Cúneo
Libarona una licencia perpetua, mundial, irrevocable y sin cargo para usar,
modificar, sublicenciar y distribuir tu aporte bajo los términos que elija.
**Conservás la autoría**: no cedés el copyright ni perdés la posibilidad de
usar tu propio código donde quieras. Es un permiso, no una entrega.

Si el punto (b) no te cierra, un issue que describa el cambio alcanza: se
implementa de cero.

> Honorio —el asistente de honorarios— **se mudó** a
> [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio). Si tu
> aporte es para él, va en aquel repositorio y sigue su
> [CONTRIBUTING](https://github.com/javiercuneo/honorio/blob/main/CONTRIBUTING.md).

## Si tu aporte cambia un número

Decilo en el PR, con el caso concreto: qué entrada, qué daba antes, qué da
ahora y qué artículo o criterio lo justifica.

Esto es lo único que se pide en serio. Una fecha de vencimiento mal computada
hace perder un derecho, y un cálculo de honorarios puede terminar fundando una
resolución judicial. Los resultados actuales se consideran correctos: si uno
cambia, tiene que ser a propósito y quedar escrito.

## Si tocás el calendario judicial

`calculadoras/js/calendario-judicial.js` lo comparten todas las herramientas
que computan plazos. Un cambio ahí las afecta a todas a la vez: probá cada una
antes de abrir el PR, no solo aquella por la que empezaste.

## Ideas, dudas y errores

Un issue alcanza. Si encontraste un cálculo mal, lo más útil es el caso
completo: qué herramienta, qué datos cargaste, qué resultado esperabas y por
qué. Con eso se puede reproducir; sin eso, casi nunca.
