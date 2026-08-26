# Historia del proyecto

Lo que se hizo y quedó cerrado: cómo se llegó hasta acá, qué se rompió y ya se
arregló, qué se discutió y se decidió.

**No hace falta leer esto para trabajar.** Para eso está
[`ESTADO.md`](ESTADO.md), que lleva sólo lo que está abierto, lo que está roto y
las trampas vivas. Este archivo se abre cuando aparece una pregunta concreta:
«¿por qué esto quedó así?», «¿esto ya se probó?», «¿de dónde salió esta regla?».

El texto está tal cual se escribió en su momento, sin reescribir. Las fechas son
de 2026.

---

## PDF Studio fallaba callada y pasó a llamarse Escribiente — cerrado el 17/8

La herramienta venía heredada de una plantilla de Google AI Studio y nunca se
había leído. Javier la describió como que «por momentos siento que no anda».
Andaba mal siempre; lo que nunca hacía era decirlo.

**Seis bugs, y ninguno rompía nada visible.** Todos devolvían un archivo con
aspecto correcto, que es lo que los hizo durar meses publicados. Los cuatro
primeros se encontraron leyendo y corriendo el código viejo; los dos últimos
aparecieron probando el código nuevo con documentos de prueba, que es la lección
más útil de todas.

1. **Una resolución de una carilla salía con 2 de sus 12 líneas.** El umbral de
   «esto se repite en todas las páginas, es un membrete» era `páginas * 0.4`.
   Para un documento de una página eso da 0,4, y cualquier línea aparece una
   vez, que es más. Se borraban el `Resuelvo`, el monto regulado y la firma.
   Como la mayoría de las resoluciones y los escritos tienen una o dos carillas,
   el caso roto era el caso normal.

2. **`$ 3.255.622,50` se convertía en `$ [DNI],50`.** Un DNI con puntos tiene
   exactamente la misma forma que un monto. El anonimizador destruía la cifra
   de la que depende la resolución entera.

3. **El nombre del archivo se filtraba en el documento anonimizado.** El
   Markdown se armaba como `"# " + archivo.name` y recién después se
   anonimizaba, pero los nombres de archivo del PJN son la carátula entera
   —`PEREZ JUAN c GARCIA MARIA s DAÑOS.pdf`—. La única función que existía para
   no filtrar nombres publicaba los dos apellidos más importantes del
   expediente, en la primera línea.

4. **Pedir las páginas «1, 5, 900» de un documento de 10 devolvía la 1 y la 5,
   sin avisar.** Las páginas fuera de rango se descartaban en silencio.

5. **`Jueza` al final de un renglón se comía el renglón siguiente.** El
   separador entre el tratamiento y el nombre era `\s+`, que incluye el salto
   de línea. Una resolución que cerraba con «Firmado por: LOPEZ MARIA, Jueza» y
   abajo el pie del sistema quedaba como «Jueza [PERSONA] - Lex100».

6. **Un expediente de 5 fojas perdía 30 de sus 35 líneas.** Dos causas sumadas:
   la ventana de «borde» era fija —4 líneas arriba, 6 abajo—, así que en una
   foja de 9 renglones abarcaba la página entera; y la expansión por parecido,
   pensada para agrupar «Pág. 1/10» con «Pág. 2/10», no tenía límite de largo,
   y dos renglones de prosa que difieren en un dígito se parecen más del 60%.

**Lo que no era un bug pero importaba igual.** El `README.md` era el de Google
AI Studio, con su banner y la instrucción de cargar una `GEMINI_API_KEY` para
una aplicación que no hace ninguna llamada a ninguna API. Para una herramienta
cuyo argumento es que el documento no sale de la máquina, eso no es residuo
cosmético: es la documentación diciendo que le manda los expedientes a Google.
Iban en el mismo paquete `metadata.json` con `SERVER_SIDE_GEMINI_API`,
`.env.example`, y un `server.js` con Express que nunca se usó —lo publicado
siempre fue la carpeta estática—.

La landing, además, prometía «comprimir» PDF, función que nunca existió, y no
mencionaba ni la conversión a Markdown ni la anonimización, que son las dos
cosas por las que la herramienta existe.

### Se rehizo entero, y por qué no se parchó

Quedaba poco que preservar. Las partes valiosas eran justo las rotas, el
anonimizador había que reemplazarlo por uno con reglas ya probadas, y el
envoltorio era residuo de una plantilla. Contra
eso pesaba la regla de la casa: **una herramienta publicada tiene que estar bien
o no estar publicada.**

Las decisiones que quedaron, en `ESTADO.md`: la anonimización en dos niveles con
el humano decidiendo los nombres propios, y la promesa de privacidad apoyada en
la CSP y en las librerías versionadas adentro del repositorio.

El nombre lo eligió Javier: **escribiente** es un cargo real del PJN, donde
trabaja, y es literalmente quien pasa documentos a texto. La URL vieja
`/PDF-studio/` queda viva con un aviso.

### Lo que se corrigió al portar las reglas

Traerlas sirvió para encontrarles tres fallas, que valen también para la
versión de la que salieron:

- el orden de las dos reglas de expediente estaba invertido, y la general
  enganchaba la mitad derecha antes de que la específica pudiera tomarlo entero:
  `Expte. 56.868/2017` quedaba como `Expte. 56.[EXPTE]`;
- el patrón de DNI solo se protegía del signo `$`, así que
  `la suma de 1.500.000` se convertía en `[DNI]`;
- el patrón de email se comía el punto final de la oración.

---

## La feria de julio se deducía con una fórmula, y la fórmula estaba mal — cerrado el 17/8

Dos bugs que convivieron años, encontrados el mismo día por la misma razón: se
fue a verificar una afirmación de `ESTADO.md` en vez de creerle.

**Lo que decía `ESTADO.md`:** que `mora.html` tenía su propia copia de la lógica
de feria, pero que era «duplicación de código, no divergencia de datos, así que
no cambia ningún número». Estaba afirmado sin medirlo, y era falso.

### Primer bug: dos reglas distintas, ninguna fundada

`calendario-judicial.js` deducía el inicio de la feria de invierno con el
**penúltimo lunes de julio**; `mora.html`, con el **tercer lunes**. Coinciden
cuando julio tiene cuatro lunes y difieren en **una semana entera** cuando tiene
cinco. Los años en que se había probado —2021, 2022, 2025, 2026— son justo los
que coinciden. Por eso nadie lo vio.

Javier trajo las **21 Acordadas de la CSJN** de 2004 a 2026. Contra ellas:

| regla | acierta |
|---|---|
| penúltimo lunes (`calendario-judicial.js`) | 12 de 21 |
| tercer lunes (`mora.html`) | 16 de 21 |

Ninguna acierta 2005, 2006 ni 2008. Y ninguna fórmula puede producir los dos
años que rompen el molde:

- **2009**, gripe A. La Acordada 8/2009 fijó la feria del 20 al 31 de julio; la
  21/2009 la **rectificó** al 6 al 17; la 23/2009 la amplió del 20 al 24; y la
  27/2009 dispuso el cese, retomándose la actividad el lunes 27. Son **dos
  rangos**, no uno, y el rango que declaraba la Acordada original quedó sin
  efecto.
- **2020**, COVID. La Acordada 21/2020 suspendió la feria **ordinaria** de
  julio, y **eso no significa que julio haya sido hábil**: once Acordadas
  encadenadas declararon feria judicial extraordinaria desde el 16 de marzo
  hasta el 3 de agosto sin interrupción.

Ese último punto lo cometió este mismo trabajo. La primera versión del archivo
afirmaba que «en 2020 no hubo feria: julio corrió entero como hábil», con un
test que lo consagraba. Se leyó «se suspendió la feria» como «hubo actividad».
Lo corrigió Javier al pasar las once Acordadas de la feria extraordinaria, que
no le habían sido pedidas. **De ahí que el archivo lleve rangos y no un rango:**
un año puede tener varios, y el modelo de datos que sólo admite uno obliga a
mentir.

**La feria es un acto normativo, no aritmética.** Pasó a
[`data/feria-judicial.json`](../data/feria-judicial.json), un año por línea con
su Acordada y el enlace al texto. Cambió **171 de 8064** cruces de fecha por
plazo (2,1 %), **todos en 2023 y 2024**, que son exactamente los años en que la
heurística fallaba: la corrección es quirúrgica y verificada.

Sobrevive un invariante que aportó Javier y que las 21 Acordadas confirman:
**12 días, de lunes a viernes**, porque son dos semanas de vacaciones escolares
—la Corte sigue el calendario del Ministerio— menos el último sábado y domingo,
que quedan inhábiles igual por fin de semana. Sirve para detectar un error de
carga; no para deducir el año que falta.

### Segundo bug: una caducidad que operaba un mes antes

Buscando lo anterior apareció otro, en `caducidad.html`. Cuando el vencimiento
caía dentro de la feria, el ajuste hacía:

