# Plan: elegir sobre el texto, y que lo elegido enseñe

**Abierto. Propuesto el 3/10/2026, sin decidir.** Cubre las dos pantallas que
usan el motor de anonimización: la de Escribiente (acá, pública, corre en el
navegador) y la del ingreso de `redactor` (local). Lo que es de criterio o de
arquitectura está marcado **[Javier]** y no se empieza sin su respuesta.

## El problema, medido

Hoy los nombres a tapar se eligen **en una lista**: cada candidato con su
casilla, la cantidad de apariciones y una etiqueta. Corrido el 3/10 contra los
casos que entraron por la bandeja de `redactor`, con el motor del día:

- En un caso con mucha jurisprudencia citada se tildaron **95 nombres**, y las
  reglas no tocan **83**. Casi todos son **partes de carátulas de fallos
  citados** («esta Sala, “X c/ Y s/ daños”»).
- Otros quedaron **a medias**: el nombre completo tapado y el apellido suelto a
  la vista, o al revés. En una lista no se ve: el nombre aparece como «hecho».

Una lista obliga a decidir **sin el texto delante**: para saber si «Gómez,
Ana» es la parte o la autora de un tratado hay que ir a buscarlo. Y lo que la
lista no ofreció no hay forma de agregarlo, salvo escribiéndolo a mano. Las
reglas nuevas del 3/10 (rol, «Fdo.», propagación) cerraron pocas entradas del
buzón: **la fricción no está en las reglas, está en cómo se elige.**

## Lo que ya existe y no se rehace

- Escribiente: la lista de candidatos con casilla y etiqueta, la detección de
  restos pegados a una etiqueta y de palabras sueltas de un nombre tildado.
- `redactor`: la pantalla del ingreso con candidatos, corrección a mano del
  texto (`ediciones.json`), «tapar resto» e «ignorar resto», la revisión que no
  libera mientras quede un pedazo, y `confirmado.json` con lo decidido por caso.
- El buzón de fugas y `herramientas/buzon.py` de `redactor`, que ya prueban
  cada regla nueva contra los casos sin sacar el texto de la máquina.

## La propuesta: el texto es la interfaz

El texto se muestra **ya anonimizado y marcado**, y se decide sobre él:

| Se ve | Qué es | Qué se hace con un clic o una selección |
|---|---|---|
| fondo de un color, con la etiqueta | tapado por una regla | «destapar acá», «destapar en todo», «no es persona: es autor / tribunal / calle» |
| fondo de otro color | tapado por un nombre elegido | lo mismo, más «cambiar etiqueta» |
| subrayado punteado | candidato sin decidir | tildar o descartar ahí mismo, con la etiqueta |
| texto común | nada | **seleccionar «de acá a acá»** → «tapar como…», con la cuenta de cuántas veces aparece |

Detalles que deciden si se usa o no:

- **La selección se ajusta a palabras enteras.** Doble clic toma una palabra,
  Shift+clic extiende. Una selección que toca una etiqueta se une a ella:
  seleccionar «Gómez» detrás de «[PERSONA]» propone «Ana Gómez» entera.
- **Todo se aplica en todo el documento, y se dice cuánto**: «tapar en las 14
  apariciones». Destapar una sola aparición es la excepción, no lo común.
- **Teclado:** `n`/`p` saltan al próximo/anterior sin decidir, `t` tapa, `d`
  destapa. La revisión de un expediente largo se hace sin mouse.
- **La lista no desaparece**: queda como panel lateral, sincronizado, porque
  sirve para ver el total y decidir en bloque.
- **Las carátulas citadas van agrupadas** (ver abajo): un solo control para
  todas, no noventa casillas.

### Lo que necesita el motor

1. **Tramos, no sólo texto.** Hoy `anonimizar()` devuelve el texto final y un
   conteo. La pantalla necesita saber qué pedazo del ORIGINAL se tapó, con qué
   etiqueta y por qué: una función nueva que devuelva
   `[{desde, hasta, etiqueta, origen: 'regla' | 'elegido' | 'descubierto', regla}]`
   sobre el texto original. `anonimizar()` queda como está y se arma encima, así
   que nada de lo que hoy la usa cambia.
2. **Excepciones.** «Esto no es persona» tiene que poder ganarle a una regla:
   una lista de textos que ninguna regla de nombres tapa (se protegen antes de
   aplicar y se restituyen después). Sin esto, destapar una cita de doctrina
   que una regla anclada tapó no tiene cómo durar.
3. **La carátula citada, reconocida.** Nombres entre comillas con «c/» y «s/»,
   o seguidos de tribunal, sala, fecha o «Fallos», que **no** coinciden con las
   partes de la carátula de la causa. Se devuelven marcados como tales.

