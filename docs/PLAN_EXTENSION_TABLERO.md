# Plan: el tablero adentro de Lex100, como extensión de Chrome

Borrador del 26/10/2026. Nada de esto está construido. Se apoya en lo observado
en `C:\IA\LEX100\memoria.md` y en cómo funciona hoy el tablero
(`calculadoras/tablero.html`, ver «El tablero de herramientas» en `ESTADO.md`).

---

## 1. La decisión de fondo: el panel lateral de Chrome, no un panel en la página

Hay dos formas de «meter» el tablero en Lex100:

| | Panel dibujado dentro de la página (script de contenido + iframe) | **Panel lateral de Chrome** (`chrome.sidePanel`) |
|---|---|---|
| Choque con el visor de PDF | Compite con el panel de firma (derecha) y las miniaturas (izquierda); hay que tapar algo o empujar el layout de una app React que no es nuestra | **Ninguno**: Chrome achica la página entera y el visor se reacomoda solo, con sus dos paneles intactos |
| Lex100 (Seam, RichFaces) | Inyectar CSS en un sistema frágil que cambia sin aviso | No se toca la página |
| Sobrevive a navegar | Muere y renace con cada `.seam` y cada cambio de despacho | **Queda abierto** al pasar de Lex100 a sgj-docs y de despacho en despacho: lo cargado no se pierde |
| Anda en cualquier sitio | Sólo donde hay script de contenido | En cualquier pestaña (también en el Drive, el mail, la consulta pública) |
| Ancho | El que le robemos a la página | El usuario lo arrastra; se cierra con el ícono o el atajo |

**Recomendación: panel lateral.** Es la pieza nativa de Chrome para exactamente
esto, y deja el visor de PDF como está —que fue lo que Javier pidió con el
revisor el 8/10: no tapar el visor—. Lo único que queda dentro de la página son
scripts de contenido *sin interfaz* (leer la selección, leer el PDF del
despacho), y a lo sumo un botón chico.

---

## 2. Qué va adentro del panel: el tablero publicado, embebido tal cual

El panel es una página de la extensión (`panel.html`) con **un iframe a
`https://javiercuneo.com.ar/calculadoras/tablero.html`**. Comprobado hoy:
ni GitHub Pages ni `honorio.ar` mandan `X-Frame-Options` ni CSP, así que se
pueden embeber.

Por qué embeber el sitio y no copiar las calculadoras dentro de la extensión:

- **Es la misma regla que fundó el tablero**: el código que calcula es el
  archivo publicado, sin una línea modificada. Una copia dentro de la extensión
  sería la segunda implementación de una cuenta con consecuencia jurídica —el
  modo de falla del bug de la feria—, y además se desfasaría.
- **Los feriados y las Acordadas se actualizan solos.** Con copia, cada asueto
  nuevo exigiría publicar una versión y esperar la revisión de la Store (días).
- **La Web Store prohíbe ejecutar código remoto en la extensión, pero un iframe
  a una página web no es eso**: la página corre en su propio origen, como si
  estuviera en una pestaña. Es el patrón aceptado.
- El tablero ya tiene diseño de celular (barra con la abierta y menú
  desplegable), que es lo que se ve en un panel de 360–450 px.

Costos a tener presentes:

- **Sin internet no hay tablero.** El panel lo detecta y lo dice («no se pudo
  abrir javiercuneo.com.ar»), con enlace a abrirlo en pestaña.
- **Los días inhábiles propios no se ven en el panel.** Chrome particiona el
  `localStorage` de un iframe por el sitio de arriba: los que el usuario cargó
  en la pestaña suelta no son los del panel, y viceversa. El aviso de días
  propios ya existe en las pantallas; hay que comprobar que se lea bien acá, y
  decidir si la extensión los guarda en `chrome.storage` y se los pasa.
- **GoatCounter** anota «(en el tablero)»; habría que distinguir «(en la
  extensión)» para saber si se usa.

