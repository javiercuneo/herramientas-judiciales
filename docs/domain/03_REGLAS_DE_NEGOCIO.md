# Las reglas, y quién aplica cada una

> Documento de dominio — Ley 27.423

Inventario de las reglas de la Ley 27.423 que intervienen en el cálculo,
**separadas según quién las aplica**. Esa separación es lo primero porque es lo
que la versión anterior de este documento no hacía, y de ahí salían casi todos
sus errores: presentaba como «reglas implementadas en el sistema» cosas que el
motor no hace y no puede hacer.

Hay tres clases, y confundirlas lleva a creer que la herramienta garantiza cosas
que no garantiza:

| Clase | Quién la aplica | Ejemplo |
|---|---|---|
| **Reglas del motor** | El código, solo | El -30 % del art. 22 sobre la base |
| **Reglas de la base** | **El usuario**, antes de ingresar el monto | El valor del inmueble según el art. 23 inc. a |
| **Tablas de consulta** | Nadie: se leen | Los mínimos del art. 19 |

Y una cuarta categoría que la versión anterior no tenía y hacía falta: **los
pisos que la ley fija y el motor no verifica**. Están al final.

**Cómo se nombran las cosas acá.** Igual que en el
[01](01_PROCESOS.md) y el [02](02_FLUJO_JURIDICO.md): cada cosa con su categoría
jurídica y con la clave del código. Lo verificable está en
`lib/legal/calculate.ts` —y dentro de él, en una sola función,
`resolveReglas()`, que es donde las respuestas se traducen a reglas—.

**Se fueron los números de regla.** Eran 45 identificadores arbitrarios
—declarados como tales— de los que buena parte no correspondía a ninguna regla
del sistema. Ahora cada regla se identifica por la etapa en la que opera y el
artículo que la funda, que es información y no un rótulo.

> **Verificado el 6/8/2026** contra el motor y contra el texto de la ley
> ([00_LEY_27423.md](00_LEY_27423.md)). Lo que se corrigió está al final.

---

## A. Las reglas que aplica el motor

Son estas y ninguna más. Están en el orden en que se aplican, que es parte de la
regla: una quita sobre la base no da lo mismo que la misma quita sobre la escala.

### A.1 — Sobre la base regulatoria

Las tres se multiplican entre sí si concurren. `aplicarReduccionesBase()`.

| Artículo | Qué | Factor | Cuándo |
|---|---|---|---|
| **40** | Locación para vivienda o habitación | × 0,80 | `conocimiento` con `objeto` = `desalojo` y `desalojoVivienda` = `vivienda`; o `homologacion_desocupacion` con `homologacionVivienda` = `vivienda` |
| **22** | Demanda o reconvención íntegramente desestimada | × 0,70 | `sentenciaResultado` = `rechazada`, en `conocimiento`, `ejecucion_sentencia` o `ejecutivo` |
| **22** | Caducidad tratada como demanda desestimada | × 0,70 | `modoTerminacion` = `caducidad` y `caducidadCriterio` = `art22`, en los mismos tres |

Las dos del art. 22 son la misma quita con distinto fundamento: la primera sale
del texto directo, la segunda de asimilar la caducidad a la desestimación, que
es una interpretación declarada —ver A.2, art. 25—.

### A.2 — La escala del art. 21, y lo que la reduce

**La escala.** Siete tramos definidos en UMA. A partir del segundo, la alícuota
**no se aplica sobre el total**:

```
honorario = máximo del grado anterior + (excedente × alícuota del grado actual)

máximo del grado anterior = límite superior de ese grado × su alícuota MÁXIMA
```

