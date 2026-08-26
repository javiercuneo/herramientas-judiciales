(function () {
    'use strict';

    // El computo de plazos, extraido de las pantallas que lo tenian adentro.
    //
    // Por que existe: hasta el 25/8/2026 la aritmetica de vencimientos vivia
    // dentro de vencimientos.html (funcion calcular(), entre document.
    // getElementById) y la de mora dentro de mora.html. Dos consecuencias:
    //
    //   1. Nada fuera del navegador podia consultarla. El pedido de
    //      pipeline-drafter --exponer el computo de vencimientos a Python-- no
    //      tenia a que llamar, y cumplirlo habria significado escribir una
    //      SEGUNDA implementacion de una cuenta con consecuencia juridica.
    //      Es el modo de falla que produjo el bug de la feria en mora.html:
    //      dos heuristicas distintas para lo mismo, cada una mal a su manera.
    //   2. El tablero no puede dibujar un plazo del que solo conoce la fecha
    //      final. Dibujarlo pide el tramo: que dias se contaron y cuales se
    //      saltaron, y por que.
    //
    // ESTE ARCHIVO NO DECIDE NADA NUEVO. Es transcripcion. Las calculadoras
    // quedan como estan --sin una linea modificada-- y sirven de referencia:
    // si este motor y la pantalla discrepan en un numero, el que esta mal es
    // este archivo. Esa comparacion es scripts/verificar-plazos.mjs.
    //
    // La regla del repositorio se hereda entera: si falta un dato, no hay
    // medio resultado. Cada calculo devuelve `problema`, y cuando `problema`
    // no es null NO hay que usar la fecha. El motor no la esconde --sirve
    // para depurar-- pero quien consuma esto tiene que mirar `problema`
    // primero. Un conector que devuelva la fecha ignorando eso es peor que la
    // pantalla, porque del otro lado no hay nadie leyendo un aviso.

    function calendario() {
        var CJ = (typeof window !== 'undefined' && window.CalendarioJudicial) || null;
        if (!CJ) throw new Error('plazos.js necesita calendario-judicial.js cargado antes.');
        return CJ;
    }

    function ymdUTC(fecha) {
        return fecha.toISOString().split('T')[0];
    }

    // vencimientos.html construye la fecha con Date.UTC(..., 12): mediodia
    // UTC. mora.html la construye con new Date(y, m, d) y setHours(0,0,0,0):
    // medianoche local. NO se unifican. Son husos distintos y unificarlos
    // moveria un numero en alguno de los dos lados, que es exactamente lo que
    // esta extraccion no puede hacer.
    function fechaComoVencimientos(anio, mes, dia) {
        return new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia), 12));
    }

    function fechaComoMora(anio, mes, dia) {
        var d = new Date(Number(anio), Number(mes) - 1, Number(dia));
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // --- Notificacion automatica (art. 133 CPCCN) ----------------------------
    // Transcripcion literal de calcularNotificacionAutomatica() en
    // vencimientos.html. La tabla de saltos por dia de la semana se deja como
    // esta: es la que produce los numeros que la pantalla publica hoy.
    function notificacionAutomatica(fechaFirma) {
        var CJ = calendario();
        var dia = fechaFirma.getDay();
        var diasHastaNotificacion = 0;
        if (dia === 0) diasHastaNotificacion = 2;
        else if (dia === 1) diasHastaNotificacion = 1;
        else if (dia === 2) diasHastaNotificacion = 3;
        else if (dia === 3) diasHastaNotificacion = 2;
        else if (dia === 4) diasHastaNotificacion = 1;
        else if (dia === 5) diasHastaNotificacion = 4;
        else if (dia === 6) diasHastaNotificacion = 3;

        var fechaNotificacion = new Date(fechaFirma);
        fechaNotificacion.setDate(fechaNotificacion.getDate() + diasHastaNotificacion);

        while (!CJ.esDiaHabil(fechaNotificacion)) {
            var diaActual = fechaNotificacion.getDay();
            if (diaActual === 2) {
                fechaNotificacion.setDate(fechaNotificacion.getDate() + 3);
            } else {
                fechaNotificacion.setDate(fechaNotificacion.getDate() + 4);
            }
        }
        return fechaNotificacion;
    }

    // Martes y viernes, saltando los que sean inhabiles.
    function proximoDiaDeNota(fecha) {
        var CJ = calendario();
        var siguiente = new Date(fecha);
        siguiente.setDate(siguiente.getDate() + 1);
        while (true) {
            var diaSemana = siguiente.getDay();
            if (diaSemana === 2 || diaSemana === 5) {
                if (CJ.esDiaHabil(siguiente)) return siguiente;
            }
            siguiente.setDate(siguiente.getDate() + 1);
        }
    }

    // Los dos dias de nota siguientes a una fecha, que es lo que la pantalla
    // ofrece de a pares.
    function parDeNotas(fecha) {
        var primera = proximoDiaDeNota(fecha);
        return [primera, proximoDiaDeNota(primera)];
    }

    // --- Vencimiento de un plazo en dias habiles ----------------------------
    //
    // Transcripcion de calcular() en vencimientos.html, sin la parte que lee
    // el formulario y sin la que arma el HTML. La aritmetica no se toco.
    //
    // opciones:
    //   modalidad        'cedula' | 'automatica'
    //   anio, mes, dia   la fecha de notificacion, o la de la firma si la
    //                    modalidad es automatica
    //   plazo            dias habiles
    //   ampliacion       dias de ampliacion por distancia (art. 158 CPCCN), en
    //                    DIAS y no en km: los km los convierte distancia.html.
    //                    Se suma al PLAZO y no a la fecha final, asi que los
    //                    cuenta el mismo bucle y saltan feria y feriados como
    //                    los demas. Sumarlos al final darian dias corridos.
    //   fueraDeHorario   solo con cedula: se diligencio despues de las 20 o
    //                    antes de las 7
    //   notasDejadas     solo con automatica: fechas 'AAAA-MM-DD' en que se
    //                    dejo nota en el Libro de Asistencia (art. 133 CPCCN)
    function vencimiento(opciones) {
        var CJ = calendario();
        var o = opciones || {};
        var modalidad = o.modalidad === 'automatica' ? 'automatica' : 'cedula';
        var plazo = Number(o.plazo);
        var ampliacion = (o.ampliacion === undefined || o.ampliacion === null || o.ampliacion === '')
            ? 0
            : Number(o.ampliacion);

        if (!Number.isInteger(plazo) || plazo <= 0) {
            throw new Error('El plazo tiene que ser un número entero de días mayor que cero.');
        }
        if (!Number.isInteger(ampliacion) || ampliacion < 0) {
            throw new Error('La ampliación tiene que ser un número de días de 0 en adelante.');
        }

        var plazoTotal = plazo + ampliacion;
        var fechaIngresada = fechaComoVencimientos(o.anio, o.mes, o.dia);

        // La auditoria se reinicia aca y se consulta al final: el motor anota
        // los anios sin feria, sin feriados o fuera de cobertura que este
        // computo llegue a tocar. Sin eso, un anio faltante devuelve una fecha
        // plausible que nadie puede desmentir.
        CJ.reiniciarAuditoria();

        var fechaNotificacion;
        var fechaInicioConteo;

        if (modalidad === 'cedula') {
            // Una sola regla, y sale de que los dos supuestos son el mismo: la
            // cedula se tiene por practicada el primer dia habil a partir del
            // momento en que se diligencio, y el plazo corre desde el habil
            // siguiente a ese. Los dos ultimos NO se acumulan: un sabado a las
            // 23 hs. suma un dia, no dos.
            var horaHabil = !o.fueraDeHorario;
            var practicada = (CJ.esDiaHabil(fechaIngresada) && horaHabil)
                ? fechaIngresada
                : CJ.siguienteDiaHabil(fechaIngresada);

            fechaNotificacion = practicada;
            fechaInicioConteo = CJ.siguienteDiaHabil(practicada);
        } else {
            fechaNotificacion = notificacionAutomatica(fechaIngresada);

            var notas = (o.notasDejadas || []).map(function (f) {
                return typeof f === 'string' ? f : ymdUTC(f);
            });
            while (notas.indexOf(ymdUTC(fechaNotificacion)) !== -1) {
                fechaNotificacion = proximoDiaDeNota(fechaNotificacion);
            }
            fechaInicioConteo = CJ.siguienteDiaHabil(fechaNotificacion);
        }

        // El conteo arranca un dia ANTES de fechaInicioConteo y avanza, asi el
        // propio dia de inicio se cuenta como el primero. Se deja escrito como
        // estaba y no simplificado.
        var diasContados = 0;
        var fechaActual = new Date(fechaInicioConteo);
        fechaActual.setDate(fechaActual.getDate() - 1);

        var contados = [];
        while (diasContados < plazoTotal) {
            fechaActual.setDate(fechaActual.getDate() + 1);
            if (CJ.esDiaHabil(fechaActual)) {
                diasContados++;
                contados.push(new Date(fechaActual));
            }
        }

        var sinGracia = new Date(fechaActual);
        var conGracia = CJ.siguienteDiaHabil(sinGracia);

        // Los dias que el computo salteo, con el motivo de cada uno. Es lo que
        // el tablero necesita para dibujar el plazo: una fecha final sola no
        // dice donde cayo la feria ni cuantos fines de semana se comio.
        var salteados = [];
        var vistos = {};
        var cursor = new Date(fechaIngresada);
        while (cursor.getTime() <= conGracia.getTime()) {
            if (!CJ.esDiaHabil(cursor)) {
                var clave = ymdUTC(cursor);
                if (!vistos[clave]) {
                    vistos[clave] = true;
                    salteados.push({
                        fecha: new Date(cursor),
                        ymd: clave,
                        motivo: CJ.obtenerMotivoInhabil(cursor)
                    });
                }
            }
            cursor.setDate(cursor.getDate() + 1);
        }

        return {
            problema: CJ.problemaDeDatos(),
            modalidad: modalidad,
            fechaIngresada: fechaIngresada,
            diaEraHabil: CJ.esDiaHabil(fechaIngresada),
            motivoInhabil: CJ.obtenerMotivoInhabil(fechaIngresada),
            fueraDeHorario: !!o.fueraDeHorario,
            fechaNotificacion: fechaNotificacion,
            fechaInicioConteo: fechaInicioConteo,
            plazo: plazo,
            ampliacion: ampliacion,
            plazoTotal: plazoTotal,
            vencimiento: conGracia,
            vencimientoSinGracia: sinGracia,
            diasContados: contados,
            diasSalteados: salteados
        };
    }

    // --- Mora: un tramo de dias habiles y otro de corridos -------------------
    //
    // Transcripcion de la aritmetica de mora.html, que la tiene escrita en
    // cuatro funciones deliberadamente sin simplificar. Se mantienen las
    // cuatro por el mismo motivo por el que estaban asi alla:
    // nextBusinessDayStrict mas el conteo inclusivo de countBusinessDaysFrom
    // equivalen a un salto de dia habil si la notificacion cae habil, y dos si
    // cae inhabil. Escrito de otra forma el resultado se mueve.
    function mora(opciones) {
        var CJ = calendario();
        var o = opciones || {};
        var diasHabiles = Number(o.diasHabiles);
        var diasCorridos = Number(o.diasCorridos);

        if (!Number.isInteger(diasHabiles) || diasHabiles <= 0) {
            throw new Error('Los días hábiles tienen que ser un número entero mayor que cero.');
        }
        if (!Number.isInteger(diasCorridos) || diasCorridos < 0) {
            throw new Error('Los días corridos tienen que ser un número de 0 en adelante.');
        }

        function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
        function isBusinessDay(date) { return CJ.esDiaHabil(date); }
        function nextBusinessDay(date) {
            var d = new Date(date); d.setHours(0, 0, 0, 0);
            while (!isBusinessDay(d)) d = addDays(d, 1);
            return d;
        }
        function nextBusinessDayStrict(date) {
            var effective = isBusinessDay(date) ? date : nextBusinessDay(date);
            return addDays(effective, 1);
        }
        function countBusinessDaysFrom(startDate, days) {
            var counted = 0;
            var cursor = new Date(startDate); cursor.setHours(0, 0, 0, 0);
            while (counted < days) {
                if (isBusinessDay(cursor)) counted++;
                if (counted >= days) break;
                cursor = addDays(cursor, 1);
            }
            return { lastCountedDay: cursor };
        }

        var notif = fechaComoMora(o.anio, o.mes, o.dia);

        CJ.reiniciarAuditoria();

        var startBiz = nextBusinessDayStrict(notif);
        var lastBiz = countBusinessDaysFrom(startBiz, diasHabiles).lastCountedDay;

        // Tramo ii: los corridos arrancan el dia despues del ultimo habil, y el
        // conteo es inclusivo --de ahi el -1--.
        var startCorr = addDays(lastBiz, 1);
        var endCorr = addDays(startCorr, diasCorridos - 1);

        return {
            problema: CJ.problemaDeDatos(),
            notificacion: notif,
            inicioHabiles: startBiz,
            firme: lastBiz,
            inicioCorridos: startCorr,
            vencimiento: endCorr,
            diasHabiles: diasHabiles,
            diasCorridos: diasCorridos
        };
    }

    var API = {
        notificacionAutomatica: notificacionAutomatica,
        proximoDiaDeNota: proximoDiaDeNota,
        parDeNotas: parDeNotas,
        vencimiento: vencimiento,
        mora: mora
    };

    if (typeof window !== 'undefined' && window) window.Plazos = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
