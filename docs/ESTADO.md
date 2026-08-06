# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-08-05 · rama `main`

> **Este documento es solo de este repositorio.** Honorio se mudó el 4/8 a
> [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio) y se llevó su
> propio `ESTADO.md`, que es donde va todo lo del motor de honorarios, el
> wizard y el dashboard. Acá no queda nada suyo que tocar. Si en la copia de
> trabajo hay un `honorio/`, es un clon de aquel repositorio: `git remote -v`
> antes de commitear.

---

## Dónde estamos

El sitio está publicado en **`javiercuneo.com.ar`**, dominio propio, desde el
5/8. Las once calculadoras comparten el sistema visual del sitio y quedaron
revisadas una por una. Las prioridades que se habían fijado el 4/8 están todas
cerradas.

Lo que queda es mantenimiento y las ideas anotadas más abajo, ninguna urgente.

---

## El dominio, cerrado el 5/8

`javiercuneo.com.ar` registrado en NIC —tomó unos días porque el nombre
coincide con el de una persona y pidió DNI y revisión a mano—, DNS en
Cloudflare **sin proxy** (nube gris, para que GitHub pueda emitir el
certificado), y configurado como *custom domain* del repositorio.

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
- **Esta vez los enlaces viejos no se rompieron**, a diferencia del renombre del
  4/8. `javiercuneo.github.io/herramientas-judiciales/…` devuelve **301 al
  dominio conservando la ruta** —comprobado—, así que el enlace de LinkedIn
  siguió andando sin tocarlo.
- `www.javiercuneo.com.ar` **no resuelve**: no existe el registro. Si molesta,
  va un CNAME `www` → `javiercuneo.github.io` en Cloudflare, gris también.

**El barrido de URL, hecho.** Eran 17 absolutas: 15 en `README.md`, el
`og:image` de `index.html` —que no admite relativa— y una en
`INFORME_REFACTOR_SHARED_CSS.md`. Comprobadas las 17 contra el destino nuevo:
16 dan 200 y la restante es el `<archivo>.html` de plantilla del informe. Más
la cadena de *User-Agent* de `distancia.html`, que decía
`HerramientasJudicialesIA/1.0`.

En el repositorio de Honorio eran **4, no 2** como decía la versión anterior de
este documento: la consolidación del 5/8 juntó tres en `lib/enlaces.ts` y queda
una en su `AGENTS.md`. Ya está commiteado allá.

**Enforce HTTPS quedó tildado y anda.** `http://` redirige con 301 a `https://`
conservando la ruta.

**Trampa que costó un diagnóstico equivocado:** al verificarlo,
`http://javiercuneo.com.ar/` devolvía 404 y se leyó como que la opción estaba
sin tildar. Era **una respuesta cacheada en el borde de GitHub**, de cuando el
dominio todavía no estaba configurado. Se ve en la cabecera `Age`: la raíz venía
con `age=3502` —casi una hora— mientras que `/index.html`, que nunca se había
pedido por HTTP, salía con `age=0` y el 301 correcto. Un parámetro de cache-bust
en la query **no sirve**, porque la variante ya estaba cacheada igual.
**Después de tocar la configuración de Pages, mirar `Age` antes de sacar
conclusiones de un código de estado.**

---

## Las calculadoras, cerradas el 5/8

Cada una es un HTML con su CSS y su JS adentro, escritas en momentos distintos.
El trabajo fue en tres tramos y hay dos análisis que conviene no rehacer:
[`INFORME_REFACTOR_SHARED_CSS.md`](INFORME_REFACTOR_SHARED_CSS.md), del 31/7,
con el inventario archivo por archivo, y lo que sigue.

**Lo que el informe dejó probado**, y no hace falta rediscutir:

- La duplicación del 72 % es de **líneas de propiedad sueltas**, no de reglas.
  Reglas CSS completas idénticas en dos o más archivos: **9 %**.
- Los `<style>` no son copias sino **hermanos con variaciones hechas a mano**.
  Por eso **no existe extracción mecánica segura**: cualquier CSS compartido
  real obliga a normalizar, y normalizar cambia el aspecto de las páginas.
- Su plan proponía unificar sobre el degradé violeta `#667eea → #764ba2` con
  Montserrat, «sin rediseñar». **Eso quedó viejo**: es anterior al rediseño de
  la landing, y hoy dejaría a las calculadoras peleadas con el sitio desde el
  que se entra. Del plan sirve todo lo procedimental.

### Qué se hizo

`calculadoras/css/comun.css` define los tokens del sitio —cobalto `#1E45CE`,
neutro frío, `radius 0.375rem`, Archivo para títulos— más una base mínima de
controles, tablas y pie. **Las once lo cargan antes de su propio `<style>`**,
así que lo local sigue ganando. Cada archivo conserva su layout.

