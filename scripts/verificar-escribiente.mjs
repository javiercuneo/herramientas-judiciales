// Banco de pruebas del motor de Escribiente.
//
// Por que existe: la herramienta de la que sale Escribiente —"PDF Studio",
// heredada de una plantilla de Google AI Studio— no tenia una sola
// comprobacion, y fallaba callada de dos formas graves que nadie habia notado
// en meses de publicada. Las dos estan abajo como regresion, con el caso
// exacto que fallaba:
//
//   1. Una resolucion de UNA carilla salia con 2 de sus 12 lineas. El umbral
//      de "encabezado repetido" se calculaba como paginas * 0.4, que para un
//      documento de una pagina da 0.4, y cualquier linea aparece una vez. Se
//      borraban el "Resuelvo", el monto y la firma.
//
//   2. "$ 3.255.622,50" se convertia en "$ [DNI],50". El patron de DNI tiene la
//      misma forma que un monto, y el monto es el dato del que depende la
//      resolucion entera.
//
// Ninguna de las dos rompia nada visible. Las dos devolvian un archivo con
// aspecto correcto, y por eso hacen falta pruebas y no revisiones a ojo.
//
// Que cubre: el motor —extraccion, conversion a Markdown, anonimizacion y
// armado del .md—. Que NO cubre: la pantalla, y pdf.js, que es de terceros y
// esta pineado en escribiente/vendor/.
//
// Correr con: npm run verificar-escribiente

import { diagnosticar, MINIMO_POR_PAGINA } from '../escribiente/js/motor/extraer.js';
import { convertir, detectarRepetidos } from '../escribiente/js/motor/markdown.js';
import {
    anonimizar,
    candidatosANombre,
    partesDeCaratula,
    normalizarEspacios,
} from '../escribiente/js/motor/anonimizar.js';
import { armarDocumento, titulo, nombreDeDescarga } from '../escribiente/js/motor/documento.js';
import { analizarRango, describirProblemas, explicarError } from '../escribiente/js/motor/pdf.js';

let fallos = 0;
let pruebas = 0;

function ok(condicion, descripcion, detalle) {
    pruebas++;
    if (condicion) return;
    fallos++;
    console.log(`  FALLA  ${descripcion}`);
    if (detalle) console.log(`         ${detalle}`);
}

function contiene(texto, buscado, descripcion) {
    ok(texto.includes(buscado), descripcion, `no aparece: ${JSON.stringify(buscado)}`);
}

function noContiene(texto, buscado, descripcion) {
    ok(!texto.includes(buscado), descripcion, `aparece y no deberia: ${JSON.stringify(buscado)}`);
}

// ---------------------------------------------------------------------------
// Fabrica de paginas falsas.
//
// Se arma la forma que devuelve pdf.js —un fragmento por linea, con su
// posicion— sin necesitar un documentos de prueba. Alcanza para el motor, que es lo
// que se prueba: de la geometria solo usa la altura para agrupar y el ancho
// para los espacios.
// ---------------------------------------------------------------------------
function pagina(numero, lineas, ancho = 612) {
    return {
        numero,
        ancho,
        alto: 792,
        fragmentos: lineas.map((str, i) => ({
            str,
            width: str.length * 5,
            transform: [1, 0, 0, 1, 50, 700 - i * 15],
        })),
    };
}

const RESOLUCION = [
    'Poder Judicial de la Nacion',
    'JUZGADO NACIONAL EN LO CIVIL Nro. 42',
    'Buenos Aires, 17 de agosto de 2026.',
    'Autos y Vistos: para resolver sobre los honorarios regulados a fs. 210.',
    'Considerando: que el perito acompanio su informe en tiempo y forma.',
    'Resuelvo: regular los honorarios del perito en la suma de $ 3.255.622,50',
    'equivalentes a 25 UMA conforme el art. 21 de la ley 27.423.',
    'Notifiquese y registrese.',
    'Firmado por: LOPEZ MARIA, Jueza',
    'Poder Judicial de la Nacion - Sistema de Gestion Judicial',
];

