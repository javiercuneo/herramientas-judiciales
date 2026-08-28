# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-08-28 · rama `main`

**Lleva sólo lo que sigue vivo.** Dónde está el trabajo, qué está abierto, qué
se sabe roto, qué decisiones no hay que contradecir sin saberlo, y qué trampas
ya costaron tiempo. Nada más.

> **La regla que lo mantiene corto, y hay un control que la hace cumplir.**
> Este archivo se lee entero al empezar cada sesión, así que **cada línea de más
> se paga en todas las sesiones que vengan**. El 28/8 tenía 3766 líneas —la
> mayoría, la crónica de lo que ya se había cerrado— y se partió.
>
> - **Lo que se cierra se muda a [`HISTORIA.md`](HISTORIA.md) en el mismo
>   commit que lo cierra.** No se tacha acá, no se deja «para que se vea que se
>   hizo»: se muda. `HISTORIA.md` no se lee al arrancar.
> - **Lo que se hizo no va acá; va lo que hay que saber para seguir.** La
>   crónica de una jornada de trabajo es historia desde el momento en que
>   termina, aunque sea de hoy.
> - **`npm run verificar-estado`** mide el presupuesto de líneas, caza los
>   tachados que quedaron sin mudar y los enlaces internos rotos. Corre en el
>   `pre-commit` y en CI.

> **Honorio no vive acá.** Se mudó el 4/8 a
> [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio) con su propio
> `ESTADO.md`, que es donde va todo lo del motor, el wizard y el dashboard. Qué
> sigue compartido —el motor legacy, `docs/domain/`, los planes— está en
> [`AGENTS.md`](../AGENTS.md). Si en la copia de trabajo hay un `honorio/`, es un
> clon de aquel repositorio: `git remote -v` antes de commitear.

---

## Dónde estamos

**El sitio está publicado en `javiercuneo.com.ar`, dominio propio, desde el
5/8.** Once calculadoras sobre el mismo sistema visual, nueve documentos de
dominio verificados contra el motor, **Escribiente** —el conversor y
anonimizador de PDF— y `uma-uhom.html`, con el valor vigente de las dos unidades
con las que se regulan honorarios y la serie entera de cada una.

**Al 28/8 el frente grande está cerrado.** El cómputo de plazos vive en
`calculadoras/js/plazos.js` y ninguna de las cinco pantallas de plazos tiene
aritmética adentro; se expone por HTTP local y por MCP en `conectores/`; y **las
cuatro calculadoras que no son de plazos se refundaron de cero** entre el 27 y el
28/8, cada una con su banco de pruebas puesto antes de tocarla:
`honorarios-mediacion`, `prorrateo`, `tasa` —que cubre toda la Ley 23.898— y
`ejecucion-estado`. El detalle de los cuatro días está en
[`HISTORIA.md`](HISTORIA.md).

