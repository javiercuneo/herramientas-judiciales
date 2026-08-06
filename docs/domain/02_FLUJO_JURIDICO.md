# Flujo Jurídico Completo del Asistente de Honorarios - Ley 27.423

## Diagrama Narrativo del Recorrido del Usuario

Este documento describe, paso a paso, el recorrido completo que realiza el usuario al utilizar el asistente de cálculo de honorarios profesionales bajo la Ley 27.423 de Honorarios Profesionales de la Ciudad Autónoma de Buenos Aires. Cada decisión del usuario modifica el camino que sigue el wizard y los cálculos que se aplican al final.

---

## Mapa General de Navegación

```
PASO 0: UMA
(El usuario ingresa o el sistema carga la UMA)

  El sistema intenta cargar la UMA desde Google Sheets.
  El usuario puede modificarla manualmente.
  Si la modifica, se marca como "dirty" y no se
  sobreescribe con la carga remota.
                           |
                           v
PASO 1: TIPO DE PROCESO
(El usuario selecciona entre 10 opciones)
                           |
          +----------------+--------------------+
          v                v                    v
    EXHORTO          INCIDENTE          MEDIDA CAUTELAR
         |                |                    |
         v                v                    v
      PASO 5           PASO 4              PASO 2
    (Resultado)       (Base)          (Contingencia:
                                        oposicion)
                                           |
                                           v
                                        PASO 4
                                       (Base)
                                           |
                                           v
                                        PASO 5
                                       (Resultado)

          +----------------+--------------------+
          v                v                    v
    HOMOLOGACION      SUCESION          CONOCIMIENTO
    DESOCUPACION          |                    |
          v               v                    v
        PASO 2          PASO 2              PASO 2
      (vivienda)    (unico letrado)     (terminacion)
          |               |                    |
          v               v                    v
        PASO 4          PASO 4              PASO 3
       (Base)          (Base)         (objeto del juicio)
          |               |                    |
          v               v                    v
        PASO 5          PASO 5              PASO 4
      (Resultado)    (Resultado)          (Base)
                                           |
                                           v
                                        PASO 5
                                       (Resultado)

    EJECUCION SENTENCIA / EJECUTIVO
                  |
                  v
              PASO 2
         (terminacion +
          excepciones)
                  |
                  v
              PASO 4
             (Base)
                  |
                  v
              PASO 5
            (Resultado)
```

---

## PASO 0 — Unidad Monetaria de Actualizacion (UMA)

**Que ocurre?**
El usuario llega a la primera pantalla del wizard. El sistema intenta automaticamente cargar el valor vigente de la UMA desde una hoja de Google Sheets publicada como CSV. Si la carga remota falla, se utiliza un valor por defecto (92.482 pesos).

**Que decide el usuario?**
Puede aceptar el valor cargado o modificarlo manualmente. Si lo modifica, el sistema marca el campo como "dirty" y ya no lo sobreescribe con la carga remota.

**Que datos quedan almacenados?**
- `wizardState.valorUMA`: el valor numerico de la UMA en pesos.

**Por que importa?**
La UMA es la unidad de medida de toda la ley. Los minimos arancelarios se expresan en UMA y la escala del art. 21 se aplica sobre la base convertida a UMA. Un error en la UMA afecta todos los calculos posteriores.

---

## PASO 1 — Tipo de Proceso

**Que ocurre?**
Aparece un selector con las siguientes opciones:

| Codigo en sistema | Proceso |
|---|---|
| `exhorto` | Exhorto / Oficio (art. 50) |
| `incidente` | Incidente (art. 33) |
| `medida_cautelar` | Medida cautelar (art. 37) |
| `homologacion_desocupacion` | Homologacion de convenio de desocupacion (art. 40) |
| `sucesion` | Sucesion (art. 35) |
| `conocimiento` | De conocimiento (arts. 21-22) |
| `ejecucion_sentencia` | Ejecucion de sentencia (art. 41) |
| `ejecutivo` | Juicio ejecutivo (art. 34) |
| `minimos_*` | Consulta de minimos arancelarios (varios articulos) |

**Que decision toma el sistema?**
Segun la seleccion, el sistema determina que pasos siguientes mostrara y cuales omitira. Esta es la bifurcacion principal del wizard:

