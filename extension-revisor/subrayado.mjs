// ---------------------------------------------------------------------------
// Vista con subrayado: el PDF dibujado con pdf.js, con su capa de texto, y
// cada posible error subrayado en rojo sobre el documento.
//
// La dibuja el mismo recuadro, agrandado a toda la pantalla: no abre otra
// pestana ni pasa el PDF a ningun lado. Volver la descarta.
// ---------------------------------------------------------------------------
const LETRAS = /[\p{L}\p{M}]+/gu;
const norma = (s) => s.normalize('NFKC').toLocaleLowerCase('es');

export async function dibujar(destino, bytes, palabras) {
    const pdfjsLib = globalThis.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdf.worker.min.js');
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false }).promise;
    const buscadas = new Set(palabras.map(norma));
    const marcas = [];

    for (let n = 1; n <= doc.numPages; n++) {
        const pagina = await doc.getPage(n);
        const base = pagina.getViewport({ scale: 1 });
        const escala = Math.min(1.6, (destino.clientWidth - 32) / base.width);
        const viewport = pagina.getViewport({ scale: escala });
        const dpr = window.devicePixelRatio || 1;

        const div = document.createElement('div');
        div.className = 'pagina';
        div.style.width = `${viewport.width}px`;
        div.style.height = `${viewport.height}px`;
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        div.append(canvas);
        destino.append(div);

        await pagina.render({
            canvasContext: canvas.getContext('2d'),
            viewport,
            transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
        }).promise;

        const capa = document.createElement('div');
        capa.className = 'textLayer';
        capa.style.setProperty('--scale-factor', String(viewport.scale));
        div.append(capa);
        const textDivs = [];
        await pdfjsLib.renderTextLayer({
            textContentSource: await pagina.getTextContent(),
            container: capa,
            viewport,
            textDivs,
        }).promise;
        marcas.push(...subrayar(textDivs, buscadas));
    }
    await doc.destroy();
    return marcas;
}

// Cada span de la capa de texto es un tramo de renglon. Se marca la palabra
// entera dentro del span; si la palabra quedo cortada a fin de renglon
// ("documen-" / "tasión"), se marcan los dos pedazos.
function subrayar(spans, buscadas) {
    const tramos = spans.map((span) => ({ span, texto: span.textContent, rangos: [] }));
    for (let i = 0; i < tramos.length; i++) {
        const t = tramos[i];
        for (const m of t.texto.matchAll(LETRAS)) {
            if (buscadas.has(norma(m[0]))) t.rangos.push([m.index, m.index + m[0].length, norma(m[0])]);
        }
        const corte = /([\p{L}\p{M}]+)[-\u2010\u00AD]\s*$/u.exec(t.texto);
        const sig = tramos.slice(i + 1).find((x) => x.texto.trim());
        if (corte && sig) {
            const resto = /^\s*([\p{L}\p{M}]+)/u.exec(sig.texto);
            const unida = resto && norma(corte[1] + resto[1]);
            if (unida && buscadas.has(unida)) {
                t.rangos.push([corte.index, corte.index + corte[0].trimEnd().length, unida]);
                const ini = resto[0].length - resto[1].length;
                sig.rangos.push([ini, ini + resto[1].length, unida]);
            }
        }
    }
    const marcas = [];
    for (const t of tramos) {
        if (!t.rangos.length) continue;
        t.rangos.sort((a, b) => a[0] - b[0]);
        const partes = [];
        let pos = 0;
        for (const [ini, fin, palabra] of t.rangos) {
            if (ini < pos) continue;
            partes.push(t.texto.slice(pos, ini));
            const mark = document.createElement('mark');
            mark.className = 'error';
            mark.dataset.palabra = palabra;
            mark.textContent = t.texto.slice(ini, fin);
            partes.push(mark);
            marcas.push(mark);
            pos = fin;
        }
        partes.push(t.texto.slice(pos));
        t.span.replaceChildren(...partes);
    }
    return marcas;
}

// Lleva a la proxima aparicion de la palabra, en ronda.
export function irA(marcas, palabra) {
    const propias = marcas.filter((m) => m.dataset.palabra === norma(palabra));
    if (!propias.length) return;
    const actual = propias.findIndex((m) => m.classList.contains('foco'));
    for (const m of marcas) m.classList.remove('foco');
    const m = propias[(actual + 1) % propias.length];
    m.classList.add('foco');
    m.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