**No queda nada urgente ni bloqueante, y no hay bugs abiertos.** Lo que sigue
está en [Por dónde seguir](#por-dónde-seguir); lo abierto, en
[Pendientes](#pendientes).

---

## Bugs abiertos

**Ninguno.**

Los últimos tres se cerraron el mismo día en que se abrieron: los dos de `tasa`
del 27/8 —el cobro doble en tercerías y reinscripciones, y el campo de
titularidad que sin tocar daba $0,00— y el de `ejecucion-estado` del 27/8, que
contestaba con una fecha de ejecutabilidad donde la deuda estaba consolidada.
Los tres, con su caso de prueba, en [`HISTORIA.md`](HISTORIA.md).

---

## Por dónde seguir

**El orden y el método, para arrancar una sesión nueva.**

1. **El rediseño de las tres de plazos recién migradas** —`caducidad`,
   `entre-fechas` y `regresiva`—, con `vencimientos` de patrón. Es lo único que
   queda del pedido de uniformar las once. Lo que hay que emparejar, en orden de
   lo que más se nota: los rótulos, los botones, los `max-width` de 240 a 1000 px
   y los colores planos que el sistema no usa. **Los criterios que ordenaron
   `vencimientos` están escritos en su `<style>`** y se repiten: cada control
   ocupa lo que mide su contenido, lo único grande es el resultado, los
   modificadores del cómputo van juntos y detrás de una casilla, y nada se separa
   con una línea si alcanza con el espacio.
2. **Terminar `pruebas-calculadoras`**, que quedó en 56 de 75 filas con todas
   pasando y las cinco pantallas representadas.
3. **Los seis puntos que quedan de
   [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md)**, con el orden recomendado
   adentro: uno para hacer ya sin tocar números, tres que sí los mueven —uno
   hacia arriba: los pisos mínimos que el motor no verifica—, dos para declarar
   y no implementar.

---

## Pendientes

**Ninguno urgente y ninguno bloqueante.**

### Lo que hay que acordarse de hacer a mano

- **`data/feria-judicial.json`, una vez por año, y es lo único de este
  repositorio con esa forma.** Las Acordadas de la CSJN son PDFs sin API. Hoy
  llega hasta 2026; la de 2027 la dicta la Corte entre abril y junio de 2027, y
  **hasta que salga ningún cálculo que toque julio o agosto de 2027 devuelve una
  fecha**: las calculadoras dicen qué año falta y por qué. Es deliberado —contar
  julio como hábil adelanta el vencimiento—, no un bug.
- **`data/feriados.json` se actualiza con `npm run feriados`**, y desde el 26/8
  hay cron: `.github/workflows/feriados.yml`, el día 1 de cada mes y a mano desde
  Actions. El banco de pruebas corre entre traer el archivo y commitearlo, así
  que un archivo que rompe un cómputo no llega al repositorio.
  **Consecuencia conocida:** `actualizar-feriados` aborta entero si un año no se
  puede leer, y eso incluye el año siguiente cuando la API todavía no lo
  publicó. En los primeros meses de cada año el workflow puede fallar por eso y
  no por un problema real. El modo de falla es el correcto —no escribe medio
  archivo— pero **la alarma es indistinguible de una auténtica**. Si molesta, lo
  que hay que cambiar es el script, para que distinga «el año que viene todavía
  no existe» de «la API no contesta».
- **Las tres series se cargan a mano** —`data/serie-uma.json`,
  `data/serie-uhom.json` y `data/tasa-monto-fijo.json`—: los actos de la CSJN y
  las tablas del Ministerio son PDFs sin API. **`npm run verificar-series` no
  puede detectar que falte el último**: detecta que lo cargado esté mal. Lo que
  sí avisa es la propia página, que muestra desde cuándo no se revisan las series
  y pone un aviso a la vista si pasaron más de 45 días.
  **La del monto fijo del art. 6 es la más lenta y por eso la más fácil de
  olvidar**: se movió en 2018 y en 2022, y hoy tiene un solo valor cargado
  —$4.700, Acordada 15/2022—. **El de la Acordada 41/2018 no está a propósito**:
  la nota de Infoleg la nombra sin decir el importe, y cargar un número que no se
  leyó es lo que el archivo existe para evitar.

### Lo que está abierto en el cálculo

- **`prorrateo` no computa el art. 730 in fine.** El último párrafo excluye del
  cómputo del 25 % los honorarios de los profesionales de la parte condenada en
  costas, y la pantalla no tiene forma de marcarlos: hoy todas las regulaciones
  entran en la base. En un pleito donde el condenado tuvo letrado propio, eso
  infla las costas computadas y puede disparar un prorrateo que no corresponde.
  Detectado el 27/8 al refundar la pantalla y **no se implementó ahí a
  propósito**: es una función nueva y no una refundación de la forma.
- **La ampliación por distancia se ofrece con cualquier cédula, y sólo
  corresponde con algunas.** El art. 158 condiciona a que la diligencia deba
  practicarse «fuera del lugar del asiento del juzgado», y el art. 40 manda
  constituir domicilio dentro del perímetro de la ciudad asiento del juzgado: la
  cédula al domicilio **constituido** —que es la mayoría— se diligencia adentro
  del radio. Sólo corresponde con cédula al domicilio **real** fuera del radio
  —traslado de demanda, absolución de posiciones, sentencia— o para una
  diligencia que efectivamente se practique afuera. **Javier decidió el 25/8
  dejarlo así por ahora** —«tiene sentido en la cédula y por eso lo toleré»—.
  El razonamiento completo, y por qué la ampliación salió de la notificación
  automática, está en [`HISTORIA.md`](HISTORIA.md).
- **`lib/legal/minimos-data.ts` nunca se verificó contra la ley.** Las cifras de
  los mínimos que citan el `06` y el `07` están verificadas contra ese archivo, y
  el archivo dice ser copia fiel del asistente clásico. Que sea fiel a la copia
  no prueba que sea fiel a la norma. Son unas cuarenta cifras.
- **La cobertura arranca en 2021, y está declarada en el archivo y no en el
  código.** Las ferias de 2004 a 2020 están cargadas, pero los feriados
  nacionales y los asuetos de esos años **no**, así que un cálculo sobre ellos
  contaría como hábiles días que no lo fueron. El motor anota cualquier año fuera
  de la ventana que un cálculo toque y la herramienta no afirma una fecha.
  **Se decidió que completar 2004-2020 no vale la pena** —nadie computa un plazo
  de 2007—; las ferias viejas se conservan sólo como evidencia documental.
- Anotado y no decidido, de cálculo directo: si el control de fracción de etapa
  del dashboard debería ofrecer las dos cosas.

### Lo que está abierto en las pantallas

- **`regresiva` y `vencimientos` se llaman casi igual.** «Calculadora de plazos
  judiciales» contra «Vencimiento de plazos judiciales»: puestas al lado en el
  tablero no se distinguen, y la que tiene el nombre genérico es la que hace lo
  menos común de las dos. Es una decisión de nombre y no se tocó.
- **El permalink existe sólo en `tasa`**, desde el 27/8, y extenderlo a las demás
  está abierto. **Lo que hay que mirar antes que el cómo:** una URL con el caso
  adentro se pega en un mail, en un chat y en un historial. Un monto de proceso y
  una fecha de notificación no son datos personales, pero sí son datos de un
  expediente concreto. **La decisión tomada, y que hay que repetir**: el caso va
  en el **fragmento** (`#…`), que no viaja al servidor.
- **El imprimible existe sólo en `tasa`**, donde lo exige el art. 4 *in fine*.
  El de `prorrateo` es otra cosa —ahí no hay norma que lo pida— y puede salir del
  mismo mecanismo sin esa exigencia. Sin hacer.
- **Falta el barrido de texto en las cuatro que no son de plazos.** En las cinco
  de plazos ya se hizo, el 26 y el 27/8. **Una distinción que vale para lo que
  queda:** el *usted* —«Ingrese», «Verifique»— **no es tuteo y no es un error**;
  es otro registro. Lo que hay que sacar es el imperativo de *tú*. Cambiar los
  ustedes a voseo es una decisión de estilo y no una corrección, así que va con
  el rediseño.
- **La página de la UMA no tiene `og:image`.** La imagen que le corresponde es su
  propio número grande y hay que hacerla; poner la captura de Honorio sería
  anunciar otra cosa. Sin imagen el enlace igual se comparte, con título y
  descripción.
- **`www.javiercuneo.com.ar` no resuelve**, si se lo quiere: va un CNAME `www` →
  `javiercuneo.github.io` en Cloudflare, gris.

### Del lado de Honorio, anotado el 24/8 y no tocado desde acá

Todo en `scripts/actualizar-uma.mjs`, que es otro repositorio:

1. leer `UMA_VIGENCIA` y `UHOM_VIGENCIA` de la planilla —ya están cargadas— y
   escribir `vigencia` en cada entrada de `historia`. Hoy sólo hay `capturado`,
   que es el día en que el cron vio el valor, y **no es lo mismo**: de ahí salió
   mostrar «rige desde el 20 de agosto» un valor que rige desde el 1 de julio;
2. completar la vigencia también cuando el valor no cambió, igual que ya hace con
   `fuente` y `url`;
3. el control de forma del UHOM —`v % 10 === 0`— tiene que pasar a aviso:
   noviembre de 2022 salió en 2003 y ese control lo rechazaría, o sea que
   abortaría la sincronización por un valor oficial;
4. los dos umbrales de salto están mal calibrados y ahora hay serie para hacerlo.
   `SALTO_MAXIMO_UHOM = 0.15` es **más chico que saltos que ya ocurrieron**
   —enero 2024 fue +16 %, junio 2022 +24 %, enero 2019 +20 %—;
   `SALTO_MAXIMO_UMA = 0.6` es al revés, tan flojo que deja pasar un valor leído
   a la mitad cuando el salto más grande de la serie entera es +20 %.

Lo que todavía no existe va en `IDEAS.md`, que es cuaderno interno y no se
versiona: acá van sólo los pendientes de lo que ya está construido.

---

## Qué sale del navegador

Verificado leyendo las once calculadoras el 26/8, y **es una pregunta que hay
que rehacer cada vez que se agrega una pantalla**.

- **La promesa está escrita en dos lugares y los dos son de Escribiente** —la
  tarjeta de `index.html` y `documentacion.html`—, y es la única que la sostiene
  con la CSP. **Ninguna calculadora promete nada**, así que no hay promesa
  incumplida.
- **Las cinco de plazos y las cuatro que no son de plazos no hablan con nadie**:
  sólo piden los JSON de `data/` del propio sitio.
- **`tasa` arma una URL con lo que el usuario escribió, y no sale del navegador
  igual**: el permalink va en el **fragmento** y no en la query, y el fragmento
  no viaja en ningún request. Un barrido futuro que busque «qué se manda afuera»
  la va a encontrar por el `location.hash`: ya se miró.
- **`distancia` es la única que manda algo que el usuario escribió**: los nombres
  de localidad van a `apis.datos.gob.ar`, a `geocoding-api.open-meteo.com` y a
  `router.project-osrm.org`. No es un dato personal —es una ciudad— pero es
  entrada del usuario saliendo a tres terceros, y **desde el 26/8 la página lo
  dice arriba de todo**.
- **`calculadoras/honorarios.html` también le pide a una planilla de Google**, y
  es la excepción que no hay que arreglar: se retiró el 7/8 y `pages.yml` publica
  en su URL el aviso de `redirects/honorarios-retirada/`, así que **el archivo con
  el `fetch` no llega al sitio**. Queda en el repositorio como historia.

**El método, que es lo que hay que repetir:** la primera versión de esta lista se
hizo leyendo las once calculadoras una por una y **se equivocó** —decía dos y
eran tres: `prorrateo` le pedía la UMA a una planilla de Google, cuatrocientas
líneas abajo del cálculo, adentro de un cargador de CSV—. **Lo que lo caza es un
`grep` de `fetch(` sobre las once**, que tarda un segundo y no depende de qué tan
atento estuvo el que leyó. Desde el 26/8 eso es `npm run verificar-red`.

---

## Los controles, y qué cubre cada uno

Son ocho y no se superponen. **Ninguno se da por bueno sin haberlo visto fallar
a propósito**: un control que nunca falló no es un control.

| Control | Qué cubre |
|---|---|
| `npm run verificar-calculos` | El motor: 673 comprobaciones |
| `npm run verificar-plazos` | El cómputo de las cinco de plazos: 132 |
| `npm run verificar-series` | Las series de UMA, UHOM y monto fijo |
| `npm run verificar-contraste` | Los tokens de color, AA sobre las tres superficies y en los dos temas |
| `npm run verificar-conectores` | Los dos transportes de `conectores/`: 46 |
| `npm run verificar-red` | Qué terceros nombran las quince páginas que se publican, contra una lista con el motivo al lado de cada uno |
| `npm run verificar-escribiente` | El motor de Escribiente: 184 |
| `npm run verificar-honorio` | Las cinco cifras que este repositorio sigue del motor |
| `npm run verificar-docs` | Que los documentos de dominio no citen artículos ni archivos que no existen |
| `npm run verificar-estado` | El presupuesto y la higiene de este archivo |

Y dos que corren en el navegador, con el sitio servido y no con `file://`:

- **`scripts/pruebas-calculadoras.html`** cubre **las pantallas** de plazos: 75
  filas —21 verificados a mano, 6 invariantes, 3 fijados, los 24 cruzados contra
  el motor, y los 21 verificados otra vez adentro del tablero—. Maneja las cinco
  por iframe y compara lo que muestran. **Los iframes llevan rompe-caché**: sin
  él las pruebas corren contra la versión anterior de la calculadora, que es la
  peor forma de falla porque parece un bug del cambio que se acaba de hacer.
- **`scripts/pruebas-no-plazos.html`** cubre las cuatro que no son de plazos:
  **50 fijados** sobre `prorrateo`, `tasa`, `honorarios-mediacion` y
  `ejecucion-estado`. Se construyó el 26/8 porque era la condición para poder
  refundarlas: una reescritura sin red no se puede distinguir de un error.

**Las dos se arrastran con el panel del navegador oculto** —de seis segundos a
varios minutos— porque los iframes no dibujan. No es que estén rotas.

---

## El tablero de plazos

`calculadoras/tablero.html`, publicado y enlazado desde `index.html`: **ocho
herramientas en dos regiones**. Arriba las seis de plazos —vencimientos,
distancia, caducidad, entre fechas, regresiva y mora— en una barra de pestañas;
abajo, aparte, prorrateo y tasa. Cada una es un iframe de la calculadora
publicada, **sin una línea modificada de ninguna**. Carga perezosa, estado vivo
al volver, enlace directo por `#pestania`, teclas 1-6 y flechas.

**Las tres decisiones que lo sostienen**, para no revisarlas sin saber por qué
están:

- **Existe porque once herramientas separadas pueden discrepar en silencio
  durante años y dos pestañas del mismo marco no.** El bug de la feria vivió
  porque nada obligaba a que dos calculadoras se miraran. No es comodidad.
- **Iframes y no fusión del markup.** Fusionar cinco HTML tiene colisiones de
  `id` reales —`plazo` está en `caducidad` y en `vencimientos`; `dia`/`day`,
  `mes`/`month`— y cada una es una oportunidad de mover un número.
- **Las que no son de plazos van en una región aparte y no como pestañas de la
  misma barra**, desde el 26/8. Entran porque el flujo es el mismo —en un
  expediente mirás un plazo y en el siguiente un prorrateo, criterio de Javier—,
  pero un rótulo de grupo adentro de la misma barra no alcanzaba para separarlas.

**Lo que lo hace verificable:** `pruebas-calculadoras.html` corre los 21 casos
verificados **dos veces**, contra las páginas sueltas y contra las embebidas, y
exige que den lo mismo. Toda la apuesta del tablero es que embeber no cambie un
número, y eso se comprueba en vez de suponerse.

**La trampa que costó encontrar:** la mitad de las calculadoras tiene
`body { min-height: 100vh }`, y adentro de un iframe **`100vh` es el alto del
iframe**. El contenido siempre llena el marco, medirlo devuelve el alto que ya
tenía, y el alto queda clavado donde arrancó. Se anula por CSS inyectado, y el
alto se mide sobre el rect del `<body>` y no con `scrollHeight`, que nunca baja
del alto del propio marco.

## El cómputo de plazos, extraído y consultable

**Lo que faltaba para dos cosas a la vez era lo mismo.** El paso (4) del tablero
—el calendario con el plazo dibujado— y el pedido de `pipeline-drafter` —exponer
el cómputo de vencimientos a Python— parecían trabajos distintos y no lo eran:
los dos chocaban con que **la aritmética de plazos vivía adentro de los HTML**.
`calendario-judicial.js` es el calendario —hábil, feria, feriado, asueto—, pero
el salto de gracia, la notificación automática, los días de nota y los dos
tramos de mora estaban entre `document.getElementById`, en `vencimientos.html`
y en `mora.html`. Un conector no tenía a qué llamar, y una pantalla que sólo
conoce la fecha final no puede dibujar el tramo.

### `calculadoras/js/plazos.js`

**Es transcripción, no rediseño.** La aritmética se movió de archivo sin tocarse:
misma tabla de saltos de la notificación automática, mismas cuatro funciones sin
simplificar de mora —que están así a propósito, porque escritas de otra forma el
resultado se mueve—, mismo conteo que arranca un día antes para que el de inicio
cuente primero.

**La trampa que había que no pisar:** las dos pantallas construyen la fecha con
convenciones distintas. `vencimientos.html` usa `Date.UTC(..., 12)` —mediodía
UTC— y `mora.html` usa `new Date(y, m, d)` con `setHours(0,0,0,0)` —medianoche
local—. **No se unificaron**, y están las dos en el archivo con el comentario de
por qué: unificarlas es elegante y mueve un número de algún lado.

**El 25/8 las calculadoras no se tocaron, y sirvieron de referencia. El 26/8
pasaron a consumir el motor.** Esa segunda mitad es la que importa: mientras las
pantallas tenían su copia, había **dos implementaciones vivas** de una cuenta
que puede hacer perder un derecho, y dos copias no se mantienen iguales solas.
El estado del 25/8 era la transición, no el destino. Cómo se migró está en [`HISTORIA.md`](HISTORIA.md).

**`npm run verificar-plazos`**, 34 comprobaciones, corre en Node. Lleva como
regresión el caso con el que el hermano pidió esto —notificación 18/6/2026, diez
hábiles del art. 257 CPCCN, firme, diez corridos del art. 54 de la ley 27.423,
**mora el 12/7/2026**, que es la fecha exacta de una resolución real— más los
invariantes: el vencimiento nunca cae en inhábil, el sábado a las 23 hs. suma un
día y no dos, la ampliación del art. 158 se cuenta en hábiles y no en corridos,
y la notificación automática siempre cae en martes o viernes hábil.

**Lo que todavía NO cubre:** la comparación pantalla contra motor. Ese cruce va
en `scripts/pruebas-calculadoras.html`, que es el único que puede manejar las
calculadoras reales, y es el próximo paso. Hasta que exista, lo que sostiene
la extracción es la transcripción leída y los 34 casos, no una corrida contra la
pantalla.

### `conectores/`

Tres consumos sobre un núcleo único, y **ninguno calcula nada**:

- **`conectores/nucleo.mjs`** — carga los dos motores de navegador en Node con
  el mismo apaño que ya usaba `verificar-calculos.mjs` (leer disco en vez de
  red) y traduce entre `Date` y JSON. Se importa directo.
- **`conectores/http.mjs`** (`npm run conector-http`) — JSON sobre HTTP, GET con
  query o POST con cuerpo. **Escucha sólo en `127.0.0.1`.**
- **`conectores/mcp.mjs`** (`npm run conector-mcp`) — MCP por stdio, JSON-RPC
  sin dependencias. Seis herramientas: `dia_habil`, `siguiente_habil`,
  `dias_habiles_entre`, `vencimiento`, `mora`, `cobertura`.

Que sean dos transportes finos sobre un núcleo es el punto entero: **una segunda
implementación de una cuenta con consecuencia jurídica es el modo de falla que
produjo el bug de la feria**, cuando dos pantallas deducían la feria con dos
heurísticas distintas y las dos estaban mal en años distintos.

**La regla que el conector endurece:** la pantalla puede mostrar el aviso al
lado del número porque hay alguien leyendo; un conector no tiene a nadie del
otro lado. Por eso cuando falta un dato **la respuesta no trae fecha**: trae
`ok: false` y el motivo. Y el texto de las herramientas MCP se lo dice al modelo
donde lo va a leer, porque es la única defensa disponible contra que use igual
una fecha que no vino.

**Las fechas viajan como `AAAA-MM-DD`.** Ni ISO completo ni epoch: los dos
arrastran hora y huso, y del otro lado nadie sabe cuál era el huso del que
calculó. Un plazo judicial no tiene hora.

**Los cubre `npm run verificar-conectores`**, 46 comprobaciones, en CI. Levanta
el HTTP en un puerto propio —8799, para no dar un falso verde contra un conector
que alguien tenga abierto— y le habla al MCP por stdio. **No cubre aritmética**,
que ya cubre `verificar-plazos`: cubre lo que puede romperse de un transporte y
no de una cuenta —que arranque, que el JSON-RPC siga siendo JSON-RPC, que no
cambie el nombre de un campo, que un 404 conteste JSON y no HTML— y **sobre todo
que un dato faltante no devuelva una fecha**, que es la única regla del conector
que no se puede reparar después.

**Lo que falta: avisarle al hermano.** El pedido está anotado en el `ESTADO.md`
de `pipeline-drafter` y en `HERMANOS.md` como abierto; cuando esto se use desde
allá, se cierra ahí y no acá. **Hasta que alguien los consuma, «andan» quiere
decir que pasan una corrida a mano, no que estén rodados.**

---

## Escribiente

**Es PDF-studio rehecho entero, con otro nombre, desde el 17/8.** Vive en
`escribiente/` y se publica en `/escribiente/`; la URL vieja `/PDF-studio/`
queda viva con un aviso. Pasa PDF judiciales a Markdown y anonimiza los datos
personales; también une, separa y rota. Los seis bugs de la versión anterior —y
por qué se tiró en vez de parcharse— están en [`HISTORIA.md`](HISTORIA.md).

**Se publicó el 18/8 con un aviso de «en pruebas», y el aviso es lo que hace
honesta la publicación.** Va en dos lugares porque son dos públicos distintos:
la tarjeta de la landing lleva la etiqueta `en pruebas`, y arriba de todo en
`escribiente/index.html` hay un bloque en `--warn` que dice que no tiene rodaje
y que hay que revisar el resultado antes de mandarlo a un tercero —el que llega
por un enlace directo no ve la tarjeta—. Mismo criterio y mismo estilo que el
aviso de `calculadoras/tablero.html`. **Se saca cuando el uso diario lo
confirme**, y sacarlo es una decisión de Javier, no de quien lo lea.

Se publicó sin rodaje a propósito: en la oficina no se puede levantar un
servidor local, así que sin publicar no hay forma de probarlo donde se usa.

**Lo que hay que saber para tocarla:**

- **El motor está en `escribiente/js/motor/`, es código puro y no toca el DOM.**
  Por eso corre en Node y tiene pruebas: `npm run verificar-escribiente`, 184
  comprobaciones, en CI antes de publicar. Los seis bugs de la versión anterior
  están ahí como regresión con el caso exacto que fallaba, y las seis fugas del
  21/8 también. `js/app.js` es sólo la pantalla y no decide nada sobre el
  documento.
- **Las librerías van versionadas en `escribiente/vendor/`** —pdf.js 3.11.174 y
  pdf-lib 1.17.1, 1,9 MB—. **No se vuelven a un CDN**: la promesa de privacidad
  se sostiene con la CSP, y una CSP que habilita un CDN ya no promete nada.
- **No carga la tipografía Archivo.** Es la única página del sitio que no la
  pide a Google, y es a propósito. Si alguien «arregla» esa inconsistencia,
  rompe la CSP y la promesa con ella.
- **Para levantarla local hay que servir desde la raíz del repositorio**, porque
  `comun.css` y `tema.js` están en `../`. La configuración `sitio-estatico` de
  `.claude/launch.json` ya lo hace.

**El 21/8 pasó un documento largo y encontró tres fugas.**
un documento largo —hasta ese día lo más largo que había pasado por la herramienta
eran 5 fojas sintéticas—. El `.md` se revisó línea por línea contra el PDF. Las
tres están arregladas, con las cadenas exactas como regresión, y cada una lleva
en el código el comentario de dónde salió:

- **La constancia publicaba los nombres.** La clave del conteo de cada reemplazo
  elegido era `elegido: ${nombre}`, y la constancia imprime las claves: el `.md`
  terminaba con varios nombres y la cantidad de apariciones de cada uno.
  **El archivo anonimizado traía abajo el diccionario para deshacerlo.** Es el
  mismo bug que `documento.js` fue escrito para evitar —el nombre del archivo en
  el título— una función más abajo y en el otro extremo del `.md`. Ahora la
  clave lleva la etiqueta (`nombre propio → [TESTIGO]: 4`) y el detalle por
  nombre queda en la pantalla, que es donde no sale de la máquina. **Ninguna
  clave del conteo puede llevar texto del documento**, y eso está escrito arriba
  de `anonimizar()`.
- **Un nombre de dos palabras no se ofrecía nunca.** Los cuatro patrones de
  candidatos exigían tres palabras o una coma, así que un nombre de dos palabras
  —diez apariciones en claro, más cuatro sin tilde y una en mayúsculas— no se
  vio ni una vez en la lista. No es que se dejó pasar: no se ofreció. Y
  «Nombre Apellido» es la forma más frecuente que hay, porque el nombre completo
  aparece una vez y ése aparece en cada foja. Entraron dos patrones de dos
  palabras, y con ellos tres cosas que los hacen usables: `NO_SON_PERSONAS` casi
  duplicada, el recorte de las palabras de los extremos que no son nombre
  —«Compareció Hector Ernesto» perdía el nombre entero por el verbo de adelante—
  y el descarte del candidato que es pedazo de otro.
- **El DNI sin puntos no tenía regla.** La única que había exigía el formato
  `30.119.078` porque tiene que distinguirse de un monto. Un informe del
  un formulario oficial lo escribe sin puntos, y **cinco documentos
  de identidad salieron enteros y rotulados** (`DNI: 5432109`). La regla nueva
  se ancla en la palabra, que es lo que la hace segura: siete dígitos pelados no
  tienen forma propia, pero lo que viene después de «DNI» es un DNI.

**Y una decisión que cambió: los candidatos ya no vienen tildados.** Salvo las
dos partes de la carátula, que salen de una forma fija y no son una adivinanza.
El argumento es el mismo expediente: con todo tildado de fábrica se procesó con
40 reemplazos elegidos, de los cuales **27 no eran nombres de nadie** —
encabezados de tabla («Responsable Inscripto Fecha», 15 veces), títulos en
mayúsculas, un monto en letras—, y el texto quedó con «SOLICITA SE `[PERSONA]`»
y «PERSONAL DE LA `[PERSONA]` Y AFINES». Nadie destildó nada, y era esperable:
con cuarenta casillas ya tildadas gana el default. **Lo que decide es el modo de
fallar**: tildado de fábrica falla en silencio y corrompe el documento; sin
tildar falla a la vista, porque el nombre queda en el texto *y* la constancia lo
nombra.

**El segundo pase sobre el mismo expediente, el 21/8, cerró las otras tres.**
Salieron de la misma revisión y no eran fugas de una regla: eran materia que el
motor no miraba.

- **Los formularios `Etiqueta: valor`, que es donde estaba lo más sensible.** El
  motor estaba escrito para prosa, y la ficha del Registro Nacional de las
  Personas adjunta al exhorto no es prosa: `Apellidos:`, `Nombres:`,
  `Fecha Nac:`, `Clase:`, `Domicilio: Calle :…`, `Datos del Trámite:`, cada uno
  en su renglón. De todo eso el motor anonimizaba el teléfono. **Se reemplazan
  solos, y eso no contradice la regla de preguntar por los nombres**: la
  etiqueta hace inequívoca la forma, que es el criterio de siempre —detrás de
  `Apellidos:` no hay una cita de doctrina—, y es el mismo argumento que sostiene
  la regla de la firma. Tampoco le esconden nada a la lista de candidatos, que
  se arma sobre el texto crudo. **Las dos guardas son lo que las hace seguras:**
  los dos puntos son obligatorios —en prosa no hay— y el valor tiene que empezar
  en mayúscula, sin lo cual «Nombres: los que surgen del poder» quedaba como
  `Nombres: [PERSONA]`.
- **El domicilio sin piso.** La regla exigía piso o departamento después de la
  altura, y así se escribe la minoría: «Av. San Juan 640 CABA» y «Rivera 3120 CABA»
  pasaban enteras. Ahora hay dos reglas: la vieja, donde el piso es lo que acota,
  y una nueva anclada en la palabra —«domicilio», «sito», «calle»—. **El ancla no
  es un adorno:** sin ella la regla dice «cualquier palabra capitalizada seguida
  de un número», y eso también describe «el expediente 48210» y «el art. 431».
  De paso se arregló que el bloque de piso cortaba la palabra al medio
  (`[DOMICILIO]amento 2`).
- **La matrícula aceptaba una sola forma de escribirse.** Entran los dos puntos
  (`T: 62 F: 415`), la `O` que deja el OCR donde va el ordinal (`T°22 FO371`), el
  tomo con la palabra entera, y el campo de formulario `Matrícula N°: XXXV,
  FOLIO 271`.
- Y con ellas, **el tratamiento en mayúsculas y con dos puntos**: `SR :RODOLFO
  CÓRDOBA`, de una cédula, fallaba por las dos cosas a la vez. La regla pasó a
  correr con `i`, así que ahora también agarra «el perito Juan Pérez» en medio de
  la prosa. Como `i` apaga la distinción de mayúsculas, la guarda se mudó a una
  función: el nombre tiene que empezar en mayúscula y no puede llevar ninguna
  palabra de `NO_SON_PERSONAS`.

Sobre el mismo `.md` ya anonimizado —o sea, sobre un piso— las reglas nuevas
hacen **82 reemplazos más**, y no queda a la vista ni un DNI, ni una matrícula,
ni una calle con altura.

> **Este bloque se quedó acá y no debería.** Es crónica del 21/8 y le
> corresponde `HISTORIA.md` por la regla de arriba. Moverlo hace que el control
> de datos personales del `pre-commit` bloquee el commit: los cuatro valores de
> ejemplo que documenta —un DNI sin puntos, uno con puntos, dos matrículas— son
> exactamente las formas que ese control busca, y al mudarlos aparecen como
> líneas nuevas en `HISTORIA.md`. **No entra nada nuevo al repositorio**: los
> cuatro ya están versionados en este archivo desde el 21/8, y son sintéticos.
> **Es una decisión de Javier**, y son las dos únicas salidas: mudarlo con
> `git commit --no-verify`, o enseñarle al patrón a no mirarse a sí mismo.

**Lo que queda abierto, y ninguno es bloqueante:**

- **Un nombre que el OCR ensució no lo agarra nada.** En el mismo exhorto,
  `SR :ERNESTO QU1ROGA` queda como `SR [PERSONA] QU1ROGA`: la `Ó` salió como
  `6`, y ningún patrón de nombre puede aceptar dígitos adentro de una palabra
  sin empezar a comerse números. Un humano lo lee igual. **No tiene arreglo por
  patrón**, y es una razón más para leer el `.md` antes de mandarlo.
- **El domicilio del propio juzgado también se reemplaza.** `TUCUMAN 1300, 5TO
  PISO` sale como `[DOMICILIO]`. No es un dato personal y se pierde información
  útil, pero la regla que lo agarra es la misma que agarra el domicilio de una
  parte escrito igual, y separarlas pediría una lista de direcciones de
  tribunales. Se decidió que sobre-ocultar acá sale más barato que la lista.
- **Un DNI y un monto son el mismo número.** `30.119.078` y `1.500.000` tienen
  la misma forma, y lo único que los distingue es el contexto. Hoy se excluye lo
  que venga con `$`, con decimales, o precedido de «pesos», «suma de», «importe
  de», «valor de», «monto de». Un monto escrito de otra manera todavía puede
  salir como `[DNI]`. **Se eligió que el falso positivo sea visible** —queda en
  el texto y en la constancia— antes que dejar pasar un documento.
- **Varias paginas salieron en blanco.** Son escaneos sin OCR intercalados,
  y el aviso funcionó exactamente como tenía que funcionar: las lista una por
  una y dice que lo que decían no está en el archivo. Pero conviene tenerlo
  presente al leer una constancia: **la anonimización sólo vio el 40% del
  expediente**, y de lo que no vio no puede decir nada.
- **La detección de nombres propios no cubre razones sociales.** «Seguros del
  Sur S.A.» no dispara ningún patrón de los tres, así que no se ofrece como
  candidato y hay que anonimizarlo mirando el texto.

---

### Las cinco cifras que este repositorio sigue de Honorio

Son suyas pero salen de allá: **la versión**, **17 validaciones**, **8 tipos de
proceso**, **173 recorridos** y **29.929 cruces**. Viven en `index.html`, en
`README.md`, en `documentacion.html` —la de validaciones, escrita con letras— y
en la tabla de recorridos de [`01_PROCESOS.md`](domain/01_PROCESOS.md), que es
de donde salen las dos últimas. **Si vuelve a moverse alguna, se mueven todas.**

**Desde el 25/8 hay un control: `npm run verificar-honorio`.** Lee las cinco del
motor —la versión de su `package.json`, las validaciones contando los archivos,
y los recorridos y los cruces de la enumeración que imprime
`retroceso.validation.ts`— y las compara contra lo que dice cada página. No
arregla nada: dice qué archivo quedó viejo y en qué número. Los recorridos no
los cuenta él, y es a propósito: contarlos aparte sería una segunda
implementación de la poda del wizard, que es exactamente la clase de problema
que el script existe para evitar.

**Necesita el clon de `honorio/`, así que no corre en CI** —allá no existe—, y
ésa es la limitación que hay que tener presente: nada obliga a correrlo. Cuando
sale una versión de Honorio, se corre acá.

**Lo que el script no puede ver es la prosa, y es lo que más envejece.** La
enumeración de al lado se desactualiza igual que el número —`index.html`
nombraba once controles y `README.md` catorce— y la lista de lo que Honorio hace
envejece más rápido todavía: la regulación redactada, los criterios con su
jurisprudencia y el enlace que lleva el caso adentro existían desde agosto y
**ninguno figuraba en la landing** hasta el 25/8.

---

## Decisiones vigentes

No se derivan del código. Las que ya no se discuten están en
[`HISTORIA.md`](HISTORIA.md); acá quedan las que gobiernan trabajo de todos los
días.

### El sistema visual

Es el mismo de la landing, de la guía y de Honorio, y las calculadoras lo
adoptaron: cobalto `#1E45CE` como **único acento** —lo activo, lo enfocado y lo
seleccionado son siempre el mismo color—, neutro frío, `--radius: 0.375rem`, y
**Archivo** (Omnibus-Type, Buenos Aires) para títulos y cifras, elegida por ser
una tipografía argentina para una herramienta jurídica argentina.

Se descartó explícitamente el cluster «crema + serif display + terracota» por ser
el look más reconocible de diseño generado por IA.

**El tema lo elige el usuario, desde el 5/8**, con un botón que inyecta
`assets/tema.js` —compartido, porque son páginas sin build y una copia por
página del mismo comportamiento se desincroniza—. Lo llevan **todas las páginas
que el sitio publica salvo las tres de redirección y el asistente clásico**. Los
diez documentos de dominio se sumaron el 26/8: hasta ese día eran los únicos que
seguían al sistema y nada más, y quien había elegido claro los veía en oscuro
igual. Sin elección guardada se sigue al sistema; con elección, manda la
elección y persiste en `localStorage`.

**Cómo está hecho, para no romperlo:** los tokens oscuros están **dos veces**, en
`@media (prefers-color-scheme: dark) { :root:not([data-tema="claro"]) }` y en
`:root[data-tema="oscuro"]`. Si tocás un valor, tocá los dos. Se evaluó
`light-dark()`, que evitaría la duplicación, y se descartó: si un navegador no la
soporta la declaración entera es inválida y el token queda vacío, que es
exactamente el bug que dejó dos calculadoras con el botón invisible. Acá la
predictibilidad vale más que la elegancia.

`--faint` es el gris más claro que todavía se lee. **No aclararlo**: su único uso
es texto chico, que es justo donde el piso de contraste es 4.5. Y **la superficie
contra la que se lo mide es `--bg` en claro y `--card` en oscuro** —la más oscura
en un tema, la más clara en el otro—, que es lo que costó cuatro semanas
descubrir: el arreglo está en [`HISTORIA.md`](HISTORIA.md). Lo
verifica `npm run verificar-contraste`, que también exige que los seis archivos
donde están escritos los tokens digan lo mismo.

### La serie de la UMA y del UHOM se reconstruyó de los actos

`uma-uhom.html` publica las dos series completas: **67 valores de UMA desde
diciembre de 2017 y 67 de UHOM desde junio de 2016.** No están copiadas de
ninguna tabla ajena. Cada UMA salió del punto resolutivo de su acordada o
resolución —50 PDF de la CSJN— y cada UHOM, de las 39 tablas oficiales del
Ministerio de Justicia. Las dos viven en `data/`, versionadas, con la norma al
lado de cada valor.

**Copiarlas habría sido más rápido y habría estado mal.** Las dos compilaciones
públicas que existen atribuyen a la Acordada 4/2022 el valor de $8.183 desde
abril de 2022. La acordada dice **$7.439 a partir del 1 de enero de 2022**;
$8.183 y $9.001 los fijó la 12/2022. Enero de 2022 no figura en ninguna de las
dos, y a una de ellas además le falta abril de 2024 en el UHOM.

**Vigencia y fecha del acto son dos campos y no uno.** La resolución dice desde
cuándo rige el valor y casi siempre lleva fecha posterior a esa: de los 63
valores con demora computable, **los 63 salieron después del día desde el que
rigen**, con una mediana de 63 días y un máximo de 141. Ese es el dato que la
página tiene y las compilaciones no, porque no se puede armar sin los dos
documentos. Guardar una sola fecha obliga a elegir cuál, y las dos hacen falta:
la vigencia decide qué valor corresponde a una regulación, la del acto dice si
ese valor existía el día en que se reguló.

**Tres cosas que aparecieron leyendo y conviene no volver a descubrir:**

- **El UHOM de noviembre de 2022 es 2003 y no termina en cero**, contra la regla
  del decreto 2536/15. Está bien: la tabla oficial lo declara así y construye
  toda su escala sobre él —el provisional dice 4.006 y la franja A, 60.090—.
  La misma tabla declara UR 166,13, que por doce da 1.993,56 y redondeado daría
  2.000. **La regla no se aplicó ese mes**, y cualquier control que la exija va
  a rechazar un valor oficial.
- **El Ministerio rehace tablas ya publicadas.** Las tablas 17 y 18 cubren los
  mismos meses de 2021 con dos bases de UR distintas. El valor de un mes es el
  de la tabla más nueva entre las que empiezan en ese mes o antes, y no el de la
  fila más reciente que lo nombre: la 18 declara octubre y no vuelve a declarar
  noviembre ni diciembre porque no cambiaron, así que caer a la 17 para
  diciembre hacía **bajar** la serie de 1100 a 1010.
- **Ocho de los 50 PDF de la Corte no tienen capa de texto**: dibujan las letras
  como trazos y `pdftotext` devuelve cero. Son las acordadas 36/2020, 1/2021,
  7/2021, 12/2021, 21/2021, 4/2022, 12/2022 y la res. 2722/2023. Hubo que
  rasterizarlos. Y las acordadas de 2018 y 2019 llevan la fecha del acto escrita
  a mano en el original: el valor y la vigencia están impresos y se leen, la
  fecha no.

Cada valor de UHOM se leyó **por su forma y no por su etiqueta**: es el único
número de la tabla que aparece también multiplicado por dos y por treinta. Hizo
falta porque el formato cambió seis veces en diez años —y el separador de miles
pasó de punto a coma en la tabla 39—, así que ninguna etiqueta es confiable pero
la aritmética sí.

**`npm run verificar-series` corre en el build**, antes de armar el sitio. Un
archivo cargado a mano se rompe de tres formas y las tres dan un número
plausible que nadie ve en un diff de 67 líneas: una vigencia repetida, una serie
que baja, una fecha de acto anterior a la vigencia.

### Ningún día inhábil se decide en código

La regla general —**lo que se fija por acto va en datos con la cita del acto**—
está en [`AGENTS.md`](../AGENTS.md). El 24/8 se terminó de aplicar: enero era el
último que quedaba escrito a mano, `getMonth() === 0` en
`calculadoras/js/calendario-judicial.js`. Ahora sale de la clave
`feria_de_enero` de `data/feria-judicial.json`, con el art. 2 del Reglamento
para la Justicia Nacional citado y el texto del artículo adentro. El comentario
del archivo decía que lo fijaba el art. 257 CPCCN, que no dice nada de esto.

**El default del motor no es «no hay feria».** Si el archivo no se puede leer,
enero sigue siendo feria. Con la feria de invierno la ausencia se puede informar
—son doce días y el motor anota el año faltante— pero enero contado como hábil
adelanta un vencimiento un mes entero, y eso no se ve: sale un número plausible.
Leer el dato sólo puede confirmar el default o mover el mes, nunca apagarlo. El
control que prueba que el dato se leyó es que el motivo cite la norma.

**El jueves santo faltaba desde 2021.** El mismo art. 2 hace inhábiles los días
«que por disposición del Congreso o del Poder Ejecutivo no sean laborables», y el
jueves santo es no laborable, no feriado. Por eso **no viene en la API**, que
sólo trae feriados: viene el viernes santo y el jueves no. Estaba cargado a mano
sólo 2025; de 2021 a 2024 el motor lo contaba como hábil —un día hábil de más,
otra vez hacia adelante—. Ahora están los seis en `data/dias-inhabiles.json` y
**el olvido ya no depende de que alguien se acuerde**: `verificar-calculos.mjs`
toma cada viernes santo de `feriados.json` y exige que el día anterior sea
inhábil. 2026 no figura porque el jueves santo cayó 2 de abril y ya es feriado
nacional por Malvinas.

La frase «la Semana Santa» del mismo artículo **no** está implementada como una
semana entera, y eso es deliberado: el lunes, el martes y el miércoles santo se
trabaja. Está dicho en `data/feria-judicial.json` para que no se lo lea al pie
de la letra y se inventen tres días inhábiles.

### Este repositorio es público, y eso decide cómo se escribe

Las reglas están en [`AGENTS.md`](../AGENTS.md), en «Datos: qué no entra a este
repositorio», y `scripts/verificar-datos.sh` las verifica en cada commit.

Si falta una referencia que parece que debería estar, falta a propósito. No completarla.

### Una promesa de privacidad se demuestra, no se declara

Escribiente dice que el documento no sale de tu computadora. Esa frase es la
razón por la que alguien la elige sobre cualquier conversor online, y escrita en
una pantalla no vale nada: obliga a creer. Está apoyada en dos cosas que se
pueden comprobar en treinta segundos, y **las dos son requisitos, no detalles de
implementación**:

- **`connect-src 'none'` en la CSP de `escribiente/index.html`.** El navegador le
  prohíbe a la página abrir cualquier conexión. Verificado el 17/8: `fetch`,
  `sendBeacon`, WebSocket e imágenes externas quedan bloqueados y anotados en la
  consola, con cero peticiones de red registradas. Si alguien agrega código que
  intente mandar el texto afuera, el navegador lo frena.
- **pdf.js y pdf-lib versionados en `escribiente/vendor/`.** La versión anterior
  los pedía a `cdnjs.cloudflare.com` en cada uso: el código que abría el
  expediente lo servía un tercero, sin verificación de integridad, en una
  herramienta cuyo argumento es la privacidad.

Lo mismo vale para la tipografía, que por eso no se carga.

### La anonimización decide sola lo que tiene forma, y pregunta lo que no

Es el diseño de `escribiente/js/motor/anonimizar.js`, heredado de otra
herramienta propia que no está en este repositorio, y no es una comodidad de
interfaz.

Lo que tiene forma inequívoca —DNI, CUIT, CBU, teléfono, expediente, matrícula,
correo— se reemplaza solo, porque no hay falso positivo posible. **Los nombres
propios se muestran para que el usuario decida uno por uno**, porque ninguna
regla distingue sola `Pérez, Juan Carlos` —la parte— de `Llambías, Jorge
Joaquín` —doctrina— ni de `Buenos Aires, Astrea`, que es una editorial.
Reemplazar por adivinanza corrompe el texto; no reemplazar filtra.

De ahí también la constancia al pie de cada `.md`: qué se reemplazó, cuántas
veces, y **qué quedó sin ocultar**. Un anonimizador que no se puede auditar es
peor que ninguno, porque produce confianza sin fundarla.

### Una herramienta publicada tiene que estar bien o no estar publicada

Es el criterio con que `calculadoras/honorarios.html` se dio de baja en vez de
corregirse —el porqué, en [`HISTORIA.md`](HISTORIA.md)—. Que una tarjeta de la
landing diga «retirada» no la saca de internet, y el que llega por un enlace no
ve la tarjeta. Si hay que retirar algo: el archivo se queda, la URL sigue viva
con un redirect en `pages.yml`, y la landing dice el motivo.

### `08_DEUDA_TECNICA_FUNCIONAL.md` no es una lista de trabajo pendiente

Es un catálogo de decisiones, y describe el motor **clásico**: donde dice
`calculations.js` o `core.js` se habla de `asistente-honorarios-clasico/`. La
lista de trabajo es [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md).

---

## Trampas conocidas

- **El repositorio vive en `C:\IA\herramientas-judiciales`, en disco local, y no
  hay nada sincronizado.** Se movió ahí el 10/8 desde el escritorio, que colgaba
  de OneDrive y hacía que todos los agentes dieran por hecho que los archivos se
  subían solos. **Lo único que sale del disco sale por `git push`.** El segundo
  repositorio está anidado en `honorio/`, con su propio `.git` —el de arriba lo
  ignora—, así que cada uno se commitea por separado.
- **Abrir el panel del navegador al empezar la sesión**, como primer paso y no
  como diagnóstico. Con el panel oculto `document.hidden` es `true`,
  `requestAnimationFrame` no dispara, `clientWidth` mide 0 y las capturas fallan
  con *«the Browser pane is not displayed»*; en Honorio el paso del wizard
  **directamente no se monta**. No es una limitación del entorno: **la solución
  es abrir el panel.** Si no se puede, el JavaScript sí funciona, y estilos
  computados y mediciones son más confiables que mirar una captura.
  **Con una excepción que costó media hora el 26/8: las transiciones CSS
  tampoco avanzan.** Un elemento con `transition: color` se queda con el color
  del tema anterior después de cambiar `data-tema`, y `getComputedStyle`
  devuelve ese color viejo por tiempo indefinido, no por un instante. Midiendo
  contraste da falsos positivos escandalosos —2,36 en el control segmentado de
  `vencimientos`, que en realidad da 5,59— y desaparecen al medir ese elemento
  solo. **Un valor computado sospechoso: fijarse si la regla tiene
  `transition`.**
  **Y el `ResizeObserver` tampoco dispara**, que se vio el 27/8 midiendo la
  mediación embebida en el tablero: el iframe quedaba en 584 px con 1033 de
  contenido y parecía que la refundación había roto el ajuste de alto. No era
  eso —`vencimientos` embebida daba 642 contra 1092 en la misma corrida, con el
  mismo desfase, y no se había tocado—. **La forma de descartarlo es medir en la
  misma corrida algo que no se tocó**, que es más rápido que abrir el panel.
  **Y esa comprobación no siempre alcanza, que es lo que se aprendió el mismo
  día midiendo los hitos de `caducidad`.** El elemento no tenía ninguna
  transición declarada, `getComputedStyle` igual reportó `transitionProperty:
  all`, y el color devuelto era un valor intermedio que no está escrito en
  ningún lado: `rgb(154, 107, 18)` donde el token dice `#815a0f`. Con eso el
  contraste daba 4,05 y parecía reprobar AA. **Lo que lo resuelve no es volver a
  medir: es calcular el número afuera del navegador**, del token contra la
  superficie compuesta. Da 5,34, y pasa. La regla corta: **con el panel oculto,
  un color computado no es evidencia; el token sí.**
- **Un artículo de la ley no termina donde termina su primer párrafo, y
  `verificar-docs` no lo nota.** El 10/8 se afirmó dos veces que «el art. 19 de
  la 27.423 instituye la UMA y no tiene incisos», y tiene dos tablas de mínimos
  —inciso a) asuntos no susceptibles de apreciación pecuniaria, inciso b) labor
  extrajudicial— que **la propia pantalla de mínimos de Honorio muestra**. Lo
  mismo con el art. 61, leído sin la nota de vigencia de abajo —fue sustituido
  por el art. 96 de la Ley 27.802, B.O. 6/3/2026, y las 2 UMA son de esa
  versión—. **El control mecánico comprueba que la cita exista, no lo que el
  artículo dice**: `grep` de un encabezado devuelve una línea; un artículo se lee
  hasta el siguiente encabezado.