| Tramo | Base en UMA | Alícuota | Piso que aporta al siguiente |
|---|---|---|---|
| 1ª | hasta 15 | 22 % a 33 % | 15 × 33 % = 4,95 UMA |
| 2ª | 16 a 45 | 20 % a 26 % | 45 × 26 % = 11,70 UMA |
| 3ª | 46 a 90 | 18 % a 24 % | 90 × 24 % = 21,60 UMA |
| 4ª | 91 a 150 | 17 % a 22 % | 150 × 22 % = 33,00 UMA |
| 5ª | 151 a 450 | 15 % a 20 % | 450 × 20 % = 90,00 UMA |
| 6ª | 451 a 750 | 13 % a 17 % | 750 × 17 % = 127,50 UMA |
| 7ª | más de 750 | 12 % a 15 % | — |

**El piso no es la suma acumulada de los tramos anteriores**, sino el límite del
tramo anterior por su alícuota máxima. Son cosas distintas y dan números
distintos. El detalle, con un ejemplo verificado contra la app, está en el
[02](02_FLUJO_JURIDICO.md#la-escala-del-art-21-cómo-funciona-de-verdad).

**Interpretación declarada:** el párrafo del art. 21 que fija ese piso está
escrito como mínimo —«en ningún caso… inferiores»—. El motor aplica la misma
fórmula al máximo, porque sin acumular el máximo del tramo podría quedar por
debajo del mínimo ya calculado. Es interpretación, no transcripción.

**Lo que reduce la escala.** Multiplicativas entre sí.
`aplicarReduccionesEscala()`.

| Artículo | Qué | Factor | Cuándo |
|---|---|---|---|
| **35** | Un solo abogado por todos los herederos | × 0,50 | `sucesion` con `sucesionUnicoLetrado` = `unico` |
| **41** | Ejecución de sentencia | × 0,50 | `ejecucion_sentencia`, **siempre**, sin preguntar nada |
| **25** | Terminación anormal, o caducidad por criterio del art. 25, antes de la apertura a prueba | × 0,50 | `modos_anormales` + `aperturaPrueba` = `antes`; o `caducidad` + `art25` + `antes` |

**Los dos criterios de la caducidad son alternativos.** Elegido el art. 22 la
quita es de base y el momento de la apertura a prueba deja de jugar; por eso esa
pregunta ni aparece. Hasta el 3/8/2026 el motor aplicaba también el -50 % al
criterio del art. 22, acumulando dos quitas sobre el mismo hecho.

**Dos procesos reemplazan la escala por un porcentaje propio**, en esta misma
etapa:

| Artículo | Proceso | Factor |
|---|---|---|
| **37** | `medida_cautelar` | × 0,25 sin oposición · × 0,50 con oposición o controversia |
| **40** | `homologacion_desocupacion` | × 0,50, **siempre** |

El art. 37 **no establece una reducción**: dice qué porcentaje de la escala se
toma como base. Reducir un 25 % dejaría el 75 %; acá se aplica el 25 %.

### A.3 — Sobre el honorario ya calculado

Multiplicativas entre sí. `aplicarReduccionesFinales()`.

| Artículo | Qué | Factor | Cuándo |
|---|---|---|---|
| **34** / **41** | No se dedujeron excepciones | × 0,90 | `ejecutivo` o `ejecucion_sentencia` con `tuvoExcepciones` = `no` |
| **38** | Acciones posesorias, interdictos o división de bienes comunes en beneficio exclusivo del patrocinado | × 0,80 | `conocimiento` con `posesoriasTipo` = `beneficio` |
| **49** | Acciones sobre derechos de incidencia colectiva con contenido patrimonial | × 0,75 | `conocimiento` con `objeto` = `incidencia_colectiva` |

El art. 38 reduce **el monto de los honorarios**, no la base: la ley lo dice
expresamente.

### A.4 — Lo que se deriva del honorario, o de la base

| Artículo | Qué | Cómo | Sobre qué |
|---|---|---|---|
| **20** | Apoderado | × 1,40 | El honorario del patrocinante **ya reducido** |
| **20** | Procurador | × 0,40 | El honorario del patrocinante **ya reducido** |
| **30** | Segunda instancia | × 0,30 el mínimo · × 0,35 el máximo · × 0,40 si la sentencia fue revocada en todas sus partes a favor del apelante | El honorario de primera instancia del rol elegido |
| **21** | Auxiliares de la Justicia | 5 % a 10 % | La **base en UMA**, ya reducida por A.1 |
| **35** | Partidor | 2 % a 3 % | La **base ya reducida**. Solo `sucesion`, y **siempre**: no se pregunta |

**El 1,4 del apoderado sale del art. 20** aunque el artículo no lo diga con ese
número: el abogado que actúa como apoderado sin patrocinio «percibirá la
asignación total que hubiere correspondido a ambos», o sea el 100 % del
patrocinante más el 40 % del procurador.

**Los tres roles se calculan siempre y son alternativos entre sí.** La pantalla
deja elegir cuál mirar. No se suman: un mismo abogado es patrocinante o
apoderado, no los dos.

**La segunda instancia solo sale en los cuatro procesos de `buildGeneral()`**
—`conocimiento`, `ejecucion_sentencia`, `ejecutivo`, `sucesion`—. La cautelar,
la homologación, el exhorto y el incidente no la devuelven.

### A.5 — Los dos procesos con cálculo propio

**Exhorto — art. 50.** Sin base y sin escala. La entrevista no pregunta el
inciso: devuelve los tres.

| Inciso | Qué comprende | UMA |
|---|---|---|
| a) | Notificaciones o actos semejantes | no menos de 3 |
| b) | Inscripciones y actos registrales: dominios, hijuelas, testamentos, gravámenes, secuestros, embargos, inhibiciones, inventarios, remates, desalojos | 10 a 20 |
| c) | Diligencias de prueba en las que se intervino produciéndolas o controlándolas | 7 a 30 |

