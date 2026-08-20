# Plan: los honorarios del mediador dentro de Honorio

Cómo llevar lo que hoy calcula `calculadoras/honorarios-mediacion.html` al
resultado de Honorio.

Escrito el 7/8/2026 como análisis previo, cuando las normas todavía no estaban
cargadas. **Revisado entero el 8/8**, con los cuatro textos leídos y las
decisiones tomadas, **e implementado el mismo día.** El motor, el UHOM
versionado, la validación 16 y las dos pantallas están hechos; el detalle de
cómo quedó está en el
[`ESTADO.md` de Honorio](https://github.com/javiercuneo/honorio/blob/main/docs/ESTADO.md).

**El 10/8 se cerró el Paso 1** —el documento de dominio es
[`09_MEDIACION.md`](domain/09_MEDIACION.md)— **y se resolvió la numeración del
Anexo III**, que era lo único de fondo que quedaba abierto. **De este plan queda
una sola cosa, decidida y no urgente:** `calculadoras/honorarios-mediacion.html`
sigue viva por ahora, decisión de Javier del 10/8. Ver el
[Paso 5](#paso-5--qué-pasa-con-la-calculadora-vieja).

El año del Decreto 2536 —un dígito de una cita— **quedó resuelto el 18/8: es
2015**. Sigue anotado en [Lo que no está resuelto](#lo-que-no-está-resuelto) el
ajuste de los nombres de las filas de la planilla, que es lo que falta para que
el UHOM entre con procedencia.

**La implementación es en [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio).**
Acá va la decisión; allá el código y su `ESTADO.md`. Este plan vive de este lado
por lo mismo que el [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md): la materia
prima —la calculadora y los textos legales— está acá.

---

## Las normas, cargadas y leídas

En [`docs/mediacion/`](mediacion/), en PDF y en MD:

| Archivo | Qué es | Qué aporta |
|---|---|---|
| `ley mediacion..md` | Ley 26.589 | El art. 31 define la mediación familiar y sus incisos |
| `Decreto 1467-2011.md` | La reglamentación original | Es el decreto que crea los tres anexos |
| `decreto 2536-11.md` | Decreto 2536/2015 | **Sustituyó el Anexo III: es la escala vigente.** El nombre del archivo es por el decreto que modifica, no por su año |
| `Decreto 696-2025.md` | Decreto 696/2025 | Sustituyó el Anexo I entero. El régimen de honorarios pasó del art. 28 al **art. 31** |
| `39_tabla_...2026v2.pdf` | Tabla oficial del Ministerio | Valores jun–ago 2026, con la escala en pesos |

### Lo primero que había que despejar: qué está vigente

El Decreto 696/2025 es de 2025 y reemplaza toda la reglamentación, así que la
pregunta obvia era si se llevó puesta la escala. **No.** Su art. 1° sustituye
únicamente el **Anexo I**; al Anexo III no lo toca y, al contrario, lo cita seis
veces como derecho vigente —«el ítem H de la escala del artículo 2° del ANEXO
III del Decreto N° 1467 del 22 de septiembre de 2011 y sus modificatorios»—.

O sea: **cambiaron los artículos, no la escala.** Lo que antes era el art. 28
del Anexo I es hoy el art. 31, y los criterios de monto indeterminado que
estaban en el mismo artículo salieron a un art. 32 propio.

### La escala, verificada contra dos fuentes independientes

El 7/8 este plan decía que la escala de la calculadora estaba **sin verificar**
y que no se daba por buena. **Ya está verificada** contra el texto del Decreto
2536/2015 y contra la tabla oficial del Ministerio, que es texto limpio y sirvió
para leer lo que el OCR del decreto dejó ilegible:

| Ítem | Monto del asunto | Honorario |
|---|---|---|
| A | ≤ 30 UHOM | 3 UHOM |
| B | > A y ≤ 60 UHOM | 6 UHOM |
| C | > B y ≤ 150 UHOM | 9 UHOM |
| D | > C y ≤ 300 UHOM | 12 UHOM |
| E | > D y ≤ 600 UHOM | 16 UHOM |
| F | > E y ≤ 1000 UHOM | 20 UHOM |
| G | > 1000 UHOM | 2 % del monto, **hasta 120 UHOM** |
| H | Monto indeterminable | 20 UHOM |
| I | Sin valor pecuniario | 12 UHOM |
| — | Familiar: art. 31 incs. b) y c) de la Ley 26.589 | 9 UHOM |

**Los siete tramos que la calculadora implementa son correctos.** Lo que le
falta son los ítems H e I, el familiar, el honorario provisional de 2 UHOM y los
adicionales por audiencia.

**Un error de rótulo que sí hay que corregir:** la calculadora aplica el tope de
120 UHOM como si fuera general y así lo dice la nota. **Pertenece al ítem G.**
Da el mismo número siempre —A a F topean en 20 UHOM, muy por debajo—, así que
ninguna validación numérica lo va a cazar nunca. Es exactamente lo que advierte
[`05_DEPENDENCIAS.md`](domain/05_DEPENDENCIAS.md): un rótulo puede mentir con
todo en verde.

---

## Las decisiones, tomadas el 8/8

Las cinco son de Javier y están tomadas. Se anotan con su motivo porque el
motivo es lo que hay que poder discutir después.

### 1. Arquitectura: un bloque del resultado, al lado de auxiliares

Se descartó la Opción A —mediación como noveno `ProcesoTipo`—. Va como una
sección del dashboard, siguiendo el patrón de `AuxiliaresSection.tsx`.

El parentesco con auxiliares es real y más profundo que el trato parecido: **los
dos salen de la base y no del honorario del abogado.** `calcularAuxiliares()`
recibe `escala.baseEnUMA` y el mediador va a recibir la misma cifra.

> **Ojo con lo que la vecindad afirma.** `calcularAuxiliares()` recibe la base
> **ya reducida** —lo dice su docstring en `calculate.ts:526`— y con la decisión
> 2 el mediador también. Están bien juntos. Pero si algún día uno de los dos
> cambia de base, la cercanía visual va a seguir diciendo que son lo mismo.

### 2. La base es una sola: la del expediente

**El honorario del mediador se calcula sobre la misma base regulatoria que el
del abogado, con las reducciones de los arts. 22 y 40 de la Ley 27.423 ya
aplicadas.** Si la demanda se desestima y la base baja 30 %, baja para todos.

Está fundada abajo, en [La base única](#la-base-única-la-interpretación-y-su-jurisprudencia),
porque es una interpretación y le corresponde el tratamiento de una.

### 3. Sin adicionales por audiencia

El Anexo III prevé adicionales desde la cuarta audiencia —½ UHOM en los ítems A
y B, 1 UHOM en los demás— y desde la segunda en los supuestos familiares. **No
entran.** Son el único punto que obligaría a agregar una pregunta a la
entrevista, y el universo que cubren no lo justifica.

### 4. El resultado muestra lo que da la tabla, sin sumar ni restar

El art. 31 inc. g) del Decreto 696/2025 dice que el juez, al regular, descuenta
del básico el honorario provisional de 2 UHOM si fue percibido. **Honorio no lo
descuenta.** Muestra el honorario básico de la escala y nada más.

El motivo es el mismo que el de la decisión 5: descontarlo exige preguntar si se
percibió, y eso es una pregunta que existe solo por el mediador.

### 5. Ninguna regla nueva por la existencia del mediador

Quedan afuera, por esa sola razón:

- **Mediación desistida antes de la primera audiencia** → básico a la mitad, con
  piso en el provisional (art. 31 inc. h).
- **Reconvención** → se considera reclamo autónomo y el resultado se reduce a la
  mitad (art. 32 inc. k).

**El motivo es de sistema y no de esfuerzo.** El art. 1°, segundo párrafo, de la
Ley 27.423 —[`00_LEY_27423.md:38`](domain/00_LEY_27423.md:38)— aplica el arancel
supletoriamente a **todos** los auxiliares de la Justicia, «excepto lo que con
relación a ello dispongan las leyes especiales». Abrir la puerta a las reglas
propias del mediador obliga a abrirla para cada auxiliar con régimen especial, y
lo que sale de ahí no es una app más grande: es un expediente con tantas bases
como profesionales, cada una con su método de valuación, cada una apelable por
separado y además de la apelación del honorario.

---

## La base única: la interpretación y su jurisprudencia

Esto es una interpretación, y desde el 8/8 la regla del repositorio es que una
interpretación **se funda en jurisprudencia o no se afirma** (ver
[`AGENTS.md`](../AGENTS.md)).

**Todo lo transcripto acá se leyó de la sentencia**, en los PDF que están en el
repositorio. Lo que no se pudo leer está marcado como tal.

### El fallo que decide el punto, y no por analogía

El apelante era un **perito ingeniero** que planteó exactamente lo que estamos
discutiendo: que la reducción del 30 % del art. 22 no le alcanzaba **por ser
auxiliar de la Justicia y no letrado**. La Sala K se lo rechazó.

> «El artículo 22 de la ley 27.423 establece que, cuando la demanda fuere
> íntegramente desestimada, se tendrá como valor del pleito su importe […]
> disminuido en un treinta por ciento (30%). Por otro lado, a los efectos
> regulatorios debe ponderarse que **el juicio es una unidad jurídica, de modo
> tal que tiene un solo monto pecuniario y no pueden existir dos bases
> regulatorias diferentes, según sea letrado o auxiliar de la justicia** (conf.
> plenario del 2/10/01, “Murguía, Elena Josefina c/ Green, Ernesto Bernardo s/
> cumplimiento de contrato”). Cabe destacar —además— que **la ley arancelaria no
> contempla excepción ni distinción alguna que altere la reducción del 30 %
> indicada en dicha norma de acuerdo al profesional de que se trate.**»
>
> CNCiv., Sala K, expte. 2896/2021, «MARCHAND, HUGO ALBERTO Y OTRO c/ FREYRE
> PENABAD, NELLY MARIA FLORINDA s/ PRESCRIPCION ADQUISITIVA», 22/06/2026.
> Juezas Maggio y Bermejo.

No hay que estirarlo hasta el mediador: **ya está dicho para la clase entera**
—«auxiliar de la justicia»— y con la aclaración de que la ley no distingue por
profesional.

### El mismo criterio, aplicado a un mediador

La misma Sala reduce la base un 30 % por el art. 22 **y regula a la mediadora
sobre esa base**, en la misma resolución.

> «cabe tomar la suma reclamada al deducirse la demanda, con más los réditos […]
> y, al monto que arroje tal cálculo, reducirlo en un 30 % (conf. arts. 22 y 24
> de la Ley 27.423). […] Igual criterio corresponde adoptar en relación a la
> regulación de fecha 19 de marzo de 2024 —también recurrida—, puesto que, a los
> efectos regulatorios, debe ponderarse que **un juicio es una unidad jurídica,
> de modo tal que tiene un solo monto pecuniario y no pueden existir dos bases
> regulatorias diferentes** (conf. esta Sala, exptes. N° 63.590/18 y
> N° 70.529/19, entre otros). […] se fijan los honorarios de la mediadora señora
> S. P. en la suma de $1.160.400»
>
> CNCiv., Sala K, expte. 8451/2022, «OBRA SOCIAL DE LA INDUSTRIA DEL FOSFORO
> ENCENDIDO Y AFINES c/ VARELA, CARLOS ALBERTO s/ DAÑOS Y PERJUICIOS -
> RESP. PROF. ABOGADOS», 09/05/2025. Jueces Bermejo y Maggio.

### La doctrina y su origen

No nace en las salas: viene de un plenario de la propia Cámara, transcripto acá
por la Sala M.

> «la mayoría en forma impersonal señaló la necesidad de contar con una única
> base regulatoria para la determinación de los honorarios en los casos en que se
> llega a una conciliación o transacción **para todos los profesionales a pesar
> que algunos no hayan participado del mismo**: “Es que a los efectos
> regulatorios un juicio es una unidad jurídica, lo que equivale a decir que
> tiene, en definitiva, un solo monto pecuniario y por ende no puede haber dos
> bases regulatorias diferentes según sea que el letrado haya o no intervenido en
> el acto jurisdiccional”»
>
> CNCiv. en pleno, «MURGUIA, ELENA JOSEFINA c/ GREEN, ERNESTO BERNARDO s/
> CUMPLIMIENTO DE CONTRATO», 02/10/2001, citado por CNCiv., Sala M,
> expte. 55198/2020, «RODRIGUEZ, ARIEL LUCIANO c/ URBIETA, CRISTIAN ARIEL Y OTRO
> s/ DAÑOS Y PERJUICIOS», 16/09/2024.

Y la Corte la respalda por dos vías, las dos citadas dentro de los fallos leídos:
**CSJN, Fallos 329:1191** —invocado por la Sala A— y **CSJN, «De Souza, Daniel O.
c/ Empresa de Obras Sanitarias de la Nación», 27/10/1992** —invocado por la
Sala M—.

### El tercer fallo, aplicando la doctrina entre profesionales distintos

> «a los efectos regulatorios un juicio es una unidad jurídica y procesal, lo que
> equivale a decir que tiene, en definitiva, un solo monto, sin que
> consiguientemente pueda haber dos bases regulatorias diferentes según que el
> letrado haya o no intervenido en el acto transaccional (conf. CSJN
> Fallos 329:1191)»
>
> CNCiv., Sala A, expte. 74879/2018, «ZOLZINSKY, ESTHER c/ POCHINKI, EDUARDO
> JAVIER Y OTRO s/ NULIDAD DE ACTO JURIDICO», 08/07/2025. Jueces Picasso y Calvo
> Costa.

### Lo que dejó la primera aplicación de la regla

La regla de fundar en jurisprudencia se estrenó sobre estos mismos fallos y
sirvió, aunque no como se esperaba.

En la primera pasada, MARCHAND todavía no estaba cargado y la frase apareció en
otro expediente de la misma Sala K, así que quedó anotada como **pendiente de
verificar**: verosímil no alcanza. Al cargarse la sentencia se confirmó que
MARCHAND sí la contiene —la Sala K usa su propia fórmula en varios
expedientes— y además resultó ser **el mejor de los cuatro**, porque discute la
extensión de la reducción a un auxiliar de la Justicia y no a otro letrado.

**Lo que hay que quedarse de esto:** marcar una cita como no verificada no
costó nada y no rompió nada, y el criterio se sostenía igual sin ella. Es
exactamente lo que la regla busca, y es barato.

### Cómo se guardan

Están en `honorio/lib/legal/jurisprudencia.ts` como `MEDIACION_BASE_UNICA` —al
lado de `INCIDENTE_ESCALA`, que es el mismo patrón— y la sección del dashboard
los muestra, como hace `IncidenteResult.tsx`. **MARCHAND va primero**: es el que
resuelve la extensión de la reducción a un auxiliar de la Justicia.

**Los PDF de las sentencias están en `docs/modelos/jurisprudencia/` y NO se
versionan.** Se ignoran desde el 8/8 junto con el resto del material de
`docs/modelos/`: son públicos, pero traen nombres de partes y de profesionales
que no le aportan nada al repositorio.

**Eso tiene un costo y hay que pagarlo, no taparlo.** Un `Fallo` sin la sentencia
al lado vuelve a ser una cita que hay que creer, que es exactamente lo que la
regla nueva quiere evitar. **La forma de pagarlo es el campo `url`**, que
`jurisprudencia.ts` ya tiene y que los tres fallos de `INCIDENTE_ESCALA` ya usan
—dos al CIJ y uno al visor de la PJN—. Los cuatro de acá se leyeron del PDF pero
**todavía no tienen URL pública asociada**: conseguirla es parte del Paso 4, y
hasta entonces la verificación vive en la máquina de Javier y en ningún lado más.

### En qué se aparta del decreto, exactamente

La declaración no sirve si no dice esto. El Decreto 696/2025 define una base
propia para el mediador y reglas de valuación propias:

| Supuesto | El decreto | Honorio, con la base única |
|---|---|---|
| Demanda desestimada | Monto reclamado, sin reducir (art. 31 inc. d, último supuesto) | Base con el −30 % del art. 22 |
| Desalojo | Un año de alquiler (art. 32 inc. b) | Base del expediente, con el −20 % del art. 40 si es vivienda |
| Alimentos | Cuota × **un** año (art. 32 inc. j) | Cuota × **dos** años (art. 39; `types.ts:83`) |
| Reconvención | Reclamo autónomo, resultado a la mitad (art. 32 inc. k) | No se modela |

**La regla no favorece sistemáticamente a nadie, y conviene decirlo.** En demanda
desestimada perjudica al mediador. En alimentos lo beneficia, porque Honorio toma
el doble de cuotas que el decreto. En desalojo también, porque la base del
expediente supera al año de alquiler. Una interpretación que perdiera siempre
para el mismo lado sería sospechosa de estar elegida por el resultado; ésta no lo
está.

---

## Lo que queda afuera por construcción, y no hubo que decidirlo

`honorio/lib/legal/types.ts` declara `baseValor: number`, y **`ObjetoBase` no
tiene ninguna opción sin monto**: `desalojo`, `sumas_dinero`, `inmuebles`,
`derechos_crediticios`, `titulos_acciones`, `establecimientos`, `uso_habitacion`,
`escrituracion`, `familia_alimentos`, `familia_liquidacion`,
`posesorias_interdictos`, `incidencia_colectiva`. Honorio siempre tiene una
cifra.

De ahí sale que tres ítems de la escala son **inalcanzables desde la entrevista**,
sin que haya que resolver nada sobre ellos:

- **Ítem H** (monto indeterminable, 20 UHOM) — no hay recorrido que llegue.
- **Ítem I** (sin valor pecuniario, 12 UHOM) — ídem.
- **Mediación familiar** (9 UHOM) — el art. 31 incs. b) y c) de la Ley 26.589 son
  cuidado personal, comunicación y plan de parentalidad: cuestiones no
  pecuniarias, que Honorio no modela porque necesita una base.

