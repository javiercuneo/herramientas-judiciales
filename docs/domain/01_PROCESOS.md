# Procesos Judiciales y Extrajudiciales

> Documento de dominio — Calculadora de honorarios bajo Ley 27.423

Este documento describe cada tipo de proceso soportado por el sistema, detallando su finalidad, inputs requeridos, pasos del wizard, preguntas condicionales, datos que se ignoran, resultado que produce, artículos de la ley aplicables y módulos de cálculo que utiliza.

---

## 1. Conocimiento (De Conocimiento)

### Finalidad
Calcular los honorarios de los profesionales intervinientes (patrocinante, apoderado, procurador, auxiliares) en un juicio de conocimiento ordinario o abreviado, conforme a la escala del art. 21 de la Ley 27.423.

### Cuándo se utiliza
Cuando el usuario necesita calcular honorarios en un juicio civil o comercial de conocimiento, incluyendo diversas sub-categorías según la materia del litigio.

### Qué inputs requiere
- **Monto base del juicio**: Valor económico del litigio o pretensión.
- **Sub-objeto del juicio**: Categoría específica dentro de los conocimientos:
  - desalojo (con sub-opciones: vivienda, civil, laboral)
  - sumas_dinero
  - inmuebles
  - derechos_crediticios
  - 	itulos_acciones
  - establecimientos
  - uso_habitacion
  - escrituracion
  - familia_alimentos
  - familia_liquidacion
  - posesorias_interdictos (con sub-opciones: beneficio, demas)
  - incidencia_colectiva
- **Modo de terminación del juicio**: Cómo concluyó el proceso:
  - sentencia (con sub-opción: admitida o rechazada)
  - modos_anormales (con sub-opción: antes o después de apertura a prueba)
  - caducidad (con sub-opción: art22 o art25; art25 incluye pregunta sobre apertura a prueba)
  - provisorios

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Conocimiento)
2. Selección del sub-objeto del juicio
3. Ingreso del monto base
4. Selección del modo de terminación
5. Preguntas condicionales según sub-objeto y terminación
6. Cálculo de honorarios según escala del art. 21
7. Adición de honorarios de patrocinante, apoderado, procurador y auxiliares
8. Resultado final con desglose

### Qué preguntas son condicionales
- **Si sub-objeto = desalojo** → Pregunta si es vivienda (reduce base 20% art. 40), civil o laboral
- **Si terminación = sentencia** → Pregunta si fue admitida (honorarios completos) o rechazada (reduce base 30% art. 22)
- **Si terminación = modos_anormales** → Pregunta si ocurrió antes o después de apertura a prueba
- **Si terminación = caducidad** → Pregunta si es art22 o art25; si art25, pregunta sobre apertura a prueba
- **Si sub-objeto = posesorias_interdictos** → Pregunta si es beneficio exclusivo (reduce final 20% art. 38) o demas
- **Si sub-objeto = incidencia_colectiva** → Reduce honorarios finales 25% (art. 49)

### Qué datos ignora
- No se utiliza el valor de la UMA para cálculo de escala
- No se aplica reducción por juicio abreviado (solo aplica en ciertos sub-objetos)
- No se considera la segunda instancia en el cálculo inicial (se calcula aparte)

### Qué resultado produce
- **Honorarios del patrocinante**: Calculados según escala del art. 21
- **Honorarios del apoderado**: 40% adicionales sobre patrocinante (art. 21)
- **Honorarios del procurador**: 40% sobre base (art. 21)
- **Honorarios de auxiliares**: 5%-10% sobre base según categoría
- **Total general**: Suma de todos los honorarios
- **Segunda instancia** (opcional): Calculada aparte según art. 30

### Qué artículos de la ley intervienen
- **Art. 21**: Escala de honorarios para juicios de conocimiento
- **Art. 22**: Reducción del 30% para demanda rechazada
- **Art. 30**: Segunda instancia
- **Art. 38**: Reducción del 20% para posesorias interdictos con beneficio exclusivo
- **Art. 40**: Reducción del 20% para desalojo de vivienda
- **Art. 49**: Reducción del 25% para incidencia colectiva

