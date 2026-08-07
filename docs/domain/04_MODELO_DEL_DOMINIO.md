# El modelo del dominio

> Documento de dominio — Ley 27.423

Las entidades del dominio: qué es cada una en la ley y con qué tipo la
representa el código. Es el documento donde los dos vocabularios se cruzan.

El [01](01_PROCESOS.md) va proceso por proceso, el [02](02_FLUJO_JURIDICO.md)
por el recorrido y el orden del cálculo, el [03](03_REGLAS_DE_NEGOCIO.md) por
las reglas y quién aplica cada una. Este va por **las cosas**: la base, la
escala, los roles, la UMA.

Los tipos están en `lib/legal/types.ts`, salvo donde se indique otra cosa.

> **Verificado el 7/8/2026** contra el motor y contra el texto de la ley
> ([00_LEY_27423.md](00_LEY_27423.md)). Lo que se corrigió está al final, y era
> mucho: seis de las ocho citas de la tabla de bases apuntaban a un artículo que
> trata otra cosa, y el pie del documento invocaba un decreto reglamentario
> inexistente.

---

## 1. La UMA

**Qué es.** La Unidad de Medida Arancelaria del art. 19: equivale al **3 % de la
remuneración básica del cargo de juez federal de primera instancia**, y la Corte
Suprema la publica mensualmente.

No es un detalle de actualización monetaria: **es la unidad en la que está
escrita la ley**. La escala del art. 21 está definida en tramos de UMA y todos
los mínimos se expresan en UMA. La base en pesos existe para convertirse a UMA.

**Cómo se representa.** `ValorUMA`, en `lib/legal/uma.ts`:

| Campo | Qué guarda |
|---|---|
| `valor` | El valor en pesos |
| `fuente` | La norma que lo fijó, tal como la publica la Corte |
| `url` | Enlace a esa norma |
| `capturado` | Fecha en que el build lo tomó de la planilla (AAAA-MM-DD) |

**No es un solo número: es una lista.** `HISTORIA_UMA` guarda todos los valores
del más viejo al más nuevo, y nunca se reescribe una entrada. Es lo que hace que
un cálculo de hoy siga siendo reproducible dentro de dos años. `UMA_VIGENTE` es
el último.

**De dónde sale.** De `data/uma.json`, versionado en el repositorio. La planilla
que el autor mantiene la lee el build (`scripts/actualizar-uma.mjs`), no el
navegador del visitante.

**Relaciones.** La base se divide por ella para entrar a la escala. Todos los
resultados se multiplican por ella para expresarse en pesos. Los mínimos se leen
en UMA y se convierten con ella.

---

## 2. La base regulatoria

**Qué es.** El valor económico del asunto sobre el que se aplica la escala. La
ley la llama «cuantía del asunto» o «valor del pleito».

