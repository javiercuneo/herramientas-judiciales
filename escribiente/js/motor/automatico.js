// ---------------------------------------------------------------------------
// El perfil AUTOMATICO: tapa de mas, sin preguntar, para que lea un agente.
//
// POR QUE EXISTE, 10/10/2026 (E-08, pedido por `confronteitor`, que lo conoce
// como E-07). Un agente -Claude Code, opencode, Codex- lee piezas y autos
// seudonimizados y pide tramos por posicion; un script local los resuelve contra
// el texto real. Del otro lado no hay nadie que tilde nombres, asi que la regla
// de `anonimizar.js` -los nombres se proponen y nunca se aplican solos- no se
// puede cumplir. DECISION DE JAVIER, 10/10/2026: para este perfil, y solo para
// este, los candidatos a nombre se tapan sin confirmar. Un nombre de doctrina
// tapado es ruido para el que lee; un nombre de parte a la vista es una fuga.
//
// EL PERFIL PUBLICO NO CAMBIA. La pantalla de Escribiente y el conector que usa
// `redactor` no cargan este archivo, y este archivo no cambia ninguna regla de
// `anonimizar.js`: lo llama con la lista de nombres ya armada y despues trabaja
// sobre lo que devuelve. Una regla nueva del perfil automatico va ACA.
//
// LO QUE NUNCA SE TAPA, aunque una regla lo agarre: normas, articulos,
// tribunales y fechas. Se marcan sobre el texto real (`zonasIntocables`) y todo
// tramo que caiga entero adentro de una se vuelve a destapar. No se protegen
// antes de anonimizar a proposito: la proteccion del motor (`noTapar`) aborta si
// una regla se come un pedazo protegido, y aca no hay nadie para leer el error.
//
// LO QUE DEVUELVE, por archivo: el texto real, el seudonimizado y EL MAPA entre
// los dos, que es lo que hace funcionar el diseño. El mapa es una lista de
// segmentos `{ seudo: [a, b], real: [c, d], etiqueta }`: con `etiqueta: null` el
// segmento es texto copiado tal cual, del mismo largo en los dos lados; con
// etiqueta, es lo que esa etiqueta tapa. Y para la tanda, la TABLA DE
// DESTAPADO -etiqueta a valores reales-, que es la llave para deshacer todo:
// vive en la maquina que llama y no se le muestra al agente.
// ---------------------------------------------------------------------------

import {
    anonimizarConTramos,
    candidatosANombre,
    partesDeCaratula,
    restosPegadosAEtiqueta,
    palabrasSueltasDeElegidos,
    ubicarEnElTexto,
    unificarEspacios,
    etiquetaNumerada,
    ETIQUETAS_DE_NOMBRE,
} from './anonimizar.js';

const MAY = 'A-ZÀ-ÖØ-Þ';
const MIN = 'a-zß-öø-ÿ';
const LETRA = MAY + MIN;
const ANTES = `(^|[^${LETRA}\\d])`;
const DESPUES = `(?=[^${LETRA}\\d]|$)`;

const BASES_DE_PERSONA = new Set(ETIQUETAS_DE_NOMBRE.map((e) => e.slice(1, -1)));

