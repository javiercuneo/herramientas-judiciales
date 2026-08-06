# 05 - Mapa de Dependencias por Tipo de Proceso

> Ley 27.423 y su decreto reglamentario 2642/2015.
> Este documento describe que modulos y componentes invoca cada tipo de proceso durante el calculo de honorarios.

---

## Criterio general

Todo proceso (salvo Exhorto e Incidente) comienza calculando la **escala del art. 21**.
Sobre el resultado se aplican, en orden:

1. **Reducciones base** (art. 22, art. 40) - sobre el monto de escala.
2. **Reducciones de escala** (art. 25, art. 35, art. 41) - sobre el monto ya reducido.
3. **Reducciones finales / adicionales** (art. 34, art. 38, art. 49) - sobre el monto ya reducido.

Despues se distribuyen entre los profesionales intervinientes (patrocinante, apoderado, procurador)
y se calculan auxiliares y segunda instancia cuando corresponde.

---

## 1. Conocimiento (juicio ordinario / abreviado)

```
CALCULO BASE
  |
  +---> Escala del art. 21 (monto originario del pleito)
  |
  +---> Reducciones BASE (se aplican sobre la escala)
  |     +-- art. 40 vivienda:  -20 %  (desalojo por vivienda)
  |     +-- art. 22 rechazo:   -30 %  (demanda rechazada en totalidad)
  |
  +---> Reducciones de ESCALA (se aplican sobre la escala ya reducida en base)
  |     +-- art. 25 modos anormales:   -50 % (acuerdo / conciliacion antes de la prueba)
  |     +-- art. 25 caducidad:         -50 % (caducidad de la instancia)
  |
  +---> Reducciones FINALES / ADICIONALES (se aplican sobre el monto anterior)
  |     +-- art. 38 posesorias:        -20 %
  |     +-- art. 49 incidencia colectiva: -25 %
  |
  +---> Profesionales
  |     +-- patrocinante        -> 100 % de honorarios
  |     +-- apoderado           -> +40 % sobre patrocinante
  |     +-- procurador          -> 40 % sobre patrocinante
  |
  +---> Auxiliares del art. 43   -> 5 % a 10 %
  |
  +---> Segunda instancia (art. 30)
        +-- apelacion parcial   -> 50 %
        +-- apelacion total     -> 100 %

  X NO usa partidor
```

### Notas

- El art. 22 solo se aplica si la demanda fue **rechazada en su totalidad**.
- El art. 40 (vivienda) se aplica cuando el objeto es un desalojo por vivienda y es
  **acumulable** con la reduccion del art. 22 si ambas circunstancias se dan.
- Los art. 25 modos anormales y caducidad son **alternativos** (se aplica el que corresponda).
- Los arts. 38 y 49 son **alternativos** entre si (posesorias o incidencia colectiva).

---

## 2. Ejecucion de Sentencia

```
CALCULO BASE
  |
  +---> Escala del art. 21 (monto de la sentencia a ejecutar)
  |
  +--X NO aplica reducciones BASE (art. 22 / art. 40)
  |
  +---> Reducciones de ESCALA (se aplican sobre la escala)
  |     +-- art. 41 ejecucion sentencia:  -50 % (siempre)
  |     +-- art. 25 modos anormales:      -50 % (acuerdo / conciliacion antes de la prueba)
  |
  +---> Reducciones FINALES / ADICIONALES
  |     +-- art. 34 sin excepciones:  -10 %
  |
  +---> Profesionales
  |     +-- patrocinante        -> 100 % de honorarios
  |     +-- apoderado           -> +40 % sobre patrocinante
  |     +-- procurador          -> 40 % sobre patrocinante
  |
  +---> Auxiliares del art. 43   -> 5 % a 10 %
  |
  +---> Segunda instancia (art. 30)
        +-- apelacion parcial   -> 50 %
        +-- apelacion total     -> 100 %

  X NO usa reducciones base
  X NO usa partidor
```

### Notas

- La reduccion del art. 41 es **obligatoria y siempre** se aplica para ejecucion de sentencia.
- El art. 25 modos anormales se aplica **sobre el monto ya reducido por art. 41** si corresponde.
- El art. 34 (sin excepciones) se aplica **despues** de las reducciones de escala.

---

## 3. Ejecutivo (juicio ejecutivo)

