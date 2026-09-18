# Plan: un solo motor de anonimización

**Abierto.** Decidido por Javier el 16/9/2026. **Los pasos 1, 2 y 3 están
hechos** (16 y 17/9); el 4 y el 5 no, y el 4 es de `redactor`.

---

## El problema, en una línea

Las mismas reglas están escritas dos veces: **más de mil líneas de JavaScript**
en `escribiente/js/motor/anonimizar.js` y **681 de Python** en
el anonimizador del pipeline. Un arreglo de nombres hay que llevarlo
a los dos lados, en dos lenguajes, y **los huecos son los mismos pero el código
no**: por eso `FUGAS-ANONIMIZADOR.md` anota cada fuga aparecida al usarlo diciendo que
vale para los dos.

Dos implementaciones de una cuenta con consecuencia jurídica es el mismo modo de
falla que produjo el bug de la feria, y es el argumento por el que los plazos se
extrajeron a `plazos.js` con conectores. Acá está sin resolver.

## La decisión

**Un solo motor, el de JavaScript.** El de Python deja de ser una segunda
implementación. No se borra en este plan: deja de ser la fuente.

## Quién lo consume, corregido el 16/9

Hasta hoy este repositorio anotaba a `pipeline-drafter` como el otro consumidor.
**No es el principal.** Javier: el insumo principal del motor hoy es
**`redactor`**, y el pipeline quedó secundario.

Eso cambia el plan para mejor, y conviene decir por qué. Lo único que me
preocupaba de unificar era que **Escribiente le pregunta a un humano qué nombres
tapar y un proceso desatendido no puede preguntarle a nadie**. Leyendo
`redactor` esa objeción se cae: **ya tiene pantalla y ya tiene el freno**.

- `ui/app.js` son 1.027 líneas de pantalla, con `ui/servidor.py` detrás.
- `ui/ingreso.py` corre la primera pasada al ingresar por la bandeja, guarda esa
  pasada aparte en `primera/` **justamente para poder mostrar los candidatos**, y
  arma la tabla de nombres que el anonimizador no tapó con una etiqueta sugerida.
- Un caso no está liberado hasta que existe `liberado.json`. **Ése es el freno**,
  y es exactamente lo que Javier pide: verlo en pantalla y poder parar antes de
  liberar los escritos.

O sea que la arquitectura de dos capas no hay que inventarla: está construida de
los dos lados y lo único que difiere es qué motor corre abajo.

## Las dos capas, y por qué no se pueden juntar

Es el diseño de `anonimizar.js` y no una comodidad de interfaz.

1. **Lo que tiene forma inequívoca se reemplaza solo**: DNI, CUIT, CBU, teléfono,
   expediente, matrícula, correo, y los campos de formulario donde la etiqueta
   hace inequívoco lo que sigue (`Apellidos:`, `Domicilio:`). No hay falso
   positivo posible. **Sirve para cualquier consumidor, atendido o no.**
2. **Los nombres propios se proponen y nunca se aplican solos.** Ninguna regla
   distingue `Pérez, Juan Carlos` —la parte— de `Llambías, Jorge Joaquín`
   —doctrina— ni de `Buenos Aires, Astrea`, que es una editorial. Reemplazar por
   adivinanza corrompe el texto; no reemplazar filtra.

**La regla que sale de acá y hay que respetar:** un consumidor sin pantalla puede
usar la capa 1 y **no** puede aplicar la capa 2 sin alguien que tilde. Hoy los
dos consumidores tienen pantalla, así que no hay caso que la viole; el día que
aparezca uno, esto es lo que decide.

## La costura, que ya existe

`redactor` no usa el anonimizador entero: usa **cuatro cosas**, y están a la
vista en `ui/ingreso.py`. Ése es el contrato a reimplementar sobre el motor JS, y
es chico:

| Lo que usa | Para qué |
|---|---|
| `sanitizar_caso(base)` → `(_, rechazados)` | La primera pasada sobre la carpeta del caso |
| `partes_de_caratula(texto)` | Los nombres de la carátula, **en orden** |
| `candidatos_a_nombre(texto)` | Los que ninguna regla tapó |
| el cotejo de alias (`ingreso.py:135`) | Tolerante al espaciado |

