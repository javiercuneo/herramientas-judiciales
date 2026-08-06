# Reglas de Negocio — Calculadora de Honorarios (Ley 27.423)

Inventario completo de todas las reglas legales/negocio implementadas en el sistema.
Cada regla se documenta con su condicion de activacion, que modifica y con que otras reglas interactua.

---

## 1. Determinacion de la base (art. 23)

### Regla 37 — Sub-reglas del art. 23: Determinacion de base

- **Cuando aplica**: Siempre, para todo proceso judicial.
- **Sobre que opera**: El monto economico sobre el cual se aplica la escala.
- **Que modifica**: Determina el valor numerico de la base segun la naturaleza del bien o derecho en disputa.
- **Interacciones**: Se aplica **antes** de cualquier regla de reduccion (arts. 40, 22), antes de la escala (art. 21) y antes de cualquier otro calculo posterior.

Sub-reglas especificas:

| Sub-regla | Condicion | Base |
|-----------|-----------|------|
| Inmuebles | Bien inmueble en disputa | Valor declarado o pericial del inmueble |
| Muebles | Bien mueble en disputa | Valor del mueble |
| Derechos crediticios | Credito reclamado | Monto del capital + intereses adeudados |
| Intereses | Se reclaman intereses | Los intereses se suman a la base |

### Regla 38 — Art. 24 y 52: Intereses integran la base

- **Cuando aplica**: Siempre que se reclamen intereses en la demanda.
- **Sobre que opera**: La base de calculo.
- **Que modifica**: Los intereses adeudados se suman a la base antes de aplicar la escala del art. 21.
- **Interacciones**: Opera conjuntamente con la regla 37 (determinacion de base del art. 23).

### Regla 39 — Art. 43: Desalojo laboral — Base = 50 % ultimo salario x 24 meses

- **Cuando aplica**: Cuando el proceso es de desalojo laboral (despido sin causa, etc.).
- **Sobre que opera**: La base de calculo.
- **Que modifica**: La base se calcula como **50 % del ultimo salario mensual del trabajador multiplicado por 24 meses** (2 anios).
- **Interacciones**: Determina una base especial que luego se somete a la escala del art. 21. No aplica reduccion por art. 22 o 40 (son para otros tipos de proceso).

### Regla 40 — Art. 45: Liquidacion regimen patrimonial — Base = patrimonio adjudicado

- **Cuando aplica**: Cuando se trata de la liquidacion del regimen patrimonial (sociedad conyugal o union convivencial).
- **Sobre que opera**: La base de calculo.
- **Que modifica**: La base es el **valor total del patrimonio adjudicado**.
- **Interacciones**: Determina una base especial que luego se somete a la escala del art. 21.

### Regla 41 — Art. 46: Escrituracion — Base = max(valor bien, boleto)

- **Cuando aplica**: Cuando se trata de un juicio de escrituracion (obligacion de otorgar escritura publica).
- **Sobre que opera**: La base de calculo.
- **Que modifica**: La base es el **mayor valor** entre el valor del bien y el valor del boleto de compraventa.
- **Interacciones**: Determina una base especial que luego se somete a la escala del art. 21.

### Regla 42 — Art. 48: Amparo, habeas data, habeas corpus — Minimo 20 UMA

- **Cuando aplica**: Cuando se trata de un proceso de amparo, habeas data o habeas corpus.
- **Sobre que opera**: El honorario minimo del patrocinante.
- **Que modifica**: Establece un piso minimo de **20 UMA** para estos procesos, sin importar la cuantia.
- **Interacciones**: Se aplica como piso. Si el calculo por escala arroja un valor inferior a 20 UMA, se usa 20 UMA.

### Regla 43 — Art. 44: Contencioso administrativo — 7 UMA (acciones) / 5 UMA (procedimientos)

- **Cuando aplica**: Cuando se trata de procesos contencioso administrativos.
- **Sobre que opera**: El honorario minimo del patrocinante.
- **Que modifica**:
  - Para **acciones judiciales** contencioso administrativas: minimo **7 UMA**.
  - Para **procedimientos administrativos** (no judiciales): minimo **5 UMA**.