```js
fullDate.setDate(endJulioFull.getDate() + 1);
```

que mezcla dos fechas: toma el **día del mes** del fin de feria y lo aplica al
**mes** de `fullDate`. Mientras la feria terminó en julio no se notó. Cuando
termina en agosto —2007, 2008, 2014, 2019, 2025— el fin cae 1 o 2, y un
vencimiento del 25 de julio de 2025 se movía al **2 de julio**: 33 días hacia
atrás. Una caducidad que operaba un mes antes de lo que decía la pantalla, en
el año en curso.

### Lo que quedó, que vale más que los dos arreglos

**`npm run verificar-calculos`** ([`scripts/verificar-calculos.mjs`](../scripts/verificar-calculos.mjs)),
647 comprobaciones. Era el primer control automático sobre un resultado de
cálculo del repositorio: hasta ese día `verificar-docs` miraba que las citas de
la ley existieran y nada miraba que las cuentas dieran. Carga el motor con un
`window` y un `fetch` de mentira que leen el disco, sin dependencias.

Y dos reglas nuevas en el motor, que salieron de dos errores de diseño de esta
misma sesión:

- **La feria de un año futuro no se puede tener** —la Corte dicta la Acordada
  en abril o junio de ese mismo año—, así que bloquear la herramienta por falta
  de dato la dejaría muerta todos los años. La primera versión hacía
  exactamente eso: `caducidad.html` abría diciendo «no se puede calcular»
  porque pedía hasta 2027.
- **Tener la feria de un año no alcanza para calcular en ese año.** Al cargar
  las Acordadas desde 2004 quedaron diecisiete años con feria pero sin feriados
  nacionales ni asuetos, o sea con el día evaluado a medias y sin que nada lo
  dijera. De ahí la **ventana de cobertura**, declarada en el archivo de datos y
  no en el código: desde 2021, que es desde cuándo están los tres insumos.

Las dos se resuelven igual: el motor **anota** cada año problemático que un
cálculo llega a tocar, y el que calcula pregunta antes de mostrar. Lo anota el
motor, no el que lo llama, para que no se pueda olvidar en una calculadora.

Completar 2004-2020 sería ir a buscar cada feriado y cada asueto de diecisiete
años. Se decidió que no vale la pena —nadie computa un plazo de 2007— y las
ferias viejas se conservan sólo como evidencia: son las que probaron que la
heurística estaba mal.

### Y `mora.html` dejó de tener lógica propia

Era la última. Tenía las dos divergencias juntas —tercer lunes de julio, y los
feriados nacionales pedidos a `api.argentinadatos.com` en vivo, porque el
arreglo del 13/8 no la había alcanzado—.

**Lo que no se tocó fue la aritmética de mora**, para que si un número se movía
fuera por la feria o por los feriados y no por el cómputo. Su
`nextBusinessDayStrict` más el conteo inclusivo de `countBusinessDaysFrom`
equivalen a un salto de día hábil si la notificación cae hábil y dos si cae
inhábil —la notificación se tiene por hecha el hábil siguiente y el plazo corre
desde el día después—, que es la misma lectura que hace `vencimientos.html` para
la cédula en día inhábil. Se dejó escrito así, sin simplificar, con un comentario
que lo explica.

Buscando cómo migrarla apareció un tercer agujero, del mismo tipo que los dos
anteriores pero por el otro insumo: **el motor auditaba los años sin feria y no
los años sin feriados.** Los feriados se cargan por año pedido, así que un
cómputo que cruzaba a un año no pedido los perdía en silencio y contaba como
hábiles días que no lo eran. Quedó auditado igual.

Y las cinco calculadoras dejaron de tener cada una su propia prosa para explicar
por qué no calcula: la frase vive en `problemaDeDatos()`, en el motor. Cinco
copias del mismo texto en cinco archivos sin build se desincronizan, que es
exactamente lo que ya había pasado con las cuatro cifras de Honorio.

---

## El desplegable de modalidad preguntaba algo que el programa ya sabía — cerrado el 17/8

`vencimientos.html` ofrecía tres opciones, y las dos primeras eran:

- «Por cédula (art. 152) — **Día y hora hábil** (entre las 7 y las 20 hs.)»
- «Por cédula (art. 152) — **Día y hora inhábil** (después de las 20 hs.)»

El rótulo dice «día **y** hora», pero el que lo lee está pensando en la hora:
diligenció la cédula a las 15, elige «hábil», y sigue. **El programa, en
cambio, usaba esa elección también para el día** —que es un dato que ya tiene—,
así que elegir «hábil» un sábado devolvía el vencimiento **un día antes**.

Lo planteó Javier el 17/8, con el ejemplo del día: era lunes 17 de agosto,
feriado por el Paso a la Inmortalidad de San Martín.

### La regla, que resulta ser una sola

Los dos supuestos que el desplegable presentaba como distintos son el mismo: la
cédula **se tiene por practicada el primer día hábil a partir del momento en que
se diligenció**, y el plazo corre desde el hábil siguiente a ese.

| día | hora | practicada |
|---|---|---|
| hábil | en horario | ese mismo día |
| hábil | fuera de horario | el hábil siguiente |
| inhábil | cualquiera | el hábil siguiente |

**Los dos últimos no se acumulan**, y eso lo marcó Javier expresamente: un
sábado a las 23 suma un día, no dos. Por eso la condición es una sola —
`esDiaHabil(fecha) && horaHabil` — y no dos sumandos. Hay dos invariantes que lo
comprueban forzando el casillero a verdadero sobre un sábado y un domingo.

Quedó una sola opción de cédula, y el casillero de la hora **aparece sólo cuando
el día es hábil**, que es cuando la hora decide algo. Si el día es inhábil, en
vez de una pregunta inútil la pantalla explica por qué ese día no cuenta —
citando el motivo: fin de semana, feria con su Acordada, puente turístico—.
Obligar a cargar la hora se descartó por fricción: es un dato que casi siempre
es «en horario».

### Y agarró dos errores en las pruebas del día anterior

Dos casos del banco marcados **«verificados a mano»** empezaron a fallar, y
tenían razón:

- `18/07/2024`, que yo había rotulado «Cédula hábil», **cae dentro de la feria**
  (Ac. 16/2024).
- `10/07/2026`, ídem, es **puente turístico** pegado al 9 de julio.

La aritmética estaba bien derivada desde el inicio del conteo; lo que nunca se
comprobó fue si el día de la notificación era hábil, **porque el desplegable
obligaba a elegirlo y se lo dio por sentado**. Es exactamente la trampa que el
cambio elimina, y alcanzó para meterse en un archivo cuyo propósito declarado es
no dar nada por sentado. Los dos casos quedaron corregidos, con el error escrito
al lado.

---

## Caducidad: el ancla del día se caía en febrero — cerrado el 18/8

Javier trajo un cálculo para que se lo explicaran —último acto 30/12/2025, seis
meses— y salieron tres cosas.

### La regla, con la norma en la mano

El art. 310 CPCCN fija el plazo **en meses**, así que se cuenta por el art. 6
CCyC: **de fecha a fecha**, y «cuando en el mes del vencimiento no hubiera día
equivalente al inicial del cómputo, se entiende que el plazo expira el último día
de ese mes». El art. 311 agrega que el plazo **corre durante los días inhábiles
salvo los que correspondan a las ferias judiciales** —por eso la calculadora no
suma feriados ni fines de semana, sólo ferias—.

De ahí sale la fricción que señaló Javier: **se mezcla un cómputo de meses (art.
310) con uno de días (la feria de julio son doce días corridos)**, y el art. 6
los cuenta distinto.

El cómputo, para el caso: enero no computa, así que los seis meses corren del
30/1 al 30/7/2026 —el tramo de febrero termina el 28 porque no hay 30, pero el
ancla vuelve a ser 30 en marzo—. Después la feria de invierno suspende el
cómputo: al 19/7 quedaban 11 días de plazo, que se cuentan **del 1 al 11 de
agosto**, porque del 20 al 31 de julio el reloj está frenado. **11/08/2026.**

Javier había llegado al mismo lugar y se le escapó un día al final: propuso sumar
**11** días —los que van del 20 al 30 de julio, o sea los de feria que caen dentro
de la ventana nominal— y son **12**. Sumar 11 al 30/7 usa el 31 de julio como si
el reloj hubiera avanzado ese día, y no avanzó: todavía es feria. Su propia
formulación —«los días a contar desde el 1/8»— da 11/8; la suma era la que
fallaba. Correr el vencimiento nominal por la **duración entera** de la feria es
lo mismo: 30/7 + 12 = 11/8.

### El bug: el ancla se arrastraba

La calculadora daba **9/8/2026**. El bucle de meses mutaba una sola fecha, así
que al pasar por febrero el día quedaba clavado en **28** y los cinco tramos
siguientes salían de ahí. Consecuencia:

| último acto | caducidad (antes) | (después) |
|---|---|---|
| 28/12/2025 | 9/8/2026 | 9/8/2026 |
| 29/12/2025 | 9/8/2026 | 10/8/2026 |
| 30/12/2025 | 9/8/2026 | **11/8/2026** |
| 31/12/2025 | 9/8/2026 | 12/8/2026 |

**Cuatro días de diciembre daban la misma caducidad**: impulsar el 31 no compraba
nada respecto de impulsar el 28, y siempre erraba hacia adelante —la caducidad
aparecía antes de lo que corresponde—. De 6.573 cruces de fecha por plazo entre
2021 y 2026 cambiaron **147 (2,2 %)**, con un corrimiento máximo de 3 días.

De paso quedó escrito por qué saltear enero **avanzando un mes** es exacto y no
una aproximación: el tramo que se descarta trae días de diciembre que sí deberían
contar, y el primer tramo que computa trae los días de enero que no deberían.
Son `31 − D` en los dos casos, así que se cancelan.

### La negativa se escribía donde nadie la ve

`caducidad.html` tiene un segundo resultado —«con días inhábiles y feriados»—
dentro de un bloque con `display: none`. La guarda por falta de datos que se
agregó el 17/8 escribía **ahí**: un plazo que alcanzaba 2027 mostraba
`25/7/2027` en pantalla, calculado con **cero días de feria**, mientras la
negativa quedaba en el bloque oculto.

Y moverla no alcanzó: el cálculo ordinario no pasa por `esDiaHabil` —pregunta los
rangos con `obtenerFeriasDelAnio` directo— así que la auditoría del motor nunca
se enteraba. El año faltante se anota ahora en el propio `feriasDe()`.

**El banco de pruebas tenía el mismo error de fondo**: su driver leía
`#resultDateFull`. Un elemento oculto responde igual a `getElementById`, así que
las pruebas venían validando un número que ningún usuario ve.

### Y una cita mal puesta, del día anterior

Al reescribir el pie de `mora.html` se arrastró una etiqueta del código viejo que
llamaba a la feria de enero «art. 257 CPCCN». **El art. 257 es el plazo de diez
días para interponer el recurso extraordinario** —así lo usa la propia `mora`
unas líneas más arriba, y así lo dice `documentacion.html`—. La feria de enero no
la fija el CPCCN. Quedó sin cita hasta confirmar cuál corresponde.

---

## El dominio, cerrado el 5/8

`javiercuneo.com.ar` registrado en NIC —tomó unos días porque el nombre coincide
con el de una persona y pidió DNI y revisión a mano—, DNS en Cloudflare **sin
proxy** (nube gris, para que GitHub pueda emitir el certificado), y configurado
como *custom domain* del repositorio. Enforce HTTPS tildado y andando.

Cosas que conviene tener escritas porque no son obvias:

- **Con dominio propio, un *project page* se sirve en la raíz del dominio.**
  Desapareció el `/herramientas-judiciales/` de la ruta:
  `javiercuneo.com.ar/calculadoras/tasa.html`. Como todos los enlaces internos
  son relativos, no se rompió nada.
- **El CNAME no va.** Se pensó agregarlo y está mal: el sitio se publica con un
  workflow propio de Actions, y para esa fuente la documentación de GitHub dice
  que no se crea ningún `CNAME`, que uno existente se ignora y que no hace
  falta. El dominio vive en la configuración de Pages. Un `CNAME` en `site/`
  sería un archivo que no hace nada y que la próxima sesión tendría que
  averiguar por qué está.
- **Los enlaces viejos no se rompieron**, a diferencia del renombre del 4/8.
  `javiercuneo.github.io/herramientas-judiciales/…` devuelve **301 al dominio
  conservando la ruta** —comprobado—, así que el enlace de LinkedIn siguió
  andando sin tocarlo.
- `www.javiercuneo.com.ar` **no resuelve**: no existe el registro. Si molesta,
  va un CNAME `www` → `javiercuneo.github.io` en Cloudflare, gris también.

El barrido de URL absolutas está hecho: eran 17 acá —15 en `README.md`, el
`og:image` de `index.html` y una en `INFORME_REFACTOR_SHARED_CSS.md`— más la
cadena de *User-Agent* de `distancia.html`. Comprobadas contra el destino nuevo.
En el repositorio de Honorio eran 4 y también están.

---

## Las calculadoras, cerradas el 5/8

Cada una es un HTML con su CSS y su JS adentro, escritas en momentos distintos.
`calculadoras/css/comun.css` define los tokens del sitio —cobalto `#1E45CE`,
neutro frío, `radius 0.375rem`, Archivo para títulos— más una base mínima de
controles, tablas y pie. **Las once lo cargan antes de su propio `<style>`**,
así que lo local sigue ganando y cada archivo conserva su layout.

**Lo que dejó probado [`INFORME_REFACTOR_SHARED_CSS.md`](INFORME_REFACTOR_SHARED_CSS.md)**
(31/7), y no hace falta rediscutir:

- La duplicación del 72 % es de **líneas de propiedad sueltas**, no de reglas.
  Reglas CSS completas idénticas en dos o más archivos: **9 %**.
- Los `<style>` no son copias sino **hermanos con variaciones hechas a mano**.
  Por eso **no existe extracción mecánica segura**: cualquier CSS compartido
  real obliga a normalizar, y normalizar cambia el aspecto de las páginas.
- Su plan de unificar sobre el degradé violeta `#667eea → #764ba2` con
  Montserrat **quedó viejo**: es anterior al rediseño de la landing. Del plan
  sirve todo lo procedimental.

### Las tres lecciones que dejó el trabajo

Se conservan porque las tres se van a repetir:

1. **Para que una tabla no estire la página, el contenedor con `overflow-x` no
   alcanza.** Un ítem de flex no baja de su contenido sin `min-width: 0`, y
   `flex: 0 0 400px` significa «no encogerse nunca». Son tres arreglos:
   envolver en `.tabla-scroll`, `min-width: 0`, y permitir que encoja. Medido en
   `prorrateo`: de 753 px de contenido en 406 de viewport a 406 = 406.
2. **Un control estático no sustituye una medición.** Ocho de las once habían
   pasado un control de «tokens aplicados, sin violeta, sin texto invisible» y
   daba verde. Un barrido de contraste sobre estilos computados encontró **27
   fallas en oscuro y 9 en claro** —hoy cero—, incluidos dos botones principales
   con **contraste 1.00**, blanco sobre blanco, en los dos temas y en
   producción. La causa fue un ciclo de variables CSS; está en las trampas de
   `ESTADO.md`.
3. **Medir con los paneles ocultos subestima.** Las pantallas 2 a 4 de
   `ejecucion-estado` arrancan en `display:none` y la primera pasada no las vio.
   Hay que forzarlas visibles. Ojo: eso mismo **inventa desbordes** —apila
   pantallas que nunca conviven—, así que el ancho se mide en una pasada
   aparte, sin tocar nada.

Y una de fondo: **el resto de las fallas vino de un reemplazo masivo, que no
puede ver el contexto.** `--border` usado como fondo de botón, grises planos que
la conversión no alcanzó, y el violeta `#667eea` que este documento daba por
erradicado, escrito `rgba(102,126,234)` en seis lugares porque la conversión
buscaba hex.

**Emojis:** salieron los 39 de contenido. Los iconos del timeline de
`ejecucion-estado` pasaron a números. **El `✓` del paso completado se queda:** es
una marca tipográfica monocroma, no un emoji.

---

## Los ocho documentos de dominio, cerrados el 7/8

Siete se reescribieron contra el motor; el `07` solo necesitó retoques.
**El detalle de qué decía mal cada uno está en el propio documento**, en su
sección final «Qué decía este documento y no era así». Acá va solo lo que no
cabe en ninguno de los ocho.

De paso salieron dos errores en Honorio, ya arreglados allá: la tarjeta de la
medida cautelar prometía el porcentaje contrario al que el motor aplicaba, y la
transformación se atribuía al art. 29 inc. e en vez de al 37.

### Por qué salieron mal

**La firma del error era clara.** Lo que estaba bien en los ocho era el relato
general —hay una escala, hay reducciones en tres etapas, el procurador sale del
patrocinante—. Lo que estaba mal era **todo lo que exigía mirar algo concreto**:
el número del artículo, el nombre de una clave, el orden de los pasos, si un
mecanismo existe. Y los artículos del `04` no estaban sueltos sino **corridos en
bloque**. Esa firma es inconfundible: **se generaron a partir de una descripción
del sistema, no del sistema.** Una descripción conserva la estructura y pierde
los datos, y por eso sonaban plausibles.

Hubo un segundo mecanismo, el de los inventos «útiles»: el control de mínimos
del `03` no salió de la nada, salió de que un sistema de honorarios con mínimos
legales **debería** verificarlos. Lo mismo el «total general» y el «25 % si la
cautelar se despacha».

