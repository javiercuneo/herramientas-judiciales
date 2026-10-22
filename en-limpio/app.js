// ---------------------------------------------------------------------------
// La pantalla de Pasar en limpio. No decide nada del texto: llama a
// Motor.enLimpio.limpiar y dibuja lo que devuelve.
//
// Lo que se copia es el texto con formato -Times New Roman, el cuerpo
// elegido, interlineado 1,5, justificado- y tambien en texto plano, para el
// editor que no acepte formato. Las marcas de la vista NO viajan: son para
// mirar, no para el testimonio.
// ---------------------------------------------------------------------------
(function () {
  'use strict';

  var limpiar = window.Motor.enLimpio.limpiar;
  var $ = function (id) { return document.getElementById(id); };
  var entrada = $('entrada'), salida = $('salida'), copiar = $('copiar');
  var cuerpo = $('cuerpo'), marcar = $('marcar'), aviso = $('copiado');
  var ultimo = null;

  // El cuerpo y las marcas son preferencia de quien usa la pagina, no del
  // texto: se recuerdan en este navegador y nada mas.
  try {
    var guardado = localStorage.getItem('en-limpio:cuerpo');
    if (guardado === '12' || guardado === '14') cuerpo.value = guardado;
    if (localStorage.getItem('en-limpio:marcar') === 'no') marcar.checked = false;
  } catch (e) { /* sin almacenamiento, los valores de fabrica */ }

  function guardar(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch (e) { /* nada */ }
  }

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function dibujar() {
    var r = limpiar(entrada.value);
    ultimo = r;
    salida.textContent = '';
    for (var i = 0; i < r.partes.length; i++) {
      var p = r.partes[i];
      if (!p.tipo) { salida.appendChild(document.createTextNode(p.t)); continue; }
      var s = el('span', 'm-' + p.tipo, p.t);
      s.title = p.tipo === 'convertido' ? 'Decía «' + p.de + '»'
        : p.tipo === 'revisar' ? 'Decía «' + p.de + '». ' + p.motivo
        : 'Quedó en números: ' + p.motivo;
      salida.appendChild(s);
    }
    copiar.disabled = !r.texto;
    aviso.textContent = '';
    informe(r);
  }

  function lista(id, filas, armar) {
    var ul = $('l-' + id), d = $('d-' + id);
    ul.textContent = '';
    d.hidden = !filas.length;
    for (var i = 0; i < filas.length; i++) ul.appendChild(armar(filas[i]));
    d.querySelector('summary').dataset.n = filas.length;
  }

  function fila(principal, secundario) {
    var li = el('li');
    li.appendChild(el('span', 'que', principal));
    if (secundario) li.appendChild(el('span', 'donde', secundario));
    return li;
  }

  function informe(r) {
    $('informe').hidden = !r.texto && !r.sacado.length;
    var partes = [];
    partes.push(r.sacado.length ? 'Sacó ' + r.sacado.length + (r.sacado.length === 1 ? ' cosa' : ' cosas') + ' del sistema' : 'No encontró ruido del sistema');
    partes.push(r.convertidos.length + (r.convertidos.length === 1 ? ' número pasado' : ' números pasados') + ' a letras');
    if (r.sinPasar.length) partes.push(r.sinPasar.length + ' en números, para mirar');
    if (r.revisar.length) partes.push(r.revisar.length + ' para revisar');
    $('resumen').textContent = partes.join(' · ') + '.';

    lista('mirar', r.sinPasar, function (x) { return fila('«' + x.dato + '»: ' + x.motivo, x.contexto); });
    lista('revisar', r.revisar, function (x) { return fila(x.revisar, x.contexto); });
    lista('pasados', r.convertidos.filter(function (x) { return !x.revisar; }),
      function (x) { return fila('«' + x.de + '» → «' + x.a + '»', x.contexto); });
    lista('sacado', r.sacado, function (x) { return fila(x.texto, x.que); });
    // Lo que hay que mirar se abre solo; lo que salio bien queda plegado.
    $('d-mirar').open = r.sinPasar.length > 0;
    $('d-revisar').open = r.revisar.length > 0;
  }

  function escapar(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function html(texto) {
    return '<p style="font-family:\'Times New Roman\',Times,serif;font-size:' + cuerpo.value +
      'pt;line-height:150%;text-align:justify;margin:0">' + escapar(texto) + '</p>';
  }

  function listo(mensaje) {
    aviso.textContent = mensaje;
  }

  // Camino de repuesto: se copia el nodo armado con el formato, seleccionado.
  // Sirve donde el portapapeles moderno no esta o no deja escribir HTML.
  function copiarSeleccionando(texto) {
    // El formato va por CSSOM y no por innerHTML: la politica de contenido
    // bloquea el atributo style escrito en un HTML, y no el puesto desde aca.
    var caja = el('div', 'para-copiar');
    var p = el('p', null, texto);
    p.style.fontFamily = "'Times New Roman', Times, serif";
    p.style.fontSize = cuerpo.value + 'pt';
    p.style.lineHeight = '150%';
    p.style.textAlign = 'justify';
    p.style.margin = '0';
    caja.appendChild(p);
    document.body.appendChild(caja);
    var rango = document.createRange();
    rango.selectNodeContents(caja);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rango);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    sel.removeAllRanges();
    caja.remove();
    listo(ok ? 'Copiado. Pegalo en el testimonio.' : 'No pude copiar: seleccioná el texto de arriba y copialo a mano.');
  }

  copiar.addEventListener('click', function () {
    if (!ultimo || !ultimo.texto) return;
    var texto = ultimo.texto;
    if (navigator.clipboard && window.ClipboardItem) {
      var item = new ClipboardItem({
        'text/html': new Blob([html(texto)], { type: 'text/html' }),
        'text/plain': new Blob([texto], { type: 'text/plain' }),
      });
      navigator.clipboard.write([item]).then(function () {
        listo('Copiado, en Times New Roman ' + cuerpo.value + ' e interlineado 1,5. Pegalo en el testimonio.');
      }, function () { copiarSeleccionando(texto); });
    } else {
      copiarSeleccionando(texto);
    }
  });

  var espera = null;
  entrada.addEventListener('input', function () {
    clearTimeout(espera);
    espera = setTimeout(dibujar, 150);
  });
  $('borrar').addEventListener('click', function () {
    entrada.value = '';
    dibujar();
    entrada.focus();
  });
  cuerpo.addEventListener('change', function () {
    salida.classList.toggle('c12', cuerpo.value === '12');
    salida.classList.toggle('c14', cuerpo.value === '14');
    guardar('en-limpio:cuerpo', cuerpo.value);
    aviso.textContent = '';
  });
  marcar.addEventListener('change', function () {
    salida.classList.toggle('marcado', marcar.checked);
    guardar('en-limpio:marcar', marcar.checked ? 'si' : 'no');
  });

  salida.classList.toggle('c12', cuerpo.value === '12');
  salida.classList.toggle('c14', cuerpo.value === '14');
  salida.classList.toggle('marcado', marcar.checked);
  dibujar();
})();