### De qué otros módulos depende
- escala_art21 — Cálculo de la escala por monto
- patrocinante — Cálculo de honorarios del patrocinante
- apoderado — Cálculo de honorarios del apoderado (+40%)
- procurador — Cálculo de honorarios del procurador
- auxiliares — Cálculo de honorarios de auxiliares (5%-10%)
- segunda_instancia — Cálculo de honorarios de segunda instancia (art. 30)

---

## 2. Ejecución de Sentencia

### Finalidad
Calcular los honorarios en el proceso de ejecución de una sentencia firme, aplicando las reducciones específicas del art. 41.

### Cuándo se utiliza
Cuando el juicio de conocimiento ya terminó con sentencia y se está ejecutando la condena. Se calcula sobre la base de la sentencia ejecutada.

### Qué inputs requiere
- **Monto base de la sentencia**: Valor económico de lo decidido en sentencia
- **Modo de terminación**: sentencia, modos_anormales, caducidad o provisorios
- **Tuvo excepciones**: si o 
o — Si el ejecutado planteó excepciones en la ejecución

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Ejecución de Sentencia)
2. Ingreso del monto base
3. Selección del modo de terminación
4. Pregunta sobre excepciones
5. Preguntas condicionales según terminación
6. Cálculo con escala del art. 21 reducida al 50% (art. 41)
7. Reducción adicional del 10% si no hubo excepciones (art. 41 + art. 34)
8. Cálculo de patrocinante, apoderado, procurador y auxiliares
9. Resultado final

### Qué preguntas son condicionales
- **Si terminación = modos_anormales** → Pregunta si fue antes o después de apertura a prueba
- **Si terminación = caducidad** → Pregunta si es art22 o art25
- **Si excepciones = 
o** → Aplica reducción adicional del 10%

### Qué datos ignora
- No se utilizan sub-objetos del juicio original (desalojo, sumas de dinero, etc.)
- No se aplica la reducción por demanda rechazada (art. 22) — ya está contemplada en el proceso original
- No se considera la segunda instancia en este cálculo

### Qué resultado produce
- **Base de cálculo**: Monto de la sentencia
- **Escala reducida**: 50% de la escala del art. 21 (art. 41)
- **Reducción adicional**: 10% si no hubo excepciones (art. 34)
- **Honorarios del patrocinante**: Calculados sobre la escala reducida
- **Honorarios del apoderado**: 40% adicionales sobre patrocinante
- **Honorarios del procurador**: 40% sobre base
- **Honorarios de auxiliares**: 5%-10% sobre base
- **Total general**: Suma de todos los honorarios

### Qué artículos de la ley intervienen
- **Art. 21**: Escala de referencia para el cálculo base
- **Art. 34**: Reducción del 10% cuando no hubo excepciones
- **Art. 41**: Reducción del 50% para ejecución de sentencia

### De qué otros módulos depende
- escala_art21 — Cálculo de la escala por monto
- patrocinante — Cálculo de honorarios del patrocinante
- apoderado — Cálculo de honorarios del apoderado (+40%)
- procurador — Cálculo de honorarios del procurador
- auxiliares — Cálculo de honorarios de auxiliares (5%-10%)

---

## 3. Ejecutivo

### Finalidad
Calcular los honorarios en un juicio ejecutivo (proceso de ejecución forzada de obligaciones documentadas en título ejecutivo), conforme al art. 21 con reducciones aplicables.

### Cuándo se utiliza
Cuando se trabaja en un juicio ejecutivo por deudas documentadas (cheques, pagarés, facturas, etc.) y se requiere el cálculo de honorarios.

### Qué inputs requiere
- **Monto base del juicio ejecutivo**: Valor económico de la obligación ejecutada
- **Modo de terminación**: sentencia, modos_anormales, caducidad o provisorios
- **Tuvo excepciones**: si o 
o — Si el ejecutado planteó excepciones de previo y especial pronunciamiento

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Ejecutivo)
2. Ingreso del monto base
3. Selección del modo de terminación
4. Pregunta sobre excepciones
5. Preguntas condicionales según terminación
6. Cálculo con escala del art. 21
7. Reducción del 10% si no hubo excepciones (art. 34)
8. Cálculo de patrocinante, apoderado, procurador y auxiliares
9. Resultado final

