// Banco de pruebas de los calculos de dias habiles.
//
// Por que existe: hasta el 16/8/2026 este repositorio no tenia una sola
// comprobacion sobre un resultado de calculo. `verificar-docs` mira que las
// citas de la ley existan; nada miraba que las cuentas dieran. Once
// herramientas publicadas, aritmetica de consecuencia juridica, y ningun
// control automatico. Lo primero que encontro al correrse fueron dos bugs de
// feria que llevaban anios publicados (ver docs/HISTORIA.md).
//
// Que fija y que no:
//   - INVARIANTES: cosas ciertas siempre. El fin de semana es inhabil, enero
//     entero es feria, la feria de julio dura 12 dias y va de lunes a viernes.
//   - LOS DATOS contra las Acordadas: que lo que el motor devuelve sea lo que
//     dice data/feria-judicial.json, y que ese archivo respete el invariante.
//   - REGRESIONES de los bugs ya arreglados, con el caso concreto que fallaba.
//
// Lo que NO cubre: las pantallas, y la aritmetica propia de cada calculadora
// —el plazo de gracia, la nota de asistencia, el prorrateo—. Solo el motor.
//
// Correr con: npm run verificar-calculos

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

let fallos = 0;
let pruebas = 0;

function ok(condicion, descripcion, detalle) {
    pruebas++;
    if (condicion) return;
    fallos++;
    console.log(`  FALLA  ${descripcion}`);
    if (detalle) console.log(`         ${detalle}`);
}

function ymd(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

const fecha = (str) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
};

// ---------------------------------------------------------------------------
// Carga de calendario-judicial.js
//
// El archivo es un IIFE de navegador: cuelga su API de `window` y pide los
// JSON con `fetch` sobre rutas relativas a calculadoras/. Se le arma ese
// entorno con lo minimo, y se lee el disco en lugar de la red. La alternativa
// —jsdom— traeria una dependencia entera para esto.
// ---------------------------------------------------------------------------
async function cargarMotor() {
    const fuente = await readFile(
        join(RAIZ, 'calculadoras', 'js', 'calendario-judicial.js'),
        'utf8'
    );

    const ventana = {};
    const fetchLocal = async (url) => {
        const limpia = String(url).split('?')[0].replace(/^\.\.\//, '');
        const texto = await readFile(join(RAIZ, limpia), 'utf8');
        return { ok: true, status: 200, json: async () => JSON.parse(texto) };
    };

    new Function('window', 'fetch', fuente)(ventana, fetchLocal);

    if (!ventana.CalendarioJudicial) {
        throw new Error('calendario-judicial.js no publico window.CalendarioJudicial');
    }
    return ventana.CalendarioJudicial;
}

// ---------------------------------------------------------------------------
// Las dos heuristicas que estuvieron publicadas, para medirlas contra las
// Acordadas. No se usan en produccion: estan aca como evidencia de por que la
// feria salio del codigo. Si alguna vez alguien propone volver a deducirla,
// esta corrida contesta sola.
// ---------------------------------------------------------------------------
function penultimoLunesJulio(anio) {
    const lunes = [];
    for (let d = 1; d <= 31; d++) {
        const t = new Date(anio, 6, d);
        if (t.getMonth() !== 6) break;
        if (t.getDay() === 1) lunes.push(d);
    }
    return new Date(anio, 6, lunes[lunes.length - 2]);
}

function tercerLunesJulio(anio) {
    const d = new Date(anio, 6, 1);
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + 14);
    return d;
}

