(function(raiz) {
  "use strict";
  const py = raiz.Motor ? raiz.Motor.py : require("./py.js");
  const re = py.re;
  const ANCLAS_ZONA_PROPIA = [re(String.raw`testimoniado\s+es\b`, "I"), re(String.raw`(?:el\s+)?presente\s+testimonio\s+se\s+` + String.raw`(?:libra|expide|extiende)\b`, "I")];
  const FIN_DOCUMENTO = re(String.raw`^#+\s*Constancia de procesamiento\s*$`, "M");
  function partir(texto) {
    const corteFin = FIN_DOCUMENTO.search(texto);
    if (corteFin) texto = texto.slice(0, corteFin.start());
    const repetidas = [];
    for (const ancla of ANCLAS_ZONA_PROPIA) {
      const marcas = ancla.finditer(texto);
      if (marcas.length === 1) {
        const i = marcas[0].start();
        return [texto.slice(0, i), texto.slice(i)];
      }
      if (marcas.length) repetidas.push(`«${marcas[0].group(0)}» aparece ${marcas.length} veces`);
    }
    if (repetidas.length) {
      throw new py.ValueError("el corte entre zonas es ambiguo y hay que mirarlo a mano: " + repetidas.join("; "));
    }
    throw new py.ValueError("no encontré con qué frase termina la transcripción y empieza lo que el juzgado dice por sí. Conozco «testimoniado es…» y «el presente testimonio se libra…»");
  }
  const ANCLAS = [["matrícula", re(String.raw`matr[ií]cula\s*(?:f\.?\s?r\.?|folio\s+real)?\s*` + String.raw`(?:nro\.?|n[°ºo]\.?|n[uú]mero)?\s*:?\s*` + String.raw`(\d+(?:\s*[-/]\s*\d+)+)`, "I")], ["unidad funcional", re(String.raw`(?:unidad\s+funcional|\bU\.?\s?F\.?)\s*` + String.raw`(?:nro\.?|n[°ºo]\.?|n[uú]mero)?\s*:?\s*` + String.raw`(\d+)`, "I")], ["altura de calle", re(String.raw`(?<![\d-])(\d{2,5}(?:\s*/\s*\d{1,5})+)(?![\d/])`)]];
  const EXPEDIENTE = re(String.raw`^\d{1,6}\s*/\s*(?:19|20)\d{2}$`);
  const ANTES_DE_EXPEDIENTE = re(String.raw`(?:expte\.?|expediente|causa|autos)\s*(?:n?ro\.?|n[°ºo]\.?|` + String.raw`n[uú]mero)?\s*$`, "I");
  const PEGADO_A_ANONIMO = re(String.raw`\][\s/.,-]*$`);
  function anclas(zonaPropia) {
    const vistas = new Set(), salida = [];
    for (const [tipo, patron] of ANCLAS) {
      for (const m of patron.finditer(zonaPropia)) {
        const valor = re(String.raw`\s+`).sub("", m.group(1));
        const clave = tipo + "\0" + valor;
        if (vistas.has(clave)) continue;
        if (tipo === "altura de calle") {
          if (salida.some(([t, v]) => t === "matrícula" && v.includes(valor))) continue;
          const antes = zonaPropia.slice(Math.max(0, m.start(1) - 24), m.start(1));
          if (EXPEDIENTE.match(valor) || ANTES_DE_EXPEDIENTE.search(py.rstrip(antes, "( "))) {
            continue;
          }
        }
        const cortado = Boolean(PEGADO_A_ANONIMO.search(zonaPropia.slice(0, m.start(1))));
        vistas.add(clave);
        salida.push([tipo, valor, cortado]);
      }
    }
    return salida;
  }
  const MARCAS = re(String.raw`\([^)\n]{0,80}\b(confirmar|verificar|chequear|completar|corroborar|` + String.raw`revisar|pendiente|controlar)\b[^)\n]{0,80}\)`, "I");
  const RELLENOS = re(String.raw`(x{3,}|\?{2,}|\.{4,}|_{3,}|\*{3,}|\bTBD\b)`, "I");
  function marcasDeTrabajo(texto) {
    const salida = [];
    for (const patron of [MARCAS, RELLENOS]) {
      for (const m of patron.finditer(texto)) {
        const frase = py.strip(re(String.raw`\s+`).sub(" ", m.group(0)));
        if (frase && !salida.includes(frase)) salida.push(frase);
      }
    }
    return salida;
  }
  const ENCABEZADOS = re(String.raw`^\s{0,3}#{1,6}\s.*$`, "M");
  const FECHA_EN_DIGITOS = re(String.raw`(?<![\d/-])(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})(?![\d/-])`);
  const NORMA_EN_DIGITOS = re(String.raw`\b(arts?\.|art[íi]culos?|leyes?|ley)\s*(?:n[°ºo]\.?)?\s*(\d[\d.]*)`, "I");
  function digitosDondeVaLetra(transcripcion) {
    const t = ENCABEZADOS.sub(" ", transcripcion);
    const salida = [];
    for (const m of FECHA_EN_DIGITOS.finditer(t)) salida.push(["fecha", m.group(1)]);
    for (const m of NORMA_EN_DIGITOS.finditer(t)) {
      salida.push(["artículo o ley", re(String.raw`\s+`).sub(" ", m.group(0))]);
    }
    const vistos = new Set(), unicos = [];
    for (const x of salida) {
      const clave = x.join("\0");
      if (!vistos.has(clave)) {
        vistos.add(clave);
        unicos.push(x);
      }
    }
    return unicos;
  }
  const ANCLA_AUTOS = re(String.raw`\b(?:(?:el|la|los|las)\s+)?(?:autos?|resoluci[óo]n(?:es)?|provei?d[oa]s?|proveídos?|providencias?)` + String.raw`\s+que\s+(?:lo\s+|la\s+|los\s+)?ordenan?\b[^:\n]{0,80}?\bdicen?\b`, "I");
  function cuerpoYAutos(texto) {
    const m = ANCLA_AUTOS.search(texto);
    if (!m) return [texto, ""];
    return [texto.slice(0, m.start()), texto.slice(m.start())];
  }
  const COMILLA_DE_CIERRE = re(String.raw`[”"»](?!\w)`);
  function hastaLaUltimaComilla(texto) {
    const autos = cuerpoYAutos(texto)[1];
    if (!autos) return texto;
    const cierres = COMILLA_DE_CIERRE.finditer(autos);
    if (!cierres.length) return texto;
    return texto.slice(0, texto.length - autos.length + cierres[cierres.length - 1].end());
  }
  const zonas = { FIN_DOCUMENTO, partir, anclas, marcasDeTrabajo, digitosDondeVaLetra, cuerpoYAutos, hastaLaUltimaComilla };
  if (typeof module === "object" && module.exports) module.exports = zonas;
  else (raiz.Motor = raiz.Motor || {}).zonas = zonas;
})(typeof globalThis !== "undefined" ? globalThis : this);
