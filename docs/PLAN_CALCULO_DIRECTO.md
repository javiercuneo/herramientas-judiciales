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

## Qué muestra, decidido el 7/8

La especificación no salió de un diseño: **salió de la hoja de Sheets que Javier
ya usa**. Es lo que hay que reproducir, y es más preciso que cualquier boceto.

Pone la base y ve, de un golpe de vista:

| Qué | Nota |
|---|---|
| **La base en UMA** | El primer dato, no un detalle |
| **La escala aplicable** | Cuál de las siete y sus porcentajes |
| **Patrocinante y apoderado**, mínimo y máximo | Los dos que usa |
| **Las etapas**, desplegables | No en la primera pantalla |
| **5 % a 10 % de auxiliares** | Aparte, no dentro de la tabla |

### La decisión de fondo: **la unidad principal es la UMA, no el peso**

Textual: «solo en UMA porque regulo en UMA, y al lado pongo el número en pesos».

**Eso invierte lo que hace hoy el resto de Honorio**, que lidera con pesos y trata
la UMA como dato de transparencia. Y tiene sentido que lo invierta: quien usa
este modo está escribiendo una regulación, y una regulación se escribe en UMA. El
peso es la traducción para el que la lee.

Va **la UMA primero y el peso al lado**, en menor jerarquía. Los dos siempre: el
peso queda porque no todo el que entra regula en UMA.

> **Queda una pregunta más grande, y no es de este plan:** si la UMA tiene que
> pasar a primer plano **en toda la app**. Hoy hay una incoherencia —el modo
> directo diría UMA y el dashboard pesos—. Recomiendo **no** tocar el dashboard
> ahora: son dos públicos distintos y el modo directo es el que declara para quién
> es. Pero conviene mirarlo cuando se haga el
> [`PLAN_REGULACION_EN_PROSA.md`](PLAN_REGULACION_EN_PROSA.md), porque el texto de
> una resolución tiene el mismo problema y **ahí la respuesta puede ser otra**.

### El procurador se muestra igual

Javier no lo usa —«ni siquiera tiene el procurador, si soy honesto»— pero el modo
no es solo para él, y el procurador es una línea derivada del patrocinante
(× 0,4, art. 20). Sacarlo no simplifica nada y le saca utilidad a otro.

**Que esté no quiere decir que pese lo mismo:** patrocinante y apoderado primero.

### El rango: las dos cosas

Se muestra la banda **y** se puede fijar un punto adentro. La idea es un panel:
tocás y tenés todo.

Esto **resuelve por adelantado la decisión abierta del
[`PLAN_REGULACION_EN_PROSA.md`](PLAN_REGULACION_EN_PROSA.md)**, que es quién elige
el número dentro de la banda. La respuesta es: lo elige el usuario, con un
control explícito, y la app nunca por defecto. Hacerlo acá primero deja el
mecanismo probado antes de que lo use algo que produce texto para un expediente.

### Los dos ejes, para que no se vuelvan a mezclar

Se habló de «las tres etapas, o sea, patrocinante, procurador y apoderado». **Son
dos ejes distintos**, y conviene tenerlo escrito:

- **Los roles** —patrocinante, apoderado, procurador— son **quién cobra**, y son
  alternativos entre sí: no se suman.
- **Las etapas** —completo, 2/3, 1/3— son **cuánto del proceso se cubrió**
  (art. 29). Están en `RolResult { full, uno, dos }` y el dashboard las rotula así
  en `HonorariosBand.tsx:34`.

`calcularEscala()` ya devuelve las etapas adentro de cada rol, así que la
estructura existe: la decisión es solo cuál se muestra primero.

Ojo con un detalle que el dashboard resuelve y acá no aplica:
`HonorariosBand.tsx:150` **deja de ofrecer el 2/3 cuando el proceso terminó antes
de la prueba**. En el modo directo no hay proceso ni terminación, así que van las
tres siempre.

### La hoja, leída y verificada contra el motor

Se miró la hoja real (base $21.368.714,99, UMA $102.076) y **todos sus números
coinciden con el motor, hasta el tercer decimal**: base 209,341 UMA, 5ª escala,
patrocinante 41,901–44,868, apoderado 58,662–62,816, las etapas, el cuarto de
etapa y los auxiliares 10,467–20,934. **La hoja y Honorio ya calculan lo mismo**,
así que este modo es presentación, no aritmética nueva.

Lo que la hoja tiene y el dashboard hoy no:

- **El excedente sobre el tramo anterior**, a la vista. El motor ya lo trae en
  `EscaleraInfo.excedente`.
- **El promedio entre el mínimo y el máximo de los auxiliares** (15,70 UMA en el
  ejemplo). Es una cifra sola, no un rango, y aparentemente es la que se usa.