### Qué preguntas son condicionales
- **Si terminación = modos_anormales** → Pregunta si fue antes o después de apertura a prueba
- **Si terminación = caducidad** → Pregunta si es art22 o art25
- **Si excepciones = 
o** → Aplica reducción del 10% (art. 34)

### Qué datos ignora
- No se utilizan sub-objetos ni categorías especiales del juicio de conocimiento
- No se aplica la reducción del 50% del art. 41 (solo para ejecución de sentencia)
- No se considera la segunda instancia en este cálculo

### Qué resultado produce
- **Base de cálculo**: Monto del juicio ejecutivo
- **Escala del art. 21**: Sin reducción adicional porcentual (salvo excepciones)
- **Reducción por ausencia de excepciones**: 10% (art. 34) si no hubo excepciones
- **Honorarios del patrocinante**: Calculados según escala
- **Honorarios del apoderado**: 40% adicionales sobre patrocinante
- **Honorarios del procurador**: 40% sobre base
- **Honorarios de auxiliares**: 5%-10% sobre base
- **Total general**: Suma de todos los honorarios

### Qué artículos de la ley intervienen
- **Art. 21**: Escala de honorarios para juicios ejecutivos
- **Art. 34**: Reducción del 10% cuando no hubo excepciones

### De qué otros módulos depende
- escala_art21 — Cálculo de la escala por monto
- patrocinante — Cálculo de honorarios del patrocinante
- apoderado — Cálculo de honorarios del apoderado (+40%)
- procurador — Cálculo de honorarios del procurador
- auxiliares — Cálculo de honorarios de auxiliares (5%-10%)

---

## 4. Sucesión

### Finalidad
Calcular los honorarios en un juicio sucesorio (apertura de sucesión, inventario, partición, etc.), incluyendo los honorarios del partidor cuando corresponda.

### Cuándo se utiliza
Cuando se requiere calcular honorarios en un proceso sucesorio, ya sea con un único letrado o con varios profesionales intervinientes.

### Qué inputs requiere
- **Monto base del patrimonio sucesorio**: Valor total del patrimonio a distribuir
- **Sucesión con único letrado**: si o 
o — Indica si un solo abogado intervino en todo el proceso

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Sucesión)
2. Ingreso del monto base (valor del patrimonio)
3. Pregunta sobre único letrado
4. Si es único letrado: aplica reducción del 50% sobre escala (art. 35)
5. Cálculo de la escala del art. 21
6. Cálculo de honorarios del partidor (2%-3% del base, art. 35)
7. Cálculo de patrocinante, apoderado, procurador y auxiliares
8. Resultado final

### Qué preguntas son condicionales
- **Si único letrado = si** → Reduce la escala al 50% (art. 35)
- **Siempre** → Se calculan honorarios del partidor (2%-3% del monto base)

### Qué datos ignora
- No se utilizan sub-objetos ni categorías del juicio de conocimiento
- No se aplica la reducción por demanda rechazada (art. 22)
- No se considera modo de terminación (la sucesión tiene su propia lógica)
- No se aplica la reducción del 50% por ejecución de sentencia (art. 41)

### Qué resultado produce
- **Base de cálculo**: Valor del patrimonio sucesorio
- **Escala del art. 21**: Calculada sobre el patrimonio
- **Reducción por único letrado**: 50% si corresponde (art. 35)
- **Honorarios del partidor**: 2%-3% del monto base (art. 35)
- **Honorarios del patrocinante**: Calculados según escala
- **Honorarios del apoderado**: 40% adicionales sobre patrocinante
- **Honorarios del procurador**: 40% sobre base
- **Honorarios de auxiliares**: 5%-10% sobre base
- **Total general**: Suma de todos los honorarios

### Qué artículos de la ley intervienen
- **Art. 21**: Escala de honorarios para juicios sucesorios
- **Art. 35**: Reducción del 50% para sucesión con único letrado; honorarios del partidor (2%-3%)

