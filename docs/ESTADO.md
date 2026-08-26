# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-08-26 · rama `main`

Lleva sólo lo que sigue vivo: dónde está el trabajo, qué está abierto, qué se
sabe roto, qué decisiones no hay que contradecir sin saberlo, y qué trampas ya
costaron tiempo. **Lo que se cerró está en [`HISTORIA.md`](HISTORIA.md)** —cómo
se llegó hasta acá, qué se rompió y ya se arregló, qué se discutió y se
decidió—. No hace falta leerlo para trabajar: se abre cuando aparece la pregunta
«¿por qué esto quedó así?».

> **Honorio no vive acá.** Se mudó el 4/8 a
> [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio) con su propio
> `ESTADO.md`, que es donde va todo lo del motor, el wizard y el dashboard. Qué
> sigue compartido —el motor legacy, `docs/domain/`, los planes— está en
> [`AGENTS.md`](../AGENTS.md). Si en la copia de trabajo hay un `honorio/`, es un
> clon de aquel repositorio: `git remote -v` antes de commitear.

---

## Dónde estamos

El sitio está publicado en **`javiercuneo.com.ar`**, dominio propio, desde el
5/8. Once calculadoras sobre el mismo sistema visual y revisadas una por una;
nueve documentos de dominio cerrados y verificados contra el motor;
**Escribiente** rehecha entera el 17/8 sobre las ruinas de PDF-studio;
[`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md) hecho entero. Desde el 24/8,
**`uma-uhom.html`**: el valor vigente de las dos unidades con las que se regulan
honorarios y la serie entera de cada una, reconstruida de los actos.

**El 25/8 la landing volvió a decir lo que Honorio hace.** Anunciaba la versión
3.1.1 con la app en 3.4.1, publicaba los recorridos y los cruces de antes del
exhorto, mostraba dos capturas del dashboard anterior al rediseño de la 3.4.1 y
no nombraba tres cosas que la app tiene desde agosto. Con el arreglo entró el
control que faltaba: ver [las cinco cifras](#las-cinco-cifras-que-este-repositorio-sigue-de-honorio).

**Los cuatro planes están cerrados.** Bugs y cálculo directo el 7/8, mediación el
8/8, y [regulación en prosa](PLAN_REGULACION_EN_PROSA.md) —la más riesgosa, la
que se dejó última— entera el 10/8: el generador con sus tres controles y
`ProsaSection.tsx`, la última sección del dashboard. Casi todo el código es de
Honorio y el detalle está en su `ESTADO.md`; de este lado quedan los planes con
qué se hizo de cada paso y qué se apartó de lo previsto.

**El 25 y el 26/8 se hizo el frente más grande desde la mudanza de Honorio:** el
cómputo de plazos salió de adentro de los HTML a `calculadoras/js/plazos.js`, se
expuso por HTTP local y por MCP en `conectores/` —el pedido abierto de
`pipeline-drafter`—, `vencimientos` y `mora` pasaron a consumirlo, entró el
plazo dibujado sobre el calendario, se rediseñaron `vencimientos` y el tablero,
y el cron de feriados dejó de ser un pendiente. **Si arrancás una sesión nueva,
[Por dónde seguir](#por-dónde-seguir) tiene el orden y el método.**

**Y cerró el bug más viejo que quedaba abierto: `--faint`**, que estaba desde el
12/8 y se había parchado tres veces en tres pantallas distintas. El token se
arregló en los seis lugares donde vive y entró `npm run verificar-contraste`,
que corre en CI y que de paso encontró **dos cosas que nadie había visto**: que
los diez documentos de dominio se publicaban con los valores anteriores al 5/8
—2,59 de contraste, peor que el bug que se estaba arreglando— y que **la paleta
de estados entera reprobaba en tema claro**, con `--warn` sin llegar sobre
ninguna superficie. Las dos arregladas el mismo día. Ver
[el arreglo](#el-token---faint-arreglado-de-raíz--268) y
[la paleta](#la-paleta-de-estados-bajada-a-aa--268).

**Y `vencimientos` quedó terminada**, con la devolución de Javier hecha punto
por punto: dos columnas, los modificadores del cómputo juntos y detrás de una
casilla, tres líneas separadoras de menos, los días de nota marcados en el
dibujo y el calendario con tamaño constante. Con eso **queda desbloqueado el
frente grande que sigue: las otras diez calculadoras, con ésta de patrón.**

**No queda nada urgente ni bloqueante.** Lo abierto está en
[Pendientes](#pendientes) y [Bugs abiertos](#bugs-abiertos).

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

Se escribió porque el mecanismo ya había fallado dos veces:

- **El 14/8 ninguna de las cuatro estaba al día**, y la de validaciones estaba
  mal de tres formas distintas: `index.html` decía 11 en el tile, `README.md` 16
  y `documentacion.html` dieciséis, cuando son 17 —contados sobre los archivos—.
  **El chip del propio `index.html` ya decía 17**, así que la landing se
  contradecía a sí misma a setecientas líneas de distancia.
- **El 21/8 el exhorto pasó de dos preguntas a seis** —la 3.4.0 de Honorio— y
  con él los recorridos de 168 a 173 y los cruces de 28.224 a 29.929. De este
  lado no lo notó nadie hasta el 25/8: la landing pasó cuatro días publicando una
  cifra que ninguna corrida produce, con la versión del chip clavada en 3.1.1 y
  Honorio en 3.4.1.

Mediación y la prosa, en cambio, no movieron recorridos ni cruces, y eso era el
resultado buscado: ninguna de las dos agrega una pregunta a la entrevista.

**Lo que el script no puede ver es la prosa, y es lo que más envejece.** La
enumeración de al lado se desactualiza igual que el número —`index.html`
nombraba once controles y `README.md` catorce— y la lista de lo que Honorio hace
envejece más rápido todavía: la regulación redactada, los criterios con su
jurisprudencia y el enlace que lleva el caso adentro existían desde agosto y
**ninguno figuraba en la landing** hasta el 25/8.

---

## Pendientes

Ninguno urgente y ninguno bloqueante.

- **`data/feriados.json` se actualiza a mano, con `npm run feriados`.** Hoy llega
  hasta 2027, así que no apura, pero **nadie avisa cuando se queda corto**: si un
  día alguien computa un plazo de 2028 y el archivo no lo tiene, la calculadora
  no calcula y dice qué año falta —eso ya está resuelto— pero el que tiene que
  correr el script sos vos.
  **Desde el 26/8 hay cron: `.github/workflows/feriados.yml`.** Corre el día 1 de
  cada mes y a mano desde Actions. El permiso de escritura —que es lo que
  necesita el `git push`— se declara **sólo en el job que lo usa**, no en el
  workflow: es una línea de más y evita que un segundo job lo herede sin que
  nadie lo decida.
  **Y el banco de pruebas corre entre traer el archivo y commitearlo.** Sin ese
  paso el cron sería un canal automático desde la API de un tercero hasta las
  fechas que la herramienta afirma; con él, un archivo que rompe un cómputo no
  llega al repositorio.
  **Consecuencia conocida, para que no sorprenda:** `actualizar-feriados` aborta
  entero si un año no se puede leer, y eso incluye el año siguiente cuando la
  API todavía no lo publicó. En los primeros meses de cada año el workflow puede
  fallar por ese motivo y no por un problema real. El modo de falla es el
  correcto —no escribe medio archivo— pero **la alarma es indistinguible de una
  auténtica**. Si molesta, lo que hay que cambiar es el script, para que
  distinga «el año que viene todavía no existe» de «la API no contesta».
- **`data/serie-uma.json` y `data/serie-uhom.json` se cargan a mano y no hay de
  dónde automatizarlas.** Es el mismo caso que la feria: los actos de la CSJN y
  las tablas del Ministerio son PDFs sin API. Cuando sale un valor nuevo hay que
  agregar una línea, con su norma y la fecha del acto.
  **`npm run verificar-series` no puede detectar que falte el último**: detecta
  que lo cargado esté mal, no que falte algo. Lo que sí avisa es la propia
  página, que muestra desde cuándo no se revisan las series y pone un aviso a
  la vista si pasaron más de 45 días.
- **Qué sale del navegador, y de dónde salió la pregunta.** Planteada por
  Javier el 26/8: *«no sé si en javiercuneo.com.ar prometemos que los datos no
  salen del navegador o sólo en Honorio»*. Verificado leyendo las once
  calculadoras:
  - **La promesa está escrita en dos lugares y los dos son de Escribiente** —la
    tarjeta de `index.html` y `documentacion.html`—, y es la única que la
    sostiene con la CSP. **Ninguna calculadora promete nada**, así que no hay
    promesa incumplida.
  - **`vencimientos`, `caducidad`, `entre-fechas`, `regresiva` y `mora` no
    hablan con nadie**: sólo piden los JSON de `data/` del propio sitio.
  - **`honorarios-mediacion` le pide el UHOM a una planilla publicada de Google
    Docs**, en cada carga. No manda ningún dato del usuario, pero Google ve la
    IP y que alguien abrió esa página. **Y es evitable desde el 24/8**, que es
    lo que vale la pena: `data/serie-uhom.json` tiene los 67 valores leídos de
    las tablas oficiales y verificados por `npm run verificar-series`. Pasar la
    calculadora al archivo local saca al tercero y además usa la serie buena en
    vez de una planilla. Es el mismo movimiento que ya se hizo con los feriados.
  - **`distancia` es el caso distinto y el único que manda algo:** los nombres
    de localidad que el usuario escribe van a `apis.datos.gob.ar`, a
    `geocoding-api.open-meteo.com` y a `router.project-osrm.org`. Los dos
    primeros están nombrados en el texto de la página; el tercero no. No es un
    dato personal —es una ciudad— pero es entrada del usuario saliendo a tres
    terceros, y **eso conviene que lo diga la propia página** antes que
    aparezca en un pendiente.
- **Las once calculadoras no hablan el mismo idioma.** Pedido de Javier del
  26/8: *«cada una usa un lenguaje distinto, avisa de años distintos, etc. hay
  que hacer algo más uniforme»*. No es sólo el aspecto: es el tuteo suelto, los
  avisos de cobertura que dicen años distintos, los `max-width` de 240 a 1000
  px, y los rótulos. **El orden acordado es terminar `vencimientos` primero y
  después pasar al resto**, usando esta como patrón.
- **La página de la UMA no tiene `og:image`.** La imagen que le corresponde es
  su propio número grande y hay que hacerla; poner la captura de Honorio sería
  anunciar otra cosa. Sin imagen el enlace igual se comparte, con título y
  descripción.
- **Del lado de Honorio quedan cuatro cosas anotadas el 24/8**, todas en
  `scripts/actualizar-uma.mjs`, y ninguna se tocó desde acá porque es otro
  repositorio:
  1. leer `UMA_VIGENCIA` y `UHOM_VIGENCIA` de la planilla —ya están cargadas— y
     escribir `vigencia` en cada entrada de `historia`. Hoy sólo hay
     `capturado`, que es el día en que el cron vio el valor, y **no es lo
     mismo**: de ahí salió mostrar «rige desde el 20 de agosto» un valor que
     rige desde el 1 de julio;
  2. completar la vigencia también cuando el valor no cambió, igual que ya hace
     con `fuente` y `url`;
  3. el control de forma del UHOM —`v % 10 === 0`— tiene que pasar a aviso:
     noviembre de 2022 salió en 2003 y ese control lo rechazaría, o sea que
     abortaría la sincronización por un valor oficial;
  4. los dos umbrales de salto están mal calibrados y ahora hay serie para
     hacerlo. `SALTO_MAXIMO_UHOM = 0.15` es **más chico que saltos que ya
     ocurrieron** —enero 2024 fue +16 %, junio 2022 +24 %, enero 2019 +20 %—;
     `SALTO_MAXIMO_UMA = 0.6` es al revés, tan flojo que deja pasar un valor
     leído a la mitad cuando el salto más grande de la serie entera es +20 %.
- **`data/feria-judicial.json` se carga a mano y no hay de dónde
  automatizarlo.** Las Acordadas de la CSJN son PDFs sin API. Hoy llega hasta
  2026; la de 2027 la dicta la Corte entre abril y junio de 2027, así que
  **hasta que salga, ningún cálculo que toque 2027 devuelve una fecha**: las
  cuatro calculadoras dicen qué año falta y por qué. Eso es deliberado, no un
  bug —contar julio como hábil adelanta el vencimiento—, pero **es lo único de
  este repositorio que hay que acordarse de hacer una vez por año.**
- **La cobertura arranca en 2021 y está declarada en el archivo, no en el
  código.** Las ferias de 2004 a 2020 están cargadas, pero los feriados
  nacionales y los asuetos de esos años **no**, así que un cálculo sobre ellos
  contaría como hábiles días que no lo fueron. El motor anota cualquier año
  fuera de la ventana que un cálculo toque y la herramienta no afirma una
  fecha. Completar 2004-2020 sería ir a buscar cada feriado y cada asueto de
  diecisiete años: **se decidió que no vale la pena** —nadie computa un plazo de
  2007— y las ferias viejas se conservan sólo como evidencia documental, que es
  lo que probó que la heurística estaba mal.
- **`lib/legal/minimos-data.ts` nunca se verificó contra la ley.** Las cifras de
  los mínimos que citan el `06` y el `07` están verificadas contra ese archivo, y
  el archivo dice ser copia fiel del asistente clásico. Que sea fiel a la copia
  no prueba que sea fiel a la norma. Son unas cuarenta cifras.
- **La ampliación por distancia salió de la notificación automática — 25/8.**
  Planteado por Javier y resuelto contra el Código leído entero, no contra un
  artículo suelto. El art. 158 no condiciona a la modalidad: condiciona a que la
  diligencia deba practicarse «fuera del lugar del asiento del juzgado». Lo que
  contesta dónde se practica es el resto del Código: el **art. 40** manda
  constituir domicilio *dentro del perímetro* de la ciudad asiento del juzgado y
  ahí se diligencian todas las cédulas que no deban ir al real; el **art. 42**
  lo hace subsistir hasta la terminación del juicio; el **art. 133** deja la
  resolución notificada *en el tribunal* los días de nota —tanto que no se tiene
  por cumplida «si el expediente no se encontrare en el tribunal»—; y el
  **art. 41** dispone que a quien no constituye domicilio se le notifique todo
  por nota. Ese último es el que cierra la discusión: **ampliar con nota
  convertiría la sanción del 41 en el mayor beneficio del Código**, porque el
  que incumple el 40 cobraría un día cada 200 km en cada resolución. El caso que
  lo muestra —de Javier—: una demandada en las antípodas que constituye en CABA
  y recibe una notificación por nota no tiene cien días de ampliación, tiene
  cero.
  **Y el campo no estaba porque nadie lo pidiera:** lo agregó una sesión de
  agente el 17/8. Sacarlo no fue mover un número, fue volver al punto de partida
  — la distinción importa, porque el primer análisis lo trató al revés y con eso
  invirtió la carga de la prueba.
  Hecho: la sección se oculta con modalidad automática y **el valor cargado se
  limpia** —dejarlo escrito abajo de una sección invisible es la peor variante—.
  Verificado en pantalla que el camino de cédula no movió un número.
  **Sin texto explicativo, por decisión de Javier del 26/8.** El primer intento
  agregó dos párrafos —uno explicando cuándo corresponde la ampliación, otro
  diciendo por qué no aparece con nota— y los dos salieron. El campo se oculta y
  ya está: una pantalla que explica cada cosa que no muestra termina siendo un
  manual.
  **Lo que queda abierto y es más grande:** por el mismo razonamiento, la
  ampliación tampoco corresponde con **cédula al domicilio constituido**, que es
  la mayoría de las cédulas (art. 40, tercer párrafo). Sólo corresponde con
  cédula al **domicilio real** fuera del radio —traslado de demanda, absolución
  de posiciones, sentencia— o para una diligencia que efectivamente se practique
  afuera. Hoy la calculadora la ofrece con cualquier cédula. Javier decidió el
  25/8 dejarlo así por ahora —«tiene sentido en la cédula y por eso lo toleré»—
  Queda anotado acá, que es donde va lo que está abierto.
- **La guarda por año faltante tiene dos granos distintos, y conviene saber
  cuál.** Verificado el 25/8 corriendo el motor: la **feria** sólo bloquea el
  cómputo que cae en julio o agosto del año sin Acordada —un vencimiento de
  febrero de 2027 calcula hoy sin problema—, y eso está escrito así a propósito
  para que la herramienta no quede muerta esperando un acto que no se dictó.
  Los **feriados**, en cambio, bloquean el año entero, porque un feriado puede
  caer en cualquier mes. O sea que **lo que un día va a congelar la calculadora
  no es la Acordada de la feria: es `feriados.json` quedándose corto.** Hoy
  llega a 2027, así que en enero de 2028 no calcula ninguna fecha de 2028 hasta
  que alguien corra `npm run feriados`. Es el argumento que faltaba para el cron
  que está anotado más arriba.
- **Hay cuatro bancos de pruebas y cubren cosas distintas.** `npm run
  verificar-calculos` (673 comprobaciones) y `npm run verificar-plazos` (34)
  cubren **el motor**: días hábiles, feria, feriados, cobertura, y la
  aritmética de vencimiento y mora. `npm run verificar-contraste` cubre **los
  tokens de color**. `scripts/pruebas-calculadoras.html` —**51 filas: 21
  verificados a mano, 6 invariantes, 3 fijados, y los 21 verificados otra vez
  adentro del tablero**— cubre **las pantallas**: maneja las cinco calculadoras
  por iframe y compara el resultado que muestran. Se abre con el sitio servido —no con `file://`— y
  tarda seis segundos. **Los iframes llevan rompe-caché**: sin él las pruebas
  corren contra la versión anterior de la calculadora, que es la peor forma de
  falla porque parece un bug del cambio que se acaba de hacer.
  **Falta cubrir el prorrateo, la tasa y las demás no-de-plazos**, que hoy no
  tienen ni una comprobación.
- **Las cinco de plazos ya se corrieron de punta a punta** (17/8), con cálculo
  real y pantalla de resultado. Las otras seis no: de esas se midió contraste y
  ancho, y se miraron capturas de dos.
- **Tuteo suelto en el texto de las calculadoras.** Varias dicen «envíanos un
  mail» y «si crees», que es el imperativo de *tú*. La convención del repositorio
  es rioplatense.
- Los `max-width` de las calculadoras siguen yendo de 240 a 1000 px sin criterio.
- **`www.javiercuneo.com.ar` no resuelve**, si se lo quiere: va un CNAME `www` →
  `javiercuneo.github.io` en Cloudflare, gris.
- **De [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md) quedan seis de ocho
  puntos**, con el orden recomendado adentro: uno para hacer ya sin tocar
  números, tres que sí los mueven —uno hacia arriba: los pisos mínimos que el
  motor no verifica—, dos para declarar y no implementar, y uno anotado sin
  fecha.
- Anotado y no decidido, de cálculo directo: si el control de fracción de etapa
  del dashboard debería ofrecer las dos cosas.

Lo que todavía no existe va en `IDEAS.md`, que es cuaderno interno y no se
versiona: acá van sólo los pendientes de lo que ya está construido.

---

## El tablero de plazos

Se decidió hacerlo el 17/8, después de descartarlo y revisar la decisión. **El
argumento que lo sostiene no es la comodidad: es que once herramientas separadas
pueden discrepar en silencio durante años y dos pestañas del mismo marco no.** El
bug de la feria vivió porque nada obligaba a que dos calculadoras se miraran.

Cómo se construye, decidido:

- **En este repositorio, no en uno aparte.** Un repositorio aparte duplicaría
  `calendario-judicial.js`, que es exactamente lo que produjo el bug de `mora`.
- **El marco va en un branch**, porque publicar algo a medio hacer contradice la
  decisión de que una herramienta publicada tiene que estar bien —y esa decisión
  rechaza el argumento de «si no está enlazado no está publicado»—. Lo que
  mejora las calculadoras existentes va directo a `main`: el uso diario de
  Javier es el test.
- **Primera iteración con iframes, no fusionando el markup.** Fusionar cinco HTML
  tiene colisiones de `id` reales —`plazo` está en `caducidad` y en
  `vencimientos`; `dia`/`day`, `mes`/`month`— y cada una es una oportunidad de
  mover un número. Con iframes hay ventana única y pestañas sin tocar una línea
  de las calculadoras. Si el flujo resulta bueno, se fusiona después.

Orden: (1) ampliación por distancia en `vencimientos` —hecho el 17/8—; (2) banco
de pruebas de las pantallas —hecho el 17/8—; (3) el marco —**mergeado a `main`
por el PR #2 y publicado**—; (4) el calendario con el plazo dibujado —**hecho el
25/8**, ver abajo—. Después, la tasa de justicia.

> **Corregido el 25/8.** Hasta hoy esta sección decía que el marco estaba «en la
> rama `tablero-plazos`, sin mergear» y terminaba con «Antes de mergear: nada
> bloqueante». Estaba mergeado desde el PR #2: `calculadoras/tablero.html` vive
> en `main`, `index.html` lo enlaza y `pages.yml` copia `calculadoras/` entera,
> así que **estuvo publicado todo ese tiempo mientras el documento lo daba por
> inédito**. La rama ya no existe ni acá ni en `origin`. Es exactamente la clase
> de desfase que este archivo existe para no tener.

### El marco

`calculadoras/tablero.html`: **ocho herramientas en dos regiones**. Arriba las
seis de plazos —vencimientos, distancia, caducidad, entre fechas, regresiva y
mora— en una barra de pestañas; abajo, aparte, prorrateo y tasa (ver
[el rediseño](#el-tablero-rediseñado-y-las-dos-regiones--268)). Cada una es un
iframe de la calculadora publicada, **sin una línea modificada de ninguna**.
Carga perezosa, estado vivo al volver, enlace directo por `#pestania`, teclas
1-6 y flechas.

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

**Prorrateo, tasa y honorarios de mediación entran, y desde el 26/8 van en una
región aparte**, no como pestañas de la misma barra. No son plazos, y entran
igual porque **el flujo es el mismo**: en un expediente mirás un plazo y en el
siguiente un prorrateo —criterio de Javier, 17/8—. Hasta el 26/8 la separación
era un rótulo de grupo adentro de la misma barra y no alcanzaba: ver
[el rediseño](#el-tablero-rediseñado-y-las-dos-regiones--268).
`honorarios-mediacion` estuvo afuera hasta que se arregló el rótulo del tope, el
mismo 26/8: ver [el tope del ítem G](#el-tope-de-mediación-era-del-ítem-g-y-no-de-la-escala--268).

Ya está enlazado desde `index.html`, en la bajada de la sección de calculadoras.


### El paso (4): el plazo dibujado, adentro de la calculadora — 26/8

**Primero se hizo mal.** El 25/8 salió como `calculadoras/calendario.html`, una
pestaña aparte del tablero. Javier lo corrigió el 26/8: *«mi idea era que el
plazo dibujado fuera parte de la propia calculadora que se está usando y no una
tab aparte»*. Tiene razón y el motivo es el mismo que hace bueno el tablero: el
dibujo no es otra herramienta, **es la explicación del número que la
calculadora acaba de dar**. En una pestaña aparte había que volver a cargar la
fecha y el plazo para ver por qué el resultado era ése. El archivo se borró y la
pestaña se sacó; el tablero volvió a ocho.

Ahora vive adentro de `vencimientos.html`, abajo del resultado. Dibuja los meses
que el plazo abarca: el día de la notificación, cada día contado con su número
de orden, los salteados con el motivo de cada uno, y el vencimiento. **El fin de
semana se atenúa y lo que decidió un acto se marca** —feria, feriado, asueto—,
porque son los días que mueven el vencimiento y que nadie tiene en la cabeza.

Se arma de los tramos que devuelve el motor, **no recorriendo el calendario por
su cuenta**: si la grilla y el cómputo pudieran discrepar, la grilla mentiría con
la autoridad que tiene un dibujo. Y si falta un dato no dibuja nada, ni el
calendario vacío.

El caso que muestra para qué sirve: **20 días hábiles desde el 25/6/2026 no
vencen en julio, vencen el 11 de agosto.** El plazo se comió el Día de la
Independencia, un puente turístico y los diez días hábiles de la feria de la
Acordada 11/2026.

**Y de paso se limpió CSS muerto.** `vencimientos.html` tenía reglas `.calendar`,
`.calendar-day.counted` y `.calendar-day.ignored` escritas y **nunca usadas**
—nada del markup ni del JS producía un `.calendar`—, con colores planos
(`#d4edda`, `#f8d7da`) que el sistema visual no usa. Alguien pensó esta pantalla
antes y no la terminó.

**Un error que casi se publica.** La primera versión ponía el número de los días
de feria en `--warn` sobre `--warn-tint`: 12,7 en tema oscuro y **4,24 en
claro**, abajo de los 4,5 que pide AA a 12 px. Se vio midiendo contraste sobre
estilos computados en los dos temas, y sólo porque se midió el tema en el que no
se estaba trabajando. Ahora el ámbar va en el fondo y el borde, el número en
`--fg`, y lo peor de la grilla es 4,66 en claro y 5,06 en oscuro. Sin desborde
horizontal a 375 px.

### El tablero rediseñado, y las dos regiones — 26/8

**Lo estructural: los plazos y lo que no es plazo dejaron de ser pestañas de la
misma barra.** Hasta hoy las ocho estaban en el mismo `tablist` separadas por
una etiqueta de grupo, y el criterio de Javier del 26/8 es que la etiqueta no
alcanza: dos pestañas una al lado de la otra son dos cosas del mismo rango, y
eso es justo lo que invita a leer un número de honorarios como si fuera de
plazos. Ahora hay **dos regiones independientes**: los plazos arriba con su
barra, y abajo —después de un corte y con título propio— «Honorarios y tasa».

**La segunda arranca sin nada elegido**, como dos tarjetas que hay que pedir.
Hace dos cosas: no carga dos páginas más al abrir el tablero, y se lee como otra
materia en vez de como una continuación de la barra.

Las dos regiones son independientes en serio: elegir la tasa **no cierra** el
plazo que quedó abierto arriba. Las flechas recorren su propia región y no
saltan a la otra —saltar volvería a decir que son lo mismo—, y los atajos 1-6
son sólo de plazos.

**El enlace directo sigue funcionando para las ocho**, y ahí hubo un bug que
costó encontrar y conviene no repetir: en el arranque hay que activar **primero**
la de plazos por defecto y **después** la del hash, porque cada `activar()`
reescribe el hash con `replaceState` y el último es el que queda. Al revés,
entrar por `#tasa` terminaba con la URL diciendo `#vencimientos`.

**El motor de iframes no se tocó.** La carga perezosa, la medición del alto
sobre el rect del `<body>`, la anulación de `min-height: 100vh` y la
sincronización de tema son las mismas líneas: es lo que costó encontrar y no
había motivo para reescribirlo.

**Y una medición que hizo falta tres veces para un badge de diez píxeles.** El
número de atajo daba **3,30** con `--faint` sobre `--border`; con `--muted-fg`
seguía en **3,96**, porque el relleno de `--border` oscurece el fondo. Quedó de
contorno y sin relleno, leyendo contra `--bg`: **5,16**. Fue la tercera aparición
del bug de `--faint` en el mismo día, y la que hizo que se arreglara de raíz esa
misma tarde: ver [el token, arreglado](#el-token---faint-arreglado-de-raíz--268).
El badge se queda en `--muted-fg` igual, por el tamaño y no por el token.

Verificado: contraste sin excepciones en los dos temas —peor 4,82 en claro,
5,06 en oscuro—, sin desborde a 375 px, y `vencimientos` embebida da la misma
fecha que suelta.

---

### El token `--faint`, arreglado de raíz — 26/8

**El bug estaba abierto desde el 12/8 y se había arreglado tres veces a mano.**
Javier: *«no lo veo... ni lo entiendo... arreglalo y listo»*, y tenía razón en
las dos cosas: no se ve, y se venía tratando como si fuera un problema de cada
pantalla.

**Qué era.** `--faint` es el gris de todo el texto chico —etiquetas de 11 px en
mayúsculas, colofones, fechas—. En tema claro daba **5,14 sobre `--card`** y
**4,30 sobre `--bg`**: pasaba AA sobre la tarjeta blanca y lo reprobaba sobre el
fondo de la página. O sea que el mismo texto, con el mismo color, cumplía o no
según arriba de qué estuviera.

**La causa no fue el valor: fue contra qué se lo midió.** El 5/8 se lo bajó
mirando la tarjeta, que en claro es la superficie **más clara** y por lo tanto la
más fácil. La regla que faltaba escrita, y que ahora está en `comun.css`:

> **en claro manda `--bg`, que es la superficie más oscura; en oscuro manda
> `--card`, que es la más clara.** Son opuestas. Medir contra una sola alcanza
> para que un token parezca bien en los dos temas y esté mal en uno.

**El arreglo.** `--faint: #5f6774` —4,78 / 5,71 / 5,18 sobre `--bg` / `--card` /
`--sunk`— en los **seis archivos donde viven los tokens**: `index.html`,
`documentacion.html`, `quien-soy.html`, `uma-uhom.html`,
`calculadoras/css/comun.css` y la plantilla de `scripts/build-docs.mjs`. Los dos
parches locales volvieron al token: `.cobertura` y `.colofon` de
`vencimientos.html`. En oscuro no se tocó nada: `#828a98` da 5,06 sobre `--card`,
que ahí es el piso.

### Y el control que hace que no vuelva: `npm run verificar-contraste`

`scripts/verificar-contraste.mjs`, en CI, sin red y sin `honorio/`. **Existe
porque un arreglo que se hizo tres veces no se arregla escribiendo bien la
cuarta.** Hace dos cosas, que son dos formas distintas de fallar:

1. **Contraste.** Cada token de texto —`--fg`, `--muted-fg`, `--faint`,
   `--accent`— contra **las tres superficies**, en los dos temas, con piso 4,5.
   Es exactamente lo que nadie hizo el 5/8.
2. **Deriva.** Los tokens están escritos seis veces porque son páginas sin
   build. El control exige que los seis archivos digan lo mismo, y que adentro
   de cada uno **los dos bloques oscuros coincidan** —el del `@media` y el de
   `[data-tema="oscuro"]`—, que es la regla que `comun.css` pide de palabra
   desde agosto y nada verificaba.

**Y encontró dos cosas que nadie había visto, que es lo que justifica que
exista:**

- **La plantilla de `build-docs.mjs` tenía los valores anteriores al 5/8.** Los
  diez documentos de dominio se publicaron todo ese tiempo con `--faint:
  #8b93a0`, que da **2,59 sobre el fondo** —contra 4,5— en la etiqueta del
  índice lateral, y `#6b7381` en oscuro, que da 3,68. **Peor que el bug que se
  estaba arreglando**, y no se veía mirando ninguna de las trece páginas porque
  esas diez las genera un script. Arreglado en el mismo commit.
- **`uma-uhom.html` ya tenía el valor nuevo** desde el 24/8 y las otras tres
  páginas sueltas no. Seis copias no se mantienen iguales solas y la deriva no
  aparece en ningún diff: cada archivo, por separado, se ve bien.

**Lo que el control mide y no hace fallar:** los tokens de estado. Ver
[Bugs abiertos](#bugs-abiertos).

**Lo que el control NO puede ver, y hay que seguir midiendo en pantalla:** que un
token esté bien no dice que esté usado sobre la superficie que se supone. El
badge del tablero pasó a 3,30 porque el relleno de `--border` oscureció el fondo,
y eso no está en ninguna declaración de token. El control cubre la paleta; el uso
se mide sobre estilos computados.

**Verificado en pantalla**, con `vencimientos.html` servida y con rompe-caché en
el `<link>` además del HTML —sin eso se mide el CSS anterior, que es la trampa
de siempre—: en oscuro no queda ni un texto abajo de AA, y en claro los que
quedaban por `--faint` —`.cobertura`, `.colofon` y los cuatro `<code>` del
colofón— pasaron de 4,30 a 4,78.

---

### El tope de mediación era del ítem G, y no de la escala — 26/8

Estaba anotado desde el 8/8 como «el rótulo del tope está mal, el arreglo es
barato», y era lo único que mantenía a `honorarios-mediacion` afuera del
tablero.

**Qué decía mal.** La calculadora aplicaba el tope de 120 UHOM a toda la escala
y, cuando mordía, escribía «Aplicado tope máximo de 120 UHOM». El tope es del
**ítem G** —el que manda 2 % del monto cuando el reclamo pasa las 1000 UHOM—,
no de la escala: está en la tabla del Anexo III y en
[`09_MEDIACION.md`](domain/09_MEDIACION.md).

**Por qué vivió tanto, que es lo que vale la pena guardar:** los ítems A a F
topean en 20 UHOM, seis veces por debajo de 120, así que **el tope general
nunca podía morder**. La cuenta daba lo mismo con el error y sin él. Ninguna
comprobación aritmética podía cazarlo: lo único que estaba mal era lo que la
pantalla decía de su propia cuenta. En una herramienta que se usa para fundar
una regulación, eso no es cosmética —el que la usa copia la regla que la
pantalla nombra—, pero tampoco movía un peso, y por eso se dejó viva.

**Verificado que no movió un número:** un millón de pares (UHOM, monto)
—cinco valores de UHOM, el monto barrido de 0 a 20.000 UHOM en pasos de 0,1—
comparando la lógica vieja contra la nueva: **cero diferencias de importe**. Y
en pantalla, los cinco tramos: 20 UHOM da el ítem A, 500 el E, 2000 el G sin
tope (40 UHOM), 6000 justo en el borde (120 UHOM, sin aviso de tope porque no
lo supera) y 20.000 con el tope aplicado y dicho.

**Y con eso entró al tablero**, en la segunda región, con los otros dos que no
son plazos. Verificado: la tarjeta monta el iframe, mide alto, y el enlace
directo `#mediacion` en carga fría deja el hash donde corresponde —que es el
bug que costó encontrar al partir el tablero en dos regiones—.

---

### El banco de pruebas de las pantallas estuvo rojo desde el rediseño — 26/8

**Se descubrió corriéndolo**, que es la única forma: `pruebas-calculadoras.html`
no está en CI —maneja páginas reales por iframe y necesita el sitio servido—,
así que nada avisa cuando se rompe.

**26 de las 51 filas fallaban** con `Cannot set properties of null (setting
'value')`: las 13 de `vencimientos` sueltas y las mismas 13 adentro del tablero.
El motivo: el rediseño de esa misma mañana convirtió el `<select
id="modalidad">` en un control segmentado de dos `radio` con
`name="modalidad"`, y el driver seguía buscando el `<select>`. La lectura del
resultado estaba rota igual, por lo mismo: recortaba la fecha entre los rótulos
«Vencimiento del Plazo» y «Hora», que el rediseño se llevó.

**La lección, que es la parte que sirve:** las dos roturas son la misma. El
driver estaba anclado en **cómo se ve** la pantalla —el tipo de control, el
texto de los rótulos— y no en su estructura. Ahora hace click en el `radio` por
`value` —click y no `.checked = true`, porque el click es lo que dispara el
listener que pinta la etiqueta y esconde la ampliación— y lee la fecha de
`.veredicto .fecha`. **Un ancla estructural sobrevive a que cambie la
redacción; una sobre el texto visible, no.**

**Y lo que hay que hacer, aunque no se hizo:** el rediseño y el banco tienen que
correr juntos. Hoy hay que acordarse, y el 26/8 nadie se acordó durante las
horas que separaron el rediseño de esta corrida. **Verificado después del
arreglo: 51 de 51.**

---

### `vencimientos` terminada: la devolución de Javier, punto por punto — 26/8

Seis observaciones sobre la pantalla ya rediseñada. Todas hechas, y ninguna
movió un número: **51 de 51 en el banco de pantallas, después de los cambios.**

**1. «Hay demasiadas líneas separando cosas, no sé qué vienen a mostrar.»**
Contadas: la de abajo de la barra de pestañas, el recuadro del tablero, la
línea de abajo del encabezado de la calculadora, y la de arriba de los botones.
**Cuatro divisiones para una sola cosa.** Salieron tres: el recuadro del
tablero —las once calculadoras traen su propio contenedor en `--card`, así que
no delimitaba nada que no estuviera ya delimitado—, la del encabezado y la de
los botones. Queda la de la barra de pestañas, que sí separa la navegación del
contenido. **Y salió también el margen lateral del `body` embebido**, que se
sumaba al de la página del tablero y dejaba la calculadora corrida hacia
adentro respecto del título de arriba: era un encierro más, sin borde que lo
mostrara.

**2. «Un espacio grande a la derecha vacío… me pregunto si el resultado se
debería mostrar ahí.»** Sí. **Ahora son dos columnas**: el formulario a la
izquierda, la respuesta a la derecha, y el dibujo abajo a ancho completo, que
es lo único de la pantalla que quiere todo el ancho que haya. A una sola
columna abajo de 900 px.

Y la columna derecha **no arranca vacía**: lleva un aviso que dice dónde va a
aparecer la respuesta. No es decoración —si estuviera vacía, calcular movería
el formulario de lugar—, y una caja vacía no dice qué va a pasar.

**3. «Ampliación por distancia debería ir junto a fuera de horario hábil,
porque en el fondo son como modificadores del cómputo, y permanecer oculto con
un checkbox.»** Hecho, y tenía razón por partida doble: los tres —el horario,
la ampliación y los días de nota— corren el vencimiento, ninguno se usa casi
nunca, y estaban en tres lugares distintos de la pantalla. Ahora son un solo
grupo, **Modificadores del cómputo**, cada uno detrás de una casilla.

**Y eso abrió un modo de falla que hubo que cerrar aparte.** Con el campo
escondido, un valor cargado antes seguía sumándose: el plazo salía con días de
más y nada en pantalla lo explicaba. Que el campo se limpie al ocultarse no
alcanza —alcanza con que alguien le escriba el `value` por código, que es
exactamente lo que hace el banco de pruebas—, así que **`calcular()` comprueba
de nuevo que la casilla esté tildada antes de leer el número.** El banco tuvo
que aprender a tildar la casilla, y los cuatro casos de ampliación lo prueban.

**4. «Si cambiás a notificación automática aparece un recuadro nuevo con otro
color de fondo.»** Era `.nota-caja`, con fondo `--sunk` y borde propio. Un
recuadro adentro de una tarjeta adentro de una página son tres encierros, y
además hacía parecer los días de nota de otra categoría que los otros dos
modificadores, cuando son lo mismo. Sin fondo ni borde: el rótulo y el espacio
alcanzan.

**5. «Los días de nota no se ven marcados en el calendario.»** Era cierto y era
el peor de los seis: el usuario tildaba diez fechas, esas fechas **movían el
vencimiento**, y el dibujo no las mostraba. Ahora llevan un punto, con su
entrada en las referencias. **Punto y no color de fondo, a propósito:** un día
de nota no es una categoría de día —puede ser además contado, o ser la
notificación— sino algo que pasó ese día. Las fechas salen del formulario y no
del motor: el motor las usa para elegir el día de notificación y no las
devuelve.

**6. «El calendario me está encantando… creo que le dejaría siempre el mismo
tamaño, el que tiene cuando se ve el mes completo, porque es demasiado grande
si no.»** El mes era `minmax(212px, 1fr)`, o sea se estiraba para llenar el
lienzo: un plazo de dos meses daba celdas de 62 px y uno de cinco, de 28. **El
mismo dibujo cambiaba de tamaño según cuánto durara el plazo**, que es justo lo
que un calendario no puede hacer. Ahora el mes mide 236 px fijos —celda de
30 px, el tamaño con el que se dibujó— y los meses se centran. Sobra aire a los
costados cuando son pocos, y es preferible al mes gigante.

**Verificado:** contraste sin excepciones en los dos temas, **midiendo cada
tema en una carga fresca y no cambiando `data-tema` en caliente** —ver la
trampa de las transiciones—: peor 4,78 en claro y 5,06 en oscuro, sobre 187
textos. Sin desborde horizontal a 375 px. Y `vencimientos` embebida en el
tablero da la misma fecha que suelta.

### La paleta de estados, bajada a AA — 26/8

El hermano de `--faint`, y con la misma causa: la paleta clara estaba calibrada
contra la tarjeta blanca. Decisión de Javier: *«corregí el bug de --warn, --ok
y --error… los colores de la paleta los elegiste vos de todos modos»*.

**La superficie que manda no es `--card` ni siquiera `--bg`: es el tinte del
propio estado encima de `--bg`**, porque un aviso casi nunca se escribe sobre
la superficie pelada, se escribe sobre su tinte, que es más oscuro. Ahí los
tres reprobaban, y `--warn` no llegaba **sobre ninguna de las tres
superficies**: 3,92 sobre `--bg`, 4,25 sobre `--sunk`, 4,68 sobre `--card`, y
3,58 sobre su tinte.

Se bajó la luminosidad conservando tono y saturación:

| token | antes | ahora | peor caso ahora |
|---|---|---|---|
| `--ok` | `#1f7a4d` | `#1c6e45` | 4,64 |
| `--warn` | `#9a6b12` | `#815a0f` | 4,64 |
| `--error` | `#a8482b` | `#9f4429` | 4,65 |

`--ok` y `--error` se mueven tan poco que no se ven; **`--warn` sí se ve más
ocre, y es el precio de que se lea.** En oscuro no se tocó nada: los tres
pasaban con holgura.

**Y `verificar-contraste` dejó de avisarlos y pasó a fallar con ellos**, con el
tinte incluido como fondo a medir. Probado al revés: devolviendo `--warn` al
valor viejo, el control corta con cuatro fallas y además delata la deriva
—`documentacion.html` diciendo una cosa y `comun.css` otra—.

---

## Por dónde seguir

Lo de este frente, en orden y con lo que hace falta saber para arrancar en frío.

1. **Extender el dibujo del plazo a `caducidad`, `entre-fechas` y `regresiva`.**
   Es lo que sigue y es lo más largo. **No se puede hacer directo:** esas tres
   tienen su aritmética adentro del HTML y `plazos.js` todavía no las cubre, así
   que primero hay que extraerlas. El método está probado dos veces hoy y es el
   que hay que repetir:
   a) capturar la salida de la pantalla actual sobre una matriz de casos —con el
      detalle, no sólo la fecha final—, **contra el sitio servido y con
      rompe-caché**;
   b) transcribir la aritmética a `plazos.js` sin tocarla, conservando las
      convenciones de fecha de cada una;
   c) hacer que la pantalla consuma el motor;
   d) correr la misma matriz y exigir que dé idéntico.
   Recién con la pantalla consumiendo el motor se puede dibujar, porque el
   dibujo se arma de `diasContados` y `diasSalteados`.
2. **El cruce pantalla contra motor en `scripts/pruebas-calculadoras.html`.**
   Sigue pendiente y es la red que faltaría para que una divergencia falle a los
   gritos en vez de en silencio. Con `vencimientos` y `mora` ya migradas la
   urgencia bajó —hay una sola implementación— pero el control sirve igual para
   las que se migren después.
3. **El resto de las calculadoras, con `vencimientos` de patrón.** Acordado con
   Javier el 26/8: *«en algún momento hay que encarar la modificación y
   adaptación de todas las calculadoras… terminemos vencimientos y luego pasamos
   al resto»*. `vencimientos` quedó terminada ese mismo día, así que **esto ya
   está desbloqueado y es el frente grande que sigue.**
   No es sólo el aspecto. Lo que hay que uniformar, en orden de lo que más se
   nota: el aviso de cobertura —cada una nombra años distintos—, el tuteo suelto
   («envíanos un mail», «si crees»), los `max-width` de 240 a 1000 px, y los
   rótulos. Los criterios que ordenaron `vencimientos` están en su `<style>` y
   se pueden repetir: cada control ocupa lo que mide su contenido, lo único
   grande es el resultado, los modificadores del cómputo van juntos y detrás de
   una casilla, y nada se separa con una línea si alcanza con el espacio.
4. **Cubrir los conectores con una prueba.** Hoy `conectores/` no lo toca
   ninguna: `verificar-plazos` cubre el motor. Es lo que falta para poder
   decir que están terminados, y es barato —levantar el HTTP, pegarle a los
   seis endpoints, y hablarle al MCP por stdio—. **Lo demás del pedido ya no
   es de este lado**: el 26/8 quedó anotado en el `ESTADO.md` de
   `pipeline-drafter` que el servicio existe, cómo se llama y cuáles son las
   dos reglas de borde. El pedido se cierra allá.
5. **Sacarle a `honorarios-mediacion` la dependencia de Google Docs.** Le pide
   el UHOM a una planilla publicada en cada carga, y desde el 24/8
   `data/serie-uhom.json` tiene los 67 valores leídos de las tablas oficiales y
   verificados por `npm run verificar-series`. Saca un tercero de la página y
   además usa la serie buena. Es el mismo movimiento que ya se hizo con los
   feriados, y vale para todas las que lean planillas.

---

### `vencimientos.html` rediseñada — 26/8

**El pedido de Javier, textual:** *«transformar desde un html hecho por una IA
que no le da para mucho a un dashboard que parezca hecho por Claude»*, y el
diagnóstico concreto que lo acompañaba: el selector de modalidad ocupaba el
ancho entero para decir «Por cédula», con un espacio en blanco cuatro veces más
grande que el texto. Sin jerarquía.

**El criterio que ordenó todo: cada control ocupa lo que mide su contenido.** Un
día son dos dígitos y entra en 4ch; el año en 6,8ch. La modalidad son dos
opciones y pasó a ser un **control segmentado**, no un desplegable: con dos
opciones un desplegable esconde la mitad de la elección detrás de un clic y no
ahorra nada. Los `radio` de adentro son el control real —teclado y lector de
pantalla—; la clase `.elegida` es sólo pintura.

Lo único grande de la página es el vencimiento. Antes eran seis tarjetas
apiladas del mismo peso, incluida la del resultado: seis bloques iguales para
seis datos que no valen lo mismo. Ahora hay tres alturas: la fecha, la tira de
cuatro datos, y el dibujo.

**No se cambió la paleta.** Cobalto sigue siendo el único acento y los tokens
son los de `comun.css`. Lo que cambió es densidad y jerarquía.

**Tres cosas del dibujo, pedidas por Javier:**

- **Sin título.** «El plazo, dibujado» arriba de un calendario dibujado no
  informa nada.
- **Sin lista de días no contados.** Los fines de semana se ven; escribir «el
  sábado no se cuenta» abajo de un dibujo que ya lo muestra es ruido. Lo que el
  dibujo no puede decir es **por qué** un martes está marcado, y eso —y sólo
  eso— se escribe.
- **La firma de la resolución se marca**, con notificación automática. Lleva
  `--ok`, que es un token de estado del sistema y no un acento nuevo, y va en el
  borde y no en el relleno para no competir con el vencimiento. El dibujo ahora
  arranca en la fecha cargada y no en la notificación, porque si no la firma
  quedaba fuera del lienzo.

**Y los motivos van agrupados por tramo.** La primera versión sacaba doce fichas
idénticas que decían «Feria judicial (Acordada CSJN 11/2026)» y **tapaban al
feriado suelto**, que es justamente la sorpresa que hay que ver. Ahora son tres:
el 9 de julio, el puente del 10, y «20 jul a 31 jul · Feria judicial · 10 días».
El agrupado admite hasta tres días de hueco porque la feria salta el fin de
semana, y un motivo que reaparece más lejos abre un tramo nuevo —2009 y 2020
tuvieron más de una feria—.

**Dos arreglos que salieron de medir, no de mirar:**

- `.cobertura` y `.colofon` daban **4,30 en tema claro**. Son los dos únicos
  textos que van sobre `--bg` en vez de `--card`, y ahí `--faint` reprobaba AA
  —el mismo token daba 5,14 sobre la tarjeta—. Ese día se eligió `--muted-fg`
  para no tocar trece páginas; **más tarde el token se arregló de raíz y los dos
  volvieron a `--faint`**, que es lo que semánticamente son.
- El rótulo de la fecha decía «Seleccione la fecha de la firma de la
  **resolucion**», **sin tilde**, en texto que ve el usuario. Venía del original.
  Ahora dice «Firma de la resolución», que además entra en una línea: el estilo
  es de etiqueta —once píxeles, mayúsculas, con espaciado— y una frase entera ahí
  se lee peor que en caja baja.

**Verificado:** los mismos 12 casos de antes de la migración, **12 de 12
idénticos** después del rediseño completo. Contraste sin excepciones en los dos
temas —peor 4,66 en claro, 5,06 en oscuro— y sin desborde a 375 px.

**Lo que falta de este frente:** extender el dibujo a `caducidad`,
`entre-fechas` y `regresiva`, que no tienen calendario porque no consumen el
motor todavía; ése es el paso previo y está en [Por dónde
seguir](#por-dónde-seguir). Los otros dos que estaban acá —el tablero
rediseñado y sacar `honorarios`, `tasa` y `prorrateo` de la barra— se hicieron
el mismo 26/8: ver [el rediseño](#el-tablero-rediseñado-y-las-dos-regiones--268).

---

### Las pantallas consumen el motor — 26/8

**El 25/8 quedó lo peor de los dos mundos y conviene que quede escrito:** el
motor extraído y las pantallas con su copia, o sea dos implementaciones vivas de
una cuenta con consecuencia jurídica, mantenidas iguales sólo por haber sido
escritas el mismo día. Decisión de Javier el 26/8: hacer que las pantallas
consuman el motor.

Migradas las dos que `plazos.js` cubre:

- **`vencimientos.html`** — `calcular()` ya no tiene aritmética: lee el
  formulario, valida, llama a `Plazos.vencimiento()` y muestra.
  `calcularNotificacionAutomatica()` y `proximoDiaDeNota()` quedaron como
  delegaciones de una línea.
- **`mora.html`** — se fueron `nextBusinessDayStrict` y `countBusinessDaysFrom`.
  `isBusinessDay` se queda porque la usa el detalle día por día, que no calcula
  el vencimiento. Es el caso testigo del problema: hasta el 17/8 deducía la feria
  con una heurística propia distinta de la del motor, y **las dos estaban mal, en
  años distintos, durante años**.

**Cómo se probó que no se movió un número.** Antes de tocar nada se capturó la
salida de las pantallas: 12 casos de `vencimientos` y 6 de `mora` —éstos con la
línea de tiempo entera, no sólo la fecha final—. Después de migrar, los mismos
casos: **12 de 12 y 6 de 6 idénticos.**

**Y en el medio se pisó la trampa del caché**, que ya estaba anotada para los
iframes del tablero y vale igual acá: la primera corrida dio 12 de 12 **contra el
archivo viejo**, porque el servidor estático no manda `no-cache`. Salió a la luz
sólo porque el dibujo no aparecía. Una comparación cacheada da verde siempre:
**toda medición contra el sitio servido va con rompe-caché.**

**Lo que falta de esto:** `caducidad`, `entre-fechas` y `regresiva` siguen con su
aritmética adentro. `plazos.js` todavía no las cubre, así que migrarlas pide
primero extraerlas, con el mismo método —capturar la salida, extraer, comparar—.

---

## El cómputo de plazos, extraído y consultable — 25/8

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
El estado del 25/8 era la transición, no el destino. Ver [la migración](#las-pantallas-consumen-el-motor--268).

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

**Los dos andan, verificado el 26/8 corriéndolos.** El MCP contesta
`initialize`, `tools/list` y las seis herramientas por stdio; el HTTP contesta
GET con query y POST con cuerpo, escucha en `127.0.0.1:8787`, lista sus
endpoints en `/` y devuelve 404 en una ruta que no existe. Los dos dan el mismo
número que la pantalla en los dos casos testigo —vencimiento 11/8/2026 y mora
12/7/2026— y los dos devuelven `ok: false` con el motivo cuando el año no está
cargado, en vez de una fecha.

**Lo que falta, y son dos cosas distintas:**

- **Ninguna prueba los toca.** `verificar-plazos` cubre el motor, no los
  conectores: hoy nada detecta que un transporte deje de arrancar, que se
  rompa el JSON-RPC o que un cambio de nombre de campo tire un `arguments`
  al piso. Es barato de agregar —levantar el HTTP, pegarle a los seis
  endpoints, y hablarle al MCP por stdio— y es lo que falta para poder decir
  que están terminados.
- **Falta avisarle al hermano.** El pedido está anotado en el `ESTADO.md` de
  `pipeline-drafter` y en `HERMANOS.md` como abierto; cuando esto se use desde
  allá, se cierra ahí y no acá. **Hasta que alguien los consuma, «andan» quiere
  decir que pasan una corrida a mano, no que estén rodados.**

---

## Escribiente

**Es PDF-studio rehecho entero, con otro nombre, desde el 17/8.** Vive en
`escribiente/` y se publica en `/escribiente/`; la URL vieja `/PDF-studio/`
queda viva con un aviso. Pasa PDF judiciales a Markdown y anonimiza los datos
personales; también une, separa y rota. Los seis bugs que tenía la versión
anterior —y por qué se tiró en vez de parcharse— están en
[`HISTORIA.md`](HISTORIA.md).

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
  están ahí como regresión con el caso exacto que fallaba, y las tres fugas del
  21/8 también. `js/app.js` es sólo la pantalla y no
  decide nada sobre el documento.
- **Las librerías van versionadas en `escribiente/vendor/`** —pdf.js 3.11.174 y
  pdf-lib 1.17.1, 1,9 MB—. No se vuelven a un CDN: ver la decisión de abajo.
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

## Bugs abiertos

### Los diez documentos de dominio no tienen interruptor de tema — 26/8

Lo que genera `scripts/build-docs.mjs` sigue al sistema y nada más: no carga
`assets/tema.js`, no tiene el botón, y su bloque oscuro es sólo el `@media`, sin
el `:root[data-tema="oscuro"]` que tienen las otras trece páginas. **Quien
eligió claro con el sistema en oscuro ve `/docs/` en oscuro igual.**

Apareció escribiendo `verificar-contraste`, que exige los dos bloques oscuros en
todos lados y tiene a este archivo declarado como excepción con nombre y
motivo. Arreglarlo es agregar el bloque, el `<script>` y el botón a la
plantilla; no se hizo en el mismo commit para no mezclarlo con el arreglo del
token.

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

**El tema lo elige el usuario, desde el 5/8**, con un botón en las trece páginas
que inyecta `assets/tema.js` —compartido, porque trece páginas sin build no
pueden mantener trece copias del mismo comportamiento—. Sin elección guardada se
sigue al sistema; con elección, manda la elección y persiste en `localStorage`.

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
descubrir: ver [el arreglo](#el-token---faint-arreglado-de-raíz--268). Lo
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
- **`sitio-estatico` de `.claude/launch.json` tiene el puerto escrito dos
  veces**, en `runtimeArgs` (`http.server 4180`) y en `port`, con `autoPort`
  encima. Si el 4180 está ocupado —queda ocupado por servidores viejos de
  sesiones anteriores— el harness reasigna el puerto y abre la pestaña ahí,
  pero Python sigue escuchando en 4180: la pestaña da error y el server figura
  «starting» para siempre. Se ve enseguida con `curl localhost:4180`. Mientras
  no se arregle, navegar a mano al 4180.
- **Son dos proyectos npm distintos: fijarse en cuál se está parado.** El de la
  raíz tiene **once scripts y nada más**: `docs`, `verificar-docs`,
  `verificar-calculos`, `verificar-plazos`, `verificar-series`,
  `verificar-contraste`, `verificar-escribiente`, `verificar-honorio`,
  `feriados`, `conector-http` y `conector-mcp`. `check`,
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
