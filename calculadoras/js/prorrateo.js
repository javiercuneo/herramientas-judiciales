(function () {
    'use strict';

    // El prorrateo del art. 730 del Codigo Civil y Comercial, extraido de
    // prorrateo.html.
    //
    // Por que existe: el mismo motivo que tasa.js y que plazos.js, que es el
    // precedente. Hasta el 29/10/2026 la cuenta vivia adentro de la pantalla,
    // entre document.getElementById, y ni los conectores ni el panel de la
    // extension podian consultarla sin una SEGUNDA implementacion.
    //
    // ESTE ARCHIVO NO DECIDE NADA NUEVO. Es transcripcion. Las tres
    // constantes y `prorratear()` estan copiados de prorrateo.html tal cual,
    // con sus comentarios.
    //
    // EL LECTOR DE IMPORTES NO ES PROPIO DESDE EL 29/10/2026: es el de
    // js/importes.js, que tiene que estar cargado antes. Hasta ese dia este
    // tenia otro, que dejaba pasar el signo menos, leia "abc" como cero y
    // "1,234,567.89" como 1,23, todo en silencio. Javier decidio unificarlo,
    // y eso SI movio numeros, a sabiendas: el formato ingles con comas de
    // miles pasa a leerse bien, y lo negativo o ilegible vale cero pero
    // AVISA. Cada aviso sale en `cuenta().avisos`.
    //
    // Lo unico escrito aca es la COMPOSICION que calcular() hacia contra el
    // formulario --`cuenta()`-- y la capa de `calcular()`, que es para quien
    // no tiene a nadie leyendo: con un dato faltante, ilegible o fuera de rango
    // devuelve `problema` y no devuelve reparto. No hay medio resultado. Si
    // este motor y la pantalla publicada discrepan en un numero, el que esta
    // mal es este archivo: scripts/verificar-prorrateo.mjs.
    //
    // La UMA no se pide sola: la trae `cargarUma()` desde CONFIG.JSON_UMA_URL,
    // que se puede reescribir antes de llamar, igual que
    // CalendarioJudicial.CONFIG.

    var CONFIG = {
        JSON_UMA_URL: '../data/serie-uma.json'
    };

    var TASA_LEY = 0.03;   // Ley 23.898, art. 2: alicuota general.
    var IVA = 0.21;
    var TOPE_COSTAS = 0.25; // art. 730 CCyC.

    function importes() {
        var I = (typeof window !== 'undefined' && window.Importes) || null;
        if (!I) throw new Error('prorrateo.js necesita importes.js cargado antes.');
        return I;
    }

    // Los nombres de siempre, sobre el lector unico.
    function parseFlexibleNumber(raw) { return importes().leer(raw); }

    function numero(raw) { return importes().numero(raw); }

    // Lo que no se pudo leer, para que la pantalla lo diga: un texto que vale
    // cero sin que nadie lo sepa parece una cuenta, y no lo es.
    function avisoDe(raw, donde, avisos) {
        var a = importes().analizar(raw);
        if (a.aviso) avisos.push({ campo: donde.campo, indice: donde.indice, texto: donde.nombre + ': ' + a.aviso });
    }

    // ----------------------------------------------------------------------
    // EL TOPE, que es lo unico de esta pantalla que cambio de valor el 27/8.
    //
    // El HTML anterior calculaba dos numeros:
    //
    //     percent25 = monto * 0.25   // el techo del art. 730
    //     tope730   = monto * 0.22   // lo que se reparte entre los honorarios
    //
    // y el 22 % estaba ESCRITO DURO. De donde sale: el art. 730 topea las
    // costas ---"incluidos los honorarios profesionales, de todo tipo"--- en el
    // 25 % de la condena, y la tasa de justicia es costas. Si la tasa es el
    // 3 % del art. 2 de la 23.898, a los honorarios les quedan 22 puntos. La
    // cuenta es correcta EN ESE CASO Y SOLO EN ESE.
    //
    // Los dos casos en los que daba mal, y los dos los ofrece la propia
    // pantalla:
    //
    //   - Tasa cargada a mano distinta del 3 %. Con una tasa reducida de
    //     $150.000 sobre un proceso de $10.000.000 ---el 1,5 %, que es la del
    //     art. 3 inc. c--- el art. 730 le deja a los honorarios $2.350.000 y la
    //     pantalla los topeaba en $2.200.000: prorrateaba $150.000 de menos.
    //   - La casilla de la tasa destildada. Si la tasa no integra la base, no
    //     hay nada que descontarle al 25 %, y el tope seguia siendo el 22 %.
    //
    // Ahora el tope SE DERIVA, y con la tasa del 3 % adentro de la base da
    // exactamente 22 %: el caso de siempre no se movio un centavo.
    //
    // El maximo con cero es para la tasa a mano absurda ---mayor al 25 % de la
    // condena---: ahi no queda nada para honorarios y el resultado es cero, no
    // un tope negativo repartido al reves.
    // ----------------------------------------------------------------------
    function prorratear(entrada) {
        var monto = entrada.monto;
        var tasa = entrada.tasa;
        var tasaEnBase = !!entrada.tasaEnBase;
        var regulados = entrada.regulados;

        var techo = monto * TOPE_COSTAS;
        var topeHonorarios = tasaEnBase ? Math.max(0, techo - tasa) : techo;

        var totalRegulado = 0;
        for (var i = 0; i < regulados.length; i++) totalRegulado += regulados[i];

        var costas = totalRegulado + (tasaEnBase ? tasa : 0);
        // Sin honorarios regulados no hay nada que prorratear, aunque la tasa
        // sola pase el techo: el art. 730 reparte honorarios, no reduce la tasa.
        var prorratea = monto > 0 && totalRegulado > 0 && costas > techo;

        var reparto = regulados.map(function (r) {
            if (!prorratea) return r;
            if (totalRegulado <= 0) return 0;
            return (r / totalRegulado) * topeHonorarios;
        });

        var cobrado = 0;
        for (var j = 0; j < reparto.length; j++) cobrado += reparto[j];

        return {
            techo: techo,
            tasa: tasa,
            tasaEnBase: tasaEnBase,
            topeHonorarios: topeHonorarios,
            totalRegulado: totalRegulado,
            costas: costas,
            porcentajeProceso: monto > 0 ? (costas * 100) / monto : 0,
            prorratea: prorratea,
            reparto: reparto,
            cobrado: cobrado,
            recorte: Math.max(0, totalRegulado - cobrado),
            // El recorte como porcentaje de lo regulado. Se calcula acá y no en
            // la pantalla porque ahora lo leen tres lugares ---la nota, la barra
            // y el imprimible--- y tres cuentas del mismo numero se
            // desincronizan. NO cambia ni un peso del reparto.
            recortePorcentaje: totalRegulado > 0
                ? (Math.max(0, totalRegulado - cobrado) * 100) / totalRegulado
                : 0
        };
    }

    // ----------------------------------------------------------------------
    // La UMA sale de data/serie-uma.json, del propio repositorio. Copia de
    // umaVigente() de la pantalla, con un solo agregado: `hoy` se puede
    // pasar. Sin `hoy` es exactamente lo de la pantalla, fecha en UTC
    // incluida.
    //
    // Se elige el ultimo valor cuya VIGENCIA ya empezo, y no el ultimo del
    // archivo. La diferencia aparece el dia que se carga un valor por
    // adelantado: el ultimo del archivo seria uno que todavia no rige.
    // ----------------------------------------------------------------------
    function umaVigente(valores, hoy) {
        hoy = hoy || new Date().toISOString().slice(0, 10);
        var elegido = null;
        for (var i = 0; i < valores.length; i++) {
            var v = valores[i];
            if (typeof v.valor !== 'number' || !v.vigencia) continue;
            if (v.vigencia <= hoy) elegido = v;
        }
        return elegido;
    }

    // La URL se lee AL LLAMAR, y no al cargar el archivo: es lo que deja
    // reescribir CONFIG en el medio.
    function cargarUma() {
        return fetch(CONFIG.JSON_UMA_URL + '?v=' + Date.now())
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            });
    }

    // El monto efectivo de una fila: primero la UMA, despues el IVA. El orden
    // importa y es el que tenia el HTML anterior ---el IVA se calcula sobre el
    // honorario ya expresado en pesos---. Es reguladoDeFila() de la pantalla,
    // sin el DOM.
    function regulado(fila, uma) {
        var monto = numero(fila.monto);
        if (fila.uma) monto = monto * uma;
        if (fila.iva) monto = monto * (1 + IVA);
        return monto;
    }

    // El prorrateado de una fila regulada en UMA, de vuelta en UMA. Se divide
    // por la UMA y se le saca el IVA, asi que da la cantidad de UMA regulada
    // por la misma proporcion que el art. 730 aplica a los pesos: 10 UMA con
    // un recorte del 25 % dan 7,50 UMA. Es prorrateadoEnUma() de la pantalla:
    // null donde la pantalla no escribia nada.
    function prorrateadoEnUma(fila, prorrateado, uma) {
        if (!fila.uma || !(uma > 0) || !(prorrateado > 0)) return null;
        return prorrateado / uma / (fila.iva ? 1 + IVA : 1);
    }

    // Una cifra en pesos leida en UMA. Es solo una lectura: ninguna cuenta la
    // usa.
    function enUmas(n, uma) {
        return n / uma;
    }

    // ----------------------------------------------------------------------
    // LO QUE HACIA calcular() CONTRA EL FORMULARIO, SIN EL FORMULARIO.
    //
    //     { monto, uma, tasaManual, tasaImporte, tasaEnBase,
    //       regulaciones: [{ monto, uma, iva }] }
    //
    // Los importes llegan como los escribe la gente --texto-- y se leen con el
    // lector de la pantalla. Lo que falta vale lo que vale en el formulario
    // recien abierto: la tasa dentro de la base y el 3 % del art. 2.
    // ----------------------------------------------------------------------
    function cuenta(datos) {
        datos = datos || {};
        var monto = numero(datos.monto);
        var uma = numero(datos.uma);
        var manual = !!datos.tasaManual;
        var enBase = datos.tasaEnBase === undefined ? true : !!datos.tasaEnBase;
        var tasa = manual ? numero(datos.tasaImporte) : monto * TASA_LEY;

        var filas = datos.regulaciones || [];
        var hayUma = false;
        var regulados = filas.map(function (f) {
            if (f.uma) hayUma = true;
            return regulado(f, uma);
        });

        var r = prorratear({ monto: monto, tasa: tasa, tasaEnBase: enBase, regulados: regulados });

        var avisos = [];
        avisoDe(datos.monto, { campo: 'monto', nombre: 'Monto del proceso' }, avisos);
        if (manual) avisoDe(datos.tasaImporte, { campo: 'tasaImporte', nombre: 'Tasa de justicia' }, avisos);
        filas.forEach(function (f, i) {
            avisoDe(f.monto, { campo: 'regulacion', indice: i, nombre: 'Regulación ' + (i + 1) }, avisos);
        });
        if (hayUma) avisoDe(datos.uma, { campo: 'uma', nombre: 'Valor de la UMA' }, avisos);

        return {
            monto: monto,
            uma: uma,
            // El 3 % del art. 2 de este proceso, aunque la tasa se cargue a
            // mano: la pantalla lo dice al lado para comparar.
            tasaLey: monto * TASA_LEY,
            tasaManual: manual,
            hayUma: hayUma,
            // Si el caso trae regulaciones en UMA, las cifras del caso tambien
            // se leen en UMA. Si no, no: la UMA no tiene nada que ver con el caso.
            umaCaso: hayUma && uma > 0 ? uma : 0,
            hayIva: filas.some(function (f) { return !!f.iva; }),
            regulados: regulados,
            // La participacion de cada regulacion en lo regulado, en %, que es
            // lo que la pantalla escribe en su columna. null donde escribe raya.
            participacion: regulados.map(function (reg) {
                return !(reg > 0) || r.totalRegulado <= 0 ? null : (reg * 100) / r.totalRegulado;
            }),
            prorrateadoEnUma: filas.map(function (f, i) {
                return !(regulados[i] > 0) || r.totalRegulado <= 0 ? null : prorrateadoEnUma(f, r.reparto[i], uma);
            }),
            avisos: avisos,
            prorrateo: r
        };
    }

    // ----------------------------------------------------------------------
    // LA CAPA DE LOS QUE NO TIENEN A NADIE LEYENDO. Misma cuenta --llama a
    // cuenta() y nada mas--, pero con un dato faltante, ilegible o fuera de
    // rango devuelve `problema` y no trae reparto.
    //
    // LOS MONTOS PUEDEN VENIR COMO NUMERO, y el lector de importes es de
    // texto: lee "1234.567" como un millon y pico, porque un punto con tres digitos
    // atras es de miles. Un numero de JavaScript no tiene separador de miles,
    // asi que se le escribe la coma decimal antes de pasarlo.
    // ----------------------------------------------------------------------
    function textoDeNumero(n) {
        if (typeof n !== 'number') return n;
        if (!isFinite(n) || /e/i.test(String(n))) return null;
        return String(n).replace('.', ',');
    }

    function vacio(v) {
        return v === undefined || v === null || (typeof v === 'string' && !v.trim());
    }

    // Un importe que se va a usar tiene que poder leerse y no ser negativo.
    // Devuelve el texto listo para el lector, o un motivo.
    function importeValido(v, que) {
        if (vacio(v)) return { problema: 'Falta ' + que + '.' };
        var t = textoDeNumero(v);
        if (t === null) return { problema: que.charAt(0).toUpperCase() + que.slice(1) + ' no es un número que se pueda leer.' };
        var a = importes().analizar(t);
        if (a.motivo === 'negativo') return { problema: que.charAt(0).toUpperCase() + que.slice(1) + ' no puede ser negativo.' };
        if (isNaN(a.valor)) return { problema: 'No se entiende ' + que + ': «' + v + '». ' + importes().AVISO_IMPORTE.replace(/^No se entiende ese importe\. /, '') };
        var n = a.valor;
        return { texto: t, valor: n };
    }

    function calcular(datos) {
        function sinResultado(problema) { return { problema: problema, cuenta: null }; }
        if (!datos || typeof datos !== 'object') return sinResultado('Faltan los datos del caso.');

        var monto = importeValido(datos.monto, 'el monto del proceso');
        if (monto.problema) return sinResultado(monto.problema);
        if (!(monto.valor > 0)) return sinResultado('El monto del proceso tiene que ser mayor a cero.');

        var tasaImporte = '';
        if (datos.tasaManual) {
            var t = importeValido(datos.tasaImporte, 'el importe de la tasa');
            if (t.problema) return sinResultado(t.problema);
            tasaImporte = t.texto;
        }

        if (!Array.isArray(datos.regulaciones) || !datos.regulaciones.length) {
            return sinResultado('Falta al menos una regulación de honorarios.');
        }
        var filas = [];
        var hayUma = false;
        for (var i = 0; i < datos.regulaciones.length; i++) {
            var f = datos.regulaciones[i] || {};
            var m = importeValido(f.monto, 'el monto');
            if (m.problema) return sinResultado('Regulación ' + (i + 1) + ': ' + m.problema.charAt(0).toLowerCase() + m.problema.slice(1));
            if (f.uma) hayUma = true;
            filas.push({ monto: m.texto, uma: !!f.uma, iva: !!f.iva });
        }

        var uma = '';
        if (hayUma) {
            var u = importeValido(datos.uma, 'el valor de la UMA');
            if (u.problema) return sinResultado('Hay regulaciones expresadas en UMA: ' + u.problema.charAt(0).toLowerCase() + u.problema.slice(1));
            if (!(u.valor > 0)) return sinResultado('Hay regulaciones expresadas en UMA y el valor de la UMA no es mayor a cero.');
            uma = u.texto;
        }

        var c = cuenta({
            monto: monto.texto,
            uma: uma,
            tasaManual: !!datos.tasaManual,
            tasaImporte: tasaImporte,
            tasaEnBase: datos.tasaEnBase,
            regulaciones: filas
        });
        if (!(c.prorrateo.totalRegulado > 0)) {
            return sinResultado('Las regulaciones suman cero: no hay nada que prorratear.');
        }
        return { problema: null, cuenta: c };
    }

    // La API publica. La consume prorrateo.html desde el 29/10/2026;
    // `Prorrateo730`, el nombre que la pantalla expone para el banco de
    // pruebas del navegador, sigue existiendo alla y apunta a esto.
    var API = {
        CONFIG: CONFIG,
        TOPE_COSTAS: TOPE_COSTAS,
        TASA_LEY: TASA_LEY,
        IVA: IVA,
        parseFlexibleNumber: parseFlexibleNumber,
        numero: numero,
        prorratear: prorratear,
        umaVigente: umaVigente,
        cargarUma: cargarUma,
        regulado: regulado,
        prorrateadoEnUma: prorrateadoEnUma,
        enUmas: enUmas,
        cuenta: cuenta,
        calcular: calcular
    };

    if (typeof window !== 'undefined' && window) window.Prorrateo = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