- **Interacciones**: Se aplica como piso. Si el calculo por escala arroja un valor inferior, se usa el minimo correspondiente.

---

## 2. Reducciones sobre BASE (previas a la escala)

### Regla 1 — Art. 40: Desalojo vivienda — Reduccion 20 % sobre base

- **Cuando aplica**: Cuando el proceso es de desalojo y recae sobre **vivienda**.
- **Sobre que opera**: La base de calculo (antes de aplicar la escala).
- **Que modifica**: Reduce la base en un **20 %** antes de calcular el porcentaje de escala.
- **Interacciones**: Puede combinarse con la regla 15 (homologacion desocupacion vivienda), que aplica una reduccion adicional del 50 % sobre los honorarios resultantes.

### Regla 2 — Art. 22: Demanda rechazada — Reduccion 30 % sobre base

- **Cuando aplica**: Cuando la demanda es **rechazada en su totalidad** (segun art. 22 de la ley).
- **Sobre que opera**: La base de calculo (antes de aplicar la escala).
- **Que modifica**: Reduce la base en un **30 %** antes de calcular el porcentaje de escala.
- **Interacciones**: Se aplica antes de la escala. Es la version general de la regla 3 (variante para caducidad).

### Regla 3 — Art. 22: Caducidad como desestimada — Reduccion 30 % sobre base

- **Cuando aplica**: Cuando la caducidad se trata como si fuera un rechazo de demanda (desestimacion), aplicando el art. 22.
- **Sobre que opera**: La base de calculo (antes de aplicar la escala).
- **Que modifica**: Reduce la base en un **30 %** antes de calcular el porcentaje de escala.
- **Interacciones**: Variante de la regla 2. Misma reduccion (30 %), misma base, diferente fundamento legal.

---

## 3. Reducciones sobre ESCALA (factorEscala)

### Regla 4 — Art. 35: Unico letrado en sucesion — Reduccion 50 % en escala

- **Cuando aplica**: Cuando en un juicio sucesorio interviene un **unico letrado** (abogado patrocinante).
- **Sobre que opera**: Los porcentajes de la escala del art. 21.
- **Que modifica**: Reduce el porcentaje de escala en un **50 %**. Por ejemplo, si la escala indica 22 %-33 %, pasaria a 11 %-16,5 %.
- **Interacciones**: Se aplica sobre los porcentajes de la escala (reglas 26-32). Puede combinarse con la regla 34 (partidor), que es un calculo independiente sobre la base.

### Regla 5 — Art. 41: Ejecucion de sentencia — Reduccion 50 % en escala

- **Cuando aplica**: Siempre que se trate de ejecucion de sentencia (fase de ejecucion de una sentencia firme).
- **Sobre que opera**: Los porcentajes de la escala del art. 21.
- **Que modifica**: Reduce el porcentaje de escala en un **50 %**.
- **Interacciones**: Se aplica sobre la escala. Puede combinarse con la regla 9 (reduccion adicional del 10 % sobre honorarios finales cuando no hay excepciones).

### Regla 6 — Art. 25: Modos anormales antes de apertura a prueba — Reduccion 50 % en escala

- **Cuando aplica**: Cuando el juicio se extingue por un **modo anormal** (conciliacion, desistimiento, allanamiento,etc.) **antes** de la apertura a prueba.
- **Sobre que opera**: Los porcentajes de la escala del art. 21.
- **Que modifica**: Reduce el porcentaje de escala en un **50 %**.
- **Interacciones**: Se aplica sobre la escala. Es la version general de la regla 7 (variante para caducidad).

### Regla 7 — Art. 25: Caducidad como modo anormal antes de prueba — Reduccion 50 % en escala

