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
El testigo ARIAS ANALIA GABRIELA percibio la suma de 1.500.000 pesos.
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

// ---------------------------------------------------------------------------
// REGRESION 7, 8 y 9: las tres fugas dun documento largo.
//
// El 21/8/2026 paso por la herramienta un exhorto de muchas paginas —el primer
// documento real largo, hasta entonces lo mas largo eran 5 fojas sinteticas—.
// El .md resultante se reviso linea por linea contra el PDF. Las tres cosas
// que estan abajo salieron de esa revision, con las cadenas exactas.
// ---------------------------------------------------------------------------

// --- REGRESION 7: la constancia no puede nombrar a nadie -------------------
{
    // El .md anonimizado terminaba con la lista de los nombres reemplazados,
    // uno por linea y con la cantidad de apariciones al lado, porque la clave
    // del conteo era `elegido: ${nombre}` y la constancia imprime las claves.
    // El archivo anonimizado traia abajo el diccionario para deshacerlo.
    const { texto, conteo } = anonimizar(
        'Comparecio Ernesto Quiroga, y por la actora Marina Otero.',
        [
            { texto: 'Ernesto Quiroga', reemplazo: '[TESTIGO]' },
            { texto: 'Marina Otero', reemplazo: '[LETRADO]' },
        ]
    );
    const md = armarDocumento({
        nombreArchivo: 'exhorto.pdf',
        cuerpo: texto,
        anonimizado: true,
        conteo,
        pendientes: [],
    });

    for (const nombre of ['Ernesto', 'Quiroga', 'Marina', 'Otero']) {
        noContiene(md, nombre,
            `REGRESION: la constancia no nombra al que se reemplazo: ${nombre}`);
    }
    contiene(md, '[TESTIGO]', 'el cuerpo si lleva la etiqueta');
    contiene(md, 'nombre propio → [TESTIGO]: 1', 'y la constancia cuenta por etiqueta');
    contiene(md, 'nombre propio → [LETRADO]: 1', 'una linea por etiqueta usada');

    // Dos nombres con la misma etiqueta suman en la misma linea, que es lo que
    // hace que la constancia no permita contar cuantos nombres distintos hubo.
    const dos = anonimizar('Perez y Gomez declararon.', [
        { texto: 'Perez', reemplazo: '[TESTIGO]' },
        { texto: 'Gomez', reemplazo: '[TESTIGO]' },
    ]);
    ok(dos.conteo['nombre propio → [TESTIGO]'] === 2,
        'dos nombres con la misma etiqueta se suman en una sola clave',
        JSON.stringify(dos.conteo));
}

// --- REGRESION 8: el DNI sin puntos -----------------------------------------
{
    // Un informe del un formulario oficial escribe el documento sin
    // puntos. La unica regla que habia exigia el formato "30.119.078", asi que
    // cinco documentos salieron enteros y rotulados con la palabra "DNI".
    const casos = [
        ['DNI: 5432109', 'DNI: [DNI]'],
        ['Tipo y N° de documento: DNI 18234567', 'documento: DNI [DNI]'],
        ['el testigo declaro (DNI 24987654)', '(DNI [DNI])'],
        ['D.N.I. N° 11223344', 'D.N.I. N° [DNI]'],
        ['DNI 12.345.678', 'DNI [DNI]'],
        ['L.C. 4567890', 'L.C. [DNI]'],
    ];
    for (const [entrada, esperado] of casos) {
        const { texto } = anonimizar(entrada);
        contiene(texto, esperado, `REGRESION: el DNI sin puntos se reemplaza: ${entrada}`);
    }

    // Y no puede tocar un numero que no sea un documento. Sin la palabra que lo
    // ancla no hay regla, justamente porque siete digitos pelados no tienen
    // forma propia.
    const { texto } = anonimizar(
        'la suma de 1500000 pesos, el expediente 48210/2023 y el codigo 9012345678'
    );
    contiene(texto, '1500000 pesos', 'un monto sin puntos no se confunde con un DNI');
    contiene(texto, '9012345678', 'un numero suelto tampoco');
}

// --- REGRESION 9: el nombre de dos palabras --------------------------------
{
    // Los cuatro patrones de candidatos exigian tres palabras o una coma. El
    // testigo del exhorto —diez apariciones en claro— no se ofrecio NUNCA para
    // tildar, y "Nombre Apellido" es la forma mas frecuente que hay: el nombre
    // completo aparece una vez y este aparece en cada foja.
    const dosPalabras = candidatosANombre(
        'el testigo Ernesto Quiroga y el CP Pablo Miranda'
    ).map((c) => c.texto);
    ok(dosPalabras.includes('Ernesto Quiroga'),
        'REGRESION: un nombre de dos palabras se ofrece como candidato',
        `candidatos: ${dosPalabras.join(' | ')}`);
    ok(dosPalabras.includes('Pablo Miranda'),
        'REGRESION: y el segundo tambien',
        `candidatos: ${dosPalabras.join(' | ')}`);

    const mayusculas = candidatosANombre('SR :ERNESTO QUIROGA').map((c) => c.texto);
    ok(mayusculas.includes('ERNESTO QUIROGA'),
        'REGRESION: dos palabras en mayusculas tambien',
        `candidatos: ${mayusculas.join(' | ')}`);
}

