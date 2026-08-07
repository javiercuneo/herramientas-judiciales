# Plan: los honorarios del mediador dentro de Honorio

Cómo llevar lo que hoy calcula `calculadoras/honorarios-mediacion.html` al
resultado de Honorio, y qué hay que resolver antes de escribir una línea.

Escrito el 7/8/2026. **Nada de esto está implementado.** Es una sesión de
análisis previa, para que la de implementación no empiece desde cero.

**La implementación es en [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio).**
Acá va la decisión; allá el código y su `ESTADO.md`. Este plan vive de este lado
por lo mismo que el [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md): la materia
prima —la calculadora y los textos legales— está acá.

---

## Lo que hay hoy, leído

`calculadoras/honorarios-mediacion.html`, 222 líneas, todo adentro. Pide dos
datos —el valor del UHOM y el monto del asunto— y aplica una escala de tramos:

| Monto del asunto | Honorario |
|---|---|
| ≤ 30 × UHOM | 3 UHOM |
| ≤ 60 × UHOM | 6 UHOM |
| ≤ 150 × UHOM | 9 UHOM |
| ≤ 300 × UHOM | 12 UHOM |
| ≤ 600 × UHOM | 16 UHOM |
| ≤ 1000 × UHOM | 20 UHOM |
| > 1000 × UHOM | 2 % del monto |

Más un tope: si el resultado supera **120 UHOM**, se corta ahí.

Eso es todo lo que hace. Está en `calcular()`, líneas 183 a 196, y no tiene
ninguna otra rama.

### Tres problemas que hay que resolver sí o sí, y son anteriores al diseño

**1. La calculadora no cita ninguna norma. Ni una.** No hay un artículo, una
ley, un decreto ni una resolución en las 222 líneas. La escala de arriba puede
ser exactamente la de la norma vigente, pero **hoy nadie puede comprobarlo sin
salir de la app**, y esta es la clase de afirmación que la regla de fuentes de
[`AGENTS.md`](../AGENTS.md) prohíbe. Un número de honorarios sin su norma al lado
es precisamente lo que el proyecto entero se pasó el 6 y el 7 de agosto sacando
de los documentos de dominio.

**Consecuencia para el plan: la escala de arriba está sin verificar.** No la doy
por buena. Es un dato de entrada a revisar contra el texto, no una fuente.

**2. Lee la planilla desde el navegador del visitante.** Línea 141:
`fetch(URL_SHEET + '&cache=' + ...)`, en `DOMContentLoaded`. Eso es exactamente
lo que se le sacó a la UMA el 5/8, y los cuatro motivos están escritos en
`honorio/lib/legal/uma.ts`: la IP del visitante viaja a Google contra lo que la
app declara; si el pedido falla el número queda viejo en silencio; el valor
llega sin norma y sin fecha, así que el informe no puede citarlo; y el mismo
caso calculado con dos meses de diferencia da distinto sin registro de por qué.

Los cuatro valen igual para el UHOM.

**Y no es solo esta calculadora: son cuatro consumidores.** Al buscar la URL de
la planilla en el repositorio aparece en `asistente-honorarios-clasico/js/core.js:19`,
`calculadoras/honorarios.html:229`, `calculadoras/prorrateo.html:491` y esta.
Los cuatro la piden desde el navegador. **El único que la lee bien es el build
de Honorio.**

**3. La lee por posición, y la planilla no se lee por posición.** Este es el más
urgente porque **es un bug latente, no una deuda de diseño**, y porque no está
en un solo archivo.

`honorio/scripts/actualizar-uma.mjs` documenta la planilla —es la misma URL,
carácter por carácter— y dice que es una tabla de clave y valor:

```
UMA,102.076
UHOM,12.960
Acordada,Expresado en UMAs: (valor = $ 102.076 segun Res. SGA n° 1785/26)
URL,https://www.csjn.gov.ar/documentos/descargar?ID=160573
```

Ese script la lee **como diccionario**, y el comentario dice por qué: «agregar
una fila o cambiarlas de orden no puede romper el numero». También dice, textual,
que «la fila UHOM la usa otra calculadora y aca se ignora».

Los otros cuatro hacen lo contrario, y con distinta gravedad:

