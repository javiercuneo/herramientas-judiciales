// Barrido de la tasa de justicia: la pantalla contra el motor.
//
//   npm run verificar-tasa
//   npm run verificar-tasa -- --casos 5000 --semilla 7
//   npm run verificar-tasa -- --sitio https://javiercuneo.com.ar
//
// Por que existe: calculadoras/js/tasa.js es una TRANSCRIPCION de la cuenta
// que vivia adentro de calculadoras/tasa.html (29/10/2026). Una transcripcion
// no puede mover un numero, y "no puede" sin una prueba es una intencion. Este
// script arma cientos de casos --todos los supuestos, sucesiones con varios
// bienes y titularidades, la suma fija, los bordes de la escala concursal,
// importes escritos de todas las formas en que la gente los pega, y los que no
// se pueden leer-- y exige, caso por caso:
//
//   1. LA CUENTA EXACTA. Cada renglon que la pantalla calcula, leido del
//      formulario como lo lee ella y pasado por su propio `liquidar()`, contra
//      `cuentasDelCaso()` del motor. Igualdad de todos los campos, sin
//      redondear: un centavo de diferencia en el decimo decimal es una falla.
//   2. LO QUE LA PANTALLA MUESTRA. El total, el imponible, la tasa y el aviso
//      de cada renglon y los momentos del art. 9, contra el motor.
//   3. LA CAPA DE LOS CONECTORES. Si `liquidarCaso()` contesta sin problema,
//      su total es el de la pantalla; y si la pantalla tuvo que avisar que no
//      pudo leer un dato, `liquidarCaso()` no puede contestar un total.
//   4. EL LECTOR DE IMPORTES Y EL DE TITULARIDAD, uno contra otro, sobre una
//      lista de textos.
//
// Y deja la huella de cada caso (ver scripts/barrido-pantalla.mjs), que es la
// prueba de que la pantalla, al pasar a consumir el motor, dibuja igual.
//
// Sin --sitio, la pantalla es la del disco, servida en 127.0.0.1. Con --sitio,
// es la publicada: el motor local contra lo que hoy ve la gente.
//
// Salidas: 0 si todo da igual; 1 si algo no, con los primeros casos que fallan.

import {
    cargarMotor, azar, argumento, servirRepositorio, abrirNavegador,
    huella, manejarHuellas, FUNCION_HUELLA
} from './barrido-pantalla.mjs';

const CASOS = Number(argumento('--casos') || 2500);
const SEMILLA = Number(argumento('--semilla') || 23898);
const SITIO = argumento('--sitio');

const T = await cargarMotor('tasa.js', 'Tasa');

// ---------------------------------------------------------------------------
// Los textos. Son los que motivaron el lector de importes --"la gente copia y
// pega montos, a veces vienen con comas, a veces con puntos"-- y los que no se
// pueden leer, que tienen que avisar y no valer cero en silencio.
// ---------------------------------------------------------------------------
const ESPACIOS = [' ', ' ', ' ', ' '];

