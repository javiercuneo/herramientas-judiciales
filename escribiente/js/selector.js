// ---------------------------------------------------------------------------
// El selector: elegir que se tapa marcando el texto, no tildando una lista.
//
// Es la fase 3 de docs/PLAN_SELECTOR.md, y vive aca, junto al motor, porque lo
// usan dos pantallas: la de Escribiente y la del ingreso de `redactor`, que lo
// sirve desde esta misma carpeta (decidido por Javier el 3/10/2026). Una copia
// en cada lado se desincroniza.
//
// LO QUE MUESTRA es el texto ORIGINAL, con lo tapado marcado —el nombre a la
// vista y la etiqueta al costado—, los candidatos sin decidir subrayados y las
// citas de fallos sombreadas. Se decide sobre eso:
//
//   clic en lo tapado     destapar aca, "no es persona" en todo, cambiar etiqueta
//   clic en un candidato  taparlo en todo, o descartarlo
//   seleccionar texto     taparlo en todo (con la cuenta de cuantas veces), o
//                         destapar aca lo que la seleccion toque
//   teclado               n / p al candidato siguiente y anterior, t tapa,
//                         d descarta, Esc cierra el menu
//
// NO ANONIMIZA NADA PROPIO. Cada cambio vuelve a correr el motor
// —`anonimizarConTramos`— con las decisiones nuevas, y pinta lo que devuelve.
// Una pantalla con su propia logica de que se tapa es un segundo anonimizador,
// y despues uno tapa lo que el otro no.
//
// NO GUARDA NADA. Las decisiones salen por `alCambiar`, y quien lo monta decide
// donde viven. En `redactor`, en el confirmado.json del caso, fuera del repo.
// ---------------------------------------------------------------------------

import {
    anonimizarConTramos,
    candidatosANombre,
    caratulasCitadas,
    palabrasSueltasDeElegidos,
    ubicarEnElTexto,
    esEtiquetaDeNombre,
    ETIQUETAS_DE_NOMBRE,
} from './motor/anonimizar.js';

const ETIQUETA_POR_DEFECTO = '[PERSONA]';
const LETRA_O_DIGITO = /[\p{L}\p{N}]/u;

function normal(t) {
    return String(t).replace(/\s+/g, ' ').trim();
}

function igualSinCaja(a, b) {
    return normal(a).toLocaleLowerCase('es') === normal(b).toLocaleLowerCase('es');
}

function palabras(t) {
    return normal(t).split(' ').filter((p) => LETRA_O_DIGITO.test(p));
}

function nodo(etiqueta, clase, texto) {
    const n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
}

function boton(texto, accion, clase = '') {
    const b = nodo('button', clase, texto);
    b.type = 'button';
    b.addEventListener('click', (e) => { e.stopPropagation(); accion(); });
    return b;
}

function elegirEtiqueta(valor = ETIQUETA_POR_DEFECTO) {
    const s = document.createElement('select');
    for (const e of ETIQUETAS_DE_NOMBRE) {
        const o = nodo('option', '', e);
        o.value = e;
        s.append(o);
    }
    s.value = ETIQUETAS_DE_NOMBRE.includes(valor) ? valor : ETIQUETA_POR_DEFECTO;
    s.addEventListener('click', (e) => e.stopPropagation());
    return s;
}

/** Monta el selector en `contenedor`. Devuelve `{ actualizar, destruir }`.
 *
 * `opciones`:
 *   texto        el texto original, CON los nombres
 *   decisiones   { elegidos: [{texto, reemplazo}], excepciones: [texto],
 *                  noTapar: [{desde, hasta, texto}], descartados: [texto] }
 *   alCambiar    se llama con las decisiones nuevas despues de cada cambio
 */
