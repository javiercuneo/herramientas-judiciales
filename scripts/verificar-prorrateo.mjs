// Barrido del prorrateo del art. 730: la pantalla contra el motor.
//
//   npm run verificar-prorrateo
//   npm run verificar-prorrateo -- --casos 5000 --semilla 7
//   npm run verificar-prorrateo -- --sitio https://javiercuneo.com.ar
//
// Por que existe: calculadoras/js/prorrateo.js es una TRANSCRIPCION de la
// cuenta que vivia adentro de calculadoras/prorrateo.html (29/10/2026), y una
// transcripcion no puede mover un numero. Mismo metodo que verificar-tasa.mjs:
// cientos de casos con semilla fija --regulaciones en pesos y en UMA, con y sin
// IVA, la tasa del 3 % y la cargada a mano, dentro y fuera de la base, los
// importes como los escribe la gente y los bordes del techo-- y por cada uno:
//
//   1. LA CUENTA EXACTA. `prorratear()` de la pantalla contra el del motor,
//      con las mismas entradas, campo por campo y sin redondear.
//   2. LO QUE LA PANTALLA MUESTRA. Cada cifra de la tabla, de la tira, del
//      veredicto y de la lectura en UMA, contra el motor. Es lo que prueba
//      que el lector de importes, la UMA y el IVA se aplican igual de los dos
//      lados: esa parte de la pantalla no esta expuesta.
//   3. LA CAPA DE LOS CONECTORES. Si `calcular()` contesta sin problema, lo
//      cobrado es lo de la pantalla; y si la pantalla tuvo que avisar que falta
//      la UMA, `calcular()` no puede contestar un reparto.
//   4. LA UMA VIGENTE, con una serie inventada que tiene un valor que rige
//      desde hoy y otro desde manana.
//
// Y la huella de cada caso, para la migracion (scripts/barrido-pantalla.mjs).

import {
    cargarMotor, azar, argumento, servirRepositorio, abrirNavegador,
    huella, manejarHuellas, FUNCION_HUELLA
} from './barrido-pantalla.mjs';

const CASOS = Number(argumento('--casos') || 2500);
const SEMILLA = Number(argumento('--semilla') || 730);
const SITIO = argumento('--sitio');

const P = await cargarMotor('prorrateo.js', 'Prorrateo');