- **Cuando aplica**: Cuando la caducidad se trata como modo anormal de extincion del proceso **antes** de la apertura a prueba.
- **Sobre que opera**: Los porcentajes de la escala del art. 21.
- **Que modifica**: Reduce el porcentaje de escala en un **50 %**.
- **Interacciones**: Variante de la regla 6. Misma reduccion (50 %), mismo efecto sobre escala, diferente causa (caducidad vs. otro modo anormal).

---

## 4. Reducciones sobre HONORARIOS FINALES (factorFinal)

### Regla 8 — Art. 34: Ejecutivo sin excepciones — Reduccion 10 % sobre honorarios finales

- **Cuando aplica**: Cuando se trata de un juicio ejecutivo y el ejecutado **no formula excepciones**.
- **Sobre que opera**: Los honorarios calculados despues de aplicar la escala.
- **Que modifica**: Reduce los honorarios finales en un **10 %**.
- **Interacciones**: Se aplica despues de la escala. Es la version para juicios ejecutivos; la regla 9 es la version para ejecucion de sentencia.

### Regla 9 — Art. 41 + Art. 34: Ejecucion sentencia sin excepciones — Reduccion 10 % sobre honorarios finales

- **Cuando aplica**: Cuando se trata de ejecucion de sentencia y el ejecutado **no formula excepciones**.
- **Sobre que opera**: Los honorarios calculados despues de aplicar la escala.
- **Que modifica**: Reduce los honorarios finales en un **10 %**.
- **Interacciones**: Se combina con la regla 5 (reduccion del 50 % en escala por ejecucion de sentencia). El orden de aplicacion es: primero se reduce la escala 50 %, despues se aplica la reduccion del 10 % sobre los honorarios resultantes.

### Regla 10 — Art. 38: Posesorias/interdictos con beneficio exclusivo — Reduccion 20 % sobre honorarios finales

- **Cuando aplica**: Cuando se trata de acciones posesorias o interdictos y el beneficiario tiene **beneficio exclusivo**.
- **Sobre que opera**: Los honorarios calculados despues de aplicar la escala.
- **Que modifica**: Reduce los honorarios finales en un **20 %**.
- **Interacciones**: Se aplica despues de la escala. No se combina con las reglas 8 o 9 (son para procesos ejecutivos).

### Regla 11 — Art. 49: Incidencia colectiva — Reduccion 25 % sobre honorarios finales

- **Cuando aplica**: Cuando se trata de una accion de incidencia colectiva.
- **Sobre que opera**: Los honorarios calculados despues de aplicar la escala.
- **Que modifica**: Reduce los honorarios finales en un **25 %**.
- **Interacciones**: Se aplica despues de la escala. No se combina con las reglas 8, 9 o 10 (son para otros tipos de proceso).

---

## 5. Reglas especiales por tipo de proceso

### Regla 12 — Art. 37: Medida cautelar sin oposicion — 25 % de la escala

- **Cuando aplica**: Cuando se solicita una medida cautelar y el demandado **no formula oposicion**.
- **Sobre que opera**: La escala del art. 21.
- **Que modifica**: Los honorarios se fijan en el **25 %** del porcentaje de escala correspondiente a la cuantia.
- **Interacciones**: Es un calculo independiente que reemplaza la aplicacion normal de la escala. No se acumula con reducciones de arts. 40 o 22.

### Regla 13 — Art. 37: Medida cautelar con oposicion — 50 % de la escala

- **Cuando aplica**: Cuando se solicita una medida cautelar y el demandado **formula oposicion**.
- **Sobre que opera**: La escala del art. 21.
- **Que modifica**: Los honorarios se fijan en el **50 %** del porcentaje de escala correspondiente a la cuantia.
- **Interacciones**: Es un calculo independiente que reemplaza la aplicacion normal de la escala. No se acumula con reducciones de arts. 40 o 22.

### Regla 14 — Art. 40 par. 2: Homologacion de desocupacion — Reduccion 50 % sobre honorarios