**Y desde el 17/9 hay dos más que el conector tiene que exponer, porque son la
otra mitad de lo que hace confiable al motor:** `restosPegadosAEtiqueta(texto)`
—lo que quedó pegado a un reemplazo, que es la fuga E-01— y `crearNumerador()`
—las etiquetas numeradas de E-03—. Un consumidor que reemplaza y no mira los
restos tiene el mismo agujero que tenía la pantalla.

**El orden de `partes_de_caratula` es contrato y no un detalle.** En «X c/ Y» el
primero es el actor, y `redactor` los etiqueta distinto a propósito: con los dos
como `[PERSONA]` el modelo no sabe quién pide y quién resiste.

## Cómo se conectan

**Por subproceso Node, como ya se hace con los plazos.** `pipeline/plazos.py:68`
levanta `node conectores/mcp.mjs`, comprueba antes que `node` esté en el `PATH` y
**cae limpio con un motivo** cuando no está. Se repite ese patrón, que ya
funciona y ya se vio fallar; no se inventa uno nuevo.

**Y lo que no hay que hacer nunca**, que está en `HERMANOS.md` y se repite acá
porque es la propiedad que hace confiable a Escribiente: **no se conectan
haciéndole a Escribiente un `fetch` a un servidor local.** Eso obliga a agujerear
`connect-src 'none'`. Se conectan por archivos o por subproceso, que no es una
conexión de red y no toca la CSP.

## Lo que NO se unifica, a propósito

**Las listas de palabras.** No son iguales y no tienen que serlo: `redactor` usa
la suya para buscar **restos de un nombre ya confirmado**, y una palabra de más
ahí es un apellido que deja de buscarse. Queda **un núcleo compartido más una
extensión por consumidor**, declarada como tal —hoy están las dos sueltas y nadie
sabe cuál manda—.

## El orden de trabajo

Cada paso deja el árbol funcionando y ninguno borra nada del anonimizador viejo.

1. **Un banco de comparación, antes de tocar código.** Correr los dos motores
   sobre el mismo material y anotar dónde difieren. `HERMANOS.md` afirma que el
   JS «hace estrictamente más» que el Python; **eso hay que comprobarlo y no
   suponerlo**, porque de ahí sale si el cambio pierde algo.
2. **Arreglar E-01, E-02, E-03 y E-05 en el motor JS.** Se arreglan una sola vez
   y en el que va a quedar, no dos veces en los dos. **Hecho el 17/9**, los
   cuatro, con una fuga más que apareció al verificarlos —E-06, la constancia
   nombraba al pie a quien el cuerpo sí había tapado—. E-03 lo decidió Javier ese
   mismo día: numeración **por tanda**, sin tabla guardada. La crónica está en
   [`HISTORIA.md`](HISTORIA.md); lo que quedó abierto es el borde de la regla de
   E-05 —sin tratamiento que ancle, y con el dígito en la primera letra, no hay
   reemplazo, sólo aviso—.
3. **Un conector del anonimizador**, hermano de `conectores/mcp.mjs`, que exponga
   las cuatro funciones de la costura. Con su propio banco, y con la regla de los
   conectores: **cuando falta un dato no devuelve un resultado**, devuelve el
   motivo. **Hecho el 17/9**: `conectores/anonimizar.mjs`, colgado de los dos
   transportes que ya existían, con cinco herramientas y 81 comprobaciones en
   `npm run verificar-conectores`, vistas fallar. Queda anotarlo en
   `HERMANOS.md`.
