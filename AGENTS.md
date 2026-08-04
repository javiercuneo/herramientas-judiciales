# Instrucciones para agentes

Este archivo es la referencia canónica para cualquier agente que trabaje en
este repositorio: Claude Code, Codex, Cursor, opencode o el que venga.
`CLAUDE.md` apunta acá y no repite nada.

**Antes de tocar código, leé [`docs/ESTADO.md`](docs/ESTADO.md).** Lleva lo que
el código no puede llevar: en qué punto está el trabajo, qué decisiones de
diseño e interpretación ya se tomaron y por qué, qué se sabe roto y qué trampas
ya costaron tiempo. Se actualiza en el mismo commit que el trabajo que
describe, así que no miente. Si vas a cerrar una sesión, actualizalo.

---

## La regla que gobierna todo lo demás

Esto no es software donde un bug se descubre en producción y se arregla el
martes. Un cálculo de honorarios puede terminar fundando una resolución
judicial, y una fecha de vencimiento mal computada hace perder un derecho.
**La exactitud del número es el producto.** El código es el vehículo.

De ahí una sola regla, de la que se derivan casi todas las demás:

> **Ningún cambio puede mover un número sin que eso sea exactamente lo que se
> pidió, esté justificado en la norma y quede escrito.**

Un refactor que mejora el código y cambia un resultado no es un refactor
mejorado: es un error. Los resultados actuales se consideran correctos y son
la referencia a preservar, salvo que se demuestre lo contrario con el caso
concreto.

Lo que se sigue de eso:

- **No cambies escalas, porcentajes, coeficientes ni reglas normativas** sin
  pedido explícito. Si creés que algo está mal, decilo con el caso: qué
  entrada, qué da hoy, qué debería dar, y qué artículo o criterio lo funda.
  Después esperá confirmación.
- **No "simplifiques" una fórmula legal.** Lo que parece una redundancia suele
  ser una distinción de la ley. El orden de los pasos importa: aplicar una
  quita sobre la base no es lo mismo que aplicarla sobre la escala.
- **No elimines validaciones** porque parezcan defensivas de más.
- **No confíes en el motor clásico como oráculo.** Es la referencia histórica,
  no la verdad. Ya se encontró al menos un caso donde el clásico y `honorio/`
  compartían el mismo agujero (ver `ESTADO.md`, flujo hacia atrás). Que dos
  implementaciones coincidan prueba que son consistentes, no que están bien.

**Lo que sí podés hacer sin preguntar:** cambios de interfaz, texto, estilos,
tipos, estructura de archivos, documentación y cualquier cosa que no toque un
resultado. No hace falta un plan aprobado para renombrar una variable. El
riesgo acá no es el tamaño del cambio, es si un número se movió.

Orden de prioridades cuando entran en conflicto:
**1) exactitud legal, 2) claridad, 3) mantenibilidad, 4) funcionalidad nueva,
5) performance.** La performance va última en serio: son calculadoras que
corren en milisegundos.

---

## Qué hay acá

No es una aplicación: son varios proyectos independientes, en distinto grado
de madurez, conviviendo en un repositorio. Tratalos como tales — un cambio en
`calculadoras/` no tiene por qué mirar `honorio/`.

```
honorio/                        Next.js 16 + React 19 + TS. El proyecto activo y el
                                  más maduro. Asistente de honorarios de la Ley 27.423.
                                  Licencia AGPL-3.0 (el resto del repo es MIT).
asistente-honorarios-clasico/   El motor original en JS vanilla del que salió honorio/.
                                  Referencia histórica. Sigue publicado y funcionando.
calculadoras/                   Herramientas de un solo archivo HTML con JS embebido
                                  (plazos, mora, tasa, prorrateo, caducidad...).
                                  Sin build, sin bundler: se editan directo.
                                  js/calendario-judicial.js es la dependencia compartida
                                  de todo lo que calcula fechas.
data/dias-inhabiles.json        Feriados locales, respaldo de la API externa.
PDF-studio/                     Express + JS vanilla, PWA de herramientas PDF.
                                  App aparte, package.json propio. No toca honorarios.
docs/domain/                    Documentación del dominio (01 a 08): tipos de proceso,
                                  reglas de negocio, modelo, glosario, deuda técnica.
                                  El "por qué" de las reglas que están en el código.
index.html, documentacion.html  Landing y guía de uso, publicadas en GitHub Pages.
proyectos finalizados/          Trabajos cerrados, conservados como muestra.
```

Antes de tocar lógica legal en cualquier lado, pasá por
[`docs/domain/03_REGLAS_DE_NEGOCIO.md`](docs/domain/03_REGLAS_DE_NEGOCIO.md) y
[`07_GLOSARIO.md`](docs/domain/07_GLOSARIO.md) para el razonamiento normativo, y
por [`08_DEUDA_TECNICA_FUNCIONAL.md`](docs/domain/08_DEUDA_TECNICA_FUNCIONAL.md)
por si el problema ya está anotado.

