// ---------------------------------------------------------------------------
// Revisor de ortografia: texto de un PDF -> lista de posibles errores.
//
// Codigo puro: no toca el DOM ni chrome.*, asi que corre igual en la pagina
// de la extension y en Node (npm run verificar-revisor). Recibe el corrector
// ya armado (nspell) para no cargar el diccionario dos veces.
//
// EL CRITERIO, EN UNA FRASE: una minuscula se revisa estricto; una palabra
// con mayuscula se presume nombre propio o sigla, y solo se marca si a una
// letra de distancia hay una palabra comun del diccionario. "Resuevlo" se
// marca (resuelvo); "Rodriguez" o "ZWIRNER" no. Una falsa alarma por
// renglon tapa el error que importa: el aviso sirve si casi siempre dice
// "Sin errores".
// ---------------------------------------------------------------------------

// Une las palabras cortadas a fin de renglon. Se deja una marca (U+2060) en
// vez de unir sin mas, porque "teorico-practico" tambien puede caer cortado
// justo en el guion: la decision se toma al revisar, no aca.
export const UNION = '⁠';

// Texto de pdf.js (items con str y hasEOL) -> texto plano con saltos.
export function textoDeItems(items) {
    let t = '';
    for (const it of items) {
        t += it.str || '';
        if (it.hasEOL) t += '\n';
    }
    return t;
}

export function prepararTexto(texto) {
    return texto
        .normalize('NFKC')                       // ligaduras (fi, fl) y º -> o
        .replace(/­/g, '')                  // guion suave
        .replace(/(\p{L})[-‐‑]\s*\n\s*(?=\p{L})/gu, '$1' + UNION)
        .replace(/\s+/g, ' ');
}

// Lo que no es prosa: direcciones web y correos. Se reemplaza por espacios
// del mismo largo para no correr las posiciones del contexto.
const NO_PROSA = /\b(?:https?:\/\/|www\.)\S+|\S+@\S+/giu;

const PALABRA = new RegExp(`[\\p{L}\\p{M}${UNION}]+`, 'gu');
const ROMANO = /^[ivxlcdm]+$/i;
const VOCALES_TILDE = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
const ALFABETO = 'abcdefghijklmnñopqrstuvwxyzáéíóúü';

// Pronombres encliticos: "notifiquese", "hagasele", "regulense". El
// diccionario no trae todas las combinaciones de verbo y pronombre.
const ENCLITICO = /^(.{2,}?)(?:(?:se|me|te|nos)(?:lo|la|los|las|le|les)?|lo|la|los|las|le|les)$/u;

// Cada variante con una vocal tildada: "rodriguez" -> "rodríguez", ...
function conTilde(p) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
        const t = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }[p[i]];
        if (t) out.push(p.slice(0, i) + t + p.slice(i + 1));
    }
    return out;
}

// La forma con pronombre pegado lleva la tilde donde el verbo tenia el
// acento, que en la forma sin pronombre es la penultima silaba: "notifique"
// -> "notifíque(se)", "devuelva" -> "devuélva(se)". En el grupo de vocales,
// la tilde va en la abierta. Sirve para que "nótifiquese" no pase.
function tildeLlana(p) {
    const grupos = [...p.matchAll(/[aeiouü]+/g)];
    if (grupos.length < 2) return p;
    const g = grupos[grupos.length - 2];
    let i = g[0].search(/[aeo]/);
    if (i < 0) i = g[0].length - 1;
    const pos = g.index + i;
    return p.slice(0, pos) + { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }[p[pos]] + p.slice(pos + 1);
}

function sinTilde(p) {
    return p.replace(/[áéíóú]/g, (v) => VOCALES_TILDE[v]);
}

