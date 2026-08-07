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

---

## Dónde estamos

El sitio está publicado en **`javiercuneo.com.ar`**, dominio propio, desde el
5/8. Las once calculadoras comparten el sistema visual del sitio y quedaron
revisadas una por una. Las prioridades que se habían fijado el 4/8 están todas
cerradas.

Lo que queda es mantenimiento y las ideas anotadas más abajo, ninguna urgente.

Desde el 6/8 hay un frente abierto: **los textos que describen el motor no
estaban verificados contra el motor**. Se corrigieron la sección «Cómo está
hecho» de la landing y **los ocho documentos de dominio**, que quedaron
cerrados el 7/8. Siete se reescribieron; el `07` solo necesitó retoques. El
detalle de cada uno está abajo.

De paso salieron dos errores en Honorio, ya arreglados allá: la tarjeta de la
medida cautelar prometía el porcentaje contrario al que el motor aplicaba, y la
transformación se atribuía al art. 29 inc. e en vez de al 37.

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

### Por qué salieron mal los documentos, y qué se hizo — 7/8

**El diagnóstico, porque la firma del error era clara.** Lo que estaba bien en
los ocho era el relato general —hay una escala, hay reducciones en tres etapas,
el procurador sale del patrocinante—. Lo que estaba mal era **todo lo que exigía
mirar algo concreto**: el número del artículo, el nombre de una clave, el orden
de los pasos, si un mecanismo existe. Y los artículos del `04` no estaban
sueltos sino **corridos en bloque**.

Esa firma es inconfundible: **se generaron a partir de una descripción del
sistema, no del sistema**. Una descripción conserva la estructura y pierde los
datos, y por eso sonaban plausibles.

Hubo un segundo mecanismo, el de los inventos «útiles»: el control de mínimos
del `03` no salió de la nada, salió de que un sistema de honorarios con mínimos
legales **debería** verificarlos. Lo mismo el «total general» y el «25 % si la
cautelar se despacha».

**Y el más importante de todos, porque explica por qué los docs salieron peor
que el código que describen:** el motor calcula bien y las once validaciones
estuvieron en verde todo el tiempo. El código tiene compilador, tipos y 830
afirmaciones que corren en cada push. **La prosa no tiene nada.** El mismo
proceso produce código que funciona y prosa confiadamente falsa, porque uno
tiene realimentación y la otra no.

La pasada del 5/8 **funcionó** —por eso el `07` no hubo que reescribirlo— pero
tuvo dos límites: se verificó contra la ley también las afirmaciones sobre el
código, que la ley no puede contestar; y se corrigió la instancia señalada en
vez de la clase, que es lo que dejó cuatro «50 % parcial / 100 % total» vivos en
el `05` con el encabezado declarándolos arreglados.

**Qué se hizo con eso.** Dos cosas, las dos baratas:

1. **La regla de fuentes, en [`AGENTS.md`](../AGENTS.md).** Tres tipos de
   afirmación y tres fuentes distintas: la ley se verifica contra el texto, la
   app contra el código leído, y una interpretación no se verifica —se declara—.
   Más las tres consecuencias: anclar cada afirmación a algo que se pueda abrir
   o correr, no tratar ninguna descripción secundaria como oráculo, y no firmar
   una nota de verificación que no sea cierta.
2. **`npm run verificar-docs`**, descrito abajo.

### El control mecánico de las citas — 7/8

`scripts/verificar-docs.mjs`. **No verifica que los documentos sean ciertos
—eso no se puede automatizar— pero caza la clase de error que salió más cara:
la cita inventada.** Tres controles: normas (`Ley NN.NNN`, `Decreto NNN/AAAA`)
contra el texto de la ley más una lista blanca con el motivo de cada una;
artículos de la 27.423 contra los encabezados reales del texto; e
identificadores y rutas entre backticks contra el código.

**Corre en CI antes de armar el sitio**, así que una cita inventada no llega a
producción.

Probado contra los errores históricos reales: caza el «Decreto Reglamentario
218/2015», `escala_art21`, `valor_uma`, `minimos_judiciales_calc`, `sucesión`
con tilde, un archivo inexistente y un `art. 84` que la ley no tiene.

**Tres cosas que costaron y conviene no volver a descubrir:**

