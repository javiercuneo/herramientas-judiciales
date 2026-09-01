/**
 * El computo de la ampliacion por distancia del art. 158 CPCCN.
 *
 * ESTE ARCHIVO NO HABLA CON NADIE Y NO TOCA EL DOM. Recibe distancias ya
 * resueltas y devuelve dias. Por eso corre en Node y tiene banco de pruebas
 * ---npm run verificar-distancia---, que es lo que faltaba: hasta el 1/9/2026 la
 * aritmetica vivia adentro de distancia.html entre getElementById, igual que la
 * de plazos hasta el 26/8, y no la controlaba nada.
 *
 * ---------------------------------------------------------------------------
 * EL ORDEN DE LAS TRES FUENTES, QUE ES LO QUE ESTA PANTALLA TIENE PARA DECIR
 * ---------------------------------------------------------------------------
 *
 * La version anterior preguntaba primero por la linea recta y ofrecia la ruta
 * como un boton al costado. Estaba al reves, y no por gusto: estaba al reves en
 * FIDELIDAD. Se habia diseñado en capas ---primero Haversine, despues la ruta,
 * la Corte nunca--- y el orden de la pantalla quedo siendo el orden en que se
 * construyo y no el orden en que la norma manda.
 *
 * De mas fiel a menos:
 *
 *   1. LA TABLA DE LA CORTE. La Acordada 5/2010 publica la distancia entre la
 *      Capital Federal y cada asiento federal, y los dias que de ahi salen. Si
 *      el caso es uno de esos pares, NO HAY NADA QUE CALCULAR: el numero lo
 *      dijo la Corte. Es la unica de las tres que no es una estimacion.
 *
 *   2. LA RUTA TERRESTRE. Cuando el par no esta en la tabla. Se consulta a OSRM
 *      sobre datos de OpenStreetMap.
 *
 *   3. LA LINEA RECTA. Residual, y hay que decir que lo es: Haversine da la
 *      cuerda entre dos puntos y nadie viaja en linea recta. Sirve cuando no
 *      hay ruta ---islas, otro continente--- y como piso, porque la distancia
 *      real NUNCA es menor que la recta. Eso ultimo es lo que la hace util
 *      igual: si la recta ya da 3 dias, por ruta van a ser 3 o mas.
 *
 * ---------------------------------------------------------------------------
 * LA REGLA DE LA CORTE NO ES "POR RUTA": ES LA MAS LARGA DE LAS DOS
 * ---------------------------------------------------------------------------
 *
 * Acordada 50/86, recitada en el considerando I de la 5/2010: «la distancia que
 * se tendra en cuenta ---segun lo dispuesto por el art. 158--- sera LA MAS LARGA
 * que resulte de la comparacion entre las medidas por via ferrea y por ruta
 * terrestre».
 *
 * Formosa es el caso que lo muestra: 1112 km por ruta y 2501 por tren. La Corte
 * da 13 dias; calculando por ruta salen 6. Una herramienta que solo mira la ruta
 * no puede reproducir la tabla, y por eso la tabla se carga como dato en vez de
 * recalcularse.
 */
