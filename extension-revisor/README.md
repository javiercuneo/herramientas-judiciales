# Revisor de ortografía de proveídos

Una extensión de Chrome que, apenas se abre un proveído en el sistema de
gestión, muestra arriba a la derecha un recuadro con los posibles errores de
ortografía: **«2 posibles errores: resuevlo, notifiquse»**, con unas palabras
de contexto de cada uno, o **«Sin errores detectados»** en verde. No hay que
copiar, pegar ni hacer clic.

El visor de PDF de Chrome no deja que ninguna extensión escriba adentro. Por
eso el aviso va en un recuadro propio, y para ver los errores sobre el
documento está el botón **«Ver con subrayado»**, que dibuja el PDF a pantalla
completa con cada palabra subrayada en rojo. **«Volver»** lo cierra.

## Qué hace, paso a paso

1. En las páginas `https://sgj-docs.pjn.gov.ar/despacho/<número>/view` espera a
   que aparezca el PDF del proveído.
2. Lee el PDF desde la memoria del navegador —es el mismo que la página ya
   bajó— y saca su texto con pdf.js.
3. Lo revisa con el diccionario español de LibreOffice, más una lista de
   palabras del fuero (`datos/fuero.txt`: latinismos, siglas, abreviaturas) y
   las que cada uno marcó como correctas.
4. Muestra el resultado.

**Cómo decide.** Una palabra en minúscula se revisa estricto: «resolucion» sin
tilde se marca. Una con mayúscula se presume nombre propio o sigla y se marca
sólo si es larga y a una letra de distancia hay una palabra común: «Resuevlo»
sí (resuelvo), «Rodriguez» o «MENGANEZ» no. Las palabras cortadas con guion a
fin de renglón se unen antes de revisarlas. **La carátula no se revisa**: el renglón
con «c/» y «s/» (o la sucesión, «X s/ SUCESIÓN»), y la que va entre comillas
en medio del texto. Son casi todos apellidos, y daban falsas alarmas. Los verbos con pronombre pegado
(«notifíquese», «hágasele») se aceptan si llevan la tilde en su lugar.

**«Es correcta»** guarda esa palabra para no volver a marcarla. Se guarda la
palabra sola, en esta computadora (`chrome.storage.local`), nunca el texto
que la rodea.

## Cómo instalarla

1. Copiar la carpeta `extension-revisor` entera a la computadora (por ejemplo,
   a `Documentos\extension-revisor`).
2. En Chrome, abrir `chrome://extensions`.
3. Arriba a la derecha, activar **Modo de desarrollador**.
4. Botón **Cargar descomprimida** y elegir la carpeta `extension-revisor`.
5. Abrir un proveído. El recuadro aparece solo.

Para actualizarla: reemplazar la carpeta y apretar el botón de recargar (la
flecha circular) en la tarjeta de la extensión, en `chrome://extensions`.

> **En la computadora del juzgado** puede que informática tenga bloqueado el
> modo de desarrollador o la instalación de extensiones. Si el interruptor no
> aparece o está gris, no hay forma de esquivarlo desde Chrome: hay que
> pedírselo a informática.

## Qué permisos pide, y por qué

| Permiso | Para qué |
|---|---|
| Leer y cambiar datos en `sgj-docs.pjn.gov.ar` | Es el único sitio. Hace falta para ver el PDF del proveído y poner el recuadro encima. En ningún otro sitio hace nada |
| `storage` | Guardar la lista de palabras marcadas como correctas |

No pide acceso a otros sitios, ni a las pestañas, ni al historial, ni a las
descargas.

## Qué NO hace

- **No se conecta a ningún servidor.** El diccionario viaja dentro de la
  extensión, la página del recuadro tiene prohibido conectarse afuera
  (`default-src 'self'`), y la prueba automática verifica que no sale ningún
  pedido a la red.
- **No guarda el texto de ningún proveído**, en ningún lado. El texto vive en
  la memoria del recuadro mientras la página está abierta.
- **No toca el sistema.** No hace clics, no completa campos, no envía nada y no
  cambia lo que el sistema guarda. Sólo lee el PDF y muestra el recuadro.
- **No corrige gramática ni estilo.** Sólo ortografía, palabra por palabra:
  «la demanda fueron» no lo ve. Una palabra bien escrita pero equivocada
  («cause» por «causa») tampoco.
- **No lee un PDF escaneado.** Si el PDF es una imagen, lo dice.

## Archivos

| Archivo | Qué es |
|---|---|
| `manifest.json` | La declaración de la extensión: sitio, permisos, política de seguridad |
| `contenido.js` | Corre en la página del sistema: encuentra el PDF, lo lee y pone el recuadro |
| `panel.html`, `panel.js`, `panel.css` | El recuadro: revisa y muestra |
| `subrayado.mjs`, `subrayado.css` | La vista con subrayado |
| `cargar.mjs` | Arma el corrector con el diccionario y las listas |
| `motor/revisar.mjs` | El criterio de qué se marca. Código puro: corre también en Node |
| `datos/fuero.txt` | Las palabras del fuero. Se edita a mano |
| `vendor/` | pdf.js, nspell y el diccionario, con sus licencias ([`vendor/LEEME.md`](vendor/LEEME.md)) |
| `pruebas/` | Una página que imita la del sistema, con un PDF inventado que se arma en el momento |

## Pruebas

```bash
npm run verificar-revisor
```

Corre el criterio sobre un proveído inventado con cuatro errores sembrados y
exige que marque esos cuatro y ninguno más. Después abre Chrome con la
extensión, en un perfil descartable, sirve la página de imitación en la
dirección del sistema, interceptándola —no sale nada a la red— y verifica
el recuadro, la vista con subrayado, «Es correcta» y que no hubo ningún pedido
a la red. Necesita Chrome instalado; sin él corre sólo la primera parte y lo
dice.
