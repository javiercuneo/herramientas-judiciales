(function () {
    'use strict';

    var CONFIG = {
        API_FERIADOS_URL: 'https://api.argentinadatos.com/v1/feriados',
        JSON_CUSTOM_URL: '../data/dias-inhabiles.json',
        DEFAULT_MIN_YEAR: 2021
    };

    var feriadosMap = new Map();
    var adicionalMap = new Map();
    var _dataLoaded = false;
    var _loadError = false;
    var _loadedYears = [];

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

    async function loadFeriadosFromAPI(yearsArray) {
        var loaded = [];
        for (var i = 0; i < yearsArray.length; i++) {
            var year = yearsArray[i];
            try {
                var resp = await fetch(CONFIG.API_FERIADOS_URL + '/' + year);
                if (resp.ok) {
                    var data = await resp.json();
                    for (var j = 0; j < data.length; j++) {
                        var item = data[j];
                        feriadosMap.set(item.fecha, { motivo: item.nombre || item.motivo || 'Feriado nacional' });
                    }
                    loaded.push(year);
                }
            } catch (e) {
            }
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
                loadFeriadosFromAPI(yearsArray),
                loadCustomHolidaysJSON()
            ]);

            _loadedYears = results[0];
            _dataLoaded = _loadedYears.length > 0;
        } catch (e) {
            _loadError = true;
        }

        return {
            dataLoaded: _dataLoaded,
            loadError: _loadError,
            loadedYears: _loadedYears.slice()
        };
    }

    window.CalendarioJudicial = {
        CONFIG: CONFIG,

        get dataLoaded() { return _dataLoaded; },
        get loadError() { return _loadError; },
        get loadedYears() { return _loadedYears.slice(); },

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
