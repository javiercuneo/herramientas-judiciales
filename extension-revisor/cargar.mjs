// Arma el revisor con lo que viaja dentro de la extension: el diccionario
// espanol, la lista del fuero y la lista personal. No hay red: las tres cosas
// se leen de la propia extension o de chrome.storage.local.
import nspell from './vendor/nspell.mjs';
import { crearRevisor, leerLista } from './motor/revisar.mjs';

export const CLAVE_PERSONALES = 'palabrasPersonales';

const leer = (ruta) => fetch(chrome.runtime.getURL(ruta)).then((r) => r.text());

let corrector = null;
let propias = null;

export async function armarRevisor() {
    if (!corrector) {
        const [aff, dic, fuero] = await Promise.all([
            leer('vendor/es.aff'), leer('vendor/es.dic'), leer('datos/fuero.txt'),
        ]);
        corrector = nspell(aff, dic);
        propias = leerLista(fuero);
    }
    return crearRevisor({ corrector, propias, personales: await personales() });
}

export async function personales() {
    const r = await chrome.storage.local.get(CLAVE_PERSONALES);
    return Array.isArray(r[CLAVE_PERSONALES]) ? r[CLAVE_PERSONALES] : [];
}

// Se guarda la palabra sola, en minuscula. Nunca el texto que la rodea.
export async function agregarPersonal(palabra) {
    const lista = await personales();
    const p = palabra.toLocaleLowerCase('es');
    if (!lista.includes(p)) lista.push(p);
    await chrome.storage.local.set({ [CLAVE_PERSONALES]: lista });
}

// Texto de cada pagina del PDF, con pdf.js (cargado como pdfjsLib global).
export async function paginasDelPdf(bytes) {
    const pdfjsLib = globalThis.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdf.worker.min.js');
    const doc = await pdfjsLib.getDocument({ data: bytes, isEvalSupported: false }).promise;
    const paginas = [];
    for (let n = 1; n <= doc.numPages; n++) {
        const pagina = await doc.getPage(n);
        paginas.push(await pagina.getTextContent());
    }
    return { doc, paginas };
}
