#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Verifica el revisor de ortografia de proveidos (extension-revisor/).
//
//   1. El motor, en Node: sobre el proveido inventado marca EXACTAMENTE los
//      errores sembrados y ninguno mas, y las reglas finas (pronombre pegado,
//      apellidos, palabra cortada) se comportan como dicen.
//   2. La extension, en Chrome con la extension cargada: una
//      pagina que imita la del sistema (pruebas/pagina.html) se sirve en la
//      direccion del sistema, interceptandola, con el PDF en un iframe blob:. Se
//      comprueba que el recuadro aparece solo, que dice exactamente los
//      errores sembrados, que "Es correcta" guarda la palabra y nada mas, y
//      que no hubo ningun pedido a la red fuera de la pagina simulada.
//
// La parte 2 necesita Playwright y Chrome instalado. Sin ellos
// corre la 1 y avisa. --solo-motor saltea la 2; --ver la muestra;
// --captura <archivo.png> guarda el recuadro y la vista con subrayado.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXT = path.join(RAIZ, 'extension-revisor');
// pdf-sintetico.js es un script de pagina: se carga y deja PdfSintetico en el global.
await import(pathToFileURL(path.join(EXT, 'pruebas/pdf-sintetico.js')).href);
const { RENGLONES, SEMBRADOS } = globalThis.PdfSintetico;

let fallas = 0;
let noProbado = false;
const ok = (cond, msg) => {
    console.log(`${cond ? '  ok ' : '  MAL'}  ${msg}`);
    if (!cond) fallas++;
};
const iguales = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

// --- 1. El motor ------------------------------------------------------------
console.log('Motor');
const { default: nspell } = await import(pathToFileURL(path.join(EXT, 'vendor/nspell.mjs')).href);
const { crearRevisor, leerLista } = await import(pathToFileURL(path.join(EXT, 'motor/revisar.mjs')).href);
const corrector = nspell(
    fs.readFileSync(path.join(EXT, 'vendor/es.aff'), 'utf8'),
    fs.readFileSync(path.join(EXT, 'vendor/es.dic'), 'utf8'),
);
const propias = leerLista(fs.readFileSync(path.join(EXT, 'datos/fuero.txt'), 'utf8'));
const revisor = crearRevisor({ corrector, propias });

const marcadas = revisor.revisar(RENGLONES.join('\n')).map((h) => h.palabra);
ok(iguales(marcadas, SEMBRADOS), `el proveido inventado marca solo lo sembrado: ${marcadas.join(', ')}`);

const pasan = 'notifíquese intímese dispónese hágasele regúlense devuélvase tiénese ofíciese pásense estése proveyéndose autorízase notifíquesele hacerse darle';
const noPasan = 'nótifiquese notifiquese intimese hagasele notifíquse';
ok(pasan.split(' ').every((p) => revisor.aceptada(p)), 'los verbos con pronombre y su tilde pasan');
ok(noPasan.split(' ').every((p) => !revisor.aceptada(p)), 'sin la tilde, o con la tilde corrida, no pasan');

const casos = [
    ['Rodriguez y Gonzalez firmaron.', [], 'un apellido sin su tilde no se marca'],
    ['Se presentó MENGANEZ y ZWIRNOV.', [], 'un apellido en mayúsculas no se marca'],
    ['RESUEVLO: hacer lugar.', ['RESUEVLO'], 'en mayúsculas, una palabra común mal tipeada sí'],
    ['la resolucion dictada', ['resolucion'], 'en minúscula, la falta de tilde se marca'],
    ['extemporá-\nnea', [], 'la palabra cortada a fin de renglón se une'],
    ['teórico-\npráctico', [], 'la compuesta cortada en su guion no se marca'],
    ['inter-\nponerlo', [], 'el verbo con pronombre cortado se une'],
    ['a fs. 3, art. 12 del CPCCN, in fine, 2do párr.', [], 'abreviaturas, siglas, latinismos y ordinales'],
    ['ver www.ejemplo-inventado.com.ar hoy', [], 'una dirección web no se revisa'],
];
for (const [texto, esperado, que] of casos) {
    const r = revisor.revisar(texto).map((h) => h.palabra);
    ok(iguales(r, esperado), `${que}${iguales(r, esperado) ? '' : ` (dio: ${r.join(', ') || 'nada'})`}`);
}
const conPersonal = crearRevisor({ corrector, propias, personales: ['Resuevlo'] });
ok(conPersonal.revisar('Resuevlo: ha lugar.').length === 0, 'la lista personal se respeta sin importar mayúsculas');

