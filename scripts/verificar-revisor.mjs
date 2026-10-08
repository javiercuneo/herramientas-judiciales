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
import os from 'node:os';
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
    // La caratula no se revisa. CANTERAL es inventado y, suelto, se marca.
    ['Lo pidió CANTERAL.', ['CANTERAL'], 'un apellido a una letra de una palabra común, suelto, se marca'],
    ['CANTERAL, FULANO c/ MENGANEZ S.A. s/ COBRO DE PESOS\nResuevlo: ha lugar.', ['Resuevlo'], 'en la carátula no, y el cuerpo se sigue revisando'],
    ['CANTERAL, FULANO c/ MENGANEZ S.A. y otros\ns/ DAÑOS Y PERJUICIOS\nResuevlo.', ['Resuevlo'], 'la carátula cortada en dos renglones'],
    ['CANTERAL, FULANO s/ SUCESION AB-INTESTATO\nResuevlo.', ['Resuevlo'], 'la sucesión, sin «c/»'],
    ['CANTERAL c/ MENGANEZ s/ DAÑOS Y PERJUICIOS (ACC. TRAN. C/ LES. O\nMUERTE)\nResuevlo.', ['Resuevlo'], 'el objeto largo que sigue en el renglón de abajo'],
    ['en los autos «CANTERAL c/ MENGANEZ s/ ORDINARIO» resuevlo', ['resuevlo'], 'la carátula entre comillas, en medio del texto'],
    ['acompaña c/ copia del CANTERAL', ['CANTERAL'], 'un «c/» suelto en el cuerpo no tapa el renglón'],
    ['el recurso contra la resolucion sobre honorarios', ['resolucion'], '«contra» y «sobre» en minúscula son prosa'],
];
for (const [texto, esperado, que] of casos) {
    const r = revisor.revisar(texto).map((h) => h.palabra);
    ok(iguales(r, esperado), `${que}${iguales(r, esperado) ? '' : ` (dio: ${r.join(', ') || 'nada'})`}`);
}
// El texto se arma con la posicion de cada item, no solo con hasEOL.
const { textoDeItems } = await import(pathToFileURL(path.join(EXT, 'motor/revisar.mjs')).href);
const item = (str, x, y, width, hasEOL = false) => ({ str, transform: [12, 0, 0, 12, x, y], width, hasEOL });
const sinFinDeRenglon = textoDeItems([item('córrase traslado', 50, 700, 90), item('liquidación presentada', 50, 686, 120)]);
ok(sinFinDeRenglon === 'córrase traslado\nliquidación presentada', `un renglón nuevo sin marca de fin no pega palabras: «${sinFinDeRenglon}»`);
const conHueco = textoDeItems([item('incurrido', 50, 700, 45), item('no', 100, 700, 10)]);
ok(conHueco === 'incurrido no', `un hueco en el mismo renglón separa: «${conHueco}»`);
const partida = textoDeItems([item('notifí', 50, 700, 30), item('quese', 80, 700, 28)]);
ok(partida === 'notifíquese', `una palabra partida sin hueco se pega: «${partida}»`);
ok(revisor.revisar('El 29/9 se intimó a que adecue su liquidación.').length === 0, '«adecue» es correcta');
const abrev = revisor.revisar('(conf. arg. CNCiv, Sala K; sig. hs. ap. ccia. y lo resuevlo.)').map((h) => h.palabra);
ok(iguales(abrev, ['resuevlo']), `una palabra corta pegada a un punto es abreviatura; una larga, no (dio: ${abrev.join(', ') || 'nada'})`);