- **Una fuente que contradice al motor no es por eso una fuente equivocada.**
  `AGENTS.md` dice que los modelos del juzgado no son oráculo; **no serlo no los
  hace sospechosos por defecto.** La observación de Javier de que citan bien el
  «Anexo I del 2536» es la que cerró la numeración del Anexo III, que llevaba dos
  días anotada como sin resolver.
- **No redefinir los tokens de `comun.css` dentro del `<style>` de una
  calculadora.** `--accent: var(--accent)` es una dependencia cíclica: por
  especificación la propiedad queda inválida en tiempo de cómputo y `var()` no
  devuelve el token sino **la cadena vacía**, sin ningún error visible. Así
  quedaron `mora` y `honorarios-mediacion` con el botón principal blanco sobre
  blanco, en los dos temas y en producción. Hay un comentario en cada archivo.
- **`scripts/verificar-datos.sh` es el verificador de los cuatro repositorios,
  no sólo de éste.** Desde el 25/8 `core.hooksPath` global apunta a un hook
  compartido que lo corre en cualquier repositorio de la máquina —incluidos los
  que todavía no existen— y después encadena al `.githooks/pre-commit` propio
  del repositorio, si lo tiene. **Un patrón que se afloja acá se afloja para los
  cuatro**, y eso ahora se ve en un diff, que antes no.
  Hasta ese día había dos copias y ya se habían desincronizado: la de afuera
  tenía un arreglo que ésta no. El patrón de teléfono fijo de CABA, delimitado
  por bordes de palabra a los dos lados, **matchea adentro de un UUID**, y los
  enlaces del CIJ son todos UUID: `knowledge` podía citar un fallo y este
  repositorio no. El detalle de la instalación está en
  [`AGENTS.md`](../AGENTS.md).
