# El recorrido y el orden del cálculo

> Documento de dominio — Ley 27.423

[01_PROCESOS.md](01_PROCESOS.md) describe **cada proceso por separado**: qué
pregunta y qué hace con las respuestas. Este documento describe **lo que los
ocho tienen en común**: el recorrido de la entrevista de punta a punta y, sobre
todo, **el orden exacto en que el motor aplica las reglas**.

Ese orden es lo más importante que hay acá. Una quita del 30 % sobre la base no
da lo mismo que la misma quita sobre la escala, porque la escala es progresiva:
reducir la base puede hacerla caer a un tramo con alícuota más alta. **El orden
no es una decisión de implementación, es parte de la regla jurídica.**

La ley rige los honorarios de abogados, procuradores y auxiliares de la
Justicia **nacional y federal** (art. 1°). No es una ley de la Ciudad.

**Cómo se nombran las cosas acá.** Igual que en el 01: cada cosa aparece con su
categoría jurídica y con la clave que la representa en el código, porque hacen
falta las dos —una para discutir si la regla es correcta, otra para encontrar
dónde está escrita—. Lo verificable está en dos archivos del repositorio
[`javiercuneo/honorio`](https://github.com/javiercuneo/honorio):
`lib/wizard/wizard-schema.ts` (qué se pregunta) y `lib/legal/calculate.ts` (qué
se hace con la respuesta).

> **Verificado el 6/8/2026** contra el motor, contra el texto de la ley
> ([00_LEY_27423.md](00_LEY_27423.md)) y contra una corrida real en la app.
> Lo que se corrigió está al final, en «Qué decía este documento y no era así».

---

## Mapa general del recorrido

```
PASO 0 · UMA                          los ocho procesos, sin excepción
   │
   ▼
PASO 1 · TIPO DE PROCESO              ocho opciones
   │
   ├── exhorto ─────────────────────────────────────────► RESULTADO
   │
   ├── incidente ───────────────────────────► BASE ─────► RESULTADO
   │
   ├── medida_cautelar ──── ¿oposición? ────► BASE ─────► RESULTADO
   │
   ├── homologacion_
   │   desocupacion ─────── ¿vivienda? ─────► BASE ─────► RESULTADO
   │
   ├── sucesion ─────────── ¿único letrado? ► BASE ─────► RESULTADO
   │
   ├── conocimiento ─────── ¿terminación? ──► ¿objeto? ─► BASE ──► RESULTADO
   │
   └── ejecucion_sentencia
       ejecutivo ────────── ¿terminación? ──► ¿excepciones? ► BASE ► RESULTADO
```

Dos cosas que se leen mal si no están dichas:

- **La terminación se pregunta antes que el objeto**, y la base siempre al
  final. Cuando se pide la base ya se sabe si va a sufrir una reducción, y la
  app lo puede decir mientras se la ingresa.
- **Los mínimos arancelarios no están en este mapa.** No son un paso ni un tipo
  de proceso: son una pantalla de consulta accesible desde cualquier punto. Ver
  la sección propia, más abajo.

---

## Paso 0 — El valor de la UMA

**Qué ocurre.** La app propone el último valor conocido y el usuario lo
confirma o lo corrige. El campo trae al lado la norma que lo fijó, con enlace.

**De dónde sale ese valor.** De `data/uma.json`, un archivo versionado en el
repositorio, no de un pedido que hace el navegador del visitante. La planilla
que el autor mantiene la lee **el build** (`scripts/actualizar-uma.mjs`), que
agrega una entrada cuando el valor cambia. Cada entrada guarda el valor, la
norma que lo fijó, el enlace y la fecha de captura.

Que sea una lista y no un solo número es deliberado: es lo que permite que un
cálculo de hoy siga siendo reproducible dentro de dos años.

**Qué queda guardado.** `valorUMA`, en pesos.

**Por qué importa.** No es un dato de contexto: **es la unidad en la que está
escrita toda la ley**. Los mínimos se expresan en UMA y la escala del art. 21
está definida en tramos de UMA, así que lo primero que hace el motor con la base
es dividirla por la UMA para saber en qué tramo cae. Cambiar la UMA cambia el
tramo, y cambiar el tramo cambia la alícuota. Un error acá se propaga a todo.

---

## Paso 1 — El tipo de proceso

**Ocho opciones**, no más. Cada una decide qué se pregunta después: la lista de
pasos de cada proceso está declarada en una sola constante,
`PROCESS_STEP_MAP`.

| Clave | Proceso | Artículo que lo gobierna |
|---|---|---|
| `conocimiento` | Juicio de conocimiento, ordinario o sumarísimo | 21 y ss. |
| `ejecucion_sentencia` | Ejecución de sentencia, de honorarios o de acuerdos | 41 |
| `ejecutivo` | Juicio ejecutivo y ejecuciones especiales | 34 |
| `sucesion` | Proceso sucesorio | 35 |
| `medida_cautelar` | Medidas cautelares, autónomas o incidentales | 37 |
| `homologacion_desocupacion` | Homologación de convenio de desocupación | 40 |
| `exhorto` | Diligenciamiento de exhortos de la Ley 22.172 | 50 |
| `incidente` | Incidentes, incluidos los beneficios de litigar sin gastos | 29 inc. g |

---

## Paso 2 — Las contingencias procesales

Condicional: solo aparece lo que el proceso elegido necesita.

### 2a. Modo de terminación — `modoTerminacion`

Se pregunta en `conocimiento`, `ejecucion_sentencia` y `ejecutivo`. Cuatro
opciones, y cada una abre —o no— una pregunta más.

**Sentencia** (`sentencia`) → abre `sentenciaResultado`:

- **Admitida** (`admitida`): sin efecto. La base entra completa.
- **Rechazada** (`rechazada`): **la base se reduce un 30 %** antes de entrar a
  la escala (art. 22: «si fuere íntegramente desestimada la demanda o la
  reconvención… disminuido en un 30 %»).

**Modos anormales** (`modos_anormales`) —allanamiento, desistimiento,
transacción— → abre `aperturaPrueba`:

- **Antes** (`antes`): **la escala se aplica al 50 %** (art. 25).
- **Después** (`despues`): la escala completa.

**Caducidad de instancia** (`caducidad`) → abre `caducidadCriterio`. La ley no
la menciona como categoría propia, así que la app deja elegir el criterio:

- **Como demanda desestimada** (`art22`): la base se reduce un 30 %. **No
  vuelve a preguntar por la apertura a prueba**, y esto no es un olvido: elegido
  el art. 22 la quita es de base y el momento de la apertura deja de jugar. Los
  dos criterios son alternativos, no acumulables.
- **Como modo anormal** (`art25`): abre `aperturaPrueba` y se comporta como los
  modos anormales.

**Honorarios provisorios** (`provisorios`) → no abre nada. **No es una
reducción**: no cambia ningún factor. Cambia qué se puede afirmar. El art. 12
manda fijarlos «en el mínimo que le hubiere podido corresponder», así que el
resultado se marca `esProvisorio` y **la app deja de enunciar el máximo** en
todos lados —banda de honorarios, alícuota, auxiliares, segunda instancia— y
oculta el reparto por etapas. Mostrar el máximo sería afirmar un tope que este
cálculo no está afirmando.

### 2b. Excepciones — `tuvoExcepciones`

Solo en `ejecucion_sentencia` y `ejecutivo`.

- **Sin excepciones** (`no`): **-10 % sobre el honorario ya calculado**. Es un
  factor final, no de escala. Fundamento: art. 34 para el ejecutivo, art. 41
  para la ejecución de sentencia.
- **Con excepciones** (`si`): sin reducción.

### 2c. Único letrado — `sucesionUnicoLetrado`

Solo en `sucesion`.

- **Un solo abogado para todos los herederos** (`unico`): **la escala se aplica
  al 50 %**, mínimo y máximo (art. 35).
- **Varios abogados** (`varios`): escala completa.

### 2d. Oposición — `medidaOposicion`

Solo en `medida_cautelar`. **No es una reducción: es qué porcentaje de la escala
se toma como base.**

- **Sin oposición** (`sin`): **el 25 %** de la escala del art. 21.
- **Con oposición o controversia** (`con`): **el 50 %**.

Art. 37: «aplicándose como base el 25 % de la escala del artículo 21; salvo
casos de controversia u oposición, en que la base se elevará al 50 %».

La diferencia con «una reducción del 25 %» no es de redacción: reducir un 25 %
dejaría el 75 %. Acá se aplica el 25 %.

### 2e. Tipo de convenio — `homologacionVivienda`

Solo en `homologacion_desocupacion`. Dos reglas del art. 40, en etapas
distintas:

- **Alquiler para vivienda** (`vivienda`): **la base se reduce un 20 %** antes
  de la escala.
- **Demás casos** (`otros`): la base entra completa.
- **En los dos casos**, sobre la escala se aplica el **50 %** por tratarse de
  una homologación. No depende de la respuesta.

---

## Paso 3 — El objeto del juicio

Solo en `conocimiento`. Se pregunta «¿qué se reclama en el juicio?» (`objeto`,
que el motor recibe como `objetoBase`). Doce opciones.

**Nueve de las doce no mueven ningún número.** Están para orientar el paso
siguiente: cada una trae en pantalla el artículo que dice cómo se arma la base
en ese tipo de juicio. **La base la calcula y la ingresa el usuario**; el motor
no la deriva de ninguna de estas reglas.

| Clave | Qué se reclama | Cómo se arma la base | Artículo |
|---|---|---|---|
| `sumas_dinero` | Cobro de sumas de dinero | Monto de la demanda; la liquidación si hay sentencia; el monto de la transacción si la hubo | 22, 24 |
| `inmuebles` | Bienes muebles o inmuebles | Tasación en autos; si no, valuación fiscal + 50 %, con posibilidad de estimación del profesional y pericia | 23 inc. a y b |
| `derechos_crediticios` | Derechos crediticios | Valor de las escrituras o documentos, deducidas las amortizaciones | 23 inc. d |
| `titulos_acciones` | Títulos de renta y acciones | Cotización en la Bolsa de Comercio; si no cotiza, informe de banco oficial | 23 inc. e |
| `establecimientos` | Establecimientos comerciales, industriales o mineros | Activo − pasivo, y al líquido se le suma un 10 % como valor llave | 23 inc. f |
| `uso_habitacion` | Derecho de uso o habitación | 10 % anual del valor del bien × años del derecho, sin exceder el 100 % del valor | 23 inc. h |
| `escrituracion` | Escrituración | Valor del bien o monto del boleto, el mayor | 46 |
| `familia_alimentos` | Alimentos | Dos años de la cuota que se fije | 39 |
| `familia_liquidacion` | Liquidación del régimen patrimonial del matrimonio | Valor del patrimonio adjudicado | 45 |

**Las tres que sí mueven el número:**

| Clave | Sub-pregunta | Efecto |
|---|---|---|
| `desalojo` | `desalojoVivienda`: `vivienda` / `civil` / `laboral` | Solo `vivienda` reduce la base un 20 % (art. 40). `civil` no hace nada; `laboral` tampoco —lo que su descripción indica es cómo armar la base: el 50 % de la última remuneración mensual por dos años, art. 43—, cuenta que también hace el usuario |
| `posesorias_interdictos` | `posesoriasTipo`: `beneficio` / `demas` | Solo `beneficio` reduce **el honorario** un 20 % (art. 38). La reducción es final, no de base |
| `incidencia_colectiva` | ninguna | Reduce el honorario un 25 % (art. 49) |

---

## Paso 4 — La base regulatoria

El usuario ingresa el monto. Se pide **sin reducciones**: las que correspondan
las aplica el motor en el paso siguiente. Ingresar la base ya reducida es la
forma más fácil de duplicar una quita.

Validación: mayor a cero.

**Las reducciones que operan sobre la base**, y que se aplican recién al
calcular:

| Condición | Factor | Artículo |
|---|---|---|
| Desalojo para vivienda (en `conocimiento`) | × 0,80 | 40 |
| Homologación de convenio para vivienda | × 0,80 | 40 |
| Demanda íntegramente desestimada | × 0,70 | 22 |
| Caducidad tratada como demanda desestimada | × 0,70 | 22 |

Se multiplican entre sí si concurren.

---

## Paso 5 — El cálculo, en orden

Este es el orden exacto para los cuatro procesos que pasan por `buildGeneral()`
—`conocimiento`, `ejecucion_sentencia`, `ejecutivo` y `sucesion`—. Los otros
cuatro son variantes más cortas del mismo esqueleto.

```
 1. REDUCCIONES SOBRE LA BASE                    arts. 40, 22
    baseFinal = baseValor × factores          (multiplicativos)

 2. LA BASE SE EXPRESA EN UMA
    baseEnUMA = baseFinal / valorUMA

 3. LA ESCALA DEL ART. 21
    Se ubica el tramo según baseEnUMA y se aplica la fórmula
    del piso (ver abajo: no es un porcentaje sobre el total)

 4. REDUCCIONES SOBRE LA ESCALA                  arts. 35, 41, 25
    factorEscala = producto de los que apliquen
      × 0,50  único letrado en sucesión           art. 35
      × 0,50  ejecución de sentencia (siempre)    art. 41
      × 0,50  terminación anormal o caducidad
              art. 25, antes de la prueba         art. 25

 5. REDUCCIONES SOBRE EL HONORARIO               arts. 34, 38, 49
    factorFinal = producto de los que apliquen
      × 0,90  ejecutivo o ejecución sin
              excepciones                         arts. 34 / 41
      × 0,80  posesorias en beneficio exclusivo   art. 38
      × 0,75  proceso colectivo                   art. 49

    honorario del patrocinante = escala × factorEscala × factorFinal

 6. APODERADO      = patrocinante × 1,40          art. 20
 7. PROCURADOR     = patrocinante × 0,40          art. 20
 8. AUXILIARES     = 5 % a 10 % de baseEnUMA      art. 21
 9. SEGUNDA INST.  = 30 % / 35 % / 40 % del
                     honorario de 1ª instancia    art. 30
10. PARTIDOR       = 2 % a 3 % de baseFinal       art. 35 (solo sucesión)

11. TODO SE MULTIPLICA POR LA UMA PARA DARLO EN PESOS
```

Los pasos 6, 7 y 9 se calculan **sobre el honorario ya reducido**, al final de
la cadena, no sobre la escala pura. Los pasos 8 y 10 se calculan sobre la
**base ya reducida** por el paso 1, no sobre el honorario.

---

### La escala del art. 21, cómo funciona de verdad

Es la parte que más se malinterpreta, así que va con el detalle.

La escala tiene siete tramos, definidos en UMA:

| Tramo | Base en UMA | Alícuota |
|---|---|---|
| 1ª | hasta 15 | 22 % a 33 % |
| 2ª | 16 a 45 | 20 % a 26 % |
| 3ª | 46 a 90 | 18 % a 24 % |
| 4ª | 91 a 150 | 17 % a 22 % |
| 5ª | 151 a 450 | 15 % a 20 % |
| 6ª | 451 a 750 | 13 % a 17 % |
| 7ª | más de 750 | 12 % a 15 % |

**A partir del segundo tramo, la alícuota no se aplica sobre el total.** El
art. 21 dice:

> «En ningún caso los honorarios podrán ser inferiores al **máximo del grado
> inmediato anterior** de la escala, con más el incremento por aplicación al
> excedente de la alícuota que corresponde al grado siguiente.»

O sea, dos sumandos:

```
honorario = máximo del grado anterior  +  (excedente × alícuota del grado actual)

donde:
  máximo del grado anterior = límite superior del grado anterior
                              × su alícuota MÁXIMA
  excedente                 = base en UMA − límite superior del grado anterior
```

Los seis pisos, que son constantes del motor:

| A partir de | Piso | De dónde sale |
|---|---|---|
| 16 UMA | 4,95 UMA | 15 × 33 % |
| 46 UMA | 11,70 UMA | 45 × 26 % |
| 91 UMA | 21,60 UMA | 90 × 24 % |
| 151 UMA | 33,00 UMA | 150 × 22 % |
| 451 UMA | 90,00 UMA | 450 × 20 % |
| 751 UMA | 127,50 UMA | 750 × 17 % |

**El piso es el límite del tramo anterior multiplicado por la alícuota máxima de
ese tramo. No es la suma acumulada de todos los tramos previos.** Son dos cosas
distintas y dan números distintos: acumular tramo por tramo hasta 45 UMA daría
4,95 + (45 − 15) × 26 % = 12,75 UMA, no 11,70.

**Ejemplo verificado** —los mismos números que la app muestra en pantalla—.
Base de $50.000.000 con la UMA a $102.076:

```
base en UMA          50.000.000 / 102.076        = 489,83 UMA
tramo                                              6ª (451-750), 13 % a 17 %
piso                 450 × 20 %  = 90 UMA        = $9.186.840
excedente            489,83 − 450                = 39,83 UMA
incremento mínimo    39,83 × 13 % = 5,18 UMA     = $528.554
                                                   ─────────────
honorario mínimo     90 + 5,18 = 95,18 UMA       = $9.715.394
honorario máximo     90 + 39,83 × 17 % = 96,77   = $9.878.026
```

Leer la alícuota como si fuera directa sobre la base daría $6.500.000
—50.000.000 × 13 %—, que es un 33 % menos. **Por eso la app muestra ese número
al lado, cuando difiere: para que se vea que la escala no es un porcentaje
plano.** En el primer tramo los dos coinciden y la comparación no se muestra,
porque ahí diría algo falso.

**Una decisión interpretativa que conviene tener presente.** El párrafo del
art. 21 está escrito como un **piso** —«en ningún caso… inferiores»—, o sea que
literalmente habla del mínimo. El motor aplica la misma fórmula al máximo.
Tiene que hacer algo así: sin acumular, el máximo del tramo (50.000.000 × 17 %)
podría quedar por debajo del mínimo ya calculado, que es un absurdo. Pero es una
interpretación, no una transcripción, y está adoptada como tal.

---

### Cada componente del resultado

**Patrocinante.** Es el honorario que sale directamente de la escala, con todas
las reducciones aplicadas.

**Apoderado — × 1,40.** El art. 20 dice que el abogado que actúa como apoderado
sin patrocinio «percibirá la asignación total que hubiere correspondido a
ambos»: el 100 % del patrocinante más el 40 % del procurador. De ahí el 1,4. Se
aplica al final, sobre el honorario ya reducido.

**Procurador — × 0,40.** Art. 20, primera oración: «los honorarios de los
procuradores se fijarán en un cuarenta por ciento (40 %) de los que por esta ley
corresponda fijar a los abogados patrocinantes». Es el 40 % **del honorario del
patrocinante**, no de la base. También al final.

**Auxiliares de la Justicia — 5 % a 10 %.** Se calculan sobre la **base
expresada en UMA**, no sobre los honorarios: es un porcentaje de la cuantía del
proceso. Y sobre la base **ya reducida** por el paso 1. Es un rango único: el
art. 21 no distingue categorías de auxiliar en este punto, y el motor tampoco.

El mismo párrafo del art. 21 prevé que ante labores «altamente complejas o
extensas» el juez pueda, por auto fundado, superar el 10 %. **El motor no lo
contempla**: muestra la banda, no la excepción.

**Segunda instancia — art. 30.** No es opcional y no se calcula por fuera: sale
en la misma pasada, para el rol que esté seleccionado en pantalla.

- Mínimo: 30 % del honorario de primera instancia.
- Máximo: 35 %.
- Máximo si la sentencia fue revocada en todas sus partes a favor del apelante:
  40 %.

**Se calcula en los cuatro procesos de `buildGeneral()` y en ninguno más.** La
medida cautelar, la homologación, el exhorto y el incidente no la devuelven.

**Partidor — 2 % a 3 %.** Solo en `sucesion`, y sin preguntar nada. Art. 35,
última parte: los honorarios del abogado o abogados partidores en conjunto se
fijan sobre el valor del haber a dividirse.

**La cadena.** El motor no devuelve solo los números: devuelve también la lista
de transformaciones que los produjeron, cada una con su artículo, el valor antes
y el valor después. Es lo que la app muestra como «por qué», y es parte del
resultado, no un adorno de la interfaz.

**No hay un total general.** El motor no suma los honorarios de los distintos
roles y la app no muestra esa suma. Sumarlos no significa nada: son alternativos
entre sí —un mismo abogado es patrocinante o apoderado, no los dos— y quien los
cobra es una persona distinta en cada caso.

---

### Lo que la pantalla agrega sobre el resultado

Dos cosas que no son reglas de cálculo pero sí aparecen, y conviene saber de
dónde salen.

**Reparto por etapas.** El honorario se muestra completo, en 2/3 y en 1/3. Sale
del art. 29, que divide el proceso en tercios: la demanda y su contestación un
tercio, la prueba otro, y las demás diligencias hasta la sentencia el tercero.
**El motor no decide en qué etapa quedó el proceso** —no lo pregunta—: muestra
las tres fracciones y el usuario elige.

**Reparto entre dos profesionales.** Una calculadora auxiliar: toma el importe
de la etapa elegida y lo divide entre dos, con una proporción ajustable que
arranca en 60/40. **No sale de ningún artículo.** Es una cuenta que en el
juzgado se hace igual, hecha acá para no hacerla aparte. Los controles no se
imprimen; las dos cifras que producen, sí.

En regulaciones provisorias no se muestra ninguna de las dos.

---

## Los cuatro procesos con cálculo propio

### Exhorto — art. 50

No hay base ni escala. Los honorarios están fijados directamente en UMA y la
entrevista **no pregunta el inciso**: muestra los tres y el usuario lee cuál
describe la diligencia que hizo.

| Inciso | Qué comprende | UMA |
|---|---|---|
| a) | Notificaciones o actos semejantes | no menos de 3 |
| b) | Inscripciones y actos registrales: dominios, hijuelas, testamentos, gravámenes, secuestros, embargos, inhibiciones, inventarios, remates, desalojos | 10 a 20 |
| c) | Diligencias de prueba en las que se intervino produciéndolas o controlándolas | 7 a 30 |