Los tres van al bloque de «qué no hace» de `documentacion.html` **con ese
motivo**, que es el verdadero. La calculadora vieja tampoco los hace, así que no
se pierde nada al retirarla.

Dos reglas más del decreto que no se implementan y conviene declarar, porque son
lo primero que pregunta quien lee el resultado:

- **Notoria diferencia** (art. 31 inc. e): si el monto se determina judicialmente
  y varía más del 20 % respecto del honorario ya abonado, el condenado en costas
  integra la diferencia.
- **Honorario del profesional asistente** (art. 34): no puede ser inferior al
  50 % del honorario básico del mediador.

---

## El módulo, que es más chico de lo que este plan suponía

Con las cinco decisiones, todo el cálculo es **una función pura de siete ramas**:

```
baseFinal (la misma que ya reciben la escala y los auxiliares)
  ÷ UHOM vigente          →  el monto del asunto, en UHOM
  →  tramo A–G            →  N UHOM  (o 2 % con tope de 120 en G)
  →  × UHOM               →  pesos
```

**Cero preguntas nuevas en la entrevista.** No hay rama de recorrido, no hay
sub-paso, no hay campo nuevo en `WizardState`. Es el mismo criterio que gobierna
el [`PLAN_CALCULO_DIRECTO.md`](PLAN_CALCULO_DIRECTO.md): cada respuesta por
defecto es una afirmación jurídica que nadie hizo, y acá directamente no hace
falta ninguna.

