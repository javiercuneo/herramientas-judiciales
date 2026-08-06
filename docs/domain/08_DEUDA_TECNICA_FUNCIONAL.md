# Deuda Técnica Funcional — Peculiaridades, Casos Borde y Decisiones de Implementación

Este documento identifica funcionalidades que funcionan correctamente pero cuya **finalidad no es inmediatamente evidente** o que representan decisiones de interpretación legal no trivial. Está orientado a quien mantenga o evolucione el sistema.


> **Verificado el 5/8/2026 contra el texto de la ley**, que está en
> [00_LEY_27423.md](00_LEY_27423.md). No tenía errores de fondo.

---

### 1. Pregunta aparentemente redundante: "Demanda admitida o rechazada"

**Qué hace:** Cuando el usuario selecciona "sentencia" como modo de terminación y luego elige "demanda rechazada", se aplica una reducción del 30% sobre la base regulatoria.

**Base legal:** Art. 22: "Si fuere íntegramente desestimada la demanda o la reconvención, se tendrá como valor del pleito el importe de la misma, actualizado por intereses al momento de la sentencia, si ello correspondiere, disminuido en un 30%."

**Impacto:** Esta pregunta parece una simple clasificación binaria, pero tiene un efecto multiplicativo significativo sobre toda la base de cálculo. Un error de selección produce honorarios un 30% menores o mayores.

**Consideraciones:** El sistema muestra un cuadro de texto explicativo al seleccionar "rechazada", pero no hay segunda confirmación. La reducción se aplica silenciosamente en el paso de cálculo final (`calculations.js`, bloque de reducción de base).

---

### 2. Caducidad: dos criterios posibles (art.22 vs art.25)

**Qué hace:** Cuando se selecciona "caducidad" como modo de terminación, el sistema ofrece dos caminos interpretativos:
- **art.22** → la caducidad se trata como "demanda desestimada", reduciendo la base en 30%.
- **art.25** → la caducidad se trata como "modo anormal" (asimilándola a allanamiento/desistimiento/transacción), reduciendo la escala en 50% si fue antes de la apertura a prueba.

**Base legal:** La caducidad de la instancia (arts. 310 y ss. CPCCN) no se menciona explícitamente como categoría separada en la Ley 27.423. Esto genera la ambigüedad interpretativa.

**Impacto:** El usuario debe tomar una decisión jurídica que el sistema no puede tomar por él. Los dos caminos producen resultados distintos:
- art.22: base × 0.7 (reducción sobre base)
- art.25 antes de prueba: escala × 0.5 (reducción sobre escala)

**Consideraciones:** Esta es una decisión de política del sistema: delegar en el usuario la interpretación jurídica. Es correcto hacerlo así, pero un usuario no familiarizado con la ley podría no entender las consecuencias de cada opción.

---

### 3. Excepciones en ejecutivo y ejecución de sentencia

**Qué hace:** La pregunta sobre excepciones aparece **después** de la selección de modo de terminación, pero su efecto se aplica como **factor final** (sobre honorarios, no sobre base). La reducción del 10% se aplica solo cuando **no** se dedujeron excepciones.

**Base legal:**
- Art. 34 (ejecutivo): "No habiendo excepciones, los honorarios se reducirán en un 10%..."
- Art. 41 (ejecución sentencia): "No habiendo excepciones, los honorarios se reducirán en un 10%..."

**Impacto:** En ejecución sentencia, esta reducción del 10% es **adicional** a la reducción del 50% de la escala (art.41 también establece la reducción de escala). Es decir, se aplica factor escala 0.5 × factor final 0.9 = resultado con reducción acumulada del 55%.

**Consideraciones:** La pregunta de excepciones se presenta para ambos tipos de proceso (ejecutivo y ejecución de sentencia), pero el sistema maneja un solo campo `tuvoExcepciones`. La lógica de cálculo es la misma (factor final 0.9), aunque el fundamento legal invocado difiere ligeramente.

---

### 4. Provisorios: solo muestra mínimo

**Qué hace:** Cuando se selecciona "honorarios provisorios", el sistema oculta la columna de máximos y solo muestra el valor mínimo.