function sinTildes(t) {
    return t.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escapar(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Lo intocable: normas, articulos, tribunales y fechas.
// ---------------------------------------------------------------------------

const MESES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';

// Las palabras que puede llevar el nombre de un tribunal despues de su ancla.
// Es una lista cerrada a proposito: un tribunal se escribe con estas, y un
// nombre de persona no. "Juzgado Civil n° 19 a cargo del Dr. X" corta en "a".
const PALABRAS_DE_TRIBUNAL = new Set(`
de del la las los en lo y e nacional nacionales federal federales primera segunda
instancia apelaciones apelacion civil civiles comercial comerciales trabajo penal
penales contencioso administrativo administrativa seguridad social familia paz
justicia nacion suprema corte superior oral orales criminal correccional
electoral capital ciudad autonoma buenos aires provincia sala secretaria juzgado
juzgados camara camaras excma excmo tribunal tribunales unica general economico
ejecucion fiscal patrimonial menores instruccion casacion
n nro nro. n° nº no. numero
`.trim().split(/\s+/));

const ANCLA_DE_TRIBUNAL =
    /\b(?:juzgados?|c[aá]maras?|excm[oa]\.?|corte|tribunal(?:es)?|salas?|secretar[ií]as?|fiscal[ií]as?|defensor[ií]as?)\b/gi;

const SIGLAS_DE_TRIBUNAL = /\b(?:CSJN|C\.S\.J\.N\.?|CNCiv|CNCom|CNTrab|CNFed|CNACAF|CNAT|SCBA|TSJ)\b/g;

const NORMAS = [
    new RegExp(
        '\\b(?:arts?\\.|art[ií]culos?|leyes|ley|decretos?(?:-ley)?|dec\\.|resoluci[oó]n(?:es)?|res\\.|' +
        'acordadas?|acord\\.|disposici[oó]n(?:es)?|incisos?|inc\\.|ap\\.|apartado)' +
        '(?:\\s*(?:n[°ºo.]*|nro\\.?)\\s*)?' +
        '(?:\\s*[\\d][\\d.,]*(?:\\s*(?:bis|ter|quater))?(?:\\s*[/-]\\s*\\d+)?(?:\\s*(?:,|y|e|a|al)\\s*\\d[\\d.,]*)*)?',
        'gi'),
    /\b(?:C[oó]digo\s+(?:Civil(?:\s+y\s+Comercial)?|Procesal(?:\s+Civil\s+y\s+Comercial)?|Penal|de\s+Comercio|Procesal\s+Penal)(?:\s+de\s+la\s+Naci[oó]n)?|Constituci[oó]n\s+Nacional|CCyCN|CCyC|CPCCN|CPCC|CPPN|LCT)\b/g,
];

const FECHAS = [
    new RegExp(`\\b\\d{1,2}\\s*(?:de\\s+|/\\s*)?(?:${MESES})(?:\\s*(?:de|del)?\\s*(?:\\d{4}|\\d{2}))?\\b`, 'gi'),
    new RegExp(`\\b(?:${MESES})\\s+(?:de|del)\\s+\\d{4}\\b`, 'gi'),
    /\b\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})\b/g,
];

// Una fecha de nacimiento NO es intocable: es un dato de la persona, y el motor
// la tapa con [FECHA NAC]. Se mira lo que tiene inmediatamente antes.
const ANTES_DE_NACIMIENTO = /nac(?:imiento|ido|ida|io|i[oó])?\.?[^\n]{0,25}$/i;

/** Las zonas del texto real que ninguna regla de este perfil puede tapar.
 *  Devuelve `[{ desde, hasta, clase }]` ordenadas y sin pisarse. */
export function zonasIntocables(texto) {
    const zonas = [];
    for (const patron of NORMAS) {
        for (const m of texto.matchAll(patron)) zonas.push({ desde: m.index, hasta: m.index + m[0].length, clase: 'norma' });
    }
    for (const patron of FECHAS) {
        for (const m of texto.matchAll(patron)) {
            if (ANTES_DE_NACIMIENTO.test(texto.slice(Math.max(0, m.index - 40), m.index))) continue;
            zonas.push({ desde: m.index, hasta: m.index + m[0].length, clase: 'fecha' });
        }
    }
    for (const m of texto.matchAll(SIGLAS_DE_TRIBUNAL)) {
        zonas.push({ desde: m.index, hasta: m.index + m[0].length, clase: 'tribunal' });
    }
    for (const m of texto.matchAll(ANCLA_DE_TRIBUNAL)) {
        let fin = m.index + m[0].length;
        const resto = /^(\s+)([^\s,;:()]+)/;
        for (;;) {
            const s = resto.exec(texto.slice(fin));
            if (!s) break;
            const palabra = sinTildes(s[2].toLowerCase());
            const vale = PALABRAS_DE_TRIBUNAL.has(palabra) ||
                /^\d{1,3}$/.test(s[2]) ||                       // n° 19
                /^[IVXLC]{1,5}$/.test(s[2]) ||                   // Sala IV
                /^[A-M]$/.test(s[2]);                            // Sala A
            if (!vale) break;
            fin += s[0].length;
        }
        zonas.push({ desde: m.index, hasta: fin, clase: 'tribunal' });
    }
    zonas.sort((a, b) => a.desde - b.desde || b.hasta - a.hasta);
    const unidas = [];
    for (const z of zonas) {
        const ultima = unidas.at(-1);
        if (ultima && z.desde <= ultima.hasta) ultima.hasta = Math.max(ultima.hasta, z.hasta);
        else unidas.push({ ...z });
    }
    return unidas;
}

function adentroDeUna(zonas, desde, hasta) {
    return zonas.some((z) => desde >= z.desde && hasta <= z.hasta);
}

