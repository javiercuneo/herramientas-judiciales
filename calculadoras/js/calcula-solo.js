(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Que la calculadora calcule sola apenas el formulario esta completo.
    //
    // QUE RESUELVE (21/10/2026). En el tablero, prorrateo, tasa y mediacion
    // calculaban mientras se escribia, y las de plazos pedian bajar hasta
    // «Calcular». Cada pantalla se manejaba distinto y habia que volver a
    // aprenderla. Ahora todas calculan solas; el boton queda, porque es el
    // que muestra los errores cuando algo falta.
    //
    // NO HAY OTRO COMPUTO. `calcular` es la misma funcion que el boton: este
    // archivo solo decide CUANDO llamarla. Por eso no puede mover un numero.
    //
    // LA REGLA QUE NO SE NEGOCIA: un resultado nunca queda al lado de datos
    // que no son los suyos. Si el formulario deja de estar completo, se llama
    // a `borrar` y vuelve el cartel de espera. Un vencimiento viejo junto a
    // una fecha nueva es peor que no mostrar nada.
    //
    // Y mientras el formulario esta incompleto NO se muestra ningun error:
    // el que esta escribiendo el dia no necesita que le digan que falta el
    // año. Los errores salen con el boton, o con Enter.
    //
    // vencimientos.html tiene su propia version adentro, que es de donde
    // salio esta.
    // ---------------------------------------------------------------------

    var DEMORA = 250;

    // Una fecha de tres campos es valida si existe y el año tiene cuatro
    // cifras: con «202» en el año, `new Date` arma el año 202 sin quejarse, y
    // calcular sobre eso mientras se escribe es mostrar un numero absurdo.
    function fechaValida(dia, mes, anio) {
        dia = String(dia || '').trim();
        mes = String(mes || '').trim();
        anio = String(anio || '').trim();
        if (!/^\d{1,2}$/.test(dia) || !/^\d{1,2}$/.test(mes) || !/^\d{4}$/.test(anio)) return false;
        var d = parseInt(dia, 10), m = parseInt(mes, 10), a = parseInt(anio, 10);
        var f = new Date(a, m - 1, d);
        return f.getFullYear() === a && f.getMonth() === m - 1 && f.getDate() === d;
    }

    // opciones:
    //   contenedor  donde escuchar (el formulario o el panel)
    //   completo()  true si se puede calcular sin ningun error
    //   calcular()  la misma funcion que el boton
    //   borrar()    saca el resultado y vuelve el cartel de espera
    //   ignorar     selector de campos que no son datos del calculo
    //   enter       true para que Enter calcule (los <form> ya lo hacen solos)
    function enganchar(o) {
        var espera = null;

        function revisar(e) {
            if (o.ignorar && e && e.target && e.target.closest && e.target.closest(o.ignorar)) return;
            clearTimeout(espera);
            espera = setTimeout(function () {
                if (o.completo()) {
                    CalculaSolo.enCurso = true;
                    try { o.calcular(); } finally { CalculaSolo.enCurso = false; }
                } else {
                    o.borrar();
                }
            }, DEMORA);
        }

        o.contenedor.addEventListener('input', revisar);
        o.contenedor.addEventListener('change', revisar);

        if (o.enter) {
            o.contenedor.addEventListener('keydown', function (e) {
                if (e.key !== 'Enter' || !e.target || e.target.tagName !== 'INPUT') return;
                if (o.ignorar && e.target.closest(o.ignorar)) return;
                e.preventDefault();
                clearTimeout(espera);
                o.calcular();
            });
        }

        // Para lo que escribe un campo por codigo ---un atajo, una lista---,
        // que no dispara `input`.
        return revisar;
    }

    window.CalculaSolo = {
        enganchar: enganchar,
        fechaValida: fechaValida,
        enCurso: false
    };
})();