**Base legal:** Art. 12: "Si un profesional se aparta de un proceso o gestión antes de su conclusión normal, puede solicitar regulación provisoria de honorarios, los que se fijarán en el mínimo que le hubiere podido corresponder conforme a las actuaciones cumplidas."

**Impacto:** El cambio es visual (la columna máxima desaparece de todas las tablas) y funcional (el `factorEscala` y `factorFinal` se aplican igualmente sobre el mínimo).

**Consideraciones:** La lógica interna calcula ambos valores pero solo el mínimo se muestra. No hay validación adicional; la selección de provisorios se almacena en `wizardState.esProvisorio` y se consulta al generar el HTML de resultados.

---

### 5. Exhorto: no requiere base

**Qué hace:** Al seleccionar "exhorto", el sistema salta directamente al resultado con montos fijos en UMA según el art. 50, sin pedir base regulatoria.

**Base legal:** Art. 50: Establece montos fijos por categoría:
- a) Notificaciones: mínimo 3 UMA
- b) Inscripciones y actos registrales: 10 a 20 UMA
- c) Diligencias de prueba: 7 a 30 UMA

**Impacto:** El flujo del wizard se acorta. No se pasa por los pasos de contingencias, objeto ni base. El cálculo es directo: monto fijo × UMA.

**Consideraciones:** El exhorto es el único tipo de proceso donde la base es siempre fija. No hay escala del art. 21. El usuario solo ve los montos en pesos y UMA.

---

### 6. Incidente: no usa escala del art.21

**Qué hace:** El cálculo de honorarios por incidente usa porcentajes directos (2% a 20%) sobre la base, en lugar de la escala progresiva del art. 21.

**Base legal:** Art. 33 de la Ley 21.839 (no art. 21 de la Ley 27.423). El art. 29 inc. g) de la Ley 27.423 establece que los incidentes se dividen en 2 etapas.

**Impacto:** Los porcentajes son significativamente diferentes a la escala general. Un incidente con base baja puede producir honorarios proporcionalmente mayores que un juicio de conocimiento con la misma base.

**Consideraciones:** El sistema muestra una advertencia sobre la división en 2 etapas (art. 29 inc. g) pero no aplica automáticamente la división. El usuario debe regular cada etapa por separado.

---

### 7. Auxiliares: calculan sobre la base, no sobre honorarios

**Qué hace:** Los honorarios de auxiliares de justicia se calculan como 5% a 10% de la **base del juicio**, no sobre los honorarios del patrocinante.

**Base legal:** Art. 21 antepenúltimo párrafo: "El monto de los honorarios de los auxiliares de la justicia no podrá ser inferior al cinco por ciento (5%) ni superior al diez por ciento (10%) del monto del proceso."

**Impacto:** Esto produce una diferencia significativa respecto al procurador, que se calcula como 40% de los honorarios del patrocinante. Los auxiliares pueden tener honorarios absolutos mayores o menores que el procurador dependiendo de la base.

**Consideraciones:** En `calcularEscalaBase()`, los campos `auxMin` y `auxMax` se computan como `baseEnUMA × 0.05` y `baseEnUMA × 0.10` respectivamente. Estos valores no se ven afectados por reducciones de escala ni factor final.

---

### 8. Segunda instancia: tabla separada pero siempre visible

**Qué hace:** La tabla de honorarios de segunda instancia (art. 30) se muestra siempre en los resultados, sin importar si el caso involucra o no apelación.

**Base legal:** Art. 30: Establece porcentajes del 30% al 35% de los honorarios de primera instancia, y hasta 40% si la sentencia fue revocada.

**Impacto:** La tabla es puramente informativa. Los valores se calculan multiplicando los resultados finales de primera instancia por 0.30 (mínimo), 0.35 (máximo) y 0.40 (revocada).

**Consideraciones:** El usuario debe decidir si la segunda instancia aplica a su caso. No hay una pregunta en el wizard que pregunte si hubo apelación. Esta es una decisión de diseño: mantener la información visible para referencia.

---

### 9. Transparencia de escala anterior

**Qué hace:** Cuando la base supera un límite de escalón, el sistema muestra un cuadro explicativo con el "máximo de la escala anterior" y el "excedente" sobre el que se aplican los porcentajes nuevos.