- **El script se auto-validaba.** `scripts/` está en el corpus, así que sus
  propios comentarios —que citan `escala_art21` como ejemplo de lo que hay que
  cazar— hacían que el control pasara. Pasó de verdad, en la primera corrida de
  la prueba de regresión. Ahora se excluye a sí mismo.
- **La sección «Qué decía este documento y no era así» cita normas falsas a
  propósito.** El `04` nombra el decreto inexistente justamente para decir que
  no existe. Esa sección se saltea, detectada por el encabezado.
- **`honorio/` no está en CI.** Los identificadores del motor salen como no
  verificables y no hacen fallar: un rojo que depende de si alguien clonó algo
  no sirve. Lo que sí falla en CI son las normas y los artículos, que es la
  clase de error más cara. `--sin-honorio` simula localmente lo que ve CI.

**Lo que no caza, para no confiarse:** artículos que existen pero se citan para
lo que no son —el `art. 51 inc. 8` del `05` pasa, porque el art. 51 existe—, y
cualquier afirmación de fondo. Eso sigue siendo leer el motor.

### El 06, el 07 y el 08 — 7/8. Los ocho documentos, cerrados

**`06_MATRIZ_DE_PROCESOS.md`, reescrito.** Tenía dos criterios inventados
enteros:

- **«25 % si la cautelar se despacha, 50 % si se rechaza (art. 37).»** El art. 37
  no mira si la cautelar prospera: toma el 25 % de la escala, elevado al 50 % en
  casos de controversia u oposición. Tal como estaba, **hacía cobrar más por
  perder**.
- **«La reducción del art. 41 se aplica cuando no hubo ejecución de sentencia
  previa.»** No existe esa condición, ni en la ley ni en el motor: el art. 41 se
  aplica siempre.

Más lo que ya se sabía —ejecución de sentencia y ejecutivo figuraban sin
reducciones de base, y sí las tienen—, «incidente: patrocinante No» cuando el
motor sí lo devuelve, la base de la homologación como «alquileres adeudados» en
vez de del contrato, y dos conceptos de la tabla de mínimos mal nombrados:
«Efectos divorcio / **Registro Público**» y «Peritos (**daños no pecuniarios**)».
Las notas justificaban cifras con razones inventadas —«son más altos por la
jerarquía del tribunal»—. Se le agregó la columna de provisorios, que faltaba
entera.

**`07_GLOSARIO.md`: el único de los ocho que no hubo que reescribir.** Se hizo
bien el 5/8 y se nota. Lo que le faltaba era la segunda mitad de la
verificación: aquella fue contra la ley y no contra el código. Cuatro retoques:

- **La fórmula del piso de la escala.** Decía «máximo acumulado del tramo
  anterior», que es otra cuenta. Es el límite del tramo anterior por su alícuota
  máxima. Es el mismo error que tenía el `02`, acá en versión leve.
- El puntero al motor apuntaba al clásico y no a Honorio.
- La lista de objetos estaba incompleta: siete de doce, sin decir que era
  parcial.
- Los mínimos del art. 44 quedaban anotados como sin verificar. **Quedaron
  verificados**: 7 UMA en acciones contencioso administrativas y 5 en
  actuaciones administrativas, cuando el asunto no es susceptible de apreciación
  pecuniaria.

**`08_DEUDA_TECNICA_FUNCIONAL.md`: arreglos puntuales.** Su problema no era el
contenido jurídico sino que **describe el motor clásico y nunca se le cambiaron
los punteros después de la mudanza del 4/8**. Donde dice `calculations.js` o
`core.js` se habla de `asistente-honorarios-clasico/`. Quedó dicho en el
encabezado en vez de reescribir 28 entradas que como catálogo de decisiones
siguen valiendo.

Tres entradas habían dejado de ser ciertas:

- **La 16 decía lo contrario de lo que dice la ley.** «Los jueces pueden fijar
  honorarios de auxiliares **por debajo** de los mínimos, según el art. 21». Al
  revés: el art. 21 habilita **superar el techo del 10 %** ante labores
  altamente complejas. Bajar del mínimo es el art. 478 CPCCN, que es otra norma
  de otro cuerpo legal y no está «incorporada» al art. 21.
- La 19, la UMA desde Google Sheets. Se reescribió con las cuatro razones por
  las que se cambió, que es lo que valía conservar.
- La 20, que describía el helper de porcentajes del clásico. En Honorio es el
  reparto entre dos profesionales, 60/40 ajustable, y **no sale de ningún
  artículo**.