Antes de eso se arreglaron dos cosas que no eran opinables:

1. **Las tablas estiraban la página.** Las once de `honorarios`, `prorrateo` y
   `tasa` quedaron envueltas en `.tabla-scroll`. Medido en `prorrateo`: de 753
   px de contenido en 406 de viewport a 406 = 406.

   **La lección, porque se repite:** el contenedor con `overflow-x` **no
   alcanza**. Un ítem de flex no baja de su contenido sin `min-width: 0`, y
   `flex: 0 0 400px` significa «no encogerse nunca». Son tres arreglos:
   envolver, `min-width: 0`, y permitir que encoja.
2. **`caducidad` no tenía media query.** Medido, no desbordaba: lo real era que
   40 px de padding por lado se comían un tercio del ancho en un teléfono. Con
   una media query a 600 px el ancho útil pasó de 286 a 346 px.

### Lo que encontró la revisión final

De las once, tres se habían verificado en el navegador. Las otras ocho habían
pasado un control estático —tokens aplicados, sin violeta, sin texto
invisible— y eso resultó **no ser suficiente ni de cerca**. Un barrido de
contraste sobre las once, en claro y en oscuro, dio **27 fallas en oscuro y 9
en claro**. Ahora dan cero.

Lo más grave, y no solo en modo oscuro: en `mora` y `honorarios-mediacion` el
**botón principal tenía contraste 1.00** —blanco sobre blanco, invisible— en
los dos temas y en producción.

La causa: un **ciclo de variables CSS**. Son los dos únicos archivos que ya
traían variables propias, y la conversión a tokens les mapeó los valores viejos
a nombres que chocan con los suyos:

```css
--accent: var(--accent);   /* se referencia a sí misma */
--border: var(--border);
```

Por especificación eso es una dependencia cíclica: la propiedad queda inválida
en tiempo de cómputo y `var(--accent)` no devuelve el cobalto sino **la cadena
vacía**. El botón se quedaba sin fondo y conservaba su texto «sobre acento»,
que es blanco. Queda un comentario en cada archivo diciendo que ahí no se
redefinen los tokens del sistema.

El resto, todo del mismo origen —un reemplazo masivo no puede ver el contexto—:

| Qué | Dónde |
|---|---|
| `--faint` no llegaba a AA en ningún tema: 3.10 sobre la tarjeta, 2.81 sobre `--sunk`, 3.68 en oscuro. Es el único token que usan el pie y los subtítulos, o sea siempre texto chico | `comun.css`, y por eso las once |
| `--border` usado como **fondo** de botón. Es un color de línea translúcido, no una superficie: el botón quedaba casi transparente con el texto blanco heredado | `distancia` |
| Número de paso en `#bbb`: 1.92. Y fondos claros fijos en las pantallas 2 a 4 | `ejecucion-estado` |
| Grises y azules planos que la conversión no alcanzó | `regresiva`, `caducidad`, `entre-fechas` |
| El violeta `#667eea` que este documento daba por erradicado, escrito `rgba(102,126,234)`: la conversión buscó hex | seis lugares |

**Dos lecciones de método, porque las dos van a repetirse:**

- **Un control estático no sustituye una medición.** «Tokens aplicados, sin
  violeta» daba verde en dos archivos donde el botón era invisible. Lo que sirve
  es calcular el contraste sobre estilos computados, en los dos temas.
- **Medir con los paneles ocultos subestima.** Las pantallas 2 a 4 de
  `ejecucion-estado` arrancan en `display:none` y la primera pasada no las vio.
  Hay que forzarlas visibles. Ojo: eso mismo **inventa desbordes** —apila
  pantallas que nunca conviven—, así que el ancho se mide en una pasada
  aparte, sin tocar nada.

### Emojis

Salieron 39 de contenido, que es lo que ya pedía `AGENTS.md` y lo que
`comun.css` dice que reemplazan sus tokens de estado. Los cuatro iconos del
timeline de `ejecucion-estado` pasaron a números, igual que los pasos de arriba
en esa misma página; las dos tarjetas binarias perdieron el icono y quedaron
con su rótulo, que era lo que llevaba el significado. **El `✓` del paso
completado se queda:** es una marca tipográfica monocroma, no un emoji.

### Lo que quedó sin hacer

- **`mora.html` todavía no usa `js/calendario-judicial.js`**: tiene su propia
  copia de la lógica de feria y fin de semana. Es duplicación de código, no
  divergencia de datos —la lista y la API ya son las mismas—, así que no cambia
  ningún número. Es lo único de fondo que sigue abierto de las calculadoras.
- Los `max-width` siguen yendo de 240 a 1000 px sin criterio.
- **Ninguna calculadora se corrió de punta a punta.** Se midió contraste y
  ancho en las once y se miraron capturas de dos. Un cálculo real, con su
  pantalla de resultado, no se hizo.