**Base legal:** Art. 21 (interpretación literal): "En ningún caso los honorarios podrán ser inferiores al máximo del grado inmediato anterior de la escala, con más el incremento por aplicación al excedente de la alícuota que corresponde al grado siguiente."

**Impacto:** Esto explica por qué el mínimo no es simplemente `base × min%`. Por ejemplo, con base de 50 UMA (3a escala): el mínimo es 11.70 + (5 × 18%) = 12.60 UMA, no 50 × 18% = 9.00 UMA.

**Consideraciones:** El sistema adopta la interpretación literal (máximo del grado anterior + mínima del grado siguiente sobre excedente). Otra interpretación posible sería acumular todos los máximos previos, pero se considera contraria al texto expreso de la ley.

---

### 10. Desalojo laboral: base especial

**Qué hace:** Cuando se selecciona "desalojo laboral", el sistema muestra una explicación de cómo calcular la base (50% de la última remuneración mensual × 2 años) pero **no calcula el monto automáticamente**. El usuario debe ingresar el valor resultante.

**Base legal:** Art. 43: "En las demandas de desalojo por restitución de inmuebles o parte de ellos, concedidos a los trabajadores en virtud de la relación de trabajo, se considerará como valor del juicio el cincuenta por ciento (50%) de la última remuneración mensual normal y habitual que deba percibir según su categoría profesional por el término de dos (2) años."

**Impacto:** El usuario debe realizar un cálculo previo manual. El sistema no tiene acceso a datos salariales ni puede determinar la categoría profesional.

**Consideraciones:** Esta es una limitación inherentemente humana del sistema. La información de la base legal se muestra como referencia pero la carga del dato queda en el usuario.

---

### 11. Escrituración: toma el mayor entre bien y boleto

**Qué hace:** Para juicios de escrituración, el sistema indica al usuario que ingrese el valor del bien o el monto del boleto, **si es mayor**.

**Base legal:** Art. 46: "En los juicios de escrituración y, en general, en los procesos derivados del contrato de compraventa de inmuebles, a los efectos de la regulación, se aplicará la norma del artículo 23, inciso a), salvo que resulte un monto mayor del boleto de compraventa, en cuyo caso se aplicará este último."

**Impacto:** El sistema **no valida** ni impone la regla del "mayor". Deja la decisión en el usuario. Si el usuario ingresa un monto menor al que correspondería, el sistema calculará incorrectamente.

**Consideraciones:** Podría implementarse una validación o al menos una advertencia comparativa, pero el sistema actual no dispone de ambos valores simultáneamente.

---

### 12. Familia - Alimentos: base es 2 años de cuota

**Qué hace:** Para alimentos, el sistema indica que la base es el importe correspondiente a 2 años de la cuota fijada judicialmente, pero **no calcula el monto automáticamente**.

**Base legal:** Art. 39: "En los juicios de alimentos la base del cálculo de los honorarios será el importe correspondiente a 2 años de la cuota que se fijare judicialmente."

**Impacto:** El usuario debe multiplicar la cuota mensual × 24 meses e ingresar ese total. Un error en este cálculo afecta todo el resultado.

**Consideraciones:** Una calculadora auxiliar para este paso podría reducir errores. Actualmente depende exclusivamente del usuario.

---

### 13. Familia - Liquidación patrimonial: base es patrimonio adjudicado

**Qué hace:** En la liquidación del régimen patrimonial del matrimonio, la base es el patrimonio que se **adjudica a cada parte**, no el patrimonio total de la sociedad conyugal.

**Base legal:** Art. 45: "...se regularán honorarios al patrocinante o apoderado de cada parte conforme la escala del art. 21 calculado sobre el patrimonio que se le adjudique a su patrocinado o representado."

**Impacto:** Esto significa que en un matrimonio con patrimonio total de $10.000.000, si a cada cónyuge se le adjudica la mitad, la base para cada abogado es $5.000.000, no $10.000.000.

**Consideraciones:** El usuario debe comprender que la base no es el total de la sociedad conyugal sino la porción adjudicada. El texto legal explica esto, pero la distinción puede ser confusa.

---

### 14. Posesorias/interdictos: condición de "exclusivamente en beneficio"

