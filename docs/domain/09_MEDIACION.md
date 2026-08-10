# 09 - El honorario del mediador

El único módulo del motor que no sale de la Ley 27.423. La mediación prejudicial
obligatoria tiene su propia ley —la 26.589— y su propia unidad, el UHOM, y de ahí
sale una escala escalonada que no se parece a la del art. 21: no es progresiva,
no tiene alícuotas y no depende del rol de nadie.

**Para quién está escrito:** para un abogado que va a leer el código. El término
jurídico manda; donde el motor usa una clave (`ESCALA_MEDIACION`,
`ResultadoMediacion`), va identificada como tal y nunca como si fuera el nombre
de la cosa.

> **Estado de verificación.** Escrito el 10/8/2026, después de que el módulo se
> implementara el 8/8. Cada afirmación sobre la norma está contrastada contra los
> textos de [`docs/mediacion/`](../mediacion/) y cada afirmación sobre el motor
> contra `honorio/lib/legal/mediacion.ts` leído, que es la regla de fuentes de
> [`AGENTS.md`](../../AGENTS.md).
>
> **Se escribió después que el código, al revés de lo previsto.** Conviene tenerlo
> dicho: durante dos días la escala del mediador fue la única regla del motor sin
> documento de dominio detrás.

---

## Qué calcula, en una frase

**Entra la base regulatoria del expediente en pesos y sale un honorario en
UHOM.** Nada más: no hay roles, no hay etapas, no hay reducciones y no hay
transformaciones. Por eso `calcularMediacion()` **no devuelve `Transformacion[]`**
como el resto del motor —no aplica ninguna—.

Es una función pura de siete ramas sobre una cifra que Honorio ya tiene, y esa es
la consecuencia práctica más importante de todo este documento:

> **El mediador no agrega ninguna pregunta a la entrevista.** Los 168 recorridos
> y los 28.224 cruces del barrido de [`01_PROCESOS.md`](01_PROCESOS.md) no se
> movieron al implementarlo.

---

## De dónde sale la escala

De tres normas encadenadas, y el encadenamiento importa porque es lo que explica
por qué las citas de la escala no coinciden entre sí:

| Norma | Qué hizo |
|---|---|
| **Ley 26.589** | Instituye la mediación prejudicial obligatoria. Su art. 31 define la mediación familiar y sus incisos |
| **Decreto 1467/2011** | La reglamenta. Crea los tres anexos; el **Anexo III** es el de los honorarios |
| **Decreto 2536/2011** | **Sustituye el Anexo III entero.** Es la escala vigente |
| **Decreto 696/2025** | Sustituye el **Anexo I** entero. El régimen de honorarios pasó del art. 28 al art. 31 |

### Lo primero que hubo que despejar: el 696/2025 no se llevó la escala

Es de 2025 y reemplaza toda la reglamentación, así que la pregunta obvia era si
la escala seguía en pie. **Sigue.** Su art. 1° sustituye únicamente el Anexo I; al
Anexo III no lo toca y, al contrario, **lo cita seis veces como derecho vigente**
—«el ítem H de la escala del artículo 2° del ANEXO III del Decreto N° 1467 del 22
de septiembre de 2011 y sus modificatorios»—.

O sea: **cambiaron los artículos, no la escala.** Lo que antes era el art. 28 del
Anexo I es hoy el art. 31, y los criterios de monto indeterminado que estaban en
el mismo artículo salieron a un art. 32 propio.

### Por qué la escala se cita de dos maneras y las dos son correctas

Los modelos de resolución del juzgado citan el **«Anexo I del Decreto 2536»**;
este proyecto venía citando el **«Anexo III del Decreto 1467/2011»**. Parecían
dos cosas distintas y son la misma:

> **Art. 5° del Decreto 2536:** «Sustitúyese el Anexo III del Decreto N° 1467 del
> 22 de septiembre de 2011 **por el que como ANEXO I forma parte integrante del
> presente**».

**El Anexo I del 2536 es el Anexo III vigente.** Una cita lo nombra por su
destino y la otra por su origen. La forma completa, que es la que conviene usar,
las junta: *el Anexo III del Decreto 1467/2011, sustituido por el Anexo I del
Decreto 2536*.

