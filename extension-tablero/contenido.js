// ---------------------------------------------------------------------------
// Script de contenido, en Lex100 y sgj-docs. No dibuja nada.
//
// Anota el texto de donde se hizo el último click derecho, para el ítem
// «Calcular plazo con esta fecha»: Chrome le da a la extensión la dirección de
// un enlace pero no su texto, y en Lex100 muchas fechas son enlaces que no se
// dejan seleccionar. Se lo da a fondo.js sólo cuando lo pide, y sólo esa vez.
// ---------------------------------------------------------------------------
(function () {
    'use strict';

    let ultimo = '';

    // Lo más chico que tenga texto: el enlace, la celda, el renglón. Un
    // contenedor enorme (la página entera) no sirve para saber qué fecha era.
    function textoDe(el) {
        const enlace = el.closest && el.closest('a');
        if (enlace && enlace.innerText.trim()) return enlace.innerText;
        for (let n = el; n && n !== document.body; n = n.parentElement) {
            const t = (n.innerText || n.textContent || '').trim();
            if (t) return t.length <= 300 ? t : '';
        }
        return '';
    }

    document.addEventListener('contextmenu', (e) => {
        ultimo = e.target instanceof Element ? textoDe(e.target) : '';
    }, true);

    chrome.runtime.onMessage.addListener((msg, _de, responder) => {
        if (!msg || msg.herramientas !== 'textoDelClic') return;
        responder({ texto: ultimo });
        ultimo = '';
    });
})();
