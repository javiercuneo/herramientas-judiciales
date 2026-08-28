# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-08-27 · rama `main`

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

**El 27/8 fue día de las calculadoras que no son de plazos.** Se rehizo
`prorrateo` entera —y el tope del art. 730 dejó de estar clavado en 22 %—, las
cinco de plazos pasaron a declarar su cobertura con las mismas palabras, y
**`tasa` se refundó entera**: se le arreglaron dos cobros mal y un contraste que
la hacía ilegible en tema oscuro, se le construyeron las pruebas que no tenía,
y con esa red encima se le cambió el modelo. **Dejó de ser un árbol y pasó a ser
una lista de renglones con los dos ejes de la ley separados** —qué número se
toma, art. 4, y qué alícuota se le aplica, arts. 2 y 3—, y de paso dejó de ser
sólo civil: entraron el laboral, el concursal con su escala progresiva y los
recursos directos. **Y encima de eso, lo que la refundación desbloqueaba**: el
**monto fijo de los arts. 5 y 6** —tercera serie cargada a mano, con su archivo
y su control— y el **imprimible del art. 4 *in fine***, que no es una comodidad
sino la liquidación detallada que la ley manda acompañar al pago, con las
ampliaciones y las reconvenciones separadas como manda el art. 8. Y al final
entraron los dos que llevaban escrito «ir a mirarlo a Honorio antes de
escribir»: **las exenciones del art. 13 con su buscador** y **el permalink en el
fragmento de la URL**, que comparte el caso sin que nada viaje a ningún
servidor. **`tasa` cubre ahora toda la Ley 23.898.**
**Y quedó cerrada el mismo día**: Javier contestó las tres preguntas que le
habían quedado, y la tercera movió código. La **titularidad dejó de colgar del
supuesto sucesorio y pasó a colgar del bien** —*«la separación de bienes es lo
mismo que la petición de herencia, y cualquier otro caso de cosas comunes»*—, y
con eso una separación de bienes dejó de cobrarle el inmueble entero a cada
cónyuge.
**Van tres de las cuatro que no son de plazos; queda `ejecucion-estado`.** Ver
[`tasa` refundada](#tasa-refundada-los-dos-ejes-en-una-lista--278),
[el monto fijo y el imprimible](#el-monto-fijo-y-el-imprimible-lo-que-la-lista-desbloqueaba--278),
[las exenciones y el permalink](#las-exenciones-del-art-13-y-el-permalink-los-dos-copiados-de-honorio--278)
y [el cierre, con la titularidad cambiada de eje](#tasa-cerrada-las-tres-preguntas-contestadas-y-la-titularidad-cambió-de-eje--278).

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

**El 26/8, además, se hizo entera la extracción aritmética de las tres que
faltaban** —el frente pesado—: `caducidad`, `entre-fechas` y `regresiva` pasaron
a consumir `plazos.js`, con **6604 casos capturados de la pantalla e idénticos
después de migrar**. Con eso **ninguna de las cinco pantallas de plazos tiene
aritmética adentro**, y el banco del motor pasó de 34 a 117 comprobaciones.

**Y aparecieron dos bugs que no tocó nadie**, los dos encontrados por los
barridos que entraron con las pruebas, y **los dos se cerraron el mismo día**
con la decisión de Javier y el caso en la mano: la **caducidad ya no puede
vencer adentro de la feria de enero** —era el art. 311 desoído, y el arreglo
mueve 67 fechas de 10.956— y la **regresiva ya no cuenta hacia atrás fuera de la
ventana de cobertura** en silencio. Los dos están en
[`HISTORIA.md`](HISTORIA.md), con la aritmética y el alcance medido.

**Y el 26/8 cerró con el dibujo del plazo en las cuatro pantallas que tenían
algo que dibujar, y con tres redes nuevas.** El dibujo salió de
`vencimientos.html` a un módulo compartido —idéntico carácter por carácter
después de la extracción— y se extendió con una decisión distinta por pantalla:
`regresiva` cambió su traza día por día por la grilla, `entre-fechas` muestra qué
días entraron al conteo, y **`caducidad` no dibuja un calendario a propósito**,
porque su plazo se cuenta por tramos mensuales y pintarlo día por día mentiría
justo en el caso raro. Ver
[el dibujo en las tres](#el-dibujo-en-las-tres-que-faltaban--268).

Las tres redes, en orden de lo que cubren: el banco de las pantallas
**cruza cada una contra el motor** y pasó de 51 a 75 filas;
`npm run verificar-red` controla **qué terceros nombra el sitio** —y existe
porque el barrido de «qué sale del navegador» de esa misma mañana dio una lista
incompleta: **`prorrateo` le pedía la UMA a una planilla de Google y no se
vio**—; y `scripts/pruebas-no-plazos.html` pone **45 fijados** —33 el 26/8— sobre las cuatro
calculadoras que no tenían ninguna comprobación, que era la condición para poder
refundarlas. **Las tres se probaron rompiendo algo a propósito**, porque un
control que nunca falló no es un control.

**No queda nada urgente ni bloqueante.** Lo abierto está en
[Pendientes](#pendientes) y [Bugs abiertos](#bugs-abiertos). **Lo que sigue es
el frente grande y ya está desbloqueado y con red:** el rediseño de las tres de
plazos recién migradas y la refundación de las cuatro que no son de plazos.

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
- **`data/serie-uma.json`, `data/serie-uhom.json` y `data/tasa-monto-fijo.json`
  se cargan a mano y no hay de dónde automatizarlas.** Es el mismo caso que la
  feria: los actos de la CSJN y las tablas del Ministerio son PDFs sin API.
  Cuando sale un valor nuevo hay que agregar una línea, con su norma y la fecha
  del acto.
  **`npm run verificar-series` no puede detectar que falte el último**: detecta
  que lo cargado esté mal, no que falte algo. Lo que sí avisa es la propia
  página, que muestra desde cuándo no se revisan las series y pone un aviso a
  la vista si pasaron más de 45 días.
  **La del monto fijo del art. 6 es la más lenta de las tres y por eso la más
  fácil de olvidar**: se movió en 2018 y en 2022, y hoy tiene **un solo valor
  cargado** —$4.700, Acordada 15/2022—. **El de la Acordada 41/2018 no está a
  propósito**: la nota de Infoleg la nombra sin decir el importe, y cargar un
  número que no se leyó es exactamente lo que el archivo existe para evitar. La
  página de `tasa` dice desde cuándo rige el valor que muestra, que es lo que
  permite notar que quedó viejo.
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
  - **`tasa` es desde el 27/8 la única que arma una URL con lo que el usuario
    escribió, y no sale del navegador igual**: el permalink va en el
    **fragmento** y no en la query, y el fragmento no viaja en ningún request.
    Es la decisión que se copió de Honorio y el motivo por el que se copió. Un
    barrido futuro que busque «qué se manda afuera» la va a encontrar por el
    `location.hash` y conviene que sepa que ya se miró.
  - **~~`honorarios-mediacion` le pide el UHOM a una planilla de Google~~
    Arreglado el 26/8:** lee `data/serie-uhom.json`, del propio repositorio.
    Ver [abajo](#tres-arreglos-que-salieron-de-preguntar-qué-sale-del-navegador--268).
  - **~~`prorrateo` le pedía la UMA a la MISMA planilla, y este barrido no lo
    vio.~~ Arreglado el 26/8:** lee `data/serie-uma.json`. **La primera versión
    de esta lista decía que las únicas dos que consultaban afuera eran
    `honorarios-mediacion` y `distancia`, y eran tres.** El barrido se hizo
    leyendo las calculadoras una por una y a `prorrateo` se la leyó por lo que
    calcula, no por lo que pide: la llamada está a cuatrocientas líneas del
    cálculo, adentro de un cargador de CSV. **Lo que lo habría cazado —y es lo
    que se hizo ahora— es un `grep` de `fetch(` sobre las once, que tarda un
    segundo y no depende de qué tan atento estuvo el que leyó.**
  - **`calculadoras/honorarios.html` también le pide a la planilla**, y es la
    excepción que no hay que arreglar: se retiró el 7/8 y `pages.yml` publica en
    su URL el aviso de `redirects/honorarios-retirada/`, así que **el archivo con
    el `fetch` no llega al sitio**. Queda en el repositorio como historia.
  - **`distancia` es el caso distinto y el único que manda ALGO QUE EL USUARIO
    ESCRIBIÓ:** los nombres de localidad van a `apis.datos.gob.ar`, a
    `geocoding-api.open-meteo.com` y a `router.project-osrm.org`. No es un dato
    personal —es una ciudad— pero es entrada del usuario saliendo a tres
    terceros. **Desde el 26/8 la página lo dice arriba de todo**, y el tercero
    que faltaba nombrar quedó nombrado. **Con `prorrateo` arreglada, es otra vez
    la única del sitio que consulta afuera**, y ahora la única que lo hizo
    alguna vez con algo que el usuario tipeó: las otras dos pedían un número
    público.
- **Las once calculadoras no hablan el mismo idioma, y las que no son de plazos
  se rehacen de cero.** Pedido de Javier del 26/8: *«cada una usa un lenguaje
  distinto, avisa de años distintos, etc. hay que hacer algo más uniforme»*, y
  la decisión que lo acompaña: ***«lo que no es plazos, tenemos que refundarlas
  de cero me parece»***.
  **La distinción no es de gusto y conviene entenderla antes de tocar nada.**
  Las cinco de plazos comparten motor —`plazos.js` y `calendario-judicial.js`—
  y ahí lo que hay que uniformar es la pantalla, no lo que calcula: se
  rediseñan, no se rehacen. Las que no son de plazos —`prorrateo`, `tasa`,
  `honorarios-mediacion`, `ejecucion-estado`— **no comparten nada**: cada una
  trae su propio HTML, su propio parser, sus propios rótulos y su propia
  aritmética adentro del `<style>`. Rehacerlas de cero sale más barato que
  emparejarlas, y es la misma conclusión a la que se llegó con PDF-studio, que
  se tiró y se rehizo como Escribiente en vez de parchearse.
  Lo que hay que uniformar, en orden de lo que más se nota: el aviso de
  cobertura —cada una nombra años distintos—, el tuteo suelto («envíanos un
  mail», «si crees»), los `max-width` de 240 a 1000 px, y los rótulos.
  **El orden acordado**: `vencimientos` primero —hecha el 26/8—, después la
  extracción de las otras tres de plazos y su dibujo —**las dos cosas hechas el
  26/8 también**—, y recién ahí las que no son de plazos, que van de cero. O sea
  que **el turno es de las que no son de plazos**, salvo que primero se quiera el
  rediseño de las tres recién migradas.
  **Y de esas tres ya se hizo lo que no podía esperar al rediseño**, porque salió
  al paso del dibujo: los colores planos de `regresiva`, su `@media` escrito al
  revés, y las faltas de ortografía del texto que ve el usuario en `caducidad` y
  en `regresiva`. Lo que queda ahí es aspecto, no defecto.
  **Y las cuatro que van de cero ya tienen red**, que era la condición para
  poder tocarlas: `scripts/pruebas-no-plazos.html`, 46 fijados. Antes del 26/8
  no tenían ninguna comprobación y una reescritura no se habría podido
  distinguir de un error.
  **De las cuatro ya están hechas dos, las dos el 27/8**: `honorarios-mediacion`
  —la más chica, elegida para estrenar el patrón con el riesgo más bajo: ver
  [abajo](#honorarios-mediacion-rehecha-y-qué-explica-esta-pantalla--278)— y
  `prorrateo`, que es la primera que además **movió un número**: ver
  [abajo](#prorrateo-rehecha-y-el-tope-que-estaba-escrito-duro--278).
  **Y `tasa`, refundada el 27/8 y cerrada el mismo día**: cubre toda la Ley
  23.898 y no le quedan preguntas abiertas. **Queda `ejecucion-estado`**, la
  última de las cuatro.
- **`prorrateo` no computa el art. 730 in fine.** El último párrafo excluye del
  cómputo del 25 % los honorarios de los profesionales de la parte condenada en
  costas, y la pantalla no tiene forma de marcarlos: hoy todas las regulaciones
  entran en la base. En un pleito donde el condenado tuvo letrado propio, eso
  infla las costas computadas y puede disparar un prorrateo que no corresponde.
  Detectado el 27/8 al refundar la pantalla y **no se implementó ahí a
  propósito**: es una función nueva y no una refundación de la forma. Ver
  [abajo](#prorrateo-rehecha-y-el-tope-que-estaba-escrito-duro--278).
- **~~El campo de titularidad de `tasa` que nadie tocó daba $0,00.~~** y
  **~~el imprimible del art. 4 *in fine*.~~ Los dos hechos el 27/8**, con la
  refundación de la pantalla. El campo vacío vale 100 % y el `0` escrito a mano
  sigue dando cero, que es la respuesta correcta; el imprimible es la
  liquidación detallada que la ley manda acompañar al pago, con los grupos del
  art. 8 separados. **El de `prorrateo` es otra cosa** —ahí no hay norma que lo
  pida— y puede salir del mismo mecanismo sin esta exigencia. Sigue sin hacerse.
- **~~Enlace permanente con el caso cargado.~~ Hecho el 27/8 en `tasa`**, y lo
  que sigue vivo es extenderlo a las demás. Se resolvió como estaba anotado
  abajo: el caso va en el **fragmento**, que no viaja al servidor. Lo de abajo se
  deja porque la duda que plantea vale para cada pantalla nueva que lo copie.
- **Anotado para explorar, sin decidir: enlace permanente con el caso cargado.**
  Planteado por Javier el 27/8 —*«quizás deberían llevar hiperlink (esto solo
  anotalo para explorar por ahora)»*—. Sería poner el estado del formulario en
  el fragmento de la URL para poder pasarle a alguien el cálculo hecho. **Lo que
  hay que mirar antes que el cómo:** hoy ninguna calculadora manda nada afuera
  salvo `distancia`, y una URL con el caso adentro **se pega en un mail, en un
  chat y en un historial**. Un monto de proceso y una fecha de notificación no
  son datos personales, pero sí son datos de un expediente concreto, y la
  promesa de que nada sale del navegador se sostiene hoy porque no hay nada que
  copiar. El fragmento (`#…`) no viaja al servidor, que es el punto a favor.
  Sin decidir.
- **`regresiva` y `vencimientos` se llaman casi igual.** «Calculadora de plazos
  judiciales» contra «Vencimiento de plazos judiciales»: puestas al lado en el
  tablero no se distinguen, y la que tiene el nombre genérico es la que hace lo
  menos común de las dos. Es una decisión de nombre y no se tocó. Ver
  [abajo](#los-textos-de-las-cinco-de-plazos-unificados-contra-vencimientos--278).
- **~~Renombrar el archivo de la ley de tasas.~~ Hecho a mano por Javier el
  27/8.** Decía «Ley N° 23.889» y la ley es la **23.898**. No se tocó desde acá
  porque `raw` está fuera del alcance de escritura de los agentes por convención
  de los repos hermanos.
- **~~La captura de `prorrateo`.~~ Hecha más tarde el 27/8**, cuando el panel
  del navegador volvió a componer sin que se hiciera nada distinto: estuvo
  trabado un rato largo con el panel abierto y a la vista, devolviendo «the
  Browser pane is not displayed», y después anduvo. **Queda anotado como
  síntoma**: ese mensaje no siempre quiere decir que el panel esté cerrado.
  Mirada la pantalla, salió un defecto que ninguna medición había cazado: la
  tira de cuatro datos usaba `auto-fit`, y en los anchos donde entran **tres**
  el cuarto quedaba solo con un hueco al lado del tamaño de dos. Pasó a dos
  columnas fijas, que con cuatro datos es lo único que nunca deja huérfanos, y
  a los cuatro en fila arriba de 760 px.
  **Sigue pendiente terminar `pruebas-calculadoras`**, que quedó en 56 de 75 con
  todas pasando y las cinco pantallas representadas.
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
- **Hay siete bancos de pruebas y cubren cosas distintas.** `npm run
  verificar-calculos` (673 comprobaciones) y `npm run verificar-plazos` (132)
  cubren **el motor**: días hábiles, feria, feriados, cobertura, y la
  aritmética de las cinco de plazos. `npm run verificar-contraste` cubre **los
  tokens de color**, `npm run verificar-conectores` (46) **los dos
  transportes de `conectores/`** y `npm run verificar-red` **qué terceros
  nombran las quince páginas que se publican**, contra una lista con el motivo
  escrito al lado de cada uno. `scripts/pruebas-calculadoras.html` —**75 filas: 21
  verificados a mano, 6 invariantes, 3 fijados, los 24 cruzados contra el motor,
  y los 21 verificados otra vez adentro del tablero**— cubre **las pantallas**:
  maneja las cinco calculadoras por iframe y compara el resultado que muestran. Se abre con el sitio servido —no con `file://`— y
  tarda seis segundos. **Los iframes llevan rompe-caché**: sin él las pruebas
  corren contra la versión anterior de la calculadora, que es la peor forma de
  falla porque parece un bug del cambio que se acaba de hacer.
  **~~Falta cubrir el prorrateo, la tasa y las demás no-de-plazos~~ Hecho el
  26/8:** `scripts/pruebas-no-plazos.html`, **45 fijados** sobre `prorrateo`,
  `tasa`, `honorarios-mediacion` y `ejecucion-estado`. Va antes de refundarlas,
  que es lo que sigue. Ver
  [abajo](#la-red-de-las-que-no-son-de-plazos-que-va-antes-de-refundarlas--268).
- **Las cinco de plazos ya se corrieron de punta a punta** (17/8), con cálculo
  real y pantalla de resultado. Las otras seis no: de esas se midió contraste y
  ancho, y se miraron capturas de dos.
- **~~Tuteo suelto en el texto de las calculadoras.~~ Barrido el 26/8 en las
  cinco de plazos.** Salieron «envíanos un mail» —que además convivía con «si
  creés» en la misma oración—, «Intenta recargar», y de paso los mensajes de
  error sin tildes que arma el código: «Los datos aun no estan listos», «no esta
  disponible», «Formato de fecha invalido». Todos van en voseo y acentuados.
  **Falta lo mismo en las que no son de plazos**, y ahí conviene esperar: van de
  cero, así que arreglar su texto ahora es escribirlo dos veces.
  **Y el 27/8 se hizo el barrido completo de los textos de las cinco de plazos**,
  con `vencimientos` de referencia, a pedido de Javier: los cinco avisos de
  cobertura decían lo mismo de cinco maneras y cuatro no nombraban la feria
  faltante aunque el motor se los daba. Ver
  [abajo](#los-textos-de-las-cinco-de-plazos-unificados-contra-vencimientos--278).
  **Y una distinción que vale para el barrido que queda:** el *usted*
  —«Ingrese», «Verifique»— **no es tuteo y no es un error**; es otro registro. Lo
  que hay que sacar es el imperativo de *tú*. Cambiar los ustedes a voseo es una
  decisión de estilo y no una corrección, así que va con el rediseño.
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

**Y dos correcciones más, del mismo día, sobre la pantalla ya terminada:**

- **El botón dice «Calcular» y no «Calcular el vencimiento».** Está abajo de un
  formulario que no hace otra cosa: el resto de la frase no agregaba nada.
- **La muestra del día de nota no se veía.** La entrada de las referencias
  existía, pero el punto medía 4 px en `--muted-fg` adentro de un cuadrado
  vacío, al lado de muestras sólidas de color: la fila entera pasaba
  desapercibida. Javier la pidió creyendo que faltaba, que es la prueba de que
  no se veía. Ahora el punto va a 5 px y en `--fg`, y la muestra imita una
  celda cualquiera con la marca encima. **Una celda y no un color, a
  propósito:** el punto no es una categoría de día —un día de nota puede ser
  además contado, o ser la notificación— así que la muestra tiene que leerse
  como «un día con esta marca» y no como un estado.

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

### Tres arreglos que salieron de preguntar qué sale del navegador — 26/8

La pregunta la hizo Javier: *«no sé si en javiercuneo.com.ar prometemos que los
datos no salen del navegador o sólo en Honorio»*. **La respuesta era que no lo
prometemos** —la promesa está escrita en dos lugares y los dos son de
Escribiente, que es la única que la sostiene con la CSP—, así que no había
promesa incumplida. Pero leer las once para contestar dejó cosas para arreglar,
y se arreglaron todas.

> **Corregido el mismo 26/8, y conviene leer por qué.** Esta sección decía «dos
> arreglos» y eran tres: **`prorrateo` le pedía la UMA a la misma planilla de
> Google y el barrido no lo vio.** Se leyeron las once calculadoras una por una,
> y a `prorrateo` se la leyó por lo que calcula: la llamada está a cuatrocientas
> líneas del cálculo, adentro de un cargador de CSV con su propio parser. Un
> `grep` de `fetch(` sobre las once —que es lo que se hizo después— la encuentra
> en un segundo. **La lección no es «leer con más atención»: es que para una
> pregunta mecánica hay un control mecánico**, y usar el ojo donde va el `grep`
> es cómo se escribe una lista incompleta con toda confianza.

**`honorarios-mediacion` ya no le pide el UHOM a Google.** Lo lee de
`data/serie-uhom.json`. Dos problemas de distinto tamaño:

- **El chico, pero el que se ve:** abrir la calculadora le contaba a un tercero
  que alguien la abrió. Ningún dato del usuario salía —lo que se pedía era un
  valor— pero la IP y el momento sí.
- **El grande:** la planilla es una tabla suelta que se edita a mano y **nada la
  controla**. `data/serie-uhom.json` tiene los 67 valores leídos uno por uno de
  las 39 tablas oficiales, y `npm run verificar-series` le exige en cada commit
  que ninguna vigencia se repita, que la serie no baje y que cada valor tenga su
  tabla al lado. Es la misma serie que publica `uma-uhom.html`.

**Y elige el último valor cuya vigencia ya empezó, no el último del archivo.**
La diferencia aparece el día que se carga un valor por adelantado: el último del
archivo sería uno que todavía no rige, y esta calculadora fija honorarios de
hoy. **La pantalla dice desde cuándo rige** —«Rige desde agosto de 2026»— que es
lo que le permite a quien lo usa notar que la serie quedó corta. Y si el archivo
no se puede leer, no se inventa un valor ni se deja el anterior: se pide
cargarlo a mano.

**`prorrateo` ya no le pide la UMA a Google.** Lee `data/serie-uma.json`, con
la serie entera leída de los actos de la CSJN uno por uno. Es el mismo cambio y
por los mismos dos motivos. Y acá el efecto se nota además en la pantalla:
**la página ahora dice desde cuándo rige el valor y con qué resolución**
—«Rige desde el 01/07/2026 (Res. SGA 1930/2026)»—, donde antes el campo salía
con un número sin procedencia, o vacío.

Salió también el parser de CSV que leía la planilla, con su manejo de comillas
—estaba escrito dos veces, una en cada calculadora—. Era buen código y no hace
falta más: la fila que buscaba ya no existe.

**`distancia` ahora dice qué sale.** Con las otras dos arregladas es otra vez la
única del sitio que consulta afuera, y la única que siempre mandó algo escrito
por el usuario —las otras dos pedían un número público—: los nombres de localidad van a GEOREF,
a Open-Meteo Geocoding y a OSRM. Dos de los tres estaban nombrados abajo, en
«Método de Cálculo»; **OSRM no estaba en ninguna parte**. Ahora hay un aviso
arriba de todo que dice las tres cosas que importan: qué sale (el lugar), qué no
sale (fechas, plazos, nada del expediente), y que es la única del sitio que
consulta afuera.
**Neutro y no en `--warn`:** es información, no un peligro. Un aviso ámbar sobre
una herramienta que funciona bien enseña a ignorar los avisos ámbar.

**Y de paso se vio el efecto de la paleta bajada:** el bloque de advertencia
legal de esa página es `--warn` sobre `--warn-tint`, que hasta hoy daba **4,19**
en tema claro. Ahora da **5,52**, y es el peor de la página.

---

## Por dónde seguir

Lo de este frente, en orden y con lo que hace falta saber para arrancar en frío.

1. **~~Extraer la aritmética de `caducidad`, `entre-fechas` y `regresiva`.~~
   ~~Y el dibujo del plazo en las tres.~~ Las dos cosas hechas el 26/8**: la
   extracción, con la matriz de cada una idéntica, y el dibujo, con una decisión
   distinta por pantalla. Ver [abajo](#el-dibujo-en-las-tres-que-faltaban--268).
   **Las cinco pantallas de plazos consumen el motor y las cuatro que tenían algo
   que dibujar dibujan.**
2. **~~El cruce pantalla contra motor en `scripts/pruebas-calculadoras.html`.~~
   Hecho el 26/8**: ver [abajo](#pantalla-contra-motor-y-la-prueba-de-que-el-control-controla--268).
   **El banco pasó de 51 filas a 75.**
3. **El resto de las calculadoras, con `vencimientos` de patrón.** Acordado con
   Javier el 26/8: *«en algún momento hay que encarar la modificación y
   adaptación de todas las calculadoras… terminemos vencimientos y luego pasamos
   al resto»*. `vencimientos` quedó terminada ese mismo día, así que **esto ya
   está desbloqueado y es el frente grande que sigue.**
   **Van tres de las cuatro que iban de cero**, las tres el 27/8:
   [`honorarios-mediacion`](#honorarios-mediacion-rehecha-y-qué-explica-esta-pantalla--278),
   [`prorrateo`](#prorrateo-rehecha-y-el-tope-que-estaba-escrito-duro--278) y
   [`tasa`](#tasa-refundada-los-dos-ejes-en-una-lista--278).
   **Sigue `ejecucion-estado`**, que es además la más grande (917 líneas).
   No es sólo el aspecto. Lo que hay que uniformar, en orden de lo que más se
   nota: el aviso de cobertura —cada una nombra años distintos—, el tuteo suelto
   («envíanos un mail», «si crees»), los `max-width` de 240 a 1000 px, y los
   rótulos. Los criterios que ordenaron `vencimientos` están en su `<style>` y
   se pueden repetir: cada control ocupa lo que mide su contenido, lo único
   grande es el resultado, los modificadores del cómputo van juntos y detrás de
   una casilla, y nada se separa con una línea si alcanza con el espacio.
4. **~~Sacarle a `honorarios-mediacion` la dependencia de Google Docs.~~ Hecho
   el 26/8**, el mismo día en que este punto se escribió: la página lee
   `data/serie-uhom.json`, del propio repositorio. Este punto quedó acá
   contradiciendo a la lista de pendientes de arriba, que ya lo daba por
   arreglado. Comprobado leyendo el `fetch` del archivo antes de tacharlo.

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

**Lo que faltaba de este frente ya no falta:** el dibujo se extendió a las otras
tres el mismo 26/8, y el de `vencimientos` salió a un módulo compartido sin mover
un carácter de lo que produce. Ver [el dibujo en las tres que
faltaban](#el-dibujo-en-las-tres-que-faltaban--268). Los otros dos que estaban
acá —el tablero rediseñado y sacar `honorarios`, `tasa` y `prorrateo` de la
barra— se hicieron el mismo día: ver [el
rediseño](#el-tablero-rediseñado-y-las-dos-regiones--268).

---

### `honorarios-mediacion` rehecha, y qué explica esta pantalla — 27/8

**Es la primera de las cuatro que van de cero, y se empezó por acá a propósito:
es la más chica de las cuatro.** El patrón que salga sirve para las otras tres, y
el riesgo de estrenarlo es el más bajo posible.

**Qué estaba mal, y era de forma y no de cuenta.** Dos campos del mismo peso que
el resultado; el resultado adentro de un recuadro punteado, que lo hacía parecer
provisorio; y la regla aplicada escrita en una línea de prosa al pie. **La
escala, que es lo único que explica el número, no se veía por ningún lado.**

#### Qué explica esta pantalla, que no es lo mismo que explican las otras

En `vencimientos` el dibujo es un calendario y en `caducidad` una línea de hitos.
Acá la pregunta es otra: no *cómo se llegó a la fecha* sino **por qué ese importe
y no otro**, y la respuesta entera es la escala. Así que el equivalente del
dibujo es **la escala misma, con el tramo aplicado marcado y los otros seis al
lado**, cada uno con su importe en pesos al UHOM cargado.

**Y no es decoración, porque esta escala se lee mal con la intuición que uno
trae del art. 21 de la 27.423: no es progresiva.** Un asunto de 200 UHOM no paga
«lo del tramo anterior más el excedente»: paga 12 UHOM y punto. Viendo los siete
tramos juntos eso se entiende solo; con el importe suelto no hay forma de
saberlo. Va escrito además en una línea, una sola vez, abajo de la tabla.

Se agregó también **el monto del asunto expresado en UHOM**, que es el número que
decide el tramo y que hasta ahora era invisible: el usuario cargaba pesos y la
pantalla contestaba pesos, sin mostrar nunca la magnitud con la que la norma
razona.

#### La escala pasó de cadena de `if/else` a tabla, y por qué eso no es un refactor de gusto

La pantalla ahora **muestra los siete tramos**, y con la cadena de `if/else` habría
que escribirlos una segunda vez para dibujarlos. **Dos copias de una escala legal
en el mismo archivo es exactamente lo que no puede pasar**, así que la tabla es
la fuente única y el cómputo la recorre.

**No es una simplificación y el orden se conservó:** se recorre de arriba abajo
con la misma comparación `monto <= hasta * uhom` y en el mismo orden que tenían
las ramas, así que los bordes caen donde caían —30 UHOM exactos es el ítem A y no
el B—. El ítem G sigue siendo su propio caso, con `uhom: null`, que es la misma
forma que tiene `ESCALA_MEDIACION` en Honorio.

**Verificado con 32.352 pares (UHOM, monto)** cruzados entre la cadena vieja y la
tabla nueva —los bordes exactos de cada tramo con un centavo y un peso a cada
lado, más un barrido denso de medio UHOM en medio UHOM sobre ocho valores de
UHOM—: **idénticos el honorario, la letra del ítem y si se aplicó el tope**. La
implementación nueva no se copió al script de cruce: se lee del propio HTML, para
no estar comparando una copia contra sí misma.

#### El banco marcó cinco casos, y eso estuvo bien

`pruebas-no-plazos` puso en rojo los cinco de mediación. **Los cinco importes son
idénticos carácter por carácter**; lo único que cambió es la prosa de la regla,
que se reescribió a propósito. Se volvieron a fijar comprobando que el importe y
el valor en UHOM fueran los mismos que estaban.

**Es la primera vez que el banco sirvió para lo que se construyó**, un día
después de construirlo, y salió bien la parte difícil: no dijo «pasa» ni dijo
«falla», dijo **qué** cambió, y leyendo el detalle se ve en un segundo que ningún
número se movió.

El driver hubo que tocarlo en dos puntos, que es lo previsto cuando una pantalla
se refunda: el predicado de «página lista» —el texto del estado cambió— y la
lectura del resultado, que miraba el atributo `hidden` de un bloque que ya no
existe.

#### Y una trampa más del panel oculto

Probando la pantalla embebida en el tablero, el iframe medía 584 px con 1033 de
contenido: parecía que la refundación había roto el ajuste de alto. **No: con el
panel oculto el `ResizeObserver` tampoco dispara**, igual que
`requestAnimationFrame` y las transiciones. Se comprobó midiendo `vencimientos`
embebida en la misma corrida —642 contra 1092, el mismo desfase— y ésa no se
tocó. Está anotado en las trampas.

---

### `tasa`: el diagnóstico antes de refundarla, y un cero en silencio — 27/8

**Pedido de Javier el 27/8:** *«la de tasa quiero que antes pensemos un poco en
cómo se muestran los resultados, quiero que sea un aplicativo más cómodo y
especialmente cuando querés sumar varios cálculos de tasa se muestra muy
incómodo (ejemplo sucesión pedís inscripción de bien y automóvil)»*.

**No se escribió una línea de la pantalla nueva.** Esto es el relevamiento, para
decidir con el mapa a la vista.

#### El campo de titularidad devuelve cero sin que nadie haya escrito nada

En la pantalla de sucesiones cada bien lleva un campo de **titularidad** —qué
parte del bien era del causante— y la cuenta es
`valuación × titularidad × alícuota × (1 + sobretasa)`.

Probado en la pantalla servida, con un inmueble de CABA valuado en
$100.000.000:

| Qué hay en el campo | Tasa que muestra |
|---|---|
| **nada, como arranca la pantalla** | **$ 0,00** |
| `0` | $ 0,00 |
| `50`, `50%` o `1/2` | $ 787.500,00 |
| `100` | $ 1.575.000,00 |

**La primera fila es el problema y la segunda no.** Lo marcó Javier el 27/8 y
tiene razón: *«si dejas 0 de titularidad entonces el causante no es titular y
entonces no deberías tributar nada de tasa en ese caso»*. Escribir `0` y que dé
cero es correcto, y con más razón porque si ya se pagó se puede pedir la
devolución.

**Lo que está mal es que un campo que nadie tocó se lea igual que un cero
escrito.** Cargás la valuación, mirás el subtotal, dice $0,00, y vos no
declaraste nada todavía. La decisión ya tomada —que el campo vacío valga
100 %— arregla eso y **deja el caso de Javier intacto**: vacío da $1.575.000 y
`0` escrito sigue dando cero.

Ninguno de los tres casos de prueba de `tasa` lo cubre, porque los tres son de
la otra pantalla.

#### Por qué se siente incómoda: la pantalla modela mal el problema

Hoy hay **dos niveles de anidamiento**. Un desplegable de «objeto del juicio»
arriba; si la respuesta es «sucesión», cada tipo de bien abre una **sección
propia** con su segundo desplegable, su tabla y su `+`, y hay un tercer botón
para agregar otra sección. El ejemplo de Javier —un inmueble y un automóvil—
son hoy **dos secciones con dos desplegables**, y son dos renglones.

Lo que hay abajo de todo eso son **siete reglas**, y nada más:

| Regla | Base | Alícuota | Titularidad | Sobretasa |
|---|---|---|---|---|
| Sumas de dinero, art. 4 inc. a | reclamado con intereses | 3 % | — | — |
| Desalojo, art. 4 inc. b | valor del alquiler | 3 % **× 6 cánones** | — | — |
| Inmuebles, art. 4 inc. c | valuación fiscal o mayor valor | 3 % | — | — |
| Otros (incs. d, f, h) | según el inciso | 3 % | — | — |
| Sucesión · sumas de dinero | importe | 1,5 % (art. 3 inc. c) | — | — |
| Sucesión · inmueble CABA | valuación fiscal | 1,5 % (art. 3 inc. c) | sí | sí, 5 % |
| Sucesión · inmueble otras jurisdicciones | valuación fiscal | 0,75 % (art. 4 inc. g, 2ª parte) | sí | sí, 5 % |
| Sucesión · automóvil, sociedad, otros | valuación o certificación | 1,5 % (art. 3 inc. c) | sí | — |

Siete reglas y tres modificadores por renglón —el multiplicador del desalojo, la
titularidad y la sobretasa—. **Eso es una lista, no un árbol.**

#### La propuesta: una sola lista, como `prorrateo`

Un renglón por concepto: **descripción · regla · base · [titularidad] ·
[sobretasa] → tasa**, y el total grande arriba, que es lo que se vino a buscar.
La regla es un desplegable **por renglón**, con el inciso escrito al lado; los
dos campos que sólo tienen sentido en algunas reglas aparecen sólo ahí.

El caso de Javier queda en dos renglones de la misma tabla, con reglas distintas
y un total. Sin secciones, sin el segundo desplegable, sin los tres botones de
agregar.

Es la misma forma que ya funciona en `prorrateo` —tabla de filas con
modificadores por fila, veredicto grande— y **eso también contesta qué explica
esta pantalla**: no *por qué ese tramo* ni *por qué no se cobra lo regulado*,
sino **de dónde sale cada peso del total**. Con el inciso y la alícuota en cada
renglón, la tabla es la explicación, y es además exactamente la planilla que se
acompaña al expediente: encaja con el imprimible que Javier pidió el mismo día.

#### Decidido por Javier el 27/8

**La forma va: una sola lista.** Y con una corrección suya que mejora la
propuesta: *«la gracia de declarar el objeto del juicio antes es que te da una
suerte de hint del valor que tenés que ingresar»* —como hace Honorio en parte—,
con el ejemplo *«al elegir desalojo ya te dice que pongas un solo alquiler
porque el sistema está calculando los 6 meses que son la base»*.

**Eso no pelea con la lista: la mejora.** El hint es la función real del
desplegable global, y en la lista vive mejor, porque aparece **en el renglón que
se está cargando** y no arriba de toda la pantalla. Cada regla del desplegable
trae su hint pegado al campo de base. Y el ejemplo sale textual del inciso: el
art. 4 inc. b dice «el valor actualizado de seis (6) meses de alquiler», así que
la base legal son seis meses y la pantalla pide uno.

**La sobretasa se deja como está y no se escribe nada.** Javier: *«es más
costumbre judicial que norma pura (difícil de encontrar fallo al respecto) pero
nadie lo va a cuestionar y es opcional»*. O sea que **la ausencia de norma citada
es deliberada y no un olvido**, y por eso queda anotada acá: la próxima lectura
va a encontrar un 5 % sin artículo al lado y ésta es la explicación.

**La titularidad va con 100 % por omisión.** Con una aclaración que importa,
porque en el intercambio quedó al revés: **hoy vacío calcula CERO**, no 100 %.
No es que esté bien y haya que confirmarlo; es un arreglo.

**El permalink se toma de Honorio**, donde ya está resuelto sin que salga nada
del navegador. Deja de ser una pregunta abierta de diseño y pasa a ser copiar un
mecanismo que existe: hay que ir a leerlo a
[`javiercuneo/honorio`](https://github.com/javiercuneo/honorio) antes de inventar
nada.

#### Cuánto de la ley cubre hoy, que es la respuesta a «que no sea sólo civil»

Pedido de Javier el 27/8: *«en algún momento habría que hacer algo más piola y
cubrir toda la ley de tasa… para que sea una calculadora completa referencia
para todo y no solo civil»*. La ley está en
`C:/IA/knowledge/raw/normativa`, **con el número mal en el nombre del
archivo** —dice «Ley N° 23.889» y la de tasas judiciales es la **23.898**; el
contenido es el correcto—.

Leída entera, esto es lo que la pantalla **no** cubre:

- **Art. 3, la reducción del 50 %, casi entero.** Hoy sólo se usa el inc. c
  (sucesorios). Quedan el **b** (mensura y deslinde), el **d** (protocolización
  e inscripción de testamentos extendidos fuera de jurisdicción nacional), el
  **f** (reinscripción de hipotecas y prendas) y el **g** (recursos directos
  contra resoluciones del PEN, provincial o municipal).
- **Art. 4 inc. e — quiebras y concursos.** En la quiebra, el importe de la
  liquidación de bienes; en el concurso preventivo, los créditos verificados. Y
  la **Ley 25.972** pone alícuotas propias para los acuerdos homologados:
  **0,75 % y 0,25 %**, que no son la del art. 2 ni la reducida.
- **Art. 4 inc. i — laboral.** El monto de la condena según la primera
  liquidación firme; y el desalojo laboral, que también es de seis meses pero
  **del último salario**. **Este es el inciso que hace que hoy sea «sólo
  civil».**
- **Art. 4 inc. j** — el monto de la resolución que se apela, y si no tiene
  monto, indeterminable.
- **Art. 5 — monto indeterminable** y **art. 6 — juicios sin valor pecuniario**.
  El art. 6 no es una alícuota: es **una suma fija que actualiza la CSJN**.
  **Hoy son $4.700, fijados por la Acordada CSJN 15/2022, de mayo de 2022** —dato
  de Javier el 27/8—.

  **Y no hay que inventar nada para manejarlo, porque el problema ya se resolvió
  dos veces en este mismo repositorio.** Javier lo planteó así: *«no sé cómo
  podríamos manejar el input para cambiarlo manualmente de forma sencilla sin
  tocar código y sin hardcodearlo»*. La respuesta son las dos mitades que ya
  usan `honorarios-mediacion` con el UHOM y `prorrateo` con la UMA:

  1. **El valor vive en un archivo de datos, no en el código**: un
     `data/tasa-monto-fijo.json` con la misma forma que `data/serie-uma.json`
     —un valor, desde cuándo rige, y qué norma lo fijó—. Cambiarlo es editar
     tres líneas de texto, y queda versionado con la norma al lado.
  2. **La pantalla lo muestra en un campo que se puede pisar a mano**, para
     liquidar con el valor de otra fecha sin tocar el archivo.

  Que se actualice cada varios años lo hace **más fácil** que la UMA, no más
  difícil: es el mismo mecanismo con menos ediciones. Y hereda gratis el aviso
  que ya tienen las otras dos —dice desde cuándo rige el valor, que es lo que
  permite notar que quedó viejo—.

**Dos de esos no son «un inciso más»**: el art. 6 trae una serie nueva, y la
25.972 trae alícuotas que la pantalla hoy no sabe representar.

#### Sobre la entrevista previa, que Javier dejó abierta

Planteado por él: *«quizás hay que hacer una entrevista previa para llegar al
número final, no lo sé»*. **Mi recomendación es que no**, y el motivo es de uso y
no de gusto: una entrevista es buena la primera vez y estorba a partir de la
segunda, y la tasa se calcula seguido. Honorio puede permitírsela porque una
regulación es un acto ocasional. El hint en el renglón da lo mismo que la
entrevista —decirte qué número va— sin cobrar el peaje cada vez.
**Sin decidir.**

#### Los dos ejes de la ley, y el error que costó no verlos — 27/8

**Javier volteó el interruptor de sucesorio**, y con un argumento que resultó ser
la clave del diseño entero: *«no sé para qué hay que separar sucesión de todo el
resto, parece darle más jerarquía, y si elegís, no sé, quiebra, no hace el mismo
cálculo que sumas de dinero. No sé cuál es el beneficio de dividir en dos algo
que tiene más divisiones»*.

Tiene razón, y leyendo el art. 3 entero se ve por qué. **La reducción del 50 % no
es de los sucesorios: es de seis supuestos**, y el sucesorio es uno.

| Art. 3 | Supuesto |
|---|---|
| inc. b | Juicios de mensura y deslinde |
| inc. c | Juicios sucesorios |
| inc. d | Testamentos, declaratoria de herederos e hijuelas extendidos fuera de jurisdicción nacional |
| inc. f | Reinscripción de hipotecas o prendas |
| inc. g | Recursos directos contra resoluciones del PEN, provincial o municipal |
| inc. h | Tercerías |

(Los incs. a y e están derogados.) Partir la pantalla en «sucesión» y «el resto»
le da a un inciso una jerarquía que la ley no le da.

##### Y no verlo ya costó plata

La pantalla actual junta tres supuestos abajo del rótulo «Otros» y les aplica
3 % a los tres. Probado el 27/8 con $10.000.000:

| Supuesto | Lo que cobra hoy | Lo que manda la ley |
|---|---|---|
| Bienes muebles, art. 4 inc. d | 3 % → $300.000 | 3 % — correcto |
| Reinscripción de hipotecas, art. 4 inc. **f** | 3 % → $300.000 | **art. 3 inc. f: reducida — $150.000** |
| Tercerías, art. 4 inc. **h** | 3 % → $300.000 | **art. 3 inc. h: reducida — $150.000** |

**Cobra el doble en dos de los tres.** Y la ironía es exacta: los agrupó
*porque compartían la alícuota del 3 %*, que es lo que le impidió ver que dos de
los tres no la comparten. **Agrupó por el eje equivocado.**

##### La ley tiene dos ejes y hay que cruzarlos a mano

- **El art. 4 dice QUÉ NÚMERO SE TOMA**: el monto reclamado, seis meses de
  alquiler, la valuación fiscal, los créditos verificados, la condena laboral.
- **Los arts. 2 y 3 dicen QUÉ ALÍCUOTA SE LE APLICA**: 3 % general, o la mitad
  en los seis supuestos de arriba, o las especiales.

**Y las letras de los incisos no se corresponden entre los dos artículos**, así
que el cruce hay que hacerlo a mano y es donde se pierden cosas. La reinscripción
de hipotecas es el inc. f en los dos, y las tercerías el inc. h en los dos; pero
los sucesorios son el **art. 3 inc. c** y el **art. 4 inc. g**. Coincide a veces
y a veces no: no hay regla que ahorre leer.

##### La propuesta que sale de ahí: dos desplegables por renglón

En vez de un desplegable con la combinación ya hecha —que es lo que produce
«Inmuebles CABA en sucesión» y la explosión de casos—, cada renglón pregunta las
dos cosas por separado:

1. **Qué se toma** (art. 4): sumas de dinero · seis meses de alquiler ·
   valuación fiscal de inmueble · bienes muebles · créditos verificados ·
   condena laboral · suma garantizada · valor del crédito o del bien…
2. **Qué alícuota** (arts. 2 y 3, más las especiales): 3 % general · reducida
   50 % con el motivo elegido de la lista de seis · 0,75 % de extraña
   jurisdicción · las concursales.

**Diez opciones más ocho, en vez de ochenta combinaciones.** El segundo
desplegable arranca en «3 %, general — art. 2», que es el caso más común, así
que en el juicio corriente no se toca. Y **filtra según el primero**, porque hay
cruces imposibles: la reducción por extraña jurisdicción sólo existe en el
sucesorio, y las concursales sólo con créditos verificados.

**La sucesión deja de ser especial y pasa a ser una opción del segundo
desplegable**, al lado de mensura, testamentos, reinscripción de hipotecas,
recursos contra el PEN y tercerías. Que es lo que es en la ley.

**Y la repetición se resuelve sin partir nada:** un renglón nuevo hereda la
alícuota del anterior. En una sucesión con seis bienes se elige «reducida,
sucesorio» una vez y los otros cinco renglones ya vienen con eso.

##### Dos casos que no entran en los dos ejes, y hay que preverlos

- **El monto fijo de los arts. 5 y 6** no tiene base ni alícuota: es un importe.
  Ese renglón oculta el campo del monto y muestra el valor vigente.
- **La tasa concursal del art. 3 es una escala de dos tramos y SÍ es
  progresiva**, a diferencia de la de mediación: 0,75 % de los créditos
  verificados comprendidos en el acuerdo preventivo, y **0,25 % sobre el
  excedente** de $100.000.000. Un renglón con una alícuota sola no la
  representa. Conviene además mirar si ese piso de $100.000.000, escrito en
  2002, sigue vigente sin actualización.

#### El contraste que no dejaba leer, arreglado — 27/8

Reportado por Javier: *«en este momento la app genera un contraste que no
permite leer los campos»*. **Medido antes de tocar nada, en tema oscuro:**

| | Antes | Después | Mínimo AA |
|---|---|---|---|
| Encabezado de tabla | **1,03** | 16,17 | 4,5 |
| Cuadro de aviso | **1,04** | 12,43 | 4,5 |

**1,03 no es «poco legible»: es invisible.** Y el mecanismo vale escribirlo
porque se repite: el fondo estaba escrito a mano —`#f2f2f2` en los encabezados,
`#e9f7ef` en los avisos— y **el texto sí salía de un token del sistema**. En tema
claro los dos son claros y funciona de casualidad; al pasar a oscuro el texto se
vuelve casi blanco y el fondo se queda casi blanco. **Un color fijo no rompe
solo: rompe cuando está al lado de uno que sí sigue el tema.**

Salieron los diez colores fijos que tenía la pantalla, mapeados a los tokens:
`#f2f2f2` → `--sunk`, `#e9f7ef` → `--accent-tint`, `#598392` → `--accent`,
`#ccc` → `--border`, `#eee` → `--hair`, `#fafafa` → `--sunk`. **Y los campos de
carga no declaraban ni fondo ni color propios**: los venía pintando el navegador
por su cuenta, que acertaba de casualidad. Ahora salen de `--card` y `--fg`.

**Es un arreglo y no la refundación.** Verificado: los 20 casos de
`pruebas-no-plazos` pasan, incluidos los tres de `tasa`. Ninguna cuenta se movió.

#### La lectura de la ley de Javier, y tres artículos que faltaban — 27/8

Javier hizo su propia lectura, independiente. **Coincide con la de acá en los
dos ejes y en los seis supuestos de reducción**, y agrega cuatro cosas:

- **El art. 3 inc. d es sucesión internacional.** Los «juicios voluntarios sobre
  protocolización e inscripción de testamentos… extendidos fuera de jurisdicción
  nacional» no son una categoría suelta: *«para inscribir esos actos tenés que
  abrir la sucesión, no hay otra forma»*. Ese dato no está en el texto de la ley
  y decide cómo se rotula la opción.
- **El excedente concursal se toma textual.** Los $100.000.000 del art. 3 vienen
  de 2002 y quedaron congelados. Decisión de Javier: *«yo lo tomaría textual (no
  voy a buscar jurisprudencia de la Cámara Comercial ahora)»*. **La herramienta
  aplica la ley como está escrita y no interpreta la erosión del monto.**
- **La propiedad industrial no la declara la ley.** El art. 4 inc. d remite a lo
  que «la Dirección Nacional de la Propiedad Industrial perciba para la
  solicitud de registros», o sea a un arancel externo. No hay número que
  calcular desde acá.
- **El desalojo laboral no es un supuesto nuevo**: es el mismo «seis meses» del
  desalojo común, cambiando alquiler por salario. Una opción de la lista de
  bases, no una rama.

##### Art. 8: las ampliaciones y las reconvenciones son juicios aparte

*«Las ampliaciones de demanda y las reconvenciones estarán sujetas a la tasa,
como si fueran juicios independientes del principal.»* Javier: *«hace que en la
app debas poder combinar distintas pretensiones»*.

**Y la lista de renglones ya sirve para eso**, con una precisión que conviene no
perder: como se liquidan **por separado**, el renglón tiene que poder marcarse
como ampliación o reconvención. Sumarlas para saber el total es útil, pero el
imprimible tiene que mostrarlas distinguidas o dice algo que la ley no dice.

##### Art. 9: la calculadora dice cuánto y no dice cuándo

Ocho incisos de formas y oportunidades de pago, y **la pantalla puede decirlo
sola en cuanto se eligió el supuesto**, que es lo que propuso Javier. No es un
adorno: el momento cambia por completo según el caso.

| Supuesto | Cuándo se paga |
|---|---|
| Art. 4 incs. a, b, c, d y h | Todo al iniciar las actuaciones, con reajuste posterior si la liquidación definitiva da más |
| Quiebras y liquidaciones administrativas | Antes de cualquier pago o distribución de fondos de la venta |
| Concursos preventivos | Al notificarse la homologación del acuerdo, o la resolución que verifica créditos después |
| Reinscripción de hipotecas y prendas | Todo al iniciar |
| Sucesorios y testamentos de extraña jurisdicción | **Al inscribir la declaratoria de herederos o el testamento aprobado** |
| Separación de bienes | Al promover la liquidación de la sociedad conyugal, y **cada cónyuge puede pagar su cuota parte** |
| Petición de herencia | Al determinarse el valor de la parte del peticionario |
| Laboral | **Una vez firme la sentencia de condena y la primera liquidación** |
| Recurso directo (art. 3 inc. g) | Dentro del quinto día de recibidos los autos, previa intimación por cédula |

**Y el art. 9 trae dos supuestos que el art. 4 no tiene**: la separación de
bienes (inc. e) y la petición de herencia (inc. f). No aparecen en el mapa de
bases, y **la petición de herencia la resolvió Javier el 27/8**: la base es lo
que le toca al peticionario. *«Si para el heredero le corresponde, de los 3
bienes que hay, 1, ese es el valor.»* O sea que no hace falta una base nueva:
son los mismos bienes del art. 4, limitados a la porción del peticionario, que
es exactamente lo que ya hace el campo de titularidad. **Queda abierta sólo la
separación de bienes**, donde además cada cónyuge puede pagar su cuota parte.

##### Art. 13: las exenciones, con la forma que ya existe en Honorio

Diez incisos. Javier: *«así como en Honorio están los mínimos y el buscador de
mínimos por término literal, las exenciones: un resumen de ese artículo y
búsqueda textual»*. Beneficio de litigar sin gastos, habeas corpus y amparo no
denegados, derechos políticos, sede penal sin acción civil, trabajadores y
sindicatos, jubilaciones y pensiones, rectificación de partidas, quien alega no
ser parte, familia sin carácter patrimonial —alimentos y litisexpensas
incluidos—, y ejecuciones fiscales.

**El patrón ya está construido del otro lado**, así que acá hay que ir a mirarlo
antes de escribir, igual que con el permalink.

##### Y el hint del art. 5 que pidió Javier

Cuando el renglón sea de monto indeterminable, la pantalla tiene que decir que
**eso es a cuenta** y que la tasa se completa al terminar el proceso, dentro de
los cinco días de la sentencia o del modo anormal de terminación. Hoy no lo dice
nadie.

#### Las diez pruebas de la pantalla de sucesiones — 27/8

**Era la condición para tocar la pantalla, y ya está.** El banco pasó de 20 a 30
casos. Hasta hoy los tres de `tasa` eran todos de la otra pantalla, así que la
parte con más cuentas —tres alícuotas, la titularidad y la sobretasa— no la
miraba nadie.

Las cuentas están verificadas a mano una por una contra
`valuación × titularidad × alícuota × (1 + sobretasa)`:

| Caso | Da | Por qué está |
|---|---|---|
| Inmueble CABA, 100 %, con la sobretasa | $1.575.000 | Es lo que sale sin tocar nada: la sobretasa viene marcada de fábrica |
| El mismo con la sobretasa destildada | $1.500.000 | Los dos juntos aíslan el único número que no sale de la ley |
| **Campo de titularidad sin tocar** | **$0,00** | **Congela un error a propósito** |
| Titularidad `0` escrita | $0,00 | Acá cero está bien, y el par con el anterior marca la diferencia que hoy no existe |
| Titularidad `1/2` | $787.500 | Se escribe así en una hijuela |
| Titularidad `50%` | $787.500 | Las tres formas de escribir la mitad tienen que dar lo mismo |
| Inmueble fuera de jurisdicción nacional | $750.000 | La alícuota más fácil de romper: 3 % a la mitad, y a la mitad otra vez |
| Un automóvil | $300.000 | **Mira las columnas**: lleva titularidad y NO sobretasa |
| Sumas de dinero en la sucesión | $150.000 | El único de los cuatro sin titularidad ni sobretasa |
| **Inmueble + automóvil** | $1.875.000 | El caso que disparó todo esto |

##### Por qué el caso del cero se fija con el número equivocado

Porque fijar el número correcto dejaría el banco **rojo desde el día uno**, y un
banco que arranca en rojo deja de servir para lo único que sirve: avisar cuando
se rompe algo nuevo. Así que se anota el valor de hoy con el porqué al lado, y
el caso dice **qué esperado hay que poner cuando se arregle**: `total 1575000.00`.

El caso de al lado —titularidad `0` escrita— existe para el día del arreglo:
tiene que **seguir dando cero**. Es lo que va a probar que tratar el vacío como
100 % no se llevó puesto el cero legítimo, que es el que Javier defendió.

##### Dos casos miran las columnas y no sólo los números

Que a los muebles les falte la columna de sobretasa **no se ve en ningún
número**: si un refactor se la agrega, el total no cambia hasta que alguien la
marque, y para entonces ya está cobrando de más. Al revés en sumas de dinero: si
apareciera una titularidad, el campo vacío la pondría en cero y el resultado se
caería a $0,00. Por eso esos dos casos fijan también los encabezados.

##### El driver tuvo una trampa que conviene no volver a pisar

El iframe se reusa entre casos y queda armado con el anterior. Hay que **pasar
por la opción vacía del desplegable** antes de volver a elegir «Sucesión», que
es lo que vacía el contenedor. Sin ese paso, el segundo caso hereda las
secciones del primero y el total sale sumado: un síntoma que no se parece en
nada a la causa. Es el mismo tipo de trampa que ya había aparecido en el driver
de `ejecucion-estado`.

#### Los dos bugs de `tasa`, cerrados — 27/8

Los dos estuvieron abiertos unas horas: se encontraron preparando la
refundación, se cubrieron con casos de prueba y se arreglaron el mismo día. **El
banco pasó de 30 a 33 y las 33 pasan.** (Con la refundación de esa misma tarde quedó en 45.)

##### El cobro doble: «Otros» se partió en tres

La opción «Otros» juntaba tres supuestos y les aplicaba 3 % a los tres. Ahora son
tres opciones del desplegable, cada una con su base y su alícuota:

| Opción nueva | Base | Alícuota |
|---|---|---|
| Bienes muebles y otros derechos | art. 4 inc. d | **3 %** — la general |
| Reinscripción de hipotecas o prendas | art. 4 inc. f, la suma garantizada | **1,5 %** — art. 3 inc. f |
| Tercerías de dominio o de mejor derecho | art. 4 inc. h, el valor del crédito o del bien | **1,5 %** — art. 3 inc. h |

Una tercería de $10.000.000 pasó de $300.000 a $150.000. Hay un caso fijado por
cada una de las tres, y el de muebles está **para que el arreglo no baje de
más**.

**Y esto ya es un pedazo de la estructura nueva.** Separar por alícuota es
exactamente lo que van a hacer los dos desplegables; acá se hizo a mano para tres
supuestos porque estaban cobrando mal hoy.

##### La titularidad: vacío vale 100 %

`parseTitularidad()` es la función nueva, y la distinción está escrita en el
código para que no se pierda:

- **campo vacío → 1** (100 %). Antes daba `NaN`, el `|| 0` lo volvía cero, y un
  inmueble de $100.000.000 mostraba $0,00.
- **`0` escrito → 0.** No es un bug: si el causante no era titular no se tributa.
- **texto que no se puede leer como número → 0.** Eso sí es haber tocado el
  campo, y no se adivina.

El campo lleva ahora `placeholder="100 %"`, que dice qué se aplica si no se
escribe nada **sin cargar un valor**: un valor cargado obligaría a borrarlo para
poner otro.

**Los dos casos de prueba que estaban puestos hicieron exactamente su trabajo:**
el del campo vacío nació congelando el error con el esperado correcto escrito al
lado, y el del `0` escrito —que se agregó el mismo día— confirmó después del
arreglo que tratar el vacío como 100 % **no se llevó puesto el cero legítimo**.

---

### `tasa` refundada: los dos ejes en una lista — 27/8

**El pedido de Javier era de comodidad** —*«especialmente cuando querés sumar
varios cálculos de tasa se muestra muy incómodo (ejemplo sucesión pedís
inscripción de bien y automóvil)»*— **y abajo había un problema de modelo.** El
diagnóstico entero está [arriba](#tasa-el-diagnóstico-antes-de-refundarla-y-un-cero-en-silencio--278);
esto es lo que se construyó.

#### Qué es ahora la pantalla

Una **lista de renglones**, uno por pretensión, y cada renglón declara por
separado las dos cosas que la ley separa:

| | Qué contesta | De dónde sale |
|---|---|---|
| Primer desplegable | **qué número se toma** | art. 4, once bases |
| Segundo desplegable | **qué alícuota se le aplica** | arts. 2 y 3, nueve alícuotas |

**Once opciones más nueve, en vez de las ochenta combinaciones** que produce
tener la combinación ya hecha adentro de cada opción. El segundo desplegable
arranca en «3 %, general — art. 2», que es el caso corriente, así que en el
juicio común no se toca.

**El caso de Javier son dos renglones de la misma tabla** y da lo mismo que
antes: **$1.875.000**, comprobado en la pantalla servida y fijado en el banco.
Antes eran dos secciones con dos desplegables y un botón para agregar la
segunda.

**La sucesión dejó de ser una rama.** Es una opción del segundo desplegable, al
lado de mensura y deslinde, testamentos de extraña jurisdicción, reinscripción
de hipotecas, recursos directos contra el PEN y tercerías, que son los otros
cinco supuestos que el art. 3 reduce al 50 %. Es lo que argumentó Javier al
voltear el interruptor de sucesorio, y tenía razón.

#### El filtro es el arreglo del cobro doble, hecho estructural

El segundo desplegable **sólo ofrece los cruces que la ley admite**. Una tercería
ofrece una sola alícuota —la reducida del art. 3 inc. h— y no hay forma de
cobrarle el 3 %. Lo mismo la reinscripción de hipotecas, el recurso directo y los
créditos verificados del concurso.

**Eso es exactamente el bug del 27/8 a la mañana, pero cerrado por construcción
en vez de a mano.** Aquel cobro doble salió de agrupar tres supuestos *porque
compartían el 3 %*, que es lo que impidió ver que dos de los tres no lo comparten.
Con los dos ejes en desplegables distintos, agrupar por el eje equivocado ya no
es una opción disponible.

**Hay un caso de prueba que pide el cruce mal a propósito** —una tercería al 3 %—
y comprueba que la pantalla no se lo da: devuelve $150.000 y no $300.000.

#### La herencia entre renglones, y el bug que apareció al probarla

Un renglón nuevo **hereda la alícuota del anterior**: en una sucesión con seis
bienes se elige «reducida, sucesorio» una vez y los otros cinco ya vienen con
eso. Es lo que reemplaza a las secciones sin partir nada.

**Y heredar sólo la alícuota no funcionaba.** El renglón nuevo nacía con la base
por omisión —sumas de dinero, art. 4 inc. a—, que **no admite** la alícuota
sucesoria, así que el filtro la tiraba abajo antes de que la persona tocara nada
y el segundo bien de la sucesión aparecía al 3 %. **En el caso de Javier eso daba
$2.175.000 en vez de $1.875.000: el automóvil cobrado al doble.**

Lo encontró el caso de prueba de la herencia, escrito el mismo día. **Se hereda
también la base**, y con eso el segundo renglón nace idéntico al primero y sólo
hay que cambiarle lo que cambie.

Vale anotar por qué el caso lo cazó y el de al lado no: **el par está armado para
eso**. Un caso declara las dos alícuotas y el otro deja que la segunda se herede,
y los dos tienen que dar el mismo total. Si la herencia se rompe, el segundo salta
y el primero sigue verde.

#### El hint en el renglón, que era la función real del desplegable global

Cada base trae su pista pegada al campo del importe, que es la corrección de
Javier: *«la gracia de declarar el objeto del juicio antes es que te da una
suerte de hint del valor que tenés que ingresar… al elegir desalojo ya te dice
que pongas un solo alquiler porque el sistema está calculando los 6 meses que
son la base»*. **En la lista vive mejor que arriba de toda la pantalla**, porque
aparece en el renglón que se está cargando y cambia con el desplegable de al
lado.

**Los dos multiplicadores que la ley pone adentro de la base están declarados y
se aplican solos**: el desalojo son seis meses de alquiler (art. 4 inc. b) y el
desalojo laboral seis del último salario (art. 4 inc. i). Cuando el importe
cargado no es el imponible, el renglón escribe el imponible abajo del campo:
«Imponible $3.000.000 — × 6 meses».

#### La titularidad ahora se ve escrita, y cambió de eje

**Se decidió que sí**, que era la pregunta abierta: el renglón escribe
`× 100 % de titularidad` abajo del campo aunque nadie haya escrito nada. **Es el
campo que ya causó un cero en silencio**, y mostrar el factor que se está usando
es lo único que hace evidente que se aplicó un 100 % que nadie declaró. El campo
sigue vacío con `placeholder="100 %"`: cargarle el valor obligaría a borrarlo
para poner otro.

**Y colgó del eje correcto.** Antes la titularidad aparecía en tres de los cuatro
tipos de bien de la pantalla de sucesiones y no en el cuarto —las sumas de
dinero—, sin ninguna razón legal: el dinero del acervo puede ser ganancial igual
que el inmueble. Ahora **depende de la alícuota y no del tipo de bien**: aparece
en las tres sucesorias (art. 3 incs. c y d, y el 0,75 % del art. 4 inc. g) y en
ninguna otra. **De paso resuelve la petición de herencia del art. 9 inc. f**,
donde la base es la porción que le toca al peticionario, que es exactamente lo
que hace este campo.

**La sobretasa, en cambio, se dejó donde estaba**: sólo sobre inmuebles de una
sucesión, que es donde se usa. Hay un caso de prueba que mira qué modificadores
muestra cada renglón, porque que a los muebles les falte la sobretasa **no se ve
en ningún número**: si un refactor se la agrega, el total no cambia hasta que
alguien la marque, y para entonces ya está cobrando de más.

#### El dinero del acervo cambió de inciso, y el número no se movió

La pantalla anterior tenía «Sucesión · Sumas de dinero» como cuarto tipo de bien.
**El art. 4 inc. g dice que en los sucesorios el valor de los bienes «se
determinará como lo establece en los incisos c) y d)»**: la plata del acervo es
un bien mueble —inc. d—, no una suma de dinero reclamada —inc. a, que es una
pretensión contenciosa—. Ahora se carga como bien mueble.

Misma alícuota, mismo número —$150.000 sobre $10.000.000—, y la cita queda bien.
El caso de prueba se conservó con el número intacto y el porqué reescrito.

#### Dejó de ser sólo civil

Con los dos ejes separados, agregar un supuesto es agregar una fila a una de las
dos tablas. Entraron los que faltaban y no necesitaban maquinaria nueva:

| Qué entró | Dónde |
|---|---|
| Quiebra: el importe de la liquidación de los bienes | base, art. 4 inc. e |
| Concurso preventivo: los créditos verificados | base, art. 4 inc. e |
| Laboral: el monto de la condena según la primera liquidación firme | base, art. 4 inc. i |
| Desalojo laboral: seis meses del último salario | base, art. 4 inc. i |
| Recurso directo: el monto de la resolución que se apela | base, art. 4 inc. j |
| Mensura y deslinde, testamentos de extraña jurisdicción, recursos directos | alícuota, art. 3 incs. b, d y g |
| La concursal: 0,75 %, y 0,25 % sobre el excedente | alícuota, art. 3, Ley 25.563 |

**El inc. i era el que hacía que fuera «sólo civil»**, y era el pedido de Javier:
*«cubrir toda la ley de tasa… para que sea una calculadora completa referencia
para todo y no solo civil»*.

**La concursal sí necesitó maquinaria: es la única escala progresiva de la ley.**
0,75 % de los créditos verificados, y 0,25 % **sobre el excedente** de
$100.000.000. Una alícuota sola no la representa, así que la alícuota puede
declarar tramos. Con $200.000.000 son $750.000 más $250.000: **$1.000.000**.
Leerla como no progresiva —0,25 % sobre todo— daría $500.000, la mitad, que es el
error más probable y el que el caso de prueba caza. **El piso de $100.000.000 se
toma textual**, escrito en 2002 y sin actualizar, por decisión de Javier.

#### El art. 9 lo dice sola la pantalla

Un panel abajo de la lista dice **cuándo se paga cada renglón cargado**, que es
lo que propuso Javier y no es un adorno: el momento cambia por completo según el
caso. Sale de los renglones y se deduplica.

**Y depende del segundo eje, no del primero**, que es lo que hace que valga
tenerlo derivado: un inmueble se paga al iniciar las actuaciones si es un juicio
común (art. 9 inc. a) y **al inscribir la declaratoria de herederos** si es de una
sucesión (inc. d). El mismo número, dos momentos distintos.

#### Una red de seguridad que salió de una falla del banco

Si el desplegable de la alícuota queda en un valor que la base no admite —pasa
cuando algo le asigna un `value` que no existe entre las opciones: **el `<select>`
se va a la cadena vacía y no avisa**— el renglón dejaba de calcular en silencio y
el total no lo contaba. **Un renglón cargado que aporta cero es peor que un
error: parece una cuenta.** Ahora `calcular()` revisa cada renglón antes de leerlo
y lo resincroniza. Lo destapó el caso del cruce imposible.

#### El banco: de 33 a 37, y el driver reescrito

**El driver se reescribió entero, y eso estaba previsto**: es lo que pasa cuando
se refunda una pantalla, y no invalida los casos. Los dos drivers de antes
—`tasa` y `tasa-sucesion`, que existían porque la pantalla eran dos— son uno solo.

**Los casos no se reescribieron: se remapearon.** Los números esperados son los
mismos que fijaba el banco anterior, que es toda la gracia. Lo que cambió es cómo
se pide el caso —`{tipo:'inmueblesCABA'}` pasa a ser
`{base:'inmueble', alicuota:'sucesorio'}`— y el formato de la salida, porque la
pantalla nueva muestra los importes formateados en vez de `1575000.00` pelado.

Los cinco casos nuevos cubren lo que antes no existía: **la herencia de la
alícuota** —que encontró el cobro doble del automóvil—, **los dos tramos de la
escala concursal**, **el cruce imposible** y **el inmueble al 3 % en un juicio
común**, que es el par que hace visible que la reducción la trae el supuesto y no
el tipo de bien.

**Y una decisión de la pantalla la fijó un caso viejo:** con la titularidad en `0`
el total grande dice **$ 0,00 y no una raya**. La raya es «todavía no se cargó
nada»; acá se cargó todo y la respuesta es cero, que es la que defendió Javier.

#### Qué se tocó afuera de la calculadora

**La prosa que la describe envejeció con el cambio**, que es la lección de
[las cinco cifras](#las-cinco-cifras-que-este-repositorio-sigue-de-honorio). Tres
lugares decían «orientada a procesos civiles» y ya no es cierto: `index.html`,
`README.md` y `documentacion.html`. Los tres actualizados en el mismo commit.

---

### El monto fijo y el imprimible: lo que la lista desbloqueaba — 27/8

Los dos estaban esperando a que existiera la lista de renglones, que es lo que
decía el orden de trabajo. Con la lista hecha, los dos entraron el mismo día.

#### El monto fijo de los arts. 5 y 6

**No es una alícuota: es un importe, y no lo fija la ley sino la Corte.** El
art. 6 dice AUSTRALES 250.000 a junio de 1990 y manda a la CSJN actualizarlo;
hoy son **$4.700, Acordada 15/2022**, para las demandas y reconvenciones
presentadas desde el 1/7/2022.

**Javier lo planteó como un problema** —*«no sé cómo podríamos manejar el input
para cambiarlo manualmente de forma sencilla sin tocar código y sin
hardcodearlo»*— **y ya estaba resuelto dos veces en este repositorio.** Las dos
mitades son las mismas que usan `honorarios-mediacion` con el UHOM y `prorrateo`
con la UMA:

1. **El valor vive en `data/tasa-monto-fijo.json`**, con la misma forma que
   `data/serie-uma.json`: un valor, desde cuándo rige, qué norma lo fijó.
   Cambiarlo es editar tres líneas de texto y queda versionado con la norma al
   lado.
2. **La pantalla lo muestra en un campo que se puede pisar a mano**, para
   liquidar con el valor de otra fecha sin tocar el archivo.

**El campo aparece sólo cuando hay un renglón que lo usa.** Es un dato de la ley
que casi nadie va a tocar: tenerlo siempre a la vista lo pondría al mismo nivel
que los renglones, que es donde está el trabajo.

**El archivo arranca en 2022 y le falta un valor a propósito.** Hubo por lo
menos una adecuación anterior —la Acordada 41/2018, que la nota de Infoleg
nombra **sin decir el importe**— y no se cargó porque no se leyó el texto.
Cargar un número que no se vio es exactamente lo que este archivo existe para
evitar.

**`npm run verificar-series` controla las tres.** Los controles ya eran
genéricos, así que fue conectar la tercera: vigencia repetida, serie que baja,
acto imposible. **Y se probó rompiéndolo**, porque un control que nunca falló no
es un control: con un valor de 2020 pegado abajo del de 2022, el script marca las
dos fallas —el orden y el valor que baja— y sale con 1.

**Una diferencia con la UMA que hay que tener presente:** acá el acto es
**anterior** a la vigencia, y no al revés. La Corte publicó la acordada en mayo y
la aplicó desde julio. El control que exige que el acto no preceda a la vigencia
se saltea con `sin_demora`, que es el mismo campo que ya usaba la serie de la UMA
para sus tres casos raros.

**El art. 5 no agrega una cuenta, agrega un aviso**, y era un pedido de Javier:
la suma se paga **a cuenta**, y la tasa se completa al terminar el proceso,
dentro de los cinco días de la sentencia definitiva o del modo anormal de
terminación, con intimación por cédula. Vive en «Cuándo se paga», que es su lugar
natural: es un hecho sobre el momento, no sobre el monto.

**Y hubo que decidir qué hace la alícuota efectiva con esto.** Un renglón de
monto fijo no tiene monto imponible, así que dividir el total por el imponible
daría una alícuota que nadie aplicó: el numerador tendría plata que no salió de
ninguna base. **La tira dice «no aplica: hay una suma fija en el total»** en vez
de mostrar un número. El monto imponible del renglón se declara en cero a
propósito y no en el valor de la suma fija, por lo mismo.

#### El imprimible, que es la liquidación del art. 4 *in fine*

*«En todos los casos al momento de efectuarse el pago de la tasa se acompañará
la correspondiente liquidación detallada del monto imponible.»* **La planilla es
parte del pago, no un adorno de la calculadora**, y la lista de renglones ya
*era* esa planilla: lo único que faltaba era poder sacarla en papel.

**Se imprime la página, no se descarga un archivo.** `window.print()` deja elegir
impresora o PDF con el diálogo del sistema, y no hay que generar ni servir nada.
El bloque vive en el DOM, oculto en pantalla, y `@media print` apaga todo lo
demás. Se compone como un documento y no como una pantalla: negro sobre blanco,
sin tarjetas y sin acento. **Los colores fijos son correctos ahí y sólo ahí**
—el papel no tiene tema claro ni oscuro— y por eso viven adentro del `@media
print` y no en `:root`, que es donde el bug del 27/8 a la mañana enseñó que no
hay que ponerlos.

La hoja lleva, por renglón: **concepto · qué se toma con su inciso · importe
declarado · monto imponible · alícuota con su cita · tasa**, y abajo el total,
la tabla del art. 9 con los momentos de pago que correspondan y la aclaración de
que la sobretasa del 5 % es costumbre y no ley.

#### El art. 8, que no es un tercer eje sino una etiqueta del renglón

*«Las ampliaciones de demanda y las reconvenciones estarán sujetas a la tasa,
como si fueran juicios independientes del principal.»* Y el art. 7 dice lo mismo
de las tercerías.

**No cambia ningún número: cambia cómo se presentan.** Cada renglón declara si es
del juicio principal, una ampliación de demanda o una reconvención, y **el
imprimible agrupa por eso, con un subtotal por grupo**. El total sigue estando
—es lo que uno vino a buscar— pero con una línea al lado que dice que **no se
integra de una sola vez**. Sumarlas sin decirlo afirmaría algo que la ley no
dice: que se liquidan juntas.

**Se dejó para este paso a propósito**, y esa decisión quedó escrita el mismo
día: sin imprimible, la marca no hace nada visible.

**El caso de prueba de esto no mira el total, mira la agrupación**, y es lo que
lo hace valer: si la agrupación se pierde, los tres importes siguen siendo los
mismos y el total también. Fija los encabezados de grupo con su subtotal.

#### El banco: de 37 a 40

Tres casos nuevos: el juicio sin valor pecuniario del art. 6, el monto
indeterminable del art. 5 —**mismo número y por eso el par vale**: lo que cambia
no es el monto sino lo que la pantalla dice en «Cuándo se paga»— y el imprimible
con una reconvención.

**Y el driver ganó una espera que ya había hecho falta antes.** La página lee el
monto fijo con `fetch` y lo escribe en el campo cuando llega, o sea **después**
de que el driver puso el suyo: es la misma trampa que ya había pisado el driver
de `honorarios-mediacion` con el UHOM, y el síntoma es el peor posible —falla
sólo el primer caso, con un número plausible—. La condición de «listo» ahora
exige que el estado deje de decir que está buscando.

**El monto fijo lo fija el caso, siempre**, aunque no lo use: si se dejara el del
archivo, el banco se pondría en rojo el día que la Corte saque una acordada nueva
sin que nada se haya roto. Es el mismo criterio que ya tenían la UMA y el UHOM.

---

### Las exenciones del art. 13 y el permalink, los dos copiados de Honorio — 27/8

Los dos últimos pendientes de `tasa`, y los dos tenían la misma indicación
escrita: **el patrón está construido del otro lado, hay que ir a mirarlo antes
de escribir.** Se hizo así, y en los dos casos lo que se copió no fue el código
—Honorio es React y esto es un HTML suelto— sino **las decisiones**.

#### Las exenciones: una tabla de referencia, no un trámite

Pedido de Javier: *«así como en Honorio están los mínimos y el buscador de
mínimos por término literal, las exenciones: un resumen de ese artículo y
búsqueda textual»*.

Lo que se trajo de `minimos-view.tsx` y de `lib/minimos-buscar.ts`:

- **Se abre mostrando los diez incisos y se filtra escribiendo.** No hay que
  elegir una categoría para ver algo.
- **Búsqueda textual y no semántica, a propósito.** Son diez incisos fijos que
  sólo cambian cuando cambia la ley. Un índice semántico traería un modelo, un
  build y una desincronización posible, para resolver algo que se resuelve
  normalizando tildes.
- **Insensible a tildes, mayúsculas y orden de las palabras**, con una
  normalización que **conserva la posición de cada carácter**: es lo que permite
  resaltar la coincidencia sobre el texto original, con sus tildes puestas.
- **Tolerancia de raíz para el plural y el género**, que es casi toda la
  distancia entre cómo se busca y cómo está escrita la ley. Un token coincide
  entero o sin sus últimas una o dos letras, y cuanto más se recorta, más larga
  tiene que quedar la raíz: así `art` o `bis` no se vuelven comodines.
- **`alias`, sólo donde el nombre de tribunal no coincide con el de la ley.**

**Los alias son el mecanismo que más conviene entender, y hay un caso de prueba
que existe sólo para eso:** la palabra **«apremio» no aparece en ninguna parte
del art. 13** —el inc. j dice «ejecuciones fiscales»— y es como se lo llama en
el tribunal. Sin el alias, el buscador devuelve cero justo cuando alguien busca
bien. **Los alias no son contenido jurídico**: lo que el inciso dice lo dice su
texto, que está entero y a un clic.

**Con una búsqueda puesta los incisos se abren solos.** Si el que busca escribió
«alimentos», esconderle detrás de un clic el texto donde aparece la palabra es
hacerle buscar dos veces.

**Y hay un caso que fija que el buscador devuelva CERO**: buscar «sucesión» no
trae nada, y está bien. **Un sucesorio no está exento**: tiene la tasa reducida
del art. 3 inc. c, que es otra cosa. El art. 13 enumera diez exenciones y no
admite otras, y la pantalla lo dice con todas las letras en vez de mostrar una
lista vacía.

#### El permalink: el caso en el fragmento de la URL

Copiado de `lib/compartir.ts`, con su decisión central intacta:

> **Va en el fragmento (`#`) y no en la query (`?`) a propósito. El fragmento no
> viaja al servidor**: ningún request lleva el caso, ni al host que sirve el
> sitio ni a nadie en el camino.

Eso es lo que hace que compartir una liquidación **no contradiga** la promesa de
que nada de lo que se escribe sale del navegador. En la query, la misma
funcionalidad la rompería. Es además la única forma de que el enlace sea
compatible con
[la promesa que se demuestra y no se declara](#una-promesa-de-privacidad-se-demuestra-no-se-declara).

**El formato lleva versión (`t1`).** Si alguna vez cambia la forma de codificar,
el número sube y los enlaces viejos siguen abriendo con el lector viejo en vez de
decodificarse mal en silencio: **un enlace que se abre torcido es peor que uno
que no abre.**

**Se decodifica con desconfianza**, igual que allá: el fragmento lo escribe
cualquiera y puede venir cortado por un cliente de mail. Se descartan las bases
que no existen, y lo que se devuelve son renglones **candidatos**: que la base y
la alícuota se puedan cruzar no lo decide el decodificador sino el filtro, igual
que cuando los elige una persona.

**Dos cosas que acá se resolvieron distinto que en Honorio, y por qué:**

- **El enlace se mantiene al día solo**, con `history.replaceState` en cada
  cálculo, así que la barra de direcciones **siempre** tiene el caso y el botón
  sólo lo copia. Con `location.hash` directo quedaría una entrada de historial
  por cada tecla y volver atrás sería inusable.
- **El monto fijo del art. 6 viaja adentro del enlace.** Es un dato del sistema y
  no del caso, pero **una liquidación tiene fecha**: la del art. 6 que regía el
  día que se hizo. Si no viajara, el mismo enlace abierto después de la próxima
  acordada daría otro total, y el enlace existe justamente para que el que lo
  recibe vea el mismo número. Cuando el enlace trae un valor distinto del del
  archivo, la pantalla lo dice en vez de pisarlo en silencio.

**El enlace también se imprime**, al pie de la liquidación. Es la mitad del
permalink que importa en papel, y es el motivo que está escrito en Honorio: quien
lee la liquidación puede volver a la pantalla que la produjo y ver de dónde salió
cada peso.

#### El caso del enlace está armado para que pierda algo

Prueba la ida y la vuelta: se codifica, se borra todo y se vuelve a armar desde
el código. **Es la única forma de probar un permalink sin recargar la página**
—el iframe se reusa entre casos y recargarlo rompe el resto de la corrida—.

Y el caso lleva **dos renglones, una titularidad escrita como fracción, un
concepto con tilde y una alícuota heredada que el segundo renglón no declara**.
Cualquiera de esas cuatro cosas se puede caer sin que el total del primer renglón
se mueva.

**Se probó rompiéndolo**, y las dos veces:

| Qué se rompió | Qué dijo el banco |
|---|---|
| El concepto deja de viajar en el enlace | `conceptos Departamento, Automóvil` → `(sin nombre), (sin nombre)` |
| Se saca el alias «apremio» | `1 de 10 incisos · inc. j` → `0 de 10 incisos · ninguno` |

**El primero es el que vale la pena mirar**, porque el total no se movió: ida y
vuelta seguían dando $1.087.500 y los dos renglones seguían estando. Un caso que
mirara sólo la cifra habría pasado en verde con el enlace perdiendo la mitad de
lo que lleva.

#### El banco: de 40 a 45

Cinco casos nuevos: el enlace de ida y vuelta, y cuatro del buscador —lo que
está escrito en la ley, lo que llega por alias, el plural y el género, y lo que
tiene que devolver cero—.

**Con esto `tasa` cubre toda la ley 23.898.** Lo que queda abierto no es
cobertura sino criterio, y está abajo.

---

### `tasa` cerrada: las tres preguntas contestadas, y la titularidad cambió de eje — 27/8

**La lista de cuatro que tenía esta sección se hizo entera el 27/8**, y lo que
queda no es cobertura de la ley sino criterio. Los cuatro, para que la próxima
lectura no los busque:

1. **~~El imprimible del art. 4 *in fine*, con el art. 8 adentro.~~** y
   **~~el monto fijo de los arts. 5 y 6.~~** Ver
   [el monto fijo y el imprimible](#el-monto-fijo-y-el-imprimible-lo-que-la-lista-desbloqueaba--278).
2. **~~Las exenciones del art. 13.~~** y **~~el permalink.~~** Los dos con el
   patrón de Honorio, ido a mirar antes de escribir como decía la indicación.
   Ver [las exenciones y el permalink](#las-exenciones-del-art-13-y-el-permalink-los-dos-copiados-de-honorio--278).

**`tasa` cubre ahora toda la Ley 23.898**, y desde el cierre del 27/8 tampoco
le quedan preguntas abiertas: Javier contestó las tres que le habían quedado.

#### Las tres, contestadas

**1. El 0,75 % del art. 4 inc. g queda como está.** La duda era de redacción: el
texto dice que «el **valor** establecido en el artículo 3º, inciso c) se
reducirá a la mitad», y el art. 3 inc. c no establece un valor sino una
reducción, así que se lee de dos maneras. La calculadora lee que la alícuota ya
reducida se reduce otra vez —3 % → 1,5 % → 0,75 %—, y Javier: ***«es la
interpretación que se hace todos los días, está bien así»***. El comentario del
código dejó de pedir doctrina y dice eso.

**2. La entrevista previa se descarta.** Javier la había dejado abierta —*«quizás
hay que hacer una entrevista previa para llegar al número final, no lo sé»*— y
la cerró: **no**. La razón sigue siendo la que estaba escrita: una entrevista es
buena la primera vez y estorba a partir de la segunda, y la tasa se calcula
seguido. El hint del renglón da lo mismo sin cobrar el peaje cada vez.

**3. La separación de bienes NO necesitaba una base propia, y el que estaba mal
era el eje de la titularidad.** Esta es la que movió código.

#### La titularidad no es del sucesorio: es de la cosa común

**La sección anterior había dado la separación de bienes por «sin lugar»**, con
el argumento de que el art. 9 inc. e no está en el mapa de bases del art. 4.
Javier lo corrigió de un tirón: ***«la separación de bienes es lo mismo que la
petición de herencia, y cualquier otro caso de cosas comunes: es el valor de lo
que se divide y luego juega el porcentaje de titularidad de cada uno»***.

O sea que la base no falta —es el mismo inmueble del inc. c o el mismo mueble
del inc. d— y el reparto ya lo hace el campo de titularidad. **Lo que estaba mal
era de dónde colgaba ese campo.** La refundación lo había colgado del EJE DE LA
ALÍCUOTA —aparecía sólo con las tres alícuotas sucesorias— y lo había escrito
como una decisión pensada: *«no las marca por el tipo de bien sino por el
supuesto, que es el eje correcto»*. **Era el eje equivocado**, y el error
completo es más viejo: la pantalla anterior lo colgaba del tipo de bien pero
sólo adentro de la sucesión, así que las dos versiones tenían el mismo techo.

Ahora cuelga de la **base**: las dos que valúan una cosa —`inmueble` del inc. c
y `muebles` del inc. d— llevan `divisible: true`, y son las dos que pueden ser
de varios. El supuesto sigue gobernando lo que sí es suyo: **la sobretasa**
—costumbre del juzgado en las sucesiones, y sólo sobre inmuebles— y el momento
de pago del art. 9 inc. d.

**Lo que se podía cargar mal, en un renglón:** una separación de bienes con un
inmueble de $25.000.000 va al 3 % del art. 2 —la reducción del art. 3 es del
sucesorio y esto no lo es—, y el campo de titularidad no aparecía. La pantalla
cobraba **$750.000 a cada cónyuge en vez de $375.000**. Es el caso nuevo del
banco, y el banco pasó de 45 a 46.

**Ningún número existente se movió**, y esa es la parte que hacía segura la
operación: el campo vacío vale 100 %, así que el cambio sólo agrega el campo
donde antes no estaba.

#### Lo que la pantalla no puede saber, y lo dice

El art. 9 trae **dos supuestos que el art. 4 no tiene** —la separación de bienes
del inc. e y la petición de herencia del inc. f— y los dos se cargan igual que
un condominio común: el valor de la cosa, recortado por la titularidad.
**Ninguna de las dos se distingue de la otra desde los dos ejes**, así que
clavarles un momento de pago sería inventarlo. Cuando algún renglón tiene
titularidad menor al 100 %, «Cuándo se paga» agrega un renglón que dice los dos
—al promover la liquidación de la sociedad conyugal, y **cada cónyuge puede
pagar su cuota parte**; al determinarse el valor de la parte del peticionario— y
dice también que la pantalla no puede distinguirlos. Es la misma regla de la
casa: el número no se oculta y la duda se escribe.

#### Un renglón del colofón mentía

Decía que *«el imprimible que sale de esta lista todavía no está hecho»*, y está
hecho desde unas horas antes: es el botón «Imprimir la liquidación». Es el
riesgo de escribir el colofón antes que la función. Ahora nombra el botón.

**La única cosa de la ley que sigue sin lugar, y no por olvido:** la propiedad
industrial. El art. 4 inc. d remite a lo que «la Dirección Nacional de la
Propiedad Industrial perciba para la solicitud de registros», o sea a un arancel
externo. **No hay número que calcular desde acá.**

**Tres cosas para tener a mano si se vuelve al banco:**

- **La corrida se arrastra con el panel del navegador oculto** —de seis segundos
  a varios minutos— porque los iframes no dibujan. No es que esté roto.
- **Los renglones se arman de a uno y en orden**, y no todos primero: el renglón
  nuevo hereda del último que ya existe, así que crearlos todos al principio los
  haría heredar del renglón vacío del arranque y la herencia quedaría sin probar.
- **El `<select>` al que se le asigna un `value` inexistente se va a la cadena
  vacía y no avisa.** Es lo que hace que el caso del cruce imposible pruebe algo
  real, y es la razón de la red de seguridad de `calcular()`.

---

### Los textos de las cinco de plazos, unificados contra `vencimientos` — 27/8

**Pedido de Javier el 27/8:** *«hay que hacer además una revisión exhaustiva de
los textos que muestran todas las calc con referencia a que la más actualizada es
vencimientos. ejemplo regresiva dice "años disponibles..." que es distinto de
como lo declara vencimientos»*.

#### Lo mismo se llamaba de cinco maneras, y tres tenían un defecto propio

| Pantalla | Lo que decía |
|---|---|
| `vencimientos` | «Calculadora disponible para los años 2021 - 2027, salvo los plazos que caigan en la feria de invierno de 2027: esa Acordada de la CSJN todavía no se dictó.» |
| `caducidad` | «Calculadora disponible (feriados 2021-2027, 7 años)» |
| `entre-fechas` | «Calculadora disponible para los **anios**: 2021, 2022, 2023, …» |
| `regresiva` | «Años disponibles: 2021, 2022, … (según feriados y **adicionales**)» |
| `mora` | «Años **soportados**: 2021 - 2026» |

- **`entre-fechas` decía «anios», sin tilde, en texto que ve el usuario**, y
  enumeraba los siete años uno por uno en vez de dar el rango. Su caso sin datos
  decía «La API de feriados no esta disponible» —sin tildes, y contándole al
  usuario que hay una API, que es implementación—.
- **`regresiva` decía «adicionales»**, que es el nombre de un archivo del
  repositorio y no una palabra del fuero.
- **`mora` decía «soportados»**, calco de *supported*.

#### Pero lo que importaba no era el rótulo

**El motor devuelve `missingFeriaYears` —los años cuya Acordada de feria todavía
no se dictó— y hasta hoy lo leía UNA SOLA de las cinco pantallas.** Las otras
cuatro tenían el dato disponible y prometían el año entero; el cómputo se negaba
recién en julio, con el caso ya cargado. Eso no es una diferencia de estilo: es
una pantalla que promete algo que la de al lado sabe que no puede cumplir.

Ahora las cinco arman el aviso con la fórmula de `vencimientos`, y las cinco
nombran la feria faltante. Verificado en las cinco pantallas servidas: dicen el
mismo renglón, carácter por carácter.

#### Dos cosas que salieron al hacerlo

**`mora` subdeclaraba su propia cobertura.** Anunciaba «2021 - <año actual>»
mientras `yearsToFetch` llega hasta `y0 + 1`: calcula el año que viene sin
problema y decía que no. Ahora anuncia lo mismo que las otras cuatro.

**Y `mora` es la única de las cinco que no carga el calendario al arrancar**: lo
carga al calcular, con los años que hagan falta según la fecha cargada. Un primer
intento puso el aviso completo en el arranque y leía una lista vacía. Por eso
el aviso se dice **en dos tiempos**: el rango primero, y la salvedad de la feria
después del `init`, desde `actualizarCobertura()`.

#### El banco de las pantallas se puso rojo, y estuvo bien

`pruebas-calculadoras` reportó **«regresiva: no terminó de cargar en 12 s»** en
las tres filas de esa pantalla. No era la pantalla: el predicado de «página
lista» buscaba `/Años disponibles/`, que era **el rótulo viejo de esa sola**.
El síntoma es el peor de todos —indistinguible de una pantalla rota— y es la
misma clase de trampa que el rompe-caché de los iframes. Ahora los cinco
predicados buscan la fórmula única.

#### Lo que queda de este barrido, y es una decisión de nombre

**`regresiva` se llama «Calculadora de plazos judiciales» y `vencimientos`
«Vencimiento de plazos judiciales».** Puestas al lado en el tablero no se
distinguen, y la que tiene el nombre genérico es la que hace lo menos común de
las dos. Es una decisión de Javier y no se tocó.

Y quedan las diferencias que son de rediseño y no de texto, que van con la
pasada de aspecto de cada pantalla:

- **Los títulos**: `vencimientos` dice «Vencimiento de plazos judiciales», sin la
  palabra «Calculadora», que en un sitio de calculadoras no agrega nada. Las
  otras cuatro la llevan.
- **Los botones**: `vencimientos` dice «Calcular» / «Limpiar». Las otras dicen
  «Calcular Vencimiento» —con mayúscula—, «Calcular fecha límite», y
  `entre-fechas` dice **«Resetear»**, que es calco.
- **`mora` tiene a la vista un botón «Forzar recarga (cache)»**, que es un
  control de depuración.
- **Los rótulos**: `caducidad` usa dos puntos («Meses (1-6):»), `regresiva` y
  `mora` usan asteriscos de obligatorio y el formato entre paréntesis
  («Fecha objetivo (DD/MM/AAAA) *»). `vencimientos` no usa ninguna de las tres
  cosas: el campo es de tres cajas y el formato no hace falta explicarlo.
- **Colores planos que el sistema no usa**, y que en tema oscuro pintan mal:
  `caducidad` tenía `#059669` y `#dc2626` en el aviso de cobertura —cambiados a
  `--ok` y `--error` de paso, que es un mapeo directo—; quedan `#ffe6e6`,
  `#fcf8e3`, `#8a6d3b` y `#5a6268` en `entre-fechas`, y `#ff4d4f`, `#fff0f0` y
  `#f8fdf8` en `mora`.

**Lo de `tasa` y `ejecucion-estado` no se tocó a propósito**: van de cero, así
que escribirles el texto ahora es escribirlo dos veces.

---

### `prorrateo` rehecha, y el tope que estaba escrito duro — 27/8

**Es la segunda de las cuatro que van de cero, y la primera que además movió un
número.** En `honorarios-mediacion` lo que estaba mal era de forma y ningún
importe cambió; acá había las dos cosas.

#### El 22 % estaba escrito duro, y por eso daba mal en dos casos que la propia pantalla ofrece

El HTML anterior calculaba el techo y el tope como dos constantes separadas:

```js
const percent25 = montoProcess * 0.25;   // el techo del art. 730
const tope730   = montoProcess * 0.22;   // lo que se reparte entre honorarios
```

**De dónde sale el 22 %:** el art. 730 topea las costas —«incluidos los
honorarios profesionales, de todo tipo»— en el 25 % de la condena, y la tasa de
justicia es costas. Con la tasa del 3 % del art. 2 de la Ley 23.898, a los
honorarios les quedan 22 puntos. **La cuenta es correcta en ese caso y sólo en
ése**, y la pantalla ofrece los otros dos:

- **Tasa cargada a mano distinta del 3 %.** Con la tasa reducida del art. 3
  inc. c —1,5 %, o sea $150.000 sobre un proceso de $10.000.000— el art. 730 le
  deja a los honorarios $2.350.000 y la pantalla los topeaba en $2.200.000:
  **prorrateaba $150.000 de menos.**
- **La casilla de la tasa destildada.** Si la tasa no integra la base no hay
  nada que descontarle al 25 %, y el tope seguía siendo el 22 %.

**Ahora el tope se deriva:** `tasaEnBase ? max(0, techo − tasa) : techo`. Con la
tasa del 3 % adentro de la base —que es como la pantalla arranca— da exactamente
el 22 % de siempre. **Decidido por Javier el 27/8**, planteado antes de escribir
una línea, porque cambia lo que una herramienta publicada le dice a un abogado.

**El `max` con cero no es defensivo por las dudas:** una tasa a mano mayor al
25 % de la condena hace la resta negativa, y un tope negativo repartido en
proporción devuelve honorarios **negativos**. Hay un fijado pegado a ese borde.

#### Qué explica esta pantalla, que no es lo mismo que explican las otras

En `vencimientos` el dibujo es un calendario, en `caducidad` una línea de hitos y
en `honorarios-mediacion` la escala. Acá la pregunta es otra otra vez: no *cómo
se llegó a la fecha* ni *por qué ese tramo*, sino **por qué no se cobra lo que se
reguló** —o por qué sí—, y eso es una comparación entre dos cantidades.

Así que el dibujo son **dos barras a la misma escala**: las costas reguladas
—tasa, honorarios que se cobran, y lo que el art. 730 recorta— contra el techo
del 25 % —tasa, honorarios usados, y el margen que sobra—. Una comparación entre
dos números que sólo se escriben es la clase de cosa que se lee tres veces;
puestos uno encima del otro se ve de una.

**Y el dibujo sirve para los dos desenlaces**, que es la prueba de que es el
dibujo correcto: cuando hay prorrateo la barra de arriba se pasa, y cuando no
hay, se queda corta. **Ese «quedarse corto» también es información** —dice cuánto
margen queda abajo del techo— y con el HTML anterior no se veía en ningún lado:
sin prorrateo la pantalla mostraba un cartel de advertencia y las columnas en
cero.

#### La columna «prorrateado» decía 0,00 cuando no había prorrateo

Es el único otro cambio visible de números, y es una corrección de forma. Cuando
las costas no llegaban al 25 %, la pantalla ponía **0,00** en la columna de cada
profesional. **Se lee como que ese profesional no cobra nada, y lo que pasa es
exactamente lo contrario**: cobra todo lo que le regularon. Ahora la columna
repite el importe regulado, que no es redundante —es la respuesta—.

#### El banco: 5 fijados pasaron a 7, y sólo uno cambió de número

De los cinco que había, **el reparto por fila de tres salió idéntico carácter
por carácter**, que es lo que había que probar: con la tasa del 3 % adentro de la
base el tope da 22 % y no se movió un centavo. El que cambia es el de la tasa a
mano, que es el arreglo. Se agregaron dos: la tasa fuera de la base —la otra
mitad del mismo arreglo, que no cubría ningún caso— y la tasa que se come el
techo entero.

**Y apareció una cosa que el banco no podía cazar solo.** El driver anterior
hacía `incluirTasaCheckbox.checked = !!campos.incluirTasa`, así que **tres de los
cinco casos corrían con la tasa fuera de la base** —que no es lo que la pantalla
muestra al abrirse— y la configuración por omisión **no la probaba nadie**. Ahora
el driver hace `!== false`: se prueba lo que se ve, y el otro camino se pide
explícito. Es la misma clase de error que el rompe-caché de los iframes: el banco
corría, pasaba, y no estaba mirando la pantalla que el usuario abre.

**Y el `porque` del quinto fijado estaba mal escrito.** Decía «acá NO llega al
25 % y no hay prorrateo» al lado de un `esperado` que prorrateaba $2.200.000.
$2.400.000 más $150.000 es 25,50 %: sí llega. La prosa contradecía al número
que estaba en la misma línea.

**Verificado:** 20 de 20 en `pruebas-no-plazos`, `npm run verificar-contraste` y
`npm run verificar-red` sin novedad, sin desborde horizontal a 375 px —la tabla
hace scroll adentro de su propia caja—, y embebida en el tablero con el alto
exacto y sin errores de consola.

#### Lo que queda abierto, y es del art. 730 y no de la pantalla

**El art. 730 in fine no se computa.** El último párrafo dice que para el cómputo
del 25 % *«no se tendrá en cuenta el monto de los honorarios de los profesionales
que hubieran representado, patrocinado o asistido a la parte condenada en
costas»*. La pantalla no tiene forma de marcar una regulación como del
profesional del condenado, así que **hoy todas entran en la base**, y en un
pleito donde el condenado tuvo letrado propio eso infla las costas computadas y
puede disparar un prorrateo que no corresponde. No se agregó porque es una
función nueva y no una refundación de la forma. **Va acá, que es donde va lo que
está abierto.**

---

### La red de las que no son de plazos, que va antes de refundarlas — 26/8

**`scripts/pruebas-no-plazos.html`, 18 casos sobre las cuatro que no comparten
(hoy 20: los de `prorrateo` se refijaron el 27/8 y entraron dos más)
motor.** Hasta hoy `prorrateo`, `tasa`, `honorarios-mediacion` y
`ejecucion-estado` **no tenían ni una comprobación**, y la decisión de Javier es
refundarlas de cero. Un refactor sin red no se distingue de un error: la red va
primero. Es el mismo orden que se usó con las de plazos, donde el banco de las
pantallas se construyó *antes* de extraer la aritmética.

**Son fijados y no verificados**, y la diferencia importa: no dicen que el número
esté bien, dicen que es el que la calculadora devuelve hoy. Cuando un caso se
derive a mano contra la norma se lo asciende y se escribe el porqué. Los casos
están escritos en **entradas y salidas, no en ids**: cuando la pantalla se
refunda hay que reescribir el driver, y eso es esperado.

Qué cubre cada una, y por qué esos casos:

- **`prorrateo`** (5): el art. 730 CCyC. Se leen los seis números de la pantalla
  **y el prorrateo de cada fila**, porque el total puede quedar bien con las
  filas repartidas mal. Hay un par deliberado —la misma base con la tasa dentro
  y fuera— que es el único que distingue las dos cosas que hace la casilla:
  suma la tasa a la base de comparación pero **no** al total que se reparte.
- **`honorarios-mediacion`** (6): los bordes de la escala. 30 UHOM exactos y un
  peso más, 1000 exactos, el 2 % del ítem G y el tope de 120. Un `<=` cambiado
  por `<` no se ve en ningún otro lado.
- **`tasa`** (3): los tres incisos del art. 4 de la Ley 23.898 que la pantalla
  arma distinto. El de desalojo existe por el multiplicador por seis cánones,
  que es lo que un refactor pierde sin que se note.
- **`ejecucion-estado`** (4): los cuatro cruces de la Ley 25.344 —antes o después
  del 31 de julio, con o sin certificación—, más el 31 exacto, que es el borde.

**Cada caso carga su propia UMA y su propio UHOM.** Las dos calculadoras que los
usan los leen de `data/`, así que un caso que no los fijara pondría el banco en
rojo el día que la CSJN publica un valor nuevo, sin que nada se haya roto.

**Comprobado que falla cuando tiene que fallar:** se movió el tope del ítem G de
120 a 130 UHOM y salieron dos casos en rojo. **Dos y no uno**, y ahí está lo
interesante: el segundo caso ni siquiera cambia de número —da 40 UHOM con
cualquiera de los dos topes— y falla igual, porque el fijado incluye **la frase
con la que la pantalla explica su propia cuenta**. Es exactamente el error del
tope del ítem G que vivió meses: la aritmética estaba bien y el rótulo mentía, y
ninguna comprobación numérica podía cazarlo.

**Y el hook de datos personales bloqueó el commit, con razón aparente.** Los
importes fijados —`1.500.000,00`— matchean el patrón de «número con forma de
DNI». Es texto copiado de la pantalla, así que no se les puede poner el signo de
peso adelante, que es la salida que el patrón ya preveía. **Se le agregó un
lookahead de centavos: un DNI no lleva decimales.** No es aflojar el patrón —no
deja pasar ninguna forma que un documento pueda tener— sino sacarle una que nunca
fue suya. Y como el archivo es la fuente única de los cuatro repositorios, el
cambio vale para los cuatro y se ve en un diff, que es como tiene que ser. Los
importes que sí eran prosa propia se escribieron con el signo, que además es
como se escriben.

#### Tres cosas que costaron encontrar, y las tres eran del driver

Van escritas porque el síntoma no se parece en nada a la causa, que es la marca
de las trampas que vale la pena anotar:

- **`resetCalculator()` de `prorrateo` limpia el monto del proceso.** Llamándolo
  después de cargar los campos, los honorarios sumaban bien y el tope, el 25 % y
  el porcentaje daban cero: se leía como un bug del prorrateo.
- **`honorarios-mediacion` escribe el UHOM del archivo en el campo cuando el
  `fetch` vuelve**, o sea después de que el driver puso el suyo. Fallaba **sólo
  el primer caso** —para el segundo ya había cargado— y el número salía
  plausible. Es la misma forma de falla que el predicado de «página lista» del
  otro banco, y se arregla igual: exigir el texto del estado final.
- **`ejecucion-estado` no lee sus campos al avanzar: lee su propio estado**, que
  mantiene un listener de `input`. Y el iframe se reusa entre casos, así que el
  asistente quedaba parado en el resultado del anterior. Corría el primer caso y
  los otros tres decían «no apareció el paso de la fecha».

---

### `prorrateo` también le pedía la UMA a Google, y el control que lo caza — 26/8

**El barrido de «qué sale del navegador» de esta misma mañana dio una lista
incompleta, y la escribió con toda confianza.** Decía que las únicas dos
calculadoras que consultaban afuera eran `honorarios-mediacion` —arreglada ese
día— y `distancia`. Eran **tres**: `prorrateo.html` le pedía el valor de la UMA a
la misma planilla publicada de Google, en cada carga.

**Por qué no se vio, que es lo que importa.** Se leyeron las once una por una, y
a `prorrateo` se la leyó por lo que calcula. La llamada está a cuatrocientas
líneas del cálculo, adentro de un cargador de CSV con su propio parser de
comillas: un bloque que se lee como infraestructura y se saltea. **La lección no
es «leer con más atención». Es que para una pregunta mecánica —qué hosts aparecen
en estos archivos— hay un control mecánico**, y usar el ojo donde va el control
es exactamente cómo se produce una lista incompleta sin darse cuenta.

**El arreglo:** lee `data/serie-uma.json`, el mismo movimiento que se hizo con el
UHOM y por los mismos dos motivos —abrir la página dejaba de contarle a un
tercero que alguien la abrió, y la planilla es una tabla suelta que se edita a
mano y no la controla nada—. Elige el último valor **cuya vigencia ya empezó**, y
**ahora la pantalla dice desde cuándo rige y con qué resolución**: «Rige desde el
01/07/2026 (Res. SGA 1930/2026)». Antes el campo salía con un número sin
procedencia, o vacío. Si el archivo no se puede leer no se inventa nada: se pide
cargarlo a mano.

#### `npm run verificar-red`

`scripts/verificar-red.mjs`, en CI, sin red y sin `honorio/`. Busca cada host que
aparezca en **las quince páginas que se publican** y exige que esté en una lista
con **el motivo escrito al lado**. Hoy son trece hosts.

Dos listas y no una, porque no es lo mismo:

- **Desconocido** —«no está en la lista»— es «esto es nuevo, decidilo».
- **Prohibido** es «esto ya se sacó a propósito», y el mensaje dice cuándo y por
  qué. Hoy el único es `docs.google.com`.

**No mira si la llamada se ejecuta ni cuándo**, y es deliberado: un host
nombrado en un comentario cuenta igual que uno en un `fetch()`. La pregunta que
contesta es «a quién nombra este sitio», y afinarla para distinguir código de
prosa la volvería otra vez dependiente de leer bien, que es el problema que vino
a resolver.

**Una sola exclusión, escrita a la vista:** `calculadoras/honorarios.html`, que
se retiró el 7/8 y cuya URL publica el aviso de `redirects/honorarios-retirada/`.
El archivo tiene el `fetch` a la planilla y **no llega al sitio**.

**Comprobado que falla cuando tiene que fallar**, con las dos formas: se metió a
mano un `docs.google.com` y un host inventado en `tasa.html`, y salieron los dos
con mensajes distintos y salida 1.

**Y de paso, `*.yml text eol=lf` en `.gitattributes`.** Los workflows llevan
bloques `run: |` que el runner ejecuta como shell, y sin regla propia la copia de
trabajo en Windows se los lleva con CRLF: la próxima edición de una línea
aparece como el archivo entero. Es el mismo agujero que ya se había tapado para
`.sh` y `.mjs`.

---

### Pantalla contra motor, y la prueba de que el control controla — 26/8

**Qué prueba, que no es lo que prueban los otros bancos.** Desde este mismo día
las cinco pantallas de plazos consumen `js/plazos.js` y ninguna tiene aritmética
adentro, así que ya no puede haber dos cuentas distintas. Lo que sí puede haber,
y no lo controlaba nada, es **una pantalla que le pase al motor algo distinto de
lo que dice el formulario, o que muestre algo distinto de lo que el motor le
devolvió**. Un campo leído del `id` equivocado, un mes sin restarle uno, una
casilla que se ignora: el motor contesta perfecto y la pantalla miente igual.

Para cada caso ya escrito —los 21 verificados y los 3 fijados— se corre la
pantalla por su driver y **además se llama al motor a mano, en el mismo iframe y
por lo tanto con el mismo calendario cargado**, con lo que ese formulario debería
significar. Después se exige que las dos salidas coincidan, ya formateadas como
la pantalla las muestra.

**El mapeo de campos a opciones y el formato de la fecha están escritos otra vez
a propósito**, en vez de importarlos de algún lado. Un control que reusa el
código que controla no controla nada: lo que se comparan son dos lecturas
independientes del mismo formulario. Si una pantalla cambia cómo interpreta un
campo, este archivo tiene que cambiar también, y eso es la señal, no la molestia.

**Y se comprobó que falla cuando tiene que fallar**, que es lo único que
distingue un control de un sello verde. Se rompió `entre-fechas` a propósito
—`soloHabiles: false` fijo, o sea la casilla de días hábiles ignorada— y las dos
filas de hábiles se pusieron en rojo diciendo exactamente qué pasó: *«la pantalla
muestra 18 · el motor devuelve 3»*. Con el archivo revertido, **75 de 75**.

Un caso puede salir **«sin cruce»** y no es una falla: es una entrada para la que
el motor no afirma una fecha —año sin Acordada, objetivo inhábil, plazo mal
escrito— y entonces no hay dos valores que comparar. Hoy no hay ninguno.

**Lo que este cruce no prueba es que el motor esté bien.** Para eso están los
verificados, que comparan contra una fecha deducida a mano contra las Acordadas,
y `npm run verificar-calculos`.

---

### El dibujo en las tres que faltaban — 26/8

**Lo primero fue no copiar el de `vencimientos`.** El pendiente lo decía y tenía
razón: las tres contestan otra pregunta, y un calendario que no explica nada es
peor que ninguno, porque un dibujo se lee con más confianza que una frase.

**El dibujo salió de `vencimientos.html` a dos archivos compartidos** —
`calculadoras/js/dibujo-plazo.js` y `calculadoras/css/dibujo-plazo.css` —. Cuatro
copias de la misma grilla en cuatro archivos sin build se desincronizan: es el
mismo argumento por el que `problemaDeDatos()` vive en el calendario y no en cada
pantalla.

**El módulo decide cómo se dibuja un día; no decide qué significa.** Recibe un
mapa de marcas ya armado —clase, número de orden y el texto del globo— y no mira
ni un resultado del motor. Si interpretara el cómputo, sería una segunda
implementación del cómputo. Lo que significa cada día lo arma cada pantalla, que
es donde está la diferencia.

**Verificado antes de tocar nada y después:** los mismos 10 casos de
`vencimientos` —cédula, automática, días de nota, ampliación, feria de julio y de
enero— **idénticos carácter por carácter**, comparados por longitud y suma de
control del HTML que produce el dibujo. La extracción movió el archivo y nada más.

Ahí apareció el único desvío, y vale anotarlo porque es la clase de cosa que se
publica sin que nadie la vea: en la primera pasada faltaban seis caracteres por
caso. Era la clase `fuera` del día de la notificación, que no está contado ni
salteado y por lo tanto no entraba en ninguna de las dos vueltas. Se veía como un
gris que faltaba en una celda; se encontró porque la comparación era por
longitud y no por «se ve igual».

#### `regresiva`: el dibujo reemplazó la traza

Contaba hacia atrás y ya listaba día por día: una fila por cada uno, con «OK
CONTADO» o «X NO CONTADO» al lado. **La lista es el dibujo sin la forma**, y
repetía el problema que en `vencimientos` ya se había resuelto agrupando: doce
renglones idénticos de feria tapando al feriado suelto.

**Qué explica el dibujo acá, que el número no:** hasta dónde tuvo que retroceder
el conteo. Un fin de semana y una feria **adelantan** la fecha límite —dan menos
tiempo, no más— y eso es lo contrario de lo que la intuición espera. El caso que
lo muestra: objetivo el 5/8/2026 con 10 días de antelación no da fines de julio,
da el **6 de julio**, porque la feria de la Acordada 11/2026 se come doce días.

Los días se numeran **desde el objetivo hacia atrás**: el 1 es el hábil anterior
al objetivo y el último es la fecha límite. Numerarlos al revés diría que el
cómputo empieza en la fecha límite, que es justo lo que todavía no se sabe.

**Esto sacó una pantalla y es una decisión, no una consecuencia.** Si la traza
hacía falta, vuelve: son veinte líneas y están en el historial.

De paso salieron de esa pantalla cuatro colores planos —`#fafdff`, `#e6edf4`,
`#1e7a44`, `#b13e3e`— más los dos del cartel de error, que en tema oscuro
pintaban una lista casi blanca con letra casi negra. Y el `@media` de 700 px
estaba escrito al revés: repetía `.container` con los mismos 40 px de relleno del
escritorio, así que en un teléfono la tarjeta seguía comiéndose el ancho.

#### `entre-fechas`: lo que el dibujo muestra son las dos casillas

No computa un vencimiento: cuenta. Así que lo que el número no contesta son dos
cosas, y las dos se ven en la grilla:

1. **Qué días entraron.** Las casillas de incluir el inicio y el fin mueven el
   total sin mover nada en pantalla: se destilda una, el número baja en uno, y no
   queda con qué saber cuál día se fue. Ahora **las dos fechas cargadas están
   siempre marcadas**, y se ve si quedaron adentro o afuera.
2. **Cuáles se descontaron y por qué**, cuando se cuenta en hábiles.

**Y la diferencia entre los dos modos se lee de un vistazo:** en días corridos el
bloque sale entero, porque el sábado también cuenta; en hábiles sale picado.
Atenuar el fin de semana en un conteo de corridos sería dibujar lo contrario de
lo que el número dice.

**`entreFechas()` ahora devuelve `contados`**, los días que entraron al conteo.
Es aditivo —no toca una sola cuenta— y existe por una razón concreta: si el
dibujo caminara el rango restando los excluidos, sería un segundo conteo, y el
último número de la grilla podría no coincidir con el total. Así coinciden porque
**son el mismo conteo**, y eso convierte al dibujo en un control: si alguna vez
discrepan, se ve sin abrir nada.

**El período no tiene tope, así que el dibujo sí:** arriba de doce meses no se
dibuja. Y acá **sí se escribe una línea diciéndolo**, a diferencia de
`vencimientos`, donde no dibujar coincide siempre con no tener resultado. Acá hay
un resultado y el dibujo desaparecería sin explicación.

#### `caducidad`: no es un calendario, y ésa es la decisión

**Es la única de las cuatro que no dibuja una grilla, y el motivo no es que
ocupara medio año.** Es un plazo en meses: se cuenta de fecha a fecha (art. 6
CCyC) y adentro corren todos los días salvo los de feria (art. 311 CPCCN). No hay
días salteados que mostrar.

**Y hay una razón más fuerte, que es la que decide.** Pintar el plazo día por día
diría que el cómputo avanza día por día, y no es lo que hace: avanza por tramos
mensuales anclados al día del acto impulsor, y después se corrige. El propio
motor deja escrito que las dos lecturas coinciden en 56 de 67 casos y **difieren
en los once cuyo acto impulsor cae adentro de la feria de invierno**. Un
calendario sería exacto casi siempre, que en esta materia no alcanza: mentiría
con la autoridad que tiene un dibujo, y justo en el caso raro.

Lo que sí hay que explicar es **la secuencia de correcciones**, y eso es una línea
de hitos. El caso de Javier, entero:

> 21/6/2025 · Último acto impulsor
> 21/12/2025 · 6 meses contados de fecha a fecha desde el acto impulsor (art. 6 CCyC)
> \+ 12 días · Feria judicial de invierno de 2025, del 21/7 al 1/8: el plazo no corre y el vencimiento se corre otro tanto (art. 311 CPCCN)
> 2/1/2026 · Caía adentro de la feria de enero 2026, que no computa: se corre un mes
> 2/2/2026 · Se produce la caducidad de la instancia

Reemplaza a las «Observaciones», que decían lo mismo en tres renglones sin orden,
sin las fechas intermedias y **sin una sola tilde** —«Se excluyo enero», «Se
atraveso la feria», «dias adicionados»—, que es texto que ve el usuario.

**`caducidad()` ahora devuelve `vencimientoNominal`**, dónde caen los meses antes
de sumarle la feria. Es aditivo y existe para no reconstruirlo restando días de
este lado, que sería una segunda cuenta.

Dos cosas que salieron de probar los casos raros y no de mirar la pantalla buena:

- **La negativa dejaba los hitos del cálculo anterior.** Un «No se puede
  calcular» con la explicación de otra fecha debajo es la peor variante posible,
  porque la explicación es lo que se lee con más confianza. Ahora se barren.
- **Sin feria de por medio, el hito de los meses y el final son la misma fecha**,
  y dos renglones seguidos con la misma fecha se leen como un error del programa.
  En ese caso la regla se dice en el último hito y el renglón no sale.

#### Qué se verificó

- **`scripts/pruebas-calculadoras.html`: 51 de 51 pasan**, incluidos los 21
  corridos otra vez adentro del tablero. **Ningún número se movió en ninguna
  pantalla**, que es lo único que este trabajo no podía hacer.
- Los siete bancos del repositorio en verde: `verificar-calculos`,
  `verificar-plazos`, `verificar-contraste`, `verificar-conectores`,
  `verificar-docs`, `verificar-series` y `verificar-escribiente`.
- **Sin desborde horizontal a 375 px** en las cuatro.
- Contraste de los hitos, calculado sobre la superficie real —`--accent-tint`
  sobre `--card`, que es donde vive el panel de resultado—: peor **5,33** en
  claro y **5,35** en oscuro.
---

### Las tres que faltaban consumen el motor — 26/8

**Con esto, ninguna de las cinco pantallas de plazos tiene aritmética adentro.**
Las tres se hicieron con el método de [Por dónde seguir](#por-dónde-seguir)
entero y una por una, sin cortar ninguna por la mitad. En total **6604 casos
capturados de la pantalla antes de tocar nada y vueltos a correr después:
idénticos, los 6604.**

| pantalla | casos | qué barre |
|---|---|---|
| `caducidad` | 1132 | 6 años × 12 meses × 4 días × 4 plazos |
| `entre-fechas` | 4608 | 6 × 12 × 2 días × 4 distancias × 4 combinaciones de puntas × hábiles y corridos |
| `regresiva` | 864 | 6 × 12 × 3 días × 4 plazos |

Y `plazos.js` pasó de dos funciones de cálculo a cinco. **Sigue sin decidir nada
nuevo**: es transcripción, y las tres convenciones de fecha conviven adentro sin
unificarse —mediodía UTC en `vencimientos`, medianoche local con `setHours` en
`mora`, medianoche local pelada en estas tres— porque unificarlas es elegante y
mueve un número de algún lado.

#### `caducidad`

**Qué se movió de lugar.** El cómputo del art. 310 vivía adentro del `submit` de
`caducidad.html`, entre `document.getElementById`: el ancla del día, el salteo
de enero, el punto fijo de la feria de invierno y el cómputo con inhábiles.
Ahora es `Plazos.caducidad()`, y la pantalla quedó en 77 líneas donde había 265:
lee el formulario, llama al motor y escribe. **Es transcripción**: no se
simplificó una línea, ni el bucle que arranca en `corrimientos = 0` ni la
iteración a doce vueltas.

**No comparte nada con `vencimiento()`, y eso está bien.** Es un plazo en meses
—de fecha a fecha, art. 6 CCyC— y los inhábiles corren adentro salvo los de
feria (art. 311 CPCCN). Vive al lado y no encima.

**Cómo se probó que no se movió un número.** Antes de tocar nada, la matriz:
seis años por doce meses por cuatro días por cuatro plazos, **1132 casos**,
capturados de la pantalla servida —con el detalle y el cómputo oculto, no sólo
la fecha—. Después de migrar, los mismos 1132 en el mismo orden: **idénticos**,
con el mismo SHA-256 de la corrida entera (`408fedbd…`). Y las 51 filas de
`pruebas-calculadoras.html` siguen en verde.

**La trampa del caché, otra vez, y ahora con la forma exacta:** el `?v=` del
HTML **no toca los subrecursos**. La primera corrida después de migrar encontró
el `plazos.js` **anterior** todavía en memoria —`Plazos.caducidad` no existía— y
sólo se vio porque el arnés lo comprueba antes de medir en vez de suponerlo. Lo
que sí funciona es `fetch(url, { cache: 'reload' })` sobre cada script y recién
después recargar: eso reemplaza la entrada de caché. **Toda medición contra el
sitio servido tiene que empezar comprobando que el código que corre es el que se
acaba de escribir**, y no que la URL llevaba un parámetro distinto.

**Lo único que cambió de salida, y cambia para bien.** Con «Plazo de
prescripción menor» elegido y el campo **vacío**, la calculadora seguía de largo
con un plazo `NaN`: el bucle de meses no corría ni una vez y la pantalla
contestaba que **la caducidad se produce el día del último acto impulsor**.
Verificado en pantalla antes de tocarlo: 15/3/2025 con el campo vacío devolvía
«15/3/2025». Ahora dice que falta el plazo. Es la única diferencia de las 1132 y
va de un número equivocado a una negativa.

**Y lo que quedó anotado sin tocar:** el **cómputo con inhábiles y feriados no
se muestra**, y no desde ahora. Vive en un `div.hidden-computation` con
`display:none` desde antes de la extracción: se calcula entero, se escribe en el
DOM y nadie lo ve. Se transcribió igual, con el motivo escrito en `plazos.js`.
**Hay que decidir si se muestra o se saca**, y las dos cosas son decisión de
Javier: mostrarlo agrega una segunda fecha a una pantalla que responde una sola
pregunta, y sacarlo tira una cuenta que alguien escribió a propósito.
**Y hay un argumento más para no dejarlo así**, que salió del arreglo de enero:
ese cómputo oculto tiene su **propia** regla para salir de la feria de enero
—`setMonth(+1, 1)`, o sea el primer día del mes siguiente— distinta de la que
usa la cuenta visible. Dos reglas para la misma suspensión, y una de ellas
invisible, es exactamente la forma del bug que se acaba de cerrar.

#### `entre-fechas`

**Es la única de las cinco que no computa un vencimiento: cuenta.** Y la única
que puede contestar con el calendario incompleto, porque los días corridos no
dependen de ningún feriado. Por eso la auditoría se reinicia **sólo** cuando se
cuentan hábiles: reiniciarla siempre haría que un conteo de corridos borrara la
auditoría de otro cálculo. Eso estaba así y se conservó.

La matriz son 4608 casos y cubre las dos puntas por separado —incluir el día de
inicio, el de cierre, los dos, ninguno—, que es donde una migración se
equivocaría sin que se note: un día de más o de menos en un extremo no cambia la
forma del resultado.

**Un cambio de texto y no de número:** el motivo de exclusión tenía un
`|| 'Inhabil'` sin tilde como último recurso, en texto que ve el usuario. Es
inalcanzable —si el día no es hábil, el motor siempre da un motivo— y por eso
sobrevivió. Quedó `'Inhábil'`. Ninguno de los 4608 casos lo produce, así que la
comparación no lo vio, y se anota acá para que no parezca una diferencia
escondida.

#### `regresiva`

Contesta al revés que las demás —hasta cuándo hay tiempo para algo que tiene que
estar N días hábiles **antes** de una fecha— y tiene una particularidad que hubo
que preservar con cuidado: **cuando se contaron todos los días, el cursor no
retrocede una vez más.** La fecha límite es el último día contado y no el
anterior a él. Escrito de otra forma, el resultado se va un día.

**Y el orden de los tres avisos importa, así que lo fija el motor y no la
pantalla:** primero el dato faltante, después el objetivo inhábil, y recién
después el plazo mal escrito. Al revés, una fecha de feria con el plazo vacío se
quejaría del plazo y no de la fecha, que es lo que el usuario tiene que
corregir. Por eso `regresiva()` **no lanza** cuando el objetivo es inhábil: eso
no es un error, es una respuesta.

**Y es la única de las tres que además se arregló**, el mismo día y por decisión
de Javier: contar hacia atrás se salía de la ventana de cobertura sin avisar.
Cambian 121 de 10.955 conteos y son exactamente los que antes devolvían una
fecha anterior a 2021. El detalle está en [`HISTORIA.md`](HISTORIA.md).

#### El banco pasó de 34 a 132 comprobaciones

Y ninguno de los testigos sale del motor: son los que las pantallas mostraban
antes de la extracción. Adentro van los diez de caducidad, el ancla que no se
arrastra —el bug del 18/8—, el salteo de enero, los días de feria descontados,
los totales de `entre-fechas` con y sin puntas, y las seis fechas límite de
`regresiva`. Y tres barridos con invariantes: que **ningún vencimiento de
caducidad cae en la feria de invierno** (4260 cruces), que los días corridos dan
la cuenta exacta y cada día del tramo está contado o excluido sin un tercer
estado (960 tramos), y que la regresiva cuenta exactamente los días pedidos y
deja el límite en un hábil anterior al objetivo (780 objetivos).

**Los dos bugs abiertos los encontraron esos barridos**, que es para lo que
existen.

#### Un testigo mío estaba mal, y conviene saber por qué

El primer bloque de pruebas de `regresiva` fijaba «40 hábiles antes del 1/2/2026
dan el 15/10/2025», copiado de la captura. **El 1/2/2026 es domingo**: la
pantalla no calcula, avisa que el objetivo es inhábil y **deja en el DOM el
resultado del caso anterior**. El valor copiado era el de otro caso.

La comparación no lo notó ni podía: compara la pantalla contra sí misma, y una
salida vieja es igual de vieja de los dos lados. Lo cazó correr las pruebas en
Node, donde no hay DOM que se quede con nada.

**De ahí la regla, que vale para cualquier arnés que lea una pantalla:** una
matriz sirve para comparar antes y después, pero **un testigo tiene que salir de
una corrida que efectivamente calculó**. Los días que la matriz barre —1, 15 y
28— caen todos en fin de semana en febrero y marzo de 2026, así que para esos
meses no hay ningún testigo posible; el caso que cruza enero quedó como
invariante —ningún día de enero se cuenta— y no como número copiado.

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

**Y las tres que faltaban se migraron el mismo 26/8**, con el mismo método:
ver [abajo](#las-tres-que-faltaban-consumen-el-motor--268). Desde entonces
**ninguna de las cinco pantallas de plazos tiene aritmética adentro.**

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

- **~~Ninguna prueba los toca.~~ Hecho el 26/8: `npm run
  verificar-conectores`, 46 comprobaciones, en CI.** Levanta el HTTP en un
  puerto propio —8799, para no dar un falso verde contra un conector que
  alguien tenga abierto— y le habla al MCP por stdio. No cubre aritmética,
  que ya cubre `verificar-plazos`: cubre lo que puede romperse de un
  transporte y no de una cuenta —que arranque, que el JSON-RPC siga siendo
  JSON-RPC, que no cambie el nombre de un campo, que un 404 conteste JSON y
  no HTML— y **sobre todo que un dato faltante no devuelva una fecha**, que
  es la única regla del conector que no se puede reparar después.
  Lleva el caso testigo del hermano como regresión, el mismo plazo por GET y
  por POST exigiendo que den idéntico, y el plazo mandado como número y como
  texto por MCP, que el esquema declara `string` porque así llega de un
  modelo. Y encontró de entrada que el campo se llama `habil` y no
  `esHabil`, que es justo la clase de cosa por la que existe.
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

**Ninguno.** Los dos de `tasa` que se abrieron el 27/8 se cerraron el mismo día,
después de cubrirlos con casos de prueba:

1. **Cobraba el doble en tercerías y en reinscripciones de hipotecas.** Juntaba
   tres supuestos bajo «Otros» con el 3 % para los tres, y el art. 3 reduce dos
   de los tres al 50 %. Una tercería de $10.000.000 mostraba $300.000 y le
   corresponden $150.000.
2. **Un campo de titularidad que nadie había tocado devolvía $0,00**, igual que
   si se hubiera escrito un cero.

Ver [abajo](#los-dos-bugs-de-tasa-cerrados--278).

Los dos que abrió la extracción del 26/8 —la caducidad venciendo adentro de la
feria de enero y la regresiva contando fuera de la ventana de cobertura— se
cerraron el mismo día, los dos por decisión de Javier y con el caso en la mano.
Están en [`HISTORIA.md`](HISTORIA.md).

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
- **~~`sitio-estatico` de `.claude/launch.json` reasignaba el puerto y Python
  no se enteraba.~~ Arreglado el 26/8** sacándole el `autoPort`: el puerto está
  escrito en `runtimeArgs` (`http.server 4180`) y no lo puede reasignar nadie.
  Con `autoPort` encima, un 4180 ocupado —lo dejan ocupado los servidores de
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
