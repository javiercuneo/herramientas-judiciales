# Matriz comparativa de procesos

> Documento de dominio — Ley 27.423

Los ocho procesos, uno al lado del otro. Es el documento para mirar de un
vistazo qué aplica a cada uno; el [01](01_PROCESOS.md) va en profundidad proceso
por proceso y el [05](05_DEPENDENCIAS.md) va por el código.

> **Verificado el 7/8/2026** contra el motor y contra `lib/legal/minimos-data.ts`.
> Lo que se corrigió está al final: entre otras cosas, decía que el 25 % y el
> 50 % de la medida cautelar dependen de que la cautelar «se despache» o «se
> rechace», que no es lo que dice el art. 37 ni lo que hace el motor.

---

## La matriz

| Proceso | Clave | Base | Escala art. 21 | Sobre la base | Sobre la escala | Sobre el honorario | Roles | Auxiliares | 2ª inst. | Partidor | Provisorios |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Conocimiento** | `conocimiento` | Sí, según el objeto | Sí | art. 40 −20 % vivienda · art. 22 −30 % demanda desestimada **o** caducidad art. 22 | art. 25 −50 % antes de la prueba | art. 38 −20 % posesorias · art. 49 −25 % colectivo | los 3 | Sí | **Sí** | No | **Sí** |
| **Ejecución de sentencia** | `ejecucion_sentencia` | Sí, el monto de la sentencia | Sí | **art. 22 −30 %**, igual que el conocimiento | art. 41 −50 % **siempre** · art. 25 −50 % | art. 34 −10 % sin excepciones | los 3 | Sí | **Sí** | No | **Sí** |
| **Ejecutivo** | `ejecutivo` | Sí, el monto del título | Sí | **art. 22 −30 %**, igual que el conocimiento | art. 25 −50 % antes de la prueba | art. 34 −10 % sin excepciones | los 3 | Sí | **Sí** | No | **Sí** |
| **Sucesión** | `sucesion` | Sí, el patrimonio que se transmite | Sí | ninguna | art. 35 −50 % único letrado | ninguna | los 3 | Sí | **Sí** | **Sí**, 2-3 % | No |
| **Medida cautelar** | `medida_cautelar` | Sí, el monto a asegurar | Sí | ninguna | **art. 37**: se toma el 25 % de la escala, o el 50 % si hubo oposición | ninguna | los 3 | Sí | No | No | No |
| **Homologación de desocupación** | `homologacion_desocupacion` | Sí, los alquileres del contrato | Sí | art. 40 −20 % si es vivienda | **art. 40**: 50 % de la escala, **siempre** | ninguna | los 3 | Sí | No | No | No |
| **Exhorto** | `exhorto` | **No**, fijo en UMA | No | — | — | — | ninguno | No | No | No | No |
| **Incidente** | `incidente` | Sí | **No**: 2 % a 20 % directo | ninguna | — | ninguna | solo patrocinante | No | No | No | No |

**Cómo leer las tres columnas de reducciones.** Son las tres etapas del cálculo,
y el orden importa: una quita sobre la base no da lo mismo que la misma quita
sobre la escala, porque la escala es progresiva y reducir la base puede cambiar
de tramo. Dentro de cada etapa **se multiplican, no se suman**.

**Los tres roles son alternativos entre sí**, no acumulativos: patrocinante,
apoderado (× 1,40) o procurador (× 0,40). No hay un total general.

---

## Lo que conviene no leer mal

**Ejecución de sentencia y ejecutivo sí tienen reducciones de base.** Se
pregunta la terminación igual que en el conocimiento, así que la demanda
desestimada y la caducidad por criterio del art. 22 les reducen la base un 30 %.
`resolveReglas()` les activa las mismas banderas.

**El art. 37 no es una reducción.** Dice qué porcentaje de la escala se toma
como base: el 25 %, elevado al 50 % «en casos de controversia u oposición».
Reducir un 25 % dejaría el 75 %; acá se aplica el 25 %. Y no depende de que la
cautelar prospere o no: depende de que el afectado se haya opuesto.