### Y por qué el número de artículo no coincide entre las fuentes

Tres fuentes dan tres números para el artículo donde está la escala:

| Fuente | Dice |
|---|---|
| El texto sustituido, leído entero | **art. 2°** |
| Decreto 696/2025, seis veces | **art. 2°** |
| El art. 28 inc. b) del propio Decreto 2536 | «artículos 4° y 5°» |
| La tabla oficial del Ministerio, 2026 | «artículo 4°» |

**No es una discrepancia sobre qué dice la norma: son remisiones que quedaron
viejas.** El texto sustituido se numera solo —su art. 1° fija el honorario
provisional en 2 UHOM y su art. 2° trae la escala— y el 696/2025 lo confirma
desde afuera. Las otras dos apuntan a la numeración anterior a la sustitución, y
la del art. 28 inc. b) está **adentro del mismo decreto que sustituyó el anexo**:
el 2536 renumeró el Anexo III y dejó sin actualizar la remisión del artículo que
él mismo estaba reescribiendo. La tabla oficial arrastra ese número.

**Los honorarios son idénticos en las tres fuentes**, así que nada de esto afectó
nunca un cálculo. Afectaba la cita, y por eso el motor estuvo dos días citando el
Anexo sin número de artículo.

> **Lo único que sigue sin resolverse es un dígito: el año del 2536.** Este
> proyecto lo verificó como **2011**; los modelos del juzgado escriben
> **«2536/15»** y el enlace de infoleg que usan tiene un identificador del rango
> de 2015. No cambia ningún número ni el razonamiento de arriba. Se resuelve
> mirando el encabezado del decreto en infoleg, que el PDF disponible trae
> cortado por el OCR.

---

## La escala

Diez ítems. `ESCALA_MEDIACION` implementa siete; los otros tres son
inalcanzables y están más abajo.

| Ítem | Monto del asunto | Honorario | ¿En el motor? |
|---|---|---|---|
| A | hasta 30 UHOM | 3 UHOM | Sí |
| B | > 30 y hasta 60 UHOM | 6 UHOM | Sí |
| C | > 60 y hasta 150 UHOM | 9 UHOM | Sí |
| D | > 150 y hasta 300 UHOM | 12 UHOM | Sí |
| E | > 300 y hasta 600 UHOM | 16 UHOM | Sí |
| F | > 600 y hasta 1000 UHOM | 20 UHOM | Sí |
| G | > 1000 UHOM | **2 % del monto**, hasta 120 UHOM | Sí |
| H | Monto indeterminable | 20 UHOM | No: inalcanzable |
| I | Sin valor pecuniario | 12 UHOM | No: inalcanzable |
| — | Familiar, art. 31 incs. b) y c) de la Ley 26.589 | 9 UHOM | No: inalcanzable |

**Verificada contra dos fuentes independientes**: el texto del decreto y la tabla
oficial del Ministerio con los valores de junio a agosto de 2026, que es texto
limpio y sirvió para leer lo que el OCR del decreto dejó ilegible.

### No es la escala del art. 21, y las diferencias no son de detalle

Conviene tenerlas juntas porque toda la intuición que uno trae del art. 21 falla
acá:

- **No es progresiva.** Un asunto de 200 UHOM no paga «lo del tramo anterior más
  el excedente»: paga 12 UHOM, punto. No hay factor de correlación y no hay
  excedente. El «por qué» de [`02_FLUJO_JURIDICO.md`](02_FLUJO_JURIDICO.md) sobre
  la escalera no aplica.
- **No es una banda.** Cada ítem da **un número**, no un mínimo y un máximo. Es
  el único resultado del motor que no es un `Rango`, y por eso no participa de la
  discusión sobre quién elige el punto adentro.
- **No depende del rol.** No hay patrocinante, apoderado ni procurador: el
  art. 20 de la Ley 27.423 no juega.
- **No se divide en etapas.** El art. 29 no juega.

### El tope de 120 UHOM es del ítem G, no de la escala

**Es un error de rótulo que ninguna validación numérica podría cazar**, y por eso
está escrito acá y en el código: los ítems A a F topean en 20 UHOM, muy por
debajo de 120, así que aplicar el tope como si fuera general **daría siempre el
mismo número**. La cuenta no cambiaría y el rótulo estaría mintiendo.
`calculadoras/honorarios-mediacion.html` lo dice mal.