| Archivo | Qué toma | Qué pasa si se inserta una fila arriba |
|---|---|---|
| `core.js:19` | `filas[0]`, col 1 → UMA | Queda con el valor escrito a mano y avisa por `console.warn` |
| `honorarios.html:234` | `filas[0]`, col 1 → UMA. La variable se llama `valorB1` | El campo queda vacío o con texto |
| `prorrateo.html:496` | `lines[0]`, col 1 → UMA | Ídem. El comentario tiene fijada la suposición: «La primera línea contiene "UMA,89.875"», con un valor que ya ni siquiera es el vigente |
| `honorarios-mediacion.html:147` | **`filas[1]`, col 1 → UHOM** | **Toma la UMA como si fuera el UHOM** |

**La última fila es la peligrosa.** Los tres primeros leen la fila 0: si algo se
corre, se rompen de forma más o menos visible —campo vacío, valor viejo—. El de
mediación lee la fila 1, así que una fila insertada arriba le hace tomar
$102.076 donde va $12.960 y mostrar un honorario **ocho veces más alto sin
ningún error visible**. No hay validación que lo agarre porque esa calculadora
no tiene ninguna.

Además parte el CSV con `split(',')` a secas, y la fila `Acordada` de esa misma
planilla tiene comas adentro. Hoy ninguno la toca; el día que la toquen, leen
mal.

> **Esto conviene arreglarlo aunque el resto del plan no se haga nunca**, y en
> los cuatro, no solo en el de mediación: leer el CSV como diccionario y buscar
> la clave. Anotado también en [`docs/ESTADO.md`](ESTADO.md).

### Lo que sí está bien, para no arreglar lo que no está roto

**Honorio no pide la planilla.** Su copia del motor legacy
—`honorio/public/legacy/core.js`— trae la función `cargarUMA()` y hasta la
expone como `window.cargarUMA`, pero **nadie la llama**: el único punto de
llamada es `asistente-honorarios-clasico/index.html:41`, que es la app clásica.
`LegacyLoader.tsx` hace `adapters.setUMA(UMA_VIGENTE.valor)`, o sea el archivo
versionado. Comprobado. **La afirmación de privacidad de `uma.ts` se sostiene.**

Lo que queda es código muerto con un `fetch` adentro, colgado de `window`. No es
un bug, pero es una función que si alguien alguna vez llama reabre en silencio
un agujero que está documentado como cerrado. Conviene sacarla de la copia de
Honorio cuando se toque ese archivo por otra razón.

---

## Lo que no sé, y hay que cargar antes de seguir

**No leí la ley de mediación ni su decreto reglamentario.** No están en el
repositorio y no los voy a citar de memoria: es el error exacto que produjo los
ocho documentos de dominio que hubo que reescribir. La firma de ese error
—estructura plausible, datos corridos— es indistinguible de un trabajo bien
hecho hasta que alguien abre el texto.

Lo que hace falta, en `docs/mediacion/` (o donde se decida):

1. **La ley de mediación vigente**, texto completo en MD, igual que
   [`00_LEY_27423.md`](domain/00_LEY_27423.md).
2. **El decreto reglamentario**, texto completo en MD, sobre todo el anexo o los
   artículos de honorarios del mediador.
3. **La norma que crea y actualiza el UHOM**, con su valor vigente y la
   resolución que lo fijó. Es lo que va a citar el informe.

**Hipótesis mía, declarada como hipótesis y no como dato:** creo que el régimen
aplicable es el de la Ley 26.589 y su decreto reglamentario, y que la escala en
UHOM sale de un anexo de ese decreto o de una resolución del Ministerio de
Justicia posterior. **No lo verifiqué y puede estar mal.** Sirve para saber qué
buscar, no para escribirlo en ningún lado.

Cuando estén cargados, la pasada es la misma que se le hizo a los ocho
documentos: leer el texto al lado de la escala implementada y anotar
**diferencia por diferencia**, sin corregir sobre la marcha.

### Las preguntas que ese texto tiene que contestar

Las anoto ahora porque son las que la calculadora actual no puede ni plantear, y
porque son las «reglas especiales» que mencionaste. Cada una es una rama de
entrevista o una declaración de «esto no lo hace»:

- **¿La escala depende de si hubo acuerdo?** Un mediación que cierra con
  acuerdo y una que fracasa muy probablemente no pagan igual. Hoy la calculadora
  no lo pregunta.
- **¿Y del número de audiencias?** Misma pregunta.
- **¿Y de la cantidad de partes o de reclamos acumulados?**
- **Asuntos de monto indeterminado.** La calculadora exige un monto y sin él no
  calcula. Si la norma prevé un honorario para monto indeterminado, hoy es un
  agujero, no una limitación declarada.
