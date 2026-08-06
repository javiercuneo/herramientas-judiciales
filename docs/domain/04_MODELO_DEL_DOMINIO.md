# 04 — Modelo del Dominio

## Descripción General

Este documento describe las **entidades jurídicas** que componen el dominio de cálculo de honorarios bajo la **Ley 27.423** (Honorarios Profesionales, Procuradores y Auxiliares de Justicia de la Nación Argentina). Cada entidad representa un concepto del mundo legal, no una implementación técnica.

---

## 1. Base Regulatoria

**Qué es:** El valor monetario de referencia sobre el cual se aplican las escalas de honorarios. También denominada "cuantía del asunto".

**Attributes:**

- **Monto en pesos:** Valor numérico expresado en moneda nacional.
- **Tipo de proceso:** Determina cómo se obtiene la base (art.22, art.23, art.35, art.39, art.40, art.43, art.45, art.46).
- **Puede ser reducida antes de entrar a la escala:** En ciertos supuestos la base se reduce según art.22 o art.40 antes de calcular el porcentaje.

**Reglas de obtención por tipo de proceso:**

| Tipo de proceso | Fuente legal | Cálculo de la base |
|---|---|---|
| Conocimiento (sumas de dinero) | Art.22 | Monto reclamado |
| Conocimiento (desalojo) | Art.22 | Total de alquileres adeudados + mejoras |
| Sucesión | Art.35 | Valor del patrimonio sucesorio |
| Ejecutivo | Art.40 | Monto del título + intereses |
| Medida cautelar | Art.39 | Monto a asegurar |
| Alimentos | Art.43 | 2 años de la cuota alimentaria |
| Homologación desocupación | Art.45 | Total de alquileres |
| Exhorto | Art.46 | Parte que corresponde |

**Relaciones:**

- Se expresa en **UMA** para entrar a la **Escala**.
- Puede ser modificada por **Transformaciones** (reducciones) antes del cálculo.

---

## 2. UMA (Unidad Monetaria de Actualización)

**Qué es:** La unidad de cuenta utilizada para expresar todos los montos en el marco de la Ley 27.423. Funciona como unidad de medida monetaria que permite uniformizar los cálculos.

**Attributes:**

- **Valor en pesos:** Monto en pesos que equivale a 1 UMA. Se actualiza periódicamente.
- **Fecha de vigencia:** Desde cuándo rige el valor cargado.
- **Fuente:** Puede provenir de carga manual o de consulta a Google Sheets.

**Valores de referencia:**

- Valor inicial (fecha de sanción de la ley): **$92.482**
- Se carga automáticamente desde Google Sheets o se ingresa manualmente.

**Relaciones:**

- Todas las **Bases Regulatorias** se convierten a UMA antes de entrar a la **Escala**.
- Los **Mínimos Arancelarios** se expresan en UMA.
- Los montos finales de honorarios se convierten de UMA a pesos.

---

## 3. Escala (Art. 21)

**Qué es:** Tabla progresiva de porcentajes que determina los honorarios según la cuantía expresada en UMA. Tiene **7 tramos**.

**Attributes por tramo:**

- **Nro. de tramo:** Del 1 al 7.
- **Límite inferior en UMA:** Monto mínimo del tramo.
- **Límite superior en UMA:** Monto máximo del tramo.
- **Porcentaje mínimo (%):** Tasa mínima aplicable al excedente.
- **Porcentaje máximo (%):** Tasa máxima aplicable al excedente.

**Lógica de cálculo (progresiva):**

1. Se identifica en qué tramo cae la base en UMA.
2. El **mínimo** del tramo = máximo del tramo anterior + (porcentaje mínimo × excedente sobre tramo anterior).
3. El **máximo** del tramo = máximo del tramo anterior + (porcentaje máximo × excedente sobre tramo anterior).
4. Los honorarios están dentro del rango [mínimo, máximo] del tramo.

**Relaciones:**

- Recibe la **Base Regulatoria** ya expresada en **UMA**.
- Produce un monto de honorarios (mínimo y máximo) que se aplica al **Patrocinante**.
- Puede ser modificada por **Transformaciones** (factor de escala).

---

## 4. Patrocinante (Abogado Patrocinante)

**Qué es:** El abogado que asesora jurídicamente al cliente. Es el destinatario principal de los honorarios calculados desde la escala.

**Attributes:**

- **Honorarios de escala:** Monto resultante de aplicar la escala a la base.
- **Etapas completadas:** Determina el porcentaje del total que le corresponde según las etapas del proceso (art.29):
  - **Juicio completo (1 etapa):** 100% del total.
  - **Una etapa (1/3):** 33,33% del total.
  - **Dos etapas (2/3):** 66,66% del total.
