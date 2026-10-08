// ---------------------------------------------------------------------------
// El recuadro. Aparece solo cuando hay posibles errores; si no, queda oculto.
// El icono de la extension (la R) o Alt+Mayus+R lo muestran u ocultan. Es el
// que revisa y lleva la cuenta.
//
// Recibe los bytes del PDF del script de contenido, saca el texto con pdf.js,
// mira si es un proveido y, si lo es, lo revisa. Le avisa a la pagina que
// palabras quedaron, para que la vista con subrayado las marque sobre el
// documento. El texto vive solo en la memoria de este recuadro mientras la
// pagina esta abierta: no se guarda en ningun lado.
// ---------------------------------------------------------------------------
import { armarRevisor, agregarPersonal, paginasDelPdf, CLAVE_PERSONALES } from './cargar.mjs';
import { textoDeItems, esProveido } from './motor/revisar.mjs';

const ORIGEN_PJN = 'https://sgj-docs.pjn.gov.ar';
const $ = (id) => document.getElementById(id);

let hallazgos = [];
let texto = '';            // el del PDF abierto, para "Revisar igual"
let subrayando = false;     // "Subrayar en el PDF", recordado en storage
chrome.storage.local.get('subrayarEnPdf').then((r) => { subrayando = r.subrayarEnPdf === true; rotular(); }).catch(() => {});

function rotular() {
    $('subrayar').textContent = subrayando ? 'Quitar el subrayado del PDF' : 'Subrayar en el PDF';
}

function aPagina(msg) {
    window.parent.postMessage({ revisorPJN: true, ...msg }, ORIGEN_PJN);
}

function avisarAlto() {
    aPagina({ tipo: 'alto', px: $('caja').getBoundingClientRect().height });
}
new ResizeObserver(avisarAlto).observe($('caja'));

// La cuenta va en el icono de la extension, que es lo que se ve con el
// recuadro oculto. Lo pone el script de fondo, que es quien puede.
function insignia(t) {
    chrome.runtime.sendMessage({ revisorPJN: 'insignia', texto: t }).catch(() => {});
}

function estado(clase, titulo) {
    const caja = $('caja');
    caja.classList.remove('leyendo', 'con-errores', 'sin-errores', 'falla', 'no-proveido');
    caja.classList.add(clase);
    $('titulo').textContent = titulo;
    document.body.dataset.estado = clase;
}

function nodo(tag, clase, contenido) {
    const n = document.createElement(tag);
    if (clase) n.className = clase;
    if (contenido != null) n.textContent = contenido;
    return n;
}

function mostrar() {
    const lista = $('lista');
    lista.replaceChildren();
    insignia(hallazgos.length ? String(hallazgos.length) : '');
    aPagina({ tipo: 'resultado', hallazgos: hallazgos.map((h) => ({ palabra: h.palabra, sugerencias: h.sugerencias })) });
    $('pie').hidden = false;
    $('igual').hidden = true;
    $('subrayar').hidden = hallazgos.length === 0;
    if (hallazgos.length === 0) {
        estado('sin-errores', 'Sin errores detectados');
        return;
    }
    const n = hallazgos.length;
    estado('con-errores', `${n} ${n === 1 ? 'posible error' : 'posibles errores'}: ${hallazgos.map((h) => h.palabra).join(', ')}`);
    for (const h of hallazgos) {
        const li = nodo('li');
        li.dataset.palabra = h.palabra;
        const linea = nodo('div');
        const ir = nodo('button', 'palabra', h.palabra);
        ir.type = 'button';
        ir.title = 'Ir a la palabra en el documento';
        ir.addEventListener('click', () => aPagina({ tipo: 'ir', palabra: h.palabra }));
        linea.append(ir);
        if (h.sugerencias.length) linea.append(nodo('span', 'sugerencia', `¿${h.sugerencias.join(', ')}?`));
        if (h.veces > 1) linea.append(nodo('span', 'sugerencia', `(${h.veces} veces)`));
        li.append(linea);

        const ctx = nodo('div', 'contexto');
        ctx.append(`…${h.contexto.antes}`, nodo('span', 'palabra', h.contexto.palabra), `${h.contexto.despues}…`);
        li.append(ctx);

        const acciones = nodo('div', 'acciones');
        const ok = nodo('button', null, 'Es correcta');
        ok.type = 'button';
        ok.title = 'No volver a marcarla. Se guarda sólo la palabra, en esta computadora.';
        ok.addEventListener('click', () => agregarPersonal(h.palabra));   // el cambio vuelve por storage
        acciones.append(ok);
        li.append(acciones);
        lista.append(li);
    }
}

