// ---------------------------------------------------------------
// scripts/verificar-automatico.mjs
//
// Banco del perfil automatico (E-08): escribiente/js/motor/automatico.js
// y conectores/automatico.mjs. Todos los datos son inventados.
//
// Lo que se prueba es lo que el pedido promete y nada mas:
//   - el mapa cierra: cada pedazo copiado es identico en los dos lados,
//     y del seudonimizado se vuelve al real sin correrse;
//   - la misma persona y el mismo DNI llevan la misma etiqueta en
//     toda la tanda, y el DNI en letras la misma que en digitos;
//   - normas, articulos, tribunales y fechas quedan a la vista;
//   - los tres controles tapan lo que el motor dejo;
//   - el buzon recibe la forma, nunca el dato;
//   - un PDF con una foja escaneada sale con esa foja leida por OCR.
//
// El perfil publico se prueba en verificar-escribiente, que no cambia.
//
// Uso: npm run verificar-automatico
// ---------------------------------------------------------------

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const url = (...p) => pathToFileURL(join(RAIZ, ...p)).href;

const A = await import(url('escribiente', 'js', 'motor', 'automatico.js'));
const { convertir } = await import(url('escribiente', 'js', 'motor', 'markdown.js'));
const conector = await import(url('conectores', 'automatico.mjs'));

const raizFormas = {};
for (const f of ['unicode.js', 'py.js', 'formas.js']) {
    new Function('globalThis', 'module', 'require', readFileSync(join(RAIZ, 'confronte', 'motor', f), 'utf8'))(raizFormas);
}
const { enLetras } = raizFormas.Motor.formas;

let fallas = 0;
let total = 0;
function ok(condicion, que) {
    total++;
    if (!condicion) { fallas++; console.log(`  FALLA  ${que}`); }
}

function mapaCierra(archivo) {
    let s = '';
    for (const seg of archivo.mapa) {
        if (seg.seudo[0] !== s.length) return false;
        const pedazo = archivo.seudo.slice(...seg.seudo);
        if (seg.etiqueta === null && pedazo !== archivo.real.slice(...seg.real)) return false;
        if (seg.etiqueta !== null && pedazo !== seg.etiqueta) return false;
        s += pedazo;
    }
    return s === archivo.seudo;
}

// --- La tanda inventada ---------------------------------------------------

const ESCRITO = `FICTICIO, ROBERTO c/ INVENTADA, MARTA s/ DAÑOS Y PERJUICIOS
Buenos Aires, 12 de marzo de 2024.
Juzgado Nacional de Primera Instancia en lo Civil n° 19, a cargo del Dr. Eustaquio Zamorano.
Se presenta Roberto Ficticio, DNI 23.456.789, con domicilio en Calle Falsa 123, CABA, y dice:
Que conforme el art. 1716 del Código Civil y Comercial y la ley 26.994, demanda a Marta Inventada.
Firmado: Ficticio.`;

const ACTA = `Autos: Ficticio c/ Inventada. El actor, documento nacional de identidad veintitrés millones cuatrocientos cincuenta y seis mil setecientos ochenta y nueve, ratifica.
Testigo: Anacleta Pintos Quiroga declaró el 3/4/2024. La Sala A de la Cámara Nacional de Apelaciones en lo Civil resolvió.
Después habló Zamorano, y lo escuchó Pintos.`;

const r = A.seudonimizarTanda(
    [{ nombre: 'escrito.pdf', texto: ESCRITO }, { nombre: 'Ficticio c Inventada s daños.pdf', texto: ACTA }],
    { enLetras });
const [e, a] = r.archivos;

console.log('El mapa');
ok(mapaCierra(e) && mapaCierra(a), 'cada pedazo copiado es igual en los dos textos');
{
    const i = e.seudo.indexOf('demanda a ');
    const q = A.aReal(e.mapa, i, e.seudo.length);
    ok(e.real.slice(q.desde, q.hasta) === 'demanda a Marta Inventada.\nFirmado: Ficticio.',
        'un tramo del seudonimizado se resuelve contra el real, etiquetas incluidas');
    const j = e.seudo.indexOf('[DNI_1]') + 3;
    const d = A.aReal(e.mapa, j, j + 1);
    ok(e.real.slice(d.desde, d.hasta) === '23.456.789', 'medio tramo de una etiqueta trae el dato entero');
    ok(A.aSeudo(e.mapa, e.real.indexOf('Buenos Aires')) === e.seudo.indexOf('Buenos Aires'),
        'del real al seudonimizado, en texto copiado');
}

