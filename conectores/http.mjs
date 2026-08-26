// El calendario judicial y el computo de plazos, por HTTP local.
//
// Es la mitad del conector que consume codigo: Python, otro Node, un cliente
// HTTP cualquiera. La otra mitad --la que consume un modelo-- es
// conectores/mcp.mjs, y las dos cuelgan del mismo nucleo.mjs. NINGUNA de las
// dos calcula: si un numero sale distinto en una y en otra, es un bug de
// transporte, no de criterio, porque el criterio esta en un solo lugar.
//
// Correr con: npm run conector-http
//
// ESCUCHA SOLO EN 127.0.0.1, y eso no es una precaucion generica: este
// repositorio es publico y sus datos no son secretos, pero un servicio que
// afirma fechas de vencimiento no tiene por que estar disponible en la red de
// nadie. Si alguna vez hace falta exponerlo, que sea una decision escrita y no
// el default.

import { createServer } from 'node:http';
import { HERRAMIENTAS, ErrorDeEntrada } from './nucleo.mjs';

const HOST = '127.0.0.1';
const PUERTO = Number(process.env.PUERTO || 8787);

function json(res, codigo, cuerpo) {
    const texto = JSON.stringify(cuerpo, null, 2);
    res.writeHead(codigo, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(texto)
    });
    res.end(texto);
}

async function leerCuerpo(req) {
    const partes = [];
    let bytes = 0;
    for await (const parte of req) {
        bytes += parte.length;
        // Ninguna entrada legitima de este servicio pasa de unos pocos KB.
        if (bytes > 64 * 1024) throw new ErrorDeEntrada('El cuerpo de la petición es demasiado grande.');
        partes.push(parte);
    }
    if (!partes.length) return {};
    try {
        return JSON.parse(Buffer.concat(partes).toString('utf8'));
    } catch {
        throw new ErrorDeEntrada('El cuerpo tiene que ser JSON válido.');
    }
}

const indice = () => ({
    servicio: 'Calendario judicial y cómputo de plazos',
    fuente: 'https://javiercuneo.com.ar',
    // Se dice de donde salen los datos porque quien consuma esto tiene derecho
    // a saber contra que se computo: la feria sale de las Acordadas de la CSJN
    // cargadas una por una, no de una formula.
    datos: {
        feriados: 'data/feriados.json',
        feria: 'data/feria-judicial.json (una Acordada de la CSJN por año)',
        asuetos: 'data/dias-inhabiles.json'
    },
    aviso: 'Cuando la respuesta trae "ok": false NO hay fecha, y el campo "problema" dice por qué. No se devuelve un resultado parcial.',
    endpoints: Object.entries(HERRAMIENTAS).map(([nombre, h]) => ({
        ruta: '/' + nombre.replace(/_/g, '-'),
        descripcion: h.descripcion,
        entrada: h.entrada
    }))
});

const porRuta = new Map(
    Object.entries(HERRAMIENTAS).map(([nombre, h]) => ['/' + nombre.replace(/_/g, '-'), h])
);

const servidor = createServer(async (req, res) => {
    let url;
    try {
        url = new URL(req.url, `http://${HOST}:${PUERTO}`);
    } catch {
        return json(res, 400, { ok: false, problema: 'La URL no es válida.' });
    }

    if (url.pathname === '/' || url.pathname === '/index.json') {
        return json(res, 200, indice());
    }

    const herramienta = porRuta.get(url.pathname.replace(/\/+$/, '') || '/');
    if (!herramienta) {
        return json(res, 404, {
            ok: false,
            problema: `No existe ${url.pathname}. Pedí / para ver qué hay.`
        });
    }

    try {
        // GET con query o POST con JSON: las dos formas, misma funcion. Los
        // parametros de query llegan como texto y el nucleo los valida.
        const entrada = req.method === 'POST'
            ? await leerCuerpo(req)
            : Object.fromEntries(url.searchParams);

        // notasDejadas viaja como lista separada por comas cuando viene por
        // query, que es la unica forma razonable en una URL.
        if (typeof entrada.notasDejadas === 'string') {
            entrada.notasDejadas = entrada.notasDejadas.split(',').map((s) => s.trim()).filter(Boolean);
        }
        if (typeof entrada.fueraDeHorario === 'string') {
            entrada.fueraDeHorario = entrada.fueraDeHorario === 'true' || entrada.fueraDeHorario === '1';
        }

        const resultado = await herramienta.fn(entrada);
        // Un dato faltante NO es un error del que llama: la peticion estaba
        // bien y la respuesta es que no se puede afirmar una fecha. Por eso 200
        // con ok:false y no un 4xx, que invitaria a reintentar.
        return json(res, 200, resultado);
    } catch (e) {
        if (e instanceof ErrorDeEntrada) {
            return json(res, 400, { ok: false, problema: e.message });
        }
        // Los mensajes del motor tambien son texto para leer, no trazas.
        return json(res, 400, { ok: false, problema: e.message });
    }
});

servidor.listen(PUERTO, HOST, () => {
    console.log(`Calendario judicial y cómputo de plazos, escuchando en http://${HOST}:${PUERTO}`);
    console.log('Pedí / para ver los endpoints. Ctrl+C para cortar.\n');
    for (const ruta of porRuta.keys()) console.log(`  ${ruta}`);
});