**Y el más importante, porque explica por qué los docs salieron peor que el
código que describen:** el motor calcula bien y las validaciones estuvieron en
verde todo el tiempo. El código tiene compilador, tipos y 830 afirmaciones que
corren en cada push. **La prosa no tiene nada.** El mismo proceso produce código
que funciona y prosa confiadamente falsa, porque uno tiene realimentación y la
otra no.

La pasada del 5/8 **funcionó** —por eso el `07` no hubo que reescribirlo— pero
tuvo dos límites: se verificó contra la ley también las afirmaciones sobre el
código, que la ley no puede contestar; y se corrigió la instancia señalada en
vez de la clase, que es lo que dejó cuatro «50 % parcial / 100 % total» vivos en
el `05` con el encabezado declarándolos arreglados. **Una nota de verificación
que no es cierta es peor que ninguna**, porque el que la lee deja de mirar.

### El único error que cambiaba un número

`05_DEPENDENCIAS.md` decía, en cinco lugares y en su diagrama de orden general,
que las reducciones de los arts. 22 y 40 se aplican **sobre el monto de la
escala**. Se aplican sobre la base, antes de la escala. Como la escala es
progresiva, reducir la base puede hacerla caer a otro tramo:

```
demanda desestimada (-30 %, art. 22), base $50.000.000, UMA $102.076

MOTOR   base × 0,7 y después la escala  →  5ª escala: 61,93 UMA = $6.321.798
DOC 05  la escala y después × 0,7       →  6ª escala: 66,62 UMA = $6.800.776
                                            $478.978 de más — 7,6 %
```

**Quien hubiera regulado siguiendo ese documento habría dado casi medio millón
de más en ese caso.** Está anotado acá y no solo allá porque es la clase de cosa
que se puede volver a introducir sin darse cuenta.

### Qué se hizo para que no se repita

1. **La regla de fuentes, en [`AGENTS.md`](../AGENTS.md).** Tres tipos de
   afirmación y tres fuentes distintas: la ley se verifica contra el texto, la
   app contra el código leído, y una interpretación no se verifica —se declara—.
   Más las tres consecuencias: anclar cada afirmación a algo que se pueda abrir
   o correr, no tratar ninguna descripción secundaria como oráculo, y no firmar
   una nota de verificación que no sea cierta.
2. **`npm run verificar-docs`** (`scripts/verificar-docs.mjs`). **No verifica que
   los documentos sean ciertos —eso no se puede automatizar— pero caza la clase
   de error que salió más cara: la cita inventada.** Tres controles: normas
   (`Ley NN.NNN`, `Decreto NNN/AAAA`) contra el texto de la ley más una lista
   blanca con el motivo de cada una; artículos de la 27.423 contra los
   encabezados reales del texto; e identificadores y rutas entre backticks
   contra el código. **Corre en CI antes de armar el sitio**, así que una cita
   inventada no llega a producción.

**Tres cosas del script que costaron y conviene no volver a descubrir:**

- **Se auto-validaba.** `scripts/` está en el corpus, así que sus propios
  comentarios —que citan `escala_art21` como ejemplo de lo que hay que cazar—
  hacían que el control pasara. Pasó de verdad, en la primera corrida de la
  prueba de regresión. Ahora se excluye a sí mismo.
- **La sección «Qué decía este documento y no era así» cita normas falsas a
  propósito.** El `04` nombra un decreto inexistente justamente para decir que
  no existe. Esa sección se saltea, detectada por el encabezado.
- **`honorio/` no está en CI.** Los identificadores del motor salen como no
  verificables y no hacen fallar: un rojo que depende de si alguien clonó algo
  no sirve. Lo que sí falla en CI son las normas y los artículos, que es la
  clase de error más cara. `--sin-honorio` simula localmente lo que ve CI.

**Lo que no caza, para no confiarse:** artículos que existen pero se citan para
lo que no son —el `art. 51 inc. 8` del `05` pasa, porque el art. 51 existe—, y
cualquier afirmación de fondo. Eso sigue siendo leer el motor.

### Reparto entre documentos, para que no se dupliquen

El `01` va proceso por proceso: qué pregunta cada uno y qué hace con la
respuesta. El `02` va por lo que los ocho tienen en común: el recorrido y el
orden del cálculo. El `04` va por las cosas —cada entidad jurídica contra su
tipo real—. El `05` dice qué depende de cada pieza compartida y qué validación
corre qué. El `06` es la tabla comparativa. Cada uno remite al otro en vez de
repetirlo.

Dos aclaraciones que hubo que agregarles y conviene no borrar:

- **`08_DEUDA_TECNICA_FUNCIONAL.md` no es una lista de trabajo pendiente**: eso
  es [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md). Y describe el motor
  clásico: donde dice `calculations.js` o `core.js` se habla de
  `asistente-honorarios-clasico/`. Está dicho en el encabezado en vez de
  reescribir 28 entradas que como catálogo de decisiones siguen valiendo.
- **La sección «Lo que la ley dice y el motor no hace» del `02` es lo primero
  que envejece.** Quedó vieja el mismo día en que se completó el plan que salió
  de ella. Ahora cada entrada dice qué se hizo, o por qué se decidió no hacerlo.

---

## Lo demás que se hizo, en orden

### `quien-soy.html` — 12/8

Página nueva, enlazada desde la sección «Autor» del index y desde los dos
colofones, y agregada a la allowlist de `pages.yml`. Sin ella en esa lista la
página existe en el repositorio y no en producción, que es lo que ya pasó con
PDF-studio.

**Por qué una página y no más texto en el index.** La sección `#autor` sostiene
la tesis del sitio —el código lo escribe un modelo, el criterio no— en tres
párrafos, y ese largo es el correcto ahí: quien entra a la landing viene a
buscar una calculadora. Pero esa tesis es también lo único que distingue este
trabajo de cualquier otro repositorio de calculadoras, y en tres párrafos no
entra lo que la sostiene: qué parte del trabajo es propia y cuál no, y cómo se
decide cuando la ley admite más de una lectura. El index quedó como estaba y
ahora enlaza a la versión larga.

**Lo que la página afirma de más que el index**, y que es el motivo de que
exista: que no se escribió el código, que no se eligió la arquitectura, y que
las decisiones técnicas se adoptaron preguntando. Declarado así, «hecho con IA»
deja de ser una frase que tapa y pasa a delimitar dónde está el aporte:
elegir el problema, decidir los puntos ambiguos, dejarlos escritos y darse
cuenta cuando el número está mal.

**No repite ninguna cifra.** Ni versiones, ni cantidad de validaciones, ni
cruces de la entrevista. Todas esas viven en el index y en Honorio, y una cifra
duplicada en una página sin build es una cifra que se desincroniza. Donde haría
falta un número, hay un enlace.

**Verificación.** Contraste sobre estilos computados, en los dos temas, con las
transiciones desactivadas —sin eso `getComputedStyle` devuelve el color a mitad
de la animación y da números inventados: la primera medición dio 1,15 en un
elemento que está en 18,15—. Todo pasa AA salvo `--faint`, que es del sistema
visual y no de esta página. A 390 px no hay scroll horizontal ni elementos
desbordados, y la línea de tiempo del recorrido colapsa a una columna.

**Un bug propio, encontrado midiendo.** `.btn-solid` había quedado con
`color: #fff`, que en tema oscuro es blanco sobre el acento aclarado: **2,68:1**,
reprueba AA. `index.html` ya lo tenía resuelto con `color: var(--bg)`, que se
invierte solo con el tema. Copiada esa solución, queda en 6,28 claro y 7,15
oscuro. Es exactamente la clase de error que un control «tokens aplicados, sin
colores planos» deja pasar.

### La landing decía mal lo que hace — 6/8

«Barre los **25.600 recorridos posibles** de la entrevista» era una cifra
correcta describiendo otra cosa: 25.600 no son recorridos sino **cruces**, cada
recorrido contra cada otro, que es lo que barre `retroceso.validation.ts`. Eso
es el **flujo hacia atrás**, el bug del 3/8: volver atrás y cambiar el tipo de
proceso dejaba pegada una respuesta que el recorrido nuevo ya no pregunta, y el
motor clásico tenía el mismo agujero —por eso `AGENTS.md` dice que no sirve de
oráculo—. Era peor que un error de redondeo: una cifra más impresionante que la real,
describiendo algo distinto, en la sección que sostiene la credibilidad del
sitio. Ante alguien del palo, no cerraba. Se corrigió también en `README.md`.
(Los números de hoy son otros: están en `ESTADO.md`.)

**Y «casos conocidos» daba a entender una autoridad externa que no hay.** Cada
caso es una entrada con su resultado esperado, escrito a mano en el archivo de
validación: no hay jurisprudencia ni tabla oficial detrás. **Lo que garantizan
las validaciones es consistencia, no corrección** —que el número de hoy sea el
de ayer salvo que alguien haya decidido cambiarlo y lo haya escrito—. Un usuario
puede decir «esto está mal» y tener razón, y la app no lo contradice. Ahora la
landing lo dice.