### De qué otros módulos depende
- escala_art21 — Cálculo de la escala por monto
- patrocinante — Cálculo de honorarios del patrocinante
- apoderado — Cálculo de honorarios del apoderado (+40%)
- procurador — Cálculo de honorarios del procurador
- auxiliares — Cálculo de honorarios de auxiliares (5%-10%)
- partidor — Cálculo de honorarios del partidor (2%-3%)

---

## 5. Exhorto

### Finalidad
Calcular los honorarios por la actuación profesional en un exhorto (carta rogatoria), conforme al art. 50 de la Ley 27.423.

### Cuándo se utiliza
Cuando un abogado actúa en un exhorto emitido por un juez de otro distrito, y se requiere calcular sus honorarios por la labor realizada.

### Qué inputs requiere
- **No requiere monto base**: Los honorarios se calculan en función de la cantidad de UMA
- **No requiere selección de sub-objeto**: La categoría se determina por el inciso del art. 50

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Exhorto)
2. Selección del inciso del art. 50:
   - **Inciso a)**: Asistencia a audiencia — Mínimo 3 UMA
   - **Inciso b)**: Trámites judiciales simples — 10 a 20 UMA
   - **Inciso c)**: Trámites judiciales complejos — 7 a 30 UMA
3. Cálculo inmediato del honorario según la tabla de UMA
4. Resultado final

### Qué preguntas son condicionales
- No hay preguntas condicionales — el cálculo es directo según el inciso seleccionado

### Qué datos ignora
- No se utiliza monto base del juicio
- No se aplica escala del art. 21
- No se calculan honorarios de apoderado, procurador o auxiliares
- No se considera modo de terminación
- No se aplica reducción por demanda rechazada u otros conceptos

### Qué resultado produce
- **Honorario fijo en UMA**: Calculado según el inciso del art. 50
- **Monto en pesos**: UMA × valor de la UMA vigente al momento del cálculo
- **No incluye**: Honorarios de apoderado, procurador o auxiliares

### Qué artículos de la ley intervienen
- **Art. 50**: Honorarios por exhortos (incisos a, b, c)

### De qué otros módulos depende
- valor_uma — Consulta del valor de la UMA vigente
- exhorto_calc — Cálculo directo por inciso (sin escala)

---

## 6. Incidente

### Finalidad
Calcular los honorarios en un incidente surgido dentro de un proceso principal, conforme al art. 29 inc. g de la Ley 27.423.

### Cuándo se utiliza
Cuando se trabaja en un incidente (art. 157 y ss. del CPC) y se requiere calcular los honorarios de los profesionales intervinientes en dicho incidente.

### Qué inputs requiere
- **Monto base del incidente**: Valor económico del incidente

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Incidente)
2. Ingreso del monto base
3. Cálculo de honorarios según escala del art. 29 inc. g (2%-20% del base)
4. Cálculo de patrocinante, apoderado, procurador y auxiliares
5. Resultado final

### Qué preguntas son condicionales
- No hay preguntas condicionales — el cálculo es directo sobre el monto base

### Qué datos ignora
- No se utiliza modo de terminación del juicio principal
- No se aplica escala del art. 21 (se usa la del art. 29 inc. g)
- No se considera si hubo sentencia rechazada o demanda admitida
- No se aplica reducción por único letrado (art. 35)
- No se aplica reducción del 50% por ejecución de sentencia (art. 41)

### Qué resultado produce
- **Base de cálculo**: Monto del incidente
- **Escala del art. 29 inc. g**: 2%-20% del monto base (según tabla de la ley 21.839)
- **Honorarios del patrocinante**: Calculados según escala del incidente
- **Honorarios del apoderado**: 40% adicionales sobre patrocinante
- **Honorarios del procurador**: 40% sobre base
- **Honorarios de auxiliares**: 5%-10% sobre base
- **Total general**: Suma de todos los honorarios

### Qué artículos de la ley intervienen
- **Art. 29 inc. g**: Honorarios por incidentes — 2 etapas del procedimiento
- **Ley 21.839**: Referencia histórica para la escala de incidentes

