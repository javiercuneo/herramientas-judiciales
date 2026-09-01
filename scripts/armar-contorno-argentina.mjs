#!/usr/bin/env node
/**
 * Arma data/contorno-argentina.json a partir de la capa oficial del Instituto
 * Geografico Nacional.
 *
 * POR QUE ES UN DATO Y NO CODIGO. Un limite politico dibujado a ojo es un error
 * que se ve, y la Argentina tiene ademas el asunto de las islas del Atlantico
 * Sur y del sector antartico, donde una linea de mas o de menos no es un
 * detalle de dibujo. Vale la misma regla que con las Acordadas de la feria: lo
 * que fija un organismo va en datos, con la cita del organismo al lado, y no en
 * una funcion que lo aproxima.
 *
 * POR QUE CORRE A MANO Y NO EN EL NAVEGADOR. La capa cruda del IGN pesa 111 MB.
 * Se baja una vez, se simplifica y lo que entra al repositorio son unos 60 KB
 * versionados. La calculadora no le pide el mapa a nadie en tiempo de uso, que
 * es la regla de toda la casa: si el archivo no esta, no se dibuja el mapa y el
 * numero se calcula igual.
 *
 * QUE SE PIERDE AL SIMPLIFICAR, Y POR QUE NO IMPORTA ACA. Douglas-Peucker con
 * tolerancia de 0,02 grados mueve la costa hasta unos 2 km. Sobre un mapa de
 * 600 px que cubre 3.800 km, un pixel son 6 km: la simplificacion es mas fina
 * que el dibujo. Lo que NO se puede hacer con este archivo es decidir de que
 * lado de un limite cae un punto ---para eso esta la capa cruda del IGN--- y
 * por eso el archivo lo dice de si mismo.
 *
 *   node scripts/armar-contorno-argentina.mjs
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'data', 'contorno-argentina.json');

const CAPA = 'ign:provincia';
const WFS = 'https://wms.ign.gob.ar/geoserver/ows' +
    '?service=WFS&version=1.0.0&request=GetFeature' +
    '&outputFormat=application/json&typeName=' + encodeURIComponent(CAPA);

// Los tres parametros de la simplificacion, juntos y arriba para que se vea que
// son una decision y no un accidente. Cambiarlos cambia el tamaño del archivo y
// la fidelidad del dibujo, nada mas: ningun numero de la calculadora sale de
// aca.
const TOLERANCIA = 0.02;   // grados. Douglas-Peucker.
const DECIMALES = 3;       // ~110 m en latitud. Mas que suficiente para dibujar.
const ANILLO_MINIMO = 0.06; // grados de diagonal. Debajo de esto, en pantalla es un punto.

// ---------------------------------------------------------------------------
// Douglas-Peucker. Se hace en grados y sin proyectar: a esta tolerancia la
// diferencia contra hacerlo en metros es mucho menor que un pixel del dibujo, y
// proyectar primero agregaria una decision --que proyeccion-- que no hace falta
// tomar dos veces.
// ---------------------------------------------------------------------------
function distanciaAlSegmento(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function simplificar(puntos, tol) {
    if (puntos.length < 3) return puntos.slice();
    // Iterativo y no recursivo: un anillo de la costa patagonica tiene decenas
    // de miles de vertices y la recursion se pasa de pila.
    const guardar = new Uint8Array(puntos.length);
    guardar[0] = 1;
    guardar[puntos.length - 1] = 1;
    const pila = [[0, puntos.length - 1]];

    while (pila.length) {
        const [ini, fin] = pila.pop();
        let peor = 0, cual = -1;
        for (let i = ini + 1; i < fin; i++) {
            const d = distanciaAlSegmento(puntos[i], puntos[ini], puntos[fin]);
            if (d > peor) { peor = d; cual = i; }
        }
        if (peor > tol && cual !== -1) {
            guardar[cual] = 1;
            pila.push([ini, cual], [cual, fin]);
        }
    }

    const out = [];
    for (let i = 0; i < puntos.length; i++) if (guardar[i]) out.push(puntos[i]);
    return out;
}

const redondear = (p) => [
    Number(p[0].toFixed(DECIMALES)),
    Number(p[1].toFixed(DECIMALES))
];

function diagonal(anillo) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of anillo) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return Math.hypot(x1 - x0, y1 - y0);
}

// El GeoJSON del IGN trae MultiPolygon: una lista de poligonos, y cada poligono
// una lista de anillos ---el primero el contorno y los demas los huecos---. Para
// dibujar un contorno los huecos no hacen falta y son casi todos lagunas.
function anillosDe(geom) {
    const poligonos = geom.type === 'MultiPolygon' ? geom.coordinates
        : geom.type === 'Polygon' ? [geom.coordinates]
        : [];
    return poligonos.map((p) => p[0]).filter(Boolean);
}

async function main() {
    process.stdout.write(`Bajando ${CAPA} del IGN (son unos 110 MB, tarda)…\n`);
    const r = await fetch(WFS);
    if (!r.ok) throw new Error(`el IGN contestó HTTP ${r.status}`);
    const geo = await r.json();

    if (!geo.features || !geo.features.length) throw new Error('la capa vino vacía');
    process.stdout.write(`Recibidas ${geo.features.length} provincias.\n`);

    // El IGN publica 24 jurisdicciones. Si algun dia son otras, que se vea, en
    // vez de escribir un archivo con la mitad del pais y que nadie lo note.
    if (geo.features.length !== 24) {
        throw new Error(`el IGN devolvió ${geo.features.length} jurisdicciones y no 24: ` +
            'revisar la capa antes de escribir el archivo');
    }

    let vertIn = 0, vertOut = 0, descartados = 0;

    const provincias = geo.features.map((f) => {
        const nombre = f.properties.nam || f.properties.fna;
        const anillos = [];

        for (const a of anillosDe(f.geometry)) {
            vertIn += a.length;
            if (diagonal(a) < ANILLO_MINIMO) { descartados++; continue; }
            const s = simplificar(a, TOLERANCIA).map(redondear);
            // Simplificar puede dejar un anillo en dos o tres puntos: ya no es
            // una forma, es una raya.
            if (s.length < 4) { descartados++; continue; }
            vertOut += s.length;
            anillos.push(s);
        }

        return { nombre, anillos };
    }).filter((p) => p.anillos.length);

    const archivo = {
        descripcion: 'Contorno de las provincias argentinas, simplificado, para DIBUJAR. ' +
            'No sirve para decidir de qué lado de un límite cae un punto: la simplificación ' +
            'mueve la línea hasta unos 2 km. Para eso está la capa cruda del IGN.',
        fuente: 'Instituto Geográfico Nacional (IGN), capa ' + CAPA +
            ' del servicio WFS de geoservicios.',
        url: 'https://wms.ign.gob.ar/geoserver/ows',
        capa: CAPA,
        capturado: new Date().toISOString().slice(0, 10),
        // Se dice acá porque el que abre el archivo tiene que poder saber si lo
        // que ve es lo que el IGN publica o lo que alguien recortó. No se recortó
        // nada: están las 24 jurisdicciones tal como las devuelve la capa,
        // incluidas las islas del Atlántico Sur y el sector antártico, que van
        // dentro de Tierra del Fuego. Qué se dibuja de todo eso lo decide la
        // pantalla con su encuadre, y no este archivo sacando territorio.
        recorte: 'Ninguno. Las 24 jurisdicciones tal como las publica la capa del IGN.',
        simplificacion: {
            algoritmo: 'Douglas-Peucker',
            tolerancia_grados: TOLERANCIA,
            decimales: DECIMALES,
            anillos_descartados_con_diagonal_menor_a_grados: ANILLO_MINIMO,
            huecos: 'descartados: se dibuja el contorno, no las lagunas interiores'
        },
        provincias
    };

    // Se serializa a mano por una sola razon: JSON.stringify con sangria pone
    // CADA par de coordenadas en su renglon, y son 7.000. El archivo se triplica
    // y el diff no gana nada, porque nadie revisa una costa leyendo numeros. Lo
    // que si se revisa es el encabezado ---la fuente, la fecha, la tolerancia---
    // y eso queda legible. Un anillo por renglon.
    const anillo = (a) => '[' + a.map((p) => `[${p[0]},${p[1]}]`).join(',') + ']';
    const provinciasTxt = provincias.map((p) =>
        '  {\n   "nombre": ' + JSON.stringify(p.nombre) + ',\n   "anillos": [\n' +
        p.anillos.map((a) => '    ' + anillo(a)).join(',\n') +
        '\n   ]\n  }').join(',\n');

    const cabecera = JSON.stringify(
        Object.fromEntries(Object.entries(archivo).filter(([k]) => k !== 'provincias')),
        null, 1);

    writeFileSync(SALIDA,
        cabecera.slice(0, -2) + ',\n "provincias": [\n' + provinciasTxt + '\n ]\n}\n',
        'utf8');

    // Y se relee lo escrito: un serializador a mano que produce JSON invalido
    // no se nota hasta que la pagina no dibuja nada.
    JSON.parse(readFileSync(SALIDA, 'utf8'));

    const kb = (JSON.stringify(archivo).length / 1024).toFixed(1);
    process.stdout.write(
        `Escrito data/contorno-argentina.json\n` +
        `  ${provincias.length} jurisdicciones · ${vertOut} vértices ` +
        `(de ${vertIn}) · ${descartados} anillos descartados por chicos\n` +
        `  ${kb} KB\n`);
}

main().catch((e) => {
    // Aborta entero y no escribe medio archivo, igual que actualizar-feriados:
    // medio contorno se ve como un mapa roto, pero medio archivo de datos se ve
    // como un mapa raro y nadie lo mira dos veces.
    process.stderr.write('No se escribió nada: ' + e.message + '\n');
    process.exit(1);
});
