#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Trae la pantalla de confronte al sitio:  npm run traer-confronte
//
// El codigo fuente vive en el repositorio `confronteitor`, que es PRIVADO, y
// este es publico. De alla se trae SOLO lo que el navegador necesita para que
// la pagina ande --index.html, ui/, motor/ y ejemplos/ejemplos.js-- y nada
// mas: ni pruebas, ni memoria del proyecto, ni reglamentos/.
//
// Y SE TRAE SIN COMENTARIOS. Los comentarios de alla son notas de trabajo:
// cuentan de donde salio cada regla, y eso a veces nombra el caso --un
// juzgado, un documento, una fecha--. Aca no sirven para nada, porque el
// codigo no se edita aca, y publicarlos seria publicar esas notas. Se sacan
// con esbuild, que lee el programa entero y lo vuelve a escribir sin ellos;
// a mano o con una expresion regular se rompe cualquier texto que tenga un
// `//` adentro. Asi lo que se escriba alla mañana tampoco sale, sin que nadie
// tenga que acordarse de mirarlo.
//
// COMO SE SABE QUE NO SE ROMPIO NADA: antes de escribir un solo archivo, se
// corren las pruebas del propio confronteitor --las 154 piezas contra la
// referencia, los patrones, el comparador-- sobre la copia YA SIN
// COMENTARIOS. Si alguna falla, no se copia nada.
//
// SE TRAE LO COMMITEADO, NO LO QUE ESTA A MEDIO HACER. Se lee de git (HEAD),
// asi que un cambio sin commitear alla no viaja aunque este en el disco. Si
// hay, se avisa.
//
// Lo que es del sitio y no de confronteitor vive en confronte/ y este script
// no lo toca: sitio.css, sitio.js, manifest.json, los iconos y el README.
// Lo unico que se le agrega a la copia son dos inserciones en index.html para
// cargar esa capa, y el sw.js, que se arma aca porque la lista de archivos
// sale de lo que se trajo. El CSP de la pagina NO se toca: por ahi pasa texto
// de expedientes sin anonimizar, y `connect-src 'none'` es la promesa.
//
// De donde leer:  git config rutas.confronteitor  (por defecto ../confronteitor)
// ---------------------------------------------------------------------------

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { transform } from 'esbuild';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DESTINO = path.join(RAIZ, 'confronte');
const LO_QUE_SE_TRAE = ['index.html', 'ui', 'motor', 'ejemplos/ejemplos.js'];

function fallar(msg) {
    console.error('\nNo se trajo nada. ' + msg);
    process.exit(1);
}

function git(dir, args, opciones = {}) {
    return execFileSync('git', ['-C', dir, ...args], { maxBuffer: 64 * 1024 * 1024, ...opciones });
}

// ------------------------------------------------------------- de donde
let origen;
try {
    origen = git(RAIZ, ['config', 'rutas.confronteitor'], { encoding: 'utf8' }).trim();
} catch {
    origen = path.join(RAIZ, '..', 'confronteitor');
}
if (!fs.existsSync(path.join(origen, '.git'))) {
    fallar('No encuentro el repositorio de confronteitor en ' + origen +
        '. Decime donde esta con: git config rutas.confronteitor <ruta>');
}

const commit = git(origen, ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const fecha = git(origen, ['log', '-1', '--format=%cI'], { encoding: 'utf8' }).trim();
const sinCommitear = git(origen, ['status', '--porcelain', '--', ...LO_QUE_SE_TRAE], { encoding: 'utf8' }).trim();
if (sinCommitear) {
    console.warn('Aviso: en confronteitor hay cambios sin commitear que NO viajan:\n' +
        sinCommitear.split('\n').map((l) => '  ' + l).join('\n') + '\n');
}

function listar(rutas) {
    return git(origen, ['ls-tree', '-r', '--name-only', 'HEAD', '--', ...rutas], { encoding: 'utf8' })
        .split('\n').filter(Boolean);
}

const archivos = listar(LO_QUE_SE_TRAE);
// Las pruebas leen tambien los .md de ejemplos/: van a la carpeta de prueba,
// no al sitio.
const pruebas = listar(['pruebas', 'ejemplos']).filter((a) => !archivos.includes(a));
for (const r of LO_QUE_SE_TRAE) {
    if (!archivos.some((a) => a === r || a.startsWith(r + '/'))) fallar('En confronteitor no esta ' + r + '.');
}

// ------------------------------------------------ armar la copia, aparte
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'confronte-'));
function escribir(base, rel, contenido) {
    const f = path.join(base, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, contenido);
}

