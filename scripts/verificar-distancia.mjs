// Banco de pruebas de calculadoras/js/distancia.js, el computo de la ampliacion
// del art. 158 CPCCN.
//
// QUE CUBRE Y QUE NO:
//
//   - Cubre EL MOTOR: la regla del art. 158 en sus bordes, la linea recta, y
//     sobre todo la busqueda en la tabla de la Acordada 5/2010, que es donde un
//     error no se ve ---devolver los dias de OTRA ciudad es un numero plausible
//     y equivocado---.
//   - NO cubre la pantalla ni la red. Que GEOREF y OSRM contesten lo que se
//     espera no lo prueba esto, y no puede: son terceros.
//   - NO cubre que la tabla este bien transcripta. Eso es verificar-acordada.
//
// Correr con: npm run verificar-distancia

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

let fallos = 0;
let pruebas = 0;

function ok(condicion, descripcion, detalle) {
    pruebas++;
    if (condicion) {
        console.log(`  ok    ${descripcion}`);
    } else {
        fallos++;
        console.log(`  FALLA ${descripcion}${detalle ? '\n          ' + detalle : ''}`);
    }
}

const igual = (a, b, d) => ok(a === b, d, `esperaba ${JSON.stringify(b)} y dio ${JSON.stringify(a)}`);

const fuente = await readFile(join(RAIZ, 'calculadoras', 'js', 'distancia.js'), 'utf8');
const ventana = {};
new Function('window', fuente)(ventana);
const D = ventana.Distancia;
if (!D) throw new Error('distancia.js no publico window.Distancia');

const tabla = JSON.parse(
    await readFile(join(RAIZ, 'data', 'acordada-5-2010-distancias.json'), 'utf8'));

console.log('Verificando el computo de la ampliacion por distancia...\n');

// ---------------------------------------------------------------------------
// La regla del art. 158, en sus bordes.
//
// «Los plazos se extenderan a razon de un dia cada doscientos kilometros o
// fraccion que no baje de cien». Los bordes son donde una implementacion con
// Math.ceil o con un > en vez de un >= se equivoca, y se equivoca por un dia
// entero.
// ---------------------------------------------------------------------------
console.log('El art. 158, en los bordes');
igual(D.diasPorDistancia(0), 0, '0 km: no hay ampliacion');
igual(D.diasPorDistancia(99), 0, '99 km: la fraccion baja de cien');
igual(D.diasPorDistancia(99.99), 0, '99,99 km: sigue bajando de cien');
igual(D.diasPorDistancia(100), 1, '100 km: «no baje de cien» INCLUYE a cien');
igual(D.diasPorDistancia(199), 1, '199 km: cero doscientos y una fraccion que no baja de cien');
igual(D.diasPorDistancia(200), 1, '200 km: un doscientos justo');
igual(D.diasPorDistancia(299), 1, '299 km: un doscientos y 99 que no alcanzan');
igual(D.diasPorDistancia(300), 2, '300 km: un doscientos y 100 que alcanzan');
igual(D.diasPorDistancia(400), 2, '400 km: dos doscientos justos');
igual(D.diasPorDistancia(499.99), 2, '499,99 km: dos doscientos y 99,99');
igual(D.diasPorDistancia(500), 3, '500 km: dos doscientos y 100');
ok(D.diasPorDistancia(-5) === null, 'una distancia negativa no devuelve un numero de dias');

// ---------------------------------------------------------------------------
// La linea recta.
// ---------------------------------------------------------------------------
console.log('\nLa linea recta (Haversine)');
{
    // Congreso de la Nacion y Cordoba capital. El valor de referencia es el que
    // la calculadora publicada viene mostrando: 645,82 km.
    const km = D.lineaRecta(-34.609867, -58.39254, -31.4150461523809, -64.1791140755104);
    ok(Math.abs(km - 645.82) < 0.5, 'Congreso-Cordoba da 645,82 km', `dio ${km.toFixed(2)}`);
    igual(D.diasPorDistancia(km), 3, 'y de ahi salen 3 dias');
}
igual(Math.round(D.lineaRecta(-34.6, -58.4, -34.6, -58.4)), 0, 'el mismo punto da cero');
{
    // La recta es un PISO: nunca puede dar mas que la ruta. Se comprueba contra
    // la distancia por ruta que publica la propia Acordada.
    const caba = { lat: -34.609867, lon: -58.39254 };
    const cordoba = { lat: -31.4150461523809, lon: -64.1791140755104 };
    const recta = D.lineaRecta(caba.lat, caba.lon, cordoba.lat, cordoba.lon);
    const filaCordoba = tabla.asientos.find((a) => a.nombre === 'Córdoba');
    ok(recta < filaCordoba.ruta,
        'la recta es menor que la ruta que publica la Corte para el mismo par',
        `recta ${recta.toFixed(1)} contra ruta ${filaCordoba.ruta}`);
}