No devuelve honorarios por rol, ni auxiliares, ni segunda instancia.

### Incidente — art. 29 inc. g

La base se expresa en UMA y se aplica un rango del **2 % al 20 %**, directo, sin
pasar por la escala del art. 21 y sin ninguna reducción.

> **Ese 2 %-20 % no está en la Ley 27.423.** El art. 29 inc. g divide el
> incidente en dos etapas —el planteo que lo origina y el desarrollo hasta su
> conclusión— pero no fija ningún porcentaje. El artículo que sí lo hacía, el
> **47** —incidentes y tercerías entre el 8 % y el 25 % de lo que correspondiera
> al principal, con un piso de 5 UMA—, **fue observado por el Decreto 1077/2017
> y nunca entró en vigencia**. El 2 %-20 % viene del art. 33 de la Ley 21.839, y
> se conserva como criterio a falta de norma vigente que lo reemplace. Es una
> interpretación declarada, no una transcripción.

No devuelve apoderado, procurador, auxiliares ni segunda instancia.

### Medida cautelar — art. 37

```
base (el monto que se pretende asegurar)
   │
   ▼  no hay reducción de base
escala completa del art. 21
   │
   ▼  × 0,25 sin oposición   ·   × 0,50 con oposición
honorario del patrocinante
   │
   ├── apoderado  × 1,40
   ├── procurador × 0,40
   └── auxiliares  5 % a 10 % de la base en UMA
                   (sobre la base, sin el factor del art. 37)
```