console.log('Las etiquetas de la tanda');
ok(e.seudo.startsWith('[ACTOR_1] c/ [DEMANDADO_1]'), 'la carátula lleva el papel de cada parte');
ok(a.seudo.startsWith('Autos: [ACTOR_1] c/ [DEMANDADO_1]'), 'la misma parte, la misma etiqueta en el otro archivo');
ok(e.seudo.includes('DNI [DNI_1]') && a.seudo.includes('identidad [DNI_1]'),
    'el DNI en letras lleva la misma etiqueta que en dígitos');
ok(r.tabla['[DNI_1]'].valores.length === 2, 'la tabla de destapado tiene las dos escrituras del DNI');
ok(!/Ficticio|Inventada|Zamorano|Pintos|Anacleta|23\.456/.test(e.seudo + a.seudo),
    'ningún nombre ni número inventado queda a la vista');
ok(Object.values(r.tabla).every((t) => t.valores.length > 0), 'la tabla no tiene etiquetas vacías');

console.log('Lo intocable');
for (const frase of ['12 de marzo de 2024', 'art. 1716', 'Código Civil y Comercial', 'ley 26.994',
    'Juzgado Nacional de Primera Instancia en lo Civil n° [JUZGADO_1]', '3/4/2024',
    'Sala A de la Cámara Nacional de Apelaciones en lo Civil']) {
    ok((e.seudo + a.seudo).includes(frase), `«${frase}» sigue a la vista`);
}
{
    const z = A.zonasIntocables('Fecha de nacimiento: 01/02/1980. Resolvió el 01/02/2020.');
    ok(z.length === 1 && z[0].clase === 'fecha', 'una fecha de nacimiento no es intocable');
}

console.log('Los controles');
ok(a.seudo.includes('habló [PERSONA_1]'), 'inconsistencia: el apellido tapado en un archivo se tapa suelto en el otro');
ok(a.seudo.includes('escuchó [PERSONA_2]'), 'inconsistencia: también el de la testigo');
ok(r.controles.some((c) => c.control === 'restos de carátula'), 'los restos de carátula se anotan');
ok(r.controles.every((c) => /^\[[A-Z_]+_\d+\]$/.test(c.etiqueta) && Number.isInteger(c.veces)),
    'lo anotado son etiquetas y cantidades, nunca el dato');
{
    const t = A.seudonimizarTanda([{ nombre: 'x', texto: 'Comparece la Sra. Petronila Garabito Ulloa y dice que Garabito Ulloa no vino.' }]);
    ok(!/Petronila|Garabito|Ulloa/.test(t.archivos[0].seudo), 'candidatos sin regla: un nombre sin ancla se tapa igual');
}

console.log('La forma de un dato');
ok(A.formaDe('Juan C. PEREZ') === 'Xx X. XX', 'nombre');
ok(A.formaDe('23.456.789') === '99.999.999', 'DNI');
ok(A.formaDe('20-23456789-3') === '99-99999999-9', 'CUIT');
{
    const t = 'La perito Clotilde RAMALLO, con DNI 27.888.999, dictamina.';
    const n = A.datoEnPosicion(t, t.indexOf('Clotilde') + 2);
    ok(t.slice(n.desde, n.hasta) === 'Clotilde RAMALLO', 'el dato en una posición es el nombre entero');
    const d = A.datoEnPosicion(t, t.indexOf('888'));
    ok(t.slice(d.desde, d.hasta) === '27.888.999', 'y el número entero');
    const c = A.contextoTapado(t, n.desde, n.hasta);
    ok(c.includes('DNI') && c.includes('‹N›') && !/Clotilde|RAMALLO|27/.test(c), 'el contexto conserva el disparador y tapa el resto');
}

