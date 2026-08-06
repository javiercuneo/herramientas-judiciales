// ------------------------------------------------------------------
// Interruptor de tema claro / oscuro para todo el sitio.
//
// Antes el sitio seguía y punto a `prefers-color-scheme`, o sea al
// sistema operativo del visitante. Eso está bien de arranque pero no
// alcanza: el mismo usuario abre el sitio en casa con Windows en
// oscuro y en la oficina en claro, y no tenía cómo decidir. Honorio ya
// tenía su interruptor, así que además el sitio y la app se
// comportaban distinto.
//
// POR QUE ESTE ARCHIVO Y NO UNO POR PAGINA: son trece páginas sin
// build. Un archivo compartido es la única forma de que el
// comportamiento no se desincronice, igual que comun.css con los
// tokens.
//
// SE CARGA EN EL <head>, CON defer NO. Tiene que correr antes del
// primer pintado o se ve el destello del tema equivocado. Por eso la
// primera parte no toca el DOM más allá de <html>, que ya existe.
//
// Los tokens viven en el CSS de cada página. Este archivo solo pone el
// atributo `data-tema` en <html>; el CSS hace el resto.
// ------------------------------------------------------------------
(function () {
  'use strict';

  var CLAVE = 'javiercuneo.tema';

  function guardado() {
    try {
      var v = localStorage.getItem(CLAVE);
      return v === 'claro' || v === 'oscuro' ? v : null;
    } catch (e) {
      // Modo privado o cookies bloqueadas: se sigue sin recordar.
      return null;
    }
  }

  function aplicar(tema) {
    if (tema) document.documentElement.setAttribute('data-tema', tema);
    else document.documentElement.removeAttribute('data-tema');
  }

  // 1) Antes de pintar: si hay preferencia guardada, aplicarla ya.
  aplicar(guardado());

  // 2) Cuál se está viendo ahora, haya o no preferencia guardada.
  function actual() {
    var g = guardado();
    if (g) return g;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'oscuro'
      : 'claro';
  }

  // 3) El botón, ya con el DOM listo.
  function montar() {
    if (document.querySelector('.tema-boton')) return;

    var btn = document.createElement('button');
    btn.className = 'tema-boton';
    btn.type = 'button';

    function rotular() {
      var a = actual();
      var proximo = a === 'oscuro' ? 'claro' : 'oscuro';
      btn.textContent = a === 'oscuro' ? 'Claro' : 'Oscuro';
      // El texto dice a dónde va; el aria-label explica qué es, porque
      // "Oscuro" solo no dice si describe el estado o la acción.
      btn.setAttribute('aria-label', 'Cambiar a tema ' + proximo);
      btn.title = 'Cambiar a tema ' + proximo;
    }

    btn.addEventListener('click', function () {
      var proximo = actual() === 'oscuro' ? 'claro' : 'oscuro';
      try {
        localStorage.setItem(CLAVE, proximo);
      } catch (e) {
        /* sin persistencia, pero el cambio de esta sesión vale igual */
      }
      aplicar(proximo);
      rotular();
    });

    rotular();
    document.body.appendChild(btn);

    // Si el usuario nunca eligió, seguir al sistema en vivo.
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var alCambiar = function () {
        if (!guardado()) rotular();
      };
      if (mq.addEventListener) mq.addEventListener('change', alCambiar);
      else if (mq.addListener) mq.addListener(alCambiar);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montar);
  } else {
    montar();
  }
})();
