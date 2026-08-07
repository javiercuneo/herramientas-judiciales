# Qué invoca cada proceso, y qué se rompe si tocás esto

> Documento de dominio — Ley 27.423

Dos mapas:

1. **Qué funciones del motor usa cada tipo de proceso.** Para saber dónde mirar
   cuando un número de un proceso no cierra.
2. **Qué depende de cada pieza compartida.** Para saber qué se rompe —y qué hay
   que verificar— cuando se toca algo que usan varios.

El [06](06_MATRIZ_DE_PROCESOS.md) es la matriz comparativa: qué aplica y qué no
aplica a cada proceso, en una tabla. **Este documento no la repite**: va por el
código.

> **Verificado el 7/8/2026** contra el motor. Lo que se corrigió está al final,
> y hay un error que **cambia números**: el documento decía que las reducciones
> de base se aplican sobre el resultado de la escala. Se aplican sobre la base,
> antes de la escala, y no da lo mismo.

---

## El error que hacía este documento peligroso

Decía, en cinco lugares distintos, que las reducciones de los arts. 22 y 40 se
aplican **sobre el monto de la escala**. Y su diagrama de orden general ponía la
escala en el paso 2 y las reducciones de base en el paso 3.

**Es al revés, y la diferencia es material.** La base se reduce primero y recién
después entra a la escala. Como la escala es progresiva, reducir la base puede
hacerla caer a un tramo distinto, con otra alícuota.

Corrido contra el motor, con una demanda desestimada (-30 %, art. 22):

```
base $50.000.000 · UMA $102.076

MOTOR   base × 0,7 y después la escala   →  5ª escala (151-450 UMA): 15% a 20%
        mínimo                              61,93 UMA = $6.321.798

DOC 05  la escala y después × 0,7        →  6ª escala (451-750 UMA): 13% a 17%
        mínimo                              66,62 UMA = $6.800.776

diferencia                                   4,69 UMA = $478.978  (7,6 % de más)
```

Ni siquiera es el mismo tramo de la escala. **Quien hubiera regulado siguiendo
este documento habría dado casi medio millón de más en ese caso.**

Por eso el orden de las tres etapas —base, escala, honorario— es lo primero que
dice el [02](02_FLUJO_JURIDICO.md), y por eso el campo `etapa` de cada
`Transformacion` es el que más importa.

---

## 1. Qué invoca cada proceso

El punto de entrada es único: `buildCalculationResult(state)` en
`lib/legal/calculate.ts`, que mira `PROCESS_REGISTRY` y delega.

| Proceso | Constructor |
|---|---|
| `conocimiento` · `ejecucion_sentencia` · `ejecutivo` · `sucesion` | `buildGeneral()` |
| `medida_cautelar` | `buildMedidaCautelar()` |
| `homologacion_desocupacion` | `buildHomologacion()` |
| `exhorto` | `buildExhorto()` |
| `incidente` | `buildIncidente()` |

**Cuatro de los ocho procesos comparten el mismo recorrido.** Lo que los
distingue no es el código sino lo que devuelve `resolveReglas()`, que es la
única función que conoce el tipo de proceso.

### `buildGeneral()` — conocimiento, ejecución de sentencia, ejecutivo, sucesión

```
resolveReglas(state)              traduce las respuestas a nueve booleanos
        │
        ▼
aplicarReduccionesBase()          arts. 40, 22          → baseFinal
        │
        ▼
calcularEscala(baseFinal, uma)    art. 21               → si devuelve null, buildEmpty()
        │
        ▼
aplicarReduccionesEscala()        arts. 35, 41, 25      → factor
        │
        ▼
aplicarReduccionesFinales()       arts. 34, 38, 49      → factorFinal
        │
        ├── calcularProcurador()          art. 20
        ├── calcularAuxiliares()          art. 21   ← sobre escala.baseEnUMA
        ├── calcularApoderado()           art. 20
        ├── calcularSegundaInstancia()    art. 30
        └── calcularPartidor()            art. 35   ← solo si tipo === 'sucesion'

esRegulacionProvisoria(state)     art. 12   → marca el resultado, no lo cambia
```

**Los cuatro devuelven segunda instancia.** Ningún otro proceso lo hace.

### `buildMedidaCautelar()`

```
calcularEscala(base, uma)         sin reducción de base previa
aplicarFactorCautelar()           art. 37 → 0,25 sin oposición · 0,50 con
calcularApoderado() · calcularProcurador() · calcularAuxiliares()
```

Sin `resolveReglas()`, sin reducciones de base, escala ni finales, sin segunda
instancia, sin partidor. Los auxiliares se calculan sobre `escala.baseEnUMA`, o
sea sobre la base **sin** el factor del art. 37.

### `buildHomologacion()`

