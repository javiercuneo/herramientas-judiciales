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

import { apareceEnElTexto } from './anonimizar.js';

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

/** Los pendientes que siguen en el texto, comprobado contra el texto.
 *
 * ENCONTRADA EL 17/9/2026 verificando el arreglo de E-01, y es una fuga en la
 * direccion contraria y peor. La pantalla arma la lista de pendientes con los
 * candidatos que el usuario no tildo, y esa lista se calcula sobre el texto
 * ORIGINAL. Pero entre medio corren las reglas deterministicas: un nombre que
 * se ofrecio sin tildar y que despues tapo la regla de firma —"Firmado por:
 * LOPEZ MARIA"— salia reemplazado en el cuerpo Y NOMBRADO EN LA CONSTANCIA,
 * que ademas afirma que "siguen en el texto".
 *
 * O sea: el archivo anonimizado publicaba al pie el nombre de quien firmo la
 * resolucion, que es justo lo que el cuerpo habia ocultado. Es el mismo modo de
 * falla que este archivo existe para evitar —ver el comentario de arriba— y el
 * mismo que persigue la REGRESION 7.
 *
 * La comparacion la hace el motor (`apareceEnElTexto`) y no un `includes`, a
 * proposito: tiene que ser la MISMA con la que el motor reemplaza —tolerante al
 * espaciado del PDF y con el borde de palabra que ve las tildes—. Con dos
 * criterios distintos, uno dice que quedo y el otro que no.
 */
export function losQueSiguenEnElTexto(cuerpo, pendientes) {
    return pendientes.filter((p) => apareceEnElTexto(cuerpo, p));
}

/** Arma el .md completo: titulo, cuerpo y constancia.
 *
 * La constancia va al final del archivo y no es un adorno. Un .md anonimizado
 * que despues se comparte, se manda por mail o se archiva no tiene como decir
 * cuanto de el es original y cuanto se reemplazo. Sin constancia hay que
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

    // La constancia dice "siguen en el texto", asi que tiene que ser cierto de
    // cada uno. Ver `losQueSiguenEnElTexto`.
    pendientes = losQueSiguenEnElTexto(cuerpo, pendientes);

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
        // NUMERADO, LA CONSTANCIA TIENE QUE DECIR QUE NO TODO ESTA NUMERADO.
        //
        // Las reglas deterministicas —la firma, el tratamiento, los campos de
        // formulario— tapan nombres SIN QUE NADIE DIGA DE QUIEN SON, asi que no
        // hay a que colgarles un numero y salen como "[PERSONA]" pelado. En el
        // mismo archivo conviven entonces los numerados y los que no, y quien
        // cruce dos documentos tiene que saber cual es cual: dos "[PERSONA]" de
        // archivos distintos no son la misma persona, y ni siquiera dos del
        // mismo archivo lo son. Sin esta linea, el .md invita justo al error que
        // la numeracion viene a evitar.
        const numeradas = Object.keys(conteo || {}).filter((k) => /_\d+\]$/.test(k)).length;
        if (numeradas > 0) {
            constancia.push(
                `- **Las etiquetas numeradas identifican a una persona cada una** y son ` +
                `estables entre los archivos que se procesaron juntos. **Las que no llevan ` +
                `número —\`[PERSONA]\` a secas— no**: son nombres que las reglas taparon ` +
                `solas, sin que nadie dijera de quién eran, así que dos de ellas pueden ser ` +
                `dos personas distintas. No se comparan entre archivos.`
            );
        }

        if (pendientes.length > 0) {
            constancia.push(
                (pendientes.length === 1
                    ? '- **Quedó 1 nombre propio sin reemplazar.** Se detectó y no se tildó, '
                    : `- **Quedaron ${pendientes.length} nombres propios sin reemplazar.** ` +
                      'Se detectaron y no se tildaron, ') +
                `así que ${pendientes.length === 1 ? 'sigue' : 'siguen'} en el texto: ` +
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
