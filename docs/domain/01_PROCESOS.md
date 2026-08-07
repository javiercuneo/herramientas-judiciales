# Los procesos de la entrevista

> Documento de dominio — Ley 27.423

La entrevista de Honorio conoce **ocho tipos de proceso**. Este documento
describe, para cada uno: qué pregunta, en qué orden, qué hace con cada
respuesta, qué devuelve y qué deliberadamente no hace.

Las tablas de mínimos arancelarios —art. 19, 31, 44, 48, 58, 60 y 61 bis— **no
son un proceso**: son una pantalla de consulta aparte, sin entrevista y sin
cálculo. Están al final, en su propia sección.

---

## Cómo leer este documento

**Todo tiene dos nombres.** Uno es la categoría jurídica y el otro es la clave
con la que el código la representa. Los dos aparecen siempre, porque son los dos
necesarios: sin el primero no se puede discutir si la regla es correcta, y sin
el segundo no se puede encontrar dónde está escrita.

Así:

> **Objeto del juicio** (`objeto`, que el motor recibe como `objetoBase`) —
> qué se reclama. Doce opciones, entre ellas `sumas_dinero`, `escrituracion`
> y `familia_alimentos`.

`sumas_dinero` no es una categoría de la ley ni pretende serlo: es el
identificador de una opción en el código. La categoría jurídica es «juicio por
cobro de sumas de dinero», y el artículo que la gobierna es el 22.

**Cada afirmación de acá se puede verificar en dos archivos**, los dos en el
repositorio [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio):

| Qué querés comprobar | Dónde está |
|---|---|
| Qué se pregunta, en qué orden, con qué condición | `lib/wizard/wizard-schema.ts` |
| Qué hace el motor con cada respuesta | `lib/legal/calculate.ts` |

En `wizard-schema.ts`, el orden real de las preguntas de cada proceso está en
una sola constante, `PROCESS_STEP_MAP`. En `calculate.ts`, la traducción de
respuestas a reglas jurídicas está toda en una sola función, `resolveReglas()`.
Si algo de este documento no coincide con esas dos, mandan esas dos.

**Verificado el 6/8/2026** contra el motor y contra el texto de la ley, que
está en [00_LEY_27423.md](00_LEY_27423.md). La versión anterior de este
documento estaba generada a partir de una descripción del sistema y no del
sistema: afirmaba que el cálculo no usa la UMA, inventaba un «total general»
que el motor nunca devolvió, listaba los pasos del wizard en un orden que no es
el real y atribuía a la ley una reducción por «juicio abreviado» que no existe.

---

## Lo que se pregunta siempre, en cualquier proceso

**1. Valor de la UMA** (`umaInicio` → `valorUMA`). Primera pregunta de los ocho
procesos, sin excepción. La app propone el último valor conocido y el usuario lo
confirma o lo corrige.

No es un dato de contexto: **es la unidad en la que se calcula todo**. La escala
del art. 21 no está escrita en pesos sino en tramos de UMA, así que lo primero
que hace el motor con la base es dividirla por la UMA para saber en qué tramo
cae. Cambiar la UMA cambia el tramo, y cambiar el tramo cambia la alícuota.

**2. Tipo de proceso** (`tipoProceso`). Las ocho opciones son las secciones de
este documento. Es la respuesta que decide qué se pregunta después: cada
proceso tiene su propia lista de pasos.

De ahí en adelante, cada proceso va por su lado.

---

## 1. Juicio de conocimiento — `conocimiento`

### Qué es

El proceso de conocimiento —ordinario o sumarísimo—, donde se discute y se
resuelve el fondo del asunto. Es el proceso con más preguntas de los ocho, y el
único que pregunta por el objeto del juicio.

### Qué pregunta, en este orden

