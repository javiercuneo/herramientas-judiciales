# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-08-31 · rama `main`

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

**El frente grande está cerrado.** El cómputo de plazos vive en
`calculadoras/js/plazos.js` y ninguna de las cinco pantallas de plazos tiene
aritmética adentro; se expone por HTTP local y por MCP en `conectores/`; las
cuatro que no son de plazos se refundaron de cero, cada una con su banco puesto
antes de tocarla; y **las diez pantallas siguen el mismo patrón, sin excepción**.
El detalle de esos días está en [`HISTORIA.md`](HISTORIA.md).

**La puerta es el tablero**, no el listado: `calculadoras/tablero.html` reúne las
diez vivas y `index.html` lleva ahí primero, con el plano de lo que hay adentro.
Las páginas sueltas siguen publicadas y sus direcciones no cambian, pero
**`index.html` ya no las enlaza una por una**: sólo se enlaza lo que NO está en
el tablero. Detalle en [El tablero de herramientas](#el-tablero-de-herramientas).

**No queda nada urgente ni bloqueante, y no hay bugs abiertos.** Lo que sigue
está en [Por dónde seguir](#por-dónde-seguir); lo abierto, en
[Pendientes](#pendientes).

---

## Bugs abiertos

**Ninguno.** Los últimos, con su caso de prueba, en
[`HISTORIA.md`](HISTORIA.md).

**El último cerrado es el que conviene tener presente**, por la forma: el 2/9
el calendario de `vencimientos` dibujaba agosto encima de septiembre **con el
motor intacto**, por un nombre de clase repetido entre el dibujo compartido y el
`<style>` de la pantalla. Lo cerró medir las columnas, no mirar la captura.

---

## Por dónde seguir

**Lo que queda abierto, y es una sola cosa:**

- **Faltan las capturas del tablero en la landing.** Hoy hay un plano dibujado
  en SVG, que es la estructura y no la pantalla. Una captura se hace cuando el
  tablero deje de moverse: las de Honorio ya envejecieron dos veces. **Y hay
  que pedir el panel del navegador abierto para hacerlas**: con el panel oculto
  las capturas no componen.

**El método es el de siempre:** leer este archivo, correr el control que cubre
lo que se va a tocar *antes* de tocarlo, y que cualquier número que se mueva sea
porque se decidió moverlo.

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

- **`prorrateo` no computa el art. 730 in fine, y no lo va a computar.**
  Decisión de Javier del 31/8: **la herramienta no puede resolver qué entra en
  la base.** El último párrafo excluye del cómputo del 25 % los honorarios de
  los profesionales de la parte condenada en costas, pero si además entra el
  mediador es criterio de cada juzgado ---«todo concepto» de costas contra
  honorarios de la mediación *prejudicial*, o sea anteriores a la instancia---.
  Donde la ley no resuelve sola, esta casa muestra los criterios y decide el que
  firma. **Lo que falta entonces no es una función: es un aviso al lado del
  campo** que diga que los honorarios de la condenada en costas no van, y que
  con el mediador hay dos criterios. Lo que sí es función nueva ---mostrar
  cuándo el recorte excede el 33 %, que es el umbral con el que se argumenta
  confiscatoriedad--- está en `IDEAS.md`.
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

- **Lo que se oculta adentro del tablero se marca con `solo-suelta`, y es UNA
  regla.** La ponen las calculadoras sobre lo que sólo tiene sentido con la
  página abierta por su cuenta: el pie de autoría y la línea de cobertura del
  calendario, que el tablero dice una vez arriba. **Una herramienta nueva tiene
  que llevar esa clase en su pie** o el tablero va a mostrar la misma firma diez
  veces. **Lo que NO la lleva, a propósito:** el aviso que sale al calcular
  cuando el plazo toca un año sin Acordada, porque ése frena un número y tiene
  que estar donde se pide el número.
- **El permalink y el imprimible existen en `tasa` y en `prorrateo`.** Faltan en
  las demás y no está decidido si van. **La decisión que hay que repetir si se
  extienden:** el caso va en el **fragmento** (`#…`), que no viaja al servidor.
  Una URL con el caso adentro se pega en un mail, en un chat y en un historial;
  un monto de proceso y una fecha de notificación no son datos personales, pero
  sí son datos de un expediente concreto. Y la UMA **no** va en el enlace: es un
  dato del sistema y no del caso, y guardarla congelaría un valor viejo adentro
  de un enlace que se abre meses después.
- **Los cuatro criterios con los que se despejó `tasa` valen para las diez.** Se
  pregunta **el caso y no la mecánica**; lo que el sistema puede decidir **lo
  decide** ---un desplegable de una sola opción es una decisión disfrazada de
  pregunta---; un campo que no aplica **no ocupa lugar**; y el hint que dice a
  qué inciso corresponde lo que se está cargando **es parte de la respuesta y va
  a la vista** ---lo que se esconde es la explicación larga, nunca el mapeo---.
  Cada uno está escrito con su porqué en el `<style>` de `tasa.html`.
  **El barrido de texto está hecho en las diez** ---las cinco de plazos el 26 y
  el 27/8, `tasa` el 31/8 y las tres que faltaban el 1/9---. **Una distinción
  que vale para el próximo:** el *usted* —«Ingrese», «Verifique»— **no es tuteo
  y no es un error**; es otro registro. Lo que hay que sacar es el imperativo de
  *tú*, y lo que además conviene sacar es el usted **suelto entre voseo**, que
  fue lo único que quedaba el 1/9: un `Ingrese un UHOM válido.` en una pantalla
  que dos renglones más arriba dice `Cargá el monto del asunto`.
- **El buscador de plazos salió con el chip «en desarrollo», y es lo único de
  este repositorio publicado sin curar.** Es decisión de Javier del 31/8 —«lo voy
  verificando en producción… es texto de ley, a lo sumo podrá faltar un plazo»—.
  **Ese es exactamente el riesgo que tiene y el que no:** los 198 plazos salen de
  un barrido mecánico sobre el texto, así que un número mal es improbable y una
  ausencia no lo es. Lo que el barrido **no** distingue es qué plazo corre contra
  la parte y cuál contra el juez —art. 34— o contra el perito, y por eso cada
  resultado muestra **la oración literal del artículo**: leída, no se confunde.
  Cuando Javier termine de verificarlo, sale el chip.
- **Los atajos y el buscador leen un solo archivo, y eso es la decisión.**
  `data/plazos-cpccn.json` tiene la cantidad, la unidad, el artículo y la oración
  literal; `vencimientos.html` **no tiene ningún número de plazo escrito
  adentro**. Dos listas del mismo plazo se desincronizan, y cuántos días tiene un
  traslado no puede depender de cuál se miró. Si el archivo no carga, ni los
  atajos ni el buscador aparecen y el campo se escribe a mano: son comodidades,
  no el cálculo.
- **El archivo se regenera y no se parchea.** `npm run barrer-plazos-json` lo
  rehace entero desde el texto del Código; lo único a mano es la constante
  `CURADO` de `scripts/barrer-plazos-cpccn.mjs` —los cuatro atajos y dos notas—,
  que se aplica por `cita|cantidad|unidad`. **Si una entrada curada deja de
  matchear, el script aborta** en vez de seguir: un atajo perdido en silencio no
  se vería.
- **Sólo los plazos en días llenan el campo.** Los nueve en meses y los cinco en
  horas se muestran y no se pueden apretar, con el motivo al lado. Escribirle 6 a
  un plazo de seis **meses** daría una fecha plausible y equivocada, que es la
  peor clase de resultado que esta pantalla puede dar.
- **Un rótulo de atajo no puede redondear una regla.** El botón de 5 días dice
  «apelación, traslados y vistas» y no nombra las excepciones, aunque el pedido
  las incluía: los 5 días de excepciones son los del **ejecutivo** (art. 542) y
  en el ordinario van con la contestación de la demanda (art. 346), o sea dentro
  de los 15 del art. 338. La precisión entra en la línea que aparece al elegir
  el atajo, que es donde hay lugar. **Decir de menos no miente; redondear sí.**
- **`uma-uhom` ya no habla de demoras, por decisión de Javier del 31/8**
  —«suena como que le critico a la Corte lo que tardó»—. Salieron la columna, su
  nota, la prosa y las tres cifras grandes. **La fecha del acto se quedó**: es
  un dato y no una demora, y dice si un valor ya existía el día de la
  regulación. El crudo sigue en `data/serie-uma.json`, con `sin_demora` y todo.
- **La imagen de enlace de la UMA no está en Archivo.** `npm run og-uma` la arma
  desde las series, pero escribe el PNG a mano y dibuja las letras con un
  tipografiado de trazos: rendir Archivo pediría un motor de fuentes en Node o
  un paso por el navegador. **Se regenera cuando se carga un valor nuevo en las
  series**, y lleva la vigencia al lado del número para que una imagen vieja
  compartida en un chat siga diciendo algo cierto.
- **`www.javiercuneo.com.ar` no resuelve**, si se lo quiere: va un CNAME `www` →
  `javiercuneo.github.io` en Cloudflare, gris.

### Del lado de Honorio: mudado, no hay nada que hacer acá

Los tres puntos de `scripts/actualizar-uma.mjs` que estuvieron anotados acá desde
el 24/8 **se mudaron el 1/9 al `ESTADO.md` de Honorio**, a «Deudas anotadas a
propósito», que es donde se van a cerrar. De este lado quedan las series con las
que se calibran —`data/serie-uma.json` y `data/serie-uhom.json`— y no hay que
hacerles nada.

Lo que todavía no existe va en `IDEAS.md`, que es cuaderno interno y **no se
versiona** ---está en `.gitignore`, así que no se le puede poner un enlace---:
acá van sólo los pendientes de lo que ya está construido.

---

## Qué sale del navegador

**Lo contesta `npm run verificar-red`, y no una lectura.** La primera versión de
esta lista se hizo leyendo las calculadoras una por una y se equivocó; el detalle
está en [`HISTORIA.md`](HISTORIA.md). Lo vivo:

- **`distancia` es la única que manda algo que el usuario escribió**: los nombres
  de localidad van a `apis.datos.gob.ar`, a `geocoding-api.open-meteo.com` y a
  `router.project-osrm.org`. **Cuando el caso lo resuelve la tabla de la Corte no
  se consulta a nadie**, porque esa tabla es un archivo de este sitio.
- **Ninguna calculadora promete nada**, así que no hay promesa incumplida. La
  única promesa de privacidad es la de Escribiente, sostenida con la CSP.
- **`tasa` arma una URL con el caso y tampoco sale**: va en el **fragmento**, que
  no viaja en ningún request.
- **`calculadoras/honorarios.html` le pide a una planilla de Google**, y es la
  excepción que no hay que arreglar: `pages.yml` publica en su URL el aviso de
  `redirects/honorarios-retirada/`, así que ese archivo no llega al sitio.

**Y el peso del aviso es una decisión, del 1/9.** En `distancia` era un bloque
grande arriba de todo, y decía de más en dos sentidos: gritarlo ahí insinúa que
en el resto del sitio sí sale algo —que es al revés—, y el dato es **una
localidad**, que no identifica a nadie y no viaja con nada que la ate a una
persona ni a un expediente. Ahora es un `<details>` cerrado, **entero y sin
recortar nada**: la promesa no se afloja, cambia el volumen.

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
| `npm run verificar-acordada` | Que la tabla de la Acordada 5/2010 diga lo que dice el anexo: 90 |
| `npm run verificar-distancia` | El cómputo del art. 158 y la búsqueda en esa tabla: 64 |
| `npm run verificar-red` | Qué terceros nombran las quince páginas que se publican, contra una lista con el motivo al lado de cada uno |
| `npm run verificar-escribiente` | El motor de Escribiente: 184 |
| `npm run verificar-honorio` | Las cinco cifras que este repositorio sigue del motor |
| `npm run verificar-docs` | Que los documentos de dominio no citen artículos ni archivos que no existen |
| `npm run verificar-estado` | El presupuesto y la higiene de este archivo |

Y **tres** que corren en el navegador, con el sitio servido y no con `file://`:

- **`scripts/pruebas-calculadoras.html`** cubre **las pantallas** de plazos: 75
  filas —21 verificados a mano, 6 invariantes, 3 fijados, los 24 cruzados contra
  el motor, y los 21 verificados otra vez adentro del tablero—, **las 75
  escritas y las 75 pasando**. Maneja las cinco
  por iframe y compara lo que muestran. **Los iframes llevan rompe-caché**: sin
  él las pruebas corren contra la versión anterior de la calculadora, que es la
  peor forma de falla porque parece un bug del cambio que se acaba de hacer.
- **`scripts/pruebas-tablero.html`** cubre **la navegación** del tablero: **37
  comprobaciones, las 37 pasando**, en ocho grupos —las pestañas, que las dos
  regiones sean independientes, el enlace directo por `#pestania`, las teclas,
  las flechas, el montaje perezoso y el estado vivo, lo que el CSS inyectado le
  hace al marco, y lo que va como enlace—. **Existe porque una pestaña que no
  abre no mueve ningún número**, así que el banco de al lado no la ve, y el
  tablero es la puerta desde el 31/8: si la navegación se rompe, las diez
  herramientas calculan perfecto y no llega nadie. Encontró un bug publicado la
  primera vez que se corrió. **Cada prueba abre su propio tablero**: varias
  dependen del estado de arranque —que la región de abajo empiece vacía, que el
  hash inicial mande— y ésas no se pueden correr sobre uno que ya se tocó.
- **`scripts/pruebas-no-plazos.html`** cubre las cuatro que no son de plazos:
  **60 fijados** sobre `prorrateo`, `tasa`, `honorarios-mediacion` y
  `ejecucion-estado`. Se construyó el 26/8 porque era la condición para poder
  refundarlas: una reescritura sin red no se puede distinguir de un error.
  **Los casos de `tasa` se remapearon dos veces sin que un solo número se
  moviera** —el 27/8 al separar los dos ejes y el 31/8 al invertir la
  pregunta—, y eso es exactamente para lo que están. Los diez del 31/8 cubren
  **cómo se lee un importe pegado**, las tres reducciones del art. 3 que no
  tenían ninguno —mensura, recurso directo y quiebra contra concurso—, y las
  **dos cosas que no se ven en ningún importe**: la casilla del testamento de
  extraña jurisdicción, que cambia la cita y nada más, y los dos momentos de la
  suma fija.

**Las tres se arrastran con el panel del navegador oculto** —de seis segundos a
varios minutos— porque los iframes no dibujan. No es que estén rotas.

---

## El tablero de herramientas

`calculadoras/tablero.html`, **y desde el 31/8 es la puerta**: `index.html` lo
pone arriba del listado, en bloque propio, y el listado de tarjetas sueltas
quedó abajo como referencia. Decisión de Javier ---«ahí debe vivir todo, y no
herramientas sueltas en links sueltos»---.

**Diez herramientas embebidas en dos regiones, más dos enlaces.** Arriba las
seis de plazos ---`vencimientos`, `distancia`, `caducidad`, `entre-fechas`,
`regresiva` y `mora`--- en una barra de pestañas, con teclas 1-6 y flechas.
Abajo, después de un corte y con título propio, **«Honorarios y otros»**:
prorrateo, tasa, honorarios de mediación y `ejecucion-estado`. Cada una es un
iframe de la calculadora publicada, **sin una línea modificada de ninguna**.
Carga perezosa, estado vivo al volver, enlace directo por `#pestania`.

**Arriba de todo, la portada:** la fecha de hoy con si cuenta o no, el valor
vigente de la UMA y del UHOM, la cobertura del calendario y las cuatro salidas
---Honorio, la landing, la guía y el correo---. Los tres datos no dependen de
qué pestaña estés mirando, así que se dicen **una vez** acá y no una vez por
calculadora: la fecha vivía adentro de `vencimientos` y los dos valores, en
`uma-uhom.html`. El tablero carga el calendario sólo para eso; el cómputo de
cada calculadora sigue pasando adentro de su propio marco.

**Las teclas 1-6 se rompieron dos veces, de dos formas distintas, y las dos
estuvieron publicadas.** La primera: un evento de teclado no cruza de un iframe
al documento de arriba, así que el foco vivía adentro del marco y el oyente
estaba afuera —se engancha el mismo oyente adentro de cada marco al montarlo—.
La segunda, hasta el 1/9: `HERRAMIENTAS` guardaba **copias** de los items y
`construir()` escribe el `atajo` sobre el item, así que la búsqueda no lo
encontraba nunca. **Las dos veces la pestaña siguió dibujando su número.** Por
eso `pruebas-tablero.html` no comprueba que «alguna tecla haga algo», sino que
**cada tecla abra la que dice su propio badge**: es la promesa que se rompió.

**Las cuatro decisiones que lo sostienen**, para no revisarlas sin saber por qué
están:

- **Existe porque once herramientas separadas pueden discrepar en silencio
  durante años y dos pestañas del mismo marco no.** El bug de la feria vivió
  porque nada obligaba a que dos calculadoras se miraran. No es comodidad. Que
  además sea la puerta es posterior y no reemplaza este motivo.
- **Iframes y no fusión del markup.** Fusionar cinco HTML tiene colisiones de
  `id` reales —`plazo` está en `caducidad` y en `vencimientos`; `dia`/`day`,
  `mes`/`month`— y cada una es una oportunidad de mover un número.
- **Las que no son de plazos van en una región aparte y no como pestañas de la
  misma barra.** Entran porque el flujo es el mismo, pero un rótulo de grupo
  adentro de la misma barra no alcanzaba: la fila de arriba son las seis que se
  usan todos los días y tienen atajo numérico.
- **Escribiente y `uma-uhom` van como enlace y no embebidas**, en pestaña nueva.
  Ninguna calcula, y la promesa de Escribiente ---`connect-src 'none'`--- se lee
  peor adentro de un marco ajeno, no mejor.

**Lo que sólo tiene sentido con la página abierta sola se oculta adentro del
tablero**, por el mismo CSS inyectado que anula el `min-height: 100vh`. El
selector es **`.solo-suelta`, y es una sola regla**: la ponen las calculadoras
sobre su pie de autoría y sobre su línea de cobertura del calendario, que el
tablero dice una vez en la portada. Una lista de selectores en el tablero
crecía con cada pantalla; una clase que ponen las pantallas, no.

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

## La distancia: tres fuentes, en orden de fidelidad

**`distancia.html` se rehizo de cero el 1/9 y lo que cambió es el orden.** La
versión anterior preguntaba primero por la línea recta y ofrecía la ruta como
un botón al costado; la tabla de la Corte no existía. Ese era el orden en que se
había construido —Haversine, después la ruta— y no el orden en que la norma
manda. Ahora hay **un solo botón** y la pantalla elige, de más fiel a menos:

1. **La tabla de la Acordada 5/2010**, `data/acordada-5-2010-distancias.json`.
   Si un extremo es la Capital Federal y el otro es uno de los 45 asientos
   federales, **no hay nada que calcular**: el número lo publicó la Corte. Es la
   única de las tres que no es una estimación, y **no consulta a nadie**.
2. **La ruta terrestre**, por OSRM.
3. **La línea recta**, y se declara **piso y no respuesta**: nadie viaja en
   recta, así que la distancia real nunca es menor. Por eso cuando manda ella el
   veredicto dice «la ampliación es de **al menos** N días».

**LA REGLA DE LA CORTE NO ES «POR RUTA»: ES LA MÁS LARGA DE LAS DOS.** Acordada
50/86, recitada en el considerando I de la 5/2010: «la distancia que se tendrá
en cuenta será **la más larga** que resulte de la comparación entre las medidas
por vía férrea y por ruta terrestre». **Formosa es el caso que lo muestra**:
1.112 km por ruta y 2.501 por tren, y la Corte da **13 días** donde calcular por
ruta da 6. Es la razón por la que la tabla se carga como dato en vez de
recalcularse, y por la que cuando manda la ruta la pantalla avisa que **puede
quedar corto**: es sólo una de las dos medidas que la Acordada manda comparar.

**La tabla mide desde la Capital Federal y nada más.** Tucumán–Salta no está y
no se puede deducir restando dos filas; ese caso cae a la ruta. Está dicho en el
archivo y comprobado en el banco.

**Los dos controles nuevos no se superponen.** `verificar-acordada` prueba que
el archivo diga lo que dice la imagen del anexo —los días publicados salen de
aplicar la regla a la más larga, y el plazo de queja es eso más 5: 90
comprobaciones—. `verificar-distancia` prueba el motor y, sobre todo, **la
búsqueda**: que las 45 filas se encuentren por su nombre y por cómo la escribe
la gente, y que no se encuentren de más. «San Juan Bautista» no puede devolver
San Juan, y San Juan y San Luis no dan los mismos días.

**Qué contesta cuando no hay ruta**, que es lo que antes decía «Error al
consultar OSRM». Un `400` con `code: "NoRoute"` **no es una falla del servicio**:
es la respuesta correcta a cómo se va en auto a Puerto Argentino o a Jerusalén.
Se distingue de una falla real y se cae a la recta diciendo el motivo.

**Malvinas no necesitó ningún caso especial.** GEOREF —el geocodificador del
Estado— devuelve «Puerto Argentino» como Tierra del Fuego, Antártida e Islas del
Atlántico Sur, así que ya es local para la fuente que se consulta. El segmentado
dice «En el país · incluye las islas del Atlántico Sur».

### El mapa

**La regla que lo gobierna es que el dibujo no puede contradecir al número**, y
tiene una vuelta más desde que existe la tabla: **la Corte publica kilómetros,
no un recorrido.** Cuando el número sale de la tabla, el mapa dibuja la recta y
la nota dice que el veredicto **no sale de ninguna línea de ese dibujo**.

- **El contorno es un dato, no código.** `data/contorno-argentina.json`, de la
  capa `ign:provincia` del IGN, con la fuente y la fecha adentro. Lo arma
  `npm run contorno`: baja los 111 MB crudos, simplifica con Douglas-Peucker a
  0,02° y escribe 125 KB. **No se recorta nada** —están las 24 jurisdicciones
  como las publica el IGN, sector antártico incluido—: qué se dibuja lo decide
  el encuadre de la pantalla, y así la decisión de sacar territorio no existe.
- **El encuadre lo mandan los puntos y no el país.** Dos localidades bonaerenses
  sobre el mapa entero son dos puntos pegados, y encuadrar en el país obligaría
  además a resolver qué se hace con un territorio que llega al polo.
- **La pestaña internacional no lleva mapa, y lo dice.** El contorno que hay es
  el de la Argentina; un planisferio es otro trabajo.
- **La tierra no usa un token de superficie.** Las tres superficies del sistema
  son casi el mismo color a propósito —`--card` sobre `--sunk` da 1,1 en claro y
  1,2 en oscuro—, así que la primera versión salió un rectángulo negro con los
  puntos flotando. Va `--fg` a opacidad baja: sale del sistema, se da vuelta
  sola con el tema, y el trazo a 0,5 da 3,37 y 4,78 contra `--sunk`, o sea que
  pasa el 3:1 de un objeto gráfico en los dos temas.
- **A OSRM se le pide `overview=full` y se adelgaza acá.** Su `simplified`
  devuelve unos 25 puntos para 700 km y con eso la ruta sale casi recta: el mapa
  terminaba diciendo lo contrario de lo que existe para decir. **El parámetro no
  toca el número** —se comprobó con las tres formas sobre tres pares y dan la
  misma distancia hasta el último decimal— y el trazado se poda a 400 puntos,
  porque 2.900 pares por consulta llenan el `localStorage`, que ahora se poda a
  las últimas 25.

## El cómputo de plazos, extraído y consultable

**La división que hay que tener presente:** `calendario-judicial.js` es el
calendario —hábil, feria, feriado, asueto— y `plazos.js` es la aritmética —el
plazo de gracia, la notificación automática, los días de nota, los dos tramos de
mora—. Hasta el 26/8 la segunda vivía adentro de los HTML, entre
`document.getElementById`; por qué se extrajo está en
[`HISTORIA.md`](HISTORIA.md).

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

**`npm run verificar-plazos`**, 34 comprobaciones, corre en Node. Lleva como
regresión el caso con el que el hermano pidió esto —notificación 18/6/2026, diez
hábiles del art. 257 CPCCN, firme, diez corridos del art. 54 de la ley 27.423,
**mora el 12/7/2026**, que es la fecha exacta de una resolución real— más los
invariantes: el vencimiento nunca cae en inhábil, el sábado a las 23 hs. suma un
día y no dos, la ampliación del art. 158 se cuenta en hábiles y no en corridos,
y la notificación automática siempre cae en martes o viernes hábil.

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
produjo el bug de la feria.**

**La regla que el conector endurece:** la pantalla puede mostrar el aviso al
lado del número porque hay alguien leyendo; un conector no tiene a nadie del
otro lado. Por eso cuando falta un dato **la respuesta no trae fecha**: trae
`ok: false` y el motivo, y el texto de las herramientas MCP se lo dice al modelo
donde lo va a leer.

**Las fechas viajan como `AAAA-MM-DD`.** Ni ISO completo ni epoch: los dos
arrastran hora y huso. Un plazo judicial no tiene hora.

**Los cubre `npm run verificar-conectores`**, 46 comprobaciones, en CI. **No
cubre aritmética**, que ya cubre `verificar-plazos`: cubre lo que se rompe de un
transporte y no de una cuenta, y **sobre todo que un dato faltante no devuelva
una fecha**, que es la única regla del conector que no se puede reparar después.

**Lo que falta: avisarle al hermano.** El pedido está anotado en el `ESTADO.md`
de `pipeline-drafter` y en `HERMANOS.md` como abierto; cuando esto se use desde
allá, se cierra ahí y no acá. **Hasta que alguien los consuma, «andan» quiere
decir que pasan una corrida a mano, no que estén rodados.**

---

## Escribiente

Vive en `escribiente/` y se publica en `/escribiente/`; la URL vieja
`/PDF-studio/` queda viva con un aviso. Pasa PDF judiciales a Markdown y
anonimiza los datos personales; también une, separa y rota. Por qué PDF-studio
se tiró en vez de parcharse está en [`HISTORIA.md`](HISTORIA.md).

**Lleva un aviso de «en pruebas» en dos lugares, y el aviso es lo que hace
honesta la publicación**: la etiqueta en la tarjeta de la landing, y un bloque
en `--warn` arriba de `escribiente/index.html` para el que llega por enlace
directo. Se publicó sin rodaje a propósito ---en la oficina no se puede levantar
un servidor local---. **Sacar el aviso es decisión de Javier.**

**Lo que hay que saber para tocarla:**

- **El motor está en `escribiente/js/motor/`, es código puro y no toca el DOM.**
  Por eso corre en Node y tiene pruebas: `npm run verificar-escribiente`, 184
  comprobaciones, en CI. Los seis bugs de la versión anterior y las seis fugas
  del 21/8 están ahí como regresión. `js/app.js` es sólo la pantalla.
- **Las librerías van versionadas en `escribiente/vendor/`** —pdf.js 3.11.174 y
  pdf-lib 1.17.1, 1,9 MB—. **No se vuelven a un CDN**: la promesa de privacidad
  se sostiene con la CSP, y una CSP que habilita un CDN ya no promete nada.
- **No carga la tipografía Archivo.** Es la única página del sitio que no la
  pide a Google, y es a propósito. Si alguien «arregla» esa inconsistencia,
  rompe la CSP y la promesa con ella.
- **Para levantarla local hay que servir desde la raíz del repositorio**, porque
  `comun.css` y `tema.js` están en `../`. La configuración `sitio-estatico` de
  `.claude/launch.json` ya lo hace.

**Lo que queda abierto, y ninguno es bloqueante.** Salió de pasar un documento
largo el 21/8, que además destapó seis fugas ya arregladas; la crónica de ese
día está en [`HISTORIA.md`](HISTORIA.md).

- **Un nombre que el OCR ensució no lo agarra nada.** `SR :ERNESTO QU1ROGA`
  queda como `SR [PERSONA] QU1ROGA`: la `Ó` salió como
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
- **Varias páginas salieron en blanco.** Son escaneos sin OCR intercalados,
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

**Necesita el clon de `honorio/`, así que no corre en CI** —allá no existe—: la
limitación es que nada obliga a correrlo. Cuando sale una versión, se corre acá.

**Lo que el script no puede ver es la prosa, y es lo que más envejece.** La
enumeración de al lado se desactualiza igual que el número —`index.html`
nombraba once controles y `README.md` catorce—, y la lista de lo que Honorio
hace, más rápido todavía.

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
diciembre de 2017 y 71 de UHOM desde junio de 2016.** No están copiadas de
ninguna tabla ajena. Cada UMA salió del punto resolutivo de su acordada o
resolución y cada UHOM, de las tablas oficiales del Ministerio de Justicia. Las
dos viven en `data/`, versionadas, con la norma al lado de cada valor.

**Copiarlas habría sido más rápido y habría estado mal.** Las dos compilaciones
públicas que existen atribuyen a la Acordada 4/2022 el valor de $8.183 desde
abril de 2022, y la acordada dice **$7.439 a partir del 1 de enero de 2022**.
El detalle, en [`HISTORIA.md`](HISTORIA.md).

**Vigencia y fecha del acto son dos campos y no uno.** La resolución dice desde
cuándo rige el valor y casi siempre lleva fecha posterior a esa: de los 63
valores con demora computable, los 63 salieron después. Guardar una sola fecha
obliga a elegir cuál, y las dos hacen falta: **la vigencia decide qué valor
corresponde a una regulación, la del acto dice si ese valor existía el día en
que se reguló.**

**Dos cosas que aparecieron leyendo y conviene no volver a descubrir:**

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

Cada valor de UHOM se leyó **por su forma y no por su etiqueta**: es el único
número de la tabla que aparece también multiplicado por dos y por treinta. Hizo
falta porque el formato cambió seis veces en diez años —y el separador de miles
pasó de punto a coma en la 39—: ninguna etiqueta es confiable, la aritmética sí.

**Un valor con vigencia futura es válido, y hasta el 1/9/2026 no lo era.** El
Ministerio publica el UHOM por trimestres: la serie trae octubre, noviembre y
diciembre desde septiembre y nadie tiene que acordarse del día 1. La prohibición
existía porque `uma-uhom.html` tomaba el **último del archivo** como vigente
—las otras tres ya tomaban el último que ya rige—; arreglada esa, quedó sin
motivo. **Garantizar que no haya futuros no era lo que hacía falta: hacía falta
que siempre haya alguno vigente.** Las futuras van apagadas y con «aún no rige».

**`npm run verificar-series` corre en el build**, antes de armar el sitio. Un
archivo cargado a mano se rompe de cuatro formas y las cuatro dan un número
plausible que nadie ve en un diff de 70 líneas: una vigencia repetida, una serie
que baja, una fecha de acto anterior a la vigencia, y ningún valor vigente.

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

### Ninguno de los dos planes de Honorio es trabajo de este repositorio

[`08_DEUDA_TECNICA_FUNCIONAL.md`](domain/08_DEUDA_TECNICA_FUNCIONAL.md) es un
catálogo de decisiones, y describe el motor **clásico**: donde dice
`calculations.js` o `core.js` se habla de `asistente-honorarios-clasico/`.

[`PLAN_COBERTURA_LEY.md`](planes-cerrados/PLAN_COBERTURA_LEY.md) **está hecho entero desde el
7/8**, y lo dice en su encabezado. Hasta el 31/8 este archivo pedía «los seis
puntos que quedan», que era al revés: seis están hechos y cuatro quedaron
anotados sin fecha. Los cuatro son trabajo de Honorio y **desde el 31/8 viven en
el `ESTADO.md` de aquel repositorio**, que es donde se van a cerrar. El
documento se queda acá porque acá está la materia prima; el pendiente, no.

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
  **Y con el panel oculto los valores computados mienten de tres formas**, todas
  pagadas ya: las transiciones CSS no avanzan y `getComputedStyle` devuelve el
  color del tema anterior por tiempo indefinido; `getComputedStyle` reporta
  `transitionProperty: all` sobre elementos que no declaran ninguna, y devuelve
  colores intermedios que no están escritos en ningún lado; y el
  `ResizeObserver` no dispara, así que un iframe queda con el alto de antes.
  Los casos, en [`HISTORIA.md`](HISTORIA.md). **Dos reglas cortas:** con el
  panel oculto, **un color computado no es evidencia y el token sí** —el número
  se calcula afuera, del token contra la superficie compuesta—, y para descartar
  un desfase de medición, **medir en la misma corrida algo que no se tocó**.
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
  **Y hay una segunda forma de la misma clase, que mordió el 1/9 en
  `distancia`:** un `*/` de más adentro de un `<style>` cierra el comentario
  antes de tiempo, la prosa que sigue se parsea como CSS y **mata en silencio la
  regla siguiente**. Salió un mapa con la tierra negra a fondo pleno. Estos
  archivos no tienen build ni linter, y el estilo de la casa mete comentarios
  largos adentro del `<style>`: **al editar uno, contar los `/*` contra los
  `*/`**, y sobre todo **medir un estilo computado después de tocar CSS**, que
  es lo que lo cazó —`fill: rgb(0,0,0)` donde el archivo decía `var(--fg)`—.
  **Y una tercera, del 2/9: un nombre de clase repetido.** Las clases de
  `css/dibujo-plazo.css` comparten espacio de nombres con el `<style>` local,
  que gana, y con `aspect-ratio: 1` un relleno de más se vuelve ancho de más.
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
- **Son dos proyectos npm distintos: fijarse en cuál se está parado.** `check`,
  `build`, `validate` y `typecheck` son de Honorio y **sólo corren desde
  `honorio/`**, que es un clon de otro repositorio. Pedirlos acá da «Missing
  script», que se lee fácil como que algo está roto y no lo está. **Cuáles hay
  de este lado lo dice `npm run`**, y no una lista escrita acá: la que había
  decía «trece scripts y nada más» cuando ya eran dieciocho, y le faltaban
  cuatro. Los que **no** corren en CI, que es lo que sí hay que saber:
  `verificar-honorio` necesita el clon de `honorio/`, `barrer-plazos` el del
  repositorio `indice`, y `feriados` y `contorno` salen a la red.
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
- **El CPCCN escribe los plazos de cuatro formas, y barrer una sola
  pierde la mitad.** «QUINCE (15) días», «será de cinco días», «dentro de
  tercero día» y «DOS (2) **primeras** horas» —el plazo de gracia del art. 124—
  son el mismo dato. El primer barrido cubría sólo la del numeral: 112 artículos
  contra 165, y **entre lo que perdía estaba el art. 150**, que es *el* plazo de
  traslados. Lo cazó cruzarlo contra una pasada hecha con otro modelo: peor
  precisión, mejor cobertura. Está escrito en
  `scripts/barrer-plazos-cpccn.mjs`, con el `\b` del final de cada unidad
  comentado —sin él «en un **dia**rio» sale como un plazo de un día—.
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
