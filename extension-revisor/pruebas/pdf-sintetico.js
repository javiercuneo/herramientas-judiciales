// ---------------------------------------------------------------------------
// Un PDF de proveido INVENTADO, armado en el momento: ni un byte de un
// documento de una causa entra al repositorio, y tampoco un .pdf.
//
// Cada renglon de RENGLONES es una linea del PDF. Arranca como un proveido:
// "Poder Judicial de la Nación", el juzgado y el numero de expediente. Los errores sembrados estan
// en SEMBRADOS; todo lo demas es texto que el revisor NO tiene que marcar:
// la caratula (con un apellido inventado que fuera de ella se marcaria),
// apellidos sin tilde, siglas, abreviaturas, latinismos, verbos con pronombre,
// palabras cortadas a fin de renglon, una direccion web y ordinales.
// ---------------------------------------------------------------------------
(function (raiz) {
    'use strict';

    const RENGLONES = [
        'Poder Judicial de la Nación',
        'JUZGADO CIVIL 99',
        '4321/2025',
        'CANTERAL, FULANO c/ MENGANEZ S.A. s/ COBRO DE SUMAS DE DINERO',
        'Ciudad de Buenos Aires, 3 de marzo de 2026.',
        'AUTOS Y VISTOS: Atento lo peticionado a fs. 12/14 por la Dra. Rodriguez,',
        'y lo dispuesto por el art. 135 del CPCCN, corresponde proveer in fine.',
        'Resuevlo: I. Téngase presente. II. Notifíquese por cédula a la parte',
        'actora y córrase traslado a la demandada por el plazo de 5 días.',
        'III. Intímese al Sr. MENGANEZ y a la Sra. Gonzalez a que acompañen la',
        'documen-',
        'tasión original dentro del 2do día. IV. Hágasele saber que la presentasion',
        'de fs. 3/4 resulta extemporá-',
        'nea. V. Ofíciese al Banco de la Nación Argentina. El criterio teórico-',
        'práctico se informa en www.ejemplo-inventado.com.ar a sus efectos.',
        'VI. Agréguese y notifiquse electrónicamente. Regúlense los honorarios.',
    ];

    const SEMBRADOS = ['Resuevlo', 'documentasión', 'presentasion', 'notifiquse'];

    // Un escrito de un letrado, tambien inventado y con errores: no es un
    // proveido, y no se revisa. A un escrito ajeno no se le corrige nada.
    const RENGLONES_ESCRITO = [
        'SE PRESENTA. ACOMPAÑA DOCUMENTAL.',
        'Señor Juez:',
        'FULANO DE TAL, por derecho propio, en los autos del epígrafe, a V.S.',
        'digo: que vengo a acompañar la documentasion requerida y solicito',
        'se resuevla de conformidad. Proveer de conformidad, SERÁ JUSTICIA.',
    ];

    // Escapa un renglon para un string literal de PDF, en WinAnsi (latin1).
    function literal(s) {
        let out = '';
        for (const ch of s) {
            const c = ch.charCodeAt(0);
            if (ch === '(' || ch === ')' || ch === '\\') out += '\\' + ch;
            else if (c < 128) out += ch;
            else out += '\\' + c.toString(8).padStart(3, '0');
        }
        return out;
    }

    function armarPdf(renglones = RENGLONES) {
        let flujo = 'BT /F1 11 Tf 14 TL 56 780 Td\n';
        renglones.forEach((r, i) => { flujo += (i ? 'T* ' : '') + '(' + literal(r) + ') Tj\n'; });
        flujo += 'ET';
        // El renglon con la direccion web lleva un enlace, como los del sistema.
        const conEnlace = renglones.findIndex((r) => r.includes('www.'));
        const y = 780 - 14 * conEnlace;
        const objetos = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R'
                + (conEnlace >= 0 ? ' /Annots [6 0 R]' : '') + ' >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            '<< /Length ' + flujo.length + ' >>\nstream\n' + flujo + '\nendstream',
        ];
        if (conEnlace >= 0) {
            objetos.push('<< /Type /Annot /Subtype /Link /Rect [56 ' + (y - 3) + ' 420 ' + (y + 11) + '] /Border [0 0 0]'
                + ' /A << /S /URI /URI (https://www.ejemplo-inventado.com.ar/) >> >>');
        }
        let pdf = '%PDF-1.4\n';
        const offsets = [];
        objetos.forEach((o, i) => { offsets.push(pdf.length); pdf += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
        const xref = pdf.length;
        pdf += 'xref\n0 ' + (objetos.length + 1) + '\n0000000000 65535 f \n';
        for (const off of offsets) pdf += String(off).padStart(10, '0') + ' 00000 n \n';
        pdf += 'trailer\n<< /Size ' + (objetos.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
        const bytes = new Uint8Array(pdf.length);
        for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
        return bytes;
    }

    raiz.PdfSintetico = { RENGLONES, SEMBRADOS, RENGLONES_ESCRITO, armarPdf };
})(globalThis);
