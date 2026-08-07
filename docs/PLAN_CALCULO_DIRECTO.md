# Plan: el cálculo directo, sin entrevista

Un modo para el que ya sabe lo que quiere: pone la base regulatoria y le sale el
cálculo, como una hoja de cálculo. Sin pasos, sin preguntas, sin reducciones.

Escrito el 7/8/2026. **Nada de esto está implementado.** Es una sesión de
análisis previa.

**La implementación es en [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio).**
Acá va la decisión; allá el código y su `ESTADO.md`.

> **Sobre el nombre.** «Power user» describe al usuario, no a la herramienta, y
> además es la clase de rótulo que en una app jurídica suena a otra cosa. En
> este documento lo llamo **cálculo directo**, que es lo que hace. El nombre
> definitivo se decide al implementar.

---

## Qué es, en una frase

Entra un número —la base regulatoria— y sale la escala del art. 21 **desnuda**,
con los tres roles, los auxiliares y la segunda instancia. Nada más.

Lo que **no** hace, y es la definición del modo:

- No reduce la base (arts. 22, 40).
- No reduce la escala (arts. 25, 35, 37, 41).
- No reduce el honorario (el -10 % del art. 41).
- No pregunta tipo de proceso, objeto, ni modo de terminación.

Si hace falta algo de eso, el camino es la entrevista. Este modo es el punto de
partida de cualquier regulación, que es exactamente lo que alguien con oficio
calcula de memoria y quiere verificar rápido.

**No es un reemplazo de la entrevista ni una versión reducida:** es otra
pregunta. La entrevista contesta «cuánto corresponde en este caso»; esto
contesta «cuánto da la escala para este monto».

---

## Ya estaba anotado, y ya existió

[`ESTADO.md`](ESTADO.md) lo tiene desde el 4/8, en la decisión de sacar
`calculadoras/honorarios.html` de la vista:

> Idea anotada, no comprometida: un modo «power user» de Honorio, cálculo
> directo sin entrevista, para quien ya sabe lo que quiere.

Y `calculadoras/honorarios.html` **era casi esto**: pedía base, UMA y un «grupo
de proceso», y devolvía tablas. Sigue publicada en su URL.

**Conviene mirarla, y conviene no portarla.** Tiene tres problemas verificados, y
los tres son argumentos para construir sobre el motor de Honorio en vez de sobre
su aritmética.

### El problema grave: aplica el art. 22 sobre la escala

Su `grupo4` está rotulado «demanda rechazada o (en su caso) caducidad (art. 22)»
y hace, sobre el resultado de la escala:

```js
else if (grupo === 'grupo4') { calcMinComp *= 0.7; calcMaxComp *= 0.7; }
```

**Eso es el error del `05_DEPENDENCIAS.md`, vivo y publicado.** El art. 22 reduce
la **base**, antes de la escala: en el motor está en `aplicarReduccionesBase()`
—`baseFinal *= 0.7`, `lib/legal/calculate.ts:270`—, no entre las reducciones de
escala.

Corrido con el mismo ejemplo que quedó escrito en `ESTADO.md` —base $50.000.000,
UMA $102.076, art. 22—, la diferencia es la ya conocida:

```
MOTOR             base × 0,7 y después la escala  →  5ª escala: 61,93 UMA
honorarios.html   la escala y después × 0,7       →  6ª escala: 66,62 UMA
                                                      7,6 % de más
```

Ni siquiera cae en el mismo tramo. **Los grupos 2, 3, 5 y 6 están bien** —art.
25, 37 y 41 sí son reducciones de escala, y el orden entre el 50 % y el -10 %
del grupo 6 no cambia el número—. El equivocado es el 4.

> Esto es independiente de este plan y conviene anotarlo como bug: la
> calculadora está publicada y cualquiera puede estar usándola. Anotado en
> [`ESTADO.md`](ESTADO.md).

### El segundo: redondea cerca de los bordes de tramo

`getCalculationData()` hace esto:

```js
if ((baseEnUMA > 15 && baseEnUMA < 16) || (baseEnUMA > 45 && baseEnUMA < 46) || ...) {
    baseEnUMA = Math.round(baseEnUMA);
}
```

Una base de 15,4 UMA se convierte en 15. **El motor no redondea nada**:
`calcularEscala()` no tiene un solo `Math.round`, comprobado. O sea que las dos
herramientas darían distinto para las bases que caen en esos seis intervalos, y
la que está mal es la vieja: el art. 21 no manda redondear.

Probablemente sea un parche para que los rótulos «16 a 45 UMA» cerraran con el
corte real en 15. La escala del motor usa los mismos seis pisos —4,95, 11,7,
21,6, 33, 90, 127,5— sin el parche.

### El tercero

Lee la planilla de la UMA desde el navegador y por posición, como los otros tres
consumidores. Está en [`PLAN_MEDIACION.md`](PLAN_MEDIACION.md).

---

## Lo que hace que este plan sea chico: el motor ya está factorizado

Esta es la parte buena, y es consecuencia de cómo está escrito `lib/legal/`.
**Las cinco piezas que hacen falta ya existen, ya son puras y ya están
exportadas:**

| Función | Dónde | Qué devuelve |
|---|---|---|
| `calcularEscala(basePesos, valorUMA)` | `calculate.ts:50` | La escala del art. 21 con su título, tramo, porcentajes y la info de la escalera |
| `calcularApoderado(minUMA, maxUMA, valorUMA)` | `calculate.ts:497` | × 1,4 sobre el patrocinante (art. 20) |
| `calcularProcurador(minUMA, maxUMA, valorUMA)` | `calculate.ts:511` | × 0,4 sobre el patrocinante (art. 20) |
| `calcularAuxiliares(baseEnUMA, valorUMA)` | `calculate.ts:529` | 5 % a 10 % de la base (art. 21) |
| `calcularSegundaInstancia(...)` | `calculate.ts:551` | 30 %, 35 % y 40 % por rol (art. 30) |

Ninguna conoce `WizardState`, ni React, ni el DOM. **El modo directo es
componerlas y nada más.** No hay que escribir aritmética nueva, y eso es
importante porque significa que **no puede divergir del resultado de la
entrevista**: es el mismo código.

---

## La regla de diseño que gobierna todo

**«Sin reducciones» no es un caso: es la ausencia de caso.**

Es tentador implementar esto armando un `WizardState` con respuestas por defecto
—tipo `conocimiento`, terminación `sentencia`, `sentenciaResultado: 'admitida'`,
`aperturaPrueba: true`— y llamando a `buildGeneral()`. **No hay que hacerlo.**

El motivo: **cada respuesta por defecto es una afirmación jurídica**. Decir
«sentencia admitida» no es un valor neutro, es sostener que la demanda prosperó;
«hubo apertura a prueba» es sostener que el proceso llegó hasta ahí. El
resultado saldría idéntico, pero el modo estaría afirmando cosas del caso que
nadie dijo, y el día que alguien agregue una regla nueva al motor que dependa de
una de esas respuestas, el cálculo directo empezaría a aplicarla en silencio.

La forma correcta es componer las funciones puras directamente, con
`baseFinal === baseOriginal` y `transformaciones: []`. **La lista de
transformaciones vacía es la afirmación honesta**: no se aplicó ninguna regla, y
la cadena de cálculo que muestra la app lo dice sola.

Esto además da un control gratis: si el modo directo alguna vez devuelve una
transformación, hay un error.

---

## La pregunta que hay que contestar antes de dibujar nada

Dijiste «las tres etapas, o sea, patrocinante, procurador y apoderado». **En el
motor esos son dos ejes distintos**, y conviene despejarlo porque cambia la
tabla:

- **Los tres roles** son patrocinante, apoderado y procurador (arts. 20 y 21).
- **Las tres etapas** son el reparto del art. 29: completo, 2/3 y 1/3. Están en
  `RolResult { full, uno, dos }` y el dashboard las rotula «Completo», «2/3» y
  «1/3» (`HonorariosBand.tsx:34`).

