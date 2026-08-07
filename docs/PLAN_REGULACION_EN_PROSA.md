# Plan: que Honorio escriba la regulación en prosa

Que además del número, la app devuelva el texto de la regulación —redactado,
para copiar y pegar en un `.docx` o en el editor del PJN— y que quien lo pegue
solo tenga que revisarlo.

Escrito el 7/8/2026. **Nada de esto está implementado.** Es una sesión de
análisis previa.

**La implementación es en [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio).**
Acá va la decisión; allá el código y su `ESTADO.md`.

---

## Lo primero: esto es lo más riesgoso que hizo el proyecto hasta ahora

No como advertencia de trámite. Está escrito en [`ESTADO.md`](ESTADO.md) como
diagnóstico ya pagado:

> El mismo proceso produce código que funciona y prosa confiadamente falsa,
> porque uno tiene realimentación y la otra no.

Los ocho documentos de dominio salieron mal **mientras el motor calculaba bien**
y las validaciones estaban en verde. La diferencia era que el código tiene
compilador, tipos y 830 afirmaciones que corren en cada push, y la prosa no
tenía nada.

Esta feature produce prosa. Prosa con forma de resolución judicial, que alguien
va a pegar en un expediente. **Si sale mal, sale mal con la autoridad de un
documento firmado**, y el error no lo va a agarrar ninguna validación de las que
hay, porque todas comparan números.

Así que la pregunta de diseño no es «cómo genero el texto». Es **«qué le pongo
de realimentación a la prosa para que no pueda mentir en silencio»**. Todo lo
demás de este plan sale de ahí.

---

## Lo que ya está hecho y sirve

Tres cosas, y son más de las que parece:

**1. El resultado ya es estructurado.** `CalculoResultado` en
`honorio/lib/legal/types.ts` no es HTML: son campos tipados —`baseOriginal`,
`baseFinal`, `escala`, `honorarios`, `segundaInstancia`, `auxiliares`,
`partidor`, `transformaciones`—. Un generador de prosa se alimenta de eso
directamente. **Este es el trabajo pesado y ya está hecho**; sin él, esta feature
sería reparsear HTML.

**2. `transformaciones` ya lleva el fundamento de cada paso.** Cada
`Transformacion` tiene `concepto`, `articulo`, `etapa`, `valorPrevio`, `factor` y
`valorPosterior`. Eso es, literalmente, la parte de «considerandos» de una
resolución: qué se aplicó, por qué artículo, sobre qué monto y con qué
resultado. El texto no hay que inventarlo, hay que redactarlo desde ahí.

**3. `Firma.tsx` ya contesta las cuatro preguntas de procedencia**: quién lo
hizo, con qué versión del motor, con qué UMA y cuándo. Su comentario dice para
qué existe: «que el numero, cuando sale de la pantalla y entra en un expediente,
se pueda defender». Esta feature es el paso siguiente de ese mismo razonamiento,
y el pie del texto generado sale de ahí sin escribir nada nuevo.

Y una cuarta que conviene mirar antes de empezar: **`imprimir.tsx` ya resolvió el
problema de «dos documentos con el mismo número adentro»** —el cálculo desnudo
para adjuntar y el cálculo fundado para sostener—. La prosa es una tercera forma
de la misma salida, no un producto aparte. Conviene que las tres compartan la
decisión de qué se incluye.

---

## El problema central, y no es técnico

**El motor devuelve rangos. Una resolución fija un número.**

Mirá `HonorariosRol`: es un `Rango` con `minUMA`, `maxUMA`, `minPesos`,
`maxPesos`. La app entrega «entre X e Y» a propósito, porque el art. 21 da una
banda y **elegir dentro de la banda es el acto jurisdiccional**. Toda la
arquitectura está construida sobre no decidir eso: el descargo de la landing
dice que no sustituye el criterio del juez, y es cierto porque el motor
literalmente no elige.

Un texto de regulación no puede decir «regúlense los honorarios en entre
$6.321.798 y $8.000.000». Tiene que decir un número.

**Entonces alguien tiene que elegirlo, y ese alguien no puede ser la app.**

### Las tres salidas posibles