Y se agregó la **entrada 29**, que es lo más importante que el catálogo no
tenía: los mínimos no se comparan contra el resultado. No es una decisión
tomada, es una ausencia que nadie había anotado.

También se le puso al principio que **no es una lista de trabajo pendiente**: eso
es [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md). Son dos cosas distintas y
mezclarlas hace que ninguna se pueda leer entera.

### `05_DEPENDENCIAS.md`, reescrito contra el motor — 7/8

**El único de los cinco cuyo error cambia un número.** Decía, en cinco lugares
distintos y en su diagrama de orden general, que las reducciones de los arts. 22
y 40 se aplican **sobre el monto de la escala**. Se aplican sobre la base, antes
de la escala.

No es una diferencia de redacción. Como la escala es progresiva, reducir la base
puede hacerla caer a otro tramo. Corrido contra el motor, demanda desestimada
(-30 %, art. 22), base $50.000.000, UMA $102.076:

```
MOTOR   base × 0,7 y después la escala  →  5ª escala: 61,93 UMA = $6.321.798
DOC 05  la escala y después × 0,7       →  6ª escala: 66,62 UMA = $6.800.776
                                            $478.978 de más — 7,6 %
```

Ni siquiera es el mismo tramo. **Quien hubiera regulado siguiendo ese documento
habría dado casi medio millón de más en ese caso.**

**Y su nota de verificación del 5/8 afirmaba correcciones que no se habían
aplicado.** Decía haber arreglado la segunda instancia como «50 % parcial /
100 % total» y siete atribuciones de los auxiliares al art. 43. Sobrevivían
cuatro de la primera —una en cada proceso que la tiene— y una de la segunda.

**Una nota de verificación que no es cierta es peor que ninguna**, porque el que
la lee deja de mirar. Vale para todos estos documentos: la del 6/8 y la del 7/8
se escribieron después de leer el motor entero, no después de corregir lo que
saltaba a la vista.

**Lo demás:**

- **Una escala de incidentes por tramos, inventada entera**: «2 % hasta 10.000
  UMA, 5 % de 10.001 a 50.000, 10 %, 15 %, 20 % superior a 500.000». No existe:
  el motor aplica un rango plano del 2 % al 20 %.
- **El partidor atribuido al «art. 51 inc. 8».** El art. 51 trata del contenido
  de la resolución regulatoria y no tiene incisos. Es el art. 35, última parte.
  Segunda cita fabricada en dos días, después del decreto inexistente del `04`.
- **«Ejecución de sentencia y ejecutivo NO aplican reducciones base».** Sí las
  aplican. El cuadro comparativo repetía el error, y el `06` también lo tiene.
- El conocimiento no mencionaba los provisorios ni la reducción de base por
  caducidad del art. 22; los modos anormales incluían la conciliación; la
  cautelar y la homologación figuraban como «sin reducciones de escala» cuando
  sus factores **son** de etapa `escala`.

**Se le cambió el alcance, porque el que tenía estaba duplicado.** El título
prometía «qué módulos y componentes invoca cada proceso» y el documento no
nombraba un solo módulo: traía el flujo de reglas por proceso —que es el `01`—
y una tabla comparativa —que es el `06`—. Ahora hace lo que el título dice, y
además lo que faltaba en todo el repositorio: **qué depende de cada pieza
compartida y qué validación corre qué**, para saber qué se rompe al tocar algo.

### `04_MODELO_DEL_DOMINIO.md`, reescrito contra el motor — 7/8

**Tenía una cita de autoridad inventada, y estaba en el renglón que más
autoridad aparenta**: el pie decía «documento generado conforme a la Ley 27.423
y su Decreto Reglamentario 218/2015». Ese decreto no existe, y no podría: es
anterior a la ley, que es de 2017. Los decretos que sí tocan a la 27.423 son el
**1077/2017** —que observó varios artículos al promulgarla, entre ellos el 47—
y el **157/2018**, que derogó el art. 36.

En un documento jurídico eso es lo peor que puede haber, y es el tipo de error
que ninguna validación va a encontrar nunca.

**Las citas de artículos estaban corridas de forma sistemática.** Seis de las
ocho filas de la tabla de bases apuntaban a un artículo que trata otra cosa: la
cautelar al 39 (alimentos), los alimentos al 43 (laboral), la homologación al 45
(liquidación del régimen patrimonial), el exhorto al 46 (escrituración), el
ejecutivo al 40 (desalojo). Y cinco de las seis filas de la tabla de mínimos,
que además se contradecían entre sí: el art. 48 figuraba dos veces con
significados distintos y el art. 31 aparecía como «segunda instancia», que es el
30.

