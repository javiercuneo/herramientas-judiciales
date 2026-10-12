// El perfil automatico de Escribiente, para un agente que lee sin nadie que tilde.
//
// Pedido E-08 de `confronteitor` (alla, E-07), 10/10/2026. El plan, las
// decisiones y lo que quedo abierto: docs/PEDIDO_E08_CONFRONTEITOR.md. El motor
// del perfil es escribiente/js/motor/automatico.js; aca solo se lee el PDF, se
// hace OCR donde no hay texto y se traduce a JSON.
//
// DOS PUERTAS, Y NO SON IGUALES:
//
//   - `ingresar` devuelve el TEXTO REAL y la TABLA DE DESTAPADO. Por eso NO esta
//     en conectores/mcp.mjs ni en http.mjs: lo que devuelve una herramienta MCP
//     entra al contexto del modelo, y el modelo es justo quien no tiene que
//     verlo. Se llama como subproceso, desde el script local que despues
//     resuelve los tramos:
//
//         node conectores/automatico.mjs ingresar a.pdf b.pdf [--salida carpeta]
//
//   - `anotar_fuga` devuelve solo la forma del dato, nunca el dato, y si esta
//     en el MCP: es la herramienta del agente.
//
//         node conectores/automatico.mjs anotar-fuga archivo posicion clase [--fin n]
//
// SIN RED. pdf.js, el lienzo y tesseract.js se cargan de node_modules, y el
// español de tesseract viene en @tesseract.js-data/spa: `langPath` apunta a esa
// carpeta y `cacheMethod: 'none'` impide que baje o deje nada. Si alguien saca
// el `langPath`, tesseract.js va a buscar el idioma a un CDN: no sacarlo.

import { readFile, writeFile, mkdir, appendFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, extname, resolve } from 'node:path';
import { ErrorDeEntrada } from './nucleo.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// Una pagina con menos que esto se pasa por OCR. Es el mismo umbral con el que
// la pantalla rechaza un escaneo (extraer.js): ahi se avisa, aca se lee.
let MINIMO_POR_PAGINA = 100;

// 300 ppp, que es lo que tesseract pide para letra de expediente.
const ESCALA_OCR = 300 / 72;

let motores = null;

async function cargar() {
    if (motores) return motores;
    const url = (...partes) => pathToFileURL(join(RAIZ, ...partes)).href;
    const automatico = await import(url('escribiente', 'js', 'motor', 'automatico.js'));
    const markdown = await import(url('escribiente', 'js', 'motor', 'markdown.js'));
    const extraer = await import(url('escribiente', 'js', 'motor', 'extraer.js'));
    MINIMO_POR_PAGINA = extraer.MINIMO_POR_PAGINA;
    motores = { automatico, markdown, formas: cargarFormas() };
    return motores;
}

/** `formas.js` de confronte, el que pasa digitos a letras. Es la copia
 *  publicada en este repositorio (`npm run traer-confronte`): no se depende de
 *  la carpeta de otro repo. Son IIFE del navegador, asi que se corren con una
 *  raiz propia en vez de colgarlas de `globalThis`. */
function cargarFormas() {
    const raiz = {};
    for (const archivo of ['unicode.js', 'py.js', 'formas.js']) {
        const fuente = require('node:fs').readFileSync(join(RAIZ, 'confronte', 'motor', archivo), 'utf8');
        new Function('globalThis', 'module', 'require', fuente)(raiz, undefined, undefined);
    }
    return raiz.Motor.formas;
}

// ---------------------------------------------------------------------------
// El PDF
// ---------------------------------------------------------------------------

function lienzo() {
    const { createCanvas } = require('@napi-rs/canvas');
    return {
        create(ancho, alto) {
            const canvas = createCanvas(Math.ceil(ancho), Math.ceil(alto));
            return { canvas, context: canvas.getContext('2d') };
        },
        reset(par, ancho, alto) {
            par.canvas.width = Math.ceil(ancho);
            par.canvas.height = Math.ceil(alto);
        },
        destroy(par) {
            par.canvas.width = 0;
            par.canvas.height = 0;
            par.canvas = null;
            par.context = null;
        },
    };
}