async function main() {
    const CJ = await cargarMotor();
    const feriaJSON = JSON.parse(
        await readFile(join(RAIZ, 'data', 'feria-judicial.json'), 'utf8')
    ).ferias;

    // Anios ordinarios: un solo rango, siguiendo el calendario escolar. 2009 y
    // 2020 quedan afuera del invariante porque no son ordinarios —el primero
    // se rectifico y amplio, el segundo encadeno ferias extraordinarias— y el
    // invariante de 12 dias no les aplica.
    const conFechas = Object.keys(feriaJSON)
        .filter((a) => (feriaJSON[a].rangos || []).length && !feriaJSON[a].no_ordinaria)
        .map(Number)
        .sort();

    // Para los invariantes que necesitan feriados nacionales ademas de feria.
    const feriadosJSON = JSON.parse(
        await readFile(join(RAIZ, 'data', 'feriados.json'), 'utf8')
    ).feriados;
    const completos = conFechas.filter((a) => feriadosJSON[String(a)]);

    const carga = await CJ.init(completos);
    ok(carga.dataLoaded, 'init() carga feriados y feria de los anios completos',
        `faltan feriados ${carga.missingYears} / feria ${carga.missingFeriaYears}`);

    console.log(`\nFeria de invierno: ${conFechas.length} anios con Acordada`);

    for (const anio of conFechas) {
        const dato = feriaJSON[String(anio)].rangos[0];
        const inicio = fecha(dato.inicio);
        const fin = fecha(dato.fin);
        const dias = Math.round((fin - inicio) / 86400000) + 1;

        // El invariante que aporto Javier: dos semanas escolares (14 dias)
        // menos el ultimo sabado y domingo. Se cumple en los 21 anios.
        ok(dias === 12, `${anio}: la feria dura 12 dias`, `dura ${dias}`);
        ok(inicio.getDay() === 1, `${anio}: la feria empieza un lunes`,
            `${dato.inicio} es dia ${inicio.getDay()}`);
        ok(fin.getDay() === 5, `${anio}: la feria termina un viernes`,
            `${dato.fin} es dia ${fin.getDay()}`);
        ok(!!dato.acordada, `${anio}: la feria cita su Acordada`);

        // El motor devuelve lo que dice el archivo.
        const delMotor = CJ.obtenerFeriaJulio(anio);
        ok(delMotor && ymd(delMotor.inicio) === dato.inicio,
            `${anio}: el motor arranca la feria donde la Acordada`,
            delMotor ? `motor ${ymd(delMotor.inicio)}, Acordada ${dato.inicio}` : 'el motor no la tiene');
        ok(delMotor && ymd(delMotor.fin) === dato.fin,
            `${anio}: el motor termina la feria donde la Acordada`,
            delMotor ? `motor ${ymd(delMotor.fin)}, Acordada ${dato.fin}` : 'el motor no la tiene');

        // Todos los dias del rango son inhabiles, incluidos los de agosto.
        for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
            ok(CJ.esFeriaJudicial(new Date(d)), `${anio}: ${ymd(d)} cae en feria`);
        }
        // El dia anterior al inicio y el posterior al fin NO son feria.
        const antes = new Date(inicio); antes.setDate(antes.getDate() - 1);
        const despues = new Date(fin); despues.setDate(despues.getDate() + 1);
        ok(!CJ.esFeriaJudicial(antes), `${anio}: ${ymd(antes)} no es feria todavia`);
        ok(!CJ.esFeriaJudicial(despues), `${anio}: ${ymd(despues)} ya no es feria`);
    }

    console.log('\nAnios que ninguna formula puede producir');

    // 2009: la Acordada 8/2009 fijo el 20 al 31 de julio, la 21/2009 lo
    // RECTIFICO al 6 al 17, la 23/2009 amplio del 20 al 24 y la 27/2009
    // dispuso el cese. Son dos rangos, no uno.
    const f2009 = CJ.obtenerFeriasDelAnio(2009);
    ok(Array.isArray(f2009) && f2009.length === 2, '2009: tiene dos rangos de feria',
        `tiene ${f2009 ? f2009.length : 'ninguno'}`);
    for (const dia of ['2009-07-06', '2009-07-17', '2009-07-20', '2009-07-24']) {
        ok(CJ.esFeriaJudicial(fecha(dia)), `2009: ${dia} es feria`);
    }
    // El 27 se retomo la actividad (Acordada 27/2009), y el 3 de julio es
    // anterior a la rectificacion: ninguno de los dos es feria.
    ok(!CJ.esFeriaJudicial(fecha('2009-07-27')), '2009: el 27/7 ya no es feria (cese, Ac. 27/2009)');
    ok(!CJ.esFeriaJudicial(fecha('2009-07-03')), '2009: el 3/7 no es feria');
    // Y el 31/7, que la Acordada original declaraba feria y la rectificacion
    // dejo sin efecto. Si esto fallara, se cargo la Acordada equivocada.
    ok(!CJ.esFeriaJudicial(fecha('2009-07-31')),
        '2009: el 31/7 no es feria (la Ac. 8/2009 quedo sin efecto)');

    // 2020: la Acordada 21/2020 suspendio la feria ORDINARIA, y eso NO
    // significa que julio haya sido habil: once Acordadas encadenadas
    // declararon feria extraordinaria del 16/3 al 3/8. Este archivo afirmo lo
    // contrario durante unas horas del 17/8; queda el caso que lo delata.
    for (const dia of ['2020-03-16', '2020-05-01', '2020-07-15', '2020-07-22', '2020-08-03']) {
        ok(CJ.esFeriaJudicial(fecha(dia)), `2020: ${dia} es feria extraordinaria (COVID)`);
        ok(!CJ.esDiaHabil(fecha(dia)), `2020: ${dia} es inhabil`);
    }
    ok(!CJ.esFeriaJudicial(fecha('2020-03-13')), '2020: el 13/3 es anterior a la feria extraordinaria');
    ok(!CJ.esFeriaJudicial(fecha('2020-08-04')), '2020: el 4/8 ya no es feria extraordinaria');

    console.log('\nVentana de cobertura');

    // Las ferias viejas estan cargadas, pero los feriados nacionales y los
    // asuetos no. Un calculo sobre esos anios contaria como habiles dias que
    // no lo fueron, asi que el motor lo anota y el que calcula no afirma nada.
    ok(CJ.coberturaDesde === 2021, 'la cobertura declarada arranca en 2021',
        `declara ${CJ.coberturaDesde}`);
    CJ.reiniciarAuditoria();
    CJ.esDiaHabil(fecha('2019-03-05'));
    ok(CJ.aniosFueraDeCoberturaTocados().includes(2019),
        'tocar 2019 queda anotado como fuera de cobertura');
    CJ.reiniciarAuditoria();
    CJ.esDiaHabil(fecha('2024-03-05'));
    ok(CJ.aniosFueraDeCoberturaTocados().length === 0,
        'tocar 2024 no anota nada: esta dentro de la cobertura');
    ok(CJ.problemaDeDatos() === null, 'un anio con datos completos no reporta problema');

    // El otro insumo: los feriados nacionales se cargan por anio pedido. Un
    // computo que cruza a un anio no pedido los perderia en silencio. Es el
    // mismo agujero que la feria y se audita igual.
    CJ.reiniciarAuditoria();
    const fueraDeCarga = Math.max(...completos) + 3;
    CJ.esDiaHabil(new Date(fueraDeCarga, 2, 5));
    ok(CJ.aniosSinFeriadosTocados().includes(fueraDeCarga),
        `tocar ${fueraDeCarga} queda anotado: sus feriados no se cargaron`);
    ok(typeof CJ.problemaDeDatos() === 'string',
        'y eso alcanza para que la herramienta no afirme una fecha');
    CJ.reiniciarAuditoria();

    console.log('\nFerias que terminan en agosto');

    // El bug de caducidad.html vivia justo aca. Se comprueba que el motor
    // reconozca como feria los dias de agosto de la Acordada.
    for (const [anio, dia] of [[2007, '2007-08-03'], [2008, '2008-08-08'],
                               [2014, '2014-08-01'], [2019, '2019-08-02'],
                               [2025, '2025-08-01']]) {
        ok(CJ.esFeriaJudicial(fecha(dia)), `${anio}: ${dia} es feria aunque sea agosto`);
        ok(!CJ.esDiaHabil(fecha(dia)), `${anio}: ${dia} es inhabil`);
    }
    // Regresion del bug: el primer habil despues de la feria de 2025 es el
    // lunes 4/8, no el 2/7. Se comprueba sobre el motor, que es lo que
    // caducidad.html usa ahora para calcular ese salto.
    const finFeria2025 = CJ.obtenerFeriasDelAnio(2025)[0].fin;
    ok(ymd(CJ.siguienteDiaHabil(finFeria2025)) === '2025-08-04',
        'el primer habil tras la feria de 2025 es el lunes 4/8',
        `dio ${ymd(CJ.siguienteDiaHabil(finFeria2025))}`);

    console.log('\nInvariantes del calendario judicial');

    // Enero dejo de estar escrito a mano el 24/8/2026. Que el motivo cite la
    // norma es la prueba de que el dato se leyo: con el default de arranque
    // enero seguiria siendo feria --a proposito-- pero diria solo "Feria
    // judicial de enero", sin el art. 2.
    const motivoEnero = CJ.obtenerMotivoInhabil(fecha('2026-01-15'));
    ok(/Reglamento para la Justicia Nacional/.test(motivoEnero || ''),
        'enero sale de data/feria-judicial.json y cita el art. 2 del RJN',
        `dice ${motivoEnero}`);

    for (const anio of completos) {
        const marzo = new Date(anio, 2, 1);
        while (marzo.getDay() !== 6) marzo.setDate(marzo.getDate() + 1);
        const domingo = new Date(marzo);
        domingo.setDate(domingo.getDate() + 1);

        ok(!CJ.esDiaHabil(marzo), `${anio}: sabado ${ymd(marzo)} es inhabil`);
        ok(!CJ.esDiaHabil(domingo), `${anio}: domingo ${ymd(domingo)} es inhabil`);
        ok(!CJ.esDiaHabil(new Date(anio, 0, 2)), `${anio}: 2 de enero es feria`);
        ok(!CJ.esDiaHabil(new Date(anio, 0, 31)), `${anio}: 31 de enero es feria`);
        ok(!CJ.esDiaHabil(new Date(anio, 10, 16)), `${anio}: 16 de noviembre es inhabil`);

        // Jueves santo. No viene de la API --trae feriados, y el jueves santo
        // es dia NO LABORABLE, que es otra categoria-- asi que se carga a mano
        // en dias-inhabiles.json, y hasta el 24/8/2026 estaba cargado solo
        // 2025: de 2021 a 2024 el motor lo contaba como habil. Un dia habil de
        // mas adelanta el vencimiento y no se ve.
        //
        // El control no deduce la fecha de Pascua: toma el viernes santo, que
        // si viene en feriados.json, y exige que el dia anterior sea inhabil.
        // Asi el olvido de un anio falla aca en vez de salir publicado.
        for (const f of feriadosJSON[String(anio)]) {
            if (!/viernes\s+santo/i.test(f.motivo || '')) continue;
            const jueves = fecha(f.fecha);
            jueves.setDate(jueves.getDate() - 1);
            ok(!CJ.esDiaHabil(jueves), `${anio}: el jueves santo ${ymd(jueves)} es inhabil`,
                'no esta en data/dias-inhabiles.json');
        }

        for (const plazo of [1, 5, 10, 15]) {
            const partida = new Date(anio, 2, 2);
            const llegada = CJ.contarDiasHabiles(partida, plazo);
            ok(CJ.esDiaHabil(llegada),
                `${anio}: contar ${plazo} habiles desde ${ymd(partida)} cae en habil`,
                `cayo ${ymd(llegada)}`);
            ok(llegada > partida, `${anio}: contar ${plazo} habiles avanza`);
        }

        for (const mes of [0, 6, 10]) {
            const d = new Date(anio, mes, 15);
            const sig = CJ.siguienteDiaHabil(d);
            ok(sig > d, `${anio}-${mes + 1}: siguienteDiaHabil avanza`);
            ok(CJ.esDiaHabil(sig), `${anio}-${mes + 1}: siguienteDiaHabil devuelve habil`,
                `devolvio ${ymd(sig)}`);
        }

        // Un inhabil sin motivo es una pantalla que dice "no se computa" y no
        // dice por que.
        for (let mes = 0; mes < 12; mes++) {
            for (const dia of [1, 15, 28]) {
                const d = new Date(anio, mes, dia);
                if (CJ.esDiaHabil(d)) continue;
                ok(!!CJ.obtenerMotivoInhabil(d),
                    `${anio}-${mes + 1}-${dia}: inhabil con motivo declarado`);
            }
        }
    }

    // -----------------------------------------------------------------------
    // Las heuristicas contra las Acordadas. No son asserts: son la evidencia.
    // -----------------------------------------------------------------------
    let aciertaPenultimo = 0;
    let aciertaTercer = 0;
    for (const anio of conFechas) {
        const real = feriaJSON[String(anio)].rangos[0].inicio;
        if (ymd(penultimoLunesJulio(anio)) === real) aciertaPenultimo++;
        if (ymd(tercerLunesJulio(anio)) === real) aciertaTercer++;
    }

    console.log(`\n${pruebas} comprobaciones, ${fallos} fallas.`);
    console.log('\nPor que la feria no es una formula');
    console.log(`  penultimo lunes de julio (motor hasta el 17/8): ${aciertaPenultimo}/${conFechas.length}`);
    console.log(`  tercer lunes de julio (mora.html hasta hoy)   : ${aciertaTercer}/${conFechas.length}`);
    console.log('  y ninguna produce 2009 —rectificada y ampliada— ni 2020,');
    console.log('  con la ordinaria suspendida y once extraordinarias encadenadas.');

    console.log('\nLas cinco calculadoras de plazos usan el motor compartido:');
    console.log('  caducidad, entre-fechas, mora, regresiva y vencimientos.');
    console.log('  mora.html se paso el 17/8 y era la ultima con logica propia.');

    process.exit(fallos ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