Va en `honorio/lib/legal/mediacion.ts`, función pura sin React ni DOM, como todo
`lib/legal/`. **Con su suite de validación desde el primer commit**, en
`lib/legal/__tests__/`: sería la número 16. Lo mínimo son los dos bordes de cada
uno de los siete tramos, el tope del ítem G y el caso donde la reducción del
art. 22 hace caer la base a otro tramo —que es el único lugar donde la decisión 2
cambia un número—.

Ese último caso, para tenerlo escrito con números:

```
UHOM $12.450 (junio 2026) · base $8.000.000

sin reducir      643 UHOM  →  ítem F  →  20 UHOM = $249.000
con −30 % (22)   450 UHOM  →  ítem E  →  16 UHOM = $199.200
```

---

## El UHOM: no se comporta como la UMA

El Paso 2 del plan original decía «espejo exacto de lo que ya funciona para la
UMA, no inventar nada, copiar la forma». **Eso sigue valiendo para la forma y no
para los umbrales**, porque las dos unidades se mueven distinto.

**El UHOM cambia todos los meses.** La tabla oficial lo muestra: junio 2026
$12.450, julio $12.720, y el $12.960 que hoy trae la planilla es agosto. La
fórmula está declarada en la propia tabla —**valor UR-SINEP × 12, redondeado a
la decena próxima superior**— y cierra en los dos meses que se pudieron
comprobar: 1036,67 × 12 = 12.440,04 → 12.450; 1059,48 × 12 = 12.713,76 → 12.720.

