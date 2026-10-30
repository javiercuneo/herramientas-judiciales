// Lo comun de los barridos que comparan una pantalla con su motor:
// verificar-tasa.mjs y verificar-prorrateo.mjs.
//
// Los dos hacen lo mismo con otra calculadora: arman cientos de casos con una
// semilla fija, los cargan en la pantalla misma --en Chromium, por
// Playwright, servida desde el disco o desde el sitio publicado-- y en el
// motor, y exigen igualdad exacta. Lo que tienen en comun esta aca para que
// los dos no se desincronicen en la parte que no es de ninguno.
//
// LA HUELLA DE LA PANTALLA. Ademas de comparar numeros, cada caso deja una
// huella: el HTML del <body> sin los <script>, con el caso cargado. Sirve para
// una sola cosa, y es la que hace falta el dia que una pantalla pasa a
// consumir su motor: --guardar-huellas ARCHIVO antes de tocarla, y
// --comparar-huellas ARCHIVO despues. Si un solo caso dibuja distinto, la
// migracion movio algo, aunque los numeros den.

import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

// Los motores son IIFE de navegador. Se cargan como los carga
// conectores/nucleo.mjs: con un `window` de mentira y el disco en lugar de
// la red.
export async function cargarMotor(archivo, nombre) {
    const ventana = {};
    const fetchLocal = async (url) => {
        const limpia = String(url).split('?')[0].replace(/^\.\.\//, '');
        const texto = await readFile(join(RAIZ, limpia), 'utf8');
        return { ok: true, status: 200, json: async () => JSON.parse(texto) };
    };
    // El lector de importes va siempre antes: tasa.js y prorrateo.js lo piden
    // colgado de `window`, como plazos.js pide el calendario.
    for (const a of ['importes.js', archivo]) {
        const fuente = await readFile(join(RAIZ, 'calculadoras', 'js', a), 'utf8');
        new Function('window', 'fetch', fuente)(ventana, fetchLocal);
    }
    if (!ventana[nombre]) throw new Error(`${archivo} no publico window.${nombre}`);
    return ventana[nombre];
}

// Un generador con semilla (mulberry32): la misma semilla da los mismos
// casos en cualquier maquina, y una falla se puede volver a ver.
export function azar(semilla) {
    let a = semilla >>> 0;
    const siguiente = () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
        siguiente,
        entero: (min, max) => min + Math.floor(siguiente() * (max - min + 1)),
        uno: (lista) => lista[Math.floor(siguiente() * lista.length)],
        si: (p) => siguiente() < p
    };
}

export function argumento(nombre) {
    const i = process.argv.indexOf(nombre);
    return i > -1 ? process.argv[i + 1] : null;
}

const TIPOS = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

// El repositorio servido desde el disco, en 127.0.0.1 y en un puerto libre.
// Sin esto las pantallas no cargan sus JSON: con file:// fetch no anda.
export function servirRepositorio() {
    return new Promise((resolver) => {
        const servidor = createServer(async (req, res) => {
            try {
                const pedida = decodeURIComponent(new URL(req.url, 'http://x').pathname);
                // Una carpeta se sirve por su index.html, como Pages.
                const ruta = normalize(pedida.endsWith('/') ? pedida + 'index.html' : pedida).replace(/^([/\\])+/, '');
                if (ruta.startsWith('..')) throw new Error('fuera');
                const cuerpo = await readFile(join(RAIZ, ruta));
                res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' });
                res.end(cuerpo);
            } catch {
                res.writeHead(404);
                res.end();
            }
        });
        servidor.listen(0, '127.0.0.1', () => {
            resolver({ base: `http://127.0.0.1:${servidor.address().port}`, cerrar: () => servidor.close() });
        });
    });
}

// Chromium de Playwright. Si no esta, el barrido FALLA: un control que se
// saltea en silencio cuando falta el navegador es un control que no corre.
export async function abrirNavegador() {
    let chromium;
    try {
        ({ chromium } = await import('playwright'));
    } catch {
        console.error('Falta Playwright: npm ci, y despues npx playwright install chromium.');
        process.exit(1);
    }
    const navegador = await chromium.launch();
    // Contador de visitas y tipografia: afuera. No hacen al calculo y un
    // tercero lento o caido no puede trabar el barrido.
    const contexto = await navegador.newContext({ timezoneId: 'America/Argentina/Buenos_Aires', locale: 'es-AR' });
    await contexto.route(/gc\.zgo\.at|goatcounter|fonts\.googleapis|fonts\.gstatic/, (r) => r.abort());
    return { navegador, contexto };
}

export const huella = (texto) => createHash('sha256').update(texto).digest('hex').slice(0, 16);

// Guarda o compara las huellas, segun los argumentos. Devuelve la lista de
// casos que dibujan distinto.
export async function manejarHuellas(huellas) {
    const guardar = argumento('--guardar-huellas');
    const comparar = argumento('--comparar-huellas');
    if (guardar) {
        await writeFile(guardar, JSON.stringify(huellas));
        console.log(`  huellas de ${huellas.length} casos guardadas en ${guardar}`);
    }
    if (!comparar) return null;
    const antes = JSON.parse(await readFile(comparar, 'utf8'));
    if (antes.length !== huellas.length) {
        return [`el archivo de huellas tiene ${antes.length} casos y este barrido ${huellas.length}: no es la misma semilla o la misma cantidad`];
    }
    const distintos = [];
    for (let i = 0; i < huellas.length; i++) if (antes[i] !== huellas[i]) distintos.push(i);
    return distintos;
}

// Lo que se le inyecta a la pagina para sacar la huella: el <body> sin
// scripts, y el origen borrado, porque el puerto cambia en cada corrida y el
// enlace del caso lo lleva adentro. El espacio ENTRE etiquetas se colapsa:
// agregar un <script src> deja un salto de linea de mas que no se dibuja, y
// sin esto la migracion de una pantalla daria todos los casos distintos.
export const FUNCION_HUELLA = `
    window.__huella = function () {
        var copia = document.body.cloneNode(true);
        copia.querySelectorAll('script').forEach(function (s) { s.remove(); });
        return copia.innerHTML.split(location.origin).join('').replace(/>\\s+</g, '><') + '|' + location.hash;
    };
`;