- **Materias con régimen propio** —familia, consumo, daños— si las hay.
- **¿Qué es el tope de 120 UHOM?** ¿Es tope del honorario, tope por parte, tope
  por audiencia? El código lo aplica al honorario total y no dice de dónde sale.
- **¿Quién paga y en qué proporción?** No es el cálculo, pero es lo primero que
  pregunta el que lee el resultado, y si la norma lo dice conviene decirlo.
- **¿Hay actualización o intereses del honorario impago?**
- **La relación con los honorarios de la Ley 27.423.** Esta es la que más me
  importa para el diseño: **¿el honorario del mediador es un ítem del mismo
  expediente que el del abogado, o son dos regulaciones independientes que
  simplemente conviven?** De la respuesta sale la decisión de arquitectura de
  abajo.

---

## La decisión de arquitectura, que es la única realmente abierta

Dijiste «incorporar el resultado de ese HTML a Honorio y mostrarlo en el
resultado final». Eso admite dos lecturas y llevan a productos distintos.

### Opción A — Un noveno tipo de proceso

`mediacion` entra como una novena opción de `ProcesoTipo` en
`honorio/lib/legal/types.ts`, con su propio recorrido de entrevista y su propio
resultado.

- **A favor:** encaja sin fricción en todo lo que ya existe. `PROCESS_STEP_MAP`,
  `resolveReglas()`, el dashboard y las validaciones ya saben tratar un proceso
  nuevo. Es el camino de menos invención.
- **En contra:** los ocho procesos actuales comparten la escala del art. 21 y la
  UMA. Mediación no comparte ninguna de las dos: otra ley, otra unidad, otra
  escala. Meterlo como «uno más» sugiere un parentesco que no existe, y hace que
  `CalculoResultado` cargue campos que solo tienen sentido para uno de los nueve.

### Opción B — Un bloque adicional del resultado

El cálculo del mediador se muestra **junto** al de honorarios, como ya se
muestran la segunda instancia, el partidor o los auxiliares: una sección más del
dashboard, alimentada por su propio módulo.

- **A favor:** es lo que el documento de prueba tiene. En un juicio que pasó por
  mediación previa hay honorarios del abogado *y* del mediador, y quien regula
  los mira juntos. Y no contamina el modelo de los ocho procesos.
- **En contra:** hay que decidir cuándo aparece —¿una pregunta «¿hubo mediación
  previa?» en la entrevista?— y qué pasa cuando alguien quiere el honorario del
  mediador **solo**, sin ningún juicio detrás, que es el caso que la calculadora
  actual sirve hoy.

### Lo que recomiendo

**B, con una puerta de entrada propia.** Es decir: el módulo de cálculo es uno
solo y puro; se lo consume desde dos lugares —una sección del resultado cuando
la entrevista dice que hubo mediación, y una pantalla de consulta directa como
la de mínimos, que ya existe y es exactamente este patrón—.

El motivo es el del punto anterior: **mediación no comparte la unidad**. La
Opción A obliga a que `CalculoResultado.valorUMA` conviva con un valor en UHOM,
y ahí es donde se cuelan los errores caros. Mantenerlos separados hace que la
confusión sea un error de tipos y no un número mal calculado.

**Esta decisión hay que tomarla antes de escribir código**, y probablemente
después de leer la ley: si resulta que el honorario del mediador se regula en la
misma resolución que el del abogado, B se vuelve todavía más claro; si son
trámites completamente separados, A gana simplicidad.

---

## El orden de trabajo propuesto

### Paso 0 — Arreglar la lectura de la planilla en los cuatro

Independiente de todo lo demás, y explicado arriba. Leer el CSV como diccionario
y buscar la clave —`UHOM` o `UMA` según el archivo— en vez de la posición. Se
hace en este repositorio, en `honorarios-mediacion.html`, `honorarios.html`,
`prorrateo.html` y `asistente-honorarios-clasico/js/core.js`.

**Empezar por el de mediación**, que es el único cuyo modo de fallar es un número
plausible y equivocado en vez de un campo vacío.

### Paso 1 — Cargar y barrer las normas