De paso se sacó el registro de la columna: «suites, una por concern», «no conoce
React ni el DOM», «función pura», «refactor». Si el que entra es abogado, esa
columna no le decía nada.

### La guía de uso — 5/8

`documentacion.html` estaba enlazada desde el hero y contradecía a la landing.
Reescrita entera sobre el sistema visual del sitio. **Lo que se conservó, porque
era lo que valía:** todo el contenido normativo y sobre todo las advertencias de
alcance, con **un bloque explícito de qué NO hace** por herramienta, que es lo
que decide si el resultado se puede usar.

De ahí sale una lección que se paga cara: **al documentar una herramienta, leer
lo que hace, no lo que su nombre sugiere.** La advertencia sobre la ampliación
por distancia se escribió mirando una sola de las dos pestañas de
`distancia.html`, y decía que mide en línea recta. Lo corrigió Javier el 5/8: el
segundo modo mide **por ruta** (OSRM, sobre la red de OpenStreetMap), que es el
que se acerca al criterio de la Corte. La guía ahora explica cuál usar —la de
ruta manda, la lineal sirve de piso— y que donde la Acordada 5/2010 fija la
distancia al asiento federal, manda la Acordada.

El 7/8 se le agregaron al bloque «qué no hace» de Honorio las dos previsiones
que el plan de cobertura decidió declarar y no implementar: el 4 % del art. 42
—que se calcula sobre los fondos disponibles en favor de terceros, un dato que
la entrevista no tiene— y el porcentaje mayor por labores altamente complejas
del art. 21, que es una facultad del juez por auto fundado. **Las dos van con el
motivo**, porque «no lo hace» sin el porqué se lee como una carencia y son
decisiones.

Ya no tiene emojis, así que la excepción que `AGENTS.md` anotaba está saldada.

---

## Decisiones cerradas, y por qué

Las que siguen gobernando trabajo del día a día están en `ESTADO.md`. Éstas ya
no se discuten, pero conviene saber contra qué se estaría discutiendo.

### El nombre y el dominio

`Herramientas-Judiciales-IA` pasó a **`herramientas-judiciales`** el 4/8. Lo que
se buscaba era sacar el `-IA`: en 2023 era una señal, hoy es el default y ubica
al autor del lado del que usa la herramienta de moda, no del que tiene el
dominio.

Ese renombre **rompió la URL vieja de Pages sin redirección** —404 duro,
verificado— y hubo que cambiar a mano cualquier enlace compartido antes, incluido
el de LinkedIn. GitHub redirige las URL del repositorio, pero no las del sitio.
**Ese fue el argumento más fuerte para pasar a dominio propio.**

`honorio.ar` es un dominio de *producto*, no el paraguas: si Javier construye
algo que no tenga que ver con honorarios, «Honorio» no lo contiene. Se evaluó un
nombre inventado para el conjunto (**`elsecretario`** era el candidato) y se
descartó por lo mismo: cualquier marca nueva vuelve a apretar el día que el
trabajo se corra de tema. **La decisión fue el nombre propio.** Una persona no
caduca ni cambia de rubro, y deja que cada producto tenga su nombre debajo.

### `calculadoras/honorarios.html` se dio de baja — 7/8

El 4/8 se la había dejado publicada, con la tarjeta «retirada» en el grupo
«Otras» de la landing. **El `ESTADO.md` de entonces decía que se había sacado de
la landing y era falso**: seguía ahí, con una descripción que la ofrecía como
estimación rápida.

El 7/8 se le encontró el error del grupo 4 —la reducción del art. 22 sobre la
escala en vez de sobre la base— y **se decidió darla de baja en vez de
corregirla**. El motivo no es el costo del arreglo, que igual no era una línea:
es que Honorio ya la reemplaza y el
[`PLAN_CALCULO_DIRECTO.md`](PLAN_CALCULO_DIRECTO.md) la reemplaza mejor. Una
herramienta superada dos veces no se parchea.

**Cómo quedó, y por qué así:**

- **El archivo sigue en el repositorio**, sin tocar. Es historia: fue el primer
  intento de regulador, antes del clásico y de Honorio.
- **La URL sigue viva.** `pages.yml` publica `redirects/honorarios-retirada/`
  encima de `site/calculadoras/honorarios.html`, con el mismo patrón que
  `redirects/honorio/`. Ningún enlace viejo muere en un 404 **y ninguno entrega
  un número equivocado.** Las dos cosas juntas, que era el punto.
- **La tarjeta de la landing lo dice**, con el motivo. El aviso también.

**El criterio, porque se va a repetir:** una herramienta publicada tiene que
estar bien o no estar publicada. Que esté «retirada» en la landing no la saca de
internet, y el que llega por un enlace no ve la tarjeta.

### Una interpretación se funda en jurisprudencia — 8/8

La regla de fuentes de [`AGENTS.md`](../AGENTS.md) decía que una interpretación
«se declara como tal, con el razonamiento». **Ahora dice que se funda en un fallo
o no se afirma.** El motivo, en una línea: un razonamiento propio deja a la app
diciendo «esto lo decidimos nosotros», y al que lee sólo le queda creer o no
creer; **un fallo cambia quién lo sostiene.**

No es un invento de esa sesión: es lo que `honorio/lib/legal/jurisprudencia.ts`
ya hacía para el 2 %-20 % de los incidentes —criterio que sale de una ley
derogada porque el art. 47 quedó observado— y que funcionó. La regla nueva lo
generaliza y reusa el mecanismo: un `Criterio` con su frase y sus `Fallo[]`,
consumido por la sección que corresponda.

**Y una advertencia que quedó escrita en `AGENTS.md` porque vale más que la
regla:** una cita de jurisprudencia inventada es el peor error posible acá. Es
indistinguible de una buena, `verificar-docs` **no la caza** —controla normas y
artículos, no fallos— y termina adentro de un documento que produce resoluciones
judiciales. Un fallo se transcribe de la sentencia leída o no se escribe.

### El material de `docs/modelos/` deja de versionarse — 8/8

`.gitignore` cubre `docs/modelos/jurisprudencia/` y todo `.pdf` o `.docx`
bajo `docs/modelos/`.



índice con `git rm --cached`: **siguen en disco y dejaron de estar en el árbol**.






alguna vez cambia el criterio, la herramienta es `git filter-repo` y conviene
sacar un bundle de respaldo antes.

**Las plantillas limpias en `.md` sí se versionan a propósito:** son la materia
prima de [`PLAN_REGULACION_EN_PROSA.md`](PLAN_REGULACION_EN_PROSA.md) y están sin
datos de nadie.

---

## Los planes, y el orden en que se hicieron

Cada uno tiene su documento **para que se puedan analizar en sesiones
distintas**. El orden se acordó el 7/8 y se cumplió tal cual:

1. ~~**Los bugs.**~~ **Hechos el 7/8.** Quedó solo el código muerto de
   `honorio/public/legacy/core.js`, que es del otro repositorio.
2. ~~**Cálculo directo.**~~ **Hecho el 7/8.** Y **el argumento con que se lo puso
   segundo se confirmó**: fijó la matriz de roles × etapas, creó el segundo
   consumidor de las funciones puras con su validación cruzada de 171
   afirmaciones, y de yapa terminó siendo la puerta de entrada propia que
   mediación necesitaba y que no hubo que construir.
3. ~~**Mediación.**~~ **Hecha el 8/8**, y el motivo de ponerla antes que prosa
   también se confirmó: agregó una sección al resultado y una fila al cálculo
   directo. Al revés habría que rehacer plantillas para meter al mediador.
4. ~~**Regulación en prosa.**~~ **Hecha el 10/8**, la más riesgosa y la que más
   se benefició de que el resto estuviera firme.

**La alternativa que se evaluó:** subir la prosa al segundo lugar, porque cambia
más el uso diario que una calculadora más. Se defiende; el costo era rehacer las
plantillas cuando entrara el mediador. Se eligió el orden de arriba y salió bien,
pero la decisión era de valor y no técnica.

### [`PLAN_MEDIACION.md`](PLAN_MEDIACION.md) — 7/8, implementado el 8/8, cerrado el 10/8

Motor, UHOM versionado, validación 16, las dos pantallas y el documento de
dominio [`09_MEDIACION.md`](domain/09_MEDIACION.md), que es el noveno y el único
que no documenta la Ley 27.423. **`calculadoras/honorarios-mediacion.html` se
deja viva por ahora**, decisión de Javier: da un número correcto, así que no es
el caso de `honorarios.html`. Queda barato corregirle el rótulo del tope. Lo que
el plan resolvió y sigue valiendo:

