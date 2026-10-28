// ---------------------------------------------------------------------------
// De un texto suelto ---lo seleccionado, o el texto de un enlace--- saca la
// fecha y el plazo que pueda. NO CALCULA: devuelve lo que leyo, y el computo
// lo hace la pantalla del sitio con el motor de siempre.
//
// Lo que se ve en el PJN (27/10/2026): 14/10/2026 en el PDF y en Lex100,
// 14/1/2026 en el editor. Ademas se aceptan la fecha con el mes en letras
// («14 de octubre de 2026»), entera en letras como va en las actas («catorce
// de octubre de dos mil veintiséis») y el plazo escrito como en un proveído
// («cinco (5) días», «diez días hábiles», «5 días»).
//
// Con dos fechas distintas en el texto no se elige: se devuelve la primera y
// se dice cuántas había, para que la pantalla lo muestre.
// ---------------------------------------------------------------------------

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const UNIDADES = {
    uno: 1, un: 1, primero: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7,
    ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14,
    quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
    veinte: 20, veintiuno: 21, veintiun: 21, veintidos: 22, veintitres: 23,
    veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27,
    veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50,
    sesenta: 60, noventa: 90
};

// Sin tildes y en minúscula, para comparar palabras.
function plano(t) {
    return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// «treinta y uno», «veintiséis», «quince» → número. null si no es un número.
function numeroEnLetras(t) {
    const p = plano(t).trim().split(/\s+y\s+|\s+/);
    if (p.length === 1) return UNIDADES[p[0]] ?? null;
    if (p.length === 2 && UNIDADES[p[0]] >= 30 && UNIDADES[p[1]] < 10) return UNIDADES[p[0]] + UNIDADES[p[1]];
    return null;
}

function valida(a, m, d) {
    const f = new Date(a, m - 1, d);
    return f.getFullYear() === a && f.getMonth() === m - 1 && f.getDate() === d;
}

function ymd(a, m, d) {
    return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const PALABRA = '[a-záéíóúñ]+';
const NUM_LETRAS = `${PALABRA}(?:\\s+y\\s+${PALABRA})?`;

function fechas(texto) {
    const halladas = [];
    const t = texto.replace(/\s+/g, ' ');
    let m;

    // 14/10/2026, 14-1-2026, 14.10.2026
    const numerica = /\b(\d{1,2})\s?[\/.\-]\s?(\d{1,2})\s?[\/.\-]\s?(\d{4})\b/g;
    while ((m = numerica.exec(t))) {
        const d = +m[1], me = +m[2], a = +m[3];
        if (valida(a, me, d)) halladas.push({ pos: m.index, fecha: ymd(a, me, d) });
    }

    // 14 de octubre de 2026, 1° de marzo de 2026, catorce de octubre de dos mil veintiséis
    const conMes = new RegExp(`\\b(\\d{1,2}|${NUM_LETRAS})(?:°|º)?\\s+de\\s+(${MESES.join('|')})\\s+(?:de|del)\\s+(\\d{4}|dos mil(?:\\s+${NUM_LETRAS})?)\\b`, 'gi');
    while ((m = conMes.exec(t))) {
        const d = /^\d+$/.test(m[1]) ? +m[1] : numeroEnLetras(m[1]);
        const me = MESES.indexOf(plano(m[2])) + 1;
        let a;
        if (/^\d{4}$/.test(m[3])) a = +m[3];
        else {
            const resto = plano(m[3]).replace(/^dos mil\s*/, '');
            a = 2000 + (resto ? (numeroEnLetras(resto) ?? NaN) : 0);
        }
        if (d && me && valida(a, me, d)) halladas.push({ pos: m.index, fecha: ymd(a, me, d) });
    }

    halladas.sort((x, y) => x.pos - y.pos);
    return [...new Set(halladas.map((h) => h.fecha))];
}

function plazo(texto) {
    const t = texto.replace(/\s+/g, ' ');
    // «cinco (5) días»: manda la cifra entre paréntesis.
    let m = /\((\d{1,3})\)\s*d[ií]as/i.exec(t);
    if (m) return +m[1];
    m = /\b(\d{1,3})\s*d[ií]as/i.exec(t);
    if (m) return +m[1];
    m = new RegExp(`\\b(${NUM_LETRAS})\\s+d[ií]as`, 'i').exec(t);
    if (m) {
        const n = numeroEnLetras(m[1]);
        if (n) return n;
    }
    return null;
}

export function interpretar(texto) {
    const t = String(texto || '').slice(0, 2000);
    const todas = fechas(t);
    return {
        fecha: todas[0] || null,
        otrasFechas: todas.length - (todas.length ? 1 : 0),
        plazo: plazo(t)
    };
}
