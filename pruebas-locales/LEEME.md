# Pruebas locales

Carpeta de trabajo para probar las herramientas del repositorio con documentos
propios. **Nada de lo que pongas acá se versiona ni se publica.**

El `.gitignore` ignora el contenido entero de esta carpeta y deja versionado
sólo este archivo, para que la carpeta exista en cualquier copia del
repositorio y se entienda para qué es. Si mañana `git status` te muestra algo
de acá adentro, algo se rompió: avisá antes de commitear.

Tampoco se publica en el sitio: `pages.yml` arma `site/` con una lista
explícita de lo que entra, y esta carpeta no está en esa lista.

## Para qué

Para dejar a mano los PDF con los que probás —resoluciones, escritos,
expedientes— sin tener que ir a buscarlos cada vez y sin riesgo de que se
cuelen en un commit. Lo que hay acá es material de trabajo real: lleva nombres
de partes y de profesionales, y no tiene por qué salir de tu disco.

## Cómo se usa

Las herramientas del repositorio corren en el navegador y abren los archivos
con el diálogo del sistema, así que no importa dónde estén: esta carpeta es
sólo un lugar cómodo y seguro para tenerlos.

Para levantar el sitio local y probar:

    python -m http.server 4180

Y entrar a <http://localhost:4180/escribiente/>.
