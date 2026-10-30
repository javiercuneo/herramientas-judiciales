// El lector de importes: uno solo, y que lea lo que tiene que leer.
//
//   npm run verificar-importes
//
// Por que existe: hasta el 29/10/2026 el sitio tenia CUATRO lectores de
// importes --el de tasa, una copia suya en uma-uhom, y otro mas viejo en
// prorrateo y en honorarios-mediacion-- y no leian igual: el viejo dejaba pasar
// el signo menos, leia "abc" como cero y "1,234,567.89" como 1,23, todo sin
// avisar. Javier decidio que haya uno, calculadoras/js/importes.js, y que todos
// le pidan a ese. Este control cuida las dos mitades de esa decision:
//
//   1. QUE LEA BIEN. Una tabla fija de textos con lo que tienen que dar: cada
//      formato que se admite, y cada cosa que tiene que avisar en vez de valer
//      un numero. Escrita a mano, no sacada del lector: si alguien lo
//      "arregla" y cambia una lectura, esto lo dice.
//   2. QUE SEA UNO SOLO. Ningun archivo del sitio tiene un lector propio: se
//      buscan las dos huellas que dejan los lectores (la verificacion de
//      caracteres del de tasa y la limpieza del viejo), y cada consumidor tiene
//      que cargar importes.js. Una copia, aunque sea identica, es un defecto.
//   3. QUE LAS PANTALLAS SIN BARRIDO PROPIO LO USEN. Mediacion y uma-uhom se
//      abren en Chromium y se les escribe: lo ilegible avisa, el formato
//      ingles se lee bien. Tasa y prorrateo los cubren sus barridos.

import { readFile, readdir } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirRepositorio, abrirNavegador } from './barrido-pantalla.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const fallas = [];

// --- 1. La tabla ------------------------------------------------------------
const ventana = {};
new Function('window', await readFile(join(RAIZ, 'calculadoras/js/importes.js'), 'utf8'))(ventana);
const I = ventana.Importes;

// [texto, lo que da]: un numero, o el motivo por el que no se puede leer.
const TABLA = [
    ['10800', 10800], ['10.800', 10800], ['10.800,00', 10800], ['$ 10.800', 10800],
    ['10 800', 10800], ["10'800", 10800], ['10800,00', 10800], ['10,800.00', 10800],
    ['ARS 10.800', 10800], ['10.800 pesos', 10800], ['10\u00a0800', 10800], ['10\u202f800', 10800],
    ['1.234.567,89', 1234567.89], ['1234567.89', 1234567.89], ['1,234,567.89', 1234567.89],
    ['1,234,567', 1234567], ['1.234.567', 1234567], ['10.8', 10.8], ['10,8', 10.8],
    ['1,5', 1.5], ['0,01', 0.01], [',5', 0.5], ['0', 0], ['1,234', 1.234],
    ['', 'vacio'], ['   ', 'vacio'], [null, 'vacio'], [undefined, 'vacio'],
    ['-150.000', 'negativo'], ['-0', 'negativo'], ['$ -5', 'negativo'],
    ['abc', 'ilegible'], ['diez mil', 'ilegible'], ['12a34', 'ilegible'], ['1.234.56', 'ilegible'],
    ['10.800.5', 'ilegible'], ['1.2.3,4.5', 'ilegible'], ['+5', 'ilegible'], ['5-', 'ilegible'],
    ['1e5', 'ilegible'], ['..', 'ilegible'], [',', 'ilegible'], ['5,', 'ilegible'], ['100 uma', 'ilegible'],
];
for (const [texto, quiere] of TABLA) {
    const a = I.analizar(texto);
    const da = a.motivo && a.motivo !== '' ? a.motivo : a.valor;
    if (da !== quiere) fallas.push(`el lector lee ${JSON.stringify(texto)} como ${JSON.stringify(da)} y tiene que dar ${JSON.stringify(quiere)}`);
    if (typeof quiere === 'number' && a.aviso) fallas.push(`${JSON.stringify(texto)} se lee y sin embargo avisa`);
    if (quiere === 'ilegible' || quiere === 'negativo') {
        if (!a.aviso) fallas.push(`${JSON.stringify(texto)} no se puede leer y no avisa`);
        if (I.numero(texto) !== 0) fallas.push(`${JSON.stringify(texto)} no se puede leer y numero() no da cero`);
    }
}
// La unidad que agrega una pantalla vale solo en esa pantalla.
if (I.leer('100 uma', { sufijos: ['uma'] }) !== 100) fallas.push('con el sufijo "uma", "100 uma" no da 100');
if (I.leer('10 UMA', { sufijos: ['uma'] }) !== 10) fallas.push('con el sufijo "uma", "10 UMA" no da 10');
if (!isNaN(I.leer('100 uma'))) fallas.push('sin el sufijo, "100 uma" se lee');

