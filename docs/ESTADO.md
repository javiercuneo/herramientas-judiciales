# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-07-31 (tarde) · rama `milestone-1-integracion`

---

## Dónde estamos

`honorio/` cerró el **rediseño visual** y quedó **sin bugs conocidos**. El motor
jurídico solo cambió para arreglar provisorios; las validaciones de
`lib/legal/__tests__` son ahora **10** y están todas en verde.

Commits previos de la sesión de rediseño:

| Commit | Qué |
|---|---|
| `ff08f2a` | Sistema visual "instrumento de medición" a nivel de tokens |
| `eb3f423` | Reconstrucción del dashboard sobre esos tokens |
| `369abc2` | Baja de ruido del dashboard + preferencias de lectura |
| `0e689c0` | Wizard sobre el mismo sistema |
| `cc99cc6` | Auto-avance, provisorios, tildes y ajustes de lectura |

Pendiente de commitear (pasada del 31/7 a la tarde):

- **Provisorios arreglados.** `esProvisorio` nunca se seteaba desde el wizard
  React: la presentación estaba entera, solo faltaba que la bandera llegara.
  Ahora la condición **se deriva de `modoTerminacion` dentro del motor**
  (`esRegulacionProvisoria`), no de una bandera que el llamador tenga que
  acordarse de poner. Cubierto por `provisorios.validation.ts`.
- **Mínimos arancelarios rehechos.** Se fue el `<select>` heredado; abre
  mostrando los 44 conceptos, con buscador (`lib/minimos-buscar.ts`) y en
  orden de articulado. Ver CHANGELOG.
- **Marca.** `components/brand.tsx` pinta la ilustración con `mask-image` y
  `currentColor`: una sola pieza para los dos temas.
- **Documentación nueva:** `honorio/README.md`, `honorio/CHANGELOG.md`,
  `honorio/docs/ROADMAP.md`. El paquete dejó de llamarse `my-project` y
  arranca en `1.0.0`.

Pantallas: **dashboard**, **wizard**, **portada**, **intro** y **mínimos**
sobre el mismo sistema. Falta pulido de mensajes.

---

## Decisiones tomadas, y por qué

Estas no se derivan del código. Si algo se va a cambiar, conviene saber contra
qué se está discutiendo.

### El sistema visual

**"Instrumento de medición".** El honorario es una banda medida en UMA contra
una escala graduada; la interfaz se diseñó como un instrumento, no como un
dashboard genérico. Se descartó explícitamente el cluster "crema + serif
display + terracota" por ser el look más reconocible de diseño generado por IA.

**Cuatro roles tipográficos, cada uno con significado estructural:**

- `font-meter` (**Archivo**, Omnibus-Type, Buenos Aires) — cifras y preguntas.
  Grotesca de raíz DIN con cifras tabulares. Elegida por ser una tipografía
  argentina para una herramienta jurídica argentina.
- `font-law` (**Source Serif 4**) — texto de la ley. **Si aparece serif, se está
  leyendo la norma y no la interfaz.** No usar serif para nada más.
- `font-sans` (Geist) — interfaz.
- `font-mono` (Geist Mono) — etiquetas, unidades y citas de artículos.

**Un solo acento.** Cobalto `#1E45CE` es `primary`, `ring` y `accent-foreground`
a la vez: lo activo, lo enfocado y lo seleccionado son siempre el mismo color.

**Tres ejes de color, uno por eje del cálculo.** Es idea del autor y funciona:

- **ocre** `--axis-base` — base regulatoria (arts. 22, 40)
- **violeta** `--axis-escala` — escala del art. 21 (arts. 25, 35, 37, 41)
- **óxido** `--axis-honorarios` — honorario final (arts. 34, 38, 49)
- **verde** `--rol` — ajuste por rol (art. 20). Fuera del sistema de tres ejes
  a propósito: no reduce por una razón procesal, ubica al rol respecto del
  patrocinante. Se usa igual para el `+40%` del apoderado y el `40%` del
  procurador, porque es la misma regla.

**`--radius: 0.375rem`.** El `rounded-2xl` parejo era parte del look de plantilla.

### Las dos reglas que gobiernan el contenido