- **Un `.sh` con CRLF no corre**, y `.gitattributes` no lo cubría: con
  `* text=auto` y sin regla propia, un clon nuevo en Windows se llevaba
  `verificar-datos.sh` con CRLF y **el hook de datos personales dejaba de
  funcionar sin avisar**. En CI no se veía porque en Linux sale LF igual. Desde
  el 25/8 hay `*.sh text eol=lf` y `*.mjs text eol=lf`.
- **`--border` y `--hair` son colores de línea translúcidos, no superficies.**
  Usados como `background` dan casi transparente. Para una superficie hundida va
  `--sunk`.
- **Las reglas de `@media print` no llevan tokens de tema.** El papel es blanco
  siempre: `background: var(--card)` imprime negro en modo oscuro.
- **`sitio-estatico` de `.claude/launch.json` no lleva `autoPort`, y no hay que
  agregárselo.** El puerto está escrito en `runtimeArgs` (`http.server 4180`) y
  así no lo puede reasignar nadie. Con `autoPort` encima, un 4180 ocupado —lo dejan ocupado los servidores de
  sesiones anteriores— hacía que el harness abriera la pestaña en otro puerto
  mientras Python seguía escuchando en el 4180: la pestaña daba error y el
  server figuraba «starting» para siempre. **Si vuelve a pasar, `curl
  localhost:4180` lo dice en un segundo.** `honorio-dev` conserva el `autoPort`
  a propósito: ahí el puerto lo elige Next y el 3000 se ocupa seguido.
