# Informe: Refactor de CSS compartido en /calculadoras (issue "shared.css")

Fecha de análisis: 31/07/2026. Estado: análisis + plan. NO se ejecutaron cambios.
Issue original (parafraseado): "Each calculator HTML file contains embedded CSS and JavaScript, leading to ~6,282 lines of duplicated code. Create shared CSS file: extract common styles to /calculadoras/css/shared.css."

---

## 1. Verificación del issue (datos medidos)

### 1.1 Inventario
- 10 calculadoras HTML en `calculadoras/` (caducidad, distancia, ejecucion-estado, entre-fechas, honorarios-mediacion, honorarios, mora, prorrateo, regresiva, tasa, vencimientos).
- 1 JS compartido ya externalizado: `js/calendario-judicial.js` (226 líneas), usado por 4 archivos (caducidad, entre-fechas, regresiva, vencimientos).
- **No existe ningún CSS local compartido.** El único `<link>` de cada archivo es Google Fonts (Montserrat). Todo el CSS está inline en un `<style>` por archivo.

### 1.2 Volumen
| Métrica | Valor |
|---|---|
| Líneas totales en los 10 HTML | **6,293** (el "~6,282" del issue coincide con este total, no con "duplicado") |
| CSS inline total (todas las copias) | 2,293 líneas → 862 únicas |
| JS inline total (todas las copias) | 2,459 líneas → 1,743 únicas |
| Líneas de propiedad repetidas en ≥2 archivos | 72% (CSS) / 37% (JS) |
| Reglas CSS completas idénticas en ≥2 archivos | **solo 41 de 449 (9%)** |
| Reglas CSS completas idénticas en ≥5 archivos | 16 (4%) |
| Similitud por pares (Jaccard de reglas idénticas) | máximo 22% (honorarios vs vencimientos); la mayoría <10% |

### 1.3 Conclusión sobre el claim
- **Parcialmente cierto pero engañoso.** Es verdad que todo el CSS/JS está embebido (sin compartir), pero la "duplicación" de 72% es a nivel de **líneas de propiedad sueltas** (p. ej. `color: #667eea;` aparece en muchos archivos), no a nivel de **reglas completas** (solo 9% idénticas).
- Los `<style>` de cada calculadora son **hermanos con variaciones hechas a mano**, no copias: `body` tiene 11 variantes, `h1` 8+, `.container` usa max-width 700/800/900/1000, `button` 6+ variantes, mora/honorarios-mediacion usan variables CSS y fuente system-ui, prorrateo es fondo blanco, tasa usa paleta #124559.
- Implicancia: **no existe una extracción mecánica segura** que preserve el aspecto exacto. Un shared.css real implica NORMALIZAR (elegir valores canónicos) → produce cambios visuales sutiles → requiere QA visual por página.

---

## 2. Opciones y recomendación

### Opción A — Extracción mecánica (solo reglas byte-idénticas)
Ahorro real: **~40-60 líneas**. Requiere tocar los 11 archivos (agregar `<link>`, borrar `<style>`, verificar) para casi nada. **Descartada.**

### Opción B — Base normalizada en `calculadoras/css/shared.css` (recomendada si se acepta alcance visual)
Ahorro realista: **~1,200-1,400 líneas** (~20% del folder) + consistencia visual + mantenibilidad. Es un **proyecto de unificación visual**, no una limpieza trivial: decisiones de diseño, cambios sutiles de look y QA en 10 páginas. Riesgo medio.

### Opción C — No hacerlo / baja prioridad
Las calculadoras son estáticas, standalone y funcionan; el costo de mantenimiento de la duplicación es real pero moderado. La prioridad del repo (AGENTS.md) es exactitud legal > claridad > mantenibilidad.

**Recomendación:** hacer **Opción B** solo como iniciativa separada de "unificación visual", aceptando el cambio de look y dedicando QA a cada página. Si la prioridad es conservar el aspecto actual pixel a pixel, no vale la pena (Opción C).

---

## 3. Plan de ejecución (Opción B) — para retomar en sesión nueva