- **Exhorto**: Salta directamente al Paso 5 (Resultado). No requiere base monetaria porque los honorarios se fijan en UMA fijas.
- **Incidente**: Salta al Paso 4 (Base). No tiene contingencias procesales especiales.
- **Medida cautelar, Homologacion, Sucesion**: Van al Paso 2 (Contingencias).
- **Conocimiento**: Van al Paso 2 (Contingencias) y luego al Paso 3 (Objeto).
- **Ejecucion sentencia / Ejecutivo**: Van al Paso 2 (Contingencias con terminacion + excepciones).

---

## PASO 2 — Contingencias Procesales (Condicional)

**Que ocurre?**
Solo se muestra si el tipo de proceso lo requiere. Cada tipo tiene preguntas diferentes que modifican significativamente el calculo.

### 2a. Conocimiento / Ejecucion Sentencia / Ejecutivo — Modo de Terminacion

El usuario debe indicar como termino (o terminara) el proceso. Las opciones y sus efectos son:

#### Sentencia
- **Demanda admitida**: Sin efecto sobre la base. La base se ingresa con el monto de la liquidacion aprobada.
- **Demanda rechazada**: La base se reduce un **30%** antes de entrar a la escala. Fundamento: art. 22 ("Si fuere integramente desestimada la demanda o la reconvencion, se tendra como valor del pleito el importe de la misma... disminuido en un 30%").

#### Modos anormales (allanamiento, transaccion, desistimiento)
- **Antes de la apertura a prueba**: La escala del art. 21 se aplica al **50%**. Fundamento: art. 25.
- **Despues de la apertura a prueba**: Se aplica el **100%** de la escala.

#### Caducidad
El usuario puede elegir entre dos criterios:
- **Tratar como art. 22** (demanda desestimada): La base se reduce un 30%.
- **Tratar como art. 25** (modo anormal): Luego pregunta si fue antes o despues de la apertura a prueba. Si fue antes, la escala se aplica al 50%.

#### Honorarios provisorios (art. 12)
Si el profesional se aparta del proceso antes de su conclusion normal, solo se muestra el minimo arancelario. No hay rango minimo-maximo.

### 2b. Conocimiento / Ejecucion Sentencia / Ejecutivo — Excepciones (solo ejecucion y ejecutivo)

Solo para `ejecucion_sentencia` y `ejecutivo`, se pregunta si se dedujeron excepciones:
- **Sin excepciones**: Se aplica una reduccion del **10%** sobre los honorarios finales. Fundamento: art. 41 (ejecucion de sentencia) y art. 34 (ejecutivo). Esta reduccion es un `factorFinal`, no un factor de escala.

### 2c. Sucesion — Unico Letrado

- **Un solo abogado patrocina a todos los herederos**: La escala del art. 21 se aplica al **50%** (minimo y maximo). Fundamento: art. 35 ("si 1 solo abogado patrocina o representa a todos los herederos o interesados, sus honorarios se regularan en la mitad del minimo y del maximo de la escala establecida en el art. 21").
- **Varios abogados**: Sin reduccion. Se aplica el 100% de la escala.

### 2d. Medida Cautelar — Oposicion

- **Sin oposicion**: La base para calcular la escala es el **25%** de lo que resultaria con la escala completa del art. 21 sobre el monto a asegurar.
- **Con oposicion (controversia)**: La base se eleva al **50%** de la escala del art. 21.

Fundamento: art. 37 ("los honorarios se regularan sobre el monto que se pretende asegurar, aplicandose como base el 25% de la escala del art. 21; salvo casos de controversia u oposicion, en que la base se elevara al 50%").

**Esto no es una reduccion de la base monetaria, sino un multiplicador sobre los resultados de la escala.** Primero se calcula la escala completa y luego se multiplica por 0.25 o 0.50.

### 2e. Homologacion de Desocupacion — Tipo de Locacion

- **Alquiler para vivienda**: La base se reduce un **20%** antes de calcular la escala. Luego, sobre el resultado, se aplica un adicional del **50%** de reduccion por ser homologacion. Fundamento: art. 40.
- **Otros casos**: Solo se aplica la reduccion del 50% por homologacion. Sin reduccion del 20% sobre la base.

---

## PASO 3 — Objeto del Juicio (Solo para Conocimiento)

**Que ocurre?**
Solo aparece cuando el tipo de proceso es "conocimiento". El usuario debe seleccionar la naturaleza del asunto. Cada objeto tiene reglas especificas para determinar que monto ingresar como base regulatoria.

