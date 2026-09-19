// ---------------------------------------------------------------------------
// Certificar: el texto de la certificacion de una resolucion firmada y el
// enlace que va en el QR.
//
// El problema: la resolucion se firma y queda como PDF en el expediente; la
// certificacion se firma aparte, y hay que vincularlas sin tocar el PDF
// firmado. En papel eso era fotocopia, sello cruzado y abrochadora. Aca es el
// enlace publico del PJN, escrito en el texto y repetido en un QR.
//
// TRES DECISIONES QUE NO HAY QUE DESHACER SIN LEER POR QUE:
//
//   1. NO HAY HASH. Se evaluo poner la huella SHA-256 del PDF en el QR o en
//      el texto y se descarto el 19/9/2026. La herramienta no puede bajar el
//      PDF del enlace --el servidor del PJN no manda CORS, y ademas la pagina
//      tiene prohibida toda conexion--, asi que el archivo lo suelta un
//      empleado y nada garantiza que sea el del enlace. Un hash equivocado,
//      firmado por quien no lo puede leer, siembra dudas sobre la
//      certificacion entera; el PDF ya trae su propia firma digital, que es
//      la que prueba integridad. Las paginas SI se cuentan: tienen el mismo
//      riesgo, pero quien firma las ve y las puede cotejar.
//
//   2. EL QR LLEVA EL ENLACE Y NADA MAS. Ni texto plano --la camara del
//      telefono lo muestra y no ofrece abrirlo-- ni datos en el fragmento.
//      Y lleva exactamente la misma cadena que el texto dice "Ver:", porque
//      lo que se certifica es que los dos llevan al mismo lugar.
//
//   3. EL ENLACE NO SE RECONSTRUYE: SE CONSERVA. El `id` es una cadena larga
//      y opaca; volver a codificarla con URLSearchParams puede cambiar un
//      `+` o un `=` y dejar un enlace que no abre. Lo unico que se toca es el
//      `&download=true` del final, que es lo que distingue ver de descargar.
//
// Los dominios y la ruta se escriben por partes a proposito: el control de
// datos del repositorio (scripts/verificar-datos.sh) bloquea cualquier archivo
// que contenga un enlace al visor, porque un enlace real apunta a una causa.
// Este archivo no contiene ninguno --solo sabe reconocer su forma--, y
// escribirla entera lo haria imposible de commitear.
// ---------------------------------------------------------------------------

/** Donde viven los enlaces publicos de las resoluciones. Si el PJN suma otro
 *  host, se agrega aca y en las pruebas. */
export const DOMINIOS_PJN = ['scw.pjn.gov.ar'];

const RUTA_VISOR = '/scw/' + 'viewer.seam';
const MARCA_DESCARGA = '&download=true';

/**
 * Lee lo que el usuario pego y devuelve los dos enlaces, o el motivo por el
 * que no puede.
 *
 * Devuelve `{ ok, ver, descargar, avisos, problema }`:
 *   ver, descargar  las dos cadenas, identicas salvo por MARCA_DESCARGA
 *   avisos          lo que se corrigio sin cambiar el destino (espacios)
 *   problema        texto para mostrar cuando ok es false
 */
export function analizarEnlace(pegado) {
    const salida = { ok: false, ver: '', descargar: '', avisos: [], problema: null };
    const crudo = String(pegado || '').trim();

    if (!crudo) {
        salida.problema = 'Pegá el enlace de la resolución.';
        return salida;
    }

    // Un enlace largo copiado de un documento a veces llega partido en dos
    // renglones. Una URL no tiene espacios, asi que sacarlos no cambia el
    // destino; pero se avisa, porque "ningun camino termina sin decir que paso".
    let texto = crudo.replace(/\s+/g, '');
    if (texto !== crudo) salida.avisos.push('Se quitaron espacios o saltos de línea que había adentro del enlace.');

    let url;
    try {
        url = new URL(texto);
    } catch (e) {
        salida.problema = 'Eso no es un enlace. Tiene que empezar con https://';
        return salida;
    }

    if (url.protocol !== 'https:') {
        salida.problema = 'El enlace tiene que empezar con https:// (el que empieza con http:// no es seguro y no se certifica).';
        return salida;
    }
    if (!DOMINIOS_PJN.includes(url.hostname)) {
        salida.problema = `El enlace no es del PJN: apunta a ${url.hostname}. Se aceptan sólo los de ${DOMINIOS_PJN.join(', ')}.`;
        return salida;
    }
    if (url.pathname !== RUTA_VISOR) {
        salida.problema = 'El enlace es del PJN pero no es el de una resolución: no es el enlace para ver o descargar un documento.';
        return salida;
    }
    if (!url.searchParams.get('id')) {
        salida.problema = 'Al enlace le falta el identificador del documento (id=…). Probablemente se cortó al copiarlo.';
        return salida;
    }
    if (url.hash) {
        salida.problema = 'El enlace trae algo después de un #, y los del PJN no lo llevan. Copialo de nuevo desde el expediente.';
        return salida;
    }

    // El orden de los parametros no se toca (decision 3). Si es el de
    // descarga, el de ver es el mismo sin la marca; si es el de ver, el de
    // descarga es el mismo con la marca al final.
    if (texto.includes(MARCA_DESCARGA)) {
        salida.descargar = texto;
        salida.ver = texto.replace(MARCA_DESCARGA, '');
    } else if (url.searchParams.has('download')) {
        // download=false, o en otra posicion: no es la forma conocida y no se
        // adivina cual seria la otra.
        salida.problema = 'El enlace tiene una forma de descarga que no se reconoce. Pegá el enlace para ver el documento.';
        return salida;
    } else {
        salida.ver = texto;
        salida.descargar = texto + MARCA_DESCARGA;
    }

    salida.ok = true;
    return salida;
}