function conMiles(entero, sep) {
    return String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

// El lector es el de todo el sitio (js/importes.js) desde el 29/10/2026. Se le
// dan textos ilegibles, negativos y en ingles a proposito: tienen que avisar.
function importeTexto(r, magnitudMax) {
    if (r.si(0.08)) {
        return r.uno(['', ' ', '0', 'abc', '-150.000', '1,5', '10.8', '10.800', '1.234,56', '1,234.56',
            '$ 1.000.000', '1.000.000,5', '0,01', '12a34', '1.2345', '..', ',', '1,234,567.89', '2,200,000', '$ -5', '1.234.56']);
    }
    const entero = Math.floor(r.siguiente() * Math.pow(10, r.entero(0, magnitudMax)));
    const cent = r.si(0.4) ? String(r.entero(0, 99)).padStart(2, '0') : null;
    switch (r.entero(0, 3)) {
        case 0: return String(entero) + (cent ? ',' + cent : '');
        case 1: return conMiles(entero, '.') + (cent ? ',' + cent : '');
        case 2: return String(entero) + (cent ? '.' + cent : '');
        default: return conMiles(entero, '.');
    }
}

const UMAS = ['108.005', '108.005', '108.005', '105991', '', '0', '108005,5', 'abc', '1'];

// Los bordes del techo: costas justo en el 25 %, un centavo arriba, la tasa
// sola llegando al techo, y el recorte en el tercio.
const BORDES = [
    { p: '10.000.000', r: [{ m: '2.200.000' }] },
    { p: '10.000.000', r: [{ m: '2.200.000,01' }] },
    { p: '10.000.000', r: [{ m: '1.100.000' }, { m: '1.100.000' }] },
    { p: '10.000.000', r: [{ m: '1.000.000' }], t: 1, i: '2.500.000' },
    { p: '10.000.000', r: [{ m: '1.000.000' }], t: 1, i: '3.000.000' },
    { p: '10.000.000', r: [{ m: '3.300.000' }] },
    { p: '10.000.000', r: [{ m: '2.500.000' }], b: 0 },
    { p: '10.000.000', r: [{ m: '2.500.000,01' }], b: 0 },
    { p: '10.000.000', r: [{ m: '10', u: 1 }, { m: '10', u: 1, v: 1 }], uma: '108.005' },
    { p: '10.000.000', r: [{ m: '10', u: 1 }], uma: '' },
    { p: '', r: [{ m: '1.000.000' }] },
    { p: '10.000.000', r: [] }
];

function generarCasos() {
    const r = azar(SEMILLA);
    const casos = BORDES.map((b) => ({ ...b, uma: b.uma === undefined ? '108.005' : b.uma }));
    while (casos.length < CASOS) {
        const filas = [];
        const cuantas = r.entero(0, 8);
        for (let i = 0; i < cuantas; i++) {
            const enUma = r.si(0.25);
            const o = { m: enUma ? importeTexto(r, 3) : importeTexto(r, 8) };
            if (r.si(0.3)) o.c = 'Letrado ' + (i + 1);
            if (enUma) o.u = 1;
            if (r.si(0.25)) o.v = 1;
            filas.push(o);
        }
        const caso = { p: importeTexto(r, 10), r: filas, uma: r.uno(UMAS) };
        if (r.si(0.15)) caso.b = 0;
        else if (r.si(0.3)) caso.sinCasilla = true;
        if (r.si(0.3)) { caso.t = 1; caso.i = importeTexto(r, 9); }
        casos.push(caso);
    }
    return casos;
}

// La pantalla siempre tiene tres renglones por lo menos: cargarCaso() completa
// con renglones vacios. El motor recibe los mismos.
function paraMotor(c) {
    const filas = c.r.map((o) => ({ monto: o.m || '', uma: !!o.u, iva: !!o.v }));
    while (filas.length < 3) filas.push({ monto: '', uma: false, iva: false });
    return {
        monto: c.p || '', uma: c.uma, tasaManual: !!c.t, tasaImporte: c.i || '',
        // Sin la casilla, el motor tiene que hacer lo que el formulario recien
        // abierto: la tasa dentro de la base. Un conector no la manda.
        tasaEnBase: c.b === 0 ? false : (c.sinCasilla ? undefined : true), regulaciones: filas
    };
}

function enLaPagina(lote) {
    const nf = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pesos = (n) => '$ ' + nf.format(n);
    const texto = (sel) => { const e = document.querySelector(sel); return e ? e.textContent : null; };

    return lote.map((caso) => {
        document.getElementById('uma').value = caso.uma;
        window.cargarCaso(caso.pantalla);

        const m = caso.motor;
        const r = m.prorrateo;
        const fallas = [];
        const exacto = JSON.stringify(window.Prorrateo730.prorratear({
            monto: m.monto, tasa: m.tasa, tasaEnBase: m.tasaEnBase, regulados: m.regulados
        }));
        if (exacto !== m.prorrateoJSON) fallas.push('prorratear() de la pantalla no da lo mismo que el del motor');

        const quiere = (sel, esperado, que) => {
            const visto = texto(sel);
            if (visto !== esperado) fallas.push(`${que}: la pantalla muestra «${visto}» y el motor da «${esperado}»`);
        };
        const filas = Array.from(document.getElementById('filas').rows);
        if (filas.length !== m.regulados.length) fallas.push(`la pantalla tiene ${filas.length} renglones y el motor ${m.regulados.length}`);
        filas.forEach((tr, i) => {
            const fila = `#filas tr:nth-child(${i + 1})`;
            const reg = m.regulados[i];
            const part = m.participacion[i];
            quiere(fila + ' .fila-regulado', reg > 0 ? pesos(reg) : '—', `renglon ${i + 1}, regulado`);
            quiere(fila + ' .fila-participacion', part === null ? '—' : nf.format(part) + ' %', `renglon ${i + 1}, participacion`);
            quiere(fila + ' .fila-prorrateado', part === null ? '—' : pesos(r.reparto[i]), `renglon ${i + 1}, prorrateado`);
            // La participacion y la lectura en UMA se muestran con dos
            // decimales, asi que una diferencia chica no se ve en pantalla y
            // el conector la devolveria igual. Se exigen exactas, contra la
            // expresion que la pantalla escribe (pintarFilas y
            // prorrateadoEnUma de prorrateo.html, copiadas).
            if (part !== null && part !== (reg * 100) / r.totalRegulado) fallas.push(`renglon ${i + 1}: la participacion exacta no es la de la pantalla`);
            const u = m.prorrateadoEnUma[i];
            if (u !== null && u !== r.reparto[i] / m.uma / (m.ivas[i] ? 1 + 0.21 : 1)) fallas.push(`renglon ${i + 1}: lo prorrateado en UMA, exacto, no es lo de la pantalla`);
            quiere(fila + ' .fila-prorrateado-uma', u === null ? '' : nf.format(u) + ' UMA' + (m.ivas[i] ? ' + IVA' : ''), `renglon ${i + 1}, en UMA`);
        });
        quiere('#totalRegulado', pesos(r.totalRegulado), 'total regulado');
        quiere('#totalProrrateado', r.totalRegulado > 0 ? pesos(r.cobrado) : '—', 'total prorrateado');
        // Los avisos: uno por cada campo cargado que no se pudo leer (desde el
        // 29/10/2026 lo ilegible y lo negativo valen cero PERO AVISAN), y la
        // frase de la UMA si falta y nadie dijo ya que no se entiende.
        const umaIlegible = m.avisos.some((a) => a.campo === 'uma');
        const lineas = m.avisos.map((a) => a.texto);
        if (m.hayUma && !(m.uma > 0) && !umaIlegible) lineas.push('Hay regulaciones expresadas en UMA y no hay un valor de UMA cargado.');
        quiere('#msg', lineas.join(''), 'avisos');
        const vistas = document.getElementById('msg').innerHTML ? document.getElementById('msg').innerHTML.split('<br>').length : 0;
        if (m.avisos.length !== m.ilegibles) fallas.push(`hay ${m.ilegibles} campos cargados que no se pueden leer y el motor avisa ${m.avisos.length}`);
        if (vistas !== lineas.length) fallas.push(`la pantalla muestra ${vistas} avisos y tendria que mostrar ${lineas.length}`);
        quiere('#montoEnUma', m.umaCaso && m.monto > 0 ? 'Equivale a ' + nf.format(m.monto / m.umaCaso) + ' UMA.' : '', 'monto en UMA');
        quiere('#totalProrrateadoUma', m.umaCaso && r.cobrado > 0 ? nf.format(r.cobrado / m.umaCaso) + ' UMA' + (m.hayIva ? ', IVA incluido' : '') : '', 'cobrado en UMA');
        const pie = texto('#pieTasa');
        if (m.monto > 0 && pie.indexOf(pesos(m.tasaLey)) < 0) fallas.push(`el pie de la tasa no dice el 3 % del motor (${pesos(m.tasaLey)}): «${pie}»`);
        if (m.monto > 0) {
            quiere('#cifraCobrado', pesos(r.cobrado), 'la cifra');
            quiere('#dTecho', pesos(r.techo), 'techo');
            quiere('#dTasa', pesos(r.tasa), 'tasa');
            quiere('#dTope', pesos(r.topeHonorarios), 'tope');
            quiere('#dPorcentaje', nf.format(r.porcentajeProceso) + ' %', 'costas sobre el proceso');
            quiere('#cifraCobradoUma', m.umaCaso ? nf.format(r.cobrado / m.umaCaso) + ' UMA' + (m.hayIva ? ', IVA incluido' : '') : null, 'la cifra en UMA');
            quiere('#dRecortePorcentaje', r.prorratea ? nf.format(r.recortePorcentaje) + ' %' : null, 'recorte');
            const tercio = !!document.getElementById('avisoTercio');
            if (tercio !== (r.prorratea && r.recortePorcentaje > 33)) fallas.push('el aviso del tercio no coincide con el recorte del motor');
        } else if (texto('#cifraCobrado') !== null) {
            fallas.push('sin monto del proceso la pantalla muestra una cifra');
        }

        const avisoUma = /UMA/.test(texto('#msg'));
        if (m.capa.problema === null) {
            if (texto('#cifraCobrado') !== pesos(m.capa.cobrado)) fallas.push('calcular() da un cobrado distinto del de la pantalla');
            // Un renglon sin monto con la casilla UMA tildada hace avisar a la
            // pantalla, pero no es una regulacion: a calcular() no le llega.
            if (avisoUma && m.capa.umaConMonto) fallas.push('la pantalla avisa que falta la UMA y calcular() devuelve un reparto');
        } else if (m.monto > 0 && !m.hayUma && r.totalRegulado > 0 && m.capa.esperabaResultado) {
            fallas.push('calcular() no contesta un caso completo: ' + m.capa.problema);
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

console.log(`Barrido del prorrateo del art. 730: ${casos.length} casos, semilla ${SEMILLA}, pantalla en ${base}/calculadoras/prorrateo.html\n`);

// LA UMA VIGENTE, con series inventadas: con la del archivo el borde no se pone
// a prueba nunca. La fecha es la de la pantalla, en UTC.
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
        await p.route(/serie-uma\.json/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ valores }) }));
        await p.goto(`${base}/calculadoras/prorrateo.html?vigencia=${Date.now()}`);
        await p.waitForFunction(() => /^(La UMA rige|No se pudo)/.test(document.getElementById('statusUma').textContent), null, { timeout: 30000 });
        const enPantalla = await p.evaluate(() => [document.getElementById('uma').value, document.getElementById('statusUma').textContent]);
        const elegido = P.umaVigente(valores);
        const ok = elegido ? enPantalla[0] === elegido.valor.toLocaleString('es-AR') && enPantalla[1].includes('(' + elegido.norma + ')')
                           : /ningún valor vigente/.test(enPantalla[1]);
        if (!ok) vigencias.push(`UMA vigente: la pantalla eligio ${JSON.stringify(enPantalla)} y el motor ${JSON.stringify(elegido)}`);
        await p.close();
    }
}