- **Cuando aplica**: Cuando se trata de homologacion de desocupacion que **no** es de vivienda.
- **Sobre que opera**: Los honorarios calculados despues de aplicar la escala.
- **Que modifica**: Reduce los honorarios en un **50 %**.
- **Interacciones**: Variante de la regla 15. No se aplica la reduccion del 20 % sobre base (regla 1) porque no es vivienda.

### Regla 15 — Art. 40: Homologacion desocupacion de vivienda — 20 % base + 50 % honorarios

- **Cuando aplica**: Cuando se trata de homologacion de desocupacion de **vivienda**.
- **Sobre que opera**: Primero la base, luego los honorarios.
- **Que modifica**: **Primero** reduce la base en un **20 %** (igual que la regla 1), **despues** reduce los honorarios resultantes en un **50 %**. Es la combinacion de dos reducciones en cadena.
- **Interacciones**: Combina la regla 1 (reduccion 20 % sobre base por tratarse de vivienda) con una reduccion del 50 % sobre los honorarios finales. El orden es critico: primero base, luego escala, luego reduccion 50 %.

### Regla 16 — Art. 33 (Ley 21.839): Incidente — 2 %-20 % de la base

- **Cuando aplica**: Cuando se trata de un incidente tramitado bajo la antigua Ley 21.839.
- **Sobre que opera**: La base de calculo.
- **Que modifica**: Los honorarios se fijan en un porcentaje comprendido entre el **2 % y el 20 %** de la base, segun la complejidad del asunto.
- **Interacciones**: Calculo independiente que reemplaza la escala del art. 21. No interactua con reducciones de arts. 22, 25, 34, 40 o 41.

### Regla 17 — Art. 50: Exhorto — Montos fijos en UMA

- **Cuando aplica**: Cuando se trata de un exhorto (comision rogatoria a otro juzgado).
- **Sobre que opera**: Base fija expresada en UMA (no depende de la cuantia del proceso principal).
- **Que modifica**: Establece montos fijos segun la complejidad del exhorto:

| Tipo de exhorto | Monto |
|-----------------|-------|
| Exhorto simple (sin trabas) | 3 UMA |
| Exhorto con trabas cautelares | 10 - 20 UMA |
| Exhorto con ejecucion | 7 - 30 UMA |

- **Interacciones**: Calculo independiente que reemplaza la escala del art. 21. No interactua con otras reglas de reduccion.

---

## 6. Reglas de Apoderado y Procurador (art. 20)

### Regla 18 — Art. 20: Apoderado — Multiplicador 1,4 x sobre patrocinante

- **Cuando aplica**: Cuando interviene un apoderado (representante legal con poder) ademas del abogado patrocinante.
- **Sobre que opera**: Los honorarios ya calculados del patrocinante.
- **Que modifica**: Los honorarios del apoderado se calculan como **1,4 veces** los honorarios del patrocinante (es decir, el patrocinante cobra 100 % y el apoderado cobra un **40 % adicional** sobre ese monto).
- **Interacciones**: Se calcula **despues** de determinar los honorarios del patrocinante (incluyendo todas sus reducciones y escala). No se aplica a auxiliares de la justicia ni a peritos.

### Regla 19 — Art. 20: Procurador — Multiplicador 0,4 x sobre patrocinante

- **Cuando aplica**: Cuando interviene un procurador (agente habilitado con matricula) ademas del abogado patrocinante.
- **Sobre que opera**: Los honorarios ya calculados del patrocinante.
- **Que modifica**: Los honorarios del procurador se calculan como **0,4 veces** (el **40 %**) los honorarios del patrocinante.
- **Interacciones**: Se calcula **despues** de determinar los honorarios del patrocinante (incluyendo todas sus reducciones y escala). No se aplica a auxiliares de la justicia ni a peritos. Puede coexistir con la regla 18 (apoderado + procurador en el mismo proceso).

---

## 7. Segunda instancia (art. 30)

### Regla 20 — Art. 30: Segunda instancia — 30 %-35 % de primera instancia