// Un candidato con una de estas palabras no es una persona: es un tribunal, una
// norma o una fecha, y taparlo es justo lo que este perfil promete no hacer.
const NO_ES_PERSONA = new RegExp(
    `(?:^|\\s)(?:juzgados?|c[aá]maras?|corte|tribunal(?:es)?|salas?|secretar[ií]as?|fiscal[ií]as?|` +
    `defensor[ií]as?|ley|leyes|c[oó]digo|art[ií]culos?|constituci[oó]n|decreto|acordada|resoluci[oó]n|` +
    `naci[oó]n|nacional|federal|suprema|${MESES})(?=\\s|$|[,.])`, 'i');

// ---------------------------------------------------------------------------
// Identificadores escritos en letras: DNI, CUIT, CUIL, matricula.
//
// El motor publico solo lee el expediente en letras. Aca se agregan los otros
// tres, siempre detras de su ancla: un numero en letras suelto es un monto o una
// fecha. Lo que se encuentra se manda al motor como un reemplazo elegido, asi
// cae en la traza y en el mapa como cualquier otro.
//
// MISMO VALOR EN LETRAS Y EN DIGITOS = MISMA ETIQUETA. No se escribe un lector
// de numeros: `formas.js` -el de confronte, que ya esta copiado en este
// repositorio- pasa los digitos a letras, y se comparan las dos escrituras en
// letras. Quien llama lo pasa en `opciones.enLetras`; sin el, la etiqueta en
// letras se numera aparte.
// ---------------------------------------------------------------------------

const PALABRA_DE_NUMERO =
    '(?:cero|un[oa]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|' +
    `catorce|quince|dieci[${MIN}]+|veinte|veinti[${MIN}]+|treinta|cuarenta|cincuenta|` +
    'sesenta|setenta|ochenta|noventa|cien|ciento|doscient[oa]s|trescient[oa]s|' +
    'cuatrocient[oa]s|quinient[oa]s|seiscient[oa]s|setecient[oa]s|ochocient[oa]s|' +
    'novecient[oa]s|mil|mill[oó]n|millones)';
const SEPARADOR_EN_LETRAS = '(?:\\s+(?:y|guion|gui[oó]n|raya|barra|-|/)\\s+|\\s*[-/]\\s*|\\s+)';
const NUMERO_LARGO_EN_LETRAS = `${PALABRA_DE_NUMERO}(?:${SEPARADOR_EN_LETRAS}${PALABRA_DE_NUMERO})+`;

const IDENTIFICADORES_EN_LETRAS = [
    { base: 'DNI', ancla: '(?:D\\.?\\s?N\\.?\\s?I\\.?|L\\.?\\s?[CE]\\.?|documento(?:\\s+nacional\\s+de\\s+identidad)?)' },
    { base: 'CUIT', ancla: '(?:C\\.?\\s?U\\.?\\s?I\\.?\\s?[TL]\\.?)' },
    { base: 'MATRICULA', ancla: '(?:matr[ií]cula|mat\\.|T[°ºo]\\.?|tomo)' },
];

function identificadoresEnLetras(texto) {
    const salida = [];
    for (const { base, ancla } of IDENTIFICADORES_EN_LETRAS) {
        const patron = new RegExp(
            `${ANTES}${ancla}\\s*(?:n[°ºo]?\\.?|nro\\.?|n[uú]mero)?\\s*:?\\s*(${NUMERO_LARGO_EN_LETRAS})${DESPUES}`, 'gi');
        for (const m of texto.matchAll(patron)) salida.push({ texto: m[2], reemplazo: `[${base}]` });
    }
    return salida;
}