let lector = null;

/** Un solo worker de tesseract por corrida: cargar el idioma tarda mas que
 *  leer una pagina. */
async function ocr() {
    if (lector) return lector;
    const { createWorker } = require('tesseract.js');
    const idioma = dirname(require.resolve('@tesseract.js-data/spa/package.json'));
    lector = await createWorker('spa', 1, {
        langPath: join(idioma, '4.0.0_best_int'),
        cacheMethod: 'none',
        gzip: true,
    });
    return lector;
}

async function cerrarOcr() {
    if (lector) await lector.terminate();
    lector = null;
}

/** Lo que tesseract leyo, como fragmentos de pdf.js: asi la pagina leida por
 *  OCR pasa por la misma conversion que una con texto, y el Markdown sale con
 *  las mismas reglas. Un fragmento por palabra, con la base de su renglon. */
function fragmentosDeOcr(datos, altoPdf) {
    const fragmentos = [];
    for (const bloque of datos.blocks ?? []) {
        for (const parrafo of bloque.paragraphs ?? []) {
            for (const linea of parrafo.lines ?? []) {
                const base = altoPdf - linea.bbox.y1 / ESCALA_OCR;
                const alto = (linea.bbox.y1 - linea.bbox.y0) / ESCALA_OCR;
                for (const p of linea.words ?? []) {
                    const str = (p.text ?? '').trim();
                    if (!str) continue;
                    fragmentos.push({
                        str,
                        transform: [alto, 0, 0, alto, p.bbox.x0 / ESCALA_OCR, base],
                        width: (p.bbox.x1 - p.bbox.x0) / ESCALA_OCR,
                        height: alto,
                    });
                }
            }
        }
    }
    return fragmentos;
}

// pdf.js en Node busca `canvas` -el paquete nativo, que no se instala- para
// tres clases del navegador. El lienzo que si esta las trae.
function prepararPdfjs() {
    const lienzoNativo = require('@napi-rs/canvas');
    for (const clase of ['DOMMatrix', 'Path2D', 'ImageData']) {
        if (!globalThis[clase] && lienzoNativo[clase]) globalThis[clase] = lienzoNativo[clase];
    }
    return require('pdfjs-dist/legacy/build/pdf.js');
}

async function leerPdf(ruta) {
    const pdfjs = prepararPdfjs();
    const datos = new Uint8Array(await readFile(ruta));
    const raizPdfjs = dirname(require.resolve('pdfjs-dist/package.json'));
    const pdf = await pdfjs.getDocument({
        data: datos,
        canvasFactory: lienzo(),
        standardFontDataUrl: join(raizPdfjs, 'standard_fonts') + '/',
        cMapUrl: join(raizPdfjs, 'cmaps') + '/',
        cMapPacked: true,
        isEvalSupported: false,
        verbosity: 0,
    }).promise;

    const paginas = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const pagina = await pdf.getPage(i);
        const contenido = await pagina.getTextContent();
        const ancho = pagina.view[2];
        const alto = pagina.view[3];
        const caracteres = contenido.items.reduce((n, f) => n + (f.str || '').trim().length, 0);

        if (caracteres >= MINIMO_POR_PAGINA) {
            paginas.push({ numero: i, fragmentos: contenido.items, ancho, alto, fuente: 'texto' });
            continue;
        }

        // Sin capa de texto, o casi: se dibuja y se lee. La pagina entera, no
        // solo lo que falta: el sello con texto de una foja escaneada no la hace
        // una pagina con texto.
        const vista = pagina.getViewport({ scale: ESCALA_OCR });
        const par = lienzo().create(vista.width, vista.height);
        par.context.fillStyle = '#ffffff';
        par.context.fillRect(0, 0, vista.width, vista.height);
        await pagina.render({ canvasContext: par.context, viewport: vista }).promise;
        const imagen = par.canvas.toBuffer('image/png');
        const { data } = await (await ocr()).recognize(imagen, {}, { blocks: true });
        const fragmentos = fragmentosDeOcr(data, alto);
        paginas.push({
            numero: i, fragmentos, ancho, alto,
            fuente: fragmentos.length ? 'ocr' : 'vacía',
            confianza: fragmentos.length ? Math.round(data.confidence) : null,
        });
    }
    await pdf.destroy();
    return paginas;
}