Tres consecuencias:

- **Un valor versionado se desactualiza cada mes**, no dos veces al año. Si pasa
  un mes sin push, el número miente en silencio. Es el mismo problema que la UMA
  tiene una vez por semestre, doce veces por año.
- **El `SALTO_MAXIMO` de 60 % de `actualizar-uma.mjs` no sirve acá.** Está
  calibrado para la UMA; los saltos del UHOM son de ~2 %, así que ese umbral no
  cazaría ni un error de tipeo de un orden de magnitud hacia abajo. Necesita uno
  propio.
- **A cambio, hay una validación que la UMA no tiene:** el UHOM es derivable. El
  script puede recalcularlo desde la UR-SINEP y comparar contra lo que dice la
  planilla. Dos fuentes que tienen que coincidir valen más que un umbral.

Y algo que juega a favor: el art. 31 inc. g) manda usar los valores vigentes **al
momento de regular**, no los de la fecha de la mediación. La app siempre usa el
UHOM de hoy; el histórico sirve para auditar, no para calcular.

**Sigue en pie lo demás del Paso 2:** extender `scripts/actualizar-uma.mjs` en
vez de escribir uno nuevo —ya parsea la misma planilla por clave, ya detecta el
HTML de «planilla despublicada», ya está escrito para abortar antes que
inventar—, y que `ValorUMA` y `ValorUHOM` sean **tipos distintos aunque tengan la
misma forma**. Confundirlos es un factor de ocho, y con tipos separados el error
es un rojo de `npm run check` en vez de un número plausible.