**Quién la determina.** **El usuario, no el motor.** La ley trae una regla
distinta según qué se reclame, y aplicarla es trabajo de una persona: el motor
recibe un número ya calculado. El inventario completo de esas reglas está en el
[03, sección B](03_REGLAS_DE_NEGOCIO.md#b-las-reglas-que-determinan-la-base-y-las-aplica-el-usuario).

Las principales, con el artículo correcto:

| Qué se reclama | Artículo | Base |
|---|---|---|
| Sumas de dinero | **22** | Monto de la demanda; la liquidación si hay sentencia; el monto de la transacción |
| Bienes muebles e inmuebles | **23 inc. a y b** | Tasación; si no, valuación fiscal + 50 % |
| Desalojo | **40** | El total de los alquileres **del contrato** |
| Desalojo por restitución de inmueble dado al trabajador | **43** | 50 % de la última remuneración mensual, por dos años |
| Sucesión | **35** | El patrimonio que se transmite, gananciales incluidos |
| Alimentos | **39** | Dos años de la cuota que se fije |
| Liquidación del régimen patrimonial | **45** | El patrimonio adjudicado |
| Escrituración | **46** | El valor del bien o el del boleto, el mayor |
| Medida cautelar | **37** | El monto que se pretende asegurar |
| Homologación de convenio de desocupación | **40** | El total de los alquileres del contrato |
| Exhorto | **50** | **No hay base**: el honorario está fijado en UMA |

**Cómo se representa.** `baseValor` en `WizardState` (lo que el usuario
ingresó), y en el resultado dos campos distintos:

- `baseOriginal` — el monto tal como se ingresó.
- `baseFinal` — el monto después de las reducciones del art. 22 y del art. 40.

**Que sean dos y no uno es deliberado**: la cadena tiene que poder mostrar de
dónde salió a dónde llegó.

**Relaciones.** Se reduce por transformaciones de etapa `base`. Se divide por la
UMA para entrar a la escala. Los auxiliares y el partidor se calculan sobre ella
—sobre `baseFinal`—, no sobre el honorario.

---

## 3. La escala del art. 21

**Qué es.** Siete tramos definidos en UMA, cada uno con una alícuota mínima y
una máxima. Es la regla general de todo proceso susceptible de apreciación
pecuniaria, no solo del juicio de conocimiento.

| Tramo | Base en UMA | Alícuota |
|---|---|---|
| 1ª | hasta 15 | 22 % a 33 % |
| 2ª | 16 a 45 | 20 % a 26 % |
| 3ª | 46 a 90 | 18 % a 24 % |
| 4ª | 91 a 150 | 17 % a 22 % |
| 5ª | 151 a 450 | 15 % a 20 % |
| 6ª | 451 a 750 | 13 % a 17 % |
| 7ª | más de 750 | 12 % a 15 % |

**Cómo se calcula.** A partir del segundo tramo la alícuota **no se aplica sobre
el total**:

```
honorario = máximo del grado anterior + (excedente × alícuota del grado actual)

máximo del grado anterior = límite superior de ese grado × su alícuota MÁXIMA
excedente                 = base en UMA − límite superior del grado anterior
```

El piso **no es la suma acumulada de los tramos previos**. Los seis valores:
4,95 · 11,70 · 21,60 · 33 · 90 · 127,50 UMA, que salen de 15 × 33 %, 45 × 26 %,
90 × 24 %, 150 × 22 %, 450 × 20 % y 750 × 17 %. El detalle, con un ejemplo
comprobado contra la app, está en el
[02](02_FLUJO_JURIDICO.md#la-escala-del-art-21-cómo-funciona-de-verdad).

**Cómo se representa.** `EscalaAplicada` en el resultado:

| Campo | Qué guarda |
|---|---|
| `titulo` | El tramo, en texto: «6ª escala (451-750 UMA): 13% a 17%» |
| `baseEnUMA` | La base ya convertida |
| `porcentajeMin` / `porcentajeMax` | Las alícuotas del tramo, sin reducciones |
| `porcentajeMinAplicado` / `porcentajeMaxAplicado` | Las mismas, ya multiplicadas por todos los factores |
| `escalera` | El piso, el límite anterior y el excedente. `EscaleraInfo` |

**`escalera` existe para poder mostrar la cuenta, no para hacerla.** Es lo que
permite que la pantalla diga «máximo hasta 450 UMA: $9.186.840» y «13 % del
excedente: $528.554» en vez de un número sin origen. Va vacío en el primer
tramo, donde no hay grado anterior.

---

## 4. Los tres roles profesionales

**Qué son.** Patrocinante, apoderado y procurador. **Son alternativos entre sí,
no acumulativos**: quien cobra es una persona distinta en cada caso, y un mismo
abogado es patrocinante o apoderado, no los dos.

| Rol | Qué es | Cómo se calcula | Artículo |
|---|---|---|---|
| **Patrocinante** | El abogado que asiste jurídicamente a la parte | Lo que sale de la escala, con todas las reducciones | 21 |
| **Apoderado** | El abogado que además ejerce la representación con poder | Patrocinante **× 1,40** | 20 |
| **Procurador** | Quien ejerce la representación sin ser el letrado patrocinante | Patrocinante **× 0,40** | 20 |

**De dónde sale el 1,40.** El art. 20 no lo dice con ese número: dice que el
abogado que actúa como apoderado **sin patrocinio** «percibirá la asignación
total que hubiere correspondido a ambos». O sea el 100 % del patrocinante más el
40 % del procurador.

Los dos multiplicadores se aplican **al final de la cadena**, sobre el honorario
ya reducido, no sobre la escala pura.

**Cómo se representa.** `Honorarios`, con los tres como `HonorariosRol`, cada
uno con un `Rango`:

| Campo de `Rango` | Qué guarda |
|---|---|
| `minUMA` / `maxUMA` | El honorario en UMA |
| `minPesos` / `maxPesos` | El mismo, en pesos |

**Los tres se calculan siempre.** La pantalla deja elegir cuál mirar; el motor
no decide cuál corresponde, porque eso depende de cómo actuó el profesional y no
de ningún dato del expediente.

---

## 5. Los auxiliares de la Justicia

**Qué son.** Peritos, martilleros, contadores, traductores, liquidadores: los
profesionales que colaboran con el tribunal sin ser los letrados de las partes.

**Cómo se calculan.** Del **5 % al 10 % de la base en UMA** (art. 21). No sobre
el honorario del abogado: sobre la cuantía del proceso, y sobre `baseFinal`, o
sea la base ya reducida.

**Es un rango único, sin categorías.** El art. 21 no distingue entre tipos de
auxiliar en este punto, y el motor tampoco.

**Cómo se representa.** El campo `auxiliares` del resultado, un `Rango`.

**La excepción que el motor no contempla.** El mismo párrafo prevé que ante
labores «altamente complejas o extensas» el juez pueda, por auto fundado,
superar el 10 %. Es una facultad discrecional y no hay dato que la determine: la
app muestra la banda.

**Los mínimos de los arts. 58, 60 y 61 bis existen y el motor no los verifica.**
Ver la entidad 12.

---

## 6. La segunda instancia

**Qué es.** La regulación por las actuaciones de la alzada. **No es un
suplemento del honorario de primera: es una regulación distinta sobre la misma
base**, igual que el partidor.

**Cómo se calcula.** Como porcentaje del honorario de primera instancia del rol
elegido (art. 30):

| Supuesto | Porcentaje |
|---|---|
| Mínimo | 30 % |
| Máximo | 35 % |
| Máximo si la sentencia fue revocada **en todas sus partes y en favor del apelante** | 40 % |

El calificativo no es decorativo: **una revocación parcial no habilita el 40 %.**

**Lo que la ley manda además y el motor no hace.** Si la sentencia se revoca *o
modifica*, el tribunal de alzada debe **rehacer de oficio las regulaciones de
primera instancia** según el nuevo resultado del pleito (art. 30, párrafo
segundo). Eso no es un cálculo que la app pueda ofrecer sola: implica volver a
correr el caso con otro resultado.

**Cómo se representa.** `SegundaInstancia`, con un `SegundaInstanciaRol` por
cada rol, y cada uno con tres `Rango`: `minimo`, `maximo` y `revocada`.

**Se calcula siempre, en la misma pasada, y solo en cuatro procesos**:
`conocimiento`, `ejecucion_sentencia`, `ejecutivo` y `sucesion`. La cautelar, la
homologación, el exhorto y el incidente no la devuelven.

---

## 7. El partidor

**Qué es.** El abogado o los abogados que realizan y suscriben las cuentas
particionarias en la sucesión.

**Cómo se calcula.** Del **2 % al 3 %** del valor del haber a dividirse
(art. 35, última parte). Sobre `baseFinal`.

**Cómo se representa.** `Partidor`, con `minPorcentaje`, `maxPorcentaje`, y el
resultado en UMA y en pesos.

**Solo en `sucesion`, y siempre**: no se pregunta nada. Es independiente del
honorario del letrado y coexiste con la reducción del art. 35 por único letrado
—esa afecta al abogado, esta no—.

El mismo artículo prevé una regulación análoga, también del 2 % al 3 %, para el
**auxiliar de Justicia que actúa como perito partidor** junto al letrado. El
motor calcula una sola.

---

## 8. El tipo de proceso

**Qué es.** La clasificación que decide qué se pregunta después y qué reglas
aplican. Es la respuesta más determinante de la entrevista.

**Cómo se representa.** `tipoProceso` en `WizardState`, del tipo `ProcesoTipo`.
Los ocho valores que la entrevista ofrece:

| Clave | Proceso | Artículo |
|---|---|---|
| `conocimiento` | Juicio de conocimiento, ordinario o sumarísimo | 21 y ss. |
| `ejecucion_sentencia` | Ejecución de sentencia, de honorarios o de acuerdos | 41 |
| `ejecutivo` | Juicio ejecutivo y ejecuciones especiales | 34 |
| `sucesion` | Proceso sucesorio | 35 |
| `medida_cautelar` | Medidas cautelares, autónomas o incidentales | 37 |
| `homologacion_desocupacion` | Homologación de convenio de desocupación | 40 |
| `exhorto` | Diligenciamiento de exhortos de la Ley 22.172 | 50 |
| `incidente` | Incidentes, incluidos los beneficios de litigar sin gastos | 29 inc. g |

Sin tilde en `sucesion` y sin espacios: son identificadores, no rótulos.

`ProcesoTipo` admite además valores `minimos_*`, que **no son procesos**: son
restos de cuando la pantalla de mínimos se modelaba como una rama del wizard.
Los pasos de cada proceso están en `PROCESS_STEP_MAP`, que tiene ocho entradas.

**Relaciones.** Decide qué contingencias se preguntan, qué reglas aplica
`resolveReglas()`, qué función de `PROCESS_REGISTRY` construye el resultado, y
si hay partidor y segunda instancia.

---

## 9. El objeto del juicio

**Qué es.** Qué se reclama. **Solo se pregunta en `conocimiento`.**

**Cómo se representa.** `objeto` en la entrevista, `objetoBase` en
`WizardState`. Doce valores:

`sumas_dinero` · `desalojo` · `inmuebles` · `derechos_crediticios` ·
`titulos_acciones` · `establecimientos` · `uso_habitacion` · `escrituracion` ·
`familia_alimentos` · `familia_liquidacion` · `posesorias_interdictos` ·
`incidencia_colectiva`

**Para qué sirve realmente.** Para saber **qué monto ingresar como base**: cada
opción corresponde a una regla distinta de la entidad 2. Solo tres de las doce
mueven el número por sí mismas —`desalojo` con vivienda,
`posesorias_interdictos` con beneficio exclusivo, e `incidencia_colectiva`—.

**Dos objetos abren una sub-pregunta**, y son campos distintos, no el mismo:

| Objeto | Sub-pregunta | Valores |
|---|---|---|
| `desalojo` | `desalojoVivienda` | `vivienda` · `civil` · `laboral` |
| `posesorias_interdictos` | `posesoriasTipo` | `beneficio` · `demas` |

`desalojoVivienda` y `homologacionVivienda` **no son lo mismo**: el primero es
un sub-paso del objeto en `conocimiento`, el segundo es el paso propio del
proceso `homologacion_desocupacion`. Los dos aplican el -20 % del art. 40, pero
en ramas distintas de la entrevista.

---

## 10. Las contingencias procesales

**Qué son.** Los hechos del caso que modifican el cálculo. Son respuestas del
usuario sobre lo que pasó en el expediente.

| Clave | Pregunta | Valores | Qué mueve |
|---|---|---|---|
| `modoTerminacion` | ¿Cómo terminó el proceso? | `sentencia` · `modos_anormales` · `caducidad` · `provisorios` | Abre las tres siguientes; `provisorios` no mueve ningún número |
| `sentenciaResultado` | ¿Cómo se resolvió la demanda? | `admitida` · `rechazada` | `rechazada`: **la base × 0,70** (art. 22) |
| `caducidadCriterio` | ¿Con qué criterio se trata la caducidad? | `art22` · `art25` | `art22`: **la base × 0,70**. `art25`: abre `aperturaPrueba` |
| `aperturaPrueba` | ¿Antes o después de la apertura a prueba? | `antes` · `despues` | `antes`: **la escala × 0,50** (art. 25) |
| `tuvoExcepciones` | ¿Se dedujeron excepciones? | `si` · `no` | `no`: **el honorario × 0,90** (arts. 34 / 41) |
| `sucesionUnicoLetrado` | ¿Un solo letrado por todos los herederos? | `unico` · `varios` | `unico`: **la escala × 0,50** (art. 35) |
| `medidaOposicion` | ¿Existió oposición? | `con` · `sin` | Qué porcentaje **de la escala** se toma: 50 % con, 25 % sin (art. 37) |
| `homologacionVivienda` | ¿Qué tipo de convenio es? | `vivienda` · `otros` | `vivienda`: **la base × 0,80** (art. 40) |

**Los valores de la entrevista y los del motor no siempre coinciden.** El puente
lo hace `hooks/useWizard.ts`: `aperturaPrueba` llega como `'antes'`/`'despues'`
y se guarda como `false`/`true`; `tuvoExcepciones` como `'si'`/`'no'` y se
guarda como booleano; lo mismo `sucesionUnicoLetrado`, `medidaOposicion` y
`homologacionVivienda`. En `WizardState` son booleanos o `null`.

**Cada contingencia mueve una etapa distinta de la cadena**, y ahí está lo que
más importa: no es lo mismo tocar la base que tocar la escala.

---

## 11. Las transformaciones

**Qué son.** El registro de cada operación que el motor aplicó. **No son un
detalle de presentación: son parte del resultado**, y lo que la app muestra como
«por qué».

**Cómo se representan.** `Transformacion`:

| Campo | Qué guarda |
|---|---|
| `id` | Identificador, p. ej. `base-demanda-rechazada` |
| `etapa` | `'base'` · `'escala'` · `'honorarios'` |
| `concepto` | La frase que se muestra |
| `articulo` | El artículo que la funda |
| `visible` | Si se muestra en la cadena |
| `valorPrevio` / `factor` / `valorPosterior` | La cuenta: de cuánto, por cuánto, a cuánto |

**`etapa` es el campo que importa.** Determina sobre qué opera, y por lo tanto
qué resultado da:

| Etapa | Sobre qué opera | Artículos |
|---|---|---|
| `base` | La base regulatoria, antes de la escala | 22, 40 |
| `escala` | Los valores que salen de la escala | 25, 35, 41, y los factores propios de la cautelar (37) y la homologación (40) |
| `honorarios` | El honorario ya calculado | 34, 38, 49, y los cálculos propios del exhorto (50) y el incidente |

Dentro de cada etapa **se multiplican, no se suman**. «-50 % y -10 %» es × 0,45,
o sea -55 %.

---

## 12. Los mínimos arancelarios

**Qué son.** Montos fijos en UMA que la ley establece como piso para asuntos sin
cuantía o para actuaciones determinadas.

**Cómo se representan.** `MinimoCategoria` en `lib/legal/minimos-data.ts`, con
`titulo`, `articulo`, `textoLegal` completo y sus `grupos` de `MinimoItem`
(`label`, `uma`, y `alias` para buscar por el nombre de tribunal cuando difiere
del legal). Siete categorías:

| Clave | Artículo | Alcance |
|---|---|---|
| `judicial` | **19 inc. a** | Asuntos judiciales sin apreciación pecuniaria |
| `extrajudicial` | **19 inc. b** | Labor extrajudicial |
| `recursos_csjn` | **31** | Recursos ante la Corte Suprema |
| `contencioso_44` | **44** | Acciones y actuaciones administrativas |
| `acciones_48` | **48** | Amparo, hábeas corpus, hábeas data, inconstitucionalidad |
| `art58` | **58** | Juicios pecuniarios no previstos en otros artículos |
| `auxiliares_justicia` | **58, 60 y 61 bis** | Peritos y auxiliares |

**No son una entidad del cálculo: son una pantalla de consulta.** No hay base,
no hay escala, no hay reducciones.

**Y el motor no los compara contra el resultado.** `calculate.ts` no importa
`minimos-data.ts` y no hay ninguna verificación de piso en toda la cadena, así
que **un resultado puede quedar por debajo de un mínimo legal sin que la app lo
diga**. Está en [`PLAN_COBERTURA_LEY.md`](../PLAN_COBERTURA_LEY.md), punto 8.

---

## 13. Las etapas del art. 29

**Qué son.** La división del proceso en tercios, a los efectos de regular cuando
la actuación no fue completa (art. 29 incs. a, b y c):

| Tercio | Qué comprende |
|---|---|
| Primero | La demanda y la contestación; el escrito inicial en sucesiones |
| Segundo | Las actuaciones de prueba; hasta la declaratoria de herederos en el sucesorio |
| Tercero | Las demás diligencias hasta la terminación en primera instancia |

El ejecutivo tiene su propia división (inc. f): **una sola etapa hasta la
sentencia si no hubo excepciones, tres si las hubo**. El incidente, dos
(inc. g). Los procesos penales, dos (inc. e).

**Qué hace el motor con esto: casi nada.** No pregunta en qué etapa quedó el
proceso ni la decide. La pantalla muestra el honorario completo, en 2/3 y en
1/3, y el usuario elige. Las etapas del ejecutivo y del incidente no están
modeladas.

**Y hay una inconsistencia conocida:** si la entrevista ya contestó que el
proceso terminó **antes de la apertura a prueba**, la etapa de prueba no
existió, y la app igual muestra las tres fracciones. Está en el
[`PLAN_COBERTURA_LEY.md`](../PLAN_COBERTURA_LEY.md), punto 3a.

**El reparto entre dos profesionales** que la pantalla ofrece al lado no sale de
ningún artículo: es una calculadora auxiliar, con proporción ajustable que
arranca en 60/40.

---

## 14. La regulación provisoria

**Qué es.** La del art. 12: cuando el profesional se aparta del proceso antes de
su conclusión normal, puede pedir que se le regulen honorarios **«en el mínimo
que le hubiere podido corresponder conforme a las actuaciones cumplidas»**.

**Qué hace el motor.** **No cambia ningún factor.** Cambia qué se puede
afirmar: el resultado se marca `esProvisorio` y la app deja de enunciar el
máximo —banda de honorarios, alícuota, auxiliares, segunda instancia— y oculta
el reparto por etapas.

No es prudencia: enunciar el máximo sería afirmar un tope que este cálculo no
está afirmando. Lo que el art. 12 fija es un piso.

**Cómo se decide.** `esRegulacionProvisoria()` la deriva de `modoTerminacion`, y
**el tipo de proceso manda**: solo existe en `conocimiento`,
`ejecucion_sentencia` y `ejecutivo`. En el sucesorio no se admiten regulaciones
provisorias salvo excepción, y en esa excepción la regulación es definitiva, con
mínimo y máximo.

---

## Cómo se relacionan

```
        TIPO DE PROCESO ────┬──────────────┬─────────────────┐
        (8 valores)         │              │                 │
                            ▼              ▼                 ▼
                  OBJETO DEL JUICIO   CONTINGENCIAS    qué builder
                  (solo conocimiento)  PROCESALES      construye el
                            │              │            resultado
                            └──────┬───────┘                 │
                                   │                         │
        el USUARIO determina        │  activan                │
        e ingresa la BASE ◄─────────┘  transformaciones       │
                │                                             │
                ▼                                             │
        transformaciones de etapa «base»        arts. 22, 40  │
                │                                             │
                ▼                                             │
        base ÷ UMA  ──►  ESCALA DEL ART. 21                   │
                                   │                          │
                                   ▼                          │
        transformaciones de etapa «escala»   arts. 25, 35, 41 │
                                   │         37 y 40 propios  │
                                   ▼                          │
        transformaciones de etapa «honorarios» arts. 34,38,49 │
                                   │                          │
                                   ▼                          ▼
                      HONORARIO DEL PATROCINANTE ◄────────────┘
                                   │
        ┌──────────┬───────────────┼──────────────┬────────────┐
        ▼          ▼               ▼              ▼            ▼
    APODERADO  PROCURADOR   2ª INSTANCIA    AUXILIARES     PARTIDOR
     × 1,40      × 0,40      30/35/40 %     5-10 % de     2-3 % de
                              art. 30       la base       la base
     art. 20     art. 20                     art. 21    art. 35, solo
                                                          sucesión
    └── alternativos ──┘     └── otras regulaciones sobre la misma base ──┘

    si es PROVISORIO: la cadena es la misma, solo se enuncia el mínimo
    los MÍNIMOS del art. 19 y ss. NO se comparan contra este resultado
```

**Los tres roles son alternativos entre sí. La segunda instancia, los auxiliares
y el partidor son regulaciones distintas, para actuaciones o profesionales
distintos.** Nada de esto se suma: **no hay un total general**, ni en el motor
ni en la pantalla.

---

## Qué decía este documento y no era así

Corregido el 7/8/2026.

- **El pie invocaba un «Decreto Reglamentario 218/2015».** No existe, y no
  podría: es anterior a la ley, que es de 2017. Los decretos que sí tocan a la
  Ley 27.423 son el **1077/2017**, que observó varios artículos al promulgarla
  —entre ellos el 47, el de los incidentes—, y el **157/2018**, que derogó el
  art. 36. Una cita de autoridad inventada en un documento jurídico es el peor
  error posible, y estaba en el renglón que más autoridad aparenta.
- **Seis de las ocho filas de la tabla de bases citaban un artículo que trata
  otra cosa**, con las citas corridas de forma sistemática: la medida cautelar
  al art. 39 (que es alimentos), los alimentos al 43 (que es laboral), la
  homologación al 45 (que es liquidación del régimen patrimonial), el exhorto al
  46 (que es escrituración), el ejecutivo al 40 (que es desalojo). Y el desalojo
  decía «total de alquileres **adeudados + mejoras**»: es el total de los
  alquileres **del contrato**, y las mejoras no aparecen en ninguna parte de la
  ley.
- **«Si se rechaza, la base se reduce a 1/3 (art. 40)».** Son tres errores en
  nueve palabras: es **× 0,70**, no a un tercio; es del **art. 22**, no del 40;
  y no es solo en el ejecutivo, también en conocimiento y en ejecución de
  sentencia.
- **Cinco de las seis filas de la tabla de mínimos citaban mal el artículo**, y
  se contradecían entre sí: los mínimos judiciales al art. 48 (son del 19
  inc. a), los extrajudiciales al 44 (son del 19 inc. b), los recursos ante la
  CSJN al 48 (son del 31), y el art. 31 aparecía además como «segunda
  instancia», que es el art. 30.
- **Repetía el mecanismo de pisos que no existe**: «si los honorarios calculados
  son menores al mínimo, se aplica el mínimo». El motor no compara. Es el mismo
  error que tenía el `03`.
- **El diagrama terminaba en «HONORARIOS TOTALES: patrocinante + apoderado +
  procurador + auxiliares».** Esa suma no existe y no significa nada: los tres
  roles son alternativos entre sí.
- **La caja del patrocinante decía «monto base × etapa completada ×
  factorFinal».** El motor no multiplica por ninguna etapa: muestra las
  fracciones y el usuario elige.
- **Las contingencias tenían mal el efecto y mal los valores.**
  `aperturaPrueba` «afecta la etapa completada» —afecta la escala, art. 25—;
  `tuvoExcepciones` «puede afectar las etapas» —es -10 % sobre el honorario—;
  `medidaOposicion` «cambia la base» —cambia el porcentaje de la escala—. Y
  varias listaban `si`/`no` donde el código usa `con`/`sin`, `unico`/`varios` o
  `vivienda`/`otros`.
- **Confundía `desalojoVivienda` con `homologacionVivienda`**: decía que el
  objeto `desalojo` activa la contingencia de la homologación. Son dos campos
  distintos, en dos ramas distintas de la entrevista. Ni `desalojoVivienda` ni
  `posesoriasTipo` aparecían en el documento.
- **Las etapas del art. 29 estaban inventadas**: «instructiva, admisión de
  pruebas, sentencia». El artículo dice demanda y contestación; actuaciones de
  prueba; demás diligencias hasta la terminación. Y agregaba que la medida
  cautelar «generalmente tiene 1 etapa», que no está en el art. 29.
- **La UMA: «puede provenir de carga manual o de consulta a Google Sheets»** y
  «valor inicial (fecha de sanción de la ley): $92.482». Las dos cosas mal: la
  planilla la lee el build desde el 5/8, y 92.482 era un valor reciente de 2026,
  no el inicial de una ley de 2017.
- **`sucesión` figuraba con tilde como clave del código.** La clave es
  `sucesion`.
- **Los encabezados estaban en inglés** —«Attributes», «Types», «Types de
  transformaciones»— en un documento en castellano.