1. **Toda la información importante debe estar.** Es software didáctico y
   deliberadamente transparente, no una caja negra. La ley es ambigua, la
   jurisprudencia dispersa, y hay criterios interpretativos que la app adopta:
   se declaran, no se esconden.
2. **Pero solo se le muestra a quien quiere entender.** De ahí:

   > **Los números no se ocultan nunca; las frases, siempre.**

   Un número es una decisión (el efectivo, el piso, la quita): se ve. Una frase
   es un fundamento (la norma, el criterio): va detrás de un `Disclosure`.

**El `por qué` es un único signo.** Misma palabra, mismo tamaño, mismo lugar al
borde derecho de la fila, en toda la app. Si cada explicación tuviera su forma,
el mecanismo para bajar ruido sería la principal fuente de ruido. **No inventar
variantes.**

### Decisiones de contenido

- **Cifras siempre completas.** Se eliminó la abreviación (`$101K`). Dos importes
  distintos como `$2.001.300` y `$2.011.800` abrevian ambos a "2M" y borran
  justamente la diferencia que importa.
- **El contrafáctico.** Bajo la cifra principal: *"La tabla del tramo sugiere
  $1.428.000"*, con la norma detrás del `por qué`. Es el momento más didáctico
  de la app: mucha gente lee la tabla del art. 21 y espera ese número.
  **No aparece cuando la base cae en el primer tramo**, porque ahí el cálculo
  ingenuo y el real coinciden y la frase mentiría.
- **Segunda instancia es una sección par**, no un colapsable. Feedback recibido:
  la app la van a consumir mucho quienes revisan regulaciones en cámara.
- **No numerar los ejes.** "Eje 1 / 01" es una convención nuestra, no de la ley.
  La barra de color ya ordena la secuencia.

### Arquitectura del rediseño

- `components/dashboard/primitives.tsx` — `Cifra`, `LedgerRow`, `Disclosure`,
  `Segmented`, `Tile`, `Prosa`, `Insignia`, y el mapa de colores por eje.
  **Todo componente nuevo del dashboard debería componerse de acá.**
- `components/dashboard/cadena.ts` — deriva los estados intermedios del cálculo
  por aritmética sobre los factores que emite el motor (divisiones y restas).
  **No reimplementa ninguna fórmula legal, y no debe hacerlo.**
- `components/prefs.tsx` — tema claro/oscuro y preferencias de lectura
  (centavos, decimales de UMA). Persisten en `localStorage`. **Solo cambian
  cómo se escribe la cifra, nunca el cálculo.**
- `components/interview/app-topbar.tsx` — la única cabecera de la app.

**Invariante importante:** el paso de la escala en la cadena se expresa
**siempre en términos del patrocinante**, y el ajuste por rol es un paso
posterior. Expresarlo en términos del apoderado hacía que "17% del excedente"
describiera mal el número, porque el ×1,4 se aplica después.

---

## Lo que sigue

### Bugs conocidos

Ninguno.

### Licencia: decidida

`honorio/` es **AGPL-3.0-or-later** (`honorio/LICENSE`, texto verbatim de la
FSF); el resto del repositorio sigue MIT (`LICENSE` en la raíz). Decidido por
Javier el 31/7. El motivo, para no rediscutirlo: no quiere restringir el uso
ni cobrar por la app, quiere que un tercero no pueda cerrar el motor —donde
están los criterios— como producto propio.

Consecuencias que hay que sostener:

- **Todo PR sobre `honorio/` necesita la aceptación de `CONTRIBUTING.md`**, que
  incluye la cesión de licencia. Sin eso se pierde la opción de licenciar
  comercialmente, porque haría falta el permiso de cada contribuyente.
  Si aparece un PR, esto es lo primero que hay que mirar.
- Los archivos de `lib/legal/` llevan encabezado SPDX. Un archivo nuevo del
  motor lo lleva también.
- Al publicar el motor como paquete o API, arrastrar `LICENSE` y los SPDX.

### Decisiones abiertas, del autor

- **Autoría visible en la app.** Hoy figura en los README, no en la interfaz.
  Sin decidir dónde; la idea era resolverla junto con la versión del motor en
  el informe imprimible.

### Pendiente de diseño y contenido