---

## Lo que no está resuelto

**La numeración del Anexo III no cierra entre las tres fuentes.** La escala está
en el «artículo 2°» según el Decreto 696/2025 y según el propio texto del Anexo
III; pero el art. 28 inc. b) del Decreto 2536 la ubica en los «artículos 4°
y 5°», y la tabla oficial de 2026 dice cinco veces «artículo 4° del presente
Anexo». **Los números del honorario son idénticos en las tres**, así que no
afecta ningún cálculo: afecta la cita. Hace falta el texto consolidado del Anexo
III vigente antes de escribir un número de artículo en una tarjeta.

### Resuelto el 10/8: la escala está en el artículo 2°, y las otras dos citas son referencias muertas

Lo destrabó una observación de Javier sobre los modelos del juzgado, que citan el
**«Anexo I del Decreto 2536»**: esa cita, que parecía una cuarta variante, es la
que explica las otras tres.

**El art. 5° del Decreto 2536 dice:** «Sustitúyese el Anexo III del Decreto
N° 1467 del 22 de septiembre de 2011 **por el que como ANEXO I forma parte
integrante del presente**». O sea que **el Anexo I del 2536 es el Anexo III
vigente**: son el mismo texto nombrado por su origen o por su destino, y las dos
citas son exactas.

Y ese texto, leído entero, se numera solo: su **art. 1°** fija el honorario
provisional en 2 UHOM y su **art. 2°** trae la escala de los diez ítems. Coincide
con las seis citas del Decreto 696/2025, que dicen «el ítem H de la escala del
artículo 2° del ANEXO III». **Dos fuentes independientes, el mismo número.**