**El −50 % del art. 41 es incondicional** en la ejecución de sentencia. No
depende de nada que se pregunte.

**El 2 %-20 % del incidente es un rango plano, no una escala por tramos.** Y no
sale de la Ley 27.423: su art. 47 —incidentes entre el 8 % y el 25 % del
principal— fue observado por el Decreto 1077/2017 y nunca rigió. El 2 %-20 %
viene del art. 33 de la Ley 21.839 y se aplica a **todos** los incidentes, como
criterio declarado.

**Los provisorios no reducen nada.** El art. 12 no cambia ningún factor: hace
que solo se enuncie el mínimo. Solo existen en los tres procesos que preguntan
la terminación.

**La segunda instancia sale siempre en los cuatro procesos que la tienen**, en
la misma pasada: 30 % del mínimo, 35 % del máximo, y 40 % solo si la sentencia
se revocó **en todas sus partes en favor del apelante**.

**El partidor sale siempre en la sucesión**, sin preguntar nada, y es
independiente del honorario del letrado.

---

## Los mínimos arancelarios

Pantalla de consulta aparte: sin base, sin escala, sin reducciones. Los valores
son los de `lib/legal/minimos-data.ts`.

### Art. 19 inc. a — asuntos judiciales sin apreciación pecuniaria

| Concepto | UMA |
|---|---|
| Información sumaria | 2 |
| Trámite administrativo ante autoridad de aplicación | 2 |
| Trámite ante la Inspección General de Justicia | 3 |
| Presentación de denuncias penales con firma de letrado | 8 |
| Divorcio | 10 |
| Veeduría | 10 |
| Incidente de excarcelación o exención de prisión, audiencia de control de detención o medidas de coerción | 10 |
| Pedido y audiencia de suspensión de juicio a prueba | 10 |
| Acta de juicio abreviado | 15 |
| Actuación hasta la clausura de la instrucción o de control de la acusación | 15 |
| Adopción | 20 |
| Tutela | 20 |
| Actuación desde la clausura de la instrucción o del control de la acusación hasta la sentencia | 20 |
| Acción sobre efectos del divorcio y responsabilidad parental | 25 |
| Restricciones a la capacidad e inhabilitación | 25 |
| Reclamación e impugnación de filiación | 25 |
| Acciones de estado y familia | 25 |
| Acción de incidencia colectiva, hábeas corpus, hábeas data | 25 |

### Art. 19 inc. b — labor extrajudicial

| Concepto | UMA |
|---|---|
| Consulta verbal | 0,5 |
| Gastos administrativos de estudio para iniciación de juicios | 0,5 |
| Consulta con informe | 1 |
| Redacción de carta documento | 1 |
| Arreglo extrajudicial | 1 |
| Estudio o información de actuaciones judiciales o administrativas | 1,5 |
| Asistencia y asesoramiento del cliente en la realización de actos jurídicos | 1,5 |
| Redacción de contrato de locación | 2 |
| Redacción de otros contratos | 2 |
| Asistencia a una audiencia de mediación o conciliación | 2 |
| Redacción de boleto de compraventa | 3 |
| Redacción de denuncia penal sin firma de letrado | 3 |
| Redacción de contrato o estatuto de sociedades comerciales, asociaciones o fundaciones, y constitución de personas jurídicas en general | 5 |

### Los demás

| Artículo | Concepto | UMA |
|---|---|---|
| **31** | Queja por denegación de recurso | 15 |
| **31** | Interposición de recurso extraordinario y similares ante la CSJN | 20 |
| **44** | Actuaciones administrativas | 5 |
| **44** | Acciones contencioso administrativas | 7 |
| **48** | Inconstitucionalidad, amparo, hábeas data, hábeas corpus, cuando no puedan regularse por la escala del art. 21 | 20 |
| **58** | a) Procesos de conocimiento | 10 |
| **58** | b) Ejecutivos | 6 |
| **58** | c) Mediación | 2 |
| **58** | d) Auxiliares de la Justicia | 4 |
| **60** | Peritos y liquidadores de averías, en procesos no susceptibles de apreciación pecuniaria | 2 |
| **61 bis** | Peritos, por cada pericia | 2 |
| **61 bis** | Peritos que aceptaron el cargo y no presentaron dictamen por transacción, avenimiento o conciliación | 1/4 |