- **Informe imprimible.** Pedido del autor: PDF del cálculo con interruptor
  para incluir u omitir las explicaciones. Propuesto, no empezado. Requiere
  mostrar la versión del motor en el informe.
- **Assets de marca.** Cableado y resuelto: `components/brand.tsx` usa
  `mask-image` + `currentColor` sobre `public/honorio-marca.svg`.
  **Ojo con lo que decía la versión anterior de este documento:** los SVG no
  eran "iguales a los PNG"; el trazado toma la tinta y deja el papel
  transparente, que es justamente lo que hace que `currentColor` funcione y que
  no haga falta un recuadro de papel. Quedaron sin usar cuatro variantes que
  Javier generó (`honorio trazo blanco/negro.svg`, `honorio2 trazo
  blanco/negro.svg`) y dos propuestas de ícono sin revisar (`resultado
  gemini.png`, `resultado gpt.png`). **Son suyas: no borrarlas sin preguntar.**
  `honorio-wordmark.svg` está generado pero no cableado; el logotipo de la app
  sigue siendo tipográfico.
  Idea de marca a conservar: *un abogado que hace mal los números*.
- **Mensajes.** Varios pasos del wizard traen `brief: 'Ver más'`, que era el
  rótulo del botón viejo, no un resumen. Hoy se reemplaza en presentación por
  "Qué dice la ley sobre este paso" (ver `explanation-disclosure.tsx`), pero
  **conviene escribir briefs reales en el schema**.
- El resto bajó a [ROADMAP](../honorio/docs/ROADMAP.md): caducidad, mediación,
  consumo del motor desde afuera, regulación redactada.

---

## Trampas conocidas

- **El panel del navegador de la sesión no compone frames.** `document.hidden`
  es `true` y `requestAnimationFrame` no dispara, así que
  `AnimatePresence mode="wait"` nunca completa la salida y **el paso del wizard
  no llega a montarse**. Las capturas de pantalla también fallan. Consecuencia
  práctica: para verificar hay que armar una **página temporal** que renderice
  los componentes sin `AnimatePresence`, y comprobar por
  `read_page` / estilos computados. Borrarla antes de commitear.
- **`setAnswer` del wizard toma un solo argumento** (el valor), no `(id, valor)`:
  aplica siempre al paso actual.
- **No diferir `wizard.next()` en un `setTimeout` que cierre sobre `wizard`.**
  Ese objeto queda con las respuestas del render anterior y la validación no ve
  la selección recién hecha. Ya pasó una vez: usar una ref al último render.
- **El auto-avance es solo por teclado, a propósito.** Con el mouse equivocarse
  de tarjeta te sacaba de la pregunta.
- **`git commit -m` con here-string falla** en este entorno (guardia de sandbox).
  Usar `git commit -F <archivo>`.
- **`npm run lint` no corre**: `eslint` no está instalado pese al script.
  Verificar con `npx tsc --noEmit` y `npm run build`.
- **Los comandos se corren desde `honorio/`**, no desde la raíz del repo.
- **Una carpeta de ruta que empieza con `_` no existe para el App Router**:
  es carpeta privada. La página temporal de verificación tiene que llamarse
  `app/verificar/`, no `app/_verificar/`, o da 404 sin explicar por qué.
- **`next dev` puede quedar bloqueado por un candado de un proceso muerto**
  ("Another next dev server is already running" con un PID que ya no existe).
  Levantarlo en otro puerto (`npx next dev -p 3007`) destraba y sirve igual.
- **Las capturas de pantalla del panel fallan, pero el JavaScript no.** Para
  verificar color, tamaño o si una imagen cargó, alcanza con leer estilos
  computados; para saber qué dibuja un SVG, dibujarlo en un `<canvas>` y
  muestrear píxeles. Es más confiable que mirar una captura: en esta sesión
  una captura mal leída llevó a dar por invertido un trazado que estaba bien.

---

## Cómo verificar un cambio en el motor

```bash
npx tsc --noEmit
npm run build
```

Y las validaciones del motor —10 archivos—, que deben quedar todas en verde:

```bash
for f in lib/legal/__tests__/*.validation.ts; do npx tsx "$f"; done
```