| # | Pregunta | Clave | Cuándo aparece |
|---|---|---|---|
| 1 | Valor de la UMA | `umaInicio` | siempre |
| 2 | Tipo de proceso | `tipoProceso` | siempre |
| 3 | ¿Cómo terminó el proceso? | `modoTerminacion` | siempre |
| 4 | ¿Cómo se resolvió la demanda? | `sentenciaResultado` | si terminó por `sentencia` |
| 5 | ¿Con qué criterio se trata la caducidad? | `caducidadCriterio` | si terminó por `caducidad` |
| 6 | ¿Antes o después de la apertura a prueba? | `aperturaPrueba` | si `modos_anormales`, o `caducidad` + `art25` |
| 7 | ¿Qué se reclama en el juicio? | `objeto` | siempre |
| 8 | Tipo de desalojo / tipo de acción posesoria | `desalojoVivienda`, `posesoriasTipo` | según la respuesta anterior |
| 9 | Base regulatoria | `base` | siempre |

**La terminación se pregunta antes que el objeto, y la base al final.** Ese es
el orden real de la pantalla, y no es indiferente: la base se pide última porque
para entonces ya se sabe si va a sufrir una reducción, y la app puede decirlo
mientras se la ingresa.

**Las opciones de terminación** (`modoTerminacion`) son cuatro:

- **Sentencia** (`sentencia`) — sentencia definitiva. Abre la pregunta 4.
- **Modos anormales** (`modos_anormales`) — allanamiento, desistimiento o
  transacción, los tres del art. 25. Abre la pregunta 6.
- **Caducidad de instancia** (`caducidad`) — art. 310 CPCCN. Abre la pregunta 5.
- **Honorarios provisorios** (`provisorios`) — art. 12. No abre ninguna
  pregunta; ver más abajo qué hace.

**Las opciones de objeto** (`objeto`) son doce: `sumas_dinero`, `desalojo`,
`inmuebles`, `derechos_crediticios`, `titulos_acciones`, `establecimientos`,
`uso_habitacion`, `escrituracion`, `familia_alimentos`, `familia_liquidacion`,
`posesorias_interdictos` e `incidencia_colectiva`.

**Nueve de las doce no mueven ningún número.** Están para orientar el paso
siguiente: cada una trae en pantalla el artículo que dice cómo se arma la base
en ese tipo de juicio —art. 23 inc. a para inmuebles, art. 39 para alimentos,
art. 45 para la liquidación del régimen patrimonial, art. 46 para
escrituración—, pero **la base la calcula y la ingresa el usuario**. El motor no
la deriva.

Las tres que sí mueven el número son `desalojo` (por su sub-pregunta),
`posesorias_interdictos` (por su sub-pregunta) e `incidencia_colectiva`.

Lo mismo pasa dentro del desalojo: de las tres opciones de `desalojoVivienda`,
solo `vivienda` reduce la base. `civil` no reduce nada, y `laboral` tampoco: lo
que hace su descripción en pantalla es indicar cómo armar la base en ese caso
—el 50 % de la última remuneración mensual por dos años, art. 43—, cuenta que
también hace el usuario.

### Qué hace con esas respuestas

El motor aplica las reglas en tres etapas, y **el orden importa**: una quita
sobre la base no da lo mismo que la misma quita sobre la escala.

**Etapa 1 — sobre la base regulatoria.** Las tres son multiplicativas entre sí.

| Regla | Factor | Cuándo |
|---|---|---|
| Desalojo de vivienda (art. 40) | × 0,8 | `objeto` = `desalojo` y `desalojoVivienda` = `vivienda` |
| Demanda íntegramente desestimada (art. 22) | × 0,7 | `sentenciaResultado` = `rechazada` |
| Caducidad tratada como demanda desestimada (art. 22) | × 0,7 | `caducidadCriterio` = `art22` |

**Etapa 2 — la escala del art. 21**, sobre la base ya reducida, y después las
reducciones que operan sobre ella.

La escala tiene siete tramos, de 22 %-33 % hasta 12 %-15 %, y no es un
porcentaje plano: cada tramo suma el máximo del grado anterior más la alícuota
del tramo aplicada solamente al excedente. Por eso la app muestra, cuando
difieren, el número que daría leer la alícuota como si fuera directa sobre la
base: para que se vea que no es lo mismo.

