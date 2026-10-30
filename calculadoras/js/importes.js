(function () {
    'use strict';

    // EL LECTOR DE IMPORTES, uno solo para todo el sitio.
    //
    // Por que existe: hasta el 29/10/2026 habia cuatro. El de tasa.html (que
    // es este), una copia suya en uma-uhom.html, y otro mas viejo en
    // prorrateo y en honorarios-mediacion que dejaba pasar el signo menos,
    // leia "abc" como cero y "1,234,567.89" como 1,23, todo sin avisar. La
    // regla de Javier es que las pantallas y los repos le pidan a un motor
    // unico que sea la fuente de verdad: una copia, aunque sea identica, es
    // un defecto, porque el dia que se corrige una la otra queda vieja.
    //
    // Se eligio el de tasa porque era el unico que verifica los grupos de
    // miles y avisa. Se copio de calculadoras/js/tasa.js byte por byte --la
    // clase de espacios lleva el fino y el no rompible, que una copia a mano
    // pierde sin que se note-- y gano dos cosas, nada mas:
    //
    //   - `motivo` ('vacio', 'negativo', 'ilegible' o ''), para que una
    //     pantalla diga el aviso con sus palabras sin volver a leer el texto;
    //   - `opciones.sufijos`, unidades que una pantalla admite al final ademas
    //     de "ars", "$" y "pesos". El conversor de la UMA admite "uma".
    //
    // Quien lo usa: tasa.js, prorrateo.js, honorarios-mediacion.html y
    // uma-uhom.html, y por los dos motores, los conectores. Ninguno tiene un
    // lector propio, y scripts/verificar-importes.mjs lo exige.

    function sufijos(opciones) {
        var extra = (opciones && opciones.sufijos) || [];
        if (!extra.length) return /(ars|\$|pesos)+$/i;
        return new RegExp('(ars|\\$|pesos|' + extra.join('|') + ')+$', 'i');
    }

    // -----------------------------------------------------------------------
    // LECTURA DE NUMEROS.
    //
    // EL PEDIDO: "asegurate que parsee todas las posibilidades ---la gente
    // copia y pega montos, a veces vienen con comas, a veces con puntos--- y
    // los decimales admitidos. Además una frase de error si está mal".
    //
    // El monto se pega de una planilla, de un PDF, de un escrito o de un
    // sistema en inglés, así que llega de todas estas formas y todas tienen que
    // dar lo mismo:
    //
    //     10800        10.800       10.800,00      $ 10.800
    //     10 800       10'800       10800,00       10,800.00   ARS 10.800
    //
    // La regla que las ordena a todas: EL SEPARADOR DECIMAL ES EL ULTIMO QUE
    // APARECE, y sólo si aparece UNA vez. Un separador repetido ---$1.234.567,
    // $1,234,567--- es de miles por definición: ningún número tiene dos comas
    // decimales.
    //
    // Y LO QUE NO SE PUEDE LEER NO VALE CERO: avisa. Antes "10.800.5" valía
    // 10,8 y "diez mil" valía cero, las dos cosas en silencio, y una línea
    // cargada que aporta cero es peor que un error porque parece una cuenta.
    //
    // Los grupos de miles se VERIFICAN ---el primero de uno a tres dígitos, los
    // demás de tres exactos--- y por eso "1.234.56" es un error y no 123.456:
    // ese texto no es un número en ningún formato, y adivinarle uno es
    // exactamente lo que no hay que hacer con un importe que va a una boleta.
    // -----------------------------------------------------------------------
    var AVISO_IMPORTE = 'No se entiende ese importe. Se escribe 1.234.567,89 o 1234567.89.';
    var AVISO_NEGATIVO = 'El importe no puede ser negativo.';

    function analizarNumero(raw, opciones) {
        var s = String(raw === null || raw === undefined ? '' : raw);

        // Lo que viene pegado alrededor del número: espacios de todo tipo
        // ---incluido el fino y el no rompible, que es el que mete Excel---,
        // el símbolo, la sigla y el apóstrofo de miles.
        s = s.replace(/[\s   ']/g, '')
             .replace(/^(ars|\$)+/i, '')
             .replace(sufijos(opciones), '');

        if (!s) return { valor: NaN, vacio: true, aviso: '', motivo: 'vacio' };
        if (s.charAt(0) === '-') return { valor: NaN, aviso: AVISO_NEGATIVO, motivo: 'negativo' };
        if (!/^[0-9.,]+$/.test(s)) return { valor: NaN, aviso: AVISO_IMPORTE, motivo: 'ilegible' };

        var comas = (s.match(/,/g) || []).length;
        var puntos = (s.match(/\./g) || []).length;
        var decimal = '';

        if (comas === 1 && puntos === 1) {
            decimal = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
        } else if (comas === 1 && puntos !== 1) {
            // Una coma sola es SIEMPRE decimal: es como se escribe acá.
            decimal = ',';
        } else if (comas > 1 && puntos === 1) {
            decimal = '.';                       // formato inglés: 1,234,567.89
        } else if (comas > 1 && puntos > 1) {
            return { valor: NaN, aviso: AVISO_IMPORTE, motivo: 'ilegible' };
        } else if (comas === 0 && puntos === 1) {
            // Un punto solo: de miles si atrás quedan exactamente tres dígitos
            // ---10.800---, decimal si no ---10.8---. Es la única lectura
            // ambigua que queda, y se resuelve como se escribe acá.
            decimal = (s.length - s.lastIndexOf('.') - 1) === 3 ? '' : '.';
        }
        // comas > 1 && puntos === 0, o comas === 0 && puntos > 1: todos de miles.

        var corte = decimal ? s.lastIndexOf(decimal) : -1;
        var entero = decimal ? s.slice(0, corte) : s;
        var decimales = decimal ? s.slice(corte + 1) : '';
        var miles = decimal === ',' ? '.' : (decimal === '.' ? ',' : (puntos ? '.' : ','));

        if (entero.indexOf(miles) > -1) {
            var grupos = entero.split(miles);
            if (!/^\d{1,3}$/.test(grupos[0])) return { valor: NaN, aviso: AVISO_IMPORTE, motivo: 'ilegible' };
            for (var i = 1; i < grupos.length; i++) {
                if (!/^\d{3}$/.test(grupos[i])) return { valor: NaN, aviso: AVISO_IMPORTE, motivo: 'ilegible' };
            }
            entero = grupos.join('');
        }
        if (entero === '' && decimales !== '') entero = '0';
        if (!/^\d+$/.test(entero)) return { valor: NaN, aviso: AVISO_IMPORTE, motivo: 'ilegible' };
        if (decimal && !/^\d+$/.test(decimales)) return { valor: NaN, aviso: AVISO_IMPORTE, motivo: 'ilegible' };

        var valor = parseFloat(entero + (decimal ? '.' + decimales : ''));
        if (!isFinite(valor)) return { valor: NaN, aviso: AVISO_IMPORTE, motivo: 'ilegible' };
        return { valor: valor, aviso: '', motivo: '' };
    }


    // Los contratos de siempre, encima del analizador: NaN si no se puede
    // leer, o cero.
    function leer(raw, opciones) { return analizarNumero(raw, opciones).valor; }

    function numero(raw, opciones) {
        var n = leer(raw, opciones);
        return isNaN(n) ? 0 : n;
    }

    var API = {
        AVISO_IMPORTE: AVISO_IMPORTE,
        AVISO_NEGATIVO: AVISO_NEGATIVO,
        analizar: analizarNumero,
        leer: leer,
        numero: numero
    };

    if (typeof window !== 'undefined' && window) window.Importes = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