// --- 2. La extension en el navegador -----------------------------------------
if (process.argv.includes('--solo-motor')) terminar();

let chromium;
try {
    ({ chromium } = await import('playwright'));
} catch {
    console.log('\n(Playwright no está instalado: la prueba en el navegador NO corrió.)');
    noProbado = true;
    terminar();
}

console.log('\nExtensión en Chrome');
// Se usa el Chrome instalado, en un perfil descartable que Playwright borra al
// cerrar. Desde la version 137 Chrome no carga extensiones por linea de
// comandos, y el Chromium de Playwright lo puede bloquear Windows por no estar
// firmado: la extension se carga por el protocolo de depuracion
// (Extensions.loadUnpacked), que lo permite con --enable-unsafe-extension-debugging.
let navegador, contexto;
try {
    navegador = await chromium.launch({
        channel: 'chrome',
        headless: !process.argv.includes('--ver'),
        ignoreDefaultArgs: ['--disable-extensions'],
        args: ['--enable-unsafe-extension-debugging'],
    });
    const cdp = await navegador.newBrowserCDPSession();
    await cdp.send('Extensions.loadUnpacked', { path: EXT, enableInIncognito: true });
    contexto = await navegador.newContext();
} catch (err) {
    console.log(`\n(No se pudo abrir Chrome con la extensión: ${err.message.split('\n')[0]})`);
    noProbado = true;
    terminar();
}

// Toda la red pasa por aca. La pagina simulada se sirve desde el disco; lo
// demas se anota y se corta. Las paginas de la propia extension no son red.
const pedidosAfuera = [];
await contexto.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    // Archivos de la propia extension o del visor de PDF de Chrome: no son red.
    if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:') return route.continue();
    if (url.origin === 'https://sgj-docs.pjn.gov.ar') {
        if (/^\/despacho\/[^/]+\/view\/?$/.test(url.pathname)) {
            return route.fulfill({ contentType: 'text/html; charset=utf-8', body: fs.readFileSync(path.join(EXT, 'pruebas/pagina.html')) });
        }
        if (url.pathname === '/pruebas/pdf-sintetico.js') {
            return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(EXT, 'pruebas/pdf-sintetico.js')) });
        }
    }
    pedidosAfuera.push(url.href);
    return route.abort();
});

async function abrirYEsperarPanel(pagina, ruta) {
    await pagina.goto(`https://sgj-docs.pjn.gov.ar${ruta}`);
    let marco = null;
    for (let i = 0; i < 100 && !marco; i++) {
        marco = pagina.frames().find((f) => f.url().startsWith('chrome-extension://') && f.url().includes('panel.html'));
        if (!marco) await pagina.waitForTimeout(100);
    }
    if (!marco) return null;
    await marco.waitForSelector('body[data-estado="con-errores"], body[data-estado="sin-errores"], body[data-estado="falla"]', { state: 'attached', timeout: 20000 })
        .catch(async () => console.log('    (el recuadro quedó en: ' + await marco.evaluate(() => document.getElementById('titulo').textContent) + ')'));
    return marco;
}

const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });

// El fragmento del inicio de sesion va en la direccion, como en el sistema.
const marco = await abrirYEsperarPanel(pagina, '/despacho/123/view#state=x&code=y');
ok(!!marco, 'el recuadro aparece solo, sin hacer nada');
if (marco) {
    const estado = await marco.evaluate(() => document.body.dataset.estado);
    const titulo = await marco.evaluate(() => document.getElementById('titulo').textContent);
    const palabras = await marco.evaluate(() => [...document.querySelectorAll('#lista li')].map((li) => li.dataset.palabra));
    ok(estado === 'con-errores', `el recuadro está en rojo (estado: ${estado})`);
    ok(iguales(palabras, SEMBRADOS), `dice exactamente los sembrados: ${palabras.join(', ')}`);
    ok(titulo.startsWith(`${SEMBRADOS.length} posibles errores:`), `el título los cuenta: «${titulo}»`);
    const contexto1 = await marco.evaluate(() => document.querySelector('#lista li .contexto')?.textContent || '');
    ok(contexto1.length > 15, `cada uno trae su contexto: «${contexto1}»`);

    // Fase B: el mismo recuadro, a toda la pantalla, con cada error
    // subrayado sobre el documento dibujado.
    const captura = process.argv.includes('--captura') ? process.argv[process.argv.indexOf('--captura') + 1] : null;
    if (captura) await pagina.screenshot({ path: captura.replace(/\.png$/, '-recuadro.png') });
    await marco.click('#ver');
    await marco.waitForSelector('body[data-vista]', { state: 'attached', timeout: 20000 }).catch(() => {});
    const estadoVista = await marco.evaluate(() => document.body.dataset.vista);
    const alto = await pagina.evaluate(() => document.querySelector('iframe[data-revisor-pjn]').getBoundingClientRect().height);
    const altoVentana = await pagina.evaluate(() => window.innerHeight);
    ok(estadoVista === 'lista' && Math.abs(alto - altoVentana) < 2, `«Ver con subrayado» dibuja el PDF a toda la pantalla (estado: ${estadoVista}, alto ${alto}/${altoVentana})`);
    const subrayadas = await marco.evaluate(() => [...new Set([...document.querySelectorAll('mark.error')].map((m) => m.dataset.palabra))]);
    const pedazos = await marco.evaluate(() => [...document.querySelectorAll('mark.error')].map((m) => m.textContent));
    ok(iguales(subrayadas, SEMBRADOS.map((p) => p.toLocaleLowerCase('es'))), `subraya exactamente los sembrados: ${subrayadas.join(', ')}`);
    ok(pedazos.includes('documen-') && pedazos.includes('tasión'), `la palabra cortada se subraya en sus dos renglones: ${pedazos.join(' | ')}`);
    const marcaVisible = await marco.evaluate(() => {
        const m = document.querySelector('mark.error');
        if (!m) return false;
        const r = m.getBoundingClientRect();
        const pag = m.closest('.pagina').getBoundingClientRect();
        return r.width > 5 && r.height > 5 && r.left >= pag.left && r.right <= pag.right;
    });
    ok(marcaVisible, 'el subrayado cae sobre la página, con tamaño');
    if (captura) await pagina.screenshot({ path: captura });
    await marco.click('#volver');
    await pagina.waitForTimeout(300);
    const altoVuelta = await pagina.evaluate(() => document.querySelector('iframe[data-revisor-pjn]').getBoundingClientRect().height);
    const marcasVuelta = await marco.evaluate(() => document.querySelectorAll('mark.error').length);
    ok(altoVuelta < altoVentana - 100 && marcasVuelta === 0, `«Volver» achica el recuadro y descarta el dibujo (alto ${altoVuelta})`);

    // "Es correcta": se guarda la palabra y nada mas.
    await marco.click('li[data-palabra="presentasion"] .acciones button');
    const guardado = await marco.evaluate(() => chrome.storage.local.get(null));
    ok(JSON.stringify(guardado) === JSON.stringify({ palabrasPersonales: ['presentasion'] }),
        `«Es correcta» guarda sólo la palabra: ${JSON.stringify(guardado)}`);
    const quedan = await marco.evaluate(() => document.querySelectorAll('#lista li').length);
    ok(quedan === SEMBRADOS.length - 1, 'y la saca del recuadro');

    // Al volver a abrir, ya no aparece.
    const marco2 = await abrirYEsperarPanel(pagina, '/despacho/124/view');
    const palabras2 = marco2 ? await marco2.evaluate(() => [...document.querySelectorAll('#lista li')].map((li) => li.dataset.palabra)) : [];
    ok(iguales(palabras2, SEMBRADOS.filter((p) => p !== 'presentasion')), `al reabrir, la palabra aceptada no vuelve: ${palabras2.join(', ')}`);
}

// Fuera de un proveido, nada.
await pagina.goto('https://sgj-docs.pjn.gov.ar/despacho/123/otra').catch(() => {});
await pagina.waitForTimeout(800);
ok(!pagina.frames().some((f) => f.url().includes('panel.html')), 'fuera de /despacho/<n>/view no aparece');

ok(pedidosAfuera.filter((u) => !u.endsWith('/despacho/123/otra')).length === 0,
    `ningún pedido a la red fuera de la página simulada${pedidosAfuera.length ? `: ${pedidosAfuera.join(', ')}` : ''}`);
ok(errores.length === 0, `sin errores en la consola${errores.length ? `: ${errores.join(' | ')}` : ''}`);

await navegador.close();
terminar();

function terminar() {
    if (fallas) console.log(`\n${fallas} control(es) fallaron.`);
    else console.log(noProbado ? '\nEl motor está en orden; la extensión en el navegador NO se probó.' : '\nTodo en orden.');
    process.exit(fallas ? 1 : 0);
}