| Regla | Factor | Cuándo |
|---|---|---|
| Terminación anormal antes de la apertura a prueba (art. 25) | × 0,5 | `modos_anormales` + `aperturaPrueba` = antes, **o** `caducidad` + `art25` + `aperturaPrueba` = antes |

Los dos criterios de la caducidad son **alternativos**. Elegido el art. 22, la
instancia cae como demanda desestimada, la quita es de base y el momento de la
apertura a prueba deja de jugar —por eso la pregunta 6 no aparece—. Recién con
el art. 25 el momento importa. Hasta el 3/8/2026 el motor aplicaba también el
-50 % al criterio del art. 22, acumulando dos quitas sobre el mismo hecho.

**Etapa 3 — sobre el honorario ya calculado.** Multiplicativas entre sí.

| Regla | Factor | Cuándo |
|---|---|---|
| Acciones posesorias o interdictos en beneficio exclusivo del patrocinado (art. 38) | × 0,8 | `posesoriasTipo` = `beneficio` |
| Proceso colectivo con contenido patrimonial (art. 49) | × 0,75 | `objeto` = `incidencia_colectiva` |

**Los honorarios provisorios no son una cuarta reducción.** Si `modoTerminacion`
= `provisorios`, no cambia ningún factor: cambia qué se puede afirmar. El art. 12
manda fijarlos «en el mínimo que le hubiere podido corresponder», así que el
resultado se marca como provisorio (`esProvisorio`) y **la app deja de enunciar
el máximo** —en la banda de honorarios, en la alícuota, en auxiliares, en
segunda instancia—. El máximo no se oculta por prudencia: mostrarlo sería
afirmar un tope que este cálculo no está afirmando.

### Qué devuelve

- **Patrocinante** — lo que sale de la escala, con todas las reducciones.
- **Apoderado** — patrocinante × 1,4. Sale del art. 20: el apoderado sin
  patrocinio percibe lo de ambos, o sea 100 % + 40 %. Se aplica al final, sobre
  el honorario ya reducido.
- **Procurador** — patrocinante × 0,4 (art. 20, primera oración). También al
  final.
- **Auxiliares de la Justicia** — del 5 % al 10 % de la base **en UMA**
  (art. 21). Es un rango único, sin categorías: la ley no distingue entre
  peritos, martilleros o contadores en este punto, y el motor tampoco. Se
  calcula sobre la base ya reducida por la etapa 1.
- **Segunda instancia** — no es opcional y no se pide aparte: se calcula
  **siempre**, para el rol que esté seleccionado en pantalla, como un porcentaje
  del honorario de primera instancia (art. 30). Mínimo 30 %, máximo 35 %, y 40 %
  si la sentencia fue revocada en todas sus partes a favor del apelante. Es un
  bloque aparte en la pantalla porque es una regulación distinta, no porque se
  calcule por fuera.
- **La cadena** — la lista de transformaciones aplicadas, cada una con su
  artículo, el valor antes y el valor después. Es lo que la app muestra como
  «por qué», y es parte del resultado del motor, no un adorno de la interfaz.

**No hay un total general.** El motor no suma los honorarios de los distintos
roles y la app no muestra esa suma, porque sumarlos no significa nada: son
alternativos entre sí —un mismo abogado es patrocinante o apoderado, no los
dos— y quien los cobra es una persona distinta en cada caso.

### Qué no hace

- **No calcula la base regulatoria.** La ingresa el usuario. El objeto del
  juicio le dice qué artículo la gobierna, pero la cuenta es suya.
- **No aplica ninguna reducción por «juicio abreviado».** No existe en la ley.
- **No aplica el -50 % del art. 41** (ejecución de sentencia) ni el del art. 35
  (único letrado en la sucesión): son de otros procesos.
