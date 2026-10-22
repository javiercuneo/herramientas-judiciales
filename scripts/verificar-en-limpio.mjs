#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Pasar en limpio (en-limpio/):  npm run verificar-en-limpio
//
// Carga los motores como los carga el navegador -los de confronte/motor/ y
// despues en-limpio/motor.js- y corre casos inventados con la forma de un
// auto copiado del sistema. Los textos son de nadie: la forma del caso, no
// el contenido.
//
// Lo que se prueba es lo propio de en-limpio: que se saque el ruido, que el
// texto quede en un bloque, que los numeros pasen a letras con la regla de
// confronte, y sobre todo LO QUE NO SE PASA -un CBU, un monto, una hora-,
// que es donde un error no se ve: sale un texto plausible y equivocado.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const ctx = vm.createContext({ console });
vm.runInContext('globalThis.Motor = {};', ctx);
for (const f of ['confronte/motor/unicode.js', 'confronte/motor/py.js', 'confronte/motor/difflib.js',
                 'confronte/motor/formas.js', 'confronte/motor/cotejo.js', 'en-limpio/motor.js']) {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), ctx, { filename: f });
}
const { limpiar } = vm.runInContext('Motor.enLimpio', ctx);

let ok = 0, mal = 0;
function igual(nombre, real, esperado) {
    if (real === esperado) { ok++; return; }
    mal++;
    console.log(`FALLA  ${nombre}\n  dio:      ${JSON.stringify(real)}\n  esperaba: ${JSON.stringify(esperado)}`);
}
const texto = (t) => limpiar(t).texto;

// --- el ruido
const auto = [
    '#12345678#987654321#20260101120000000',
    'Poder Judicial de la Nación',
    'JUZGADO CIVIL 999',
    '99999/2025',
    'PEREZ C/ GOMEZ S/ DAÑOS',
    'Buenos Aires, de marzo de 2026.- ABC',
    'Proveo: téngase presente.',
    '- 2 -',
    'USO OFICIAL',
    'Fecha de firma: 01/03/2026',
    'Firmado por: ALGUIEN, JUEZ',
].join('\n');
const r = limpiar(auto);
igual('encabezado, membrete, pie e iniciales fuera', r.texto,
    'Buenos Aires, de marzo de dos mil veintiséis.- Proveo: téngase presente.');
igual('lo sacado se anota', r.sacado.length >= 8, true);
igual('las iniciales se anotan', r.sacado.some((s) => s.que.startsWith('iniciales') && s.texto === 'ABC'), true);

igual('código pegado en el medio', texto('bajo apercibimiento #40000001#500000002#20260922081802535 de ser notificado'),
    'bajo apercibimiento de ser notificado');
igual('código sin la primera almohadilla', texto('apercibimiento 40000001#500000002#20260922081802535# de ser'),
    'apercibimiento de ser');

// --- un solo bloque
igual('renglones y párrafos, punto y seguido', texto('Hágase saber.\n\nNotifíquese por\nSecretaría.'),
    'Hágase saber. Notifíquese por Secretaría.');
igual('palabra cortada al final del renglón', texto('la conti-\nnuación del trámite'), 'la continuación del trámite');
igual('el guion de una matrícula no se une como palabra cortada', texto('matrícula 15-\n24328'),
    'matrícula quince- veinticuatro mil trescientos veintiocho');
igual('espacio antes de la coma', texto('Buenos Aires , haciéndose saber'), 'Buenos Aires, haciéndose saber');

// --- los números, con la regla de confronte
igual('fecha en dígitos', texto('el 3/3/2026 se presentó'), 'el tres de marzo de dos mil veintiséis se presentó');
igual('el día uno es primero', texto('el 1/7/2026'), 'el primero de julio de dos mil veintiséis');
igual('«1 de marzo» es primero', texto('el 1 de marzo de 2026'), 'el primero de marzo de dos mil veintiséis');
igual('ley con punto de los miles', texto('ley 22.172'), 'ley veintidós mil ciento setenta y dos');
igual('ordinal', texto('art. 5° y piso 2°'), 'art. quinto y piso segundo');
igual('matrícula', texto('matrícula 15-24328/65'), 'matrícula quince-veinticuatro mil trescientos veintiocho/sesenta y cinco');
igual('número de expediente', texto('Expte. N° 35442/2024'), 'Expte. N° treinta y cinco mil cuatrocientos cuarenta y dos/dos mil veinticuatro');
igual('tildes', texto('16 y 22 y 26'), 'dieciséis y veintidós y veintiséis');
igual('fecha con «.-» al final', texto('marzo de 2026.-'), 'marzo de dos mil veintiséis.-');

// --- la concordancia que enPalabras no hace
igual('veintiún mil', texto('21000 personas'), 'veintiún mil personas');
igual('un millón', texto('1000000 de'), 'un millón de');
igual('veintiún días', texto('21 días'), 'veintiún días');
igual('un día', texto('1 día'), 'un día');
igual('treinta y una cuotas', texto('31 cuotas'), 'treinta y una cuotas');
igual('uno al final queda uno', texto('la cuota número 1.'), 'la cuota número uno.');
const dudoso = limpiar('21 inmuebles');
igual('género desconocido se avisa', dudoso.revisar.length, 1);
igual('género desconocido no se inventa', dudoso.texto, 'veintiuno inmuebles');

// --- lo que NO se pasa, y se avisa
const noPasa = [
    ['número largo', 'cuenta 999999999999', '999999999999'],
    ['monto con decimales', 'la suma de 1.500.000,50', '1.500.000,50'],
    ['monto con «.-»', 'la suma de 150.000.-', '150.000.-'],
    ['monto con signo', 'la suma de $ 150.000', '150.000'],
    ['hora', 'a las 10:30 hs', '10'],
    ['pegado a letra', 'el sistema Lex100', '100'],
    ['ordinal mayor a diez', 'el 11° piso', '11°'],
];
for (const [nombre, entrada, dato] of noPasa) {
    const x = limpiar(entrada);
    igual(nombre + ': queda en el texto', x.texto.includes(dato), true);
    igual(nombre + ': se avisa', x.sinPasar.some((s) => s.dato === dato), true);
}

// --- el texto que sale es la suma de las partes
const largo = limpiar(auto + '\n' + noPasa.map((n) => n[1]).join('\n'));
igual('las partes arman el texto', largo.partes.map((p) => p.t).join(''), largo.texto);
igual('sin dígitos fuera de lo avisado',
    largo.partes.filter((p) => p.tipo !== 'sin-pasar' && /\d/.test(p.t)).length, 0);

console.log(`\nen-limpio: ${ok} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