console.log('\nMOTOR DE CONVERSION\n');

// --- REGRESION 1 -----------------------------------------------------------
{
    const { markdown, informe } = convertir([pagina(1, RESOLUCION)]);

    contiene(markdown, 'Resuelvo', 'REGRESION: una resolucion de una carilla conserva el Resuelvo');
    contiene(markdown, '3.255.622,50', 'REGRESION: conserva el monto regulado');
    contiene(markdown, 'Firmado por', 'REGRESION: conserva la firma');
    contiene(markdown, 'JUZGADO NACIONAL', 'REGRESION: conserva el encabezado del juzgado');
    ok(informe.encabezados === 0 && informe.pies === 0,
        'REGRESION: en un documento de una pagina no se quita nada por repetido',
        `encabezados=${informe.encabezados} pies=${informe.pies}`);

    const repetidos = detectarRepetidos([pagina(1, RESOLUCION)]);
    ok(repetidos.encabezados.size === 0 && repetidos.pies.size === 0,
        'una sola pagina no puede tener nada "repetido"');
}

// --- Documentos cortos: dos paginas tampoco alcanzan ------------------------
{
    const dos = [pagina(1, RESOLUCION), pagina(2, RESOLUCION)];
    const { informe } = convertir(dos);
    ok(informe.encabezados === 0 && informe.pies === 0,
        'con dos paginas todavia no se descarta nada por repetido');
}

// --- Con tres paginas o mas, el membrete si se va ---------------------------
{
    const cuerpo = (n) => [
        'Poder Judicial de la Nacion - Camara Nacional de Apelaciones en lo Civil',
        `Este es el cuerpo propio de la pagina numero ${n}, que no se repite.`,
        'Otro renglon distinto en cada una de las paginas del documento.',
        'Sistema de Gestion Judicial Lex100 - Documento firmado digitalmente',
    ];
    const largo = [pagina(1, cuerpo(1)), pagina(2, cuerpo(2)), pagina(3, cuerpo(3)),
                   pagina(4, cuerpo(4))];
    const { markdown, informe } = convertir(largo);

    noContiene(markdown, 'Camara Nacional de Apelaciones',
        'con cuatro paginas, el membrete repetido se quita');
    contiene(markdown, 'cuerpo propio de la pagina numero 3',
        'el cuerpo de cada pagina se conserva entero');
    ok(informe.encabezados + informe.pies >= 4,
        'el informe cuenta las lineas que se quitaron',
        `encabezados=${informe.encabezados} pies=${informe.pies}`);
}

// --- REGRESION 6: paginas con pocos renglones ------------------------------
{
    // Encontrado probando un expediente de verdad. Dos causas sumadas:
    //   - la ventana de "borde" era fija (4 arriba, 6 abajo), asi que en una
    //     foja de 9 renglones abarcaba la pagina entera
    //   - la expansion por parecido no tenia limite de largo, y dos renglones
    //     de prosa que difieren en un digito se parecen mas del 60%
    // Resultado: 30 de 35 lineas borradas, y el .md quedaba con un renglon por
    // foja. Con aspecto correcto, como siempre.
    const foja = (n) => [
        'Poder Judicial de la Nacion - Camara Nacional de Apelaciones en lo Civil',
        '',
        `Foja ${n} del expediente, con el detalle propio de esta pagina.`,
        `La demandada contesto el traslado conferido en el punto ${n} de la`,
        'resolucion apelada, y pidio que se rechace con costas.',
        '',
        `${n}`,
        'Sistema de Gestion Judicial Lex100 - Documento firmado digitalmente',
    ];
    const paginas = [1, 2, 3, 4, 5].map((n) => pagina(n, foja(n)));
    const { markdown, informe } = convertir(paginas);

    for (const n of [1, 2, 3, 4, 5]) {
        contiene(markdown, `punto ${n} de la`,
            `REGRESION: el cuerpo de la foja ${n} sobrevive aunque se parezca al de las otras`);
    }
    noContiene(markdown, 'Camara Nacional de Apelaciones',
        'y el membrete repetido igual se quita');
    noContiene(markdown, 'Lex100', 'y el pie repetido tambien');
    ok(informe.lineas >= 10,
        'quedan al menos dos renglones de cuerpo por foja',
        `lineas=${informe.lineas}`);
}