---

## 3. El click derecho

`chrome.contextMenus` con `contexts: ['selection']`. Chrome reemplaza `%s` en el
título por lo seleccionado, así que el menú dice lo que va a hacer:

- **Calcular plazo desde «14/10/2026»**
- **Tasa de justicia sobre «$ 12.345.678,90»**
- **Convertir a UMA** (un monto) / **Pasar UMA a pesos** (una cantidad de UMA)
- **Días entre estas fechas** (si la selección trae dos)
- **Abrir el tablero** (siempre)

Al tocarlo: el service worker abre el panel (`chrome.sidePanel.open` vale porque
el clic del menú es gesto del usuario), interpreta la selección y le manda al
tablero la herramienta y los datos.

**Interpretar no es calcular.** Un módulo puro, `interpretar.mjs`, saca de un
texto suelto lo que puede: fecha numérica, fecha en letras («catorce de octubre
de dos mil veintiséis»), plazo («cinco (5) días», «diez días hábiles»), monto en
pesos con puntos y coma. Devuelve `{ fecha, plazo, monto }` o el motivo por el
que no entendió. Con pruebas en Node, como el resto.

**El enlace completa y no calcula**, que es la decisión del 14/9 y se respeta:
el panel abre vencimientos con la fecha y el plazo puestos, y la pantalla sigue
preguntando lo que un texto seleccionado no sabe (cédula o automática, notas del
Libro de Asistencia, horario). `calcula-solo.js` hace el resto cuando el
formulario está completo, igual que hoy.

**Lo que hay que cambiar en el sitio:** hoy «el tablero no pasa el enlace a la
embebida» (su fragmento es la pestaña). Tiene que aprender
`tablero.html#vencimientos&fecha=2026-10-14&plazo=5` —el primer nombre elige la
herramienta, el resto va a la suelta tal cual, con los nombres de contrato que
ya están en `ESTADO.md`— y escuchar `hashchange`, para que el panel abierto
reciba un caso nuevo sin recargar. Entra con sus filas en
`pruebas-tablero.html`. Tasa y prorrateo ya tienen su propio enlace en el `#`.

---

## 4. Lo que hay que mirar antes de escribir el plan definitivo (fase 0)

No son pantallas para mirar: son preguntas que contesta una extensión de prueba
de 30 líneas en una tarde, en la PC propia y después en la del juzgado.

1. **¿El menú de la extensión aparece al seleccionar texto dentro del visor de
   PDF de Chrome** (el iframe `blob:` de `/despacho/<id>/view`), y llega
   `selectionText`? Es la pregunta que más decide. Si no aparece, el plan B es
   el de §5.1: leer el PDF nosotros y ofrecer las fechas en el panel.
2. ¿Y dentro del editor TinyMCE de sgj-docs y en las tablas de Lex100?
3. **Con el panel de firma abierto y el panel lateral abierto**, en el monitor
   del juzgado, ¿el PDF queda legible? ¿Qué ancho mínimo aguanta?
4. ¿La PC del juzgado deja **instalar desde la Web Store**? Puede estar bloqueado
   por política aunque el modo de desarrollador ande (`chrome://policy`, buscar
   `ExtensionInstallBlocklist` / `Allowlist`).
5. El tablero en el panel: ¿las teclas 1-6, la medición de alto y el menú de
   celular andan con el iframe un nivel más adentro?