Sin segunda instancia, sin partidor.

### Homologación de convenio de desocupación — art. 40

```
base (el total de los alquileres del contrato)
   │
   ▼  × 0,80 si el convenio es de vivienda
baseFinal
   │
   ▼
escala del art. 21 sobre baseFinal
   │
   ▼  × 0,50 siempre, por ser homologación
honorario del patrocinante
   │
   ├── apoderado  × 1,40
   ├── procurador × 0,40
   └── auxiliares  5 % a 10 % de baseFinal en UMA
```

Las dos reglas son del mismo artículo pero operan en etapas distintas: el 20 %
sobre la base, el 50 % sobre la escala. Sin segunda instancia, sin partidor.

---

## Los mínimos arancelarios

Ruta independiente, accesible desde cualquier punto de la entrevista y desde el
resultado. **No hay base, no hay escala, no hay reducciones**: se busca el
concepto y se lee el número en UMA, convertido a pesos con la UMA vigente.

Siete categorías, en el orden del articulado. Las tres primeras son las que no
tienen monto, que es el caso por el que se consulta esta pantalla: cuando la
escala del art. 21 no se puede aplicar.

| Clave | Artículo | Alcance |
|---|---|---|
| `judicial` | 19 inc. a | Asuntos judiciales sin apreciación pecuniaria. De 2 UMA (información sumaria) a 25 UMA (acciones de estado y familia, filiación, restricciones a la capacidad, incidencia colectiva, hábeas corpus y hábeas data). Divorcio 10, adopción y tutela 20 |
| `extrajudicial` | 19 inc. b | Labor extrajudicial. De 0,5 UMA (consulta verbal, gastos de estudio) a 5 UMA (contrato o estatuto de sociedades y constitución de personas jurídicas) |
| `recursos_csjn` | 31 | Queja por denegación 15 UMA; interposición de recurso extraordinario y similares 20 UMA |
| `contencioso_44` | 44 | Acciones contencioso administrativas 7 UMA; actuaciones administrativas 5 UMA |
| `acciones_48` | 48 | Inconstitucionalidad, amparo, hábeas data, hábeas corpus: 20 UMA, cuando no puedan regularse por la escala del art. 21 |
| `art58` | 58 | Juicios con apreciación pecuniaria no previstos en otros artículos: conocimiento 10, ejecutivos 6, mediación 2, auxiliares 4 UMA |
| `auxiliares_justicia` | 58, 60 y 61 bis | Peritos y liquidadores de averías 2 UMA; 2 UMA por cada pericia; 1/4 de UMA si el perito aceptó el cargo y el proceso terminó por transacción, avenimiento o conciliación antes del dictamen |