// --- Nada se descarta en silencio ------------------------------------------
{
    const { markdown, informe } = convertir([pagina(1, RESOLUCION)]);

    // De las 10 lineas del original quedan 9 porque dos se unen: el renglon del
    // monto no cierra oracion y el siguiente arranca en minuscula, o sea son la
    // misma frase cortada por el ancho de la hoja. Lo que importa es que la
    // cuenta cierre: lineas quitadas + unidas + sobrevivientes = originales.
    const quitadas = informe.encabezados + informe.pies + informe.bordes + informe.codigos;
    ok(informe.lineas + informe.unidas + quitadas === RESOLUCION.length,
        'la cuenta del informe cierra contra el original: nada desaparece sin registro',
        `lineas=${informe.lineas} unidas=${informe.unidas} quitadas=${quitadas} ` +
        `originales=${RESOLUCION.length}`);
    contiene(markdown, '$ 3.255.622,50 equivalentes a 25 UMA',
        'la frase cortada por el ancho de la hoja queda en una sola linea');
}

// --- Union de palabras cortadas y reflujo de parrafo ------------------------
{
    const { markdown } = convertir([pagina(1, [
        'El actor promovio la presente demanda por danos y per-',
        'juicios contra la aseguradora citada en garantia, y',
        'solicito la reparacion integral del perjuicio sufrido.',
        'Otro parrafo aparte.',
    ])]);
    contiene(markdown, 'perjuicios', 'la palabra cortada por guion se une');
    noContiene(markdown, 'per-\njuicios', 'no queda el guion de corte');
    contiene(markdown, 'aseguradora citada en garantia, y solicito',
        'los renglones del mismo parrafo se unen en una linea');
}

console.log('DIAGNOSTICO DE OCR\n');

// --- Rechazo del escaneo puro ----------------------------------------------
{
    const escaneo = [pagina(1, ['']), pagina(2, ['']), pagina(3, [''])];
    const d = diagnosticar(escaneo);
    ok(d.sirve === false, 'un PDF sin texto se rechaza');
    contiene(d.motivo, 'OCR', 'el motivo del rechazo nombra el OCR');
    contiene(d.motivo, 'escaneo', 'el motivo explica que es un escaneo');
}

{
    const conTexto = [pagina(1, RESOLUCION), pagina(2, RESOLUCION)];
    const d = diagnosticar(conTexto);
    ok(d.sirve === true, 'un PDF con texto nativo se acepta');
    ok(d.vacias.length === 0, 'ninguna pagina figura como vacia');
}

// --- Paginas escaneadas intercaladas: se acepta, pero se avisa cuales -------
{
    const mixto = [
        pagina(1, RESOLUCION),
        pagina(2, ['']),
        pagina(3, RESOLUCION),
        pagina(4, ['foja']),
        pagina(5, RESOLUCION),
    ];
    const d = diagnosticar(mixto);
    ok(d.sirve === true, 'un expediente con fojas escaneadas sueltas se procesa igual');
    ok(d.vacias.join(',') === '2,4',
        'se avisa exactamente que fojas salieron en blanco',
        `vacias=[${d.vacias}]`);
}

ok(MINIMO_POR_PAGINA === 100, 'el umbral por pagina no se movio');

console.log('ANONIMIZACION\n');

