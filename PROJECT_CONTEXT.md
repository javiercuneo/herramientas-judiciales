Este repositorio es una colección de herramientas legales orientadas al derecho argentino.

Incluye:
- Calculadoras de plazos judiciales
- Calculadoras de honorarios (Ley 27.423, Ley 26.589)
- Calculadora de tasa de justicia
- Otras herramientas auxiliares

Arquitectura actual:
- Algunas herramientas son SPA en un archivo HTML independiente con JS embebido
- El asistente de honorarios (AH/) está modularizado en:
  - `asistente.html` – estructura y carga de módulos
  - `css/styles.css` – estilos con modo oscuro
  - `js/core.js` – cálculos puros (escalas, UMA, parseo/formateo)
  - `js/state.js` – estado global y validaciones
  - `js/calculations.js` – generación de resultados para cada tipo de proceso
  - `js/wizard.js` – flujo de pantallas, navegación y renderizado de UI
- Se mantiene baja reutilización de código entre herramientas, pero dentro del asistente la modularización permite mantener y extender la lógica de manera controlada.

Dependencias:
- UMA desde Google Sheets (se actualiza automáticamente al cargar)
- Feriados desde API externa + JSON local (otras herramientas)

Herramienta más compleja:
- AH/asistente.html + js/.js + css/styles.css
- Implementa un wizard de 5 pasos con estado global (`wizardState`)
- Contiene lógica normativa compleja basada en la Ley 27.423 y artículos complementarios
- Soporta múltiples tipos de procesos (conocimiento, ejecución, sucesión, exhorto, incidente, medida cautelar,etc.)

Objetivo actual:
- Mantener funcionamiento exacto de los cálculos existentes
- Mejorar estructura interna ya lograda con módulos JS
- Permitir la adición controlada de nuevas funcionalidades
- Separar claramente la UI, el estado y la lógica de cálculo

Restricciones críticas:
- Los cálculos legales deben mantenerse exactamente iguales
- Los resultados actuales son considerados correctos 
- No se debe alterar la interpretación de normas sin validación explícita
- Cualquier cambio en lógica debe ser explícitamente validado antes de implementarse
- Las nuevas funcionalidades deben implementarse siguiendo el mismo esquema de módulos (state, calculations, wizard)

Prioridad del proyecto:
1. Exactitud legal
2. Claridad del código
3. Mantenibilidad
4. Nuevas funcionalidades (controladas)
5. Performance (último)