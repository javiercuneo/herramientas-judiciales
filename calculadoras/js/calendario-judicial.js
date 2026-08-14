(function () {
    'use strict';

    // Los feriados nacionales salen del repositorio, no de una API en vivo.
    // Hasta el 13/8/2026 se le pedian a api.argentinadatos.com en cada carga
    // de cada calculadora, y el catch estaba vacio: si un anio no contestaba
    // —CORS intermitente, caida— el calculo seguia adelante sin esos feriados.
    // Un feriado contado como habil ADELANTA el vencimiento, o sea que el
    // plazo parece cumplirse antes de lo que se cumple.
    //
    // data/feriados.json lo genera scripts/actualizar-feriados.mjs contra la
    // misma API, pero en el build y no en el navegador del visitante.
    var CONFIG = {
        JSON_FERIADOS_URL: '../data/feriados.json',
        JSON_CUSTOM_URL: '../data/dias-inhabiles.json',
        DEFAULT_MIN_YEAR: 2021
    };

    var feriadosMap = new Map();
    var adicionalMap = new Map();
    var _dataLoaded = false;
    var _loadError = false;
    var _loadedYears = [];
    var _missingYears = [];

    function toYMD(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function _toYMD_local(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function isWeekend(fecha) {
        var dia = fecha.getDay();
        return dia === 0 || dia === 6;
    }

    function getPenultimoLunesJulio(year) {
        var mondays = [];
        for (var d = 1; d <= 31; d++) {
            var dt = new Date(year, 6, d);
            if (dt.getMonth() !== 6) break;
            if (dt.getDay() === 1) mondays.push(d);
        }
        var penultimo = mondays[mondays.length - 2];
        return new Date(year, 6, penultimo);
    }

    function generarFeriaJulio(year) {
        var start = getPenultimoLunesJulio(year);
        var dates = [];
        for (var i = 0; i < 12; i++) {
            var d = new Date(start);
            d.setDate(d.getDate() + i);
            dates.push(_toYMD_local(d));
        }
        return dates;
    }

    function esFeriaJulio(fecha) {
        var ymd = _toYMD_local(fecha);
        var year = fecha.getFullYear();
        var feriaDates = generarFeriaJulio(year);
        return feriaDates.indexOf(ymd) !== -1;
    }

    function esFeriaEnero(fecha) {
        return fecha.getMonth() === 0;
    }

    function es16Noviembre(fecha) {
        return fecha.getMonth() === 10 && fecha.getDate() === 16;
    }

    function esFeriado(fecha) {
        return feriadosMap.has(_toYMD_local(fecha));
    }

    function esInhabilCustom(fecha) {
        return adicionalMap.has(_toYMD_local(fecha));
    }

    function esDiaHabil(fecha) {
        if (isWeekend(fecha)) return false;
        if (esFeriado(fecha)) return false;
        if (esInhabilCustom(fecha)) return false;
        if (esFeriaJulio(fecha)) return false;
        if (esFeriaEnero(fecha)) return false;
        if (es16Noviembre(fecha)) return false;
        return true;
    }

    function siguienteDiaHabil(fecha) {
        var next = new Date(fecha);
        next.setDate(next.getDate() + 1);
        while (!esDiaHabil(next)) {
            next.setDate(next.getDate() + 1);
        }
        return next;
    }

    function contarDiasHabiles(fromDate, days) {
        var current = new Date(fromDate);
        var count = 0;
        while (count < days) {
            current.setDate(current.getDate() + 1);
            if (esDiaHabil(current)) {
                count++;
            }
        }
        return current;
    }

    function obtenerMotivoInhabil(fecha) {
        if (isWeekend(fecha)) return 'Fin de semana';

        var ymd = _toYMD_local(fecha);

        if (feriadosMap.has(ymd)) return feriadosMap.get(ymd).motivo;
        if (adicionalMap.has(ymd)) return adicionalMap.get(ymd).motivo;

        if (esFeriaJulio(fecha)) return 'Feria judicial de julio';
        if (esFeriaEnero(fecha)) return 'Feria judicial de enero';
        if (es16Noviembre(fecha)) return '16 de noviembre (Día de la Justicia Nacional)';

        return null;
    }

    // Devuelve los anios pedidos que el archivo cubre. Un anio que no esta
    // NO se completa ni se aproxima: se informa como faltante y el llamador
    // decide. Antes esto se tragaba el error y devolvia la lista corta, que
    // es como un anio sin feriados terminaba pareciendo un anio cargado.
    async function loadFeriados(yearsArray) {
        var resp = await fetch(CONFIG.JSON_FERIADOS_URL + '?v=' + Date.now());
        if (!resp.ok) throw new Error('feriados.json: HTTP ' + resp.status);

        var data = await resp.json();
        var porAnio = data.feriados || {};
        var loaded = [];

        for (var i = 0; i < yearsArray.length; i++) {
            var year = yearsArray[i];
            var lista = porAnio[String(year)];
            if (!Array.isArray(lista) || !lista.length) continue;

            for (var j = 0; j < lista.length; j++) {
                var item = lista[j];
                feriadosMap.set(item.fecha, { motivo: item.motivo || item.nombre || 'Feriado nacional' });
            }
            loaded.push(year);
        }
        return loaded;
    }

    async function loadCustomHolidaysJSON() {
        try {
            var resp = await fetch(CONFIG.JSON_CUSTOM_URL + '?v=' + Date.now());
            if (resp.ok) {
                var data = await resp.json();
                var list = data.dias_inhabiles_adicionales || data.inhabiles || data.dias || [];
                if (Array.isArray(list)) {
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        if (item.fecha) {
                            adicionalMap.set(item.fecha, { motivo: item.motivo || item.nombre || 'Inhábil adicional' });
                        }
                    }
                    return true;
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    async function init(yearsArray) {
        _dataLoaded = false;
        _loadError = false;
        _loadedYears = [];

        if (!yearsArray || !yearsArray.length) {
            var currentYear = new Date().getFullYear();
            yearsArray = [];
            for (var y = CONFIG.DEFAULT_MIN_YEAR; y <= currentYear + 1; y++) {
                yearsArray.push(y);
            }
        }

        try {
            var results = await Promise.all([
                loadFeriados(yearsArray),
                loadCustomHolidaysJSON()
            ]);

            _loadedYears = results[0];

            // Falta un anio = no esta cargado. No alcanza con que haya
            // cargado alguno: si falta 2026 y alguien computa un plazo de
            // 2026, el resultado sale mal y nada lo delata.
            _missingYears = yearsArray.filter(function (y) {
                return _loadedYears.indexOf(y) === -1;
            });
            _dataLoaded = _missingYears.length === 0;
            _loadError = !_dataLoaded;
        } catch (e) {
            _loadError = true;
            _dataLoaded = false;
            _loadedYears = [];
            _missingYears = yearsArray.slice();
        }

        return {
            dataLoaded: _dataLoaded,
            loadError: _loadError,
            loadedYears: _loadedYears.slice(),
            missingYears: _missingYears.slice()
        };
    }

    window.CalendarioJudicial = {
        CONFIG: CONFIG,

        get dataLoaded() { return _dataLoaded; },
        get loadError() { return _loadError; },
        get loadedYears() { return _loadedYears.slice(); },
        get missingYears() { return _missingYears.slice(); },

        init: init,

        toYMD: toYMD,
        isWeekend: isWeekend,

        getPenultimoLunesJulio: getPenultimoLunesJulio,
        generarFeriaJulio: generarFeriaJulio,
        esFeriaJulio: esFeriaJulio,
        esFeriaEnero: esFeriaEnero,
        es16Noviembre: es16Noviembre,

        esFeriado: esFeriado,
        esInhabilCustom: esInhabilCustom,
        esDiaHabil: esDiaHabil,
        siguienteDiaHabil: siguienteDiaHabil,
        contarDiasHabiles: contarDiasHabiles,
        obtenerMotivoInhabil: obtenerMotivoInhabil
    };
})();
