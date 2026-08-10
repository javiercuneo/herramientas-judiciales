# Plan: que Honorio escriba la regulación en prosa

Que además del número, la app devuelva el texto de la regulación —redactado,
para copiar y pegar en un `.docx` o en el editor del PJN— y que quien lo pegue
solo tenga que revisarlo.

Escrito el 7/8/2026. **Nada de esto está implementado todavía.** El 10/8 se
levantó el bloqueo —llegaron los modelos— y se hizo la pasada de lectura, que
está en [Los once modelos, leídos](#los-once-modelos-leídos-el-108). **La
decisión del punto dentro de la banda sigue abierta y sigue bloqueando el
código.**

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

### Decidido el 10/8: lo elige el usuario, con un control

**Javier eligió la primera.** El texto sale con un número, y ese número lo fija
una persona en la pantalla, rol por rol.

Lo que se sigue de eso, y conviene tenerlo escrito antes de programar:

- **El punto es una entrada, no un resultado.** No vive en `CalculoResultado`
  —que es lo que el motor calcula— sino al lado, como lo que el usuario decidió.
  El generador recibe las dos cosas.
- **El control no puede tener un valor inicial adentro de la banda**, por el
  mismo argumento con que se descartó la tercera salida. Arranca sin elegir, y
  hasta que se elija el texto no se ofrece o se ofrece con el hueco.
- **El texto tiene que decir de quién es esa decisión.** Es la única cifra del
  documento que no sale ni de la ley ni del cálculo, y ya está anotado abajo, en
  [Lo que hay que decir explícitamente](#lo-que-hay-que-decir-explícitamente-en-la-interfaz).
- **La banda no desaparece de la pantalla.** «Los números no se ocultan nunca»:
  el mínimo y el máximo se siguen viendo al lado del punto elegido, que es lo que
  permite ver si quedó cerca de un borde.

**Lo que esto no decide todavía**, y se resuelve al hacer la interfaz: si el
control es un deslizador sobre el porcentaje de la banda o un campo con el
importe. El deslizador registra el «60 % de la banda» sin cuentas; el campo deja
escribir la cifra redonda que se quiere firmar. Probablemente convivan.

---

## Lo que hacían falta eran los modelos, y ya están

**Los diez modelos de resolución, en MD, en el repositorio.** Sin eso, lo que
salga va a ser una imitación de resolución escrita de memoria, que es
exactamente el error que costó los ocho documentos de dominio: estructura
plausible, todo lo concreto corrido.

**Llegaron el 8 y el 10/8, y son trece**, en
[`docs/modelos/plantillas limpias/`](modelos/). Son plantillas de trabajo del
juzgado, sin datos de nadie —los huecos ya vienen como `***` y `$`—, y por eso
se versionan, a diferencia del resto de `docs/modelos/`, que quedó fuera del
árbol el 8/8.

---

## Los trece modelos, leídos — el 10/8

La pasada de lectura que este plan pedía antes de escribir código: qué párrafos
son fijos, cuáles cambian con el caso, y cuáles dependen de un dato que Honorio
no tiene.

### Lo primero: es un solo documento con cinco secciones

Los trece son el mismo esqueleto, con las secciones rotuladas `)` y en el mismo
orden. Ninguno los reordena y ninguno inventa una sección propia:

| Sección | Qué lleva | Categoría |
|---|---|---|
| **Ley aplicable** | Si rige la 21.839, la 27.423 o las dos por etapa | **Ausente** — ver abajo |
| **Base** | El monto, de dónde sale, y la escala tramo por tramo | **Derivado**, casi entero |
| **Carácter y extensión de la intervención** | Quién intervino, en qué carácter y qué hizo | **Ausente**, casi entero |
| **Regulación** | La fórmula de valoración y una línea por profesional | Fijo + **derivado** |
| **IVA y plazo** | Dos párrafos, idénticos en los trece | **Fijo, verbatim** |

**Y no hay encabezado.** Los trece empiezan en `AUTOS Y VISTOS:` — la carátula, el
expediente y el juzgado los pone el sistema del PJN. **El bloque 1 de la
[estructura propuesta](#estructura-propuesta), «Encabezado, casi todo huecos», no
existe.** El problema de los huecos no está donde se lo esperaba.

### Tres secciones más que los modelos traen y que quedan fuera de alcance

**Decisión de Javier, el 10/8.** Ocho de los trece modelos siguen con
**Notificación**, **Elevación** y **Apertura de cuenta en el BNA**. Son texto fijo
y verbatim, así que era tentador incluirlas: es la parte más barata de generar.
**No van, y el motivo es que no son de la ley sino de su juzgado.** Un generador
que las escriba estaría produciendo la práctica de un juzgado con la autoridad de
una herramienta general.

Se nota en los dos modelos más nuevos —`RH - SUCESION` y
`rh-homologacion convenio desocupacion`—, que ya terminan en «IVA y plazo». **Lo
que queda del texto fijo es esa sección, y nada más.**

### Una frase que los modelos traen y que el generador no escribe

**No se genera nunca**, en ningún proceso:

> «La regulación abarcará la totalidad de las incidencias planteadas […] así como
> también la asistencia a la audiencia de mediación (art. 19 punto b de la ley
> 27423).»

Está en `rh-desalojo` y en variantes en `RH-ejecución-expensas-alquileres-otros`.
**El motivo no es que la cita esté mal**: el art. 19 de la Ley 27.423 instituye
la UMA **y trae dos tablas de mínimos**, el inciso a) para los asuntos judiciales
no susceptibles de apreciación pecuniaria y el **inciso b) para la labor
extrajudicial**, que es donde cae la asistencia a una audiencia de mediación. Las
dos están en [`00_LEY_27423.md`](domain/00_LEY_27423.md) y **las dos las muestra
la pantalla de mínimos de Honorio**.

El motivo es el otro: **son honorarios que Honorio no calcula.** Los mínimos del
art. 19 se muestran en una pantalla de consulta y no entran en el resultado de la
entrevista; las incidencias van por el 2 %-20 % del art. 33 de la Ley 21.839, que
el motor calcula como un bloque aparte. Un párrafo que diga que la regulación
«abarca» esas dos cosas estaría afirmando algo que la cifra de al lado no
contiene.

> **Anotado como error de método, y es mío.** La primera versión de esta sección
> decía que la cita no existía, porque se buscó «ARTÍCULO 19» en el texto de la
> ley y se leyó el primer párrafo sin seguir las dos tablas que vienen abajo. Es
> exactamente la firma del error de los ocho documentos de dominio —afirmar sobre
> algo concreto sin haberlo abierto entero— y sobrevivió a que
> `verificar-docs` diera verde, porque el art. 19 existe y el control comprueba
> que exista, no lo que dice. **Lo corrigió Javier el 10/8.**

### Dónde sí está el problema de los huecos

**En «Carácter y extensión», que es la sección del medio y la que le da sentido a
la cifra.** Es prosa narrativa del expediente y Honorio no tiene nada de eso:

> «La Dra. actuó como letrada patrocinante del actor desde el inicio. Fue
> designado perito quien aceptó el cargo, presentó su dictamen en pág. \*/ y
> contestó a las impugnaciones de las partes en pág. \*/\*.»

Nombres, roles, fojas, qué hizo cada uno, si el perito presentó o no la pericia,
si a alguien le revocaron el patrocinio a fojas tantas. **Nada de eso es
derivable de `CalculoResultado` ni de ninguna respuesta de la entrevista**, y
nada de eso puede aparecer inventado.

Lo único de esa sección que sí es derivado son dos líneas: **cuántas etapas**
(«tengo en cuenta que tuvieron lugar 1/2 etapas de tres posibles») y **el
incremento del art. 20 para los apoderados**, que es exactamente el eje de rol
del motor.

### El bloque más rico, y es el que Honorio hace mejor que nadie

**La escala tramo por tramo, con el factor de correlación explícito.** Aparece en
ocho de los trece y es siempre el mismo párrafo:

> «Aplico la segunda escala de 16 a 45 UMA y alícuotas de 26 % a 20 % teniendo en
> consideración además el factor de correlación […]. En el caso, el máximo de la
> escala anterior son 4,95 UMA (33 % de 15 UMA). El porcentaje 26 % a 20 % se
> aplica sobre el excedente de \*\* UMA.»

Eso es, línea por línea, **el contrafáctico y la barra de excedente del
dashboard**. `EscalaAplicada` tiene el título del tramo, las alícuotas, el máximo
del grado anterior y el excedente. **Este párrafo se escribe entero desde el
motor, sin un solo hueco**, y es el que más trabajo manual ahorra.

Lo mismo el bloque del incidente: los tres fallos del 2 %-20 % que citan
`rh-incidente`, `RH - ORDINARIO` y `RH-BLSG` **son los tres de
`lib/legal/jurisprudencia.ts`**, con las mismas carátulas y las mismas fechas. La
sección se genera desde el dato que ya existe.

### Lo que los modelos hacen y el motor no

Cuatro cosas. Las cuatro son párrafos que un generador honesto tiene que dejar en
hueco, y conviene tenerlas escritas antes de que alguien las dé por resueltas:

1. **La ley aplicable por etapa.** `RH - ORDINARIO`, `RH-BLSG` y `RH - SUCESION`
   aplican la **Ley 21.839 a las dos primeras etapas y la 27.423 a la tercera**,
   con la doctrina de la CSJN en `Establecimiento Las Marías` y tres fallos que
   la refrendan; el de sucesión trae además la variante de aplicar la 21.839
   entera. **Honorio calcula solo por la 27.423.** Es la primera sección del
   documento y no se deriva de nada que la entrevista pregunte hoy.

   **Es el hueco más incómodo de los cuatro**, porque no es un dato que falta
   sino un régimen distinto: el modelo de sucesión cita el art. 24 de la 21.839
   —11 % a 20 % reducido en un 25 %— al lado del art. 35 de la 27.423. Un texto
   que salga con la escala de la 27.423 y el párrafo de ley aplicable en blanco
   es coherente; uno que complete ese párrafo sin calcular por la ley que nombra,
   no.
2. **La base con intereses.** Todos los modelos con base de daños suman los
   intereses a tasa activa desde la fecha del hecho, citando el plenario
   `Samudio`; y varios toman «el monto de la liquidación aprobada». Honorio
   **recibe la base ya hecha** —está dicho en el hint de la base— así que el
   párrafo de cómo se llegó a ella es del usuario.
3. **La elección entre dos corrientes.** `rh-caducidad` expone las dos lecturas
   —art. 22 contra art. 25—, con las salas que sostienen cada una, y elige. La
   entrevista **sí** pregunta cuál se aplica, así que el párrafo es derivable de
   la respuesta; lo que no es derivable es la enumeración de salas.
4. **El valor locativo del art. 40 en el desalojo por intrusión.**
   `rh-desalojo` fija la base multiplicando el valor locativo por 36 meses, por
   el plazo mínimo del art. 1198 CCyC. Es un cálculo previo a la base, no
   posterior: entra a Honorio ya hecho.

### Y una advertencia que vale por sí sola: los modelos no son oráculo

Es la regla de [`AGENTS.md`](../AGENTS.md), y el 10/8 se aplicó en las dos
direcciones: de los tres casos que esta sección listaba, **dos eran errores míos
y no de los modelos.** Quedan escritos porque la lección está justamente ahí.

- **`rh-desalojo` trae el UHOM en $10.800 y una tabla oficial de 2022.** El de
  agosto de 2026 es $12.960. **Este sí:** un valor viejo hardcodeado en una
  plantilla es exactamente lo que `data/uhom.json` vino a resolver, y es el único
  de los tres que mueve una cifra.
- ~~**Citan el «Anexo I» del Decreto 2536/15** cuando la escala está en el
  Anexo III.~~ **Los modelos tienen razón y la cita es exacta.** El art. 5° del
  2536 dice: «Sustitúyese el Anexo III del Decreto N° 1467 del 22 de septiembre
  de 2011 **por el que como ANEXO I forma parte integrante del presente**». O sea
  que el Anexo I del 2536 **es** el Anexo III vigente: las dos citas nombran el
  mismo texto, una por su origen y la otra por su destino. Corregido en
  [`PLAN_MEDIACION.md`](PLAN_MEDIACION.md), donde además **cierra la numeración
  del artículo**, que estaba anotada como sin resolver.
- ~~**`RH - ORDINARIO` dice «art. 61 prevé un mínimo de 6 UMA»** contra las 2 UMA
  de `minimos-data.ts`.~~ **No es una discrepancia: es la ley anterior.** El
  art. 61 fue **sustituido por el art. 96 de la Ley 27.802, B.O. 6/3/2026**, y es
  esa versión la que fija las 2 UMA. Un modelo escrito antes de marzo dice 6, y
  para un expediente cuya etapa de prueba se abrió antes de esa fecha **sigue
  siendo el número correcto**. Es el mismo problema de la
  [ley aplicable por etapa](#lo-que-los-modelos-hacen-y-el-motor-no), visto desde
  otro lado.

**La lección, y es la que más vale de la pasada:** de los tres «errores de los
modelos», el único real era un número desactualizado. Los otros dos salieron de
leer el texto legal por encima —el art. 5° del decreto, la nota de vigencia del
art. 61— con la hipótesis ya formada de que el modelo estaba mal. **Un modelo de
trabajo de un juzgado no es oráculo, pero tampoco es sospechoso por defecto:** es
otra fuente, y se lee con el mismo cuidado que las demás.

**De los modelos se toma la estructura y la prosa fija. Los números y las citas
siguen saliendo del motor y de la ley.**

### Cobertura contra los ocho procesos: completa

`PROCESS_STEP_MAP` tiene ocho entradas. **Las ocho tienen modelo**, y eso hace
que **el punto 6 del [orden de trabajo](#el-orden-de-trabajo-propuesto) no haya
que decidirlo**: no hay proceso al que ofrecerle un texto adaptado ni al que
negárselo.

| Proceso de Honorio | Modelo |
|---|---|
| `conocimiento` | `RH - ORDINARIO`, más `rh-demanda desestimada rechazada`, `rh-caducidad`, `rh provisional` y `rh-desalojo` como sub-casos del `objeto` |
| `ejecutivo` | `RH-ejecución-expensas-alquileres-otros` |
| `ejecucion_sentencia` | `RH - ej sentencia ley nueva` |
| `incidente` | `rh-incidente`, más `RH-BLSG` |
| `exhorto` | `rh-exhorto generico` |
| `medida_cautelar` | `RH - MEDIDA CAUTELAR NUEVA LEY` |
| `sucesion` | `RH - SUCESION` |
| `homologacion_desocupacion` | `rh-homologacion convenio desocupacion` |

**Los dos últimos llegaron el 10/8 y no son del mismo tipo.** El de sucesión es
una plantilla de trabajo como las once primeras. El de homologación **no
existía** —es un supuesto poco frecuente— y Javier lo escribió desde el texto del
art. 40 para este plan.

**Se leyó contra el motor y coincide**, que era lo que había que comprobar antes
de tratarlo como modelo: el art. 40 regula la homologación de convenio de
desocupación «en un cincuenta por ciento (50 %) del establecido en el párrafo
primero», y el motor emite exactamente esa transformación —`escala-homologacion`,
`calculate.ts:879`— más la reducción de base del 20 % si es vivienda, que la
plantilla también prevé.

**Y el de sucesión trae la sección más difícil de todo el corpus.** Su «Base» no
es un monto sino una discusión: cómo se valúan los bienes —con el criterio de la
CSJN en `Cambrea` de que la ley no exige formalidad para valuar—, qué se hace con
la moneda extranjera —cotización oficial del BNA, tipo vendedor, con cuatro
fallos— y qué bienes entran. Nada de eso es derivable: Honorio recibe la base ya
hecha. **Es el mejor ejemplo de que el hueco grande está en el medio del
documento y no en el encabezado.**

### Lo que la lectura confirma sobre la decisión abierta

**Ninguno de los trece escribe una banda.** Los trece dicen la misma fórmula:

> «regulo los honorarios del Dr. \*\*\* en **UMA ()**, equivalente al día de la
> fecha a **$**.»

Un número en UMA, con el peso al lado, **en ese orden**. O sea: la decisión de
[quién elige el punto](#las-tres-salidas-posibles) es ineludible y no hay una
cuarta salida escondida en los modelos. Y de paso queda resuelta una cosa que el
[`PLAN_CALCULO_DIRECTO.md`](PLAN_CALCULO_DIRECTO.md) había dejado para este plan:
**la unidad principal del texto es la UMA**, como en el cálculo directo y al
revés que el dashboard.

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

### Lo ausente no lleva hueco: no se escribe — decidido el 10/8

**Decisión de Javier, y cambia la categoría entera.** Un hueco visible es lo
correcto para un dato que le falta a una frase que sí corresponde. **No lo es
para una sección que no corresponde**, y casi todo lo ausente es de la segunda
clase.

> **La prosa es minimalista: dice únicamente lo que Honorio atrapa.** Lo demás lo
> agrega el usuario según su caso, y no aparece ni como hueco.

El argumento no es de prolijidad, es de qué clase de herramienta es Honorio:

**Honorio supone que el expediente está en condiciones de regularse, y no podría
suponer otra cosa.** No tendría sentido que la entrevista pregunte «¿está
terminado?» para contestar «volvé cuando lo esté». Salvo los provisorios y la
sucesión con renuncia del profesional, **solo se regula cuando el procedimiento
correspondiente terminó** —el art. 24 dice que «la sentencia que pone fin al
pleito deberá contener la regulación de los profesionales intervinientes», y el
art. 52 que «aun sin petición del interesado, al dictarse sentencia se regularán
los honorarios»—. Por eso el wizard tiene una sección dedicada al modo de
terminación, y por eso pide la base como un dato que existe.

De ahí que un hueco donde va la valuación de los bienes de una sucesión no sea
honesto sino al revés: **estaría afirmando que ese párrafo forma parte de lo que
Honorio produce, y no lo es.** Todo el procedimiento de valuación, la discusión
sobre la clasificación de tareas, la ley aplicable por etapa y la narración de
qué hizo cada profesional son otro producto.

**Los huecos que sí quedan son pocos y de la primera clase:** los que completan
una frase que el generador sí escribe —el nombre del profesional al lado de una
cifra que el motor calculó, la fecha—. Para esos vale la regla de siempre:
**imposibles de no ver.** Corchetes, mayúsculas, y que el texto sea inutilizable
hasta completarlos. Un placeholder discreto es peor que ninguno.

### Estructura propuesta

Plantilla por bloques, no por caso. De los diez modelos van a salir cuatro o
cinco bloques que se repiten:

1. ~~**Encabezado** — casi todo ausente, casi todo huecos.~~ **No existe.** Los
   once modelos empiezan en `AUTOS Y VISTOS:`; la carátula la pone el sistema del
   PJN. En su lugar va, cuando corresponda, la sección **«Ley aplicable»**, que
   es un hueco entero porque el motor calcula solo por la 27.423.
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

1. ~~**Decidir cómo se elige el punto dentro del rango.**~~ **Decidido el 10/8:
   lo elige el usuario, con un control.** Arriba, con las cuatro consecuencias
   que se siguen. La lectura de los modelos no lo resolvió, lo confirmó: ninguno
   de los trece escribe una banda.
2. ~~**Cargar los diez modelos** y hacer la pasada de lectura: bloques fijos,
   derivados y ausentes.~~ **Hecho el 10/8**, arriba, con once modelos. De ahí
   salió una corrección a la estructura —no hay encabezado, y el bloque de huecos
   grande está en el medio— y dos procesos sin modelo: `sucesion` y
   `homologacion_desocupacion`.
3. ~~**El generador**~~ y 4. ~~**los controles**~~. **Hechos el 10/8**, en el
   mismo commit: `honorio/lib/legal/regulacion-prosa.ts` y
   `regulacionProsa.validation.ts`, que es la número 17.

   **Salieron tres controles y no dos.** El tercero es que un punto fuera de la
   banda **no se redacta**: devuelve error y texto vacío. No estaba previsto y es
   el que sostiene la decisión del punto 1 —si la app deja escribir un número que
   perfora la escala, la banda deja de significar algo—.

   **Y el control de números encontró un error de sí mismo en la primera
   corrida**, que es exactamente para lo que se escribió: leía todos los enteros
   y salteaba los menores a 2100 como heurística de «esto es un artículo o un
   año», así que **`Decreto 2536` salió como importe inventado**. Subir el umbral
   habría movido el problema. La regla que quedó es de formato: **el lector solo
   lee números con dos decimales**, que es como el generador escribe toda cifra y
   como nunca se escribe un identificador. Hay un control propio que comprueba
   las dos mitades —que lea los importes y que **no** lea los números de artículo,
   de decreto ni los años—.

   Una decisión de diseño que conviene no deshacer: **`bandasDe()` deriva las
   bandas del resultado y no de una lista escrita a mano.** Si el resultado no
   trae `partidor`, no hay banda y no hay párrafo. Es la contracara de «un bloque
   por sección del dashboard»: agregar una regla al motor no se puede olvidar en
   la prosa, porque la banda aparece sola y el barrido de la validación la toma.
5. ~~**La interfaz.**~~ **Hecha el 10/8:** `ProsaSection.tsx`, última sección
   del dashboard. Va ahí y no en una pantalla propia —a diferencia del cálculo
   directo y de los mínimos— porque se alimenta del mismo `CalculoResultado`.

   **Y salió con la mini-entrevista que propuso Javier**, que no estaba en este
   plan y es lo que la vuelve usable: la sección **pide los profesionales**,
   porque es lo único que el motor no sabe y no debería saber. La entrevista no
   pregunta cuántos intervinieron ni en qué carácter, y hace bien: la banda del
   art. 21 es la misma haya un letrado o cuatro. Un texto de regulación, en
   cambio, lleva una línea por cada uno.

   **Los atajos —«+ perito médico», «+ apoderado»— escriben un rótulo y no eligen
   una escala.** Un perito médico, uno calígrafo y uno ingeniero cobran el mismo
   5 %-10 %; el atajo ahorra tipeo y por eso el rótulo queda editable. Si el tipo
   cambiara la cuenta, no podría ser un campo de texto libre.

   Lo decidido en el punto 1 se sostiene entero: el campo **arranca vacío**, la
   banda se ve al lado, y un punto fuera de ella deja el campo en rojo, vacía el
   texto y apaga el botón de copiar, las tres cosas a la vez.
6. ~~**Cobertura**: qué procesos tienen modelo y cuáles no.~~ **No hay que
   decidirla: los ocho procesos tienen modelo.** Ver
   [Cobertura](#cobertura-contra-los-ocho-procesos-completa). Si algún día se
   agrega un proceso al motor, el criterio que este punto fijaba sigue valiendo:
   o no ofrece texto, o lo ofrece diciendo que es una adaptación.

---

## Lo que este plan no resuelve

- **Generar el `.docx` directamente.** Dijiste texto plano para pegar, y eso es
  lo correcto: un `.docx` generado trae su propio formato y pelea con la
  plantilla del destino. Si más adelante hace falta, es otro trabajo.
- **La ley aplicable por etapa.** El motor calcula solo por la 27.423 y tres
  modelos aplican también la 21.839. Mientras eso sea así, la sección va en
  hueco. Implementar la 21.839 es otro plan y bastante más grande que este.
- ~~**Los casos que no están en los diez modelos.**~~ Ya no hay: los ocho
  procesos tienen modelo. Lo que sigue sin cubrir son las **variantes adentro de
  un proceso** —el desalojo por intrusión, la ejecución de acuerdo de mediación,
  la del COPREC— que los modelos traen como bloques alternativos marcados con
  `***`. Cuáles de esas ramas ofrece el generador es una decisión del paso 3.
- **Si esto va en Honorio o es una herramienta aparte.** Lo doy por hecho en
  Honorio porque se alimenta de `CalculoResultado`, pero si la idea es que
  también sirva para regulaciones calculadas a mano, es otra discusión.
