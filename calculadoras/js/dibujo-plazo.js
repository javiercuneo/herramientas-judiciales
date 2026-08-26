(function () {
    'use strict';

    // El plazo dibujado sobre el calendario, compartido por las pantallas de
    // plazos.
    //
    // Por que existe. El dibujo salio el 26/8/2026 adentro de
    // vencimientos.html: la grilla, la agrupacion de motivos por tramo y la
    // fila de referencias, escritas ahi. Extenderlo a caducidad, entre-fechas y
    // regresiva copiando ese codigo habria dejado cuatro copias del mismo
    // calendario en cuatro archivos sin build, que es el modo de falla que ya
    // produjo el bug de la feria y por el que problemaDeDatos() vive en el
    // calendario y no en cada pantalla.
    //
    // QUE DECIDE ESTE ARCHIVO Y QUE NO. Decide como se dibuja un dia: la
    // grilla, el mes, la clave, los tramos y las referencias. NO decide que
    // significa cada dia --eso es de cada pantalla, y es distinto en cada una,
    // porque las cuatro contestan preguntas distintas--. Por eso la entrada es
    // un mapa de marcas ya armado y no un resultado del motor: si este archivo
    // interpretara el computo, seria una segunda implementacion del computo.
    //
    // Y no calcula nada. Recibe fechas y las pinta. Si la grilla y el computo
    // pudieran discrepar, la grilla mentiria con la autoridad que tiene un
    // dibujo.

    var INICIALES_DIA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    var NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    // Las cinco pantallas construyen las fechas con dos convenciones distintas
    // --vencimientos a mediodia UTC, las otras a medianoche local-- y en
    // js/plazos.js esta escrito por que no se unifican: unificarlas correria un
    // dia en alguno de los dos lados. Aca se lee la fecha CIVIL de cualquiera
    // de las dos, con el mismo olfateo que ya usaba formatearFechaCorta.
    function esUTC(fecha) { return fecha.getUTCHours() === 12; }

    function partes(fecha) {
        return esUTC(fecha)
            ? { anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth(), dia: fecha.getUTCDate() }
            : { anio: fecha.getFullYear(), mes: fecha.getMonth(), dia: fecha.getDate() };
    }

    function dos(n) { return n < 10 ? '0' + n : '' + n; }

    // AAAA-MM-DD. Es la clave con la que se indexan las marcas y con la que la
    // grilla busca cada celda: las dos tienen que salir de aca.
    function clave(fecha) {
        var p = partes(fecha);
        return p.anio + '-' + dos(p.mes + 1) + '-' + dos(p.dia);
    }

    function fechaCorta(fecha) {
        var p = partes(fecha);
        return p.dia + ' ' + MESES_CORTOS[p.mes] + ' ' + p.anio;
    }

    // Junta en un tramo los dias seguidos que comparten motivo. "Seguidos"
    // admite hasta tres dias de hueco porque la feria salta el fin de semana:
    // del viernes al lunes hay tres. Un motivo que reaparece mas lejos abre un
    // tramo nuevo, que es lo correcto --2009 y 2020 tuvieron mas de una feria--.
    function agruparPorTramo(dias) {
        var actos = (dias || [])
            .filter(function (d) { return d.motivo !== 'Fin de semana'; })
            .slice()
            .sort(function (a, b) { return a.fecha - b.fecha; });

        var tramos = [];
        actos.forEach(function (d) {
            var ultimo = tramos[tramos.length - 1];
            var hueco = ultimo ? Math.round((d.fecha - ultimo.hasta) / 86400000) : Infinity;
            if (ultimo && ultimo.motivo === d.motivo && hueco <= 3) {
                ultimo.hasta = d.fecha;
                ultimo.dias++;
            } else {
                tramos.push({ motivo: d.motivo, desde: d.fecha, hasta: d.fecha, dias: 1 });
            }
        });
        return tramos;
    }

    function ref(estilo, texto) {
        return '<span><i class="muestra" style="' + estilo + '"></i>' + texto + '</span>';
    }

    function refPunto(texto) {
        return '<span><i class="muestra punto"></i>' + texto + '</span>';
    }

    function mesDibujado(anio, mes, marcas) {
        var html = '<div class="mes"><h4>' + NOMBRES_MES[mes] + ' ' + anio + '</h4><div class="grilla">';

        INICIALES_DIA.forEach(function (letra) {
            html += '<div class="encabezado-dia" aria-hidden="true">' + letra + '</div>';
        });

        var arranque = new Date(Date.UTC(anio, mes, 1, 12)).getUTCDay();
        for (var v = 0; v < arranque; v++) html += '<div class="celda vacio"></div>';

        var ultimo = new Date(Date.UTC(anio, mes + 1, 0, 12)).getUTCDate();
        for (var d = 1; d <= ultimo; d++) {
            var k = anio + '-' + dos(mes + 1) + '-' + dos(d);
            var marca = marcas[k] || { clase: 'fuera' };
            var titulo = d + ' de ' + NOMBRES_MES[mes] + (marca.titulo || '');
            var orden = (marca.orden === undefined || marca.orden === null)
                ? ''
                : '<span class="orden">' + marca.orden + '</span>';

            html += '<div class="celda ' + marca.clase + '" title="' + titulo + '">' +
                '<span>' + d + '</span>' + orden + '</div>';
        }

        return html + '</div></div>';
    }

    // El lienzo entero.
    //
    //   desde, hasta   el primer y el ultimo dia que el dibujo abarca. Se
    //                  dibujan los meses completos que los contienen.
    //   marcas         { 'AAAA-MM-DD': { clase, orden, titulo } }. La clase se
    //                  escribe entera --la pantalla decide el orden y las
    //                  combinaciones-- y el titulo es el sufijo que se le pega
    //                  al numero del dia. Un dia sin marca sale como 'fuera'.
    //   motivos        [{ fecha, motivo }] de lo que decidio un ACTO. Se
    //                  agrupan por tramo y salen abajo. Los fines de semana se
    //                  filtran solos: el dibujo ya los muestra y nadie necesita
    //                  que le digan que el sabado no se cuenta.
    //   referencias    HTML ya armado con ref()/refPunto(), en el orden en que
    //                  se quiera leer.
    function dibujar(config) {
        var desde = partes(config.desde);
        var hasta = partes(config.hasta);
        var marcas = config.marcas || {};

        var anio = desde.anio;
        var mes = desde.mes;

        var html = '<div class="lienzo"><div class="meses">';
        while (anio < hasta.anio || (anio === hasta.anio && mes <= hasta.mes)) {
            html += mesDibujado(anio, mes, marcas);
            mes++;
            if (mes > 11) { mes = 0; anio++; }
        }
        html += '</div>';

        // Los motivos, solo de lo que decidio un acto, y AGRUPADOS POR TRAMO.
        // La feria son doce dias habiles y doce fichas que dicen "Feria
        // judicial (Acordada CSJN 11/2026)" no informan mas que una: tapan al
        // feriado suelto que si es una sorpresa, que es justo lo que hay que ver.
        var tramos = agruparPorTramo(config.motivos);
        if (tramos.length) {
            html += '<div class="motivos">';
            tramos.forEach(function (t) {
                var rotulo = (t.desde === t.hasta)
                    ? fechaCorta(t.desde)
                    : fechaCorta(t.desde) + ' a ' + fechaCorta(t.hasta);
                var cuenta = t.dias > 1 ? ' <span class="cuenta">· ' + t.dias + ' días</span>' : '';
                html += '<span class="motivo"><b>' + rotulo + '</b>' + t.motivo + cuenta + '</span>';
            });
            html += '</div>';
        }

        html += '<div class="referencias">' + (config.referencias || []).join('') + '</div></div>';
        return html;
    }

    // Cuantos meses abarca un dibujo. Lo usan las pantallas cuyo periodo no
    // tiene tope --entre-fechas puede ir de 2021 a 2030-- para no intentar
    // dibujar cien grillas.
    function mesesQueAbarca(desde, hasta) {
        var a = partes(desde);
        var b = partes(hasta);
        return (b.anio - a.anio) * 12 + (b.mes - a.mes) + 1;
    }

    window.DibujoPlazo = {
        clave: clave,
        fechaCorta: fechaCorta,
        dibujar: dibujar,
        agruparPorTramo: agruparPorTramo,
        mesesQueAbarca: mesesQueAbarca,
        ref: ref,
        refPunto: refPunto,
        NOMBRES_MES: NOMBRES_MES
    };
})();
