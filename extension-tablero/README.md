# Herramientas judiciales — extensión de Chrome

Click derecho sobre una fecha, en Lex100 o en un despacho, y al costado se abre
un panel con el vencimiento del plazo. **Fase 1** del plan
([`docs/PLAN_EXTENSION_TABLERO.md`](../docs/PLAN_EXTENSION_TABLERO.md)). No es
una aplicación del Poder Judicial.

## Cómo está hecha

- **El panel es un marco.** Adentro va `calculadoras/panel.html` del sitio, que
  calcula con `js/plazos.js` y `js/calendario-judicial.js`, los mismos de
  `vencimientos.html`. La extensión no tiene una sola cuenta propia, y los
  feriados nuevos llegan sin publicar otra versión.
- **El click derecho** tiene dos ítems:
  - con texto seleccionado (anda también dentro del visor de PDF);
  - sobre un enlace o un texto de Lex100 o sgj-docs, sin seleccionar: para las
    fechas que son enlaces. Chrome no le da a la extensión el texto de un
    enlace; lo anota `contenido.js` en el momento del click derecho.
- **`interpretar.mjs`** saca del texto la fecha y el plazo, y nada más. Acepta
  `14/10/2026`, `14/1/2026`, «14 de octubre de 2026», la fecha entera en letras
  y «cinco (5) días».
- **El caso viaja** de `fondo.js` al panel por `chrome.storage.session`, y del
  panel a la pantalla en el `#`, que no sale en ningún pedido.

## Instalarla

`chrome://extensions` → Modo de desarrollador → **Cargar descomprimida** → esta
carpeta. El atajo es **Alt+Mayús+T**. Viaja entre máquinas con el repositorio
(`sync.bat`): después de traer cambios, la flecha de recargar en
`chrome://extensions` y F5 en las pestañas del PJN.

Para probar un cambio de `calculadoras/panel.html` antes de publicarlo, ver
`config.js`.