---

## Lo demás que se hizo, en orden

### Las dos fuentes de días inhábiles — 5/8

`mora.html` no leía `data/dias-inhabiles.json` como el resto: apuntaba a
`jnc-34.github.io/jnc34`, un repositorio del propio Javier creado antes y
abandonado. Ahora apunta a la fuente única.

**El cambio no perdió nada y corrigió un error.** De las 36 fechas que el
externo tenía de más, **35 son feriados nacionales que la API de
`argentinadatos.com` ya devuelve**. La única huérfana era `2026-06-17`, Güemes…
que **está mal**: es trasladable, en 2026 el 17 cae miércoles y rige el lunes
15/6, que la API sí trae. Era la fecha nominal, no la vigente.

**Método que conviene repetir:** ante dos fuentes que difieren, no elegir la más
larga. Comparar entrada por entrada contra la fuente autoritativa.

### La guía de uso — 5/8

`documentacion.html` estaba enlazada desde el hero y contradecía a la landing.
Reescrita entera sobre el sistema visual del sitio. **Lo que se conservó, porque
era lo que valía:** todo el contenido normativo y sobre todo las advertencias de
alcance, reorganizadas en cuatro grupos, con **un bloque explícito de qué NO
hace** por herramienta, que es lo que decide si el resultado se puede usar.

Tres correcciones de fondo:

- **La ampliación por distancia.** La versión del 5/8 decía que la herramienta
  mide en línea recta y que por eso el resultado hay que tomarlo como piso.
  **Estaba mal, lo corrigió Javier el 5/8:** la calculadora tiene *dos* modos y
  el segundo mide **por ruta** (OSRM, sobre la red de caminos de
  OpenStreetMap), que es el que se acerca al criterio de la Corte. La guía
  ahora explica cuál usar: la de ruta manda, la lineal sirve de piso —si ya con
  ella corresponde ampliación, corresponde—, y ninguna de las dos es el
  ferrocarril del fallo, así que donde la Acordada 5/2010 fija la distancia al
  asiento federal, manda la Acordada.

  **La lección:** al documentar una herramienta, leer lo que hace, no lo que
  su nombre sugiere. `distancia.html` tiene dos pestañas y la advertencia se
  escribió mirando una sola.
- **El asistente clásico** dejó de figurar como «prototipo en desarrollo» y pasó
  a lo que es: el origen de Honorio, conservado como referencia de validación.
- Se agregó **«Cómo se calculan los días»**, que estaba repetida a pedazos, con
  las dos advertencias que importan: el receso de invierno es estimado, y si la
  API de feriados no responde el resultado puede quedar corrido.

Ya no tiene emojis, así que la excepción que `AGENTS.md` anotaba está saldada.

### Presentación del repositorio — 4/8

El repositorio está en el LinkedIn de Javier y funciona como carta de
presentación. Presentaba mal lo que tiene: Honorio era una tarjeta más bajo «En
desarrollo», y el texto más visible era un descargo pidiendo disculpas por el
código.

**El criterio que ordenó todo:** hay dos descargos distintos y estaban
mezclados. Uno es correcto y profesional —*no sustituye el criterio del juez, no
es asesoramiento legal*— y se conserva. El otro es una disculpa preventiva y se
reemplazó por lo contrario: **cómo se verifica**. Decir «11 validaciones impiden
que un cambio de interfaz mueva un número» genera más confianza que pedir
perdón, y encima es cierto.

De ahí salieron: `AGENTS.md` como referencia canónica, `CLAUDE.md` reducido a un
puntero, `PROJECT_CONTEXT.md` borrado por desactualizado, README e `index.html`
reescritos, `scripts/validate.mjs` como runner único, CI en cada push y PR, y
`docs/domain/` publicado como HTML.

**Sobre las validaciones:** antes eran scripts sueltos que había que acordarse de
correr, así que «ningún cambio puede mover un número sin que una validación
falle» era un deseo. Ahora corre en CI y otra vez en `pages.yml` antes de
publicar: **si una falla, el sitio no sale.** La frase pasó a ser verdad.

**Sobre `npm run lint`:** se eliminó. Declaraba `eslint .` y `eslint` nunca
estuvo instalado, así que era una promesa que fallaba.

### La mudanza de Honorio — 4/8

`honorio/` salió del repositorio con `git subtree split`, historia completa, y
vive en `javiercuneo/honorio`, publicado en `honorio.ar`. `redirects/honorio/`
deja una redirección para los enlaces que ya andaban dando vueltas.

**Hallazgo que vale como método:** mirando la red de `honorio.ar` recién
publicado apareció un 404 a `/_vercel/insights/script.js`. Era
`@vercel/analytics`, resto de la plantilla de v0. Se sacó: la app declara que
nada de lo que se escribe sale del navegador, y con ese paquete adentro la
afirmación dependía de dónde estuviera alojada. **Una afirmación de privacidad
no puede depender del hosting.** Después de publicar en un lugar nuevo, mirar la
pestaña de red, no solo si la página carga.