const ESCRITO = normalizarEspacios(`Buenos Aires, 6 de agosto de 2026.
Comparece el Sr. Juan Carlos Perez, DNI 30.119.078, con domicilio real en
Rivadavia 1234, piso 3 depto B, y correo juan.perez@estudio-perez.com.ar.
Se regulan los honorarios en la suma de $ 3.255.622,50 conforme el art. 730
del Codigo Civil y Comercial y el art. 21 de la ley 27.423.
El perito ARIAS ANALIA GABRIELA percibio la suma de 1.500.000 pesos.
Telefono: 4371-1696. CUIT 20-30119078-9. CBU 0170099220000067797370.
Expte. 56.868/2017, iniciado el 06/08/2017. To 45 Fo 122.
El rodado dominio AB 123 CD colisiono. Ver art. 730 y ART 512.
Vease Llambias, Jorge Joaquin, Tratado de Derecho Civil, Buenos Aires, Astrea.
Firmado por: LOPEZ MARIA, Jueza de Primera Instancia.`);

const { texto: anonimo, conteo } = anonimizar(ESCRITO);

// --- REGRESION 2 -----------------------------------------------------------
contiene(anonimo, '$ 3.255.622,50', 'REGRESION: el monto con decimales queda intacto');
noContiene(anonimo, '[DNI],50', 'REGRESION: el monto no se convierte en [DNI]');
contiene(anonimo, '1.500.000 pesos', 'un monto sin signo pero con la palabra "pesos" queda intacto');
contiene(anonimo, 'DNI [DNI]', 'un DNI de verdad si se reemplaza');

// --- Lo que no se puede romper ---------------------------------------------
contiene(anonimo, 'art. 730', 'el numero de articulo no se toca');
contiene(anonimo, 'ART 512', 'una sigla con numero no se confunde con una patente');
contiene(anonimo, 'ley 27.423', 'el numero de ley no se toca');
contiene(anonimo, '06/08/2017', 'la fecha no se confunde con un expediente');
contiene(anonimo, '[DOMINIO]', 'la patente real si se reemplaza');

// --- Lo que tiene que desaparecer ------------------------------------------
for (const dato of ['30.119.078', 'juan.perez@estudio-perez.com.ar', '20-30119078-9',
                    '0170099220000067797370', '4371-1696', '56.868/2017']) {
    noContiene(anonimo, dato, `se reemplaza: ${dato}`);
}
contiene(anonimo, 'Sr. [PERSONA]', 'el tratamiento se conserva y el nombre se va');
contiene(anonimo, 'Firmado por: [PERSONA], Jueza de Primera Instancia',
    'la firma oculta el nombre y conserva el cargo');
noContiene(anonimo, '[EXPTE].', 'el expediente se toma entero, no por la mitad');
contiene(anonimo, '[EXPTE]', 'el expediente se reemplaza');
ok(Object.keys(conteo).length >= 8, 'el conteo registra cada regla que actuo',
    `reglas con reemplazos: ${Object.keys(conteo).join(', ')}`);

// --- REGRESION 5: ningun patron cruza el salto de linea --------------------
{
    // Encontrado probando un documentos de prueba, no en el escritorio: el separador
    // entre el tratamiento y el nombre era `\s+`, que incluye el salto de
    // linea, asi que "Jueza" al final de un renglon enganchaba el renglon
    // siguiente entero y lo reemplazaba por [PERSONA].
    const { texto } = anonimizar(
        'Firmado por: LOPEZ MARIA ELENA, Jueza\nPoder Judicial de la Nacion - Lex100'
    );
    contiene(texto, 'Poder Judicial de la Nacion - Lex100',
        'REGRESION: el tratamiento al final de un renglon no se come el renglon siguiente');
    contiene(texto, 'Firmado por: [PERSONA], Jueza', 'y la firma se anonimiza igual');
}

{
    const { texto } = anonimizar('Dr. Juan Perez\nRivadavia 1234, piso 3');
    contiene(texto, 'Dr. [PERSONA]', 'el tratamiento con su nombre en el mismo renglon si actua');
    contiene(texto, '[DOMICILIO]', 'y el domicilio del renglon siguiente se toma por su cuenta');
}