/** Un archivo a texto real, con sus paginas. Un .md o un .txt se toma tal cual:
 *  confronte ya tiene piezas pasadas por escribiente. */
async function leerArchivo(ruta, markdown) {
    const ext = extname(ruta).toLowerCase();
    if (ext === '.md' || ext === '.txt') {
        const texto = await readFile(ruta, 'utf8');
        return { texto, paginas: [{ numero: 1, fuente: 'texto', desde: 0, hasta: texto.length }] };
    }
    if (ext !== '.pdf') throw new ErrorDeEntrada(`${ruta}: sólo se leen .pdf, .md y .txt.`);

    const paginas = await leerPdf(ruta);
    const { markdown: texto, paginas: ubicadas } = markdown.convertir(paginas);
    const porNumero = new Map((ubicadas ?? []).map((p) => [p.numero, p]));
    return {
        texto,
        paginas: paginas.map((p) => ({
            numero: p.numero,
            fuente: p.fuente,
            ...(p.confianza !== undefined ? { confianza: p.confianza } : {}),
            desde: porNumero.get(p.numero)?.desde ?? null,
            hasta: porNumero.get(p.numero)?.hasta ?? null,
        })),
    };
}

// ---------------------------------------------------------------------------
// Ingreso
// ---------------------------------------------------------------------------

/** Lee una tanda y la devuelve seudonimizada, con el mapa y la tabla.
 *
 * `{ rutas: [..], salida? }`. Con `salida`, ademas deja en esa carpeta, por
 * archivo, `NN.seudo.md` -lo unico que lee el agente-, `NN.real.md` y
 * `NN.mapa.json`, y para la tanda `destapado.json`. Esa carpeta es la llave
 * de la tanda: no va a un repositorio ni a ningun lado.
 */
export async function ingresar(entrada) {
    const rutas = entrada?.rutas;
    if (!Array.isArray(rutas) || rutas.length === 0 || rutas.some((r) => typeof r !== 'string' || !r.trim())) {
        throw new ErrorDeEntrada('Falta «rutas»: una lista con al menos un archivo.');
    }
    const { automatico, markdown, formas } = await cargar();

    const leidos = [];
    try {
        for (const ruta of rutas) {
            const absoluta = resolve(ruta);
            try { await access(absoluta); } catch { throw new ErrorDeEntrada(`No existe ${absoluta}.`); }
            leidos.push({ ruta: absoluta, ...(await leerArchivo(absoluta, markdown)) });
        }
    } finally {
        await cerrarOcr();
    }

    const tanda = automatico.seudonimizarTanda(
        leidos.map((l) => ({ nombre: l.ruta.split(/[\\/]/).pop(), texto: l.texto })),
        { enLetras: formas.enLetras });

    const archivos = tanda.archivos.map((a, i) => ({
        ruta: leidos[i].ruta,
        real: a.real,
        seudo: a.seudo,
        mapa: a.mapa,
        paginas: leidos[i].paginas.map((p) => ({
            numero: p.numero,
            fuente: p.fuente,
            ...(p.confianza !== undefined ? { confianza: p.confianza } : {}),
            real: p.desde === null ? null : [p.desde, p.hasta],
            seudo: p.desde === null ? null : [
                automatico.aSeudo(a.mapa, p.desde),
                p.hasta >= a.real.length ? a.seudo.length : automatico.aSeudo(a.mapa, p.hasta),
            ],
        })),
    }));

    const respuesta = { ok: true, archivos, tabla: tanda.tabla, controles: tanda.controles };

    if (entrada.salida) {
        const carpeta = resolve(entrada.salida);
        await mkdir(carpeta, { recursive: true });
        for (const [i, a] of archivos.entries()) {
            const n = String(i + 1).padStart(2, '0');
            await writeFile(join(carpeta, `${n}.seudo.md`), a.seudo, 'utf8');
            await writeFile(join(carpeta, `${n}.real.md`), a.real, 'utf8');
            await writeFile(join(carpeta, `${n}.mapa.json`),
                JSON.stringify({ ruta: a.ruta, paginas: a.paginas, mapa: a.mapa }, null, 1), 'utf8');
        }
        await writeFile(join(carpeta, 'destapado.json'), JSON.stringify(tanda.tabla, null, 1), 'utf8');
        respuesta.salida = carpeta;
    }
    return respuesta;
}

