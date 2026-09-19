// ---------------------------------------------------------------------------
// Escribiente — la pestania "Certificar".
//
// Como app.js: esta pantalla no decide nada. Que enlace vale, como se escribe
// la fecha en letras y que dice el texto lo decide js/motor/certificar.js, que
// tiene pruebas (npm run verificar-escribiente). Aca se leen los campos, se
// llama y se muestra.
//
// NADA SE GUARDA. Ni localStorage ni nada: recargar la pagina borra todo, y es
// lo que se pidio. Los datos del juzgado se escriben cada vez porque la
// herramienta es para cualquier juzgado, no para uno.
//
// UNO O VARIOS DOCUMENTOS. Cada documento es un bloque copiado de
// #cert-doc-molde, con su enlace, su PDF, su tipo, su fecha y sus fojas; los
// autos, el juzgado y la fecha de expedicion son comunes. Cada documento lleva
// su propio QR, dibujado del mismo string que su "Ver:".
// ---------------------------------------------------------------------------

import {
    analizarEnlace, armarCertificacion, leerAutos, hoyISO,
    matrizQR, pixelesPorModulo, MARGEN_QR,
    huellaSHA256, gruposDeHuella, pesoEnBytes,
} from './motor/certificar.js';

const $ = (id) => document.getElementById(id);

const COMUNES = ['numero', 'caratula', 'juzgado', 'domicilio', 'expedicion'];

// Cada documento: { raiz, enlace } -- la raiz es el <fieldset>, y el enlace el
// ultimo resultado de analizarEnlace.
const documentos = [];
let ultimo = armarCertificacion({ documentos: [{}] });

$('cert-expedicion').value = hoyISO();

// ---------------------------------------------------------------------------
// Los documentos
// ---------------------------------------------------------------------------

const campo = (doc, nombre) => doc.raiz.querySelector(`[data-campo="${nombre}"]`);

function agregarDocumento() {
    const raiz = $('cert-doc-molde').content.firstElementChild.cloneNode(true);
    const doc = { raiz, enlace: analizarEnlace('') };
    documentos.push(doc);
    $('cert-documentos').append(raiz);

    campo(doc, 'enlace').addEventListener('input', () => leerEnlace(doc));
    campo(doc, 'pdf').addEventListener('change', () => contarPaginas(doc));
    ['tipo', 'fecha', 'paginas', 'fojas'].forEach((c) => campo(doc, c).addEventListener('input', actualizar));
    campo(doc, 'quitar').addEventListener('click', () => {
        documentos.splice(documentos.indexOf(doc), 1);
        raiz.remove();
        renumerar();
        actualizar();
    });
    renumerar();
    actualizar();
    return doc;
}

// Con uno solo no hay numero ni boton de quitar: la pantalla de siempre.
function renumerar() {
    const varios = documentos.length > 1;
    documentos.forEach((doc, i) => {
        campo(doc, 'titulo').textContent = varios ? `Documento ${i + 1}` : 'Documento';
        campo(doc, 'quitar').classList.toggle('oculto', !varios);
    });
}

function leerEnlace(doc) {
    const texto = campo(doc, 'enlace').value;
    doc.enlace = analizarEnlace(texto);
    const estado = campo(doc, 'enlace-estado');
    const bajar = campo(doc, 'bajar');

    if (!texto.trim()) {
        estado.className = 'aviso-caja oculto';
        bajar.classList.add('oculto');
    } else if (!doc.enlace.ok) {
        estado.className = 'aviso-caja error';
        estado.textContent = doc.enlace.problema;
        bajar.classList.add('oculto');
    } else {
        estado.className = 'aviso-caja bien';
        estado.textContent = ['Enlace del PJN reconocido. Con él se arman el de ver y el de descarga.',
            ...doc.enlace.avisos].join(' ');
        // Una descarga comun, no un fetch: la pagina tiene prohibido conectarse
        // (connect-src 'none') y el PJN no autoriza pedidos de otro origen. Un
        // enlace que el usuario aprieta es navegacion, y eso si se puede.
        bajar.href = doc.enlace.descargar;
        bajar.classList.remove('oculto');
    }
    actualizar();
}

async function contarPaginas(doc) {
    const archivo = campo(doc, 'pdf').files[0];
    const estado = campo(doc, 'pdf-estado');
    const huella = campo(doc, 'huella');
    huella.classList.add('oculto');
    if (!archivo) return;
    estado.textContent = 'Contando las páginas…';
    try {
        const bytes = await archivo.arrayBuffer();
        // La huella antes que pdf.js: pdf.js se queda con el buffer que recibe
        // (lo transfiere al worker) y despues ya no se puede leer.
        mostrarHuella(doc, await huellaSHA256(crypto.subtle, bytes), bytes.byteLength);
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
        const datos = new Uint8Array(bytes);
        const pdf = await pdfjsLib.getDocument({ data: datos }).promise;
        const n = pdf.numPages;
        await pdf.destroy();
        campo(doc, 'paginas').value = n;
        estado.textContent = `«${archivo.name}»: ${n} ${n === 1 ? 'página' : 'páginas'}. ` +
            'Revisá que sea la resolución que estás certificando.';
        actualizar();
    } catch (e) {
        estado.textContent = `No se pudo leer «${archivo.name}» como PDF (${e && e.message ? e.message : e}). ` +
            'Podés escribir la cantidad de páginas a mano.';
    }
}