- **La escala está verificada** contra el Decreto 2536/2015 y contra la tabla
  oficial del Ministerio. Los siete tramos de la calculadora son correctos. El
  Decreto 696/2025 sustituyó el Anexo I entero pero **no tocó el Anexo III**:
  cambiaron los artículos —el régimen pasó del 28 al 31— y no la escala.
- **Va como bloque del resultado, al lado de auxiliares**, no como noveno
  proceso. El parentesco es real: los dos salen de la base y no del honorario
  del abogado.
- **La base es una sola, la del expediente**, con las reducciones de los
  arts. 22 y 40 ya aplicadas. Es una interpretación y va fundada: la doctrina
  de que «el juicio es una unidad jurídica… no pueden existir dos bases
  regulatorias diferentes, según sea letrado o auxiliar de la justicia» sale
  del **plenario `Murguía` (CNCiv. en pleno, 2/10/2001)**. **Y hay un fallo que
  resuelve el planteo exacto** —CNCiv., Sala K, expte. 2896/2021, 22/6/2026—:
  el apelante era un perito que sostenía que el −30 % del art. 22 no lo
  alcanzaba por ser auxiliar de la Justicia y no letrado, y la Sala lo rechazó
  porque «la ley arancelaria no contempla excepción ni distinción alguna» según
  el profesional. No es analogía.
- **No se agrega ninguna regla ni ninguna pregunta por el mediador**: ni
  adicionales por audiencia, ni descuento del provisional, ni desistimiento, ni
  reconvención. Todo el cálculo es una función pura de siete ramas sobre una
  cifra que Honorio ya tiene.
- **La numeración del Anexo III cerró el 10/8**, y la destrabó una observación
  de Javier sobre los modelos del juzgado, que citan el «Anexo I del 2536». Esa
  cita, que parecía una cuarta variante, **es exacta y explica las otras
  tres**: el art. 5° del 2536 sustituye el Anexo III «por el que como ANEXO I
  forma parte integrante del presente», así que son el mismo texto nombrado por
  su origen o por su destino. Ese texto numera la escala en su **art. 2°**,
  igual que las seis citas del 696/2025; el «4° y 5°» es una remisión que el
  propio decreto dejó vieja. **El dígito que quedaba —si el 2536 era de 2011 o
  de 2015— cerró el 18/8: es de 2015**, y lo dice el texto consolidado del
  1467/2011 que ya estaba en `docs/mediacion/`, con la nota «(Anexo sustituido
  por art. 5° del Decreto N° 2536/2015 B.O. 30/11/2015)» en la cabeza de su
  Anexo III. El 2011 había salido del nombre del archivo, `decreto 2536-11.md`,
  que se llama así por el decreto que modifica.

Y un dato del Paso 2 que se confirmó: **el UHOM se mueve todos los meses** —es
la UR-SINEP × 12, redondeada a la decena superior—, así que el `SALTO_MAXIMO`
del 60 % calibrado para la UMA no sirve; el módulo usa 15 % y un control de
forma —termina siempre en cero— que la UMA no puede tener.

### [`PLAN_CALCULO_DIRECTO.md`](PLAN_CALCULO_DIRECTO.md) — 7/8, hecho entero el mismo día

Motor, validación 15 con 171 afirmaciones y pantalla; el 8/8 se le sumó la fila
del mediador. La regla que lo gobierna y que conviene no deshacer: **«sin
reducciones» no es un caso, es la ausencia de caso**, así que compone las
funciones puras y **no arma un `WizardState` con respuestas por defecto** —cada
respuesta por defecto es una afirmación jurídica que nadie hizo—. **Cerrado**,
salvo una pregunta de producto anotada y no decidida: si el control de fracción
de etapa del dashboard debería ofrecer las dos cosas.

### [`PLAN_REGULACION_EN_PROSA.md`](PLAN_REGULACION_EN_PROSA.md) — 7/8, hecho el 10/8

Que la app devuelva el texto de la regulación para copiar y pegar. Era la feature
más riesgosa del proyecto: **produce prosa con forma de documento firmado, y
ninguna de las validaciones anteriores miraba prosa.** Lo que se resolvió:

- **El punto dentro de la banda lo elige el usuario, con un control**, rol por
  rol. Era la decisión que bloqueaba todo lo demás. Se descartó el valor por
  defecto en el medio de la banda: es una decisión jurisdiccional disfrazada de
  conveniencia. **El control arranca sin elegir**, por el mismo argumento.
- **Los ocho procesos tienen modelo**, así que la decisión de cobertura no hubo
  que tomarla. Los dos últimos llegaron ese día: el de sucesión es una plantilla
  de trabajo, y el de homologación de convenio de desocupación **no existía y se
  escribió desde el art. 40** —leído contra el motor: el 50 % y la reducción del
  20 % coinciden—. Los trece están en
  [`docs/modelos/plantillas limpias/`](modelos/); los de mediación, en
  [`docs/mediacion/`](mediacion/).
- **La estructura no es la que el plan suponía.** No hay encabezado —los trece
  empiezan en «AUTOS Y VISTOS»— así que lo que Honorio no tiene no está al
  principio sino **en el medio**, en la sección que narra quién intervino y qué
  hizo.
- **Y eso no va como hueco: no se escribe.** Decisión de Javier, y cambia la
  categoría entera del plan. **La prosa es minimalista, dice únicamente lo que
  Honorio atrapa**, y el usuario agrega el resto según su caso. El motivo es
  qué clase de herramienta es Honorio: **supone que el expediente está en
  condiciones de regularse**, porque salvo los provisorios y la sucesión con
  renuncia solo se regula cuando el procedimiento terminó —de ahí que el wizard
  tenga una sección dedicada al modo de terminación y pida la base como un dato
  que existe—. Un hueco donde va la valuación de los bienes de una sucesión
  afirmaría que ese párrafo es parte de lo que Honorio produce, y no lo es.
- **Notificación, elevación y apertura de cuenta quedan afuera.** Son texto
  fijo y por eso eran lo más barato de generar, pero **son prácticas del
  juzgado y no de la ley.** Decisión de Javier.
- **El generador está hecho y sus controles entraron con él**, no después: las
  dieciséis validaciones anteriores comparan números y **ninguna miraba prosa**,
  así que la prosa sin realimentación era el problema que esta feature creaba.
  Salieron tres controles y no dos —el tercero es que un punto fuera de la
  banda no se redacta— y **el de números encontró un error de sí mismo en la
  primera corrida**: `Decreto 2536` salía como importe inventado. Ahora lee solo
  números con dos decimales, que es como se escribe una cifra y como nunca se
  escribe un identificador. **Y una tercera cosa que se perdió y hoy tiene
  control propio: las tildes.** Los comentarios de `lib/legal/` se escriben sin
  ellas —convención del código— y la primera versión arrastró la costumbre a
  las cadenas de salida. Una resolución sin acentos no se puede pegar en un
  expediente.
- **Una vuelta de tuerca que no estaba en el plan:** la sección **pide los
  profesionales**, porque es lo único que el motor no sabe y no debería saber
  —la banda del art. 21 es la misma haya un letrado o cuatro, pero un texto de
  regulación lleva una línea por cada uno—. Idea de Javier.

---

## Bugs cerrados

### La regresiva contaba hacia atrás fuera de la ventana de cobertura — cerrado el 26/8

Lo encontró el barrido de invariantes que entró con la extracción de
`regresiva` a `plazos.js`, y es de antes de ella: la migración salió idéntica en
los 864 casos de su matriz.

**Qué pasaba.** `regresiva` leía la guarda de datos faltantes **sobre la fecha
objetivo y antes de empezar a contar**. El cómputo retrocede después, y
retrocediendo se salía de la ventana de cobertura sin que nada lo volviera a
mirar.

**El caso, verificado en pantalla antes de tocarlo:** objetivo **4/2/2021** con
**40 días de antelación** contestaba **10/11/2020**, sin un solo aviso. La
cobertura arranca en 2021: de 2020 no están cargados ni los feriados nacionales
ni los asuetos, así que días que fueron inhábiles se contaron como hábiles y el
plazo arrancaba más tarde de lo que arranca. Y 2020 es el peor año posible para
eso —encadenó once ferias extraordinarias entre marzo y agosto—.

**Por qué le pasaba a ésta y no a las otras, que es lo que vale la pena
guardar.** En `vencimientos` y en `mora` el cómputo **avanza** y la auditoría se
lee **al final**, así que anota todo lo que el cálculo llegó a tocar. Acá se leía
al principio, y **hacia atrás el cálculo toca años que en ese momento todavía no
existían para nadie**. La guarda no estaba mal escrita: estaba escrita para un
cómputo que va en la otra dirección.

**El arreglo son ocho líneas**: volver a leer `problemaDeDatos()` después del
bucle y, si dice algo, devolver el motivo y **ninguna fecha**. El motor ya venía
anotando los años —`obtenerMotivoInhabil` pasa por `esFeriaJudicial`, que audita—
así que no hubo que agregar ni una consulta: sólo mirarla.