export function crearRevisor({ corrector, propias = [], personales = [] }) {
    const validas = new Set();
    for (const p of [...propias, ...personales]) validas.add(p.toLocaleLowerCase('es'));

    const correcta = (p) => corrector.correct(p);

    // La palabra existe tal cual, en minuscula, en las listas, o como verbo
    // con pronombre pegado.
    function aceptada(p) {
        const min = p.toLocaleLowerCase('es');
        if (validas.has(min)) return true;
        if (correcta(p) || correcta(min)) return true;
        const m = ENCLITICO.exec(min);
        if (m) {
            const base = m[1];
            // Con pronombre pegado, la tilde la exige la regla general salvo
            // en el infinitivo ("hacerse", "darle"). "notifiquese" sin tilde
            // es un error, y no se lo deja pasar por el atajo.
            if (/[áéíóú]/.test(min)) {
                const llana = sinTilde(base);
                if (correcta(llana) && min === tildeLlana(llana) + min.slice(base.length)) return true;
            } else if (/r$/.test(base) && correcta(base)) {
                return true;
            }
        }
        return false;
    }

    // Palabras a una letra de distancia: borrar, cambiar, agregar o
    // intercambiar dos vecinas. Con `estricta` cuenta solo la palabra comun
    // tal cual, y sirve de prueba de que hubo un error de tipeo y no un
    // apellido. Sin ella acepta ademas la variante con tilde y el verbo con
    // pronombre, y sirve de sugerencia: "notifiquse" -> "notifíquese".
    // Primero lo que solo pide una tilde, despues lo comun, al final lo que
    // pide un cambio y una tilde.
    function vecinas(min, { estricta = false } = {}) {
        const costo = new Map();
        const anotar = (c, n) => { if (!costo.has(c) || costo.get(c) > n) costo.set(c, n); };
        if (!estricta) for (const v of conTilde(min)) if (aceptada(v)) anotar(v, 0);
        const ver = (c) => {
            if (c === min) return;
            if (correcta(c)) { anotar(c, 1); return; }
            if (estricta) return;
            for (const v of [c, ...conTilde(c)]) {
                if (aceptada(v)) { anotar(v, 2); return; }
            }
        };
        for (let i = 0; i < min.length - 1; i++) {
            ver(min.slice(0, i) + min[i + 1] + min[i] + min.slice(i + 2));
        }
        for (let i = 0; i < min.length; i++) ver(min.slice(0, i) + min.slice(i + 1));
        for (let i = 0; i <= min.length; i++) {
            for (const l of ALFABETO) {
                if (i < min.length) ver(min.slice(0, i) + l + min.slice(i + 1));
                ver(min.slice(0, i) + l + min.slice(i));
            }
        }
        // El orden de insercion desempata: los intercambios van primero.
        return [...costo].sort((x, y) => x[1] - y[1]).map(([c]) => c);
    }

    // Devuelve null si la palabra pasa, o { sugerencias } si se marca.
    function juzgar(p) {
        if (p.length < 2 || ROMANO.test(p)) return null;
        if (aceptada(p)) return null;
        const min = p.toLocaleLowerCase('es');
        if (p !== min) {
            // Con mayuscula: un apellido sin su tilde ("Rodriguez") pasa, y
            // lo demas se marca solo si es largo y a una letra hay una
            // palabra comun.
            if (p.length < 6) return null;
            const nombre = p[0] + min.slice(1);
            if (conTilde(nombre).some(correcta)) return null;
            if (vecinas(min, { estricta: true }).length === 0) return null;
        }
        return { sugerencias: vecinas(min).slice(0, 3) };
    }

    function revisarTramo(tramo) {
        if (!tramo.includes(UNION)) return juzgar(tramo);
        // Palabra cortada a fin de renglon: vale unida o, si era compuesta
        // con guion, vale si cada mitad vale por separado.
        const unida = tramo.split(UNION).join('');
        const r = juzgar(unida);
        if (!r) return null;
        if (tramo.split(UNION).every((m) => !juzgar(m))) return null;
        return r;
    }

    function revisar(textoCrudo, { palabrasContexto = 4 } = {}) {
        const texto = prepararTexto(textoCrudo).replace(NO_PROSA, (s) => ' '.repeat(s.length));
        const hallazgos = new Map();
        for (const m of texto.matchAll(PALABRA)) {
            const tramo = m[0];
            const ini = m.index;
            const fin = ini + tramo.length;
            // Pegada a un numero ("2do", "1ra", "N3"): no es una palabra.
            if (/\d/.test(texto[ini - 1] || '') || /\d/.test(texto[fin] || '')) continue;
            const r = revisarTramo(tramo);
            if (!r) continue;
            const palabra = tramo.split(UNION).join('');
            const clave = palabra.toLocaleLowerCase('es');
            if (!hallazgos.has(clave)) {
                hallazgos.set(clave, {
                    palabra,
                    sugerencias: r.sugerencias,
                    contexto: contexto(texto, ini, fin, palabrasContexto),
                    veces: 0,
                });
            }
            hallazgos.get(clave).veces++;
        }
        return [...hallazgos.values()];
    }

    return { revisar, aceptada };
}

// Unas palabras a cada lado, con el espacio que haya junto a la palabra tal
// cual: "Resuevlo:" no es "Resuevlo :".
function contexto(texto, ini, fin, n) {
    const limpiar = (s) => s.split(UNION).join('').replace(/\s+/g, ' ');
    const antes = texto.slice(0, ini).match(new RegExp(`(?:\\S+\\s+){0,${n}}$`))[0];
    const despues = texto.slice(fin).match(new RegExp(`^(?:\\s*\\S+){0,${n}}`))[0];
    return {
        antes: limpiar(antes).trimStart(),
        palabra: limpiar(texto.slice(ini, fin)),
        despues: limpiar(despues).trimEnd(),
    };
}

// La lista del fuero: una palabra por linea, # para comentarios.
export function leerLista(texto) {
    return texto.split(/\r?\n/)
        .map((l) => l.replace(/#.*/, '').trim())
        .filter(Boolean)
        .flatMap((l) => l.split(/\s+/))
        .map((p) => p.replace(/\.$/, ''));
}
