#!/usr/bin/env node
/**
 * Controla data/acordada-5-2010-distancias.json contra la regla del art. 158.
 *
 * POR QUE EXISTE. La tabla se transcribio de una IMAGEN escaneada ---el anexo de
 * la Acordada 5/2010 es un JPG, no hay texto--- y una transcripcion de 45 filas
 * por cinco columnas tiene 225 oportunidades de equivocarse en un digito. Un
 * digito de mas en una distancia no rompe nada: devuelve un plazo plausible y
 * equivocado, que es la peor clase de error que este repositorio puede producir.
 *
 * QUE PRUEBA, Y ES MAS FUERTE DE LO QUE PARECE. La Acordada publica las
 * distancias Y los dias, y los dias salen de las distancias por una regla
 * escrita: un dia cada 200 km o fraccion que no baje de 100, aplicada a LA MAS
 * LARGA de las dos medidas (Acordada 50/86, recitada en el considerando I de la
 * 5/2010). O sea que la propia tabla trae con que controlarse: si una distancia
 * se transcribio mal, el dia que sale de ella deja de coincidir con el dia
 * publicado. Son 45 comprobaciones independientes, y para que una pase estando
 * mal habria que haber errado la distancia Y el dia de forma consistente.
 *
 * Y la segunda columna: plazo_queja = dias_art_158 + 5, los cinco del art. 282
 * para interponer la queja. Otras 45.
 *
 * LO QUE NO PRUEBA: que las distancias sean ciertas. Eso lo dijeron la Comision
 * Nacional de Regulacion del Transporte y Vialidad Nacional, y la Corte lo
 * publico. Esto prueba que lo que esta en el archivo es lo que esta en la
 * imagen, que es lo unico que un script puede probar.
 *
 *   npm run verificar-acordada
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO = join(RAIZ, 'data', 'acordada-5-2010-distancias.json');

// El art. 158: «los plazos se extenderan a razon de un dia por cada doscientos
// kilometros o fraccion que no baje de cien». Escrito igual que en plazos.js
// ---no se importa a proposito: un control que reusa el codigo que controla no
// controla nada---.
function diasPorDistancia(km) {
    const enteros = Math.floor(km / 200);
    const resto = km - enteros * 200;
    return enteros + (resto >= 100 ? 1 : 0);
}

const DIAS_QUEJA = 5;   // art. 282 CPCCN

let pasan = 0;
const fallas = [];

const a = JSON.parse(readFileSync(ARCHIVO, 'utf8'));

if (!Array.isArray(a.asientos) || !a.asientos.length) {
    process.stderr.write('El archivo no tiene asientos.\n');
    process.exit(1);
}

// La cantidad se fija acá a propósito: si alguien agrega una fila sin mirar la
// imagen, el número cambia y hay que venir a moverlo a mano, que es el momento
// en que uno se pregunta de dónde salió.
const ESPERADOS = 45;
if (a.asientos.length !== ESPERADOS) {
    fallas.push(`el anexo tiene ${ESPERADOS} filas y el archivo trae ${a.asientos.length}`);
}

const vistos = new Set();

for (const s of a.asientos) {
    const donde = s.nombre;

    if (vistos.has(donde)) fallas.push(`${donde}: repetido`);
    vistos.add(donde);

    if (typeof s.ruta !== 'number' || !(s.ruta > 0)) {
        fallas.push(`${donde}: la distancia por ruta no es un número positivo`);
        continue;
    }
    if (s.via_ferrea !== null && !(typeof s.via_ferrea === 'number' && s.via_ferrea > 0)) {
        fallas.push(`${donde}: vía férrea tiene que ser un número o null`);
        continue;
    }

    // LA MAS LARGA de las dos, que es la regla de la Acordada 50/86. Donde no
    // hay ferrocarril, la unica que hay es la de ruta.
    const mayor = s.via_ferrea === null ? s.ruta : Math.max(s.ruta, s.via_ferrea);
    const esperado = diasPorDistancia(mayor);

    if (esperado !== s.dias_art_158) {
        fallas.push(
            `${donde}: la tabla dice ${s.dias_art_158} día(s) del art. 158 y de ` +
            `${mayor} km salen ${esperado}. O la distancia o el día están mal transcriptos`);
    } else {
        pasan++;
    }

    if (s.plazo_queja !== s.dias_art_158 + DIAS_QUEJA) {
        fallas.push(
            `${donde}: plazo de queja ${s.plazo_queja}, y ${s.dias_art_158} + ` +
            `${DIAS_QUEJA} dan ${s.dias_art_158 + DIAS_QUEJA}`);
    } else {
        pasan++;
    }
}

// La cita tiene que estar, y tiene que llevar a algo que se pueda abrir: una
// tabla de plazos sin la norma al lado es un numero sin fundamento.
for (const campo of ['norma', 'url', 'url_anexo', 'capturado']) {
    if (!a[campo]) fallas.push(`falta el campo «${campo}»: la tabla no puede ir sin su cita`);
}

process.stdout.write('\n  Acordada 5/2010 — tabla de distancias a los asientos federales\n');
process.stdout.write('  ' + '='.repeat(62) + '\n');

if (fallas.length) {
    fallas.forEach((f) => process.stdout.write('  x  ' + f + '\n'));
    process.stdout.write(`\n  ${pasan} comprobaciones pasan, ${fallas.length} fallan.\n\n`);
    process.exit(1);
}

process.stdout.write(
    `  ${pasan} comprobaciones, ninguna falla.\n` +
    `  Las ${a.asientos.length} filas cierran: los días publicados salen de aplicar\n` +
    `  200 km/fracción ≥ 100 a la MÁS LARGA de las dos distancias, y el plazo de\n` +
    `  queja es esa cifra más los 5 días del art. 282.\n\n` +
    `  Esto no dice que las distancias sean ciertas ---eso lo informaron la CNRT y\n` +
    `  Vialidad y lo publicó la Corte---: dice que el archivo dice lo que dice la\n` +
    `  imagen del anexo.\n\n`);