**Una línea con tres errores en nueve palabras:** «si se rechaza, la base se
reduce a 1/3 (art. 40)». Es × 0,70 y no a un tercio; es del art. 22 y no del 40;
y no es solo en el ejecutivo.

**Lo demás:**

- **El diagrama terminaba en «HONORARIOS TOTALES: patrocinante + apoderado +
  procurador + auxiliares».** Esa suma no existe y no significa nada.
- **«Monto base × etapa completada × factorFinal».** El motor no multiplica por
  ninguna etapa.
- **Las contingencias tenían mal el efecto y mal los valores**: `aperturaPrueba`
  «afecta la etapa completada» —afecta la escala—, `tuvoExcepciones` «puede
  afectar las etapas» —es -10 % sobre el honorario—, `medidaOposicion` «cambia
  la base» —cambia el porcentaje de la escala—. Y listaban `si`/`no` donde el
  código usa `con`/`sin`, `unico`/`varios` o `vivienda`/`otros`.
- **Confundía `desalojoVivienda` con `homologacionVivienda`.** Son dos campos
  distintos en dos ramas distintas. Ninguno de los dos sub-pasos del objeto
  aparecía en el documento.
- **Las etapas del art. 29 estaban inventadas**: «instructiva, admisión de
  pruebas, sentencia». El artículo dice otra cosa. Y agregaba que la cautelar
  «generalmente tiene 1 etapa», que no está en el artículo.
- **Repetía el mecanismo de pisos mínimos que no existe**, igual que el `03`.
- **La UMA desde Google Sheets, y «$92.482 como valor inicial a la fecha de
  sanción de la ley».** Era un valor de 2026 en una ley de 2017.
- `sucesión` figuraba con tilde como clave del código, y los encabezados estaban
  en inglés —«Attributes», «Types»—.

**El documento nuevo mapea cada entidad jurídica contra su tipo real**
—`ValorUMA`, `EscalaAplicada`, `EscaleraInfo`, `Transformacion`, `Rango`,
`SegundaInstanciaRol`, `Partidor`, `MinimoCategoria`—, que es lo que lo hace
verificable y lo que lo distingue del `01` al `03`: aquellos van por procesos,
recorrido y reglas; este va por las cosas.

### `03_REGLAS_DE_NEGOCIO.md`, reescrito contra el motor — 6/8

El peor de los tres. **Afirmaba seis veces un mecanismo que no existe.**

Las reglas 23, 24, 35, 42, 43 y 44 decían, cada una con sus palabras: «se aplica
como piso; si el cálculo por escala arroja un valor inferior al mínimo, se usa
el mínimo». Y el paso 9 del diagrama de la cadena decía «verificar mínimos».

**`calculate.ts` no importa `minimos-data.ts` y no hay ninguna comparación de
piso en ningún punto.** El cálculo termina en el partidor. Es decir que el
documento hacía creer que la herramienta garantiza los mínimos legales, y no los
garantiza: **el número que devuelve puede quedar por debajo de un mínimo del
art. 58 o de los de peritos, y no lo dice.**

No se cambió nada del motor al descubrirlo: implementar un piso mueve números.
Quedó como punto 8 de [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md), y es el
único de la lista que puede mover un número **hacia arriba**.

**El error de fondo: mezclaba tres clases de regla y llamaba a las tres
«implementadas en el sistema».** Las que aplica el motor, las que la ley pone a
cargo del usuario para determinar la base, y las tablas de consulta. Doce de las
45 «reglas» describían cosas que el motor no hace —determinar la base del
art. 23, sumar los intereses, calcular la base del desalojo laboral, la de la
liquidación patrimonial, la de la escrituración—. La regla 37 incluso decía
«cuándo aplica: siempre, para todo proceso judicial».

El documento nuevo está organizado por **quién aplica cada regla**, que era la
distinción que faltaba, con una sección propia para los pisos que la ley fija y
el motor no verifica.

**Lo demás que se corrigió:**

- **La homologación de desocupación estaba clasificada como reducción final.**
  El motor la aplica sobre la escala. El número da igual, pero la etapa es
  justamente lo que ese documento existe para decir. Y decía que el 50 % aplica
  «cuando **no** es de vivienda»: aplica siempre.
