# Plan: un solo motor de anonimización

**Abierto.** Decidido por Javier el 16/9/2026. Nada de esto está hecho todavía.

---

## El problema, en una línea

Las mismas reglas están escritas dos veces: **867 líneas de JavaScript** en
`escribiente/js/motor/anonimizar.js` y **681 de Python** en
`Pipeline drafter/pipeline/sanitizar.py`. Un arreglo de nombres hay que llevarlo
a los dos lados, en dos lenguajes, y **los huecos son los mismos pero el código
no**: por eso `FUGAS-ANONIMIZADOR.md` anota cada fuga del uso real diciendo que
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
2. **Arreglar E-01, E-02 y E-03 en el motor JS**, que son los bugs abiertos que
   reportó `confronteitor`. Se arreglan una sola vez y en el que va a quedar, no
   dos veces en los dos.
3. **Un conector del anonimizador**, hermano de `conectores/mcp.mjs`, que exponga
   las cuatro funciones de la costura. Con su propio banco, y con la regla de los
   conectores: **cuando falta un dato no devuelve un resultado**, devuelve el
   motivo.
4. **`redactor` pasa a llamarlo**, detrás de una bandera, con el motor Python
   todavía disponible para comparar.
5. **Recién entonces** se decide qué se hace con `sanitizar.py`.

## La línea de verificación

- `npm run verificar-escribiente` —214 comprobaciones— tiene que seguir pasando
  en cada paso, y crecer con las regresiones de E-01 a E-03.
- El conector nuevo necesita su propio banco, **visto fallar a propósito**, como
  los otros doce controles de este repositorio.
- El paso 4 no se da sin el paso 1: sin saber en qué difieren, cambiar el motor
  abajo de `redactor` es mover un número sin mirarlo.

## Lo que queda por preguntar

- **Si el motor Python hace algo que el JS no.** Lo contesta el paso 1. Hasta
  entonces no se borra nada.
- **Dónde vive el conector.** Acá, por la regla 1 de `HERMANOS.md` —el dato se
  arregla en la casa del dueño—, pero lo consumen dos repositorios y conviene
  decirlo en `HERMANOS.md` antes de escribirlo.