async function sinComentarios(rel, contenido) {
    const texto = contenido.toString('utf8');
    if (rel.endsWith('.js') || rel.endsWith('.css')) {
        // Dos pasadas, y la primera no sobra: sin compactar, esbuild CONSERVA
        // los comentarios que estan adentro de una lista o de un argumento
        // --se probo: salio una nota de zonas.js--. Compactar el espacio los
        // borra todos y no toca nada mas (no renombra ni reescribe). La
        // segunda pasada lo vuelve a escribir legible.
        const opciones = { loader: rel.endsWith('.js') ? 'js' : 'css', legalComments: 'none', charset: 'utf8' };
        const compacto = await transform(texto, { ...opciones, minifyWhitespace: true });
        // La segunda pasada marca cada `new Set()` con /* @__PURE__ */, una
        // anotacion para empaquetadores que aca no sirve y ensucia.
        return (await transform(compacto.code, opciones)).code.replaceAll('/* @__PURE__ */ ', '');
    }
    if (rel.endsWith('.html')) return texto.replace(/<!--[\s\S]*?-->\s*\n?/g, '');
    return contenido;
}

// ejemplos.js es la excepcion: una prueba de alla lo compara LETRA POR LETRA
// con lo que genera ejemplos/armar.js, y sin comentarios cambia la forma
// aunque no el contenido. A la carpeta de prueba va el original, y lo que se
// publica se compara aparte, por contenido, abajo.
const EJEMPLOS = 'ejemplos/ejemplos.js';
const copia = {};
const originales = {};
for (const rel of archivos) {
    originales[rel] = git(origen, ['show', 'HEAD:' + rel]);
    copia[rel] = await sinComentarios(rel, originales[rel]);
    escribir(tmp, rel, rel === EJEMPLOS ? originales[rel] : copia[rel]);
}
for (const rel of pruebas) escribir(tmp, rel, git(origen, ['show', 'HEAD:' + rel]));

// Los ejemplos que se publican tienen que decir exactamente lo mismo que los
// de alla: se cargan los dos y se comparan los textos.
function cargarEjemplos(codigo) {
    const m = { exports: {} };
    new Function('module', 'globalThis', codigo)(m, {});
    return JSON.stringify(m.exports);
}
if (cargarEjemplos(originales[EJEMPLOS].toString('utf8')) !== cargarEjemplos(copia[EJEMPLOS])) {
    fallar('ejemplos.js sin comentarios no dice lo mismo que el original.');
}

// ------------------------------------------ las pruebas, sobre la copia
console.log('Pruebas de confronteitor sobre la copia sin comentarios:');
const r = spawnSync(process.execPath, [path.join(tmp, 'pruebas', 'probar.js')], { cwd: tmp, encoding: 'utf8' });
console.log((r.stdout + r.stderr).trim().split('\n').map((l) => '  ' + l).join('\n'));
if (r.status !== 0) fallar('Las pruebas fallan sobre la copia sin comentarios: la copia en ' + tmp + ' queda para mirar.');

// ---------------------------------------------- la promesa, comprobada
let html = copia['index.html'];
const csp = (html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/) || [])[1] || '';
if (!/connect-src 'none'/.test(csp) || !/default-src 'none'/.test(csp)) {
    fallar("index.html ya no trae connect-src 'none' y default-src 'none' en su CSP. " +
        'Esa es la promesa de la pagina: no se publica sin ella.');
}

