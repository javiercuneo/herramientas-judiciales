# Asistente para la Regulación de Honorarios – Ley 27.423

## Propósito
Asistente interactivo tipo wizard que guía al usuario en la estimación de honorarios judiciales y extrajudiciales conforme a la Ley 27.423 y normativa complementaria argentina.

## Arquitectura
- `asistente.html`: estructura base, carga de módulos, dark mode toggle, steps.
- `js/core.js`: funciones puras de cálculo (escalas del art. 21), parseo/formateo de números, carga de UMA desde Google Sheets.
- `js/state.js`: definición y manejo del estado global `wizardState`, validación de pasos.
- `js/calculations.js`: generación de HTML de resultados según el tipo de proceso seleccionado (incluye tablas de honorarios, reducciones, segunda instancia, etc.).
- `js/wizard.js`: renderizado de pantallas, navegación (siguiente, atrás, reset), resumen de elecciones, manejo de eventos de UI.
- `css/styles.css`: estilos visuales con soporte de modo oscuro (variables CSS).

## Estado global (`wizardState`)
Almacena todas las elecciones del usuario a lo largo del wizard:
- `step`: paso actual (0 a 5)
- `valorUMA`: valor de la UMA (inicia en un numero, se actualiza con Google Sheets)
- `tipoProceso`: tipo de proceso seleccionado (conocimiento, ejecucion_sentencia, ejecutivo, sucesion, exhorto, incidente, medida_cautelar, homologacion_desocupacion, minimos_judiciales)
- `modoTerminacion`, `sentenciaResultado`, `aperturaPrueba`, `caducidadCriterio`: contingencias procesales
- `tuvoExcepciones` (ejecución/ejecutivo)
- `sucesionUnicoLetrado` (sucesion)
- `medidaOposicion` (medida cautelar)
- `homologacionVivienda` (homologacion desocupacion)
- `objetoBase`, `desalojoVivienda` (objeto del juicio, ahora string: 'vivienda','civil','laboral' o null)
- `baseValor`: monto de la base regulatoria
- `esProvisorio`: true si se solicitan honorarios provisorios

## Flujo del wizard
0. Bienvenida + valor UMA
1. Tipo de proceso
2. Contingencias (según tipo)
3. Objeto del juicio (solo conocimiento)
4. Base regulatoria
5. Resultado

Saltos:
- exhorto → de 1 a 5
- incidente → de 1 a 4
- minimos_judiciales → de 1 a 5
- medida_cautelar, homologacion_desocupacion → de 2 a 4

## Cálculo de honorarios
- Se basa en la interpretación del art. 21 segun la cuál el mínimo de cada escala se calcula como (base - límite inferior) × alícuota mínima + máximo del grado inmediato anterior. Ejemplo: para 3ª escala, máximo anterior = 11.70 UMA.
- La función central es `calcularEscalaBase()` en `core.js`, que retorna mínimos, máximos y topes para patrocinante, apoderado y procurador.
- Las reducciones se aplican en `calcularFinal()` según el tipo de proceso, contingencias y objeto del juicio.

## Funcionalidades recientes
- Mínimoss judiciales para asuntos no susceptibles de apreciación pecuniaria (art. 19 a) como nuevo tipo de proceso.
- Botón en paso 1 para ver tabla de mínimos extrajudiciales (art. 19 b).
- Desalojo laboral (art. 43) como subtipo de desalojo.
- Objetos de familia: alimentos (art. 39) y liquidación del régimen patrimonial del matrimonio (art. 45).
- Mensajes de error unificados en texto rojo inline (sin alert).
- Navegación Atrás inteligente según saltos de pasos.

## Convenciones de código
- No usar `alert()` para mensajes de error; usar divs con clase `error-msg` y la función `mostrarErrorEnPaso()` en wizard.js.
- Las validaciones deben retornar `''` en caso de éxito, o un string con el mensaje de error.
- Mantener los nombres de variables y funciones existentes.
- Los nuevos tipos de procesos/objetos deben integrarse en los switch/case de `getSummaryText()` y `renderBase()`.

## Restricciones
- No modificar la lógica de `calcularEscalaBase()` ni los valores de las escalas.
- No reemplazar `calcularFinal()` por otra función; extenderla con nuevos `if` para los nuevos tipos.
- No alterar la interpretación legal
- Mantener la estructura modular actual.