### De qué otros módulos depende
- escala_art29g — Cálculo de la escala por monto para incidentes
- patrocinante — Cálculo de honorarios del patrocinante
- apoderado — Cálculo de honorarios del apoderado (+40%)
- procurador — Cálculo de honorarios del procurador
- auxiliares — Cálculo de honorarios de auxiliares (5%-10%)

---

## 7. Medida Cautelar

### Finalidad
Calcular los honorarios por la labor profesional en una medida cautelar (embargo, inhibición, secuestro, etc.), conforme al art. 37 de la Ley 27.423.

### Cuándo se utiliza
Cuando se requiere calcular honorarios por la obtención o defensa de una medida cautelar, considerando si hubo oposición del afectado.

### Qué inputs requiere
- **Monto base de la medida cautelar**: Valor económico de la medida
- **Oposición del afectado**: si o 
o — Si el afectado por la medida se opuso judicialmente

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Medida Cautelar)
2. Ingreso del monto base
3. Pregunta sobre oposición
4. Cálculo de escala del art. 21
5. Reducción del 25% si no hubo oposición (art. 37)
6. Si hubo oposición: escala completa del 50% (art. 37)
7. Cálculo de patrocinante, apoderado, procurador y auxiliares
8. Resultado final

### Qué preguntas son condicionales
- **Si oposición = 
o** → Aplica reducción del 25% sobre escala del art. 21 (art. 37)
- **Si oposición = si** → Aplica escala del 50% sobre escala del art. 21 (art. 37)

### Qué datos ignora
- No se utiliza modo de terminación del juicio
- No se aplica reducción por demanda rechazada (art. 22)
- No se aplica reducción por único letrado (art. 35)
- No se calcula segunda instancia (art. 30)
- No se aplican reducciones por ejecución de sentencia (art. 41)

### Qué resultado produce
- **Base de cálculo**: Monto de la medida cautelar
- **Porcentaje aplicado**: 25% sin oposición / 50% con oposición (art. 37)
- **Honorarios del patrocinante**: Calculados según el porcentaje aplicado
- **Honorarios del apoderado**: 40% adicionales sobre patrocinante
- **Honorarios del procurador**: 40% sobre base
- **Honorarios de auxiliares**: 5%-10% sobre base
- **Total general**: Suma de todos los honorarios
- **No incluye**: Cálculo de segunda instancia

### Qué artículos de la ley intervienen
- **Art. 37**: Honorarios por medida cautelar — 25% sin oposición, 50% con oposición

### De qué otros módulos depende
- escala_art21 — Cálculo de la escala por monto
- patrocinante — Cálculo de honorarios del patrocinante
- apoderado — Cálculo de honorarios del apoderado (+40%)
- procurador — Cálculo de honorarios del procurador
- auxiliares — Cálculo de honorarios de auxiliares (5%-10%)

---

## 8. Homologación de Desocupación

### Finalidad
Calcular los honorarios en un juicio de homologación de un acuerdo de desocupación (convenio de desalojo), conforme al art. 40 de la Ley 27.423.

### Cuándo se utiliza
Cuando se trabaja en un juicio de homologación de un acuerdo de desocupación, ya sea de vivienda o de otro tipo de inmueble.

### Qué inputs requiere
- **Tipo de inmueble**: vivienda o otros — Si el inmueble es vivienda habitada u otro tipo de inmueble

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Homologación de Desocupación)
2. Pregunta sobre tipo de inmueble
3. Si es vivienda:
   - Reduce base un 20% (art. 40)
   - Calcula escala del art. 21 sobre base reducida
   - Aplica reducción del 50% sobre honorarios (art. 40 pár. 2)
4. Si es otros:
   - Calcula escala del art. 21 sobre base completa
   - Aplica reducción del 50% sobre honorarios (art. 40 pár. 2)
5. Cálculo de patrocinante, apoderado, procurador y auxiliares
6. Resultado final

### Qué preguntas son condicionales
- **Si tipo = vivienda** → Reduce base un 20% ANTES de calcular la escala (art. 40)
- **Siempre** → Aplica reducción del 50% sobre los honorarios calculados (art. 40 pár. 2)

