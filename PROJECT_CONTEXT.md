Este repositorio es una colección de herramientas legales orientadas al derecho argentino.

Incluye:
- Calculadoras de plazos judiciales
- Calculadoras de honorarios (Ley 27.423, Ley 26.589)
- Calculadora de tasa de justicia
- Otras herramientas auxiliares

Arquitectura actual:
- Cada herramienta es una SPA en un archivo HTML independiente
- La lógica JavaScript está embebida en cada archivo
- Hay baja reutilización de código entre herramientas

Dependencias:
- UMA desde Google Sheets
- Feriados desde API externa + JSON local

Herramienta más compleja:
- AH/asistente.html
- Implementa un wizard con múltiples pasos y estado global
- Contiene lógica normativa compleja

Objetivo actual:
- Mantener funcionamiento exacto
- Mejorar estructura interna
- Separar lógica, UI y flujo sin romper comportamiento

Restricciones críticas:
- Los cálculos legales deben mantenerse exactamente iguales
- Los resultados actuales son considerados correctos
- No se debe alterar la interpretación de normas (Ley 27.423, CPCCN, etc.)
- Cualquier cambio en lógica debe ser explícitamente validado antes de implementarse

Prioridad del proyecto:
1. Exactitud legal
2. Claridad del código
3. Mantenibilidad
4. Performance (último)