# Plan de cobertura de la ley

Qué de la Ley 27.423 la herramienta todavía no hace, qué conviene hacer, qué
conviene declarar y no hacer, y en qué orden.

Salió de revisar `01_PROCESOS.md` y `02_FLUJO_JURIDICO.md` contra el motor el
6/8/2026. La lista de huecos está en
[`02_FLUJO_JURIDICO.md`](domain/02_FLUJO_JURIDICO.md), sección «Lo que la ley
dice y el motor no hace»; acá está la decisión sobre cada uno.

**Por qué no está en `08_DEUDA_TECNICA_FUNCIONAL.md`.** Aquel es un catálogo de
decisiones de interpretación ya tomadas —28 observaciones sobre por qué el
motor hace lo que hace—. Esto es trabajo por hacer. Son dos cosas distintas y
mezclarlas hace que ninguna de las dos se pueda leer entera.

**La implementación es en [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio).**
Acá va la decisión; allá el código y su `ESTADO.md`.

**Estado al 7/8/2026: el plan está hecho.** Los ocho puntos, en dos tandas.
Primero los que no tocan un número —1, 6, 3a, 5 y 7—, que salieron como la
versión 2.2.0 de Honorio. Después los tres que sí —2, 8 y 4—, como la 3.0.0,
que es MAYOR porque un caso da distinto: la modificación de una cuota
alimentaria pasó de la escala del art. 21 a la de los incidentes.

**El punto 8 se resolvió distinto de como estaba escrito acá**, por decisión de
Javier, y la razón está en su lugar: el art. 478 CPCCN permite perforar los
mínimos de los peritos, así que aplicarlos automáticamente sería decidir por el
juez.

Lo único que queda es lo anotado sin fecha al final.

---

## Lo primero, y no es un hueco de la ley

### 1. El hint de la base se perdió, y era la mitad del valor de la entrevista

> **Hecho el 7/8/2026.** `lib/wizard/indicacion-base.ts` en Honorio, con las
> 24 ramas. `ayuda` y `explicacion` de un paso pueden derivarse de las
> respuestas —el tipo es `Derivable<T>`—, que es lo que este punto proponía.
> Ningún número se movió y las 11 validaciones siguen en verde. El detalle, en
> el `ESTADO.md` de aquel repositorio.
>
> Dos cosas salieron distintas de como estaban acá previstas, y las dos por
> haber leído el motor en vez de copiar el texto del clásico:
>
> - **El aviso de «no ingreses el monto reducido» quedó condicional.** Sale
>   solo cuando alguna de las cuatro quitas de base rige de verdad. Puesto en
>   las 24 ramas se volvía invisible justo donde importa.
> - **Las leyendas dicen también qué no hace la app**: el segundo párrafo del
>   art. 39 en alimentos, el tope del 100 % del art. 23 inc. h), y de dónde
>   sale el 2 %-20 % del incidente. El clásico no lo decía porque no tenía por
>   qué: eran huecos que aparecieron al verificar cada afirmación contra
>   `calculate.ts`.

**Esto no es una funcionalidad nueva: es una regresión.** El asistente clásico
mostraba, justo arriba del campo de la base, un cuadro que decía **qué monto
ingresar**, elegido según lo que se había contestado antes. No era un texto de
ayuda genérico: era distinto para cada rama.

Está en `asistente-honorarios-clasico/js/wizard.js`, función `renderBase()`, y
son unas quince leyendas. Cada una combina una instrucción práctica con el texto
del artículo. Por ejemplo:

- **Desalojo laboral** → «la base regulatoria es el 50 % de la última
  remuneración mensual durante 2 años», con el art. 43 completo.
- **Inmuebles** → las tres reglas del art. 23 inc. a en orden de prelación
  (tasación; valuación fiscal + 50 %; estimación del profesional si la fiscal se
  reputó inadecuada), **y una advertencia sobre el tipo de cambio si hay montos
  en dólares** que no está en ninguna ley y sale de haber liquidado expedientes.
- **Sumas de dinero** → el texto cambia además según cómo terminó el proceso:
  liquidación aprobada si hubo sentencia admitida, liquidación practicada al
  efecto regulatorio si se rechazó o si caducó, monto de la transacción si hubo
  acuerdo.
- **Desalojo con contrato** → el total del contrato, qué hacer si no hay
  contrato o el alquiler es inadecuado, y **«no ingreses el monto reducido
  porque ya lo calcula el sistema»**.
- **Sucesión** → el valor del patrimonio que se transmite, con el procedimiento
  del art. 23 si la valuación fiscal se consideró inadecuada.