- **No mira el art. 29 inc. b** para dividir el honorario por etapas. La escala
  se calcula completa; la división en etapas del art. 29 no está implementada.

### Dónde mirarlo

`buildGeneral()` en `lib/legal/calculate.ts`. Es la misma función que atiende
ejecución de sentencia, ejecutivo y sucesión: lo que cambia entre los cuatro es
lo que devuelve `resolveReglas()`, no el recorrido.

---

## 2. Ejecución de sentencia — `ejecucion_sentencia`

### Qué es

El procedimiento de ejecución de una sentencia firme, de honorarios o de
acuerdos homologados (art. 41).

### Qué pregunta, en este orden

Las mismas 1 a 6 del conocimiento —UMA, tipo, terminación y sus condicionales—,
y después:

| # | Pregunta | Clave | Cuándo aparece |
|---|---|---|---|
| 7 | ¿Se dedujeron excepciones? | `tuvoExcepciones` | siempre |
| 8 | Base regulatoria | `base` | siempre |

**No pregunta el objeto del juicio.** Lo que se ejecuta ya está determinado por
la sentencia.

### Qué hace con esas respuestas

Todo lo del conocimiento en materia de terminación —art. 22 sobre la base por
demanda desestimada o caducidad `art22`, art. 25 sobre la escala—, más dos
reglas propias:

| Regla | Etapa | Factor |
|---|---|---|
| Ejecución de sentencia (art. 41) | escala | × 0,5, **siempre** |
| Sin excepciones (art. 41 + art. 34) | honorario final | × 0,9 |

El -50 % del art. 41 no depende de ninguna respuesta: se aplica por el solo
hecho de ser este proceso. El -10 % adicional se aplica solo si
`tuvoExcepciones` = `no`.

### Qué devuelve

Lo mismo que el conocimiento, incluida la segunda instancia. No devuelve
partidor.

### Qué no hace

- **No aplica el art. 38 ni el art. 49**: dependen del objeto, que este proceso
  no pregunta.
- **No distingue el objeto del juicio original.** Si lo ejecutado venía de un
  desalojo de vivienda, el -20 % del art. 40 ya operó en aquel juicio; acá no
  vuelve a aplicarse.

### Dónde mirarlo

`buildGeneral()`, con `aplicaArt41 = true` fijo en `resolveReglas()`.

---

## 3. Juicio ejecutivo — `ejecutivo`

### Qué es

El juicio ejecutivo y las ejecuciones especiales: expensas, alquileres,
pagarés, cheques, cualquier obligación con título ejecutivo (art. 34).

### Qué pregunta

**Exactamente las mismas preguntas que la ejecución de sentencia**, en el mismo
orden: UMA, tipo, terminación y condicionales, excepciones, base.

### Qué hace con esas respuestas

Igual que la ejecución de sentencia, **menos el -50 % del art. 41**. Queda:

| Regla | Etapa | Factor |
|---|---|---|
| Sin excepciones (art. 34) | honorario final | × 0,9 |

más las reglas de terminación comunes (art. 22 sobre la base, art. 25 sobre la
escala).

Es la única diferencia entre este proceso y el anterior, y explica por qué la
entrevista es idéntica: la distingue el tipo de proceso, no una respuesta.

### Qué devuelve

Lo mismo que el conocimiento, incluida la segunda instancia. Sin partidor.

### Qué no hace

No aplica el art. 41 (ese es el proceso 2), ni el 38, ni el 49, ni el 35.

### Dónde mirarlo

`buildGeneral()`, con `aplicaArt41 = false`.

---

## 4. Sucesión — `sucesion`

### Qué es

El proceso sucesorio. Los honorarios se regulan sobre el valor del patrimonio
que se transmite, gananciales incluidos (art. 35).

### Qué pregunta, en este orden