### Opciones disponibles y sus efectos:

| Objeto | Regla de base | Articulos |
|---|---|---|
| Sumas de dinero | Monto de la demanda, o liquidacion si hay sentencia | art. 22, 24, 52 |
| Inmuebles | Tasacion, o VF actualizada +50%, o estimacion profesional | art. 23 inc. a |
| Derechos crediticios | Valor en escrituras, deducidas amortizaciones | art. 23 inc. d |
| Titulos y acciones | Valor de cotizacion en Bolsa o entidad bancaria | art. 23 inc. e |
| Establecimientos | Activo - Pasivo + 10% (valor llave) | art. 23 inc. f |
| Uso y habitacion | 10% anual del valor del bien x anios, max. 100% | art. 23 inc. h |
| Escrituracion | Valor del bien o monto del boleto (el mayor) | art. 46 |
| Desalojo | Total de alquileres del contrato | art. 40 |
| Alimentos | Importe de 2 anios de cuota fijada | art. 39 |
| Liquidacion patrimonial (familia) | Patrimonio adjudicado | art. 45 |
| Posesorias / Interdictos | Base general del art. 23 + posible reduccion del 20% | art. 38 |
| Incidencia colectiva | Base general del art. 21 + reduccion del 25% | art. 49 |

### Sub-condicionales dentro del Paso 3:

#### Desalojo
- **Alquiler para vivienda**: Se informa al usuario que la base se reducira un 20% automaticamente al calcular. El usuario ingresa el monto total del contrato (sin reducir).
- **Demas casos civiles**: Sin reduccion.
- **Desalojo laboral**: La base se calcula por art. 43 (50% de la ultima remuneracion x 2 anios).

#### Posesorias / Interdictos
- **Actuacion exclusivamente en beneficio del patrocinado** (con relacion a la cuota o parte defendida): Se aplica una reduccion del **20%** sobre los honorarios finales. Fundamento: art. 38.
- **Demas casos**: Sin reduccion.

---

## PASO 4 — Base Regulatoria (Monto Numerico)

**Que ocurre?**
El usuario ingresa el monto monetario que servira como base para el calculo. Segun el tipo de proceso y las selecciones anteriores, se muestra un texto explicativo con la fundamentacion legal de que monto debe ingresar.

**Que validaciones se aplican?**
- El monto debe ser mayor a cero.
- El sistema advierte al usuario que no ingrese montos con reducciones porque el sistema las calculara automaticamente.

**Que sucede con las reducciones sobre la base?**
Algunas contingencias modifican la base **antes** de que esta entre a la escala del art. 21. Estas reducciones se aplican en el momento del calculo (Paso 5), no al momento de ingresar el monto:

| Condicion | Reduccion sobre base | Art. |
|---|---|---|
| Desalojo para vivienda | x 0.80 (-20%) | art. 40 |
| Demanda rechazada | x 0.70 (-30%) | art. 22 |
| Caducidad tratada como art. 22 | x 0.70 (-30%) | art. 22 |
| Homologacion desocupacion con vivienda | x 0.80 (-20%) | art. 40 |

**Importante**: Estas reducciones se multiplican entre si si concurren. La base resultante es la que entra a `calcularEscalaBase()`.

---

## PASO 5 — Resultado: El Calculo Completo

Este es el paso final donde se ensambla todo. A continuacion se describe el orden exacto de operaciones para el **caso general** (conocimiento, ejecucion sentencia, ejecutivo, sucesion), seguido de los casos especiales.

### Orden de Operaciones — Caso General