**El art. 58 no es «la tabla de los auxiliares».** Fija mínimos para juicios
susceptibles de apreciación pecuniaria no previstos en otros artículos, y los
auxiliares son **uno** de sus cuatro incisos.

**Los arts. 60 y 61 bis son texto con reforma publicada el 6/3/2026.** El 61 bis
desvincula el honorario del perito de la cuantía del juicio y del porcentaje de
incapacidad que dictamine.

---

## Una advertencia sobre esta tabla

**El motor no compara estos mínimos contra el resultado del cálculo.**
`calculate.ts` no importa `minimos-data.ts` y no hay ninguna verificación de
piso: un resultado puede quedar por debajo de un mínimo legal sin que la app lo
diga. Está en [`PLAN_COBERTURA_LEY.md`](../PLAN_COBERTURA_LEY.md), punto 8.

Y una advertencia más: **estas cifras están verificadas contra
`minimos-data.ts`, no contra la ley.** Ese archivo dice ser copia fiel del
asistente clásico, y que sea fiel a la copia no prueba que sea fiel a la norma.
Son unas cuarenta cifras que todavía nadie controló contra el texto.

---

## Qué decía este documento y no era así

- **«25 % si la cautelar se despacha, 50 % si se rechaza (art. 37).»**
  Inventado entero. El art. 37 no mira si la cautelar prospera: toma como base
  el 25 % de la escala, elevado al 50 % «en casos de controversia u oposición».
  Además, tal como estaba, hacía cobrar más por perder.
- **«La reducción del art. 41 se aplica cuando no hubo ejecución de sentencia
  previa.»** También inventado. El art. 41 se aplica siempre en la ejecución de
  sentencia y no hay ninguna condición de ese tipo, ni en la ley ni en el motor.
- **«Ejecución de sentencia y ejecutivo: reducciones de base, No.»** Sí las
  tienen: la demanda desestimada y la caducidad por art. 22 les reducen la base
  un 30 %, igual que al conocimiento. El [05](05_DEPENDENCIAS.md) repetía el
  mismo error.
- **«Incidente: patrocinante, No.»** El motor sí devuelve el honorario del
  patrocinante en el incidente —es el 2 %-20 %—. Lo que no devuelve es apoderado,
  procurador ni auxiliares.
- **«La base varía según el objeto del litigio (art. 52).»** El art. 52 dice que
  se regula al dictarse sentencia y que los intereses, frutos y accesorios
  integran la base. Las reglas por objeto son los arts. 22, 23, 39, 40, 43, 45 y
  46.
- **«La homologación se calcula sobre el total de los alquileres adeudados.»**
  El art. 40 dice el total de los alquileres **del contrato**.
- **El factor del 50 % de la homologación y el del art. 37 figuraban como
  «reducciones finales» o «factor propio» fuera de las tres etapas.** En el
  motor los dos son transformaciones de etapa `escala`.
- **Faltaban los provisorios**, que son una columna entera: existen en tres
  procesos y en cinco no.
- **Dos conceptos de la tabla de mínimos estaban mal nombrados**: «Efectos
  divorcio / **Registro Público**» —es «acción sobre efectos del divorcio y
  responsabilidad parental»— y «Peritos (**daños no pecuniarios**)» —el art. 60
  habla de procesos no susceptibles de apreciación pecuniaria, no de daños—.
- **«El art. 58 son los mínimos para auxiliares de Justicia, y el inciso a) es
  el más alto porque implica la mayor carga de trabajo del auxiliar.»** Los
  auxiliares son el inciso d). El inciso a) son 10 UMA para procesos de
  conocimiento, y no tiene que ver con auxiliares.
- **Las notas justificaban las cifras con razones inventadas** —«son más altos
  por la jerarquía del tribunal»— y estaban sin tildes.
