// ---------------------------------------------------------------------------
// Anonimizacion de escritos, resoluciones y expedientes.
//
// Portado de `un sanitizador anterior` del repositorio "otro proyecto", que
// lleva meses de uso sobre documentos de prueba. Los comentarios de cada regla
// vienen de alla y NO son decoracion: cada uno anota una fuga o una corrupcion
// de texto que efectivamente paso. Si vas a tocar un patron, leelo primero;
// casi todos parecen mejorables hasta que se entiende que evitan.
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
const MAY = 'A-ZÁÉÍÓÚÜÑ';
const MIN = 'a-záéíóúüñ';
const LETRA = MAY + MIN;

// Limite de palabra que si ve las tildes: o borde del texto, o algo que no es
// letra ni digito. Se captura y se devuelve en el reemplazo.
const ANTES = `(^|[^${LETRA}\\d])`;
const DESPUES = `(?=[^${LETRA}\\d]|$)`;

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
        patron: new RegExp(`${ANTES}\\d{2}-?\\d{8}-?\\d${DESPUES}`, 'g'),
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
        // el original de otro proyecto y se agrego aca.
        patron: /((?:\$|pesos|suma de|importe de|valor de|monto de)\s*)?(\d{1,2}\.\d{3}\.\d{3})(\s*,\s*\d+|\s*(?:pesos|\$))?/gi,
        reemplazo: (todo, plata, numero, despues) => (plata || despues) ? todo : '[DNI]',
    },
    {
        nombre: 'expediente con contexto',
        // Va ANTES que la regla general a proposito: es mas especifica y
        // consume mas texto. Al reves, la general engancha primero la mitad
        // derecha y "Expte. 56.868/2017" termina como "Expte. 56.[EXPTE]", con
        // los primeros digitos del expediente a la vista. Ese es el estado del
        // original de otro proyecto, donde el orden esta invertido.
        patron: /\b(?:expte|expediente|causa|autos)\.?\s*(?:n[°ºo]?\.?)?\s*\d{1,7}(?:\.\d{3})*\s*\/\s*(?:19|20)\d{2}/gi,
        reemplazo: '[EXPTE]',
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
        patron: /T[ºo°]?\s*\.?\s*\d{1,3}\s*[,/]?\s*F[ºo°]?\s*\.?\s*\d{1,3}/g,
        reemplazo: '[MATRICULA]',
    },
    {
        nombre: 'telefono',
        patron: /(^|[^\d-])((?:\+?54\s*)?(?:11|15)[\s-]?\d{4}[\s-]?\d{4}(?:\s*\/\s*\d{4})?)(?![\d-])/g,
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
        patron: /\b(tel[eé]fonos?|celulares?|cel|fax|tel)(\.?\s*:?\s*)\d{4}[\s-]?\d{4}(?:\s*\/\s*\d{2,4})?/gi,
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

// Siglas que tienen la forma de una patente vieja. Ocultar el numero de un
// articulo deja la cita rota y sin arreglo posible del otro lado.
const NO_ES_DOMINIO = /^(ART|LEY|CPC|CCC|BIS|TER|CSJ|SRL|SAS|IVA|UMA|CPR|LCT|CPP|INC|NRO|FTS)\b/i;

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
        patron: new RegExp(
            `((?:Dr|Dra|Dres|Dras|Sr|Sra|Sres|Sras|Srta|Ing|Lic|Cdor|Cra|Arq|Juez|Jueza|Perito|Martiller[oa])\\.?)` +
            `[ \\t]+[${MAY}][${LETRA}]+(?:[ \\t]+[${MAY}][${LETRA}]+){0,3}`,
            'g'
        ),
        reemplazo: '$1 [PERSONA]',
    },
    {
        nombre: 'domicilio',
        // Calle con altura, con o sin piso y departamento. Mismo criterio que
        // arriba con el salto de linea.
        patron: new RegExp(
            `[${MAY}][${LETRA}]+(?:[ \\t]+[${MAY}]?[${LETRA}]+){0,2}[ \\t]+\\d{1,5}` +
            `(?:[ \\t]*,?[ \\t]*(?:piso|P\\.?B\\.?|dpto|depto|of\\.?|UF)[ \\t]*[${LETRA}\\d"“”']{1,6})+`,
            'gi'
        ),
        reemplazo: '[DOMICILIO]',
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

const CANDIDATOS = [
    // "Perez, Juan Carlos" — forma de caratula y de cita de doctrina.
    new RegExp(`[${MAY}][${MIN}]{2,15},${S}[${MAY}][${MIN}]{2,15}(?:${S}[${MAY}][${MIN}]{2,15})?`, 'g'),
    // "ANALIA GABRIELA ARIAS" — tres o mas palabras seguidas en mayusculas.
    new RegExp(`[${MAY}]{3,}(?:${S}[${MAY}]{3,}){2,}`, 'g'),
    // "Juan Carlos Perez" — tres palabras capitalizadas seguidas.
    new RegExp(`[${MAY}][${MIN}]{2,14}(?:${S}[${MAY}][${MIN}]{2,14}){2}`, 'g'),
    // "PEREZ, Juan" — apellido en mayusculas y nombre capitalizado, que es como
    // el PJN escribe las partes en la caratula.
    new RegExp(`[${MAY}]{3,}(?:${S}[${MAY}]{2,})*,${S}[${MAY}][${MIN}]{2,15}`, 'g'),
];

// Palabras que delatan un falso positivo. Un nombre propio no lleva verbos,
// preposiciones ni sustantivos del oficio; los titulos de los escritos, que van
// en mayusculas y por eso disparan el detector, estan llenos de estas.
const NO_SON_PERSONAS = new Set(`
aires astrea sala administrativo civil comercial abogados procuradores nacion
nacional buenos capital federal provincia hammurabi depalma abeledo perrot
rubinzal culzoni juzgado camara corte suprema tribunal secretaria fuero
instancia laboral penal paz contencioso ciudad autonoma justicia poder judicial
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
`.trim().split(/\s+/));

// La caratula tiene forma fija: "X c/ Y s/ OBJETO". De ahi salen las partes.
const CARATULA = new RegExp(`([${MAY}][^/\\n]{2,60}?)\\s+c/\\s*([${MAY}][^/\\n]{2,60}?)\\s+s/`);

// Los incidentes del PJN no usan "c/": vienen como
//   "INCIDENTE Nº 2 - ACTOR: FICTICIO, ADRIAN DEMANDADO: INVENTADA, BEATRIZ S/EJECUCION"
// Sin esto, las partes de un incidente no se detectan y por lo tanto nunca se
// sugieren: el usuario no se entera de que quedaron en claro. Caso de prueba,
// detectada sobre un expediente en curso el 11/8/2026.
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
    return texto
        .replace(/­/g, '')          // guion suave de corte de linea
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n');
}