// Cada grupo de ocho va en su propio <span>, separado por margen y no por un
// espacio: se lee de a pedazos y, al seleccionarlo y copiarlo, sale entero.
function mostrarHuella(doc, hex, bytes) {
    const hash = campo(doc, 'hash');
    hash.replaceChildren(...gruposDeHuella(hex).map((g) => {
        const s = document.createElement('span');
        s.textContent = g;
        return s;
    }));
    campo(doc, 'peso').textContent = pesoEnBytes(bytes);
    campo(doc, 'huella').classList.remove('oculto');
}

$('cert-agregar').addEventListener('click', () => {
    const doc = agregarDocumento();
    campo(doc, 'enlace').focus();
});

// ---------------------------------------------------------------------------
// Los autos
// ---------------------------------------------------------------------------

$('cert-autos').addEventListener('input', () => {
    const { numero, caratula } = leerAutos($('cert-autos').value);
    $('cert-numero').value = numero;
    $('cert-caratula').value = caratula;
    actualizar();
});

COMUNES.forEach((c) => $(`cert-${c}`).addEventListener('input', actualizar));

// ---------------------------------------------------------------------------
// El texto y los QR
// ---------------------------------------------------------------------------

function leerDatos() {
    const d = {
        documentos: documentos.map((doc) => ({
            enlace: doc.enlace,
            tipo: campo(doc, 'tipo').value,
            fecha: campo(doc, 'fecha').value,
            paginas: campo(doc, 'paginas').value,
            fojas: campo(doc, 'fojas').value,
        })),
    };
    COMUNES.forEach((c) => { d[c] = $(`cert-${c}`).value; });
    return d;
}

/** Pinta el texto marcando los huecos, sin innerHTML con datos del usuario. */
function pintar(elemento, texto, faltan) {
    const huecos = faltan.map((f) => `[${f}]`);
    let resto = texto;
    while (resto) {
        let pos = -1, cual = '';
        for (const h of huecos) {
            const i = resto.indexOf(h);
            if (i >= 0 && (pos < 0 || i < pos)) { pos = i; cual = h; }
        }
        if (pos < 0) { elemento.append(resto); break; }
        elemento.append(resto.slice(0, pos));
        const marca = document.createElement('mark');
        marca.textContent = cual;
        elemento.append(marca);
        resto = resto.slice(pos + cual.length);
    }
}

// 5 cm con un documento, 4 con varios: dos de 5 cm, mas el texto, no entran
// holgados en una hoja. El canvas tiene mas de 1000 px igual; el tamanio es de
// presentacion.
const ladoQR = () => (documentos.length > 1 ? 4 : 5);

function dibujarQR(lienzo, texto) {
    // Del MISMO string que el texto muestra en "Ver:". No hay otra fuente.
    const { modulos, oscuro } = matrizQR(qrcode, texto);
    const px = pixelesPorModulo(modulos);
    const lado = (modulos + 2 * MARGEN_QR) * px;
    lienzo.width = lado;
    lienzo.height = lado;
    const ctx = lienzo.getContext('2d');
    // Blanco y negro fijos, no tokens del tema: el QR va a un documento, que es
    // papel blanco aunque la pantalla este en modo oscuro.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, lado, lado);
    ctx.fillStyle = '#000000';
    for (let f = 0; f < modulos; f++) {
        for (let c = 0; c < modulos; c++) {
            if (oscuro(f, c)) ctx.fillRect((c + MARGEN_QR) * px, (f + MARGEN_QR) * px, px, px);
        }
    }
}

function actualizar() {
    ultimo = armarCertificacion(leerDatos());
    const hoja = $('cert-hoja');
    hoja.replaceChildren();
    ultimo.bloques.forEach((b) => {
        const p = document.createElement('p');
        p.className = 'cert-texto';
        pintar(p, b.texto, ultimo.faltan);
        hoja.append(p);
        // Los bloques de documento llevan QR aunque el enlace falte: el lugar
        // queda marcado, igual que un hueco del texto.
        if (b.documento) hoja.append(marcoQR(b.ver, b.documento));
    });

    const faltan = $('cert-faltan');
    if (ultimo.faltan.length) {
        faltan.textContent = `Falta completar: ${ultimo.faltan.join(', ')}. ` +
            'Se puede copiar igual; lo que falta queda entre corchetes.';
        faltan.classList.remove('oculto');
    } else {
        faltan.classList.add('oculto');
    }
}