- **Transformaciones aplicables:** Puede recibir reducciones de escala (factorEscala) y reducciones finales (factorFinal).

**Relaciones:**

- Es el **base de cálculo** para el **Apoderado** y el **Procurador**.
- Recibe el resultado de la **Escala**.
- Sus honorarios pueden ser reducidos por **Transformaciones**.

---

## 5. Apoderado

**Qué es:** El abogado que representa judicialmente al cliente. Recibe una participación adicional sobre los honorarios del patrocinante.

**Attributes:**

- **Porcentaje adicional:** 40% sobre el monto del patrocinante (factor 1,4×).
- **Art.20 — Caso especial:** Si el mismo abogado actúa como apoderado **sin** patrocinante, recibe la suma de ambos conceptos (100% patrocinante + 40% apoderado = 140% del patrocinante).

**Relaciones:**

- Se calcula sobre los honorarios del **Patrocinante**.
- Si no hay patrocinante, el apoderado absorbe ambos roles.

---

## 6. Procurador

**Qué es:** El procurador es el representante técnico que actúa ante el tribunal en nombre del cliente. Es una figura distinta al abogado.

**Attributes:**

- **Porcentaje:** 40% sobre los honorarios del patrocinante (factor 0,4×).
- **Art.20.**

**Relaciones:**

- Se calcula sobre los honorarios del **Patrocinante**.
- Es independiente del **Apoderado**.

---

## 7. Auxiliares de Justicia

**Qué es:** Peritos, liquidadores, martilleros, y demás profesionales que colaboran con el tribunal. Sus honorarios se calculan de manera diferente a los del abogado.

**Attributes:**

- **Porcentaje sobre la base:** Entre 5% y 10% de la **Base Regulatoria** (NO de los honorarios del abogado).
- **Mínimos especiales:** Art.58, art.60, art.61 bis — establecen montos mínimos fijos en UMA.

**Relaciones:**

- Se calculan sobre la **Base Regulatoria** (no sobre honorarios de patrocinante).
- Pueden tener **Mínimos Arancelarios** aplicables (art.58).
- Son independientes de patrocinante, apoderado y procurador.

---

## 8. Segunda Instancia

**Qué es:** Los honorarios correspondientes a la apelación o segunda instancia del proceso.

**Attributes:**

- **Porcentaje base:** Entre 30% y 35% de los honorarios de primera instancia.
- **Sentencia revocada:** Si la sentencia de segunda instancia revoca la de primera, el porcentaje puede llegar hasta 40%.
- **Art.30.**

**Relaciones:**

- Se calcula sobre los honorarios de **primera instancia** (Patrocinante + Apoderado + Procurador).
- Es una instancia adicional, no reemplaza a la primera.

---

## 9. Partidor

**Qué es:** El profesional designado para dividir los bienes en un juicio sucesorio. Solo aplica en procesos de **sucesión**.

**Attributes:**

- **Porcentaje:** Entre 2% y 3% de la base.
- **Art.35, última parte.**

**Relaciones:**

- Solo se aplica cuando el **Tipo de Proceso** es **sucesión**.
- Se calcula sobre la **Base Regulatoria** (patrimonio sucesorio en UMA).

---

## 10. Contingencias Procesales

**Qué es:** Las circunstancias del caso concreto que modifican el resultado del cálculo de honorarios. Representan decisiones del usuario sobre hechos del proceso.

**Attributes:**

| Contingencia | Valores posibles | Efecto |
|---|---|---|
| **modoTerminacion** | `sentencia`, `modos_anormales`, `caducidad`, `provisorios` | Determina qué tabla de etapas se aplica y si hay reducción. |
| **sentenciaResultado** | `admitida`, `rechazada` | En ejecutivo: si se rechaza, la base se reduce a 1/3 (art.40). |
| **aperturaPrueba** | `antes`, `después` | En ejecutivo: afecta la etapa completada. |
| **caducidadCriterio** | `art22`, `art25` | Determina la reducción aplicable por caducidad. |
| **tuvoExcepciones** | `si`, `no` | Puede afectar las etapas del proceso. |
| **sucesionUnicoLetrado** | `si`, `no` | En sucesión: si hay un solo letrado, se aplica regla especial. |
| **medidaOposicion** | `si`, `no` | En medida cautelar: si hubo oposición, cambia la base. |
| **homologacionVivienda** | `si`, `no` | En homologación desocupación: reduce base si vivienda habitual. |

**Relaciones:**

- Modifican la **Base Regulatoria** antes de entrar a la **Escala**.
- Determinan qué **Etapas del Proceso** se aplican.
- Pueden activar **Transformaciones** (reducciones).