// --- 2. Uno solo --------------------------------------------------------------
const HUELLAS_DE_LECTOR = ['/^[0-9.,]+$/', '/[^0-9.-]/g'];
const CONSUMIDORES = {
    'calculadoras/tasa.html': '<script src="js/importes.js"></script>',
    'calculadoras/prorrateo.html': '<script src="js/importes.js"></script>',
    'calculadoras/honorarios-mediacion.html': '<script src="js/importes.js"></script>',
    'uma-uhom.html': '<script src="calculadoras/js/importes.js"></script>',
    'calculadoras/js/tasa.js': 'window.Importes',
    'calculadoras/js/prorrateo.js': 'window.Importes',
    'conectores/liquidaciones.mjs': "'importes.js'",
    'scripts/barrido-pantalla.mjs': "'importes.js'",
};
const SALTEAR = new Set(['node_modules', '.git', 'scripts']);
async function* archivos(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
        if (e.isDirectory()) { if (!SALTEAR.has(e.name)) yield* archivos(join(dir, e.name)); }
        else if (/\.(html|js|mjs)$/.test(e.name)) yield join(dir, e.name);
    }
}
let mirados = 0;
for await (const ruta of archivos(RAIZ)) {
    const rel = relative(RAIZ, ruta).replace(/\\/g, '/');
    if (rel === 'calculadoras/js/importes.js') continue;
    mirados++;
    const fuente = await readFile(ruta, 'utf8');
    for (const h of HUELLAS_DE_LECTOR) {
        if (fuente.includes(h)) fallas.push(`${rel} tiene un lector de importes propio (${h}): tiene que usar calculadoras/js/importes.js`);
    }
}
for (const [rel, marca] of Object.entries(CONSUMIDORES)) {
    const fuente = await readFile(join(RAIZ, rel), 'utf8');
    if (!fuente.includes(marca)) fallas.push(`${rel} no carga el lector de importes (${marca})`);
}

// --- 3. Las dos pantallas sin barrido -----------------------------------------
const servidor = await servirRepositorio();
const { navegador, contexto } = await abrirNavegador();
const pagina = await contexto.newPage();
const erroresDePagina = [];
pagina.on('pageerror', (e) => erroresDePagina.push(e.message));

// Si la pantalla no arranca --por ejemplo, porque no cargo el lector-- se dice
// eso, y no un timeout.
async function abrir(ruta, listo) {
    await pagina.goto(servidor.base + ruta);
    try {
        await pagina.waitForFunction(listo, null, { timeout: 15000 });
        return true;
    } catch {
        fallas.push(`${ruta} no termina de cargar${erroresDePagina.length ? ': ' + erroresDePagina.join(' / ') : ''}`);
        erroresDePagina.length = 0;
        return false;
    }
}

if (await abrir('/calculadoras/honorarios-mediacion.html', () => document.getElementById('uhom').value !== '')) {
    const mediacion = async (texto) => {
        await pagina.fill('#monto', texto);
        return pagina.evaluate(() => ({
            msg: document.getElementById('msg').classList.contains('show') ? document.getElementById('msg').textContent : '',
            cifra: !!document.getElementById('honorarioPesos')
        }));
    };
    for (const t of ['abc', '-150.000', '12a34']) {
        const r = await mediacion(t);
        if (!/^Monto del asunto: /.test(r.msg) || r.cifra) fallas.push(`mediacion: el monto ${JSON.stringify(t)} no avisa o da un honorario («${r.msg}»)`);
    }
    const cifra = () => pagina.evaluate(() => document.getElementById('honorarioPesos').textContent);
    const ingles = await mediacion('1,234,567.89'); const a = await cifra();
    const local = await mediacion('1.234.567,89'); const b = await cifra();
    if (ingles.msg || local.msg || a !== b) fallas.push(`mediacion: "1,234,567.89" y "1.234.567,89" no dan el mismo honorario (${a} y ${b})`);
}

if (await abrir('/uma-uhom.html', () => /1 UMA =/.test(document.getElementById('conv-cuenta').textContent))) {
    const uma = async (texto) => {
        await pagina.fill('#conv-uma', texto);
        return pagina.evaluate(() => ({ cuenta: document.getElementById('conv-cuenta').textContent, pesos: document.getElementById('conv-pesos').value }));
    };
    const a = await uma('10'), b = await uma('10 uma');
    if (!a.pesos || a.pesos !== b.pesos) fallas.push(`uma-uhom: "10" y "10 uma" no dan los mismos pesos (${a.pesos} y ${b.pesos})`);
    const c = await uma('abc');
    if (c.pesos || !/No se entiende ese número/.test(c.cuenta)) fallas.push(`uma-uhom: "abc" no avisa («${c.cuenta}»)`);
    const d = await uma('-3');
    if (d.pesos || !/No puede ser negativo/.test(d.cuenta)) fallas.push(`uma-uhom: "-3" no avisa («${d.cuenta}»)`);
}

await navegador.close();
servidor.cerrar();
for (const e of erroresDePagina) fallas.push('error en la pagina: ' + e);

for (const f of fallas) console.log('  FALLA  ' + f);
console.log(`\n${TABLA.length} lecturas de la tabla, ${mirados} archivos sin lector propio, ${Object.keys(CONSUMIDORES).length} consumidores, 2 pantallas en Chromium.`);
if (fallas.length) { console.log(`${fallas.length} fallas.`); process.exit(1); }
console.log('Un solo lector de importes, y lee lo que tiene que leer.');
