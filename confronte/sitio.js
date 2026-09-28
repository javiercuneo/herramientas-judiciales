// ---------------------------------------------------------------------------
// Lo que la pagina de confronte hace por ser parte del sitio, y nada mas:
// el enlace de vuelta y el service worker. Va en un archivo aparte porque el
// CSP de la pagina no deja correr codigo escrito adentro del HTML, y esta bien
// que no deje.
// ---------------------------------------------------------------------------
(function () {
    'use strict';

    var cabecera = document.querySelector('header');
    if (cabecera) {
        var a = document.createElement('a');
        a.className = 'volver-sitio';
        a.href = '../index.html';
        a.textContent = 'Todas las herramientas';
        cabecera.appendChild(a);
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').catch(function (e) {
                console.warn('[confronte] sin funcionamiento sin conexion:', e);
            });
        });
    }
})();