---

## 11. Transformaciones (Reducciones)

**Qué es:** Los factores de reducción que se aplican en distintas etapas del cálculo para modificar los honorarios según las circunstancias del caso.

**Types de transformaciones:**

| Tipo | Valores | Cuándo se aplica |
|---|---|---|
| **Reducción de base** | 0,7 / 0,8 | Antes de entrar a la escala (art.22, art.40). |
| **Factor de escala** | 0,5 | Modifica los porcentajes de la escala en ciertos casos. |
| **Factor final** | 0,9 / 0,8 / 0,75 | Se aplica al total de honorarios después del cálculo. |

**Relaciones:**

- Las reducciones de base modifican la **Base Regulatoria**.
- El factor de escala modifica la **Escala**.
- El factor final modifica los honorarios de **Patrocinante**, **Apoderado** y **Procurador**.

---

## 12. Tipo de Proceso

**Qué es:** La clasificación del proceso judicial que determina qué reglas de cálculo aplican.

**Types principales:**

| Tipo | Descripción |
|---|---|
| `conocimiento` | Juicio ordinario de conocimiento. |
| `ejecucion_sentencia` | Ejecución de sentencia firme. |
| `ejecutivo` | Juicio ejecutivo (título ejecutivo). |
| `sucesión` | Sucesión testamentaria o intestada. |
| `exhorto` | Comisión rogatoria / exhorto. |
| `incidente` | Incidente dentro de un proceso principal. |
| `medida_cautelar` | Medida cautelar individual. |
| `homologacion_desocupacion` | Homologación de desocupación (art.45). |

**Types para mínimos arancelarios:**

| Tipo | Tabla de mínimos |
|---|---|
| `judicial` | Procesos judiciales con mínimos fijos. |
| `extrajudicial` | Actuaciones extrajudiciales. |
| `art58` | Auxiliares de justicia (art.58). |
| `recursos_csjn` | Recursos ante la CSJN. |
| `auxiliares` | Tabla específica de auxiliares. |

**Relaciones:**

- Determina qué **Base Regulatoria** se utiliza.
- Determina qué **Etapas del Proceso** aplican (art.29).
- Determina si hay **Mínimos Arancelarios** aplicables.
- Determina si corresponde **Partidor** (solo sucesión).

---

## 13. Objeto del Juicio

**Qué es:** La naturaleza de lo que se reclama en un juicio de **conocimiento**. Solo aplica para este tipo de proceso.

**Types:**

| Objeto | Descripción |
|---|---|
| `desalojo` | Desalojo / restitución de inmueble. |
| `sumas_dinero` | Reclamo de sumas de dinero. |
| `inmuebles` | Reclamo relacionado con inmuebles. |
| `derechos_crediticios` | Derechos y créditos. |
| `titulos_acciones` | Títulos valores y acciones. |
| `establecimientos` | Establecimientos comerciales. |
| `uso_habitacion` | Uso y habitación. |
| `escrituracion` | Escrituración. |
| `familia_alimentos` | Alimentos en derecho de familia. |
| `familia_liquidacion` | Liquidación en derecho de familia. |
| `posesorias_interdictos` | Interdictos posesorios. |
| `incidencia_colectiva` | Incidencia colectiva. |

**Relaciones:**

- Solo se usa cuando el **Tipo de Proceso** es `conocimiento`.
- Determina la regla para obtener la **Base Regulatoria** (art.22).
- Puede activar **Contingencias Procesales** específicas (ej: `homologacionVivienda` para desalojo).

---

## 14. Etapas del Proceso

**Qué es:** Las etapas en que se divide un proceso judicial, que determinan qué porcentaje de los honorarios totales corresponde según cuántas etapas se completaron.

**Attributes:**

| Etapa | Porcentaje | Descripción |
|---|---|---|
| **Juicio completo** | 100% | Se completaron todas las etapas del proceso. |
| **Una etapa (1/3)** | 33,33% | Solo se completó una de las etapas. |
| **Dos etapas (2/3)** | 66,66% | Se completaron dos de las tres etapas. |

**Art.29 — Distribución de etapas por tipo de proceso:**

Cada tipo de proceso define cuántas etapas tiene y cuáles son. Por ejemplo:
- Juicio de conocimiento: generalmente 3 etapas (instructiva, admisión de pruebas, sentencia).
- Juicio ejecutivo: generalmente 2 etapas.
- Medida cautelar: generalmente 1 etapa.

**Relaciones:**

- Determinan el porcentaje que recibe el **Patrocinante**.
- Se aplican según el **Tipo de Proceso**.
- Pueden ser modificadas por **Contingencias Procesales** (ej: modo de terminación).

---

