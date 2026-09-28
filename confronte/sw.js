// ESCRITO POR scripts/traer-confronte.mjs. No se edita a mano: se regenera
// con cada copia, porque la lista de archivos sale de lo que se trajo y el
// nombre del cache del commit de origen.
//
// Hace una sola cosa: que la pagina abra sin conexion. No ve el texto del
// expediente --eso no sale nunca de la pagina-- y no manda nada a ningun lado.
// Es el mismo esquema que el de Escribiente, y sus tres decisiones: se cachea
// de a uno, se borran las versiones viejas, y se sirve del cache revalidando
// por atras para que una correccion publicada llegue en la visita siguiente.

const CACHE = 'confronte-ba529bf8413e';

const ARCHIVOS = [
    "./",
    "ejemplos/ejemplos.js",
    "index.html",
    "motor/checklist.js",
    "motor/confrontar.js",
    "motor/cotejo.js",
    "motor/cuentas.js",
    "motor/difflib.js",
    "motor/formas.js",
    "motor/py.js",
    "motor/unicode.js",
    "motor/zonas.js",
    "ui/app.css",
    "ui/app.js",
    "manifest.json",
    "icono-192.png",
    "sitio.css",
    "sitio.js",
    "../calculadoras/css/comun.css",
    "../assets/tema.js"
];

self.addEventListener('install', (evento) => {
    evento.waitUntil((async () => {
        const c = await caches.open(CACHE);
        await Promise.all(ARCHIVOS.map(async (url) => {
            try {
                await c.add(new Request(url, { cache: 'reload' }));
            } catch (e) {
                console.warn('[confronte sw] no se pudo cachear', url, e);
            }
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil((async () => {
        for (const nombre of await caches.keys()) {
            if (nombre !== CACHE && nombre.startsWith('confronte-')) await caches.delete(nombre);
        }
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (evento) => {
    const pedido = evento.request;
    if (pedido.method !== 'GET') return;
    if (new URL(pedido.url).origin !== self.location.origin) return;

    evento.respondWith((async () => {
        const c = await caches.open(CACHE);
        const guardado = await c.match(pedido, { ignoreSearch: true });
        const desdeLaRed = fetch(pedido).then((respuesta) => {
            if (respuesta && respuesta.ok) c.put(pedido, respuesta.clone());
            return respuesta;
        }).catch(() => null);
        const respuesta = guardado || await desdeLaRed;
        return respuesta || new Response(
            'Confronte no esta en el cache y no hay conexion.',
            { status: 504, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
    })());
});