// ------------------------------------------------- la capa del sitio
// Dos inserciones, por ancla exacta. Si el ancla no esta, se para: pegar en
// otro lado a ciegas es como se rompe una pagina sin que nadie lo vea.
const ANCLA_CSS = '<link rel="stylesheet" href="ui/app.css">';
const ANCLA_FIN = '</body>';
if (html.split(ANCLA_CSS).length !== 2) fallar('index.html no tiene una sola vez ' + ANCLA_CSS);
if (html.split(ANCLA_FIN).length !== 2) fallar('index.html no tiene una sola vez ' + ANCLA_FIN);

const DESCRIPCION = 'Controla un testimonio, un oficio o un mandamiento contra los autos del ' +
    'expediente y propone las correcciones. Todo en el navegador: el texto no sale de la computadora.';
html = html.replace(ANCLA_CSS, [
    '<!-- Lo que sigue lo agrega scripts/traer-confronte.mjs: la capa del sitio. -->',
    `<meta name="description" content="${DESCRIPCION}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="Confronte">',
    `<meta property="og:description" content="${DESCRIPCION}">`,
    '<meta property="og:locale" content="es_AR">',
    '<meta property="og:image" content="https://javiercuneo.com.ar/assets/og/confronte.png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="icon" href="icono-192.png" type="image/png">',
    '<link rel="apple-touch-icon" href="icono-192.png">',
    '<meta name="theme-color" content="#1e45ce">',
    '<link rel="manifest" href="manifest.json">',
    '<link rel="stylesheet" href="../calculadoras/css/comun.css">',
    ANCLA_CSS,
    '<link rel="stylesheet" href="sitio.css">',
    '<script src="../assets/tema.js"></script>',
].join('\n'));
html = html.replace(ANCLA_FIN, '<script src="sitio.js"></script>\n' + ANCLA_FIN);
copia['index.html'] = html;

// ------------------------------------------------------- el service worker
const PROPIOS = ['manifest.json', 'icono-192.png', 'sitio.css', 'sitio.js'];
const cache = [ './', ...archivos, ...PROPIOS, '../calculadoras/css/comun.css', '../assets/tema.js' ];
const sw = `// ESCRITO POR scripts/traer-confronte.mjs. No se edita a mano: se regenera
// con cada copia, porque la lista de archivos sale de lo que se trajo y el
// nombre del cache del commit de origen.
//
// Hace una sola cosa: que la pagina abra sin conexion. No ve el texto del
// expediente --eso no sale nunca de la pagina-- y no manda nada a ningun lado.
// Es el mismo esquema que el de Escribiente, y sus tres decisiones: se cachea
// de a uno, se borran las versiones viejas, y se sirve del cache revalidando
// por atras para que una correccion publicada llegue en la visita siguiente.

const CACHE = 'confronte-${commit.slice(0, 12)}';

const ARCHIVOS = ${JSON.stringify(cache, null, 4).replace(/\n/g, '\n')};

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
`;

// --------------------------------------------------------- recien ahora
for (const r of LO_QUE_SE_TRAE) fs.rmSync(path.join(DESTINO, r), { recursive: true, force: true });
fs.rmSync(path.join(DESTINO, 'ejemplos'), { recursive: true, force: true });
for (const rel of archivos) escribir(DESTINO, rel, copia[rel]);
fs.writeFileSync(path.join(DESTINO, 'sw.js'), sw);
fs.writeFileSync(path.join(DESTINO, 'ORIGEN.json'), JSON.stringify({
    que: 'Copia sin comentarios de la pantalla de confronteitor. No se edita aca: se trae con npm run traer-confronte.',
    commit,
    fecha,
    archivos,
}, null, 2) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\nTraido confronteitor ${commit.slice(0, 7)} (${fecha.slice(0, 10)}): ${archivos.length} archivos en confronte/.`);
console.log('Falta mirarlo en el navegador y commitear.');