### Qué datos ignora
- No se utiliza modo de terminación del juicio
- No se aplica reducción por demanda rechazada (art. 22)
- No se aplica reducción por único letrado (art. 35)
- No se calcula segunda instancia
- No se aplican reducciones por ejecución de sentencia (art. 41)

### Qué resultado produce
- **Base de cálculo**: Monto del acuerdo de desocupación
- **Reducción por vivienda**: 20% sobre base (solo si es vivienda, art. 40)
- **Escala del art. 21**: Calculada sobre base (con o sin reducción por vivienda)
- **Reducción del 50%**: Siempre aplicada sobre honorarios (art. 40 pár. 2)
- **Honorarios del patrocinante**: Calculados sobre base reducida
- **Honorarios del apoderado**: 40% adicionales sobre patrocinante
- **Honorarios del procurador**: 40% sobre base
- **Honorarios de auxiliares**: 5%-10% sobre base
- **Total general**: Suma de todos los honorarios

### Qué artículos de la ley intervienen
- **Art. 40**: Homologación de desocupación — Reducción del 20% por vivienda y 50% sobre honorarios

### De qué otros módulos depende
- escala_art21 — Cálculo de la escala por monto
- patrocinante — Cálculo de honorarios del patrocinante
- apoderado — Cálculo de honorarios del apoderado (+40%)
- procurador — Cálculo de honorarios del procurador
- auxiliares — Cálculo de honorarios de auxiliares (5%-10%)

---

## 9. Mínimos Judiciales (art. 19 inc. a)

### Finalidad
Consultar los honorarios mínimos para asuntos judiciales sin apreciación económica, conforme al art. 19 inc. a) de la Ley 27.423.

### Cuándo se utiliza
Cuando se requiere determinar el honorario mínimo que corresponde a un profesional por su actuación en un asunto judicial que no tiene valor económico cuantificable (amparos, habeas corpus, etc.).

### Qué inputs requiere
- **No requiere monto base**: Es una consulta de tabla de valores fijos en UMA
- **Categoría del asunto**: Tipo de asunto judicial sin cuantía (seleccionado de una lista predefinida)

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Mínimos Judiciales)
2. Selección de la categoría del asunto
3. Consulta de la tabla de valores en UMA
4. Cálculo del monto en pesos (UMA × valor vigente)
5. Resultado final

### Qué preguntas son condicionales
- No hay preguntas condicionales — es una consulta directa de tabla

### Qué datos ignora
- No se utiliza monto base del juicio
- No se aplica escala del art. 21
- No se calculan honorarios de apoderado, procurador o auxiliares
- No se considera modo de terminación
- No se aplica reducción por demanda rechazada u otros conceptos

### Qué resultado produce
- **Honorario mínimo en UMA**: Valor fijo según la categoría
- **Monto en pesos**: UMA × valor de la UMA vigente
- **No incluye**: Honorarios de otros profesionales

### Qué artículos de la ley intervienen
- **Art. 19 inc. a)**: Honorarios mínimos para asuntos judiciales sin apreciación económica

### De qué otros módulos depende
- valor_uma — Consulta del valor de la UMA vigente
- minimos_judiciales_calc — Consulta de tabla de valores fijos

---

## 10. Mínimos Extrajudiciales (art. 19 inc. b)

### Finalidad
Consultar los honorarios mínimos para asuntos extrajudiciales, conforme al art. 19 inc. b) de la Ley 27.423.

### Cuándo se utiliza
Cuando se requiere determinar el honorario mínimo que corresponde a un profesional por su actuación en trámites extrajudiciales (asesoramiento, dictámenes, etc.).

### Qué inputs requiere
- **No requiere monto base**: Es una consulta de tabla de valores fijos en UMA
- **Categoría del asunto**: Tipo de asunto extrajudicial (seleccionado de una lista predefinida)

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Mínimos Extrajudiciales)
2. Selección de la categoría del asunto
3. Consulta de la tabla de valores en UMA
4. Cálculo del monto en pesos (UMA × valor vigente)
5. Resultado final

### Qué preguntas son condicionales
- No hay preguntas condicionales — es una consulta directa de tabla