### Paso 0 — Baseline
- Sacar captura (before) de las 10 calculadoras, idealmente desde el deploy (https://javiercuneo.com.ar/calculadoras/<archivo>.html) o sirviendo el repo localmente.
- Verificar encoding UTF-8 de todos los archivos antes de editar.

### Paso 1 — Crear `calculadoras/css/shared.css` (base canónica)
Contenido propuesto:
- `:root` con variables: `--primary: #667eea; --accent: #764ba2; --bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%); --card: #fff; --text: #0f172a; --muted: #5f6b7a; --border: #e0e0e0; --shadow: 0 20px 60px rgba(0,0,0,0.3);`
- Reset `* { margin:0; padding:0; box-sizing:border-box; }`
- `body` (variante canónica Montserrat + gradiente), `h1`, `.container`, `label`, `.input-group`, `input`, `select`, `button`, `.btn-calculate`, `.card`, `.legal-box`, tablas, footer, media queries responsive.
- Mantener el gradiente/fuente/paleta actual (NO rediseñar; solo unificar los valores que ya existen).

### Paso 2 — Refactor incremental, 1 archivo por commit
Orden sugerido (de más cercano a la base → más divergente):
1. vencimientos, 2. regresiva, 3. entre-fechas, 4. honorarios, 5. caducidad, 6. ejecucion-estado, 7. distancia, 8. tasa, 9. prorrateo, 10. mora, 11. honorarios-mediacion.
Por cada archivo:
- Agregar `<link rel="stylesheet" href="css/shared.css">` (ruta relativa; funciona en local y en GH Pages porque `pages.yml` ya copia `calculadoras/` recursivo).
- Quitar del `<style>` las reglas cubiertas por shared.css.
- Dejar inline SOLO los overrides y reglas específicas del archivo.
- NO tocar HTML de estructura, ids, ni lógica JS.

### Paso 3 — Verificación (after)
- Comparar captura before/after por página. Toda diferencia debe ser una decisión consciente, no un accidente.
- Validar las 4 calculadoras que dependen de `calendario-judicial.js` (caducidad, entre-fechas, regresiva, vencimientos).
- Validar las divergentes con look propio: mora, prorrateo (fondo blanco), tasa (paleta #124559), honorarios-mediacion (system-ui + variables).
- Test de deploy: push + GitHub Pages (no debería requerir cambios en `pages.yml`).

---

## 4. Riesgos y reglas
- AGENTS.md: no tocar lógica de cálculo. Este refactor es **solo CSS** (no JS, no HTML, no ids).
- Riesgo principal: cambios visuales involuntarios → mitigado con baseline de capturas.
- No agregar dependencias nuevas (la ruta `css/shared.css` no requiere build ni bundler).
- Cambios incrementales (1 archivo por commit), explicando cada uno.
- No mezclar este refactor con cambios de lógica legal.

---

## 5. Datos de referencia por archivo (recolectados)

| Archivo | Líneas CSS (sin blanks) | Reglas CSS | Notas |
|---|---|---|---|
| caducidad.html | 150 | 29 | body centrado flex; container max-width 700px; usa calendario-judicial.js |
| distancia.html | 231 | 37 | body padding 2rem; color #1a2c3e; botón ruta OSRM |
| ejecucion-estado.html | 447 | 96 | el más grande; h1 26px; container 800px |
| entre-fechas.html | 250 | 47 | container 900px; usa calendario-judicial.js |
| honorarios-mediacion.html | 54 | 23 | system-ui + variables CSS; botones pill (999px) |
| honorarios.html | 111 | 23 | container 900px; botón .btn-calculate |
| mora.html | 185 | 30 | variables CSS; container 1000px; sin card blanca |
| prorrateo.html | 225 | 47 | fondo blanco (rompe el patrón); flex 2 columnas |
| regresiva.html | 224 | 37 | h1 1.8rem; usa calendario-judicial.js |
| tasa.html | 172 | 34 | paleta #124559; container con sombra distinta |
| vencimientos.html | 244 | 46 | container 900px; usa calendario-judicial.js |

Solo 7 selectores aparecen en ≥5 archivos: `body` (11), `h1` (10), `.container` (9), `*` (7), `button` (6), `.input-group` (6), `label` (6). Total de selectores únicos: 318.