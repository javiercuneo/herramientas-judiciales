// ---------------------------------------------------------------------------
// Escribiente — la pantalla.
//
// Este archivo no decide nada sobre el documento: eso esta en js/motor/, que es
// codigo puro y tiene pruebas (npm run verificar-escribiente). Aca solo se
// conectan los controles con el motor y se muestra lo que el motor informa.
//
// LA REGLA DE ESTA PANTALLA: ningun camino termina sin decir que paso. Si algo
// se rechaza, se dice por que y que hacer. Si algo se descarto, se cuenta
// cuanto. Si algo fallo, se muestra el motivo. La herramienta anterior fallaba
// callada en cinco lugares distintos y por eso parecia que "por momentos no
// andaba": andaba mal siempre, pero nunca lo decia.
// ---------------------------------------------------------------------------

import { extraerPaginas, diagnosticar } from './motor/extraer.js';
import { convertir } from './motor/markdown.js';
import {
    anonimizar, candidatosANombre, partesDeCaratula, normalizarEspacios,
    restosPegadosAEtiqueta, ETIQUETAS_DE_NOMBRE as ETIQUETAS, crearNumerador,
} from './motor/anonimizar.js';
import { armarDocumento, nombreDeDescarga, losQueSiguenEnElTexto } from './motor/documento.js';
import { analizarRango, describirProblemas, explicarError, unir, separar, rotar, contarPaginas } from './motor/pdf.js';

const $ = (id) => document.getElementById(id);

pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';

// ---------------------------------------------------------------------------
// Utilidades de pantalla
// ---------------------------------------------------------------------------