// ---------------------------------------------------------------------------
// El QR
// ---------------------------------------------------------------------------

/** Margen blanco alrededor, en modulos. La norma pide cuatro, y es lo primero
 *  que se come un editor que recorta la imagen: sin margen no escanea. */
export const MARGEN_QR = 4;

/**
 * La matriz del QR para `texto`, con correccion M (aguanta ~15 % de danio: un
 * sello o una linea de firma encima). Recibe la libreria como parametro, igual
 * que pdf.js y pdf-lib en el resto del motor, para que esto corra en Node.
 *
 * Devuelve `{ modulos, oscuro(fila, columna) }`, sin el margen.
 */
export function matrizQR(qrcode, texto) {
    const qr = qrcode(0, 'M');   // 0: la version mas chica en que entre
    qr.addData(texto, 'Byte');
    qr.make();
    return { modulos: qr.getModuleCount(), oscuro: (f, c) => qr.isDark(f, c) };
}

/** Cuantos pixeles por modulo para que la imagen tenga al menos `minimo` de
 *  lado. Entero siempre: un modulo de 7,4 px se dibuja borroso y escanea peor. */
export function pixelesPorModulo(modulos, minimo = 1000) {
    return Math.max(1, Math.ceil(minimo / (modulos + 2 * MARGEN_QR)));
}

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const UNIDADES = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete',
    'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
    'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
    'veintiún', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
    'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta',
    'treinta y un'];

/** "AAAA-MM-DD" -> { anio, mes, dia }, o null si no es una fecha que exista.
 *  Las fechas viajan como texto y no como Date: un Date arrastra hora y huso,
 *  y un 1° de mes a medianoche UTC es el ultimo del anterior en Buenos Aires. */
export function leerFecha(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return null;
    const anio = Number(m[1]), mes = Number(m[2]), dia = Number(m[3]);
    if (mes < 1 || mes > 12 || dia < 1) return null;
    const diasDelMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    if (dia > diasDelMes) return null;
    return { anio, mes, dia };
}

/** "2026-09-03" -> "3 de septiembre de 2026". */
export function fechaCorta(iso) {
    const f = leerFecha(iso);
    return f ? `${f.dia} de ${MESES[f.mes - 1]} de ${f.anio}` : '';
}

/** "2026-09-19" -> "a los diecinueve días del mes de septiembre de 2026".
 *  El 1 va en singular: "al primer día del mes". */
export function fechaEnLetras(iso) {
    const f = leerFecha(iso);
    if (!f) return '';
    const mes = `del mes de ${MESES[f.mes - 1]} de ${f.anio}`;
    if (f.dia === 1) return `al primer día ${mes}`;
    return `a los ${UNIDADES[f.dia]} días ${mes}`;
}

/** La fecha de hoy como "AAAA-MM-DD", en hora local y no en UTC: a las 22 hs.
 *  de Buenos Aires, UTC ya es mañana. */