- **El incidente, «cuando tramita bajo la antigua Ley 21.839».** El motor lo
  aplica a todos, y no por descuido: el art. 47 quedó observado y no hay otra
  escala.
- **La tabla del exhorto con los tres incisos inventados**, ya sabido.
- **El art. 30 decía que el 40 % aplica si la sentencia se revoca «total o
  parcialmente».** El artículo lo reserva a la revocación en todas sus partes a
  favor del apelante.
- **El partidor figuraba como condicional.** Se calcula siempre en la sucesión.
- **El art. 43 descrito como «desalojo laboral (despido sin causa, etc.)».** No
  tiene que ver con el despido: es la restitución de inmuebles dados al
  trabajador por la relación de trabajo.
- **Los modos anormales del art. 25 incluían la conciliación.** Son
  allanamiento, desistimiento y transacción.
- **El art. 23 inc. d resumido como «capital + intereses».** Es el valor de las
  escrituras deducidas las amortizaciones.
- **Se fueron los 45 números de regla.** Eran identificadores arbitrarios
  —declarados como tales en el propio índice— y buena parte no correspondía a
  ninguna regla del sistema. Ahora cada regla se identifica por la etapa en que
  opera y el artículo que la funda. Nadie los referenciaba fuera del documento.
- Sin tildes, y con dos palabras en inglés filtradas en la regla 25.

### `02_FLUJO_JURIDICO.md`, reescrito contra el motor — 6/8

Este estaba **mucho mejor que el 01**: el orden de operaciones, la acumulación
de la escala, los auxiliares sobre la base y el procurador sobre el honorario
del patrocinante estaban todos bien. Igual tenía errores, y uno de fondo.

**El error de fondo: la explicación de la escala del art. 21.** Presentaba el
piso de cada tramo como una **suma acumulada tramo por tramo**, y su propio
ejemplo no cerraba: escribía «4,95 + 7,80 = 11,70», que da 12,75.

El motor no acumula. El piso es **el límite del tramo anterior multiplicado por
la alícuota máxima de ese tramo**:

```
15 × 33 % = 4,95      45 × 26 % = 11,70     90 × 24 % = 21,60
150 × 22 % = 33       450 × 20 % = 90       750 × 17 % = 127,50
```

Son las seis constantes de `calcularEscala()`. La lectura acumulada da otro
número —hasta 45 UMA daría 12,75, no 11,70— así que no es una diferencia de
redacción: el documento explicaba una fórmula que el motor no usa.

Se verificó contra una corrida real, no contra el código solamente: base
$50.000.000 con la UMA a $102.076 son 489,83 UMA, tramo 6º. La app muestra
«máximo hasta 450 UMA $9.186.840» —que es 450 × 20 % = 90 UMA— y «13 % del
excedente de $4.065.800 → $528.554». Mínimo $9.715.394. Los tres números salen
de la fórmula del piso y de ninguna otra. Ese ejemplo quedó en el documento
porque cada cifra se puede volver a comprobar en pantalla.

**Una decisión interpretativa que quedó declarada.** El párrafo del art. 21 está
escrito como piso —«en ningún caso… inferiores»—, o sea que literalmente habla
del mínimo. El motor aplica la misma fórmula al máximo. Algo así tiene que
hacer: sin acumular, el máximo del tramo puede quedar por debajo del mínimo ya
calculado, que es un absurdo. Pero es interpretación, no transcripción, y ahora
está dicho.

**Lo demás que se corrigió:**

- **«El sistema carga la UMA desde Google Sheets; si falla usa 92.482.»** Dejó
  de ser cierto el 5/8, cuando la UMA se sacó del navegador del visitante. La
  planilla la lee el build y el valor vive versionado en `data/uma.json`.
- **«El usuario selecciona entre 10 opciones» de tipo de proceso.** Son ocho.
- **Un párrafo pegado en la sección equivocada.** El «fundamento» de la medida
  cautelar decía que era el art. 21 «que acota a los auxiliares una banda del
  5 % al 10 %», y aclaraba entre paréntesis que antes se lo atribuía al art. 37.
  Es decir: una corrección del pase del 5/8 aterrizó en el bloque de al lado y
  terminó **negando el artículo correcto**. La cautelar es el art. 37.
