// ---------------------------------------------------------------------------
// Script de fondo. El click derecho:
//   - con texto seleccionado: «Calcular plazo desde «…»» (anda también dentro
//     del visor de PDF, probado el 27/10/2026);
//   - sobre un enlace o un texto del PJN, sin seleccionar: «Calcular plazo con
//     esta fecha». Chrome no le pasa a la extensión el texto de un enlace, así
//     que se lo pregunta a contenido.js, que anotó dónde fue el click derecho.
//     Es para las fechas que en Lex100 son enlaces y no se dejan seleccionar.
//
// Abre el panel y le deja el caso en chrome.storage.session; el panel lo
// toma de ahí, esté abierto o recién abriéndose.
//
// No guarda nada del texto fuera de esta sesión del navegador.
// ---------------------------------------------------------------------------
import { interpretar } from './interpretar.mjs';

const PJN = ['https://lex100https.pjn.gov.ar/*', 'https://sgj-docs.pjn.gov.ar/*'];

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'plazo-seleccion',
            title: 'Calcular plazo desde «%s»',
            contexts: ['selection']
        });
        chrome.contextMenus.create({
            id: 'plazo-aca',
            title: 'Calcular plazo con esta fecha',
            contexts: ['link', 'page'],
            documentUrlPatterns: PJN
        });
    });
});

chrome.contextMenus.onClicked.addListener((info, pestana) => {
    // Primero el panel: sidePanel.open vale sólo dentro del gesto, y
    // cualquier await antes lo pierde.
    if (pestana && pestana.id >= 0) chrome.sidePanel.open({ tabId: pestana.id }).catch(() => {});
    else if (pestana) chrome.sidePanel.open({ windowId: pestana.windowId }).catch(() => {});

    if (info.menuItemId === 'plazo-seleccion') {
        entregar(info.selectionText || '');
    } else if (info.menuItemId === 'plazo-aca' && pestana) {
        chrome.tabs.sendMessage(pestana.id, { herramientas: 'textoDelClic' }, { frameId: info.frameId || 0 })
            .then((r) => entregar((r && r.texto) || ''))
            .catch(() => entregar(''));
    }
});

function entregar(texto) {
    const leido = interpretar(texto);
    chrome.storage.session.set({
        caso: {
            n: Date.now(),
            texto: texto.replace(/\s+/g, ' ').trim().slice(0, 120),
            fecha: leido.fecha,
            plazo: leido.plazo,
            otrasFechas: leido.otrasFechas
        }
    });
}