```
                  ORDEN DE OPERACIONES

  1. DETERMINAR BASE
     baseReducida = baseValor x factorReduccionBase
     (aplicable si: desalojo vivienda, demanda rechazada,
      caducidad art.22, homologacion vivienda)

  2. CONVERTIR BASE A UMA
     baseEnUMA = baseReducida / valorUMA

  3. CALCULAR ESCALA (art. 21)
     Se determina el tramo segun baseEnUMA:
       1ra: hasta 15 UMA  -> 22%-33%
       2da: 16-45 UMA     -> 20%-26%  (+ acumulado anterior)
       3ra: 46-90 UMA     -> 18%-24%  (+ acumulado anterior)
       4ta: 91-150 UMA    -> 17%-22%  (+ acumulado anterior)
       5ta: 151-450 UMA   -> 15%-20%  (+ acumulado anterior)
       6ta: 451-750 UMA   -> 13%-17%  (+ acumulado anterior)
       7ma: +750 UMA      -> 12%-15%  (+ acumulado anterior)

     El minimo se calcula: Maximo de escala anterior
     + (excedente x %minimo de escala actual)
     El maximo se calcula: Maximo de escala anterior
     + (excedente x %maximo de escala actual)

  4. APLICAR REDUCCIONES DE ESCALA (factorEscala)
     Se multiplican entre si:
       - Unico letrado en sucesion: x 0.50 (art. 35)
       - Ejecucion de sentencia: x 0.50 (art. 41)
       - Modo anormal antes de prueba: x 0.50 (art. 25)
       - Caducidad art.25 antes de prueba: x 0.50 (art. 25)

     patrocinante_min = escala.min x factorEscala
     patrocinante_max = escala.max x factorEscala

  5. APLICAR REDUCCIONES FINALES (factorFinal)
     Se multiplican entre si:
       - Ejecutivo sin excepciones: x 0.90 (art. 34)
       - Ejecucion sentencia sin excepciones: x 0.90
       - Posesorias beneficio exclusivo: x 0.80 (art. 38)
       - Incidencia colectiva: x 0.75 (art. 49)

     patrocinante_min_final = patrocinante_min x factorFinal
     patrocinante_max_final = patrocinante_max x factorFinal

  6. CALCULAR APODERADO
     apoderado_min = patrocinante_min_final x 1.40 (+40%)
     apoderado_max = patrocinante_max_final x 1.40 (+40%)

  7. CALCULAR PROCURADOR
     procurador_min = patrocinante_min_final x 0.40 (40%)
     procurador_max = patrocinante_max_final x 0.40 (40%)

  8. CALCULAR AUXILIARES DE JUSTICIA
     auxMin = baseEnUMA x 0.05 (5% de la base, NO de
              honorarios)
     auxMax = baseEnUMA x 0.10 (10% de la base, NO de
              honorarios)

  9. CALCULAR SEGUNDA INSTANCIA (art. 30)
     Minimo: 30% de primera instancia
     Maximo: 35% de primera instancia
     Maximo revocada: 40% de primera instancia

  10. CALCULAR PARTIDOR (solo sucesion, art. 35)
      partidor_min = baseReducida x 0.02 (2%)
      partidor_max = baseReducida x 0.03 (3%)

  11. CONVERTIR TODO A PESOS
      todos los montos x valorUMA
```

### Detalle de cada componente del resultado

#### Escala del art. 21 — Como se calcula

La escala es **progresiva con acumulacion**. No se aplica un porcentaje fijo sobre el total, sino que cada tramo se calcula sobre la porcion de base que le corresponde, y se suma el maximo alcanzado en el tramo anterior.

**Ejemplo**: Base de 50 UMA (tercera escala: 46-90 UMA)
- Tramo 1 (hasta 15 UMA): 15 x 33% = 4.95 UMA (maximo acumulado)
- Tramo 2 (16-45 UMA): 30 x 26% = 7.80 UMA. Maximo acumulado = 4.95 + 7.80 = 11.70 UMA
- Tramo 3 (46-50 UMA): 5 x 24% = 1.20 UMA
- Maximo total: 11.70 + 1.20 = 12.90 UMA
- Minimo total: 11.70 + (5 x 18%) = 11.70 + 0.90 = 12.60 UMA

La interpretacion del minimo sigue el texto literal del art. 21: "En ningun caso los honorarios podran ser inferiores al **maximo del grado inmediato anterior** de la escala, con mas el incremento por aplicacion al excedente de la alicuota que corresponde al grado siguiente."

#### Patrocinante

Es el resultado directo de la escala aplicada (con sus reducciones). Se presenta en tres filas:
- Juicio completo
- Una etapa (1/3)
- Dos etapas (2/3)

#### Apoderado (+40%)

Si el abogado actuo como apoderado sin patrocinio, percibe la suma total de ambos. Si hubo patrocinante y apoderado separados, el apoderado recibe un 40% adicional sobre lo que corresponde al patrocinante.

Fundamento: art. 20 ("Los honorarios de los procuradores se fijaran en un 40% de los que por esta ley corresponda fijar a los abogados patrocinantes. Si el abogado actuare en caracter de apoderado sin patrocinio, percibira la asignacion total que hubiere correspondido a ambos").

