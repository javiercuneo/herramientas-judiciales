// Banco de pruebas del computo de plazos extraido a calculadoras/js/plazos.js.
//
// Que cubre y que NO:
//
//   - Cubre EL MOTOR extraido: la aritmetica de vencimiento y de mora, la
//     notificacion automatica y los dias de nota.
//   - NO cubre las pantallas. La comparacion contra las calculadoras publicadas
//     --que son la referencia a preservar y quedaron sin tocar-- vive en
//     scripts/pruebas-calculadoras.html, que las maneja por iframe. Este script
//     corre en Node y en CI; aquel necesita un navegador.
//
// Por que existe: plazos.js es una TRANSCRIPCION de codigo que vivia adentro de
// vencimientos.html y de mora.html. Una transcripcion no puede mover un numero,
// y "no puede" sin una prueba es una intencion. Cada REGRESION de abajo lleva el
// caso concreto con el resultado que la pantalla produce hoy.
//
// Correr con: npm run verificar-plazos

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

function igual(obtenido, esperado, descripcion) {
    ok(obtenido === esperado, descripcion, `esperado ${esperado}, obtenido ${obtenido}`);
}

const d = (fecha) => fecha.toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Carga de los dos motores.
//
// Los dos son IIFE de navegador: cuelgan su API de `window` y calendario-judicial
// pide los JSON con `fetch` sobre rutas relativas a calculadoras/. Se les arma
// ese entorno con lo minimo y se lee el disco en lugar de la red, igual que en
// verificar-calculos.mjs. El orden importa: plazos.js necesita el calendario ya
// colgado de `window`.
// ---------------------------------------------------------------------------
async function cargarMotores() {
    const ventana = {};
    const fetchLocal = async (url) => {
        const limpia = String(url).split('?')[0].replace(/^\.\.\//, '');
        const texto = await readFile(join(RAIZ, limpia), 'utf8');
        return { ok: true, status: 200, json: async () => JSON.parse(texto) };
    };

    for (const archivo of ['calendario-judicial.js', 'plazos.js']) {
        const fuente = await readFile(join(RAIZ, 'calculadoras', 'js', archivo), 'utf8');
        new Function('window', 'fetch', fuente)(ventana, fetchLocal);
    }

    if (!ventana.CalendarioJudicial) throw new Error('calendario-judicial.js no publico window.CalendarioJudicial');
    if (!ventana.Plazos) throw new Error('plazos.js no publico window.Plazos');

    return { CJ: ventana.CalendarioJudicial, P: ventana.Plazos };
}

const { CJ, P } = await cargarMotores();
const carga = await CJ.init([2021, 2022, 2023, 2024, 2025, 2026, 2027]);
if (carga.loadError && carga.missingYears.length) {
    console.log(`  AVISO  faltan los feriados de ${carga.missingYears.join(', ')}`);
}

console.log('Verificando el computo de plazos...\n');

// ---------------------------------------------------------------------------
// REGRESION: el caso con el que pipeline-drafter pidio este motor.
//
// Es la cadena entera de un recurso extraordinario y esta verificada contra una
// resolucion real: notificacion 18/6/2026, diez dias habiles del art. 257 CPCCN
// para que quede firme, y diez corridos del art. 54 de la ley 27.423 para pagar.
// Si alguno de estos tres numeros se mueve, se rompio la extraccion.
// ---------------------------------------------------------------------------
console.log('Mora: la cadena del art. 257 CPCCN + art. 54 ley 27.423');
{
    const m = P.mora({ anio: 2026, mes: 6, dia: 18, diasHabiles: 10, diasCorridos: 10 });
    igual(d(m.firme), '2026-07-02', 'diez dias habiles desde el 18/6/2026');
    igual(d(m.inicioCorridos), '2026-07-03', 'queda firme el habil siguiente');
    igual(d(m.vencimiento), '2026-07-12', 'diez corridos mas: la mora opera el 12/7/2026');
    igual(m.problema, null, 'el computo no toco ningun anio sin datos');
}

// ---------------------------------------------------------------------------
// INVARIANTES de mora: ciertos siempre, con cualquier fecha.
// ---------------------------------------------------------------------------
console.log('\nMora: invariantes');
{
    // El salto de entrada es uno si la notificacion cae habil y dos si cae
    // inhabil. Es la frase que el comentario de mora.html deja escrita, y es lo
    // que la extraccion no podia perder.
    const habil = P.mora({ anio: 2026, mes: 6, dia: 18, diasHabiles: 1, diasCorridos: 0 });
    ok(CJ.esDiaHabil(new Date(2026, 5, 18)), 'el 18/6/2026 es habil');
    igual(d(habil.inicioHabiles), '2026-06-19', 'notificado en dia habil, cuenta desde el habil siguiente');

    const inhabil = P.mora({ anio: 2026, mes: 6, dia: 20, diasHabiles: 1, diasCorridos: 0 });
    ok(!CJ.esDiaHabil(new Date(2026, 5, 20)), 'el 20/6/2026 es sabado');
    igual(d(inhabil.inicioHabiles), '2026-06-23', 'notificado en inhabil, dos saltos: al habil y al siguiente');

    // Cero dias corridos: el vencimiento es el dia anterior al inicio del tramo,
    // que es el mismo dia en que quedo firme. Es consecuencia del conteo
    // inclusivo y se fija para que nadie lo "arregle".
    const sinCorridos = P.mora({ anio: 2026, mes: 6, dia: 18, diasHabiles: 10, diasCorridos: 0 });
    igual(d(sinCorridos.vencimiento), d(sinCorridos.firme), 'con cero corridos el vencimiento es el dia en que quedo firme');
}

// ---------------------------------------------------------------------------
// INVARIANTES de vencimiento por cedula.
// ---------------------------------------------------------------------------
console.log('\nVencimiento por cedula');
{
    const v = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10 });
    igual(d(v.fechaNotificacion), '2026-06-18', 'dia habil y hora habil: practicada ese mismo dia');
    igual(d(v.fechaInicioConteo), '2026-06-19', 'el plazo corre desde el habil siguiente');
    igual(v.diasContados.length, 10, 'se contaron diez dias habiles');
    ok(v.diasContados.every((f) => CJ.esDiaHabil(f)), 'todos los dias contados son habiles');
    ok(CJ.esDiaHabil(v.vencimiento), 'el vencimiento nunca cae en un dia inhabil');

    // El sabado a las 23 hs. suma UN dia, no dos. Los dos supuestos --dia
    // inhabil y hora inhabil-- son el mismo y no se acumulan. Hasta el 17/8/2026
    // el desplegable dejaba elegir las dos cosas juntas y elegir "habil" un
    // sabado devolvia el vencimiento un dia antes.
    const sabadoEnHora = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 20, plazo: 10 });
    const sabadoFuera = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 20, plazo: 10, fueraDeHorario: true });
    igual(d(sabadoFuera.vencimiento), d(sabadoEnHora.vencimiento), 'sabado: la hora no acumula un segundo salto');

    // Fuera de horario en dia habil si desplaza, y desplaza exactamente un habil.
    const enHora = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10 });
    const fuera = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10, fueraDeHorario: true });
    igual(d(fuera.fechaNotificacion), d(CJ.siguienteDiaHabil(enHora.fechaNotificacion)),
        'dia habil fuera de hora: practicada el habil siguiente');
}