**Las otras dos numeraciones son referencias que el propio 2536 dejó muertas.**
El art. 28 inc. b) que él mismo sustituye manda al «artículo 3°» y a los
«artículos 4° y 5° del Anexo III» —la numeración anterior—, mientras que en el
mismo acto reemplaza el Anexo III por uno renumerado. La tabla oficial de 2026
arrastra ese «artículo 4°». **No es una discrepancia entre fuentes sobre qué dice
la norma: es una remisión interna que quedó vieja adentro del decreto que la
produjo.**

Lo que se sigue: **la escala se cita como el art. 2° del Anexo III del Decreto
1467/2011, sustituido por el Anexo I del Decreto 2536.** Va al documento de
dominio del [Paso 1](#paso-1--el-documento-de-dominio-de-mediación) y recién ahí
a una tarjeta.

### Resuelto el 18/8: el 2536 es de 2015

Era la última cosa chica, y quedó abierta porque el PDF que teníamos trae el
encabezado cortado por el OCR. **La fuente que lo decide ya estaba en
`docs/mediacion/`, en otro archivo**: el texto consolidado del Decreto 1467/2011
trae, en la cabeza de su Anexo III, la nota *«(Anexo sustituido por art. 5° del
Decreto N° 2536/2015 B.O. 30/11/2015)»*. Coincide con el «2536/15» de los
modelos del juzgado y con el rango del identificador de infoleg.

La cronología cierra sola y explica por qué el dato importa poco y la cita
importa: el 1467/2011 reglamentó la ley **con una tabla de montos fijos**, y la
escala en UHOM llegó cuatro años más tarde.

**De dónde salió el 2011:** del nombre del archivo, `decreto 2536-11.md`, que se
llama así por el decreto que modifica. Viajó desde acá a dos pantallas de
Honorio, a los comentarios de `mediacion.ts`, a una validación y al documento de
dominio. **El nombre de un archivo de `docs/` no es una fuente**, y esta es la
segunda vez que un dato de contexto entra sin fuente y sale caro.

Ningún número se movió: el año nunca entró en una cuenta.

**La procedencia del UHOM: Javier cargó las filas el 10/8, y hay que ajustar los
nombres antes de que el cron corra.** La planilla quedó con cinco filas —
`UMA_FUENTE`, `UHOM_FUENTE`, `Acordada`, `UMA_URL`, `UHOM_URL`— y **tres no son
las que `actualizar-uma.mjs` lee**:

| Fila de la planilla | Qué tiene | Qué hace el script |
|---|---|---|
| `UMA_FUENTE` = 102.076 | El **valor** de la UMA | No lee esa clave. Busca `UMA` y no la encuentra |
| `UHOM_FUENTE` = 12.960 | El **valor** del UHOM | Lee esa clave esperando **el texto de la norma**, y busca el valor en `UHOM` |
| `UMA_URL` | La URL de la Res. SGA | No lee esa clave: la URL de la UMA la busca en `URL` |
| `Acordada` | La norma de la UMA | Correcto |
| `UHOM_URL` | La URL de la tabla oficial | Correcto |

**El caso peor no es que falle: es que `UHOM_FUENTE` entre como procedencia.** El
script tomaría la cadena `12.960` y la escribiría como la norma del UHOM, que es
exactamente el error que el arreglo de «la procedencia solo se completa, nunca se
borra» **no** cubre —ese protege contra el vacío, no contra un valor plausible en
el campo equivocado—.

**Dos salidas, y conviene la segunda.** Renombrar las filas de la planilla a
`UMA`, `UHOM`, `URL`; o **aceptar los dos nombres en el script**, porque
`UMA_URL`/`UHOM_URL` es más parejo que `URL`/`UHOM_URL` y la planilla es la
superficie que Javier edita todos los días. En cualquier caso **el valor va en
`UMA` y `UHOM`**: una fila que se llama `_FUENTE` y trae un número es la clase de
rótulo que miente sin que nada falle.

**Si el honorario del mediador tiene un piso que Honorio debería controlar.** El
art. 31 inc. a) dice que los honorarios pueden pactarse pero no por debajo de los
de la reglamentación. Es el mismo debate del punto 8 del
[`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md), que se resolvió por no aplicar
mínimos automáticamente para no decidir por el juez. El criterio ya está fijado y
conviene seguirlo.

**La puerta de entrada propia: resuelta sin construir nada.** El plan del 7/8
recomendaba una pantalla de consulta directa además de la sección del dashboard.
Terminaron siendo dos, y ninguna hubo que inventarla: **el cálculo directo de
Honorio**, que ya era la pantalla «entra un monto, sale la escala» y ahora
también trae al mediador, y `calculadoras/honorarios-mediacion.html`, que sigue
publicada.

Eso cambia el Paso 5 y conviene tenerlo en cuenta cuando se lo decida: el caso
que la calculadora vieja servía en exclusiva —el honorario del mediador sin
juicio detrás— **ya está cubierto adentro de Honorio**, con la norma citada y el
UHOM versionado.

**La ampliación a otras jurisdicciones.** Todo esto es el régimen nacional. Si
alguna provincia tiene el suyo, es otro trabajo y conviene decir que no está.

---

## El orden de trabajo

### Paso 0 — Ya hecho

El bug de la lectura de la planilla por posición se cerró el 7/8 en los cuatro
archivos. `honorarios-mediacion.html` busca por clave, respeta comillas y detecta
el HTML de la planilla despublicada. Ver [`ESTADO.md`](ESTADO.md).

### Paso 1 — El documento de dominio de mediación — **HECHO el 10/8**

[`docs/domain/09_MEDIACION.md`](domain/09_MEDIACION.md). Se implementó el módulo
antes que su documento, al revés de lo previsto: durante dos días la escala del
mediador fue **la única regla del motor sin documento de dominio detrás**, y eso
quedó dicho en el propio documento.

Es el noveno y **el único que no documenta la Ley 27.423**. Las tres cosas del
control mecánico que este plan anticipaba se cumplieron: `NORMAS_ESPERADAS` pidió
las entradas nuevas —quedaron cinco, contando la variante `decreto 2536/15` de
los modelos y el `decreto 202/2015` del COPREC—, y los artículos del decreto
pasan sin avisos porque van escritos como `art. 31 inc. g) del Decreto 696/2025`.

**Una que el plan no anticipó y conviene saber:** el nombre de un fallo entre
backticks **hace fallar el control**. `` `Murguía` `` se lee como identificador
de código y ninguno lleva tilde. Los fallos van en comillas, no en backticks.

**Tres cosas de `verificar-docs` que hay que saber antes de escribirlo**, porque
ese documento sí entra al control y el plan que estás leyendo no:

1. El script barre **solo `docs/domain/`**. Las citas de este plan no las controla
   nadie.
2. `NORMAS_ESPERADAS` necesita tres entradas nuevas con su motivo:
   **`decreto 2536/2015`**, **`decreto 696/2025`** y el `decreto 1467/2011` escrito
   con año de cuatro cifras —hoy la lista tiene `decreto 1467/11`, y la clave es
   literal—.
3. **Los artículos del decreto van a disparar avisos** del control 2, que los
   compara contra el texto de la Ley 27.423. El script los saltea si encuentra
   `DECRETO` o `LEY N` en los 24 caracteres siguientes, así que la forma segura es
   `art. 31 inc. d) del Decreto 696/2025`, sin comas intermedias. Con
   `art. 31, inciso d), del Decreto…` queda al borde del límite.

### Paso 2 — El UHOM versionado — **HECHO el 8/8**

`honorio/data/uhom.json` y `honorio/lib/legal/uhom.ts`, con la extensión de
`actualizar-uma.mjs` y el umbral propio. Detalle arriba.

**Un bug que apareció corriendo el script de verdad, y por eso conviene
correrlo.** La primera versión completaba la procedencia con `previo.fuente =
fuente` a secas y en la primera pasada real **le borró al UHOM la norma cargada a
mano**, porque la planilla no la trae y `fuente` llegaba en `null`. Ahora la
procedencia solo se completa, nunca se borra: que la planilla no diga nada no es
que diga que no hay norma. El mismo arreglo protege a la UMA.

### Paso 3 — El módulo y su validación — **HECHO el 8/8**

`honorio/lib/legal/mediacion.ts` más la suite 16. Detalle arriba.

**Salió como estaba previsto**, con una decisión de tipos que conviene no
deshacer: `calcularMediacion()` recibe el `ValorUHOM` entero y no el número.
`calcularDirecto()` recibe la UMA suelta; acá no, a propósito. Con dos `number`
nada impediría pasarle la UMA —$102.076 donde van $12.960, un factor de ocho sin
ningún error visible— y el campo `unidad` del tipo existe para eso y nada más.

### Paso 4 — La presentación — **HECHO el 8/8**

Quedó en **dos** pantallas y no en una: `MediacionSection.tsx` en el dashboard
—con la jurisprudencia de la base única— y una fila en el cálculo directo, sin
la jurisprudencia, porque ahí no se aplica ninguna reducción y la discusión no se
plantea. El bloque de «qué no hace» está en `documentacion.html`, con los seis
motivos.

La diferencia entre las dos se ve con la misma cifra, y conviene tenerla a mano
porque parece un error y no lo es: base $8.000.000 da **$259.200** en el cálculo
directo —617,28 UHOM, ítem F— y **$207.360** en el dashboard si la demanda se
desestimó, porque ahí el art. 22 baja la base a $5.600.000 y la hace caer al
ítem E. Es exactamente lo que produce la decisión de la base única.

**Lo que sigue vale como criterio para las secciones que vengan:**

Sección del dashboard sobre el patrón de `AuxiliaresSection.tsx`, con la norma
citada al lado del número. Y el bloque de «qué no hace» en `documentacion.html`:
los ítems H e I, la mediación familiar, los adicionales por audiencia, el
descuento del provisional, el desistimiento y la reconvención. **Los seis con su
motivo**, porque «no lo hace» sin el porqué se lee como una carencia y son
decisiones.

#### Qué prosa va en el dashboard y qué prosa va en la guía

La primera versión metió todo en el dashboard: tres desplegables con la escala
entera, todo lo que el número no incluye y la discusión del número de artículo.
**Era demasiado**, y no por gusto: el informe imprimible con fundamentos salía de
diez hojas.

La regla que quedó, y que sirve para las secciones que vengan:

> **En el dashboard va lo que solo se puede decir al lado de este número.** Todo
> lo que describe la herramienta —la escala completa, el catálogo de lo que no
> hace, las discusiones de cita— es documentación y va a
> `documentacion.html`, donde se lee una vez.

Aplicada a mediación, en el dashboard quedaron dos cosas:

- **Que la base es una interpretación, con sus fallos.** Es lo único que **mueve
  la cifra que está en pantalla**, y la regla de [`AGENTS.md`](../AGENTS.md) es
  que una interpretación se funda o no se afirma. Sacarla dejaría a la app
  aplicando un criterio sin decir que es criterio.
- **Por qué el 2 % dejó de ser 2 %**, y solo cuando el tope efectivamente mordió.
  Si no mordió, decir que existe es describir la escala.

**Un dato para no sobrecorregir:** los desplegables son `<details>` y un
`<details>` cerrado **no imprime su contenido**. `imprimir.tsx` los abre o los
cierra según el interruptor de «con fundamentos», así que el informe desnudo
nunca creció. El problema del largo era real solo en el informe fundado —y el
argumento de fondo, que el dashboard no es el lugar para explicar la
herramienta, vale igual.

### Paso 5 — Qué pasa con la calculadora vieja — **PENDIENTE, y ahora se puede decidir**

El plan decía «conviene decidirlo recién cuando la sección del dashboard esté
andando». Ya está andando, así que la decisión está madura. **Y el argumento que
sostenía dejarla se debilitó**: el caso que la calculadora suelta servía en
exclusiva —el honorario del mediador sin juicio detrás— lo cubre hoy el cálculo
directo de Honorio, con la norma citada y el UHOM versionado.

Lo que queda a favor de dejarla: calcula bien los siete tramos, no hay urgencia,
y es una URL que alguien puede tener guardada. Lo que queda en contra: duplica
con menos —un UHOM que se carga a mano contra uno versionado— y **dice mal el
tope**, que es del ítem G y no de la escala.

**Decidido el 10/8: se deja viva por ahora.** Decisión de Javier. Lo que conviene
tener escrito para el día que se retome: el que la use se lleva un número
correcto, así que no es el caso de `calculadoras/honorarios.html` —que se dio de
baja por dar un número mal—. Lo que sí queda pendiente y es barato es
**corregirle el rótulo del tope**, que hoy lo presenta como de la escala.



La misma decisión que se tomó con `calculadoras/honorarios.html` el 7/8: sacarla
de la landing y del README, **dejar el archivo publicado** para que los enlaces
viejos no se rompan, y que apunte a Honorio.

**Con una diferencia importante.** Aquella se dio de baja porque calculaba mal.
Ésta calcula bien los siete tramos, así que no hay urgencia, y además cubre el
caso que Honorio no va a cubrir: el honorario del mediador sin ningún juicio
detrás. Conviene decidirlo recién cuando la sección del dashboard esté andando.