### Qué datos ignora
- No se utiliza monto base del juicio
- No se aplica escala del art. 21
- No se calculan honorarios de apoderado, procurador o auxiliares
- No se considera modo de terminación
- No se aplica reducción por demanda rechazada u otros conceptos

### Qué resultado produce
- **Honorario mínimo en UMA**: Valor fijo según la categoría
- **Monto en pesos**: UMA × valor de la UMA vigente
- **No incluye**: Honorarios de otros profesionales

### Qué artículos de la ley intervienen
- **Art. 19 inc. b)**: Honorarios mínimos para asuntos extrajudiciales

### De qué otros módulos depende
- valor_uma — Consulta del valor de la UMA vigente
- minimos_extrajudiciales_calc — Consulta de tabla de valores fijos

---

## 11. Mínimos Art. 58

### Finalidad
Consultar los honorarios mínimos para asuntos con apreciación económica que no están contemplados en las escalas generales de la ley, conforme al art. 58 de la Ley 27.423.

### Cuándo se utiliza
Cuando se requiere determinar el honorario mínimo para un tipo de trabajo profesional que, aunque tiene valor económico, no encaja en las categorías de juicios de conocimiento, ejecutivo, sucesión, etc.

### Qué inputs requiere
- **No requiere monto base**: Es una consulta de tabla de valores fijos en UMA
- **Categoría del asunto**: Tipo de asunto con cuantía no contemplado en otras escalas

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Mínimos Art. 58)
2. Selección de la categoría del asunto
3. Consulta de la tabla de valores en UMA
4. Cálculo del monto en pesos (UMA × valor vigente)
5. Resultado final

### Qué preguntas son condicionales
- No hay preguntas condicionales — es una consulta directa de tabla

### Qué datos ignora
- No se utiliza monto base del juicio
- No se aplica escala del art. 21
- No se calculan honorarios de apoderado, procurador o auxiliares
- No se considera modo de terminación
- No se aplica reducción por demanda rechazada u otros conceptos

### Qué resultado produce
- **Honorario mínimo en UMA**: Valor fijo según la categoría
- **Monto en pesos**: UMA × valor de la UMA vigente
- **No incluye**: Honorarios de otros profesionales

### Qué artículos de la ley intervienen
- **Art. 58**: Honorarios mínimos para asuntos con apreciación económica no contemplados en otras escalas

### De qué otros módulos depende
- valor_uma — Consulta del valor de la UMA vigente
- minimos_art58_calc — Consulta de tabla de valores fijos

---

## 12. Mínimos Recursos CSJN

### Finalidad
Consultar los honorarios mínimos para la intervención profesional en recursos ante la Corte Suprema de Justicia de la Nación.

### Cuándo se utiliza
Cuando se requiere determinar el honorario mínimo para un abogado que actúa en un recurso extraordinario federal, recurso de queja, o cualquier otro recurso ante la CSJN.

### Qué inputs requiere
- **No requiere monto base**: Es una consulta de tabla de valores fijos en UMA
- **Tipo de recurso**: Categoría del recurso ante la CSJN (seleccionado de una lista predefinida)

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Mínimos Recursos CSJN)
2. Selección del tipo de recurso
3. Consulta de la tabla de valores en UMA
4. Cálculo del monto en pesos (UMA × valor vigente)
5. Resultado final

### Qué preguntas son condicionales
- No hay preguntas condicionales — es una consulta directa de tabla

### Qué datos ignora
- No se utiliza monto base del juicio
- No se aplica escala del art. 21
- No se calculan honorarios de apoderado, procurador o auxiliares
- No se considera modo de terminación
- No se aplica reducción por demanda rechazada u otros conceptos

### Qué resultado produce
- **Honorario mínimo en UMA**: Valor fijo según el tipo de recurso
- **Monto en pesos**: UMA × valor de la UMA vigente
- **No incluye**: Honorarios de otros profesionales

### Qué artículos de la ley intervienen
- **Disposiciones específicas de la CSJN**: Normativa propia del Máximo Tribunal sobre honorarios mínimos