// ---------------------------------------------------------------------------
// La ampliacion del art. 158 CPCCN suma dias HABILES, no corridos.
//
// Es la distincion que el comentario de vencimientos.html deja escrita: se suma
// al PLAZO y la cuenta el mismo bucle, asi que salta feria, feriados y fines de
// semana como los demas. Sumarla sobre la fecha ya calculada serian corridos y
// daria una fecha anterior.
// ---------------------------------------------------------------------------
console.log('\nAmpliacion por distancia (art. 158 CPCCN)');
{
    const sin = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10 });
    const con = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10, ampliacion: 3 });

    igual(con.plazoTotal, 13, 'la ampliacion se suma al plazo');
    igual(con.diasContados.length, 13, 'y la cuenta el mismo bucle');
    ok(con.vencimiento > sin.vencimiento, 'con ampliacion el vencimiento es posterior');
    ok(CJ.esDiaHabil(con.vencimiento), 'el vencimiento ampliado tampoco cae en inhabil');

    // La prueba de que son habiles y no corridos: tres dias corridos sobre la
    // fecha sin ampliar dan una fecha distinta de la ampliada, salvo que los
    // tres dias siguientes sean todos habiles. Se elige un caso donde no lo son.
    const corridos = new Date(sin.vencimiento);
    corridos.setDate(corridos.getDate() + 3);
    ok(d(con.vencimiento) !== d(corridos) || con.diasSalteados.length === sin.diasSalteados.length,
        'la ampliacion no se sumo como dias corridos');

    const cero = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10, ampliacion: 0 });
    igual(d(cero.vencimiento), d(sin.vencimiento), 'ampliacion 0 es lo mismo que no ampliar');
}