**Esto explica una cosa que yo había descrito mal.** En el `01` escribí que
nueve de las doce opciones de objeto «no mueven ningún número» y quedaron «para
orientar». Es cierto hoy y es la razón por la que existen las separaciones,
pero lo escribí como si fuera el diseño. No lo es: **esas opciones tenían una
consecuencia concreta —cambiaban lo que la app te decía que ingresaras— y la
perdieron en la migración.** Parte se recuperó en las explicaciones de las
tarjetas, parte no.

**Por qué va primero.** Es lo más barato y lo de mayor valor de toda esta lista:

- El texto ya existe, escrito por el autor, en este repositorio.
- No mueve ningún número. Es una función pura de las respuestas al texto que se
  muestra, del mismo tipo que las que el schema ya tiene.
- Ninguna de las once validaciones se toca.
- Es lo que decide si el número que sale es el correcto, porque **el error más
  caro de esta herramienta no es la escala: es ingresar la base equivocada.**
  La escala está validada 300 veces; la base la pone una persona.

**Cómo.** El paso `base` de `wizard-schema.ts` tiene hoy un `ayuda` estático.
Hay que dejar que `ayuda` y `explicacion` puedan derivarse de las respuestas
—`(answers) => texto`—, y portar las quince leyendas. Es el mismo mecanismo que
ya usan las `condition`, así que no hay concepto nuevo.

**De paso se resuelve el litisconsorcio.** Ver punto 6.

---

## Los huecos de la ley, uno por uno

### 2. Art. 41, última oración — actuaciones posteriores a la ejecución

> «Las actuaciones posteriores a la ejecución propiamente dicha se regularán en
> un cuarenta por ciento (40 %) de la escala del citado artículo.»

> **Hecho el 7/8/2026.** Bloque propio en el resultado, al 40 % de la escala
> del art. 21, con `actuacionesPosteriores.validation.ts` detrás. Se probó que
> la validación caza el error que este punto advertía —tomar el 40 % de la
> escala ya partida al medio—: forzándolo, 13 afirmaciones fallan.
>
> **Y sí necesitó una interpretación**, contra lo que este punto decía: si el
> −10 % por no haber excepciones alcanza también a las posteriores. Se resolvió
> que no —esa quita se refiere al honorario de la ejecución— y quedó declarado
> en pantalla.

**Hacerlo. Es el más fácil de los seis y no necesita ninguna interpretación.**
Un factor sobre la escala del art. 21, solo para `ejecucion_sentencia`.

Un detalle que conviene no pasar por alto: **el 40 % es de la escala completa
del art. 21, no de la escala ya reducida a la mitad por el mismo artículo.** Las
dos son fracciones de lo mismo: la ejecución al 50 %, las posteriores al 40 %.

**Dónde ponerlo — acá difiero de la idea de la cuarta tarjeta.** La propuesta
era sumarlo como una cuarta card en la fila de las etapas, al lado de completo,
2/3 y 1/3. No lo haría, y la razón es la misma clase de error que estuvimos
sacando estos dos días: **esa fila divide *una* regulación en fracciones del
art. 29. El 40 % del art. 41 no es una fracción de esa regulación: es *otra*
regulación sobre la misma base.** Ponerlos en la misma línea dice que son
comparables, y no lo son —de hecho pueden concurrir: el mismo profesional puede
cobrar la ejecución *y* las posteriores—.

Dónde sí: **un bloque propio**, como ya lo tienen la segunda instancia y el
partidor, que son exactamente eso, otras regulaciones sobre la misma base. No
hay que inventar nada: el patrón ya está y el usuario ya lo entiende.

**Costo:** bajo. Una función, un bloque, una validación nueva.

---

### 3. La división en etapas — hay un defecto vivo, no solo un hueco

Acá hay dos cosas de tamaño muy distinto, y conviene separarlas.

> **3a, hecho el 7/8/2026.** Cuando el proceso terminó antes de la apertura a
> prueba, el 2/3 ya no se ofrece —ni como tarjeta ni como opción del reparto—
> y en su lugar hay un «por qué» que dice cuál es la etapa que falta. Se
> detecta por la transformación del art. 25, que el motor emite exactamente en
> ese caso: no se reimplementó la condición.
>
> **Quedó una pregunta abierta, y es jurídica.** Si terminó antes de la
> apertura a prueba, el «completo» tampoco es la suma de tres etapas que
> ocurrieron. Se dejó como está porque el «completo» es la regulación del
> proceso tal como ocurrió —el art. 25 ya le aplicó la mitad de la escala por
> haber terminado temprano— mientras que las fracciones sirven para el
> profesional que intervino en parte. Si la lectura correcta es otra, es un
> cambio de una línea.
>
> **3b sigue anotado sin fecha.**