### De qué otros módulos depende
- valor_uma — Consulta del valor de la UMA vigente
- minimos_csjn_calc — Consulta de tabla de valores fijos

---

## 13. Mínimos Auxiliares

### Finalidad
Consultar los honorarios mínimos para auxiliares de la justicia (peritos, martilleros, contadores, etc.), conforme a la normativa aplicable.

### Cuándo se utiliza
Cuando se requiere determinar el honorario mínimo que corresponde a un auxiliar de la justicia por su actuación en un proceso judicial.

### Qué inputs requiere
- **No requiere monto base**: Es una consulta de tabla de valores fijos en UMA
- **Categoría del auxiliar**: Tipo de auxiliar de la justicia (perito, martillero, contador, etc.)

### Qué pasos del wizard aparecen
1. Selección del tipo de proceso (Mínimos Auxiliares)
2. Selección de la categoría del auxiliar
3. Consulta de la tabla de valores en UMA
4. Cálculo del monto en pesos (UMA × valor vigente)
5. Resultado final

### Qué preguntas son condicionales
- No hay preguntas condicionales — es una consulta directa de tabla

### Qué datos ignora
- No se utiliza monto base del juicio
- No se aplica escala del art. 21
- No se calculan honorarios de patrocinante, apoderado o procurador
- No se considera modo de terminación
- No se aplica reducción por demanda rechazada u otros conceptos

### Qué resultado produce
- **Honorario mínimo en UMA**: Valor fijo según la categoría del auxiliar
- **Monto en pesos**: UMA × valor de la UMA vigente
- **No incluye**: Honorarios de abogados u otros profesionales

### Qué artículos de la ley intervienen
- **Disposiciones sobre auxiliares de justicia**: Normativa específica para honorarios de auxiliares (peritos, martilleros, etc.)

### De qué otros módulos depende
- valor_uma — Consulta del valor de la UMA vigente
- minimos_auxiliares_calc — Consulta de tabla de valores fijos

---

## Tabla Resumen de Procesos

| Proceso | Requiere monto base | Usa escala art. 21 | Tiene reducciones | Incluye 2ª instancia | Artículos principales |
|---|---|---|---|---|---|
| Conocimiento | Sí | Sí | Según sub-objeto y terminación | Sí | 21, 22, 30, 38, 40, 49 |
| Ejecución de Sentencia | Sí | Sí (50%) | 50% siempre + 10% sin excepciones | No | 21, 34, 41 |
| Ejecutivo | Sí | Sí | 10% sin excepciones | No | 21, 34 |
| Sucesión | Sí | Sí | 50% si único letrado | Sí | 21, 35 |
| Exhorto | No | No | No | No | 50 |
| Incidente | Sí | No (usa art. 29g) | No | No | 29g, Ley 21839 |
| Medida Cautelar | Sí | Sí (reducida) | 25% sin oposición / 50% con oposición | No | 37 |
| Homologación Desocupación | No explícito | Sí | 20% vivienda + 50% siempre | No | 40 |
| Mínimos Judiciales | No | No | No | No | 19 inc. a |
| Mínimos Extrajudiciales | No | No | No | No | 19 inc. b |
| Mínimos Art. 58 | No | No | No | No | 58 |
| Mínimos Recursos CSJN | No | No | No | No | Disposiciones CSJN |
| Mínimos Auxiliares | No | No | No | No | Disposiciones auxiliares |

---

## Flujo General de Cálculo

`
1. Usuario selecciona tipo de proceso
         │
         ├── ¿Es un mínimo? ──Sí──► Consulta de tabla ──► Resultado
         │
         └── No
              │
         2. Ingreso de monto base
              │
         3. Selección de sub-objeto (si aplica)
              │
         4. Selección de modo de terminación (si aplica)
              │
         5. Preguntas condicionales
              │
         6. Cálculo de escala base
              │
         7. Aplicación de reducciones
              │
         8. Cálculo de honorarios profesionales
              │
         9. Resultado final con desglose
`

---

> **Nota**: Este documento refleja la lógica de cálculo implementada en el sistema. Para detalles sobre los valores específicos de las escalas, consulte los artículos de la Ley 27.423 y sus modificaciones.