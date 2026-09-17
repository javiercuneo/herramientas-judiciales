# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-09-17 · rama `main`

**Lleva sólo lo que sigue vivo.** Dónde está el trabajo, qué está abierto, qué
se sabe roto, qué decisiones no hay que contradecir sin saberlo, y qué trampas
ya costaron tiempo. Nada más.

> **La regla que lo mantiene corto, y hay un control que la hace cumplir.**
> Se lee entero al empezar cada sesión, así que **cada línea de más se paga en
> todas las que vengan**. **Lo que se cierra se muda a
> [`HISTORIA.md`](HISTORIA.md) en el mismo commit que lo cierra** —no se tacha,
> no se deja «para que se vea que se hizo»—, y **lo que va acá no es lo que se
> hizo sino lo que hay que saber para seguir**. Lo mide
> `npm run verificar-estado`, en el `pre-commit` y en CI. La regla entera, en
> [`AGENTS.md`](../AGENTS.md).

> **Honorio no vive acá.** Se mudó el 4/8 a
> [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio) con su propio
> `ESTADO.md`, que es donde va todo lo del motor, el wizard y el dashboard. Qué
> sigue compartido —el motor legacy, `docs/domain/`, los planes— está en
> [`AGENTS.md`](../AGENTS.md). Si en la copia de trabajo hay un `honorio/`, es un
> clon de aquel repositorio: `git remote -v` antes de commitear.

---

## Dónde estamos

**El sitio está publicado en `javiercuneo.com.ar`, dominio propio, desde el
5/8.** Diez calculadoras vivas sobre el mismo sistema visual, los documentos de
dominio verificados contra el motor, **Escribiente** —el conversor y
anonimizador de PDF— y `uma-uhom.html`, con el valor vigente de las dos unidades
con las que se regulan honorarios y la serie entera de cada una.

**El frente grande está cerrado.** El cómputo de plazos vive en
`calculadoras/js/plazos.js` —ninguna de las cinco pantallas tiene aritmética
adentro— y se expone por HTTP local y por MCP en `conectores/`; **las diez
pantallas siguen el mismo patrón, sin excepción**.