**Incidente — 2 % a 20 % de la base**, directo, sin escala y sin reducciones.

> **Ese porcentaje no está en la Ley 27.423, y aplica a todos los incidentes.**
> El art. 29 inc. g divide el incidente en dos etapas pero no fija ninguna
> alícuota. El artículo que sí lo hacía, el **47** —del 8 % al 25 % de lo que
> correspondiera al principal, con piso de 5 UMA—, **fue observado por el
> Decreto 1077/2017 y nunca entró en vigencia**. El 2 %-20 % viene del art. 33
> de la Ley 21.839 y se conserva a falta de norma vigente que lo reemplace.
>
> Es un criterio interpretativo declarado. **No es «para los incidentes que
> tramitan bajo la ley vieja»**: es el criterio que la app usa para todos,
> porque la ley nueva no tiene otro.

### A.6 — Lo que cambia sin cambiar ningún número

**Art. 12 — regulación provisoria.** Si `modoTerminacion` = `provisorios`, **no
se modifica ningún factor**. Lo que cambia es qué se puede afirmar: la ley manda
fijarla «en el mínimo que le hubiere podido corresponder», así que el resultado
se marca `esProvisorio` y la app **deja de enunciar el máximo** —banda de
honorarios, alícuota, auxiliares, segunda instancia— y oculta el reparto por
etapas. Enunciar el máximo sería afirmar un tope que este cálculo no afirma.

Solo existe en `conocimiento`, `ejecucion_sentencia` y `ejecutivo`. En el
sucesorio no se admiten regulaciones provisorias salvo excepción, y en esa
excepción la regulación es definitiva, con mínimo y máximo.

---

## B. Las reglas que determinan la base, y las aplica el usuario

**El motor no calcula la base regulatoria.** La ingresa el usuario, ya
determinada. Estas reglas son de la ley y son obligatorias, pero **quien las
aplica es una persona**, no el código.

Están acá porque son parte del dominio y porque decidir bien la base es lo que
más pesa en el resultado: la escala está validada trescientas veces; la base la
pone alguien.