```
CALCULO BASE
  |
  +---> Escala del art. 21 (monto del titulo ejecutivo)
  |
  +--X NO aplica reducciones BASE (art. 22 / art. 40)
  |
  +---> Reducciones de ESCALA
  |     +-- art. 25 modos anormales:  -50 % (acuerdo / conciliacion antes de la prueba)
  |
  +---> Reducciones FINALES / ADICIONALES
  |     +-- art. 34 sin excepciones:  -10 %
  |
  +---> Profesionales
  |     +-- patrocinante        -> 100 % de honorarios
  |     +-- apoderado           -> +40 % sobre patrocinante
  |     +-- procurador          -> 40 % sobre patrocinante
  |
  +---> Auxiliares del art. 43   -> 5 % a 10 %
  |
  +---> Segunda instancia (art. 30)
        +-- apelacion parcial   -> 50 %
        +-- apelacion total     -> 100 %

  X NO usa reducciones base
  X NO usa partidor
```

### Notas

- Al ejecutivo **no** le corresponde la reduccion del art. 41 (eso es solo para ejecucion de sentencia).
- El art. 34 se aplica siempre que no se configure una excepcion.

---

## 4. Sucesion (incidente de inventario / particion)

```
CALCULO BASE
  |
  +---> Escala del art. 21 (monto de la masa sucesoria)
  |
  +--X NO aplica reducciones BASE
  |
  +---> Reducciones de ESCALA
  |     +-- art. 35 unico letrado:  -50 % (un solo abogado interviniente)
  |
  +--X NO aplica reducciones FINALES
  |
  +---> Profesionales
  |     +-- patrocinante        -> 100 % de honorarios
  |     +-- apoderado           -> +40 % sobre patrocinante
  |     +-- procurador          -> 40 % sobre patrocinante
  |
  +---> Partidor                -> 2 % a 3 % (sobre la masa sucesoria)
  |
  +---> Auxiliares del art. 43   -> 5 % a 10 %
  |
  +---> Segunda instancia (art. 30)
        +-- apelacion parcial   -> 50 %
        +-- apelacion total     -> 100 %

  X NO usa reducciones base
  X NO usa reducciones finales
```

### Notas

- El partidor (art. 51 inc. 8) es un profesional **adicional** al patrocinante, apoderado y procurador.
- El art. 35 se aplica **solo** cuando interviene un unico letrado; si hay varios, no hay reduccion.

---

## 5. Exhorto (diligenciamiento)

```
CALCULO BASE
  |
  +--X NO usa escala del art. 21
  |
  +---> Tarifas fijas en UMA (art. 50)
  |     +-- monto en pesos segun tabla de UMA vigente
  |
  +--X NO usa patrocinante / apoderado / procurador
  +--X NO usa auxiliares
  +--X NO usa segunda instancia
```

### Notas

- El art. 50 establece montos fijos expresos en UMA para cada tipo de diligenciamiento.
- No hay distribucion entre profesionales: se cobra un monto unitario.

---

## 6. Incidente (art. 33)

```
CALCULO BASE
  |
  +--X NO usa escala del art. 21
  |
  +---> Porcentajes DIRECTOS sobre la base economica del incidente (art. 33)
  |     +--  2 %  ->  monto hasta 10.000 UMA
  |     +--  5 %  ->  monto de 10.001 a 50.000 UMA
  |     +-- 10 %  ->  monto de 50.001 a 100.000 UMA
  |     +-- 15 %  ->  monto de 100.001 a 500.000 UMA
  |     +-- 20 %  ->  monto superior a 500.000 UMA
  |
  +--X NO usa reducciones (base, escala ni finales)
  +--X NO usa patrocinante / apoderado / procurador separados
  +--X NO usa auxiliares
  +--X NO usa segunda instancia
```

### Notas

- El art. 33 define una escala **propia y excluyente** para incidentes.
- No se aplica el art. 21 ni ninguna reduccion de la ley general.
- El porcentaje se aplica directamente sobre la base economica del incidente.

---

## 7. Medida Cautelar

```
CALCULO BASE
  |
  +---> Escala del art. 21 (monto de la medida cautelar)
  |
  +--X NO aplica reducciones BASE
  |
  +---> Factor de ART. 37
  |     +-- sin oposicion del demandado:  25 %
  |     +-- con oposicion del demandado:  50 %
  |
  +--X NO aplica reducciones de ESCALA
  +--X NO aplica reducciones FINALES
  |
  +---> Profesionales (sobre honorarios con factor aplicado)
  |     +-- patrocinante        -> 100 % de honorarios (con factor)
  |     +-- apoderado           -> +40 % sobre patrocinante (con factor)
  |     +-- procurador          -> 40 % sobre patrocinante (con factor)
  |
  +---> Auxiliares del art. 43   -> 5 % a 10 %
  |
  +--X NO usa segunda instancia
```