## 15. Mínimos Arancelarios

**Qué es:** Montos fijos en UMA que establecen un piso mínimo de honorarios para procesos sin cuantía pecuniaria o para actuaciones específicas.

**Types de tablas de mínimos:**

| Tabla | Fuente legal | Aplicación |
|---|---|---|
| **Judicial** | Art.48 | Procesos judiciales sin cuantía. |
| **Extrajudicial** | Art.44 | Actuaciones fuera del proceso judicial. |
| **Art.58** | Art.58 | Auxiliares de justicia. |
| **Art.48 (recursos)** | Art.48 | Recursos ante la CSJN. |
| **Art.31** | Art.31 | Segunda instancia. |
| **Art.44** | Art.44 | Casos especiales. |

**Attributes por mínimo:**

- **Tipo de proceso o actuación:** Para qué se aplica.
- **Monto en UMA:** Valor fijo mínimo.
- **Fecha de vigencia:** Desde cuándo rige.

**Relaciones:**

- Se comparan con los honorarios calculados por la **Escala**.
- Si los honorarios calculados son menores al mínimo, se aplica el mínimo.
- Los mínimos se expresan en **UMA**.

---

## Diagrama de Relaciones entre Entidades

```
┌─────────────────────────────────────────────────────────┐
│                    TIPO DE PROCESO                      │
│  (conocimiento, ejecutivo, sucesión, etc.)              │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────────┐   ┌──────────────────────────────┐
│  OBJETO DEL JUICIO  │   │   CONTINGENCIAS PROCESALES   │
│  (solo conocimiento)│   │  (modoTerminacion, resultado, │
└──────────┬──────────┘   │   aperturaPrueba, etc.)      │
           │              └──────────┬───────────────────┘
           │                         │
           ▼                         ▼
┌──────────────────────────────────────────────────────────┐
│                  BASE REGULATORIA                        │
│  (cuantía del asunto, expresada en pesos)               │
└──────────┬───────────────────────────────────────────────┘
           │
           │  Se reduce según Transformaciones
           ▼
┌──────────────────────────────────────────────────────────┐
│              TRANSFORMACIONES (Reducciones)              │
│  (factorBase: 0.7, 0.8 — antes de la escala)           │
└──────────┬───────────────────────────────────────────────┘
           │
           │  Se convierte a UMA
           ▼
┌──────────────────────────────────────────────────────────┐
│                     UMA                                  │
│  (Unidad Monetaria de Actualización)                    │
└──────────┬───────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                   ESCALA (Art.21)                        │
│  7 tramos, porcentajes progresivos                      │
│  Recibe: base en UMA + factorEscala                     │
│  Produce: honorarios (mínimo y máximo)                  │
└──────────┬───────────────────────────────────────────────┘
           │
           │  Se aplica según Etapas del Proceso
           ▼
┌──────────────────────────────────────────────────────────┐
│              HONORARIOS DEL PATROCINANTE                 │
│  (monto base × etapa completada × factorFinal)          │
└───┬──────────────┬──────────────┬───────────────────────┘
    │              │              │
    ▼              ▼              ▼
┌────────┐  ┌────────────┐  ┌────────────┐
│APODERADO│  │ PROCURADOR │  │ AUX. JUST. │
│ (+40%) │  │   (40%)    │  │ (5%-10%   │
│        │  │            │  │  base)     │
└───┬────┘  └─────┬──────┘  └─────┬──────┘
    │             │               │
    ▼             ▼               ▼
┌──────────────────────────────────────────────────────────┐
│              HONORARIOS TOTALES                          │
│  Patrocinante + Apoderado + Procurador + Auxiliares     │
└──────────┬───────────────────────────────────────────────┘
           │
           │  Si aplica segunda instancia
           ▼
┌──────────────────────────────────────────────────────────┐
│              SEGUNDA INSTANCIA                           │
│  30%-35% de primera instancia (hasta 40% si revocada)  │
└──────────────────────────────────────────────────────────┘
```

---

## Notas Finales

- **Mínimos Arancelarios** actúan como piso: si los honorarios calculados son inferiores al mínimo, se aplica el mínimo.
- Las **Transformaciones** pueden aplicarse en distintos momentos: antes de la escala (reducción de base), sobre la escala (factor de escala), o al total (factor final).
- El **Partidor** es una figura exclusiva de la sucesión y se calcula independientemente del patrocinante.
- Los **Auxiliares de Justicia** se calculan sobre la base, no sobre los honorarios del abogado.
- La **Segunda Instancia** es acumulativa: se suma a los honorarios de primera instancia.

---

*Documento generado conforme a la Ley 27.423 y su Decreto Reglamentario 218/2015.*