// --- El ruido que traen las dos reglas de dos palabras ---------------------
{
    // La regla de dos palabras es la mas ruidosa de las seis, y entro junto con
    // la ampliacion de NO_SON_PERSONAS. Sin eso, un expediente con facturas y
    // fichas de formulario oficial propone encabezados de tabla tantas veces como nombres,
    // y una lista que no se puede leer se tilda entera: asi se corrompieron 27
    // lugares del texto en la prueba que motivo el cambio.
    const ruido = candidatosANombre(`
        Razon Social: Domicilio Comercial: Ingresos Brutos:
        Codigo Producto Servicio Cantidad Medida Precio Unit
        Periodo Facturado Desde Responsable Inscripto Fecha
        Apellidos: Nombres: Fecha Nac: Nacionalidad: Provincia:
        PULGAR INDICE MEDIO ANULAR MENIQUE
        NUEVE MILLONES DOSCIENTOS OCHENTA MIL
        Habeas Corpus Buenos Aires Capital Federal Primera Instancia
    `).map((c) => c.texto);
    ok(ruido.length === 0, 'los encabezados de tabla y de ficha no se ofrecen como nombres',
        `candidatos: ${ruido.join(' | ')}`);
}

// --- Recorte: el verbo de adelante no se lleva puesto el nombre -------------
{
    // Un patron se queda con el primer calce y no vuelve atras: el de tres
    // palabras engancha "Comparecio Hector Ernesto", y como "comparecio" es un
    // verbo el candidato se descartaba entero. El nombre que estaba al lado no
    // se ofrecia nunca, y no por no detectarse.
    const c = candidatosANombre('Comparecio Hector Ernesto Quiroga y ratifico.')
        .map((x) => x.texto);
    ok(c.includes('Hector Ernesto') || c.includes('Hector Ernesto Quiroga'),
        'el verbo de adelante se recorta y el nombre queda',
        `candidatos: ${c.join(' | ')}`);
    ok(!c.some((x) => /Comparecio/.test(x)), 'y el verbo no queda dentro de ningun candidato',
        `candidatos: ${c.join(' | ')}`);
}

// ---------------------------------------------------------------------------
// REGRESION 10: los formularios "Etiqueta: valor".
//
// El motor estaba escrito para prosa, y lo mas sensible del expediente de 225
// fojas no era prosa: era la ficha del un formulario oficial que
// venia adjunta al exhorto. Apellido, nombre, fecha de nacimiento, domicilio
// completo y numero de tramite, cada uno detras de su etiqueta. De todo eso el
// motor anonimizaba el telefono.
// ---------------------------------------------------------------------------
{
    const FICHA = [
        'DNI: 5432109',
        'Clase: 1958 MASCULINO',
        'Fecha Nac: 14/03/1958',
        'Domicilio: Calle :MITRE 850 ,MORON,BUENOS AIRES (Teléfono:4371-1696)',
        'Datos del Trámite: Idtrámite :123456789 Ejemplar (B) Toma: 23/06/2015',
        'Apellidos: QUIROGA',
        'Nombres: Hector Ernesto',
    ].join('\n');

    const { texto } = anonimizar(FICHA);

    for (const dato of ['5432109', '1958', '14/03/1958', 'MITRE', 'MORON',
                        '123456789', 'QUIROGA', 'Hector Ernesto']) {
        noContiene(texto, dato, `REGRESION: la ficha de un formulario oficial no filtra ${dato}`);
    }
    // Las etiquetas se conservan: un renglon que dice "[PERSONA]" a secas no se
    // entiende, y la constancia tiene que poder auditarse contra el original.
    for (const etiqueta of ['DNI:', 'Clase:', 'Fecha Nac:', 'Domicilio:', 'Apellidos:', 'Nombres:']) {
        contiene(texto, etiqueta, `y conserva la etiqueta ${etiqueta}`);
    }

    const otros = anonimizar([
        'Apellido y nombre: PEREZ, Juan',
        'Apoderado: SUAREZ LEANDRO',
        'Matrícula N°: 2408',
        'Matricula: LºXXV Fº 180',
        'Matrícula N°: XLII, FOLIO 316',
    ].join('\n')).texto;
    for (const dato of ['PEREZ', 'Juan', 'SUAREZ', '2408', 'XXX', 'FOLIO 316']) {
        noContiene(otros, dato, `REGRESION: el campo de formulario no filtra ${dato}`);
    }
}

// --- Los dos puntos son la guarda, y el valor tiene que parecer un valor ----
{
    // Sin las dos guardas, estas tres se corrompen. Son las que permiten que la
    // regla se coma el renglon entero sin miedo: en prosa no hay dos puntos.
    const { texto } = anonimizar([
        'Nombres: los que surgen del poder acompañado',
        'Domicilio: Se tiene presente el denunciado',
        'matrícula inscripta al T 45 F 210 del CPACF',
    ].join('\n'));
    contiene(texto, 'los que surgen del poder', 'un valor en minuscula no es un nombre');
    contiene(texto, 'Se tiene presente el denunciado', 'y un domicilio sin altura no es un domicilio');
    contiene(texto, 'del CPACF', 'la matricula en prosa la toma la regla de tomo y folio, sin comerse el resto');
    contiene(texto, '[MATRICULA] del CPACF', 'y la toma entera');
}

