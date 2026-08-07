# Instrucciones para agentes

Este archivo es la referencia canónica para cualquier agente que trabaje en
este repositorio: Claude Code, Codex, Cursor, opencode o el que venga.
`CLAUDE.md` apunta acá y no repite nada.

**Antes de tocar código, leé [`docs/ESTADO.md`](docs/ESTADO.md).** Lleva lo que
el código no puede llevar: en qué punto está el trabajo, qué decisiones de
diseño e interpretación ya se tomaron y por qué, qué se sabe roto y qué trampas
ya costaron tiempo. Se actualiza en el mismo commit que el trabajo que
describe, así que no miente. Si vas a cerrar una sesión, actualizalo.

---

## La regla que gobierna todo lo demás

Esto no es software donde un bug se descubre en producción y se arregla el
martes. Un cálculo de honorarios puede terminar fundando una resolución
judicial, y una fecha de vencimiento mal computada hace perder un derecho.
**La exactitud del número es el producto.** El código es el vehículo.

De ahí una sola regla, de la que se derivan casi todas las demás:

> **Ningún cambio puede mover un número sin que eso sea exactamente lo que se
> pidió, esté justificado en la norma y quede escrito.**

Un refactor que mejora el código y cambia un resultado no es un refactor
mejorado: es un error. Los resultados actuales se consideran correctos y son
la referencia a preservar, salvo que se demuestre lo contrario con el caso
concreto.

Lo que se sigue de eso:

- **No cambies escalas, porcentajes, coeficientes ni reglas normativas** sin
  pedido explícito. Si creés que algo está mal, decilo con el caso: qué
  entrada, qué da hoy, qué debería dar, y qué artículo o criterio lo funda.
  Después esperá confirmación.
- **No "simplifiques" una fórmula legal.** Lo que parece una redundancia suele
  ser una distinción de la ley. El orden de los pasos importa: aplicar una
  quita sobre la base no es lo mismo que aplicarla sobre la escala.
- **No elimines validaciones** porque parezcan defensivas de más.
- **No confíes en el motor clásico como oráculo.** Es la referencia histórica,
  no la verdad. Ya se encontró un caso donde el clásico y Honorio compartían el
  mismo agujero (ver `ESTADO.md`, flujo hacia atrás). Que dos implementaciones
  coincidan prueba que son consistentes, no que están bien.

**Lo que sí podés hacer sin preguntar:** cambios de interfaz, texto, estilos,
tipos, estructura de archivos, documentación y cualquier cosa que no toque un
resultado. No hace falta un plan aprobado para renombrar una variable. El
riesgo acá no es el tamaño del cambio, es si un número se movió.

---

## Cada afirmación contra su fuente

Regla escrita el 7/8/2026, después de encontrar que **los ocho documentos de
`docs/domain/` describían mal el motor que documentaban**: un decreto
reglamentario inventado, artículos citados corridos en bloque, un mecanismo de
mínimos que no existe, y uno que aplicaba las reducciones en el orden
equivocado —medio millón de diferencia en el caso que se probó—.

Salieron así porque **se generaron a partir de una descripción del sistema y no
del sistema**, y después se «verificaron» leyendo el propio documento. La
estructura sobrevive a ese proceso; los datos no.

Antes de afirmar algo, fijate **de qué tipo es la afirmación**, porque cada una
tiene su fuente y son distintas:

| La afirmación es sobre… | Se verifica contra… |
|---|---|
| **Qué dice la ley** | El texto: [`docs/domain/00_LEY_27423.md`](docs/domain/00_LEY_27423.md) |
| **Qué hace la aplicación** | El código, leído. No un documento que lo describa |
| **Una interpretación** | Nada la prueba: se declara como tal, con el razonamiento |

Confundirlas fue el error. La ley no te puede decir si `calculate.ts` importa
`minimos-data.ts`, y el código no te puede decir si una lectura es defendible.

De ahí tres cosas que sí funcionan:

- **Anclá cada afirmación a algo que se pueda abrir o correr.** No «el wizard
  pregunta esto» sino «`PROCESS_STEP_MAP`, una constante». No «la escala
  funciona así» sino un ejemplo con los números que la app muestra en pantalla.
  Una afirmación anclada se puede desmentir; una general no.
- **Ninguna descripción secundaria es oráculo.** Ni el motor clásico —ya está
  dicho arriba—, ni un documento anterior, ni el documento que estás corrigiendo.
  Si hay que arreglar una afirmación, buscá **la clase**, no la instancia que te
  señalaron: en `05_DEPENDENCIAS.md` se corrigió una y quedaron cuatro iguales
  en los diagramas, y el encabezado declaraba el arreglo como hecho.
- **Una nota de verificación que no es cierta es peor que ninguna**, porque el
  que la lee deja de mirar. Si decís «verificado contra X», tuvo que ser contra
  X y entero.

**`npm run verificar-docs`** controla lo que se puede controlar solo: que las
normas, los artículos y los identificadores que los documentos nombran existan.
Corre en CI antes de publicar. No dice que un documento sea cierto —eso se
verifica leyendo el motor— pero una cita inventada no llega a producción.

Orden de prioridades cuando entran en conflicto:
**1) exactitud legal, 2) claridad, 3) mantenibilidad, 4) funcionalidad nueva,
5) performance.** La performance va última en serio: son calculadoras que
corren en milisegundos.

---

## Qué hay acá

No es una aplicación: son varios proyectos independientes, en distinto grado
de madurez, conviviendo en un repositorio. Tratalos como tales — un cambio en
`calculadoras/` no tiene por qué mirar `PDF-studio/`.