```
aplicarReduccionesBase()          art. 40 → × 0,80 si es vivienda
calcularEscala(baseFinal, uma)
aplicarFactorHomologacion()       art. 40 → × 0,50 siempre
calcularApoderado() · calcularProcurador() · calcularAuxiliares()
```

Es el único proceso que usa `aplicarReduccionesBase()` **sin** pasar por
`resolveReglas()`: lee `state.homologacionVivienda` directo.

### `buildExhorto()`

No invoca nada. Cinco constantes del art. 50 multiplicadas por la UMA. Sin base,
sin escala, sin roles, sin auxiliares.

### `buildIncidente()`

No invoca nada. `base / uma`, por 0,02 y por 0,20. Sin escala del art. 21 y sin
ninguna reducción.

> Ese 2 %-20 % **no sale de la Ley 27.423 y no es una escala por tramos**: es un
> rango plano. El art. 47, que regulaba los incidentes entre el 8 % y el 25 %
> del principal, fue observado por el Decreto 1077/2017 y nunca rigió. El
> 2 %-20 % viene del art. 33 de la Ley 21.839 y se conserva como criterio
> declarado, para **todos** los incidentes.

---

## 2. Qué depende de cada pieza compartida

Acá está lo que este documento tiene y ningún otro: **si tocás esto, se mueve
aquello**.

### `calcularEscala()` — la pieza más compartida

**La usan seis de los ocho procesos.** Solo el exhorto y el incidente no.

Un cambio acá mueve **todos** los números de la aplicación. Incluye los siete
tramos, las seis constantes del piso y el cálculo de `auxMin`/`auxMax`.

**Cómo se verifica:** `calcularEscala.validation.ts`, que son 300 afirmaciones,
más `buildGeneral.validation.ts` y `buildEspeciales.validation.ts`.

### `resolveReglas()` — la única función que conoce el tipo de proceso

Traduce el estado a nueve booleanos. **Es donde se decide qué artículo aplica a
qué proceso**, y por lo tanto donde vive casi toda la interpretación jurídica.

Si una regla aparece o desaparece de un proceso, es acá. Ejemplo real: el
3/8/2026 se sacó de acá una tercera rama que aplicaba el -50 % del art. 25
también al criterio del art. 22 de la caducidad, acumulando dos quitas sobre el
mismo hecho.

**Cómo se verifica:** `reduccionesBase`, `reduccionesEscala` y
`reduccionesFinales.validation.ts`.

### `calcularApoderado()` y `calcularProcurador()` — art. 20

Los usan los seis procesos que calculan roles. Un cambio en el 1,4 o en el 0,4
mueve dos de los tres roles en todos ellos.

**Cómo se verifica:** `helpers.validation.ts`.

### `calcularAuxiliares()` — art. 21

Lo usan los mismos seis. Toma `escala.baseEnUMA`, o sea **la base ya reducida**
por la etapa 1 — y en la cautelar, la base sin el factor del art. 37.

**Cómo se verifica:** `helpers.validation.ts`.

### `UMA_VIGENTE` y `data/uma.json` — `lib/legal/uma.ts`

**Todo** depende de esto. No es un factor de conversión: cambiar la UMA puede
cambiar el tramo de la escala, y con él la alícuota.

`scripts/actualizar-uma.mjs` agrega una entrada cuando la planilla cambia.
**Nunca se reescribe una entrada existente:** un valor que ya se usó para
calcular es historia. Eso es lo que hace reproducible un cálculo viejo.

### `PROCESS_STEP_MAP` y `ALL_STEPS` — `lib/wizard/wizard-schema.ts`

Declaran qué se pregunta en cada proceso y en qué orden. **No tocan ningún
número**, pero deciden qué respuestas llegan al motor: quitar un paso de un
proceso es equivalente a dejar esa respuesta en su valor nulo.

**Cómo se verifica:** `retroceso.validation.ts`, que enumera los 168 recorridos
y cruza cada uno contra cada otro —28.224 pares— para comprobar que volver atrás
en la entrevista no deja pegada ninguna respuesta que el recorrido nuevo ya no
pregunta.

### `hooks/useWizard.ts` — el puente entre la entrevista y el motor

Traduce las respuestas al `WizardState`: `'antes'`/`'despues'` a `false`/`true`,
`'si'`/`'no'` a booleanos, y así.

**Es la dependencia más frágil del sistema**, porque `retroceso.validation.ts`
**replica ese mapeo en vez de importarlo**. El propio archivo lo dice: si el
hook cambia y la validación no, la validación deja de validar el flujo real y
sigue dando verde.

### `lib/wizard/reachability.ts`

`pasosVisibles()` y `podarInalcanzables()`. Es lo que impide que una respuesta de
un proceso sobreviva al cambiar a otro. El bug del 3/8 vivía acá.

### `lib/legal/render-legacy.ts`