---

## `honorio/`

Todos los comandos se corren **desde `honorio/`**, no desde la raíz.

```bash
npm run dev      # servidor de desarrollo
npm run build    # export estático (es lo que se publica)
npm run start    # sirve el build
```

### Cómo se verifica un cambio en el motor

Un solo comando, y es el mismo que corre CI:

```bash
npm run check      # tipos + las 11 validaciones
```

Por separado, si necesitás aislar:

```bash
npm run typecheck  # tsc --noEmit
npm run validate   # solo las validaciones
npm run build      # el export estatico, que es lo que se publica
```

Las validaciones de `lib/legal/__tests__/*.validation.ts` son scripts sueltos
—no hay framework de tests, a propósito— que comparan la salida del motor
contra casos conocidos y salen con código distinto de cero si algo no coincide.
`scripts/validate.mjs` las corre todas y junta los resultados.

**Tienen que quedar todas en verde antes de dar un cambio por hecho.** Son lo
único que impide que un ajuste de interfaz mueva un número, y por eso corren
en `.github/workflows/motor.yml` en cada push y cada PR, y otra vez antes de
publicar: si una falla, el sitio no sale.

Si agregás una regla al motor, agregá su validación. Si cambiás un resultado a
propósito, va al [`CHANGELOG`](honorio/CHANGELOG.md) aunque el diff sea de una
línea.

### Cómo está armado

Cuatro capas, con una regla que las ordena: **las reglas jurídicas viven en una
sola de ellas.**

| Capa | Dónde | Qué puede hacer |
|---|---|---|
| Motor | `lib/legal/` | Toda la aritmética y todas las reglas de la ley. No conoce React, DOM ni HTML. |
| Schema | `lib/wizard/` | Qué se pregunta, en qué orden y bajo qué condición. Datos puros, sin efectos. |
| Orquestación | `hooks/useWizard.ts` | Navegación, validación y estado. Ninguna regla jurídica. |
| Presentación | `components/` | Solo renderiza. Ninguna regla jurídica. |

Punto de entrada único del motor:

```ts
import { buildCalculationResult } from '@/lib/legal/calculate'
const resultado = buildCalculationResult(estado) // función pura
```

Devuelve el cálculo **y** la lista de transformaciones que lo produjeron: eso
es lo que la interfaz muestra como cadena, y es lo que permitiría consumir el
motor desde afuera. No lo rompas devolviendo solo el número.

Invariantes que hay que sostener:

- El alias `@/*` apunta a la raíz de `honorio/`.
- `components/dashboard/cadena.ts` deriva los pasos intermedios por aritmética
  sobre los factores que emite el motor. **No reimplementa ninguna fórmula
  legal y no debe hacerlo.**
- Todo componente nuevo del dashboard se compone desde
  `components/dashboard/primitives.tsx`.
- Los archivos de `lib/legal/` llevan encabezado SPDX (AGPL). Uno nuevo también.

### El motor legacy

`public/legacy/{core,state,calculations}.js` es una copia temporal del clásico,
cargada por `<script>` y manejada por `window.*` para lo que todavía no se
portó. Dos reglas:

1. **No agregues dependientes nuevos.** Todo lo nuevo va a `lib/legal/`.
2. Esos archivos deben quedar **idénticos** a
   `asistente-honorarios-clasico/js/*.js`. Si hay que arreglar algo del motor
   compartido, se arregla en el clásico —que es la fuente— y se propaga a
   propósito. Nunca se parchea una copia sola.

---

## Convenciones del repositorio

- **Español rioplatense, con tildes**, en interfaz, documentación y commits.
  No "tú", no "vosotros", no texto sin acentuar.
- **Sin emojis en documentación técnica.** `ESTADO.md`, `honorio/README.md` y
  `CONTRIBUTING.md` marcan el registro: directo, con las razones dichas, sin
  decoración. (La landing y el README de la raíz todavía no lo siguen.)
- **Commits en español**, con prefijo tipo `feat(honorio):`, `fix:`, `docs:`,
  `chore:`. Miralos con `git log --oneline` antes de escribir el tuyo.
- **`git commit -m` con here-string falla** en este entorno. Usá
  `git commit -F <archivo>`.
- **Licencias:** el repositorio es MIT; `honorio/` es AGPL-3.0-or-later, a
  propósito. Si aparece un PR sobre `honorio/`, lo primero que se mira es la
  aceptación de [`CONTRIBUTING.md`](CONTRIBUTING.md): sin eso se pierde la
  opción de licenciar comercialmente. El motivo de la excepción está en
  `honorio/README.md` y no hace falta rediscutirlo.

## Trampas conocidas

Están todas en la sección final de [`docs/ESTADO.md`](docs/ESTADO.md), con el
detalle de qué pasa y por qué. No se duplican acá para que no se desincronicen.
Si te chocaste con una nueva, agregala ahí.
