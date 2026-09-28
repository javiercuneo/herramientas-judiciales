"use strict";
const $ = (id) => document.getElementById(id);
const $texto = $("texto"), $resolucion = $("resolucion"), $tipo = $("tipo");
const $carga = $("carga"), $vista = $("vista");
const $palmo = $("palmo"), $ficha = $("ficha"), $avisos = $("avisos"), $resumen = $("resumen");
const $estadoEdicion = $("estado-edicion"), $error = $("error");
const PIEZA = { testimonio: { nombre: "el testimonio", rubros: "rubros del RPI y del protocolo", placeholder: "Pegá acá el testimonio, tal como te llegó.\n\nSin los autos se controla contra sí mismo: la transcripción contra lo que el juzgado dice por sí, la regla de las letras y los rubros del RPI.", nota: "Lo que coincide con los autos no se marca, aunque esté escrito distinto. Lo que el testimonio dice por sí -la fórmula, los autorizados- no se compara contra los autos: va en gris. Un error repetido igual en el testimonio y en los autos pasa sin ruido." }, oficio: { nombre: "el oficio", rubros: "rubros del oficio y del protocolo", placeholder: "Pegá acá el oficio, tal como te llegó.\n\nSin los autos controla que cada monto diga lo mismo en números y en letras, el dígito verificador de los CUIT y los CBU, y los rubros.", nota: "Lo que coincide con los autos no se marca, aunque esté escrito distinto. El cuerpo del oficio no se compara contra los autos: va en gris. Un CUIT o un CBU que cierra puede ser de otra persona o de otra cuenta." }, mandamiento: { nombre: "el mandamiento", rubros: "rubros del mandamiento y del protocolo", placeholder: "Pegá acá el mandamiento, tal como te llegó.\n\nSin los autos controla que el monto que pide el cuerpo esté en el auto transcripto, que en números y en letras diga lo mismo, y los rubros.", nota: "Lo que coincide con los autos no se marca, aunque esté escrito distinto. El cuerpo del mandamiento no se compara contra los autos: va en gris. La lista de rubros es un borrador sacado de dos modelos." }, transferencia: { nombre: "el formulario de transferencia", rubros: "", placeholder: "Pegá acá el PDF del formulario de transferencia del DEOX, con el auto que viene abajo.\n\nCada campo -cuentas, suma, concepto, banco, titular, CUIT, CBU, régimen- se busca en el auto. Si el CBU lo dice otro auto, pegalo en el panel de los autos.", nota: "Cada campo del formulario se buscó en el auto que viene abajo y en el panel de los autos. No se comparan la carátula, el expediente, el juzgado ni la sucursal de origen, que los pone el sistema. Que un dato esté en el auto quiere decir que el auto lo nombra en alguna parte, no que sea el que ordena." } };
function pieza() {
  return PIEZA[$tipo.value] || PIEZA.testimonio;
}
const CLASE = { cambio: { rotulo: "dice otra cosa", corrige: true }, falta: { rotulo: "falta en el documento", corrige: true }, sobra: { rotulo: "sobra en el documento", corrige: true }, omitido: { rotulo: "omitido con (…)", corrige: false, nota: "No es un error: se transcriben las partes pertinentes. Mirá si lo omitido lo era." }, cierre: { rotulo: "fórmula de cierre sin transcribir", corrige: false, nota: "El auto termina con esto y el documento no lo transcribió. No cambia lo que el auto ordena." }, fecha: { rotulo: "fecha sin cotejar", corrige: false, nota: "El auto que pegaste no trae esta fecha en el cuerpo: los que se firman electrónicamente la llevan al pie. Miralo en el expediente." } };
let ultimoControlado = null;
let actual = null;
let elegido = null;
function mostrar(pantalla) {
  $carga.hidden = pantalla !== "carga";
  $vista.hidden = pantalla !== "vista";
}
function avisarError(texto) {
  $error.textContent = texto;
  $error.hidden = !texto;
}
function controlar() {
  avisarError("");
  const texto = $texto.value, resolucion = $resolucion.value, tipo = $tipo.value;
  const boton = $("controlar");
  boton.textContent = "Controlando…";
  boton.disabled = true;
  setTimeout(() => {
    let v;
    try {
      v = Motor.confrontar.vista(texto, resolucion, tipo);
    } catch (e) {
      console.error(e);
      v = { error: "El control no se pudo hacer: falló el motor (" + String(e && e.message || e) + "). Nada de esto quiere decir que el documento esté bien." };
    } finally {
      boton.textContent = "Controlar";
      boton.disabled = false;
    }
    if (v.error) {
      avisarError(v.error);
      return;
    }
    ultimoControlado = texto;
    $estadoEdicion.textContent = "";
    for (const c of v.cambios) c.aceptado = CLASE[c.clase].corrige && c.a >= 0 && !c.sinLugar;
    actual = v;
    elegido = null;
    dibujarVista();
    mostrar("vista");
    $palmo.scrollTop = 0;
  }, 0);
}
$("controlar").addEventListener("click", controlar);
$texto.addEventListener("input", () => {
  if (ultimoControlado !== null && $texto.value !== ultimoControlado) {
    $estadoEdicion.textContent = "editado desde el último control";
  }
});
$("archivo").addEventListener("change", (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  const lector = new FileReader();
  lector.onload = () => {
    $texto.value = lector.result;
  };
  lector.readAsText(f, "utf-8");
  ev.target.value = "";
});
$("ejemplo").addEventListener("click", () => {
  if (($texto.value.trim() || $resolucion.value.trim()) && !confirm("Esto reemplaza lo que hay en los dos paneles. ¿Sigo?")) return;
  const r = Motor.ejemplos[$tipo.value] || Motor.ejemplos.testimonio;
  $texto.value = r.texto;
  $resolucion.value = r.resolucion;
  controlar();
});
$("borrar").addEventListener("click", () => {
  if (ultimoControlado !== null && $texto.value !== ultimoControlado && !confirm("Corregiste el documento después del último control. ¿Lo borro igual?")) return;
  $texto.value = "";
  $resolucion.value = "";
  ultimoControlado = null;
  actual = null;
  $estadoEdicion.textContent = "";
  avisarError("");
  $texto.focus();
});
function alCambiarTipo() {
  $texto.placeholder = pieza().placeholder;
  $("rotulo-documento").textContent = pieza().nombre[0].toUpperCase() + pieza().nombre.slice(1);
}
$tipo.addEventListener("change", alCambiarTipo);
alCambiarTipo();
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !$carga.hidden) {
    e.preventDefault();
    controlar();
  }
});
function el(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto !== void 0) n.textContent = texto;
  return n;
}
function ubicados(v) {
  return v.cambios.filter((c) => c.a >= 0 && !c.sinLugar).sort((x, y) => x.a - y.a || x.b - y.b);
}
const corregido = (v) => Motor.confrontar.corregir(v);
function dibujarVista() {
  const v = actual;
  const texto = v.texto;
  const cambios = ubicados(v);
  const avisos = v.avisos.filter((a) => a.a >= 0);
  const cortes = new Set([0, texto.length]);
  for (const [a, b] of v.comparado) {
    cortes.add(a);
    cortes.add(b);
  }
  for (const c of cambios) {
    cortes.add(c.a);
    cortes.add(c.b);
  }
  for (const a of avisos) {
    cortes.add(a.a);
    cortes.add(a.b);
  }
  for (let i = 0; i < texto.length; i++) if (texto[i] === "\n") {
    cortes.add(i);
    cortes.add(i + 1);
  }
  const puntos = [...cortes].sort((x, y) => x - y);
  const dentro = (i, a, b) => a <= i && i < b;
  const cambioEn = (i) => cambios.find((c) => c.a !== c.b && dentro(i, c.a, c.b));
  const avisoEn = (i) => avisos.find((a) => dentro(i, a.a, a.b));
  const comparadoEn = (i) => !v.conAutos || v.comparado.some(([a, b]) => dentro(i, a, b));
  const filas = [];
  let fila = { izq: el("div", "celda"), der: el("div", "celda") };
  const cerrarFila = () => {
    filas.push(fila);
    fila = { izq: el("div", "celda"), der: el("div", "celda") };
  };
  const enPunto = new Map();
  for (const c of cambios) if (c.a === c.b) {
    if (!enPunto.has(c.a)) enPunto.set(c.a, []);
    enPunto.get(c.a).push(c);
  }
  const dibujados = new Set();
  for (let k = 0; k < puntos.length; k++) {
    const i = puntos[k];
    for (const c2 of enPunto.get(i) || []) marcarPunto(fila, c2);
    if (k === puntos.length - 1) break;
    const j = puntos[k + 1];
    const trozo = texto.slice(i, j);
    if (!trozo) continue;
    if (trozo === "\n" && !cambioEn(i)) {
      cerrarFila();
      continue;
    }
    const c = cambioEn(i), a = avisoEn(i);
    if (c) {
      if (dibujados.has(c.id)) continue;
      dibujados.add(c.id);
      marcarTramo(fila, c, texto.slice(c.a, c.b));
      while (k + 1 < puntos.length - 1 && puntos[k + 1] < c.b) k++;
      continue;
    }
    const clase = (comparadoEn(i) ? "" : "nocomp") + (a ? " aviso-marca" : "");
    const izq = el("span", clase, trozo), der = el("span", clase, trozo);
    if (a) {
      izq.title = der.title = a.estado + ": " + a.detalle;
      izq.addEventListener("click", () => mostrarAviso(a));
      der.addEventListener("click", () => mostrarAviso(a));
    }
    fila.izq.append(izq);
    fila.der.append(der);
  }
  cerrarFila();
  $palmo.replaceChildren();
  for (const f of filas) {
    const r = el("div", "fila");
    if (!f.izq.textContent && !f.der.textContent && !f.izq.children.length) r.classList.add("vacia");
    r.append(f.izq, f.der);
    $palmo.append(r);
  }
  dibujarResumen();
  dibujarAvisos();
  if (elegido !== null) dibujarFicha();
}
function marca(c) {
  const n = el("span", "cambio c-" + c.clase + (CLASE[c.clase].corrige && !c.aceptado ? " descartado" : "") + (elegido === c.id ? " elegido" : ""));
  n.dataset.id = c.id;
  n.addEventListener("click", () => elegir(c.id));
  return n;
}
function marcarTramo(fila, c, original) {
  const izq = marca(c), der = marca(c);
  izq.textContent = original;
  if (CLASE[c.clase].corrige && c.aceptado) {
    der.textContent = c.propuesta;
    if (c.clase === "sobra") der.classList.add("borrado");
  } else {
    der.textContent = original;
  }
  fila.izq.append(izq);
  fila.der.append(der);
}
function marcarPunto(fila, c) {
  const izq = marca(c), der = marca(c);
  izq.classList.add("punto");
  if (c.clase === "falta") {
    izq.textContent = "‸";
    if (c.aceptado) {
      der.textContent = " " + c.propuesta;
      der.classList.remove("punto");
    } else {
      der.textContent = "‸";
      der.classList.add("punto");
    }
  } else {
    izq.textContent = der.textContent = c.clase === "cierre" ? "«Hágase saber…»" : "(…)";
    der.classList.add("punto");
  }
  fila.izq.append(izq);
  fila.der.append(der);
}
function dibujarResumen() {
  const v = actual;
  const aCorregir = v.cambios.filter((c) => CLASE[c.clase].corrige).length;
  const aceptados = v.cambios.filter((c) => CLASE[c.clase].corrige && c.aceptado).length;
  let t;
  if (v.tipo === "transferencia") {
    const coinciden = v.avisos.filter((a) => a.estado === "COINCIDE").length;
    t = `${v.paraMirar} ${v.paraMirar === 1 ? "cosa para mirar" : "cosas para mirar"}; ${coinciden} ${coinciden === 1 ? "dato coincide" : "datos coinciden"} con el auto.`;
  } else if (!v.conAutos) {
    t = `Sin los autos: nada que corregir contra el expediente. ${v.paraMirar} ` + (v.paraMirar === 1 ? "cosa para mirar." : "cosas para mirar.");
  } else {
    t = aCorregir === 0 ? "Contra los autos no encontré nada que corregir. Eso no quiere decir que esté bien: quiere decir que lo que yo controlo, cierra." : `${aCorregir} ${aCorregir === 1 ? "corrección propuesta" : "correcciones propuestas"}, ${aceptados} ${aceptados === 1 ? "aceptada" : "aceptadas"}.`;
    const al = v.alineado;
    if (al) t += ` Se compararon ${al.comparado} de ${al.de} palabras; el resto va en gris y no se controló.`;
  }
  $resumen.textContent = t;
}
function dibujarAvisos() {
  const v = actual;
  $avisos.replaceChildren();
  const items = [];
  const omitidos = v.cambios.filter((c) => c.clase === "omitido" || c.clase === "cierre");
  for (const c of v.cambios.filter((x) => x.clase === "fecha" && x.a >= 0 && !x.sinLugar)) {
    items.push({ estado: "FECHA", titulo: c.dice, detalle: CLASE.fecha.nota, id: c.id });
  }
  for (const a of v.avisos) items.push(a);
  for (const c of v.cambios.filter((c2) => c2.sinLugar || c2.a < 0)) {
    items.push({ estado: c.clase === "falta" ? "FALTA" : "DIFERENCIA", titulo: (c.auto ? `auto ${c.auto}: ` : "") + c.que, detalle: "no la pude ubicar en el texto.", lados: [["el documento dice", c.dice], ["los autos dicen", c.resolucion]], a: -1 });
  }
  if (!items.length && !omitidos.length) {
    $avisos.hidden = true;
    return;
  }
  $avisos.hidden = false;
  const lista = el("div", "avisos-lista");
  for (const a of items) {
    const leve = ["NO LO ENCONTRE", "SIN ZONAS", "FECHA", "EN DIGITOS", "SIN COTEJAR", "COINCIDE"].includes(a.estado);
    const b = el("button", "aviso-chip" + (leve ? " leve" : ""));
    b.append(el("b", "", a.estado), document.createTextNode(" " + a.titulo));
    b.title = a.detalle;
    b.addEventListener("click", () => a.id !== void 0 ? elegir(a.id) : mostrarAviso(a));
    lista.append(b);
  }
  if (omitidos.length) {
    const b = el("button", "aviso-chip gris");
    b.append(el("b", "", "OMITIDO"), document.createTextNode(` ${omitidos.length} ${omitidos.length === 1 ? "parte no transcripta" : "partes no transcriptas"} a propósito, en gris en el texto`));
    b.addEventListener("click", () => {
      const c = omitidos.find((x) => x.a >= 0);
      if (c) elegir(c.id);
    });
    lista.append(b);
  }
  $avisos.append(lista, el("p", "nota", pieza().nota));
}
function ordenados() {
  return ubicados(actual);
}
function elegir(id) {
  elegido = id;
  for (const n of $palmo.querySelectorAll(".cambio.elegido")) n.classList.remove("elegido");
  const nodos = $palmo.querySelectorAll(`.cambio[data-id="${id}"]`);
  for (const n of nodos) n.classList.add("elegido");
  if (nodos[0]) nodos[0].scrollIntoView({ block: "center", behavior: "smooth" });
  dibujarFicha();
}
function dibujarFicha() {
  const c = actual.cambios.find((x) => x.id === elegido);
  if (!c) {
    $ficha.hidden = true;
    return;
  }
  const def = CLASE[c.clase];
  $ficha.replaceChildren();
  $ficha.hidden = false;
  const lista = ordenados();
  const k = lista.findIndex((x) => x.id === c.id);
  const cab = el("div", "ficha-cab");
  cab.append(el("b", "", (c.auto ? `Auto ${c.auto}: ` : "") + def.rotulo), el("span", "sutil", `  ${k + 1} de ${lista.length}`));
  const nav = el("span", "ficha-nav");
  const ant = el("button", "", "‹ Anterior"), sig = el("button", "", "Siguiente ›");
  ant.disabled = k <= 0;
  sig.disabled = k >= lista.length - 1;
  ant.addEventListener("click", () => elegir(lista[k - 1].id));
  sig.addEventListener("click", () => elegir(lista[k + 1].id));
  const cerrar = el("button", "", "✕");
  cerrar.title = "Cerrar";
  cerrar.addEventListener("click", () => {
    elegido = null;
    $ficha.hidden = true;
    for (const n of $palmo.querySelectorAll(".cambio.elegido")) n.classList.remove("elegido");
  });
  nav.append(ant, sig, cerrar);
  cab.append(nav);
  $ficha.append(cab);
  const lados = el("div", "ficha-lados");
  const lado = (quien, que) => {
    const d = el("div", "lado");
    d.append(el("span", "quien", quien), el("span", "que", que || "(nada)"));
    return d;
  };
  if (c.clase === "omitido" || c.clase === "cierre") {
    lados.append(lado("se omitió", c.resolucion));
  } else if (c.clase === "fecha") {
    lados.append(lado("el documento dice", c.dice));
  } else {
    lados.append(lado("el documento dice", c.dice), lado("los autos dicen", c.resolucion));
    if (def.corrige) {
      const p = lado("se propone", c.clase === "sobra" ? "sacarlo" : c.propuesta);
      if (c.enLetras) p.append(el("span", "sutil", "  en letras, como va en la transcripción"));
      lados.append(p);
    }
  }
  $ficha.append(lados);
  if (def.nota) $ficha.append(el("p", "sutil", def.nota));
  if (def.corrige) {
    const acc = el("div", "ficha-acc");
    const si = el("button", c.aceptado ? "primario" : "", c.aceptado ? "✓ Aceptada" : "Aceptar");
    const no = el("button", c.aceptado ? "" : "primario", c.aceptado ? "Descartar" : "✕ Descartada");
    si.addEventListener("click", () => {
      c.aceptado = true;
      dibujarVista();
      elegir(c.id);
    });
    no.addEventListener("click", () => {
      c.aceptado = false;
      dibujarVista();
      elegir(c.id);
    });
    acc.append(si, no);
    $ficha.append(acc);
  }
}
function mostrarAviso(a) {
  elegido = null;
  for (const n of $palmo.querySelectorAll(".cambio.elegido")) n.classList.remove("elegido");
  $ficha.replaceChildren();
  $ficha.hidden = false;
  const cab = el("div", "ficha-cab");
  cab.append(el("b", "", a.estado), el("span", "", "  " + a.titulo));
  const cerrar = el("button", "", "✕");
  cerrar.addEventListener("click", () => {
    $ficha.hidden = true;
  });
  const nav = el("span", "ficha-nav");
  nav.append(cerrar);
  cab.append(nav);
  $ficha.append(cab, el("p", "", a.detalle));
  if (a.lados) {
    const lados = el("div", "ficha-lados");
    for (const [quien, que] of a.lados) {
      const d = el("div", "lado");
      d.append(el("span", "quien", quien), el("span", "que", que || "(nada)"));
      lados.append(d);
    }
    $ficha.append(lados);
  }
  if (a.a >= 0) {
    const n = [...$palmo.querySelectorAll(".aviso-marca")].find((x) => x.title.startsWith(a.estado + ": " + a.detalle));
    if (n) n.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}
$("volver").addEventListener("click", () => {
  mostrar("carga");
  $ficha.hidden = true;
});
$("editar").addEventListener("click", () => {
  $texto.value = corregido(actual);
  $estadoEdicion.textContent = "es el corregido: controlalo de nuevo";
  ultimoControlado = null;
  mostrar("carga");
  $ficha.hidden = true;
  $texto.focus();
});
$("descargar").addEventListener("click", () => {
  const blob = new Blob([corregido(actual)], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const sello = (new Date()).toISOString().slice(0, 16).replace(/[:T]/g, "-");
  a.download = `${actual.tipo}-corregido-${sello}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
});