**3a. El defecto (barato, y hay que arreglarlo).** La app muestra siempre las
tres fracciones —completo, 2/3, 1/3— incluso cuando la entrevista ya contestó
que el proceso terminó **antes de la apertura a prueba**. Si terminó antes,
**esa etapa no existió**, y mostrar un 2/3 que la incluye es enunciar un número
que las propias respuestas contradicen.

Es de la misma familia que la tarjeta de la cautelar que arreglamos hoy: el
número está bien calculado y lo que está mal es lo que la pantalla afirma sobre
él. Y no requiere ninguna ingeniería procesal: **usa una respuesta que la
entrevista ya tiene**, `aperturaPrueba`.

**3b. El proyecto (caro, y puede esperar).** Nombrar las etapas según el tipo de
proceso —«demanda y contestación», «prueba», «alegatos y sentencia» en el
ordinario; las tres del art. 29 inc. f en el ejecutivo, que además son dos o
tres según haya habido excepciones; las dos del inc. g en el incidente—. Eso sí
pide leer el código procesal y mapearlo, y es un trabajo aparte.

**Recomendación:** hacer 3a ahora, junto con el punto 1, porque son la misma
clase de cambio —lo que la pantalla afirma, sin tocar números—. Dejar 3b
anotado.

---

### 4. Art. 39, segundo párrafo — aumento, disminución o cesación de alimentos

> «En los casos de aumento, disminución, cesación o coparticipación en los
> alimentos, se tomará como base la diferencia que resulte del monto de la
> sentencia por el término de dos (2) años, aplicándose la escala de los
> incidentes.»

Hoy la app manda todo `familia_alimentos` por la escala del art. 21.

> **Hecho el 7/8/2026.** Sub-paso nuevo bajo `familia_alimentos` con los dos
> supuestos del art. 39. Lo que este punto anticipaba se cumplió tal cual: es
> un solo criterio interpretativo aplicado en dos lugares —y
> `alimentosArt39.validation.ts` comprueba que los dos números coincidan—, la
> base es la diferencia y el hint lo dice con un ejemplo, y la cuenta de
> recorridos se movió: 160 a 168, y los cruces de 25.600 a 28.224, actualizados
> en la landing en el mismo commit.

**Hacerlo, y es menos problemático de lo que parece.** La objeción era: la
escala de los incidentes no existe en la ley vigente, así que habría que
declarar otro criterio interpretativo. **Pero ese criterio ya está declarado y
ya está implementado.** La app resuelve el incidente al 2 %-20 % del art. 33 de
la Ley 21.839, precisamente porque el art. 47 de la 27.423 quedó observado. Si
el art. 39 manda aplicar «la escala de los incidentes», se aplica **esa misma**,
la que la app ya usa y ya explica.

O sea: **no son dos declaraciones, es una declaración aplicada en dos lugares.**
Y esa es la lectura más defendible, porque cualquier otra obligaría a inventar
una escala distinta para el mismo concepto según por dónde se llegue.

**Lo que sí cambia de verdad son dos cosas, y hay que decirlas:**

1. **La base es la diferencia, no la cuota.** En una fijación original la base
   son dos años de la cuota; en un aumento son dos años de **la diferencia**
   entre la cuota vieja y la nueva. Es un error fácil de cometer y el hint del
   punto 1 tiene que decirlo con todas las letras.
2. **Cambia la cuenta de recorridos.** Una sub-pregunta bajo `familia_alimentos`
   agrega ramas, así que los 160 recorridos y los 25.600 cruces se mueven, y con
   ellos el número de la landing. Hay que actualizarlo en el mismo commit.

**Costo:** medio. Sub-paso nuevo en el schema, rama nueva en el motor,
validación nueva, y el barrido de `retroceso.validation.ts` tiene que seguir en
verde.

---

### 5. Art. 42 — el gestor y la gestión útil

> «…los honorarios que correspondan regular se incrementarán en un cuatro por
> ciento (4 %) calculados sobre los fondos que resulten disponibles en favor de
> aquéllos como consecuencia de su tarea.»

> **Declarado el 7/8/2026** en el bloque «qué no hace» de
> `documentacion.html`, junto al punto 7 y al lado del prorrateo del art. 730
> y la ejecución hipotecaria de la Ley 24.441, que es donde este punto decía
> que iba. La calculadora aparte sigue anotada sin fecha.