**Contestadas el 27/10/2026** con la extensión de prueba
(`C:\IA\LEX100\prueba-extension\`, detalle en su `LEEME.md`):

1. **Sí.** El menú aparece con texto seleccionado en el PDF del despacho y llega
   `selectionText`; el clic abre el panel. **El plan A va**; §5.1 deja de ser
   plan B y queda como mejora.
2. **Sí**, en el editor y en Lex100. En el editor la fecha llega sin cero
   (`14/1/2026`).
3. **Sí** en la notebook (pantalla 1280×800, escala 1,65): con el panel de
   360 px la página queda en 813 px y se lee con el detalle abierto, que se
   superpone al PDF y no lo achica.
4. **Pendiente**: se mira en la PC del juzgado.
5. Teclas: **sí**. El tablero a 360 px: **algo se ve mal**, falta saber qué (no
   desborda a lo ancho).

---

## 5. Lo que podría agregarse, más allá del tablero

Ordenado de más a menos valor según lo que entiendo del trabajo diario. Las
marcadas con ★ reusan piezas que ya existen y andan.

### 5.1 ★ El panel lee el despacho abierto

El revisor ya sabe leer el PDF del `blob:`, ordenar su texto, reconocer un
proveído y separar la carátula. Con eso, al abrir un despacho el panel puede
mostrar arriba **«En este despacho»**: el expediente, la carátula, las fechas y
los plazos que aparecen («dentro del plazo de cinco días»), cada uno con un
botón que abre la calculadora con los datos puestos. Es el click derecho sin
tener que seleccionar, y anda aunque el menú no aparezca en el visor.

### 5.2 ★ Controles del proveído (la idea del §7 de la memoria)

Sobre el mismo texto: que la fecha del encabezado no sea de otro año, que la
carátula del proveído coincida con la del expediente, links `scw` que no
abren, datos del juzgado anterior. Y el **revisor de ortografía**, mudado a esta
extensión como un módulo que se prende y se apaga: para un colega es una sola
instalación.

### 5.3 Agenda de vencimientos local

Un botón «Agendar» al lado de cada vencimiento calculado: guarda expediente,
qué vence y cuándo en `chrome.storage.local` (no sale de la máquina), lista en
el panel ordenada por fecha, y **aviso de Chrome el día anterior** con
`chrome.alarms` + notificaciones. Abre la pregunta de qué pasa con un asueto
que se dicta después de agendar: se recalcula al abrir, con el motor, y se
avisa si cambió.

### 5.4 ★ Insertar en el editor

Desde el panel, con el editor de sgj-docs abierto: **«Insertar en el
proveído»** el resultado redactado («…el plazo vence el 4 de noviembre de 2026»),
la fecha de hoy en forma de encabezado, la regulación que sale de Honorio, el
link y el QR de `scw` (Escribiente ya los arma). Se escribe en TinyMCE con lo
que ya se sabe (`undoManager.add`, `setDirty`), sin guardar: guarda la persona.

### 5.5 Lex100 más cómodo

Todo con scripts de contenido sin dibujar nada encima del sistema:

- **Buscador de modelos**: leer las 39 páginas del grupo una vez, guardar el
  índice y buscar desde el panel.
- **Aviso de conversación por vencer** de Seam, y reabrir sola la pantalla
  donde estaba el usuario.
- **Atajos de teclado** para lo que se hace siempre igual.

### 5.6 Chiquitos que se notan

- **El ícono dice si hoy cuenta**: un punto verde o rojo en el badge, y en el
  tooltip la UMA vigente. Es el encabezado del tablero, sin abrir nada.
- **Anonimizar la selección** antes de copiarla (el motor de Escribiente), para
  pegar en otro lado sin datos personales.
- **Buscar el artículo** seleccionado («art. 310 CPCCN») en el buscador del
  Código que ya tiene vencimientos (`data/plazos-cpccn.json`).
- **Mandar el despacho a Confronte** contra otro documento.

### Una que dejaría afuera por ahora

**Tasas de interés** (activa BNA, etc.) para liquidaciones. Es la que más se
pediría, pero exige una serie de tasas mantenida al día con fuente cierta, y un
número equivocado ahí es plata. Merece su propia herramienta en el sitio
primero, con sus pruebas; después la extensión la embebe como a las demás.

---

## 6. Publicar en la Chrome Web Store

- **Cuenta de desarrollador** de Google: pago único de USD 5. Conviene un mail
  propio del proyecto y no el personal.
- **Empezar como «no listada»**: se instala con el enlace, sin aparecer en
  búsquedas. La prueban unos pocos primero, y después se abre a todos.
- **Permisos mínimos**, que es lo que más acelera la revisión: `sidePanel`,
  `contextMenus`, `storage`; y scripts de contenido sólo en
  `lex100https.pjn.gov.ar` y `sgj-docs.pjn.gov.ar`. **Sin `<all_urls>` ni
  `tabs`**. Para el menú no hace falta permiso de sitio: `selectionText` llega
  igual. `alarms` y `notifications` recién con la agenda.
- **Política de privacidad**: la Store la exige aunque no se junte nada. Una
  página `privacidad-extension.html` en el sitio: qué se lee (la selección, el
  PDF del despacho abierto), que nada sale de la computadora salvo lo que ya
  pide el tablero, y GoatCounter dicho.
- **Nombre y marca**: nada que parezca oficial. Ni «PJN» en el nombre ni el
  escudo; «Herramientas judiciales — no es una aplicación del Poder Judicial» en
  la descripción. La Store rechaza lo que imita a una institución.
- **Capturas con datos inventados**: con la imitación de la página que ya usa
  `verificar-revisor` y un PDF inventado.
- **Licencia**: el repo es «todos los derechos reservados, código a la vista»;
  publicar en la Store es compatible. La extensión vive en el repo público, con
  el control de datos de siempre.
- **Cada versión pasa revisión** (horas a pocos días). Otro argumento para que
  la extensión sea fina y el contenido viva en el sitio.

---

## 7. Arquitectura

```
extension/                      (nueva; el revisor se muda acá en la fase 3)
  manifest.json                 MV3: side_panel, contextMenus, storage
  fondo.js                      service worker: crea el menú, abre el panel,
                                interpreta la selección y se la pasa al panel
  interpretar.mjs               texto → { fecha, plazo, monto } o motivo. Puro,
                                con pruebas en Node. No calcula nada
  panel.html / panel.js         iframe al tablero publicado; recibe el caso
                                por chrome.runtime y le cambia el # al iframe;
                                aviso de sin conexión
  contenido-sgj.js              (fase 2) lee el PDF del despacho y le manda al
                                panel lo que encontró. Sin interfaz propia
  contenido-expedientes.js       (fase 4) buscador de modelos, aviso de sesión por vencer
  pruebas/                      imitación de las páginas, como el revisor
```

El camino de un click derecho:

```
selección ─► menú ─► fondo.js ─► interpretar.mjs ─► sidePanel.open
                                                  └► panel.js ─► tablero.html#vencimientos&fecha=…&plazo=…
                                                                   └► vencimientos.html#fecha=…&plazo=… (completa, no calcula)
```

---

## 8. Fases

| Fase | Qué | Cuándo está |
|---|---|---|
| **0. Pruebas** | Extensión de prueba para las 5 preguntas de §4 | Cuando estén contestadas en la PC propia y en la del juzgado |
| **1. El tablero a mano** | Panel lateral con el tablero; ícono y atajo (`Alt+Mayús+T`); click derecho de plazo, tasa y UMA; el tablero aprende a pasar el enlace | Anda «cargada descomprimida» en el juzgado una semana de trabajo real |
| **2. Lee el despacho** | «En este despacho» (§5.1) con las piezas del revisor | Encuentra las fechas y plazos de 20 proveídos inventados sin falsas alarmas graves |
| **3. A la Store** | Privacidad, ficha, capturas; publicación no listada; el revisor se muda como módulo | Un colega la instala desde el enlace sin ayuda |
| **4. Lo demás** | Agenda, insertar en el editor, Lex100 más cómodo, según lo que se use | Una por vez, cada una con su prueba |

**Lo que no cambia en ninguna fase:** la extensión no tiene una sola cuenta
propia. Todo número sale de las páginas publicadas o de los motores del sitio.
