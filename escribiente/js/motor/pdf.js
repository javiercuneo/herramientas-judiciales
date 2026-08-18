// ---------------------------------------------------------------------------
// Operaciones sobre el PDF: unir, separar, rotar.
//
// Son las tres partes que ya andaban, y siguen andando igual. Lo que cambia es
// lo que pasa cuando algo sale mal.
//
// Antes, las tres terminaban en `alert("Ocurrio un error")`. Un cartel que no
// dice que paso no sirve para nada: el usuario no sabe si el archivo estaba
// protegido, si eligio mal el rango o si la herramienta tiene un bug, y lo
// unico que puede hacer es volver a probar lo mismo.
//
// Y el caso peor no daba ni ese cartel: si pedias las paginas "1, 5, 900" de un
// documento de 10, te devolvia la 1 y la 5 y se callaba la 900. Un PDF con
// menos hojas de las que pediste y ningun aviso. Por eso el analisis del rango
// esta separado del resto de la funcion, es puro, y tiene sus propias pruebas.
// ---------------------------------------------------------------------------

/** Traduce "1, 3, 4-7" a indices, y dice todo lo que no pudo traducir.
 *
 * Devuelve `{ indices, fuera, ilegibles, invertidos, error }`:
 *   indices     base 0, ordenados y sin repetir, listos para pdf-lib
 *   fuera       las paginas que pediste y el documento no tiene
 *   ilegibles   los pedazos que no son un numero ni un rango
 *   invertidos  los rangos escritos al reves, que se dan vuelta y se avisan
 *   error       texto para mostrar si no queda ninguna pagina que extraer
 */
export function analizarRango(texto, totalPaginas) {
    const salida = { indices: [], fuera: [], ilegibles: [], invertidos: [], error: null };
    const limpio = (texto || '').trim();

    if (!limpio) {
        salida.error = 'Escribi que paginas queres extraer. Por ejemplo: 1, 3, 4-7';
        return salida;
    }

    const elegidas = new Set();

    for (const pedazo of limpio.split(',')) {
        const parte = pedazo.trim();
        if (!parte) continue;

        const rango = parte.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
        if (rango) {
            let desde = Number(rango[1]);
            let hasta = Number(rango[2]);
            if (desde > hasta) {
                salida.invertidos.push(parte);
                [desde, hasta] = [hasta, desde];
            }
            for (let p = desde; p <= hasta; p++) {
                if (p >= 1 && p <= totalPaginas) elegidas.add(p);
                else salida.fuera.push(p);
            }
            continue;
        }

        if (/^\d+$/.test(parte)) {
            const p = Number(parte);
            if (p >= 1 && p <= totalPaginas) elegidas.add(p);
            else salida.fuera.push(p);
            continue;
        }

        salida.ilegibles.push(parte);
    }

    salida.indices = [...elegidas].sort((a, b) => a - b).map((p) => p - 1);

    if (salida.indices.length === 0) {
        salida.error =
            `Ninguna de las paginas que pediste existe en este documento, que tiene ` +
            `${totalPaginas}. ` + describirProblemas(salida, totalPaginas);
    }

    return salida;
}

/** Arma la frase que explica que se descarto y por que. Vacia si no hubo nada. */
export function describirProblemas(analisis, totalPaginas) {
    const partes = [];
    if (analisis.fuera.length > 0) {
        const lista = [...new Set(analisis.fuera)].sort((a, b) => a - b);
        partes.push(
            `${lista.length === 1 ? 'La pagina' : 'Las paginas'} ${lista.join(', ')} ` +
            `${lista.length === 1 ? 'no existe' : 'no existen'}: el documento tiene ${totalPaginas}.`
        );
    }
    if (analisis.ilegibles.length > 0) {
        partes.push(`No entendi ${analisis.ilegibles.map((s) => `"${s}"`).join(', ')}.`);
    }
    if (analisis.invertidos.length > 0) {
        partes.push(
            `${analisis.invertidos.map((s) => `"${s}"`).join(', ')} ` +
            `${analisis.invertidos.length === 1 ? 'esta escrito' : 'estan escritos'} al reves; ` +
            `lo tome como si fuera al derecho.`
        );
    }
    return partes.join(' ');
}

/** Traduce las excepciones de pdf-lib a algo que se pueda leer y accionar. */
export function explicarError(e, nombreArchivo) {
    const cual = nombreArchivo ? `"${nombreArchivo}"` : 'el archivo';
    const mensaje = String(e && e.message || e);

    if (/encrypt/i.test(mensaje) || (e && e.name === 'EncryptedPDFError')) {
        return `${cual} esta protegido con contrasenia. Abrilo, guardalo sin proteccion ` +
               `y volve a intentar: Escribiente no la puede sacar y no deberia poder.`;
    }
    if (/Failed to parse|Invalid PDF|No PDF header|trailer/i.test(mensaje)) {
        return `${cual} no se puede leer como PDF. Puede estar incompleto o danado, ` +
               `o ser otra cosa con el nombre cambiado.`;
    }
    return `${cual} no se pudo procesar. El navegador informo: ${mensaje}`;
}

/** Une varios PDF en uno. Si uno falla, dice cual y por que. */
export async function unir(PDFLib, archivos) {
    if (archivos.length < 2) throw new Error('Hacen falta al menos dos archivos para unir.');

    const salida = await PDFLib.PDFDocument.create();
    let paginas = 0;

    for (const archivo of archivos) {
        let documento;
        try {
            documento = await PDFLib.PDFDocument.load(await archivo.arrayBuffer());
        } catch (e) {
            // Se nombra el archivo: con ocho seleccionados, "ocurrio un error"
            // obliga a probarlos de a uno para encontrar el que molesta.
            throw new Error(explicarError(e, archivo.name));
        }
        const copiadas = await salida.copyPages(documento, documento.getPageIndices());
        for (const p of copiadas) salida.addPage(p);
        paginas += copiadas.length;
    }

    return { bytes: await salida.save(), paginas };
}

/** Extrae las paginas indicadas a un PDF nuevo. */
export async function separar(PDFLib, archivo, indices) {
    const origen = await PDFLib.PDFDocument.load(await archivo.arrayBuffer());
    const salida = await PDFLib.PDFDocument.create();
    const copiadas = await salida.copyPages(origen, indices);
    for (const p of copiadas) salida.addPage(p);
    return { bytes: await salida.save(), paginas: copiadas.length };
}

/** Rota todas las paginas, sumando sobre la rotacion que ya tenian. */
export async function rotar(PDFLib, archivo, grados) {
    const documento = await PDFLib.PDFDocument.load(await archivo.arrayBuffer());
    const paginas = documento.getPages();
    for (const p of paginas) {
        p.setRotation(PDFLib.degrees((p.getRotation().angle + grados) % 360));
    }
    return { bytes: await documento.save(), paginas: paginas.length };
}

/** Cuenta las paginas sin procesar nada. Sirve para validar el rango antes. */
export async function contarPaginas(PDFLib, archivo) {
    const documento = await PDFLib.PDFDocument.load(await archivo.arrayBuffer());
    return documento.getPageCount();
}
