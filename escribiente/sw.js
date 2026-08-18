// ---------------------------------------------------------------------------
// Service worker de Escribiente.
//
// Hace una sola cosa: que la herramienta abra sin conexion. No toca el PDF —el
// documento nunca pasa por aca, se lee con FileReader dentro de la pagina— y no
// manda nada a ningun lado.
//
// TRES ERRORES DEL ANTERIOR, QUE ESTE NO REPITE:
//
//   1. `cache.addAll([...])` con la lista entera. Si UNA sola URL falla, la
//      promesa se rechaza y no se cachea NADA, sin ningun aviso. El anterior
//      pedia tres archivos a cdnjs.cloudflare.com; bastaba con que uno no
//      respondiera para que la instalacion fallara entera y la aplicacion
//      quedara sin funcionamiento sin conexion, mostrando igual el cartel
//      "OFFLINE" en la barra lateral. Aca se cachea de a uno y lo que falla se
//      anota sin voltear el resto.
//
//   2. No borraba las versiones viejas. El nombre del cache subia de v1 a v3 y
//      los tres quedaban ocupando lugar para siempre.
//
//   3. Servia siempre desde el cache, primero y sin revalidar. Con eso, una
//      correccion publicada no le llegaba nunca a quien ya habia entrado: se
//      quedaba con la version rota hasta que vaciara el navegador a mano. Para
//      una herramienta que se arreglo justamente por fallar callada, es el peor
//      modo posible. Ahora se sirve del cache y se revalida por atras: se ve al
//      instante, y la correccion entra en la visita siguiente.
// ---------------------------------------------------------------------------

const CACHE = 'escribiente-v1';

const ARCHIVOS = [
    './',
    'index.html',
    'manifest.json',
    'css/escribiente.css',
    'js/app.js',
    'js/motor/extraer.js',
    'js/motor/markdown.js',
    'js/motor/anonimizar.js',
    'js/motor/documento.js',
    'js/motor/pdf.js',
    'vendor/pdf.min.js',
    'vendor/pdf.worker.min.js',
    'vendor/pdf-lib.min.js',
    // Compartidos con el resto del sitio. Estan fuera del alcance del service
    // worker, pero el alcance limita que PAGINAS controla, no que pedidos ve:
    // una pagina controlada le pasa todos sus pedidos, tambien los de afuera.
    '../calculadoras/css/comun.css',
    '../assets/tema.js',
];

self.addEventListener('install', (evento) => {
    evento.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        // De a uno y tolerante: un archivo que no este no puede dejar a la
        // herramienta entera sin cache.
        await Promise.all(ARCHIVOS.map(async (url) => {
            try {
                await cache.add(new Request(url, { cache: 'reload' }));
            } catch (e) {
                console.warn('[escribiente sw] no se pudo cachear', url, e);
            }
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil((async () => {
        for (const nombre of await caches.keys()) {
            if (nombre !== CACHE && nombre.startsWith('escribiente-')) await caches.delete(nombre);
            // El cache de la herramienta anterior, que quedo en los navegadores
            // de quien la haya abierto alguna vez.
            if (nombre.startsWith('pdf-studio-')) await caches.delete(nombre);
        }
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (evento) => {
    const pedido = evento.request;
    if (pedido.method !== 'GET') return;
    if (new URL(pedido.url).origin !== self.location.origin) return;

    evento.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const guardado = await cache.match(pedido, { ignoreSearch: true });

        const desdeLaRed = fetch(pedido).then((respuesta) => {
            if (respuesta && respuesta.ok) cache.put(pedido, respuesta.clone());
            return respuesta;
        }).catch(() => null);

        // Del cache si esta —la revalidacion sigue corriendo por atras— y de la
        // red si no. Si no hay ninguna de las dos, se devuelve un 504 propio en
        // vez de dejar que el navegador muestre su pantalla de error: al menos
        // dice que paso.
        const respuesta = guardado || await desdeLaRed;
        return respuesta || new Response(
            'Escribiente no esta en el cache y no hay conexion.',
            { status: 504, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
    })());
});
