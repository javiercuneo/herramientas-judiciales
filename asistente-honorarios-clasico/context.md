# Asistente para la Regulación de Honorarios — Ley 27.423

## Propósito
Asistente interactivo tipo wizard que guía al usuario en la estimación de honorarios judiciales y extrajudiciales conforme a la Ley 27.423 y normativa complementaria argentina.

## Arquitectura
- `index.html`: estructura base, carga de módulos, dark mode toggle, steps.
- `js/core.js`: funciones puras de cálculo (escalas del art. 21), parseo/formateo de números, carga de UMA desde Google Sheets.
- `js/state.js`: definición y manejo del estado global `wizardState`, validación de pasos.
- `js/calculations.js`: generación de HTML de resultados según el tipo de proceso seleccionado (tablas de honorarios, reducciones, segunda instancia, mínimos arancelarios, etc.).
- `js/wizard.js`: renderizado de pantallas, navegación (siguiente, atrás, reset), resumen de elecciones, pantalla de mínimos arancelarios, manejo de eventos de UI.
- `css/styles.css`: estilos visuales con soporte de modo oscuro (variables CSS).

## Estado global (`wizardState`)
Almacena todas las elecciones del usuario a lo largo del wizard:
- `step`: paso actual (0 a 5, o el string `'minimos'` para la pantalla de mínimos arancelarios)
- `valorUMA`: valor de la UMA (inicia en 92.482, se actualiza con Google Sheets)
- `tipoProceso`: tipo de proceso. Desde el desplegable del paso 1: `conocimiento`, `ejecucion_sentencia`, `ejecutivo`, `sucesion`, `exhorto`, `incidente`, `medida_cautelar`, `homologacion_desocupacion`. Desde la pantalla de mínimos: `minimos_extrajudicial`, `minimos_judicial`, `minimos_art58`, `minimos_recursos_csjn`, `minimos_auxiliares`. (En el código subsisten además los valores legacy `minimos_judiciales`.)
- `modoTerminacion`, `sentenciaResultado`, `aperturaPrueba`, `caducidadCriterio`: contingencias procesales (conocimiento/ejecución/ejecutivo)
- `tuvoExcepciones` (ejecución/ejecutivo)
- `sucesionUnicoLetrado` (sucesión)
- `medidaOposicion` (medida cautelar)
- `homologacionVivienda` (homologación desocupación: 'vivienda'/'otros')
- `objetoBase`: objeto del juicio (solo conocimiento)
- `desalojoVivienda`: subtipo de desalojo ('vivienda','civil','laboral' o null)
- `posesoriasTipo`: subtipo de posesorias/interdictos ('beneficio'/'demas' o null)
- `baseValor`: monto de la base regulatoria
- `esProvisorio`: true si se solicitan honorarios provisorios (art. 12); solo se muestra el mínimo
- `desdeMinimos`, `desdeResultado`: flags de navegación desde la pantalla de mínimos / desde el resultado

## Flujo del wizard
0. Bienvenida + valor UMA (con botón "Ver mínimos arancelarios")
1. Tipo de proceso
2. Contingencias (según tipo)
3. Objeto del juicio (solo conocimiento)
4. Base regulatoria
5. Resultado

Saltos de "Siguiente":
- `exhorto` → de 1 a 5
- `incidente` → de 1 a 4
- `medida_cautelar`, `homologacion_desocupacion` → de 1 a 2, y de 2 a 4 (omiten objeto)
- Los demás procesos del paso 1 → paso 2; en el paso 2, todo lo que no sea `conocimiento` → paso 4
- Desde "Ver mínimos arancelarios" (paso 0) se abre la pantalla `step='minimos'`; al elegir una categoría y "Siguiente" se salta al paso 5

Atrás inteligente:
- En el resultado (paso 5): los procesos de mínimos vuelven a la pantalla de mínimos; `exhorto` y `minimos_judiciales` vuelven al paso 1; el resto vuelve al paso 4 (base)
- `incidente` en el paso 4 vuelve al paso 1
- El resto retrocede un paso

## Cálculo de honorarios
- Se basa en la interpretación del art. 21 según la cual el mínimo de cada escala se calcula como (base − límite inferior) × alícuota mínima + máximo del grado inmediato anterior. Ejemplo: para 3ª escala, máximo anterior = 11.70 UMA.
- La función central es `calcularEscalaBase()` en `core.js`, que retorna los rangos (mínimo/máximo) para `patrocinante` (juicio completo y por etapas de 1/3 y 2/3), `apoderado` (×1.4, art. 20) y auxiliares de justicia (`auxMin`/`auxMax`, 5% y 10% de la base). El procurador (40% del patrocinante) se calcula en `calculations.js`.
- Las reducciones se aplican en `calcularFinal()` en tres niveles, según tipo de proceso, contingencias y objeto:
  - **Base** (art. 22/40): demanda rechazada −30% (art. 22), caducidad con criterio art. 22 −30%, desalojo para vivienda −20% (art. 40), homologación de vivienda −20%.
  - **Escala** (art. 25/35/41): sucesión con un solo letrado −50% (art. 35), ejecución de sentencia −50% (art. 41), modos anormales antes de apertura a prueba −50% (art. 25), caducidad con criterio art. 25 antes de prueba −50%.
  - **Honorarios finales**: ejecutivo sin excepciones −10% (art. 34), ejecución de sentencia sin excepciones −10% adicional (art. 41 + 34), posesorias/interdictos en beneficio exclusivo −20% (art. 38), incidencia colectiva −25% (art. 49), homologación de desocupación −50%, medida cautelar 25%/50% según haya o no oposición.

## Funcionalidades
- Pantalla de mínimos arancelarios (art. 19 a y b, art. 48, art. 44, art. 58, art. 31 y auxiliares de justicia) accesible desde el botón del paso 0.
- Desalojo laboral (art. 43) como subtipo de desalojo.
- Objetos de familia: alimentos (art. 39) y liquidación del régimen patrimonial del matrimonio (art. 45).
- Acciones posesorias, interdictos o división de bienes comunes (art. 38, con sub-opción beneficio/demás casos).
- Derechos de incidencia colectiva con contenido patrimonial (art. 49).
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
- No alterar la interpretación legal.
- Mantener la estructura modular actual.