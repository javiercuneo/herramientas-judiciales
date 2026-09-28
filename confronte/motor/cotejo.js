(function(raiz) {
  "use strict";
  const M = raiz.Motor || {};
  const py = M.py || require("./py.js");
  const difflib = M.difflib || require("./difflib.js");
  const formas = M.formas || require("./formas.js");
  const re = py.re;
  const r = String.raw;
  const PALABRA = re(r`\S+`);
  const MEMBRETES = [r`poder\s+judicial\s+de\s+la\s+naci[óo]n`, r`juzgado\s+(?:nacional\s+de\s+primera\s+instancia\s+en\s+lo\s+)?civil` + r`(?:\s+n?(?:ro|°|º)?\.?)?\s*\d{1,3}`, r`uso\s+oficial`, r`p[áa]gina\s+\d+\s+de\s+\d+`, r`-?\s*\d{1,3}\s*-?`, r`#\d{5,}#`, r`fecha\s+de\s+firma:.*`, r`alta\s+en\s+sistema:.*`, r`firmad[oa](?:\(a\))?\s+(?:digitalmente\s+)?por:.*`].map((p) => re(p, "I"));
  const CODIGO_DEL_SISTEMA = re(r`#\d{5,}#\d{5,}#\d{5,}#?`);
  function sinCodigos(texto) {
    return CODIGO_DEL_SISTEMA.subn(" ", texto);
  }
  const ENCABEZADO_DESDE = [re(r`#\d{5,}#\d{5,}#\d{5,}#?`), re(r`poder\s+judicial\s+de\s+la\s+naci[óo]n`, "I")];
  const ENCABEZADO_RENGLONES = 6;
  function sinEncabezados(texto) {
    const lineas = texto.split("\n");
    const quedan = [];
    let sacados = 0;
    for (let i = 0; i < lineas.length; i++) {
      const limpia = py.strip(lineas[i]);
      if (limpia && ENCABEZADO_DESDE.some((p) => p.fullmatch(limpia))) {
        let k = i + 1, llenas = 0;
        while (k < lineas.length && !NUEVO_AUTO.match(lineas[k]) && llenas <= ENCABEZADO_RENGLONES) {
          if (py.strip(lineas[k])) llenas++;
          k++;
        }
        if (k < lineas.length && NUEVO_AUTO.match(lineas[k]) && llenas <= ENCABEZADO_RENGLONES) {
          sacados += 1 + llenas;
          i = k - 1;
          continue;
        }
      }
      quedan.push(lineas[i]);
    }
    return [quedan.join("\n"), sacados];
  }
  const FECHA_SIN_DIA = re(r`buenos\s+aires\s*,\s*de\s+(?:` + formas.MESES.join("|") + r`|setiembre)` + r`\s+de(?:l\s+a[ñn]o)?\s+\d{4}\s*[.,]?\s*-?`, "I");
  const INICIALES = re(r`^\s*[A-ZÁÉÍÓÚÑ]{2,4}(?:/[A-ZÁÉÍÓÚÑ]{2,4})*\.?-?[ \t\r]*(?=\n|$)`);
  function sinIniciales(texto) {
    const fechas = FECHA_SIN_DIA.finditer(texto);
    for (const m of fechas.reverse()) {
      const ini = INICIALES.match(texto.slice(m.end()));
      if (ini) texto = texto.slice(0, m.end()) + " " + texto.slice(m.end() + ini.end());
    }
    return [texto, fechas.length > 0];
  }
  function diaEnBlanco(rCla, j, dice) {
    if (j < 2 || rCla[j - 1] !== "aires" || rCla[j] !== "de" || !formas.MESES.includes(rCla[j + 1])) return false;
    const d = formas.normalizar(dice);
    for (let n = 1; n <= 31; n++) {
      if (d === String(n) || d === formas.normalizar(formas.enLetras(n))) return true;
    }
    return d === "primero";
  }
  function sinMembretes(texto) {
    const quedan = [];
    let sacadas = 0;
    for (const linea of texto.split("\n")) {
      const limpia = py.strip(py.strip(py.strip(linea), "#"));
      if (limpia && MEMBRETES.some((p) => p.fullmatch(limpia))) {
        sacadas++;
        continue;
      }
      quedan.push(linea);
    }
    return [quedan.join("\n"), sacadas];
  }
  const OMISION = re(r`^\(?\s*(?:\.\s*){3}\)?$|^\(?\s*…\s*\)?$`);
  function esOmision(dice) {
    const partes = py.split(dice);
    return partes.length > 0 && partes.every((p) => OMISION.match(p));
  }
  const OMISION_PEGADA = re(r`(?:\.{3,}|…)`);
  function hayOmision(palabras) {
    return palabras.some((p) => esOmision(p) || OMISION_PEGADA.search(p));
  }
  function unir(tokens2) {
    return tokens2.map((x) => x[0]).join(" ");
  }
  function omision(tramo, i1, i2, diceT, diceR, contexto) {
    return { que: "omitido con (…)", testimonio: diceT, resolucion: diceR, contexto: unir(tramo.slice(Math.max(0, i1 - contexto), Math.min(tramo.length, i2 + contexto))), buscar: [diceT] };
  }
  const FECHA_SUELTA = re(r`^(?:buenos\s+aires\s*,?\s*)?(?:a\s+los\s+|el\s+)?` + r`(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|` + r`[\wáéíóúñ]+(?:\s+d[íi]as?)?\s+de\s+[\wáéíóúñ]+` + r`(?:\s+de[l]?\s+(?:a[ñn]o\s+)?[\wáéíóúñ\s]{1,30})?)[.,]?$`, "I");
  const FECHA_ANTES_DEL_TRAMO = re(r`(?:buenos\s+aires\s*,?\s*)` + r`(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|` + r`[\wáéíóúñ]+\s+de\s+(?:` + formas.MESES.join("|") + r`|setiembre)` + r`\s+de(?:l\s+a[ñn]o)?\s+[\wáéíóúñ]+(?:\s+[\wáéíóúñ]+){0,4})` + r`\s*[.,]?`, "I");
  function tieneFecha(texto) {
    const t = formas.normalizar(texto);
    return formas.MESES.some((mes) => t.includes(mes)) || re(r`\d{1,2}\s*[/-]\s*\d{1,2}\s*[/-]\s*\d{2,4}`).search(t) !== null;
  }
  function esFecha(dice) {
    const d = py.strip(dice);
    if (!d || !FECHA_SUELTA.match(d)) return false;
    const bajo = formas.normalizar(d);
    return formas.MESES.some((mes) => bajo.includes(mes)) || re(r`\d{1,2}\s*[/-]\s*\d{1,2}`).search(bajo) !== null;
  }
  const ABREVIATURA_PEGADA = re(r`^([(«"“\[]?[A-Za-zÁÉÍÓÚáéíóúÑñ]{1,6}[.°º])(?=\d)`);
  function tokens(t) {
    const salida = [];
    for (const m of PALABRA.finditer(t)) {
      const w = m.group(0), a = ABREVIATURA_PEGADA.match(w);
      if (a) {
        salida.push([a.group(1), m.start(), m.start() + a.end()]);
        salida.push([w.slice(a.end()), m.start() + a.end(), m.end()]);
      } else {
        salida.push([w, m.start(), m.end()]);
      }
    }
    return salida;
  }
  const SUELTA = re(r`[\s,;:.\-–—]+`);
  const CIERRE = re(r`^(?:(?:y\s+)?(?:hagase\s+saber|notifiquese|registrese|cumplase|comuniquese)` + r`(?:\s+(?:a\s+las\s+partes|por\s+secretaria|electronicamente))*\s*)+$`);
  function clave(tok) {
    return formas.normalizar(tok[0]);
  }
  const QUE = { replace: "dice otra cosa", delete: "sobra en el testimonio", insert: "falta en el testimonio" };
  function comparar(transcripcion, resolucion, contexto = 6) {
    let sacadasT, sacadasR, codigosT, codigosR;
    [transcripcion, sacadasT] = sinMembretes(transcripcion);
    [resolucion, sacadasR] = sinMembretes(resolucion);
    [transcripcion, codigosT] = sinCodigos(transcripcion);
    [resolucion, codigosR] = sinCodigos(resolucion);
    let conDiaEnBlanco;
    [resolucion, conDiaEnBlanco] = sinIniciales(resolucion);
    const membretes = sacadasT + sacadasR;
    const codigos = codigosT + codigosR;
    const tTok = tokens(transcripcion), rTok = tokens(resolucion);
    if (!tTok.length || !rTok.length) {
      return [[], { comparado: 0, de: tTok.length, desde: 0, hasta: 0, afuera: tTok.length, membretes, codigos }];
    }
    const tCla = tTok.map(clave);
    const rCla = rTok.map(clave);
    const bloques = bloquesDelTramo(tCla, rCla);
    if (!bloques.length) {
      return [[{ que: "sin alinear", testimonio: "", resolucion: "", contexto: "", buscar: [] }], { comparado: 0, de: tTok.length, desde: 0, hasta: 0, afuera: tTok.length, membretes, codigos }];
    }
    let desde = bloques[0].a;
    const ultimo = bloques[bloques.length - 1];
    let hasta = ultimo.a + ultimo.size;
    desde = Math.max(0, desde - bloques[0].b);
    desde = mejorComienzo(tCla, rCla, desde, hasta);
    hasta = mejorFinal(tTok, rTok, tCla, rCla, desde, hasta);
    const tramo = tTok.slice(desde, hasta), tramoCla = tCla.slice(desde, hasta);
    const diferencias = [];
    const sm = new difflib.SequenceMatcher(tramoCla, rCla);
    for (const op of sm.getOpcodes()) {
      let [etiqueta, i1, i2, j1, j2] = op;
      if (etiqueta === "equal") continue;
      const poner = (d) => {
        d.pos = [desde + i1, desde + i2];
        diferencias.push(d);
      };
      let diceT = unir(tramo.slice(i1, i2));
      let diceR = unir(rTok.slice(j1, j2));
      if (esOmision(diceT)) {
        if (diceR) poner(omision(tramo, i1, i2, diceT, diceR, contexto));
        continue;
      }
      if (SUELTA.fullmatch(diceT + diceR)) continue;
      if (etiqueta === "insert" && diceR) {
        const vecinas = tramo.slice(Math.max(0, i1 - 1), i1 + 1).map((x) => x[0]);
        if (hayOmision(vecinas)) {
          poner(omision(tramo, i1, i2, "…", diceR, contexto));
          continue;
        }
      }
      if (etiqueta === "replace") {
        if (formas.equivalentes(diceT, diceR)) continue;
        [i1, i2, j1, j2] = recortar(tramo, rTok, i1, i2, j1, j2);
        diceT = unir(tramo.slice(i1, i2));
        diceR = unir(rTok.slice(j1, j2));
        if (!diceT && !diceR) continue;
        if (esOmision(diceT)) {
          if (diceR) poner(omision(tramo, i1, i2, diceT, diceR, contexto));
          continue;
        }
        if (hayOmision(tramo.slice(i1, i2).map((x) => x[0]))) {
          poner(omision(tramo, i1, i2, diceT, diceR, contexto));
          continue;
        }
        if (!diceT) etiqueta = "insert";
        else if (!diceR) etiqueta = "delete";
      }
      if (etiqueta === "insert" && j2 === rCla.length && CIERRE.fullmatch(formas.normalizar(diceR))) {
        poner({ que: "cierre sin transcribir", testimonio: "", resolucion: diceR, contexto: unir(tramo.slice(Math.max(0, i1 - contexto), i1)), buscar: [unir(tramo.slice(Math.max(0, i1 - 3), i1))] });
        continue;
      }
      if (etiqueta === "delete" && conDiaEnBlanco && diaEnBlanco(rCla, j1, diceT)) {
        poner({ que: "fecha sin cotejar", testimonio: diceT, resolucion: "", contexto: unir(tramo.slice(Math.max(0, i1 - contexto), Math.min(tramo.length, i2 + contexto))), buscar: [diceT] });
        continue;
      }
      if (etiqueta === "delete" && esFecha(diceT)) {
        poner({ que: "fecha sin cotejar", testimonio: diceT, resolucion: "", contexto: unir(tramo.slice(Math.max(0, i1 - contexto), Math.min(tramo.length, i2 + contexto))), buscar: [diceT] });
        continue;
      }
      const desdeC = Math.max(0, i1 - contexto);
      const hastaC = Math.min(tramo.length, i2 + contexto);
      poner({ que: QUE[etiqueta], testimonio: diceT, resolucion: diceR, contexto: unir(tramo.slice(desdeC, hastaC)), buscar: diceT ? [diceT] : [unir(tramo.slice(Math.max(0, i1 - 3), i1 + 3))] });
    }
    if (!tieneFecha(resolucion)) {
      const antes = unir(tTok.slice(Math.max(0, desde - 12), desde));
      const m = FECHA_ANTES_DEL_TRAMO.search(antes);
      if (m) {
        diferencias.unshift({ que: "fecha sin cotejar", testimonio: py.strip(m.group(0)), resolucion: "", contexto: antes, buscar: [py.strip(m.group(0))] });
      }
    }
    const afuera = tTok.length - (hasta - desde);
    return [diferencias, { comparado: hasta - desde, de: tTok.length, desde, hasta, afuera, membretes, codigos, rangos: [[desde, hasta]] }];
  }
  function costo(a, b) {
    let s = 0;
    for (const [t, i1, i2, j1, j2] of new difflib.SequenceMatcher(a, b).getOpcodes()) {
      if (t !== "equal") s += Math.max(i2 - i1, j2 - j1);
    }
    return s;
  }
  function mejorComienzo(tCla, rCla, desde, hasta) {
    if (rCla.length < 2) return desde;
    const otros = [];
    for (let k = desde + 1; k < hasta - 1; k++) {
      if (tCla[k] === rCla[0] && tCla[k + 1] === rCla[1]) otros.push(k);
    }
    if (!otros.length) return desde;
    let mejor = null;
    for (const k of [desde, ...otros]) {
      const c = costo(tCla.slice(k, hasta), rCla);
      if (mejor === null || c < mejor[0] || c === mejor[0] && k < mejor[1]) mejor = [c, k];
    }
    return mejor[1];
  }
  function mejorFinal(tTok, rTok, tCla, rCla, desde, hasta) {
    const ops = new difflib.SequenceMatcher(tCla.slice(desde, hasta), rCla).getOpcodes();
    const ult = ops[ops.length - 1];
    if (!ult || ult[0] !== "insert") return hasta;
    let j = ult[3], guarda = 0;
    while (j < rCla.length && hasta < tCla.length && guarda++ < 200) {
      if (tCla[hasta] === rCla[j]) {
        hasta++;
        j++;
        continue;
      }
      const [i, jj] = pelar(tTok.slice(hasta, hasta + TOPE), rTok.slice(j, j + TOPE), true);
      if (!i) break;
      hasta += i;
      j += jj;
    }
    const resto = rCla.length - j;
    if (resto > 0 && resto <= 3 && hasta > 0 && !CIERRA.search(tTok[hasta - 1][0]) && rCla.slice(j).every((w) => /\d/.test(w))) {
      for (let k = 0; k < resto && hasta < tCla.length; k++) {
        hasta++;
        if (CIERRA.search(tTok[hasta - 1][0])) break;
      }
    }
    return hasta;
  }
  const CIERRA = re(r`[”"»]\W*$`);
  const NUEVO_AUTO = re(r`^[\s\"“«']*Buenos\s+Aires\s*,`, "IM");
  const SEPARADOR = re(r`^\s*-{3,}\s*$`, "M");
  function partirAutos(resolucion) {
    const trozos = [];
    for (const parte of SEPARADOR.split(resolucion)) {
      let cortes = NUEVO_AUTO.finditer(parte).map((m) => m.start());
      if (cortes.length && cortes[0] > 0 && !py.strip(parte.slice(0, cortes[0]))) cortes[0] = 0;
      if (!cortes.length || cortes[0] !== 0) cortes = [0, ...cortes];
      cortes.forEach((c, i) => {
        const fin = i + 1 < cortes.length ? cortes[i + 1] : parte.length;
        if (py.strip(parte.slice(c, fin))) trozos.push(parte.slice(c, fin));
      });
    }
    return trozos;
  }
  const TOMADA = "zzqtomadazzq";
  function compararVarios(transcripcion, resolucion, contexto = 6) {
    let encabezados;
    [resolucion, encabezados] = sinEncabezados(resolucion);
    const autos = partirAutos(resolucion);
    if (autos.length <= 1) {
      const [difs, al] = comparar(transcripcion, resolucion, contexto);
      al.membretes += encabezados;
      return [difs, al];
    }
    const [sinM, sacadas] = sinMembretes(transcripcion);
    const [limpio, codigosT] = sinCodigos(sinM);
    const palabras = tokens(limpio).map((t) => t[0]);
    const largos = autos.map((a) => tokens(a).length);
    const orden = autos.map((_, i) => i).sort((x, y) => largos[y] - largos[x] || x - y);
    const tomadas = new Set(), porAuto = {}, rangos = [];
    let membretes = sacadas + encabezados, codigos = codigosT;
    for (const i of orden) {
      const texto = palabras.map((w, k) => tomadas.has(k) ? TOMADA : w).join(" ");
      const [difs, al] = comparar(texto, autos[i], contexto);
      porAuto[i] = difs;
      membretes += al.membretes || 0;
      codigos += al.codigos || 0;
      for (let k = al.desde; k < al.hasta; k++) tomadas.add(k);
      if (al.hasta > al.desde) rangos.push([al.desde, al.hasta]);
    }
    const diferencias = [];
    for (let i = 0; i < autos.length; i++) {
      for (const d of porAuto[i]) {
        d.auto = i + 1;
        diferencias.push(d);
      }
    }
    const de = palabras.length;
    const lista = [...tomadas];
    return [diferencias, { comparado: tomadas.size, de, desde: lista.length ? Math.min(...lista) : 0, hasta: lista.length ? Math.max(...lista) + 1 : 0, afuera: de - tomadas.size, membretes, codigos, autos: autos.length, rangos }];
  }
  const TOPE = 14;
  function pelar(a, b, desdeLaIzquierda) {
    for (let i = 1; i <= Math.min(a.length, TOPE); i++) {
      for (let j = 1; j <= Math.min(b.length, TOPE); j++) {
        const pa = desdeLaIzquierda ? a.slice(0, i) : a.slice(a.length - i);
        const pb = desdeLaIzquierda ? b.slice(0, j) : b.slice(b.length - j);
        if (formas.equivalentes(unir(pa), unir(pb))) return [i, j];
      }
    }
    return [0, 0];
  }
  function recortar(tTok, rTok, i1, i2, j1, j2) {
    let guarda = 0;
    while (i1 < i2 && j1 < j2 && guarda < 8) {
      guarda++;
      let [i, j] = pelar(tTok.slice(i1, i2), rTok.slice(j1, j2), true);
      if (i) {
        i1 += i;
        j1 += j;
        continue;
      }
      [i, j] = pelar(tTok.slice(i1, i2), rTok.slice(j1, j2), false);
      if (i) {
        i2 -= i;
        j2 -= j;
        continue;
      }
      break;
    }
    return [i1, i2, j1, j2];
  }
  const LEJOS = 25;
  function casar(tCla, rCla) {
    return new difflib.SequenceMatcher(tCla, rCla).getMatchingBlocks().filter((b) => b.size);
  }
  function bloquesDelTramo(tCla, rCla) {
    const bloques = casar(tCla, rCla);
    if (!bloques.length) return [];
    const grupos = [[bloques[0]]];
    for (const b of bloques.slice(1)) {
      const g2 = grupos[grupos.length - 1], ant = g2[g2.length - 1];
      if (b.a - (ant.a + ant.size) <= LEJOS) g2.push(b);
      else grupos.push([b]);
    }
    const tamanio = (g2) => g2.reduce((s, x) => s + x.size, 0);
    let g = grupos[0];
    for (const otro of grupos.slice(1)) if (tamanio(otro) > tamanio(g)) g = otro;
    if (grupos.length === 1) return g;
    const primero = g[0], ultimo = g[g.length - 1];
    const desde = Math.max(0, primero.a - primero.b);
    const hasta = Math.min(tCla.length, ultimo.a + ultimo.size + (rCla.length - (ultimo.b + ultimo.size)));
    return casar(tCla.slice(desde, hasta), rCla).map((b) => ({ a: b.a + desde, b: b.b, size: b.size }));
  }
  function sigueDespuesDelCorte(cortado, resto, resolucion) {
    const cola = tokens(resto);
    if (!cola.length) return 0;
    const colaCla = cola.map(clave);
    const tCla = tokens(sinCodigos(sinMembretes(cortado)[0])[0]).map(clave);
    while (tCla.length && !tCla[tCla.length - 1]) tCla.pop();
    if (!tCla.length) return 0;
    let mejor = 0;
    for (const auto of partirAutos(sinEncabezados(resolucion)[0])) {
      const limpio = sinIniciales(sinCodigos(sinMembretes(auto)[0])[0])[0];
      const rCla = tokens(limpio).map(clave);
      const bloques = bloquesDelTramo(tCla, rCla);
      if (!bloques.length) continue;
      const ult = bloques[bloques.length - 1];
      if (ult.a + ult.size !== tCla.length) continue;
      const falta = rCla.slice(ult.b + ult.size);
      let k = 0;
      while (k < falta.length && k < colaCla.length && colaCla[k] === falta[k]) k++;
      if (k > mejor) mejor = k;
    }
    return mejor ? cola[mejor - 1][2] : 0;
  }
  const cotejo = { tokens, sinCodigos, sinMembretes, sinEncabezados, sinIniciales, comparar, compararVarios, partirAutos, esFecha, sigueDespuesDelCorte };
  if (typeof module === "object" && module.exports) module.exports = cotejo;
  else M.cotejo = cotejo;
})(typeof globalThis !== "undefined" ? globalThis : this);