4. **`redactor` pasa a llamarlo**, detrás de una bandera, con el motor Python
   todavía disponible para comparar. **Arrancado el 17/9**: `ui/anonimizador.py`
   elige con `REDACTOR_ANONIMIZADOR` y expone la misma costura con los dos, así
   que `ui/ingreso.py` no sabe cuál corrió; `python ui/anonimizador.py comparar`
   los corre a los dos sobre el mismo material. **No está terminado hasta que
   corra contra un caso de verdad.** El detalle, las tres diferencias que salieron
   y lo que quedó abierto —la etiqueta libre de la pantalla, que el conector
   rechaza— están en el `ESTADO.md` de aquel repo.
5. **Recién entonces** se decide qué se hace con `sanitizar.py`.

## Paso 1, hecho el 16/9: en qué difieren los dos motores

**Se corrieron los dos sobre el mismo material inventado** —40 casos que cubren
las trece familias de reglas del Python y las veintidós del JS, más los falsos
positivos conocidos— y después 13 sondas dirigidas. **28 de 40 dan exactamente lo
mismo.** Lo que sigue es lo que decide el resto del plan.

### La respuesta a la pregunta que abría el paso: el JS hace más, con una excepción

`HERMANOS.md` afirmaba que el motor JS «hace estrictamente más». **Es cierto en
el inventario y falso en un caso**, y ese caso hay que llevarlo al JS antes de
reemplazar nada.

**Lo que sólo hace el JS**: los seis campos de formulario —`Apellidos:`,
`Nombres:`, `Domicilio:`, `Fecha Nac:`, `Matrícula N:`, datos de trámite—, que es
por donde entran las fichas de identidad y el Python no tiene ninguno; el DNI con
etiqueta; la firma con cargo; y el domicilio en mayúsculas sin ancla
(`TUCUMAN 1300, 5TO PISO`), que el Python deja en claro.

**Lo único que el Python tapa de más es un falso positivo**, y el JS tiene razón
en no taparlo: un monto de siete cifras escrito con puntos y sin `$` —`la suma de … de
capital`— sale como `[DNI]` del lado
Python. El JS lo excluye porque su regla mira «suma de», «importe de», «monto
de»; la del Python sólo mira el `$` y los decimales.

### La excepción, y era un bug del JS: los nombres que ensució el OCR (cerrado el 17/9)

**`escribiente/README.md` decía que un nombre con dígitos adentro «no lo agarra
nada» y que «no tiene arreglo por patrón». Las dos mitades estaban mal.**

El JS **sí** lo agarra, y lo agarra **mal**: reemplaza el pedazo limpio y deja el
resto en claro. Tres de tres sondas:

| Entra | JS | Python |
|---|---|---|
| `Sr. Qu1nteros, Anibal` | `Sr. [PERSONA]1nteros, Anibal` | `Sr. [PERSONA], Anibal` |
| `Dr. Rarn1ro Villalba` | `Dr. [PERSONA]1ro Villalba` | `Dr. [PERSONA]` |
| `Dra. Va1eria 0campo` | `Dra. [PERSONA]1eria 0campo` | `Dra. [PERSONA] 0campo` |

**Eso es peor que no reemplazar**, y es exactamente el modo de falla de E-01: la
constancia cuenta el nombre como reemplazado y el archivo se lee como limpio con
medio apellido a la vista.

**Y el motivo por el que se creía imposible no se sostiene.** El argumento era
que un patrón que acepta dígitos adentro de una palabra empieza a comerse
números. Se probó con cinco sondas hechas para provocarlo —`fs. 120`,
`Cámara 3`, un tomo y folio de letrado, un DNI con puntos y `Juzgado 45`— y
**los dos motores dan
idéntico en las cinco**: ninguno se comió un número. La razón es que la regla
está anclada en el tratamiento (`Dr.`, `Sr.`) y frenada por la guarda de largo de
nombre. **Anclada, la tolerancia a dígitos es segura.**

Lo que sigue siendo cierto es la mitad angosta: **sin ancla no hay arreglo por
patrón.** `Qu1nteros, Anibal Ramon inicio la demanda` no lo agarra ninguno de los
dos, y ahí sí no hay nada que hacer.

### Los dos se contradicen sobre si la palabra que ancla sobrevive

