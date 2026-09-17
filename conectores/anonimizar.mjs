// El anonimizador de Escribiente, consultable desde afuera del navegador.
//
// Es el paso 3 de docs/PLAN_MOTOR_UNICO.md: la costura que `redactor` hoy tiene
// escrita en Python, expuesta sobre el motor JS que queda como unico. Cuelga de
// los dos transportes que ya existen -conectores/http.mjs y conectores/mcp.mjs-
// igual que el calendario, y como aquel NO CALCULA NADA: carga
// escribiente/js/motor/anonimizar.js tal como esta y traduce a JSON.
//
// POR QUE VIVE ACA Y NO EN EL REPOSITORIO QUE LO CONSUME. Decidido el 17/9/2026.
// Un conector no es plomeria: es la cara publica de un motor. Si vive lejos del
// motor, el motor vuelve a tener dos casas, que es exactamente la falla que este
// plan existe para terminar. Ademas se prueba contra el mismo banco en la misma
// corrida de CI, y repite un patron ya visto funcionar y ya visto fallar: el de
// plazos, que `pipeline/plazos.py` levanta como subproceso Node.
//
// LAS DOS CAPAS, QUE ES LO UNICO QUE HAY QUE ENTENDER ANTES DE USARLO:
//
//   1. Lo que tiene forma inequivoca se reemplaza solo -DNI, CUIT, CBU,
//      telefono, expediente, matricula, correo, domicilio, y los campos de
//      formulario-. `anonimizar_texto` sin `elegidos` hace esto y nada mas.
//      Sirve para cualquier consumidor, con pantalla o sin ella.
//
//   2. Los nombres propios SE PROPONEN Y NUNCA SE APLICAN SOLOS. Ninguna regla
//      distingue "Perez, Juan Carlos" -la parte- de "Llambias, Jorge Joaquin"
//      -doctrina- ni de "Buenos Aires, Astrea", que es una editorial. Este
//      conector no elige por nadie: `candidatos_a_nombre` devuelve la lista y
//      alguien tiene que confirmarla antes de que `anonimizar_texto` la aplique.
//
//   Un consumidor sin pantalla puede usar la capa 1 y NO puede aplicar la capa 2
//   sin alguien que tilde. Los dos consumidores de hoy tienen pantalla; el dia
//   que aparezca uno que no, esto es lo que decide.
//
// LO QUE NO HACE, A PROPOSITO: no abre archivos. `redactor` tiene un
// `sanitizar_caso(base)` que recorre la carpeta del caso, y esa parte se queda
// alla. Este repositorio es el unico publico de los cinco y no tiene por que
// saber donde viven las carpetas de una causa; el que llama lee sus archivos y
// manda texto.

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { ErrorDeEntrada } from './nucleo.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

let motor = null;

// El motor es un modulo ES del navegador y no toca el DOM, asi que se importa
// tal cual. Se resuelve por ruta de archivo para no depender de desde donde se
// corrio el proceso, igual que nucleo.mjs, y con pathToFileURL porque en
// Windows una ruta con letra de unidad no es una URL valida.
async function cargar() {
    if (!motor) {
        motor = await import(
            pathToFileURL(join(RAIZ, 'escribiente', 'js', 'motor', 'anonimizar.js')).href
        );
    }
    return motor;
}

// El texto es obligatorio SIEMPRE y vacio no vale. Es la regla de los
// conectores: cuando falta un dato no se devuelve un resultado, se devuelve el
// motivo. Un texto vacio anonimizado da un texto vacio, que se lee como "no
// habia nada que tapar" cuando lo que paso es que no llego nada.
function exigirTexto(valor, campo = 'el texto') {
    if (typeof valor !== 'string' || !valor.trim()) {
        throw new ErrorDeEntrada(`Falta ${campo}, o vino vacío.`);
    }
    return valor;
}

/** Valida los reemplazos que eligio quien llama.
 *
 * LA GUARDA QUE JUSTIFICA QUE ESTO SEA UN CONECTOR Y NO UN `import`. Quien
 * llama elige con que etiqueta tapar cada nombre, y una etiqueta inventada
 * -"[PARTE]", "[NOMBRE_1]"- reemplaza igual PERO APAGA LA DETECCION DE RESTOS:
 * el motor deja de reconocer lo que quedo pegado al reemplazo, que es la fuga
 * E-01, y nadie se entera. Aca se rechaza antes de tapar nada.
 *
 * Las numeradas -"[PERSONA_2]"- si valen: son E-03, y son lo que permite cruzar
 * dos documentos. Quien llama lleva su propia numeracion; el conector no
 * recuerda nada entre llamadas y no guarda la tabla de nombre a numero, que es
 * la llave para deshacer la anonimizacion.
 */