#### Procurador (40% del patrocinante)

Es el 40% del honorario del patrocinante. Se calcula **sobre el resultado del patrocinante ya reducido**, no sobre la base ni sobre la escala pura.

#### Auxiliares de justicia (5%-10% de la base)

**Importante**: Los auxiliares se calculan sobre la **base expresada en UMA**, NO sobre los honorarios. Es un porcentaje de la cuantia del proceso:
- Minimo: 5% de la base en UMA
- Maximo: 10% de la base en UMA

Fundamento: art. 21, antepenultimo parrafo. El monto no puede ser inferior al 5% ni superior al 10% del monto del proceso.

#### Segunda instancia (art. 30)

Se calcula como un porcentaje de los honorarios de primera instancia:
- Minimo: 30% de primera instancia
- Maximo: 35% de primera instancia
- Maximo si la sentencia recurrida fue revocada en todas sus partes: 40% de primera instancia

Fundamento: art. 30 ("Por las actuaciones correspondientes a la segunda o ulterior instancia, se regularan en cada una de ellas del 30% al 35% de la cantidad que se fije para honorarios en primera instancia... Si la sentencia recurrida fuera revocada en todas sus partes en favor del apelante, los honorarios profesionales por los trabajos en esa instancia de apelacion se fijaran entre el 30% y 40% de los correspondientes a la primera instancia").

#### Partidor (solo sucesion, art. 35)

Los honorarios del abogado o abogados partidores en conjunto se fijan sobre el valor del haber a dividirse:
- Minimo: 2%
- Maximo: 3%

---

### Casos Especiales en el Paso 5

#### Exhorto (art. 50)

No requiere base monetaria. Los honorarios se fijan directamente en UMA:

| Concepto | UMA |
|---|---|
| Notificaciones (inc. a) | Minimo 3 UMA |
| Inscripciones y actos registrales (inc. b) | 10-20 UMA |
| Diligencias de prueba (inc. c) | 7-30 UMA |

#### Incidente (art. 33)

La base se convierte a UMA y se aplica una escala simplificada:
- Minimo: 2% de la base en UMA
- Maximo: 20% de la base en UMA

Fundamento: art. 33, ley 21839. Los incidentes se dividen en 2 etapas: la primera comprende el planteo que lo origina y la segunda el desarrollo hasta su conclusion.

#### Medida Cautelar (art. 37)

Se calcula la escala del art. 21 sobre la base (monto a asegurar) y luego se aplica un factor:
- Sin oposicion: **x 0.25** (25% de la escala)
- Con oposicion: **x 0.50** (50% de la escala)

Fundamento: art. 37. Los auxiliares de justicia se calculan por separado (5%-10% de la base).

#### Homologacion de Desocupacion (art. 40)

Se aplica una reduccion del **50%** sobre los honorarios que resultarian de la escala. Si ademas es para vivienda, primero se reduce la base un 20% y luego se aplica el 50%:

```
Si es para vivienda:
  baseFinal = baseValor x 0.80
  resultado = escala(baseFinal) x 0.50

Si no es para vivienda:
  baseFinal = baseValor
  resultado = escala(baseFinal) x 0.50
```

Los auxiliares se calculan por separado (5%-10% de la base).

---

## Resumen Visual del Flujo por Tipo de Proceso

```
EXHORTO:
  [UMA] -> [Tipo: Exhorto] -> [Resultado: fijo en UMA]

INCIDENTE:
  [UMA] -> [Tipo: Incidente] -> [Base monetaria] -> [Resultado: 2%-20%]

MEDIDA CAUTELAR:
  [UMA] -> [Tipo: Cautelar] -> [Oposicion?] -> [Base monetaria] -> [Resultado: escala x 0.25 o x 0.50]

HOMOLOGACION DESOCUPACION:
  [UMA] -> [Tipo: Homologacion] -> [Vivienda?] -> [Base monetaria] -> [Resultado: escala x 0.50]

SUCESION:
  [UMA] -> [Tipo: Sucesion] -> [Unico letrado?] -> [Base monetaria] -> [Resultado: escala x 0.50 si unico + partidor]

CONOCIMIENTO:
  [UMA] -> [Tipo: Conocimiento] -> [Terminacion?] -> [Objeto?] -> [Base monetaria] -> [Resultado: escala completa]

EJECUCION SENTENCIA / EJECUTIVO:
  [UMA] -> [Tipo: Ejecucion/Ejecutivo] -> [Terminacion?] -> [Excepciones?] -> [Base monetaria] -> [Resultado: escala x 0.50 si art.41 + x 0.90 si sin excepciones]
```