await pagina.goto(`${base}/calculadoras/prorrateo.html?barrido=${Date.now()}`);
await pagina.waitForFunction(() => {
    const e = document.getElementById('statusUma');
    return e && /^(La UMA rige|No se pudo)/.test(e.textContent);
}, null, { timeout: 30000 });
await pagina.evaluate(FUNCION_HUELLA);

let fallas = 0;
const primeras = [];
const huellas = [];
let regulaciones = 0;
const LOTE = 100;

for (let i = 0; i < casos.length; i += LOTE) {
    const lote = casos.slice(i, i + LOTE).map((c) => {
        const datos = paraMotor(c);
        const k = P.cuenta(datos);
        // La capa, con los mismos textos. Un caso "completo" es uno en que
        // todo lo cargado se puede leer: ahi calcular() TIENE que contestar.
        const conDatos = { ...datos, regulaciones: datos.regulaciones.filter((f) => String(f.monto).trim()) };
        const capa = P.calcular(conDatos);
        const legible = (t) => !isNaN(P.parseFlexibleNumber(t)) && P.parseFlexibleNumber(t) >= 0;
        const esperabaResultado = legible(conDatos.monto) && conDatos.regulaciones.every((f) => legible(f.monto)) &&
            (!conDatos.tasaManual || legible(conDatos.tasaImporte));
        regulaciones += c.r.length;
        // Contados aca, del texto crudo del caso y no del motor: cada campo
        // cargado que el lector no puede leer tiene que dar un aviso.
        const ilegible = (t) => String(t || '').trim() !== '' && isNaN(P.parseFlexibleNumber(t));
        const ilegibles = [datos.monto].concat(datos.tasaManual ? [datos.tasaImporte] : [],
            datos.regulaciones.map((f) => f.monto), k.hayUma ? [datos.uma] : []).filter(ilegible).length;
        return {
            pantalla: { p: c.p, r: c.r, b: c.b, t: c.t, i: c.i },
            uma: c.uma,
            motor: {
                monto: k.monto, uma: k.uma, tasa: k.prorrateo.tasa, tasaEnBase: k.prorrateo.tasaEnBase,
                tasaLey: k.tasaLey, hayUma: k.hayUma, hayIva: k.hayIva, umaCaso: k.umaCaso,
                regulados: k.regulados, participacion: k.participacion, prorrateadoEnUma: k.prorrateadoEnUma,
                avisos: k.avisos, ilegibles,
                ivas: datos.regulaciones.map((f) => f.iva),
                prorrateo: k.prorrateo,
                prorrateoJSON: JSON.stringify(k.prorrateo),
                capa: {
                    problema: capa.problema, cobrado: capa.cuenta ? capa.cuenta.prorrateo.cobrado : null, esperabaResultado,
                    umaConMonto: conDatos.regulaciones.some((f) => f.uma)
                }
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

await navegador.close();
if (servidor) servidor.cerrar();

for (const p of primeras) {
    console.log(`  FALLA  caso ${p.n}: ${JSON.stringify(p.caso)}`);
    for (const f of p.fallas.slice(0, 6)) console.log(`         ${f}`);
}
for (const e of erroresDePagina.slice(0, 5)) console.log(`  ERROR EN LA PAGINA  ${e}`);
for (const v of vigencias) console.log(`  FALLA  ${v}`);

const distintos = await manejarHuellas(huellas);
if (distintos && distintos.length) {
    console.log(`  FALLA  ${distintos.length} casos dibujan distinto que en las huellas guardadas: ${distintos.slice(0, 10).join(', ')}`);
}

console.log(`\n${casos.length} casos (${regulaciones} regulaciones).`);
console.log(`Casos con diferencias: ${fallas}.` + (distintos ? ` Casos que dibujan distinto: ${distintos.length}.` : ''));

if (fallas || vigencias.length || erroresDePagina.length || (distintos && distintos.length)) process.exit(1);
console.log('La pantalla y el motor dan exactamente lo mismo.');