**Decidido y aplicado en el JS el 17/9: la palabra que ancla es texto y no dato,
así que sobrevive.** Lo que sigue es cómo estaba cuando se detectó.

Se contradecían en direcciones opuestas, así que no era un criterio distinto:
era que ninguno tenía uno.

| Entra | JS, hasta el 17/9 | JS, desde el 17/9 | Python |
|---|---|---|---|
| `Autos 45678/2021` | `[EXPTE]` | `Autos [EXPTE]` | `Autos [EXPTE]` |
| `Expte. N 1234/2019` | `[EXPTE]` | `Expte. N [EXPTE]` | `Expte. N [EXPTE]` |
| `la causa 998877/2020` | `la [EXPTE]` | `la causa [EXPTE]` | `la causa [EXPTE]` |
| `Tel: ` + un fijo con interno | `Tel: [TEL]` | `Tel: [TEL]` | `[TEL]` |

**El argumento que la decidió no fue el de arriba sino uno de consistencia**:
las otras cuatro reglas ancladas del JS ya conservaban su ancla —la de teléfono
el `Tel:`, la de domicilio el `sito en`, la de tratamiento el `Dr.`, la de firma
el cargo— y sólo las de expediente no. No era una regla que faltaba: era una que
estaba escrita cuatro veces y desobedecida una.

«Expte. N» no identifica a nadie, y perderlo le saca estructura al texto justo
antes de dárselo a un modelo. **Del lado del Python queda el `Tel:`, y no se
toca**: es el motor que deja de ser la fuente.

### El banco no se podía versionar, y por eso E-04 se hizo primero

El material es inventado y aun así **`scripts/verificar-datos.sh` lo bloqueaba**:
un DNI, un CUIT, un CBU y dos matrículas escritos a propósito para probar las
reglas que los tapan. **Y bloqueó también este documento**, por citar tres de
esos casos adentro de la tabla que explica el bug. Un control que no deja
documentar el defecto que encontró es la forma más nítida del problema, así que
**E-04 se cerró el 17/9 antes de seguir**.

Desde entonces el banco vive versionado en `scripts/comparar-motores/` y se
declara en `.datos-ejemplo` con su motivo. Se corre así, desde la raíz:

```
node scripts/comparar-motores/correr-js.mjs scripts/comparar-motores/corpus.json > js.json
python scripts/comparar-motores/correr-py.py scripts/comparar-motores/corpus.json py.json
python scripts/comparar-motores/comparar.py
```

El lanzador de Python resuelve el repositorio del pipeline con
`git config rutas.pipeline` o la variable `PIPELINE_DIR`: la ruta de un
repositorio privado no se escribe adentro de uno público.

## La línea de verificación

- `npm run verificar-escribiente` —292 comprobaciones desde el 17/9, eran 214—
  tiene que seguir pasando en cada paso, y crecer con las regresiones de cada
  hueco que se cierre.
- El conector nuevo necesita su propio banco, **visto fallar a propósito**, como
  los otros doce controles de este repositorio.
- El paso 4 no se da sin el paso 1: sin saber en qué difieren, cambiar el motor
  abajo de `redactor` es mover un número sin mirarlo.

## Lo que queda por preguntar

- **Si el motor Python hace algo que el JS no.** Lo contestó el paso 1: sólo un
  falso positivo, y el JS tiene razón en no taparlo. No se borra nada igual.
- **Dónde vive el conector.** Contestado el 17/9: **acá**. Javier delegó la
  decisión y observó que el pipeline se volvió el lugar donde cae todo lo que es
  infraestructura entre máquinas. Lo que la decide es que **un conector no es
  plomería: es la cara pública de un motor**. La infraestructura entre máquinas
  no tiene repositorio dueño; este conector sí, y si vive lejos del motor, el
  motor vuelve a tener dos casas —que es la falla que este plan existe para
  terminar—. Además se prueba contra el mismo banco en la misma corrida de CI, y
  repite el patrón de plazos, ya visto funcionar y ya visto fallar. **Falta
  anotarlo en `HERMANOS.md`**, que es de allá.