// Solo se revisan proveidos.
const { esProveido } = await import(pathToFileURL(path.join(EXT, 'motor/revisar.mjs')).href);
ok(esProveido(RENGLONES.join('\n')), 'el proveído inventado se reconoce como proveído');
ok(!esProveido(globalThis.PdfSintetico.RENGLONES_ESCRITO.join('\n')), 'el escrito inventado, no');
ok(esProveido('#12345678#987654321#20260303\nPoder Judicial de la Nación\nJUZGADO NACIONAL EN LO CIVIL N° 99\nExpte. N° 4321/2025\nCANTERAL c/ MENGANEZ s/ COBRO'),
    'con un código de barras delante y el juzgado escrito largo, también');
ok(!esProveido('Señor Juez:\nen los autos 4321/2025 del Poder Judicial de la Nación, juzgado civil 99'),
    'nombrar al juzgado en el cuerpo no lo hace proveído');

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
// Se usa el Chrome instalado, en un perfil descartable que se borra al
// terminar. Normal y no de incognito: en incognito la extension no ve la
// pestana y no puede poner la cuenta en su icono. Desde la version 137 Chrome no carga extensiones por linea de
// comandos, y el Chromium de Playwright lo puede bloquear Windows por no estar
// firmado: la extension se carga por el protocolo de depuracion
// (Extensions.loadUnpacked), que lo permite con --enable-unsafe-extension-debugging.
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'revisor-pjn-'));
let contexto;
try {
    contexto = await chromium.launchPersistentContext(perfil, {
        channel: 'chrome',
        headless: !process.argv.includes('--ver'),
        ignoreDefaultArgs: ['--disable-extensions'],
        args: ['--enable-unsafe-extension-debugging'],
    });
    const cdp = await contexto.browser().newBrowserCDPSession();
    await cdp.send('Extensions.loadUnpacked', { path: EXT });
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

const marcoDe = (pagina, archivo) => pagina.frames().find((f) => f.url().startsWith('chrome-extension://') && f.url().includes(archivo));
const iframe = (pagina, cual) => pagina.evaluate((c) => {
    const f = document.querySelector(`iframe[data-revisor-pjn="${c}"]`);
    if (!f) return null;
    const r = f.getBoundingClientRect();
    return { visible: getComputedStyle(f).display !== 'none', x: r.left, y: r.top, w: r.width, h: r.height };
}, cual);

async function esperarMarco(pagina, archivo) {
    for (let i = 0; i < 100; i++) {
        const m = marcoDe(pagina, archivo);
        if (m) return m;
        await pagina.waitForTimeout(100);
    }
    return null;
}

async function abrirYEsperarPanel(pagina, ruta) {
    await pagina.goto(`https://sgj-docs.pjn.gov.ar${ruta}`);
    const marco = await esperarMarco(pagina, 'panel.html');
    if (!marco) return null;
    await marco.waitForSelector('body[data-estado="con-errores"], body[data-estado="sin-errores"], body[data-estado="falla"], body[data-estado="no-proveido"]', { state: 'attached', timeout: 20000 })
        .catch(async () => console.log(`    (el recuadro quedó en: ${await marco.evaluate(() => document.getElementById('titulo').textContent)})`));
    return marco;
}

async function esperarVista(pagina) {
    const vista = await esperarMarco(pagina, 'vista.html');
    if (vista) await vista.waitForSelector('body[data-estado]', { state: 'attached', timeout: 20000 }).catch(() => {});
    return vista;
}

const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
const captura = process.argv.includes('--captura') ? process.argv[process.argv.indexOf('--captura') + 1] : null;
const capturar = async (sufijo) => { if (captura) await pagina.screenshot({ path: captura.replace(/\.png$/, `${sufijo}.png`) }); };
const deLaPestana = (marco, msg) => marco.evaluate(async (m) => {
    const pestana = await chrome.tabs.getCurrent();
    return chrome.tabs.sendMessage(pestana.id, m);
}, msg);
const cuentaDe = (marco) => marco.evaluate(async () => {
    const pestana = await chrome.tabs.getCurrent();
    return pestana ? chrome.action.getBadgeText({ tabId: pestana.id }) : '(sin pestaña)';
});

// El fragmento del inicio de sesion va en la direccion, como en el sistema.
const marco = await abrirYEsperarPanel(pagina, '/despacho/123/view#state=x&code=y');
ok(!!marco, 'el recuadro se arma solo, sin hacer nada');
if (marco) {
    const estado = await marco.evaluate(() => document.body.dataset.estado);
    const palabras = await marco.evaluate(() => [...document.querySelectorAll('#lista li')].map((li) => li.dataset.palabra));
    ok(estado === 'con-errores', `el proveído se revisa (estado: ${estado})`);
    ok(iguales(palabras, SEMBRADOS), `el recuadro lista exactamente los sembrados: ${palabras.join(', ')}`);
    ok(!(await iframe(pagina, 'panel')).visible, 'pero arranca oculto: no hace ruido');
    const c1 = await cuentaDe(marco);
    ok(c1 === String(SEMBRADOS.length), `el ícono muestra la cuenta: «${c1}»`);

    // El subrayado, encima del visor y del mismo tamano.
    const vista = await esperarVista(pagina);
    ok(!!vista && await vista.evaluate(() => document.body.dataset.estado) === 'lista', 'el PDF aparece dibujado con el subrayado');
    if (vista) {
        const rv = await iframe(pagina, 'vista');
        const rp = await pagina.evaluate(() => { const r = document.querySelector('iframe.visor').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
        ok(rv.visible && ['x', 'y', 'w', 'h'].every((k) => Math.abs(rv[k] - rp[k]) < 1.5), 'justo encima del visor, del mismo tamaño');
        const subrayadas = await vista.evaluate(() => [...new Set([...document.querySelectorAll('mark.error')].map((m) => m.dataset.palabra))]);
        const pedazos = await vista.evaluate(() => [...document.querySelectorAll('mark.error')].map((m) => m.textContent));
        ok(iguales(subrayadas, SEMBRADOS.map((p) => p.toLocaleLowerCase('es'))), `subraya exactamente los sembrados: ${subrayadas.join(', ')}`);
        ok(pedazos.includes('documen-') && pedazos.includes('tasión'), 'la palabra cortada se subraya en sus dos renglones');
        ok(!pedazos.some((t) => /CANTERAL/.test(t)), 'la carátula no se subraya');
        await capturar('');

        // Clic en la palabra: el menu chico, y "Es correcta".
        await vista.click('mark.error[data-palabra="presentasion"]');
        const menu = await vista.evaluate(() => document.getElementById('menu')?.textContent || '');
        ok(menu.includes('Es correcta') && menu.includes('presentación'), `clic en la palabra: la sugerencia y «Es correcta», al lado: «${menu}»`);
        await capturar('-menu');
        await vista.click('#menu button');
        await pagina.waitForTimeout(400);
        const guardado = await marco.evaluate(() => chrome.storage.local.get(null));
        ok(JSON.stringify(guardado) === JSON.stringify({ palabrasPersonales: ['presentasion'] }), `«Es correcta» guarda sólo la palabra: ${JSON.stringify(guardado)}`);
        const quedanVista = await vista.evaluate(() => [...new Set([...document.querySelectorAll('mark.error')].map((m) => m.dataset.palabra))]);
        ok(!quedanVista.includes('presentasion') && quedanVista.length === SEMBRADOS.length - 1, 'deja de subrayarla');
        const quedan = await marco.evaluate(() => document.querySelectorAll('#lista li').length);
        ok(quedan === SEMBRADOS.length - 1 && await cuentaDe(marco) === String(SEMBRADOS.length - 1), 'y el recuadro y el ícono se enteran');

        // La R muestra y oculta el recuadro. El clic en el icono no se puede
        // simular: se manda el mismo mensaje que el script de fondo manda.
        await deLaPestana(marco, { revisorPJN: 'alternar' });
        ok((await iframe(pagina, 'panel')).visible, 'el ícono abre el recuadro');
        await pagina.waitForTimeout(400);
        await capturar('-recuadro');
        await marco.click('li[data-palabra="Resuevlo"] button.palabra');
        await pagina.waitForTimeout(300);
        ok(await vista.evaluate(() => document.querySelector('mark.foco')?.dataset.palabra) === 'resuevlo', 'clic en una palabra del recuadro la señala en el documento');
        await marco.click('#original');
        await pagina.waitForTimeout(200);
        ok(!(await iframe(pagina, 'vista')).visible, '«Ver PDF original» saca el subrayado y deja el visor de Chrome');
        await marco.click('#original');
        await pagina.waitForTimeout(200);
        ok((await iframe(pagina, 'vista')).visible, 'y «Ver con subrayado» lo vuelve a poner');
        await marco.click('#cerrar');
        await pagina.waitForTimeout(200);
        ok(!(await iframe(pagina, 'panel')).visible, 'la X lo oculta del todo');
        await deLaPestana(marco, { revisorPJN: 'alternar' });
        ok((await iframe(pagina, 'panel')).visible, 'y el ícono lo trae de vuelta');
    }

    // Al volver a abrir, la palabra aceptada ya no aparece.
    const marco2 = await abrirYEsperarPanel(pagina, '/despacho/124/view');
    const palabras2 = marco2 ? await marco2.evaluate(() => [...document.querySelectorAll('#lista li')].map((li) => li.dataset.palabra)) : [];
    ok(iguales(palabras2, SEMBRADOS.filter((p) => p !== 'presentasion')), `al reabrir, la palabra aceptada no vuelve: ${palabras2.join(', ')}`);

    // Un escrito de un letrado: no se revisa, no se subraya, no se cuenta.
    const marco3 = await abrirYEsperarPanel(pagina, '/despacho/900/view');
    await pagina.waitForTimeout(500);
    const estado3 = marco3 && await marco3.evaluate(() => document.body.dataset.estado);
    const vista3 = await iframe(pagina, 'vista');
    const cuenta3 = marco3 && await cuentaDe(marco3);
    ok(estado3 === 'no-proveido' && (!vista3 || !vista3.visible) && cuenta3 === '', `un escrito no se revisa: ni subrayado ni cuenta (estado: ${estado3}, cuenta: «${cuenta3}»)`);
    if (marco3) {
        await deLaPestana(marco3, { revisorPJN: 'alternar' });
        await marco3.click('#igual');
        await marco3.waitForSelector('body[data-estado="con-errores"]', { state: 'attached', timeout: 10000 }).catch(() => {});
        const p3 = await marco3.evaluate(() => [...document.querySelectorAll('#lista li')].map((li) => li.dataset.palabra));
        ok(p3.length > 0, `«Revisar igual» lo revisa si se pide: ${p3.join(', ')}`);
    }
}

// Fuera de un proveido, nada.
await pagina.goto('https://sgj-docs.pjn.gov.ar/despacho/123/otra').catch(() => {});
await pagina.waitForTimeout(800);
ok(!pagina.frames().some((f) => /panel.html|vista.html/.test(f.url())), 'fuera de /despacho/<n>/view no aparece nada');

ok(pedidosAfuera.filter((u) => !u.endsWith('/despacho/123/otra')).length === 0,
    `ningún pedido a la red fuera de la página simulada${pedidosAfuera.length ? `: ${pedidosAfuera.join(', ')}` : ''}`);
ok(errores.length === 0, `sin errores en la consola${errores.length ? `: ${errores.join(' | ')}` : ''}`);

await contexto.close();
fs.rmSync(perfil, { recursive: true, force: true });
terminar();

function terminar() {
    if (fallas) console.log(`\n${fallas} control(es) fallaron.`);
    else console.log(noProbado ? '\nEl motor está en orden; la extensión en el navegador NO se probó.' : '\nTodo en orden.');
    process.exit(fallas ? 1 : 0);
}
