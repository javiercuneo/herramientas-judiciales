# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-08-05 · rama `main`

> **Este es el único ESTADO del repositorio.** Se evaluó partirlo en uno por
> proyecto y se descartó el 3/8: con varios proyectos conviviendo, dos
> archivos de continuidad se desincronizan y aparece la duda de cuál leer
> primero. Si `honorio/` se separa algún día del repo, se lleva el suyo.

---

## Dónde estamos

`honorio/` cerró el **rediseño visual** y va por **2.0.0**: se arregló el
flujo *hacia atrás* de la entrevista, que arrastraba respuestas de un proceso
a otro. Las validaciones de `lib/legal/__tests__` son ahora **11** y están
todas en verde.

El 4/8 el foco se corrió del motor a **cómo se presenta el repositorio**.
Javier lo tiene enlazado en LinkedIn y funciona de hecho como carta de
presentación, así que se reescribieron el README de la raíz y la landing, y se
hizo visible la parte de ingeniería que existía y no se veía. Ver
[Presentación del repositorio](#presentación-del-repositorio) más abajo.

### Lo del 3/8: el flujo hacia atrás

El bug reportado: llegar a *conocimiento*, elegir **honorarios provisorios**,
volver atrás y cambiar a **sucesión**. El paso de terminación desaparece —la
sucesión no lo pregunta— pero la respuesta seguía en `answers`, el resumen
del caso mostraba «Terminación: provisorios» y el resultado salía marcado
como provisorio.

Es doblemente incorrecto: es un estado que la entrevista no puede producir
yendo hacia adelante, y es un error jurídico. En el sucesorio no se admiten
regulaciones provisorias salvo excepción, y en esa excepción —el letrado
renuncia con la sucesión sin terminar— **la regulación es definitiva y va con
mínimo y máximo**, justo lo contrario de lo que hace el art. 12.

La causa no era del caso: `answers` era un acumulador que solo crecía.
`visibleSteps` sí se recalculaba, pero nadie borraba lo que dejaba de
preguntarse, y `syncAllToLegacy` volcaba todo al motor. Un barrido
exhaustivo de los **25.600 cruces** posibles encontró otras dos salidas, esas
con consecuencia numérica:

| Camino | Qué quedaba pegado |
|---|---|
| Sentencia «rechazada» → atrás → modos anormales / caducidad | base −30 % (art. 22) sin haberlo preguntado |
| Modos anormales «antes de prueba» → atrás → caducidad / art. 22 | escala −50 % (art. 25) sin haberlo preguntado |

**Importante para futuras sesiones:** el legacy **no** es referencia acá. El
clásico tiene el mismo agujero —`wizard.js` setea `wizardState.tipoProceso`
en el `change` del `<select>` y no limpia nada— y su `mostrarResumen()`
imprime «Terminación: …» con solo mirar `modoTerminacion`, sin mirar el tipo
de proceso. Lo heredamos fielmente. Si aparece otro caso raro por esta vía,
no alcanza con comparar contra el clásico.

El arreglo, en tres capas:

1. **`lib/wizard/reachability.ts`** — una respuesta vive mientras su paso sea
   visible. `podarInalcanzables` itera hasta punto fijo, porque podar una
   respuesta puede volver invisible a otro paso. Reemplaza el nuleo ad-hoc
   de las sub-opciones de `objeto`, que era este mismo problema resuelto
   para un solo caso.
2. **El motor se defiende solo** — `esRegulacionProvisoria` mira el tipo de
   proceso, no solo el modo de terminación. Un estado imposible no depende
   de que el llamador lo haya limpiado. Importa para el consumo del motor
   desde afuera, que está en el ROADMAP.
3. **`calculate()` reconstruye el estado del motor entero**
   (`resetWizardState` + `syncAllToLegacy`) en vez de parchearlo.
   `wizardState` es un objeto mutable de larga vida: parchearlo dejaba
   adentro lo que la poda ya había descartado.

**Consecuencia que hay que sostener:** volver atrás y cambiar el tipo de
proceso ahora **vacía** las respuestas que ese proceso no comparte. Volver al
proceso anterior obliga a responderlas de nuevo. Es deliberado —decisión de
Javier el 3/8— y es el precio de que no queden respuestas que el usuario no
dio. Si alguna vez molesta, la salida **no** es dejar de podar: sería guardar
las respuestas viejas en un cajón aparte, que es exactamente el estado oculto
que causó este bug.

### Cambio de criterio en el motor

`resolveReglas` aplicaba el −50 % del art. 25 también cuando la caducidad se
trataba por **art. 22**, acumulando la quita de base del 22 y la de escala
del 25 sobre el mismo hecho. **El motor clásico nunca tuvo esa rama.** Se
quitó el 3/8 con confirmación de Javier: los dos criterios de la caducidad
son alternativos —o art. 22 o art. 25—; elegido el art. 22 la instancia cae
como demanda desestimada y el momento de la apertura a prueba no juega.
Recién con el art. 25 importa.

Hoy no cambia ningún número de una corrida limpia, porque con el criterio del
art. 22 la entrevista nunca pregunta la apertura a prueba. Solo se disparaba
por la fuga descrita arriba.

Commits de la sesión de rediseño (31/7):

| Commit | Qué |
|---|---|
| `ff08f2a` | Sistema visual "instrumento de medición" a nivel de tokens |
| `eb3f423` | Reconstrucción del dashboard sobre esos tokens |
| `369abc2` | Baja de ruido del dashboard + preferencias de lectura |
| `0e689c0` | Wizard sobre el mismo sistema |
| `cc99cc6` | Auto-avance, provisorios, tildes y ajustes de lectura |
| `2df2c74` | Mínimos arancelarios buscables, sin el `<select>` heredado |
| `a43db27` | La marca sigue el tema; limpieza de assets de plantilla |
| `ca2e4d1` | Enlace roto al precedente "Las Marías" en la intro |
| `1f1ddd2` | README, CHANGELOG y ROADMAP |
| `41ca84d` | AGPL-3.0 para `honorio/`, MIT para el resto |

Pantallas: **dashboard**, **wizard**, **portada**, **intro** y **mínimos**
sobre el mismo sistema. Falta pulido de mensajes.

---

## Presentación del repositorio

Trabajo del 4/8. El diagnóstico: el repositorio es la carta de presentación de
Javier —está en su LinkedIn— y presentaba mal lo que tiene. Honorio figuraba
como una tarjeta más bajo «🚧 En desarrollo», y el texto más visible era un
descargo pidiendo disculpas por el código («puede contener errores», «no sigue
estándares profesionales»). Con 11 validaciones corriendo y una arquitectura
documentada, ese descargo ya era falso además de caro.

**El criterio que ordenó todo:** hay dos descargos distintos y estaban
mezclados. Uno es correcto y profesional —*no sustituye el criterio del juez,
no es asesoramiento legal*— y se conserva. El otro es una disculpa preventiva y
se reemplazó por lo contrario: **cómo se verifica**. Decir «11 validaciones
impiden que un cambio de interfaz mueva un número» genera más confianza que
pedir perdón, y encima es cierto.

Qué cambió:

| Qué | Estado |
|---|---|
| `AGENTS.md` | Reescrito. Es la **referencia canónica** para cualquier agente. |
| `CLAUDE.md` | Reducido a un puntero a `AGENTS.md`. |
| `PROJECT_CONTEXT.md` | **Borrado.** Estaba desactualizado (no sabía que Honorio existía) y todo lo suyo ya vivía en `AGENTS.md` y acá. |
| `README.md` (raíz) | Reescrito al registro de `honorio/README.md`. Honorio primero; sección de verificación; sin emojis. |
| `index.html` | Reconstruida sobre los tokens de Honorio. Links **relativos**. |
| `scripts/validate.mjs` | Runner único de las validaciones. |
| `.github/workflows/motor.yml` | CI: tipos + validaciones + build, en cada push y PR. |
| `scripts/build-docs.mjs` | `docs/domain/` renderizado a HTML y publicado. |
| `next.config.mjs` | Se quitó `ignoreBuildErrors`. |

**Sobre `ignoreBuildErrors: true`:** apagaba el chequeo de tipos durante
`next build`. Se sacó el 4/8 después de confirmar que `tsc --noEmit` pasa
limpio: no estaba tapando nada, pero mientras estuviera ahí el build podía
publicar código con errores de tipo sin avisar. Era además la única cosa del
repositorio que le daba la razón al descargo que estábamos sacando.

**Sobre las validaciones:** antes eran scripts sueltos que había que acordarse
de correr a mano, así que la frase «ningún cambio puede mover un número sin que
una validación falle» era un deseo. Ahora hay `npm run check`, corre en CI en
cada push y cada PR, y otra vez en `pages.yml` antes de publicar: **si una
falla, el sitio no sale.** La frase pasó a ser verdad.

**Sobre `npm run lint`:** se eliminó el script. Declaraba `eslint .` y `eslint`
nunca estuvo instalado, así que era una promesa que fallaba. Si alguna vez se
quiere linter, se instala primero.

### Mudanza de Honorio a repo propio — paso 2 de 3

Decisión del 4/8. Javier registró **`honorio.ar`** en NIC (`honorio.com.ar`
estaba tomado), delegó el DNS en Cloudflare —**sin proxy**, nube gris, para que
GitHub pueda emitir su certificado— y creó **`javiercuneo/honorio`**.

| Paso | Estado |
|---|---|
| 1. `git subtree split --prefix=honorio` | **Hecho.** 37 commits, historia completa. Empujado a `main` con `--force` sobre el commit inicial. |
| 2. Pages arriba en el repo nuevo | **Hecho y verificado el 4/8.** `honorio.ar` sirve la app por HTTPS: fuentes, chunks, CSS, la marca y los scripts legacy, todos 200. Sin errores de consola. |
| 3. Sacar `honorio/` de acá y repuntar enlaces | **Hecho el 4/8.** `honorio/` salió del repositorio; `redirects/honorio/` deja una redirección a `honorio.ar` para los enlaces que ya andan dando vueltas. |

**Hallazgo del paso 2:** mirando la red de `honorio.ar` recién publicado
apareció un 404 a `/_vercel/insights/script.js`. Era `@vercel/analytics`,
resto de la plantilla de v0. Se sacó: la app declara que nada de lo que se
escribe sale del navegador, y con ese paquete adentro la afirmación dependía
de dónde estuviera alojada. **Una afirmación de privacidad no puede depender
del hosting.** Vale como método: después de publicar en un lugar nuevo,
mirar la pestaña de red, no solo si la página carga.

**La fuente de Honorio ahora es `javiercuneo/honorio`.** No queda nada suyo que
tocar acá.

**Ojo con la carpeta `honorio/` de la copia de trabajo.** Hasta el 5/8 era la
basura de la mudanza —`node_modules`, `.next` y `out`, sin una sola línea de
código— y este documento decía que se podía borrar. Se borró, y en su lugar
se **clonó el repositorio nuevo**: la ruta está en `.gitignore`, así que el
clon convive sin ensuciar nada y es donde se trabaja Honorio. Antes de tocar
algo ahí, `git remote -v`: `honorio` y `herramientas-judiciales` son dos
repositorios distintos y desde `honorio/` los comandos de git aplican al
primero.

`docs/domain/` **no se mudó**: documenta la Ley 27.423, que implementan tanto
Honorio como el asistente clásico, y el clásico se queda. Si algún día el
clásico se retira, esos ocho documentos se van con Honorio.

`asistente-honorarios-clasico/` **sí importa para Honorio**: es la fuente de
`public/legacy/*.js`, que Honorio todavía carga por `<script>`. Un arreglo a ese
motor compartido se hace acá y se propaga allá a propósito.

---

## Prioridades — por dónde seguir

Definidas con Javier el 4/8. **El criterio que las ordena:** el repositorio es
su carta de presentación, así que primero se arregla lo que alguien ve al
entrar, después lo que le da crédito, y al final lo que solo se nota si va a
buscarlo. No están ordenadas por esfuerzo.

Algunas viven en el otro repositorio; está indicado.

### 1. La guía de uso miente — `documentacion.html` · este repo

Es lo más urgente porque **está enlazada desde el hero de la landing** como uno
de los tres botones principales. El que la abre encuentra, hoy:

- Doce secciones con emoji en el título, otra paleta y otra tipografía: el
  único lugar del sitio que no sigue el sistema visual.
- **Cero menciones a Honorio**, que es el proyecto principal.
- Al asistente clásico presentado como «en desarrollo», cuando en realidad es
  la referencia histórica que Honorio reemplazó.
- La calculadora de honorarios que se acaba de retirar de la landing,
  presentada como vigente.
- Nada sobre PDF-studio ni sobre Bandejito.

Contradice a la landing en la misma sesión de navegación, y esa contradicción
es peor que no tener guía. Es reescritura, no maquillaje.

### 2 y 3. Hechas el 5/8 — repo `honorio`

**La vuelta al repositorio** y **autoría + informe imprimible** salieron
juntas en `honorio` 2.1.0. El detalle completo —qué se decidió, qué se
descartó y por qué— está en el `docs/ESTADO.md` de aquel repositorio, que es
donde corresponde. En una línea cada una:

- Hay un enlace **Herramientas** en la cabecera de Honorio, absoluto, con el
  resto de las URL externas en `lib/enlaces.ts`.
- La firma va al pie del dashboard y se imprime con el informe: autor,
  versión del motor, la UMA con su norma, fecha, contacto, código y
  licencia. El informe es **CSS de impresión**, con interruptor para incluir
  u omitir los fundamentos.

De la misma sesión, y no estaba en esta lista: **el valor de la UMA dejó de
pedirse a Google desde el navegador del visitante.** Lo lee el build de una
planilla que Javier ya mantiene y queda versionado con su norma. El motivo
es el mismo por el que se sacó `@vercel/analytics` el 4/8: una afirmación de
privacidad no puede depender de a quién le pide un archivo la página.

### 4. Revisión visual de las calculadoras — este repo

Descrita abajo. Va cuarta y no antes **porque a cada calculadora se entra a
propósito, buscándola**: el daño es por herramienta, no en la puerta de
entrada. Y son once archivos, así que conviene hacerlo de una sentada y con el
criterio ya decidido, no de a una.

### 5. El nombre y el dominio

`herramientas-judiciales` como nombre de repositorio es el paso intermedio: no
resuelve nada de fondo, pero saca el `-IA`, que era lo que envejecía mal. El
destino sigue siendo un dominio propio bajo el nombre de Javier
(`javiercuneo.com.ar`), que hace que el nombre del repositorio deje de
importar. Está esperando otra vuelta por NIC.

### 6. Terminar de portar el motor legacy — repo `honorio`

Va último. Es el trabajo más grande, **no se ve desde afuera**, y hoy nada está
roto: `public/legacy/*.js` se carga y funciona. No es una limpieza, es una
migración con validaciones de por medio. Que quede claro para no confundirlo
con una tarea de mantenimiento: la app **no arranca la entrevista** hasta que
esos scripts cargan (`LegacyLoader.tsx`), así que borrarlos sin portar rompe
todo.

---

## Pendientes del repositorio

### Revisión visual de las calculadoras

**Pedido de Javier, 4/8.** Cada calculadora es un HTML con su CSS adentro,
escritas en momentos distintos y sin ningún criterio común. El resultado es
disparejo y en algunos casos malo: **`prorrateo.html` es el peor** —según sus
palabras, «una ensalada de colores imposible de ver»—.

Lo que hay que decidir antes de tocar nada: **si conviene un CSS compartido**
(un `calculadoras/css/comun.css` del que tomen todas) o si se arregla una por
una. El compartido es lo obvio, pero rompe la propiedad que hace que estas
herramientas duren: hoy cada archivo es autónomo y no se pisan entre sí.
Una salida intermedia es un CSS común **solo para color y tipografía**, dejando
el layout en cada archivo.

El sistema visual ya existe y está probado: son los tokens de la landing y de
Honorio (cobalto `#1E45CE`, neutro frío, `radius: 0.375rem`, Archivo para
cifras). No hay que inventarlo, hay que aplicarlo.

### `documentacion.html` quedó vieja

Detallado arriba, en **Prioridad 1**. Los enlaces **no** están rotos: se
verificaron los catorce en producción el 4/8 y todos dan 200. El problema es
el contenido y el estilo, no la navegación.

### `calculadoras/honorarios.html` salió de la vista

Decisión de Javier del 4/8: **se sacó de la landing y del README**, porque
Honorio la reemplaza. **El archivo queda en el repositorio** —sigue publicada
en su URL, y los enlaces viejos siguen andando— como referencia y porque podría
volver con otra forma. Idea anotada, no comprometida: un modo «power user» de
Honorio, cálculo directo sin entrevista, para quien ya sabe lo que quiere.

### El nombre: renombrado el 4/8

`Herramientas-Judiciales-IA` pasó a **`herramientas-judiciales`**. Lo que se
buscaba era sacar el `-IA`: en 2023 era una señal, hoy es el default y ubica al
autor del lado del que usa la herramienta de moda, no del que tiene el dominio.

**La URL vieja de Pages quedó rota, sin redirección.**
`javiercuneo.github.io/Herramientas-Judiciales-IA/` devuelve **404 duro** —se
verificó—. GitHub redirige las URL del repositorio, pero no las del sitio.
Cualquier enlace compartido antes del 4/8 —incluido el de LinkedIn— hay que
cambiarlo a mano. **Si el sitio vuelve a cambiar de URL, esto se repite:** es
el argumento más fuerte para pasar a dominio propio y no volver a mover nada.

`honorio.ar` es un dominio de *producto*, no el paraguas: si Javier construye
algo que no tenga que ver con honorarios, «Honorio» no lo contiene. Se evaluó
un nombre inventado para el conjunto (**`elsecretario`** era el candidato) y se
descartó por lo mismo: cualquier marca nueva vuelve a apretar el día que el
trabajo se corra de tema. **La decisión fue el nombre propio**: Javier registró
`javiercuneo.com.ar` el 4/8. Una persona no caduca ni cambia de rubro, y deja
que cada producto tenga su nombre debajo.

Cuando el dominio esté activo hay que repetir el barrido: son **17 URL
absolutas** en `README.md`, `index.html` (`og:image`, que no admite relativas)
y `docs/INFORME_REFACTOR_SHARED_CSS.md`, más **2 en el repositorio de
Honorio** —la calculadora de mediación en `intro-view.tsx` y el enlace a la
documentación de dominio en su `AGENTS.md`—. Todo lo demás del sitio ya es
relativo y no se toca.

---

## Decisiones tomadas, y por qué

Estas no se derivan del código. Si algo se va a cambiar, conviene saber contra
qué se está discutiendo.

### El sistema visual

**"Instrumento de medición".** El honorario es una banda medida en UMA contra
una escala graduada; la interfaz se diseñó como un instrumento, no como un
dashboard genérico. Se descartó explícitamente el cluster "crema + serif
display + terracota" por ser el look más reconocible de diseño generado por IA.

**Cuatro roles tipográficos, cada uno con significado estructural:**

- `font-meter` (**Archivo**, Omnibus-Type, Buenos Aires) — cifras y preguntas.
  Grotesca de raíz DIN con cifras tabulares. Elegida por ser una tipografía
  argentina para una herramienta jurídica argentina.
- `font-law` (**Source Serif 4**) — texto de la ley. **Si aparece serif, se está
  leyendo la norma y no la interfaz.** No usar serif para nada más.
- `font-sans` (Geist) — interfaz.
- `font-mono` (Geist Mono) — etiquetas, unidades y citas de artículos.

**Un solo acento.** Cobalto `#1E45CE` es `primary`, `ring` y `accent-foreground`
a la vez: lo activo, lo enfocado y lo seleccionado son siempre el mismo color.

**Tres ejes de color, uno por eje del cálculo.** Es idea del autor y funciona:

- **ocre** `--axis-base` — base regulatoria (arts. 22, 40)
- **violeta** `--axis-escala` — escala del art. 21 (arts. 25, 35, 37, 41)
- **óxido** `--axis-honorarios` — honorario final (arts. 34, 38, 49)
- **verde** `--rol` — ajuste por rol (art. 20). Fuera del sistema de tres ejes
  a propósito: no reduce por una razón procesal, ubica al rol respecto del
  patrocinante. Se usa igual para el `+40%` del apoderado y el `40%` del
  procurador, porque es la misma regla.

**`--radius: 0.375rem`.** El `rounded-2xl` parejo era parte del look de plantilla.

### Las dos reglas que gobiernan el contenido

1. **Toda la información importante debe estar.** Es software didáctico y
   deliberadamente transparente, no una caja negra. La ley es ambigua, la
   jurisprudencia dispersa, y hay criterios interpretativos que la app adopta:
   se declaran, no se esconden.
2. **Pero solo se le muestra a quien quiere entender.** De ahí:

   > **Los números no se ocultan nunca; las frases, siempre.**

   Un número es una decisión (el efectivo, el piso, la quita): se ve. Una frase
   es un fundamento (la norma, el criterio): va detrás de un `Disclosure`.

**El `por qué` es un único signo.** Misma palabra, mismo tamaño, mismo lugar al
borde derecho de la fila, en toda la app. Si cada explicación tuviera su forma,
el mecanismo para bajar ruido sería la principal fuente de ruido. **No inventar
variantes.**

### Decisiones de contenido

- **Cifras siempre completas.** Se eliminó la abreviación (`$101K`). Dos importes
  distintos como `$2.001.300` y `$2.011.800` abrevian ambos a "2M" y borran
  justamente la diferencia que importa.
- **El contrafáctico.** Bajo la cifra principal: *"La tabla del tramo sugiere
  $1.428.000"*, con la norma detrás del `por qué`. Es el momento más didáctico
  de la app: mucha gente lee la tabla del art. 21 y espera ese número.
  **No aparece cuando la base cae en el primer tramo**, porque ahí el cálculo
  ingenuo y el real coinciden y la frase mentiría.
- **Segunda instancia es una sección par**, no un colapsable. Feedback recibido:
  la app la van a consumir mucho quienes revisan regulaciones en cámara.
- **No numerar los ejes.** "Eje 1 / 01" es una convención nuestra, no de la ley.
  La barra de color ya ordena la secuencia.

### Arquitectura del rediseño

- `components/dashboard/primitives.tsx` — `Cifra`, `LedgerRow`, `Disclosure`,
  `Segmented`, `Tile`, `Prosa`, `Insignia`, y el mapa de colores por eje.
  **Todo componente nuevo del dashboard debería componerse de acá.**
- `components/dashboard/cadena.ts` — deriva los estados intermedios del cálculo
  por aritmética sobre los factores que emite el motor (divisiones y restas).
  **No reimplementa ninguna fórmula legal, y no debe hacerlo.**
- `components/prefs.tsx` — tema claro/oscuro y preferencias de lectura
  (centavos, decimales de UMA). Persisten en `localStorage`. **Solo cambian
  cómo se escribe la cifra, nunca el cálculo.**
- `components/interview/app-topbar.tsx` — la única cabecera de la app.

**Invariante importante:** el paso de la escala en la cadena se expresa
**siempre en términos del patrocinante**, y el ajuste por rol es un paso
posterior. Expresarlo en términos del apoderado hacía que "17% del excedente"
describiera mal el número, porque el ×1,4 se aplica después.

---

## Lo que sigue

### Bugs conocidos

Ninguno. El del flujo hacia atrás se cerró el 3/8 y quedó cubierto por
`retroceso.validation.ts`, que barre los 25.600 cruces en cada corrida.

### Pendiente inmediato (pedido de Javier, 3/8)

Los tres van juntos porque comparten el mismo problema de fondo: hoy nada en
la interfaz dice quién hizo esto ni contra qué versión del motor se calculó.

- **Enlace a la documentación desde la app.** *Medio resuelto el 4/8:* ya hay
  a dónde apuntar. `docs/domain/` se publica como HTML en `/docs/`
  (`scripts/build-docs.mjs`) y la landing lo enlaza. Falta lo de adentro de la
  app: **desde qué pantalla de Honorio se entra**.
- **Informe imprimible.** PDF del cálculo con interruptor para incluir u
  omitir las explicaciones. Propuesto, no empezado.
- **Autoría visible.** Ver abajo.

La versión del motor —hoy `2.0.0`— es el hilo que los une: el informe la
tiene que mostrar, y es lo que hace que un cálculo sea reproducible dentro de
dos años. Ver el encabezado de `honorio/CHANGELOG.md` para el criterio de
numeración.

### Licencia: decidida

`honorio/` es **AGPL-3.0-or-later** (`honorio/LICENSE`, texto verbatim de la
FSF); el resto del repositorio sigue MIT (`LICENSE` en la raíz). Decidido por
Javier el 31/7. El motivo, para no rediscutirlo: no quiere restringir el uso
ni cobrar por la app, quiere que un tercero no pueda cerrar el motor —donde
están los criterios— como producto propio.

Consecuencias que hay que sostener:

- **Todo PR sobre `honorio/` necesita la aceptación de `CONTRIBUTING.md`**, que
  incluye la cesión de licencia. Sin eso se pierde la opción de licenciar
  comercialmente, porque haría falta el permiso de cada contribuyente.
  Si aparece un PR, esto es lo primero que hay que mirar.
- Los archivos de `lib/legal/` llevan encabezado SPDX. Un archivo nuevo del
  motor lo lleva también.
- Al publicar el motor como paquete o API, arrastrar `LICENSE` y los SPDX.

### Decisiones abiertas, del autor

- **Autoría visible en la app.** Hoy figura en los README, no en la interfaz.
  Sin decidir dónde. Cae en el pendiente inmediato de arriba: es la misma
  pregunta que "qué firma el informe imprimible".

### Pendiente de diseño y contenido

- **Assets de marca.** Cableado y resuelto: `components/brand.tsx` usa
  `mask-image` + `currentColor` sobre `public/honorio-marca.svg`.
  **Ojo con lo que decía la versión anterior de este documento:** los SVG no
  eran "iguales a los PNG"; el trazado toma la tinta y deja el papel
  transparente, que es justamente lo que hace que `currentColor` funcione y que
  no haga falta un recuadro de papel. Quedaron sin usar cuatro variantes que
  Javier generó (`honorio trazo blanco/negro.svg`, `honorio2 trazo
  blanco/negro.svg`) y dos propuestas de ícono sin revisar (`resultado
  gemini.png`, `resultado gpt.png`). **Son suyas: no borrarlas sin preguntar.**
  `honorio-wordmark.svg` está generado pero no cableado; el logotipo de la app
  sigue siendo tipográfico.
  Idea de marca a conservar: *un abogado que hace mal los números*.
- **Mensajes.** Varios pasos del wizard traen `brief: 'Ver más'`, que era el
  rótulo del botón viejo, no un resumen. Hoy se reemplaza en presentación por
  "Qué dice la ley sobre este paso" (ver `explanation-disclosure.tsx`), pero
  **conviene escribir briefs reales en el schema**.
- El resto bajó a [ROADMAP](../honorio/docs/ROADMAP.md): caducidad, mediación,
  consumo del motor desde afuera, regulación redactada.

---

## Trampas conocidas

- **El panel del navegador no compone frames si el panel no está a la vista.**
  Esto se anotó varias veces como si fuera una limitación del entorno, y no lo
  es: **la causa es que el panel del navegador está cerrado o en segundo plano
  en la app.** Con el panel oculto, `document.hidden` es `true`,
  `requestAnimationFrame` no dispara, `clientWidth` mide 0 y las capturas
  fallan con *«the Browser pane is not displayed»*. Consecuencias:
  `AnimatePresence mode="wait"` nunca completa la salida y **el paso del wizard
  no llega a montarse**; y no se puede verificar layout ni sacar capturas.
  **La solución es abrir el panel del navegador y reintentar.** Si no se puede,
  las alternativas siguen sirviendo: `read_page`, estilos computados, y una
  **página temporal** que renderice los componentes sin `AnimatePresence`
  (`app/verificar/`, borrarla antes de commitear).
- **`setAnswer` del wizard toma un solo argumento** (el valor), no `(id, valor)`:
  aplica siempre al paso actual.
- **`answers` ya no es un acumulador.** `setAnswer` poda las respuestas que
  dejaron de preguntarse. Si algo necesita sobrevivir a un cambio de rumbo,
  **no** se guarda en `answers` "por las dudas": se declara como paso del
  proceso en `PROCESS_STEP_MAP`, o vive fuera del wizard. Ver
  `lib/wizard/reachability.ts`.
- **El orden de `ALL_STEPS` no es cosmético.** Todo `dependsOn` apunta hacia
  atrás, y de eso depende que podar no invalide el `index` del paso actual.
  Un paso nuevo va después de aquellos de los que depende.
- **No diferir `wizard.next()` en un `setTimeout` que cierre sobre `wizard`.**
  Ese objeto queda con las respuestas del render anterior y la validación no ve
  la selección recién hecha. Ya pasó una vez: usar una ref al último render.
- **El auto-avance es solo por teclado, a propósito.** Con el mouse equivocarse
  de tarjeta te sacaba de la pregunta.
- **`git commit -m` con here-string falla** en este entorno (guardia de sandbox).
  Usar `git commit -F <archivo>`.
- **`npm run lint` ya no existe.** Declaraba `eslint .` sin que `eslint`
  estuviera instalado. Para verificar: `npm run check` (tipos + validaciones) y
  `npm run build`.
- **Los comandos de Honorio se corren desde `honorio/`**, no desde la raíz.
  Desde el 4/8 la raíz **también** tiene `package.json`, con `npm run docs`
  para generar la documentación de dominio. Son dos proyectos npm distintos:
  fijarse en cuál se está parado antes de instalar algo.
- **Una carpeta de ruta que empieza con `_` no existe para el App Router**:
  es carpeta privada. La página temporal de verificación tiene que llamarse
  `app/verificar/`, no `app/_verificar/`, o da 404 sin explicar por qué.
- **`next dev` puede quedar bloqueado por un candado de un proceso muerto**
  ("Another next dev server is already running" con un PID que ya no existe).
  Levantarlo en otro puerto (`npx next dev -p 3007`) destraba y sirve igual.
- **Las capturas de pantalla del panel fallan, pero el JavaScript no.** Para
  verificar color, tamaño o si una imagen cargó, alcanza con leer estilos
  computados; para saber qué dibuja un SVG, dibujarlo en un `<canvas>` y
  muestrear píxeles. Es más confiable que mirar una captura: en esta sesión
  una captura mal leída llevó a dar por invertido un trazado que estaba bien.

---

## Cómo verificar un cambio en el motor

```bash
npx tsc --noEmit
npm run build
```

Y las validaciones del motor —11 archivos—, que deben quedar todas en verde.
Todo junto, que es lo mismo que corre CI:

```bash
npm run check
```