- **Cuando aplica**: Cuando se calculan honorarios por segunda instancia (apelacion) sin que la sentencia sea revocada.
- **Sobre que opera**: Los honorarios ya liquidados de primera instancia.
- **Que modifica**: Los honorarios de segunda instancia son entre el **30 % y el 35 %** de los honorarios de primera instancia.
- **Interacciones**: Se aplica sobre los honorarios de primera instancia, que ya incluyen todas las reducciones aplicables (arts. 22, 25, 40, 41, etc.). No se aplica el art. 21 (escala) a segunda instancia; se toma como base el monto de primera.

### Regla 21 — Art. 30: Sentencia revocada — Hasta 40 % de primera instancia

- **Cuando aplica**: Cuando la sentencia de segunda instancia **revoca total o parcialmente** la sentencia de primera instancia.
- **Sobre que opera**: Los honorarios ya liquidados de primera instancia.
- **Que modifica**: Los honorarios de segunda instancia pueden llegar hasta el **40 %** de los honorarios de primera instancia (tope maximo mayor al 35 % de la regla 20).
- **Interacciones**: Variante de la regla 20. El tope sube de 35 % a 40 % por la revocacion. Se aplica sobre los honorarios de primera instancia con todas sus reducciones.

---

## 8. Auxiliares de la justicia

### Regla 22 — Art. 21, antepenultimo parrafo: Auxiliares generales — 5 %-10 % de la base

- **Cuando aplica**: Cuando interviene un auxiliar de la justicia (traductor publico, martillero, depositario, etc.) en un proceso judicial general.
- **Sobre que opera**: La base de calculo del proceso.
- **Que modifica**: Los honorarios del auxiliar se fijan entre el **5 % y el 10 %** de la base, segun la complejidad y responsabilidad.
- **Interacciones**: Calculo independiente del patrocinante. No participa de las reducciones de arts. 22, 25, 34, 40 o 41. Tiene minimo propio establecido en la regla 23.

### Regla 23 — Art. 58: Minimos de auxiliares — 4 UMA en procesos pecuniarios

- **Cuando aplica**: Cuando se calculan honorarios de auxiliares de la justicia en procesos de cuantia determinada (pecuniarios).
- **Sobre que opera**: El honorario minimo del auxiliar.
- **Que modifica**: Establece un piso absoluto de **4 UMA** para auxiliares en procesos pecuniarios.
- **Interacciones**: Se verifica despues de calcular el porcentaje sobre la base (regla 22). Si el resultado es menor a 4 UMA, se eleva a 4 UMA. No interactua con reducciones del patrocinante.

### Regla 24 — Art. 60: Minimos de peritos — 2 UMA en procesos no pecuniarios

- **Cuando aplica**: Cuando se calculan honorarios de peritos (perito medico, contador, etc.) en procesos de cuantia indeterminada (no pecuniarios).
- **Sobre que opera**: El honorario minimo del perito.
- **Que modifica**: Establece un piso minimo de **2 UMA** para peritos en procesos no pecuniarios.
- **Interacciones**: Se aplica como piso absoluto despues de cualquier calculo porcentual sobre la base.

### Regla 25 — Art. 61 bis: Peritos en controversias — 2 UMA por pericia; 1/4 UMA si se resuelve antes

- **Cuando aplica**: Cuando un perito interviene en un proceso controversial (juicio ordinario, etc.).
- **Sobre que opera**: Los honorarios del perito por pericia rendida.
- **Que modifica**:
  - Si la pericia se presentations y se incorpora al debate: **2 UMA** por pericia.
  - Si el caso se resuelve **antes** de que la pericia sea presentada: **1/4 (0,25) UMA** como minimos.
- **Interacciones**: Calculo independiente. La reduccion a 0,25 UMA se aplica por resolucion prematura del caso (el pericio no llego a ser utilizado).

---

## 9. Honorarios provisorios (art. 12)

### Regla 33 — Art. 12: Honorarios provisorios — Solo valores minimos