- **Mínimos del art. 19 inc. a mal citados**: decía «hasta 25 UMA (divorcio,
  adopción, hábeas corpus)». El divorcio son 10 y la adopción 20.
- **El objeto del juicio, sin las claves del código** y sin decir que nueve de
  las doce opciones no mueven ningún número.
- **No decía en qué procesos hay segunda instancia.** Son cuatro de ocho: los
  que pasan por `buildGeneral()`. La cautelar y la homologación no la devuelven.
- **Faltaban el reparto por etapas y el reparto entre profesionales**, que son
  dos de las tres cosas que muestra la pantalla del resultado. El segundo **no
  sale de ningún artículo**: es una calculadora auxiliar con proporción
  ajustable que arranca en 60/40, y ahora está dicho que es eso.
- **Todo el documento estaba sin tildes**, contra la convención del repositorio.

**Se agregó una sección que no existía: «Lo que la ley dice y el motor no
hace».** Salió de leer la ley al lado del motor, y son seis: el art. 39 segundo
párrafo (aumento o cesación de alimentos va por la escala de los incidentes, no
por la del art. 21), el art. 41 última oración (actuaciones posteriores a la
ejecución, al 40 %), el art. 42 (gestor, +4 %), la excepción del art. 21 para
auxiliares por labores complejas, la división en etapas del art. 29 —que se
muestra pero no se pregunta— y el litisconsorcio del art. 21.

**Reparto entre el 01 y el 02, para que no se dupliquen.** El 01 va proceso por
proceso: qué pregunta cada uno y qué hace con la respuesta. El 02 va por lo que
los ocho tienen en común: el recorrido y el orden del cálculo. Cada uno remite
al otro en vez de repetirlo.

### `01_PROCESOS.md`, reescrito contra el motor — 6/8

Estaba **generado a partir de una descripción del sistema, no del sistema**, y
por eso sonaba plausible y era falso en varios puntos. Lo que se encontró:

- **«No se utiliza el valor de la UMA para cálculo de escala».** Al revés: la
  escala del art. 21 está escrita en tramos de UMA, así que lo primero que hace
  el motor es dividir la base por la UMA para ubicar el tramo. Es el dato más
  central del cálculo.
- **Un «total general: suma de todos los honorarios» que no existe.** El motor
  nunca devolvió esa suma y la app no la muestra, porque los roles son
  alternativos entre sí: sumarlos no significa nada.
- **La segunda instancia, descrita como «opcional» y «calculada aparte».** Se
  calcula siempre, en la misma pasada, como porcentaje del honorario ya
  reducido (art. 30). Es un bloque aparte en pantalla, no en el cálculo.
- **Una reducción por «juicio abreviado» que no está en la ley.**
- **Auxiliares «5-10 % según categoría».** El art. 21 no distingue categorías
  ahí, y el motor tampoco: es un rango único.
- **El orden de los pasos del wizard, inventado.** Decía objeto → base →
  terminación; el orden real es terminación → objeto → base, y la UMA es
  siempre el paso 0. Está en `PROCESS_STEP_MAP`, una sola constante.
- **Cinco «tipos de proceso» que no lo son.** Los mínimos (arts. 19, 31, 44, 48,
  58, 60 y 61 bis) son una pantalla de consulta sin entrevista y sin cálculo.
  Además son siete categorías, no cinco.
- **Art. 21 descrito como «escala para juicios de conocimiento».** Es la escala
  general de todo proceso susceptible de apreciación pecuniaria.
- **Apoderado y procurador atribuidos al art. 21.** Son del art. 20. Y el
  procurador es el 40 % *del honorario del patrocinante*, no de la base.
- **Los incisos del exhorto, con etiquetas que no son las del art. 50**
  («asistencia a audiencia», «trámites simples/complejos»). Son notificaciones,
  actos registrales y diligencias de prueba. Además la entrevista no pregunta el
  inciso: muestra los tres.
- **«De qué otros módulos depende»**, con nombres de módulo inventados
  (`escala_art21`, `patrocinante`, `valor_uma`) que no existen en el código y
  que por lo tanto nadie podía verificar. Reemplazado por funciones y archivos
  reales.

**Criterio de la reescritura:** el lector es un abogado que lee código o que lo
maneja con asistencia de IA, así que **todo se nombra dos veces** —la categoría
jurídica y la clave del código—. `sumas_dinero` no es una categoría de la ley;
la categoría es «juicio por cobro de sumas de dinero» y el artículo es el 22.
Y cada afirmación quedó anclada a un lugar comprobable: `PROCESS_STEP_MAP` para
qué se pregunta, `resolveReglas()` para qué hace con la respuesta.