export function crearSelector(contenedor, { texto, decisiones = {}, alCambiar = () => {} }) {
    let estado = {
        elegidos: [...(decisiones.elegidos || [])],
        excepciones: [...(decisiones.excepciones || [])],
        noTapar: [...(decisiones.noTapar || [])],
        descartados: [...(decisiones.descartados || [])],
    };
    let verResultado = false;
    let actual = -1;            // el candidato parado, para el teclado
    let candidatosPintados = [];
    let ultimo = null;          // la ultima corrida del motor

    contenedor.classList.add('selector');
    contenedor.tabIndex = 0;
    const barra = nodo('div', 'sel-barra');
    const cuerpo = nodo('div', 'sel-texto');
    const menu = nodo('div', 'sel-menu');
    menu.hidden = true;
    contenedor.replaceChildren(barra, cuerpo, menu);

    function cambiar(nuevo) {
        estado = { ...estado, ...nuevo };
        alCambiar(copiar());
        pintar();
    }

    function copiar() {
        return JSON.parse(JSON.stringify(estado));
    }

    // ---- la corrida del motor y lo que se pinta ----

    function correr() {
        // Un rango cuyo texto ya no es el que se destapo -el escrito cambio- no
        // se aplica: destaparia otra cosa.
        const noTapar = estado.noTapar
            .map((r, k) => ({ desde: r.desde, hasta: r.hasta, k, vale: r.texto === undefined || texto.slice(r.desde, r.hasta) === r.texto }))
            .filter((r) => r.vale);
        const r = anonimizarConTramos(texto, estado.elegidos, {
            excepciones: estado.excepciones,
            noTapar: noTapar.map(({ desde, hasta }) => ({ desde, hasta })),
        });
        const tapadosEn = (d, h) => r.tramos.some((t) => d < t.hasta && h > t.desde);
        const elegidosPlanos = estado.elegidos.map((e) => normal(e.texto).toLocaleLowerCase('es'));
        const candidatos = [];
        for (const c of candidatosANombre(texto)) {
            const plano = normal(c.texto).toLocaleLowerCase('es');
            if (elegidosPlanos.includes(plano)) continue;
            // Lo descartado y lo que se dijo que no es persona ya esta decidido.
            if ([...estado.descartados, ...estado.excepciones].some((d) => igualSinCaja(d, c.texto))) continue;
            for (const lugar of ubicarEnElTexto(texto, c.texto)) {
                if (!tapadosEn(lugar.desde, lugar.hasta)) candidatos.push({ ...lugar, texto: c.texto });
            }
        }
        // El apellido suelto de un nombre ya tapado -"el rodado de Inventado"-
        // no tiene forma de nombre y ningun patron lo ofrece. El motor sabe
        // encontrarlo: se ofrece como candidato, no se tapa solo.
        const tapadosComoNombre = r.tramos
            .filter((t) => esEtiquetaDeNombre(t.etiqueta))
            .map((t) => normal(texto.slice(t.desde, t.hasta)));
        for (const s of palabrasSueltasDeElegidos(r.texto, [...estado.elegidos.map((e) => e.texto), ...tapadosComoNombre])) {
            if (estado.descartados.some((d) => igualSinCaja(d, s.texto))) continue;
            for (const lugar of ubicarEnElTexto(texto, s.texto)) {
                if (!tapadosEn(lugar.desde, lugar.hasta)) candidatos.push({ ...lugar, texto: s.texto, suelta: true });
            }
        }
        candidatos.sort((a, b) => a.desde - b.desde);
        // Dos candidatos superpuestos ("Juan Perez" y "Perez Garcia"): queda el primero.
        const sinPisar = [];
        for (const c of candidatos) {
            if (!sinPisar.length || c.desde >= sinPisar.at(-1).hasta) sinPisar.push(c);
        }
        const citas = caratulasCitadas(texto).filter((c) => !c.propia);
        return { ...r, candidatos: sinPisar, citas, noTapar };
    }

    // El texto se parte en tramos planos, cada uno con lo que es: tapado,
    // candidato, destapado aca, o texto comun (dentro de una cita o no). Cada
    // pedazo es un <span> con `data-desde` y UN solo nodo de texto adentro: asi
    // una seleccion se traduce a posiciones del original sin adivinar.
    function pedazos(r) {
        const cortes = new Set([0, texto.length]);
        const marcas = [];
        r.tramos.forEach((t, i) => { if (t.hasta > t.desde) marcas.push({ ...t, tipo: 'tapado', i }); });
        r.candidatos.forEach((c, i) => marcas.push({ ...c, tipo: 'candidato', i }));
        r.noTapar.forEach((n) => marcas.push({ ...n, tipo: 'destapado', i: n.k }));
        for (const m of marcas) { cortes.add(m.desde); cortes.add(m.hasta); }
        for (const c of r.citas) { cortes.add(c.desde); cortes.add(c.hasta); }
        const orden = [...cortes].filter((x) => x >= 0 && x <= texto.length).sort((a, b) => a - b);
        const salida = [];
        for (let k = 0; k + 1 < orden.length; k++) {
            const [a, b] = [orden[k], orden[k + 1]];
            if (a === b) continue;
            const m = marcas.find((x) => x.tipo === 'tapado' && a >= x.desde && b <= x.hasta) ||
                marcas.find((x) => x.tipo === 'destapado' && a >= x.desde && b <= x.hasta) ||
                marcas.find((x) => x.tipo === 'candidato' && a >= x.desde && b <= x.hasta);
            const enCita = r.citas.some((c) => a >= c.desde && b <= c.hasta);
            const previo = salida.at(-1);
            if (previo && previo.marca === m && previo.enCita === enCita && m) previo.hasta = b;
            else salida.push({ desde: a, hasta: b, marca: m, enCita });
        }
        return salida;
    }

    function pintar() {
        const arriba = cuerpo.scrollTop;
        cerrarMenu();
        ultimo = correr();
        const r = ultimo;
        candidatosPintados = r.candidatos;
        if (actual >= candidatosPintados.length) actual = candidatosPintados.length - 1;

        // La barra: lo que hay, y lo que se puede deshacer.
        barra.replaceChildren();
        const nombres = r.tramos.filter((t) => esEtiquetaDeNombre(t.etiqueta)).length;
        const resumen = nodo('span', 'sel-resumen',
            `${r.tramos.length} tapado(s), ${nombres} de nombres · ` +
            `${r.candidatos.length} por decidir` +
            (r.citas.length ? ` · ${r.citas.length} cita(s) de fallos, a la vista` : ''));
        const ver = boton(verResultado ? 'Ver el original' : 'Ver cómo queda', () => {
            verResultado = !verResultado;
            pintar();
        }, 'sel-ver');
        barra.append(resumen, ver);
        const deshacibles = [
            ...estado.excepciones.map((e) => ({ texto: `no es persona: ${e}`,
                quitar: () => cambiar({ excepciones: estado.excepciones.filter((x) => x !== e) }) })),
            ...estado.descartados.map((e) => ({ texto: `descartado: ${e}`,
                quitar: () => cambiar({ descartados: estado.descartados.filter((x) => x !== e) }) })),
        ];
        if (deshacibles.length) {
            const lista = nodo('div', 'sel-fichas');
            for (const d of deshacibles) {
                const f = nodo('span', 'sel-ficha', d.texto);
                f.append(boton('×', d.quitar, 'sel-quitar'));
                f.lastChild.title = 'Deshacer';
                lista.append(f);
            }
            barra.append(lista);
        }

        cuerpo.replaceChildren();
        if (verResultado) {
            cuerpo.append(nodo('span', 'sel-resultado', r.texto));
        } else {
            for (const p of pedazos(r)) {
                const t = texto.slice(p.desde, p.hasta);
                const m = p.marca;
                let el;
                if (!m) {
                    el = nodo('span', p.enCita ? 'sel-cita' : '', t);
                    if (p.enCita) el.title = 'Cita de un fallo: queda a la vista';
                } else if (m.tipo === 'tapado') {
                    el = nodo('mark', `sel-tapado sel-${m.origen}`, t);
                    el.dataset.etiqueta = m.etiqueta;
                    el.dataset.tramo = m.i;
                    el.title = `${m.etiqueta} · ${m.origen === 'elegido' ? 'elegido' : m.regla}`;
                } else if (m.tipo === 'destapado') {
                    el = nodo('span', 'sel-destapado', t);
                    el.dataset.destapado = m.i;
                    el.title = 'Destapado acá';
                } else {
                    el = nodo('span', 'sel-candidato', t);
                    el.dataset.candidato = m.i;
                    if (m.i === actual) el.classList.add('sel-actual');
                    el.title = m.suelta ? 'Parte suelta de un nombre ya tapado' : 'Candidato sin decidir';
                }
                el.dataset.desde = p.desde;
                cuerpo.append(el);
            }
        }
        cuerpo.scrollTop = arriba;
    }

    // ---- las decisiones ----

    function tapar(frase, etiqueta) {
        const t = normal(frase);
        if (!t) return;
        const elegidos = estado.elegidos.filter((e) => !igualSinCaja(e.texto, t));
        elegidos.push({ texto: t, reemplazo: etiqueta });
        cambiar({
            elegidos,
            excepciones: estado.excepciones.filter((e) => !igualSinCaja(e, t)),
            descartados: estado.descartados.filter((e) => !igualSinCaja(e, t)),
        });
    }

    function destaparAca(desde, hasta) {
        cambiar({ noTapar: [...estado.noTapar, { desde, hasta, texto: texto.slice(desde, hasta) }] });
    }

    function elegidoDe(tramo) {
        const pedazo = texto.slice(tramo.desde, tramo.hasta);
        return estado.elegidos.find((e) => ubicarEnElTexto(pedazo, e.texto).length);
    }

    // ---- el menu ----

    function cerrarMenu() {
        menu.hidden = true;
        menu.replaceChildren();
    }

    function abrirMenu(x, y, armar) {
        menu.replaceChildren();
        armar(menu);
        menu.hidden = false;
        const caja = contenedor.getBoundingClientRect();
        menu.style.left = `${Math.max(0, Math.min(x - caja.left, caja.width - 300))}px`;
        menu.style.top = `${y - caja.top + 8}px`;
        const primero = menu.querySelector('button, select');
        if (primero) primero.focus();
    }

    function menuTramo(t, x, y) {
        const original = texto.slice(t.desde, t.hasta);
        abrirMenu(x, y, (m) => {
            m.append(nodo('div', 'sel-menu-titulo', `«${normal(original)}» → ${t.etiqueta}`));
            m.append(boton('Destapar acá', () => destaparAca(t.desde, t.hasta)));
            if (!esEtiquetaDeNombre(t.etiqueta)) {
                m.append(nodo('div', 'sel-menu-nota', `Lo tapó la regla «${t.regla}».`));
                return;
            }
            const elegido = t.origen === 'elegido' ? elegidoDe(t) : null;
            if (elegido) {
                const etiqueta = elegirEtiqueta(elegido.reemplazo);
                etiqueta.addEventListener('change', () => tapar(elegido.texto, etiqueta.value));
                const fila = nodo('div', 'sel-menu-fila', 'Queda como ');
                fila.append(etiqueta);
                m.append(fila);
                m.append(boton('Destapar en todo el texto', () =>
                    cambiar({ elegidos: estado.elegidos.filter((e) => e !== elegido) })));
            } else if (palabras(original).length >= 2) {
                m.append(boton('No es persona: no tapar en ningún lado', () => cambiar({
                    excepciones: [...estado.excepciones, normal(original)],
                })));
            } else {
                m.append(nodo('div', 'sel-menu-nota',
                    'Una palabra sola no se puede marcar como «no es persona»: dejaría medio nombre a la vista en cada homónimo.'));
            }
        });
    }

    function menuCandidato(c, x, y) {
        const n = ubicarEnElTexto(texto, c.texto).length;
        abrirMenu(x, y, (m) => {
            m.append(nodo('div', 'sel-menu-titulo', `«${normal(c.texto)}» · ${n} vez/veces`));
            const etiqueta = elegirEtiqueta();
            const fila = nodo('div', 'sel-menu-fila');
            fila.append(boton(`Tapar en todo (${n})`, () => tapar(c.texto, etiqueta.value), 'sel-primario'), etiqueta);
            m.append(fila);
            m.append(boton('No es persona', () => cambiar({ descartados: [...estado.descartados, normal(c.texto)] })));
        });
    }

    // Una seleccion pegada a un nombre ya tapado propone el nombre entero: se
    // selecciona "Gomez" detras de "[PERSONA]" y se ofrece "Ana Gomez".
    function unirConVecino(desde, hasta) {
        const nombres = (ultimo?.tramos || []).filter((t) => esEtiquetaDeNombre(t.etiqueta));
        let d = desde;
        let h = hasta;
        for (const t of nombres) {
            if (t.hasta <= d && /^[\s,]*$/.test(texto.slice(t.hasta, d))) d = Math.min(d, t.desde);
            if (t.desde >= h && /^[\s,]*$/.test(texto.slice(h, t.desde))) h = Math.max(h, t.hasta);
        }
        return [d, h];
    }

    function menuSeleccion(desde, hasta, x, y) {
        const elegido = texto.slice(desde, hasta);
        const [ud, uh] = unirConVecino(desde, hasta);
        const unido = (ud !== desde || uh !== hasta) ? texto.slice(ud, uh) : null;
        const tocaTapado = (ultimo?.tramos || []).some((t) => desde < t.hasta && hasta > t.desde);
        abrirMenu(x, y, (m) => {
            const frase = unido || elegido;
            const n = ubicarEnElTexto(texto, frase).length;
            m.append(nodo('div', 'sel-menu-titulo', `«${normal(frase)}» · ${n} vez/veces`));
            if (unido) m.append(nodo('div', 'sel-menu-nota', 'Se une con lo que ya estaba tapado al lado.'));
            if (!tocaTapado || unido) {
                const etiqueta = elegirEtiqueta();
                const fila = nodo('div', 'sel-menu-fila');
                fila.append(boton(`Tapar en todo (${n})`, () => tapar(frase, etiqueta.value), 'sel-primario'), etiqueta);
                m.append(fila);
            }
            if (tocaTapado) m.append(boton('Destapar acá', () => destaparAca(desde, hasta)));
        });
    }

    // ---- de la pantalla a posiciones del original ----

    function posicion(nodoDom, offset) {
        let el = nodoDom.nodeType === Node.TEXT_NODE ? nodoDom.parentElement : nodoDom;
        if (el === cuerpo) {
            const hijo = cuerpo.childNodes[Math.min(offset, cuerpo.childNodes.length - 1)];
            if (!hijo) return null;
            return Number(hijo.dataset.desde) + (offset >= cuerpo.childNodes.length ? hijo.textContent.length : 0);
        }
        while (el && el.parentElement !== cuerpo) el = el.parentElement;
        if (!el || el.dataset.desde === undefined) return null;
        return Number(el.dataset.desde) + (nodoDom.nodeType === Node.TEXT_NODE ? offset : 0);
    }

    // A palabras enteras, y sin espacios ni puntuacion en los bordes.
    function ajustar(desde, hasta) {
        while (desde > 0 && LETRA_O_DIGITO.test(texto[desde - 1]) && LETRA_O_DIGITO.test(texto[desde])) desde--;
        while (hasta < texto.length && LETRA_O_DIGITO.test(texto[hasta]) && LETRA_O_DIGITO.test(texto[hasta - 1])) hasta++;
        while (desde < hasta && !LETRA_O_DIGITO.test(texto[desde])) desde++;
        while (hasta > desde && !LETRA_O_DIGITO.test(texto[hasta - 1]) && texto[hasta - 1] !== '.') hasta--;
        return [desde, hasta];
    }

    cuerpo.addEventListener('mouseup', (e) => {
        if (verResultado) return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !cuerpo.contains(sel.anchorNode)) return;
        const r = sel.getRangeAt(0);
        const a = posicion(r.startContainer, r.startOffset);
        const b = posicion(r.endContainer, r.endOffset);
        if (a === null || b === null) return;
        const [desde, hasta] = ajustar(Math.min(a, b), Math.max(a, b));
        if (hasta <= desde) return;
        e.stopPropagation();
        menuSeleccion(desde, hasta, e.clientX, e.clientY);
    });

    cuerpo.addEventListener('click', (e) => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) return;
        const el = e.target.closest('[data-tramo], [data-candidato], [data-destapado]');
        if (!el || !ultimo) { cerrarMenu(); return; }
        e.stopPropagation();
        if (el.dataset.tramo !== undefined) menuTramo(ultimo.tramos[Number(el.dataset.tramo)], e.clientX, e.clientY);
        else if (el.dataset.candidato !== undefined) {
            actual = Number(el.dataset.candidato);
            menuCandidato(ultimo.candidatos[actual], e.clientX, e.clientY);
        } else {
            const i = Number(el.dataset.destapado);
            abrirMenu(e.clientX, e.clientY, (m) => {
                m.append(nodo('div', 'sel-menu-titulo', 'Destapado acá'));
                m.append(boton('Volver a tapar', () => cambiar({ noTapar: estado.noTapar.filter((_, k) => k !== i) })));
            });
        }
    });

    const fuera = (e) => { if (!menu.contains(e.target)) cerrarMenu(); };
    document.addEventListener('mousedown', fuera);

    // ---- teclado ----

    function irA(i) {
        if (!candidatosPintados.length) return;
        actual = (i + candidatosPintados.length) % candidatosPintados.length;
        pintar();
        const el = cuerpo.querySelector(`[data-candidato="${actual}"]`);
        if (el) el.scrollIntoView({ block: 'center' });
    }

    contenedor.addEventListener('keydown', (e) => {
        if (e.target.closest('select, input, textarea')) return;
        if (e.key === 'Escape') { cerrarMenu(); return; }
        if (!menu.hidden && e.target.closest('.sel-menu')) return;
        const c = candidatosPintados[actual];
        if (e.key === 'n') irA(actual + 1);
        else if (e.key === 'p') irA(actual - 1);
        else if (e.key === 't' && c) tapar(c.texto, ETIQUETA_POR_DEFECTO);
        else if (e.key === 'd' && c) cambiar({ descartados: [...estado.descartados, normal(c.texto)] });
        else return;
        e.preventDefault();
    });

    pintar();

    return {
        /** Decisiones que cambiaron afuera —la lista de nombres de la pantalla—. No llama a `alCambiar`. */
        actualizar(nuevas) {
            estado = { ...estado, ...JSON.parse(JSON.stringify(nuevas)) };
            pintar();
        },
        decisiones: copiar,
        destruir() {
            document.removeEventListener('mousedown', fuera);
            contenedor.replaceChildren();
            contenedor.classList.remove('selector');
        },
    };
}
