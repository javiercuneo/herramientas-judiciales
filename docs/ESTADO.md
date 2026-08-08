# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-08-07 · rama `main`

> **Este documento es solo de este repositorio.** Honorio se mudó el 4/8 a
> [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio) y se llevó su
> propio `ESTADO.md`, que es donde va todo lo del motor de honorarios, el
> wizard y el dashboard. Acá no queda nada suyo que tocar. Si en la copia de
> trabajo hay un `honorio/`, es un clon de aquel repositorio: `git remote -v`
> antes de commitear.

**Lo que sí sigue compartido, y por eso se toca acá:**

- **`asistente-honorarios-clasico/` es la FUENTE del motor legacy** que Honorio
  todavía carga por `<script>`. Un arreglo a ese motor compartido **se hace acá**
  y se propaga allá a propósito.
- **`docs/domain/` documenta la Ley 27.423 para los dos.** Si algún día el
  clásico se retira, esos ocho documentos se van con Honorio.
- **Los planes de features de Honorio también viven acá**, junto al
  [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md), porque la materia prima
  —calculadoras, textos legales— está de este lado. Ver
  [Planes abiertos](#planes-abiertos).

---

## Dónde estamos

El sitio está publicado en **`javiercuneo.com.ar`**, dominio propio, desde el
5/8. Las once calculadoras comparten el sistema visual y quedaron revisadas una
por una. Los **ocho documentos de dominio** quedaron cerrados el 7/8, después de
descubrirse el 6/8 que la prosa que describe el motor nunca se había verificado
contra el motor. Y el 7/8 se hizo entero el
[`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md), en dos tandas —una sin mover
un número, otra con tres que sí—, casi todo trabajo en Honorio: salió como sus
versiones **2.2.0** y **3.0.0** y el detalle está en el `ESTADO.md` de allá.

No queda nada urgente ni bloqueante. Lo que sigue abierto está en
[Pendientes](#pendientes).

**Las cuatro cifras que este repositorio sigue de Honorio.** Son suyas pero
salen de allá, y se movieron el 7/8 cuando la modificación de alimentos agregó
un sub-paso: **168 recorridos** (eran 160), **28.224 cruces** (eran 25.600),
**15 validaciones** (eran 11) y la versión del chip. Viven en `index.html` y en
`README.md`. La fuente es la tabla de recorridos de
[`01_PROCESOS.md`](domain/01_PROCESOS.md): **si vuelve a moverse, se mueven las
cuatro.**

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
   producción. La causa fue un ciclo de variables CSS; está en
   [Trampas conocidas](#trampas-conocidas).
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
(Los números de hoy son otros: ver [Dónde estamos](#dónde-estamos).)

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

## Decisiones tomadas, y por qué

No se derivan del código. Si algo se va a cambiar, conviene saber contra qué se
está discutiendo.

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

### El sistema visual

Es el mismo de la landing, de la guía y de Honorio, y las calculadoras lo
adoptaron: cobalto `#1E45CE` como **único acento** —lo activo, lo enfocado y lo
seleccionado son siempre el mismo color—, neutro frío, `--radius: 0.375rem`, y
**Archivo** (Omnibus-Type, Buenos Aires) para títulos y cifras, elegida por ser
una tipografía argentina para una herramienta jurídica argentina.

**El tema lo elige el usuario, desde el 5/8.** Antes el sitio seguía y punto a
`prefers-color-scheme`, o sea al sistema operativo. Lo reportó Javier: en casa
le abría oscuro y en la oficina claro, sin forma de decidir. Y Honorio ya tenía
su interruptor, así que el sitio y la app se comportaban distinto.

Ahora hay un botón en las trece páginas, que lo inyecta `assets/tema.js` —un
archivo compartido, porque trece páginas sin build no pueden mantener trece
copias del mismo comportamiento—. Sin elección guardada se sigue al sistema; con
elección, manda la elección y persiste en `localStorage`.

**Cómo está hecho, para no romperlo:** los tokens oscuros están **dos veces**,
en `@media (prefers-color-scheme: dark) { :root:not([data-tema="claro"]) }` y en
`:root[data-tema="oscuro"]`. Si tocás un valor, tocá los dos. Se evaluó
`light-dark()`, que evitaría la duplicación, y se descartó: si un navegador no
la soporta la declaración entera es inválida y el token queda vacío, que es
exactamente el bug que dejó dos calculadoras con el botón invisible. Acá la
predictibilidad vale más que la elegancia.

Se descartó explícitamente el cluster «crema + serif display + terracota» por ser
el look más reconocible de diseño generado por IA.

`--faint` es el gris más claro que todavía se lee. **No aclararlo**: su único uso
es texto chico, que es justo donde el piso de contraste es 4.5.

### `calculadoras/honorarios.html` se dio de baja — 7/8

El 4/8 se la había dejado publicada, con la tarjeta «retirada» en el grupo
«Otras» de la landing. **Este documento decía que se había sacado de la landing
y era falso**: seguía ahí, con una descripción que la ofrecía como estimación
rápida.

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

### Licencia

**MIT** para todo lo que hay acá (`LICENSE` en la raíz). La excepción —Honorio,
bajo AGPL-3.0— se fue con él, y el CLA de `CONTRIBUTING.md` aplica en aquel
repositorio, no en este.

---

## Pendientes

Ninguno urgente y ninguno bloqueante. El dominio está cerrado del todo:
registrado, con DNS, con certificado y con HTTPS forzado.

- **`mora.html` todavía no usa `js/calendario-judicial.js`**: tiene su propia
  copia de la lógica de feria y fin de semana. Es duplicación de código, no
  divergencia de datos —la lista y la API ya son las mismas—, así que no cambia
  ningún número. Es lo único de fondo que sigue abierto de las calculadoras.
- **`lib/legal/minimos-data.ts` nunca se verificó contra la ley.** Las cifras de
  los mínimos que citan el `06` y el `07` están verificadas contra ese archivo,
  y el archivo dice ser copia fiel del asistente clásico. Que sea fiel a la copia
  no prueba que sea fiel a la norma. Son unas cuarenta cifras.
- **Ninguna calculadora se corrió de punta a punta.** Se midió contraste y ancho
  en las once y se miraron capturas de dos. Un cálculo real, con su pantalla de
  resultado, no se hizo.
- **Tuteo suelto en el texto de las calculadoras.** Varias dicen «envíanos un
  mail» y «si crees», que es el imperativo de *tú*. La convención del
  repositorio es rioplatense.
- Los `max-width` de las calculadoras siguen yendo de 240 a 1000 px sin criterio.
- **`www.javiercuneo.com.ar`**, si se lo quiere.
- **El plan completo de qué falta de la ley, qué hacer y qué solo declarar está
  en [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md)**, con el orden
  recomendado. **Ocho puntos**, de los que el 7/8 se cerraron dos: el hint de la
  base y el litisconsorcio. Quedan seis: uno para hacer ya sin tocar números,
  tres que sí los mueven —uno hacia arriba: los pisos mínimos que el motor no
  verifica—, dos para declarar y no implementar, y uno anotado sin fecha.

### Planes abiertos

Features pensadas y todavía no empezadas. Cada una tiene su documento **para que
se puedan analizar en sesiones distintas**.

**El orden acordado el 7/8, para arrancar sin volver a decidirlo:**

1. ~~**Los bugs.**~~ **Hechos el 7/8.** Ver [Bugs conocidos](#bugs-conocidos).
   Queda solo el código muerto de `honorio/public/legacy/core.js`, que es del
   otro repositorio.
2. **Cálculo directo — es acá donde arranca la próxima sesión.** No está
   bloqueado por nada y **prepara el terreno de los
   otros dos**: fija la matriz de roles × etapas que la prosa va a tener que
   redactar, crea el segundo consumidor de las funciones puras con su validación
   cruzada, y produce el `CalculoResultado` más simple posible —sin
   transformaciones—, que es el caso de prueba con el que conviene empezar el
   generador de prosa.
3. **Mediación**, antes que prosa **porque agrega una sección al resultado**. Al
   revés habría que rehacer plantillas para meter al mediador.
4. **Regulación en prosa**, última: la más riesgosa y la que más se beneficia de
   que el resto esté firme.

**En paralelo, y no espera a nadie:** cargar la ley de mediación, su decreto y la
norma del UHOM, y los modelos de resolución. Con eso hecho antes de llegar al 3,
el orden no tiene esperas.

**La alternativa que se evaluó:** subir la prosa al segundo lugar, porque cambia
más el uso diario que una calculadora más. Se defiende; el costo es rehacer las
plantillas cuando entre el mediador. Se eligió el orden de arriba, pero la
decisión es de valor y no técnica.

- **[`PLAN_MEDIACION.md`](PLAN_MEDIACION.md)** — 7/8. Llevar el honorario del
  mediador a Honorio. La decisión abierta es si mediación es un noveno tipo de
  proceso o un bloque aparte del resultado; recomiendo lo segundo, **porque no
  comparte la unidad**: va en UHOM y no en UMA, aunque las dos salgan de la misma
  planilla. Bloqueado hasta cargar la ley de mediación y su decreto: la escala
  que hoy aplica la calculadora **no cita ninguna norma**, así que no se puede
  dar por buena.
- **[`PLAN_REGULACION_EN_PROSA.md`](PLAN_REGULACION_EN_PROSA.md)** — 7/8. Que la
  app devuelva el texto de la regulación para copiar y pegar. La decisión abierta
  es **quién elige el número dentro de la banda**: el motor devuelve rangos a
  propósito, porque elegir adentro es el acto jurisdiccional, y una resolución
  fija un número. Bloqueado hasta cargar los modelos de resolución. Es la feature
  más riesgosa del proyecto: produce prosa con forma de documento firmado, y
  ninguna de las validaciones actuales mira prosa.
- **[`PLAN_CALCULO_DIRECTO.md`](PLAN_CALCULO_DIRECTO.md)** — 7/8. El modo sin
  entrevista: entra la base, sale la escala del art. 21 desnuda con los tres
  roles, las tres etapas, los auxiliares y la segunda instancia. Es la idea que
  estaba anotada desde el 4/8 al sacar `calculadoras/honorarios.html` de la
  vista. **Es el plan más chico de los tres**, porque las cinco funciones que
  hacen falta ya existen puras y exportadas en `calculate.ts`. La regla que lo
  gobierna: **«sin reducciones» no es un caso, es la ausencia de caso**, así que
  se componen las funciones puras y no se arma un `WizardState` con respuestas
  por defecto —cada respuesta por defecto es una afirmación jurídica que nadie
  hizo—. No está bloqueado por nada.

### Bugs conocidos

Ninguno abierto. Los tres del 7/8 quedaron cerrados el mismo día:

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
escrita, porque la primera versión de este documento proponía lo contrario:

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

El último bug de fondo cerrado, el 5/8, dejó una lección de alcance que conviene
tener:

**Caducidad contaba mal la feria de julio.** El código sumaba los días de feria
**solapados con el vencimiento nominal**, no los de la feria entera, y no volvía
a mirar si la fecha nueva seguía cayendo adentro. El art. 311 CPCCN descuenta
enteros los plazos que corresponden a ferias, así que el arreglo es una
**iteración a punto fijo** —recalcular hasta que la fecha deje de moverse—, el
mismo patrón que ese archivo ya usaba unas líneas más abajo para los inhábiles.

**Lo que importa:** de 8.760 combinaciones de fecha de inicio por plazo entre
2025 y 2028, cambiaban **298 (3,4 %)**. Solo una parte daba el absurdo visible
que reportó Javier —una fecha de vencimiento dentro de la feria que el propio
resultado decía haber atravesado—; **el resto daba una fecha equivocada pero
verosímil**, que nadie habría mirado dos veces. Un bug de cálculo de plazos se
busca con un barrido, no con el caso que lo destapó.

---

## Trampas conocidas

- **`.gitattributes` estuvo en UTF-16 hasta el 5/8 y git nunca lo leyó.** Lo
  parsea como bytes, veía un nulo entre cada carácter y ninguna de sus reglas
  rigió. Por eso los HTML quedaron guardados con CRLF y `entre-fechas.html` con
  las dos cosas mezcladas —397 CRLF y 192 LF sueltos—, de modo que cualquier
  edición de una línea uniformaba el archivo y salía en el diff como si se
  hubiera reescrito entero. Ya está arreglado y el repositorio renormalizado.
  **La trampa sigue viva:** el `>` de PowerShell 5.1 escribe UTF-16. Si hay que
  editarlo, `Set-Content -Encoding utf8` o un editor.
- **Al leer un diff grande de un HTML, mirar primero si es de contenido.**
  `git diff --ignore-cr-at-eol` lo despeja en un segundo.
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
- **Después de tocar la configuración de Pages, mirar `Age` antes de sacar
  conclusiones de un código de estado.** Al verificar Enforce HTTPS,
  `http://javiercuneo.com.ar/` devolvía 404 y se leyó como que la opción estaba
  sin tildar. Era **una respuesta cacheada en el borde de GitHub**, de cuando el
  dominio todavía no estaba configurado: la raíz venía con `age=3502` —casi una
  hora— mientras que `/index.html`, que nunca se había pedido por HTTP, salía con
  `age=0` y el 301 correcto. Un parámetro de cache-bust en la query **no sirve**,
  porque la variante ya estaba cacheada igual.
- **`git commit -m` con here-string falla** en este entorno (guardia de
  sandbox). Usar `git commit -F <archivo>`.
- **`npm run lint` no existe.** Se eliminó el 4/8: declaraba `eslint .` y
  `eslint` nunca estuvo instalado, así que era una promesa que fallaba.
- **Son dos proyectos npm distintos: fijarse en cuál se está parado.** El de la
  raíz tiene **dos scripts y nada más**: `docs` y `verificar-docs`. `check`,
  `build`, `validate` y `typecheck` son de Honorio y **solo corren desde
  `honorio/`**, que es un clon de otro repositorio. Pedirlos acá da «Missing
  script», que se lee fácil como que algo está roto y no lo está.
- **El panel del navegador no compone frames si no está a la vista.** Se anotó
  varias veces como si fuera una limitación del entorno y no lo es: con el panel
  oculto `document.hidden` es `true`, `requestAnimationFrame` no dispara,
  `clientWidth` mide 0 y las capturas fallan con *«the Browser pane is not
  displayed»*. **La solución es abrir el panel.** Si no se puede, el JavaScript
  sí funciona: estilos computados y mediciones son más confiables que mirar una
  captura.
- **La landing publica lo que la allowlist de `pages.yml` nombra.** Si se agrega
  algo al sitio, va ahí *y* se enlaza desde `index.html`. Si no, no existe para
  nadie: ya pasó con PDF-studio, que estuvo meses publicado sin figurar.
- **Después de publicar en un lugar nuevo, mirar la pestaña de red, no solo si
  la página carga.** En `honorio.ar` recién publicado apareció un 404 a
  `/_vercel/insights/script.js`: era `@vercel/analytics`, resto de la plantilla
  de v0. La app declara que nada de lo que se escribe sale del navegador, y con
  ese paquete adentro la afirmación dependía de dónde estuviera alojada. **Una
  afirmación de privacidad no puede depender del hosting.**
- **Los días inhábiles tienen una sola fuente: `data/dias-inhabiles.json` más la
  API de `argentinadatos.com`.** Hasta el 5/8 `mora.html` leía un repositorio
  viejo y abandonado con 36 fechas de más; 35 ya las daba la API y la única
  huérfana estaba mal —era la fecha nominal de un feriado trasladable, no la
  vigente—. **Ante dos fuentes que difieren, no elegir la más larga:** comparar
  entrada por entrada contra la autoritativa.