function sinTildes(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escapar(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aplicarReglas(texto, reglas, conteo) {
    for (const { nombre, patron, reemplazo } of reglas) {
        let n = 0;
        texto = texto.replace(patron, (...args) => {
            const salida = typeof reemplazo === 'function'
                ? reemplazo(...args)
                : expandir(reemplazo, args);
            if (salida !== args[0]) n++;
            return salida;
        });
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
 */
export function anonimizar(texto, elegidos = []) {
    const conteo = {};

    texto = aplicarReglas(texto, REGLAS_IDENTIFICADORES, conteo);

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
        texto = texto.replace(patron, (todo, antes) => { n++; return antes + reemplazo; });
        if (n) conteo[`elegido: ${original}`] = n;
    }

    texto = aplicarReglas(texto, REGLAS_NOMBRES, conteo);

    return { texto, conteo };
}

/** Nombres propios probables que las reglas NO reemplazaron.
 *
 * Se reportan, no se reemplazan. Devuelve `[{ texto, apariciones }]` ordenado
 * por frecuencia.
 */
export function candidatosANombre(texto) {
    const encontrados = new Map();
    for (const patron of CANDIDATOS) {
        patron.lastIndex = 0;
        for (const match of texto.matchAll(patron)) {
            const completo = match[0].replace(/\s+/g, ' ').trim();
            if (completo.includes('[')) continue;      // ya lo tomo otra regla
            const palabras = sinTildes(completo.replace(/,/g, ' ').toLowerCase()).split(/\s+/);
            if (palabras.some((p) => NO_SON_PERSONAS.has(p))) continue;
            encontrados.set(completo, (encontrados.get(completo) || 0) + 1);
        }
    }
    return [...encontrados.entries()]
        .map(([texto, apariciones]) => ({ texto, apariciones }))
        .sort((a, b) => b.apariciones - a.apariciones || a.texto.localeCompare(b.texto));
}

/** Extrae las partes de la caratula. Devuelve `[]`, o `[actor, demandado]`.
 *
 * Se busca sobre una copia con los saltos de linea convertidos en espacios: en
 * un PDF la caratula casi siempre queda cortada en dos renglones, y sin esto el
 * patron engancha solo la mitad de abajo, perdiendo el apellido —que es justo
 * lo que hay que ocultar—.
 */
export function partesDeCaratula(texto) {
    const plano = texto.slice(0, 4000).replace(/\s+/g, ' ');
    const match = CARATULA.exec(plano) || CARATULA_ACTOR_DEMANDADO.exec(plano);
    if (!match) return [];
    return [match[1], match[2]].map(recortarAlNombre).filter((p) => p.length > 3);
}

/** Se queda con los tokens capitalizados del final del fragmento.
 *
 * El patron de caratula arrastra el texto que venia antes ("...en los autos
 * caratulados PEREZ, JUAN"). Se recorta tomando desde el final mientras los
 * tokens sigan pareciendo parte de un nombre, en vez de adivinar donde empieza:
 * cortar de mas deja el apellido a medias, y un apellido a medias filtra igual.
 */
function recortarAlNombre(fragmento) {
    const tokens = fragmento.trim().replace(/^[\s,.;:"“”']+|[\s,.;:"“”']+$/g, '').split(/\s+/);
    const nombre = [];
    for (let i = tokens.length - 1; i >= 0; i--) {
        const limpio = tokens[i].replace(/^[,.;:"“”']+|[,.;:"“”']+$/g, '');
        if (!limpio) continue;
        if (!new RegExp(`^[${MAY}]`).test(limpio)) break;
        if (NO_SON_PERSONAS.has(sinTildes(limpio.toLowerCase()))) break;
        nombre.unshift(tokens[i]);
        if (nombre.length >= 6) break;
    }
    return nombre.join(' ').replace(/\s+/g, ' ').replace(/^[\s,.;:]+|[\s,.;:]+$/g, '');
}