**Qué hace:** La reducción del 20% (art. 38) solo se aplica cuando el usuario selecciona que la actuación fue "exclusivamente en beneficio del patrocinado, con relación a la cuota o parte defendida". Si elige "demás casos", no hay reducción.

**Base legal:** Art. 38: "El monto de los honorarios se reducirá en un 20% atendiendo al valor de los bienes conforme a lo dispuesto en el artículo 23 si fuere exclusivamente en beneficio del patrocinado, con relación a la cuota o parte defendida."

**Impacto:** La condición es binaria: o se aplica el 20% o no se aplica nada. No hay valores intermedios. El usuario debe evaluar jurídicamente si su actuación encuadra en "exclusivamente en beneficio".

**Consideraciones:** La pregunta se presenta como un sub-select dentro de la elección de "posesorias/interdictos" en el paso 3 (objeto). Es un caso donde la interfaz delega una decisión interpretativa en el usuario.

---

### 15. Incidencia colectiva: reducción del 25%

**Qué hace:** Cuando se selecciona "derechos de incidencia colectiva con contenido patrimonial", se aplica automáticamente una reducción del 25% sobre los honorarios finales.

**Base legal:** Art. 49: "En las acciones sobre derechos de incidencia colectiva con contenido patrimonial, los honorarios serán los que resulten de la aplicación del artículo 21, reducidos en un 25%."

**Impacto:** La reducción se aplica como `factorFinal *= 0.75` en el cálculo final. Es multiplicativa con otras reducciones que puedan estar activas.

**Consideraciones:** A diferencia de las posesorias (donde el usuario elige si aplicar o no la reducción), en incidencia colectiva la reducción es **automática**. No hay opción de "demás casos" equivalente.

---

### 16. Art. 21 antepenúltimo párrafo: auxiliares pueden perforar mínimos

**Qué hace:** El sistema muestra un texto informativo indicando que, según art. 21 (referenciando art. 478 CPCCN), los jueces pueden fijar honorarios de auxiliares por debajo de los mínimos en circunstancias especiales.

**Base legal:** Art. 21 antepenúltimo párrafo, que incorpora el principio de proporcionalidad del art. 478 del CPCCN.

**Impacto:** No hay impacto en el cálculo. Es solo información contextual. El sistema no implementa ni valida esta posibilidad.

**Consideraciones:** Regla detectada. Finalidad no determinada. Se muestra como texto informativo sin efecto computacional.

---

### 17. Art. 61 bis: peritos en controversias

**Qué hace:** El sistema incluye información sobre la norma incorporada por Ley 27.802 (B.O. 06/03/2026) que desvincula los honorarios de peritos del monto del juicio.

**Base legal:** Art. 61 bis (incorporado por Ley 27.802): Mínimo de 2 UMA por pericia. Si el proceso finaliza antes de la pericia sin que se haya presentado, se regula 1/4 de UMA si el perito aceptó el cargo.

**Impacto:** No hay impacto en el cálculo automático. La información se muestra en la sección de auxiliares de justicia como referencia.

**Consideraciones:** Esta es información de reciente incorporación legal. El sistema la incluye como referencia textual sin integrarla en el flujo de cálculo.

---

### 18. Números argentinos: parseo especial

**Qué hace:** El sistema parsea números en formato argentino: puntos como separadores de miles y coma como separador decimal.

**Base legal:** No es una regla legal sino una convención de formato numérico argentina.

**Impacto:** La función `parseNumber()` en `core.js` convierte "1.234,56" → 1234.56. Sin este parseo, el sistema interpretaría erróneamente los montos ingresados.

**Consideraciones:** La función es crítica para la correcta interpretación de montos. Un cambio en el formato de entrada rompería todo el sistema de cálculo.

---

### 19. UMA: carga automática desde Google Sheets

**Qué hace:** El valor de la UMA se carga automáticamente desde un CSV público de Google Sheets. Si el usuario modifica manualmente el input, se marca como "dirty" y no se sobreescribe.

**Base legal:** El valor de la UMA es fijado periódicamente por la CSJN.

**Impacto:** El valor inicial de fallback es 92.482 (92.482 pesos). La carga se produce al inicio de la sesión. Si falla la conexión, se usa el valor de fallback.