**No implementarlo como paso de la entrevista. Declararlo.** Coincido, y creo
que vale precisar por qué, porque el motivo real no es que la ley esté mal
redactada —que lo está— sino algo más simple y más definitivo:

**El 4 % no se calcula sobre nada que la entrevista conozca.** No es un
porcentaje de la base regulatoria ni del honorario: es sobre «los fondos que
resulten disponibles en favor» de los terceros acreedores o embargantes que
concurran. Ese monto no se deriva de ninguna respuesta ni tiene por qué guardar
relación con la base del juicio. **Es un dato de entrada que falta**, no una
regla ambigua.

Meterlo en la entrevista significaría agregar una pregunta que el 99 % de los
casos deja vacía, para un dato que el usuario calcula afuera igual. Eso empeora
la herramienta para todos y no mejora nada para nadie.

**Alternativa, si algún día importa:** una calculadora aparte, del estilo de las
de `calculadoras/`. Entrás los fondos disponibles, sale el 4 %. Cinco líneas y
cero costo para el flujo principal. Baja prioridad.

**Mientras tanto:** va donde ya están el prorrateo del art. 730 y la ejecución
hipotecaria de la Ley 24.441 — en el bloque de «qué no hace» de
`documentacion.html`, que es donde el usuario lo va a buscar.

---

### 6. Art. 21 — litisconsorcio

> **Hecho el 7/8/2026**, junto con el punto 1 y por la razón que este punto
> anticipaba: no había nada que programar. Es una línea del `ayuda` en las 18
> ramas donde puede haber litisconsorcio, más el párrafo del artículo en el
> fundamento. No va en la sucesión —el art. 35 tiene su propia regla— ni en la
> liquidación del régimen patrimonial, donde el art. 45 ya manda tomar el
> patrimonio adjudicado a la parte.

> «Si hubiera litisconsorcio la regulación se hará con relación al interés de
> cada litisconsorte.»

**No hay nada que implementar, y eso es una buena noticia.** La objeción era que
no se sabe cómo medir el interés de cada parte y que no encaja en ningún paso de
la entrevista. Es cierto lo primero, pero la conclusión es la contraria de lo
que parece:

**El art. 21 no pide una cuenta nueva: dice cuál es la base.** Y la base la
ingresa el usuario. Si hay litisconsorcio, lo que corresponde ingresar es el
interés del litisconsorte de que se trate, no el total del pleito. **La app ya
lo soporta; lo único que le falta es decirlo.**

Con lo cual esto no es un punto aparte: **es una línea más del hint del punto
1**, en las ramas donde puede haber litisconsorcio. Y es una línea que evita un
error caro, porque quien no lo sabe ingresa el total y se regula de más.

**Costo:** nulo, si se hace el punto 1.

---

### 7. Art. 21 — la excepción por labores altamente complejas

> «Ante la existencia de labores altamente complejas o extensas, los jueces…
> podrán por auto fundado, aplicar un porcentaje mayor al fijado
> precedentemente.»

> **Declarado el 7/8/2026** en el mismo bloque que el punto 5.

**Declararlo y no implementarlo. De acuerdo, sin matices.** No hay ningún dato
que la determine: es una facultad del juez, fundada, sobre el mérito de la
labor. Una herramienta que calcula no tiene con qué. Cualquier campo que se
agregue sería el usuario poniendo el número que ya decidió, y entonces la
herramienta no está calculando nada.

Va al mismo lugar que el punto 5. Ya figura como observación 16 en
`08_DEUDA_TECNICA_FUNCIONAL.md`.

---

### 8. Los mínimos legales no se verifican contra el resultado

Apareció el 6/8 al revisar `03_REGLAS_DE_NEGOCIO.md`, y es de otra clase que los
siete anteriores: **no es un artículo que falta implementar, es un piso que la
ley fija y el motor no comprueba.**

`calculate.ts` no importa `minimos-data.ts` y no hay ninguna comparación de piso
en toda la cadena: el cálculo termina en el partidor. **El número que la app
devuelve puede quedar por debajo de un mínimo legal y la app no lo dice.**

Los pisos: art. 48 (20 UMA), art. 44 (7 y 5 UMA), art. 58 (10, 6, 2 y 4 UMA),
art. 31 (20 y 15 UMA), art. 60 (2 UMA), art. 61 bis (2 UMA) y los del art. 19.

**Hay que separar dos grupos, porque no tienen el mismo problema:**

