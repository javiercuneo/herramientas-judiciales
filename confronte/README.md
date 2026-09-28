# Confronte

Controla un testimonio, un oficio o un mandamiento contra los autos del
expediente: marca lo que no coincide y propone el documento corregido, palmo a
palmo con el original. Cada corrección es una propuesta, que se acepta o se
descarta con un clic.

Corre entera en el navegador. La página declara `connect-src 'none'`: tiene
prohibido abrir conexiones de red, así que el texto del expediente no sale de
la computadora. Funciona sin internet.

Publicada en <https://javiercuneo.com.ar/confronte/>.

## Esta carpeta es una copia

El código se escribe en otro repositorio, privado. Acá llega **sin
comentarios**, con `npm run traer-confronte`, que antes de copiar corre sobre
la copia las pruebas de allá y compara los ejemplos. `ORIGEN.json` dice de qué
commit salió. **No se edita a mano**: `index.html`, `ui/`, `motor/`,
`ejemplos/` y `sw.js` se pisan en la próxima copia.

Lo propio del sitio sí vive acá y se edita acá: `sitio.css` (los colores del
sitio y el tema oscuro), `sitio.js` (el enlace de vuelta y el service worker),
`manifest.json` y los íconos, que arma `npm run imagenes`.