| # | Pregunta | Clave | Cuándo aparece |
|---|---|---|---|
| 1 | Valor de la UMA | `umaInicio` | siempre |
| 2 | Tipo de proceso | `tipoProceso` | siempre |
| 3 | ¿Intervino un solo letrado por todos los herederos? | `sucesionUnicoLetrado` | siempre |
| 4 | Base regulatoria (el patrimonio que se transmite) | `base` | siempre |

Cuatro preguntas, dos recorridos posibles. **No pregunta cómo terminó el
proceso** y por lo tanto tampoco ofrece honorarios provisorios: en el sucesorio
no se admiten salvo excepción, y en esa excepción —el letrado renuncia con la
sucesión sin terminar— la regulación es definitiva y se enuncia con mínimo y
máximo, que es justo lo contrario de lo que hace el art. 12.

### Qué hace con esas respuestas

| Regla | Etapa | Factor | Cuándo |
|---|---|---|---|
| Un solo abogado para todos los herederos (art. 35) | escala | × 0,5 | `sucesionUnicoLetrado` = `unico` |

El art. 35 dice «en la mitad del mínimo y del máximo de la escala»: la quita es
sobre la escala, no sobre la base. Si hay varios letrados, la escala va
completa.

### Qué devuelve

Lo mismo que el conocimiento —incluida la segunda instancia—, y además:

- **Partidor** — del 2 % al 3 % de la base (art. 35, última parte). Se calcula
  siempre en este proceso, sin preguntar nada.

### Qué no hace

No aplica nada que dependa de la terminación (arts. 22 y 25) ni del objeto
(arts. 38, 40 y 49), porque no los pregunta. Tampoco el art. 41 ni el 34.

### Dónde mirarlo

`buildGeneral()` con `aplicaArt35`, y `calcularPartidor()`.

---

## 5. Medida cautelar — `medida_cautelar`

### Qué es

Medidas cautelares que tramiten autónomamente, en forma incidental o dentro del
proceso: embargo, inhibición, secuestro. Los honorarios se regulan sobre el
monto que se pretende asegurar (art. 37).

### Qué pregunta, en este orden

| # | Pregunta | Clave | Cuándo aparece |
|---|---|---|---|
| 1 | Valor de la UMA | `umaInicio` | siempre |
| 2 | Tipo de proceso | `tipoProceso` | siempre |
| 3 | ¿Existió oposición? | `medidaOposicion` | siempre |
| 4 | Base (el monto que se pretende asegurar) | `base` | siempre |

### Qué hace con esas respuestas

El art. 37 no establece una reducción sobre la escala: establece **qué
porcentaje de la escala del art. 21 se toma como base**.

| Respuesta | Porcentaje de la escala del art. 21 |
|---|---|
| Sin oposición (`sin`) | 25 % |
| Con oposición o controversia (`con`) | 50 % |

La diferencia con «una reducción del 25 %» no es de redacción: reducir un 25 %
dejaría el 75 %. Acá se aplica el 25 %.

### Qué devuelve

Patrocinante, apoderado (× 1,4), procurador (× 0,4) y auxiliares (5-10 % de la
base en UMA, calculados sobre la base **sin** el factor del art. 37).

**No devuelve segunda instancia ni partidor.**

### Qué no hace

No pregunta terminación ni objeto, así que no aplica los arts. 22, 25, 34, 35,
38, 40, 41 ni 49.

### Dónde mirarlo

`buildMedidaCautelar()` y `aplicarFactorCautelar()`.

---

## 6. Homologación de convenios de desocupación — `homologacion_desocupacion`

### Qué es

La homologación de un convenio de desocupación y su ejecución (art. 40, último
párrafo).

### Qué pregunta, en este orden

| # | Pregunta | Clave | Cuándo aparece |
|---|---|---|---|
| 1 | Valor de la UMA | `umaInicio` | siempre |
| 2 | Tipo de proceso | `tipoProceso` | siempre |
| 3 | ¿Qué tipo de convenio es? | `homologacionVivienda` | siempre |
| 4 | Base (el total de los alquileres del contrato) | `base` | siempre |

