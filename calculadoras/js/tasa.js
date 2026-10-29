(function () {
    'use strict';

    // La tasa de justicia de la Ley 23.898, extraida de tasa.html.
    //
    // Por que existe: hasta el 29/10/2026 la cuenta vivia adentro de la
    // pantalla, entre document.getElementById. Nada fuera de esa pestania podia
    // consultarla --ni los conectores, ni el panel de la extension, ni lo que
    // venga-- y cumplir cualquiera de esos pedidos habria significado escribir
    // una SEGUNDA implementacion de una cuenta con consecuencia juridica. Es el
    // modo de falla que produjo el bug de la feria, y por el que plazos.js se
    // extrajo el 26/8: el precedente es ese archivo, y el metodo es el mismo.
    //
    // ESTE ARCHIVO NO DECIDE NADA NUEVO. Es transcripcion. Las tablas, el
    // lector de importes, la titularidad, la escala concursal y `liquidar()`
    // estan copiados de tasa.html tal cual, con sus comentarios y sus rarezas.
    // Lo unico escrito aca es la COMPOSICION que antes hacia calcular() contra
    // el formulario --`cuentasDelCaso`, `totales` y `momentos`--, y la capa de
    // `liquidarCaso`, que es la que usan los que no tienen a nadie leyendo.
    // Si este motor y la pantalla publicada discrepan en un numero, el que esta
    // mal es este archivo. Esa comparacion es scripts/verificar-tasa.mjs.
    //
    // DOS CAPAS, Y LA DIFERENCIA IMPORTA:
    //
    //   - `cuentasDelCaso(caso)` hace lo que hace la pantalla: un importe que
    //     no se puede leer aporta cero y lleva su `aviso`, y el total sale
    //     igual, porque al lado hay alguien leyendo el aviso.
    //   - `liquidarCaso(caso)` es para un conector, un panel o un modelo: con
    //     un dato faltante, ilegible o fuera de rango devuelve `problema` y NO
    //     devuelve total. No hay medio resultado. La regla es la de plazos.js:
    //     quien consuma esto mira `problema` primero.
    //
    // Los datos no se piden solos: el monto fijo del art. 6 lo trae
    // `cargarMontoFijo()` desde CONFIG.JSON_MONTO_FIJO_URL, que se puede
    // reescribir antes de llamar, igual que CalendarioJudicial.CONFIG --el
    // ledger depende de que sea asi en el calendario, y lo que venga va a
    // depender de lo mismo aca--.

    var CONFIG = {
        JSON_MONTO_FIJO_URL: '../data/tasa-monto-fijo.json'
    };

    // =======================================================================
    // LAS DOS TABLAS DE LA LEY. No las toca la interfaz: son el eje 1 y el eje
    // 2, y `liquidar()` recibe una de cada una. Los supuestos de más abajo las
    // NOMBRAN; ninguno define una alícuota propia ni un monto propio.
    // =======================================================================

    // -----------------------------------------------------------------------
    // EJE 1: QUE NUMERO SE TOMA. Es el art. 4, "monto imponible".
    //
    // `factor` es el multiplicador que la ley pone adentro de la base y que la
    // pantalla aplica sola: el desalojo son SEIS meses de alquiler (inc. b) y
    // el desalojo laboral SEIS del último salario (inc. i). El campo pide UNO
    // y lo dice el hint, que es exactamente lo que pidió Javier: "al elegir
    // desalojo ya te dice que pongas un solo alquiler porque el sistema está
    // calculando los 6 meses que son la base".
    //
    // `divisible` marca las dos bases que valúan UNA COSA ---el inmueble del
    // inc. c y el mueble o derecho del inc. d--- y por eso son las dos que
    // pueden ser de varios. Es el campo de TITULARIDAD, y cuelga de acá y no
    // del supuesto sucesorio, que es donde estuvo hasta el 27/8. Lo corrigió
    // Javier: "la separación de bienes es lo mismo que la petición de
    // herencia, y cualquier otro caso de cosas comunes: es el valor de lo que
    // se divide y luego juega el porcentaje de titularidad de cada uno". La
    // titularidad NO es una figura del sucesorio: es una figura de la cosa
    // común, y el sucesorio es UNO de los casos en que aparece.
    //
    // NO HAY UNA BASE "SUMAS DE DINERO EN LA SUCESION", y es a propósito: el
    // art. 4 inc. g dice que en los sucesorios el valor de los bienes "se
    // determinará como lo establece en los incisos c) y d)". La plata del
    // acervo es un bien mueble ---inc. d---, no una suma de dinero reclamada
    // ---inc. a, que es una pretensión contenciosa---. Por eso el supuesto de
    // sucesión ofrece "Dinero del acervo" como ítem con nombre propio, que
    // apunta a esta misma base: la cita queda bien y el número no se mueve.
    // -----------------------------------------------------------------------
    var BASES = [
        { id: 'sumas',    cita: 'art. 4 inc. a' },
        { id: 'alquiler', cita: 'art. 4 inc. b', factor: 6 },
        { id: 'inmueble', cita: 'art. 4 inc. c', divisible: true },
        { id: 'muebles',  cita: 'art. 4 inc. d', divisible: true },
        { id: 'quiebra',  cita: 'art. 4 inc. e' },
        { id: 'creditos', cita: 'art. 4 inc. e' },
        { id: 'hipoteca', cita: 'art. 4 inc. f' },
        { id: 'terceria', cita: 'art. 4 inc. h' },
        { id: 'condena',  cita: 'art. 4 inc. i' },
        { id: 'salario',  cita: 'art. 4 inc. i', factor: 6 },
        { id: 'apelado',  cita: 'art. 4 inc. j' },

        // EL MONTO FIJO. No tiene base ni alícuota: tiene un importe, y no lo
        // fija la ley sino la Corte.
        //
        // LOS ARTS. 5 Y 6 SON UNA SOLA BASE DESDE EL 31/8, y lo pidió Javier
        // porque en la pantalla eran indistinguibles: "monto indeterminable y
        // juicio sin monto muestran exactamente lo mismo". Y muestran lo
        // mismo porque PAGAN lo mismo ---la suma del art. 6---; lo único que
        // los separa es CUANDO, y eso no se decide con un desplegable sino
        // leyendo los dos supuestos, que es lo que hace el hint doble y lo que
        // dice "Cuándo se paga" con los dos momentos puestos.
        { id: 'fija', cita: 'arts. 5 y 6', montoFijo: true }
    ];

    // -----------------------------------------------------------------------
    // EJE 2: QUE ALICUOTA SE LE APLICA. Son los arts. 2 y 3.
    //
    // LA REDUCCION DEL 50 % NO ES DE LOS SUCESORIOS: ES DE SEIS SUPUESTOS, y
    // el sucesorio es uno. Los otros cinco son mensura y deslinde (inc. b),
    // testamentos e hijuelas de extraña jurisdicción (inc. d), reinscripción
    // de hipotecas y prendas (inc. f), recursos directos contra el PEN,
    // provincial o municipal (inc. g) y tercerías (inc. h). Los incs. a y e
    // están derogados.
    //
    // `sucesion: true` marca las tres alícuotas del supuesto sucesorio, y
    // gobierna DOS cosas: la SOBRETASA ---que sólo se usa sobre inmuebles de
    // una sucesión--- y el momento de pago del art. 9 inc. d.
    //
    // EL 0,75 % DEL INC. G: el texto dice que "el valor establecido en el
    // artículo 3, inciso c) se reducirá a la mitad", y el art. 3 inc. c no
    // establece un valor sino una reducción, así que la redacción se presta a
    // leerla de dos maneras. La calculadora lee que la alícuota ya reducida se
    // reduce otra vez ---3 % a 1,5 % y a 0,75 %---, y esa lectura la confirmó
    // Javier el 27/8: "es la interpretación que se hace todos los días".
    // -----------------------------------------------------------------------
    var ALICUOTAS = [
        { id: 'general',    cita: 'art. 2',                  tasa: 0.03 },
        { id: 'mensura',    cita: 'art. 3 inc. b',           tasa: 0.015 },
        { id: 'sucesorio',  cita: 'art. 3 inc. c',           tasa: 0.015, sucesion: true },
        { id: 'testamento', cita: 'art. 3 inc. d',           tasa: 0.015, sucesion: true },
        { id: 'hipotecas',  cita: 'art. 3 inc. f',           tasa: 0.015 },
        { id: 'recurso',    cita: 'art. 3 inc. g',           tasa: 0.015 },
        { id: 'tercerias',  cita: 'art. 3 inc. h',           tasa: 0.015 },
        { id: 'extranha',   cita: 'art. 4 inc. g, 2ª parte', tasa: 0.0075, sucesion: true },
        {
            id: 'concursal',
            cita: 'art. 3, tasa especial (Ley 25.563)',
            // ESTA SI ES PROGRESIVA, a diferencia de la escala de mediación:
            // 0,75 % de los créditos verificados, y sobre lo que pase de
            // $100.000.000, el 0,25 %. Una alícuota sola no la representa.
            //
            // EL PISO DE $100.000.000 SE TOMA TEXTUAL. Está escrito en 2002 y
            // quedó congelado, y la decisión de Javier es no interpretar su
            // erosión: la herramienta aplica la ley como está escrita.
            tramos: [{ hasta: 100000000, tasa: 0.0075 }, { hasta: Infinity, tasa: 0.0025 }]
        },
        { id: 'fija', cita: 'art. 6', fija: true }
    ];

    // =======================================================================
    // LO QUE SE PREGUNTA: QUE JUICIO ES.
    //
    // Cada supuesto nombra una alícuota y una lista de ítems, y cada ítem
    // nombra una base del art. 4. `pide` es el rótulo del número que hay que
    // cargar y va PEGADO AL CAMPO DE IMPORTE, con la cita al lado: es el
    // pedido de Javier ---"cuando elegís laboral, donde va importe te muestra
    // monto de la condena art. 4 inc. i, en lugar de que el selector tenga un
    // texto gigante"---.
    //
    // DOS ITEMS PUEDEN APUNTAR A LA MISMA BASE, y eso no es una redundancia
    // sino el arreglo de una regresión: "Bien mueble o derecho" y "Dinero del
    // acervo" son los dos el inc. d ---el art. 4 inc. g manda valuar los
    // bienes del sucesorio por los incs. c y d--- y son dos ítems porque nadie
    // busca la plata de una sucesión abajo de "bienes muebles". Mismo número,
    // misma cita, encontrable.
    //
    // NO HAY UN ITEM POR CADA CRUCE POSIBLE Y NO TIENE QUE HABERLO: los cruces
    // que la ley no admite simplemente no están nombrados. Que la tercería
    // pueda ir al 3 % no se impide con un filtro: no existe la manera de
    // pedirlo.
    // =======================================================================
    var SUPUESTOS = [
        {
            id: 'demanda',
            rotulo: 'Demanda por dinero o bienes',
            resumen: 'El juicio contencioso corriente: daños, cobro de pesos, escrituración, restitución, división de condominio. Alícuota general del art. 2.',
            que: 'pretensión', ques: 'pretensiones', rotuloColumna: 'Qué se reclama',
            alicuota: 'general',
            items: [
                { id: 'sumas', rotulo: 'Sumas de dinero', base: 'sumas',
                  pide: 'Monto reclamado',
                  hint: 'El monto de la pretensión al ingresar la tasa: capital más actualización, multa e intereses reclamados. Si la obligación es en moneda extranjera, convertida al cambio vigente ese día.' },
                { id: 'inmueble', rotulo: 'Un inmueble', base: 'inmueble',
                  pide: 'Valuación fiscal',
                  hint: 'La valuación fiscal actualizada, salvo que del negocio jurídico sobre el que versa el litigio surja un mayor valor: entonces ése.' },
                { id: 'mueble', rotulo: 'Un bien mueble o un derecho', base: 'muebles',
                  pide: 'Valor del bien o del derecho',
                  hint: 'El monto que fija el juez, previa estimación de la parte y vista al fisco.' }
            ]
        },
        {
            id: 'sucesion',
            rotulo: 'Sucesión',
            resumen: 'Reducida al 50 % por el art. 3 inc. c. Los bienes se valúan por los incs. c y d del art. 4, y se pueden cargar todos juntos para tener el total de una mirada, o de a uno si se va pagando por bien a medida que se inscribe.',
            que: 'bien', ques: 'bienes', rotuloColumna: 'Qué bien',
            alicuota: 'sucesorio',
            // La casilla por bien: el art. 4 inc. g, 2ª parte, vuelve a reducir
            // a la mitad los bienes ubicados fuera de la jurisdicción nacional.
            // Es POR BIEN y no del juicio: una sucesión puede tener un inmueble
            // acá y otro afuera.
            extranha: true,
            // La casilla del juicio, que NO MUEVE NINGUN NUMERO: el art. 3
            // inc. d lleva la misma reducción al 50 % que el inc. c. Está para
            // que el imprimible cite el inciso correcto, y lo dice al lado.
            testamento: true,
            items: [
                { id: 'inmueble', rotulo: 'Inmueble', base: 'inmueble',
                  pide: 'Valuación fiscal',
                  hint: 'La valuación fiscal actualizada, salvo que del expediente surja un mayor valor.' },
                { id: 'mueble', rotulo: 'Bien mueble o derecho', base: 'muebles',
                  pide: 'Valor del bien',
                  hint: 'La valuación del automóvil, la certificación contable de la participación societaria o la valuación agregada al expediente.' },
                { id: 'dinero', rotulo: 'Dinero del acervo', base: 'muebles',
                  pide: 'Importe depositado o percibido',
                  hint: 'La plata del acervo es un bien mueble del inc. d y no una suma reclamada del inc. a, porque el art. 4 inc. g manda valuar los bienes del sucesorio por los incs. c y d. Va acá el saldo de las cuentas, los fondos depositados en el expediente y los cheques que se libren.' }
            ]
        },
        {
            id: 'desalojo',
            rotulo: 'Desalojo',
            resumen: 'La base son seis meses, y los multiplica la pantalla: se carga uno solo.',
            que: 'pretensión', ques: 'pretensiones', rotuloColumna: 'Qué desalojo',
            alicuota: 'general',
            items: [
                { id: 'civil', rotulo: 'Civil', base: 'alquiler',
                  pide: 'Un mes de alquiler',
                  hint: 'Poné <strong>un</strong> canon actualizado: la base legal son seis meses y los multiplica la pantalla.' },
                { id: 'laboral', rotulo: 'Laboral', base: 'salario',
                  pide: 'Un mes del último salario',
                  hint: 'Poné <strong>un</strong> salario, el último: la base legal son seis meses y los multiplica la pantalla. Es el desalojo del inmueble concedido en virtud del contrato de trabajo.' }
            ]
        },
        {
            id: 'laboral',
            rotulo: 'Laboral',
            resumen: 'Alícuota general del art. 2. El trabajador está exento por el art. 13 inc. e: la tasa la soporta la demandada vencida.',
            que: 'pretensión', ques: 'pretensiones', rotuloColumna: 'Qué se reclama',
            alicuota: 'general',
            items: [
                { id: 'condena', rotulo: 'Monto de la condena', base: 'condena',
                  pide: 'Monto de la condena',
                  hint: 'Según la primera liquidación firme, actualizado al día en que se ingresa la tasa. Si al liquidarla ya se fijó el monto del proceso a los fines regulatorios y es mayor, va ése.' }
            ]
        },
        {
            id: 'concurso',
            rotulo: 'Concurso o quiebra',
            resumen: 'Los dos salen del art. 4 inc. e, y la alícuota no es la misma: el concurso preventivo tiene la tasa especial y progresiva de la Ley 25.563; la quiebra, la general del art. 2.',
            que: 'pretensión', ques: 'pretensiones', rotuloColumna: 'Cuál de los dos',
            items: [
                { id: 'creditos', rotulo: 'Concurso preventivo', base: 'creditos', alicuota: 'concursal',
                  pide: 'Créditos verificados',
                  hint: 'El importe de todos los créditos verificados comprendidos en el acuerdo preventivo.' },
                { id: 'quiebra', rotulo: 'Quiebra', base: 'quiebra', alicuota: 'general',
                  pide: 'Producido de la liquidación',
                  hint: 'El importe que arroje la liquidación de los bienes. Vale igual para el concurso con liquidación administrativa.' }
            ]
        },
        {
            id: 'recurso',
            rotulo: 'Recurso directo contra el Estado',
            resumen: 'Contra el Poder Ejecutivo nacional, provincial o municipal. Reducida al 50 % por el art. 3 inc. g. Si la resolución que se apela no tiene monto, el juicio es de monto indeterminable y va con el supuesto de abajo.',
            que: 'pretensión', ques: 'pretensiones', rotuloColumna: 'Qué se recurre',
            alicuota: 'recurso',
            items: [
                { id: 'apelado', rotulo: 'Resolución que se apela', base: 'apelado',
                  pide: 'Monto de la resolución',
                  hint: 'El monto que surja de la resolución que se apela o se cuestiona.' }
            ]
        },
        {
            id: 'terceria',
            rotulo: 'Tercería',
            resumen: 'De dominio o de mejor derecho: el art. 3 inc. h las reduce al 50 % sin distinguir. Se liquida como un juicio independiente del principal (art. 7).',
            que: 'pretensión', ques: 'pretensiones', rotuloColumna: 'Qué se pretende',
            alicuota: 'tercerias',
            items: [
                { id: 'terceria', rotulo: 'Crédito o bien', base: 'terceria',
                  pide: 'Valor del crédito o del bien',
                  hint: 'El valor del crédito o del bien respecto del cual se pretende la prioridad.' }
            ]
        },
        {
            id: 'mensura',
            rotulo: 'Mensura o deslinde',
            resumen: 'Reducida al 50 % por el art. 3 inc. b.',
            que: 'pretensión', ques: 'pretensiones', rotuloColumna: 'Qué se mensura',
            alicuota: 'mensura',
            items: [
                { id: 'inmueble', rotulo: 'Inmueble', base: 'inmueble',
                  pide: 'Valuación fiscal',
                  hint: 'La valuación fiscal actualizada del inmueble mensurado o deslindado.' }
            ]
        },
        {
            id: 'hipoteca',
            rotulo: 'Reinscripción de hipoteca o prenda',
            resumen: 'Reducida al 50 % por el art. 3 inc. f. Vale igual para el oficio librado a ese efecto por un juez de otra jurisdicción.',
            que: 'pretensión', ques: 'pretensiones', rotuloColumna: 'Qué se reinscribe',
            alicuota: 'hipotecas',
            items: [
                { id: 'hipoteca', rotulo: 'Hipoteca o prenda', base: 'hipoteca',
                  pide: 'Suma garantizada',
                  hint: 'El importe de la suma garantizada con la hipoteca o la prenda.' }
            ]
        },
        {
            id: 'fija',
            rotulo: 'Monto indeterminable o juicio sin valor pecuniario',
            resumen: 'Los dos pagan la misma suma fija, que actualiza la Corte. Lo que cambia es cuándo, y por eso «Cuándo se paga» trae los dos momentos.',
            que: 'pretensión', ques: 'pretensiones', rotuloColumna: 'Qué se liquida',
            alicuota: 'fija',
            items: [
                { id: 'fija', rotulo: 'Suma fija', base: 'fija',
                  pide: 'La fija la Corte',
                  // EL HINT DOBLE, que es como lo pidió Javier: "el selector es
                  // el mismo, el hint acá es doble: si es art. 5 blablá y si es
                  // art. 6 blablá".
                  hint: '<strong>Si el monto es indeterminable</strong> (art. 5), esta suma se abona <strong>a cuenta</strong> y la tasa se completa al terminar el proceso. <strong>Si el juicio no tiene valor pecuniario</strong> (art. 6), es la tasa entera y definitiva, al inicio de las actuaciones.' }
            ]
        }
    ];

    // Cuándo se paga: art. 9. La oportunidad depende del supuesto, no del
    // número, y en dos casos depende del EJE 2 y no del 1 ---un inmueble se
    // paga al iniciar si es un juicio común y al inscribir la declaratoria si
    // es de una sucesión---, así que la alícuota se mira primero.
    var MOMENTOS_ALICUOTA = {
        sucesorio:  ['art. 9 inc. d', 'Al inscribir la declaratoria de herederos o el testamento aprobado judicialmente.'],
        testamento: ['art. 9 inc. d', 'Al inscribir la declaratoria de herederos o el testamento aprobado judicialmente.'],
        extranha:   ['art. 9 inc. d', 'Al inscribir la declaratoria de herederos o el testamento aprobado judicialmente.'],
        recurso:    ['art. 9 inc. h', 'Dentro del quinto día de recibidos los autos en el tribunal del recurso, previa intimación por cédula.']
    };
    var MOMENTOS_BASE = {
        quiebra:  ['art. 9 inc. b', 'Antes de cualquier pago o distribución de fondos provenientes de la venta de los bienes. La liquida el síndico bajo supervisión del secretario.'],
        creditos: ['art. 9 inc. b', 'Al notificarse el auto de homologación del acuerdo, o la resolución que declara verificados los créditos después. La liquida el síndico bajo supervisión del secretario.'],
        hipoteca: ['art. 9 inc. c', 'Toda la tasa en el acto de iniciarse las actuaciones.'],
        condena:  ['art. 9 inc. g', 'Una vez firme la sentencia de condena y la primera liquidación que deba practicarse.'],
        salario:  ['art. 9 inc. g', 'Una vez firme la sentencia de condena y la primera liquidación que deba practicarse.']
    };
    var MOMENTO_POR_OMISION =
        ['art. 9 inc. a', 'Toda la tasa en el acto de iniciación de las actuaciones, con reajuste posterior si la liquidación definitiva arroja un mayor valor.'];

    // LOS DOS MOMENTOS DE LA SUMA FIJA, y van LOS DOS. La base es una sola
    // porque el número es uno solo; el momento es lo único que los separa, y
    // decir uno solo sería elegir por el que lee cuál de los dos supuestos es
    // el suyo.
    var MOMENTOS_FIJA = [
        ['art. 5', 'Si el monto es <strong>indeterminable</strong>: la suma del art. 6 se paga al iniciar y es <strong>a cuenta</strong>. La tasa se completa al terminar el proceso: dentro de los cinco días de la sentencia definitiva, del desistimiento, del allanamiento, de la transacción, de la conciliación o de la caducidad de la instancia, el secretario intima por cédula a estimar el valor reclamado.'],
        ['art. 6', 'Si el juicio <strong>no tiene valor pecuniario</strong>: la suma fija, entera y definitiva, al inicio de las actuaciones.']
    ];

    // LOS DOS SUPUESTOS DEL ART. 9 QUE EL ART. 4 NO TIENE, y que por eso no son
    // ni una base ni una alícuota: la separación de bienes (inc. e) y la
    // petición de herencia (inc. f). Los dos se cargan igual ---el valor de la
    // cosa, recortado por la titularidad--- y la pantalla NO puede distinguir
    // ninguno de los dos de un condominio común, que se carga exactamente
    // igual. Clavarles un momento sería inventarlo.
    var MOMENTO_DIVISION = ['art. 9 incs. e y f',
        'Si lo que se divide es una sociedad conyugal, al promover su liquidación, y ' +
        '<strong>cada cónyuge puede pagar su cuota parte</strong>. Si es una petición de ' +
        'herencia, al determinarse el valor de la parte del peticionario. Aparece porque ' +
        'hay una titularidad menor al 100 %: de un condominio común, que se carga igual, ' +
        'la pantalla no puede distinguirlos.'];

    // -----------------------------------------------------------------------
    // EL ART. 8, que no es un tercer eje sino una clasificación de la línea.
    //
    // "Las ampliaciones de demanda y las reconvenciones estarán sujetas a la
    // tasa, como si fueran juicios independientes del principal." Y el art. 7
    // dice lo mismo de las tercerías.
    //
    // EL PRINCIPAL NO SE DECLARA: es lo que se da por sentado, y por eso su
    // desplegable está escondido mientras la línea sea del principal.
    //
    // LA RECONVENCION SE SACO EL 31/8 y no por simplificar. Javier: "es en
    // realidad un juicio principal para el demandado y no tiene sentido
    // sumarlo, la que paga el actor y la que paga el demandado son distintas,
    // y no van en la misma liquidación".
    //
    // No cambia ningún número: cambia cómo se PRESENTAN. Sumarlas para saber
    // cuánto hay que integrar en total es útil ---es lo que uno viene a
    // buscar---, pero el imprimible tiene que mostrarlas separadas o dice algo
    // que la ley no dice: que se liquidan juntas.
    // -----------------------------------------------------------------------
    var CLASES = [
        { id: 'principal',  rotulo: 'Juicio principal',      cita: '' },
        { id: 'ampliacion', rotulo: 'Ampliación de demanda', cita: 'art. 8' }
    ];

    function porId(lista, id) {
        for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
        return null;
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

    function analizarNumero(raw) {
        var s = String(raw === null || raw === undefined ? '' : raw);

        // Lo que viene pegado alrededor del número: espacios de todo tipo
        // ---incluido el fino y el no rompible, que es el que mete Excel---,
        // el símbolo, la sigla y el apóstrofo de miles.
        s = s.replace(/[\s   ']/g, '')
             .replace(/^(ars|\$)+/i, '')
             .replace(/(ars|\$|pesos)+$/i, '');

        if (!s) return { valor: NaN, vacio: true, aviso: '' };
        if (s.charAt(0) === '-') return { valor: NaN, aviso: AVISO_NEGATIVO };
        if (!/^[0-9.,]+$/.test(s)) return { valor: NaN, aviso: AVISO_IMPORTE };

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
            return { valor: NaN, aviso: AVISO_IMPORTE };
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
            if (!/^\d{1,3}$/.test(grupos[0])) return { valor: NaN, aviso: AVISO_IMPORTE };
            for (var i = 1; i < grupos.length; i++) {
                if (!/^\d{3}$/.test(grupos[i])) return { valor: NaN, aviso: AVISO_IMPORTE };
            }
            entero = grupos.join('');
        }
        if (entero === '' && decimales !== '') entero = '0';
        if (!/^\d+$/.test(entero)) return { valor: NaN, aviso: AVISO_IMPORTE };
        if (decimal && !/^\d+$/.test(decimales)) return { valor: NaN, aviso: AVISO_IMPORTE };

        var valor = parseFloat(entero + (decimal ? '.' + decimales : ''));
        if (!isFinite(valor)) return { valor: NaN, aviso: AVISO_IMPORTE };
        return { valor: valor, aviso: '' };
    }

    // El contrato de siempre, encima del analizador: NaN si no se puede leer.
    function parseFlexibleNumber(raw) { return analizarNumero(raw).valor; }

    function numero(raw) {
        var n = parseFlexibleNumber(raw);
        return isNaN(n) ? 0 : n;
    }

    // Devuelve la parte de la cosa que le toca a quien paga, como fracción de 1.
    //
    // EL CAMPO VACIO VALE 100 %, y eso se decidió el 27/8/2026 arreglando un
    // bug: antes un campo que nadie había tocado se parseaba como NaN, el
    // `|| 0` lo volvía CERO, y un inmueble de $100.000.000 mostraba $0,00 sin
    // que nadie hubiera declarado nada.
    //
    // ESCRIBIR `0` SIGUE DANDO CERO, y esa parte no es un bug: si el causante
    // no era titular no se tributa, y si ya se pagó se puede pedir la
    // devolución. Lo que estaba mal era que NO HABER ESCRITO NADA se leyera
    // igual que haber escrito un cero. Hay un caso de prueba pegado a cada uno
    // de los dos, para que el arreglo de uno no se lleve puesto el otro.
    //
    // Texto que no se puede leer SIGUE DANDO CERO ---eso sí es haber tocado el
    // campo, y no se adivina--- pero lo dice.
    var AVISO_TITULARIDAD = 'No se entiende esa titularidad. Se escribe 50, 50 % o 1/2.';

    function analizarTitularidad(value) {
        if (value === null || value === undefined || !String(value).trim()) {
            return { valor: 1, vacio: true, aviso: '' };
        }
        var s = String(value).trim();
        var r;
        if (s.charAt(s.length - 1) === '%') {
            r = parseFlexibleNumber(s.slice(0, -1)) / 100;
        } else if (s.indexOf('/') > -1) {
            var partes = s.split('/');
            var den = parseFlexibleNumber(partes[1]);
            r = (partes.length === 2 && den) ? parseFlexibleNumber(partes[0]) / den : NaN;
        } else {
            r = parseFlexibleNumber(s) / 100;
        }
        if (isNaN(r)) return { valor: 0, aviso: AVISO_TITULARIDAD };
        return { valor: r, aviso: '' };
    }

    function parseTitularidad(value) { return analizarTitularidad(value).valor; }

    // -----------------------------------------------------------------------
    // LA CUENTA, en una función sola y sin tocar el DOM: es lo que consulta el
    // banco de pruebas y lo que consume el imprimible.
    //
    //     imponible = importe x factor de la base x titularidad
    //     tasa      = alicuota(imponible) x (1 + sobretasa)
    //
    // RECIBE UNA BASE DEL ART. 4 Y UNA ALICUOTA DE LOS ARTS. 2 Y 3, y no sabe
    // que existen los supuestos: eso es lo que hace que invertir la pregunta de
    // la pantalla no pueda mover un número.
    // -----------------------------------------------------------------------
    function porEscala(monto, tramos) {
        var total = 0, piso = 0;
        for (var i = 0; i < tramos.length && monto > piso; i++) {
            var techo = Math.min(monto, tramos[i].hasta);
            total += (techo - piso) * tramos[i].tasa;
            piso = techo;
        }
        return total;
    }

    function liquidar(entrada) {
        var base = porId(BASES, entrada.base);
        var ali = porId(ALICUOTAS, entrada.alicuota);
        if (!base || !ali) return null;

        // La línea de monto fijo se va por arriba de toda la cuenta: no hay
        // monto imponible al que aplicarle nada. Se declara `imponible: 0` a
        // propósito y no `imponible: montoFijo`, porque el monto imponible es
        // una figura del art. 4 y estos supuestos justamente no la tienen:
        // ponerlos ahí ensuciaría el total del imponible y la alícuota
        // efectiva con un número que no es una base.
        if (base.montoFijo) {
            var fijo = numero(entrada.montoFijo);
            return {
                nombre: entrada.nombre || '',
                item: entrada.item || null,
                clase: porId(CLASES, entrada.clase) || CLASES[0],
                base: base, alicuota: ali, montoFijo: true,
                importe: 0, factor: 1, titularidad: 1,
                llevaTitularidad: false, llevaSobretasa: false,
                imponible: 0, tasaPelada: fijo,
                puntosSobretasa: 0, sobretasa: 0,
                tasa: fijo, efectiva: 0,
                aviso: '',
                aporta: fijo > 0
            };
        }

        var leido = analizarNumero(entrada.importe);
        var importe = isNaN(leido.valor) ? 0 : leido.valor;
        var factor = base.factor || 1;
        var llevaTitularidad = !!base.divisible;
        var llevaSobretasa = !!ali.sucesion && base.id === 'inmueble';

        var tit = llevaTitularidad ? analizarTitularidad(entrada.titularidad)
                                   : { valor: 1, aviso: '' };
        var imponible = importe * factor * tit.valor;
        var tasaPelada = ali.tramos ? porEscala(imponible, ali.tramos) : imponible * ali.tasa;

        var puntosSobretasa = (llevaSobretasa && entrada.conSobretasa)
            ? numero(entrada.sobretasa) : 0;
        var sobretasa = tasaPelada * (puntosSobretasa / 100);

        return {
            nombre: entrada.nombre || '',
            // El item viaja SOLO para el imprimible, que tiene que decir con
            // que nombre se pidio el numero ---"Dinero del acervo" y no "art. 4
            // inc. d"---. La cuenta no lo mira: `liquidar()` sigue trabajando
            // con la base y la alicuota, y por eso puede faltar.
            item: entrada.item || null,
            clase: porId(CLASES, entrada.clase) || CLASES[0],
            base: base,
            alicuota: ali,
            importe: importe,
            factor: factor,
            titularidad: tit.valor,
            llevaTitularidad: llevaTitularidad,
            llevaSobretasa: llevaSobretasa,
            imponible: imponible,
            tasaPelada: tasaPelada,
            puntosSobretasa: puntosSobretasa,
            sobretasa: sobretasa,
            tasa: tasaPelada + sobretasa,
            // La alícuota efectiva de la línea: con la escala concursal no es
            // ninguna de las dos del texto, y con la sobretasa tampoco es la
            // del art. 3. Es el número que hay que poder mirar.
            efectiva: imponible > 0 ? (tasaPelada + sobretasa) / imponible : 0,
            // El importe manda: si no se pudo leer, no hay nada que decir de
            // la titularidad todavía.
            aviso: leido.aviso || tit.aviso,
            aporta: importe > 0
        };
    }

    // =======================================================================
    // DEL SUPUESTO A LAS DOS TABLAS.
    //
    // Es la única función que traduce lo que se pregunta a lo que se calcula, y
    // por eso está sola y es corta: si un día un supuesto tiene que nombrar
    // otra alícuota, se cambia acá y en ningún otro lado.
    // =======================================================================
    function itemDe(sup, itemId) { return porId(sup.items, itemId) || sup.items[0]; }

    function alicuotaDe(sup, item, banderas) {
        // El bien fuera de la jurisdicción nacional manda sobre todo lo demás:
        // el art. 4 inc. g, 2ª parte, vuelve a reducir a la mitad la del inc. c.
        if (sup.extranha && banderas.extranha) return 'extranha';
        // El testamento de extraña jurisdicción NO mueve el número ---misma
        // reducción al 50 %---: cambia la cita del imprimible al inc. d.
        if (sup.testamento && banderas.testamento) return 'testamento';
        return item.alicuota || sup.alicuota;
    }

    // =======================================================================
    // LO QUE HACIA calcular() CONTRA EL FORMULARIO, SIN EL FORMULARIO.
    //
    // Hasta aca, todo es copia de tasa.html. Desde aca, es la misma
    // composicion que la pantalla hacia leyendo el DOM --leerRenglon(), el
    // bucle de totales de calcular() y pintarMomentos()-- escrita contra un
    // objeto. No agrega ninguna regla: si la pantalla y esto discrepan,
    // scripts/verificar-tasa.mjs lo dice.
    //
    // EL CASO tiene la forma del enlace ya leido (decodificarCaso):
    //
    //     { supuesto, testamento, montoFijo,
    //       renglones: [{ item, nombre, clase, importe, titularidad,
    //                     extranha, conSobretasa, sobretasa }] }
    //
    // Lo que falta vale LO QUE VALE EN EL FORMULARIO RECIEN ABIERTO, y no
    // otra cosa: la sobretasa tildada y en '5', la clase 'principal', el
    // importe y la titularidad vacios. Es lo que hace que un caso armado a
    // mano y uno que viene de la pantalla den lo mismo.
    // =======================================================================
    function supuestoDe(id) { return porId(SUPUESTOS, id) || SUPUESTOS[0]; }

    function cuentasDelCaso(caso) {
        caso = caso || {};
        var sup = supuestoDe(caso.supuesto);
        var entradas = (caso.renglones || []).map(function (r) {
            r = r || {};
            var item = itemDe(sup, r.item);
            var banderas = { extranha: !!r.extranha, testamento: !!caso.testamento };
            return {
                supuesto: sup,
                item: item,
                base: item.base,
                alicuota: alicuotaDe(sup, item, banderas),
                nombre: r.nombre || '',
                clase: r.clase || 'principal',
                importe: r.importe === undefined || r.importe === null ? '' : r.importe,
                titularidad: r.titularidad === undefined || r.titularidad === null ? '' : r.titularidad,
                conSobretasa: r.conSobretasa === undefined ? true : !!r.conSobretasa,
                sobretasa: r.sobretasa === undefined || r.sobretasa === null ? '5' : r.sobretasa,
                // Sale de un dato solo del caso y no de cada linea: es un dato
                // del sistema ---lo fija la Corte--- y no del renglon.
                montoFijo: caso.montoFijo === undefined || caso.montoFijo === null ? '' : caso.montoFijo
            };
        });
        var cuentas = entradas.map(function (e) { return liquidar(e); });
        return { supuesto: sup, entradas: entradas, cuentas: cuentas };
    }

    // El bucle de totales de calcular(), tal cual.
    function totales(cuentas) {
        var imponible = 0, tasa = 0, pelada = 0, sobretasa = 0;
        var cargados = 0, fijos = 0, avisos = 0, escalas = 0;
        var alicuotasVistas = [];
        cuentas.forEach(function (c) {
            if (!c) return;
            imponible += c.imponible;
            tasa += c.tasa;
            pelada += c.tasaPelada;
            sobretasa += c.sobretasa;
            if (c.aporta) {
                cargados++;
                if (alicuotasVistas.indexOf(c.alicuota.id) < 0) alicuotasVistas.push(c.alicuota.id);
                if (c.alicuota.tramos) escalas++;
            }
            if (c.montoFijo) fijos++;
            if (c.aviso) avisos++;
        });

        var art8 = cuentas.filter(function (c) { return c && c.aporta && c.clase.id !== 'principal'; });

        return {
            imponible: imponible, tasa: tasa, pelada: pelada, sobretasa: sobretasa,
            cargados: cargados, fijos: fijos, avisos: avisos, escalas: escalas,
            art8: art8.length,
            alicuotas: alicuotasVistas.length,
            unica: cargados === 1 ? cuentas.filter(function (c) { return c && c.aporta; })[0] : null
        };
    }

    // Cuando se paga, del art. 9: lo que decidia pintarMomentos() antes de
    // escribir la lista. Devuelve los pares [cita, texto] de las tablas de
    // arriba, en el orden en que la pantalla los muestra.
    function momentos(cuentas) {
        var vistos = [];
        var lista = [];
        function sumar(m) {
            if (vistos.indexOf(m[0]) > -1) return;
            vistos.push(m[0]);
            lista.push(m);
        }
        cuentas.forEach(function (c) {
            if (!c) return;
            // La suma fija tiene DOS momentos y van los dos: el número es uno
            // solo y lo único que separa al art. 5 del art. 6 es cuándo se
            // paga. Decir uno sería elegir por el que lee cuál es su caso.
            if (c.base.montoFijo) { MOMENTOS_FIJA.forEach(sumar); return; }
            sumar(MOMENTOS_ALICUOTA[c.alicuota.id] || MOMENTOS_BASE[c.base.id] || MOMENTO_POR_OMISION);
        });

        var hayDivision = cuentas.some(function (c) {
            return c && c.llevaTitularidad && c.titularidad !== 1;
        });
        if (hayDivision) lista.push(MOMENTO_DIVISION);
        return lista;
    }

    // -----------------------------------------------------------------------
    // El monto fijo, de data/tasa-monto-fijo.json. Copia de vigenteAlDia() de
    // la pantalla, con un solo agregado: `hoy` se puede pasar, porque un
    // conector puede preguntar por la demanda presentada otro dia. Sin `hoy`
    // es exactamente lo de la pantalla, incluida la fecha en UTC.
    //
    // Se elige el último valor cuya VIGENCIA ya empezó, y no el último del
    // archivo. La diferencia aparece el día que se carga un valor por
    // adelantado, que acá es el caso normal: la Acordada 15/2022 se publicó en
    // mayo y rige desde julio.
    // -----------------------------------------------------------------------
    function montoFijoVigente(valores, hoy) {
        hoy = hoy || new Date().toISOString().slice(0, 10);
        var elegido = null;
        for (var i = 0; i < valores.length; i++) {
            var v = valores[i];
            if (typeof v.valor !== 'number' || !v.vigencia) continue;
            if (v.vigencia <= hoy) elegido = v;
        }
        return elegido;
    }

    // La URL se lee AL LLAMAR y no al cargar el archivo: es lo que deja
    // reescribir CONFIG en el medio. Rompe-caché: sin esto un valor nuevo
    // puede tardar en aparecer y nadie se entera.
    function cargarMontoFijo() {
        return fetch(CONFIG.JSON_MONTO_FIJO_URL + '?v=' + Date.now())
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            });
    }

    // =======================================================================
    // LA CAPA DE LOS QUE NO TIENEN A NADIE LEYENDO.
    //
    // Mismo caso, misma cuenta --llama a cuentasDelCaso() y nada mas--, pero
    // con un dato faltante, ilegible o fuera de rango contesta `problema` y
    // no trae total. La pantalla puede poner el aviso al lado del numero; un
    // conector no, y un total con un renglon que aporto cero en silencio es un
    // numero plausible y equivocado.
    //
    // LOS MONTOS PUEDEN VENIR COMO NUMERO, y eso necesita un cuidado que la
    // pantalla no: el lector de importes es de texto y lee "1234.567" como un
    // millon y pico, porque un punto con tres digitos atras es de miles. Un numero
    // de JavaScript no tiene separador de miles, asi que se le escribe la coma
    // decimal antes de pasarlo: String(n) con la coma da de vuelta n exacto.
    // =======================================================================
    function textoDeNumero(n) {
        if (typeof n !== 'number') return n;
        // NaN, Infinity y la notacion 1e+21 no son importes que el lector
        // entienda: se rechazan aca, con el motivo, en vez de leerse mal.
        if (!isFinite(n) || /e/i.test(String(n))) return null;
        return String(n).replace('.', ',');
    }

    function vacio(v) {
        return v === undefined || v === null || (typeof v === 'string' && !v.trim());
    }

    function liquidarCaso(caso) {
        function sinResultado(problema) {
            return { problema: problema, supuesto: null, entradas: null, cuentas: null, totales: null, momentos: null };
        }
        if (!caso || typeof caso !== 'object') return sinResultado('Falta el caso.');

        var sup = porId(SUPUESTOS, caso.supuesto);
        if (!sup) {
            return sinResultado('No existe el supuesto «' + caso.supuesto + '». Son: ' +
                SUPUESTOS.map(function (s) { return s.id; }).join(', ') + '.');
        }
        if (!Array.isArray(caso.renglones) || !caso.renglones.length) {
            return sinResultado('Falta al menos un renglón con lo que se liquida.');
        }

        var renglones = [];
        for (var i = 0; i < caso.renglones.length; i++) {
            var r = caso.renglones[i] || {};
            var n = 'Renglón ' + (i + 1) + ': ';
            var item = porId(sup.items, r.item);
            if (!item) {
                return sinResultado(n + 'el supuesto «' + sup.id + '» no tiene el ítem «' + r.item +
                    '». Tiene: ' + sup.items.map(function (it) { return it.id; }).join(', ') + '.');
            }
            if (r.clase !== undefined && !porId(CLASES, r.clase)) {
                return sinResultado(n + 'la clase tiene que ser ' +
                    CLASES.map(function (c) { return c.id; }).join(' o ') + '.');
            }
            var base = porId(BASES, item.base);
            var copia = {};
            for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) copia[k] = r[k];

            if (!base.montoFijo) {
                if (vacio(r.importe)) return sinResultado(n + 'falta el importe.');
                copia.importe = textoDeNumero(r.importe);
                if (copia.importe === null) return sinResultado(n + 'el importe no es un número que se pueda leer.');
                if (typeof r.importe === 'number' && r.importe < 0) return sinResultado(n + AVISO_NEGATIVO);
            }
            if (!vacio(r.titularidad)) {
                copia.titularidad = textoDeNumero(r.titularidad);
                if (copia.titularidad === null) return sinResultado(n + 'la titularidad no es un número que se pueda leer.');
                if (typeof r.titularidad === 'number' && r.titularidad < 0) return sinResultado(n + 'la titularidad no puede ser negativa.');
            }
            if (!vacio(r.sobretasa)) {
                copia.sobretasa = textoDeNumero(r.sobretasa);
                if (copia.sobretasa === null) return sinResultado(n + 'la sobretasa no es un número que se pueda leer.');
                var puntos = analizarNumero(copia.sobretasa);
                if (isNaN(puntos.valor)) return sinResultado(n + 'sobretasa: ' + puntos.aviso);
            }
            renglones.push(copia);
        }

        var montoFijo = textoDeNumero(caso.montoFijo);
        var cuenta = cuentasDelCaso({
            supuesto: sup.id,
            testamento: caso.testamento,
            montoFijo: montoFijo === null ? '' : montoFijo,
            renglones: renglones
        });

        for (var j = 0; j < cuenta.cuentas.length; j++) {
            var c = cuenta.cuentas[j];
            var m = 'Renglón ' + (j + 1) + ': ';
            if (c.aviso) return sinResultado(m + c.aviso);
            if (c.montoFijo && !(c.tasa > 0)) {
                return sinResultado(m + 'falta el monto fijo del art. 6, que lo fija la Corte por acordada.');
            }
            // Fuera de rango: la titularidad es la parte de la cosa que le toca
            // a quien paga, y nadie tiene mas que la cosa entera.
            if (c.llevaTitularidad && c.titularidad > 1) {
                return sinResultado(m + 'la titularidad pasa del 100 %.');
            }
        }

        var t = totales(cuenta.cuentas);
        if (t.cargados === 0) return sinResultado('No hay ningún importe mayor a cero: no hay nada que liquidar.');

        return {
            problema: null,
            supuesto: cuenta.supuesto,
            entradas: cuenta.entradas,
            cuentas: cuenta.cuentas,
            totales: t,
            momentos: momentos(cuenta.cuentas)
        };
    }

    // La API publica. Las tablas van tal cual --la pantalla las dibuja, el
    // conector las lista-- y las funciones de abajo son las que consume
    // tasa.html desde el 29/10/2026. `Tasa23898`, el nombre que la pantalla
    // expone para el banco de pruebas del navegador, sigue existiendo alla y
    // apunta a estas mismas funciones.
    var API = {
        CONFIG: CONFIG,
        BASES: BASES,
        ALICUOTAS: ALICUOTAS,
        SUPUESTOS: SUPUESTOS,
        CLASES: CLASES,
        MOMENTOS_ALICUOTA: MOMENTOS_ALICUOTA,
        MOMENTOS_BASE: MOMENTOS_BASE,
        MOMENTO_POR_OMISION: MOMENTO_POR_OMISION,
        MOMENTOS_FIJA: MOMENTOS_FIJA,
        MOMENTO_DIVISION: MOMENTO_DIVISION,
        porId: porId,
        analizarNumero: analizarNumero,
        parseFlexibleNumber: parseFlexibleNumber,
        numero: numero,
        analizarTitularidad: analizarTitularidad,
        parseTitularidad: parseTitularidad,
        porEscala: porEscala,
        liquidar: liquidar,
        supuestoDe: supuestoDe,
        itemDe: itemDe,
        alicuotaDe: alicuotaDe,
        cuentasDelCaso: cuentasDelCaso,
        totales: totales,
        momentos: momentos,
        montoFijoVigente: montoFijoVigente,
        cargarMontoFijo: cargarMontoFijo,
        liquidarCaso: liquidarCaso
    };

    if (typeof window !== 'undefined' && window) window.Tasa = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