Los arts. 60 y 61 bis son texto **con reforma publicada el 6/3/2026**: el 61 bis
desvincula el honorario del perito de la cuantía del juicio y del porcentaje de
incapacidad que dictamine.

Los valores están en `lib/legal/minimos-data.ts`, cada categoría con el texto
legal completo.

---

## Matriz de reducciones

| Proceso | Sobre la base | Sobre la escala | Sobre el honorario | 2ª instancia |
|---|---|---|---|---|
| `conocimiento` | × 0,80 desalojo vivienda · × 0,70 demanda desestimada o caducidad art. 22 | × 0,50 art. 25 antes de la prueba | × 0,80 posesorias en beneficio · × 0,75 proceso colectivo | sí |
| `ejecucion_sentencia` | × 0,70 demanda desestimada o caducidad art. 22 | × 0,50 art. 41 **siempre** · × 0,50 art. 25 | × 0,90 sin excepciones | sí |
| `ejecutivo` | × 0,70 demanda desestimada o caducidad art. 22 | × 0,50 art. 25 | × 0,90 sin excepciones | sí |
| `sucesion` | ninguna | × 0,50 único letrado | ninguna | sí |
| `medida_cautelar` | ninguna | × 0,25 o × 0,50 según oposición | ninguna | no |
| `homologacion_desocupacion` | × 0,80 si es vivienda | × 0,50 **siempre** | ninguna | no |
| `exhorto` | no aplica | no aplica | no aplica | no |
| `incidente` | ninguna | no usa el art. 21 | ninguna | no |