// ---------------------------------------------------------------------------
// La tabla de la Corte: LA INTEGRACION, que es lo que ningun otro control mira.
//
// verificar-acordada prueba que el archivo diga lo que dice la imagen. Esto
// prueba lo otro: que el motor ENCUENTRE cada fila y devuelva SUS dias. Un
// nombre que no matchea cae en silencio a la ruta y da un numero razonable pero
// que no es el de la Corte; un nombre que matchea de mas da los dias de otra
// ciudad.
// ---------------------------------------------------------------------------
console.log('\nLa tabla de la Acordada 5/2010: las 45 filas se encuentran');
{
    let encontradas = 0;
    const perdidas = [];
    for (const a of tabla.asientos) {
        const r = D.porLaCorte('Ciudad Autónoma de Buenos Aires', a.nombre, tabla);
        if (r && r.dias === a.dias_art_158 && r.asiento === a.nombre) encontradas++;
        else perdidas.push(a.nombre + (r ? ` → dio ${r.dias} y son ${a.dias_art_158}` : ' → no la encontro'));
    }
    ok(encontradas === tabla.asientos.length,
        `las ${tabla.asientos.length} filas se encuentran por su nombre y devuelven sus dias`,
        perdidas.join(' · '));
}

console.log('\nLa tabla: la regla de la mas larga, y los casos que la muestran');
{
    const f = D.porLaCorte('CABA', 'Formosa', tabla);
    igual(f.dias, 13, 'Formosa da 13 dias');
    igual(f.km, 2501, 'porque manda la via ferrea (2501) sobre la ruta (1112)');
    igual(D.diasPorDistancia(f.kmRuta), 6,
        'calculando solo por ruta darian 6: es la diferencia que justifica cargar la tabla');
}
{
    const r = D.porLaCorte('CABA', 'Resistencia', tabla);
    igual(r.dias, 7, 'Resistencia da 7 dias, y tambien manda el tren (1446 sobre 949)');
}
{
    const u = D.porLaCorte('CABA', 'Ushuaia', tabla);
    igual(u.dias, 16, 'Ushuaia da 16 dias');
    igual(u.kmViaFerrea, null, 'y no tiene via ferrea: manda la ruta, que es la unica');
    igual(u.plazoQueja, 21, 'el plazo de queja son esos 16 mas los 5 del art. 282');
}

console.log('\nLa tabla: los sinonimos, que es como la escribe la gente');
{
    const casos = [
        ['San Miguel de Tucumán', 'Tucumán', 6],
        ['San Miguel de Tucumán, Capital, Tucumán', 'Tucumán', 6],
        ['Santiago del Estero', 'Santiago del Estero', 5],
        ['Sgo. del Estero', 'Santiago del Estero', 5],
        ['San Carlos de Bariloche', 'Bariloche', 9],
        ['San Fernando del Valle de Catamarca', 'Catamarca', 7],
        ['San Salvador de Jujuy', 'Jujuy', 8],
        ['Comodoro Rivadavia', 'Comodoro Rivadavia', 9],
        ['Presidencia Roque Sáenz Peña', 'Roque Sáenz Peña', 6],
        ['San Nicolás de los Arroyos', 'San Nicolás', 1],
        ['Concepción del Uruguay', 'Concepción del Uruguay', 2]
    ];
    for (const [escrito, esperado, dias] of casos) {
        const r = D.porLaCorte('Capital Federal', escrito, tabla);
        ok(r && r.asiento === esperado && r.dias === dias,
            `«${escrito}» encuentra ${esperado} (${dias} dias)`,
            r ? `dio ${r.asiento} con ${r.dias}` : 'no la encontro');
    }
}