- **Los que rigen cuando el asunto no es susceptible de apreciación pecuniaria**
  —arts. 19, 44 y 48—. Ahí la entrevista directamente no corre: no hay base que
  ingresar. Que sean una pantalla de consulta es correcto y no hay nada que
  arreglar.
- **Los que conviven con un cálculo por escala** —art. 58 y los de peritos—.
  Estos sí deberían comprobarse contra el resultado, y hoy no se comprueban.

**Cómo se compensa hoy:** con el botón que va del resultado a la pantalla de
mínimos «para contrastar». El contraste lo hace el usuario.

> **Resuelto el 7/8/2026, y no como decía este punto.** Los mínimos de los
> auxiliares **se muestran al lado de su 5 %-10 %, no se aplican.** Decisión de
> Javier, con el fundamento que faltaba acá: el art. 21 deja a salvo el
> **art. 478 CPCCN**, que manda adecuar los honorarios de los peritos «por
> debajo de sus topes mínimos inclusive» a lo que se regule a los demás
> profesionales. El piso se puede perforar, así que aplicarlo automáticamente
> sería decidir por el juez.
>
> Eso además resuelve las dos objeciones de abajo sin pagar su costo: **no
> mueve ningún número**, y la pregunta de qué mostrar cuando el piso se activa
> se contesta sola —los dos números, siempre, con una insignia cuando el 5 %
> queda por debajo—.
>
> Sigue abierto para los pisos que no son de auxiliares.

**Recomendación.** Implementarlo, pero con cuidado y no primero, por dos
motivos. Uno: **mueve números**, y hacia arriba, en los casos de base chica.
Dos: hay que decidir qué se muestra cuando el piso se activa —el número
elevado, o los dos con la explicación—, y me inclino fuerte por lo segundo,
porque el resultado deja de salir de la escala y eso hay que poder verlo en la
cadena, como cualquier otra transformación.

**Costo:** medio. Una comparación al final de `buildGeneral()`, una
transformación nueva en la cadena, y validaciones nuevas para cada piso.

---

## El orden

**Primero, todo lo que no toca un número.** Son cambios de lo que la pantalla
afirma, se verifican mirando, y las once validaciones siguen valiendo tal cual.

1. ~~**El hint de la base** (punto 1), con el litisconsorcio adentro (punto 6).~~
   Hecho el 7/8/2026.
2. ~~**Las etapas que no pudieron existir** (punto 3a).~~ Hecho el 7/8/2026.
3. ~~**Declarar lo que no se hace** (puntos 5 y 7) en `documentacion.html`.~~
   Hecho el 7/8/2026. **Con esto se cerró todo lo que no toca un número.**

**Después, lo que sí mueve números.** Cada uno con su validación y su entrada en
el `ESTADO.md` de Honorio.

4. ~~**Art. 41, actuaciones posteriores** (punto 2).~~ Hecho el 7/8/2026.
5. ~~**Los pisos del art. 58 y de peritos** (punto 8).~~ Resuelto el 7/8/2026
   mostrándolos en vez de aplicarlos. Sigue abierto para los pisos que no son
   de auxiliares.
6. ~~**Art. 39, segundo párrafo** (punto 4).~~ Hecho el 7/8/2026. Arrastró la
   landing, como estaba previsto.

**Anotado, sin fecha.**

7. **Nombrar las etapas por tipo de proceso** (punto 3b).
8. **Calculadora del art. 42** (punto 5), si alguna vez hace falta.
9. **El proceso mal encarrilado.** Anotado el 7/8/2026 y **sin decisión
   tomada**: qué debería decir la app cuando se ejecuta —por la vía de la
   ejecución de sentencia— un acuerdo de mediación cuya obligación no es de dar
   sumas de dinero sino, por ejemplo, de escriturar. El juez debió
   ordinarizarlo; si no se dio cuenta y siguió adelante, la entrevista devuelve
   un número sobre una base que no es la del art. 22. Se dejó sin resolver
   porque no está claro si vale una advertencia o si es ruido para el 99 % de
   los casos. Lo planteó Javier al revisar los textos de la base.
10. **Si el «completo» sigue siendo el completo** cuando el proceso terminó
    antes de la apertura a prueba. Ver el punto 3a.

---

## Una cosa que este plan no cubre

Los mínimos arancelarios se verificaron contra `lib/legal/minimos-data.ts`, pero
**ese archivo no se verificó contra la ley**. Dice ser copia fiel del asistente
clásico, y que sea fiel a la copia no prueba que sea fiel a la norma. Son unas
cuarenta cifras que hoy nadie controló. Está en Pendientes del
[`ESTADO.md`](ESTADO.md).