Dentro de cada columna, los factores se **multiplican** entre sí. No se suman
los porcentajes.

---

## Lo que la ley dice y el motor no hace

Anotado acá para que no se confunda «no está implementado» con «no corresponde».
El detalle y las prioridades están en
[08_DEUDA_TECNICA_FUNCIONAL.md](08_DEUDA_TECNICA_FUNCIONAL.md).

- **Art. 39, segundo párrafo.** En aumento, disminución, cesación o
  coparticipación de alimentos, la base es la diferencia por dos años **y se
  aplica la escala de los incidentes**, no la del art. 21. La app trata todo
  `familia_alimentos` por la escala general.
- **Art. 41, última oración.** Las actuaciones posteriores a la ejecución
  propiamente dicha se regulan en el 40 % de la escala. No está implementado.
- **Art. 42.** El gestor del art. 48 CPCCN y la gestión útil incrementan un 4 %
  sobre los fondos que resulten disponibles. No está implementado.
- **Art. 21, párrafo de auxiliares.** El juez puede superar el 10 % por auto
  fundado ante labores altamente complejas o extensas. La app muestra la banda.
- **Art. 29.** La división en etapas se muestra como fracciones (1/3, 2/3) pero
  el motor no pregunta en qué etapa quedó el proceso ni la decide.