console.log('Las páginas');
{
    const frag = (str, y) => ({ str, transform: [10, 0, 0, 10, 50, y], width: str.length * 5, height: 10 });
    const paginas = [
        { numero: 1, ancho: 595, alto: 842, fragmentos: [frag('Primera foja del expediente.', 800)] },
        { numero: 2, ancho: 595, alto: 842, fragmentos: [] },
        { numero: 3, ancho: 595, alto: 842, fragmentos: [frag('Tercera foja, la que sigue.', 800)] },
    ];
    const c = convertir(paginas);
    ok(c.paginas.length === 2 && c.paginas[1].numero === 3, 'una foja vacía no está en el texto ni en la lista');
    ok(c.paginas.every((p) => c.markdown.slice(p.desde, p.hasta).includes('foja')), 'cada página cae donde está');
}

console.log('El inmueble (buzón, 12/10/2026)');
{
    // Las formas que anotó el buzón, con datos inventados: la matrícula del
    // Registro en dígitos, el domicilio que no tiene forma de calle y altura, y
    // la nomenclatura catastral.
    const OFICIO = [
        'Corresponde a Ana Ficticia, matrícula nro. 1-23456/7, en la proporción correspondiente.',
        'El inmueble sito en la calle Inventada mil doscientos cuarenta y cinco, unidad funcional ocho.',
        'Datos del inmueble a inscribir: SUPUESTA N° 4321/4323 PISO 3 UF 4 Matrícula FR 9-8765/4 nomenclatura catastral:',
        '## Circ. 15 Secc. 3 MANZANA 45, PARCELA 12B, ## Partida 765432-1.',
        'Unidad funcional número 5 Matrícula 2-3456/ 7, de esta ciudad.',
        'El inmueble sito en la calle General Ficticio Supuesto de Inventada/, piso tercero.',
        'Conforme la Sección 3 del capítulo, y el art. 15 de la ley 17.801.',
    ].join('\n');
    const [x] = A.seudonimizarTanda([{ nombre: 'oficio.md', texto: OFICIO }], { enLetras }).archivos;
    for (const [dato, que] of [
        ['1-23456/7', 'la matrícula con «nro.»'],
        ['mil doscientos cuarenta', 'la altura en letras'],
        ['SUPUESTA N° 4321', 'la calle en mayúsculas detrás de «a inscribir:»'],
        ['9-8765/4', 'la matrícula con «FR»'],
        ['2-3456/ 7', 'la matrícula con espacio después de la barra'],
        ['Ficticio Supuesto', 'la calle sin altura detrás de «calle»'],
        ['Circ. 15', 'la circunscripción'],
        ['MANZANA 45', 'la manzana'],
        ['12B', 'la parcela'],
        ['765432-1', 'la partida'],
    ]) ok(!x.seudo.includes(dato), `se tapa ${que}`);
    ok(/Secc\. \[CATASTRO_\d+\]/.test(x.seudo), 'lo catastral se tapa con su etiqueta y queda la palabra');
    ok(x.seudo.includes('Matrícula FR [MATRICULA_'), 'el «FR» queda, el número no');
    ok(x.seudo.includes('Sección 3 del capítulo') && x.seudo.includes('art. 15 de la ley 17.801'),
        'lejos de «catastral», «Sección 3» y el «15» del artículo quedan a la vista');
    ok(mapaCierra(x), 'el mapa cierra con lo catastral tapado por posición');
}

console.log('El número de juzgado (Javier, 12/10/2026)');
{
    const [x] = A.seudonimizarTanda([{ nombre: 'a.md', texto:
        'JUZGADO NACIONAL EN LO CIVIL Nro. 42. Juzgado Civil n° 42, Secretaría n° 83. La Sala 2 resolvió. Pasaron 42 días.' }],
    { enLetras }).archivos;
    ok(x.seudo.startsWith('JUZGADO NACIONAL EN LO CIVIL Nro. [JUZGADO_1]. Juzgado Civil n° [JUZGADO_1],'),
        'se tapa el número y queda el juzgado, con la misma etiqueta las dos veces');
    ok(x.seudo.includes('Secretaría n° 83') && x.seudo.includes('Sala 2'), 'la secretaría y la sala quedan');
    ok(x.seudo.includes('Pasaron 42 días'), 'el mismo número suelto no se sale a buscar');
}