// ---------------------------------------------------------------------------
// El buzon de fugas
// ---------------------------------------------------------------------------

const NOMBRE_DEL_BUZON = 'FUGAS-ANONIMIZADOR.md';

/** Donde esta el buzon. En orden: `REDACTOR_BUZON` -la misma variable que usa
 *  `redactor`-, el de `puente` si ya se mudo, el del pipeline mientras no. Las
 *  carpetas salen de `git config rutas.*`, como en el resto de los repos: este
 *  es publico y no escribe una ruta de la maquina. */
export async function ubicarBuzon() {
    if (process.env.REDACTOR_BUZON) return process.env.REDACTOR_BUZON;
    for (const clave of ['rutas.puente', 'rutas.pipeline']) {
        let carpeta = '';
        try {
            carpeta = execFileSync('git', ['config', '--get', clave], { cwd: RAIZ, encoding: 'utf8' }).trim();
        } catch { continue; }
        if (!carpeta) continue;
        const ruta = join(carpeta, NOMBRE_DEL_BUZON);
        try { await access(ruta); return ruta; } catch { /* sigue */ }
    }
    return null;
}

/** Anota una fuga en el buzon general: la forma del dato, nunca el dato.
 *
 * `{ archivo, posicion, clase, fin? }`. `archivo` es el texto seudonimizado
 * donde el agente vio el dato a la vista; `posicion`, donde empieza. Sin
 * `fin`, el dato es la palabra -o el nombre, o el numero- que esta ahi.
 *
 * La entrada tiene la misma forma que las de `redactor`, para que
 * `herramientas/buzon.py` la lea: caso `automatico` y, en lugar del nombre del
 * escrito -que en el PJN es la caratula-, una huella del archivo.
 */