async function revisarElegidos(elegidos) {
    if (elegidos === undefined || elegidos === null) return [];
    if (!Array.isArray(elegidos)) {
        throw new ErrorDeEntrada('«elegidos» tiene que ser una lista de { texto, reemplazo }.');
    }
    const { esEtiquetaDeNombre, ETIQUETAS_DE_NOMBRE } = await cargar();

    return elegidos.map((e, i) => {
        const donde = `el elegido n° ${i + 1}`;
        if (!e || typeof e !== 'object') {
            throw new ErrorDeEntrada(`${donde} tiene que ser un objeto { texto, reemplazo }.`);
        }
        if (typeof e.texto !== 'string' || !e.texto.trim()) {
            throw new ErrorDeEntrada(`A ${donde} le falta «texto», que es el nombre a tapar.`);
        }
        if (!esEtiquetaDeNombre(e.reemplazo)) {
            throw new ErrorDeEntrada(
                `«${e.reemplazo}» no es una etiqueta de nombre, así que ${donde} no se aplica. ` +
                `Las válidas son ${ETIQUETAS_DE_NOMBRE.join(', ')}, y las mismas con un número ` +
                `detrás ([PERSONA_2]). Una etiqueta inventada reemplaza igual pero apaga la ` +
                `detección de lo que queda pegado al reemplazo, que es una fuga conocida.`
            );
        }
        return { texto: e.texto, reemplazo: e.reemplazo.trim() };
    });
}

/** Anonimiza un texto: la capa 1 siempre, la capa 2 solo con `elegidos`. */
export async function anonimizarTexto(entrada) {
    const { anonimizar, restosPegadosAEtiqueta } = await cargar();
    const texto = exigirTexto(entrada.texto);
    const elegidos = await revisarElegidos(entrada.elegidos);

    const r = anonimizar(texto, elegidos);

    // LOS RESTOS VAN SIEMPRE EN LA RESPUESTA, no en una herramienta aparte que
    // haya que acordarse de llamar. Un nombre reemplazado a medias -"Perez,
    // [PERSONA]" cuando se tapo solo el nombre de pila- queda a la vista y la
    // constancia lo cuenta como reemplazado: el archivo se lee como limpio. Es
    // E-01, la fuga mas grave que tuvo esta herramienta, y la unica forma de que
    // un consumidor no la repita es que no pueda no verla.
    const restos = restosPegadosAEtiqueta(r.texto);

    return {
        ok: true,
        texto: r.texto,
        conteo: r.conteo,
        restos,
        aviso: restos.length > 0
            ? 'Quedaron nombres pegados a un reemplazo: están en «restos». Son la otra ' +
              'mitad de un nombre que ya se está tapando y siguen en el texto. Hay que ' +
              'resolverlos antes de dar el texto por anonimizado.'
            : null
    };
}

/** Los nombres propios probables que NINGUNA regla reemplazo. Se proponen. */
export async function candidatosANombre(entrada) {
    const { candidatosANombre: candidatos } = await cargar();
    return { ok: true, candidatos: candidatos(exigirTexto(entrada.texto)) };
}

/** Las partes de la caratula, EN ORDEN: primero el actor, despues el demandado. */
export async function partesDeCaratula(entrada) {
    const { partesDeCaratula: partes } = await cargar();
    const encontradas = partes(exigirTexto(entrada.texto));

    // EL ORDEN ES CONTRATO Y NO UN DETALLE. En "X c/ Y" el primero es el actor,
    // y `redactor` los etiqueta distinto a proposito: con los dos como [PERSONA]
    // el modelo no sabe quien pide y quien resiste.
    //
    // Y NO HAY CARATULA NO ES LISTA VACIA. Una lista vacia se lee como "busque y
    // no hay nadie"; lo que pasa es que el texto no tiene la forma de la que se
    // sacan las partes, que es otra cosa y se arregla de otra manera.
    if (encontradas.length === 0) {
        return {
            ok: false,
            problema: 'No se encontró una carátula en el texto. Reconoce dos formas: la ' +
                'corriente, con las partes separadas por «c/» y el objeto detrás de «s/», y la ' +
                'del incidente del PJN, que en vez de «c/» rotula a cada parte con su rol. ' +
                'Probá con el nombre del archivo, que en el PJN suele ser la carátula entera.'
        };
    }
    return {
        ok: true,
        actor: encontradas[0],
        demandado: encontradas[1] ?? null,
        partes: encontradas
    };
}