function conMiles(entero, sep) {
    return String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

function importeTexto(r) {
    if (r.si(0.12)) {
        return r.uno([
            '', ' ', '0', '0,00', ',5', '.5', '10.8', '10,800', '10.800', '10800,00', '10,800.00',
            '$ 10.800', 'ARS 10.800', '10 800', "10'800", '-1.000', 'diez mil', '1.234.56',
            '1,2,3.4.5', '12a', '1.000.000.000.000,99', '$1.234.567', '1,234,567', '10.800 pesos',
            '99.999.999,99', '100.000.000', '100.000.000,01', '100000000.5', '1e6', '١٢٣'
        ]);
    }
    const magnitud = r.entero(0, 10);
    const entero = Math.floor(r.siguiente() * Math.pow(10, magnitud));
    const cent = r.si(0.5) ? String(r.entero(0, 99)).padStart(2, '0') : null;
    switch (r.entero(0, 8)) {
        case 0: return String(entero) + (cent ? ',' + cent : '');
        case 1: return String(entero) + (cent ? '.' + cent : '');
        case 2: return conMiles(entero, '.') + (cent ? ',' + cent : '');
        case 3: return conMiles(entero, ',') + (cent ? '.' + cent : '');
        case 4: return '$ ' + conMiles(entero, '.') + (cent ? ',' + cent : '');
        case 5: return 'ARS ' + conMiles(entero, '.') + (cent ? ',' + cent : '');
        case 6: return conMiles(entero, r.uno(ESPACIOS)) + (cent ? ',' + cent : '');
        case 7: return conMiles(entero, "'") + (cent ? '.' + cent : '');
        default: return ' ' + conMiles(entero, '.') + (cent ? ',' + cent : '') + ' pesos ';
    }
}

const TITULARIDADES = ['', '', '', '100', '50', '50 %', '50%', '1/2', '1/3', '2/3', '0', '33,33', '33.333',
    '12,5 %', 'abc', '1/0', '3/2', '150', '-50', ' 75 ', '100,0', '1/2/3', '25', '0,5', '1.000'];
const SOBRETASAS = ['5', '5', '5', '', '0', '7,5', '10', 'x', '-2', '5.5'];
const MONTOS_FIJOS = ['4.700', '4.700', '4.700', '4700', '', '5.000,50', 'abc', '0'];

// Los bordes de la escala concursal: el tramo cambia en $100.000.000.
const BORDES_CONCURSO = ['99.999.999,99', '100.000.000', '100.000.000,01', '100000000.5',
    '100.000.001', '0,01', '200.000.000', '1.000.000.000', '99999999.99'];

function generarCasos() {
    const r = azar(SEMILLA);
    const casos = [];

    // Los bordes primero, uno por uno: no se confian al azar.
    for (const imp of BORDES_CONCURSO) {
        casos.push({ supuesto: 'concurso', testamento: false, montoFijoTexto: '4.700',
            renglones: [{ item: 'creditos', importe: imp, titularidad: '', extranha: false, conSobretasa: true, sobretasa: '5', clase: 'principal', nombre: '' }] });
    }
    for (const sup of T.SUPUESTOS) {
        for (const item of sup.items) {
            casos.push({ supuesto: sup.id, testamento: false, montoFijoTexto: '4.700',
                renglones: [{ item: item.id, importe: '1.000.000', titularidad: '', extranha: false, conSobretasa: true, sobretasa: '5', clase: 'principal', nombre: '' }] });
        }
    }

    while (casos.length < CASOS) {
        // La sucesion pesa mas: es donde estan los varios bienes, la
        // titularidad, la sobretasa y la doble reduccion.
        const sup = r.si(0.35) ? T.SUPUESTOS[1] : r.si(0.02) ? { id: 'inexistente', items: [] } : r.uno(T.SUPUESTOS);
        const items = sup.items.length ? sup.items : T.SUPUESTOS[0].items;
        const cuantos = sup.id === 'sucesion' ? r.entero(1, 8) : r.entero(1, 5);
        const renglones = [];
        for (let i = 0; i < cuantos; i++) {
            renglones.push({
                item: r.si(0.03) ? 'inexistente' : r.uno(items).id,
                nombre: cuantos > 1 && r.si(0.5) ? 'Bien ' + (i + 1) : '',
                clase: r.si(0.12) ? 'ampliacion' : r.si(0.03) ? 'inexistente' : 'principal',
                importe: importeTexto(r),
                titularidad: r.uno(TITULARIDADES),
                extranha: r.si(sup.id === 'sucesion' ? 0.25 : 0.05),
                conSobretasa: r.si(0.8),
                sobretasa: r.uno(SOBRETASAS)
            });
            // El renglon minimo, que es el que manda un conector: sin los
            // campos que el formulario trae puestos. Tiene que dar lo mismo
            // que el formulario recien abierto.
            if (r.si(0.15)) {
                for (const k of ['nombre', 'clase', 'titularidad', 'extranha', 'conSobretasa', 'sobretasa']) {
                    if (r.si(0.7)) delete renglones[i][k];
                }
            }
        }
        casos.push({
            supuesto: sup.id,
            testamento: r.si(sup.id === 'sucesion' ? 0.3 : 0.05),
            montoFijoTexto: r.uno(MONTOS_FIJOS),
            renglones
        });
    }
    return casos;
}

// El caso, como lo arma la pantalla y como lo recibe el motor.
const paraPantalla = (c) => ({ supuesto: c.supuesto, testamento: c.testamento, montoFijo: null, renglones: c.renglones });
// La pantalla sólo lee el nombre cuando hay mas de un renglon; el motor lo
// recibe tal cual. Se arma igual de los dos lados para comparar la cuenta.
const paraMotor = (c) => ({
    supuesto: c.supuesto, testamento: c.testamento, montoFijo: c.montoFijoTexto,
    renglones: c.renglones.map((x) => ({ ...x, nombre: c.renglones.length > 1 ? (x.nombre || '').trim() : '' }))
});

// ---------------------------------------------------------------------------
// Lo que corre adentro de la pagina por cada caso. Lee el formulario como lo
// leia leerRenglon() --la funcion de la pantalla que no esta expuesta-- y le
// pasa cada renglon a `Tasa23898.liquidar`, que SI es la de la pantalla. Y
// copia lo que la pantalla escribio.
// ---------------------------------------------------------------------------
function enLaPagina(lote) {
    const T = window.Tasa23898;
    const porId = (l, id) => l.find((x) => x.id === id) || null;
    const nf = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pesos = (n) => '$ ' + nf.format(n);
    const texto = (sel) => { const e = document.querySelector(sel); return e ? e.textContent : null; };

    return lote.map((caso) => {
        document.getElementById('montoFijo').value = caso.montoFijoTexto;
        T.cargarCaso(caso.pantalla);

        const sup = porId(T.SUPUESTOS, document.getElementById('supuesto').value) || T.SUPUESTOS[0];
        const filas = Array.from(document.getElementById('renglones').rows);
        const cuentas = filas.map((tr) => {
            const item = porId(sup.items, tr.querySelector('.fila-item').value) || sup.items[0];
            const banderas = {
                extranha: tr.querySelector('.fila-extranha').checked,
                testamento: document.getElementById('esTestamento').checked
            };
            return T.liquidar({
                supuesto: sup, item, base: item.base,
                alicuota: T.alicuotaDe(sup, item, banderas),
                nombre: filas.length > 1 ? tr.querySelector('.fila-nombre').value.trim() : '',
                clase: tr.querySelector('.fila-clase').value,
                importe: tr.querySelector('.fila-importe').value,
                titularidad: tr.querySelector('.fila-titularidad').value,
                conSobretasa: tr.querySelector('.fila-consobretasa').checked,
                sobretasa: tr.querySelector('.fila-sobretasa').value,
                montoFijo: document.getElementById('montoFijo').value
            });
        });

        const m = caso.motor;
        const fallas = [];
        if (JSON.stringify(cuentas) !== m.cuentasJSON) {
            fallas.push('la cuenta exacta de algun renglon no es la del motor');
        }
        const quiere = (sel, esperado, que) => {
            const visto = texto(sel);
            if (visto !== esperado) fallas.push(`${que}: la pantalla muestra «${visto}» y el motor da «${esperado}»`);
        };
        quiere('#totalTasa', pesos(m.totales.tasa), 'total de la tasa');
        quiere('#totalImponible', pesos(m.totales.imponible), 'monto imponible');
        quiere('#cifraTasa', m.totales.cargados === 0 ? '—' : pesos(m.totales.tasa), 'la cifra');
        quiere('#momentosPista', m.momentos.join(' · '), 'momentos del art. 9');
        filas.forEach((tr, i) => {
            const c = m.renglones[i];
            quiere(`#renglones tr:nth-child(${i + 1}) .fila-tasa`, c.aporta ? pesos(c.tasa) : '—', `renglon ${i + 1}, tasa`);
            quiere(`#renglones tr:nth-child(${i + 1}) .fila-aviso`, c.aviso, `renglon ${i + 1}, aviso`);
        });
        if (filas.length !== m.renglones.length) fallas.push(`la pantalla tiene ${filas.length} renglones y el motor ${m.renglones.length}`);

        // La capa de los conectores, contra lo que la pantalla muestra.
        const avisoEnPantalla = filas.some((tr) => !tr.querySelector('.fila-aviso').hidden);
        if (m.capa.problema === null) {
            if (texto('#totalTasa') !== pesos(m.capa.tasa)) fallas.push('liquidarCaso da un total distinto del de la pantalla');
            if (avisoEnPantalla) fallas.push('la pantalla avisa que no pudo leer un dato y liquidarCaso devuelve un total');
        }

        return { fallas, huella: window.__huella() };
    });
}

// ---------------------------------------------------------------------------

const casos = generarCasos();
const servidor = SITIO ? null : await servirRepositorio();
const base = SITIO ? SITIO.replace(/\/+$/, '') : servidor.base;
const { navegador, contexto } = await abrirNavegador();
const pagina = await contexto.newPage();
const erroresDePagina = [];
pagina.on('pageerror', (e) => erroresDePagina.push(e.message));

console.log(`Barrido de la tasa de justicia: ${casos.length} casos, semilla ${SEMILLA}, pantalla en ${base}/calculadoras/tasa.html\n`);

await pagina.goto(`${base}/calculadoras/tasa.html?barrido=${Date.now()}`);
// El monto fijo llega por fetch al arrancar, y cuando llega recalcula: hay que
// esperarlo para que no pise un caso a la mitad.
await pagina.waitForFunction(() => {
    const e = document.getElementById('estadoMontoFijo');
    return e && /^(Rige desde|No se pudo)/.test(e.textContent);
}, null, { timeout: 30000 });
await pagina.evaluate(FUNCION_HUELLA);

// EL MONTO FIJO VIGENTE. La pantalla elige solo al arrancar, entre los
// valores del archivo, el ultimo cuya vigencia ya empezo. Con el archivo de
// verdad la eleccion no se pone a prueba --tiene un solo valor, de 2022--, asi
// que se le sirve uno inventado con un valor que rige desde HOY y otro que
// rige desde manana: el borde exacto de la comparacion. La fecha es la que usa
// la pantalla, en UTC.
const vigencias = [];
{
    const hoy = new Date().toISOString().slice(0, 10);
    const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const series = [
        [{ valor: 1111, vigencia: '2000-01-01', norma: 'A' }, { valor: 2222, vigencia: hoy, norma: 'B' }, { valor: 3333, vigencia: manana, norma: 'C' }],
        [{ valor: 3333, vigencia: manana, norma: 'C' }],
        [{ valor: 1111, vigencia: '2000-01-01', norma: 'A' }, { valor: '9', vigencia: '2001-01-01', norma: 'X' }, { valor: 4444, norma: 'Y' }]
    ];
    for (const valores of series) {
        const p = await contexto.newPage();
        await p.route(/tasa-monto-fijo\.json/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ valores }) }));
        await p.goto(`${base}/calculadoras/tasa.html?vigencia=${Date.now()}`);
        await p.waitForFunction(() => /^(Rige desde|No se pudo)/.test(document.getElementById('estadoMontoFijo').textContent), null, { timeout: 30000 });
        const enPantalla = await p.evaluate(() => [document.getElementById('montoFijo').value, document.getElementById('estadoMontoFijo').textContent]);
        const elegido = T.montoFijoVigente(valores);
        const esperado = elegido ? elegido.valor.toLocaleString('es-AR') : '';
        const ok = elegido ? enPantalla[0] === esperado && enPantalla[1].includes('(' + elegido.norma + ')')
                           : /ningún valor vigente/.test(enPantalla[1]);
        if (!ok) vigencias.push(`monto fijo vigente: la pantalla eligio ${JSON.stringify(enPantalla)} y el motor ${JSON.stringify(elegido)}`);
        await p.close();
    }
}