{
    const pendientes = candidatosANombre('LEX100 SISTEMA JUDICIAL\nPODER JUDICIAL NACION')
        .map((c) => c.texto);
    ok(!pendientes.some((p) => p.includes('\n') || /LEX100 SISTEMA JUDICIAL PODER/.test(p)),
        'los candidatos tampoco se arman cruzando renglones',
        `candidatos: ${pendientes.join(' | ')}`);
}

// --- Los cargos no son apellidos -------------------------------------------
{
    const pendientes = candidatosANombre('Firmado por LOPEZ MARIA ELENA, Jueza de la causa')
        .map((c) => c.texto);
    ok(!pendientes.some((p) => /Jueza/.test(p)),
        'un cargo pegado al nombre no genera un candidato duplicado',
        `candidatos: ${pendientes.join(' | ')}`);
}

// --- El anclaje del telefono se conserva -----------------------------------
{
    const { texto } = anonimizar('Su telefono 4371-1696 y su fax 4371-1697.');
    contiene(texto, 'telefono [TEL]', 'la palabra que ancla el telefono se conserva');
    contiene(texto, 'fax [TEL]', 'lo mismo con el fax');
}

// --- El email no se come el punto de la oracion ----------------------------
{
    const { texto } = anonimizar('Escribir a juan@estudio.com. Despues seguimos.');
    contiene(texto, '[EMAIL]. Despues', 'el punto final de la oracion sobrevive al email');
}

// --- Candidatos: se listan, no se reemplazan -------------------------------
{
    const pendientes = candidatosANombre(anonimo).map((c) => c.texto);
    ok(pendientes.includes('ARIAS ANALIA GABRIELA'),
        'el nombre en mayusculas que ninguna regla toco se ofrece como candidato',
        `candidatos: ${pendientes.join(' | ')}`);
    contiene(anonimo, 'Llambias, Jorge Joaquin',
        'la cita de doctrina NO se reemplaza sola');
    ok(!pendientes.some((p) => p.toLowerCase().includes('buenos aires')),
        'una editorial con lugar no se ofrece como persona',
        `candidatos: ${pendientes.join(' | ')}`);
}

// --- Caratula --------------------------------------------------------------
{
    const partes = partesDeCaratula(
        'en los autos caratulados PEREZ JUAN CARLOS c/ GARCIA MARIA s/ DANOS Y PERJUICIOS'
    );
    ok(partes.length === 2, 'la caratula "X c/ Y s/" da las dos partes', `partes=${partes}`);
    ok(partes[0] === 'PEREZ JUAN CARLOS', 'el actor sale entero, sin el "caratulados"',
        `actor=${partes[0]}`);

    const incidente = partesDeCaratula(
        'INCIDENTE N 2 - ACTOR: FICTICIO, ADRIAN DEMANDADO: INVENTADA, BEATRIZ S/EJECUCION'
    );
    ok(incidente.length === 2, 'un incidente del PJN, que no usa "c/", tambien da las partes',
        `partes=${incidente}`);
}

// --- Reemplazos elegidos por el usuario ------------------------------------
{
    // De mas largo a mas corto, sin depender del orden en que llegaron: al
    // reves, el corto pega primero y deja "Estudio Juridico [ESTUDIO]".
    const { texto } = anonimizar('El Estudio Juridico Ficticio contesta. Ficticio firma.', [
        { texto: 'Ficticio', reemplazo: '[PERSONA]' },
        { texto: 'Estudio Juridico Ficticio', reemplazo: '[ESTUDIO]' },
    ]);
    contiene(texto, '[ESTUDIO] contesta', 'el reemplazo mas largo gana sin importar el orden');
    contiene(texto, '[PERSONA] firma', 'el mas corto sigue actuando donde corresponde');
}

{
    // El texto de un PDF trae saltos de linea en medio de un nombre.
    const { texto } = anonimizar('Comparece Juan\nCarlos Perez y ratifica.', [
        { texto: 'Juan Carlos Perez', reemplazo: '[ACTOR]' },
    ]);
    contiene(texto, '[ACTOR]', 'el reemplazo tolera el salto de linea en medio del nombre');
}