- **Art. 21, litisconsorcio.** «Si hubiera litisconsorcio la regulación se hará
  con relación al interés de cada litisconsorte.» No se pregunta.

---

## Siete cosas que conviene no olvidar

1. **La escala no es un porcentaje plano.** A partir del segundo tramo hay un
   piso —el límite del tramo anterior por su alícuota máxima— más la alícuota
   del tramo actual sobre el excedente.
2. **Los auxiliares no se calculan sobre los honorarios**, sino sobre la base
   del proceso expresada en UMA. Es un porcentaje de la cuantía.
3. **Las reducciones se multiplican, no se suman.** Ejecución de sentencia sin
   excepciones es × 0,50 × 0,90 = 0,45, no «60 % menos».
4. **El procurador es el 40 % del patrocinante**, no de la base ni del total, y
   se calcula después de todas las reducciones.
5. **La segunda instancia se calcula sobre el honorario de primera**, no sobre
   la base, y solo en cuatro de los ocho procesos.
6. **En provisorios solo rige el mínimo.** No se enuncia el máximo ni el reparto
   por etapas: el art. 12 fija un piso, no una estimación.
7. **La UMA es la unidad de toda la ley.** Cambiarla no reescala los montos de
   forma proporcional: puede cambiar el tramo de la escala, y con él la
   alícuota.