function marcoQR(ver, n) {
    const marco = document.createElement('div');
    marco.className = 'cert-qr-marco';
    marco.style.setProperty('--lado-qr', `${ladoQR()}cm`);
    const varios = documentos.length > 1;
    if (!ver) {
        const vacio = document.createElement('p');
        vacio.className = 'cert-qr-vacio';
        vacio.textContent = varios ? `El QR ${n} aparece cuando su enlace es válido.` : 'El QR aparece cuando el enlace es válido.';
        marco.append(vacio);
        return marco;
    }
    const lienzo = document.createElement('canvas');
    lienzo.className = 'cert-qr';
    lienzo.setAttribute('aria-label', `Código QR ${varios ? n + ' ' : ''}con el enlace para ver la resolución`);
    dibujarQR(lienzo, ver);
    marco.append(lienzo);

    const acciones = document.createElement('div');
    acciones.className = 'cert-qr-acciones';
    const boton = (texto, fn) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chico';
        b.textContent = texto;
        b.addEventListener('click', fn);
        acciones.append(b);
    };
    const sufijo = varios ? ` ${n}` : '';
    boton(`Copiar QR${sufijo}`, () => copiarQR(lienzo));
    boton(`Descargar QR${sufijo}`, () => bajarQR(lienzo, varios ? `qr-certificacion-${n}.png` : 'qr-certificacion.png'));
    marco.append(acciones);
    return marco;
}

const pngDe = (lienzo) => new Promise((resolver, rechazar) => {
    lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error('no se pudo generar la imagen'))), 'image/png');
});

// ---------------------------------------------------------------------------
// Copiar y descargar
// ---------------------------------------------------------------------------

const textoPlano = () => ultimo.bloques.map((b) => b.texto).join('\n\n');

function escapar(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// El texto en HTML, con los enlaces clicables. Solo se enlaza lo que
// analizarEnlace ya comprobo que es https y del PJN.
function htmlDelTexto(texto) {
    let h = escapar(texto).replace(/\n/g, '<br>');
    for (const doc of documentos) {
        if (!doc.enlace.ok) continue;
        for (const u of [doc.enlace.descargar, doc.enlace.ver]) {
            const e = escapar(u);
            h = h.split(`: ${e}<br>`).join(`: <a href="${e}">${e}</a><br>`);
            if (h.endsWith(`: ${e}`)) h = h.slice(0, -e.length) + `<a href="${e}">${e}</a>`;
        }
    }
    return h;
}

function blobABase64(blob) {
    return new Promise((resolver) => {
        const lector = new FileReader();
        lector.onload = () => resolver(lector.result);
        lector.readAsDataURL(blob);
    });
}

function informar(mensaje) {
    $('cert-copia-estado').textContent = mensaje;
}

async function copiarQR(lienzo) {
    try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': await pngDe(lienzo) })]);
        informar('QR copiado como imagen.');
    } catch (e) {
        informar(`El navegador no dejó copiar la imagen (${e.message}). Usá «Descargar QR» e insertalo desde el archivo.`);
    }
}

async function bajarQR(lienzo, nombre) {
    const url = URL.createObjectURL(await pngDe(lienzo));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    informar(`QR descargado como ${nombre}.`);
}

$('cert-copiar-texto').addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(textoPlano());
        informar('Texto copiado, sin los QR: pegalo y después insertá cada QR debajo de sus enlaces.');
    } catch (e) {
        informar(`El navegador no dejó copiar (${e.message}). Seleccioná el texto de arriba y copialo a mano.`);
    }
});

$('cert-copiar-todo').addEventListener('click', async () => {
    try {
        const lienzos = [...$('cert-hoja').querySelectorAll('canvas')];
        const imagenes = await Promise.all(lienzos.map(async (l) => blobABase64(await pngDe(l))));
        const cm = ladoQR();
        const px = Math.round(cm * 96 / 2.54);
        // Se recorre la hoja ya dibujada: parrafos y QR en el orden en que se ven.
        let html = '';
        let k = 0;
        let pendientes = 0;
        for (const nodo of $('cert-hoja').children) {
            if (nodo.classList.contains('cert-texto')) {
                const i = [...$('cert-hoja').querySelectorAll('.cert-texto')].indexOf(nodo);
                html += `<p>${htmlDelTexto(ultimo.bloques[i].texto)}</p>`;
            } else if (nodo.querySelector('canvas')) {
                html += `<p><img src="${imagenes[k++]}" width="${px}" height="${px}" style="width:${cm}cm;height:${cm}cm" alt="Código QR"></p>`;
            } else {
                pendientes++;
            }
        }
        await navigator.clipboard.write([new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([textoPlano()], { type: 'text/plain' }),
        })]);
        informar(pendientes
            ? `Copiado el texto con ${k} QR. ${pendientes === 1 ? 'Falta uno' : `Faltan ${pendientes}`}: su enlace no es válido todavía.`
            : 'Copiado el texto con los QR adentro. Si al pegar no aparecen, usá «Copiar texto» y copiá cada QR por separado.');
    } catch (e) {
        informar(`El navegador no dejó copiar (${e.message}). Usá «Copiar texto» y descargá cada QR por separado.`);
    }
});

agregarDocumento();
