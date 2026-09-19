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
// ---------------------------------------------------------------------------

import {
    analizarEnlace, armarCertificacion, leerAutos, hoyISO,
    matrizQR, pixelesPorModulo, MARGEN_QR,
} from './motor/certificar.js';

const $ = (id) => document.getElementById(id);

const CAMPOS = ['numero', 'caratula', 'tipo', 'fecha', 'paginas', 'fojas',
    'juzgado', 'domicilio', 'expedicion'];

let enlace = analizarEnlace('');
let ultimo = { antes: '', despues: '', faltan: [] };

$('cert-expedicion').value = hoyISO();

// ---------------------------------------------------------------------------
// El enlace
// ---------------------------------------------------------------------------

function leerEnlace() {
    enlace = analizarEnlace($('cert-enlace').value);
    const estado = $('cert-enlace-estado');
    const bajar = $('cert-bajar');

    if (!$('cert-enlace').value.trim()) {
        estado.className = 'aviso-caja oculto';
        bajar.classList.add('oculto');
    } else if (!enlace.ok) {
        estado.className = 'aviso-caja error';
        estado.textContent = enlace.problema;
        bajar.classList.add('oculto');
    } else {
        estado.className = 'aviso-caja bien';
        estado.textContent = ['Enlace del PJN reconocido. Con él se arman el de ver y el de descarga.',
            ...enlace.avisos].join(' ');
        // Una descarga comun, no un fetch: la pagina tiene prohibido conectarse
        // (connect-src 'none') y el PJN no autoriza pedidos de otro origen. Un
        // enlace que el usuario aprieta es navegacion, y eso si se puede.
        bajar.href = enlace.descargar;
        bajar.classList.remove('oculto');
    }
    dibujarQR();
    actualizar();
}

$('cert-enlace').addEventListener('input', leerEnlace);

// ---------------------------------------------------------------------------
// El PDF: solo se cuentan las paginas
// ---------------------------------------------------------------------------

$('cert-pdf').addEventListener('change', async () => {
    const archivo = $('cert-pdf').files[0];
    const estado = $('cert-pdf-estado');
    if (!archivo) return;
    estado.textContent = 'Contando las páginas…';
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
        const datos = new Uint8Array(await archivo.arrayBuffer());
        const documento = await pdfjsLib.getDocument({ data: datos }).promise;
        const n = documento.numPages;
        await documento.destroy();
        $('cert-paginas').value = n;
        estado.textContent = `«${archivo.name}»: ${n} ${n === 1 ? 'página' : 'páginas'}. ` +
            'Revisá que sea la resolución que estás certificando.';
        actualizar();
    } catch (e) {
        estado.textContent = `No se pudo leer «${archivo.name}» como PDF (${e && e.message ? e.message : e}). ` +
            'Podés escribir la cantidad de páginas a mano.';
    }
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

CAMPOS.forEach((c) => $(`cert-${c}`).addEventListener('input', actualizar));

// ---------------------------------------------------------------------------
// El texto
// ---------------------------------------------------------------------------

function leerDatos() {
    const d = { enlace };
    CAMPOS.forEach((c) => { d[c] = $(`cert-${c}`).value; });
    return d;
}

/** Pinta el texto marcando los huecos, sin innerHTML con datos del usuario. */
function pintar(elemento, texto, faltan) {
    elemento.replaceChildren();
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

function actualizar() {
    ultimo = armarCertificacion(leerDatos());
    pintar($('cert-antes'), ultimo.antes, ultimo.faltan);
    pintar($('cert-despues'), ultimo.despues, ultimo.faltan);
    const faltan = $('cert-faltan');
    if (ultimo.faltan.length) {
        faltan.textContent = `Falta completar: ${ultimo.faltan.join(', ')}. ` +
            'Se puede copiar igual; lo que falta queda entre corchetes.';
        faltan.classList.remove('oculto');
    } else {
        faltan.classList.add('oculto');
    }
}

// ---------------------------------------------------------------------------
// El QR
// ---------------------------------------------------------------------------

function dibujarQR() {
    const lienzo = $('cert-qr');
    const hay = enlace.ok;
    lienzo.classList.toggle('oculto', !hay);
    $('cert-qr-vacio').classList.toggle('oculto', hay);
    $('cert-copiar-qr').disabled = !hay;
    $('cert-bajar-qr').disabled = !hay;
    if (!hay) return;

    // Del MISMO string que el texto muestra en "Ver:". No hay otra fuente.
    const { modulos, oscuro } = matrizQR(qrcode, enlace.ver);
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

const pngDelQR = () => new Promise((resolver, rechazar) => {
    $('cert-qr').toBlob((b) => (b ? resolver(b) : rechazar(new Error('no se pudo generar la imagen'))), 'image/png');
});

// ---------------------------------------------------------------------------
// Copiar y descargar
// ---------------------------------------------------------------------------

const textoPlano = () => `${ultimo.antes}\n\n${ultimo.despues}`;

function escapar(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// El texto en HTML, con los dos enlaces clicables. Los enlaces son de
// analizarEnlace, que ya comprobo que son https y del PJN.
function htmlDelTexto(texto) {
    let h = escapar(texto).replace(/\n/g, '<br>');
    if (enlace.ok) {
        for (const u of [enlace.descargar, enlace.ver]) {
            const e = escapar(u);
            h = h.split(`: ${e}`).join(`: <a href="${e}">${e}</a>`);
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

$('cert-copiar-texto').addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(textoPlano());
        informar('Texto copiado, sin el QR: pegalo y después insertá el QR entre los enlaces y la fecha.');
    } catch (e) {
        informar(`El navegador no dejó copiar (${e.message}). Seleccioná el texto de arriba y copialo a mano.`);
    }
});

$('cert-copiar-qr').addEventListener('click', async () => {
    try {
        const png = await pngDelQR();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
        informar('QR copiado como imagen.');
    } catch (e) {
        informar(`El navegador no dejó copiar la imagen (${e.message}). Usá «Descargar QR» e insertalo desde el archivo.`);
    }
});

$('cert-copiar-todo').addEventListener('click', async () => {
    try {
        let img = '';
        if (enlace.ok) {
            const datos = await blobABase64(await pngDelQR());
            // 5 cm de lado. La imagen tiene mas de 1000 px para que no se vea
            // pixelada; el tamanio lo fijan los atributos, si el editor los respeta.
            img = `<p><img src="${datos}" width="189" height="189" style="width:5cm;height:5cm" alt="Código QR"></p>`;
        }
        const html = `<p>${htmlDelTexto(ultimo.antes)}</p>${img}<p>${htmlDelTexto(ultimo.despues)}</p>`;
        await navigator.clipboard.write([new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([textoPlano()], { type: 'text/plain' }),
        })]);
        informar(enlace.ok
            ? 'Copiado el texto con el QR adentro. Si al pegar el QR no aparece, usá «Copiar texto» y «Copiar QR» por separado.'
            : 'Copiado el texto. No hay QR porque el enlace no es válido todavía.');
    } catch (e) {
        informar(`El navegador no dejó copiar (${e.message}). Usá «Copiar texto» y «Descargar QR» por separado.`);
    }
});

$('cert-bajar-qr').addEventListener('click', async () => {
    const png = await pngDelQR();
    const url = URL.createObjectURL(png);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-certificacion.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    informar('QR descargado como qr-certificacion.png.');
});

actualizar();
dibujarQR();
