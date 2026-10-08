// ---------------------------------------------------------------------------
// Script de contenido: corre en las paginas de sgj-docs.pjn.gov.ar.
//
// Hace tres cosas y nada mas:
//   1. espera a que la pagina de un proveido (/despacho/<n>/view) muestre el
//      PDF en un iframe con direccion blob:,
//   2. lee los bytes de ese PDF desde esa misma direccion -- es memoria del
//      navegador, no sale nada a la red --,
//   3. pone arriba a la derecha el recuadro de la extension (panel.html) y le
//      pasa los bytes. El recuadro hace el resto.
//
// No hace clics, no completa nada y no toca lo que la pagina guarda. El
// recuadro es un iframe propio de la extension: la pagina no ve su contenido
// ni su CSS lo pisa.
// ---------------------------------------------------------------------------
(() => {
    'use strict';

    const RUTA_PROVEIDO = /^\/despacho\/[^/]+\/view\/?$/;
    const ANCHO = 440;

    let panel = null;          // el iframe del recuadro
    let panelListo = false;    // el recuadro avisa cuando ya escucha
    let pendiente = null;      // mensaje para el recuadro, si llego antes que el
    let ultimoBlob = null;     // la ultima direccion blob: revisada
    let completa = false;      // el recuadro esta a toda la pantalla
    let altoCaja = 64;

    function crearPanel() {
        if (panel) return;
        panel = document.createElement('iframe');
        panel.src = chrome.runtime.getURL('panel.html');
        panel.title = 'Revisor de ortografía';
        panel.setAttribute('data-revisor-pjn', '');
        Object.assign(panel.style, {
            position: 'fixed', top: '12px', right: '12px', zIndex: '2147483647',
            width: ANCHO + 'px', height: '64px', maxHeight: 'calc(100vh - 24px)',
            border: '0', borderRadius: '10px', background: 'transparent',
            boxShadow: '0 6px 24px rgba(0,0,0,.28)', colorScheme: 'light',
        });
        document.documentElement.appendChild(panel);
    }

    // Oculto del todo, no plegado: se vuelve a mostrar con el icono de la
    // extension o con su atajo de teclado. Un proveido nuevo lo muestra solo.
    function mostrarPanel(si) {
        if (panel) panel.style.display = si ? '' : 'none';
    }

    chrome.runtime.onMessage.addListener((msg, _de, responder) => {
        if (msg && msg.revisorPJN === 'alternar' && panel) {
            mostrarPanel(panel.style.display === 'none');
            responder({ visible: panel.style.display !== 'none' });
        }
    });

    function aPanel(msg, transferir) {
        if (!panelListo) { pendiente = { msg, transferir }; return; }
        panel.contentWindow.postMessage({ revisorPJN: true, ...msg }, new URL(panel.src).origin, transferir || []);
    }

    // Lo unico que se escucha de afuera es al propio recuadro: el alto que
    // necesita y que ya esta listo. Cualquier otro mensaje se ignora.
    window.addEventListener('message', (e) => {
        if (!panel || e.source !== panel.contentWindow) return;
        const d = e.data;
        if (!d || d.revisorPJN !== true) return;
        if (d.tipo === 'listo') {
            panelListo = true;
            if (pendiente) { const p = pendiente; pendiente = null; aPanel(p.msg, p.transferir); }
        } else if (d.tipo === 'alto' && Number.isFinite(d.px)) {
            altoCaja = Math.max(40, Math.ceil(d.px));
            if (!completa) panel.style.height = altoCaja + 'px';
        } else if (d.tipo === 'ocultar') {
            mostrarPanel(false);
        } else if (d.tipo === 'pantalla') {
            // La vista con subrayado: el mismo recuadro, a toda la pantalla.
            completa = d.completa === true;
            Object.assign(panel.style, completa
                ? { top: '0', right: '0', width: '100vw', height: '100vh', maxHeight: 'none', borderRadius: '0' }
                : { top: '12px', right: '12px', width: ANCHO + 'px', height: altoCaja + 'px', maxHeight: 'calc(100vh - 24px)', borderRadius: '10px' });
        }
    });

    async function revisar(url) {
        ultimoBlob = url;
        crearPanel();
        mostrarPanel(true);
        aPanel({ tipo: 'leyendo' });
        let bytes;
        try {
            const r = await fetch(url);
            bytes = await r.arrayBuffer();
        } catch (err) {
            aPanel({ tipo: 'error', mensaje: 'No pude leer el PDF de esta página.' });
            return;
        }
        if (url !== ultimoBlob) return;   // ya cambio de proveido
        const cabeza = new TextDecoder('latin1').decode(new Uint8Array(bytes, 0, Math.min(1024, bytes.byteLength)));
        if (!cabeza.includes('%PDF-')) {
            aPanel({ tipo: 'error', mensaje: 'Lo que muestra la página no es un PDF.' });
            return;
        }
        aPanel({ tipo: 'pdf', bytes }, [bytes]);
    }

    function buscar() {
        if (!RUTA_PROVEIDO.test(location.pathname)) {
            // Salio del proveido sin recargar: el recuadro se va con el.
            if (panel) { panel.remove(); panel = null; panelListo = false; pendiente = null; ultimoBlob = null; completa = false; }
            return;
        }
        for (const f of document.querySelectorAll('iframe[src^="blob:"]')) {
            if (f === panel) continue;
            if (f.src !== ultimoBlob) revisar(f.src);
            return;
        }
    }

    // La pagina es una aplicacion que arma el visor despues de cargar, y puede
    // cambiar de proveido sin recargar: se mira cada cambio del arbol y de la
    // direccion de los iframes.
    new MutationObserver(buscar).observe(document.documentElement, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['src'],
    });
    buscar();
})();