// ---------------------------------------------------------------------------
// Notificacion automatica (art. 133 CPCCN): los dias de nota.
// ---------------------------------------------------------------------------
console.log('\nNotificacion automatica (art. 133 CPCCN)');
{
    // Sea cual sea el dia de la firma, la notificacion cae en un dia de nota
    // habil: martes o viernes. Se recorre un anio entero.
    let malos = 0;
    for (let i = 0; i < 365; i++) {
        const firma = new Date(Date.UTC(2026, 0, 1 + i, 12));
        const notif = P.notificacionAutomatica(firma);
        const dia = notif.getDay();
        if ((dia !== 2 && dia !== 5) || !CJ.esDiaHabil(notif)) malos++;
    }
    igual(malos, 0, 'la notificacion automatica siempre cae en martes o viernes habil');

    // Dejar nota corre la notificacion al proximo dia de nota.
    const sinNota = P.vencimiento({ modalidad: 'automatica', anio: 2026, mes: 6, dia: 18, plazo: 10 });
    const conNota = P.vencimiento({
        modalidad: 'automatica', anio: 2026, mes: 6, dia: 18, plazo: 10,
        notasDejadas: [d(sinNota.fechaNotificacion)]
    });
    ok(conNota.fechaNotificacion > sinNota.fechaNotificacion,
        'la nota en el libro corre la notificacion al proximo dia de nota');
    const diaNota = conNota.fechaNotificacion.getDay();
    ok(diaNota === 2 || diaNota === 5, 'y el dia corrido tambien es dia de nota');

    const par = P.parDeNotas(new Date(Date.UTC(2026, 5, 18, 12)));
    igual(par.length, 2, 'el par de dias de nota trae dos fechas');
    ok(par[1] > par[0], 'y en orden');
}

// ---------------------------------------------------------------------------
// La guarda de datos faltantes se hereda entera.
//
// Es lo que separa a este motor de una calculadora cualquiera: si el computo
// toca un anio cuya Acordada de feria no se dicto, o cuyos feriados no estan
// cargados, `problema` deja de ser null y la fecha NO se puede afirmar.
//
// Y la guarda es fina, no gruesa: un computo de febrero de 2027 no depende de la
// Acordada de la feria de invierno de 2027, asi que calcula. Bloquear el anio
// entero dejaria la herramienta muerta esperando un acto que no se dicto.
// ---------------------------------------------------------------------------
console.log('\nLa guarda de datos faltantes');
{
    const feriaFaltante = carga.missingFeriaYears;

    if (feriaFaltante.includes(2027)) {
        const febrero = P.vencimiento({ modalidad: 'cedula', anio: 2027, mes: 2, dia: 15, plazo: 10 });
        igual(febrero.problema, null, 'febrero de 2027 calcula: no toca la feria de invierno');

        const cruzaJulio = P.vencimiento({ modalidad: 'cedula', anio: 2027, mes: 6, dia: 15, plazo: 30 });
        ok(cruzaJulio.problema !== null, 'un computo que cruza a julio de 2027 no afirma una fecha');
        ok(/feria judicial de invierno/.test(cruzaJulio.problema || ''),
            'y el motivo nombra la feria', cruzaJulio.problema);
    } else {
        console.log('  (la feria de 2027 ya esta cargada: esta seccion se saltea)');
    }

    // Un anio sin feriados cargados bloquea el anio ENTERO, no solo julio, y eso
    // es correcto: un feriado puede caer en cualquier mes. Es la diferencia con
    // la feria, y es la razon por la que data/feriados.json hay que mantenerlo
    // al dia: cuando se quede corto, la herramienta se congela para ese anio.
    const anioSinDatos = Math.max(...carga.loadedYears) + 1;
    const lejos = P.vencimiento({ modalidad: 'cedula', anio: anioSinDatos, mes: 3, dia: 10, plazo: 5 });
    ok(lejos.problema !== null, `marzo de ${anioSinDatos} no afirma una fecha: faltan los feriados`);
}

// ---------------------------------------------------------------------------
// Entradas invalidas: se rechazan con un mensaje, no con una fecha.
// ---------------------------------------------------------------------------
console.log('\nEntradas invalidas');
{
    const rechaza = (fn, descripcion) => {
        try { fn(); ok(false, descripcion, 'no lanzo error'); }
        catch (e) { ok(/[áéíóúñ]/.test(e.message), descripcion, `mensaje sin acentuar: ${e.message}`); }
    };
    rechaza(() => P.vencimiento({ anio: 2026, mes: 6, dia: 18, plazo: 0 }), 'plazo 0 se rechaza, con mensaje acentuado');
    rechaza(() => P.vencimiento({ anio: 2026, mes: 6, dia: 18, plazo: 10, ampliacion: -1 }), 'ampliacion negativa se rechaza');
    rechaza(() => P.mora({ anio: 2026, mes: 6, dia: 18, diasHabiles: 0, diasCorridos: 10 }), 'mora sin dias habiles se rechaza');
}

console.log(`\n${pruebas} comprobaciones, ${fallos} fallas.`);
process.exit(fallos ? 1 : 0);