{
    const { texto } = anonimizar('La demandada Sur SA no contesto. Insurgentes no.', [
        { texto: 'Sur', reemplazo: '[EMPRESA]' },
    ]);
    contiene(texto, '[EMPRESA] SA', 'el reemplazo actua sobre la palabra entera');
    contiene(texto, 'Insurgentes', 'y no pega dentro de otra palabra');
}

console.log('ARMADO DEL ARCHIVO\n');

// --- REGRESION 3: el nombre del archivo no se filtra ------------------------
{
    const NOMBRE = 'PEREZ JUAN CARLOS c GARCIA MARIA s DAÑOS Y PERJUICIOS.pdf';

    const md = armarDocumento({
        nombreArchivo: NOMBRE,
        cuerpo: 'Cuerpo del documento ya anonimizado.',
        anonimizado: true,
        conteo: { DNI: 2 },
        pendientes: [],
    });

    noContiene(md, 'PEREZ', 'REGRESION: el nombre del archivo no entra en el .md anonimizado');
    noContiene(md, 'GARCIA', 'REGRESION: tampoco el apellido de la otra parte');
    ok(titulo(NOMBRE, true) === 'Documento', 'el titulo anonimizado es generico');
    ok(nombreDeDescarga(NOMBRE, true) === 'documento-anonimizado.md',
        'el nombre de la descarga tampoco filtra la caratula',
        nombreDeDescarga(NOMBRE, true));

    // Sin anonimizar, el nombre del archivo es informacion util y se conserva.
    ok(titulo(NOMBRE, false) === 'PEREZ JUAN CARLOS c GARCIA MARIA s DAÑOS Y PERJUICIOS',
        'sin anonimizar, el titulo sigue siendo el nombre del archivo');
}

// --- La constancia dice lo que hay que saber -------------------------------
{
    const md = armarDocumento({
        nombreArchivo: 'resolucion.pdf',
        cuerpo: 'texto',
        anonimizado: true,
        informe: { paginas: 5, lineas: 80, encabezados: 4, pies: 4, bordes: 2, codigos: 0 },
        conteo: { DNI: 3, email: 1 },
        pendientes: ['Llambias, Jorge Joaquin'],
        paginasVacias: [2, 4],
    });

    contiene(md, 'Constancia de procesamiento', 'el archivo lleva su constancia');
    contiene(md, 'las páginas 2, 4', 'la constancia nombra las fojas que salieron en blanco');
    contiene(md, 'NO está en este archivo', 'y dice qué significa eso');
    contiene(md, '4 reemplazos', 'la constancia totaliza los reemplazos');
    contiene(md, 'DNI: 3', 'y los desglosa por regla');
    contiene(md, 'sin reemplazar', 'la constancia dice que quedo sin reemplazar');
    contiene(md, 'No es una', 'la constancia advierte que la anonimizacion no es garantia');
    contiene(md, 'Antes de mandar este archivo a un tercero, leelo',
        'y dice que hacer con esa advertencia');
}

{
    const md = armarDocumento({
        nombreArchivo: 'resolucion.pdf',
        cuerpo: 'texto',
        anonimizado: false,
        informe: { paginas: 1, lineas: 10, encabezados: 0, pies: 0, bordes: 0, codigos: 0 },
    });
    noContiene(md, 'Anonimizado', 'sin anonimizar, la constancia no habla de reemplazos');
    contiene(md, '1 página', 'pero si dice de donde salio');
}

console.log('RANGOS DE PAGINAS\n');

// --- REGRESION 4: las paginas inexistentes no se descartan calladas ---------
{
    const a = analizarRango('1, 5, 900', 10);
    ok(a.indices.join(',') === '0,4', 'extrae las paginas que si existen', `indices=${a.indices}`);
    ok(a.fuera.join(',') === '900',
        'REGRESION: la pagina que no existe queda registrada, no se descarta callada',
        `fuera=[${a.fuera}]`);
    contiene(describirProblemas(a, 10), '900', 'el aviso nombra la pagina que falta');
    contiene(describirProblemas(a, 10), 'tiene 10', 'y dice cuantas paginas hay');
}

