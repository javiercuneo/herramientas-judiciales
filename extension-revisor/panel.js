// ---------------------------------------------------------------------------
// El recuadro que se ve sobre la pagina del proveido.
//
// Recibe los bytes del PDF del script de contenido, saca el texto con pdf.js,
// lo revisa y muestra el resultado. El texto vive solo en la memoria de este
// recuadro mientras la pagina esta abierta: no se guarda en ningun lado.
// ---------------------------------------------------------------------------
import { armarRevisor, agregarPersonal, paginasDelPdf } from './cargar.mjs';
import { textoDeItems } from './motor/revisar.mjs';
import { dibujar, irA } from './subrayado.mjs';

const ORIGEN_PJN = 'https://sgj-docs.pjn.gov.ar';
const $ = (id) => document.getElementById(id);

let hallazgos = [];
let copiaPdf = null;      // para la vista con subrayado; solo en memoria

function aPagina(msg) {
    window.parent.postMessage({ revisorPJN: true, ...msg }, ORIGEN_PJN);
}

function avisarAlto() {
    if ($('caja').hidden) return;
    aPagina({ tipo: 'alto', px: $('caja').getBoundingClientRect().height });
}
new ResizeObserver(avisarAlto).observe($('caja'));

function estado(clase, titulo) {
    const caja = $('caja');
    caja.classList.remove('leyendo', 'con-errores', 'sin-errores', 'falla');
    caja.classList.add(clase);
    $('titulo').textContent = titulo;
    document.body.dataset.estado = clase;
}

function nodo(tag, clase, texto) {
    const n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
}

function mostrar() {
    const lista = $('lista');
    lista.replaceChildren();
    if (hallazgos.length === 0) {
        estado('sin-errores', 'Sin errores detectados');
    } else {
        const n = hallazgos.length;
        const palabras = hallazgos.map((h) => h.palabra).join(', ');
        estado('con-errores', `${n} ${n === 1 ? 'posible error' : 'posibles errores'}: ${palabras}`);
    }
    for (const h of hallazgos) {
        const li = nodo('li');
        li.dataset.palabra = h.palabra;
        const linea = nodo('div');
        linea.append(nodo('span', 'palabra', h.palabra));
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
        ok.addEventListener('click', async () => {
            await agregarPersonal(h.palabra);
            hallazgos = hallazgos.filter((x) => x !== h);
            mostrar();
        });
        acciones.append(ok);
        li.append(acciones);
        lista.append(li);
    }
    $('pie').hidden = !copiaPdf;
}

async function revisarPdf(bytes) {
    if (!$('vista').hidden) $('volver').click();   // llego otro proveido
    estado('leyendo', 'Revisando ortografía…');
    $('lista').replaceChildren();
    try {
        copiaPdf = bytes.slice(0);    // pdf.js se queda con el original
        const [revisor, { paginas }] = await Promise.all([armarRevisor(), paginasDelPdf(new Uint8Array(bytes))]);
        const texto = paginas.map((p) => textoDeItems(p.items)).join('\n');
        if (!texto.trim()) {
            copiaPdf = null;
            hallazgos = [];
            estado('falla', 'El PDF no tiene texto para revisar (¿es una imagen escaneada?)');
            return;
        }
        hallazgos = revisor.revisar(texto);
        mostrar();
    } catch (err) {
        copiaPdf = null;
        estado('falla', 'No pude revisar este PDF.');
        console.error('[revisor]', err);
    }
}

window.addEventListener('message', (e) => {
    if (e.source !== window.parent || e.origin !== ORIGEN_PJN) return;
    const d = e.data;
    if (!d || d.revisorPJN !== true) return;
    if (d.tipo === 'leyendo') estado('leyendo', 'Leyendo el PDF…');
    else if (d.tipo === 'error') estado('falla', d.mensaje);
    else if (d.tipo === 'pdf' && d.bytes instanceof ArrayBuffer) revisarPdf(d.bytes);
});

$('plegar').addEventListener('click', () => {
    const plegada = $('caja').classList.toggle('plegada');
    $('plegar').setAttribute('aria-expanded', String(!plegada));
});
$('cerrar').addEventListener('click', () => {
    $('caja').classList.add('plegada');
    $('plegar').setAttribute('aria-expanded', 'false');
});

// Vista con subrayado: el recuadro se agranda a toda la pantalla y dibuja el
// PDF con los errores marcados. Volver lo achica y descarta el dibujo.
function esperarTamano() {
    return new Promise((listo) => {
        const fin = () => { window.removeEventListener('resize', fin); listo(); };
        window.addEventListener('resize', fin);
        setTimeout(fin, 500);
    });
}

$('ver').addEventListener('click', async () => {
    if (!copiaPdf) return;
    const palabras = hallazgos.map((h) => h.palabra);
    $('caja').hidden = true;
    $('vista').hidden = false;
    $('paginas').replaceChildren();
    $('saltos').replaceChildren();
    $('resumen').textContent = 'Dibujando el PDF…';
    delete document.body.dataset.vista;
    aPagina({ tipo: 'pantalla', completa: true });
    await esperarTamano();
    try {
        const marcas = await dibujar($('paginas'), copiaPdf.slice(0), palabras);
        const n = palabras.length;
        $('resumen').textContent = n === 0 ? 'Sin errores detectados'
            : `${n} ${n === 1 ? 'posible error' : 'posibles errores'}`;
        $('vista').querySelector('.barra').classList.toggle('sin-errores', n === 0);
        for (const p of palabras) {
            const b = nodo('button', null, p);
            b.type = 'button';
            b.title = 'Ir a la próxima aparición';
            b.addEventListener('click', () => irA(marcas, p));
            $('saltos').append(b);
        }
        document.body.dataset.vista = 'lista';
        if (marcas[0]) irA(marcas, marcas[0].dataset.palabra);
    } catch (err) {
        $('resumen').textContent = 'No pude dibujar el PDF.';
        document.body.dataset.vista = 'falla';
        console.error('[revisor]', err);
    }
});

$('volver').addEventListener('click', () => {
    $('paginas').replaceChildren();
    $('vista').hidden = true;
    $('caja').hidden = false;
    aPagina({ tipo: 'pantalla', completa: false });
    avisarAlto();
});

aPagina({ tipo: 'listo' });