**Consideraciones:** La marca `dirty` en el dataset del input previene que actualizaciones automáticas sobreescriban ediciones del usuario. Si el usuario quiere volver al valor automático, debe reiniciar la aplicación.

---

### 20. Cálculo de porcentaje personalizado de etapa

**Qué hace:** Después de ver los resultados, el usuario puede calcular cualquier porcentaje (1% a 100%) de una etapa específica para patrocinante, apoderado y procurador.

**Base legal:** No es una regla legal. Es una herramienta auxiliar de conveniencia.

**Impacto:** Permite al usuario calcular montos intermedios entre las etapas predefinidas (1/3, 2/3, completo). Por ejemplo, calcular el 15% de la etapa de un patrocinante.

**Consideraciones:** Este es un helper que resuelve la limitación de que la ley define 3 etapas fijas (1/3, 2/3, completo) pero en la práctica los jueces pueden regular porcentajes intermedios.

---

### 21. Botón "Ver mínimos arancelarios para contrastar"

**Qué hace:** Después de ver los resultados, el usuario puede navegar a la tabla de mínimos arancelarios para comparar contra los valores legales. El flujo es: resultado → mínimos → puede volver al resultado.

**Base legal:** Los mínimos arancelarios están definidos en arts. 19, 44, 48, 58, 61, etc.

**Impacto:** El sistema no aplica automáticamente los mínimos. El usuario debe verificar por sí mismo si el resultado es inferior a los mínimos aplicables y, si lo es, desestimar el cálculo.

**Consideraciones:** El botón se encuentra al final de la pantalla de resultados. Al hacer clic, se almacena `wizardState.desdeResultado = true` para permitir la navegación de regreso.

---

### 22. Art. 19 inc. a: items de mínimos judiciales

**Qué hace:** La tabla de mínimos del art. 19 inc. a incluye ítems de derecho penal (excarcelación, juicio abreviado, etc.) mezclados con ítems de derecho civil/familiar.

**Base legal:** Art. 19 inc. a: Lista los mínimos para asuntos judiciales no susceptibles de apreciación pecuniaria.

**Impacto:** El sistema no filtra por jurisdicción o materia. Presenta todos los ítems en una sola tabla para referencia.

**Consideraciones:** El README del sistema indica que la herramienta no está pensada para juicios penales, pero los mínimos se muestran como referencia. Esto puede generar confusión si un usuario penal intenta usar el sistema para cálculo.

---

### 23. Art. 48: mínimo para amparo/HC/HD

**Qué hace:** El mínimo de 20 UMA para acciones de inconstitucionalidad, amparo, hábeas data y hábeas corpus solo se muestra en la sección de mínimos, no en el flujo principal de cálculo.

**Base legal:** Art. 48: Establece un mínimo de 20 UMA para estas acciones.

**Impacto:** El usuario debe navegar explícitamente a la sección de mínimos para ver este valor. No hay un tipo de proceso dedicado para estas acciones en el wizard.

**Consideraciones:** Estas acciones no son susceptibles de cálculo automático por escala (generalmente no tienen base pecuniaria directa), por lo que solo se muestra el mínimo como referencia.

---

### 24. Art. 44: contencioso administrativo

**Qué hace:** Los mínimos de 7 UMA (demandas) y 5 UMA (actuaciones administrativas) solo se muestran en la sección de mínimos.

**Base legal:** Art. 44: Define mínimos para demandas contencioso administrativas no susceptibles de apreciación pecuniaria.

**Impacto:** Similar al art. 48, no hay flujo de cálculo dedicado. Es información de referencia.

**Consideraciones:** No hay distinción en el wizard para procesos contencioso administrativos con base pecuniaria, donde sí podría aplicar la escala general.

---

### 25. Art. 31: recursos ante CSJN

**Qué hace:** Los mínimos de 15 UMA (queja) y 20 UMA (recurso extraordinario) solo se muestran en la sección de mínimos.

**Base legal:** Art. 31: Define mínimos para recursos ante la CSJN.

**Impacto:** Es información de referencia. No hay cálculo automático asociado.

**Consideraciones:** Estos recursos tienen una regulación específica separada de la escala general.

---

### 26. La pregunta "¿es para vivienda?" aparece dos veces

