// ---------------------------------------------------------------------------
// La vista con subrayado. El script de contenido la pone encima del visor de
// PDF de Chrome, del mismo tamano, solo cuando hay posibles errores: se ve el
// mismo documento con las palabras subrayadas en rojo.
//
// Clic en una palabra subrayada: un menu chico al lado, con la sugerencia y
// "Es correcta". La palabra se suma a la lista personal (solo la palabra), y
// el recuadro, que es quien lleva la cuenta, avisa que ya no esta.
//
// El PDF vive en la memoria de esta vista mientras la pagina esta abierta.
// ---------------------------------------------------------------------------
import { agregarPersonal } from './cargar.mjs';
import { dibujar, irA, quitar, norma } from './subrayado.mjs';

const ORIGEN_PJN = 'https://sgj-docs.pjn.gov.ar';
const $ = (id) => document.getElementById(id);

let marcas = [];
let sugerencias = new Map();   // palabra normalizada -> sugerencias

function aPagina(msg) {
    window.parent.postMessage({ revisorPJN: true, ...msg }, ORIGEN_PJN);
}

function cerrarMenu() {
    $('menu')?.remove();
    for (const m of marcas) m.classList.remove('foco');
}

function abrirMenu(mark) {
    cerrarMenu();
    const clave = mark.dataset.palabra;
    const menu = document.createElement('div');
    menu.id = 'menu';
    const sug = sugerencias.get(clave) || [];
    if (sug.length) {
        const s = document.createElement('span');
        s.className = 'sugerencia';
        s.textContent = `¿${sug.join(', ')}?`;
        menu.append(s);
    }
    const ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = 'Es correcta';
    ok.title = 'Sumarla al diccionario de esta computadora. Se guarda sólo la palabra.';
    ok.addEventListener('click', async (e) => {
        e.stopPropagation();
        cerrarMenu();
        await agregarPersonal(clave);   // la palabra entera, aunque el clic sea en un pedazo cortado
        marcas = quitar(marcas, clave);
    });
    menu.append(ok);

    for (const m of marcas) if (m.dataset.palabra === clave) m.classList.add('foco');
    const r = mark.getBoundingClientRect();
    menu.style.left = `${Math.max(4, r.left + window.scrollX)}px`;
    menu.style.top = `${r.bottom + window.scrollY + 4}px`;
    document.body.append(menu);
    // Que no se salga por la derecha.
    const sobra = menu.getBoundingClientRect().right - document.documentElement.clientWidth + 4;
    if (sobra > 0) menu.style.left = `${Math.max(4, parseFloat(menu.style.left) - sobra)}px`;
}

document.addEventListener('click', (e) => {
    const mark = e.target.closest && e.target.closest('mark.error');
    if (mark) abrirMenu(mark);
    else if (!e.target.closest('#menu')) cerrarMenu();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarMenu(); });

window.addEventListener('message', async (e) => {
    if (e.source !== window.parent || e.origin !== ORIGEN_PJN) return;
    const d = e.data;
    if (!d || d.revisorPJN !== true) return;
    if (d.tipo === 'pdf' && d.bytes instanceof ArrayBuffer && Array.isArray(d.hallazgos)) {
        sugerencias = new Map(d.hallazgos.map((h) => [norma(String(h.palabra)), (h.sugerencias || []).map(String)]));
        $('paginas').replaceChildren();
        cerrarMenu();
        try {
            marcas = await dibujar($('paginas'), d.bytes, d.hallazgos.map((h) => String(h.palabra)));
            document.body.dataset.estado = 'lista';
        } catch (err) {
            document.body.dataset.estado = 'falla';
            aPagina({ tipo: 'vista-falla' });
            console.error('[revisor]', err);
        }
    } else if (d.tipo === 'palabras' && Array.isArray(d.palabras)) {
        // La lista que sigue en pie: lo que ya no esta se deja de subrayar.
        const siguen = new Set(d.palabras.map((p) => norma(String(p))));
        for (const clave of new Set(marcas.map((m) => m.dataset.palabra))) {
            if (!siguen.has(clave)) marcas = quitar(marcas, clave);
        }
    } else if (d.tipo === 'ir' && typeof d.palabra === 'string') {
        irA(marcas, d.palabra);
    }
});

aPagina({ tipo: 'vista-lista' });