**Sí requiere base.** El art. 40 la define: el total de los alquileres del
contrato, o el valor locativo actualizado del inmueble si el del contrato no
sirve o no puede determinarse.

### Qué hace con esas respuestas

Dos reglas, las dos del art. 40, y en etapas distintas:

| Regla | Etapa | Factor | Cuándo |
|---|---|---|---|
| Locación para vivienda o habitación | base | × 0,8 | `homologacionVivienda` = `vivienda` |
| Homologación de convenio de desocupación | escala | × 0,5 | **siempre** |

El -20 % opera sobre la base, antes de entrar a la escala. El -50 % opera sobre
la escala y no depende de ninguna respuesta: es lo que distingue a la
homologación del desalojo contencioso.

### Qué devuelve

Patrocinante, apoderado, procurador y auxiliares (calculados sobre la base ya
reducida por vivienda, si corresponde).

**No devuelve segunda instancia ni partidor.**

### Qué no hace

No pregunta terminación ni objeto: ninguna de las reglas de esos dos grupos se
aplica.

### Dónde mirarlo

`buildHomologacion()` y `aplicarFactorHomologacion()`.

---

## 7. Exhorto — `exhorto`

### Qué es

El diligenciamiento de exhortos y oficios de la Ley 22.172 (art. 50). Los
honorarios están fijados directamente en UMA: no hay escala, no hay base.

### Qué pregunta

| # | Pregunta | Clave |
|---|---|---|
| 1 | Valor de la UMA | `umaInicio` |
| 2 | Tipo de proceso | `tipoProceso` |

**Dos preguntas y termina.** Un solo recorrido posible.

### Qué hace con esas respuestas

Nada más que convertir a pesos. **No pregunta el inciso**: muestra los tres a la
vez, con su rango en UMA y en pesos, y el usuario elige leyendo cuál describe la
diligencia que hizo.

| Inciso | Qué comprende | UMA |
|---|---|---|
| a) | Notificaciones o actos semejantes | no menos de 3 |
| b) | Inscripciones y actos registrales: dominios, hijuelas, testamentos, gravámenes, secuestros, embargos, inhibiciones, inventarios, remates, desalojos | de 10 a 20 |
| c) | Diligencias de prueba en las que se intervino produciéndolas o controlándolas | de 7 a 30 |

### Qué devuelve

Los tres incisos, cada uno en UMA y en pesos.

**No devuelve honorarios por rol** —no hay patrocinante, apoderado ni
procurador—, **ni auxiliares, ni segunda instancia, ni partidor.** El art. 50
regula la labor del profesional que diligencia, y no se divide en roles.

### Dónde mirarlo

`buildExhorto()`. Los cinco valores están escritos como constantes al principio
de la función.

---

## 8. Incidente — `incidente`

### Qué es

Los incidentes (art. 29 inc. g), que la ley considera divididos en dos etapas:
el planteo y el desarrollo hasta su conclusión. En la entrevista esta opción
**incluye los beneficios de litigar sin gastos**.

### Qué pregunta

| # | Pregunta | Clave |
|---|---|---|
| 1 | Valor de la UMA | `umaInicio` |
| 2 | Tipo de proceso | `tipoProceso` |
| 3 | Base regulatoria | `base` |

Tres preguntas, un solo recorrido posible.

### Qué hace con esas respuestas

Aplica un rango del **2 % al 20 % de la base**, directo, sin pasar por la escala
del art. 21 y sin ninguna reducción.

> **Ese 2 %-20 % no está en la Ley 27.423.** El art. 29 inc. g divide el
> incidente en dos etapas pero no fija ningún porcentaje, y el artículo que sí
> lo hacía —el 47, que regulaba los incidentes entre el 8 % y el 25 % de lo que
> correspondiera al proceso principal, con un piso de 5 UMA— **fue observado por
> el Decreto 1077/2017 y nunca entró en vigencia**. El 2 %-20 % viene del art. 33
> de la Ley 21.839, el régimen anterior, y se conserva como criterio a falta de
> norma vigente que lo reemplace.
>
> Es una interpretación, no una transcripción. Está declarada como tal en
> [03_REGLAS_DE_NEGOCIO.md](03_REGLAS_DE_NEGOCIO.md), regla 16.