console.log('\nLa tabla: cuando NO corresponde, que es la mitad del trabajo');
{
    ok(D.porLaCorte('San Miguel de Tucumán', 'Salta', tabla) === null,
        'Tucuman-Salta no esta en la tabla: mide desde la Capital Federal y nada mas');
    ok(D.porLaCorte('CABA', 'Rafaela', tabla) === null,
        'Rafaela no es asiento federal de la tabla');
    ok(D.porLaCorte('CABA', 'Ciudad Autónoma de Buenos Aires', tabla) === null,
        'CABA contra CABA no es un par de la tabla');
    ok(D.porLaCorte('Rosario', 'Córdoba', tabla) === null,
        'dos asientos entre si tampoco: la tabla no da esa distancia');
    ok(D.porLaCorte('CABA', '', tabla) === null, 'un nombre vacio no encuentra nada');
}
{
    // La trampa que un algoritmo de parecido pisa: son dos ciudades distintas y
    // los dias no son los mismos ---San Juan 6, San Luis 4---.
    const sj = D.porLaCorte('CABA', 'San Juan', tabla);
    const sl = D.porLaCorte('CABA', 'San Luis', tabla);
    igual(sj.asiento, 'San Juan', 'San Juan encuentra San Juan');
    igual(sl.asiento, 'San Luis', 'San Luis encuentra San Luis');
    ok(sj.dias !== sl.dias, 'y no dan lo mismo, que es por que confundirlas importa');
    ok(D.porLaCorte('CABA', 'San Juan Bautista', tabla) === null,
        '«San Juan Bautista» NO encuentra San Juan: se exige el nombre entero y no que lo contenga');
}

console.log('\nLa tabla: da igual de que lado se escriba cada punto');
{
    const ida = D.porLaCorte('Ciudad Autónoma de Buenos Aires', 'Mendoza', tabla);
    const vuelta = D.porLaCorte('Mendoza', 'Ciudad Autónoma de Buenos Aires', tabla);
    ok(ida && vuelta && ida.dias === vuelta.dias && ida.dias === 5,
        'CABA-Mendoza y Mendoza-CABA dan los mismos 5 dias');
}

console.log('\nQue cuenta como Capital Federal');
for (const n of ['CABA', 'Capital Federal', 'Ciudad Autónoma de Buenos Aires',
                 'Congreso de la Nación (CABA, Argentina)', 'Buenos Aires']) {
    ok(D.esCapitalFederal(n), `«${n}» cuenta como Capital Federal`);
}
for (const n of ['Bahía Blanca', 'La Plata', 'Mar del Plata', '']) {
    ok(!D.esCapitalFederal(n), `«${n}» no cuenta como Capital Federal`);
}
ok(!D.esCapitalFederal('Bahía Blanca'),
    'Bahia Blanca es provincia de Buenos Aires y NO es la Capital Federal');

// ---------------------------------------------------------------------------
// Las otras dos fuentes.
// ---------------------------------------------------------------------------
console.log('\nRuta y linea recta como resultado');
{
    const r = D.porRuta(697.71);
    igual(r.fuente, 'ruta', 'la ruta se declara como tal');
    igual(r.dias, 3, '697,71 km por ruta dan 3 dias');
}
{
    const r = D.porLineaRecta(-34.609867, -58.39254, -31.415046, -64.179114);
    igual(r.fuente, 'recta', 'la recta se declara como tal');
    ok(r.esPiso === true, 'y se declara que es un PISO, no una respuesta');
}
ok(D.porRuta(-1) === null, 'una ruta negativa no devuelve un resultado');

console.log('\nLa explicacion que va a pantalla');
{
    const t = D.explicar(697.71, 3);
    ok(/3 × 200 km/.test(t), 'dice cuantos doscientos entran');
    ok(/97,71 km/.test(t), 'dice cuanto sobra');
    ok(/no llegan a 100/.test(t), 'y por que eso no suma un dia');
}
{
    const t = D.explicar(305, 2);
    ok(/no bajan de 100: suman 1 día/.test(t), 'y cuando sobra suficiente, lo dice al reves');
}

console.log(`\n${pruebas} comprobaciones, ${fallos} fallas.`);
if (fallos) process.exit(1);
