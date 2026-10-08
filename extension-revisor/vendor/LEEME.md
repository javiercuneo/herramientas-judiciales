# Librerías de terceros

Copiadas acá, versionadas, para que la extensión no dependa de la red ni de un
build. Ninguna se modificó, con una excepción en el diccionario.

**A `es.dic` se le quitaron tres palabras comunes** (y el contador de la primera
línea bajó de 57344 a 57341). Contienen, como pedazo, un término de la lista
privada del control de datos, que busca coincidencias parciales y no deja
entrar el archivo; el control no se saltea. Si alguna aparece marcada en un
proveído, «Es correcta» la suma a la lista personal, que no está en el
repositorio. Al actualizar el diccionario hay que repetir el recorte: el
control dice dónde.

| Archivo | Qué es | Versión | Licencia |
|---|---|---|---|
| `pdf.min.js`, `pdf.worker.min.js` | pdf.js, de Mozilla: lee el PDF y dibuja sus páginas | 3.11.174 | Apache 2.0, en la cabecera de cada archivo. Es la misma copia que `escribiente/vendor/` |
| `nspell.mjs` | nspell, el corrector que entiende diccionarios Hunspell | 2.1.5 | MIT: [`LICENCIA-nspell.txt`](LICENCIA-nspell.txt). Incluye `is-buffer` 2.0.5, MIT: [`LICENCIA-is-buffer.txt`](LICENCIA-is-buffer.txt) |
| `es.aff`, `es.dic` | El diccionario español de LibreOffice, tal como lo publica el paquete `dictionary-es` | 4.0.0 (diccionario 2.8) | Triple licencia GPL 3 / LGPL 3 / MPL 1.1, a elección. **Se usa bajo MPL 1.1**, que permite distribuirlo junto a código con otra licencia mientras estos dos archivos sigan bajo la suya: [`LICENCIA-diccionario-es.txt`](LICENCIA-diccionario-es.txt) |

## De dónde sale `nspell.mjs`

nspell se publica como módulo CommonJS, que el navegador no carga. Se empaquetó
una sola vez a un módulo ES, sin minificar y sin tocar el código, con el
`esbuild` que el repositorio ya tiene como dependencia de desarrollo:

```bash
npm install --ignore-scripts nspell@2.1.5     # en una carpeta aparte
npx esbuild node_modules/nspell/lib/index.js --bundle --format=esm --platform=browser --outfile=nspell.mjs --legal-comments=inline
```

Si se actualiza, se repite eso y se corre `npm run verificar-revisor`.