Reproduce el HTML del asistente clásico, byte por byte, en un contenedor con
`display: none` que nadie ve. **Su contrato es no cambiar.** Por eso conserva
citas del régimen anterior —el art. 29 inc. e de la Ley 21.839 para la
cautelar— que en el motor nuevo ya se corrigieron al art. 37.

### `lib/legal/minimos-data.ts`

**No lo importa nadie del motor.** Solo lo lee
`components/interview/minimos-view.tsx`, que es la pantalla de consulta.

Esa ausencia de dependencia **es el punto 8 del
[plan](../PLAN_COBERTURA_LEY.md)**: los pisos que la ley fija no se comparan
nunca contra el resultado del cálculo.

---

## 3. Cómo verificar un cambio

Qué validación corre qué. Las once están en `lib/legal/__tests__/`, y
`npm run check` corre las once más el typecheck.

| Si tocaste… | Corré, además de las once |
|---|---|
| La escala, los tramos, los pisos | `calcularEscala.validation.ts` |
| Reducciones de base, escala o finales | las tres `reducciones*.validation.ts` |
| `resolveReglas()` | las tres `reducciones*` y `buildGeneral` |
| Apoderado, procurador, auxiliares | `helpers.validation.ts` |
| Segunda instancia o partidor | `segundaInstanciaPartidor.validation.ts` |
| Cautelar u homologación | `buildEspeciales.validation.ts` |
| Exhorto o incidente | `buildExhortoIncidente.validation.ts` |
| El art. 12 o la bandera de provisorios | `provisorios.validation.ts` |
| El schema, los pasos, `useWizard` o `reachability` | `retroceso.validation.ts` |

**Lo que las once no cubren, y conviene tener presente:** comparan números. Un
rótulo que promete un porcentaje puede mentir con las once en verde. Ya pasó dos
veces —los rótulos de los pasos el 5/8, las descripciones de la cautelar el
6/8—. Los `description` y `hint` de las tarjetas, los `motivo` de
`components/dashboard/format.ts` y los `explicacion.expanded` de cada paso hay
que leerlos contra `resolveReglas()` y contra la ley, porque nada más lo hace.

---

## Qué decía este documento y no era así

Corregido el 7/8/2026 leyendo el motor.

- **«Reducciones base… sobre el monto de escala».** En cinco lugares, y en el
  diagrama de orden general, que ponía la escala antes de las reducciones de
  base. Es al revés, y cambia el número: en el caso del ejemplo, 7,6 % y un
  tramo de la escala.
- **La segunda instancia como «apelación parcial 50 % / apelación total 100 %»**
  en los cuatro procesos que la tienen. El art. 30 dice del 30 % al 35 %, y
  hasta el 40 % solo si la sentencia se revocó **en todas sus partes en favor
  del apelante**.
- **Los auxiliares atribuidos al art. 43**, que es el de causas laborales. Son
  del art. 21.
- **Los dos anteriores estaban declarados como corregidos en la nota de
  verificación del 5/8, y no lo estaban.** La nota decía que se había arreglado
  el «50 % parcial / 100 % total» y las siete atribuciones al art. 43: sobrevivían
  cuatro del primero y una del segundo. **Una nota de verificación que no es
  cierta es peor que ninguna**, porque el que la lee deja de mirar.
- **Una escala de incidentes por tramos, inventada entera**: «2 % hasta 10.000
  UMA, 5 % de 10.001 a 50.000, 10 %, 15 %, 20 % superior a 500.000 UMA». No
  existe. El motor aplica un rango plano del 2 % al 20 %, sin tramos.
- **El partidor atribuido al «art. 51 inc. 8».** El art. 51 trata del contenido
  de la resolución regulatoria y no tiene incisos. El partidor es el art. 35,
  última parte.
- **«Ejecución de sentencia y ejecutivo NO aplican reducciones base».** Sí las
  aplican: `resolveReglas()` les activa `demandaRechazada` y `caducidadArt22`
  igual que al conocimiento. El cuadro comparativo repetía el error.
- **El conocimiento no mencionaba los honorarios provisorios** ni la reducción
  de base por caducidad del art. 22, que sí tiene.
- **Los modos anormales del art. 25 incluían la conciliación.** El artículo
  enumera allanamiento, desistimiento y transacción.
- **La cautelar y la homologación figuraban como «NO aplica reducciones de
  escala»** con su factor aparte. En el motor esos factores **son**
  transformaciones de etapa `escala`. El número da igual; la etapa es lo que
  este documento existe para decir.
- **El título prometía «qué módulos y componentes invoca cada proceso» y el
  documento no nombraba un solo módulo.** Lo que traía era el flujo de reglas
  por proceso, que ya está en el [01](01_PROCESOS.md), y una tabla comparativa,
  que ya está en el [06](06_MATRIZ_DE_PROCESOS.md). Ahora hace lo que el título
  dice.