| Artículo | Qué se reclama | Cómo se determina la base |
|---|---|---|
| **22** | Cobro de sumas de dinero | El monto de la demanda o reconvención; la liquidación si hay sentencia, actualizada por intereses; el monto de la transacción si la hubo |
| **23 inc. a y b** | Inmuebles, muebles o semovientes | Tasación en autos. Si no la hay, valuación fiscal al momento de la regulación **incrementada en un 50 %**. Si esa valuación se reputa inadecuada, el profesional puede estimar el valor, con traslado y eventual pericia |
| **23 inc. c** | Obligaciones de tracto sucesivo | El total de lo reclamado más accesorios hasta el efectivo pago |
| **23 inc. d** | Derechos crediticios | El valor consignado en las escrituras o documentos, **deducidas las amortizaciones** |
| **23 inc. e** | Títulos de renta o acciones | Cotización de la Bolsa de Comercio de Buenos Aires; si no cotiza, informe de entidad bancaria oficial |
| **23 inc. f** | Establecimientos comerciales, industriales o mineros | Activo **menos** pasivo justificado, y al líquido se le suma un **10 % como valor llave** |
| **23 inc. h** | Uso y habitación | 10 % anual del valor del bien × los años del derecho, **sin exceder el 100 %** del valor |
| **24 y 52** | Cualquiera con intereses | Los intereses de la condena **integran la base, bajo pena de nulidad** |
| **39** | Alimentos | Dos años de la cuota que se fije judicialmente |
| **40** | Desalojo | El total de los alquileres del contrato. Si el alquiler es inadecuado, no puede determinarse, o hay intrusión o tenencia precaria: el valor locativo actualizado del inmueble |
| **43** | Desalojo por restitución de inmuebles dados al trabajador en virtud de la relación de trabajo | El **50 % de la última remuneración mensual normal y habitual** según su categoría, **por dos años** |
| **45** | Liquidación del régimen patrimonial del matrimonio | El valor del patrimonio adjudicado |
| **46** | Escrituración | El valor del bien o el monto del boleto, **el mayor** |
| **35** | Sucesión | El valor del patrimonio que se transmite, gananciales incluidos y bienes en otras jurisdicciones del país |
| **37** | Medida cautelar | El monto que se pretende asegurar |
| **21** | Cualquiera con litisconsorcio | La regulación se hace **con relación al interés de cada litisconsorte**, no sobre el total del pleito |

**Esto explica para qué sirven las doce opciones de objeto del juicio.** No
mueven el número —salvo `desalojo` con vivienda, `posesorias_interdictos` con
beneficio exclusivo e `incidencia_colectiva`—: sirven para saber qué monto
ingresar. En el asistente clásico cada opción mostraba la regla completa arriba
del campo; **eso se perdió en parte al migrar y es la primera cosa a recuperar**
(ver [`PLAN_COBERTURA_LEY.md`](../PLAN_COBERTURA_LEY.md), punto 1).

---

## C. Las tablas de mínimos: consulta, no cálculo

Siete categorías en una pantalla aparte, sin entrevista y sin cálculo. Se busca
el concepto y se lee el valor en UMA, convertido a pesos con la UMA vigente.

| Clave | Artículo | Alcance |
|---|---|---|
| `judicial` | 19 inc. a | Asuntos judiciales sin apreciación pecuniaria: de 2 UMA (información sumaria) a 25 UMA (acciones de estado y familia, filiación, restricciones a la capacidad, incidencia colectiva, hábeas corpus, hábeas data). Divorcio 10, adopción y tutela 20 |
| `extrajudicial` | 19 inc. b | Labor extrajudicial: de 0,5 UMA (consulta verbal) a 5 UMA (contratos o estatutos de sociedades y constitución de personas jurídicas) |
| `recursos_csjn` | 31 | Queja por denegación 15 UMA; interposición de recurso extraordinario y similares 20 UMA |
| `contencioso_44` | 44 | Acciones contencioso administrativas 7 UMA; actuaciones administrativas 5 UMA |
| `acciones_48` | 48 | Inconstitucionalidad, amparo, hábeas data, hábeas corpus: 20 UMA, **cuando no puedan regularse por la escala del art. 21** |
| `art58` | 58 | Juicios con apreciación pecuniaria no previstos en otros artículos: conocimiento 10, ejecutivos 6, mediación 2, auxiliares 4 UMA |
| `auxiliares_justicia` | 58, 60 y 61 bis | Peritos y liquidadores de averías 2 UMA; 2 UMA por cada pericia; 1/4 de UMA si el perito aceptó el cargo y el proceso terminó por transacción, avenimiento o conciliación antes del dictamen |