En el motor, `TOPE_ITEM_G_UHOM` se aplica solo en la rama donde
`item.honorarioUHOM` es `null`, que es únicamente la G.

### La base no se redondea para elegir el tramo

30,4 UHOM cae en el ítem B, no en el A. Es la misma regla que gobierna la escala
del art. 21 y que está en [`03_REGLAS_DE_NEGOCIO.md`](03_REGLAS_DE_NEGOCIO.md):
`calculadoras/honorarios.html` redondeaba cerca de cada corte **y calculaba con
el redondeo**, y fue una de las tres razones por las que se dio de baja.

---

## La base: una sola, la del expediente

**La base del mediador es la misma cifra que reciben la escala del art. 21 y los
auxiliares**, con las reducciones de los arts. 22 y 40 de la Ley 27.423 ya
aplicadas.

**Es una interpretación, y se aparta del decreto a propósito.** El decreto define
una base propia para el mediador que en cuatro supuestos da distinto —demanda
desestimada, desalojo, alimentos y reconvención—. La tabla completa está en
[`PLAN_MEDIACION.md`](../PLAN_MEDIACION.md).

**El motivo de apartarse** es el art. 1°, segundo párrafo, de la Ley 27.423: el
arancel se aplica supletoriamente a todos los auxiliares de la Justicia. La
alternativa produce **tantas bases regulatorias como profesionales intervengan en
el mismo expediente**.

### La jurisprudencia que la sostiene

[`AGENTS.md`](../../AGENTS.md) dice que una interpretación se funda en un fallo o
no se afirma. Ésta se funda, y **hay un fallo que resuelve el planteo exacto, no
por analogía**:

- **CNCiv., Sala K, expte. 2896/2021, 22/6/2026.** El apelante era un perito que
  sostenía que la reducción del 30 % del art. 22 no lo alcanzaba **por ser
  auxiliar de la Justicia y no letrado**. La Sala lo rechazó: «la ley arancelaria
  no contempla excepción ni distinción alguna» según el profesional.
- **CNCiv., Sala K, expte. 8451/2022, 9/5/2025.** La misma Sala aplicó el
  criterio **a una mediadora**.
- **Plenario «Murguía», CNCiv. en pleno, 2/10/2001.** De ahí viene la doctrina: «el juicio
  es una unidad jurídica […] no pueden existir dos bases regulatorias diferentes,
  según sea letrado o auxiliar de la justicia».

Los tres viven en `honorio/lib/legal/jurisprudencia.ts` como un `Criterio` con
sus `Fallo[]`, y la sección del dashboard los muestra.

### La consecuencia que parece un error y no lo es

Con la misma cifra ingresada, las dos pantallas de Honorio dan distinto:

```
base ingresada $8.000.000, UHOM de agosto de 2026 = $12.960

CÁLCULO DIRECTO   sin reducciones   617,28 UHOM → ítem F → $259.200
DASHBOARD         demanda desestimada: el art. 22 baja la base a $5.600.000
                                    432,10 UHOM → ítem E → $207.360
```

**Es exactamente lo que produce la decisión de la base única.** Conviene tenerlo
a mano: la diferencia no está en el módulo de mediación, que en los dos casos
hizo lo mismo, sino en qué base le llegó.

---

## Lo que el módulo no hace

Dos grupos, y la distinción entre ellos importa.

### Lo que queda afuera por construcción

**No hubo que decidirlo: no hay recorrido que llegue.** `WizardState.baseValor`
es un `number` y `ObjetoBase` no tiene ninguna opción sin monto, así que Honorio
siempre tiene una cifra y nunca cae en los ítems **H** (monto indeterminable),
**I** (sin valor pecuniario) ni en el **familiar** del art. 31 incs. b) y c) de
la Ley 26.589.

Si algún día la entrevista admite un asunto sin monto, esos tres ítems dejan de
ser inalcanzables y hay que implementarlos.

### Lo que se decidió no hacer

Cuatro reglas del decreto, y **el motivo es uno solo y es de sistema**:

| Regla | Dónde está |
|---|---|
| Adicionales por audiencia | Anexo III |
| Descuento del honorario provisional de 2 UHOM | art. 31 inc. g) del Decreto 696/2025 |
| Mediación desistida antes de la primera audiencia | art. 31 inc. h) del Decreto 696/2025 |
| Reconvención | art. 32 inc. k) del Decreto 696/2025 |

**El motivo:** el art. 1°, segundo párrafo, de la Ley 27.423 aplica el arancel
supletoriamente a todos los auxiliares de la Justicia. Abrir la puerta a las
reglas propias del mediador obliga a abrirla para cada auxiliar con régimen
especial, y eso es otro producto.

**Y una que se decidió por remisión a un criterio ya fijado:** el art. 31 inc. a)
dice que los honorarios pueden pactarse pero no por debajo de los de la
reglamentación. **El motor no verifica ese piso**, con el mismo criterio con que
no aplica automáticamente los mínimos de los auxiliares: aplicar un piso es una
decisión del juez. Ver
[`08_DEUDA_TECNICA_FUNCIONAL.md`](08_DEUDA_TECNICA_FUNCIONAL.md).

### Y una que no es del régimen nacional

Todo esto es la mediación prejudicial obligatoria **nacional**. Si una provincia
tiene su propio régimen, no está.

---

## El UHOM

**No se comporta como la UMA**, y la diferencia obligó a un tratamiento propio.

| | UMA | UHOM |
|---|---|---|
| Se mueve | Ocasionalmente | **Todos los meses** |
| Cómo se determina | 3 % de la remuneración básica del juez federal de primera instancia (art. 19 de la Ley 27.423) | **UR-SINEP × 12**, redondeado a la decena próxima superior |
| Umbral de salto del script | 60 % | **15 %** |
| Control de forma | Ninguno posible | **Termina siempre en cero** |

Los tres valores comprobados: junio 2026 $12.450, julio $12.720, agosto $12.960.

**Ser derivable le da una validación cruzada que la UMA no tiene.** Como el
redondeo es a la decena superior, el valor siempre termina en cero, y eso alcanza
para cazar un separador de miles mal leído —que es el error que da un número
plausible—.

### Por qué `calcularMediacion()` recibe el objeto y no el número

`calcularDirecto()` recibe la UMA suelta como `number`. Acá no, a propósito:

> Con dos `number` nada impediría pasarle la UMA al módulo del mediador. Son
> **$102.076 donde van $12.960**, un factor de ocho sin ningún error visible.

El campo `unidad` del tipo `ValorUHOM` existe para eso y para nada más.

---

## Dónde vive

| Pieza | Archivo |
|---|---|
| La escala y el cálculo | `honorio/lib/legal/mediacion.ts` |
| El valor y su procedencia | `honorio/lib/legal/uhom.ts`, `honorio/data/uhom.json` |
| La actualización mensual | `honorio/scripts/actualizar-uma.mjs` |
| La validación, la número 16 | `honorio/lib/legal/__tests__/mediacion.validation.ts` |
| La sección del dashboard | `honorio/components/dashboard/MediacionSection.tsx` |
| La calculadora suelta, anterior | `calculadoras/honorarios-mediacion.html` |

**Está en las dos pantallas que tienen una base**, y en las dos pegado a los
auxiliares por el mismo motivo: los dos salen de la base y no del honorario del
abogado. En el cálculo directo va **sin la jurisprudencia de la base única**,
porque ahí no se aplica ninguna reducción y la discusión no se plantea.

---

## Qué decía este documento y no era así

Nada todavía: es la primera versión. Se deja la sección porque los otros ocho la
tienen y porque su ausencia se lee como que nunca se revisó.

Lo que sí conviene registrar es **un error que se cometió mientras se escribía**,
porque es de la clase que este repositorio ya pagó caro: al leer los modelos de
resolución del juzgado se dio por sentado que citaban mal el anexo —«Anexo I»
donde este proyecto decía «Anexo III»— y se anotó como error ajeno. **Los modelos
tenían razón**, y fue esa observación la que cerró la numeración del artículo,
que llevaba dos días anotada como sin resolver. Que una fuente no sea oráculo no
la hace sospechosa por defecto.