// Es un IIFE de navegador y cuelga su API de `window`, igual que
// calendario-judicial.js y plazos.js. NO se exporta como modulo: el package.json
// de la raiz declara `"type": "module"`, asi que un `.js` con `module.exports`
// se carga como ESM y exporta un objeto vacio, sin ningun error. En Node se lo
// levanta con `new Function('window', fuente)`, que es el mismo apaño que usan
// verificar-calculos y verificar-plazos.
(function (window) {
    'use strict';

    var RADIO_TIERRA_KM = 6371;

    // ----------------------------------------------------------------- la regla
    //
    // Art. 158 CPCCN: «los plazos se extenderan a razon de UN DIA por cada
    // DOSCIENTOS KILOMETROS o FRACCION QUE NO BAJE DE CIEN».
    //
    // Los bordes, que son los que hay que no escribir mal:
    //   -  99 km -> 0 dias. La fraccion baja de cien.
    //   - 100 km -> 1 dia. «No baje de cien» INCLUYE a cien.
    //   - 199 km -> 1 dia. Cero doscientos enteros, y la fraccion no baja de 100.
    //   - 200 km -> 1 dia; 299 -> 1; 300 -> 2.
    //
    // No se redondea ni se usa Math.ceil: la ley no dice «se redondea», dice
    // cuantos doscientos entran y que se hace con lo que sobra.
    function diasPorDistancia(km) {
        if (!(km >= 0)) return null;
        var enteros = Math.floor(km / 200);
        var resto = km - enteros * 200;
        return enteros + (resto >= 100 ? 1 : 0);
    }

    // Haversine. Da la distancia sobre la esfera entre dos puntos: la mas corta
    // que existe, y por eso sirve de PISO y no de respuesta.
    function lineaRecta(lat1, lon1, lat2, lon2) {
        var rad = function (v) { return v * Math.PI / 180; };
        var dLat = rad(lat2 - lat1);
        var dLon = rad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) *
                Math.cos(rad(lat1)) * Math.cos(rad(lat2));
        return RADIO_TIERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // ------------------------------------------------------- la tabla de la Corte
    //
    // Normaliza para comparar nombres escritos por gente distinta: la tabla dice
    // «Sgo. del Estero» y GEOREF devuelve «Santiago del Estero»; la tabla dice
    // «Tucuman» y GEOREF, «San Miguel de Tucuman».
    function normalizar(s) {
        return String(s || '')
            .toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')   // saca las tildes
            .replace(/[^a-z0-9 ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Los nombres con los que la gente y GEOREF llaman a un asiento que la tabla
    // escribe de otra forma. Es una lista y no una heuristica de parecido: dos
    // nombres parecidos que son ciudades distintas ---San Juan y San Luis--- no
    // pueden confundirse nunca, y un algoritmo de distancia de edicion los
    // confunde. Si falta un sinonimo, el caso cae a la ruta y da un numero
    // razonable; si sobra uno mal puesto, da el numero de otra ciudad.
    var SINONIMOS = {
        'tucuman': ['san miguel de tucuman'],
        'catamarca': ['san fernando del valle de catamarca'],
        'santiago del estero': ['sgo del estero'],
        'la rioja': [],
        'jujuy': ['san salvador de jujuy'],
        'salta': [],
        'corrientes': [],
        'formosa': [],
        'resistencia': [],
        'posadas': [],
        'parana': [],
        'santa fe': ['santa fe de la vera cruz'],
        'rosario': [],
        'cordoba': [],
        'mendoza': [],
        'san juan': [],
        'san luis': [],
        'neuquen': [],
        'viedma': [],
        'rawson': [],
        'comodoro rivadavia': ['cdoro rivadavia'],
        'rio gallegos': [],
        'ushuaia': [],
        'rio grande': [],
        'bariloche': ['san carlos de bariloche'],
        'general roca': ['gral roca'],
        'concepcion del uruguay': ['concep uruguay'],
        'san ramon de la nueva oran': ['s ramon nva oran', 'oran'],
        'roque saenz pena': ['presidencia roque saenz pena'],
        'paso de los libres': [],
        'bahia blanca': [],
        'mar del plata': [],
        'san nicolas': ['san nicolas de los arroyos'],
        'bell ville': [],
        'rio cuarto': [],
        'reconquista': [],
        'necochea': [],
        'santa rosa': [],
        'dolores': [],
        'azul': [],
        'junin': [],
        'zapala': [],
        'eldorado': [],
        'san rafael': [],
        'mercedes': []
    };

    // La otra punta del par tiene que ser la Capital Federal, porque la tabla
    // mide DESDE la Capital Federal y nada mas. Tucuman-Salta no esta en la
    // tabla y no se puede deducir restando dos filas.
    var NOMBRES_CABA = [
        'ciudad autonoma de buenos aires', 'caba', 'capital federal',
        'buenos aires', 'ciudad de buenos aires', 'congreso de la nacion'
    ];

    function esCapitalFederal(nombre) {
        var n = normalizar(nombre);
        return NOMBRES_CABA.some(function (c) { return n === c || n.indexOf(c) === 0; });
    }

    /**
     * Busca un nombre en la tabla de la Acordada. Devuelve el asiento o null.
     *
     * Compara contra el nombre de la tabla, contra el literal del original si lo
     * tiene, y contra los sinonimos. Se exige coincidencia EXACTA del nombre
     * normalizado, no que uno contenga al otro: «San Juan» esta contenido en
     * «San Juan Bautista» y no es la misma ciudad.
     */
    function buscarAsiento(nombre, tabla) {
        if (!tabla || !tabla.asientos) return null;
        var n = normalizar(nombre);
        if (!n) return null;

        // GEOREF devuelve "Localidad, Departamento, Provincia": se prueba con el
        // nombre entero y con la primera parte.
        var candidatos = [n, normalizar(String(nombre).split(',')[0])];

        for (var i = 0; i < tabla.asientos.length; i++) {
            var a = tabla.asientos[i];
            var claves = [normalizar(a.nombre)];
            if (a.original) claves.push(normalizar(a.original));
            var sin = SINONIMOS[normalizar(a.nombre)];
            if (sin) claves = claves.concat(sin.map(normalizar));

            for (var j = 0; j < candidatos.length; j++) {
                if (claves.indexOf(candidatos[j]) !== -1) return a;
            }
        }
        return null;
    }

    /**
     * Resuelve el caso con la tabla de la Corte, si corresponde.
     *
     * Corresponde SOLO cuando un extremo es la Capital Federal y el otro es un
     * asiento de la tabla. En cualquier otro caso devuelve null y el que llama
     * tiene que ir a la ruta.
     */
    function porLaCorte(nombreA, nombreB, tabla) {
        var aEsCaba = esCapitalFederal(nombreA);
        var bEsCaba = esCapitalFederal(nombreB);
        if (aEsCaba === bEsCaba) return null;   // los dos, o ninguno

        var asiento = buscarAsiento(aEsCaba ? nombreB : nombreA, tabla);
        if (!asiento) return null;

        var mayor = asiento.via_ferrea === null || asiento.via_ferrea === undefined
            ? asiento.ruta
            : Math.max(asiento.ruta, asiento.via_ferrea);

        return {
            fuente: 'corte',
            asiento: asiento.nombre,
            km: mayor,
            kmRuta: asiento.ruta,
            kmViaFerrea: (asiento.via_ferrea === undefined ? null : asiento.via_ferrea),
            // Los dias NO se recalculan: se leen de la tabla. Si algun dia la
            // tabla y la regla discreparan, manda la tabla, que es lo que la
            // Corte publico. verificar-acordada comprueba que hoy coincidan.
            dias: asiento.dias_art_158,
            plazoQueja: asiento.plazo_queja,
            norma: tabla.norma
        };
    }

    /** El resultado por ruta terrestre. */
    function porRuta(km) {
        if (!(km >= 0)) return null;
        return { fuente: 'ruta', km: km, dias: diasPorDistancia(km) };
    }

    /** El resultado por linea recta. Residual, y se marca como tal. */
    function porLineaRecta(lat1, lon1, lat2, lon2) {
        var km = lineaRecta(lat1, lon1, lat2, lon2);
        return { fuente: 'recta', km: km, dias: diasPorDistancia(km), esPiso: true };
    }

    /**
     * La explicacion de por que salieron esos dias, en las palabras del art. 158.
     * La arma el motor y no la pantalla para que diga lo mismo en los tres casos.
     */
    function explicar(km, dias) {
        var enteros = Math.floor(km / 200);
        var resto = km - enteros * 200;
        var partes = [];
        partes.push(enteros + ' × 200 km = ' + enteros + (enteros === 1 ? ' día' : ' días'));
        partes.push('sobran ' + resto.toFixed(2).replace('.', ',') + ' km, que ' +
            (resto >= 100 ? 'no bajan de 100: suman 1 día' : 'no llegan a 100: no suman'));
        return partes.join('; ') + '. Total: ' + dias + (dias === 1 ? ' día' : ' días') + '.';
    }

    window.Distancia = {
        diasPorDistancia: diasPorDistancia,
        lineaRecta: lineaRecta,
        normalizar: normalizar,
        esCapitalFederal: esCapitalFederal,
        buscarAsiento: buscarAsiento,
        porLaCorte: porLaCorte,
        porRuta: porRuta,
        porLineaRecta: porLineaRecta,
        explicar: explicar
    };
}(typeof window !== 'undefined' ? window : this));