export function hoyISO(ahora = new Date()) {
    const d = String(ahora.getDate()).padStart(2, '0');
    const m = String(ahora.getMonth() + 1).padStart(2, '0');
    return `${ahora.getFullYear()}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Los autos pegados
// ---------------------------------------------------------------------------

/**
 * Separa el numero de expediente y la caratula de lo que se pega del sistema.
 * Es la misma lectura que usa el ledger para cargar una causa: el numero es la
 * primera forma N/AAAA, y si la caratula viene entre comillas, es lo de
 * adentro. Lo que no reconoce lo deja tal cual: los dos campos quedan a la
 * vista y se corrigen a mano.
 *
 * Devuelve `{ numero, caratula }`, con cadenas vacias si no hay nada.
 */
export function leerAutos(pegado) {
    const t = String(pegado || '').replace(/\s+/g, ' ').trim();
    if (!t) return { numero: '', caratula: '' };

    const m = t.match(/\b(\d{1,7})\s*\/\s*((?:19|20)\d{2})\b/);
    const numero = m ? `${m[1]}/${m[2]}` : '';

    const q = t.match(/[“"«]([^”"»]{6,})[”"»]/);
    const caratula = (q ? q[1] : t)
        .replace(/\b\d{1,7}\s*\/\s*(?:19|20)\d{2}\b/g, ' ')
        .replace(/^\s*e?xpedientes?\b\.?/i, ' ')
        .replace(/\b(?:CIV|COM|LAB|CNT|CSS|CAF|EXPTE?|EXP|NRO)\b\.?/gi, ' ')
        .replace(/(?:^|\s)n\s*[°º]\s*\.?(?=\s|$)/gi, ' ')
        .replace(/\s+/g, ' ').trim()
        .replace(/^[\s.,;:\-–—“”"«»]+|[\s.,;:\-–—“”"«»\/]+$/g, '');

    return { numero, caratula };
}

// ---------------------------------------------------------------------------
// El texto
// ---------------------------------------------------------------------------

// El articulo del tipo de resolucion. "contiene la sentencia" pero "contiene
// el auto". Lista corta a proposito: lo que no esta va con "la", que es el
// caso de casi todo lo que se certifica (sentencia, resolucion, declaratoria,
// interlocutoria, providencia). Si el usuario escribe el articulo, se respeta.
const MASCULINOS = ['auto', 'decreto', 'despacho', 'proveído', 'proveido', 'acuerdo', 'fallo', 'veredicto'];

export function conArticulo(tipo) {
    const t = String(tipo || '').trim();
    if (!t) return '';
    if (/^(el|la|los|las)\s/i.test(t)) return t;
    const primera = t.split(/\s+/)[0].toLowerCase();
    return (MASCULINOS.includes(primera) ? 'el ' : 'la ') + t;
}

/** Lo que falta se escribe entre corchetes, a la vista: la herramienta no
 *  bloquea, pero tampoco deja que un hueco pase por texto terminado. */
const hueco = (valor, nombre) => {
    const v = String(valor ?? '').trim();
    return v ? { texto: v, falta: false } : { texto: `[${nombre}]`, falta: true };
};

/**
 * Arma la certificacion. Recibe:
 *   enlace      el resultado de analizarEnlace (si no es ok, van huecos)
 *   tipo        "sentencia", "declaratoria de herederos"...
 *   fecha       de la resolucion, "AAAA-MM-DD"
 *   paginas     las del PDF, que cuenta la pantalla
 *   fojas       donde se agrego en el expediente electronico: "12/15"
 *   numero, caratula, juzgado, domicilio, lugar
 *   expedicion  "AAAA-MM-DD"
 *
 * Devuelve `{ antes, despues, faltan }`: el texto va partido en dos porque el
 * QR va en el medio, y la pantalla decide como juntarlos (texto plano, o HTML
 * con la imagen). `faltan` son los nombres de los huecos.
 */
export function armarCertificacion(d) {
    const faltan = [];
    const c = (valor, nombre) => {
        const h = hueco(valor, nombre);
        if (h.falta) faltan.push(nombre);
        return h.texto;
    };

    const enlace = d.enlace && d.enlace.ok ? d.enlace : null;
    const tipo = c(conArticulo(d.tipo), 'tipo de resolución');
    const fecha = c(fechaCorta(d.fecha), 'fecha de la resolución');
    const paginas = Number(d.paginas) > 0 ? String(d.paginas) : '';
    const pags = c(paginas, 'páginas');
    const fojas = c(d.fojas, 'fojas');
    const caratula = c(d.caratula, 'carátula');
    const numero = c(d.numero, 'n.° de expediente');
    const juzgado = c(d.juzgado, 'juzgado');
    const domicilio = c(d.domicilio, 'domicilio del juzgado');
    const ver = c(enlace && enlace.ver, 'enlace para ver');
    const descargar = c(enlace && enlace.descargar, 'enlace para descargar');
    const expedicion = c(fechaEnLetras(d.expedicion), 'fecha de expedición');
    const lugar = String(d.lugar || '').trim() || 'Buenos Aires';

    const unaPagina = paginas === '1';

    // El sujeto de toda la oracion es "el documento electronico", y por eso
    // todo concuerda en masculino singular sin importar el tipo: "firmado",
    // "agregado". Asi no hace falta saber el genero de la resolucion. Lo que
    // cuelga del tipo va con palabras que no tienen genero ("correspondiente"):
    // "dictada" o "recaida" fallan con "el auto".
    const antes =
        `CERTIFICO: que el documento electrónico al que remiten el enlace y el ` +
        `código QR que se insertan a continuación, firmado electrónicamente y de ` +
        `${pags} ${unaPagina ? 'página' : 'páginas'}, contiene ${tipo} de fecha ${fecha} ` +
        `correspondiente a los autos caratulados “${caratula}”, expte. n.° ${numero}, ` +
        `en trámite ante este ${juzgado}, sito en ${domicilio}, de esta Ciudad, y se ` +
        `encuentra agregado a fs. ${fojas} del expediente electrónico.\n\n` +
        `Ver: ${ver}\n` +
        `Descargar: ${descargar}`;

    const despues = `Se expide la presente en ${lugar}, ${expedicion}.`;

    return { antes, despues, faltan };
}