- **Cuando aplica**: Cuando se selecciona el modo "provisorio" en el calculo de honorarios.
- **Sobre que opera**: Los honorarios que resultarian de la aplicacion normal de la escala.
- **Que modifica**: Se toma **unicamente el valor minimo** del tramo de escala correspondiente (el porcentaje inferior del rango). Por ejemplo, si la escala indica 22 %-33 %, se usa 22 %.
- **Interacciones**: Afecta la presentacion de resultados de todas las reglas de escala (reglas 26-32). No modifica la logica interna del calculo; solo que valor final se exhibe al usuario.

---

## 10. Partidor en sucesiones (art. 35, ultima parte)

### Regla 34 — Art. 35, ultima parte: Partidor — 2 %-3 % de la base

- **Cuando aplica**: Cuando en un juicio sucesorio interviene un partidor (profesional que realiza la particion y adjudicacion de bienes).
- **Sobre que opera**: La base de calculo del proceso sucesorio.
- **Que modifica**: Los honorarios del partidor se fijan entre el **2 % y el 3 %** de la base del juicio sucesorio.
- **Interacciones**: Aplica exclusivamente a procesos sucesorios. Es un calculo **independiente** del honorario del patrocinante (el abogado cobra segun la escala y posibles reducciones, y el partidor cobra aparte segun esta regla). Puede coexistir con la regla 4 (unico letrado en sucesion), ya que la reduccion del 50 % afecta al abogado y la regla 34 afecta al partidor.

---

## 11. Minimos del art. 19 — Tablas de honorarios minimos

### Regla 35 — Art. 19 inc. a: Judiciales no pecuniarios — Montos fijos por tipo de proceso

- **Cuando aplica**: Cuando el proceso es no pecuniario (cuantia indeterminada) y se requiere determinar el honorario minimo del patrocinante.
- **Sobre que opera**: El honorario minimo del patrocinante.
- **Que modifica**: Establece montos fijos en UMA segun el tipo de proceso:

| Tipo de proceso | Minimo (UMA) |
|-----------------|--------------|
| Divorcio | 10 |
| Adopcion | 20 |
| Otros no pecuniarios | Variable segun la tabla de la ley |

- **Interacciones**: Se aplica como piso absoluto. Si el calculo por escala (art. 21) arroja un valor inferior al minimo de esta tabla, se usa el valor de la tabla.

### Regla 36 — Art. 19 inc. b: Extrajudiciales — Montos fijos por tipo de labor

- **Cuando aplica**: Cuando se calculan honorarios por labores extrajudiciales (asesoramiento legal fuera de un proceso judicial).
- **Sobre que opera**: El honorario minimo por labor extrajudicial.
- **Que modifica**: Establece montos fijos en UMA segun el tipo de labor realizada (dictamen, consulta, asesoramiento, etc.).
- **Interacciones**: Calculo completamente independiente del proceso judicial. No se aplica la escala del art. 21 ni las reducciones propias del proceso.

---

## 12. Minimos del art. 58 — Montos fijos varios

### Regla 44 — Art. 58: Minimos varios por tipo de proceso

| Tipo de proceso | Minimo (UMA) |
|-----------------|--------------|
| Conocimiento (ordinario) | 10 |
| Ejecutivos | 6 |
| Mediacion | 2 |
| Auxiliares de la justicia | 4 |

- **Cuando aplica**: Segun el tipo de proceso indicado, como piso absoluto.
- **Sobre que opera**: El honorario minimo del profesional o auxiliar interviniente.
- **Que modifica**: Establece pisos minimos en UMA que no pueden ser inferiores en ningun caso.
- **Interacciones**: Se aplica como verificacion final despues de cualquier calculo porcentual. Complementa las reglas 23 (auxiliares en pecuniarios), 24 (peritos en no pecuniarios) y 35 (judiciales no pecuniarios).

---

## 13. Escala del art. 21 — Los 7 tramos

### Reglas 26 a 32 — Tabla de porcentajes por tramo