Los arts. 60 y 61 bis son texto con **reforma publicada el 6/3/2026**: el 61 bis
desvincula el honorario del perito de la cuantía del juicio y del porcentaje de
incapacidad que dictamine.

Los valores están en `lib/legal/minimos-data.ts`, cada categoría con su texto
legal completo.

---

## D. Los pisos que la ley fija y el motor no verifica

**Esta es la sección más importante del documento, y la anterior no la tenía.**
Decía lo contrario: afirmaba seis veces que el sistema comprueba los mínimos y
eleva el resultado si queda por debajo. **No lo hace.**

`calculate.ts` no importa `minimos-data.ts` y no hay ninguna comparación de piso
en ningún punto de la cadena. El cálculo termina en el partidor.

O sea que **el número que la app devuelve puede quedar por debajo de un mínimo
legal, y la app no lo va a decir.** Los casos:

| Artículo | Piso que la ley fija | El motor |
|---|---|---|
| **48** | 20 UMA para amparo, hábeas corpus, hábeas data e inconstitucionalidad cuando no se pueda regular por la escala | No compara |
| **44** | 7 UMA para acciones contencioso administrativas, 5 UMA para actuaciones administrativas | No compara |
| **58** | 10 UMA en conocimiento, 6 en ejecutivos, 2 en mediación, 4 para auxiliares | No compara |
| **31** | 20 UMA para recursos ante la CSJN, 15 para la queja | No compara |
| **60** | 2 UMA para peritos y liquidadores de averías en procesos no pecuniarios | No compara |
| **61 bis** | 2 UMA por pericia | No compara |
| **19** | Los mínimos por tipo de asunto sin apreciación pecuniaria | No compara |

**Por qué está así, y no es del todo un descuido.** Los mínimos de los arts. 19,
44 y 48 rigen cuando el asunto **no es susceptible de apreciación pecuniaria**,
que es justamente el caso en que la entrevista no corre: no hay base que
ingresar. Por eso son una pantalla de consulta. Pero los del art. 58 y los de
peritos **sí conviven con un cálculo por escala**, y ahí el piso debería
comprobarse.

**Cómo se compensa hoy:** con un botón. Desde el resultado se puede saltar a la
pantalla de mínimos «para contrastar». El contraste lo hace el usuario.

Está anotado como pendiente. No se cambió nada al descubrirlo, porque
implementar un piso **mueve números** y eso no se hace sin pedido explícito.

---

## La cadena completa

```
BASE que determina e ingresa el USUARIO            sección B
   │                                               (arts. 22, 23, 24, 35, 37,
   │                                                39, 40, 43, 45, 46, 52)
   ▼
 A.1  reducciones sobre la base                    arts. 40, 22
   ▼
 A.2  la escala del art. 21 sobre la base ya reducida
      × reducciones de escala                      arts. 35, 41, 25
      o el porcentaje propio del proceso           arts. 37, 40
   ▼
 A.3  reducciones sobre el honorario               arts. 34/41, 38, 49
   ▼
 A.4  apoderado ×1,40 · procurador ×0,40           art. 20
      segunda instancia 30/35/40 %                 art. 30
      auxiliares 5-10 % de la base                 art. 21
      partidor 2-3 % de la base (solo sucesión)    art. 35
   ▼
 A.6  si es provisorio, solo se enuncia el mínimo  art. 12
   ▼
      [ los pisos de la sección D NO se verifican ]
```

---

## Combinaciones que se dan seguido