let fallas = 0;
const primeras = [];
const huellas = [];
let renglones = 0;
const LOTE = 100;

// La sobretasa ilegible avisa desde el 29/10/2026. Se mira del texto crudo del
// caso y no del motor: si la casilla esta tildada en un inmueble de la sucesion
// y lo escrito no se puede leer, el renglon TIENE que avisar --salvo que ya
// avise por el importe o la titularidad, que mandan--; y el aviso de la
// sobretasa no puede salir en ningun otro caso.
const AVISO_SOBRETASA = 'No se entiende esa sobretasa. Se escribe 5 o 2,5.';
const sobretasaMal = [];
function mirarSobretasa(caso, cuentas, n) {
    caso.renglones.forEach((r, i) => {
        const c = cuentas[i];
        const marcada = r.conSobretasa === undefined ? true : !!r.conSobretasa;
        const texto = r.sobretasa === undefined ? '5' : r.sobretasa;
        const ilegible = String(texto).trim() !== '' && isNaN(T.parseFlexibleNumber(texto));
        const debe = c.llevaSobretasa && marcada && ilegible;
        const otro = T.analizarNumero(r.importe).aviso || (c.llevaTitularidad && T.analizarTitularidad(r.titularidad).aviso);
        if (debe && !otro && c.aviso !== AVISO_SOBRETASA) sobretasaMal.push(`caso ${n}, renglon ${i + 1}: la sobretasa «${texto}» no se puede leer y no avisa («${c.aviso}»)`);
        if (!debe && c.aviso === AVISO_SOBRETASA) sobretasaMal.push(`caso ${n}, renglon ${i + 1}: avisa por la sobretasa «${texto}», que no hacia falta`);
    });
}