> **Honorio ya no está acá.** Desde el 4/8/2026 vive en
> [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio) y se publica
> en [honorio.ar](https://honorio.ar). Se llevó su historia completa. Si hay que
> tocar el asistente de honorarios, **es en ese repositorio**, no en este.
>
> En la copia de trabajo hay un `honorio/`, ignorado por `.gitignore`. Desde
> el 5/8/2026 **es un clon del repositorio nuevo**, no la basura que quedó de
> la mudanza: se trabaja ahí y se commitea contra `javiercuneo/honorio`.
> Antes de tocarlo, `git remote -v` para confirmar contra qué se está
> parado.

```
asistente-honorarios-clasico/   El motor original en JS vanilla del que salió Honorio.
                                  Referencia histórica. Sigue publicado y funcionando.
                                  Es la FUENTE del motor legacy que Honorio todavía carga.
calculadoras/                   Herramientas de un solo archivo HTML con JS embebido
                                  (plazos, mora, tasa, prorrateo, caducidad...).
                                  Sin build, sin bundler: se editan directo.
                                  js/calendario-judicial.js es la dependencia compartida
                                  de todo lo que calcula fechas.
data/dias-inhabiles.json        Feriados locales, respaldo de la API externa.
PDF-studio/                     Express + JS vanilla, PWA de herramientas PDF.
                                  App aparte, package.json propio. No toca honorarios.
docs/domain/                    Documentación del dominio (01 a 08): tipos de proceso,
                                  reglas de negocio, modelo, glosario, deuda técnica.
                                  El "por qué" de las reglas de la Ley 27.423. Lo
                                  comparten el clásico y Honorio; por eso quedó acá.
assets/                         Capturas y material de la landing.
redirects/honorio/              Redirección de /honorio/ a honorio.ar.
scripts/build-docs.mjs          Renderiza docs/domain/ a HTML para publicarlo.
index.html, documentacion.html  Landing y guía de uso, publicadas en GitHub Pages.
proyectos finalizados/          Trabajos cerrados, conservados como muestra.
```

Antes de tocar lógica legal en cualquier lado, pasá por
[`docs/domain/03_REGLAS_DE_NEGOCIO.md`](docs/domain/03_REGLAS_DE_NEGOCIO.md) y
[`07_GLOSARIO.md`](docs/domain/07_GLOSARIO.md) para el razonamiento normativo, y
por [`08_DEUDA_TECNICA_FUNCIONAL.md`](docs/domain/08_DEUDA_TECNICA_FUNCIONAL.md)
por si el problema ya está anotado.

---

## Honorio, que ya no vive acá

El asistente de honorarios se mudó a
[`javiercuneo/honorio`](https://github.com/javiercuneo/honorio) el 4/8/2026, con
su historia completa. **Cualquier cambio al motor de honorarios va allá.** Ese
repositorio tiene su propio `AGENTS.md`, su `ESTADO.md` y sus validaciones.

Lo que quedó acá y sigue relacionado:

- **`asistente-honorarios-clasico/`** es la FUENTE del motor legacy que Honorio
  todavía carga por `<script>` (`public/legacy/*.js` allá). Si hay que arreglar
  algo de ese motor compartido, **se arregla acá** —que es la fuente— y se
  propaga al otro repositorio a propósito. Nunca se parchea una copia sola.
- **`docs/domain/`** documenta la Ley 27.423 para los dos.
- **`redirects/honorio/`** hace que los enlaces viejos a `/honorio/` no mueran.

---

## Las calculadoras

Un archivo HTML cada una, con su CSS y su JS adentro. Sin build y sin bundler:
se abren, se editan y se guardan. Esa simplicidad es deliberada: duran años sin
mantenimiento.

Comparten dos cosas, y las dos afectan a varias herramientas a la vez:

- **`calculadoras/js/calendario-judicial.js`**, del que depende todo lo que
  computa fechas. Un cambio ahí se verifica abriendo cada una de las que
  calculan plazos.
- **`calculadoras/css/comun.css`**, que define los tokens del sistema visual y
  una base mínima. Cada archivo lo carga *antes* de su propio `<style>`, así que
  lo local sigue ganando y cada uno resuelve su layout. **No redefinas un token
  del sistema dentro de un `<style>`:** `--accent: var(--accent)` es un ciclo,
  deja la variable en la cadena vacía y no da ningún error visible. Ya dejó dos
  calculadoras con el botón invisible; está en `ESTADO.md`.

Un cambio visual se verifica midiendo, no mirando: contraste sobre estilos
computados, en tema claro y oscuro, y ancho a 390 px. Un control estático
—«tokens aplicados, sin colores planos»— ya dio verde sobre páginas ilegibles.

Los feriados salen de una API externa con respaldo local en
`data/dias-inhabiles.json`. Si la API no responde, la herramienta tiene que
seguir dando un resultado con el respaldo, no romperse.

---

## Convenciones del repositorio

- **Español rioplatense, con tildes**, en interfaz, documentación y commits.
  No "tú", no "vosotros", no texto sin acentuar.
- **Sin emojis, ni en documentación ni en interfaz.** `ESTADO.md`, `README.md` y
  `CONTRIBUTING.md` marcan el registro: directo, con las razones dichas, sin
  decoración. Las calculadoras y `documentacion.html` quedaron limpias el 5/8;
  donde un emoji hacía de semáforo, ahora está el token de estado de
  `calculadoras/css/comun.css`.
- **Commits en español**, con prefijo tipo `feat:`, `fix:`, `docs:`,
  `chore:`. Miralos con `git log --oneline` antes de escribir el tuyo.
- **`git commit -m` con here-string falla** en este entorno. Usá
  `git commit -F <archivo>`.
- **Licencia MIT** para todo lo que hay acá. La excepción —Honorio, bajo
  AGPL— se fue con él; el CLA de `CONTRIBUTING.md` aplica en aquel
  repositorio, no en este.
- **La landing publica lo que la allowlist de `pages.yml` nombra.** Si agregás
  algo al sitio, va ahí *y* se enlaza desde `index.html`. Si no, no existe para
  nadie: ya pasó con PDF-studio, que estuvo meses publicado y sin figurar.

---

## Trampas conocidas

Están todas en la sección final de [`docs/ESTADO.md`](docs/ESTADO.md), con el
detalle de qué pasa y por qué. No se duplican acá para que no se desincronicen.
Si te chocaste con una nueva, agregala ahí.