**La puerta es el tablero**, no el listado: `calculadoras/tablero.html` reúne las
diez y `index.html` lleva ahí primero. Las páginas sueltas siguen publicadas y
sus direcciones no cambian, pero **`index.html` ya no las enlaza una por una**:
sólo se enlaza lo que NO está en el tablero. Detalle en
[El tablero de herramientas](#el-tablero-de-herramientas).

---

## Bugs abiertos

**Queda uno, y es el único de los cuatro de escribiente que no era un bug.** Los
otros tres se cerraron el 17/9 con el paso 2 del plan del motor único; están en
[`HISTORIA.md`](HISTORIA.md) con su caso de prueba, junto con **E-06**, una fuga
que apareció al verificarlos —la constancia nombraba al pie a quien el cuerpo sí
había tapado— y se cerró en el mismo commit.

### E-03 · Etiquetas estables entre documentos (pedido de `confronteitor`)

Hoy todas las personas de un archivo caen en `[PERSONA]` -en uno de los nueve,
cincuenta y una veces- y cada archivo se anonimiza por separado. Para cotejar un
testimonio contra la resolución que transcribe hacen falta **etiquetas numeradas
y estables entre documentos**: si una heredera es `[PERSONA_2]` en uno, tiene que
serlo en el otro. Sin eso, dos archivos anonimizados no se pueden cruzar.
**Es un pedido, no un bug**, y decide Javier si vale la pena.

**Lo que queda abierto de los que se cerraron**, que no es un bug sino el borde
de la regla: un nombre que el OCR ensució **sin tratamiento delante**
(`Qu1nteros, Anibal Ramon inicio la demanda`) no lo agarra ningún patrón, y
tampoco lo agarra cuando el dígito reemplaza la **primera** letra (`0campo`).
En los dos casos lo que queda pegado a la etiqueta se ofrece para tildar y la
constancia lo nombra, así que la fuga se ve; pero el reemplazo no sale solo.

## Por dónde seguir

> **Fuera del camino crítico del plan de los cinco repos, y eso es un resultado.**
> El orden conjunto está en el `HERMANOS.md` del repositorio del pipeline: los pasos son de
> `pipeline-drafter`, `knowledge` e `indice`. Acá no hay nada que desbloquee a
> nadie, y el único pedido que había —el calendario judicial consultable— está
> cerrado y consumido desde el 2/9.

**Lo que queda abierto:**

- **UN SOLO MOTOR DE ANONIMIZACIÓN. Acá se arranca, y va por el paso 3.**
  Las mismas reglas están escritas dos veces —en `escribiente/js/motor/anonimizar.js`
  y en el anonimizador del pipeline— y un arreglo de nombres hay que llevarlo a
  los dos lados. Decidido el 16/9: **queda el JS**. El plan entero —los cinco
  pasos, la costura (son cuatro funciones), y por qué `redactor` es el consumidor
  principal y no el pipeline— está en
  [`PLAN_MOTOR_UNICO.md`](PLAN_MOTOR_UNICO.md), **que hay que leer antes de tocar
  nada**.

  **Los pasos 1 y 2 están hechos** (16 y 17/9). Lo que hace falta saber para
  seguir:

  - **El paso 3 es un conector del anonimizador**, hermano de `conectores/mcp.mjs`,
    que exponga las cuatro funciones de la costura. Con su propio banco, y con la
    regla de los conectores: **cuando falta un dato no devuelve un resultado**,
    devuelve el motivo. Antes de escribirlo hay que decir en `HERMANOS.md` dónde
    vive, porque lo consumen dos repositorios.
  - **El banco de comparación está versionado** en `scripts/comparar-motores/`,
    declarado en `.datos-ejemplo`. Es la red: **antes y después de cada arreglo,
    correrlo y mirar qué se movió.** Cómo se corre, en el plan. Hoy da 28 de 40
    iguales.
  - **Queda una decisión chica sin tomar, y es de Javier**, anotada en el plan:
    los dos motores se contradicen sobre si la palabra que ancla sobrevive al
    reemplazo —el JS se come `Autos` y `Expte. N`, el Python se come `Tel:`—. La
    regla propuesta es que la palabra que ancla es texto y no dato, así que
    sobrevive. **No se tocó nada de esto todavía.**

- **Falta publicar el ledger, y nada más.** El lado de acá ya salió
  —`js/enlace.js` está en el sitio y `vencimientos.html` lo carga; comprobado el
  16/9—, así que la calculadora abre con los datos puestos apenas el ledger
  publique el suyo, que hoy arma el `#` sólo en su copia local (`?v=25`). Ver
  [El caso en el enlace](#el-caso-en-el-enlace).
- **Faltan las capturas del tablero en la landing.** Hoy hay un plano en SVG,
  que es la estructura y no la pantalla. Se hacen cuando el tablero deje de
  moverse —las de Honorio ya envejecieron dos veces— y **hay que pedir el panel
  del navegador abierto**: con el panel oculto no componen.

**El método es el de siempre:** leer este archivo, correr el control que cubre
lo que se va a tocar *antes* de tocarlo, y que cualquier número que se mueva sea
porque se decidió moverlo.

---

## Pendientes

Ninguno urgente y ninguno bloqueante.

### Lo que hay que acordarse de hacer a mano

- **Hay una entrada en la lista privada que conviene revisar, y es de Javier.**
  Armando el banco de comparación el 16/9 chocaron tres cosas inventadas contra
  ella. Dos eran un nombre y un número y se cambiaron sin mirar cuál era el
  término. **El tercero no era un identificador sino una fórmula de escrito**
  —la frase que sigue a `Autos N,` en cualquier presentación—, de 21
  caracteres. Una entrada así **bloquea commits para siempre sin proteger a
  nadie**, y el verificador no imprime el término a propósito, así que sale
  caro de diagnosticar cada vez. La lista vive fuera del árbol
  (`git config datos.listaPrivada`).
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
  puede detectar que falte el último**: detecta que lo cargado esté mal. El que
  avisa es la propia página, si pasaron más de 45 días sin revisarlas.
  **La del monto fijo del art. 6 es la más lenta y por eso la más fácil de
  olvidar**: se movió en 2018 y en 2022, y hoy tiene un solo valor cargado
  —$4.700, Acordada 15/2022—. **El de la Acordada 41/2018 no está a propósito**:
  la nota de Infoleg la nombra sin decir el importe, y cargar un número que no se
  leyó es lo que el archivo existe para evitar.

### Lo que está abierto en el cálculo

- **`prorrateo` no computa el art. 730 in fine, y no lo va a computar.**
  Decisión de Javier: **la herramienta no puede resolver qué entra en la base.**
  El último párrafo excluye del 25 % los honorarios de los profesionales de la
  parte condenada en costas, pero si además entra el mediador es criterio de cada
  juzgado. Donde la ley no resuelve sola, esta casa muestra los criterios y
  decide el que firma. **Lo que falta no es una función: es un aviso al lado del
  campo** con las dos cosas. Avisar cuándo el recorte excede el 33 % sí es
  función nueva, y está en `IDEAS.md`.
- **La ampliación por distancia se ofrece con cualquier cédula, y sólo
  corresponde con algunas.** El art. 158 pide que la diligencia se practique
  «fuera del lugar del asiento del juzgado», y el art. 40 manda constituir
  domicilio adentro de ese radio: la cédula al domicilio **constituido** —que es
  la mayoría— se diligencia adentro. Sólo corresponde con cédula al domicilio
  **real** fuera del radio. **Javier decidió dejarlo así por ahora** —«tiene
  sentido en la cédula y por eso lo toleré»—; el razonamiento, en
  [`HISTORIA.md`](HISTORIA.md).
- **Los mínimos son de Honorio y el pendiente vive allá.** `minimos-data.ts` es
  suyo; de este lado sólo pasa que el `06` y el `07` citan sus cifras. **Si allá
  se mueve una, se mueven las dos citas.**
- **La cobertura arranca en 2021, y está declarada en el archivo y no en el
  código.** Las ferias de 2004 a 2020 están cargadas, pero los feriados y los
  asuetos de esos años **no**: un cálculo sobre ellos contaría como hábiles días
  que no lo fueron, así que el motor anota cualquier año fuera de la ventana y
  la herramienta no afirma una fecha. **Se decidió que completar 2004-2020 no
  vale la pena**; las ferias viejas quedan como evidencia documental.
- Anotado y no decidido, de cálculo directo: si el control de fracción de etapa
  del dashboard debería ofrecer las dos cosas.

### Lo que está abierto en las pantallas

- **El caso en el enlace llega a siete de las diez.** Las cinco de plazos lo
  **leen** ([El caso en el enlace](#el-caso-en-el-enlace)); `tasa` y `prorrateo`
  lo leen y además lo **escriben** —permalink e imprimible—, con su propio
  formato. Sin decidir: `distancia`, `honorarios-mediacion`, `ejecucion-estado`,
  y si las de plazos escriben el suyo. **Si se extiende, van las mismas tres
  decisiones de `js/enlace.js`**, y la UMA **no** va en el enlace: es un dato del
  sistema y no del caso, y congelaría un valor viejo adentro de un enlace que se
  abre meses después.
- **Los cuatro criterios con los que se despejó `tasa` valen para las diez.** Se
  pregunta **el caso y no la mecánica**; lo que el sistema puede decidir **lo
  decide** ---un desplegable de una sola opción es una decisión disfrazada de
  pregunta---; un campo que no aplica **no ocupa lugar**; y el hint que dice a
  qué inciso corresponde lo que se está cargando **es parte de la respuesta y va
  a la vista** ---lo que se esconde es la explicación larga, nunca el mapeo---.
  Cada uno está escrito con su porqué en el `<style>` de `tasa.html`.
  **El barrido de texto está hecho en las diez**, y la distinción que vale para
  la próxima pantalla es que el *usted* —«Ingrese», «Verifique»— **no es tuteo y
  no es un error**: lo que hay que sacar es el imperativo de *tú*, y el usted
  suelto entre voseo.
- **El buscador de plazos salió con el chip «en desarrollo», y es lo único de
  este repositorio publicado sin curar.** Decisión de Javier —«lo voy verificando
  en producción… es texto de ley, a lo sumo podrá faltar un plazo»—. **Ese es el
  riesgo que tiene y el que no:** los 198 plazos salen de un barrido mecánico,
  así que un número mal es improbable y una ausencia no lo es. Lo que el barrido
  **no** distingue es qué plazo corre contra la parte y cuál contra el juez
  —art. 34— o el perito, y por eso cada resultado muestra **la oración literal
  del artículo**. Cuando Javier termine de verificarlo, sale el chip.
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
- **Un rótulo de atajo no puede redondear una regla**, y por eso el botón de 5
  días dice «apelación, traslados y vistas» y no nombra las excepciones, que van
  en la línea que aparece al elegirlo. **Decir de menos no miente; redondear
  sí.** El caso de los arts. 542, 346 y 338 que lo decidió, en
  [`HISTORIA.md`](HISTORIA.md).
- **`uma-uhom` no habla de demoras, y no hay que volver a agregarlas** —«suena
  como que le critico a la Corte lo que tardó»—. **La fecha del acto se quedó**:
  es un dato y no una demora, y dice si un valor ya existía el día de la
  regulación. El crudo sigue en `data/serie-uma.json`, con `sin_demora` y todo.
- **La imagen de enlace de la UMA no está en Archivo.** `npm run og-uma` escribe
  el PNG a mano y dibuja las letras con trazos; rendir Archivo pediría un motor
  de fuentes en Node. **Se regenera cuando se carga un valor nuevo**, y lleva la
  vigencia al lado del número para que una imagen vieja compartida en un chat
  siga diciendo algo cierto.

---

## Qué sale del navegador

**Lo contesta `npm run verificar-red`, y no una lectura**: la primera versión de
esta lista se hizo leyendo las calculadoras una por una y se equivocó. Lo vivo:

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

**Y el peso del aviso es una decisión**: en `distancia` va entero y sin recortar
nada, pero en un `<details>` cerrado. La promesa no se afloja; cambia el
volumen.

---

## Los controles, y qué cubre cada uno

Son trece y no se superponen. **Ninguno se da por bueno sin haberlo visto fallar
a propósito**: un control que nunca falló no es un control.

| Control | Qué cubre |
|---|---|
| `npm run verificar-calculos` | El motor: 673 comprobaciones |
| `npm run verificar-plazos` | El cómputo de las cinco de plazos, y la API que carga el ledger: 135 |
| `npm run verificar-series` | Las series de UMA, UHOM y monto fijo |
| `npm run verificar-contraste` | Los tokens de color, AA sobre las tres superficies y en los dos temas |
| `npm run verificar-conectores` | Los dos transportes de `conectores/`: 46 |
| `npm run verificar-acordada` | Que la tabla de la Acordada 5/2010 diga lo que dice el anexo: 90 |
| `npm run verificar-distancia` | El cómputo del art. 158 y la búsqueda en esa tabla: 64 |
| `npm run verificar-red` | Qué terceros nombran las quince páginas que se publican, contra una lista con el motivo al lado de cada uno |
| `npm run verificar-escribiente` | El motor de Escribiente: 214 |
| `npm run verificar-honorio` | Las cinco cifras que este repositorio sigue del motor |
| `npm run verificar-docs` | Que los documentos de dominio no citen artículos ni archivos que no existen |
| `npm run verificar-estado` | El presupuesto y la higiene de este archivo |
| `npm run verificar-datos-ejemplos` | Las salidas de `verificar-datos.sh`: la exención, la guarda del correo y los modos del pre-push: 27 |

Y **tres** que corren en el navegador, con el sitio servido y no con `file://`:

- **`scripts/pruebas-calculadoras.html`** cubre **las pantallas** de plazos: 90
  filas, las 90 pasando, sobre las cinco por iframe, y desde el 14/9 lo que
  completa un enlace. **Los iframes llevan
  rompe-caché**: sin él las pruebas corren contra la versión anterior, que
  parece un bug del cambio que se acaba de hacer.
- **`scripts/pruebas-tablero.html`** cubre **la navegación** del tablero: 37
  comprobaciones, las 37 pasando, en ocho grupos. Es el único que ve una
  pestaña que no abre —el de al lado calcularía perfecto igual—. **Cada prueba
  abre su propio tablero**, porque varias dependen del estado de arranque y no
  se pueden correr sobre uno que ya se tocó.
- **`scripts/pruebas-no-plazos.html`** cubre las cuatro que no son de plazos:
  **60 fijados** sobre `prorrateo`, `tasa`, `honorarios-mediacion` y
  `ejecucion-estado`. Son la red que permite refundar una pantalla: los casos de
  `tasa` se remapearon dos veces sin que un solo número se moviera.

**Las tres se arrastran con el panel del navegador oculto** —de seis segundos a
varios minutos— porque los iframes no dibujan: no es que estén rotas.

---

## El tablero de herramientas

`calculadoras/tablero.html`, **y desde el 31/8 es la puerta**: `index.html` lo
pone arriba del listado, que quedó abajo como referencia. Decisión de Javier
---«ahí debe vivir todo, y no herramientas sueltas en links sueltos»---.

**Diez herramientas embebidas en dos regiones, más dos enlaces**: arriba las
seis de plazos, con teclas 1-6 y flechas; abajo, «Honorarios y otros». Cada una
es un iframe de la calculadora publicada, **sin una línea modificada de
ninguna**. Arriba de todo, la portada, con la fecha de hoy, la UMA, el UHOM y la
cobertura del calendario: **los tres datos se dicen una vez acá y no una vez por
calculadora**, y el cómputo sigue pasando adentro de cada marco.

**Por qué es así y no de otra manera —iframes en vez de fusionar el markup, las
que no son de plazos en una región aparte, Escribiente y `uma-uhom` por enlace—
está en [`HISTORIA.md`](HISTORIA.md), y no hay que revisarlo sin leerlo.** El
motivo de fondo sí vive acá porque gobierna lo que venga: **existe porque once
herramientas separadas pueden discrepar en silencio durante años y dos pestañas
del mismo marco no.** No es comodidad; que además sea la puerta es posterior.

**Las teclas 1-6 se rompieron dos veces, por causas distintas, y las dos
estuvieron publicadas.** Lo vivo: **un evento de teclado no cruza de un iframe al
documento de arriba**, así que el mismo oyente se engancha adentro de cada marco
al montarlo; y como las dos veces la pestaña siguió dibujando su número,
`pruebas-tablero.html` exige que **cada tecla abra la que dice su propio badge**
y no que «alguna haga algo».

**Lo que sólo tiene sentido con la página abierta sola se oculta adentro del
tablero**, y el selector es **`.solo-suelta`, una sola regla que ponen las
pantallas y no una lista que crece en el tablero**: va sobre el pie de autoría y
sobre la línea de cobertura del calendario. **Una herramienta nueva tiene que
llevarla en su pie** o el tablero muestra la misma firma diez veces. **Lo que NO
la lleva, a propósito:** el aviso de que el plazo toca un año sin Acordada, que
frena un número y tiene que estar donde se pide el número.

**Lo que lo hace verificable:** `pruebas-calculadoras.html` corre los 21 casos
verificados **dos veces**, sueltos y embebidos, y exige que den lo mismo. Toda
la apuesta del tablero es que embeber no cambie un número.

**La trampa que costó encontrar:** la mitad de las calculadoras tiene
`body { min-height: 100vh }`, y adentro de un iframe **`100vh` es el alto del
iframe**: el contenido siempre llena el marco y el alto queda clavado donde
arrancó. Se anula por CSS inyectado, y el alto se mide sobre el rect del
`<body>` y no con `scrollHeight`, que nunca baja del alto del marco.

## La distancia: tres fuentes, en orden de fidelidad

**`distancia.html` pregunta una sola vez y elige, de más fiel a menos:** la
**tabla** de la Acordada 5/2010 —`data/acordada-5-2010-distancias.json`, que no
estima y no consulta a nadie—, la **ruta** por OSRM avisando que puede quedar
corta, y la **recta**, declarada piso y no respuesta: «la ampliación es de **al
menos** N días». El orden es la decisión; cómo se llegó a él y qué contesta en
cada uno de los cuatro casos límite, en [`HISTORIA.md`](HISTORIA.md).

**LA REGLA DE LA CORTE NO ES «POR RUTA»: ES LA MÁS LARGA DE LAS DOS** —Acordada
50/86, recitada en el considerando I de la 5/2010, entre vía férrea y ruta
terrestre—. Por eso la tabla se carga como dato en vez de recalcularse: hay
pares donde el tren manda y la ruta da la mitad de los días.

**La tabla mide desde la Capital Federal y nada más.** Tucumán–Salta no está y
no se puede deducir restando dos filas; ese caso cae a la ruta. Está dicho en el
archivo y comprobado en el banco.

**Los dos controles no se superponen.** `verificar-acordada` prueba que el
archivo diga lo que dice la imagen del anexo; `verificar-distancia` prueba el
motor y, sobre todo, **la búsqueda**: que las 45 filas se encuentren por su
nombre y por cómo la escribe la gente, y que **no se encuentren de más**. «San
Juan Bautista» no puede devolver San Juan, y San Juan y San Luis no dan los
mismos días.

**El dibujo no puede contradecir al número**, y desde que existe la tabla tiene
una vuelta más: **la Corte publica kilómetros, no un recorrido**, así que cuando
el número sale de ahí el mapa dibuja la recta y la nota aclara que el veredicto
no sale de ninguna línea de ese dibujo. Cómo está hecho el mapa, y por qué un
`400` con `code: "NoRoute"` no es una falla del servicio, en
[`HISTORIA.md`](HISTORIA.md); nada de eso está abierto.

## El cómputo de plazos, extraído y consultable

**La división que hay que tener presente:** `calendario-judicial.js` es el
calendario —hábil, feria, feriado, asueto— y `plazos.js` es la aritmética —el
plazo de gracia, la notificación automática, los días de nota, los dos tramos de
mora—. Hasta el 26/8 la segunda vivía adentro de los HTML, entre
`document.getElementById`; por qué se extrajo está en
[`HISTORIA.md`](HISTORIA.md).

### `calculadoras/js/plazos.js`

**Es transcripción, no rediseño**, y hay que seguir tratándolo así: las cuatro
funciones de mora están sin simplificar **a propósito**, porque escritas de otra
forma el resultado se mueve, y el conteo arranca un día antes para que el de
inicio cuente primero.

**La trampa que había que no pisar:** las dos pantallas construyen la fecha con
convenciones distintas. `vencimientos.html` usa `Date.UTC(..., 12)` —mediodía
UTC— y `mora.html` usa `new Date(y, m, d)` con `setHours(0,0,0,0)` —medianoche
local—. **No se unificaron**, y están las dos en el archivo con el comentario de
por qué: unificarlas es elegante y mueve un número de algún lado.

**`npm run verificar-plazos`**, 135 comprobaciones, corre en Node y, desde el
11/9, en `pages.yml` antes de publicar. Además de las regresiones lleva los
invariantes, que son lo que no se puede romper: el vencimiento nunca cae en
inhábil, el sábado a las 23 hs. suma un día y no dos, la ampliación del art. 158
va en hábiles, y la notificación automática cae en martes o viernes hábil.

### `conectores/`

Tres consumos sobre un núcleo único, y **ninguno calcula nada**: `nucleo.mjs`
carga los dos motores de navegador en Node y traduce entre `Date` y JSON;
`http.mjs` (`npm run conector-http`) lo sirve por JSON sobre HTTP y **escucha
sólo en `127.0.0.1`**; `mcp.mjs` (`npm run conector-mcp`) lo sirve por MCP en
stdio, con seis herramientas y sin dependencias.

Que sean dos transportes finos sobre un núcleo es el punto entero: **una segunda
implementación de una cuenta con consecuencia jurídica es el modo de falla que
produjo el bug de la feria.**

**El contrato, que ya no es una decisión interna.** `pipeline-drafter` los
consume desde el 2/9 —su `pipeline/plazos.py` levanta `conectores/mcp.mjs` por
stdio—, así que **tocar la forma de una respuesta rompe a alguien**:

- **Cuando falta un dato la respuesta no trae fecha**: `ok: false` y el motivo.
  La pantalla puede poner el aviso al lado del número porque hay alguien
  leyendo; un conector no tiene a nadie del otro lado. Es la única regla que no
  se puede reparar después.
- **Las fechas viajan como `AAAA-MM-DD`.** Ni ISO completo ni epoch: los dos
  arrastran hora y huso, y un plazo judicial no tiene hora.

**Los cubre `npm run verificar-conectores`**, 46 comprobaciones, en CI. No cubre
aritmética —eso es `verificar-plazos`— sino lo que se rompe de un transporte, y
sobre todo que un dato faltante no devuelva una fecha.

### El cuarto consumidor, que no pasa por los conectores

**Desde el 11/9 el repositorio `ledger` —privado, fuera de los cinco— carga los
dos motores desde el sitio publicado** y les pregunta en el navegador la
caducidad de seis meses, el vencimiento por cédula de una apelación y, desde el
14/9, los plazos para contestar la demanda y los traslados. Ningún conector le
sirve, así que **su contrato es la API de `window` de los motores**. Lo que usa,
leído en su `web/js/app.js`:

- **Las rutas publicadas** de `calendario-judicial.js`, `plazos.js` y
  `data/feriados.json`, `data/dias-inhabiles.json` y `data/feria-judicial.json`.
- **`CalendarioJudicial.CONFIG`, mutable**: reescribe `JSON_FERIADOS_URL`,
  `JSON_CUSTOM_URL` y `JSON_FERIA_URL` con URLs absolutas entre cargar el script
  y llamar a `CalendarioJudicial.init(anios)`. Si el motor leyera las URLs al
  cargarse, o congelara `CONFIG`, buscaría los JSON al lado del ledger.
- **`Plazos.caducidad({ anio, mes, dia, meses })`** → `{ problema, vencimiento }`
  y **`Plazos.vencimiento({ modalidad: 'cedula', anio, mes, dia, plazo })`** →
  `{ problema, vencimiento, vencimientoSinGracia }`. Lee cada `Date` con
  getters **locales**, así que la hora que devuelve cada función —mediodía UTC
  una, medianoche local la otra— también es contrato.
- **`Access-Control-Allow-Origin: *`**, que Pages manda solo y que los JSON
  necesitan porque los pide `fetch` desde otro origen. Comprobado el 11/9.

**Si algo de esto cambia, el ledger no da error**: un campo que falta lo tira a
su modo sin motor —sin vencimientos, caducidad por días corridos— sin aviso en
pantalla, y un cambio de significado con la misma forma le hace mostrar una
fecha equivocada. **No se cambia sin avisar al ledger**, en «Los plazos vienen
de herramientas-judiciales» de su `ESTADO.md`. **Lo cubren dos controles**, los
dos vistos fallar a propósito: el bloque del ledger de `verificar-plazos` lo
imita tal cual y corre antes de publicar, y el job `publicado` de `pages.yml`
pide las cinco rutas al sitio **después** de publicar y exige `200` y el
encabezado CORS. Si ése falla, el sitio ya salió: la falla es el aviso.

### El caso en el enlace

Desde el 14/9 las cinco de plazos se abren con los datos puestos. Lo lee
`calculadoras/js/enlace.js`, con **tres decisiones en su cabecera**: el caso va
en el **fragmento** (`#…`), que no llega al servidor; el enlace **completa y no
calcula** —decisión de Javier—; y con un dato inválido **no completa ninguno**.

| Pantalla | Nombres (fechas `AAAA-MM-DD`, días de 1 a 999) |
|---|---|
| `vencimientos` | `modalidad` (`cedula`/`automatica`), `fecha`, `plazo` |
| `caducidad` | `meses` (1 a 6; 2, 4 y 5 van a «prescripción menor»), `fecha` |
| `mora` | `fecha`, `firme` (hábiles), `pago` (corridos, desde 0) |
| `regresiva` | `fecha`, `antelacion` |
| `entre-fechas` | `desde`, `hasta`, `inicio`, `fin`, `habiles` (`si`/`no`) |

**Los tres de `vencimientos` son contrato con el ledger**, que los arma en su
`app.js`. Lo cubren 15 filas de `pruebas-calculadoras.html`, vistas fallar
renombrando `plazo` y calculando al abrir. **El tablero no pasa el enlace a la
embebida** —su fragmento es la pestaña—: un enlace con datos va a la suelta.

---

## Escribiente

Vive en `escribiente/` y se publica en `/escribiente/`; la URL vieja
`/PDF-studio/` queda viva con un aviso. Pasa PDF judiciales a Markdown y
anonimiza los datos personales; también une, separa y rota. Por qué PDF-studio
se tiró en vez de parcharse está en [`HISTORIA.md`](HISTORIA.md).

**Lleva un aviso de «en pruebas» en dos lugares —la tarjeta de la landing y un
bloque en `--warn` arriba de `escribiente/index.html`— y el aviso es lo que hace
honesta la publicación**: salió sin rodaje a propósito, porque en la oficina no
se puede levantar un servidor local. **Sacar el aviso es decisión de Javier.**

**Lo que hay que saber para tocarla:**

- **El motor está en `escribiente/js/motor/`, es código puro y no toca el DOM.**
  Por eso corre en Node y tiene pruebas: `npm run verificar-escribiente`, 214
  comprobaciones, en CI. Los seis bugs de la versión anterior, las fugas
  del 21/8 y las del 15/9 están ahí como regresión. `js/app.js` es sólo la
  pantalla.
- **El anonimizador del pipeline es el otro, y desde el 15/9 comparte
  con éste la lógica de nombres**: las partículas, la terminación que no es
  nombre (`-ción`, `-tiva`), la guarda del tratamiento, el recorte de
  candidatos y la carátula en mayúsculas. **Un arreglo de nombres acá se lleva
  allá**, porque `redactor` ingresa casos con aquél. Las listas de palabras no
  son iguales, y a propósito: `redactor` usa la de allá para buscar restos de un
  nombre confirmado, y una palabra de más ahí es un apellido que deja de
  buscarse.
- **Las librerías van versionadas en `escribiente/vendor/`** —pdf.js 3.11.174 y
  pdf-lib 1.17.1— **y no vuelven a un CDN**, y **no carga la tipografía
  Archivo**: es la única página del sitio que no la pide a Google. Las dos cosas
  sostienen la CSP, y el porqué está en
  [Una promesa de privacidad](#una-promesa-de-privacidad-se-demuestra-no-se-declara).
  Si alguien «arregla» la inconsistencia, rompe la promesa.
- **Para levantarla local hay que servir desde la raíz del repositorio**, porque
  `comun.css` y `tema.js` están en `../`. La configuración `sitio-estatico` de
  `.claude/launch.json` ya lo hace.

**Lo que queda abierto vive en [`escribiente/README.md`](../escribiente/README.md)**,
y desde el 16/9 no acá: son ocho límites conocidos, ninguno bloqueante —el nombre
que ensució el OCR, el domicilio del propio juzgado, el DNI que es un monto, la
página sin OCR, el texto sin justificar, el agregado a mano, las razones sociales
y dónde se anotan las fugas aparecidas al usarlo—, y **los busca quien viene a tocar la
herramienta, que ya está parado en esa carpeta**. Este documento se lee entero en
cada sesión y tiene presupuesto; aquél no. Los cuatro bugs abiertos siguen arriba,
en [Bugs abiertos](#bugs-abiertos), porque son lo que se mira al empezar.

---

### Las cinco cifras que este repositorio sigue de Honorio

Son suyas pero salen de allá: **la versión**, **18 validaciones**, **8 tipos de
proceso**, **173 recorridos** y **29.929 cruces**. Viven en `index.html`, en
`README.md`, en `documentacion.html` —la de validaciones, escrita con letras— y
en la tabla de recorridos de [`01_PROCESOS.md`](domain/01_PROCESOS.md). **Si
vuelve a moverse alguna, se mueven todas.**

**`npm run verificar-honorio` las compara contra el motor** y dice qué archivo
quedó viejo y en qué número; no arregla nada. **Necesita el clon de `honorio/`,
así que no corre en CI**: se corre acá cuando sale una versión de aquel lado.
**Lo que el script no puede ver es la prosa, y es lo que más envejece** —la
enumeración de al lado se desactualiza igual que el número, y la lista de lo que
Honorio hace, más rápido todavía—.

---

## Decisiones vigentes

No se derivan del código. Las que ya no se discuten están en
[`HISTORIA.md`](HISTORIA.md); acá quedan las que gobiernan trabajo de todos los
días.

### El sistema visual

Es el mismo de la landing, de la guía y de Honorio, y las calculadoras lo
adoptaron: cobalto `#1E45CE` como **único acento** —lo activo, lo enfocado y lo
seleccionado son siempre el mismo color—, neutro frío, `--radius: 0.375rem`, y
**Archivo** (Omnibus-Type, Buenos Aires) para títulos y cifras. **Y está
descartado el cluster «crema + serif display + terracota»**, por ser el look más
reconocible de diseño generado por IA.

**El tema lo elige el usuario, desde el 5/8**, con un botón que inyecta
`assets/tema.js` —compartido, porque son páginas sin build y una copia por
página del mismo comportamiento se desincroniza—. Lo llevan **todas las páginas
que el sitio publica salvo las tres de redirección y el asistente clásico**, los
diez documentos de dominio incluidos.

**Sin elección guardada el tema es oscuro y el sistema ya no decide**, desde el
6/9; la elección persiste en `localStorage`. **El
`@media (prefers-color-scheme: dark)` de `comun.css` no sobra por eso** —acá
siempre queda un `data-tema` puesto—: es lo único que decide cuando `tema.js` no
corre, y sin él alguien con el JS bloqueado y el sistema en oscuro vería la
página clara. **No alcanza a Honorio**, que tiene su propio interruptor y su
propia clave.

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
en un tema, la más clara en el otro—, que costó cuatro semanas descubrir. Lo
verifica `npm run verificar-contraste`, que también exige que los seis archivos
donde están escritos los tokens digan lo mismo.

### La serie de la UMA y del UHOM se reconstruyó de los actos

`uma-uhom.html` publica las dos series completas: **67 valores de UMA desde
diciembre de 2017 y 71 de UHOM desde junio de 2016.** No están copiadas de
ninguna tabla ajena. Cada UMA salió del punto resolutivo de su acordada o
resolución y cada UHOM, de las tablas oficiales del Ministerio de Justicia. Las
dos viven en `data/`, versionadas, con la norma al lado de cada valor.

**Copiarlas habría sido más rápido y habría estado mal**, y el caso que lo
prueba —las dos compilaciones públicas erran el valor de la Acordada 4/2022—
está en [`HISTORIA.md`](HISTORIA.md).

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

**Un valor con vigencia futura es válido, y no hay que volver a prohibirlo.**
El Ministerio publica el UHOM por trimestres, así que la serie trae el trimestre
entero y nadie tiene que acordarse del día 1. **Lo que hay que garantizar no es
que no haya futuros: es que siempre haya alguno vigente**, y las cuatro páginas
toman el último que ya rige y no el último del archivo. Las futuras van apagadas
y con «aún no rige». Por qué la regla estuvo al revés, en
[`HISTORIA.md`](HISTORIA.md).

**`npm run verificar-series` corre en el build**, antes de armar el sitio. Un
archivo cargado a mano se rompe de cuatro formas y las cuatro dan un número
plausible que nadie ve en un diff de 70 líneas: una vigencia repetida, una serie
que baja, una fecha de acto anterior a la vigencia, y ningún valor vigente.

### Ningún día inhábil se decide en código

La regla general —**lo que se fija por acto va en datos con la cita del acto**—
está en [`AGENTS.md`](../AGENTS.md), y desde el 24/8 no queda ningún día escrito
en código: enero era el último, y ahora sale de la clave `feria_de_enero` de
`data/feria-judicial.json`, con el art. 2 del Reglamento para la Justicia
Nacional citado y el texto del artículo adentro.

**El default del motor no es «no hay feria».** Si el archivo no se puede leer,
enero sigue siendo feria. Con la feria de invierno la ausencia se puede informar
—son doce días y el motor anota el año faltante— pero enero contado como hábil
adelanta un vencimiento un mes entero, y eso no se ve: sale un número plausible.
Leer el dato sólo puede confirmar el default o mover el mes, nunca apagarlo. El
control que prueba que el dato se leyó es que el motivo cite la norma.

**El jueves santo no viene en la API de feriados, y por eso se olvida.** Es no
laborable y no feriado, así que la API trae el viernes y el jueves no, aunque el
mismo art. 2 lo haga inhábil. Están los seis en `data/dias-inhabiles.json` y
**el olvido ya no depende de que alguien se acuerde**: `verificar-calculos.mjs`
toma cada viernes santo de `feriados.json` y exige que el anterior sea inhábil.

La frase «la Semana Santa» del mismo artículo **no** está implementada como una
semana entera, y eso es deliberado: el lunes, el martes y el miércoles santo se
trabaja. Está dicho en `data/feria-judicial.json` para que no se lo lea al pie
de la letra y se inventen tres días inhábiles.

### Este repositorio es público, y eso decide cómo se escribe

Las reglas están en [`AGENTS.md`](../AGENTS.md), en «Datos: qué no entra a este
repositorio», y `scripts/verificar-datos.sh` las verifica en cada commit. Si
falta una referencia que parece que debería estar, falta a propósito.

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

Es el diseño de `escribiente/js/motor/anonimizar.js`, y no es una comodidad de
interfaz. Lo que tiene forma inequívoca —DNI, CUIT, CBU, teléfono, expediente,
matrícula, correo— se reemplaza solo, porque no hay falso positivo posible.
**Los nombres propios se muestran para que el usuario decida uno por uno**,
porque ninguna regla distingue sola `Pérez, Juan Carlos` —la parte— de
`Llambías, Jorge Joaquín` —doctrina— ni de `Buenos Aires, Astrea`, que es una
editorial. Reemplazar por adivinanza corrompe el texto; no reemplazar filtra.

De ahí también la constancia al pie de cada `.md`: qué se reemplazó, cuántas
veces, y **qué quedó sin ocultar**. Un anonimizador que no se puede auditar es
peor que ninguno, porque produce confianza sin fundarla.

### Una herramienta publicada tiene que estar bien o no estar publicada

Es el criterio con que `calculadoras/honorarios.html` se dio de baja en vez de
corregirse —el porqué, en [`HISTORIA.md`](HISTORIA.md)—. Que una tarjeta de la
landing diga «retirada» no la saca de internet. Si hay que retirar algo: el
archivo se queda, la URL sigue viva con un redirect en `pages.yml`, y la landing
dice el motivo.

### Ninguno de los dos planes de Honorio es trabajo de este repositorio

[`08_DEUDA_TECNICA_FUNCIONAL.md`](domain/08_DEUDA_TECNICA_FUNCIONAL.md) describe
el motor **clásico**: donde dice `calculations.js` o `core.js` se habla de
`asistente-honorarios-clasico/`. Y [`PLAN_COBERTURA_LEY.md`](planes-cerrados/PLAN_COBERTURA_LEY.md)
**está hecho entero**: los cuatro puntos que quedaron anotados sin fecha son
trabajo de Honorio y viven en el `ESTADO.md` de aquel repositorio. Los dos
documentos se quedan acá porque acá está la materia prima; el pendiente, no.

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
  con *«the Browser pane is not displayed»*. No es una limitación del entorno:
  **la solución es abrir el panel.** Si no se puede, el JavaScript sí funciona.
  **Y con el panel oculto los valores computados mienten de tres formas** —los
  casos, en [`HISTORIA.md`](HISTORIA.md)—. **Dos reglas cortas:** con el panel
  oculto **un color computado no es evidencia y el token sí** —el número se
  calcula afuera, del token contra la superficie compuesta—, y para descartar un
  desfase de medición, **medir en la misma corrida algo que no se tocó**.
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
  **Hay otras dos formas de la misma clase**, y las tres se ven igual —nada
  falla, una regla simplemente no está—: un `*/` de más adentro de un `<style>`
  parsea como CSS la prosa que sigue y **mata en silencio la regla siguiente**;
  y un nombre de clase repetido entre `css/dibujo-plazo.css` y el `<style>`
  local lo gana el local. Estos archivos no tienen build ni linter y el estilo
  de la casa mete comentarios largos adentro del `<style>`: **al editar uno,
  contar los `/*` contra los `*/`**, y sobre todo **medir un estilo computado
  después de tocar CSS**, que es lo que cazó las dos. Los casos, en
  [`HISTORIA.md`](HISTORIA.md).
- **`scripts/verificar-datos.sh` es el verificador de todos los repositorios de
  la máquina, no sólo de éste.** `core.hooksPath` global apunta a un hook
  compartido que lo corre en cualquiera —incluidos los que todavía no existen—.
  **Un patrón que se afloja acá se afloja para todos**, y eso ahora se ve en un
  diff. La forma en que muerde: el patrón de teléfono fijo de CABA, delimitado
  por bordes de palabra a los dos lados, **matchea adentro de un UUID**, y los
  enlaces del CIJ son todos UUID —`knowledge` podía citar un fallo y este
  repositorio no—. La instalación, en [`AGENTS.md`](../AGENTS.md).
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
- **Dos de `pages.yml`, las dos explicadas adentro del propio workflow.** El
  `node-version` del `setup-node` **no** es el Node de las acciones —eso es el
  `runs.using` de cada `action.yml`, que sólo se mueve subiendo la versión del
  action—, así que subir uno no apaga el aviso del otro; y el `upload-artifact`
  que nombra el aviso no está en el workflow, lo trae adentro
  `upload-pages-artifact`, que es composite. La segunda: esa misma action **deja
  fuera del artefacto los archivos que empiezan con punto**, y el día que entre
  uno **no falla nada**, simplemente no llega al sitio.
- **El rompe-caché del HTML no toca los scripts que el HTML carga.** Un `?v=`
  en la URL de la página trae la página nueva y sigue ejecutando el
  `plazos.js` viejo que ya estaba en memoria, sin ningún síntoma salvo que el
  código nuevo «no hace nada». Pasó el 26/8 midiendo la migración de
  `caducidad`. Lo que sí funciona: `fetch(url, { cache: 'reload' })` sobre cada
  script y recién después recargar. Y la regla que lo vuelve innecesario:
  **antes de medir, comprobar que el código que corre es el que se acaba de
  escribir** —que la función nueva exista—, en vez de confiar en un parámetro
  de la URL.
- **El CPCCN escribe los plazos de cuatro formas, y barrer una sola pierde la
  mitad**: «QUINCE (15) días», «será de cinco días», «dentro de tercero día» y
  «DOS (2) **primeras** horas» son el mismo dato. Barriendo sólo la del numeral
  se perdía el art. 150, que es *el* plazo de traslados. Está escrito en
  `scripts/barrer-plazos-cpccn.mjs`, con el `\b` del final de cada unidad
  comentado —sin él «en un **dia**rio» sale como un plazo de un día—.
- **`404.html` va con todas sus rutas desde la raíz**, porque GitHub la sirve
  en cualquier dirección que no existe, también adentro de `/calculadoras/`: una
  ruta relativa ahí apunta a una carpeta que no existe. Y **sugiere la página
  más parecida desde una lista escrita a mano**: una página nueva que no se
  sume ahí no rompe nada, pero no se sugiere. El servidor local no la sirve
  sola; se prueba abriendo `/404.html`.
- **Al leer un diff grande de un HTML, mirar primero si es de contenido.**
  `git diff --ignore-cr-at-eol` lo despeja en un segundo.
- **`www` depende de Cloudflare, y de dos cosas que no se ven.** Desde el 8/9
  el registro `www` está **proxeado** y lo cubre el certificado del borde
  (`*.javiercuneo.com.ar`, Google Trust Services); **el ápex sigue en gris y
  directo a GitHub**, con su Let's Encrypt. GitHub nunca emitió para `www`, y
  sacar y reponer el dominio no lo obliga: el porqué, en
  [`HISTORIA.md`](HISTORIA.md). Lo que no hay que romper: **el 301 de `www` al
  ápex lo emite GitHub, no una regla de Cloudflare** —lo muestra
  `x-github-request-id`; la regla que se creó no matchea—, y **el modo SSL/TLS
  tiene que seguir en *Full***: Cloudflare le habla al origen sin validar su
  certificado, y en *Full (strict)* se rompe, porque GitHub no tiene uno para
  `www`. Si `www` deja de andar sin que nadie lo tocara, mirar ahí primero.
  Comprobado el 11/9 con `curl` y `openssl`: sigue así.
Las que ya no aplican —el `.gitattributes` en UTF-16, el caché de Pages,
`npm run lint`— están en [`HISTORIA.md`](HISTORIA.md).