| Escenario | Reglas | Efecto |
|---|---|---|
| Ejecución de sentencia sin excepciones | art. 41 escala + art. 34 final | × 0,50 × 0,90 = **0,45** de la escala |
| Ejecución de sentencia por caducidad art. 22, sin excepciones | art. 22 base + art. 41 escala + art. 34 final | base × 0,70, después escala × 0,45 |
| Desalojo de vivienda con sentencia rechazada | art. 40 base + art. 22 base | base × 0,80 × 0,70 = **0,56** |
| Homologación de convenio de vivienda | art. 40 base + art. 40 escala | base × 0,80, escala × 0,50 |
| Sucesión con único letrado | art. 35 escala + art. 35 partidor | escala × 0,50 para el abogado; el partidor va aparte, sobre la base |
| Proceso colectivo terminado por transacción antes de la prueba | art. 25 escala + art. 49 final | escala × 0,50, honorario × 0,75 |

**Se multiplican, no se suman.** «-50 % y -10 %» no es -60 %: es × 0,45, o sea
-55 %.

---

## Qué decía este documento y no era así

Corregido el 6/8/2026 leyendo el motor.

- **Afirmaba seis veces un mecanismo de pisos mínimos que no existe.** Las
  reglas 23, 24, 35, 42, 43 y 44 decían «se aplica como piso; si el cálculo por
  escala arroja un valor inferior, se usa el mínimo», y el paso 9 de la cadena
  decía «verificar mínimos». `calculate.ts` no importa `minimos-data.ts` y no
  hace ninguna comparación. **Es el error más grave que tenía**: hacía creer que
  la herramienta garantiza los mínimos legales.
- **Se anunciaba como «inventario completo de todas las reglas implementadas en
  el sistema» y mezclaba tres cosas distintas.** Las del motor, las que la ley
  pone a cargo del usuario para determinar la base, y las tablas de consulta.
  Doce de las 45 «reglas» describían cosas que el motor no hace: determinar la
  base según el art. 23 (regla 37, que además decía «siempre, para todo proceso
  judicial»), sumar los intereses (38), calcular la base del desalojo laboral
  (39), la de la liquidación patrimonial (40) o la de la escrituración (41).
- **La homologación de desocupación estaba clasificada como reducción sobre
  honorarios finales.** El motor la aplica sobre la escala. El número da igual,
  pero la etapa es justamente lo que este documento existe para decir. Y la
  regla 14 decía que el 50 % aplica «cuando **no** es de vivienda»: aplica
  siempre.
- **La regla del incidente decía «cuando se trata de un incidente tramitado bajo
  la antigua Ley 21.839».** El motor lo aplica a todos los incidentes, y no por
  descuido: el art. 47 de la ley nueva quedó observado y no hay otra escala.
- **La tabla del exhorto tenía los tres incisos inventados** —«exhorto simple
  sin trabas», «con trabas cautelares», «con ejecución»—. El art. 50 distingue
  notificaciones, actos registrales y diligencias de prueba.
- **El art. 30 decía que el 40 % aplica si la sentencia se revoca «total o
  parcialmente».** El artículo lo reserva a la revocación **en todas sus partes
  en favor del apelante**.
- **El partidor figuraba como condicional** —«cuando interviene un partidor»—.
  El motor lo calcula siempre en la sucesión, sin preguntar.
- **El art. 43 se describía como «desalojo laboral (despido sin causa, etc.)».**
  No tiene que ver con el despido: es el desalojo por restitución de inmuebles
  dados al trabajador en virtud de la relación de trabajo.
- **Los modos anormales del art. 25 incluían la conciliación.** El artículo
  enumera allanamiento, desistimiento y transacción.
- **El art. 23 inc. d se resumía como «capital + intereses adeudados».** Es el
  valor de las escrituras o documentos **deducidas las amortizaciones**.
- **Los 45 números de regla eran identificadores arbitrarios**, declarados como
  tales, y buena parte no correspondía a ninguna regla del sistema.
- **El documento entero estaba sin tildes**, y tenía dos palabras en inglés
  filtradas en la regla 25.
