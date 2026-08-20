// ---------------------------------------------------------------------------
// Armado del archivo .md final y de su constancia.
//
// EXISTE POR UNA FUGA. La herramienta anterior armaba el Markdown como
// `"# " + archivo.name` y recien despues pasaba el anonimizador. Como el
// anonimizador corria sobre el texto ya armado, el nombre del archivo entraba
// como una linea mas... salvo que los nombres de archivo del PJN son la
// caratula entera: "PEREZ JUAN CARLOS c GARCIA MARIA s DAÑOS.pdf". El titulo
// del documento anonimizado quedaba con los apellidos de las dos partes, en la
// primera linea, en negrita.
//
// O sea: la unica funcion que existia para no filtrar nombres, filtraba los dos
// nombres mas importantes del expediente, arriba de todo.
//
// La regla que sale de ahi: cuando se anonimiza, el nombre del archivo NO se
// escribe en ningun lado —ni en el titulo, ni en el nombre de la descarga—.
// No se lo intenta anonimizar: se lo descarta. Un nombre de archivo no aporta
// nada que el documento no tenga, y anonimizarlo seria confiar en que las
// reglas alcanzan justo donde ya se sabe que fallaron.
// ---------------------------------------------------------------------------

/** Titulo del documento. Nunca el nombre del archivo si se anonimizo. */
export function titulo(nombreArchivo, anonimizado) {
    if (anonimizado) return 'Documento';
    return nombreArchivo.replace(/\.pdf$/i, '');
}

/** Nombre con el que se descarga. Mismo criterio que el titulo. */
export function nombreDeDescarga(nombreArchivo, anonimizado) {
    if (anonimizado) return 'documento-anonimizado.md';
    const base = nombreArchivo.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]/g, '-');
    return (base || 'documento') + '.md';
}

/** Arma el .md completo: titulo, cuerpo y constancia.
 *
 * La constancia va al final del archivo y no es un adorno. Un .md anonimizado
 * que despues se pega en un LLM, se manda por mail o se archiva no tiene como
 * decir cuanto de el es original y cuanto se reemplazo. Sin constancia hay que
 * volver a abrir el PDF para saberlo. Con constancia, el archivo se explica
 * solo, y en particular dice QUE QUEDO SIN REVISAR, que es lo que importa
 * cuando alguien lo va a mandar afuera.
 */
export function armarDocumento({
    nombreArchivo,
    cuerpo,
    anonimizado = false,
    informe = null,
    conteo = null,
    pendientes = [],
    paginasVacias = [],
}) {
    const partes = [`# ${titulo(nombreArchivo, anonimizado)}`, '', cuerpo.trim(), ''];

    const constancia = [];

    if (informe) {
        const quitadas = informe.encabezados + informe.pies + informe.bordes + informe.codigos;
        constancia.push(
            `- Convertido desde PDF: ${informe.paginas} ` +
            `${informe.paginas === 1 ? 'página' : 'páginas'}, ${informe.lineas} líneas.`
        );
        if (quitadas > 0) {
            constancia.push(
                `- Se quitaron ${quitadas} líneas de encabezado, pie, numeración o ` +
                `códigos de sistema.`
            );
        }
    }

    if (paginasVacias.length > 0) {
        constancia.push(
            `- **Sin texto extraíble: ${paginasVacias.length === 1 ? 'la página' : 'las páginas'} ` +
            `${paginasVacias.join(', ')}.** Son escaneos sin OCR intercalados y salieron ` +
            `en blanco: lo que decían NO está en este archivo.`
        );
    }

    if (anonimizado) {
        const total = conteo ? Object.values(conteo).reduce((a, b) => a + b, 0) : 0;
        constancia.push(`- Anonimizado: ${total} reemplazos.`);
        if (conteo) {
            for (const [regla, veces] of Object.entries(conteo).sort((a, b) => b[1] - a[1])) {
                constancia.push(`  - ${regla}: ${veces}`);
            }
        }
        if (pendientes.length > 0) {
            constancia.push(
                `- **Quedaron ${pendientes.length} nombres propios sin reemplazar**, ` +
                `porque se decidió conservarlos: ` +
                pendientes.map((p) => `\`${p}\``).join(', ') + '.'
            );
        } else {
            constancia.push('- No quedaron nombres propios detectados sin reemplazar.');
        }
    }

    if (constancia.length > 0) {
        partes.push('---', '', '## Constancia de procesamiento', '', ...constancia, '');
        if (anonimizado) {
            partes.push(
                '> La anonimización es automática y la revisó quien la ejecutó. No es una',
                '> garantía: un nombre escrito de una forma que las reglas no contemplan puede',
                '> haber quedado. Antes de mandar este archivo a un tercero, leelo.',
                ''
            );
        }
    }

    return partes.join('\n');
}