### Qué devuelve

El rango en UMA y en pesos.

**No devuelve apoderado, procurador, auxiliares, segunda instancia ni
partidor.** El motor los deja en cero y la pantalla del incidente no los pide.

### Dónde mirarlo

`buildIncidente()`.

---

## Las tablas de mínimos

**No son un proceso y no tienen entrevista.** Son una pantalla de consulta:
siete categorías, cada una con su artículo, su texto legal completo y su lista
de conceptos con el valor en UMA. No hay base regulatoria, no hay escala, no hay
reducciones. Se busca el concepto y se lee el número.

Están en el orden del articulado, y las tres primeras son las que no tienen
monto, que es el caso por el que se consulta esta pantalla: cuando la escala del
art. 21 no se puede aplicar.

| Categoría | Clave | Artículo | Qué cubre |
|---|---|---|---|
| Asuntos judiciales sin apreciación pecuniaria | `judicial` | 19 inc. a | Divorcio, adopción, tutela, filiación, restricciones a la capacidad, información sumaria, denuncias penales, excarcelación, suspensión de juicio a prueba y demás |
| Asuntos extrajudiciales | `extrajudicial` | 19 inc. b | Consultas, dictámenes, gestiones |
| Recursos ante la CSJN | `recursos_csjn` | 31 | Queja por denegación: 15 UMA. Interposición de extraordinario y similares: 20 UMA |
| Acciones y actuaciones administrativas | `contencioso_44` | 44 | Contencioso administrativas: 7 UMA. Administrativas: 5 UMA |
| Amparo, hábeas corpus, hábeas data, inconstitucionalidad | `acciones_48` | 48 | 20 UMA, cuando no pueden regularse por la escala del art. 21 |
| Juicios con apreciación pecuniaria no previstos en otros artículos | `art58` | 58 | Conocimiento 10, ejecutivos 6, mediación 2, auxiliares 4 UMA |
| Auxiliares de la Justicia | `auxiliares_justicia` | 58, 60 y 61 bis | Peritos: 2 UMA por pericia. 1/4 de UMA si aceptó el cargo y el proceso terminó por transacción, avenimiento o conciliación antes del dictamen |

Los arts. 60 y 61 bis son texto **con reforma publicada el 6/3/2026**: el
61 bis desvincula el honorario del perito de la cuantía del juicio y del
porcentaje de incapacidad que dictamine.

### Dónde mirarlo

`lib/legal/minimos-data.ts` para los valores, `components/interview/minimos-view.tsx`
para la pantalla.

---

## Tabla resumen

| Proceso | Clave | Pregunta terminación | Pregunta objeto | Necesita base | Usa la escala del art. 21 | Segunda instancia | Artículos |
|---|---|---|---|---|---|---|---|
| Conocimiento | `conocimiento` | sí | sí | sí | sí | sí | 21, 22, 25, 38, 40, 49, 12 |
| Ejecución de sentencia | `ejecucion_sentencia` | sí | no | sí | sí, al 50 % | sí | 21, 22, 25, 34, 41, 12 |
| Ejecutivo | `ejecutivo` | sí | no | sí | sí | sí | 21, 22, 25, 34, 12 |
| Sucesión | `sucesion` | no | no | sí | sí | sí | 21, 35 |
| Medida cautelar | `medida_cautelar` | no | no | sí | sí, al 25 % o 50 % | no | 21, 37 |
| Homologación de desocupación | `homologacion_desocupacion` | no | no | sí | sí, al 50 % | no | 21, 40 |
| Exhorto | `exhorto` | no | no | no | no | no | 50 |
| Incidente | `incidente` | no | no | sí | no | no | 29 inc. g |