O sea que hay **tres roles × tres etapas = nueve celdas**, más auxiliares y
segunda instancia.

**Lo que recomiendo: mostrar la matriz completa.** Nueve celdas es exactamente lo
que entra en una tabla y es lo que alguien que pide «una hoja de cálculo» quiere
ver de un vistazo. Además, ocultar las etapas obligaría a decidir cuál mostrar, y
esa decisión depende del caso, que es justo lo que este modo no pregunta.

Ojo con un detalle que el dashboard ya resuelve y acá no aplica:
`HonorariosBand.tsx:150` **deja de ofrecer el 2/3 cuando el proceso terminó antes
de la prueba**. En el modo directo no hay proceso ni terminación, así que van las
tres siempre.

---

## Lo que la interfaz tiene que decir, y no es opcional

Este modo devuelve un número que **no es el honorario de ningún caso real**. Es
la escala antes de todo. Quien sabe lo que está haciendo lo entiende solo; el
riesgo es el que entra por curiosidad, ve una cifra grande y se la lleva.

Dos cosas, entonces:

1. **Que diga qué es**: el resultado de la escala del art. 21 sobre la base
   ingresada, sin ninguna reducción. Con la lista de las reducciones que **no**
   aplicó y el artículo de cada una, que es información útil y a la vez la
   advertencia.
2. **Una salida hacia la entrevista.** «¿Tu caso tiene alguna de estas? Andá por
   la entrevista.» El modo directo no debería ser un callejón.

Va también al bloque «qué no hace» de `documentacion.html`, con el motivo, como
el resto.

---

## El orden de trabajo propuesto

1. **Decidir la matriz** —roles × etapas— y si el UMA se puede pisar a mano como
   en la entrevista. (Debería: es el paso 0 de todo el resto.)
2. **El módulo**, en `lib/legal/`. Una función que toma base y UMA y devuelve un
   `CalculoResultado` con `transformaciones: []`. Pura, componiendo las cinco de
   arriba.
3. **La validación**, en el mismo commit. Dos cosas:
   - Los siete tramos de la escala y sus bordes.
   - **El control cruzado, que es el que importa**: para una base cualquiera, el
     modo directo tiene que dar **exactamente lo mismo** que la entrevista
     recorrida por un caso sin ninguna reducción. Si los dos caminos alguna vez
     difieren, uno de los dos está mal, y este control lo dice sin que nadie
     tenga que acordarse de comparar.
4. **La interfaz**: una pantalla con dos campos y una tabla. El patrón más
   parecido que ya existe es la pantalla de mínimos —consulta directa, sin
   entrevista, sin cálculo de caso—, y conviene mirarla antes de inventar otra
   forma.
5. **Qué pasa con `calculadoras/honorarios.html`.** Igual que en el plan de
   mediación: cuando esto exista, la vieja queda duplicando con menos y con el
   bug del grupo 4. **Arreglar el grupo 4 no espera a este plan**; lo demás sí.

---

## Lo que este plan no resuelve

- **El honorario del mediador.** Lo mencionaste como parte de la salida y estoy
  de acuerdo en que encaja —es un número que sale de un monto, sin entrevista—,
  pero depende entero de [`PLAN_MEDIACION.md`](PLAN_MEDIACION.md): hoy la escala
  de mediación no cita ninguna norma y no se puede dar por buena. Cuando ese plan
  avance, agregarlo acá es una fila más en la tabla.
- **El partidor y las actuaciones posteriores.** Los dos existen como funciones
  puras (`calculate.ts:635` y `:605`) y los dos son «otra regulación sobre la
  misma base», igual que la segunda instancia. Entrarían sin fricción, pero no
  los pediste y agregarlos por las dudas es lo contrario del modo. Anotado por si
  aparece la necesidad.
- **Si esto es una pantalla de Honorio o una herramienta aparte.** Lo doy por
  hecho adentro de Honorio, porque el argumento entero de este plan es reusar sus
  funciones puras. Una calculadora suelta volvería a tener aritmética propia, que
  es de donde salieron los tres problemas de la vieja.
