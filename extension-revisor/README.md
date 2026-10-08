# Revisor de ortografía de proveídos

Una extensión de Chrome que revisa la ortografía de un proveído apenas se
abre en el sistema de gestión, y **subraya en rojo sobre el mismo documento**
las palabras sospechosas. No hay que copiar, pegar ni hacer clic.

**Hace el menor ruido posible:**

- **Si no encuentra nada, no se ve.** Queda el visor de PDF de siempre.
- **Si encuentra algo**, el PDF se ve igual pero con esas palabras subrayadas.
  El visor de Chrome no deja que ninguna extensión escriba adentro, así que la
  extensión dibuja el documento ella misma, en el mismo lugar y del mismo
  tamaño.
- **Clic en una palabra subrayada**: al lado aparece la sugerencia («¿resuelvo?»)
  y **«Es correcta»**, que la suma al diccionario y le saca el subrayado.
- **El ícono de la extensión** (la R de la barra de Chrome) muestra en rojo
  cuántos posibles errores hay. Clic en el ícono, o **Alt+Mayús+R**, abre el
  recuadro con la lista, el contexto de cada palabra y **«Ver PDF original»**,
  que saca el subrayado y deja el visor de Chrome —para imprimir o bajar el
  archivo—. La × lo vuelve a ocultar.

**Sólo revisa proveídos.** Un escrito de un letrado no se le corrige a nadie.
Un proveído arranca siempre igual: el escudo, «Poder Judicial de la Nación» y
«JUZGADO …» en dos renglones, y enseguida el número de expediente
(NNNNN/NNNN). Si el PDF no arranca así, la extensión no hace nada; desde el
recuadro, **«Revisar igual»** lo revisa si hace falta. Se mira el texto y no
el escudo: el texto alcanza, y el escudo puede no venir como imagen.

## Qué hace, paso a paso

1. En las páginas `https://sgj-docs.pjn.gov.ar/despacho/<número>/view` espera a
   que aparezca el PDF del proveído.
2. Lee el PDF desde la memoria del navegador —es el mismo que la página ya
   bajó— y saca su texto con pdf.js.
3. Lo revisa con el diccionario español de LibreOffice, más una lista de
   palabras del fuero (`datos/fuero.txt`: latinismos, siglas, abreviaturas) y
   las que cada uno marcó como correctas.
4. Si es un proveído, lo revisa y subraya; si no, no hace nada.

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
5. Abrir un proveído. Si tiene algún posible error, aparece subrayado.
6. Para tener el ícono a mano: en la barra de Chrome, la pieza de
   rompecabezas → el alfiler al lado de «Revisor de ortografía de proveídos».
   Si Alt+Mayús+R no anda (otro programa usa esa combinación), se cambia en
   `chrome://extensions/shortcuts`.

Para actualizarla: reemplazar la carpeta y apretar el botón de recargar (la
flecha circular) en la tarjeta de la extensión, en `chrome://extensions`.

**Cómo llevarla a otra computadora.** Chrome la lee de la carpeta cada vez
que arranca, así que la carpeta tiene que quedar en su lugar: no se borra
después de cargarla. Dos caminos:

- **En un pendrive**: copiar la carpeta `extension-revisor` a
  `Documentos` y cargarla desde ahí, no desde el pendrive.
- **Desde GitHub**, si el pendrive está bloqueado: en
  `github.com/javiercuneo/herramientas-judiciales`, botón **Code → Download
  ZIP**. Baja el repositorio entero; se descomprime y se usa sólo la carpeta
  `extension-revisor`.

> **En la computadora del juzgado** puede que informática tenga bloqueado el
> modo de desarrollador o la instalación de extensiones. Para saberlo antes de
> copiar nada: abrir `chrome://extensions` y mirar si está el interruptor
> **Modo de desarrollador**. Si no aparece o está gris, no hay forma de
> esquivarlo desde Chrome: hay que pedírselo a informática.

## Qué permisos pide, y por qué

| Permiso | Para qué |
|---|---|
| Leer y cambiar datos en `sgj-docs.pjn.gov.ar` | Es el único sitio. Hace falta para ver el PDF del proveído y poner el recuadro encima. En ningún otro sitio hace nada |
| `storage` | Guardar la lista de palabras marcadas como correctas |

El ícono en la barra y el atajo de teclado no piden permisos: sólo muestran u
ocultan el recuadro de la pestaña donde se aprietan.

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
- **No revisa lo que no es un proveído**, salvo que se le pida.

## Archivos

| Archivo | Qué es |
|---|---|
| `manifest.json` | La declaración de la extensión: sitio, permisos, política de seguridad |
| `contenido.js` | Corre en la página del sistema: encuentra el PDF, lo lee y pone el recuadro y el subrayado |
| `fondo.js` | El ícono: muestra u oculta el recuadro y lleva la cuenta de errores |
| `panel.html`, `panel.js`, `panel.css` | El recuadro: decide si es un proveído, revisa y lleva la cuenta |
| `vista.html`, `vista.js`, `vista.css`, `subrayado.mjs` | El PDF dibujado con el subrayado, encima del visor de Chrome |
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
el subrayado sobre el visor, el menú de cada palabra, el recuadro, que un
escrito no se revise y que no hubo ningún pedido a la red. Necesita Chrome instalado; sin él corre sólo la primera parte y lo
dice.
