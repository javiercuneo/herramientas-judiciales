(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Los dias inhabiles PROPIOS: los que carga quien usa la calculadora.
    //
    // QUE RESUELVE. Hay dias que ningun calendario central va a traer: la
    // suspension de plazos de un juzgado que se pinta o se muda, un asueto de
    // un fuero, una Acordada que todavia no esta en data/. Decidido por Javier
    // el 22/9/2026. El por que de cada regla del motor esta en
    // calendario-judicial.js, en usarDiasPropios(); aca vive lo que el motor
    // no puede hacer: guardarlos, mostrarlos y editarlos.
    //
    // DONDE SE GUARDAN: en el localStorage de este sitio, que comparten las
    // cinco calculadoras de plazos y el tablero porque son el mismo origen. No
    // salen de la computadora y se borran con el boton o limpiando los datos
    // del navegador. Un navegador que no deja guardar —ventana privada, datos
    // bloqueados— no rompe nada: la lista vive mientras la pagina este abierta.
    //
    // LA REGLA QUE GOBIERNA LA PANTALLA: un dia agregado de mas ATRASA el
    // vencimiento, que es el error que hace perder un derecho. Y la forma mas
    // probable de cometerlo no es cargar mal un dia: es cargar los del juzgado
    // A y, meses despues, calcular un plazo del juzgado B con la lista todavia
    // puesta. Por eso:
    //   - mientras haya dias propios prendidos, el aviso esta arriba de la
    //     calculadora y se imprime;
    //   - al lado de cada resultado se nombran los dias propios que lo
    //     movieron, con su motivo;
    //   - el motivo es obligatorio, y se apagan sin borrarse.
    //
    // NO VIAJAN EN LOS ENLACES, a proposito (decidido por Javier): quien abre
    // un enlace calcula con su propia lista. El aviso lo dice.
    // ---------------------------------------------------------------------

    var CLAVE = 'hj.diasPropios';
    var TIPOS = {
        inhabil: 'Día inhábil',
        feria: 'Feria'
    };

    var enMemoria = { activo: true, dias: [] };
    var ultimoResultado = null;

    function leer() {
        try {
            var crudo = window.localStorage.getItem(CLAVE);
            if (crudo) {
                var e = JSON.parse(crudo);
                if (e && Array.isArray(e.dias)) {
                    enMemoria = { activo: e.activo !== false, dias: e.dias };
                }
            }
        } catch (err) { /* sin almacenamiento: queda lo que hay en memoria */ }
        return enMemoria;
    }

    function guardar(estado) {
        enMemoria = estado;
        try {
            window.localStorage.setItem(CLAVE, JSON.stringify(estado));
        } catch (err) { /* idem */ }
    }

    function calendario() {
        return window.CalendarioJudicial && typeof window.CalendarioJudicial.usarDiasPropios === 'function'
            ? window.CalendarioJudicial
            : null;
    }

    // Le pasa al motor la lista, o una vacia si esta apagada.
    function aplicar() {
        var CJ = calendario();
        if (!CJ) return null;
        var e = leer();
        return CJ.usarDiasPropios(e.activo ? e.dias : []);
    }

    function hayActivos() {
        var e = leer();
        return e.activo && e.dias.length > 0;
    }

    // ---------------------------------------------------------------------
    // Formato
    // ---------------------------------------------------------------------

    function fechaCorta(ymd) {
        var p = String(ymd).split('-');
        return p[2] + '/' + p[1] + '/' + p[0];
    }

    function rango(item) {
        return item.hasta && item.hasta !== item.desde
            ? 'del ' + fechaCorta(item.desde) + ' al ' + fechaCorta(item.hasta)
            : fechaCorta(item.desde);
    }

    function cuantosDias(e) {
        var CJ = calendario();
        if (CJ && e.activo) return CJ.diasPropios().length;
        // Apagados, el motor no los tiene: se cuentan a mano, sin validar.
        var n = 0;
        e.dias.forEach(function (it) {
            var a = new Date(it.desde + 'T12:00:00');
            var b = new Date((it.hasta || it.desde) + 'T12:00:00');
            n += Math.max(1, Math.round((b - a) / 86400000) + 1);
        });
        return n;
    }

    function el(tag, clase, texto) {
        var n = document.createElement(tag);
        if (clase) n.className = clase;
        if (texto != null) n.textContent = texto;
        return n;
    }

    // ---------------------------------------------------------------------
    // El aviso de arriba
    // ---------------------------------------------------------------------

    function pintarAviso() {
        var lugares = document.querySelectorAll('[data-dias-propios]');
        if (!lugares.length) return;
        var e = leer();
        var n = cuantosDias(e);

        Array.prototype.forEach.call(lugares, function (lugar) {
            lugar.innerHTML = '';
            var caja;

            if (e.dias.length && e.activo) {
                caja = el('div', 'dp-aviso dp-activo');
                caja.setAttribute('role', 'status');
                var p = el('p', 'dp-texto');
                p.appendChild(el('strong', null,
                    'Calculando con ' + n + (n === 1 ? ' día inhábil propio' : ' días inhábiles propios') + '.'));
                p.appendChild(document.createTextNode(
                    ' No son del calendario oficial: los cargaste vos en este navegador. ' +
                    'No viajan en los enlaces, así que quien abra uno calcula sin ellos.'));
                caja.appendChild(p);
                var lista = el('ul', 'dp-lista-corta');
                e.dias.forEach(function (it) {
                    lista.appendChild(el('li', null,
                        rango(it) + ' · ' + (TIPOS[it.tipo] || it.tipo) + ' · ' + it.motivo));
                });
                caja.appendChild(lista);
                caja.appendChild(botones([
                    ['Editar', abrir],
                    ['Apagar', function () { cambiarActivo(false); }]
                ]));
            } else if (e.dias.length) {
                caja = el('div', 'dp-aviso dp-apagado');
                var q = el('p', 'dp-texto',
                    (n === 1
                        ? 'Tenés 1 día inhábil propio guardado. Está apagado'
                        : 'Tenés ' + n + ' días inhábiles propios guardados. Están apagados') +
                    ': este cálculo usa sólo el calendario oficial.');
                caja.appendChild(q);
                caja.appendChild(botones([
                    ['Prender', function () { cambiarActivo(true); }],
                    ['Editar', abrir]
                ]));
            } else {
                caja = el('div', 'dp-aviso dp-vacio');
                caja.appendChild(botones([['Agregar días inhábiles propios', abrir]]));
            }
            lugar.appendChild(caja);
        });
    }

    function botones(pares) {
        var fila = el('div', 'dp-botones');
        pares.forEach(function (par) {
            var b = el('button', 'dp-boton', par[0]);
            b.type = 'button';
            b.addEventListener('click', par[1]);
            fila.appendChild(b);
        });
        return fila;
    }

    function cambiarActivo(activo) {
        var e = leer();
        guardar({ activo: activo, dias: e.dias });
        cambio();
    }

    // Todo cambio de la lista pasa por aca: motor, aviso y resultado viejo.
    function cambio() {
        aplicar();
        pintarAviso();
        if (ultimoResultado && ultimoResultado.isConnected) {
            var viejo = ultimoResultado.querySelector('.dp-usados');
            if (viejo) viejo.remove();
            var nota = el('p', 'dp-usados dp-desactualizado',
                'Cambiaste los días inhábiles propios después de este cálculo: volvé a calcular.');
            ultimoResultado.appendChild(nota);
        }
        if (dialogo && dialogo.open) pintarLista();
    }

    // ---------------------------------------------------------------------
    // Al lado del resultado
    // ---------------------------------------------------------------------

    // Se llama APENAS vuelve el motor, antes de dibujar: el dibujo del
    // calendario tambien le pregunta al motor por cada dia que pinta, y lo
    // anotaria como usado.
    function usadosEnElCalculo() {
        var CJ = calendario();
        return CJ ? CJ.diasPropiosTocados() : [];
    }

    function anotar(contenedor, usados) {
        if (!contenedor) return;
        ultimoResultado = contenedor;
        var viejo = contenedor.querySelectorAll('.dp-usados');
        Array.prototype.forEach.call(viejo, function (n) { n.remove(); });
        if (!usados || !usados.length) return;

        var caja = el('div', 'dp-usados');
        caja.appendChild(el('p', 'dp-usados-titulo',
            usados.length === 1
                ? 'Este resultado cuenta 1 día inhábil propio, que no es del calendario oficial:'
                : 'Este resultado cuenta ' + usados.length +
                  ' días inhábiles propios, que no son del calendario oficial:'));
        var ul = el('ul');
        usados.forEach(function (u) {
            ul.appendChild(el('li', null,
                fechaCorta(u.fecha) + ' · ' + (TIPOS[u.tipo] || u.tipo) + ' · ' + u.motivo));
        });
        caja.appendChild(ul);
        contenedor.appendChild(caja);
    }

    // ---------------------------------------------------------------------
    // El panel para editar la lista
    // ---------------------------------------------------------------------

    var dialogo = null;

    function abrir() {
        // Adentro del tablero la calculadora es un marco que se estira a la
        // altura de su contenido, y un panel centrado en el marco puede quedar
        // fuera de la pantalla. Se abre en el tablero, que carga este mismo
        // archivo; la lista es la misma porque es el mismo origen.
        try {
            if (window.parent !== window && window.parent.DiasPropios &&
                window.parent.DiasPropios.abrir !== abrir) {
                window.parent.DiasPropios.abrir();
                return;
            }
        } catch (err) { /* otro origen: se abre aca */ }
        if (!dialogo) armarDialogo();
        pintarLista();
        if (typeof dialogo.showModal === 'function') dialogo.showModal();
        else dialogo.setAttribute('open', '');
    }

    function armarDialogo() {
        dialogo = el('dialog', 'dp-dialogo');
        dialogo.setAttribute('aria-labelledby', 'dp-titulo');
        dialogo.innerHTML =
            '<h2 id="dp-titulo">Días inhábiles propios</h2>' +
            '<p class="dp-ayuda">Días que no están en el calendario oficial y que querés que el ' +
            'cálculo no cuente: la suspensión de plazos de un juzgado, un asueto, una mudanza. ' +
            'Se guardan en este navegador y valen para todas las calculadoras de plazos.</p>' +
            '<p class="dp-ayuda"><strong>Un día de más atrasa el vencimiento.</strong> Cargá sólo ' +
            'lo que dispone una resolución o una Acordada, y apagalos cuando calcules un plazo de otro juzgado.</p>' +
            '<div class="dp-cargados"></div>' +
            '<form class="dp-form" novalidate>' +
            '  <div class="dp-campos">' +
            '    <label>Desde<input type="date" name="desde" required></label>' +
            '    <label>Hasta <span class="dp-opcional">(si es más de un día)</span><input type="date" name="hasta"></label>' +
            '    <label>Tipo<select name="tipo">' +
            '      <option value="inhabil">Día inhábil: no corre el plazo</option>' +
            '      <option value="feria">Feria: tampoco corre la caducidad</option>' +
            '    </select></label>' +
            '  </div>' +
            '  <label class="dp-motivo">Motivo<input type="text" name="motivo" maxlength="160" required ' +
            '    placeholder="Resolución o Acordada que lo dispone"></label>' +
            '  <p class="dp-nota-tipo">La caducidad de instancia corre en días corridos y sólo descuenta las ' +
            '  ferias (art. 311 CPCCN): un día inhábil no la mueve; una feria, sí.</p>' +
            '  <p class="dp-error" role="alert" hidden></p>' +
            '  <div class="dp-botones">' +
            '    <button type="submit" class="dp-boton dp-primario">Agregar</button>' +
            '  </div>' +
            '</form>' +
            '<div class="dp-botones dp-pie">' +
            '  <label class="dp-interruptor"><input type="checkbox" name="activo"> Usar mis días propios en los cálculos</label>' +
            '  <button type="button" class="dp-boton dp-borrar">Borrar todos</button>' +
            '  <button type="button" class="dp-boton dp-cerrar">Cerrar</button>' +
            '</div>';
        document.body.appendChild(dialogo);

        var form = dialogo.querySelector('.dp-form');
        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            agregar(form);
        });
        dialogo.querySelector('.dp-cerrar').addEventListener('click', function () { dialogo.close(); });
        dialogo.querySelector('.dp-borrar').addEventListener('click', function () {
            if (!leer().dias.length) return;
            if (!window.confirm('¿Borrar todos los días inhábiles propios de este navegador?')) return;
            guardar({ activo: true, dias: [] });
            cambio();
        });
        dialogo.querySelector('input[name="activo"]').addEventListener('change', function () {
            cambiarActivo(this.checked);
        });
    }

    function pintarLista() {
        var e = leer();
        var cont = dialogo.querySelector('.dp-cargados');
        cont.innerHTML = '';
        dialogo.querySelector('input[name="activo"]').checked = e.activo;
        if (!e.dias.length) {
            cont.appendChild(el('p', 'dp-vacia', 'Todavía no cargaste ninguno.'));
            return;
        }
        var ul = el('ul', 'dp-lista');
        e.dias.forEach(function (it, i) {
            var li = el('li');
            var texto = el('span', 'dp-item');
            texto.appendChild(el('strong', null, rango(it)));
            texto.appendChild(document.createTextNode(' · ' + (TIPOS[it.tipo] || it.tipo) + ' · ' + it.motivo));
            li.appendChild(texto);
            var quitar = el('button', 'dp-boton dp-quitar', 'Quitar');
            quitar.type = 'button';
            quitar.setAttribute('aria-label', 'Quitar ' + rango(it));
            quitar.addEventListener('click', function () {
                var actual = leer();
                var dias = actual.dias.slice();
                dias.splice(i, 1);
                guardar({ activo: actual.activo, dias: dias });
                cambio();
            });
            li.appendChild(quitar);
            ul.appendChild(li);
        });
        cont.appendChild(ul);
    }

    // Valida con el MISMO motor que despues calcula: si el motor rechaza el
    // dia, no se guarda. Dos validaciones distintas —una aca y otra alla—
    // dejarian guardar un dia que el calculo ignora en silencio.
    function agregar(form) {
        var error = form.querySelector('.dp-error');
        var nuevo = {
            desde: form.desde.value,
            hasta: form.hasta.value || undefined,
            tipo: form.tipo.value,
            motivo: form.motivo.value.trim()
        };
        if (!nuevo.hasta) delete nuevo.hasta;

        var mensaje = null;
        if (!nuevo.desde) mensaje = 'Falta la fecha.';
        else if (!nuevo.motivo) mensaje = 'Falta el motivo: es lo que después permite controlar el cálculo.';

        var CJ = calendario();
        var e = leer();
        if (!mensaje && CJ) {
            var prueba = CJ.usarDiasPropios([nuevo]);
            if (prueba.rechazados.length) {
                var err = prueba.rechazados[0].error;
                mensaje = err === 'la fecha final es anterior a la inicial'
                    ? 'La fecha «hasta» es anterior a la fecha «desde».'
                    : err.indexOf('rango pasa') === 0
                        ? 'El rango es de más de un año. Revisá las fechas.'
                        : 'No se pudo agregar: ' + err + '.';
            }
            aplicar(); // devuelve el motor a la lista guardada
        }

        if (mensaje) {
            error.textContent = mensaje;
            error.hidden = false;
            return;
        }
        error.hidden = true;
        guardar({ activo: e.activo, dias: e.dias.concat([nuevo]) });
        form.reset();
        cambio();
    }

    // ---------------------------------------------------------------------
    // Arranque
    // ---------------------------------------------------------------------

    // Se aplica en cuanto carga el archivo, antes de cualquier calculo: las
    // pantallas lo cargan despues del motor.
    aplicar();

    // Otra pestania —o el tablero, que es otro documento que los marcos de
    // adentro— cambio la lista.
    window.addEventListener('storage', function (ev) {
        if (ev.key === CLAVE) cambio();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', pintarAviso);
    } else {
        pintarAviso();
    }

    window.DiasPropios = {
        abrir: abrir,
        hayActivos: hayActivos,
        usadosEnElCalculo: usadosEnElCalculo,
        anotar: anotar
    };
})();