function descargar(bytes, nombre, tipo) {
    const url = URL.createObjectURL(new Blob([bytes], { type: tipo }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Se libera despues del clic: revocarla en la misma vuelta del bucle de
    // eventos cancela la descarga en algunos navegadores.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function mostrarAviso(elemento, tipo, html) {
    elemento.className = `aviso-caja ${tipo}`;
    elemento.innerHTML = html;
}

function ocultar(elemento) {
    elemento.className = 'aviso-caja oculto';
    elemento.innerHTML = '';
}

function texto(valor) {
    const d = document.createElement('div');
    d.textContent = valor;
    return d.innerHTML;
}

// Le devuelve el control al navegador para que pinte. Sin esto, la barra de
// progreso de un expediente de 400 fojas no se dibuja hasta el final, que es
// justo cuando ya no sirve.
const respirar = () => new Promise((r) => setTimeout(r, 0));

// ---------------------------------------------------------------------------
// Pestanias
// ---------------------------------------------------------------------------

const pestanias = document.querySelectorAll('#pestanias button');
pestanias.forEach((boton) => {
    boton.addEventListener('click', () => {
        pestanias.forEach((b) => {
            b.classList.remove('activa');
            b.removeAttribute('aria-current');
        });
        boton.classList.add('activa');
        boton.setAttribute('aria-current', 'page');
        document.querySelectorAll('.vista').forEach((v) => {
            v.classList.toggle('activa', v.id === `vista-${boton.dataset.vista}`);
        });
    });
});

// ---------------------------------------------------------------------------
// Convertir y anonimizar
// ---------------------------------------------------------------------------

// ETIQUETAS viene del motor (ETIQUETAS_DE_NOMBRE). Estaba escrita tambien aca
// hasta el 17/9/2026, y esa copia era un riesgo real y no un detalle de estilo:
// el detector de restos reconoce la etiqueta que el usuario eligio, asi que una
// etiqueta agregada en la pantalla y no en el motor volvia a abrir la fuga E-01
// sin que nada avisara.

const estado = {
    nombreArchivo: '',
    crudo: '',            // Markdown ya convertido, sin anonimizar
    informe: null,
    paginasVacias: [],
    candidatos: [],       // { texto, apariciones, marcado, etiqueta, esParte, esResto }
    final: '',
    // La numeracion de E-03. NO se reinicia entre archivos a proposito: la
    // tanda es todo lo que se pase sin cerrar la pestania, y eso es lo que
    // hace que el mismo nombre se lleve el mismo numero en dos documentos.
    // Recargar la pagina la borra, que es la unica forma de empezar de nuevo
    // y tambien la garantia de que no queda guardada.
    numerador: crearNumerador(),
};

function leerOpciones() {
    return {
        quitarRepetidos: $('opt-repetidos').checked,
        quitarBordes: $('opt-bordes').checked,
        quitarCodigos: $('opt-codigos').checked,
        unirCortes: $('opt-unir').checked,
        detectarColumnas: $('opt-columnas').checked,
        detectarTitulos: $('opt-titulos').checked,
        separarPaginas: $('opt-paginas').checked,
    };
}

$('archivo').addEventListener('change', () => {
    $('convertir').disabled = !$('archivo').files.length;
    ocultar($('aviso'));
    $('revision').classList.add('oculto');
    $('resultado').classList.add('oculto');
});

$('convertir').addEventListener('click', async () => {
    const archivo = $('archivo').files[0];
    if (!archivo) return;

    const boton = $('convertir');
    boton.disabled = true;
    boton.textContent = 'Convirtiendo...';
    ocultar($('aviso'));
    $('revision').classList.add('oculto');
    $('resultado').classList.add('oculto');
    $('progreso').classList.remove('oculto');
    $('progreso').textContent = 'Abriendo el archivo...';
    await respirar();

    try {
        const datos = await archivo.arrayBuffer();

        let ultimoPintado = 0;
        const paginas = await extraerPaginas(pdfjsLib, datos, (hechas, total) => {
            // Se pinta cada 5 paginas: actualizar el DOM en cada una de 400
            // cuesta mas que leerlas.
            if (hechas - ultimoPintado >= 5 || hechas === total) {
                ultimoPintado = hechas;
                $('progreso').textContent = `Leyendo página ${hechas} de ${total}...`;
            }
        });

        await respirar();

        // El rechazo por falta de OCR va antes que todo lo demas: sin texto no
        // hay nada que convertir ni que anonimizar.
        const diagnostico = diagnosticar(paginas);
        if (!diagnostico.sirve) {
            $('progreso').classList.add('oculto');
            mostrarAviso($('aviso'), 'error',
                `<p><strong>Este PDF no se puede trabajar.</strong></p>` +
                `<p>${texto(diagnostico.motivo)}</p>` +
                `<p>Escribiente no hace OCR a propósito: lo hacen mejor Acrobat, ` +
                `el escaner de la oficina o cualquier herramienta de escritorio, ` +
                `y traerlo acá serían varios megabytes de modelo para resolver algo ` +
                `que ya tenés resuelto.</p>`);
            return;
        }

        $('progreso').textContent = 'Armando el Markdown...';
        await respirar();

        const { markdown, informe } = convertir(paginas, leerOpciones());

        estado.nombreArchivo = archivo.name;
        estado.crudo = normalizarEspacios(markdown);
        estado.informe = informe;
        estado.paginasVacias = diagnostico.vacias;

        if (diagnostico.vacias.length > 0) {
            const cuantas = diagnostico.vacias.length;
            mostrarAviso($('aviso'), 'atencion',
                `<p><strong>${cuantas === 1 ? 'Una página salió' : `${cuantas} páginas salieron`} ` +
                `en blanco.</strong></p>` +
                `<p>${cuantas === 1 ? 'La página' : 'Las páginas'} ` +
                `${diagnostico.vacias.join(', ')} no ${cuantas === 1 ? 'tiene' : 'tienen'} ` +
                `texto extraíble: son escaneos sin OCR intercalados en un documento que ` +
                `por lo demás sí lo tiene. Lo que decían no está en el resultado. ` +
                `Queda anotado también al pie del .md.</p>`);
        }

        prepararCandidatos();
        recomputar();

        $('progreso').classList.add('oculto');
        $('resultado').classList.remove('oculto');
    } catch (e) {
        console.error(e);
        $('progreso').classList.add('oculto');
        mostrarAviso($('aviso'), 'error',
            `<p><strong>No se pudo leer el PDF.</strong></p><p>${texto(explicarError(e, archivo.name))}</p>`);
    } finally {
        boton.disabled = false;
        boton.textContent = 'Convertir';
    }
});

/** Junta los nombres propios que hay que ofrecer para revision.
 *
 * De tres fuentes, y la tercera es la que la herramienta anterior no miraba:
 *   - la caratula, si aparece en el texto
 *   - los candidatos que las reglas dejaron pasar
 *   - EL NOMBRE DEL ARCHIVO, que en el PJN es la caratula entera
 *     ("PEREZ JUAN c GARCIA MARIA s DANOS.pdf"). El nombre no se escribe nunca
 *     en la salida —de eso se ocupa documento.js—, pero es la mejor fuente que
 *     hay de los apellidos de las partes, y esos apellidos despues aparecen a
 *     lo largo de todo el cuerpo del escrito.
 */
function prepararCandidatos() {
    const partes = [
        ...partesDeCaratula(estado.crudo),
        ...partesDeCaratula(nombreComoCaratula(estado.nombreArchivo)),
    ];

    const vistos = new Map();

    partes.forEach((p) => {
        const clave = p.trim();
        if (!clave || vistos.has(clave.toLowerCase())) return;
        vistos.set(clave.toLowerCase(), {
            texto: clave,
            apariciones: contarApariciones(estado.crudo, clave),
            marcado: true,
            etiqueta: vistos.size === 0 ? '[ACTOR]' : '[DEMANDADO]',
            esParte: true,
        });
    });

    // `marcado: false`, y la diferencia con las partes de arriba es deliberada.
    //
    // Las partes salen de la carátula, que tiene forma fija ("X c/ Y s/"), así
    // que tildarlas no es una adivinanza. Todo lo demás sí lo es, y una casilla
    // que viene tildada no es una pregunta: es una decisión tomada por la
    // herramienta con la firma del usuario encima.
    //
    // POR QUÉ CAMBIÓ, 21/8/2026. Con todo tildado de fábrica, un expediente de
    // muchas paginas se procesó con 40 reemplazos elegidos, de los cuales 27 no eran
    // nombres de nadie: encabezados de tabla ("Responsable Inscripto Fecha",
    // 15 veces), títulos en mayúsculas ("DESIGNE NUEVA AUDIENCIA"), un monto en
    // letras. El texto quedó con "SOLICITA SE [PERSONA]" y "PERSONAL DE LA
    // [PERSONA] Y AFINES". Nadie destildó nada, y era esperable: con cuarenta
    // casillas ya tildadas, el default gana.
    //
    // El modo de fallar también cambia, y esa es la razón de fondo. Tildado de
    // fábrica falla en silencio y corrompe el documento. Sin tildar falla a la
    // vista: el nombre queda en el texto Y la constancia lo nombra.
    for (const c of candidatosANombre(estado.crudo)) {
        if (vistos.has(c.texto.toLowerCase())) continue;
        vistos.set(c.texto.toLowerCase(), {
            texto: c.texto,
            apariciones: c.apariciones,
            marcado: false,
            etiqueta: '[PERSONA]',
            esParte: false,
        });
    }

    estado.candidatos = [...vistos.values()]
        .sort((a, b) => (b.esParte - a.esParte) || (b.apariciones - a.apariciones));

    avisarAgregado('');
    dibujarCandidatos();
}

/** El nombre de archivo del PJN es la caratula sin las barras. Se las repone
 *  para que el detector de caratula lo reconozca. */
function nombreComoCaratula(nombre) {
    return nombre
        .replace(/\.pdf$/i, '')
        .replace(/[_]+/g, ' ')
        .replace(/\s+c\s+/i, ' c/ ')
        .replace(/\s+s\s+/i, ' s/ ');
}

function contarApariciones(texto, frase) {
    const patron = new RegExp(frase.trim().split(/\s+/)
        .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'), 'gi');
    return (texto.match(patron) || []).length;
}

/** La etiqueta con la que se va a reemplazar este candidato.
 *
 * Con la numeracion apagada es la etiqueta pelada y no pasa nada mas. Con la
 * numeracion prendida (E-03) el numero lo lleva el numerador del motor, que
 * vive en `estado` y por lo tanto dura lo que dura la pestania: esa es la
 * decision del 17/9 —numeracion por tanda y no por causa, para no guardar en
 * ningun lado la tabla que deshace la anonimizacion—.
 *
 * `asignar` es false cuando se dibuja la lista: mostrar un candidato no puede
 * gastarle un numero a alguien que todavia no se tildo.
 */
function etiquetaDe(c, asignar) {
    if (!$('opt-numerar').checked) return c.etiqueta;
    const base = c.etiqueta.slice(1, -1);
    return asignar
        ? estado.numerador.etiqueta(base, c.texto)
        : (estado.numerador.asignada(base, c.texto) || c.etiqueta);
}

function dibujarCandidatos() {
    const lista = $('candidatos');
    lista.innerHTML = '';

    // La revision se muestra aunque la lista venga vacia: ahi esta el campo
    // para agregar a mano, que es justamente para lo que ninguna regla ofrecio.
    if (!estado.crudo || !$('opt-anonimizar').checked) {
        $('revision').classList.add('oculto');
        return;
    }

    for (const [indice, c] of estado.candidatos.entries()) {
        const li = document.createElement('li');
        if (c.esParte) li.className = 'parte';
        else if (c.esResto) li.className = 'resto';

        const casilla = document.createElement('input');
        casilla.type = 'checkbox';
        casilla.checked = c.marcado;
        casilla.id = `cand-${indice}`;
        casilla.addEventListener('change', () => { c.marcado = casilla.checked; recomputar(); });

        const etiqueta = document.createElement('label');
        etiqueta.className = 'nombre';
        etiqueta.htmlFor = casilla.id;
        etiqueta.textContent = c.texto;

        const veces = document.createElement('span');
        veces.className = 'veces';
        veces.textContent = c.apariciones === 1 ? '1 vez' : `${c.apariciones} veces`;

        const selector = document.createElement('select');
        for (const opcion of ETIQUETAS) {
            const o = document.createElement('option');
            o.value = o.textContent = opcion;
            if (opcion === c.etiqueta) o.selected = true;
            selector.appendChild(o);
        }
        selector.addEventListener('change', () => { c.etiqueta = selector.value; recomputar(); });

        // El numero que le toco, cuando la numeracion esta prendida. Se muestra
        // porque es lo que hace util a la tanda: al pasar el segundo archivo se
        // ve de un vistazo cual de los nombres ya viene numerado del primero.
        const numerada = document.createElement('span');
        numerada.className = 'etiqueta-numerada';
        li.append(casilla, etiqueta, veces, numerada);
        // El resto se marca distinto de todo lo demas porque no es una
        // propuesta: es un pedazo de un nombre que YA se esta tapando y que
        // quedo en el texto. Sin la marca es una casilla mas entre cuarenta.
        const marcas = [
            [c.esParte, 'marca', 'parte'],
            [c.esResto, 'marca resto', 'quedó pegado'],
            [c.aMano, 'marca a-mano', 'a mano'],
        ];
        for (const [corresponde, clase, rotulo] of marcas) {
            if (!corresponde) continue;
            const marca = document.createElement('span');
            marca.className = clase;
            marca.textContent = rotulo;
            li.appendChild(marca);
        }
        li.appendChild(selector);
        lista.appendChild(li);
    }

    refrescarNumeracion();
    $('revision').classList.remove('oculto');
}

/** Repinta solo los numeros, sin rehacer la lista.
 *
 * El numero se asigna al anonimizar y no al dibujar —mostrar un candidato no
 * puede gastarle un numero a alguien que no se tildo—, asi que despues de cada
 * recomputo hay numeros nuevos que mostrar. Se actualiza el texto en su lugar y
 * no se redibuja la lista: redibujarla le saca el foco a la casilla que el
 * usuario acaba de tildar, y con cuarenta casillas eso se nota.
 */
function refrescarNumeracion() {
    const spans = $('candidatos').querySelectorAll('.etiqueta-numerada');
    estado.candidatos.forEach((c, i) => {
        if (!spans[i]) return;
        const etq = etiquetaDe(c, false);
        spans[i].textContent = etq === c.etiqueta ? '' : etq;
    });
}

let pendienteDeRecalculo = null;

/** Rehace la anonimizacion con la seleccion actual y repinta.
 *
 * Se difiere unos milisegundos porque cada casilla dispara un recalculo sobre
 * el documento entero, y en un expediente largo tildar cinco seguidas encadena
 * cinco pasadas completas.
 */
function recomputar() {
    clearTimeout(pendienteDeRecalculo);
    pendienteDeRecalculo = setTimeout(recomputarYa, 60);
}

function recomputarYa() {
    const anonimizado = $('opt-anonimizar').checked;

    let cuerpo = estado.crudo;
    let conteo = null;
    let pendientes = [];

    if (anonimizado) {
        const elegidos = estado.candidatos
            .filter((c) => c.marcado)
            .map((c) => ({ texto: c.texto, reemplazo: etiquetaDe(c, true) }));
        const resultado = anonimizar(estado.crudo, elegidos);
        cuerpo = resultado.texto;
        conteo = resultado.conteo;
        pendientes = estado.candidatos.filter((c) => !c.marcado).map((c) => c.texto);

        // El resto se ve DESPUES de reemplazar, asi que se busca aca y no en
        // prepararCandidatos. Si aparecio alguno, la lista cambio y la cuenta
        // de pendientes hay que rehacerla: el resto entra sin tildar, y eso es
        // lo que lo mete en la constancia.
        if (sumarRestos(cuerpo)) {
            pendientes = estado.candidatos.filter((c) => !c.marcado).map((c) => c.texto);
            dibujarCandidatos();
        }

        // Un candidato sin tildar puede haber quedado tapado igual por una regla
        // deterministica —la firma, un campo de formulario—, y entonces no esta
        // pendiente de nada: nombrarlo publica al que se acaba de ocultar. La
        // pantalla y el .md tienen que decir lo mismo, asi que filtran igual.
        pendientes = losQueSiguenEnElTexto(cuerpo, pendientes);
    }

    estado.final = armarDocumento({
        nombreArchivo: estado.nombreArchivo,
        cuerpo,
        anonimizado,
        informe: estado.informe,
        conteo,
        pendientes,
        paginasVacias: estado.paginasVacias,
    });

    $('salida').value = estado.final;
    refrescarNumeracion();
    dibujarInforme(anonimizado, conteo, pendientes);
}

/** Suma a la lista los nombres que quedaron pegados a un reemplazo.
 *
 * ES LA FUGA E-01, Y SE VE SOLA UNA VEZ QUE SE ENTIENDE. El usuario tilda
 * "Juan Carlos" de "Perez, Juan Carlos", el texto queda "Perez, [PERSONA]", y
 * la constancia dice que no quedaron nombres sin reemplazar —porque para ella
 * ese nombre se reemplazo—. El apellido, que es lo que mas identifica, sale
 * publicado en un archivo que se lee como limpio.
 *
 * ENTRAN SIN TILDAR, y la razon es la misma del 21/8: un default tildado se
 * aplica solo. Un resto es un indicio fuerte pero no una certeza, y aplicarlo
 * sin preguntar encadena —"Estudio Juridico Ficticio" con "Ficticio" tildado
 * se comeria despues "Juridico" y despues "Estudio"—. Sin tildar, el modo de
 * fallar es el correcto: la palabra queda en el texto Y la constancia la
 * nombra.
 *
 * Las apariciones se cuentan sobre el texto ORIGINAL y no sobre las veces que
 * quedo pegada, que son menos: tildarla la reemplaza en todo el documento, y el
 * numero que se muestra tiene que ser el que va a moverse.
 */
function sumarRestos(textoAnonimo) {
    let agregados = 0;

    for (const r of restosPegadosAEtiqueta(textoAnonimo)) {
        const clave = r.texto.toLowerCase();
        if (estado.candidatos.some((c) => c.texto.toLowerCase() === clave)) continue;
        estado.candidatos.push({
            texto: r.texto,
            apariciones: contarApariciones(estado.crudo, r.texto),
            marcado: false,
            etiqueta: '[PERSONA]',
            esParte: false,
            esResto: true,
        });
        agregados++;
    }

    if (agregados) {
        estado.candidatos.sort((a, b) =>
            (b.esParte - a.esParte) || (!!b.esResto - !!a.esResto) || (b.apariciones - a.apariciones));
    }
    return agregados > 0;
}

function dibujarInforme(anonimizado, conteo, pendientes) {
    const i = estado.informe;
    const quitadas = i.encabezados + i.pies + i.bordes + i.codigos;
    const filas = [
        `<strong>${i.paginas}</strong> ${i.paginas === 1 ? 'página' : 'páginas'}, ` +
        `<strong>${i.lineas}</strong> líneas, ` +
        `<strong>${estado.final.length.toLocaleString('es-AR')}</strong> caracteres.`,
    ];

    if (quitadas > 0) {
        const detalle = [];
        if (i.encabezados) detalle.push(`${i.encabezados} de encabezado repetido`);
        if (i.pies) detalle.push(`${i.pies} de pie repetido`);
        if (i.bordes) detalle.push(`${i.bordes} de numeración o sellos`);
        if (i.codigos) detalle.push(`${i.codigos} con códigos de sistema`);
        filas.push(`Se quitaron <strong>${quitadas}</strong> líneas: ${detalle.join(', ')}.`);
    }
    if (i.unidas > 0) filas.push(`Se unieron <strong>${i.unidas}</strong> renglones cortados.`);
    if (i.columnas > 0) filas.push(`Se detectaron columnas en ${i.columnas} páginas.`);

    if (anonimizado) {
        const total = Object.values(conteo).reduce((a, b) => a + b, 0);
        filas.push(`Anonimización: <strong>${total}</strong> reemplazos.`);
        if (pendientes.length > 0) {
            filas.push(
                `<span class="destacado">${pendientes.length} ` +
                `${pendientes.length === 1 ? 'nombre quedó' : 'nombres quedaron'} sin ocultar</span> ` +
                `porque no ${pendientes.length === 1 ? 'lo' : 'los'} tildaste: ` +
                `${texto(pendientes.join(', '))}.`);
        }
    }

    $('informe').innerHTML = `<ul><li>${filas.join('</li><li>')}</li></ul>`;
}

for (const id of ['opt-anonimizar', 'opt-numerar']) {
    $(id).addEventListener('change', () => {
        if (!estado.crudo) return;
        dibujarCandidatos();
        recomputar();
    });
}

// ---------------------------------------------------------------------------
// Agregar a mano
//
// POR QUE EXISTE, 15/9/2026. La lista solo ofrece lo que alguna regla detecto,
// y habia cosas que ninguna puede detectar sin romper otras: un cargo que
// identifica a una sola persona ("la Directora General de..."), una razon
// social, un nombre que el OCR ensucio. Hasta ese dia la unica salida era
// editar el .md a mano despues de bajarlo, que es donde se olvida.
//
// Lo agregado entra TILDADO: aca no hay adivinanza, lo escribio el usuario.
// Y si no aparece en el texto se dice, en vez de agregar una casilla que no
// reemplaza nada y hace creer que se tapo algo.
// ---------------------------------------------------------------------------

for (const opcion of ETIQUETAS) {
    const o = document.createElement('option');
    o.value = o.textContent = opcion;
    $('agregar-etiqueta').appendChild(o);
}

function avisarAgregado(mensaje) {
    const aviso = $('agregar-aviso');
    aviso.textContent = mensaje;
    aviso.classList.toggle('oculto', !mensaje);
}

function agregarAMano() {
    const escrito = $('agregar-texto').value.replace(/\s+/g, ' ').trim();
    if (!escrito) return;

    const apariciones = contarApariciones(estado.crudo, escrito);
    if (apariciones === 0) {
        avisarAgregado(`«${escrito}» no aparece en el texto. Fijate que esté escrito igual que en el documento.`);
        return;
    }

    const existente = estado.candidatos.find((c) => c.texto.toLowerCase() === escrito.toLowerCase());
    if (existente) {
        existente.marcado = true;
        existente.etiqueta = $('agregar-etiqueta').value;
    } else {
        estado.candidatos.push({
            texto: escrito,
            apariciones,
            marcado: true,
            etiqueta: $('agregar-etiqueta').value,
            esParte: false,
            aMano: true,
        });
    }

    $('agregar-texto').value = '';
    avisarAgregado('');
    dibujarCandidatos();
    recomputar();
}

$('agregar-btn').addEventListener('click', agregarAMano);
$('agregar-texto').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); agregarAMano(); }
});

