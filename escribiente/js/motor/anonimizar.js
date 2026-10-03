// ---------------------------------------------------------------------------
// Anonimizacion de escritos, resoluciones y expedientes.
//
// Portadas de otra herramienta propia, anterior a esta y fuera de este
// repositorio, donde llevan tiempo en uso. Los comentarios de cada regla vienen
// de alla y NO son decoracion: cada uno anota una fuga o una corrupcion de texto
// que efectivamente paso. Si vas a tocar un patron, leelo primero; casi todos
// parecen mejorables hasta que se entiende que evitan.
//
// EL DISENO, EN UNA FRASE: la maquina reemplaza lo que tiene forma inequivoca
// y le pregunta al humano por los nombres propios. No hay heuristica que
// distinga sola "Perez, Juan Carlos" (la parte, hay que ocultarla) de
// "Llambias, Jorge Joaquin" (doctrina, hay que conservarla) ni de "Buenos
// Aires, Astrea" (una editorial). Adivinar rompe el texto; no adivinar filtra.
// Preguntar es lo correcto, y es barato: son treinta segundos de casillas.
//
// Por que en tres pasos y en este orden, que costo una fuga:
//   1. identificadores de forma inequivoca, que consumen el token entero
//   2. los reemplazos que confirmo el usuario
//   3. reglas que miran nombres propios (tratamiento, domicilio, dominio)
// Con el orden al reves, un nombre como "Ficticio" pega DENTRO de
// "aficticio@ficticio-inventado.com" y lo deja como "a[PERSONA]@[PERSONA]-inventado.com":
// el patron de email ya no reconoce nada, y el dominio —que lleva el otro
// apellido— sobrevive entero.
// ---------------------------------------------------------------------------

// JS no es Python: `\w` es ASCII y `\b` se apoya en `\w`, asi que ninguno de
// los dos ve una tilde. Un patron con `\bAlvarez` no engancha "Álvarez" porque
// "Á" no es caracter de palabra y el limite de palabra no existe ahi. De ahi
// que las clases esten escritas a mano en todo el archivo.
//
// LAS LETRAS DE OTROS IDIOMAS, 27/9/2026. Eran solo las del castellano, y un
// apellido con "ö", "ç" o "ã" se cortaba ahi: se ofrecia "Camilo Amarant", y
// tildado dejaba "[PERSONA]ö Rivera", con el resto del nombre a la vista. Ahora
// son las de Latin-1 enteras (À-Ö, Ø-Þ y sus minusculas), que ya incluyen las
// de antes. Quedan afuera el × y el ÷, que estan en el medio del rango.
const MAY = 'A-ZÀ-ÖØ-Þ';
const MIN = 'a-zß-öø-ÿ';
const LETRA = MAY + MIN;

// Limite de palabra que si ve las tildes: o borde del texto, o algo que no es
// letra ni digito. Se captura y se devuelve en el reemplazo.
const ANTES = `(^|[^${LETRA}\\d])`;
const DESPUES = `(?=[^${LETRA}\\d]|$)`;

// Las particulas de un apellido o de un nombre compuesto: "Del Monte", "de la
// Fuente", "Maria de los Angeles", "Di Pietro". Tres de ellas —del, las, los—
// estan tambien en NO_SON_PERSONAS, porque sueltas en un titulo delatan que no
// hay un nombre; EN EL MEDIO de dos palabras de nombre, en cambio, son parte
// del nombre. Quien las consulta decide cual de las dos cosas mira.
const PARTICULAS = ['de', 'del', 'la', 'las', 'los', 'di', 'da', 'van', 'von'];
const PARTICULA = `(?:${PARTICULAS.join('|')})`;
// Para los patrones que corren SIN la bandera `i`: "de", "De" y "DE".
const PARTICULA_CUALQUIER_CAJA = `(?:${PARTICULAS
    .flatMap((p) => [p, p[0].toUpperCase() + p.slice(1), p.toUpperCase()])
    .join('|')})`;