---

## Qué decía este documento y no era así

Corregido el 6/8/2026 leyendo el motor, no el documento.

- **«El sistema carga la UMA desde una hoja de Google Sheets; si falla usa
  92.482.»** Dejó de ser cierto el 5/8: la planilla la lee el build y el valor
  vive versionado en `data/uma.json`, con su norma y su fecha. El navegador del
  visitante no le pide nada a nadie.
- **«El usuario selecciona entre 10 opciones» de tipo de proceso.** Son ocho.
  Los mínimos no son un tipo de proceso.
- **La explicación de la escala estaba mal, y su propia aritmética no cerraba.**
  Presentaba el piso como una suma acumulada tramo por tramo y escribía
  «4,95 + 7,80 = 11,70», que además de no ser lo que hace el motor da 12,75. El
  piso es el límite del tramo anterior por su alícuota máxima: 45 × 26 % = 11,70.
- **El fundamento de la medida cautelar decía que era el art. 21 «que acota a
  los auxiliares una banda del 5 % al 10 %», y aclaraba que antes se lo
  atribuía al art. 37.** Una corrección pegada en la sección equivocada, que
  terminaba negando el artículo correcto: la cautelar es el art. 37.
- **«Art. 19 inc. a: hasta 25 UMA (divorcio, adopción, hábeas corpus).»** El
  divorcio son 10 UMA y la adopción 20. El hábeas corpus aparece en dos lugares
  distintos: 25 UMA por el art. 19 inc. a y 20 UMA por el art. 48.
- **El objeto del juicio se nombraba solo en castellano**, sin la clave del
  código, y sin decir que nueve de las doce opciones no mueven ningún número.
- **No se decía en qué procesos hay segunda instancia** —el diagrama la ponía
  en el flujo general sin más—, ni que el partidor sale siempre en la sucesión.
- **No estaban el reparto por etapas ni el reparto entre profesionales**, que
  son dos de las tres cosas que la pantalla del resultado muestra.
- **El documento entero estaba sin tildes**, contra la convención del
  repositorio.