$('marcar-todos').addEventListener('click', () => cambiarTodos(true));
$('desmarcar-todos').addEventListener('click', () => cambiarTodos(false));

function cambiarTodos(valor) {
    estado.candidatos.forEach((c) => { c.marcado = valor; });
    dibujarCandidatos();
    recomputar();
}

$('descargar').addEventListener('click', () => {
    descargar(
        new TextEncoder().encode(estado.final),
        nombreDeDescarga(estado.nombreArchivo, $('opt-anonimizar').checked),
        'text/markdown;charset=utf-8'
    );
});

$('copiar').addEventListener('click', async () => {
    const boton = $('copiar');
    try {
        await navigator.clipboard.writeText(estado.final);
        boton.textContent = 'Copiado';
    } catch {
        // Sin permiso de portapapeles queda el camino de siempre.
        $('salida').select();
        boton.textContent = 'Seleccionado: copialo con Ctrl+C';
    }
    setTimeout(() => { boton.textContent = 'Copiar al portapapeles'; }, 2500);
});

// ---------------------------------------------------------------------------
// Unir
// ---------------------------------------------------------------------------

let archivosAUnir = [];

$('unir-archivos').addEventListener('change', (e) => {
    archivosAUnir = Array.from(e.target.files);
    const lista = $('unir-lista');
    lista.innerHTML = '';
    archivosAUnir.forEach((f, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="orden">${i + 1}</span>${texto(f.name)}`;
        lista.appendChild(li);
    });
    $('unir-btn').disabled = archivosAUnir.length < 2;
    ocultar($('unir-aviso'));
    if (archivosAUnir.length === 1) {
        mostrarAviso($('unir-aviso'), 'atencion',
            '<p>Elegiste un solo archivo. Para unir hacen falta al menos dos, ' +
            'seleccionados juntos en el mismo cuadro de diálogo.</p>');
    }
});

$('unir-btn').addEventListener('click', async () => {
    const boton = $('unir-btn');
    boton.disabled = true;
    boton.textContent = 'Uniendo...';
    ocultar($('unir-aviso'));

    try {
        const { bytes, paginas } = await unir(PDFLib, archivosAUnir);
        descargar(bytes, 'documentos-unidos.pdf', 'application/pdf');
        mostrarAviso($('unir-aviso'), 'bien',
            `<p>Listo: ${archivosAUnir.length} archivos, ${paginas} páginas en total.</p>`);
    } catch (e) {
        console.error(e);
        mostrarAviso($('unir-aviso'), 'error', `<p>${texto(e.message)}</p>`);
    } finally {
        boton.disabled = false;
        boton.textContent = 'Unir y descargar';
    }
});

// ---------------------------------------------------------------------------
// Separar
// ---------------------------------------------------------------------------

let paginasDelSeparar = 0;

$('separar-archivo').addEventListener('change', async () => {
    const archivo = $('separar-archivo').files[0];
    paginasDelSeparar = 0;
    ocultar($('separar-aviso'));
    $('separar-total').textContent = '';
    if (!archivo) { validarSeparar(); return; }

    // Se cuentan las paginas al elegir el archivo, no al apretar el boton: sin
    // esto no hay forma de avisar que el rango se pasa hasta despues de haber
    // generado un PDF con menos hojas de las pedidas.
    try {
        paginasDelSeparar = await contarPaginas(PDFLib, archivo);
        $('separar-total').textContent =
            `El documento tiene ${paginasDelSeparar} ${paginasDelSeparar === 1 ? 'página' : 'páginas'}.`;
    } catch (e) {
        mostrarAviso($('separar-aviso'), 'error', `<p>${texto(explicarError(e, archivo.name))}</p>`);
    }
    validarSeparar();
});

$('separar-rango').addEventListener('input', validarSeparar);

function validarSeparar() {
    $('separar-btn').disabled = !($('separar-archivo').files.length && paginasDelSeparar > 0);
}

$('separar-btn').addEventListener('click', async () => {
    const archivo = $('separar-archivo').files[0];
    const analisis = analizarRango($('separar-rango').value, paginasDelSeparar);

    if (analisis.error) {
        mostrarAviso($('separar-aviso'), 'error', `<p>${texto(analisis.error)}</p>`);
        return;
    }

    const boton = $('separar-btn');
    boton.disabled = true;
    boton.textContent = 'Separando...';

    try {
        const { bytes, paginas } = await separar(PDFLib, archivo, analisis.indices);
        descargar(bytes, `separado-${archivo.name}`, 'application/pdf');

        // El aviso sale SIEMPRE, tambien cuando salio todo bien: decir cuantas
        // paginas tiene el archivo que se acaba de bajar es la unica manera de
        // que alguien note que pidio una de mas. Este es exactamente el caso
        // que la herramienta anterior se tragaba en silencio.
        const problemas = describirProblemas(analisis, paginasDelSeparar);
        mostrarAviso($('separar-aviso'), problemas ? 'atencion' : 'bien',
            `<p>Se extrajeron <strong>${paginas}</strong> ` +
            `${paginas === 1 ? 'página' : 'páginas'}.</p>` +
            (problemas ? `<p>${texto(problemas)}</p>` : ''));
    } catch (e) {
        console.error(e);
        mostrarAviso($('separar-aviso'), 'error', `<p>${texto(explicarError(e, archivo.name))}</p>`);
    } finally {
        boton.disabled = false;
        boton.textContent = 'Separar y descargar';
    }
});

// ---------------------------------------------------------------------------
// Rotar
// ---------------------------------------------------------------------------

$('rotar-archivo').addEventListener('change', () => {
    $('rotar-btn').disabled = !$('rotar-archivo').files.length;
    ocultar($('rotar-aviso'));
});

$('rotar-btn').addEventListener('click', async () => {
    const archivo = $('rotar-archivo').files[0];
    const boton = $('rotar-btn');
    boton.disabled = true;
    boton.textContent = 'Rotando...';
    ocultar($('rotar-aviso'));

    try {
        const grados = parseInt($('rotar-grados').value, 10);
        const { bytes, paginas } = await rotar(PDFLib, archivo, grados);
        descargar(bytes, `rotado-${archivo.name}`, 'application/pdf');
        mostrarAviso($('rotar-aviso'), 'bien',
            `<p>Listo: ${paginas} ${paginas === 1 ? 'página rotada' : 'páginas rotadas'} ${grados} grados.</p>`);
    } catch (e) {
        console.error(e);
        mostrarAviso($('rotar-aviso'), 'error', `<p>${texto(explicarError(e, archivo.name))}</p>`);
    } finally {
        boton.disabled = false;
        boton.textContent = 'Rotar y descargar';
    }
});

// ---------------------------------------------------------------------------
// Service worker
// ---------------------------------------------------------------------------

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((e) => {
            // Que falle no rompe nada: solo se pierde el funcionamiento sin
            // conexion. Se anota en la consola y se sigue.
            console.warn('No se pudo registrar el service worker:', e);
        });
    });
}