- **Que el usuario elija el punto dentro del rango**, con un control explícito
  —un deslizador, o un campo por rol— y que el texto salga con ese número. La
  app propone la banda; la persona fija el punto.
- **Que el texto salga con el rango y un hueco visible**, tipo
  `regúlense en la suma de $[____] (dentro de la banda de $X a $Y)`, y que se
  complete a mano.
- **Que la app sugiera un punto por defecto** —el medio de la banda, digamos— y
  se pueda mover.

**Recomiendo la primera, y descarto la tercera.** Un valor por defecto en el
medio de la banda es una decisión jurisdiccional disfrazada de conveniencia: el
que apura va a aceptarlo sin pensarlo, y el proyecto habría empezado a regular.
La segunda es honesta pero deja el trabajo justo donde la herramienta podía
ayudar.

La primera tiene además una propiedad que las otras no: **el punto elegido queda
registrado**, y puede salir en el texto o en la firma. «Se fijó en el 60 % de la
banda» es información que sostiene la resolución.

> **Esta es la decisión que hay que tomar antes que ninguna otra**, porque
> cambia la interfaz, el tipo de salida y lo que el texto puede afirmar.

---

## Lo que necesito de tu lado

**Los diez modelos de resolución, en MD, en el repositorio.** Sin eso, lo que
salga va a ser una imitación de resolución escrita de memoria, que es
exactamente el error que costó los ocho documentos de dominio: estructura
plausible, todo lo concreto corrido.

Dijiste que son diez como máximo y que cubren los casos más simples y más
usados. Eso alcanza y sobra: **de diez modelos reales sale la estructura**, y la
estructura es lo que no se puede inventar.

Sugerencia sobre cómo cargarlos, para que rindan:

- Uno por archivo, en `docs/modelos/`, con el texto **tal cual**, sin limpiar.
  Las fórmulas de estilo, el orden de los párrafos y hasta las muletillas son el
  dato. Si los normalizás antes, me estás pasando tu resumen y no la fuente.
- Con los datos reales reemplazados por marcas visibles —`[CARÁTULA]`,
  `[EXPEDIENTE]`, `[NOMBRE]`— pero **dejando los montos y los porcentajes**, que
  son los que permiten comprobar contra qué cuenta se corresponde cada frase.
- Anotá arriba de cada uno, en una línea, de qué tipo de proceso es y cómo
  terminó. Con eso se cruzan contra los ocho procesos que Honorio ya conoce y se
  ve cuáles quedan sin modelo.

Cuando estén, la primera pasada es de lectura, no de código: **qué párrafos son
fijos, cuáles cambian con el caso, y cuáles dependen de un dato que Honorio no
tiene**. Esa tercera categoría es la importante y la trato abajo.

---

## Cómo armar el texto, sin que pueda mentir

### La regla que gobierna todo

**Cada afirmación del texto generado tiene que ser rastreable a un campo de
`CalculoResultado` o a una respuesta que el usuario dio.** Lo que no cumpla eso
no se escribe: se deja como hueco visible.

Es la regla de fuentes de [`AGENTS.md`](../AGENTS.md) aplicada a la salida en vez
de a la documentación, y da tres categorías de contenido, que conviene que sean
tres cosas distintas también en el código:

| Categoría | De dónde sale | Cómo se ve |
|---|---|---|
| **Derivado** | Un campo de `CalculoResultado` o una respuesta de la entrevista | Texto normal |
| **Fijo** | Fórmula de estilo que no depende del caso | Texto normal |
| **Ausente** | Dato que la app no tiene y no puede tener | **Hueco visible**, `[así]` |

La tercera es la que hace que esto sea usable o peligroso. Honorio **no sabe** la
carátula, el número de expediente, el juzgado, el nombre de los profesionales, la
fecha de la resolución, ni si hubo allanamiento a fojas tantas. Nada de eso puede
aparecer inventado, ni siquiera como ejemplo plausible: un `Juzgado Nacional en
lo Civil N° 1` de relleno es el tipo de cosa que se pega y no se corrige.

**Los huecos tienen que ser imposibles de no ver.** Corchetes, mayúsculas, y que
el texto sea inutilizable hasta completarlos. Un placeholder discreto es peor
que ninguno.

### Estructura propuesta