Lo que quedó acá y sigue relacionado:

- **`asistente-honorarios-clasico/`** es la FUENTE del motor legacy que Honorio
  todavía carga por `<script>`. Un arreglo a ese motor compartido **se hace acá**
  y se propaga allá a propósito.
- **`docs/domain/`** documenta la Ley 27.423 para los dos. Si algún día el
  clásico se retira, esos ocho documentos se van con Honorio.

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

Se descartó explícitamente el cluster «crema + serif display + terracota» por ser
el look más reconocible de diseño generado por IA.

`--faint` es el gris más claro que todavía se lee. **No aclararlo**: su único uso
es texto chico, que es justo donde el piso de contraste es 4.5.

### `calculadoras/honorarios.html` salió de la vista

Decisión del 4/8: **se sacó de la landing y del README**, porque Honorio la
reemplaza. **El archivo queda en el repositorio** —sigue publicada en su URL y
los enlaces viejos andan— como referencia y porque podría volver con otra forma.
Idea anotada, no comprometida: un modo «power user» de Honorio, cálculo directo
sin entrevista, para quien ya sabe lo que quiere.

### Licencia

**MIT** para todo lo que hay acá (`LICENSE` en la raíz). La excepción —Honorio,
bajo AGPL-3.0— se fue con él, y el CLA de `CONTRIBUTING.md` aplica en aquel
repositorio, no en este.

---

## Pendientes

Ninguno urgente y ninguno bloqueante. El dominio está cerrado del todo:
registrado, con DNS, con certificado y con HTTPS forzado.

- **`mora.html` sobre `calendario-judicial.js`**, descrito arriba.
- **`www.javiercuneo.com.ar`**, si se lo quiere.
- **Tuteo suelto en el texto de las calculadoras.** Varias dicen «envíanos un
  mail» y «si crees», que es el imperativo de *tú*. La convención del
  repositorio es rioplatense. No se corrigió para no mezclarlo con la revisión
  visual.

### Bugs conocidos

Ninguno abierto. El último, cerrado el 5/8:

**Caducidad contaba mal la feria de julio.** Lo reportó Javier con el caso:
inicio 23/6/2026, plazo de 1 mes, resultado **27/7/2026** — una fecha que está
dentro de la feria que el propio resultado decía haber atravesado.

La causa: el código sumaba los días de feria **solapados con el vencimiento
nominal**, no los de la feria entera, y no volvía a mirar si la fecha nueva
seguía cayendo adentro. El bucle avanzaba de año y nunca reexaminaba la misma
feria.

El art. 311 CPCCN dice que los plazos corren durante los inhábiles «salvo los
que correspondan a las ferias judiciales», así que los 12 días se descuentan
enteros. El arreglo es una **iteración a punto fijo** —recalcular hasta que la
fecha deje de moverse—, que es el mismo patrón que el cálculo «full» de ese
archivo ya usaba unas líneas más abajo para los inhábiles.

**Lo que importa del alcance:** el criterio no es «el resultado cae en feria»
sino **«el vencimiento nominal cae en feria»**. De 8.760 combinaciones de fecha
de inicio por plazo entre 2025 y 2028, cambian **298 (3,4 %)** y son
exactamente esas, ninguna más. De ellas, solo una parte daba el absurdo visible
que se reportó; **el resto daba una fecha equivocada pero verosímil**, que nadie
habría mirado dos veces. Ejemplo: inicio 26/6/2026, 1 mes, daba 2/8 y
corresponde 7/8, porque contaba 7 de los 12 días.

Verificado además que ningún resultado nuevo cae dentro de la feria, que todos
satisfacen el punto fijo y que ninguno es anterior al vencimiento nominal.

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
  calculadora.** `--accent: var(--accent)` es un ciclo y deja la variable en la
  cadena vacía, sin ningún error visible. Ver arriba.
- **`--border` y `--hair` son colores de línea translúcidos, no superficies.**
  Usados como `background` dan casi transparente. Para una superficie hundida va
  `--sunk`.
- **Las reglas de `@media print` no llevan tokens de tema.** El papel es blanco
  siempre: `background: var(--card)` imprime negro en modo oscuro.
- **`git commit -m` con here-string falla** en este entorno (guardia de
  sandbox). Usar `git commit -F <archivo>`.
- **`npm run lint` no existe.** Para verificar: `npm run check` y `npm run
  build`.
- **Los comandos de Honorio se corren desde `honorio/`**, que es un clon de otro
  repositorio. Desde el 4/8 la raíz también tiene `package.json`, con `npm run
  docs`. Son dos proyectos npm distintos: fijarse en cuál se está parado.
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