function limpiarPalabra(palabra) {
    return sinTildes(palabra.replace(/[,.;:"“”'()]/g, '').toLowerCase());
}

function esParticula(palabra) {
    return PARTICULAS.includes(limpiarPalabra(palabra));
}

// Terminaciones que no lleva ningun nombre de persona y lleva casi todo el
// vocabulario de un titulo: "PRESCRIPCION ADQUISITIVA", "INTERPONE
// REVOCATORIA", "SOLICITA SUSPENSION". Agregar a mano cada una de esas palabras
// a NO_SON_PERSONAS es una lista que no termina nunca; la terminacion las
// alcanza a todas.
//
// LAS EXCEPCIONES SON NOMBRES, y sin ellas la regla se come uno: "Concepcion"
// y "Asuncion" son nombres de pila, y una parte que se llama asi dejaba de
// salir entera de la caratula.
const TERMINACION_QUE_NO_ES_NOMBRE = /(?:cion|sion|miento|mente|tivo|tiva|tivos|tivas|sivo|siva)$/;
const NOMBRES_CON_ESA_TERMINACION = new Set([
    'concepcion', 'asuncion', 'encarnacion', 'purificacion', 'anunciacion',
    'consolacion', 'ascension', 'visitacion',
]);

// Lo que delata que una palabra no es parte de un nombre de persona.
function noEsNombre(palabra) {
    const p = limpiarPalabra(palabra);
    if (NO_SON_PERSONAS.has(p)) return true;
    return TERMINACION_QUE_NO_ES_NOMBRE.test(p) && !NOMBRES_CON_ESA_TERMINACION.has(p);
}

// Las reglas de formulario y la de tratamiento corren con la bandera `i`
// —"DOMICILIO:" y "Domicilio:" son la misma etiqueta— y eso apaga la
// distincion entre mayuscula y minuscula tambien en el valor. La guarda va
// aparte, en una funcion, para que el valor siga teniendo que empezar en
// mayuscula: es lo unico que separa un nombre de una frase.
function empiezaEnMayuscula(valor) {
    return new RegExp(`^[ \\t]*[${MAY}]`).test(valor);
}

// Guarda de la regla de tratamiento, que es la unica que corre sobre PROSA con
// la bandera `i`: ahi no alcanza con la mayuscula inicial, porque "Sres. Los
// Abogados" la tiene. Devuelve cuantas palabras del principio son el nombre, o
// 0 si no hay nombre.
//
// POR QUE DEVUELVE UN LARGO Y NO UN SI O UN NO, 15/9/2026. La regla toma hasta
// cuatro palabras y no vuelve atras: si la guarda rechaza el calce, el nombre
// entero queda en el texto. Con "Dra. Lucia Ines Del Monte" en un solo
// renglon, el "Del" —que esta en NO_SON_PERSONAS— rechazaba todo, y un
// tratamiento seguido de un nombre salia completo. Ahora las particulas del
// medio ("Del", "de la") son parte del nombre, y lo que sobra al final ("Dr.
// Juan Perez Juzgado") se devuelve al texto en vez de tirar el calce. Lo que
// sobra puede ser un cargo, y por eso los cargos estan en NO_SON_PERSONAS: sin
// "directora", "la Sra. Directora General" salia como "Sra. [PERSONA] General".
//
// El nombre es lo que viene detras del tratamiento HASTA la primera palabra que
// no es de nombre: una del oficio ("Dr. Juan Perez Juzgado Nro. 3"), o una en
// minuscula que no sea particula —con la bandera `i` el patron no las distingue,
// y "el Dr. Carlos Pietro contesto" se llevaba el verbo adentro del reemplazo—.
// Si la primera ya no es de nombre ("Sr. Juez", "Sres. Los Abogados"), no hay
// nombre. Una particula adelante seguida de un nombre es un apellido: "Sr. De
// la Rua".
function largoDeNombre(valor) {
    if (!empiezaEnMayuscula(valor)) return 0;
    const palabras = valor.trim().split(/\s+/);
    let fin = palabras.findIndex((p, i) => !esParticula(p) &&
        (noEsNombre(p) || (i > 0 && !new RegExp(`^[${MAY}]`).test(p))));
    if (fin === -1) fin = palabras.length;
    while (fin > 0 && esParticula(palabras[fin - 1])) fin--;
    return fin;
}

// Un numero escrito en letras, como lo transcribe un testimonio: "ochenta y
// seis mil trescientos doce". Palabras de numero separadas por espacios, que
// empiezan y terminan en una que no es "y". Solo la usa la regla de expediente
// en letras, detras de su ancla: suelta describe tambien montos y fechas.
const PALABRA_DE_NUMERO =
    '(?:un[oa]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|' +
    `catorce|quince|dieci[${MIN}]+|veinte|veinti[${MIN}]+|treinta|cuarenta|cincuenta|` +
    'sesenta|setenta|ochenta|noventa|cien|ciento|doscient[oa]s|trescient[oa]s|' +
    'cuatrocient[oa]s|quinient[oa]s|seiscient[oa]s|setecient[oa]s|ochocient[oa]s|' +
    'novecient[oa]s|mil)';
const NUMERO_EN_LETRAS = `${PALABRA_DE_NUMERO}(?:\\s+(?:y\\s+)?${PALABRA_DE_NUMERO})*`;

// ---------------------------------------------------------------------------
// Nivel 1: identificadores estructurados.
//
// Se reemplazan siempre, sin preguntar. Tienen forma inequivoca, asi que no
// hay falsos positivos que danen el texto. Van ANTES que los reemplazos que
// elige el usuario porque consumen el token completo.
// ---------------------------------------------------------------------------

export const REGLAS_IDENTIFICADORES = [
    {
        nombre: 'firma',
        // Los PDF del PJN cierran con "Firmado por: LOPEZ MARIA, Juez de
        // Primera Instancia". Se oculta el nombre y SE CONSERVA el cargo: quien
        // firmo la resolucion es dato del expediente, no dato personal, y sin el
        // no se entiende quien resolvio que. La herramienta anterior reemplazaba
        // la linea entera por "[Firma]" y se llevaba el cargo puesto.
        patron: /(Firmad[oa]s?\s+(?:digitalmente\s+)?por\s*:?\s*)([^,\n]+)/gi,
        reemplazo: '$1[PERSONA]',
    },

    // -----------------------------------------------------------------------
    // Campos de formulario: "Etiqueta: valor".
    //
    // POR QUE EXISTEN, 21/8/2026. El resto del motor esta escrito para PROSA, y
    // los adjuntos mas sensibles de un expediente no son prosa: son
    // formularios. La ficha del un formulario oficial que venia
    // adjunta a un exhorto trae el apellido, el nombre, la fecha de nacimiento,
    // el domicilio completo y el numero de tramite, cada uno en su renglon y
    // detras de su etiqueta. De todo eso el motor anonimizaba el telefono.
    //
    // POR QUE SE REEMPLAZAN SOLOS, si la regla de la casa es preguntar por los
    // nombres propios: porque aca la etiqueta hace inequivoca la forma, que es
    // el criterio de siempre. Detras de "Apellidos:" no hay una cita de
    // doctrina ni una editorial: hay un apellido. Es el mismo argumento que
    // sostiene la regla de la firma, que tambien reemplaza un nombre entero
    // porque "Firmado por:" dice que ahi va uno.
    //
    // Y no le esconden nada a la lista de candidatos: `candidatosANombre` corre
    // sobre el texto CRUDO, antes que cualquier regla, asi que el nombre que
    // esta detras de "Nombres:" se sigue ofreciendo para tildar y el reemplazo
    // lo alcanza tambien donde aparezca en el cuerpo del escrito.
    //
    // LAS DOS GUARDAS, que son lo que hace que no corrompan prosa:
    //   - los dos puntos son obligatorios. "constituyendo domicilio procesal en
    //     Sarmiento 940" no lleva ninguno, y de esa se ocupa la regla de
    //     domicilio de mas abajo.
    //   - el valor tiene que empezar en mayuscula. "Nombres: los que surgen del
    //     poder" no es un nombre, y sin esta guarda quedaba como
    //     "Nombres: [PERSONA]".
    // -----------------------------------------------------------------------
    {
        nombre: 'campo con nombre de persona',
        patron: new RegExp(
            `(\\b(?:Apellidos?(?:[ \\t]+y[ \\t]+nombres?)?|Nombres?|Padre|Madre` +
            `|Apoderad[oa]|Patrocinante|Testigo|Causante)[ \\t]*:[ \\t]*)([^\\n]+)`,
            'gi'
        ),
        reemplazo: (todo, etiqueta, valor) =>
            empiezaEnMayuscula(valor) ? etiqueta + '[PERSONA]' : todo,
    },
    {
        nombre: 'campo con domicilio',
        // El valor tiene que traer un numero ademas de empezar en mayuscula: un
        // domicilio lleva altura. Sin eso, "Domicilio: Se tiene presente el
        // denunciado" quedaba como "Domicilio: [DOMICILIO]".
        patron: new RegExp(
            `(\\b(?:Domicilio|Domicilios|Calle)` +
            `(?:[ \\t]+(?:legal|real|procesal|constituido|comercial|denunciado))?` +
            `[ \\t]*:[ \\t]*)([^\\n]+)`,
            'gi'
        ),
        reemplazo: (todo, etiqueta, valor) =>
            empiezaEnMayuscula(valor) && /\d/.test(valor) ? etiqueta + '[DOMICILIO]' : todo,
    },
    {
        nombre: 'campo con fecha de nacimiento',
        patron: /(\bFecha[ \t]+(?:de[ \t]+)?Nac(?:imiento)?\.?[ \t]*:[ \t]*)\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/gi,
        reemplazo: '$1[FECHA NAC]',
    },
    {
        nombre: 'campo con anio de nacimiento',
        // "Clase: 1958" es como el formulario oficial escribe el anio de nacimiento.
        patron: /(\bClase[ \t]*:[ \t]*)(?:19|20)\d{2}/g,
        reemplazo: '$1[AÑO NAC]',
    },
    {
        nombre: 'campo con datos de tramite',
        // "Datos del Trámite: Idtrámite :123456789 Ejemplar (B) Toma: 23/06/2015
        // BP: 67340100000284075415350003 Formulario: 0284075415 Oficina::7000".
        // Cuatro identificadores del tramite de DNI en un solo renglon, ninguno
        // con forma propia. La etiqueta cubre el renglon entero, que es lo unico
        // que los alcanza a los cuatro.
        patron: /(\bDatos[ \t]+del[ \t]+Tr[aá]mite[ \t]*:[ \t]*)[^\n]+/gi,
        reemplazo: '$1[TRÁMITE]',
    },
    {
        nombre: 'campo con matricula',
        // Los dos puntos son obligatorios por la misma razon que arriba:
        // "matrícula inscripta al T 45 F 210 del CPACF" es prosa, no lleva dos
        // puntos, y de ella se ocupa la regla de tomo y folio. Un renglon de
        // formulario, en cambio, es todo el campo: "Matrícula N°: XXXV, FOLIO
        // 271" no se puede recortar por la mitad sin dejar el numero a la vista.
        patron: /(\bMatr[ií]cula[ \t]*(?:N[°ºo]?\.?)?[ \t]*:[ \t]*)([^\n]+)/gi,
        reemplazo: (todo, etiqueta, valor) =>
            /\d/.test(valor) ? etiqueta + '[MATRICULA]' : todo,
    },

    {
        nombre: 'email',
        // Termina obligatoriamente en letra o digito, no en punto: sin eso el
        // patron se come el punto final de la oracion ("...@estudio.com." queda
        // como "[EMAIL]" y la frase siguiente arranca sin separacion).
        patron: /[\w.\-+]+@[\w-]+\.[\w.-]*[\w-]/g,
        reemplazo: '[EMAIL]',
    },
    {
        nombre: 'CUIT',
        // LOS ESPACIOS AL LADO DEL GUION, 3/10/2026. "CUIT NN- NNNNNNNN-N" —el
        // espacio lo deja la extraccion del PDF, como en el telefono— salia
        // entero, y en el domicilio electronico de un letrado, que ES el CUIT,
        // tambien. Con espacios el guion pasa a ser obligatorio: once digitos
        // separados solo por espacios ya no tienen forma de CUIT.
        patron: new RegExp(
            `${ANTES}\\d{2}(?:-?\\d{8}-?|[ \\t]*[-‐‑–—][ \\t]*\\d{8}[ \\t]*[-‐‑–—][ \\t]*)\\d${DESPUES}`, 'g'),
        reemplazo: '$1[CUIT]',
    },
    {
        nombre: 'CBU',
        patron: new RegExp(`${ANTES}\\d{22}${DESPUES}`, 'g'),
        reemplazo: '$1[CBU]',
    },
    {
        nombre: 'CVU',
        patron: /\bCVU\s*:?\s*\d+/gi,
        reemplazo: '[CVU]',
    },
    {
        nombre: 'DNI con etiqueta',
        // Va ANTES que la regla de abajo, que es la ambigua. Un numero de
        // documento escrito SIN puntos no tiene forma propia —"5432109" son
        // siete digitos como cualquier otro numero— y por eso la regla de abajo
        // no lo puede mirar. Anclado en la palabra que lo nombra, en cambio, no
        // hay falso positivo posible: lo que viene despues de "DNI" es un DNI.
        //
        // CASO DE PRUEBA, 21/8/2026, en un documento largo que paso por la
        // herramienta: un informe del un formulario oficial trae
        // "DNI: 5432109" y "Tipo y N° de documento: DNI 18234567". Cinco
        // documentos de identidad no se detectaron, porque la unica
        // regla de DNI que habia exigia los puntos.
        //
        // La palabra que ancla SE CONSERVA, como en la de telefono: sin eso el
        // renglon queda como "[DNI]" pelado y no se entiende que se oculto.
        //
        // EL PUNTO QUE FALTA, 3/10/2026. "DNI N° NN.NNNNNN" —tipeado con un solo
        // punto— salia entero: no tiene la forma con puntos ni la sin puntos.
        // Detras de la etiqueta no hay ambiguedad, asi que entra.
        patron: /(\b(?:D\.?N\.?I\.?|L\.?[CE]\.?|documento(?:\s+nacional\s+de\s+identidad)?)\s*(?:n[°ºo]?\.?)?\s*:?\s*)(\d{1,2}\.\d{3}\.\d{3}|\d{1,2}\.\d{6}|\d{4,5}\.\d{3}|\d{7,8})(?![\d.-]|,\d)/gi,
        reemplazo: '$1[DNI]',
    },
    {
        nombre: 'DNI',
        // Un DNI con puntos tiene EXACTAMENTE la misma forma que un monto:
        // "30.119.078" y "3.255.622" no se distinguen mirando el numero. Se
        // excluye lo que venga precedido de "$" o seguido de decimales.
        //
        // Sin esto, "$ 3.255.622,50" quedaba como "$ [DNI],50" y el monto
        // reclamado —el dato del que depende toda la resolucion— desaparecia
        // del texto. Es la corrupcion mas cara de las que se encontraron,
        // porque no rompe nada visible: deja el documento diciendo otra cosa.
        // Un monto no siempre lleva el signo adelante: "la suma de 1.500.000" es
        // tan frecuente como "$ 1.500.000". Por eso, ademas del signo y de los
        // decimales, se mira la palabra que viene antes. Esta parte no esta en
        // la version original de las reglas y se agrego aca.
        //
        // EL MONTO EN DOLARES, 26/9/2026. un monto en dolares salia "u$s [DNI]": en
        // "u$s" el signo no esta pegado al numero -lo separa la "s"- y la
        // alternativa del signo no calzaba. Un cuadro de tasacion en dolares
        // perdio asi los valores de los que dependia la resolucion.
        patron: /((?:u\$[sd]|us\$|usd|d[oó]lares|\$|pesos|suma de|importe de|valor de|monto de)\s*)?(\d{1,2}\.\d{3}\.\d{3})(\s*,\s*\d+|\s*(?:pesos|d[oó]lares|\$))?/gi,
        reemplazo: (todo, plata, numero, despues) => (plata || despues) ? todo : '[DNI]',
    },
    {
        nombre: 'expediente en letras',
        // "(Exp. N° ochenta y seis mil trescientos doce/dos mil veinticinco)".
        //
        // CASO DE PRUEBA, 22/9/2026 (E-07). Un testimonio transcribe los numeros
        // en letras, y las dos reglas de expediente miran digitos: el numero
        // salia entero y la constancia no decia nada. El ancla "Exp." tampoco
        // estaba entre las que reconoce la regla de abajo.
        //
        // EL ANCLA ES OBLIGATORIA, y es lo que hace segura a esta regla. Sin
        // ella un numero en letras es un monto, una fecha o un articulo —"los
        // articulos dos mil cuatrocientos veintiseis y setecientos"—, que es
        // justo el dato del escrito. Con el ancla y la barra entre numero y
        // anio, la forma es tan inequivoca como la de digitos.
        //
        // Los separadores son `\s`, a diferencia de casi todo el archivo: un
        // numero escrito en letras es largo y el PDF lo corta, y aca no hay
        // riesgo de comerse el renglon siguiente porque solo pasan palabras de
        // numero y la barra.
        patron: new RegExp(
            `\\b((?:exp|expte|expediente|causa|autos)\\.?\\s*(?:n[°ºo]?\\.?)?\\s*)` +
            `${NUMERO_EN_LETRAS}\\s*\\/\\s*${NUMERO_EN_LETRAS}(?![${LETRA}])`,
            'gi'
        ),
        reemplazo: '$1[EXPTE]',
    },
    {
        nombre: 'expediente con contexto',
        // Va ANTES que la regla general a proposito: es mas especifica y
        // consume mas texto. Al reves, la general engancha primero la mitad
        // derecha y "Expte. 56.868/2017" termina como "Expte. 56.[EXPTE]", con
        // los primeros digitos del expediente a la vista. En la version original
        // de las reglas el orden esta invertido, y ese es el resultado.
        //
        // LA PALABRA QUE ANCLA SE CONSERVA, 17/9/2026. Hasta hoy se la comia
        // —"Autos 45678/2021" salia "[EXPTE]"— y eso contradecia a las otras
        // cuatro reglas ancladas de este mismo archivo: la de telefono conserva
        // el "Tel:", la de domicilio conserva el "sito en", la de tratamiento
        // conserva el "Dr." y la de firma conserva el cargo. El criterio que
        // faltaba escribir es el mismo de todas: LA PALABRA QUE ANCLA ES TEXTO Y
        // NO DATO. "Expte. N" no identifica a nadie, y sacarlo le quita
        // estructura al texto justo antes de darselo a un modelo, que es el
        // consumidor principal del motor.
        //
        // "NRO." Y EL GUION, 3/10/2026. "Expte. Nro. 1234-2021" salia entero por
        // las dos cosas: el ancla no reconocia "Nro." y el separador tenia que
        // ser la barra. El guion se acepta SOLO aca, con el ancla delante; la
        // regla general de abajo sigue pidiendo la barra, porque "1994-2001"
        // suelto es un rango de anios.
        patron: /\b((?:expte|expediente|causa|autos)\.?\s*(?:nro\.?|n[uú]mero|n[°ºo]?\.?)?\s*)\d{1,7}(?:\.\d{3})*\s*[/\-‐‑–—]\s*(?:19|20)\d{2}(?!\d)/gi,
        reemplazo: '$1[EXPTE]',
    },
    {
        nombre: 'expediente',
        // Numero/anio suelto. Se exigen 3 digitos o mas para no comerse una
        // fecha: "el dia 06/08/2026" contiene "08/2026", que matcheaba y dejaba
        // "06/[EXPTE]". Las fechas son criticas en estos escritos —un plazo se
        // cuenta desde una— y romperlas es peor que no ocultar un expediente
        // corto. El punto en la clase de exclusion es lo que permite que
        // "56.868/2017" se tome entero en vez de por la mitad.
        patron: /(^|[^\d/.])((?:\d{1,3}\.)?\d{3,7}\s*\/\s*(?:19|20)\d{2})(?![\d/])/g,
        reemplazo: '$1[EXPTE]',
    },
    {
        nombre: 'matricula',
        // Tomo y folio: como se identifica a un abogado en el PJN.
        //
        // Se filtraron cuatro el 21/8/2026, todas por la misma razon: el patron
        // aceptaba UNA sola forma de escribirlo. Ahora entran los dos puntos
        // ("T: 62 F: 415"), la O mayuscula que deja el OCR donde va el ordinal
        // ("T°22 FO371") y el tomo escrito con la palabra entera.
        //
        // Los separadores son `[ \t]` y no `\s`: `\s` cruza el salto de linea,
        // y un tomo al final de un renglon se llevaria el numero del renglon
        // siguiente. Es la misma trampa que la de la regla de tratamiento.
        patron: /\b(?:T[ºo°]?|Tomo)[ \t]*[.:]?[ \t]*\d{1,4}[ \t]*[,/]?[ \t]*(?:F[ºoO°]?|Folio)[ \t]*[.:]?[ \t]*\d{1,4}/gi,
        reemplazo: '[MATRICULA]',
    },
    {
        nombre: 'telefono',
        // LOS SEPARADORES, 26/9/2026. un celular de AMBA con guiones salia
        // entero, y la causa es esta: entre los bloques se
        // aceptaba un solo caracter, y solo el guion comun o un espacio. El PDF
        // deja el guion tipografico (‐ – —), el espacio de mas al lado del
        // guion, el punto como separador y el 0 de larga distancia adelante, y
        // cualquiera de esos dejaba el numero a la vista. Tambien el 9 del
        // celular en formato internacional ("+54 9 11..."), que quedaba afuera.
        // Sigue exigiendo la caracteristica 11 o 15 y dos bloques de cuatro: eso
        // es lo que hace inequivoca la forma, no el separador.
        patron: /(^|[^\d\-‐‑–—])((?:\+?54[ \t]*(?:9[ \t]*)?)?0?(?:11|15)\s*[-‐‑–—.]?\s*\d{4}\s*[-‐‑–—.]?\s*\d{4}(?:\s*\/\s*\d{4})?)(?![\d\-‐‑–—])/g,
        reemplazo: '$1[TEL]',
    },
    {
        nombre: 'telefono local',
        // Fijo de CABA sin prefijo: ocho digitos pelados ("4371-1696"), que la
        // regla de arriba no engancha porque exige 11 o 15 adelante. Se ancla en
        // la palabra "tel"/"fax" a proposito: un \d{4}-\d{4} suelto tambien
        // matchea un rango de anios ("1994-2001"), y romper una cita por un
        // falso positivo es peor que no reemplazar. El "/2348" del final es el
        // interno, que en la primera version quedaba afuera.
        // La palabra que ancla se conserva: sin eso, "su telefono 4371-1696"
        // quedaba como "su [TEL]", que no se entiende al leer.
        //
        // EL GUION CON ESPACIO, 26/9/2026. "Tel. 4371- 1696" -el espacio despues
        // del guion lo deja la extraccion del PDF- salia entero: entre los dos
        // bloques se aceptaba un solo caracter.
        patron: /\b(tel[eé]fonos?|celulares?|cel|fax|tel)(\.?\s*:?\s*)\d{4}[ \t]*-?[ \t]*\d{4}(?:\s*\/\s*\d{2,4})?/gi,
        reemplazo: '$1$2[TEL]',
    },
];

// ---------------------------------------------------------------------------
// Nivel 1b: reglas que miran nombres propios.
//
// Van DESPUES de los reemplazos que eligio el usuario: son heuristicas sobre
// sustantivos propios, y ahi el criterio de quien conoce el expediente tiene
// que ganarle al patron.
// ---------------------------------------------------------------------------

/** Las etiquetas con que se tapa a alguien.
 *
 * Las usa el selector de la pantalla Y el detector de restos de abajo. Van
 * juntas a proposito: si las dos listas se separan, el detector deja de
 * reconocer la etiqueta que el usuario eligio y la fuga vuelve en silencio.
 */
const NOMBRES_DE_ETIQUETA = [
    'PERSONA', 'ACTOR', 'DEMANDADO', 'LETRADO', 'PERITO', 'TESTIGO', 'EMPRESA',
];
export const ETIQUETAS_DE_NOMBRE = NOMBRES_DE_ETIQUETA.map((n) => `[${n}]`);

// Solo las de persona, y es la guarda que sostiene toda la regla. "[DOMICILIO],
// Lomas de Zamora" y "en [EXPTE] Juzgado Civil" tambien tienen una palabra
// capitalizada al lado, y ahi no quedo ningun nombre partido: quedo el texto que
// rodea a un dato.
//
// EL `_N` ES LA FORMA NUMERADA (E-03) y tiene que estar aca: si el detector
// reconociera "[PERSONA]" y no "[PERSONA_2]", prender la numeracion apagaria en
// silencio la deteccion de restos, que es la fuga grave. Es la misma razon por
// la que la lista vive en el motor y no en la pantalla.
const ETIQUETA_DE_NOMBRE = `\\[(?:${NOMBRES_DE_ETIQUETA.join('|')})(?:_\\d+)?\\]`;

// Siglas que tienen la forma de una patente vieja. Ocultar el numero de un
// articulo deja la cita rota y sin arreglo posible del otro lado.
const NO_ES_DOMINIO = /^(ART|LEY|CPC|CCC|BIS|TER|CSJ|SRL|SAS|IVA|UMA|CPR|LCT|CPP|INC|NRO|FTS)\b/i;

// Piso, departamento y unidad, que van pegados a la altura.
//
// LA UNIDAD ES UN TOKEN CORTO Y CERRADO —un numero, una letra sola, o una letra
// entre comillas— y no "hasta seis caracteres", que es como estaba escrito.
// `[LETRA\d]{1,6}` se queda con seis letras de la palabra que siga y devuelve
// el resto: "Montevideo 1740 PB departamento 2" salia como "[DOMICILIO]amento
// 2". El `(?!LETRA)` del final es lo que impide comerse media palabra, y por
// eso "piso de la Ciudad" no se lleva el "de".
const UNIDAD = `(?:[ \\t]*(?:\\d{1,4}|["“][${LETRA}]["”]|[${LETRA}])(?![${LETRA}\\d]))?`;
const PISO =
    `(?:[ \\t]*[.,]?[ \\t]*(?:` +
    `\\d{1,3}[ºo°]?(?:do|er|ro|to|mo|vo|no)?[ \\t]*piso` +   // "2do piso", "5° piso"
    `|entre[ \\t]*piso|departamento|depto\\.?|dpto\\.?|piso|P\\.?B\\.?|of\\.?|oficina|U\\.?F\\.?` +
    `)${UNIDAD})`;

// "1° A": el piso con su grado y la unidad, sin la palabra "piso". CASO DE
// PRUEBA, 3/10/2026: "domicilio en la calle X 1234 1° A, de esta" salia
// "[DOMICILIO] 1° A". SOLO en la regla con ancla, y la letra es obligatoria:
// sin ancla, "articulo 730 1° parrafo" tiene la misma forma, y comerse una
// cita es peor que dejar un piso.
const PISO_CON_ANCLA =
    `(?:${PISO}|[ \\t]*[.,]?[ \\t]*\\d{1,3}[º°][ \\t]*(?:["“][${LETRA}]["”]|[${LETRA}])(?![${LETRA}\\d]))`;

// Una palabra de nombre tal como sale de un PDF escaneado: los digitos van
// ADENTRO, nunca al principio ni al final.
//
// POR QUE, 17/9/2026 (E-05). El OCR lee "Quinteros" como "Qu1nteros" y "Ramiro"
// como "Rarn1ro". Con `[LETRA]+` el patron enganchaba el pedazo limpio y
// devolvia el resto al texto: "Sr. Qu1nteros" salia "Sr. [PERSONA]1nteros", con
// medio apellido a la vista Y la constancia contandolo como reemplazado. Eso es
// peor que no reemplazar, porque el archivo se lee como limpio.
//
// EL MOTIVO POR EL QUE SE CREIA IMPOSIBLE NO SE SOSTIENE, y esta probado. El
// miedo era que un patron con digitos empezara a comerse numeros ("fs. 120",
// "Juzgado 45", un tomo y folio). Se corrieron esas sondas contra los dos
// motores y ninguno se comio un numero, porque ESTA REGLA ESTA ANCLADA en el
// tratamiento y frenada por `largoDeNombre`. Sin ancla no hay arreglo por
// patron, y por eso esta constante NO se usa en las reglas sin ancla ni en los
// candidatos: ahi un digito adentro de una palabra es un numero.
//
// El digito no va primero —una palabra que empieza con digito es un numero— ni
// ultimo —"Camara 3" y "Juzgado 45" lo tienen pegado si no se lo impide—. De
// ahi que "Dra. Va1eria 0campo" quede como "Dra. [PERSONA] 0campo": el apellido
// que el OCR ensucio en la PRIMERA letra sigue sin arreglo, y el motor Python
// tampoco lo resuelve.
const PALABRA_DE_NOMBRE = `[${MAY}][${LETRA}\\d]*[${LETRA}]`;

// Lo que sigue a la coma cuando alguien se presenta en un escrito. La regla que
// las usa corre sin la bandera `i`, y por eso cada una va en minuscula y en
// mayuscula: "EN MI CARACTER DE" es tan frecuente como la otra.
const FORMULAS_DE_PRESENTACION = [
    'en mi car[aá]cter de', 'en su car[aá]cter de', 'por derecho propio', 'por s[ií] y',
    'abogad[oa]', 'letrad[oa]', 'apoderad[oa]', 'inscript[oa] al',
].flatMap((f) => [f, f.toUpperCase()]).join('|');

// Los nombres que taparon las reglas ancladas en la pasada que esta corriendo.
// Solo vive adentro de `anonimizar`, que despues los tapa en el resto del texto:
// ver `taparDescubiertos`.
let descubiertos = null;
function descubierto(nombre) {
    if (descubiertos) descubiertos.push(String(nombre).trim());
}

// Minuscula, Capitalizada y MAYUSCULA de un pedazo de patron, para las reglas
// que corren sin la bandera `i`. No toca los escapes: "[ \t]" en mayusculas
// seria "[ \T]", que ya no es un tab.
function enLasTresCajas(fragmentos) {
    const mayus = (f) => f.replace(/\\[a-z]|[a-záéíóúñü]/g, (m) => (m[0] === '\\' ? m : m.toUpperCase()));
    return fragmentos
        .flatMap((f) => [f, f[0].toUpperCase() + f.slice(1), mayus(f)])
        .join('|');
}

// Los tratamientos de la regla de tratamiento, en minuscula, Capitalizados y en
// MAYUSCULA: "dr.", "Dr." y "DR.". Ver por que esa regla ya no corre con `i`.
const TRATAMIENTOS = [...new Set([
    'Dr', 'Dra', 'Dres', 'Dras', 'Sr', 'Sra', 'Sres', 'Sras', 'Srta', 'Ing', 'Lic', 'Cdor', 'Cra', 'Arq',
    'Juez', 'Jueza', 'Perito', 'Martiller[oa]',
].flatMap((t) => [t, t.toLowerCase(), t.toUpperCase()]))].join('|');

// El papel de alguien en el proceso, cuando va delante de su nombre: "el
// perito", "la demandada", "su madre". Entra solo lo que anuncia una PERSONA:
// "la citada en garantia" no, porque casi siempre es una aseguradora.
const ROLES_QUE_ANUNCIAN = enLasTresCajas([
    'perit[oa]s?', 'ingenier[oa]s?', 'arquitect[oa]s?', 'contador(?:a|es)?', 'mediador(?:a|es)?',
    'martiller[oa]s?', 'tasador(?:a|es)?', 'cal[ií]graf[oa]s?',
    'traductor(?:a|es)?(?:[ \\t]+p[uú]blic[oa]s?)?', 'consultor(?:a|es)?(?:[ \\t]+t[eé]cnic[oa]s?)?',
    'letrad[oa]s?', 'abogad[oa]s?', 'apoderad[oa]s?', 'demandad[oa]s?', 'codemandad[oa]s?',
    'actor(?:a|es)?', 'coactor(?:a|es)?', 'causante', 'testigos?', 'damnificad[oa]', 'reclamante',
    'c[oó]nyuge(?:[ \\t]+sup[eé]rstite)?(?:[ \\t]+de)?', 'hereder[oa]s?(?:[ \\t]+de)?',
    'su[ \\t]+(?:madre|padre|hij[oa]|espos[oa]|herman[oa]|concubin[oa])',
]);

// Lo que puede ir entre el rol y el nombre: "el perito MEDICO Dr.", "la
// ingeniera MECANICA Ana". Hasta dos.
const ESPECIALIDADES = enLasTresCajas([
    'm[eé]dic[oa]', 'contador(?:a)?', 'ingenier[oa]', 'mec[aá]nic[oa]', 'civil', 'cal[ií]graf[oa]',
    'psic[oó]log[oa]', 'psiquiatra', 'tasador(?:a)?', 'inform[aá]tic[oa]', 'traductor(?:a)?',
    'arquitect[oa]', 'odont[oó]log[oa]', 'designad[oa]', 'interviniente', 't[eé]cnic[oa]',
    'de[ \\t]+oficio', 'industrial', 'electricista', 'qu[ií]mic[oa]', 'en[ \\t]+sistemas',
]);

// Un tramo de un renglon de firma: tapa el nombre del principio y conserva lo
// demas, que es el cargo. Ver la regla "firma con Fdo.".
function taparNombreDelTramo(tramo) {
    const m = tramo.match(/^([ \t]*(?:(?:Dr|Dra|Dres|Sr|Sra|Ing|Lic|Cdor|Cra|Arq)\.?[ \t]+)?)([\s\S]*)$/i);
    const [, tratamiento, resto] = m;
    const palabras = [...resto.matchAll(/\S+/g)];
    const etiqueta = new RegExp(`^${ETIQUETA_DE_NOMBRE}$`);
    let fin = 0;
    let nombres = 0;
    for (const { 0: p } of palabras) {
        if (etiqueta.test(p) || (new RegExp(`^${PALABRA_DE_NOMBRE}$`).test(p) && !noEsNombre(p))) nombres++;
        else if (!(fin > 0 && (esParticula(p) || new RegExp(`^[${MAY}]\\.$`).test(p)))) break;
        fin++;
    }
    while (fin > 0 && esParticula(palabras[fin - 1][0])) fin--;
    if (nombres < 2) return tramo;
    const corte = palabras[fin - 1].index + palabras[fin - 1][0].length;
    descubierto(resto.slice(0, corte));
    return `${tratamiento}[PERSONA]${resto.slice(corte)}`;
}

export const REGLAS_NOMBRES = [
    {
        nombre: 'dominio de automotor',
        patron: new RegExp(`${ANTES}([A-Z]{2}\\s?\\d{3}\\s?[A-Z]{2}|[A-Z]{3}\\s?\\d{3})${DESPUES}`, 'g'),
        reemplazo: (todo, antes, dominio) =>
            NO_ES_DOMINIO.test(dominio.trim()) ? todo : antes + '[DOMINIO]',
    },
    {
        nombre: 'persona con tratamiento',
        // Tratamiento + nombre propio: "Dr. Juan Carlos Perez", "Sra. Maria
        // Lopez". El tratamiento ancla el comienzo, que es lo que hace seguro el
        // reemplazo, y SE CONSERVA: "Dr." no identifica a nadie, y perderlo
        // borra la distincion entre el letrado y la parte, que es informacion
        // que la resolucion necesita para entenderse.
        //
        // El separador es `[ \t]+` y no `\s+`, que es lo que parece natural
        // escribir. `\s` incluye el salto de linea, y con eso la regla saltaba
        // al renglon siguiente y se llevaba puesto lo que hubiera ahi: una
        // resolucion que terminaba en "Firmado por: LOPEZ MARIA, Jueza" seguida
        // de "Poder Judicial de la Nacion - Lex100" quedaba como
        // "Jueza [PERSONA] - Lex100", con el pie del documento comido y el
        // reemplazo puesto donde no habia ningun nombre. Un tratamiento y su
        // nombre estan en el mismo renglon.
        //
        // LOS DOS PUNTOS Y LA BANDERA `i`, 21/8/2026. Una cedula del PJN
        // encabeza "SR :ERNESTO QUIROGA", con el tratamiento en mayusculas y un
        // separador que el patron no contemplaba: fallaba por las dos cosas a
        // la vez. Con `i` la clase `[MAY]` deja de distinguir mayusculas, asi
        // que la guarda pasa a una funcion —el nombre tiene que empezar en
        // mayuscula y no puede llevar ninguna palabra de NO_SON_PERSONAS—.
        // Sin esa guarda, "Sres. los abogados" quedaba como "Sres. [PERSONA]".
        //
        // YA NO CORRE CON `i`, 3/10/2026. Con la bandera, el nombre tambien
        // podia empezar en minuscula, y la guarda de `largoDeNombre` lo rechazaba
        // DESPUES de que el patron hubiera consumido el texto: en "el perito
        // medico Dr. Juan Inventado" el calce era "perito medico Dr", se tiraba,
        // y el "Dr." —ya consumido— no volvia a probarse. El nombre salia en
        // claro; varias entradas del buzon de fugas eran esto. Ahora cada
        // tratamiento va en sus tres cajas y el nombre tiene que empezar en
        // mayuscula en el patron mismo, asi que "perito medico" ni calza.
        patron: new RegExp(
            `\\b((?:${TRATAMIENTOS})\\.?)` +
            // El tratamiento tiene que terminar ahi. Sin este control, con la
            // bandera `i` el "Ing" de "INGENIERO JUAN" calza como tratamiento y
            // el resto de la palabra se va adentro del reemplazo:
            // "INGENIERO JUAN" quedaba como "Ing [PERSONA]".
            `(?=[^${LETRA}]|$)` +
            // Las particulas no cuentan entre las cuatro palabras: sin eso,
            // "Dr. Juan Perez de la Fuente" llenaba el cupo en "la" y el
            // apellido quedaba afuera, en claro.
            //
            // LA INICIAL DEL MEDIO, 22/9/2026 (E-07). "Fdo. Dra. Lucia A. Ficticia"
            // se cortaba en la "A." —una letra sola no es PALABRA_DE_NOMBRE— y
            // salia "Dra. [PERSONA] A. Ficticia": el apellido a la vista y la
            // constancia contandolo como reemplazado. La inicial entra solo EN EL
            // MEDIO, con su punto y seguida de otra palabra de nombre: no abre ni
            // cierra un nombre. Con la bandera `i` calzaria tambien una minuscula
            // ("Perez p. ej."), y la frena `largoDeNombre`, que mira la mayuscula
            // sin la bandera.
            `[ \\t]*:?[ \\t]*(${PALABRA_DE_NOMBRE}(?:[ \\t]+(?:[${MAY}]\\.[ \\t]*)?(?:${PARTICULA_CUALQUIER_CAJA}[ \\t]+){0,2}${PALABRA_DE_NOMBRE}){0,3})`,
            'g'
        ),
        reemplazo: (todo, tratamiento, nombre) => {
            const largo = largoDeNombre(nombre);
            if (!largo) return todo;
            const conservado = nombre.match(new RegExp(`^\\S+(?:[ \\t]+\\S+){${largo - 1}}`))[0];
            descubierto(conservado);
            return `${tratamiento} [PERSONA]` + nombre.slice(conservado.length);
        },
    },
    {
        nombre: 'segundo nombre tras tratamiento plural',
        // "las Sras. Ana Gomez y Marta Ines Quiroga": el tratamiento plural
        // anuncia dos personas y la regla de arriba tapaba solo la primera. La
        // segunda salia en claro. Corre despues de la de tratamiento y se ancla
        // en lo que esa dejo: "Sras. [PERSONA] y".
        patron: new RegExp(
            `((?:Dres|Dras|Sres|Sras|DRES|DRAS|SRES|SRAS)\\.?[ \\t]*:?[ \\t]*\\[PERSONA\\][ \\t]+[ye][ \\t]+)` +
            `(${PALABRA_DE_NOMBRE}(?:[ \\t]+(?:[${MAY}]\\.[ \\t]*)?(?:${PARTICULA_CUALQUIER_CAJA}[ \\t]+){0,2}${PALABRA_DE_NOMBRE}){0,3})`,
            'g'
        ),
        reemplazo: (todo, antes, nombre) => {
            const largo = largoDeNombre(nombre);
            if (!largo) return todo;
            const conservado = nombre.match(new RegExp(`^\\S+(?:[ \\t]+\\S+){${largo - 1}}`))[0];
            descubierto(conservado);
            return `${antes}[PERSONA]` + nombre.slice(conservado.length);
        },
    },
    {
        nombre: 'firma con Fdo.',
        // "FDO.: JUAN INVENTADO - MARIA FICTICIA - PEDRO SUPUESTO", el pie de una
        // sentencia de Camara, y "Fdo. Ana Inventada, Juez. Pedro Ficticio,
        // Secretario". CASO DE PRUEBA, 27/9/2026, del buzon: la regla de firma
        // ancla en "Firmado por:" y la abreviatura no la dispara, asi que los
        // tres vocales salian en claro.
        //
        // Se trabaja por tramos del renglon —separados por guion, coma, punto y
        // coma, "y", o un punto seguido de mayuscula— y en cada uno se tapa el
        // nombre del principio y se conserva el cargo, como en la de firma: quien
        // firmo es dato del expediente. Un tramo tiene que tener DOS palabras de
        // nombre como minimo (o una etiqueta ya puesta y otra palabra): "Juez de
        // Camara" no tiene ninguna, y un apellido suelto no se distingue de un
        // cargo que falte en NO_SON_PERSONAS.
        patron: /(\bfdo\.?[ \t]*:?[ \t]*)([^\n]+)/gi,
        reemplazo: (todo, ancla, resto) => ancla + resto
            .split(/([ \t]*(?:[-–—;,]|\.(?=[ \t]+[A-ZÀ-ÖØ-Þ]))[ \t]*|[ \t]+[yY][ \t]+)/)
            .map((tramo, i) => (i % 2 ? tramo : taparNombreDelTramo(tramo)))
            .join(''),
    },
    {
        nombre: 'nombre detras de un rol',
        // "por el arquitecto JUAN INVENTADO", "el ingeniero civil, Juan
        // Inventado", "Al mediador, JUAN INVENTADO", "el demandado Juan
        // Inventado contesto". CASO DE PRUEBA, 27/9/2026: la mitad de las
        // entradas del buzon eran esto, un nombre anunciado por el papel que
        // cumple en el proceso, y ninguna regla lo tapaba porque no hay
        // tratamiento delante.
        //
        // Es el mismo argumento que la regla de tratamiento: el rol ancla el
        // comienzo y hace inequivoco que lo que sigue es una persona. Y la misma
        // guarda: el nombre corre SIN la bandera `i` —cada palabra empieza en
        // mayuscula— y `largoDeNombre` corta en la primera que no es de nombre,
        // asi que "la actora Ciudad Autonoma" y "el perito Dr." no se tocan.
        //
        // EL BORDE: en un texto todo en mayusculas, "EL DEMANDADO JUAN INVENTADO
        // CONTESTO" se lleva el verbo adentro del reemplazo —en mayusculas no hay
        // como distinguirlo de un apellido—. Tapa de mas, que es el lado seguro.
        patron: new RegExp(
            `(^|[^${LETRA}])((?:${ROLES_QUE_ANUNCIAN})(?:[ \\t]+(?:${ESPECIALIDADES})){0,2}[ \\t]*[,:]?[ \\t]*)` +
            `(${PALABRA_DE_NOMBRE}(?:[ \\t]+(?:[${MAY}]\\.[ \\t]*)?(?:${PARTICULA_CUALQUIER_CAJA}[ \\t]+){0,2}${PALABRA_DE_NOMBRE}){0,4})`,
            'g'
        ),
        reemplazo: (todo, antes, rol, nombre) => {
            const largo = largoDeNombre(nombre);
            if (!largo) return todo;
            const conservado = nombre.match(new RegExp(`^\\S+(?:[ \\t]+\\S+){${largo - 1}}`))[0];
            descubierto(conservado);
            return `${antes}${rol}[PERSONA]` + nombre.slice(conservado.length);
        },
    },
    {
        nombre: 'el que se presenta',
        // El comienzo de un escrito: "Juan Carlos PEREZ, en mi caracter de
        // apoderado de...", "Ana Gomez, por derecho propio", "Luis Diaz,
        // abogado, inscripto al T...". Ningun tratamiento lo anuncia, y el
        // detector de candidatos lo ofrecia a medias -el nombre de pila sin el
        // apellido en mayusculas-, asi que el letrado de la parte salia entero.
        //
        // Lo que ancla es lo que sigue a la coma: una formula con la que solo se
        // presenta una persona. Corre SIN la bandera `i`, para que cada palabra
        // del nombre tenga que empezar en mayuscula, y pide dos como
        // minimo: "Que, en mi caracter de" no es un nombre.
        patron: new RegExp(
            `(^|[^${LETRA}\\d\\]])` +
            `(${PALABRA_DE_NOMBRE}(?:[ \\t]+(?:[${MAY}]\\.[ \\t]*)?(?:${PARTICULA_CUALQUIER_CAJA}[ \\t]+){0,2}${PALABRA_DE_NOMBRE}){1,4})` +
            `([ \\t]*,[ \\t]*(?:${FORMULAS_DE_PRESENTACION}))`,
            'g'
        ),
        reemplazo: (todo, antes, nombre, despues) => {
            const palabras = nombre.trim().split(/\s+/);
            if (palabras.some((p) => !esParticula(p) && noEsNombre(p))) return todo;
            descubierto(nombre);
            return `${antes}[PERSONA]${despues}`;
        },
    },
    {
        nombre: 'domicilio con ancla',
        // Calle y altura SIN piso ni departamento, que es como se escribe la
        // mayoria de los domicilios de un escrito: "Av. San Juan 640 CABA",
        // "Rivera 3120 CABA", "Alsina 1220 de Rosario". La regla de abajo los
        // dejaba enteros porque exige el piso.
        //
        // Sin piso hace falta otra cosa que acote, y esa es la palabra que
        // ancla —"domicilio", "sito", "calle"—. NO ES UN ADORNO: sin ella la
        // regla dice "cualquier palabra capitalizada seguida de un numero", y
        // eso tambien describe "el expediente 48210" y "el art. 431". La
        // palabra se conserva, como en la de telefono: "en [DOMICILIO]" a secas
        // no se entiende al leer.
        patron: new RegExp(
            `((?:domicili[oa]\\w*|sit[oa]|calle|avenida|av\\.)` +
            // El calificativo se repite: "domicilio legal constituido en X"
            // lleva dos, y aceptando uno solo el segundo se colaba adentro del
            // nombre de la calle y la guarda de mayuscula tiraba el calce.
            `(?:[ \\t]+(?:legal|real|procesal|constituid[oa]|comercial|denunciad[oa]))*` +
            //
            // "EN LA CALLE", 26/9/2026. "domicilio legal constituido en la calle
            // X 1111" salia entero: con la bandera `i`, "la calle" entraba como las
            // dos primeras palabras de la direccion, la guarda de mayuscula tiraba
            // el calce, y el calce tirado ya habia consumido el texto, asi que la
            // regla no volvia a probar desde "calle". Igual "sito en la calle".
            `[ \\t]*:?[ \\t]*(?:en[ \\t]+)?(?:la[ \\t]+)?(?:calle[ \\t]+)?)` +
            //
            // LA CALLE QUE ES UN NOMBRE, 26/9/2026. "Avenida Hipolito Yrigoyen"
            // tiene forma de nombre de persona, se ofrece como candidato, y si
            // se tilda la calle llega aca como "Avenida [PERSONA]": la guarda de
            // mayuscula tiraba el calce y la altura quedaba en claro. La etiqueta
            // cuenta como una palabra de la calle. Y entre la calle y la altura
            // puede ir "N°" —"en [PERSONA] N° 1234"—, y detras de la altura una
            // segunda altura: "Mitre 1234/36".
            `((?:[${MAY}][${LETRA}.]+|${ETIQUETA_DE_NOMBRE})` +
            `(?:[ \\t]+(?:de[l]?|la|las|los)?[ \\t]*(?:[${MAY}][${LETRA}.]+|${ETIQUETA_DE_NOMBRE})){0,2}` +
            `[ \\t]+(?:(?:n[°ºo]?\\.?|nro\\.?|n[uú]mero)[ \\t]*)?\\d{1,5}(?:[ \\t]*\\/[ \\t]*\\d{1,4})?${PISO_CON_ANCLA}*)`,
            'gi'
        ),
        reemplazo: (todo, ancla, direccion) =>
            empiezaEnMayuscula(direccion) || direccion.startsWith('[') ? ancla + '[DOMICILIO]' : todo,
    },
    {
        nombre: 'domicilio',
        // Calle con altura, piso y departamento. Acá el que acota es el piso,
        // así que esta regla no necesita palabra que la ancle y alcanza un
        // domicilio suelto en su renglón.
        //
        // EL BLOQUE DE PISO YA NO CORTA LA PALABRA. Era `[LETRA\d"']{1,6}`, y
        // "Montevideo 1740 PB departamento 2" salía como "[DOMICILIO]amento 2":
        // el cuantificador se quedaba con seis letras de "departamento" y
        // devolvía el resto al texto. Un reemplazo partido al medio es peor que
        // ninguno, porque parece hecho.
        //
        // LA PALABRA DE ADELANTE, 3/10/2026 (lo encontro el banco cruzado el
        // 26/9). La regla corre con la bandera `i` —por "PB" y "Depto"— y eso
        // deja entrar como calle cualquier palabra: "Se notifico en Montevideo
        // 1740 PB" salia "Se [DOMICILIO]", con el verbo adentro. Ahora la calle
        // es solo la tira de palabras en mayuscula pegada a la altura —con las
        // particulas del medio— y lo de antes vuelve al texto. Si no hay ninguna
        // en mayuscula se tapa todo el calce, como antes: ante la duda, tapar.
        patron: new RegExp(
            `[${MAY}][${LETRA}]+(?:[ \\t]+[${MAY}]?[${LETRA}]+){0,2}[ \\t]+\\d{1,5}${PISO}+`,
            'gi'
        ),
        reemplazo: (todo) => {
            const calle = todo.slice(0, todo.search(/[ \t]+\d/));
            const palabras = [...calle.matchAll(/\S+/g)];
            let desde = palabras.length;
            for (let i = palabras.length - 1; i >= 0; i--) {
                const p = palabras[i][0];
                if (new RegExp(`^[${MAY}]`).test(p)) desde = i;
                else if (!esParticula(p)) break;
            }
            if (desde === 0 || desde === palabras.length) return '[DOMICILIO]';
            return todo.slice(0, palabras[desde].index) + '[DOMICILIO]';
        },
    },
];

// ---------------------------------------------------------------------------
// Nivel 2: candidatos a nombre propio.
//
// NO se reemplazan solos. Se listan para que el usuario decida, porque la misma
// forma "Apellido, Nombre" la producen las partes del juicio, las citas de
// doctrina ("Llambias, Jorge Joaquin") y los nombres de tribunales, y pisarlos
// a todos rompe el texto.
// ---------------------------------------------------------------------------

// Igual que las reglas de arriba, los separadores son `[ \t]+` y no `\s+`: un
// patron que cruza el salto de linea junta el final de un renglon con el
// principio del siguiente y propone como nombre algo que nunca estuvo escrito.
const S = '[ \\t]+';

// Entre dos palabras de un nombre puede ir una particula, o dos: "Del Monte",
// "de la Fuente". Sin esto "Lucia del Monte" no calzaba en ningun patron
// —"del" no empieza en mayuscula— y el nombre no se ofrecia.
const J = `${S}(?:${PARTICULA_CUALQUIER_CAJA}${S}){0,2}`;

// Una palabra de nombre, capitalizada y en mayusculas.
//
// LAS CUATRO FORMAS QUE NO SE OFRECIAN, 26/9/2026. Con `[MAY][MIN]{2,15}` no
// calzaban "D'Inventa", "O'Neill", "McInventa" ni el apellido compuesto con
// guion, y una palabra de mas de dieciseis letras calzaba POR LA MITAD: se
// ofrecia "Inventadisimaex", que tildado no reemplaza nada —el borde de palabra
// no lo deja— y la constancia lo da por hecho. El largo ya no tiene tope.
const CAP = `(?:[${MAY}]['’]|Ma?c)?[${MAY}][${MIN}]{2,}(?:-[${MAY}][${MIN}]{2,})?`;
const CAPS = `(?:[${MAY}]['’])?[${MAY}]{3,}(?:-[${MAY}]{3,})?`;

const CANDIDATOS = [
    // "Perez, Juan Carlos" — forma de caratula y de cita de doctrina.
    new RegExp(`${CAP},${S}${CAP}(?:${S}${CAP})?`, 'g'),
    // "ANALIA GABRIELA ARIAS" — tres o mas palabras seguidas en mayusculas.
    new RegExp(`${CAPS}(?:${J}${CAPS}){2,}`, 'g'),
    // "Juan Carlos Perez" — de tres a cinco palabras capitalizadas seguidas.
    //
    // ERAN TRES EXACTAS HASTA EL 15/9/2026, y un nombre de cuatro —"Juan Carlos
    // Perez Garcia"— salia partido: este patron ofrecia "Juan Carlos Perez" y el
    // de dos palabras, "Perez Garcia". Tildar el primero dejaba el segundo
    // apellido en claro, y nada avisaba que el nombre seguia.
    new RegExp(`${CAP}(?:${J}${CAP}){2,4}`, 'g'),
    // "PEREZ, Juan" — apellido en mayusculas y nombre capitalizado, que es como
    // el PJN escribe las partes en la caratula.
    new RegExp(`${CAPS}(?:${S}[${MAY}]{2,})*,${S}${CAP}`, 'g'),
    // "PEREZ, JUAN CARLOS" — la caratula entera en mayusculas. Ninguno de los
    // otros la toma: el de mayusculas se corta en la coma, y el de arriba pide
    // el nombre en minusculas. Salia "JUAN CARLOS" solo, y tildarlo dejaba el
    // apellido —lo que mas identifica— a la vista.
    new RegExp(`${CAPS}(?:${S}${CAPS})*,${S}${CAPS}(?:${J}${CAPS}){0,3}`, 'g'),

    // "Ernesto Quiroga" y "ERNESTO QUIROGA" — DOS palabras, que es como se
    // llama la gente en un escrito una vez que ya fue presentada.
    //
    // CASO DE PRUEBA, 21/8/2026. Las cuatro reglas de arriba exigen tres palabras o
    // una coma, asi que un nombre de un exhorto —diez apariciones
    // en claro, mas cuatro sin tilde y una en mayusculas— NUNCA se ofrecio para
    // tildar. No es que el usuario lo dejo pasar: no lo vio. Y es la forma mas
    // frecuente que hay, porque el nombre completo aparece una vez y el
    // "Nombre Apellido" aparece en cada foja.
    //
    // Es la regla mas ruidosa de las seis: engancha "Razon Social", "Ingresos
    // Brutos", "Codigo Producto". Por eso entra junto con dos cosas y no sola:
    // la lista NO_SON_PERSONAS de abajo, que se amplio para este caso, y que
    // los candidatos ya no vengan tildados de fabrica (ver app.js). Un candidato
    // de mas cuesta una mirada; uno de menos es un nombre que sale del
    // expediente sin que nadie se entere.
    new RegExp(`${CAP}${J}${CAP}`, 'g'),
    new RegExp(`${CAPS}${J}${CAPS}`, 'g'),

    // "Eugenia INVENTADA", "Maria Eugenia INVENTADA FICTICIA" — el nombre de
    // pila capitalizado y el apellido en mayusculas, que es como se escribe a
    // una parte en el cuerpo de un escrito. CASO DE PRUEBA, 26/9/2026: "Eugenia
    // INVENTADA" no calzaba en ninguno —unos piden todo capitalizado, otros todo
    // en mayusculas— y el nombre no se ofrecia. Con tres palabras salia partido
    // en dos candidatos.
    new RegExp(`${CAP}(?:${J}${CAP}){0,3}${J}${CAPS}(?:${J}${CAPS}){0,2}`, 'g'),

];

// "STALSTAR S.A.", "Inventada Hnos. S.R.L." — una sociedad. CASO DE PRUEBA,
// 26/9/2026: "presidente de STALSTAR S.A." salia entero y nunca se ofrecio,
// porque el nombre es UNA palabra y todos los patrones de arriba piden dos.
// Lo que la ancla es el tipo societario, que va entero en el candidato: asi
// el reemplazo se lleva "S.A." y no deja una sigla colgando.
//
// VA APARTE DE LOS OTROS SEIS, y no pasa por
// `recortarPalabrasQueNoSonNombre`: el nombre de una sociedad se arma con
// palabras comunes —"Seguros del Sur S.A."—, y recortarlas ofrecia "Sur
// S.A.", que tildado deja "Seguros del [PERSONA]". Solo se sacan las
// particulas de adelante ("La Inventada S.A."), y el patron no cruza una
// palabra en minuscula, asi que "presidente de" no entra.
const CANDIDATO_SOCIEDAD = new RegExp(
    `[${MAY}][${LETRA}\\d&.'-]*(?:${S}(?:[${MAY}][${LETRA}\\d&.'-]*|${PARTICULA_CUALQUIER_CAJA}|y|&)){0,4}` +
    `${S}(?:S\\.[ \\t]?A\\.(?:[ \\t]?(?:U|S|I\\.[ \\t]?C\\.))?\\.?|S\\.[ \\t]?R\\.[ \\t]?L\\.?|S\\.[ \\t]?C\\.[ \\t]?A\\.?|SRL|SAS|SAU|SA)` +
    `(?![${LETRA}\\d])`,
    'g');

// La aseguradora detras de "la citada en garantia". CASO DE PRUEBA, 27/9/2026,
// del buzon: un nombre de aseguradora hecho de palabras comunes —"X Seguros del
// Plata Transporte Por Tierra"— se ofrecia por pedazos ("Plata Transporte"), y
// tildado dejaba el resto a la vista. Detras del ancla, el nombre es la tira de
// palabras en mayuscula hasta la puntuacion, con "del", "de", "y" y "&" en el
// medio, y el tipo societario si lo hay. SE OFRECE, NO SE TAPA: es una empresa, y
// tapar o no una empresa es decision de quien conoce el expediente.
const CANDIDATO_CITADA = new RegExp(
    `(?:${enLasTresCajas(['citad[oa]s?[ \\t]+en[ \\t]+garant[ií]a', 'aseguradora'])})[ \\t]*,?[ \\t]*(?:la[ \\t]+|La[ \\t]+|LA[ \\t]+)?` +
    // La particula entera y seguida de otra palabra en mayuscula: sin el borde,
    // "de" calzaba adentro de "del" y el nombre se cortaba ahi.
    `([${MAY}][${LETRA}\\d&.'-]*(?:${S}(?:[${MAY}][${LETRA}\\d&.'-]*|(?:${PARTICULA_CUALQUIER_CAJA}|y|&)(?![${LETRA}])(?=${S}(?:${PARTICULA_CUALQUIER_CAJA}${S})?[${MAY}]))){1,7})`,
    'g');

// Palabras que delatan un falso positivo. Un nombre propio no lleva verbos,
// preposiciones ni sustantivos del oficio; los titulos de los escritos, que van
// en mayusculas y por eso disparan el detector, estan llenos de estas.
const NO_SON_PERSONAS = new Set(`
aires astrea sala administrativo civil comercial abogados procuradores nacion
nacional buenos capital federal provincia hammurabi depalma abeledo perrot
rubinzal culzoni juzgado camara corte suprema tribunal secretaria fuero
instancia laboral penal contencioso ciudad autonoma justicia poder judicial
ley leyes derecho codigo articulo art inciso expediente autos caratulados
demanda demandado demandada actor actora parte partes tercero citada garantia
recurso reposicion apelacion nulidad queja excepcion excepciones incidente
sentencia resolucion providencia decreto traslado notificacion cedula oficio
prueba pericia perito perita pericial testimonial informativa confesional documental
juez jueza fiscal defensor defensora prosecretario prosecretaria ujier oficial
martillero martillera escribano escribana contador contadora medico medica
ingeniero ingeniera arquitecto arquitecta abogado abogada doctor doctora
titular subrogante interino interina presidente vocal ministro auxiliar
honorarios costas intereses tasa plazo plazos rebeldia caducidad
caso objeto presupuesto material orden publico procesal apoderado patrocinio
letrado poder escrito presentacion contestacion liquidacion ejecucion titulo
deuda pago capital seguro seguros poliza siniestro cobertura asegurado
aseguradora sociedad consorcio propiedad horizontal expensas inmueble
unidad funcional contrato clausula danos perjuicios lucro cesante moral
tener deje dejar solicita solicito interpone plantea opone contesta acompana
ofrece hace hago reserva manifiesta denuncia impugna promueve inicia formula
por con sin para del las los que son sea sus una uno este esta ese esa
nuestro nuestra verdadero efecto subsidio conforme atento visto vistos
primera segunda tercera vista informe constancia monto suma total general
considerando resuelvo resuelve notifiquese registrese proveido despacho
vease conf cfr ver citado citada supra infra
comparece comparecen comparecio comparecieron declara declaro declaran
declararon ratifica ratifico expone dice siendo otrosi respecto cuando
donde ademas tambien entonces finalmente oportunamente notese observese
hagase tengase agreguese librese remitase glosese estese cumplase designa
designo fija fijo luego asimismo seguidamente acto seguido previo
oficios judiciales notificador entradas mesa virtual link reunion clave
acceso sistema lex100 sne

# Las de abajo entraron el 21/8/2026, con las dos reglas de candidatos de DOS
# palabras. Con tres palabras el ruido era tolerable; con dos, un expediente de
# muchas paginas propone "Razon Social" y "Codigo Producto" tantas veces como
# propone un apellido, y una lista de candidatos que no se puede leer no se
# lee: se tilda entera, que es exactamente como se corrompieron 27 lugares del
# texto en la prueba que motivo este cambio.

# La ficha del un formulario oficial, que viene como formulario.
apellidos nombres clase nacionalidad argentina argentino argentinos masculino
femenino oficina padre madre tramite idtramite ejemplar toma formulario
nacimiento nac foto huella mano manos derecha izquierda pulgar indice anular
menique dedo sexo domicilio piso entre calle avenida

# Facturas y planillas, que son la mitad de las fojas de un expediente de cobro.
razon social comercial ingresos brutos codigo producto servicio cantidad bonif
subtotal neto gravado exento inscripto responsable sujeto condicion venta
comprobante factura remito periodo facturado desde hasta vencimiento unitario
unit medida precio cuit cuil iva alicuota descuento importe importes observaciones
observacion copia copias requirente requerido patrocinante folio tomo matricula

# Montos escritos en letras: "NUEVE MILLONES DOSCIENTOS OCHENTA" tiene la forma
# de un nombre en mayusculas. No se filtran "diez" ni "leon", que son apellidos.
mil millon millones ciento cientos doscientos trescientos cuatrocientos
quinientos seiscientos setecientos ochocientos novecientos veinte treinta
cuarenta cincuenta sesenta setenta ochenta noventa cero

# Titulos de escritos y caratulas de cedula, que van en mayusculas y por eso
# disparan las dos reglas nuevas.
habeas corpus insania urgente notificar habilitacion dia dias hora horas
pregunta preguntas indicativa indicativas afirmativa afirmativas hechos
hecho relevantes facturas impagas debidamente rechazadas rechazada
economico economica contenido derechos humanos
inhabil inhabiles audiencia designe nuevo nueva unica unico

# Las de abajo entraron el 15/9/2026, de un escrito de contestacion de traslado
# que ofrecio siete candidatos que no eran nadie. Las palabras que terminan en
# -cion, -tiva y parecidas no estan: las alcanza TERMINACION_QUE_NO_ES_NOMBRE.
#
# Los tratamientos, porque pegados a un lugar arman la forma "Apellido, Nombre":
# "...de la CABA, Dra. Ana" proponia "CABA, Dra". Y porque en la caratula son el
# borde del nombre: "SUCESORES DEL SR. JUAN PEREZ" ofrecia el "SR." adentro.
sr sra sres sras srta dr dra dres dras
#
# Los cargos, porque detras de un tratamiento lo que viene hasta la primera
# palabra que no es de nombre se toma como nombre: "la Sra. Directora General"
# sin estas saldria como "Sra. [PERSONA] General".
director directora secretario subsecretario subsecretaria procurador
procuradora coordinador coordinadora jefe jefa gerente vicepresidente
intendente gobernador gobernadora diputado diputada senador senadora concejal
asesor asesora curador curadora sindico sindica interventor interventora
administrador administradora
caba departamento sucesores sucesor sucesion herederos
heredero cedente cedentes cesionario cesionaria litigiosos expresa expreso
ineficacia eficacia sustancial sobre todo toda evento cobro pesos

# Las de abajo entraron el 17/9/2026, por E-02: la lista de candidatos traia
# mas ruido que senial. Sobre un testimonio fueron diez candidatos y los diez
# eran falsos. NO ES UN PROBLEMA DE PROLIJIDAD: una lista que no se puede leer
# se tilda en diagonal, y en diagonal es donde se escapa E-01, que es la fuga
# grave. Sacar ruido de aca es lo que hace que la fuga se vea.
#
# EL CRITERIO PARA ELEGIR CADA PALABRA, que es lo que hay que respetar si se
# agregan mas: una palabra de esta lista es un apellido que deja de ofrecerse
# EN TODO EL DOCUMENTO. Asi que entra solo la que no es apellido de nadie.
# Por eso no estan "cuadrado", "prado", "campo", "puente", "sierra" ni "bono",
# que son palabras del oficio Y apellidos reales; el par que las lleva se cae
# igual por la otra palabra ("BONO LEY" se cae por "ley").
#
# Y POR ESO TAMPOCO SE AGREGO NINGUNA TERMINACION NUEVA a
# TERMINACION_QUE_NO_ES_NOMBRE, que seria mas corto: "-al", "-ado", "-ente" y
# "-ico" describen casi todos los adjetivos del oficio y tambien a Sandoval,
# Machado, Vicente y Federico. Las seis terminaciones que hay son seguras
# porque ningun apellido termina asi; esas cuatro no lo son.

# Unidades de medida, que en una planilla van en mayusculas.
metro metros centimetro centimetros kilometro kilometros kilogramo kilogramos
gramo gramos litro litros tonelada toneladas

# Rubros de una liquidacion o de una escritura.
rubro rubros dano emergente compraventa boleto aporte aportes arancel sellado
gravamen reintegro anticipo saldo cuota cuotas

# Titulos y partes de un documento.
acta actas anexo apartado capitulo punto puntos foja carilla escritura
escribania protocolo minuta planilla fecha

# Adjetivos del oficio: ninguno es apellido.
forense notarial registral catastral electronico electronica digital
telematico cierta cierto util utiles vigente previsional zona sector sede

# Las de abajo entraron el 17/9/2026, y las encontro el conector del paso 3
# probandose a si mismo. Un nombre seguido de la palabra DNI y su numero sale
# como "[PERSONA], DNI [DNI]", y el detector de restos ofrecia "DNI" como nombre
# propio, porque quedaba capitalizado y pegado a una etiqueta de persona.
#
# Es la forma mas comun que hay -a un nombre le sigue su documento- asi que el
# falso positivo aparecia en casi todos los escritos. Ninguna de estas palabras
# es apellido de nadie, que es el criterio de la lista.
dni documento libreta pasaporte legajo cbu cvu telefono tel celular fax correo
mail email nacionalidad estado edad profesion ocupacion nro numero

# Las de abajo entraron el 22/9/2026, por E-07, pedido de confronteitor. En un
# testimonio para inscribir una declaratoria se ofrecio "Unidades
# Complementarias" como nombre propio: es el rubro del inmueble, y tildado
# destruye el dato que el confronte coteja. "Unidad Funcional" y "Folio Real"
# ya se caian por "unidad", "funcional" y "folio", que estaban arriba; faltaba
# el plural y el adjetivo. "Real" NO entra: es apellido, y el par se cae igual
# por "folio".
unidades complementaria complementarias

# Las de abajo entraron el 3/10/2026, del buzon de fugas: un rol antepuesto al
# nombre entraba adentro del candidato ("Mediador Juan Inventado"), y tildado
# despues bloqueaba la liberacion como resto. Son los auxiliares que faltaban y
# los organos que siguen a "el demandado". Ninguna es apellido de nadie.
mediador mediadora tasador tasadora traductor traductora caligrafo caligrafa
consultor consultora psicologo psicologa psiquiatra licenciado licenciada
kinesiologo kinesiologa odontologo odontologa bioquimico bioquimica actuario
partidor veedor veedora depositario depositaria damnificado damnificada
reclamante causante conyuge superstite testigo testigos
gobierno municipalidad fisco
`.replace(/^\s*#.*$/gm, '').trim().split(/\s+/));

// La caratula tiene forma fija: "X c/ Y s/ OBJETO". De ahi salen las partes.
//
// La "c/" y la "s/" van en cualquier caja. Hasta el 15/9/2026 el patron exigia
// la minuscula, y un escrito que transcribe la caratula entera en mayusculas
// —"PEREZ, JUAN C/ GARCIA, MARIA S/ DANOS"— no daba ninguna parte: ninguna
// venia tildada y el apellido del actor no se ofrecia en ningun lado.
const CARATULA = new RegExp(`([${MAY}][^/\\n]{2,60}?)\\s+[cC]/\\s*([${MAY}][^/\\n]{2,60}?)\\s+[sS]/`);

// "PEREZ, JUAN Y OTROS C/ ...": el "y otros" es de la caratula, no del nombre.
// Tolera "OTOR", la transposicion de letras mas facil de cometer al tipearlo.
const Y_OTROS = /\s+y\s+ot(?:r[oa]|or)s?\.?$/i;

// Los incidentes del PJN no usan "c/": vienen como
//   "INCIDENTE Nº 2 - ACTOR: FICTICIO, ADRIAN DEMANDADO: INVENTADA, BEATRIZ S/EJECUCION"
// Sin esto, las partes de un incidente no se detectan y por lo tanto nunca se
// sugieren: el usuario no se entera de que quedaron en claro. Caso de prueba,
// detectada en pruebas el 11/8/2026.
const CARATULA_ACTOR_DEMANDADO =
    /ACTORA?\s*:\s*(.+?)\s+DEMANDAD[OA]S?\s*:\s*(.+?)\s*(?:S\s*\/|$)/i;

// ---------------------------------------------------------------------------

/** Colapsa el espaciado irregular del PDF. Corre ANTES de anonimizar.
 *
 * pdf.js devuelve espacios dobles y cortes de linea en medio de un nombre. Si
 * se anonimiza sobre eso, ningun patron de varias palabras engancha: el texto
 * se ve bien y no se reemplaza nada.
 */
export function normalizarEspacios(texto) {
    return unificarEspacios(texto)
        .replace(/\u00AD/g, '')          // guion suave de corte de linea
        // Los de ancho cero se sacan: adentro de una palabra la parten en dos.
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n');
}

/** Los espacios que no se ven, convertidos en el espacio comun, uno por uno.
 *
 * LOS ESPACIOS QUE NO SE VEN, 27/9/2026. Un PDF trae a veces el espacio duro
 * (U+00A0) o el fino (U+2009) entre las palabras de un nombre. En pantalla es
 * un espacio; para los patrones, que separan con `[ \t]`, no lo es, y "Camilo
 * Amaranto Rivera" escrito asi NO SE OFRECIA NUNCA para tildar: quedaba en
 * claro y la constancia no lo nombraba.
 *
 * Va aparte de `normalizarEspacios` para el conector: cambia cada caracter por
 * otro y no mueve nada de lugar, asi que quien llama recibe el texto con el
 * mismo largo que mando.
 */
export function unificarEspacios(texto) {
    return texto.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');
}

function sinTildes(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escapar(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// La traza: que pedazo del ORIGINAL quedo debajo de cada etiqueta.
//
// POR QUE, 3/10/2026 (PLAN_SELECTOR.md, fase 1). La pantalla que elige sobre el
// texto necesita saber, de cada etiqueta, que tapo, con que regla y donde estaba
// en el original: para pintarla, para "destapar aca" y para unir una seleccion
// con una etiqueta vecina. `anonimizar()` devuelve solo el texto final, y
// reconstruir eso despues -comparando el original con el resultado- es adivinar:
// un " " o un "de" calzan en cualquier lado.
//
// Asi que se anota mientras se reemplaza. `mapa[i]` dice de donde salio el
// caracter i del texto actual: un numero (su posicion en el original) o el tramo
// al que pertenece si es parte de una etiqueta. Cada pasada de reemplazo rehace
// el mapa con lo que cambio. Solo corre si se la pide: `anonimizar()` no la usa y
// no paga nada.
// ---------------------------------------------------------------------------

const UNA_ETIQUETA = /(\[[^[\]\n]{1,40}\])/;

function crearTraza(texto) {
    let mapa = Array.from({ length: texto.length }, (_, i) => i);

    const extension = (entradas) => {
        let desde = Infinity;
        let hasta = -Infinity;
        for (const c of entradas) {
            const [d, h] = typeof c === 'number' ? [c, c + 1] : [c.desde, c.hasta];
            desde = Math.min(desde, d);
            hasta = Math.max(hasta, h);
        }
        return [desde, hasta];
    };

    // El medio de un reemplazo puede traer mas de una etiqueta con texto
    // conservado entre ellas: "FDO.: [PERSONA] - [PERSONA]". Cada etiqueta es
    // un tramo; lo de entre medio se busca en lo que habia y conserva su origen.
    // Si algo no se encuentra, todo el medio queda como un solo tramo: es menos
    // fino, y nunca es falso.
    function partirMedio(medio, viejoTexto, viejo, origen, regla) {
        const partes = medio.split(UNA_ETIQUETA);       // texto, etiqueta, texto...
        if (partes.length < 5) return null;             // una sola etiqueta
        const salida = [];
        let pos = 0;
        let abierta = null;                             // espera saber hasta donde llega
        const cerrar = (fin) => {
            const [desde, hasta] = extension(viejo.slice(pos, fin));
            if (desde === Infinity) return false;
            Object.assign(abierta, { desde, hasta });
            pos = fin;
            abierta = null;
            return true;
        };
        for (let i = 0; i < partes.length; i++) {
            const parte = partes[i];
            if (i % 2 === 1) {
                if (abierta) return null;               // dos etiquetas pegadas
                abierta = { etiqueta: parte, origen, regla };
                for (let k = 0; k < parte.length; k++) salida.push(abierta);
            } else if (parte) {
                const donde = viejoTexto.indexOf(parte, pos);
                if (donde < 0 || (!abierta && donde !== pos)) return null;
                if (abierta && !cerrar(donde)) return null;
                for (let k = 0; k < parte.length; k++) salida.push(viejo[donde + k]);
                pos = donde + parte.length;
            }
        }
        if (abierta) return cerrar(viejoTexto.length) ? salida : null;
        return pos === viejoTexto.length ? salida : null;
    }

    return {
        aplicar(eventos, origen, regla) {
            const nuevo = [];
            let cursor = 0;
            for (const { offset, match, salida } of eventos) {
                for (let i = cursor; i < offset; i++) nuevo.push(mapa[i]);
                const viejo = mapa.slice(offset, offset + match.length);
                let p = 0;
                while (p < match.length && p < salida.length && match[p] === salida[p]) p++;
                let q = 0;
                while (q < match.length - p && q < salida.length - p &&
                    match[match.length - 1 - q] === salida[salida.length - 1 - q]) q++;
                for (let i = 0; i < p; i++) nuevo.push(viejo[i]);
                const medio = salida.slice(p, salida.length - q);
                if (medio) {
                    const viejoMedio = viejo.slice(p, match.length - q);
                    const partido = partirMedio(medio, match.slice(p, match.length - q), viejoMedio, origen, regla);
                    if (partido) nuevo.push(...partido);
                    else {
                        let [desde, hasta] = extension(viejoMedio);
                        if (desde === Infinity) {
                            const antes = [...nuevo].reverse().find((c) => typeof c === 'number');
                            desde = hasta = antes === undefined ? 0 : antes + 1;
                        }
                        const tramo = { etiqueta: medio, origen, regla, desde, hasta };
                        for (let i = 0; i < medio.length; i++) nuevo.push(tramo);
                    }
                }
                for (let i = match.length - q; i < match.length; i++) nuevo.push(viejo[i]);
                cursor = offset + match.length;
            }
            for (let i = cursor; i < mapa.length; i++) nuevo.push(mapa[i]);
            mapa = nuevo;
        },

        /** Los tramos sobre el texto final y sobre el original, en orden. */
        tramos(final) {
            const salida = [];
            for (let i = 0; i < mapa.length; i++) {
                const t = mapa[i];
                if (typeof t === 'number') continue;
                let j = i;
                while (j + 1 < mapa.length && mapa[j + 1] === t) j++;
                salida.push({
                    desde: t.desde, hasta: t.hasta, inicio: i, fin: j + 1,
                    etiqueta: final.slice(i, j + 1), origen: t.origen, regla: t.regla,
                });
                i = j;
            }
            return salida;
        },
    };
}

/** `texto.replace(patron, fn)` que, con traza, anota que cambio y donde. */
function reemplazar(texto, patron, fn, traza, origen, regla) {
    if (!traza) return texto.replace(patron, fn);
    const eventos = [];
    const nuevo = texto.replace(patron, (...args) => {
        const salida = fn(...args);
        const conGrupos = typeof args[args.length - 1] === 'object';
        const offset = args[args.length - (conGrupos ? 3 : 2)];
        if (salida !== args[0]) eventos.push({ offset, match: args[0], salida });
        return salida;
    });
    if (eventos.length) traza.aplicar(eventos, origen, regla);
    return nuevo;
}

function aplicarReglas(texto, reglas, conteo, traza = null) {
    for (const { nombre, patron, reemplazo } of reglas) {
        let n = 0;
        texto = reemplazar(texto, patron, (...args) => {
            const salida = typeof reemplazo === 'function'
                ? reemplazo(...args)
                : expandir(reemplazo, args);
            if (salida !== args[0]) n++;
            return salida;
        }, traza, 'regla', nombre);
        if (n) conteo[nombre] = (conteo[nombre] || 0) + n;
    }
    return texto;
}

// `$1`, `$2`... a mano. Se usa un reemplazo por funcion en todas las reglas
// para poder contar solo los cambios reales —una regla que devuelve lo mismo
// que encontro no reemplazo nada, y contarla mentiria en el reporte—, y ahi la
// expansion automatica de String.replace ya no corre.
function expandir(plantilla, args) {
    return plantilla.replace(/\$(\d)/g, (_, d) => args[Number(d)] ?? '');
}

/** Aplica las reglas deterministicas y los reemplazos elegidos por el usuario.
 *
 * Devuelve `{ texto, conteo }`, donde `conteo` es un objeto regla -> cantidad.
 * El conteo no es estadistica: es la constancia de que se reemplazo, y es lo
 * unico que le permite a alguien auditar el resultado sin releer el documento
 * entero contra el original.
 *
 * NINGUNA CLAVE DEL CONTEO PUEDE LLEVAR TEXTO DEL DOCUMENTO. El conteo se
 * imprime tal cual al pie del .md (documento.js), asi que una clave con el
 * nombre adentro es el nombre publicado en el archivo anonimizado.
 *
 * CASO DE PRUEBA, encontrada el 21/8/2026 revisando la salida de un expediente de
 * muchas paginas: la clave de cada reemplazo elegido era `elegido: ${original}`, y
 * la constancia terminaba con varios nombres y la cantidad de veces que
 * aparecia cada uno. El archivo traia abajo el diccionario para deshacerlo.
 *
 * Es el mismo bug que documento.js fue escrito para evitar —el nombre del
 * archivo en el titulo— una funcion mas abajo y en el otro extremo del .md.
 * Por eso la clave lleva la etiqueta ([PERSONA], [ACTOR]) y no el nombre: el
 * detalle por nombre esta en la pantalla, que es donde no sale de la maquina.
 */
export function anonimizar(texto, elegidos = [], opciones = {}) {
    const { texto: salida, conteo } = correr(texto, elegidos, opciones, null);
    return { texto: salida, conteo };
}

/** Lo mismo que `anonimizar`, y ademas que quedo debajo de cada etiqueta.
 *
 * Devuelve `{ texto, conteo, tramos }`. Cada tramo es
 * `{ desde, hasta, inicio, fin, etiqueta, origen, regla }`: `desde`/`hasta` en
 * el texto ORIGINAL (lo que se tapo), `inicio`/`fin` en el texto final (donde
 * esta la etiqueta), `origen` es 'regla', 'elegido' o 'descubierto', y `regla`
 * el nombre de la regla o la etiqueta elegida. El texto y el conteo son
 * identicos a los de `anonimizar` con los mismos argumentos: lo prueba
 * `verificar-escribiente` sobre todo su banco.
 *
 * `opciones` acepta las mismas dos cosas que `anonimizar`:
 *   - `excepciones`: textos que NINGUNA regla de nombres tapa —"no es persona:
 *     es un autor"—. Corren despues de los elegidos, asi que un nombre elegido
 *     gana. Solo cuentan los de DOS palabras o mas: un apellido suelto como
 *     excepcion dejaria medio nombre a la vista en cada homonimo.
 *   - `noTapar`: rangos `{desde, hasta}` del original que no se tocan con
 *     nada —"destapar aca"—. Se protegen antes de todo.
 */
export function anonimizarConTramos(texto, elegidos = [], opciones = {}) {
    const traza = crearTraza(texto);
    const r = correr(texto, elegidos, opciones, traza);
    return { ...r, tramos: traza.tramos(r.texto) };
}

// Lo protegido se cambia por caracteres de uso privado DEL MISMO LARGO —uno
// distinto por cada aparicion— y se devuelve al final. Del mismo largo, para que
// la traza no tenga nada que anotar; de uso privado, porque ninguna regla los ve
// como letra ni como digito. Los espacios quedan: un nombre partido en dos
// renglones sigue partido igual.
const PRIMER_PRIVADO = 0xE000;

function proteger(texto, desde, hasta, guardados) {
    const original = texto.slice(desde, hasta);
    const marca = String.fromCharCode(PRIMER_PRIVADO + (guardados.length % 6000));
    guardados.push({ original, marca: original.replace(/\S/g, marca) });
    return texto.slice(0, desde) + guardados.at(-1).marca + texto.slice(hasta);
}

function devolverProtegidos(texto, guardados) {
    for (const { original, marca } of guardados) {
        const donde = texto.indexOf(marca);
        // Una regla se comio un pedazo protegido. No paso nunca en el banco, y si
        // pasa es mejor que se note: devolver otra cosa seria corromper el texto
        // en silencio.
        if (donde < 0) throw new Error('Una regla tapó texto protegido como excepción: no se puede devolver.');
        texto = texto.slice(0, donde) + original + texto.slice(donde + marca.length);
    }
    return texto;
}

function correr(texto, elegidos, { excepciones = [], noTapar = [] } = {}, traza) {
    const conteo = {};
    const guardados = [];

    // "Destapar aca": antes de todo, sobre el original, que todavia coincide
    // posicion por posicion con el texto.
    for (const { desde, hasta } of [...noTapar].sort((a, b) => a.desde - b.desde)) {
        if (Number.isInteger(desde) && Number.isInteger(hasta) && desde >= 0 && hasta <= texto.length && desde < hasta)
            texto = proteger(texto, desde, hasta, guardados);
    }

    texto = aplicarReglas(texto, REGLAS_IDENTIFICADORES, conteo, traza);

    // De mas largo a mas corto, sin depender del orden en que llegaron. Con
    // "Estudio Juridico Ficticio" y "Ficticio" al reves, el corto pega primero y
    // deja "Estudio Juridico [ESTUDIO]": un reemplazo parcial, que es peor que
    // ninguno porque parece hecho.
    const ordenados = [...elegidos].sort((a, b) => b.texto.length - a.texto.length);
    for (const { texto: original, reemplazo } of ordenados) {
        if (!original || !original.trim()) continue;
        // Tolerante al espaciado: el texto de un PDF trae espacios dobles y
        // saltos de linea en medio de un nombre, asi que un escape literal no
        // engancha nada. Esto fue un bug real, no una precaucion teorica.
        const fuente = original.trim().split(/\s+/).map(escapar).join('\\s+');
        const patron = new RegExp(`${ANTES}(?:${fuente})${DESPUES}`, 'gi');
        let n = 0;
        texto = reemplazar(texto, patron, (todo, antes) => { n++; return antes + reemplazo; },
            traza, 'elegido', reemplazo);
        // La clave lleva la ETIQUETA, no el nombre. Ver el comentario de arriba
        // de `anonimizar`: el conteo termina impreso en el archivo.
        if (n) conteo[`nombre propio → ${reemplazo}`] =
            (conteo[`nombre propio → ${reemplazo}`] || 0) + n;
    }

    // "No es persona": despues de los elegidos —un nombre elegido gana— y
    // antes de las reglas que miran nombres.
    const deDosPalabras = [...new Set(excepciones.map((e) => String(e || '').trim()))]
        .filter((e) => e.split(/\s+/).filter((p) => !esParticula(p)).length >= 2)
        .sort((a, b) => b.length - a.length);
    for (const excepcion of deDosPalabras) {
        const fuente = excepcion.split(/\s+/).map(escapar).join('\\s+');
        const patron = new RegExp(`${ANTES}(${fuente})${DESPUES}`, 'gi');
        const lugares = [];
        for (const m of texto.matchAll(patron)) lugares.push([m.index + m[1].length, m.index + m[0].length]);
        for (const [desde, hasta] of lugares.reverse()) texto = proteger(texto, desde, hasta, guardados);
    }

    descubiertos = [];
    try {
        texto = aplicarReglas(texto, REGLAS_NOMBRES, conteo, traza);
        texto = taparDescubiertos(texto, descubiertos, conteo, traza);
    } finally {
        descubiertos = null;
    }

    return { texto: devolverProtegidos(texto, guardados), conteo };
}

/** Lo que una regla anclada descubrio, tapado en el resto del texto.
 *
 * POR QUE, 3/10/2026. Una regla anclada tapa el nombre DONDE esta el ancla:
 * "el demandado Juan Inventado" queda tapado, y tres paginas despues "Juan
 * Inventado contesto" sigue en claro, porque ahi no hay ancla. Corrido contra los
 * casos que entraron por la bandeja de `redactor`, era la forma de una de cada
 * diez entradas del buzon: la regla tapaba algunas apariciones y no todas.
 *
 * El ancla es lo que prueba que ESE texto es una persona; la misma persona,
 * con el mismo nombre completo, es la misma en todo el documento. Por eso se
 * propaga solo el nombre de DOS palabras o mas —un apellido suelto es tambien
 * una palabra comun—, con el mismo patron que un nombre tildado: tolerante al
 * espaciado y sin distinguir mayusculas.
 */
function taparDescubiertos(texto, nombres, conteo, traza = null) {
    const propagables = [...new Set(nombres)]
        .filter((n) => !n.includes('[') &&
            n.split(/\s+/).filter((p) => !esParticula(p) && !/^[^.]\.$/.test(p)).length >= 2)
        .sort((a, b) => b.length - a.length);
    let n = 0;
    for (const nombre of propagables) {
        const fuente = nombre.split(/\s+/).map(escapar).join('\\s+');
        texto = reemplazar(texto, new RegExp(`${ANTES}(?:${fuente})${DESPUES}`, 'gi'),
            (todo, antes) => { n++; return antes + '[PERSONA]'; }, traza, 'descubierto', 'nombre descubierto');
    }
    if (n) conteo['nombre descubierto, en el resto del texto'] = n;
    return texto;
}

/** La frase, aparece en el texto como apareceria para reemplazarla?
 *
 * Misma regla que usa `anonimizar` con los elegidos, y por eso vive aca: el
 * borde de palabra que ve las tildes y la tolerancia al espaciado del PDF. Si
 * las dos se separan, alguien pregunta "sigue en el texto?" con un criterio y
 * el motor reemplaza con otro, que es como se construye una constancia falsa.
 */
export function apareceEnElTexto(texto, frase) {
    const fuente = String(frase).trim().split(/\s+/).map(escapar).join('\\s+');
    if (!fuente) return false;
    return new RegExp(`${ANTES}(?:${fuente})${DESPUES}`, 'i').test(texto);
}

/** Donde aparece la frase, con la misma regla: `[{ desde, hasta }]`.
 *
 * Para la pantalla que elige sobre el texto (PLAN_SELECTOR.md): subrayar un
 * candidato y decir "tapar en las 14 apariciones" tiene que contar lo mismo que
 * despues va a tapar el motor, y por eso vive aca y no alla.
 */
export function ubicarEnElTexto(texto, frase) {
    const fuente = String(frase).trim().split(/\s+/).map(escapar).join('\\s+');
    if (!fuente) return [];
    const salida = [];
    for (const m of texto.matchAll(new RegExp(`${ANTES}(${fuente})${DESPUES}`, 'gi'))) {
        const desde = m.index + m[0].length - m[2].length;
        salida.push({ desde, hasta: desde + m[2].length });
    }
    return salida;
}

/** Le saca al candidato las palabras de los extremos que no son nombre.
 *
 * Devuelve `''` si lo que queda no llega a dos palabras, o si la palabra que
 * sobra esta en el medio —"Juan de Dios" no se puede recortar sin inventar—.
 *
 * POR QUE RECORTAR Y NO DESCARTAR. Un patron se queda con el primer calce que
 * encuentra y no vuelve atras: en "Comparece Hector Ernesto Quiroga" el de tres
 * palabras engancha "Comparece Hector Ernesto", y como "comparece" es un verbo
 * el candidato se tiraba entero. El nombre que estaba ahi al lado —el unico
 * que importaba— no se ofrecia nunca, y no porque no se lo detectara: porque
 * el verbo de adelante se lo llevo puesto. Recortando, queda "Hector Ernesto".
 */
// Las particulas se recortan de los bordes —"Registro de la" no termina en un
// nombre— pero se aceptan en el medio: "Lucia Del Monte" es un nombre, y hasta
// el 15/9/2026 el "Del" lo hacia descartar entero.
function recortarPalabrasQueNoSonNombre(completo) {
    const tokens = completo.split(/\s+/);
    const sobra = (t) => noEsNombre(t) || esParticula(t);

    let i = 0;
    let j = tokens.length - 1;
    while (i <= j && sobra(tokens[i])) i++;
    while (j >= i && sobra(tokens[j])) j--;

    const nombre = tokens.slice(i, j + 1);
    if (nombre.length < 2) return '';
    if (nombre.some((t) => noEsNombre(t) && !esParticula(t))) return '';
    return nombre.join(' ').replace(/^,+|,+$/g, '');
}

/** Descarta el candidato que es un pedazo de otro y no aparece por su cuenta.
 *
 * Los seis patrones corren sobre el mismo texto, asi que uno largo y uno corto
 * enganchan el mismo nombre: "Llambias, Jorge Joaquin" propone tambien "Jorge
 * Joaquin". Con seis patrones esto duplica media lista, y una lista que se lee
 * peor se tilda peor.
 *
 * El criterio es la cuenta, no el largo: si el corto aparece MAS veces que el
 * largo, es que ademas esta suelto en el texto —"Ernesto Quiroga" diez veces
 * dentro de un "Hector Ernesto Quiroga" que aparece una— y ahi hay que
 * ofrecerlo, porque el reemplazo del largo no lo va a alcanzar.
 */
function esFragmentoDeOtro(encontrados) {
    const todos = [...encontrados.entries()];
    return ({ texto, apariciones }) => !todos.some(([otro, veces]) =>
        otro !== texto &&
        otro.length > texto.length &&
        veces >= apariciones &&
        new RegExp(`${ANTES}${escapar(texto)}${DESPUES}`).test(otro));
}

/** Nombres propios probables que las reglas NO reemplazaron.
 *
 * Se reportan, no se reemplazan. Devuelve `[{ texto, apariciones, enCitas }]`
 * ordenado por frecuencia.
 *
 * LAS PARTES DE LOS FALLOS CITADOS NO SE OFRECEN, decidido por Javier el
 * 3/10/2026. Un nombre que aparece SOLO adentro de caratulas de fallos citados
 * que no son de la causa -ver `caratulasCitadas`- queda afuera: es
 * jurisprudencia publicada, y era la mayor parte de lo que se tildaba a mano
 * (en un caso, 83 de 95 casillas). Si aparece tambien fuera de una cita, o la
 * cita comparte apellido con la causa, se sigue ofreciendo: ese es el caso de
 * riesgo. Con `{ conCitas: true }` vuelven todos, para quien quiera verlos.
 */
export function candidatosANombre(texto, { conCitas = false } = {}) {
    const encontrados = new Map();
    // Cuantas de las apariciones estan adentro de la caratula de un fallo citado
    // que no es de la causa. Ver `caratulasCitadas`: la pantalla las agrupa.
    const citas = caratulasCitadas(texto).filter((c) => !c.propia);
    const enCitas = new Map();
    const contarCita = (nombre, lugar) => {
        if (citas.some((c) => lugar >= c.desde && lugar < c.hasta))
            enCitas.set(nombre, (enCitas.get(nombre) || 0) + 1);
    };
    // Dos patrones pueden calzar el mismo nombre en el mismo lugar —"Lucia Del
    // Monte" es de tres palabras y tambien de dos con particula—, y contarlo dos
    // veces hace que la pantalla diga "2 veces" de algo que esta una.
    const vistos = new Set();
    for (const patron of CANDIDATOS) {
        patron.lastIndex = 0;
        for (const match of texto.matchAll(patron)) {
            const completo = match[0].replace(/\s+/g, ' ').trim();
            if (completo.includes('[')) continue;      // ya lo tomo otra regla
            const nombre = recortarPalabrasQueNoSonNombre(completo);
            if (!nombre) continue;
            const lugar = match.index + match[0].indexOf(nombre.split(' ')[0]);
            if (vistos.has(`${lugar}|${nombre}`)) continue;
            vistos.add(`${lugar}|${nombre}`);
            encontrados.set(nombre, (encontrados.get(nombre) || 0) + 1);
            contarCita(nombre, lugar);
        }
    }
    for (const match of texto.matchAll(CANDIDATO_CITADA)) {
        const nombre = match[1].replace(/\s+/g, ' ').trim();
        if (nombre.split(' ').filter((p) => !esParticula(p)).length < 2) continue;
        const lugar = match.index + match[0].indexOf(match[1]);
        if (vistos.has(`${lugar}|${nombre}`)) continue;
        vistos.add(`${lugar}|${nombre}`);
        encontrados.set(nombre, (encontrados.get(nombre) || 0) + 1);
        contarCita(nombre, lugar);
    }
    for (const match of texto.matchAll(CANDIDATO_SOCIEDAD)) {
        const palabras = match[0].replace(/\s+/g, ' ').trim().split(' ');
        while (palabras.length > 1 && esParticula(palabras[0])) palabras.shift();
        if (palabras.length < 2) continue;
        const nombre = palabras.join(' ');
        const lugar = match.index + match[0].indexOf(palabras[0]);
        if (vistos.has(`${lugar}|${nombre}`)) continue;
        vistos.add(`${lugar}|${nombre}`);
        encontrados.set(nombre, (encontrados.get(nombre) || 0) + 1);
        contarCita(nombre, lugar);
    }
    return [...encontrados.entries()]
        .map(([texto, apariciones]) => ({ texto, apariciones, enCitas: enCitas.get(texto) || 0 }))
        .filter((c) => conCitas || c.enCitas < c.apariciones)
        .filter(esFragmentoDeOtro(encontrados))
        .sort((a, b) => b.apariciones - a.apariciones || a.texto.localeCompare(b.texto));
}

// ---------------------------------------------------------------------------
// Nivel 2b: lo que quedo pegado a un reemplazo.
//
// E-01 Y E-05 SON EL MISMO MODO DE FALLA, y es el peor que tiene esta
// herramienta: un nombre reemplazado A MEDIAS, que la constancia cuenta como
// reemplazado entero. El archivo se lee como limpio —"no quedaron nombres
// propios sin reemplazar", y segun su cuenta es cierto— justo donde hay medio
// apellido a la vista. Quien revisa confia en la constancia y no mira ahi.
//
// Las dos formas en que aparecio, sobre nueve testimonios: "Apellido,
// [PERSONA]" —el usuario tildo el nombre de pila y no el apellido— y "NOMBRE M.
// [PERSONA]". Sobrevivieron seis nombres de pila, dos apellidos de parte y el
// nombre de pila de un juez.
//
// POR QUE SE MIRA EL TEXTO YA ANONIMIZADO y no la lista de candidatos: la lista
// dice que se propuso, y la fuga esta en que se aplico. Un resto solo se ve
// despues de reemplazar, y mirarlo ahi no depende de adivinar que tildo el
// usuario.
// ---------------------------------------------------------------------------

/** Reconoce una etiqueta de nombre, con numero o sin el.
 *
 * Existe para el conector, y es la guarda que evita que E-01 vuelva por la
 * puerta de atras: quien llama al motor desde afuera elige con que etiqueta
 * tapar, y si elige una que el detector de restos no conoce, el reemplazo
 * funciona y la deteccion de lo que quedo pegado se apaga en silencio. Sin esto
 * el consumidor no tiene como enterarse.
 */
export function esEtiquetaDeNombre(etiqueta) {
    return new RegExp(`^${ETIQUETA_DE_NOMBRE}$`).test(String(etiqueta || '').trim());
}

const PALABRA_SUELTA = `[${MAY}\\d][${LETRA}\\d]*[${LETRA}]`;

// Con un digito adentro hacen falta tres letras, y eso es lo que separa un
// apellido ensuciado de un ordinal. "5TO PISO" y "2do" tienen dos letras y no
// pasan; "0campo" tiene cinco y pasa. Sin la guarda, cada "[DOMICILIO] 5TO" y
// cada "1ra Instancia" entraba en la lista.
function esRestoDeNombre(palabra) {
    if (noEsNombre(palabra) || esParticula(palabra)) return false;
    if (!/[0-9]/.test(palabra)) return true;
    return (palabra.match(new RegExp(`[${LETRA}]`, 'g')) || []).length >= 3;
}

// La inicial del medio, que es la mitad de la segunda forma: "NOMBRE M.
// [PERSONA]". EL PUNTO ES OBLIGATORIO. Sin el, "M" pasa a ser una palabra
// cualquiera y el patron se saltea la primera palabra de un nombre de dos.
const INICIAL_DEL_MEDIO = `(?:[ \\t]+[${MAY}]\\.)?`;

// El separador acepta la coma —"Apellido, [PERSONA]"— y nada mas. Un salto de
// linea no entra, por lo mismo que en todas las reglas de arriba: junta el final
// de un renglon con el principio del siguiente y propone un resto que nunca
// estuvo pegado a nada.
const SEPARADOR = `[ \\t]*,?[ \\t]*`;

// EL SALTO DE LINEA SI ENTRA EN UN CASO, desde el 22/9/2026 (E-07): cuando la
// etiqueta es lo ULTIMO de su renglon, o lo PRIMERO. Ahi el nombre no estaba
// separado de nada: el PDF lo corto. En un testimonio, "Dra. Marta Ines" al
// final de un renglon y "Inventada, DNI..." al principio del siguiente; la
// lista de candidatos ofrece la parte de arriba —sus patrones tampoco cruzan
// el salto—, el usuario la tilda, y el apellido de abajo quedaba en claro sin
// que la constancia lo nombrara. Paso tres veces en el mismo documento, en las
// dos direcciones.
//
// La guarda de arriba sigue valiendo para todo lo demas: con texto entre la
// etiqueta y el fin del renglon, la palabra de abajo no es un resto. El `##`
// es el titulo que el conversor le pone a un renglon en mayusculas, que es
// como suele quedar la caratula.
const SALTO = `[ \\t]*\\n[ \\t]*(?:#{1,6}[ \\t]+)?`;

const RESTOS = [
    // El nombre cortado por el renglon, en las dos direcciones.
    {
        patron: new RegExp(
            `${ANTES}(${PALABRA_SUELTA})${INICIAL_DEL_MEDIO}[ \\t]*,?${SALTO}${ETIQUETA_DE_NOMBRE}`, 'g'),
        grupo: 2,
    },
    {
        patron: new RegExp(`${ETIQUETA_DE_NOMBRE}${SALTO}(${PALABRA_SUELTA})${DESPUES}`, 'g'),
        grupo: 1,
    },
    // Adelante de la etiqueta: "Perez, [PERSONA]", "NOMBRE M. [PERSONA]".
    {
        patron: new RegExp(
            `${ANTES}(${PALABRA_SUELTA})${INICIAL_DEL_MEDIO}${SEPARADOR}${ETIQUETA_DE_NOMBRE}`, 'g'),
        grupo: 2,
    },
    // Detras: "Sr. [PERSONA], Anibal". Es lo que deja la regla de tratamiento
    // cuando el nombre sigue despues de la coma, y tambien el apellido que el
    // OCR ensucio en la PRIMERA letra —"Dra. [PERSONA] 0campo"— donde no hay
    // arreglo por patron y lo unico que se puede hacer es avisar.
    //
    // Y "[PERSONA] A. Ficticia", con una inicial entre la etiqueta y el
    // apellido: es lo que queda si se tilda solo el nombre de pila. Aparecio
    // el 22/9/2026 (E-07) en la firma de un testimonio.
    {
        patron: new RegExp(
            `${ETIQUETA_DE_NOMBRE}${INICIAL_DEL_MEDIO}${SEPARADOR}(${PALABRA_SUELTA})${DESPUES}`, 'g'),
        grupo: 1,
    },
];

/** Nombres propios que quedaron pegados a una etiqueta ya reemplazada.
 *
 * Recibe el texto YA ANONIMIZADO y devuelve `[{ texto, apariciones }]`, donde
 * `apariciones` es cuantas veces quedo pegado —no cuantas veces esta la palabra
 * en el documento, que es mas—. Quien lo muestre en pantalla cuenta sobre el
 * texto original, como hace con las partes de la caratula.
 *
 * NO REEMPLAZA NADA, y no puede hacerlo. Un resto es un indicio fuerte, no una
 * certeza, y aplicarlo solo abre la puerta al desastre que evita el diseno de
 * dos capas: con "Estudio Juridico Ficticio" y "Ficticio" tildado, un resto
 * aplicado solo se come "Juridico", despues "Estudio", y el nombre del estudio
 * termina siendo tres etiquetas seguidas. Se ofrece; lo tilda el humano.
 */
export function restosPegadosAEtiqueta(textoAnonimo) {
    const encontrados = new Map();
    for (const { patron, grupo } of RESTOS) {
        patron.lastIndex = 0;
        for (const match of textoAnonimo.matchAll(patron)) {
            const palabra = match[grupo];
            if (!esRestoDeNombre(palabra)) continue;
            encontrados.set(palabra, (encontrados.get(palabra) || 0) + 1);
        }
    }
    return [...encontrados.entries()]
        .map(([texto, apariciones]) => ({ texto, apariciones }))
        .sort((a, b) => b.apariciones - a.apariciones || a.texto.localeCompare(b.texto));
}

/** Las palabras de un nombre tildado que siguen sueltas en el texto.
 *
 * CASO DE PRUEBA, 26/9/2026. La caratula trae "VACA, JUAN" y se tilda entera;
 * el cuerpo del escrito dice "la demandada VACA" y "la controversia con Vaca",
 * y ahi el apellido no esta pegado a ninguna etiqueta —el detector de arriba no
 * lo ve— ni tiene dos palabras —los candidatos no lo ven—. Salia en claro, y
 * la constancia no lo nombraba. Igual "vinculado a Gomez" y "con Eugenia": el
 * nombre completo aparece una vez, y despues cada foja lo llama por una parte.
 *
 * Es la misma familia que E-01: un nombre que la constancia da por tapado y
 * sigue a la vista. Y se resuelve igual: SE OFRECE, NO SE APLICA. "Juan" o
 * "Vaca" sueltos pueden ser otra persona o una palabra comun; eso lo decide
 * quien conoce el expediente.
 *
 * Recibe el texto YA ANONIMIZADO y los textos tildados. Salen las palabras de
 * tres letras o mas, sin las particulas ni las que no son nombre ("S.A.", "de",
 * "Presidente"), que todavia aparecen enteras en el texto.
 */
export function palabrasSueltasDeElegidos(textoAnonimo, elegidos) {
    const encontradas = new Map();
    for (const elegido of elegidos) {
        const palabras = String(elegido || '').trim().split(/\s+/);
        if (palabras.length < 2) continue;
        for (const cruda of palabras) {
            const palabra = cruda.replace(/^[,.;:"“”'()]+|[,.;:"“”'()]+$/g, '');
            if ((palabra.match(new RegExp(`[${LETRA}]`, 'g')) || []).length < 3) continue;
            if (esParticula(palabra) || noEsNombre(palabra)) continue;
            const clave = palabra.toLowerCase();
            if (encontradas.has(clave)) continue;
            const patron = new RegExp(`${ANTES}${escapar(palabra)}${DESPUES}`, 'gi');
            const veces = [...textoAnonimo.matchAll(patron)].length;
            if (veces) encontradas.set(clave, { texto: palabra, apariciones: veces });
        }
    }
    return [...encontradas.values()]
        .sort((a, b) => b.apariciones - a.apariciones || a.texto.localeCompare(b.texto));
}

// ---------------------------------------------------------------------------
// E-03: etiquetas numeradas y estables dentro de una tanda.
//
// EL PROBLEMA. Todas las personas de un archivo caen en "[PERSONA]" —en un
// testimonio, cincuenta y una veces—, asi que no se distinguen entre si; y dos
// archivos anonimizados por separado no se pueden cruzar, porque la heredera es
// "[PERSONA]" en los dos y nada dice que sea la misma. Es lo que pedia
// `confronteitor` para cotejar un testimonio contra la resolucion que lo
// transcribe.
//
// POR QUE POR TANDA Y NO POR CAUSA, decidido por Javier el 17/9/2026. La
// numeracion estable sin limite —la que sirve meses despues— pide guardar la
// correspondencia nombre → numero en algun lado, Y ESA TABLA ES LA LLAVE PARA
// DESHACER LA ANONIMIZACION. Escribiente promete que nada sale del navegador y
// que nada queda guardado, y esa promesa vale mas que la comodidad. Aca la
// correspondencia vive en memoria mientras la pestania siga abierta: alcanza
// para los archivos que se pasan juntos, que es el caso de uso, y se muere al
// recargar sin dejar nada.
//
// Se descarto derivar el numero del nombre (un hash), que seria estable para
// siempre sin guardar nada: quien sospecha un apellido lo confirma probandolo.
//
// LA CLAVE ES CASE-INSENSITIVE Y SENSIBLE A LAS TILDES, igual que el reemplazo
// de `anonimizar`: ese corre con la bandera `i` y con el texto literal, asi que
// "PEREZ" y "Perez" son el mismo nombre y "Perez" y "Pérez" no. Si el numerador
// normalizara distinto, dos nombres que el motor reemplaza igual tendrian
// numeros distintos, o al reves.
// ---------------------------------------------------------------------------

/** La forma de una etiqueta numerada. Un solo lugar la escribe. */
export function etiquetaNumerada(base, numero) {
    return `[${base}_${numero}]`;
}

/** Abre una tanda de numeracion. Devuelve el numerador, que no guarda nada
 *  fuera de si mismo: se lo tira y la correspondencia desaparece.
 *
 * - `etiqueta(base, nombre)` numera y recuerda. `base` es el nombre pelado de
 *   la etiqueta ("PERSONA"), no "[PERSONA]".
 * - `asignada(base, nombre)` contesta sin numerar, para mostrar en pantalla lo
 *   que ya tiene numero sin gastar uno nuevo.
 *
 * EL NUMERO ES POR ETIQUETA. "[PERSONA_1]" y "[TESTIGO_1]" son dos personas
 * distintas, y esta bien: lo que tiene que ser estable es el par entero, que es
 * lo que aparece en el texto. Cambiar la etiqueta de alguien le da un numero
 * nuevo en la etiqueta nueva y le conserva el viejo en la vieja, asi que volver
 * atras devuelve el mismo.
 */
export function crearNumerador() {
    const asignadas = new Map();
    const clave = (base, nombre) =>
        `${base}|${String(nombre).trim().toLowerCase().replace(/\s+/g, ' ')}`;

    return {
        etiqueta(base, nombre) {
            const k = clave(base, nombre);
            if (!asignadas.has(k)) {
                let usados = 0;
                for (const otra of asignadas.keys()) if (otra.startsWith(`${base}|`)) usados++;
                asignadas.set(k, usados + 1);
            }
            return etiquetaNumerada(base, asignadas.get(k));
        },
        asignada(base, nombre) {
            const n = asignadas.get(clave(base, nombre));
            return n === undefined ? null : etiquetaNumerada(base, n);
        },
        cuantas() { return asignadas.size; },
    };
}

/** Extrae las partes de la caratula. Devuelve `[]`, o `[actor, demandado]`.
 *
 * Se busca sobre una copia con los saltos de linea convertidos en espacios: en
 * un PDF la caratula casi siempre queda cortada en dos renglones, y sin esto el
 * patron engancha solo la mitad de abajo, perdiendo el apellido —que es justo
 * lo que hay que ocultar—.
 */
export function partesDeCaratula(texto) {
    // Sin las marcas de Markdown: un renglon de la caratula que queda todo en
    // mayusculas sale marcado como titulo, y el "##" cortaba el nombre del actor
    // por la mitad —se recorta de derecha a izquierda y "##" no es un nombre—.
    const plano = texto.slice(0, 4000)
        .replace(/^#{1,6}[ \t]+/gm, '')
        .replace(/\*\*/g, '')
        .replace(/\s+/g, ' ');
    const match = CARATULA.exec(plano) || CARATULA_ACTOR_DEMANDADO.exec(plano);
    if (!match) return [];
    return [match[1], match[2]].map(recortarAlNombre).filter((p) => p.length > 3);
}

// Lo que rodea a la cita de un fallo: el tribunal, la sala, la fecha, "Fallos",
// "in re", "cfr.". Mirado antes y despues de las comillas.
const MARCA_DE_CITA = new RegExp(
    '\\b(?:sala|c[aá]mara|c[aá]m\\.|corte|csjn|c\\.s\\.j\\.n|scba|tsj|cnciv|cntrab|cncom|cnfed|cnacaf|' +
    'fallos|in re|precedentes?|fallo|autos|causa|expte|[ií]d\\.|cfr|conf|v\\.)' +
    '|\\d{1,2}[/.]\\d{1,2}[/.]\\d{2,4}',
    'i');

/** Las caratulas de fallos CITADOS, con sus partes.
 *
 * PARA QUE, 3/10/2026 (PLAN_SELECTOR.md). Corrido contra un caso con mucha
 * jurisprudencia citada, casi todo lo que se tildo a mano eran las partes de los
 * fallos que el escrito cita —"esta Sala, “X c/ Y s/ danos” del 12/3/2020"—: la
 * mayor parte de la friccion de la pantalla. Esto no decide nada: las encuentra,
 * para que la pantalla las agrupe y para que, si Javier lo decide, no se ofrezcan.
 *
 * Una cita es un texto entre comillas con "c/" (o "c." o "v.") adentro y una
 * marca de cita cerca. `propia` dice si comparte un apellido con las partes de
 * la caratula de la causa: "lo resuelto en autos “X c/ Y”" cuando X es el actor
 * es justo la que no hay que soltar, y por eso se marca.
 *
 * Devuelve `[{ texto, desde, hasta, partes, propia }]`, con `desde`/`hasta` del
 * texto de adentro de las comillas.
 */
export function caratulasCitadas(texto) {
    const propias = new Set(partesDeCaratula(texto)
        .flatMap((p) => p.split(/[\s,]+/))
        .map(limpiarPalabra)
        .filter((p) => p.length >= 4 && !noEsNombre(p)));
    const salida = [];
    // LA CARATULA CORTADA EN DOS RENGLONES, 3/10/2026. Corrido contra los casos
    // de la bandeja, 31 de 34 citas tenian un salto de linea adentro -el PDF
    // corta donde cae-, y el patron no los cruzaba. Cruza uno simple, no un
    // parrafo, y hasta 300 caracteres.
    for (const m of texto.matchAll(/[“"«]((?:(?!\n[ \t]*\n)[^”"»]){5,300}?)[”"»]/g)) {
        const adentro = m[1].replace(/\s+/g, ' ');
        const corte = adentro.match(/\s+[cCvV][/.]\s*|\s+contra\s+/);
        if (!corte || corte.index < 2) continue;
        const desde = m.index + 1;
        const largo = m[1].length;
        const antes = texto.slice(Math.max(0, m.index - 80), m.index);
        const despues = texto.slice(desde + largo + 1, desde + largo + 101);
        if (!MARCA_DE_CITA.test(antes) && !MARCA_DE_CITA.test(despues)) continue;
        const partes = [adentro.slice(0, corte.index), adentro.slice(corte.index + corte[0].length)]
            .map((p) => p.split(/\s+[sS]\s*\/|\s+[sS]\.\s/)[0])
            .map((p) => p.replace(Y_OTROS, '').replace(/^[\s,.;:]+|[\s,;:]+$/g, ''))
            .filter(Boolean);
        // Las dos partes empiezan en mayuscula: "el actor c. la pared", dentro de
        // la transcripcion de una pericia, tiene comillas, "c." y una fecha cerca.
        if (partes.length < 2 || !partes.every((p) => new RegExp(`^[${MAY}]`).test(p))) continue;
        const propia = partes.some((p) => p.split(/[\s,]+/).some((w) => propias.has(limpiarPalabra(w))));
        salida.push({ texto: adentro, desde, hasta: desde + largo, partes, propia });
    }
    return salida;
}

/** Se queda con los tokens capitalizados del final del fragmento.
 *
 * El patron de caratula arrastra el texto que venia antes ("...en los autos
 * caratulados PEREZ, JUAN"). Se recorta tomando desde el final mientras los
 * tokens sigan pareciendo parte de un nombre, en vez de adivinar donde empieza:
 * cortar de mas deja el apellido a medias, y un apellido a medias filtra igual.
 */
function recortarAlNombre(fragmento) {
    const tokens = fragmento.trim()
        .replace(/^[\s,.;:"“”'«»]+|[\s,.;:"“”'«»]+$/g, '')
        .replace(Y_OTROS, '')
        .split(/\s+/);
    const nombre = [];
    for (let i = tokens.length - 1; i >= 0; i--) {
        const limpio = tokens[i].replace(/^[,.;:"“”'«»]+|[,.;:"“”'«»]+$/g, '');
        if (!limpio) continue;
        // La particula pasa: "JUAN DEL MONTE" se cortaba en el "DEL" y la parte
        // salia como "MONTE". Si queda en el borde izquierdo, se saca abajo.
        if (esParticula(limpio)) { nombre.unshift(tokens[i]); continue; }
        if (!new RegExp(`^[${MAY}]`).test(limpio)) break;
        if (noEsNombre(limpio)) break;
        nombre.unshift(tokens[i]);
        if (nombre.length >= 6) break;
    }
    while (nombre.length && esParticula(nombre[0])) nombre.shift();
    // Las comillas tambien se sacan de los bordes: cada palabra se juzga
    // limpia pero se guarda cruda, y con "VISTOS: «X c/ Y»" la parte salia
    // con la comilla de apertura pegada. Tapada, la comilla desaparecia del
    // texto con el nombre (visto el 3/10/2026 probando el selector).
    return nombre.join(' ').replace(/\s+/g, ' ').replace(/^[\s,.;:"“”'«»]+|[\s,.;:"“”'«»]+$/g, '');
}