### Notas

- El factor del art. 37 se aplica **sobre los honorarios calculados con la escala del art. 21**.
- El 25 % (sin oposicion) o 50 % (con oposicion) reemplaza las reducciones habituales.
- No hay segunda instancia para medidas cautelares.

---

## 8. Homologacion de Desocupacion (art. 40 par. 2)

```
CALCULO BASE
  |
  +---> Escala del art. 21 (monto del juicio de desalojo)
  |
  +---> Posible reduccion BASE: art. 40 vivienda:  -20 %
  |     +-- se aplica si el inmueble es destinado a vivienda
  |
  +---> Factor de ART. 40 par. 2:  50 % sobre los honorarios
  |     +-- sobre el monto de escala (con o sin reduccion base)
  |
  +--X NO aplica reducciones de ESCALA
  +--X NO aplica reducciones FINALES
  |
  +---> Profesionales
  |     +-- patrocinante        -> 100 % de honorarios
  |     +-- apoderado           -> +40 % sobre patrocinante
  |     +-- procurador          -> 40 % sobre patrocinante
  |
  +---> Auxiliares del art. 43   -> 5 % a 10 %
  |
  +--X NO usa segunda instancia
```

### Notas

- El art. 40 par. 2 establece un **factor del 50 %** sobre los honorarios por homologacion de desocupacion.
- Si el inmueble es vivienda, primero se aplica la reduccion del art. 40 (-20 %) y luego el factor del 50 %.
- No hay segunda instancia para este tramite.

---

## Cuadro comparativo

| Proceso                  | Escala 21 | Red. Base | Red. Escala | Red. Finales | Profesionales | Auxiliares | 2a Inst. | Partidor |
|--------------------------|:---------:|:---------:|:-----------:|:------------:|:-------------:|:----------:|:--------:|:--------:|
| Conocimiento             |    Si     |    Si     |     Si      |      Si      |      Si       |     Si     |    Si    |    No    |
| Ejecucion de Sentencia   |    Si     |    No     |     Si      |      Si      |      Si       |     Si     |    Si    |    No    |
| Ejecutivo                |    Si     |    No     |     Si      |      Si      |      Si       |     Si     |    Si    |    No    |
| Sucesion                 |    Si     |    No     |     Si      |      No      |      Si       |     Si     |    Si    |    Si    |
| Exhorto                  |    No     |    No     |     No      |      No      |      No       |     No     |    No    |    No    |
| Incidente                |    No     |    No     |     No      |      No      |      No       |     No     |    No    |    No    |
| Medida Cautelar          |    Si     |    No     |     No      |      No      |      Si       |     Si     |    No    |    No    |
| Homologacion Desocup.    |    Si     |  Si (viv) |     No      |      No      |      Si       |     Si     |    No    |    No    |

**Leyenda:**
- **Si**: se usa / aplica
- **No**: no se usa / no aplica
- **Si (viv)**: se usa solo si el inmueble es destinado a vivienda

---

## Orden de calculo generalizado

Para todos los procesos que usan escala del art. 21, el orden de aplicacion es:

```
1. Monto del pleito / base economica
          |
          v
2. Escala del art. 21  ->  resultado en pesos (honorarios)
          |
          v
3. Reducciones BASE  (art. 22, art. 40)  ->  sobre honorarios
          |
          v
4. Reducciones de ESCALA  (art. 25, art. 35, art. 41)  ->  sobre honorarios reducidos
          |
          v
5. Reducciones FINALES / ADICIONALES  (art. 34, art. 38, art. 49)  ->  sobre honorarios reducidos
          |
          v
6. Distribucion entre PROFESIONALES
     +-- patrocinante: 100 %
     +-- apoderado:    +40 % sobre patrocinante
     +-- procurador:    40 % sobre patrocinante
          |
          v
7. Auxiliares del art. 43  ->  5 % a 10 %
          |
          v
8. Segunda instancia (art. 30)  ->  50 % parcial / 100 % total
```

**Excepciones al orden:**

- **Medida Cautelar**: el factor del art. 37 (25 % / 50 %) se aplica **en lugar de** reducciones base,
  escala y finales.
- **Homologacion Desocupacion**: la reduccion base (art. 40, -20 %) se aplica primero y luego
  el factor del 50 % sobre el resultado.
- **Sucesion**: no hay reducciones base ni finales; solo escala (art. 35) y partidor.
- **Exhorto e Incidente**: no siguen este flujo; tienen calculo independiente.