for (let i = 0; i < casos.length; i += LOTE) {
    const lote = casos.slice(i, i + LOTE).map((c) => {
        const delMotor = T.cuentasDelCaso(paraMotor(c));
        mirarSobretasa(paraMotor(c), delMotor.cuentas, casos.indexOf(c));
        const t = T.totales(delMotor.cuentas);
        const capa = T.liquidarCaso(paraMotor(c));
        renglones += c.renglones.length;
        return {
            pantalla: paraPantalla(c),
            montoFijoTexto: c.montoFijoTexto,
            motor: {
                cuentasJSON: JSON.stringify(delMotor.cuentas),
                totales: { tasa: t.tasa, imponible: t.imponible, cargados: t.cargados },
                momentos: T.momentos(delMotor.cuentas).map((m) => m[0]),
                renglones: delMotor.cuentas.map((x) => ({ tasa: x.tasa, aporta: x.aporta, aviso: x.aviso })),
                capa: { problema: capa.problema, tasa: capa.totales ? capa.totales.tasa : null }
            }
        };
    });
    const resultados = await pagina.evaluate(enLaPagina, lote);
    resultados.forEach((res, j) => {
        huellas.push(huella(res.huella));
        if (!res.fallas.length) return;
        fallas++;
        if (primeras.length < 8) primeras.push({ n: i + j, caso: casos[i + j], fallas: res.fallas });
    });
}