Los tres MD de arriba. Después, la pasada de verificación de la escala
implementada contra el texto, anotando cada diferencia sin corregirla todavía.
**Salida esperada:** un documento de dominio de mediación, del mismo tipo que
los ocho que ya hay, con la escala real y sus condiciones.

### Paso 2 — El UHOM versionado

Espejo exacto de lo que ya funciona para la UMA. **No inventar nada acá: copiar
la forma.**

- `honorio/data/uhom.json`, con la misma estructura que `uma.json`: una lista
  histórica de `{ valor, fuente, url, capturado }`, que se agrega al final y no
  se reescribe nunca.
- `honorio/lib/legal/uhom.ts`, espejo de `uma.ts`, con `UHOM_VIGENTE` y la
  historia.
- **La bajada: extender `scripts/actualizar-uma.mjs`, no escribir uno nuevo.**
  Ya lee la misma planilla, ya la parsea como diccionario, ya tiene el parser de
  CSV con comillas, ya detecta el HTML de «planilla despublicada», ya tiene el
  control de salto máximo y ya está escrito para abortar antes que inventar.
  Duplicar todo eso para el UHOM es garantizar que dentro de seis meses uno de
  los dos tenga un arreglo que el otro no.

  Lo que sí hay que revisar al extenderlo: `SALTO_MAXIMO` está calibrado en
  60 % pensando en cómo se mueve la UMA. Si el UHOM se actualiza con otra
  frecuencia o en otros saltos, el umbral tiene que ser propio.

- **Un tipo distinto, a propósito.** `ValorUMA` y `ValorUHOM` tienen la misma
  forma pero no son intercambiables. Si son el mismo tipo, el día que alguien
  pase uno donde va el otro el compilador no dice nada y el número sale mal por
  un factor de ocho. Que sean tipos separados —aunque sea con una marca nominal—
  convierte ese error en un rojo de `npm run check`.

### Paso 3 — El módulo de cálculo

`honorio/lib/legal/mediacion.ts`. Función pura, sin React y sin DOM, que es como
está escrito todo `lib/legal/`. Entra un caso, sale un resultado estructurado
con sus transformaciones, igual que `CalculoResultado`.

**Con su suite de validación desde el primer commit**, en
`lib/legal/__tests__/`. Sería la número 15. Lo mínimo: cada tramo de la escala,
los dos bordes de cada tramo, el tramo del porcentaje, el tope, y un caso por
cada regla especial que aparezca en el paso 1.

Ojo con lo que ya sabemos que estas validaciones **no** cubren, porque está
escrito en [`05_DEPENDENCIAS.md`](domain/05_DEPENDENCIAS.md): comparan números.
Un rótulo que promete un porcentaje puede mentir con las quince en verde. Ya
pasó dos veces. Los textos de las tarjetas de mediación hay que leerlos contra
el módulo y contra la norma, porque nada más lo hace.

### Paso 4 — La presentación

Una sección del dashboard, siguiendo el patrón de `AuxiliaresSection.tsx` o
`PartidorSection.tsx`, que son las dos más chicas y hacen justo esto. Con la
norma citada al lado del número —que es lo que la calculadora actual no tiene— y
con la cadena de cálculo visible, como el resto de la app.

Y el bloque de «qué no hace» correspondiente en `documentacion.html`, con el
motivo de cada ausencia. La convención está fijada: «no lo hace» sin el porqué
se lee como una carencia, y son decisiones.

### Paso 5 — Qué pasa con la calculadora vieja

Una vez que Honorio lo haga completo, `honorarios-mediacion.html` queda
duplicando lógica con menos reglas y sin citar normas. La decisión es la misma
que se tomó con `calculadoras/honorarios.html` el 4/8 y conviene resolverla
igual: **sacarla de la landing y del README, dejar el archivo publicado** para
que los enlaces viejos no se rompan, y que apunte a Honorio.

**No borrarla.** Está en el sitio publicado y puede estar enlazada desde
cualquier lado.

---

## Lo que este plan no resuelve

- **Si el honorario del mediador tiene mínimos legales**, y si Honorio debería
  compararlos contra el resultado. Es la misma discusión del punto 8 del
  [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md), que se resolvió por no
  aplicarlos automáticamente para no decidir por el juez. Si acá aparece un piso,
  el criterio ya está fijado y conviene seguirlo.
- **La ampliación a otras jurisdicciones.** Todo esto es el régimen nacional. Si
  alguna provincia tiene el suyo, es otro trabajo y conviene decir que no está.