- **Un mínimo de referencia para los auxiliares**, al lado del 5–10 %. Encaja con
  lo que ya se decidió en el [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md):
  los mínimos **no se aplican solos** —el art. 478 CPCCN permite perforarlos y
  aplicarlos sería decidir por el juez— pero **mostrarlos al lado es
  información**, no una decisión. La hoja ya lo resuelve así.
- **El honorario del mediador en la misma pantalla**, calculado sobre la misma
  base. Confirma que el mediador pertenece acá, y de paso que la regla del 2 %
  por encima de 1000 UHOM es la que se usa en la práctica —lo que **no** la
  convierte en verificada: sigue faltando la norma, ver
  [`PLAN_MEDIACION.md`](PLAN_MEDIACION.md)—.

Y dos diferencias de forma que conviene respetar, porque son de uso y no de
gusto:

- **Cuenta etapas, no fracciones.** La hoja dice «1 ETAPA» y «2 ETAPAS» donde el
  dashboard dice «1/3» y «2/3». Es el mismo número y **la formulación de la hoja
  está más cerca del art. 29**, que divide el proceso en etapas: se cuenta cuántas
  se trabajaron.
- **Lee el máximo primero.** Las columnas van MÁXIMO y después MÍNIMO, y las
  alícuotas están escritas «33 % a 22 %». El dashboard hace lo contrario.

**El redondeo, para no repetir el error de la calculadora vieja.** La hoja muestra
«Redondeo UMA 209» pero **calcula con 209,341** —se comprueba en que da 41,901 y
no 41,85—. O sea que el redondeo es de presentación. `honorarios.html` hacía lo
contrario: redondeaba y calculaba con el redondeo. Si el modo directo muestra una
base redondeada, **que no calcule con ella.**

### «El porcentaje de una etapa» no es lo que Honorio tiene hoy

Quedó aclarado así: «a este tipo le corresponde el 30 % de una etapa en función de
lo que trabajó en ella». Y se dijo que eso ya está en Honorio. **La aritmética sí;
el concepto no.**

Lo que hay en `HonorariosBand.tsx:348` es **«Reparto entre dos profesionales»**:
un deslizador que parte un importe entre un «Primero» y un «Segundo», 60/40 por
defecto, cuyas dos porciones **suman 100 %**.

Lo descrito es otra cosa: **un solo profesional se lleva el 30 % de una etapa
porque hizo el 30 % del trabajo de esa etapa.** El 70 % restante no es de nadie en
particular —puede no regularse, o ir a otro que no está en pantalla—.

Da el mismo número y significa distinto. Esa distancia entre el rótulo y el
concepto es exactamente la clase de error que este repositorio ya pagó dos veces
—«un rótulo que promete un porcentaje puede mentir con las validaciones en
verde», [`05_DEPENDENCIAS.md`](domain/05_DEPENDENCIAS.md)—.

**Entonces, en el modo directo: se reusa el mecanismo, no el rótulo.** Un solo
control —qué fracción de la etapa se trabajó— y no un reparto entre dos. La hoja
ya lo hace a mano, con una fila fija de «1/4 etapa».

> **Y queda una pregunta para el dashboard, que no es de este plan:** si ese
> control debería ofrecer las dos cosas, porque son dos necesidades reales y hoy
> solo está una. Anotado, no decidido.

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

1. ~~**Decidir qué muestra.**~~ **Hecho el 7/8**, arriba. Queda una sola cosa
   abierta —qué es «el porcentaje de una etapa»— que se resuelve mirando la hoja
   de Sheets. Y confirmar que el valor de la UMA se pueda pisar a mano, como en
   la entrevista: debería, es el paso 0 de todo el resto.
2. ~~**El módulo**~~ y 3. ~~**la validación**~~. **Hechos el 7/8**, en el mismo
   commit: `lib/legal/calculo-directo.ts` y `calculoDirecto.validation.ts`, que
   es la número 15. 171 afirmaciones.

   Salió como estaba previsto salvo en una cosa: **no devuelve un
   `CalculoResultado`**. Ese tipo no lleva las etapas por rol —las tiene
   `EscalaResult`, que es lo que devuelve `calcularEscala()`—, así que forzarlo
   habría perdido justo lo que esta pantalla muestra. Devuelve un
   `CalculoDirecto` propio, y el control cruzado compara los dos contra
   `buildGeneral()` igual.

   El control cruzado **está y muerde**: mutando el patrocinante un 0,1 % fallan
   los cinco casos. Y ancla contra la hoja de cálculo real, cuyos números
   coinciden con el motor hasta el tercer decimal.

4. **La interfaz — es acá donde sigue.** Una pantalla con dos campos y una
   tabla. El patrón a copiar es `components/interview/minimos-view.tsx`:
   consulta directa, sin entrevista, que se prende con un booleano en
   `interview-experience.tsx` y tiene entrada en la barra y en la intro. La
   unidad principal es la UMA, con el peso al lado.
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