---

## Flujo de Minimos Arancelarios (Ruta Independiente)

Desde cualquier punto del wizard, el usuario puede acceder a la pantalla de minimos arancelarios. Esta es una ruta independiente del calculo principal.

```
           RUTA DE MINIMOS ARANCELARIOS

  [Boton "Ver minimos"] o [desde resultado]
                    |
                    v
  Selector de categoria de minimos

  - Labor extrajudicial (art. 19)
  - Asuntos judiciales no
    pecuniarios (art. 19)
  - Acciones de inconstitucionalidad
    amparo, habeas (art. 48)
  - Contencioso administrativo
    (art. 44)
  - Minimos art. 58
  - Recursos CSJN (art. 31)
  - Auxiliares de justicia

                    |
                    v
  Tabla de minimos calculados con UMA
  vigente (Minimo x valorUMA)
```

Las tablas de minimos arancelarios incluyen:

- **Art. 19 inc. b (extrajudicial)**: Desde 0.5 UMA (consulta verbal) hasta 5 UMA (contrato de sociedad).
- **Art. 19 inc. a (judicial no pecuniario)**: Desde 2 UMA (informacion sumaria) hasta 25 UMA (divorcio, adopcion, habeas corpus).
- **Art. 48**: 20 UMA fijo para acciones de inconstitucionalidad, amparo, habeas data y habeas corpus.
- **Art. 44**: 7 UMA (contencioso administrativo) o 5 UMA (actuaciones administrativas).
- **Art. 58**: Minimos para juicios pecuniarios no previstos en otros articulos (10 UMA conocimiento, 6 UMA ejecutivo, 2 UMA mediacion, 4 UMA auxiliares).
- **Art. 31**: 20 UMA (recursos ante CSJN), 15 UMA (quejas).
- **Auxiliares**: 4 UMA (art. 58), 2 UMA (art. 60, peritos), 2 UMA por pericia (art. 61 bis).

---

## Diagrama de Dependencias de Calculo

```
                    baseValor (ingresado en Paso 4)
                           |
              +------------+------------+
              |  Hay reduccion base?   |
              |  (vivienda, rechazo,    |
              |   caducidad art.22)     |
              +------------+------------+
                    +------+------+
                    |             |
                   SI            NO
                    |             |
                    v             |
            baseReducida =        |
            baseValor x factor    |
                    |             |
                    +------+------+
                           |
                           v
                    baseEnUMA = base / UMA
                           |
                           v
               calcularEscalaBase(baseEnUMA)
                           |
              +------------+----------------+
              | Retorna:                     |
              |  - patrocinante.full.min/max |
              |  - apoderado.full.min/max    |
              |  - auxMin, auxMax            |
              |  - tituloEscala              |
              |  - maximoEscalaAnterior      |
              +------------+----------------+
                           |
                           v
              +-------------------------+
              | factorEscala            |
              | (reducciones de escala) |
              |                         |
              | x 0.50 si:             |
              |  - Sucesion unico letr. |
              |  - Ejecucion sentencia  |
              |  - Modo anormal < prueba|
              |  - Caducidad art.25     |
              +------------+------------+
                           |
                           v
              minEscala = escala.min x factorEscala
              maxEscala = escala.max x factorEscala
                           |
                           v
              +-------------------------+
              | factorFinal             |
              | (reducciones finales)   |
              |                         |
              | x 0.90 si:             |
              |  - Ejecutivo sin exc.   |
              |  - Ejecucion s. sin exc.|
              | x 0.80 si:             |
              |  - Posesorias beneficio |
              | x 0.75 si:             |
              |  - Incidencia colectiva |
              +------------+------------+
                           |
                           v
              patrocinante_min = minEscala x factorFinal
              patrocinante_max = maxEscala x factorFinal
                           |
              +------------+------------+
              |            |            |
              v            v            v
          Apoderado    Procurador   Auxiliares
         (x1.40)      (x0.40)     (5%-10% base,
                                   NO de honorarios)
              |            |            |
              +------------+------------+
                           |
                           v
                  Segunda Instancia
                 (30%-40% de 1ra inst.)
                           |
                           v
              +------------+------------+
              | Es sucesion?           |
              +------+----------+-------+
                    SI         NO
                    |          |
                    v          |
               Partidor       |
             (2%-3% base)     |
                    |          |
                    +-----+----+
                          |
                          v
                Todos los montos x UMA
                   = Montos en pesos
```