export async function anotarFuga(entrada) {
    const { automatico } = await cargar();
    const archivo = typeof entrada?.archivo === 'string' ? entrada.archivo.trim() : '';
    if (!archivo) throw new ErrorDeEntrada('Falta «archivo»: el texto seudonimizado donde está la fuga.');
    const clase = String(entrada.clase ?? '').trim();
    if (!clase || clase.length > 40 || /[`\n]/.test(clase)) {
        throw new ErrorDeEntrada('Falta «clase» —persona, DNI, domicilio…—, en pocas palabras.');
    }
    const posicion = Number(entrada.posicion);
    let texto;
    try { texto = await readFile(resolve(archivo), 'utf8'); } catch {
        throw new ErrorDeEntrada(`No se puede leer ${archivo}.`);
    }
    if (!Number.isInteger(posicion) || posicion < 0 || posicion >= texto.length) {
        throw new ErrorDeEntrada(`«posicion» tiene que ser un entero entre 0 y ${texto.length - 1}.`);
    }
    let tramo;
    if (entrada.fin !== undefined && entrada.fin !== null && entrada.fin !== '') {
        const hasta = Number(entrada.fin);
        if (!Number.isInteger(hasta) || hasta <= posicion || hasta > texto.length) {
            throw new ErrorDeEntrada('«fin» tiene que ser mayor que «posicion» y caer adentro del texto.');
        }
        tramo = { desde: posicion, hasta };
    } else {
        tramo = automatico.datoEnPosicion(texto, posicion);
    }
    const dato = texto.slice(tramo.desde, tramo.hasta);
    if (!dato.trim()) throw new ErrorDeEntrada('En esa posición no hay nada que anotar.');

    const forma = automatico.formaDe(dato);
    const contexto = automatico.contextoTapado(texto, tramo.desde, tramo.hasta);
    const buzon = await ubicarBuzon();
    if (!buzon) {
        return {
            ok: false,
            problema: 'No se encontró el buzón de fugas. Se busca en REDACTOR_BUZON y en las carpetas ' +
                'de `git config rutas.puente` y `rutas.pipeline`; ninguna lo tiene.',
            forma,
        };
    }
    const huella = createHash('sha256').update(resolve(archivo)).digest('hex').slice(0, 8);
    const hoy = new Date().toISOString().slice(0, 10);
    const linea = `\n- ${hoy} · \`automatico\` · \`${huella}\` · ${clase} · forma \`${forma}\`\n  - «${contexto}»\n`;
    await appendFile(buzon, linea, 'utf8');
    return { ok: true, forma, contexto, buzon };
}

export const HERRAMIENTAS_AUTOMATICO = {
    anotar_fuga: {
        fn: anotarFuga,
        aviso: ' Escribe sólo la forma del dato (letras y dígitos tapados), nunca el dato. ' +
            'Si la respuesta trae "ok": false, el campo "problema" dice por qué.',
        descripcion:
            'Anota en el buzón de fugas un dato personal que quedó a la vista en un texto ' +
            'seudonimizado: la forma («Xx XX» para un nombre; un número, cada dígito un 9) y las palabras de alrededor con ' +
            'mayúsculas y números tapados. Con eso se escribe la regla que falta.',
        entrada: {
            archivo: 'ruta del texto seudonimizado donde está la fuga',
            posicion: 'posición, en caracteres desde 0, donde empieza el dato en ese texto',
            clase: 'qué es: persona, DNI, domicilio, teléfono…',
            fin: 'opcional: dónde termina el dato. Sin esto, se toma la palabra, el nombre o el número que está ahí',
        },
    },
};

// ---------------------------------------------------------------------------
// Como subproceso
// ---------------------------------------------------------------------------

function opcion(args, nombre) {
    const i = args.indexOf(nombre);
    if (i < 0) return undefined;
    const valor = args[i + 1];
    args.splice(i, 2);
    return valor;
}

async function principal(argv) {
    // La salida estandar es el canal: lleva un solo JSON. pdf.js y tesseract
    // avisan por `console.log`, y un aviso ahi rompe al que lee del otro lado.
    console.log = console.info = console.warn = (...x) => process.stderr.write(x.join(' ') + '\n');
    const [orden, ...args] = argv;
    let resultado;
    try {
        if (orden === 'ingresar') {
            const salida = opcion(args, '--salida');
            resultado = await ingresar({ rutas: args, salida });
        } else if (orden === 'anotar-fuga') {
            const fin = opcion(args, '--fin');
            const [archivo, posicion, ...clase] = args;
            resultado = await anotarFuga({ archivo, posicion, clase: clase.join(' '), fin });
        } else {
            resultado = {
                ok: false,
                problema: 'Uso: node conectores/automatico.mjs ingresar <archivo>... [--salida carpeta]\n' +
                    '     node conectores/automatico.mjs anotar-fuga <archivo> <posicion> <clase> [--fin n]',
            };
        }
    } catch (e) {
        resultado = { ok: false, problema: e.message };
    }
    process.stdout.write(JSON.stringify(resultado) + '\n');
    process.exitCode = resultado.ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await principal(process.argv.slice(2));
}