- **Son dos proyectos npm distintos: fijarse en cuál se está parado.** El de la
  raíz tiene **doce scripts y nada más**: `docs`, `verificar-docs`,
  `verificar-calculos`, `verificar-plazos`, `verificar-series`,
  `verificar-contraste`, `verificar-conectores`, `verificar-escribiente`,
  `verificar-honorio`, `feriados`, `conector-http` y `conector-mcp`. `check`,
  `build`, `validate` y `typecheck` son de Honorio y **solo corren desde
  `honorio/`**, que es un clon de otro repositorio. Pedirlos acá da «Missing
  script», que se lee fácil como que algo está roto y no lo está.
- **Un predicado de «página lista» que matchea el cartel de *cargando* es peor
  que no tener predicado.** `pruebas-calculadoras.html` esperaba a que el cartel
  dijera «disponible», y el texto inicial de varias calculadoras es «Cargando
  información de años **disponibles**…»: daba verde antes de que cargaran los
  datos y se calculaba sobre una página vacía. El síntoma era engañoso —fallaba
  sólo el **primer** caso de cada página, porque para el segundo ya había
  cargado—. Hay que exigir el texto del estado final, que es distinto del de
  carga.
- **`gh` está instalado pero los shells de una sesión ya empezada no lo ven.**
  El ejecutable está en `C:\Program Files\GitHub CLI`. Si `gh: command not
  found`, no falta: sobra `PATH` viejo. `export PATH="$PATH:/c/Program Files/GitHub CLI"`
  en Bash y anda.