Lo decidió Javier el mismo día, y con el criterio de las otras: *«si va fuera de
la ventana de cobertura debería avisar como cuando vas a 2027 y cae en julio que
te da error»*. Ahora contesta con la misma frase que ese caso, que es la única
que hay —vive en `problemaDeDatos()` y no se reescribe por pantalla—.

**El alcance, medido antes de aplicarlo:** sobre 10.955 conteos de 2021 a 2026,
**cambian 121, y los 121 son exactamente los que antes devolvían una fecha
anterior a 2021.** Ninguno de más. La guarda quedó fina y no gruesa: un objetivo
de marzo de 2021 con quince días no llega a 2020 y calcula igual, con la misma
fecha que antes.

**Y una cosa del arnés que conviene no repetir.** Comparando en el navegador, la
matriz de 864 casos marcó **22 diferencias** y sólo **6** eran reales: las otras
16 son casos cuyo objetivo es inhábil, que no escriben nada y **se quedan con el
resultado del caso anterior en el DOM**. Al cambiar los 6, cambió lo que las 16
tenían pegado atrás. Lo dejó a la vista comparar el motor contra sí mismo en
Node —el commit anterior contra el árbol de trabajo—, donde no hay DOM que
arrastre nada: **6 diferencias en la matriz, 121 en el barrido grande, todas del
mismo tipo.** Cuando un arnés lee una pantalla, una diferencia puede ser de la
pantalla y no del cálculo.

### Los diez documentos de dominio no tenían interruptor de tema — cerrado el 26/8

Abierto y cerrado el mismo día. Lo encontró `verificar-contraste`, que se
escribió esa mañana y exige que los tokens oscuros estén escritos dos veces
—el `@media` y el `[data-tema="oscuro"]`—: la plantilla de
`scripts/build-docs.mjs` tenía uno solo, y entró al control como excepción con
nombre y motivo para no mezclar dos cosas en el mismo commit.

**Qué pasaba.** Las diez páginas de `docs/domain/` no cargaban `assets/tema.js`,
no tenían el botón, y su único bloque oscuro era el del `@media`. O sea que
**seguían al sistema operativo y nada más**: quien había elegido claro en las
otras dieciséis páginas del sitio llegaba a `/docs/` y lo veía en oscuro igual,
sin nada en pantalla que le permitiera cambiarlo. Es el único lugar donde la
elección del usuario se perdía al navegar dentro del mismo sitio.

**Por qué faltaba ahí y no en otro lado, que es lo que vale la pena guardar:**
es la única de las páginas publicadas que **la genera un script**. Las demás se
editaron a mano el 5/8, cuando entró el interruptor, y ésta no se abrió porque
lo que se abre para cambiarla no es la página sino la plantilla. Es la misma
clase de olvido que dejó a esa plantilla con los valores de `--faint`
anteriores al 5/8 hasta que el control la midió: **lo que se genera no se mira.**

**El arreglo**, en la plantilla y no en las páginas: el `@media` pasó a
`:root:not([data-tema="claro"])`, se agregó el bloque `:root[data-tema="oscuro"]`
con los mismos valores, entraron las reglas de `.tema-boton` —las mismas de las
otras páginas, con su `@media print`— y el `<script src="../assets/tema.js">` en
el `<head>` y **sin `defer`**, que es lo que evita el destello del tema
equivocado. El botón no va en el marcado: lo inyecta `tema.js`.

**Y con eso se sacó la excepción de `verificar-contraste`**, que es la mitad que
importa: la regla de los dos bloques oscuros ahora corre sobre los seis archivos
sin ninguno declarado aparte. Probado al revés —rompiendo el bloque nuevo, el
control corta con la falla que corresponde.

**Verificado en pantalla**, con el sitio servido y rompe-caché, sobre 488 textos
de `03_REGLAS_DE_NEGOCIO.html`: con el sistema en oscuro y la elección en claro
la página sale clara —que es exactamente lo que no pasaba—, el botón cambia el
tema y lo persiste, y el contraste no baja de **4,78 en claro** ni de **5,35 en
oscuro**. Sin desborde horizontal a 375 px, y ahí el botón no pisa el
«← Herramientas», que es lo único que le queda cerca.

### La paleta de estados no llegaba a AA en tema claro — cerrado el 26/8

Abierto y cerrado el mismo día, y sólo porque el control de contraste que se
escribió esa mañana los midió de paso. Es el hermano del bug de `--faint` y
tiene la misma causa: **la paleta clara se calibró contra la tarjeta blanca.**

Lo que faltaba entender es cuál es la superficie que manda, y no es ninguna de
las tres: **es el tinte del propio estado compuesto encima de `--bg`**. Un aviso
casi nunca se escribe sobre la superficie pelada; se escribe sobre su tinte, que
es el mismo color al 8-13 % y por lo tanto más oscuro.

Medido: `--warn` `#9a6b12` no llegaba a 4,5 **sobre ninguna de las tres
superficies** —3,92 / 4,25 / 4,68— y daba 3,58 sobre su propio tinte encima de
`--bg`. `--ok` daba 4,45 sobre `--bg` y 3,98 sobre su tinte; `--error`, 4,28
sobre su tinte. En oscuro los tres pasaban con holgura, que es como sobrevivió.

Ya se había pagado una vez: el ámbar de los días de feria del calendario de
`vencimientos` salió midiendo 4,24 en claro y se corrigió antes de publicar sólo
porque alguien midió el tema en el que no estaba trabajando.

Se bajó la luminosidad de los tres conservando tono y saturación —`--ok` a
`#1c6e45`, `--warn` a `#815a0f`, `--error` a `#9f4429`, y los tintes con ellos—,
y el peor caso pasó a 4,64. `--ok` y `--error` se mueven tan poco que no se ven;
`--warn` sí se ve más ocre.

**Nacieron en el control como aviso y no como falla**, porque bajarlos era mover
la paleta y eso es una decisión, no un arreglo. La tomó Javier el mismo día
—*«los colores de la paleta los elegiste vos de todos modos»*— y con eso
`verificar-contraste` pasó a fallar con ellos, con el tinte incluido como fondo
a medir.

### `--faint` estaba calibrado contra la tarjeta y no contra el fondo — cerrado el 26/8

Abierto el 12/8 y arreglado tres veces a mano antes de arreglarse una vez de
raíz. El token del gris más claro daba **5,14 sobre `--card`** y **4,30 sobre
`--bg`**, o sea reprobaba AA —4,5 para texto chico— en el único texto que lo
usa: etiquetas de 11 px en mayúsculas, colofones, fechas.

**La causa no fue el valor, fue contra qué se lo midió.** El 5/8 el token se
bajó de `#8b93a0` a `#666e7c` midiendo sobre la tarjeta blanca, que es la
superficie más clara del tema claro y por lo tanto la más fácil. Nadie midió el
texto que va sobre el fondo de la página, que es más oscuro. **En claro la
superficie que manda es `--bg` y en oscuro es `--card`, y son opuestas**: la más
oscura en un tema, la más clara en el otro. Medir contra una sola alcanza para
que el token parezca bien en las dos.

Las tres veces que apareció se resolvió cambiando el token en esa pantalla
—`.cobertura` y `.colofon` de `vencimientos.html`, el badge de atajo del
tablero—, y el token seguía mal para las trece páginas. Es el modo de falla que
tiene un arreglo local: cierra el síntoma y deja el defecto.

Qué se hizo: `--faint` pasó a **`#5f6774`** (4,78 / 5,71 / 5,18 sobre
`--bg` / `--card` / `--sunk`) en los **seis** archivos donde están escritos los
tokens, los parches locales volvieron al token, y entró
`npm run verificar-contraste`, que corre en CI.

**Y el control encontró dos cosas que nadie había visto**, que es lo que
justifica que exista:

- **La plantilla de `scripts/build-docs.mjs` tenía los valores anteriores al
  5/8.** Los diez documentos de dominio se publicaron todo ese tiempo con
  `--faint: #8b93a0`, que da **2,59 sobre el fondo** —contra 4,5— justo en la
  etiqueta del índice lateral. En oscuro, `#6b7381` daba 3,68. Es peor que el
  bug que se estaba arreglando y **no se veía mirando ninguna de las trece
  páginas**, porque esas diez las genera un script.
- **`uma-uhom.html` ya tenía el arreglo** desde el 24/8 y las otras tres
  páginas sueltas no. Seis copias del mismo token no se mantienen iguales
  solas, y la deriva no aparece en ningún diff: cada archivo, por separado,
  se ve bien.

### Los feriados salían de una API en vivo, y podían no salir — cerrado el 14/8

Reportado como errores de CORS intermitentes en `vencimientos.html`. El CORS es
del lado del servidor y no se arregla desde acá, pero no era ése el problema:
**el problema era que la herramienta seguía calculando sin los feriados.**