// Los dos lectores, sobre textos sueltos.
const TEXTOS = [];
{
    const r = azar(SEMILLA + 1);
    for (let i = 0; i < 1500; i++) TEXTOS.push(importeTexto(r));
    TEXTOS.push(...TITULARIDADES, ...SOBRETASAS, ...MONTOS_FIJOS, null, undefined, '  ', '1/', '/2', '%', '50 %%');
}
const lectores = await pagina.evaluate((textos) => textos.map((t) => JSON.stringify([
    window.Tasa23898.analizarNumero(t), window.Tasa23898.parseTitularidad(t)
])), TEXTOS);
let lectoresMal = 0;
TEXTOS.forEach((t, i) => {
    const delMotor = JSON.stringify([T.analizarNumero(t), T.parseTitularidad(t)]);
    if (delMotor !== lectores[i]) {
        lectoresMal++;
        if (lectoresMal <= 5) console.log(`  FALLA  el texto ${JSON.stringify(t)} se lee distinto: pantalla ${lectores[i]}, motor ${delMotor}`);
    }
});

await navegador.close();
if (servidor) servidor.cerrar();

for (const p of primeras) {
    console.log(`  FALLA  caso ${p.n}: ${JSON.stringify(p.caso)}`);
    for (const f of p.fallas.slice(0, 6)) console.log(`         ${f}`);
}
for (const e of erroresDePagina.slice(0, 5)) console.log(`  ERROR EN LA PAGINA  ${e}`);
for (const v of vigencias) console.log(`  FALLA  ${v}`);
for (const v of sobretasaMal.slice(0, 5)) console.log(`  FALLA  ${v}`);

const distintos = await manejarHuellas(huellas);
if (distintos && distintos.length) {
    console.log(`  FALLA  ${distintos.length} casos dibujan distinto que en las huellas guardadas: ${distintos.slice(0, 10).join(', ')}`);
}

console.log(`\n${casos.length} casos (${renglones} renglones) y ${TEXTOS.length} textos sueltos.`);
console.log(`Casos con diferencias: ${fallas}. Textos que se leen distinto: ${lectoresMal}. Sobretasas mal avisadas: ${sobretasaMal.length}.` +
    (distintos ? ` Casos que dibujan distinto: ${distintos.length}.` : ''));

if (fallas || lectoresMal || sobretasaMal.length || vigencias.length || erroresDePagina.length || (distintos && distintos.length)) process.exit(1);
console.log('La pantalla y el motor dan exactamente lo mismo.');