async function revisarTexto() {
    const revisor = await armarRevisor();
    hallazgos = revisor.revisar(texto);
    mostrar();
}

async function recibirPdf(bytes) {
    insignia('');
    hallazgos = [];
    texto = '';
    $('pie').hidden = true;
    $('lista').replaceChildren();
    estado('leyendo', 'Revisando ortografía…');
    try {
        const { paginas } = await paginasDelPdf(new Uint8Array(bytes));
        texto = paginas.map((p) => textoDeItems(p.items)).join('\n');
        if (!texto.trim()) {
            estado('falla', 'El PDF no tiene texto para revisar (¿es una imagen escaneada?)');
            aPagina({ tipo: 'resultado', hallazgos: [] });
            return;
        }
        if (!esProveido(texto)) {
            // Un escrito de un letrado, una cedula, un oficio: no se revisa.
            estado('no-proveido', 'No parece un proveído: no se revisa');
            aPagina({ tipo: 'resultado', hallazgos: [] });
            $('pie').hidden = false;
            $('igual').hidden = false;
            $('subrayar').hidden = true;
            return;
        }
        await revisarTexto();
    } catch (err) {
        estado('falla', 'No pude revisar este PDF.');
        aPagina({ tipo: 'resultado', hallazgos: [] });
        console.error('[revisor]', err);
    }
}

window.addEventListener('message', (e) => {
    if (e.source !== window.parent || e.origin !== ORIGEN_PJN) return;
    const d = e.data;
    if (!d || d.revisorPJN !== true) return;
    if (d.tipo === 'leyendo') estado('leyendo', 'Leyendo el PDF…');
    else if (d.tipo === 'error') estado('falla', d.mensaje);
    else if (d.tipo === 'pdf' && d.bytes instanceof ArrayBuffer) recibirPdf(d.bytes);
});

// "Es correcta", desde aca o desde la vista con subrayado: la lista personal
// cambia y se saca lo que ya no va.
chrome.storage.onChanged.addListener((cambios, area) => {
    if (area !== 'local' || !cambios[CLAVE_PERSONALES] || !hallazgos.length) return;
    const validas = new Set((cambios[CLAVE_PERSONALES].newValue || []).map((p) => String(p).toLocaleLowerCase('es')));
    const antes = hallazgos.length;
    hallazgos = hallazgos.filter((h) => !validas.has(h.palabra.toLocaleLowerCase('es')));
    if (hallazgos.length !== antes) mostrar();
});

$('plegar').addEventListener('click', () => {
    const plegada = $('caja').classList.toggle('plegada');
    $('plegar').setAttribute('aria-expanded', String(!plegada));
});
$('cerrar').addEventListener('click', () => aPagina({ tipo: 'ocultar' }));

// Se recuerda la eleccion (un si o un no, nada del proveido).
$('subrayar').addEventListener('click', () => {
    subrayando = !subrayando;
    rotular();
    chrome.storage.local.set({ subrayarEnPdf: subrayando }).catch(() => {});
    aPagina({ tipo: 'subrayado', ver: subrayando });
});

$('igual').addEventListener('click', () => {
    estado('leyendo', 'Revisando ortografía…');
    revisarTexto().catch((err) => { estado('falla', 'No pude revisar este PDF.'); console.error('[revisor]', err); });
});

aPagina({ tipo: 'listo' });