**Qué hace:** La pregunta sobre si el contrato es para vivienda aparece en dos contextos distintos:
1. **Paso 2 (contingencias):** Para "homologación de desocupación", pregunta si es vivienda → reduce base en 20% (art.40).
2. **Paso 3 (objeto):** Para "desalojo" en juicio de conocimiento, pregunta si es vivienda → reduce base en 20% (art.40).

**Base legal:** Art. 40: "En el caso de que la locación sea para vivienda y/o habitación, tal monto se reducirá en un 20%."

**Impacto:** Aunque la pregunta parece idéntica, los contextos son mutuamente excluyentes: un usuario nunca pasará por ambos caminos en la misma sesión (homologación de desocupación es un tipo de proceso distinto de conocimiento).

**Consideraciones:** La reducción del 20% se almacena en campos distintos: `homologacionVivienda` para homologación y `desalojoVivienda === 'vivienda'` para conocimiento. La lógica de aplicación es la misma pero los puntos de entrada difieren.

---

### 27. Factor acumulativo de reducciones

**Qué hace:** Las reducciones se aplican en tres niveles, todos multiplicativos:

| Nivel | Campo | Ejemplos | Factor |
|-------|-------|----------|--------|
| Base | `baseReducida` | Desalojo vivienda (-20%), demanda rechazada (-30%), caducidad art.22 (-30%) | ×0.7, ×0.8 |
| Escala | `factorEscala` | Sucesión único letrado (50%), ejecución sentencia (50%), modos anormales antes de prueba (50%) | ×0.5 |
| Final | `factorFinal` | Ejecutivo sin excepciones (-10%), posesorias beneficio (-20%), incidencia colectiva (-25%) | ×0.9, ×0.8, ×0.75 |

**Ejemplo completo:** Ejecutivo sin excepciones + caducidad art.25 antes de prueba:
- Base sin reducción adicional
- factorEscala = 0.5 (modos anormales antes de prueba)
- factorFinal = 0.9 (ejecutivo sin excepciones)
- Resultado: escala × 0.5 × 0.9 = 45% de la escala completa

**Impacto:** Las reducciones se acumulan multiplicativamente, no aditivamente. Esto significa que múltiples reducciones del 50% no producen 0%, sino 25%.

**Consideraciones:** Las reducciones de base se aplican **antes** de calcular la escala. Las reducciones de escala se aplican **sobre** los valores de la escala. Las reducciones finales se aplican **sobre** los resultados ya escalados. El orden es fijo e inalterable.

---

### 28. Procurador siempre calculado como 40% del patrocinante

**Qué hace:** Los honorarios del procurador se calculan siempre como 40% de los del patrocinante, **incluyendo todas las reducciones que este haya sufrido**.

**Base legal:** Art. 20: "Los honorarios de los procuradores se fijarán en un 40% de los que por esta ley corresponda fijar a los abogados patrocinantes."

**Impacto:** Si el patrocinante tiene un resultado de 100 UMA con factorEscala 0.5 y factorFinal 0.9, el procurador será 40% de (100 × 0.5 × 0.9) = 18 UMA, no 40% de 100 = 40 UMA.

**Implementación:** En `calculations.js`:
```javascript
const minProc = minFinal * 0.4;
const maxProc = maxFinal * 0.4;
```

Donde `minFinal` y `maxFinal` ya incluyen todas las reducciones.

**Consideraciones:** Esta es la interpretación correcta según el art. 20: el procurador "hereda" las reducciones del patrocinante. No hay escenario donde el procurador tenga reducciones independientes.

---

## Resumen de decisiones de interpretación

| # | Decisión | Alternativa no adoptada | Razón |
|---|----------|------------------------|-------|
| 2 | Caducidad como elección del usuario | Forzar un solo criterio | Ambigüedad legal genuina |
| 9 | Interpretación literal del mínimo (máx. anterior + mín. actual) | Acumulación de máximos previos | Texto expreso de la ley |
| 11 | No validar regla del "mayor" en escrituración | Comparar y sugerir el mayor | El sistema no tiene ambos valores |
| 15 | Reducción automática en incidencia colectiva | Dejar a elección del usuario | La ley no presenta alternativa |
| 28 | Procurador hereda reducciones del patrocinante | Calcular procurador sobre base original | Texto del art. 20 |