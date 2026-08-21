// ---------------------------------------------------------------------------
// Lectura del PDF y diagnostico de si se puede trabajar.
//
// LA REGLA QUE JUSTIFICA ESTE ARCHIVO: un PDF que es una imagen pura no tiene
// texto que extraer, y ninguna cantidad de heuristica lo va a arreglar. La
// herramienta anterior lo procesaba igual y devolvia un Markdown con el titulo
// y nada abajo, con el boton de descarga habilitado. El usuario se llevaba un
// archivo vacio sin que nada le avisara. Eso es lo que hay que no hacer.
//
// Aca se rechaza, se dice por que, y se dice que hacer: pasarlo por OCR y
// volver. No se intenta hacer OCR: seria traer tesseract.js —varios megas de
// modelo— para resolverle a la herramienta un problema que el usuario resuelve
// mejor con Acrobat o con el escaner de la oficina, que ya tienen OCR.
// ---------------------------------------------------------------------------

// Un PDF con texto nativo da entre 1.000 y 3.000 caracteres por pagina. Uno
// escaneado sin OCR da cerca de cero. El umbral tiene un margen de 10x: no se
// va a equivocar, y ante la duda conviene que rechace.
//
// El valor viene de otra herramienta propia, anterior a esta, donde lleva
// tiempo corriendo sobre documentos reales sin un falso rechazo.
export const MINIMO_POR_PAGINA = 100;

/** Lee el PDF entero. Devuelve las paginas con la geometria de cada fragmento.
 *
 * `alAvanzar(hechas, total)` se llama despues de cada pagina. No es adorno: un
 * expediente de 400 fojas tarda medio minuto largo, y sin esto la pantalla se
 * queda quieta y parece colgada. La version anterior ponia "Procesando..." en
 * el boton y no lo tocaba mas hasta el final.
 */
export async function extraerPaginas(pdfjs, datos, alAvanzar) {
    const pdf = await pdfjs.getDocument({ data: datos }).promise;
    const paginas = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const pagina = await pdf.getPage(i);
        const contenido = await pagina.getTextContent();
        paginas.push({
            numero: i,
            fragmentos: contenido.items,
            ancho: pagina.view[2],
            alto: pagina.view[3],
        });
        if (alAvanzar) alAvanzar(i, pdf.numPages);
    }

    return paginas;
}

/** Cuenta cuanto texto trajo cada pagina. Puro: se puede probar sin un PDF. */
export function medir(paginas) {
    return paginas.map((p) => ({
        numero: p.numero,
        caracteres: p.fragmentos.reduce((n, f) => n + (f.str || '').trim().length, 0),
    }));
}

/** Decide si el documento se puede trabajar.
 *
 * Devuelve `{ sirve, motivo, caracteres, porPagina, vacias }`.
 *
 * Distingue dos casos que no son el mismo, y el segundo es el que hace dano
 * callado:
 *
 *   - El PDF entero es un escaneo. Se rechaza: no hay nada que hacer con el.
 *   - El PDF tiene texto pero ALGUNAS fojas son escaneos intercalados, que es
 *     la forma normal de un expediente digitalizado por partes. El promedio
 *     pasa el umbral y el documento se procesa, pero esas fojas salen en blanco
 *     y en el Markdown no queda ni el hueco. Se avisa con el numero de cada
 *     una, porque es la unica manera de que alguien lo note.
 */
export function diagnosticar(paginas) {
    const porPagina = medir(paginas);
    const total = porPagina.reduce((n, p) => n + p.caracteres, 0);
    const cantidad = Math.max(porPagina.length, 1);
    const promedio = Math.round(total / cantidad);
    const vacias = porPagina.filter((p) => p.caracteres < MINIMO_POR_PAGINA).map((p) => p.numero);

    if (promedio < MINIMO_POR_PAGINA) {
        return {
            sirve: false,
            caracteres: total,
            porPagina,
            vacias,
            motivo:
                `El PDF no tiene texto extraíble: ${total} caracteres en ` +
                `${cantidad} ${cantidad === 1 ? 'página' : 'páginas'} ` +
                `(${promedio} por página, y hacen falta ${MINIMO_POR_PAGINA}). ` +
                `Casi seguro es un escaneo sin OCR, o sea una imagen del documento ` +
                `y no el documento. Pasalo por OCR y volvé a intentar.`,
        };
    }

    return { sirve: true, motivo: null, caracteres: total, porPagina, vacias };
}