**Método, que conviene repetir:** el documento no se corrigió leyéndolo. Se
leyeron `wizard-schema.ts` y `calculate.ts` enteros y se corrió
`retroceso.validation.ts`, que imprime los recorridos por proceso. De ahí salen
los 160 recorridos y su desglose, que ahora están en el documento porque son
verificables corriendo una línea.

### La landing decía mal lo que hace — 6/8

«Barre los **25.600 recorridos posibles** de la entrevista» era una cifra
correcta describiendo otra cosa. La entrevista tiene **160 recorridos**; 25.600
es 160², los **cruces**: cada recorrido contra cada otro. Eso es lo que barre
`retroceso.validation.ts`, y es el bug del 3/8 — volver atrás y cambiar el tipo
de proceso dejaba pegada una respuesta que el recorrido nuevo ya no pregunta.

Era peor que un error de redondeo: una cifra más impresionante que la real,
describiendo algo distinto, en la sección que sostiene la credibilidad del
sitio. Ante alguien del palo, no cerraba.

Se corrigió también en `README.md`, que repetía la misma frase.

**Y «casos conocidos» daba a entender una autoridad externa que no hay.** Cada
caso es una entrada con su resultado esperado, escrito a mano en el archivo de
validación: no hay jurisprudencia ni tabla oficial detrás. **Lo que garantizan
las 11 validaciones es consistencia, no corrección** —que el número de hoy sea
el de ayer salvo que alguien haya decidido cambiarlo y lo haya escrito—. Un
usuario puede decir «esto está mal» y tener razón, y la app no lo contradice.
Ahora la landing lo dice.

De paso se sacó el registro de la columna: «suites, una por concern», «no conoce
React ni el DOM», «función pura», «refactor». Si el que entra es abogado, esa
columna no le decía nada.

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
- **`lib/legal/minimos-data.ts` nunca se verificó contra la ley.** Las cifras de
  los mínimos que citan el `06` y el `07` están verificadas contra ese archivo,
  y el archivo dice ser copia fiel del asistente clásico. Que sea fiel a la copia
  no prueba que sea fiel a la norma. Son unas cuarenta cifras.
- **El hint de la base se perdió en la migración a Honorio, y es una
  regresión.** El asistente clásico mostraba, arriba del campo de la base, un
  cuadro que decía qué monto ingresar según lo contestado antes: quince
  leyendas distintas en `asistente-honorarios-clasico/js/wizard.js`,
  `renderBase()`. Parte se recuperó en las explicaciones de las tarjetas, parte
  no. **Es lo de mayor valor y menor costo de todo lo pendiente**: el texto ya
  está escrito, no mueve ningún número, y es lo que decide si la base que se
  ingresa es la correcta —que es el error más caro de esta herramienta, porque
  la escala está validada 300 veces y la base la pone una persona—.
- **El plan completo de qué falta de la ley, qué hacer y qué solo declarar está
  en [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md)**, con el orden
  recomendado. **Ocho puntos:** dos para hacer ya sin tocar números, tres que sí
  mueven números —uno de ellos hacia arriba: los pisos mínimos que el motor no
  verifica—, dos para declarar y no implementar, y uno anotado sin fecha.

### Dos cosas para llevar al repositorio de Honorio

Encontradas el 6/8 al verificar el `01`. **No se tocaron: son de allá.**

- **Las descripciones de la pregunta de medida cautelar están cruzadas.** En
  `wizard-schema.ts`, `CAUTELAR_OPOSICION` le pone «25 % de la escala» a la
  opción *con* oposición y «50 %» a la opción *sin*. El art. 37 dice lo
  contrario —base 25 %, se eleva al 50 % con controversia— y **el motor calcula
  bien**: `aplicarFactorCautelar()` hace `medidaOposicion ? 0.5 : 0.25`. O sea
  que el número que sale es el correcto y el cartel que lo explica dice al revés.
  No lo agarra ninguna validación porque no mueve ningún número.
- **La transformación de la cautelar se atribuye al art. 29 inc. e.** Ese inciso
  es el de los procesos penales. El artículo es el 37, que es el que la propia
  pregunta cita en pantalla.

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