---

## Caso Especial: Medida Cautelar (Flujo Propio)

La medida cautelar tiene un flujo diferente porque el factor se aplica **sobre los resultados de la escala**, no sobre la base:

```
  baseValor (monto a asegurar)
       |
       v
  calcularEscalaBase(baseValor)
       |
       v
  Escala completa calculada
       |
       +--- patrocinante.full.min, .max
       +--- apoderado.full.min, .max
       |
       v
  Hubo oposicion?
       |
  +----+----+
  SI       NO
  |         |
  v         v
x 0.50    x 0.25
  |         |
  +----+----+
       |
       v
  Resultados = escala x factor
       |
       v
  Procurador = patrocinante_result x 0.40
  Auxiliares = 5%-10% de base en UMA
```

---

## Caso Especial: Homologacion de Desocupacion (Flujo Propio)

```
  baseValor (total de alquileres)
       |
       +--- Es vivienda?
       |        |
       |   +----+----+
       |   SI       NO
       |   |         |
       |   v         |
       | x 0.80     |
       |   |         |
       |   +----+----+
       |        |
       v        v
  baseFinal (posiblemente reducida)
       |
       v
  calcularEscalaBase(baseFinal)
       |
       v
  Escala completa calculada
       |
       v
  factorEscala = 0.50 (por homologacion, art. 40)
       |
       v
  Resultados = escala x 0.50
       |
       +--- Patrocinante
       +--- Apoderado (x1.40)
       +--- Procurador (x0.40 del patrocinante)
       +--- Auxiliares (5%-10% de base en UMA)
```

---

## Matriz de Reducciones Aplicables

| Tipo de proceso | Reduccion base (antes de escala) | Reduccion escala (factorEscala) | Reduccion final (factorFinal) |
|---|---|---|---|
| Exhorto | N/A (fijo en UMA) | N/A | N/A |
| Incidente | Ninguna | Ninguna | Ninguna |
| Medida cautelar | Ninguna | x0.25 o x0.50 (segun oposicion) | Ninguna |
| Homologacion desocupacion | x0.80 si vivienda | x0.50 (homologacion) | Ninguna |
| Sucesion | Ninguna | x0.50 si unico letrado | Ninguna |
| Conocimiento (desalojo vivienda) | x0.80 | Segun terminacion | Posesorias x0.80 / Incidencia colectiva x0.75 |
| Conocimiento (demanda rechazada) | x0.70 | Segun terminacion | Posesorias x0.80 / Incidencia colectiva x0.75 |
| Ejecucion sentencia | Segun terminacion | x0.50 (art. 41 siempre) + segun terminacion | x0.90 si sin excepciones |
| Ejecutivo | Segun terminacion | Segun terminacion | x0.90 si sin excepciones |

---

## Notas Importantes sobre el Calculo

1. **El minimo de la escala se calcula con acumulacion**: Cuando la base supera un tramo, el minimo no es simplemente base x %minimo, sino que incluye el maximo alcanzado en el tramo anterior mas el minimo del tramo actual sobre el excedente.

2. **Los auxiliares NO se calculan sobre los honorarios**: Se calculan sobre la base del proceso expresada en UMA. Es un porcentaje de la cuantia, no de lo que se le regula al abogado.

3. **Las reducciones se multiplican entre si**: Si concurren varias reducciones (por ejemplo, ejecucion de sentencia x0.50 + sin excepciones x0.90), se multiplican secuencialmente. No se suman los porcentajes.

4. **El procurador es 40% del patrocinante, no del total**: Se calcula sobre el monto que resulta para el patrocinante despues de todas las reducciones.

5. **La segunda instancia se calcula sobre los honorarios de primera**: Es un porcentaje de lo que ya se calculo para primera instancia, no sobre la base.

6. **Honorarios provisorios solo muestran el minimo**: Cuando el profesional se aparta del proceso, solo se regula el minimo arancelario (art. 12).

7. **La UMA es el corazon de la ley**: Toda conversion entre UMA y pesos depende del valor de UMA vigente. Si la UMA cambia, todos los montos se recalculan.
