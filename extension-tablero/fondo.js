// ---------------------------------------------------------------------------
// Script de fondo. El click derecho abre un submenú con las herramientas:
//   - con texto seleccionado, en cualquier página (anda también dentro del
//     visor de PDF, probado el 27/10/2026): «Herramientas con «…»»;
//   - sobre un enlace o un texto del PJN, sin seleccionar: «Herramientas
//     judiciales». Chrome no le pasa a la extensión el texto de un enlace, así
//     que se lo pregunta a contenido.js, que anotó dónde fue el click derecho.
//     Es para las fechas que en Lex100 son enlaces y no se dejan seleccionar.
//
// El submenú es fijo: Chrome no deja mirar lo marcado antes de que se abra
// el menú. Si lo marcado no sirve para la herramienta elegida, el panel lo
// dice y deja escribirlo.
//
// Las de fechas se abren en el panel, con el caso en chrome.storage.session;
// el panel lo toma de ahí, esté abierto o recién abriéndose. La distancia se
// abre en una pestaña del sitio (Javier, 28/10): es la que consulta servicios
// de afuera, y ahí se ve qué se manda.
//
// No guarda nada del texto fuera de esta sesión del navegador.
// ---------------------------------------------------------------------------
import { interpretar } from './interpretar.mjs';
import { ORIGEN } from './config.js';

const PJN = ['https://lex100https.pjn.gov.ar/*', 'https://sgj-docs.pjn.gov.ar/*'];

// [id, título]. null es un separador.
const HIJOS = [
    ['vencimiento', 'Vencimiento de un plazo'],
    ['caducidad', 'Caducidad de la instancia'],
    ['mora', 'Mora: firme y pago'],
    ['entre', 'Días entre fechas'],
    null,
    ['distancia', 'Ampliación por distancia (abre el sitio)']
];

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        const padres = [
            { id: 'sel', title: 'Herramientas con «%s»', contexts: ['selection'] },
            { id: 'aca', title: 'Herramientas judiciales', contexts: ['link', 'page'], documentUrlPatterns: PJN }
        ];
        for (const padre of padres) {
            chrome.contextMenus.create(padre);
            HIJOS.forEach((h, i) => {
                const comun = { parentId: padre.id, contexts: padre.contexts };
                if (padre.documentUrlPatterns) comun.documentUrlPatterns = padre.documentUrlPatterns;
                chrome.contextMenus.create(h
                    ? { ...comun, id: `${padre.id}:${h[0]}`, title: h[1] }
                    : { ...comun, id: `${padre.id}:sep${i}`, type: 'separator' });
            });
        }
    });
});

chrome.contextMenus.onClicked.addListener((info, pestana) => {
    const [origen, herramienta] = String(info.menuItemId).split(':');
    if (!herramienta) return;

    if (herramienta === 'distancia') {
        chrome.tabs.create({ url: ORIGEN + '/calculadoras/distancia.html', index: pestana ? pestana.index + 1 : undefined });
        return;
    }

    // Primero el panel: sidePanel.open vale sólo dentro del gesto, y
    // cualquier await antes lo pierde.
    if (pestana && pestana.id >= 0) chrome.sidePanel.open({ tabId: pestana.id }).catch(() => {});
    else if (pestana) chrome.sidePanel.open({ windowId: pestana.windowId }).catch(() => {});

    if (origen === 'sel') {
        entregar(herramienta, info.selectionText || '');
    } else if (pestana) {
        chrome.tabs.sendMessage(pestana.id, { herramientas: 'textoDelClic' }, { frameId: info.frameId || 0 })
            .then((r) => entregar(herramienta, (r && r.texto) || ''))
            .catch(() => entregar(herramienta, ''));
    }
});

function entregar(herramienta, texto) {
    const leido = interpretar(texto);
    chrome.storage.session.set({
        caso: {
            n: Date.now(),
            herramienta,
            texto: texto.replace(/\s+/g, ' ').trim().slice(0, 120),
            fecha: leido.fecha,
            hasta: leido.hasta,
            plazo: leido.plazo,
            otrasFechas: leido.otrasFechas
        }
    });
}