- **El `>` de PowerShell escribe UTF-16.** Para editar un archivo de
  configuración, `Set-Content -Encoding utf8` o un editor. Un archivo así queda
  inerte —git lo parsea como bytes y ve un nulo entre cada carácter— y se
  manifiesta como diffs enormes por finales de línea, no como un error.
- **`node-version` de `pages.yml` no es la versión de Node de las acciones.**
  Cuando Actions anuncia que «estas acciones apuntan a Node 20 y se fuerzan a
  Node 24», habla del `runs.using` que cada action declara en su propio
  `action.yml`, y eso sólo se mueve subiendo la versión del action. El
  `node-version` del `setup-node` es otra cosa: el Node con el que corren
  `npm ci` y los scripts. Subir uno no apaga el aviso del otro. El 17/8 se
  subieron las dos: `node-version: 24`, `checkout@v7`, `setup-node@v7`,
  `upload-pages-artifact@v5` y `deploy-pages@v5`. Y una que confunde: el
  `upload-artifact@v4` que nombraba el aviso no está en el workflow —lo trae
  adentro `upload-pages-artifact`, que es composite—, así que se busca en vano
  hasta que uno abre el `action.yml` de la otra.
- **`upload-pages-artifact` deja fuera del artefacto los archivos que empiezan
  con punto**, desde v4 y salvo `include-hidden-files: true`. Hoy no hay
  ninguno en lo que se publica, pero el día que entre uno **no falla nada**:
  simplemente no llega al sitio.