Todos preguntan la UMA. Todos los que usan la escala del art. 21 calculan
apoderado (× 1,4), procurador (× 0,4) y auxiliares (5-10 % de la base en UMA);
el exhorto y el incidente no.

### Cuántos recorridos tiene cada proceso

Un «recorrido» es una combinación completa de respuestas. Sirve para dimensionar
la entrevista y es lo que barre la validación del flujo hacia atrás.

| Proceso | Recorridos | De dónde salen |
|---|---|---|
| Conocimiento | 128 | 8 caminos de terminación × 16 de objeto |
| Ejecución de sentencia | 16 | 8 de terminación × 2 de excepciones |
| Ejecutivo | 16 | idem |
| Sucesión | 2 | único letrado: sí o no |
| Medida cautelar | 2 | oposición: sí o no |
| Homologación de desocupación | 2 | vivienda o demás casos |
| Exhorto | 1 | no pregunta nada más |
| Incidente | 1 | idem |
| **Total** | **168** | |

Los 8 caminos de terminación: sentencia admitida, sentencia rechazada, modos
anormales antes de prueba, modos anormales después, caducidad art. 22,
caducidad art. 25 antes de prueba, caducidad art. 25 después, y provisorios.

Los 16 de objeto: las nueve opciones sin sub-pregunta, más las tres del
desalojo, más las dos de las posesorias, más las dos de alimentos.

**Eran 160 hasta el 7/8/2026**, cuando `familia_alimentos` pasó a tener
sub-pregunta —los dos supuestos del art. 39— y sumó 8 recorridos al
conocimiento. Si vuelve a moverse, se mueven también la cifra de la landing y
la del `README.md`, que salen de acá.

`lib/legal/__tests__/retroceso.validation.ts` los enumera y cruza cada uno
contra cada uno —28.224 pares— para verificar que volver atrás en la entrevista
y cambiar el tipo de proceso no deje pegada ninguna respuesta que el nuevo
recorrido ya no pregunta.

---

## El orden de las etapas del cálculo

Vale para los cuatro procesos que pasan por `buildGeneral()` —conocimiento,
ejecución de sentencia, ejecutivo y sucesión—. Los otros cuatro son variantes
más cortas del mismo esqueleto.

```
Base regulatoria que ingresó el usuario
   │
   ├─ Etapa 1: reducciones sobre la BASE          arts. 40, 22
   │            (multiplicativas entre sí)
   ▼
Base final
   │
   ├─ Se divide por la UMA para ubicar el tramo
   ├─ Se aplica la escala del art. 21 (máximo del grado
   │   anterior + alícuota sobre el excedente)
   ▼
Honorario del patrocinante, en UMA
   │
   ├─ Etapa 2: reducciones sobre la ESCALA        arts. 35, 41, 25
   │            (multiplicativas entre sí)
   │
   ├─ Etapa 3: reducciones sobre el HONORARIO     arts. 34, 38, 49
   ▼
Honorario final del patrocinante
   │
   ├─ Apoderado    = × 1,4                        art. 20
   ├─ Procurador   = × 0,4                        art. 20
   ├─ 2ª instancia = × 0,30 / 0,35 / 0,40         art. 30
   │
   ├─ Auxiliares   = 5-10 % de la base final      art. 21
   └─ Partidor     = 2-3 % de la base final       art. 35 (solo sucesión)
```

Si el resultado es provisorio (art. 12), la cadena es la misma: lo único que
cambia es que solo se enuncia el mínimo.

---

> Este documento describe **lo que el sistema hace hoy**, no lo que debería
> hacer. Las decisiones interpretativas —dónde la ley admite más de una lectura
> y por qué se eligió una— están en
> [03_REGLAS_DE_NEGOCIO.md](03_REGLAS_DE_NEGOCIO.md). Lo que se sabe que falta o
> está mal, en [08_DEUDA_TECNICA_FUNCIONAL.md](08_DEUDA_TECNICA_FUNCIONAL.md).
