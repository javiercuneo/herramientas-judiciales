# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-08-24 · rama `main`

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

**Los cuatro planes están cerrados.** Bugs y cálculo directo el 7/8, mediación el
8/8, y [regulación en prosa](PLAN_REGULACION_EN_PROSA.md) —la más riesgosa, la
que se dejó última— entera el 10/8: el generador con sus tres controles y
`ProsaSection.tsx`, la última sección del dashboard. Casi todo el código es de
Honorio y el detalle está en su `ESTADO.md`; de este lado quedan los planes con
qué se hizo de cada paso y qué se apartó de lo previsto.

**No queda nada urgente ni bloqueante.** Lo abierto está en
[Pendientes](#pendientes) y [Bugs abiertos](#bugs-abiertos).

### Las cuatro cifras que este repositorio sigue de Honorio

Son suyas pero salen de allá: **168 recorridos**, **28.224 cruces**,
**17 validaciones** y la versión del chip. Viven en `index.html`, en `README.md`
y —la de validaciones— también en `documentacion.html`. La fuente de las dos
primeras es la tabla de recorridos de [`01_PROCESOS.md`](domain/01_PROCESOS.md);
la de validaciones se cuenta sobre
`honorio/lib/legal/__tests__/*.validation.ts`. **Si vuelve a moverse alguna, se
mueven las cuatro.**

Ni mediación ni la prosa movieron recorridos ni cruces, y eso era el resultado
buscado: ninguna de las dos agrega una pregunta a la entrevista.

**El 14/8 se encontró que ninguna estaba al día**, y la de validaciones estaba
mal de tres formas distintas: `index.html` decía 11 en el tile, `README.md` 16 y
`documentacion.html` dieciséis, cuando son 17 —contados sobre los archivos, y
confirmado por el CHANGELOG de Honorio 3.1.1—. **El chip del propio
`index.html` ya decía 17**, así que la landing se contradecía a sí misma a
setecientas líneas de distancia. La versión del chip, en cambio, había quedado
en 3.0.0 con Honorio en 3.1.1.

Todo quedó corregido ese día. La lección es el mecanismo, no el número:
**ninguna de las tres páginas tiene build, así que nada controla esas cifras**,
y el único remedio es tocarlas cuando entra una validación nueva o sale una
versión. **Y se revisa la prosa, no solo el dígito:** la enumeración envejece
igual —`index.html` nombraba once controles y `README.md` catorce—.

---

## Pendientes

Ninguno urgente y ninguno bloqueante.

- **`data/feriados.json` se actualiza a mano, con `npm run feriados`.** Hoy llega
  hasta 2027, así que no apura, pero **nadie avisa cuando se queda corto**: si un
  día alguien computa un plazo de 2028 y el archivo no lo tiene, la calculadora
  no calcula y dice qué año falta —eso ya está resuelto— pero el que tiene que
  correr el script sos vos.
  Falta el cron que lo haga solo: un workflow de Actions con `schedule:` mensual
  que corra `npm run feriados` y commitee si el diff no está vacío; el de la UMA
  en Honorio ya hace exactamente eso y sirve de modelo. **No se armó todavía
  porque es un workflow que escribe en el repositorio**, y eso pide
  `permissions: contents: write` y una revisión con calma.
- **`data/serie-uma.json` y `data/serie-uhom.json` se cargan a mano y no hay de
  dónde automatizarlas.** Es el mismo caso que la feria: los actos de la CSJN y
  las tablas del Ministerio son PDFs sin API. Cuando sale un valor nuevo hay que
  agregar una línea, con su norma y la fecha del acto.
  **`npm run verificar-series` no puede detectar que falte el último**: detecta
  que lo cargado esté mal, no que falte algo. Lo que sí avisa es la propia
  página, que muestra desde cuándo no se revisan las series y pone un aviso a
  la vista si pasaron más de 45 días.
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
- **Hay dos bancos de pruebas y cubren cosas distintas.** `npm run
  verificar-calculos` (664 comprobaciones) cubre **el motor**: días hábiles,
  feria, feriados, cobertura. `scripts/pruebas-calculadoras.html` (51 casos, 21 de ellos contra el tablero)
  cubre **las pantallas**: maneja las cinco calculadoras por iframe y compara
  el resultado que muestran. Se abre con el sitio servido —no con `file://`— y
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
- **`calculadoras/honorarios-mediacion.html` tiene mal el rótulo del tope.** Se
  deja viva porque da un número correcto —decisión de Javier—; el arreglo es
  barato.
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
de pruebas de las pantallas —hecho el 17/8—; (3) el marco —**en la rama
`tablero-plazos`, sin mergear**—; (4) el calendario con el plazo dibujado.
Después, la tasa de justicia.

### El marco, en `tablero-plazos`

`calculadoras/tablero.html`: seis pestañas —vencimientos, distancia, caducidad,
entre fechas, regresiva y mora—, cada una un iframe de la calculadora publicada,
**sin una línea modificada de ninguna**. Carga perezosa, estado vivo al volver,
enlace directo por `#pestania`, teclas 1-6 y flechas.

**Lo que lo hace verificable:** `pruebas-calculadoras.html` corre los 16 casos
verificados **dos veces**, contra las páginas sueltas y contra las embebidas, y
exige que den lo mismo. Toda la apuesta del tablero es que embeber no cambie un
número, y eso se comprueba en vez de suponerse.

**La trampa que costó encontrar:** la mitad de las calculadoras tiene
`body { min-height: 100vh }`, y adentro de un iframe **`100vh` es el alto del
iframe**. El contenido siempre llena el marco, medirlo devuelve el alto que ya
tenía, y el alto queda clavado donde arrancó. Se anula por CSS inyectado, y el
alto se mide sobre el rect del `<body>` y no con `scrollHeight`, que nunca baja
del alto del propio marco.

**Prorrateo y tasa entran, y van agrupadas aparte.** No son plazos, y entran
igual porque **el flujo es el mismo**: en un expediente mirás un plazo y en el
siguiente un prorrateo —criterio de Javier, 17/8—. Pero la barra lleva rótulos
de grupo, «Plazos» y «Honorarios y tasa»: que compartan ventana no las hace la
misma materia, y una pestaña de honorarios pegada a una de plazos invita a leer
un número como si fuera del otro grupo. `honorarios-mediacion` **no** entró:
tiene mal el rótulo del tope (ver arriba) y no conviene darle más superficie
hasta arreglarlo.

Ya está enlazado desde `index.html`, en la bajada de la sección de calculadoras.

**Antes de mergear:** nada bloqueante. Falta que Javier lo use unos días.

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

### `--faint` reprueba AA en tema claro — 12/8

`#666e7c` sobre el fondo `#e9ebee` da **4,30:1**, contra los 4,5 que pide AA para
texto chico. Y el token se usa justamente en texto chico: `.label` a 11,2 px en
mayúsculas, el colofón, y las fechas. En oscuro está bien (`#828a98`, 5,51).

Medido en `index.html` y en `quien-soy.html` con el mismo resultado: **es del
sistema visual, no de una página.** Por eso no se tocó al pasar — el token está
duplicado en `index.html`, en `documentacion.html` y en
`calculadoras/css/comun.css`, así que arreglarlo es un cambio en las trece
páginas y se verifica en las trece. Bajarlo a `#5f6774` alcanza para pasar.

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
es texto chico, que es justo donde el piso de contraste es 4.5. (Está abierto que
en claro no llega: ver arriba.)

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
  raíz tiene **cuatro scripts y nada más**: `docs`, `verificar-docs`,
  `verificar-calculos` y `feriados`. `check`,
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