Las tres van con su regresión en `verificar-escribiente`, como siempre.

### Una decisión de criterio que manda sobre todo lo demás **[Javier]**

**¿Se tapan las partes de los fallos citados?** Son jurisprudencia publicada
—este mismo repositorio las admite en sus archivos públicos, con tribunal,
sala, carátula y fecha—, y son la mayor parte de la fricción medida. Tres
opciones:

- **a)** taparlas siempre, como hoy;
- **b)** no ofrecerlas, **salvo que coincidan con una parte de la causa** —que es
  el caso de riesgo: «lo resuelto en autos “X c/ Y”» cuando X es el actor—
  (recomendada);
- **c)** ofrecerlas agrupadas, con un solo «tapar todas / dejar todas».

## Que aprenda

Dos niveles, y la diferencia importa por la privacidad.

**Por caso, ya existe:** todo lo que se decide queda en `confirmado.json`, fuera
de los repos. Con el selector se suman las excepciones.

**Entre casos, es lo nuevo.** Cada decisión se anota, **sólo en la máquina y
fuera de todo repositorio** (junto al material real), con: el texto, la forma
(«Xx XX»), las palabras de alrededor, la etiqueta, la decisión (tapar / no
tapar) y de dónde vino (candidato ofrecido, selección a mano, anulación de una
regla). De ahí salen tres cosas, de la más segura a la más ambiciosa:

1. **Lo que nunca es persona.** Lo que se destapó como autor, tribunal,
   editorial o calle en un caso no se vuelve a ofrecer en el siguiente. Es lo
   que más ruido saca, y no arriesga nada: una persona no se vuelve doctrina.
   Se puede sembrar con los autores de la doctrina que ya indexa `indice`.
   **Lo que sí fue persona NO se generaliza** entre casos: la parte de un
   expediente no es la del otro.
2. **Reglas propuestas.** Si «la perito X» se tildó veinte veces de veinte, eso
   es una regla anclada que falta. El consumidor del buzón ya hace este paso a
   mano; con las decisiones anotadas, lo propone solo —el patrón y su
   regresión con datos inventados— y una persona lo aprueba.
3. **Tildado de fábrica según la experiencia.** Cada candidato con un puntaje
   simple por las palabras que lo rodean, contado sobre las decisiones
   anteriores. Por encima de un umbral viene tildado, por debajo se pregunta.
   Va última porque toca el diseño de la casa —«una casilla tildada de fábrica
   no es una pregunta»— y porque sólo sirve con decisiones acumuladas.

**La métrica que dice si anda:** decisiones manuales por caso, y cuántas de las
que el sistema propuso hubo que corregir. Hoy la línea de base es la de arriba:
95 casillas en un caso.

**Lo aprendido no entra al motor público.** El motor sigue genérico; las listas
aprendidas se le pasan al llamarlo (excepciones, candidatos a no ofrecer). En
la versión web de Escribiente, que no tiene servidor, aprender sería por
navegador y nada más **[Javier: si se hace]**.

## El orden

Cada fase deja todo andando y se puede parar en cualquiera.

1. **Motor**: tramos, excepciones y carátula citada, con regresiones. Sin
   pantalla todavía.
2. **La decisión de las carátulas citadas [Javier]**, aplicada en el motor.
3. **Selector en la pantalla de `redactor`**, que es donde está la fricción
   medida y donde se trabaja con causas.
4. **Selector en Escribiente.**
5. **Anotar decisiones y lo que nunca es persona.** Medir.
6. **Reglas propuestas** desde el buzón.
7. **Tildado de fábrica**, si la medición de la fase 5 lo justifica.

**[Javier, arquitectura]:** el selector es el mismo componente en las dos
pantallas. Copiarlo contradice la regla 3 de los hermanos (dos copias se
desincronizan); servirlo desde este repositorio hace que `redactor` dependa
de una ruta de acá, como ya pasa con el conector. Hay que elegir antes de la
fase 3.

## ¿Y si el motor viviera en otro repositorio?

Se preguntó el 3/10. **No gana nada, por cómo está hecho Escribiente:** corre en
el navegador, así que el código del motor se publica igual, sea cual sea el
repositorio de origen. El código de un anonimizador no tiene datos; lo
sensible es lo que se le pasa y lo que aprende. Eso ya vive fuera de los
repos —la bandeja, `confirmado.json`— y lo aprendido tiene que vivir ahí
también. El riesgo real de un repositorio público son los **ejemplos** de las
pruebas y los comentarios, y para eso están el hook de datos y la regla de los
datos inventados, que el 3/10 frenaron dos veces un CUIT y un DNI de ejemplo
escritos con forma completa.