/** Lo que quedo pegado a un reemplazo, sobre un texto YA anonimizado. */
export async function restosPegados(entrada) {
    const { restosPegadosAEtiqueta } = await cargar();
    return { ok: true, restos: restosPegadosAEtiqueta(exigirTexto(entrada.texto)) };
}

/** La frase, aparece en el texto como apareceria para reemplazarla? */
export async function aparece(entrada) {
    const { apareceEnElTexto } = await cargar();
    const texto = exigirTexto(entrada.texto);
    const frase = exigirTexto(entrada.frase, 'la frase a buscar');
    return { ok: true, aparece: apareceEnElTexto(texto, frase) };
}

// El aviso que va pegado a cada descripcion. Es distinto del de plazos porque el
// modo de falla es otro: alla el peligro es usar una fecha que no vino, aca es
// tapar por adivinanza o dar por limpio un texto que no lo esta.
export const AVISO_ANONIMIZAR =
    ' Los nombres propios NO se reemplazan solos: se proponen y los confirma una persona. ' +
    'Si la respuesta trae "ok": false no hay resultado y el campo "problema" dice por qué.';

export const HERRAMIENTAS_ANONIMIZAR = {
    anonimizar_texto: {
        fn: anonimizarTexto,
        aviso: AVISO_ANONIMIZAR,
        descripcion:
            'Reemplaza los datos de forma inequívoca de un escrito judicial (DNI, CUIT, CBU, ' +
            'teléfono, expediente, matrícula, correo, domicilio, patente y los campos de ' +
            'formulario). Los nombres propios sólo los tapa si se le pasan en «elegidos», ' +
            'confirmados por una persona. La respuesta trae siempre «restos»: los nombres que ' +
            'quedaron a la vista pegados a un reemplazo.',
        entrada: {
            texto: 'el texto a anonimizar',
            elegidos: 'lista de { texto, reemplazo } con los nombres confirmados y su etiqueta ' +
                '([PERSONA], [ACTOR], [DEMANDADO], [LETRADO], [PERITO], [TESTIGO], [EMPRESA], ' +
                'o las mismas con número: [PERSONA_2]). Opcional: sin esto sólo corre la capa 1.'
        }
    },
    candidatos_a_nombre: {
        fn: candidatosANombre,
        aviso: AVISO_ANONIMIZAR,
        descripcion:
            'Los nombres propios probables que ninguna regla reemplazó, con cuántas veces ' +
            'aparece cada uno. SE PROPONEN PARA QUE ALGUIEN LOS CONFIRME: la misma forma ' +
            '«Apellido, Nombre» la producen las partes del juicio, las citas de doctrina y los ' +
            'nombres de editoriales, y taparlos a todos corrompe el texto.',
        entrada: { texto: 'el texto donde buscar' }
    },
    partes_de_caratula: {
        fn: partesDeCaratula,
        aviso: AVISO_ANONIMIZAR,
        descripcion:
            'Las partes que nombra la carátula, EN ORDEN: primero el actor, después el ' +
            'demandado. El orden importa, porque es lo único que distingue quién pide de quién ' +
            'resiste.',
        entrada: { texto: 'el texto, o el nombre del archivo con la carátula' }
    },
    restos_pegados: {
        fn: restosPegados,
        aviso: AVISO_ANONIMIZAR,
        descripcion:
            'Sobre un texto YA anonimizado: los nombres que quedaron a la vista pegados a una ' +
            'etiqueta («Pérez, [PERSONA]» cuando se tapó sólo el nombre de pila). Es medio ' +
            'nombre publicado en un archivo que se lee como limpio.',
        entrada: { texto: 'el texto ya anonimizado' }
    },
    aparece_en_el_texto: {
        fn: aparece,
        aviso: AVISO_ANONIMIZAR,
        descripcion:
            'Si una frase aparece en el texto con la misma regla con la que el motor la ' +
            'reemplazaría: tolerante al espaciado y a los saltos de línea que mete el PDF, e ' +
            'indiferente a mayúsculas. Sirve para cotejar un alias sin reimplementar la ' +
            'comparación, que es como los dos lados terminan discrepando.',
        entrada: { texto: 'dónde buscar', frase: 'qué buscar' }
    }
};