| Regla | Tramo | Rango (UMA) | Porcentaje minimo | Porcentaje maximo |
|-------|-------|-------------|-------------------|-------------------|
| 26 | 1ra escala | Hasta 15 UMA | 22 % | 33 % |
| 27 | 2da escala | 16 a 45 UMA | 20 % | 26 % |
| 28 | 3ra escala | 46 a 90 UMA | 18 % | 24 % |
| 29 | 4ta escala | 91 a 150 UMA | 17 % | 22 % |
| 30 | 5ta escala | 151 a 450 UMA | 15 % | 20 % |
| 31 | 6ta escala | 451 a 750 UMA | 13 % | 17 % |
| 32 | 7ma escala | Mas de 750 UMA | 12 % | 15 % |

- **Cuando aplica**: Siempre que se calculan honorarios del patrocinante en un proceso judicial (regla general).
- **Sobre que opera**: La base de calculo expresada en UMA.
- **Que modifica**: Determina el rango de porcentajes que se aplica a la base para obtener los honorarios.
- **Interacciones**: Es la regla central sobre la cual operan las reducciones de escala (reglas 4, 5, 6, 7) y las reducciones de honorarios finales (reglas 8, 9, 10, 11).

### Regla 45 — Transparencia de escala (art. 21, interpretacion literal)

- **Cuando aplica**: Cuando la cuantia expresada en UMA cae dentro de un tramo intermedio de la escala (no en el inicio del tramo).
- **Sobre que opera**: El calculo del honorario minimo del tramo.
- **Que modifica**: El honorario minimo del tramo se calcula como: **maximo del tramo anterior** (en pesos) **+ porcentaje minimo del tramo actual sobre el exceso**. Esto garantiza continuidad y transparencia en la escala, evitando saltos abruptos al pasar de un tramo a otro.
- **Interacciones**: Se aplica a las reglas 26-32 (los 7 tramos de la escala). Afecta unicamente al calculo del valor minimo; el valor maximo se calcula de forma anologa con el porcentaje maximo.

---

## Resumen de orden de aplicacion (cadena de calculo tipica)

```
1. Determinar BASE (reglas 37-43)
       |
2. Aplicar reducciones sobre BASE si corresponden (reglas 1, 2, 3)
       |
3. Expresar base en UMA y aplicar ESCALA del art. 21 (reglas 26-32 + regla 45)
       |
4. Aplicar reducciones sobre ESCALA si corresponden — factorEscala (reglas 4, 5, 6, 7)
       |
5. Verificar honorarios provisorios si corresponde (regla 33)
       |
6. Aplicar reducciones sobre HONORARIOS FINALES si corresponden — factorFinal (reglas 8, 9, 10, 11, 14, 15)
       |
7. Calcular SEGUNDA INSTANCIA si corresponde (reglas 20, 21)
       |
8. Calcular APODERADO / PROCURADOR si corresponden (reglas 18, 19)
       |
9. Verificar MINIMOS (reglas 23, 24, 35, 44)
```

## Combinaciones frecuentes de reglas

| Escenario | Reglas que interactuan | Efecto combinado |
|-----------|------------------------|------------------|
| Ejecucion de sentencia + sin excepciones | 5 + 9 | -50 % escala y -10 % honorarios finales |
| Desalojo vivienda + homologacion desocupacion | 1 + 15 | -20 % base y -50 % honorarios finales |
| Sucesion con unico letrado | 4 | -50 % sobre escala |
| Sucesion con partidor | 34 (+ 4 si aplica) | 2 %-3 % base para partidor; -50 % escala para abogado |
| Modo anormal antes de prueba | 6 o 7 | -50 % sobre escala |
| Medida cautelar con oposicion | 13 | 50 % de la escala (reemplaza calculo normal) |
| Segunda instancia + sentencia revocada | 21 | Hasta 40 % de primera instancia |
| Ejecutivo sin excepciones | 8 | -10 % sobre honorarios finales |

---

> **Nota**: Este documento refleja el estado de las reglas implementadas en el codigo fuente. Toda modificacion a la logica de calculo debe reflejarse aqui para mantener la trazabilidad entre norma, codigo y documentacion.