`calendario-judicial.js` le pedía a `api.argentinadatos.com` un año por vez, en
el navegador de cada visitante, **con el `catch` vacío**: un año que fallaba no
dejaba rastro. Después `init()` hacía `_dataLoaded = _loadedYears.length > 0`,
así que alcanzaba con que cargara **un** año para declararse disponible.

Y el respaldo que se suponía que cubría esto no lo cubría:
`data/dias-inhabiles.json` tiene solo asuetos por Acordada, ni un feriado
nacional. Con la API caída, el 25 de mayo y el 9 de julio se contaban como
hábiles. **Un feriado contado como hábil adelanta el vencimiento**: el plazo
parece cumplirse antes de lo que se cumple. Del lado de quien controla si una
presentación fue tempestiva, ése es el sentido caro del error.

Qué se hizo:

- **`data/feriados.json`, versionado**, generado por
  `scripts/actualizar-feriados.mjs` (`npm run feriados`) contra la misma API,
  **en el build y no en el navegador**. Aborta entero si un año trae menos de 14
  feriados, si la fecha no tiene formato, o si viene una fecha de otro año: es
  preferible publicar con los de ayer que con un año a medias. Mismo movimiento
  que Honorio con la UMA en su 2.1.0.
- **No se agregó una segunda API a propósito.** Dos fuentes que discrepan en un
  feriado dan dos vencimientos distintos, y eso es peor que una sola: el error
  deja de ser visible. El archivo versionado cambia en un commit, con fecha y
  con diff.
- **Falta un año = no está cargado.** `dataLoaded` pasa a `false` e `init`
  devuelve `missingYears`, que dice cuáles.
- **`caducidad.html` informaba «2021 a 2027» mirando primero y último.** Con un
  hueco en el medio mentía. Ahora, si falta alguno, no calcula y los nombra.

Ningún número se movió: el archivo se generó de la misma fuente que se
consultaba antes. Verificado corriendo, no leyendo: 25 de mayo, 9 de julio,
carnaval y 24 de marzo de 2026 dan inhábil; un miércoles común da hábil; un año
ausente y el archivo ausente dan `dataLoaded=false` nombrando el faltante.

**La lección quedó en cómo se anotó, no en el código.** El mismo commit arregló
el bug y escribió la entrada en `ESTADO.md` **en presente y como «Abierto»**,
copiada del reporte. Nadie la dio vuelta, y quedó un día entero declarando roto
lo que ese commit acababa de arreglar. `AGENTS.md` pide verificar contra el
código y no contra otro documento: **eso incluye al `ESTADO.md` que uno mismo
escribió hace diez minutos.**

### Los tres del 7/8, cerrados el mismo día

**1. La lectura de la planilla por posición, en tres archivos.** `honorarios-mediacion.html`,
`prorrateo.html` y `asistente-honorarios-clasico/js/core.js` tomaban la fila por
número. Ahora los tres buscan **por clave**, respetando comillas —la fila
`Acordada` tiene comas adentro— y detectando el HTML que Google devuelve con
status 200 cuando la publicación se da de baja. Es el mismo criterio de
`honorio/scripts/actualizar-uma.mjs`.

El peligroso era el de mediación: leía la celda B2, así que una fila insertada
arriba le habría hecho tomar la UMA como si fuera el UHOM —$102.076 donde van
$12.960—, un honorario **ocho veces más alto sin ningún error visible**.
Verificado contra el CSV real y contra tres mutaciones —fila nueva arriba, filas
reordenadas, clave ausente—: los tres devuelven el valor correcto en las
primeras dos y `null` en la tercera, que es lo que activa la carga manual.

**El arreglo se propagó a `honorio/public/legacy/core.js`**, en el commit propio
de aquel repositorio. Y ahí hubo una corrección de criterio que conviene tener
escrita, porque la primera versión del `ESTADO.md` proponía lo contrario:

> Se había anotado «sacar `cargarUMA()` de la copia de Honorio, que es código
> muerto». **Eso estaba mal.** `AGENTS.md` dice que el motor legacy se arregla en
> su fuente y se propaga, y que **nunca se parchea una copia sola**; y
> `adapters.ts:74` ya había decidido a propósito no tocar esa función por ese
> mismo motivo. Lo correcto no era borrarla de la copia sino **propagarle el
> arreglo**, que es lo que se hizo. La copia volvió a ser fiel a su fuente
> —difieren solo en un `return` que ya estaba— y de paso dejó de leer por
> posición.
>
> **La lección:** antes de proponer una limpieza en `public/legacy/`, mirar si la
> decisión ya está tomada. Estaba, y con mejor razón.

**2. El art. 22 sobre la escala en `calculadoras/honorarios.html`.** Su `grupo4`
hacía `calcMinComp *= 0.7` sobre el resultado de la escala. **Es el mismo error
que tenía `05_DEPENDENCIAS.md`**: el art. 22 reduce la **base**, antes de la
escala (`aplicarReduccionesBase()`, `calculate.ts:270`). Con el ejemplo ya
escrito acá daba **7,6 % de más** y ni siquiera caía en el mismo tramo. Los
grupos 2, 3, 5 y 6 estaban bien: esos artículos sí reducen la escala.
**Se resolvió dando de baja la herramienta**, no corrigiéndola; el porqué está
arriba.

**3. El redondeo en los bordes de tramo**, en ese mismo archivo: `baseEnUMA` se
redondeaba si caía entre 15 y 16, 45 y 46, y así en los seis cortes. El motor no
redondea nada, comprobado. Se fue con la baja de la herramienta.

### Caducidad contaba mal la feria de julio — cerrado el 5/8

El código sumaba los días de feria **solapados con el vencimiento nominal**, no
los de la feria entera, y no volvía a mirar si la fecha nueva seguía cayendo
adentro. El art. 311 CPCCN descuenta enteros los plazos que corresponden a
ferias, así que el arreglo es una **iteración a punto fijo** —recalcular hasta
que la fecha deje de moverse—, el mismo patrón que ese archivo ya usaba unas
líneas más abajo para los inhábiles.

**Lo que importa:** de 8.760 combinaciones de fecha de inicio por plazo entre
2025 y 2028, cambiaban **298 (3,4 %)**. Solo una parte daba el absurdo visible
que reportó Javier —una fecha de vencimiento dentro de la feria que el propio
resultado decía haber atravesado—; **el resto daba una fecha equivocada pero
verosímil**, que nadie habría mirado dos veces. Un bug de cálculo de plazos se
busca con un barrido, no con el caso que lo destapó.

---

## Trampas que dejaron de serlo

- **`.gitattributes` estuvo en UTF-16 hasta el 5/8 y git nunca lo leyó.** Lo
  parsea como bytes, veía un nulo entre cada carácter y ninguna de sus reglas
  rigió. Por eso los HTML quedaron guardados con CRLF y `entre-fechas.html` con
  las dos cosas mezcladas —397 CRLF y 192 LF sueltos—, de modo que cualquier
  edición de una línea uniformaba el archivo y salía en el diff como si se
  hubiera reescrito entero. Ya está arreglado y el repositorio renormalizado.
  **Lo que sigue vivo de esto es la causa**, y está en `ESTADO.md`: el `>` de
  PowerShell escribe UTF-16.
- **Después de tocar la configuración de Pages, mirar `Age` antes de sacar
  conclusiones de un código de estado.** Al verificar Enforce HTTPS,
  `http://javiercuneo.com.ar/` devolvía 404 y se leyó como que la opción estaba
  sin tildar. Era **una respuesta cacheada en el borde de GitHub**, de cuando el
  dominio todavía no estaba configurado: la raíz venía con `age=3502` —casi una
  hora— mientras que `/index.html`, que nunca se había pedido por HTTP, salía con
  `age=0` y el 301 correcto. Un parámetro de cache-bust en la query **no sirve**,
  porque la variante ya estaba cacheada igual.
- **`npm run lint` no existe.** Se eliminó el 4/8: declaraba `eslint .` y
  `eslint` nunca estuvo instalado, así que era una promesa que fallaba.
- **Los días inhábiles tienen una sola fuente: `data/dias-inhabiles.json` más la
  API de `argentinadatos.com`.** Hasta el 5/8 `mora.html` leía un repositorio
  viejo y abandonado con 36 fechas de más; 35 ya las daba la API y la única
  huérfana estaba mal —era la fecha nominal de un feriado trasladable, no la
  vigente—. **Ante dos fuentes que difieren, no elegir la más larga:** comparar
  entrada por entrada contra la autoritativa.
- **Después de publicar en un lugar nuevo, mirar la pestaña de red, no solo si
  la página carga.** En `honorio.ar` recién publicado apareció un 404 a
  `/_vercel/insights/script.js`: era `@vercel/analytics`, resto de la plantilla
  de v0. La app declara que nada de lo que se escribe sale del navegador, y con
  ese paquete adentro la afirmación dependía de dónde estuviera alojada. **Una
  afirmación de privacidad no puede depender del hosting.**
