# Escribiente

Pasa escritos, resoluciones y expedientes en PDF a Markdown, y anonimiza los
datos personales antes de que el texto salga del expediente.

Nace de un problema concreto: tengo el documento en PDF y lo necesito en texto
—para citarlo, para compartir un fragmento, para archivarlo liviano sin las
cuarenta capas de un PDF del sistema de gestión— y no puedo hacer nada de eso
llevándome puestos los nombres de las partes.

**Todo corre dentro del navegador.** El documento no se sube a ningún servidor,
no hay backend, y no existe la posibilidad de que lo haya: ver
[Cómo se sostiene esa promesa](#cómo-se-sostiene-esa-promesa).

Publicado en <https://javiercuneo.com.ar/escribiente/>.

---

## Qué hace

**Convertir a Markdown.** Reconstruye líneas y párrafos desde las coordenadas
del PDF, une palabras cortadas por el margen, detecta columnas, marca títulos,
y saca el ruido: membretes repetidos, numeración de páginas, sellos y los
códigos del sistema de gestión (`#12345#`).

**Anonimizar, en dos niveles.** El primero es automático y reemplaza lo que
tiene forma inequívoca —DNI, CUIT, CBU, CVU, teléfonos, correos, expedientes,
matrícula tomo/folio, domicilios, patentes, y el nombre de quien firma
conservando el cargo—, más **los campos de formulario**, donde la etiqueta hace
inequívoco lo que sigue: `Apellidos:`, `Nombres:`, `Domicilio:`, `Fecha Nac:`,
`Matrícula N°:`. Ahí es donde vienen las fichas de identidad adjuntas a un
expediente, que es lo más sensible que pasa por la herramienta. El segundo son **los nombres propios, que se te
muestran para que decidas uno por uno**, con la cantidad de apariciones y una
etiqueta a elegir (`[ACTOR]`, `[DEMANDADO]`, `[PERITO]`...). **Vienen sin
tildar**, salvo las dos partes de la carátula: una casilla tildada de fábrica no
es una pregunta, y lo que se ofrece son candidatos, no certezas. Los que dejes
sin tildar quedan en el texto y la constancia los nombra.

Ese segundo nivel no es una comodidad, es el diseño. Ninguna regla puede
distinguir sola `Pérez, Juan Carlos` —la parte, hay que ocultarla— de
`Llambías, Jorge Joaquín` —doctrina, hay que conservarla— ni de
`Buenos Aires, Astrea`, que es una editorial. Reemplazar por adivinanza corrompe
el texto; no reemplazar filtra. Preguntar es lo correcto, y son treinta segundos
de casillas.

**Rechazar lo que no puede trabajar.** Un PDF que es una imagen pura no tiene
texto que extraer. Se rechaza con el motivo y la cuenta de caracteres por
página, en vez de devolver un `.md` vacío. Y si el documento tiene texto pero
con **fojas escaneadas intercaladas** —lo normal en un expediente digitalizado
por partes— se procesa igual y se avisa **qué fojas salieron en blanco**, tanto
en pantalla como al pie del archivo.

**Unir, separar y rotar** PDF, con los errores dichos: qué archivo falló, si
estaba protegido con contraseña, y qué páginas del rango pedido no existían.

**Certificar una resolución firmada.** La pestaña «Certificar» arma el texto
de la certificación y un código QR que lleva al enlace público del PJN de la
resolución. Se pega el enlace —el de ver o el de descarga, da igual: con uno se
arma el otro—, se suelta el PDF que se acaba de bajar para contar las páginas,
se pegan los autos y se completa el resto. Lo que queda vacío va entre
corchetes, a la vista. **No genera ni modifica ningún PDF**, y el QR sale del
mismo texto que la certificación dice «Ver:».

**Con más de un documento** —la declaratoria y el auto que la modifica, la
sentencia y la de Cámara— se agrega otro bloque: los autos y el juzgado se
escriben una vez, cada documento va en una línea numerada con sus enlaces, y
cada uno lleva su QR, de 4 cm en vez de 5. La relación entre ellos se escribe
en el tipo («auto que la modifica»), y el resto se retoca en el editor.

Las tres decisiones de fondo están en la cabecera de
[`js/motor/certificar.js`](js/motor/certificar.js): **no lleva huella SHA-256**
—la herramienta no puede bajar el PDF del enlace para comprobar que el que se
suelta sea ése, y quien firma no puede leer un hash; el PDF ya trae su propia
firma digital—, **el QR lleva el enlace y nada más**, y **el enlace no se
reescribe**: se conserva tal cual se pegó.

**La huella SHA-256 y el peso del PDF se muestran, y nada más.** Aparecen debajo
del archivo que se soltó, en grupos de ocho para compararlos a ojo —por
ejemplo, con otra pestaña de Escribiente— y se copian enteros al
seleccionarlos. No van a la certificación ni al QR, y no tienen botón de
copiar: son un dato técnico para quien lo quiera, no algo que se firma.

## Qué no hace

**OCR.** Traer un motor de OCR al navegador son varios megabytes de modelo para
resolver algo que Acrobat, el escáner de la oficina o cualquier herramienta de
escritorio ya resuelven mejor. Escribiente detecta que hace falta y lo dice.

**Garantizar la anonimización.** Es automática y la revisás vos. Un nombre
escrito de una forma que las reglas no contemplan puede quedar. Cada archivo
sale con una constancia al pie que dice qué se reemplazó, cuántas veces y qué
quedó sin ocultar. Antes de mandarlo a un tercero, leelo.

La constancia cuenta **por etiqueta y nunca por nombre**: dice
«nombre propio → `[TESTIGO]`: 4», no cuál era. Un archivo anonimizado que abajo
lista los nombres que sacó no está anonimizado.

---

## Cómo se sostiene esa promesa

Que el documento no salga de la máquina es lo que hace útil a esta herramienta,
y una promesa escrita en una pantalla no vale nada. Acá está apoyada en tres
cosas que se pueden verificar:

1. **Una `Content-Security-Policy` con `connect-src 'none'`**, declarada en el
   `<head>` de [`index.html`](index.html). El navegador le prohíbe a la página
   abrir cualquier conexión: `fetch`, `XMLHttpRequest`, WebSocket y
   `sendBeacon` quedan bloqueados y anotados en la consola. No es una intención
   del código: es el navegador impidiéndolo.

2. **pdf.js y pdf-lib están en [`vendor/`](vendor/)**, versionados dentro del
   repositorio. La versión anterior los pedía a `cdnjs.cloudflare.com` en cada
   uso, o sea que el código que abría el expediente lo servía un tercero, sin
   verificación de integridad. Ahora no hay JavaScript de terceros en la cadena.

3. **No se carga la tipografía del sitio.** El resto de las páginas piden
   Archivo a `fonts.googleapis.com`. Acá no: sería contarle a Google que alguien
   abrió el anonimizador, y obligaría a agujerear el punto 1. La fuente cae en
   la del sistema y la diferencia se nota poco.

## Cómo está hecho

Sin build, sin bundler y sin dependencias en tiempo de ejecución. Se abre, se
edita y se guarda, igual que las calculadoras del repositorio.

```
index.html          marcado y la CSP
css/escribiente.css layout propio; los colores y controles salen de
                      ../calculadoras/css/comun.css, el sistema visual del sitio
js/app.js           la pantalla: conecta controles con el motor, y nada mas
js/motor/           el motor, codigo puro y con pruebas
  extraer.js          lectura del PDF y diagnostico de OCR
  markdown.js         de los fragmentos de pdf.js al Markdown
  anonimizar.js       las reglas y los candidatos a nombre propio
  documento.js        armado del .md y su constancia
  pdf.js              unir, separar, rotar, y el analisis de rangos
  certificar.js       el enlace del PJN, el texto de la certificacion y el QR
js/certificar.js    la pantalla de la pestania Certificar
vendor/             pdf.js 3.11.174, pdf-lib 1.17.1 y qrcode-generator 1.4.4
sw.js               funcionamiento sin conexion
icono-*.png         generados por codigo, no dibujados
```

El motor no toca el DOM, así que corre igual en Node. De ahí que se pueda
probar:

```bash
npm run verificar-escribiente
```

Son 376 comprobaciones sobre el motor, e incluyen como regresión los seis bugs
que tenía la versión anterior —o que aparecieron al probar esta contra PDF
reales—. Corre en CI antes de publicar.

Para levantarlo local alcanza cualquier servidor estático **desde la raíz del
repositorio**, porque la hoja de estilos compartida y el interruptor de tema
están en `../`:

```bash
python -m http.server 4180
```

Y después entrar a <http://localhost:4180/escribiente/>.

## De dónde salen las reglas de anonimización

De otra herramienta propia, anterior a esta y fuera de este repositorio, donde
llevan tiempo en uso. Los comentarios de cada regla vinieron con ellas y **no
son decoración**: cada uno anota una fuga o una corrupción de texto que
efectivamente pasó. Casi todos los patrones parecen mejorables hasta que se
entiende qué evitan.

Tres cosas se corrigieron al portarlas:

- el orden de las dos reglas de expediente estaba invertido, y dejaba
  `Expte. 56.[EXPTE]` con los primeros dígitos a la vista;
- el patrón de DNI solo se protegía del signo `$`, así que
  `la suma de 1.500.000` se convertía en `[DNI]`;
- el patrón de email se comía el punto final de la oración.

## Lo que queda abierto

**Acá y no en `docs/ESTADO.md`**, que es el documento de continuidad del
repositorio entero y se lee completo en cada sesión: los pendientes de esta
herramienta los busca quien la viene a tocar, y ése ya está parado en esta
carpeta. Allá queda un puntero y lo que un agente necesita saber sin entrar acá
—la promesa de privacidad y el anonimizador hermano—.

**Ninguno es bloqueante.** La mayoría salió de pasar un documento largo el
21/8, que además destapó varias fugas ya arregladas; esa crónica está en
[`docs/HISTORIA.md`](../docs/HISTORIA.md).

- **Un nombre que el OCR ensució se reemplaza desde el 17/9, si hay tratamiento
  que ancle.** `Sr. Qu1nteros` salía como `Sr. [PERSONA]1nteros` —el pedazo limpio
  reemplazado, el resto en claro **y la constancia contándolo como reemplazado**—.
  Era **E-05**, y está cerrado: el patrón de nombre acepta dígitos adentro de la
  palabra, nunca al principio ni al final. Hasta el 16/9 acá decía que «no lo
  agarra nada» y que «no tiene arreglo por patrón»: las dos cosas estaban mal, y
  por qué está en [`docs/PLAN_MOTOR_UNICO.md`](../docs/PLAN_MOTOR_UNICO.md).
  **Queda abierta la mitad angosta**: sin tratamiento que ancle —`Dr.`, `Sr.`— no
  hay arreglo por patrón, y tampoco lo hay cuando el OCR ensucia la **primera**
  letra (`0campo`). En los dos casos lo que quedó pegado a la etiqueta se ofrece
  para tildar y se nombra en la constancia, así que la fuga se ve.
- **La numeración de etiquetas es por tanda, no por causa.** Con
  «Numerar las etiquetas» prendido cada nombre se lleva un número propio
  —`[PERSONA_1]`, `[PERSONA_2]`— y **el mismo nombre se lleva el mismo número en
  todos los archivos que pases sin cerrar la pestaña**, que es lo que permite
  cruzar un testimonio con la resolución que lo transcribe. La correspondencia
  entre nombre y número **no se guarda en ningún lado**: vive en memoria y se
  pierde al recargar. Es a propósito —una tabla de nombre a número guardada es
  la llave para deshacer la anonimización—, y por eso, si hay que cruzar dos
  archivos, se pasan juntos. Era **E-03**, decidido el 17/9.
- **Numerado, no todo lo tapado lleva número.** Las reglas que tapan solas —la
  firma, el tratamiento, los campos de formulario— ocultan nombres sin que nadie
  diga de quién son, así que salen como `[PERSONA]` pelado. Dos `[PERSONA]` no
  son la misma persona, ni siquiera dentro del mismo archivo, y no se comparan
  entre archivos. La constancia del `.md` lo dice.
- **El domicilio del propio juzgado también se reemplaza**, y se decidió dejarlo
  así: la regla que lo agarra es la misma que agarra el domicilio de una parte
  escrito igual, y separarlas pediría una lista de direcciones de tribunales.
  Sobre-ocultar sale más barato que esa lista.
- **Un DNI y un monto son el mismo número**, y lo único que los distingue es el
  contexto: hoy se excluye lo que venga con `$`, con decimales, o precedido de
  «pesos», «suma de», «importe de», «valor de», «monto de». Un monto escrito de
  otra manera todavía puede salir como `[DNI]`, y **se eligió que el falso
  positivo sea visible** —queda en el texto y en la constancia— antes que dejar
  pasar un documento.
- **Una página que es un escaneo sin OCR sale en blanco.** El aviso las lista
  una por una y dice que lo que decían no está en el archivo, pero conviene
  tenerlo presente al leer una constancia: **de lo que no vio, la anonimización
  no puede decir nada.**
- **El reflujo une por geometría desde el 15/9** —cómo y por qué, en
  [`docs/HISTORIA.md`](../docs/HISTORIA.md)—, y **lo que no se probó es texto sin
  justificar**: ahí un renglón cortado puede quedar lejos del margen y entonces
  no se une, como antes. Si aparece un párrafo pegado a un título, la guarda está
  en `continuaElParrafo`.
- **Lo que ninguna regla ofrece se agrega a mano**, debajo de la lista, y entra
  tildado. Es la salida para el cargo que identifica a una persona («la Directora
  General de…»), que **no se tapa solo a propósito**: si es dato personal lo
  decide quien firma, documento por documento.
- **La detección de nombres propios no cubre razones sociales.** «Seguros del Sur
  S.A.» no dispara ningún patrón de los tres, así que no se ofrece como candidato
  y hay que agregarla a mano.
- **Las fugas que aparecen al usarlo se anotan en otro repositorio.** Desde el
  12/9, `redactor` ingresa casos con el anonimizador del pipeline, y cada nombre
  que el operador tiene que tapar a mano queda en
  el `FUGAS-ANONIMIZADOR.md` del repositorio del pipeline: la forma del nombre y las palabras de
  alrededor, sin el nombre ni el texto. **Cada entrada vale también para
  `js/motor/anonimizar.js`**: las reglas son otras, pero los huecos suelen ser
  los mismos. No se copian acá porque este repositorio es público.

### Los bugs abiertos que reportó `confronteitor`

Salieron el 16/9 de pasar nueve testimonios reales, y están escritos con su caso
de prueba en [`docs/ESTADO.md`](../docs/ESTADO.md), que es donde se miran al
empezar una sesión. En una línea cada uno:

- **E-01 · un nombre de varios tokens puede quedar a medias**, y la constancia no
  lo cuenta, así que el archivo se lee como limpio. Es el grave.
- **E-02 · la lista de candidatos trae más ruido que señal**, y una lista así se
  tilda en diagonal, que es donde se escapa E-01.
- **E-03 · etiquetas numeradas y estables entre documentos**, para poder cruzar
  dos archivos anonimizados por separado. Es un pedido, no un bug.

## Licencia

MIT, como todo lo demás del repositorio.