Plantilla por bloques, no por caso. De los diez modelos van a salir cuatro o
cinco bloques que se repiten:

1. **Encabezado** — casi todo ausente, casi todo huecos.
2. **La base regulatoria** — derivado: `baseOriginal`, y si hubo reducciones, la
   cadena hasta `baseFinal` con el artículo de cada una. Sale casi entero de
   `transformaciones`.
3. **La escala aplicada** — derivado: `escala.titulo`, `baseEnUMA`, los
   porcentajes, y el valor de la UMA con su norma, que ya está en `uma.json` con
   `fuente` y `url`.
4. **La regulación de cada rol** — derivado más el punto elegido dentro de la
   banda.
5. **Los adicionales que correspondan** — segunda instancia, auxiliares,
   partidor, actuaciones posteriores. Solo los que el resultado traiga: un
   `partidor` ausente no genera párrafo.
6. **Cierre y firma** — fijo más huecos.

**Un bloque por sección del dashboard.** Si el dashboard ya decidió que el
partidor es una sección propia, el texto también. Que la correspondencia sea uno
a uno hace que agregar una regla al motor no se olvide en la prosa.

### La verificación, que es lo que falta

Dos controles, y los dos son baratos:

**1. Control mecánico de números, al estilo de `verificar-docs.mjs`.** Extraer
todos los importes y porcentajes del texto generado y comprobar que **cada uno
aparece en el `CalculoResultado` que lo originó**. Un número en el texto que no
está en el resultado es un número inventado, y esto lo caza sin entender nada de
derecho.

Es exactamente el mismo razonamiento que el control de citas: no verifica que el
texto sea correcto —eso no se puede automatizar— pero caza la clase de error más
cara. Y tiene la misma limitación, que conviene escribir desde el principio para
no confiarse: **no caza un número correcto puesto en la frase equivocada.**

**2. Validación de texto fijo.** Para un `CalculoResultado` congelado, el texto
generado tiene que ser idéntico carácter por carácter. Así, cualquier cambio en
la redacción aparece en el diff y se revisa a propósito, en vez de colarse.

Las dos van en `lib/legal/__tests__/` y corren con las demás.

### Lo que hay que decir explícitamente en la interfaz

Que el texto es un **borrador para revisar**, no una resolución. Y sobre todo,
**que el punto dentro de la banda lo eligió el usuario y no la app** —si se toma
la primera opción de arriba—, porque esa es la única parte del texto que no sale
de la ley ni del cálculo.

Va en el bloque «qué no hace» de `documentacion.html`, con el motivo, como el
resto.

---

## El orden de trabajo propuesto

1. **Decidir cómo se elige el punto dentro del rango.** Bloquea todo lo demás.
2. **Cargar los diez modelos** y hacer la pasada de lectura: bloques fijos,
   derivados y ausentes.
3. **El generador**, función pura en `lib/legal/`, que toma `CalculoResultado`
   más el punto elegido y devuelve texto plano. Sin React, sin DOM, como todo
   `lib/legal/`.
4. **Los dos controles** de arriba, en el mismo commit que el generador. No
   después: la prosa sin realimentación es el problema que esta feature crea.
5. **La interfaz**: un panel con el texto y un botón de copiar. Texto plano, que
   es lo que pediste y además lo que sobrevive al pegado en cualquier editor.
6. **Cobertura**: qué procesos tienen modelo y cuáles no. Los que no, o no
   ofrecen el texto, o lo ofrecen diciendo que es una adaptación. No hay tercera
   opción honesta.

---

## Lo que este plan no resuelve

- **Generar el `.docx` directamente.** Dijiste texto plano para pegar, y eso es
  lo correcto: un `.docx` generado trae su propio formato y pelea con la
  plantilla del destino. Si más adelante hace falta, es otro trabajo.
- **Los casos que no están en los diez modelos.** Va a haber varios. La decisión
  del punto 6 es la que evita que el generador improvise justo donde menos sabe.
- **Si esto va en Honorio o es una herramienta aparte.** Lo doy por hecho en
  Honorio porque se alimenta de `CalculoResultado`, pero si la idea es que
  también sirva para regulaciones calculadas a mano, es otra discusión.
