# Estado del proyecto

Documento de continuidad entre sesiones. **Leer antes de empezar a trabajar.**
Se actualiza en el mismo commit que el trabajo, para que nunca mienta.

Última actualización: 2026-07-31 · rama `milestone-1-integracion`

---

## Dónde estamos

`honorio/` está en medio de un **rediseño visual completo**, ya cerrado en su
mayor parte. El motor jurídico no se tocó en ninguna de las pasadas: las 9
validaciones de `lib/legal/__tests__` siguen en verde.

Commits de la sesión, en orden:

| Commit | Qué |
|---|---|
| `ff08f2a` | Sistema visual "instrumento de medición" a nivel de tokens |
| `eb3f423` | Reconstrucción del dashboard sobre esos tokens |
| `369abc2` | Baja de ruido del dashboard + preferencias de lectura |
| `0e689c0` | Wizard sobre el mismo sistema |
| `cc99cc6` | Auto-avance, provisorios, tildes y ajustes de lectura |

Pantallas: **dashboard** y **wizard** rediseñados. **Portada e intro** alineados
al sistema. Falta pulido de mensajes y los assets de marca definitivos.

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

- **Los honorarios provisorios todavía no funcionan.** Reportado por el autor
  después del commit `cc99cc6`. La presentación ya está (una sola columna, sin
  máximo, con el art. 12 declarado detrás del `por qué`), pero el resultado no
  es correcto. **Hay que revisar el camino provisorio de punta a punta**: qué
  manda el wizard (`esProvisorio`, `modoTerminacion: 'provisorios'`), qué hace
  `resolveReglas` con eso, y qué devuelve `buildGeneral`. Empezar por reproducir
  el caso antes de tocar nada.

### Pendiente de diseño y contenido

- **Assets de marca.** Existen `public/honorio.svg` y `honorio2.svg`, iguales a
  los PNG pero vectoriales: convienen porque con `fill="currentColor"` se
  adaptan solos al tema claro/oscuro. **Todavía no están cableados** — la
  portada usa el PNG. Además hay dos propuestas nuevas sin revisar:
  `public/resultado gemini.png` y `public/resultado gpt.png`.
  Idea de marca a conservar: *un abogado que hace mal los números*.
  Con dos íconos alcanza (marca + portada); el resto de la iconografía es
  `lucide-react` y meter ilustraciones rompería esa consistencia.
- **Mensajes.** Varios pasos del wizard traen `brief: 'Ver más'`, que era el
  rótulo del botón viejo, no un resumen. Hoy se reemplaza en presentación por
  "Qué dice la ley sobre este paso" (ver `explanation-disclosure.tsx`), pero
  **conviene escribir briefs reales en el schema**.
- **Caducidad.** La ley no la previó y la app adopta un criterio. Está declarado
  en `REGLA_LABEL` (`base-caducidad-art22`), pero merece tratamiento más visible
  en el ledger, coherente con el principio de transparencia.
- **Motor de honorarios de mediación.** Vive aparte en
  `calculadoras/honorarios-mediacion.html`. A futuro podría integrarse.

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

---

## Cómo verificar un cambio en el motor

```bash
npx tsc --noEmit
npm run build
```

Y las validaciones del motor, que deben quedar todas en verde:

```bash
for f in lib/legal/__tests__/*.validation.ts; do npx tsx "$f"; done
```
