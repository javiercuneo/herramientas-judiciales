// ---------------------------------------------------------------------------
// Script de contenido: corre en las paginas de sgj-docs.pjn.gov.ar.
//
// En la pagina de un proveido (/despacho/<n>/view):
//   1. espera a que el PDF aparezca en un iframe con direccion blob:,
//   2. lee los bytes de ese PDF desde esa misma direccion -- es memoria del
//      navegador, no sale nada a la red --,
//   3. se los pasa al recuadro (panel.html), que revisa y dice que palabras
//      quedaron. Si quedo alguna, el recuadro aparece solo; si no, no se ve
//      nada. El icono de la extension o Alt+Mayus+R lo muestran u ocultan;
//   4. si se pidio "Subrayar en el PDF" (queda recordado), pone ademas la
//      vista con subrayado (vista.html) encima del visor de PDF, del mismo
//      tamano. Por defecto no: el visor de Chrome es la herramienta de
//      trabajo -enlaces, imprimir, bajar- y no se tapa.
//
// No hace clics, no completa nada y no toca lo que la pagina guarda. Las dos
// piezas son iframes propios de la extension: la pagina no ve su contenido ni
// su CSS las pisa.
// ---------------------------------------------------------------------------
(() => {
    'use strict';

    const RUTA_PROVEIDO = /^\/despacho\/[^/]+\/view\/?$/;
    const ANCHO = 440;

    let visorPdf = null;       // el iframe blob: de la pagina
    let ultimoBlob = null;     // la ultima direccion blob: revisada
    let bytesPdf = null;       // copia para la vista; solo en memoria
    let hallazgos = [];        // lo ultimo que dijo el recuadro
    let verSubrayado = false;  // "Subrayar en el PDF", recordado en storage
    let primerResultado = true;
    chrome.storage.local.get('subrayarEnPdf').then((r) => {
        verSubrayado = r.subrayarEnPdf === true;
        actualizarVista();
    }).catch(() => {});

    // Cada pieza: el iframe, si ya escucha, y lo que espera para cuando escuche.
    const panel = { marco: null, listo: false, cola: [] };
    const vista = { marco: null, listo: false, cola: [] };

    function crearMarco(pieza, archivo, titulo, estilo) {
        const f = document.createElement('iframe');
        f.src = chrome.runtime.getURL(archivo);
        f.title = titulo;
        f.setAttribute('data-revisor-pjn', archivo.replace('.html', ''));
        Object.assign(f.style, { position: 'fixed', border: '0', zIndex: '2147483646', colorScheme: 'light' }, estilo);
        document.documentElement.appendChild(f);
        Object.assign(pieza, { marco: f, listo: false, cola: [] });
    }

    function quitarMarco(pieza) {
        if (pieza.marco) pieza.marco.remove();
        Object.assign(pieza, { marco: null, listo: false, cola: [] });
    }

    function enviar(pieza, msg, transferir) {
        if (!pieza.marco) return;
        if (!pieza.listo) { pieza.cola.push([msg, transferir]); return; }
        pieza.marco.contentWindow.postMessage({ revisorPJN: true, ...msg }, new URL(pieza.marco.src).origin, transferir || []);
    }

    // --- El recuadro -------------------------------------------------------
    function crearPanel() {
        if (panel.marco) return;
        crearMarco(panel, 'panel.html', 'Revisor de ortografía', {
            top: '12px', right: '12px', zIndex: '2147483647',
            width: ANCHO + 'px', height: '64px', maxHeight: 'calc(100vh - 24px)',
            borderRadius: '10px', background: 'transparent',
            boxShadow: '0 6px 24px rgba(0,0,0,.28)', display: 'none',
        });
    }

    function mostrarPanel(si) {
        if (panel.marco) panel.marco.style.display = si ? '' : 'none';
    }

    chrome.runtime.onMessage.addListener((msg, _de, responder) => {
        if (msg && msg.revisorPJN === 'alternar' && panel.marco) {
            mostrarPanel(panel.marco.style.display === 'none');
            responder({ visible: panel.marco.style.display !== 'none' });
        }
    });

    // --- La vista con subrayado ------------------------------------------
    // Encima del visor, con su mismo rectangulo. Se reubica cuando la pagina
    // cambia de tamano o se desplaza.
    function ubicarVista() {
        if (!vista.marco || !visorPdf) return;
        const r = visorPdf.getBoundingClientRect();
        Object.assign(vista.marco.style, {
            left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
        });
    }
    const observarTamano = new ResizeObserver(ubicarVista);
    window.addEventListener('resize', ubicarVista);
    window.addEventListener('scroll', ubicarVista, true);

    function actualizarVista() {
        const hay = hallazgos.length > 0 && verSubrayado && bytesPdf && visorPdf;
        if (!hay) {
            if (vista.marco) vista.marco.style.display = 'none';
            return;
        }
        if (!vista.marco) {
            crearMarco(vista, 'vista.html', 'Proveído con subrayado', { background: '#525659' });
            ubicarVista();
            const copia = bytesPdf.slice(0);
            enviar(vista, { tipo: 'pdf', bytes: copia, hallazgos }, [copia]);
        } else {
            enviar(vista, { tipo: 'palabras', palabras: hallazgos.map((h) => h.palabra) });
        }
        vista.marco.style.display = '';
    }

    // --- Los mensajes de las dos piezas -----------------------------------
    // Se escucha solo a los propios iframes. Cualquier otro mensaje se ignora.
    window.addEventListener('message', (e) => {
        const pieza = panel.marco && e.source === panel.marco.contentWindow ? panel
            : vista.marco && e.source === vista.marco.contentWindow ? vista : null;
        if (!pieza) return;
        const d = e.data;
        if (!d || d.revisorPJN !== true) return;

        if (d.tipo === 'listo' || d.tipo === 'vista-lista') {
            pieza.listo = true;
            const cola = pieza.cola;
            pieza.cola = [];
            for (const [m, t] of cola) enviar(pieza, m, t);
        } else if (pieza === panel && d.tipo === 'alto' && Number.isFinite(d.px)) {
            panel.marco.style.height = Math.max(40, Math.ceil(d.px)) + 'px';
        } else if (pieza === panel && d.tipo === 'ocultar') {
            mostrarPanel(false);
        } else if (pieza === panel && d.tipo === 'resultado' && Array.isArray(d.hallazgos)) {
            hallazgos = d.hallazgos;
            // Con errores, el recuadro aparece solo, una vez por proveido: si
            // despues se cierra con la X, no vuelve a saltar.
            if (primerResultado && hallazgos.length) mostrarPanel(true);
            primerResultado = false;
            actualizarVista();
        } else if (pieza === panel && d.tipo === 'subrayado') {
            verSubrayado = d.ver === true;
            actualizarVista();
        } else if (pieza === panel && d.tipo === 'ir' && typeof d.palabra === 'string') {
            enviar(vista, { tipo: 'ir', palabra: d.palabra });
        } else if (pieza === vista && d.tipo === 'vista-falla') {
            // Si no se pudo dibujar, que se vea el visor de siempre.
            quitarMarco(vista);
        }
    });

    // --- El PDF ------------------------------------------------------------
    function olvidar() {
        quitarMarco(vista);
        if (visorPdf) observarTamano.unobserve(visorPdf);
        visorPdf = null;
        ultimoBlob = null;
        bytesPdf = null;
        hallazgos = [];
        primerResultado = true;
    }

    async function revisar(marcoPdf) {
        olvidar();
        visorPdf = marcoPdf;
        observarTamano.observe(marcoPdf);
        const url = ultimoBlob = marcoPdf.src;
        crearPanel();
        enviar(panel, { tipo: 'leyendo' });
        let bytes;
        try {
            const r = await fetch(url);
            bytes = await r.arrayBuffer();
        } catch (err) {
            enviar(panel, { tipo: 'error', mensaje: 'No pude leer el PDF de esta página.' });
            return;
        }
        if (url !== ultimoBlob) return;   // ya cambio de proveido
        const cabeza = new TextDecoder('latin1').decode(new Uint8Array(bytes, 0, Math.min(1024, bytes.byteLength)));
        if (!cabeza.includes('%PDF-')) {
            enviar(panel, { tipo: 'error', mensaje: 'Lo que muestra la página no es un PDF.' });
            return;
        }
        bytesPdf = bytes.slice(0);
        enviar(panel, { tipo: 'pdf', bytes }, [bytes]);
    }

    function buscar() {
        if (!RUTA_PROVEIDO.test(location.pathname)) {
            // Salio del proveido sin recargar: las dos piezas se van con el.
            olvidar();
            quitarMarco(panel);
            return;
        }
        const f = [...document.querySelectorAll('iframe[src^="blob:"]')].find((x) => !x.hasAttribute('data-revisor-pjn'));
        if (f && f.src !== ultimoBlob) revisar(f);
        else if (f && f !== visorPdf) { visorPdf = f; observarTamano.observe(f); ubicarVista(); }
        else ubicarVista();
    }

    // La pagina es una aplicacion que arma el visor despues de cargar, y puede
    // cambiar de proveido sin recargar: se mira cada cambio del arbol y de la
    // direccion de los iframes.
    new MutationObserver(buscar).observe(document.documentElement, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['src'],
    });
    buscar();
})();
