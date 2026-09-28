(function(raiz) {
  "use strict";
  const M = raiz.Motor || {};
  const py = M.py || require("./py.js");
  const formas = M.formas || require("./formas.js");
  const zonas = M.zonas || require("./zonas.js");
  const checklist = M.checklist || require("./checklist.js");
  const cotejo = M.cotejo || require("./cotejo.js");
  const cuentas = M.cuentas || require("./cuentas.js");
  const transferencia = M.transferencia || require("./transferencia.js");
  const TIPOS = { testimonio: "el testimonio", oficio: "el oficio", mandamiento: "el mandamiento", transferencia: "el formulario" };
  const SIN_ZONAS = ["oficio", "mandamiento"];
  function tieneDigito(f) {
    return Array.from(f).some((c) => py.isdigit(c));
  }
  function cotejar(texto, resolucion = "", tipo = "testimonio") {
    if (!Object.hasOwn(TIPOS, tipo)) {
      throw new py.ValueError(`no sé controlar un documento de tipo «${tipo}»`);
    }
    if (SIN_ZONAS.includes(tipo)) return cotejarSinZonas(texto, resolucion, tipo);
    if (tipo === "transferencia") return transferencia.cotejar(texto, resolucion);
    let sinCorte = "", transcripcion, propia;
    try {
      [transcripcion, propia] = zonas.partir(texto);
    } catch (e) {
      if (!(e instanceof py.ValueError)) throw e;
      [sinCorte, transcripcion, propia] = [e.message, texto, ""];
    }
    const tNorm = formas.normalizar(transcripcion);
    const anclas = [];
    for (const [cual, valor, cortado] of zonas.anclas(propia)) {
      if (cortado) {
        anclas.push(["SIN COTEJAR", cual, valor, "el dato quedó partido por la anonimización"]);
        continue;
      }
      let candidatas;
      try {
        candidatas = formas.formasCompuestas(valor);
      } catch (e) {
        if (!(e instanceof py.ValueError)) throw e;
        anclas.push(["SIN COTEJAR", cual, valor, e.message]);
        continue;
      }
      const enLetras = py.sorted([...candidatas].filter((f) => !tieneDigito(f) && formas.aparece(f, tNorm)));
      const enDigitos = [...candidatas].filter((f) => tieneDigito(f) && formas.aparece(f, tNorm));
      if (enLetras.length) {
        anclas.push(["EN LETRAS", cual, valor, enLetras[0]]);
      } else if (enDigitos.length) {
        anclas.push(["EN DIGITOS", cual, valor, "las dos zonas coinciden, pero la transcripción quedó en dígitos: mirar si el auto los tenía así"]);
      } else {
        anclas.push(["NO APARECE", cual, valor, `${candidatas.size} formas buscadas`]);
      }
    }
    let diferencias = [], alineado = null;
    if (py.strip(resolucion)) [diferencias, alineado] = cotejo.compararVarios(transcripcion, resolucion);
    return { tipo: "testimonio", sin_corte: sinCorte, diferencias, alineado, anclas, digitos: zonas.digitosDondeVaLetra(transcripcion), marcas: zonas.marcasDeTrabajo(texto), rubros: checklist.controlar(texto), montos: [], montos_auto: [], cuits: [], cbus: [], largos: [transcripcion.length, propia.length] };
  }
  function cotejarSinZonas(texto, resolucion, tipo) {
    const corteFin = zonas.FIN_DOCUMENTO.search(texto);
    if (corteFin) texto = texto.slice(0, corteFin.start());
    let diferencias = [], alineado = null;
    if (py.strip(resolucion)) {
      const cortado = zonas.hastaLaUltimaComilla(texto);
      const sigue = cotejo.sigueDespuesDelCorte(cortado, texto.slice(cortado.length), resolucion);
      [diferencias, alineado] = cotejo.compararVarios(texto.slice(0, cortado.length + sigue), resolucion);
      for (const d of diferencias) d.que = d.que.replaceAll("testimonio", tipo);
    }
    const [cuerpo, autos] = zonas.cuerpoYAutos(texto);
    return { tipo, sin_corte: "", diferencias, alineado, anclas: [], digitos: [], marcas: zonas.marcasDeTrabajo(texto), rubros: checklist.controlar(texto, tipo), montos: cuentas.montos(texto), montos_auto: cuentas.montosContraAuto(cuerpo, autos), cuits: cuentas.cuits(texto), cbus: cuentas.cbus(texto), largos: [texto.length, 0] };
  }
  function esPlegado(d) {
    return d.que.startsWith("omitido") || d.que.startsWith("cierre");
  }
  function paraMirar(r) {
    return r.diferencias.filter((d) => !esPlegado(d)).length + r.anclas.filter((a) => a[0] !== "EN LETRAS").length + r.digitos.length + r.marcas.length + r.montos.length + r.montos_auto.length + r.cuits.length + r.cbus.length + r.rubros.filter((x) => !x[2]).length + (r.campos || []).filter((c) => c[0] !== "COINCIDE").length + (r.sin_corte ? 1 : 0);
  }
  function hallazgos(r) {
    const h = [];
    const pieza = TIPOS[r.tipo];
    for (const d of r.diferencias) {
      const omitido = d.que.startsWith("omitido");
      const fecha = d.que.startsWith("fecha");
      const cierre = d.que.startsWith("cierre");
      const deCual = "auto" in d ? `auto ${d.auto}: ` : "";
      let estado, lados, detalle;
      if (cierre) {
        estado = "CIERRE";
        lados = [["no se transcribió", d.resolucion]];
        detalle = "el auto termina con esta fórmula y el documento no la transcribió. No cambia lo que el auto ordena.";
      } else if (fecha) {
        estado = "FECHA";
        lados = [["el documento dice", d.testimonio]];
        detalle = "el auto que pegaste no trae esta fecha en el cuerpo: los que se firman electrónicamente la llevan al pie. No es que sobre, es que no hay contra qué cotejarla: miralo en el expediente.";
      } else {
        estado = omitido ? "OMITIDO" : "DIFERENCIA";
        lados = omitido ? [["se omitió", d.resolucion]] : [[`${pieza} dice`, d.testimonio], ["la resolución dice", d.resolucion]];
        detalle = d.contexto;
      }
      h.push({ clase: "diferencia", estado, titulo: deCual + d.que, detalle, lados, buscar: d.buscar });
    }
    if (r.sin_corte) {
      h.push({ clase: "zona", estado: "SIN ZONAS", titulo: "no pude partir el testimonio en sus dos zonas", detalle: r.sin_corte + ". Sin ese corte no se puede cotejar el testimonio contra sí mismo ni aplicar la regla de las letras. Lo demás se controló igual.", buscar: [] });
    }
    for (const [estado, tipo, valor, nota] of r.anclas) {
      h.push({ clase: "ancla", estado, titulo: `${tipo}: ${valor}`, detalle: nota, buscar: [valor].concat(estado === "EN LETRAS" ? [nota] : []) });
    }
    for (const [estado, campo, valor, nota] of r.campos || []) {
      h.push({ clase: "campo", estado, titulo: valor ? `${campo}: ${valor}` : campo, detalle: nota, buscar: valor ? [valor] : [] });
    }
    for (const [que, texto] of r.digitos) {
      h.push({ clase: "digito", estado: "EN DIGITOS", titulo: texto, detalle: `${que} en dígitos dentro de la transcripción, donde la regla es escribirlo en letras`, buscar: [texto] });
    }
    for (const [monto, dice, esperaba] of r.montos) {
      h.push({ clase: "cuenta", estado: "MONTO", titulo: monto, detalle: "en números y en letras no dice lo mismo. Uno de los dos está mal: ir al auto.", lados: [["en letras dice", "pesos " + dice], ["el número se dice", "pesos " + esperaba]], buscar: [monto] });
    }
    for (const [monto, que] of r.montos_auto) {
      h.push({ clase: "cuenta", estado: "MONTO", titulo: monto, detalle: que, buscar: [monto] });
    }
    for (const [estado, lista] of [["CUIT", r.cuits], ["CBU", r.cbus]]) {
      for (const [dato, que] of lista) {
        h.push({ clase: "cuenta", estado, titulo: dato, detalle: que, buscar: [dato] });
      }
    }
    for (const m of r.marcas) {
      h.push({ clase: "marca", estado: "MARCA", titulo: m, detalle: "quedó de la confección y no tendría que salir firmado", buscar: [m] });
    }
    for (const [clave, exigencia, ok] of r.rubros) {
      if (!ok) {
        h.push({ clase: "rubro", estado: "NO LO ENCONTRE", titulo: `${clave}) ${exigencia}`, detalle: "no vi ninguna de las formas que conozco. Puede estar escrito de otra manera y no faltar.", buscar: [] });
      }
    }
    return h;
  }
  function controlar(texto, resolucion = "", tipo = "testimonio") {
    if (!py.strip(texto)) return { error: "Pegá el documento en el panel de la izquierda." };
    let r;
    try {
      r = cotejar(texto, resolucion, tipo);
    } catch (e) {
      if (e instanceof py.ValueError) return { error: e.message };
      throw e;
    }
    return { tipo: r.tipo, hallazgos: hallazgos(r), paraMirar: paraMirar(r), rubros: r.rubros.length, rubrosOk: r.rubros.filter((x) => x[2]).length, corte: texto.length - r.largos[1], alineado: r.alineado };
  }
  const COMILLAS_ABREN = `“«"'‘`, COMILLAS_CIERRAN = `”»"'’`;
  const CIERRE_DE_TRANSCRIPCION = /[.;:”»"]+$/;
  function ubicarPalabras(texto) {
    const limpio = cotejo.sinCodigos(cotejo.sinMembretes(texto)[0])[0];
    const orig = cotejo.tokens(texto), lim = cotejo.tokens(limpio);
    const salida = [];
    let p = 0;
    for (const [w] of lim) {
      let q = p;
      while (q < orig.length && q - p < 60 && orig[q][0] !== w) q++;
      if (q < orig.length && orig[q][0] === w) p = q;
      salida.push(orig[Math.min(p, orig.length - 1)]);
      if (orig[p] && orig[p][0] === w) p++;
    }
    return salida;
  }
  function buscarEn(texto, aguja) {
    if (!aguja || !py.strip(aguja)) return null;
    const escapar = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const suelto = py.split(aguja).map(escapar).join("\\s*");
    const m = new RegExp(suelto).exec(texto);
    return m ? [m.index, m.index + m[0].length] : null;
  }
  function conComillas(original, propuesta) {
    let p = propuesta;
    const o = py.strip(original);
    if (o && COMILLAS_CIERRAN.includes(o[o.length - 1]) && !COMILLAS_CIERRAN.includes(p[p.length - 1])) p += o[o.length - 1];
    if (o && COMILLAS_ABREN.includes(o[0]) && !COMILLAS_ABREN.includes(p[0])) p = o[0] + p;
    return p;
  }
  function vista(texto, resolucion = "", tipo = "testimonio") {
    const pantalla = controlar(texto, resolucion, tipo);
    if (pantalla.error) return pantalla;
    const r = cotejar(texto, resolucion, tipo);
    const al = r.alineado;
    const palabras = al ? ubicarPalabras(texto) : [];
    const inicio = (k) => palabras[k][1];
    const fin = (k) => palabras[k][2];
    const comparado = al ? (al.rangos || []).filter(([a, b]) => b > a && a < palabras.length).map(([a, b]) => [inicio(a), fin(Math.min(b, palabras.length) - 1)]) : [];
    const cambios = [];
    let id = 0;
    for (const d of r.diferencias) {
      const clase = d.que.startsWith("omitido") ? "omitido" : d.que.startsWith("cierre") ? "cierre" : d.que.startsWith("fecha") ? "fecha" : d.que.startsWith("falta") ? "falta" : d.que.startsWith("sobra") ? "sobra" : d.que === "sin alinear" ? "sin-alinear" : "cambio";
      if (clase === "sin-alinear") continue;
      let a = -1, b = -1;
      if (d.pos && palabras.length) {
        const [k1, k2] = d.pos;
        if (k2 > k1 && k1 < palabras.length) {
          a = inicio(k1);
          b = fin(Math.min(k2, palabras.length) - 1);
        } else if (k1 > 0) {
          a = b = fin(Math.min(k1, palabras.length) - 1);
        } else if (palabras.length) {
          a = b = inicio(0);
        }
      } else {
        const lugar = buscarEn(texto, (d.buscar || [])[0]);
        if (lugar) [a, b] = clase === "falta" ? [lugar[1], lugar[1]] : lugar;
      }
      const delAuto = SIN_ZONAS.includes(tipo) ? d.resolucion : formas.enPalabras(d.resolucion);
      let propuesta = null;
      if (clase === "cambio") propuesta = conComillas(texto.slice(a, b), delAuto);
      else if (clase === "falta") {
        propuesta = delAuto;
        const cierra = CIERRE_DE_TRANSCRIPCION.exec(texto.slice(Math.max(0, a - 6), a));
        const punto = /[.;:]+$/.exec(propuesta);
        if (cierra && punto && cierra[0].startsWith(punto[0])) {
          a = b = a - cierra[0].length;
          propuesta = propuesta.slice(0, -punto[0].length);
        }
      } else if (clase === "sobra") propuesta = "";
      cambios.push({ id: id++, clase, a, b, que: d.que, auto: d.auto || null, dice: d.testimonio, resolucion: d.resolucion, propuesta, enLetras: propuesta !== null && propuesta !== d.resolucion && clase !== "sobra", contexto: d.contexto });
    }
    const avisos = [];
    for (const h of pantalla.hallazgos) {
      if (h.clase === "diferencia" || h.estado === "EN LETRAS") continue;
      const lugar = h.estado === "COINCIDE" ? null : buscarEn(texto, (h.buscar || [])[0]);
      avisos.push({ estado: h.estado, titulo: h.titulo, detalle: h.detalle, lados: h.lados || null, a: lugar ? lugar[0] : -1, b: lugar ? lugar[1] : -1 });
    }
    const bien = pantalla.hallazgos.filter((h) => h.estado === "EN LETRAS").map((h) => ({ titulo: h.titulo, detalle: h.detalle }));
    let tope = -1, anterior = null;
    for (const c of cambios.filter((x) => x.a >= 0).sort((x, y) => x.a - y.a || x.b - y.b)) {
      const pegadoAPunto = anterior && c.a === tope && anterior.a === anterior.b && c.a !== c.b;
      if (c.a < tope || pegadoAPunto) {
        c.sinLugar = true;
        continue;
      }
      tope = Math.max(tope, c.b);
      anterior = c;
    }
    return { tipo, texto, comparado, cambios, avisos, bien, paraMirar: pantalla.paraMirar, rubros: pantalla.rubros, rubrosOk: pantalla.rubrosOk, alineado: pantalla.alineado, conAutos: Boolean(py.strip(resolucion)) };
  }
  function corregir(v) {
    let t = v.texto;
    const lista = v.cambios.filter((c) => c.aceptado && c.propuesta !== null && c.a >= 0 && !c.sinLugar).sort((x, y) => y.a - x.a || y.b - x.b);
    for (const c of lista) {
      if (c.clase === "falta") {
        t = t.slice(0, c.a) + " " + c.propuesta + t.slice(c.a);
      } else if (c.clase === "sobra") {
        let a = c.a, b = c.b;
        if (t[b] === " ") b++;
        else if (a > 0 && t[a - 1] === " ") a--;
        t = t.slice(0, a) + t.slice(b);
      } else {
        t = t.slice(0, c.a) + c.propuesta + t.slice(c.b);
      }
    }
    return t;
  }
  const confrontar = { TIPOS, cotejar, paraMirar, hallazgos, controlar, vista, corregir };
  if (typeof module === "object" && module.exports) module.exports = confrontar;
  else M.confrontar = confrontar;
})(typeof globalThis !== "undefined" ? globalThis : this);