- **El rompe-caché del HTML no toca los scripts que el HTML carga.** Un `?v=`
  en la URL de la página trae la página nueva y sigue ejecutando el
  `plazos.js` viejo que ya estaba en memoria, sin ningún síntoma salvo que el
  código nuevo «no hace nada». Pasó el 26/8 midiendo la migración de
  `caducidad`. Lo que sí funciona: `fetch(url, { cache: 'reload' })` sobre cada
  script y recién después recargar. Y la regla que lo vuelve innecesario:
  **antes de medir, comprobar que el código que corre es el que se acaba de
  escribir** —que la función nueva exista—, en vez de confiar en un parámetro
  de la URL.
- **Al leer un diff grande de un HTML, mirar primero si es de contenido.**
  `git diff --ignore-cr-at-eol` lo despeja en un segundo.
- **La consola de Next acumula errores viejos y no los limpia al recargar.**
  Pasó el 7/8: un guardado intermedio con el JSX roto dejó cinco errores de
  sintaxis en el buffer, y siguieron apareciendo después de arreglarlo, con
  números de línea de código que ya no existía. **Lo que lo resuelve es una
  compilación fresca:** `rm -rf .next && npm run build`. Si `tsc --noEmit` está
  limpio y el build de cero pasa, la consola miente.

Las que ya no aplican —el `.gitattributes` en UTF-16, el caché de Pages,
`npm run lint`— están en [`HISTORIA.md`](HISTORIA.md).
