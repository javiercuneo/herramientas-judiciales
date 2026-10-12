# Pedido E-08: el perfil automático, para `confronteitor`

Recibido el 10/10/2026. **`confronteitor` lo conoce como E-07**; acá E-07 ya
era el de la carátula de sucesión, así que este es E-08. **Construido el mismo
día, salvo el cron**, que Javier sacó del pedido: en su lugar, cada sesión revisa
el buzón al empezar (la regla está en [`AGENTS.md`](../AGENTS.md)).

## Para qué

Un agente —Claude Code, opencode o Codex, sin clave de API— lee piezas y autos
seudonimizados y pide tramos por posición; un script local los resuelve contra
el texto real. **Nada de esto pasa por `fetch`**: el script levanta el conector
como subproceso.

## La decisión que cambia

**Para el perfil automático, deja de valer «los nombres se proponen y nunca se
aplican solos»** ([`PLAN_MOTOR_UNICO.md`](PLAN_MOTOR_UNICO.md), regla 2).
Decisión de Javier, 10/10/2026. **El perfil público no cambia**: la pantalla de
Escribiente y el conector que usa `redactor` no cargan el código nuevo, y
ninguna regla de `anonimizar.js` se tocó.

## Dónde está

| Qué | Dónde |
|---|---|
| El perfil: etiquetas, mapa, lo intocable, los controles | `escribiente/js/motor/automatico.js` |
| Leer el PDF, OCR, carpeta de la tanda, `anotar_fuga` | `conectores/automatico.mjs` |
| Las pruebas, con datos inventados y un PDF con foja escaneada | `npm run verificar-automatico`, en CI |
| Dónde cae cada página en el texto | `convertir()` de `markdown.js` devuelve `paginas` (el Markdown sale igual) |

## Cómo se usa

```
node conectores/automatico.mjs ingresar a.pdf b.pdf [--salida carpeta]
```

Devuelve un JSON por la salida estándar —**y nada más por ahí**: los avisos de
pdf.js y tesseract van a la salida de errores—:

- `archivos[]`: por archivo, `real`, `seudo`, `mapa` y `paginas`.
  - **`mapa`** es una lista de segmentos `{ seudo: [a, b], real: [c, d], etiqueta }`.
    Con `etiqueta: null` el pedazo es el mismo en los dos textos; con etiqueta,
    es lo que esa etiqueta tapa. `aReal(mapa, desde, hasta)` de
    `automatico.js` resuelve un tramo; un borde que cae adentro de una
    etiqueta se lleva el dato entero.
  - **`paginas`**: `{ numero, fuente, real, seudo }`, con `fuente` `texto`,
    `ocr` o `vacía`, y `confianza` cuando es OCR.
- **`tabla`**: etiqueta → valores reales. **Es la llave de la tanda**: no se le
  muestra al agente.
- `controles`: qué tapó cada control, con etiqueta y cantidad. Nunca el dato.

Con `--salida`, además deja en la carpeta `NN.seudo.md` (lo único que lee el
agente), `NN.real.md`, `NN.mapa.json` y `destapado.json`. Lee también `.md` y
`.txt`, para las piezas que ya pasaron por Escribiente.

```
node conectores/automatico.mjs anotar-fuga <seudo.md> <posicion> <clase> [--fin n]
```

**`anotar_fuga` también está en el MCP** (`conectores/mcp.mjs`): es la herramienta
del agente. **`ingresar` no está, a propósito**: lo que devuelve una herramienta
MCP lo lee el modelo, y devuelve el texto real y la tabla.

## Lo que hace, punto por punto

1. **Ingreso de PDF, con el mapa.** El texto real es el mismo Markdown que da la
   pantalla de Escribiente; el mapa se arma con la traza que el motor ya
   llevaba (`anonimizarConTramos`), y **si un pedazo copiado no coincide en los
   dos textos, falla en vez de entregar un mapa corrido**.
2. **OCR local.** Una página con menos de 100 caracteres —el umbral con el que
   la pantalla rechaza un escaneo— se dibuja a 300 ppp y se lee con
   tesseract.js. El español viene en `@tesseract.js-data/spa` y se carga de
   disco: **sin red**. Lo leído entra a la misma conversión que una página con
   texto.
3. **Perfil automático.** Partes de la carátula como `[ACTOR_n]` y
   `[DEMANDADO_n]`; los candidatos a nombre, todos, como `[PERSONA_n]`, **también
   los de fallos citados**; identificadores y domicilios con su número. La
   numeración es por tanda: la misma persona o el mismo DNI llevan la misma
   etiqueta en todos los archivos. «Pérez» suelto va con «Juan Pérez» si es el
   único que lo contiene.
4. **Identificadores en letras** (DNI, CUIT, CUIL, matrícula, detrás de su
   ancla). **No hay lector de números**: `formas.js` —la copia de confronte que
   ya está en `confronte/motor/`— pasa los dígitos a letras, y se comparan las
   dos escrituras en letras.
5. **Los tres controles**, que tapan y anotan: restos de carátula,
   inconsistencia (tapado en un archivo y a la vista en otro, también por
   apellido suelto), y candidatos sin regla (lo que el motor todavía ve como
   nombre o pegado a una etiqueta, hasta que no aparezca nada nuevo).
6. **`anotar_fuga`** escribe en el buzón la forma —`Xx XX` para un nombre; en un número, cada
   dígito es un 9— y el
   contexto con mayúsculas y números tapados —salvo las palabras que disparan
   una regla: «DNI», «Sr.», «la»—, con la misma forma de entrada que
   `redactor`, para que su `buzon.py` la lea. En lugar del nombre del escrito,
   que en el PJN es la carátula, va una huella del archivo.

## Lo que decidió la sesión, y Javier puede dar vuelta

- **Lo intocable** —normas, artículos, tribunales, fechas— **se destapa
  después**, no se protege antes: la protección del motor (`noTapar`) aborta
  cuando una regla se come un pedazo protegido. Un tramo que cae entero
  adentro de una norma o un tribunal vuelve a quedar a la vista. **La fecha de
  nacimiento no es intocable**: es un dato de la persona.
- **El tribunal es una lista cerrada de palabras** detrás de su ancla
  («Juzgado», «Sala», «Cámara»…): «Juzgado Civil n° 19 a cargo del Dr. X» corta
  en «a». Un tribunal escrito con una palabra que no está en la lista queda
  cortado ahí, y lo que sigue se mira como cualquier texto.
- **El tramo de una persona se recorta al nombre.** La regla pública del campo
  («Testigo:») tapa hasta el final del renglón, y en un acta eso se llevaba
  una fecha y una sala.

## Lo que queda abierto

- **El buzón se muda a `C:\IA\puente\`**, que es pedido aparte. Hasta entonces
  `anotar_fuga` escribe en el del pipeline; cuando exista el de `puente` y
  `git config rutas.puente` apunte ahí, pasa solo.
- **Falta correrlo sobre expedientes escaneados de la oficina**: el OCR se
  probó sobre una foja dibujada (93 % de confianza).
- **`formas.js` es la copia publicada.** Si confronteitor la cambia, hay que
  traerla con `npm run traer-confronte`.
- **La carátula de una sucesión** (E-07) tampoco sale acá con sus partes: es el
  mismo `partesDeCaratula`.