{
    const a = analizarRango('4-7', 10);
    ok(a.indices.join(',') === '3,4,5,6', 'un rango se expande entero', `indices=${a.indices}`);
    ok(a.error === null, 'un rango valido no da error');
}

{
    const a = analizarRango('7-4', 10);
    ok(a.indices.join(',') === '3,4,5,6', 'un rango al reves se da vuelta');
    ok(a.invertidos.length === 1, 'y se avisa que estaba al reves');
    contiene(describirProblemas(a, 10), 'al revés', 'el aviso lo explica');
}

{
    const a = analizarRango('1, 3, 3, 2-3', 10);
    ok(a.indices.join(',') === '0,1,2', 'las paginas repetidas no se duplican ni desordenan');
}

{
    const a = analizarRango('', 10);
    ok(a.error !== null, 'un rango vacio da error en vez de no hacer nada');
    contiene(a.error, '1, 3, 4-7', 'y el error muestra el formato esperado');
}

{
    const a = analizarRango('hola, 0, 99', 10);
    ok(a.indices.length === 0 && a.error !== null, 'si no queda ninguna pagina, hay error');
    ok(a.ilegibles.join(',') === 'hola', 'lo que no es un numero se informa aparte');
    ok(a.fuera.join(',') === '0,99', 'la pagina 0 tampoco existe');
}

// --- Los errores de pdf-lib se traducen ------------------------------------
{
    const protegido = explicarError(
        Object.assign(new Error('Input document to `PDFDocument.load` is encrypted'),
            { name: 'EncryptedPDFError' }), 'demanda.pdf');
    contiene(protegido, 'contraseña', 'un PDF protegido se explica como tal');
    contiene(protegido, 'demanda.pdf', 'y se nombra el archivo, no "el archivo"');

    const roto = explicarError(new Error('Failed to parse PDF document'), 'escrito.pdf');
    contiene(roto, 'dañado', 'un PDF ilegible se explica como tal');
}

console.log('TEXTO VISIBLE');
console.log('');

// El repositorio exige espaniol rioplatense CON TILDES en todo el texto que
// ve el usuario; los comentarios de codigo pueden ir sin. Al escribir esta
// herramienta se paso por alto y la interfaz entera salio sin acentuar. Estas
// comprobaciones miran los mensajes que arma el motor, que son los que
// terminan en pantalla y adentro del .md.
{
    const d = diagnosticar([pagina(1, [''])]);
    for (const palabra of ['página', 'extraíble', 'volvé']) {
        contiene(d.motivo, palabra, `el rechazo por OCR esta acentuado: ${palabra}`);
    }
    for (const sinTilde of ['pagina', 'extraible', 'volve ']) {
        noContiene(d.motivo, sinTilde, `y no quedo la version sin tilde: ${sinTilde}`);
    }

    const a = analizarRango('', 10);
    contiene(a.error, 'Escribí qué páginas querés', 'el pedido de rango esta acentuado');

    const md = armarDocumento({
        nombreArchivo: 'x.pdf', cuerpo: 'texto', anonimizado: true,
        informe: { paginas: 3, lineas: 20, encabezados: 1, pies: 0, bordes: 0, codigos: 0 },
        conteo: { DNI: 1 }, pendientes: [], paginasVacias: [2],
    });
    for (const palabra of ['páginas', 'líneas', 'anonimización', 'automática', 'garantía']) {
        contiene(md.toLowerCase(), palabra, `la constancia esta acentuada: ${palabra}`);
    }
}

// ---------------------------------------------------------------------------

console.log('');
if (fallos === 0) {
    console.log(`OK  ${pruebas} comprobaciones, ninguna falla.\n`);
} else {
    console.log(`${fallos} FALLAS sobre ${pruebas} comprobaciones.\n`);
    process.exitCode = 1;
}
