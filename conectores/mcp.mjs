// El calendario judicial, el computo de plazos y el anonimizador, por MCP
// sobre stdio.
//
// Es la mitad del conector que consume un modelo. La otra --la que consume
// codigo-- es conectores/http.mjs, y las dos cuelgan de los mismos dos
// registros: nucleo.mjs (plazos) y anonimizar.mjs (Escribiente).
// Ninguna de las dos calcula ni anonimiza: traducen a JSON lo que hacen los
// motores.
//
// Por que un modelo lo necesita: contar dias habiles no se puede hacer de
// memoria. Depende de un calendario de feriados, ferias y asuetos que cambia
// por Acordada, y un modelo que lo estima produce una fecha plausible --que es
// la peor clase de error, porque nadie la desmiente--. Con esto no estima:
// pregunta.
//
// Sin dependencias: JSON-RPC 2.0 sobre stdin/stdout, que es todo lo que MCP
// pide por stdio. Agregar un SDK para esto seria traer un arbol de paquetes a
// un repositorio que hoy tiene uno solo, y de desarrollo.
//
// Correr con: npm run conector-mcp
// Para conectarlo, el cliente lo lanza como proceso: no escucha en ningun
// puerto y no abre una conexion a ningun lado.

import { HERRAMIENTAS as PLAZOS, ErrorDeEntrada } from './nucleo.mjs';
import { HERRAMIENTAS_ANONIMIZAR } from './anonimizar.mjs';

// Los dos registros en un solo servidor, desde el 17/9/2026. Quien consume
// levanta UN proceso y tiene lo que este repositorio ofrece; dos procesos son
// dos cosas que se caen por separado. Se comprobo antes de tocarlo que
// `pipeline/plazos.py` no lee `serverInfo` ni `tools/list` -manda `tools/call`
// directo-, asi que agregar herramientas no le cambia nada.
const HERRAMIENTAS = { ...PLAZOS, ...HERRAMIENTAS_ANONIMIZAR };

const VERSION_PROTOCOLO = '2024-11-05';

// El texto de las herramientas es lo unico que el modelo ve antes de elegir, asi
// que dice tambien COMO LEER LA RESPUESTA. Un modelo que recibe ok:false y usa
// igual una fecha que no vino es el modo de falla que este conector existe para
// evitar, y la unica defensa disponible aca es decirlo donde se lee.
const AVISO = ' Si la respuesta trae "ok": false no hay fecha: el campo "problema" dice por qué, y ese motivo hay que transmitirlo en vez de estimar una fecha.';

// Casi todo viaja como texto, y el nucleo lo valida. La excepcion es
// `elegidos`, que es una lista de objetos: declararla `string` haria que un
// modelo mande un JSON adentro de un string y el conector lo rechace por no ser
// una lista, sin que se entienda por que.
const LISTA_DE_ELEGIDOS = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            texto: { type: 'string', description: 'el nombre, tal como está escrito en el texto' },
            reemplazo: { type: 'string', description: 'la etiqueta con la que taparlo' }
        },
        required: ['texto', 'reemplazo']
    }
};

function esquema(entrada) {
    const propiedades = {};
    for (const [nombre, descripcion] of Object.entries(entrada)) {
        propiedades[nombre] = nombre === 'elegidos'
            ? { ...LISTA_DE_ELEGIDOS, description: descripcion }
            : { type: 'string', description: descripcion };
    }
    return {
        type: 'object',
        properties: propiedades,
        required: Object.keys(entrada).filter((k) => /^(fecha|desde|hasta|notificacion|plazo|diasHabiles|texto|frase)$/.test(k))
    };
}

const listaDeHerramientas = Object.entries(HERRAMIENTAS).map(([nombre, h]) => ({
    name: nombre,
    description: h.descripcion + (h.aviso ?? AVISO),
    inputSchema: esquema(h.entrada)
}));

function responder(id, resultado) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: resultado }) + '\n');
}

function responderError(id, codigo, mensaje) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code: codigo, message: mensaje } }) + '\n');
}

async function atender(mensaje) {
    const { id, method, params } = mensaje;

    // Las notificaciones no llevan id y no se contestan.
    if (id === undefined || id === null) return;

    if (method === 'initialize') {
        return responder(id, {
            protocolVersion: VERSION_PROTOCOLO,
            capabilities: { tools: {} },
            serverInfo: { name: 'herramientas-judiciales', version: '2.0.0' }
        });
    }

    if (method === 'tools/list') {
        return responder(id, { tools: listaDeHerramientas });
    }

    if (method === 'tools/call') {
        const nombre = params?.name;
        const herramienta = HERRAMIENTAS[nombre];
        if (!herramienta) return responderError(id, -32602, `No existe la herramienta ${nombre}.`);

        try {
            const argumentos = { ...(params?.arguments || {}) };
            if (typeof argumentos.notasDejadas === 'string') {
                argumentos.notasDejadas = argumentos.notasDejadas.split(',').map((s) => s.trim()).filter(Boolean);
            }
            if (typeof argumentos.fueraDeHorario === 'string') {
                argumentos.fueraDeHorario = argumentos.fueraDeHorario === 'true';
            }

            const resultado = await herramienta.fn(argumentos);

            // isError se marca cuando falta un dato, para que el cliente no lo
            // presente como un resultado mas. El texto va igual: el motivo es
            // la respuesta util --dice que Acordada falta-- y sirve mas que un
            // error vacio.
            return responder(id, {
                content: [{ type: 'text', text: JSON.stringify(resultado, null, 2) }],
                isError: resultado.ok === false
            });
        } catch (e) {
            const mensaje = e instanceof ErrorDeEntrada ? e.message : e.message;
            return responder(id, {
                content: [{ type: 'text', text: JSON.stringify({ ok: false, problema: mensaje }, null, 2) }],
                isError: true
            });
        }
    }

    responderError(id, -32601, `Método no soportado: ${method}`);
}

let pendiente = '';

// Las llamadas en vuelo se cuentan, y el proceso no sale mientras quede alguna.
// Sin esto, `end` mata el servidor con la respuesta a medio calcular: la
// primera version contestaba initialize y tools/list --que son sincronicos-- y
// se moria antes de devolver un vencimiento, que carga los JSON del calendario.
// Falla justo en las llamadas que importan y en ninguna de las otras.
let enVuelo = 0;
let entradaCerrada = false;

function quizaSalir() {
    if (entradaCerrada && enVuelo === 0) process.exit(0);
}

async function encolar(linea) {
    enVuelo++;
    try {
        await atender(JSON.parse(linea));
    } catch {
        responderError(null, -32700, 'JSON inválido.');
    } finally {
        enVuelo--;
        quizaSalir();
    }
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (trozo) => {
    pendiente += trozo;
    let corte;
    while ((corte = pendiente.indexOf('\n')) !== -1) {
        const linea = pendiente.slice(0, corte).trim();
        pendiente = pendiente.slice(corte + 1);
        if (linea) encolar(linea);
    }
});

process.stdin.on('end', () => {
    entradaCerrada = true;
    quizaSalir();
});