function normalizarLetras(t) {
    return sinTildes(String(t).toLowerCase())
        .replace(/\b(?:y|guion|raya|barra)\b/g, ' ')
        .replace(/[^a-z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ---------------------------------------------------------------------------
// Quien es quien: los valores de una tanda agrupados en entidades.
// ---------------------------------------------------------------------------

const TRATAMIENTOS = /^(?:dr|dra|dres|sr|sra|sres|srta|lic|ing|arq|cdor|cdora|esc|perito|ctdor)\.?$/i;
const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'di', 'da', 'van', 'von', 'y', 'e']);

function palabrasDeNombre(valor) {
    return sinTildes(String(valor).toLowerCase())
        .replace(/[^a-zß-ÿ\s'-]/g, ' ')
        .split(/\s+/)
        .filter((p) => p && !PARTICULAS.has(p) && !TRATAMIENTOS.test(p) && p.length > 1);
}

function claveDeNombre(valor) {
    return [...new Set(palabrasDeNombre(valor))].sort().join(' ');
}

function digitos(valor) {
    return String(valor).replace(/\D/g, '');
}

/** El agrupador de una tanda. Recuerda que valor es que entidad y que numero
 *  lleva cada una. Se tira con la tanda: nada queda guardado. */
function crearRegistro(enLetras) {
    const entidades = [];
    const porClave = new Map();
    const usados = new Map();

    function nueva(base, clase) {
        const e = { base, clase, numero: null, valores: new Set(), claves: new Set(), palabras: new Set() };
        entidades.push(e);
        return e;
    }

    function etiqueta(e) {
        if (e.numero === null) {
            const n = (usados.get(e.base) || 0) + 1;
            usados.set(e.base, n);
            e.numero = n;
        }
        return etiquetaNumerada(e.base.replace(/\s+/g, '_'), e.numero);
    }

    function registrarClave(e, clave) {
        if (!clave) return;
        e.claves.add(clave);
        porClave.set(clave, e);
    }

    /** La entidad de una persona. Una sola por clave; y un nombre parcial
     *  -"Perez" despues de "Juan Perez"- va a la unica entidad que lo contiene. */
    function persona(valor, base = 'PERSONA') {
        const clave = `per:${claveDeNombre(valor)}`;
        if (clave === 'per:') return null;
        let e = porClave.get(clave);
        if (!e) {
            const mias = palabrasDeNombre(valor);
            const contienen = entidades.filter((x) => x.clase === 'persona' && mias.every((p) => x.palabras.has(p)));
            e = contienen.length === 1 ? contienen[0] : nueva(base, 'persona');
            registrarClave(e, clave);
        }
        palabrasDeNombre(valor).forEach((p) => e.palabras.add(p));
        e.valores.add(valor);
        return e;
    }

    function identificador(valor, base) {
        const d = digitos(valor);
        const letras = normalizarLetras(valor);
        const enLetrasDeVerdad = d.length === 0 && letras.split(' ').length >= 2;
        let claves;
        if (d.length >= 4) {
            claves = [`num:${d}`];
            if (enLetras) {
                // CUIT y matricula traen partes: cada una se escribe en letras por separado.
                const partes = String(valor).match(/\d+(?:\.\d{3})*/g) || [];
                const escrita = normalizarLetras(partes.map((p) => enLetras(p.replace(/\./g, ''))).join(' '));
                if (escrita) claves.push(`let:${escrita}`);
            }
        } else if (enLetrasDeVerdad) {
            claves = [`let:${letras}`];
        } else {
            claves = [`txt:${sinTildes(String(valor).toLowerCase()).replace(/[^a-z0-9@.]/g, '')}`];
        }
        let e = claves.map((k) => porClave.get(k)).find(Boolean);
        if (!e) e = nueva(base, 'identificador');
        claves.forEach((k) => registrarClave(e, k));
        e.valores.add(valor);
        return e;
    }

    function tabla() {
        const salida = {};
        for (const e of entidades) {
            if (e.numero === null) continue;
            salida[etiqueta(e)] = { clase: e.clase, valores: [...e.valores] };
        }
        return salida;
    }

    return { persona, identificador, etiqueta, tabla, entidades };
}

// ---------------------------------------------------------------------------
// El mapa: segmentos sobre el texto real.
// ---------------------------------------------------------------------------

/** Del resultado del motor a segmentos sobre el real. Verifica que cada pedazo
 *  copiado sea identico en los dos lados: si no cierra, falla en vez de
 *  devolver un mapa corrido, que mandaria al agente a leer otro lugar. */
function segmentosDesdeTramos(real, final, tramos) {
    const segs = [];
    let posFinal = 0;
    let posReal = 0;
    for (const t of tramos) {
        const copiado = final.slice(posFinal, t.inicio);
        if (copiado !== real.slice(posReal, t.desde)) {
            throw new Error('El mapa de posiciones no cierra contra el texto: no se entrega.');
        }
        if (copiado) segs.push({ r0: posReal, r1: t.desde, etiqueta: null });
        segs.push({ r0: t.desde, r1: t.hasta, etiqueta: t.etiqueta, regla: t.regla });
        posFinal = t.fin;
        posReal = t.hasta;
    }
    if (final.slice(posFinal) !== real.slice(posReal)) {
        throw new Error('El mapa de posiciones no cierra contra el texto: no se entrega.');
    }
    if (posReal < real.length) segs.push({ r0: posReal, r1: real.length, etiqueta: null });
    return segs;
}

function armarSeudo(real, segs) {
    let seudo = '';
    for (const s of segs) {
        s.s0 = seudo.length;
        seudo += s.etiqueta === null ? real.slice(s.r0, s.r1) : s.etiqueta;
        s.s1 = seudo.length;
    }
    return seudo;
}

/** Tapa `[desde, hasta)` del seudonimizado, si cae entero en un pedazo copiado.
 *  Devuelve si tapo. */
function taparEnSeudo(archivo, desde, hasta, etiqueta) {
    const i = archivo.segs.findIndex((s) => s.etiqueta === null && desde >= s.s0 && hasta <= s.s1);
    if (i < 0) return false;
    const s = archivo.segs[i];
    const r0 = s.r0 + (desde - s.s0);
    const r1 = s.r0 + (hasta - s.s0);
    if (adentroDeUna(archivo.zonas, r0, r1)) return false;
    const nuevos = [];
    if (r0 > s.r0) nuevos.push({ r0: s.r0, r1: r0, etiqueta: null });
    nuevos.push({ r0, r1, etiqueta, regla: 'control' });
    if (s.r1 > r1) nuevos.push({ r0: r1, r1: s.r1, etiqueta: null });
    archivo.segs.splice(i, 1, ...nuevos);
    archivo.seudo = armarSeudo(archivo.real, archivo.segs);
    return true;
}

/** Busca la frase en el seudonimizado y tapa cada aparicion. Cuenta las tapadas. */
function taparTodas(archivo, frase, etiqueta) {
    let n = 0;
    // De atras para adelante, para que tapar una no corra las posiciones de las otras.
    for (const { desde, hasta } of ubicarEnElTexto(archivo.seudo, frase).reverse()) {
        if (taparEnSeudo(archivo, desde, hasta, etiqueta)) n++;
    }
    return n;
}

function taparDigitos(archivo, valor, etiqueta) {
    const d = digitos(valor);
    if (d.length < 6) return 0;
    const patron = new RegExp(`(?<![\\d])${d.split('').join('[\\s.\\-/]?')}(?![\\d])`, 'g');
    let n = 0;
    for (const m of [...archivo.seudo.matchAll(patron)].reverse()) {
        if (taparEnSeudo(archivo, m.index, m.index + m[0].length, etiqueta)) n++;
    }
    return n;
}

// ---------------------------------------------------------------------------
// La tanda.
// ---------------------------------------------------------------------------

/** Seudonimiza una tanda de archivos con el perfil automatico.
 *
 * `archivos` es `[{ nombre, texto }]`; `nombre` sirve para leer la caratula, y
 * no sale en la respuesta. `opciones.enLetras(digitos)` es el `enLetras` de
 * `formas.js`: con el, un DNI en letras y el mismo DNI en digitos llevan la
 * misma etiqueta.
 *
 * Devuelve `{ archivos: [{ real, seudo, mapa }], tabla, controles }`.
 * `controles` dice que tapo cada uno de los tres controles, con la etiqueta y
 * la cantidad: nunca el dato.
 */
export function seudonimizarTanda(archivos, opciones = {}) {
    const registro = crearRegistro(opciones.enLetras);
    const trabajo = archivos.map(({ nombre = '', texto }) => {
        const real = unificarEspacios(String(texto ?? ''));
        return { nombre: String(nombre), real, zonas: zonasIntocables(real) };
    });

    // 1. Las partes de la caratula primero: son las que llevan su papel en la
    //    etiqueta, y una persona que es parte lo es en todos los archivos.
    const caratula = [];
    for (const a of trabajo) {
        const partes = [...partesDeCaratula(a.real), ...partesDeCaratula(a.nombre)];
        partes.forEach((p, i) => {
            if (NO_ES_PERSONA.test(p)) return;
            const e = registro.persona(p, i % 2 === 0 ? 'ACTOR' : 'DEMANDADO');
            if (e) caratula.push({ texto: p, entidad: e });
        });
    }

    // 2. Todos los candidatos de todos los archivos, sin confirmar: es lo que
    //    este perfil decide distinto. Con las citas incluidas: tapa de mas.
    const candidatos = new Set();
    for (const a of trabajo) {
        for (const c of candidatosANombre(a.real, { conCitas: true })) {
            if (!NO_ES_PERSONA.test(c.texto)) candidatos.add(c.texto);
        }
    }
    const elegidos = [
        ...caratula.map((c) => ({ texto: c.texto, reemplazo: `[${c.entidad.base}]` })),
        ...[...candidatos].map((texto) => ({ texto, reemplazo: '[PERSONA]' })),
    ];

    // 3. El motor, archivo por archivo, con la misma lista para todos.
    for (const a of trabajo) {
        const propios = [...elegidos, ...identificadoresEnLetras(a.real)];
        const r = anonimizarConTramos(a.real, propios);
        a.segs = segmentosDesdeTramos(a.real, r.texto, r.tramos);
    }

    // 4. Etiquetas numeradas, consistentes en toda la tanda. Lo que cae entero
    //    adentro de una norma, un tribunal o una fecha se destapa.
    for (const a of trabajo) {
        a.segs = a.segs.flatMap((s) => ajustarTramo(a, s));
        for (const s of a.segs) {
            if (s.etiqueta === null) continue;
            if (adentroDeUna(a.zonas, s.r0, s.r1)) { s.etiqueta = null; continue; }
            const m = /^\[([^[\]]+)\]$/.exec(s.etiqueta);
            if (!m) continue;               // mas de una etiqueta en un tramo: queda como vino
            const base = m[1].replace(/_\d+$/, '');
            const valor = a.real.slice(s.r0, s.r1);
            const e = BASES_DE_PERSONA.has(base)
                ? registro.persona(valor, base) ?? registro.identificador(valor, base)
                : registro.identificador(valor, base);
            s.etiqueta = registro.etiqueta(e);
        }
        a.segs = juntarCopiados(a.segs);
        a.seudo = armarSeudo(a.real, a.segs);
    }

    // 5. Los tres controles. Tapan y anotan, sin preguntar.
    const controles = [];
    const anotar = (control, archivo, etiqueta, veces) => {
        if (veces) controles.push({ control, archivo, etiqueta, veces });
    };

    //    a. Restos de caratula: cada palabra de una parte, donde siga a la vista.
    for (const { texto, entidad } of caratula) {
        const etiqueta = registro.etiqueta(entidad);
        trabajo.forEach((a, i) => {
            let n = taparTodas(a, texto, etiqueta);
            for (const p of palabrasSueltasDeElegidos(a.seudo, [texto])) n += taparTodas(a, p.texto, etiqueta);
            anotar('restos de carátula', i, etiqueta, n);
        });
    }

    //    b. Inconsistencia: lo que esta tapado en un archivo y a la vista en otro.
    for (const e of registro.entidades) {
        if (e.numero === null) continue;
        const etiqueta = registro.etiqueta(e);
        trabajo.forEach((a, i) => {
            let n = 0;
            for (const v of e.valores) {
                n += e.clase === 'identificador' && digitos(v).length >= 6
                    ? taparDigitos(a, v, etiqueta)
                    : taparTodas(a, v, etiqueta);
            }
            if (e.clase === 'persona') {
                for (const p of palabrasSueltasDeElegidos(a.seudo, [...e.valores])) n += taparTodas(a, p.texto, etiqueta);
            }
            anotar('inconsistencia', i, etiqueta, n);
        });
    }

    //    c. Candidatos sin regla: lo que el motor todavia ve como nombre sobre el
    //       texto ya tapado, y lo que quedo pegado a una etiqueta. Hasta que no
    //       aparezca nada nuevo, con un tope por si algo no converge.
    for (let vuelta = 0; vuelta < 3; vuelta++) {
        let nuevos = 0;
        trabajo.forEach((a, i) => {
            const vistos = [
                ...candidatosANombre(a.seudo, { conCitas: true }).map((c) => c.texto),
                ...restosPegadosAEtiqueta(a.seudo).map((c) => c.texto),
            ].filter((t) => !NO_ES_PERSONA.test(t));
            for (const texto of vistos) {
                const e = registro.persona(texto);
                if (!e) continue;
                const etiqueta = registro.etiqueta(e);
                trabajo.forEach((b, j) => {
                    const n = taparTodas(b, texto, etiqueta);
                    nuevos += n;
                    anotar('candidatos sin regla', j, etiqueta, n);
                });
            }
        });
        if (!nuevos) break;
    }

    return {
        archivos: trabajo.map((a) => ({
            real: a.real,
            seudo: a.seudo,
            mapa: a.segs.map((s) => ({ seudo: [s.s0, s.s1], real: [s.r0, s.r1], etiqueta: s.etiqueta })),
        })),
        tabla: registro.tabla(),
        controles: sumarControles(controles),
    };
}

/** Recorta un tramo de persona al nombre, y le saca lo intocable de adentro.
 *
 * CASO DE PRUEBA, 10/10/2026. La regla publica del campo -"Testigo:", "Nombre:"-
 * tapa hasta el final del renglon, y en un renglon de acta eso es "Testigo:
 * Juan Inventado declaro el 3/4/2024. La Sala A resolvio": la fecha y la sala
 * quedaban adentro de [PERSONA]. En la pantalla no importa, porque alguien lo
 * ve; aca el agente pierde la fecha y nadie se entera. Lo que queda afuera del
 * nombre vuelve a ser texto, y los controles lo miran despues como a todo.
 */
function ajustarTramo(a, s) {
    if (s.etiqueta === null) return [s];
    const m = /^\[([^[\]]+)\]$/.exec(s.etiqueta);
    if (!m) return [s];
    let fin = s.r1;
    if (BASES_DE_PERSONA.has(m[1].replace(/_\d+$/, ''))) {
        const valor = a.real.slice(s.r0, s.r1);
        const nombre = new RegExp(
            `^(?:(?:[${MAY}][${LETRA}'’.-]*|de|del|la|las|los|di|da|van|von|y),?(?:[ \\t]+|\\n(?!\\n)|$))+`);
        const n = nombre.exec(valor);
        if (n && n[0].trim()) fin = s.r0 + n[0].replace(/[\s,]+$/, '').length;
    }
    // Lo intocable que haya quedado adentro corta el tramo ahi.
    const zona = a.zonas.find((z) => z.desde < fin && z.hasta > s.r0 && z.desde > s.r0);
    if (zona) fin = Math.min(fin, zona.desde);
    while (fin > s.r0 && /\s/.test(a.real[fin - 1])) fin--;
    if (fin <= s.r0 || fin >= s.r1) return [s];
    return [{ ...s, r1: fin }, { r0: fin, r1: s.r1, etiqueta: null }];
}

function juntarCopiados(segs) {
    const salida = [];
    for (const s of segs) {
        const ultimo = salida.at(-1);
        if (ultimo && ultimo.etiqueta === null && s.etiqueta === null && ultimo.r1 === s.r0) ultimo.r1 = s.r1;
        else salida.push({ ...s });
    }
    return salida;
}

function sumarControles(lista) {
    const suma = new Map();
    for (const c of lista) {
        const k = `${c.control}|${c.archivo}|${c.etiqueta}`;
        if (suma.has(k)) suma.get(k).veces += c.veces;
        else suma.set(k, { ...c });
    }
    return [...suma.values()];
}

// ---------------------------------------------------------------------------
// Del seudonimizado al real.
// ---------------------------------------------------------------------------

/** Un tramo del seudonimizado, en el real: `{ desde, hasta }`.
 *
 * Es lo que hace el script local cuando el agente pide "de la 120 a la 480".
 * Un borde que cae adentro de una etiqueta se lleva la etiqueta entera: pedir
 * medio "[PERSONA_2]" es pedir a la persona.
 */
export function aReal(mapa, desde, hasta = desde) {
    if (!mapa.length) return { desde: 0, hasta: 0 };
    const total = mapa.at(-1).seudo[1];
    const d = Math.max(0, Math.min(desde, total));
    const h = Math.max(d, Math.min(hasta, total));
    const buscar = (pos, alFinal) => {
        const s = mapa.find((x) => (alFinal ? pos > x.seudo[0] && pos <= x.seudo[1] : pos >= x.seudo[0] && pos < x.seudo[1]))
            ?? (alFinal ? mapa[0] : mapa.at(-1));
        if (s.etiqueta !== null) return alFinal ? s.real[1] : s.real[0];
        return s.real[0] + (pos - s.seudo[0]);
    };
    const r0 = buscar(d, false);
    const r1 = h === d ? r0 : buscar(h, true);
    return { desde: r0, hasta: Math.max(r0, r1) };
}

/** Del real al seudonimizado: donde cae una posicion del texto real. */
export function aSeudo(mapa, posicion) {
    const s = mapa.find((x) => posicion >= x.real[0] && posicion < x.real[1]) ?? mapa.at(-1);
    if (!s) return 0;
    if (s.etiqueta !== null) return s.seudo[0];
    return s.seudo[0] + (posicion - s.real[0]);
}

// ---------------------------------------------------------------------------
// La forma de un dato, sin el dato. Para el buzon de fugas.
// ---------------------------------------------------------------------------

/** "Juan C. PEREZ" -> "Xx X. XX"; un numero, cada digito un 9 con sus puntos.
 *  Las letras y los digitos se tapan; la puntuacion y el largo de los numeros no. */
export function formaDe(dato) {
    return String(dato).split(/(\s+)/).map((palabra) => {
        if (/^\s+$/.test(palabra)) return ' ';
        const letras = [...palabra].filter((c) => new RegExp(`[${LETRA}]`).test(c));
        let molde;
        if (letras.length === 0) molde = null;
        else if (letras.length === 1 && letras[0] === letras[0].toUpperCase()) molde = 'X';
        else if (letras.every((c) => c === c.toUpperCase())) molde = 'XX';
        else if (letras[0] === letras[0].toUpperCase()) molde = 'Xx';
        else molde = 'x';
        let usado = false;
        return [...palabra].map((c) => {
            if (/\d/.test(c)) return '9';
            if (new RegExp(`[${LETRA}]`).test(c)) {
                if (usado) return '';
                usado = true;
                return molde;
            }
            return c;
        }).join('');
    }).join('');
}

/** Lo que rodea a una posicion, tapado: cada palabra con mayuscula o con un
 *  digito se reduce a su forma. Las minusculas quedan, porque son las que dicen
 *  que regla falta ("el demandado", "con domicilio en"). */
// Las palabras con mayuscula que NO identifican a nadie y son, muchas veces, el
// disparador que falta: el articulo que abre la oracion, el tratamiento, la
// sigla del documento. Taparlas deja el contexto sin lo unico que sirve.
const FUNCIONALES = new Set(`
el la los las un una lo al del de en con por para que se y o a su sus este esta
sr sra sres srta dr dra dres lic ing cdor esc
dni cuit cuil le lc tel cel email expte autos juzgado sala camara tribunal
actor actora demandado demandada testigo perito letrado letrada firmado fdo
matricula domicilio calle avenida av piso depto
`.trim().split(/\s+/));

export function contextoTapado(texto, desde, hasta, palabras = 5) {
    const tapar = (w) => {
        if (/\[[^\]]+\]/.test(w)) return w;
        if (/\d/.test(w)) return '‹N›';
        if (!new RegExp(`^[^${LETRA}]*[${MAY}]`).test(w)) return w;
        return FUNCIONALES.has(sinTildes(w.toLowerCase()).replace(/[^a-z]/g, '')) ? w : '‹X›';
    };
    const antes = texto.slice(Math.max(0, desde - 200), desde).split(/\s+/).filter(Boolean).slice(-palabras);
    const despues = texto.slice(hasta, hasta + 200).split(/\s+/).filter(Boolean).slice(0, palabras);
    return [...antes.map(tapar), '‹DATO›', ...despues.map(tapar)].join(' ');
}

/** El dato que esta en una posicion: la palabra, o el nombre o el numero que
 *  la contiene. Para cuando quien anota la fuga da un punto y no un tramo. */
export function datoEnPosicion(texto, posicion) {
    const p = Math.max(0, Math.min(posicion, texto.length - 1));
    if (/\d/.test(texto[p])) {
        let a = p, b = p + 1;
        while (a > 0 && /[\d.\-/ ]/.test(texto[a - 1]) && /[\d]/.test(texto.slice(Math.max(0, a - 2), a))) a--;
        while (b < texto.length && /[\d.\-/]/.test(texto[b])) b++;
        while (b > a && /[.\-/]/.test(texto[b - 1])) b--;
        while (a < b && /[\s.\-/]/.test(texto[a])) a++;
        return { desde: a, hasta: b };
    }
    const palabra = new RegExp(`[${LETRA}'’.-]`);
    let a = p, b = p;
    while (a > 0 && palabra.test(texto[a - 1])) a--;
    while (b < texto.length && palabra.test(texto[b])) b++;
    // Si la palabra empieza en mayuscula, el nombre entero: las vecinas con
    // mayuscula y las particulas entre ellas.
    const mayuscula = new RegExp(`^[${MAY}]`);
    if (mayuscula.test(texto.slice(a, b))) {
        const vecina = new RegExp(`^(\\s+)((?:de|del|la|las|los|di|da|van|von)\\s+)?([${MAY}][${LETRA}'’.-]*)`);
        for (;;) {
            const m = vecina.exec(texto.slice(b));
            if (!m || m[1].includes('\n\n')) break;
            b += m[0].length;
        }
        const previa = new RegExp(`([${MAY}][${LETRA}'’.-]*)(\\s+(?:(?:de|del|la|las|los|di|da|van|von)\\s+)?)$`);
        for (;;) {
            const m = previa.exec(texto.slice(0, a));
            if (!m || m[2].includes('\n\n')) break;
            a -= m[0].length;
        }
    }
    while (b > a && /[.,;:]/.test(texto[b - 1])) b--;
    return { desde: a, hasta: b };
}