console.log('El buzón');
const tmp = mkdtempSync(join(tmpdir(), 'automatico-'));
try {
    const seudo = join(tmp, '01.seudo.md');
    writeFileSync(seudo, 'Se presenta [ACTOR_1]. La perito Clotilde RAMALLO dictamina.\n');
    const buzon = join(tmp, 'buzon.md');
    writeFileSync(buzon, '# Fugas\n');
    process.env.REDACTOR_BUZON = buzon;
    const f = await conector.anotarFuga({ archivo: seudo, posicion: 35, clase: 'persona' });
    const escrito = readFileSync(buzon, 'utf8');
    ok(f.ok && f.forma === 'Xx XX', 'anotar_fuga devuelve la forma');
    ok(!/Clotilde|RAMALLO/.test(escrito) && escrito.includes('forma `Xx XX`'), 'el buzón tiene la forma y no el dato');
    ok(/^- \d{4}-\d{2}-\d{2} · `automatico` · `[0-9a-f]{8}` · persona · forma `Xx XX`$/m.test(escrito),
        'la entrada tiene la forma que lee herramientas/buzon.py de redactor');
    delete process.env.REDACTOR_BUZON;

    console.log('Un PDF con una foja escaneada');
    const pdf = await armarPdf();
    const ruta = join(tmp, 'prueba.pdf');
    writeFileSync(ruta, pdf);
    const ing = await conector.ingresar({ rutas: [ruta], salida: join(tmp, 'tanda') });
    const x = ing.archivos[0];
    ok(x.paginas[0].fuente === 'texto' && x.paginas[1].fuente === 'ocr', 'cada página marcada: texto u OCR');
    ok(x.paginas[1].confianza > 60, `el OCR lee en español (confianza ${x.paginas[1].confianza})`);
    ok(/comparece/i.test(x.real.slice(...x.paginas[1].real)), 'la foja escaneada tiene texto');
    ok(!/Anacleta|Pintos/.test(x.seudo), 'el nombre leído por OCR se tapa');
    ok(x.seudo.includes(Object.keys(ing.tabla).find((k) => ing.tabla[k].valores.some((v) => /Pintos/.test(v)))),
        'y con la misma etiqueta que en la página con texto');
    ok(mapaCierra(x), 'el mapa cierra también con OCR');
    ok(readFileSync(join(tmp, 'tanda', '01.seudo.md'), 'utf8') === x.seudo, 'la carpeta de la tanda guarda el seudonimizado');
} finally {
    rmSync(tmp, { recursive: true, force: true });
}

async function armarPdf() {
    const g = {};
    new Function('self', 'exports', 'module', 'define',
        readFileSync(join(RAIZ, 'escribiente', 'vendor', 'pdf-lib.min.js'), 'utf8'))(g);
    const PDFLib = g.PDFLib || globalThis.PDFLib;
    const { createCanvas } = require('@napi-rs/canvas');
    const doc = await PDFLib.PDFDocument.create();
    const fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    const p1 = doc.addPage([595, 842]);
    ['FICTICIO, ROBERTO c/ INVENTADA, MARTA s/ DANOS Y PERJUICIOS', 'Buenos Aires, 12 de marzo de 2024.',
        'Se presenta Roberto Ficticio, DNI 23.456.789, con domicilio en Calle Falsa 123, CABA.',
        'Se ofrece como testigo a Anacleta Pintos, que declarara oportunamente.']
        .forEach((t, i) => p1.drawText(t, { x: 50, y: 780 - i * 20, size: 11, font: fuente }));
    const lienzo = createCanvas(1240, 1754);
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 1240, 1754);
    ctx.fillStyle = '#000';
    ctx.font = '32px serif';
    ['En la ciudad de Buenos Aires, a los 3 dias de abril de 2024,',
        'comparece la testigo Anacleta Pintos, DNI 30.111.222,',
        'quien declara conocer a Roberto Ficticio desde hace diez años.']
        .forEach((t, i) => ctx.fillText(t, 100, 200 + i * 60));
    const png = await doc.embedPng(lienzo.toBuffer('image/png'));
    doc.addPage([595, 842]).drawImage(png, { x: 0, y: 0, width: 595, height: 842 });
    return doc.save();
}

console.log(fallas ? `\n${fallas} de ${total} comprobaciones fallan.` : `\nOK  ${total} comprobaciones, ninguna falla.`);
process.exit(fallas ? 1 : 0);