// --- REGRESION 11: la matricula, en las formas que se filtraron -------------
{
    for (const [entrada, esperado] of [
        ['Dr. Juan Perez (T: 62 F: 415)', '([MATRICULA])'],
        ['la Dra. Ana Gomez (T: 118 F: 902)', '([MATRICULA])'],
        ['abogado T°22 FO371', 'abogado [MATRICULA]'],
        ['inscripto al Tomo 45, Folio 210', 'al [MATRICULA]'],
        ['To 45 Fo 122', '[MATRICULA]'],
    ]) {
        contiene(anonimizar(entrada).texto, esperado,
            `REGRESION: la matricula se reemplaza: ${entrada}`);
    }
}

// --- REGRESION 12: el domicilio sin piso, y el que cortaba la palabra -------
{
    for (const [entrada, esperado] of [
        ['con domicilio en Av. San Juan 640 CABA', 'en [DOMICILIO] CABA'],
        ['con domicilio en Rivera 3120 CABA', 'en [DOMICILIO] CABA'],
        ['domicilio legal constituido en Sarmiento 940, Entre Piso "A"', 'en [DOMICILIO]'],
        ['DOMICILIO: AVENIDA CORRIENTES 1580. PISO 2 CABA.', 'DOMICILIO: [DOMICILIO]'],
        ['domicilio procesal en Av. Corrientes 1580 2do piso de la Ciudad',
         'en [DOMICILIO] de la Ciudad'],
        // La que cortaba la palabra al medio: salia "[DOMICILIO]amento 2".
        ['con domicilio en Montevideo 1740 PB departamento 2 CABA', 'en [DOMICILIO] CABA'],
    ]) {
        contiene(anonimizar(entrada).texto, esperado,
            `REGRESION: el domicilio se reemplaza entero: ${entrada}`);
    }
    noContiene(anonimizar('con domicilio en Montevideo 1740 PB departamento 2 CABA').texto,
        'amento', 'REGRESION: el bloque de piso no corta la palabra al medio');

    // La palabra que ancla es lo que la hace segura. Sin ella la regla diria
    // "cualquier palabra capitalizada seguida de un numero".
    const { texto } = anonimizar('Se libro el expediente 48210 conforme el art. 431 y la Sala 3.');
    contiene(texto, 'expediente 48210', 'un expediente no se confunde con un domicilio');
    contiene(texto, 'art. 431', 'ni un articulo');
    contiene(texto, 'Sala 3', 'ni una sala');
}

// --- REGRESION 13: el tratamiento con dos puntos y en mayusculas ------------
{
    // Una cedula del PJN encabeza "SR :ERNESTO QUIROGA": el tratamiento en
    // mayusculas y un separador que el patron no contemplaba.
    contiene(anonimizar('SR :ERNESTO QUIROGA').texto, 'SR [PERSONA]',
        'REGRESION: el tratamiento en mayusculas y con dos puntos actua');
    contiene(anonimizar('El testigo declaro ante el perito Juan Carlos Perez.').texto,
        'perito [PERSONA]', 'y el tratamiento en minuscula, en medio de la prosa, tambien');

    // Las dos guardas de esa regla, que con la bandera `i` son lo unico que
    // separa un nombre de una frase.
    contiene(anonimizar('Sres. Los Abogados presentes').texto, 'Los Abogados',
        'una palabra del oficio detras del tratamiento no es un nombre');
    contiene(anonimizar('INGENIERO JUAN CARLOS PEREZ informa').texto, 'INGENIERO',
        'el "Ing" de "INGENIERO" no es un tratamiento: la palabra tiene que terminar ahi');
}

// --- Un fragmento de otro candidato no se ofrece dos veces ------------------
{
    const c = candidatosANombre('Vease Llambias, Jorge Joaquin, Tratado, Astrea.')
        .map((x) => x.texto);
    ok(!c.includes('Jorge Joaquin'),
        'el pedazo de un candidato mas largo no se ofrece aparte',
        `candidatos: ${c.join(' | ')}`);
    ok(c.includes('Llambias, Jorge Joaquin'), 'y el largo si',
        `candidatos: ${c.join(' | ')}`);

    // Pero si el corto ademas aparece suelto, hay que ofrecerlo: el reemplazo
    // del largo no lo va a alcanzar.
    const suelto = candidatosANombre(
        'Hector Ernesto Quiroga declaro. Ernesto Quiroga se retiro. Ernesto Quiroga volvio.'
    ).map((x) => x.texto);
    ok(suelto.includes('Ernesto Quiroga'),
        'el corto que ademas aparece por su cuenta si se ofrece',
        `candidatos: ${suelto.join(' | ')}`);
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
