(function(raiz) {
  "use strict";
  const M = raiz.Motor || {};
  const py = M.py || require("./py.js");
  const formas = M.formas || require("./formas.js");
  const re = py.re;
  const r = String.raw;
  const MONTO = re(r`(?<![A-Za-z])(?<!U)(?<!US)\$\s*(\d{1,3}(?:\.\d{3})+|\d+)` + r`(?:,(\d{1,2}))?`);
  const PALABRAS_DE_NUMERO = new Set([...formas.UNIDADES, ...Object.values(formas.DECENAS), ...Object.values(formas.CENTENAS), "ciento", "y", "mil", "millon", "millones", "un", "veintiun"]);
  const EN_LETRAS = re(r`\bpesos\s+((?:[^\W\d_]+\s*)+)`, "I");
  const PALABRA = re(r`[^\W\d_]+`);
  const CERCA = 120;
  function formasDeMonto(n) {
    const base = formas.enLetras(n);
    const apocopada = re(r`\b(veinti)?uno(?= mil\b| millon)`).sub(r`\1un`, base);
    return new Set([base, apocopada]);
  }
  function frasesEnLetras(texto) {
    const salida = [];
    for (const m of EN_LETRAS.finditer(texto)) {
      const palabras = [];
      let fin = m.start(1);
      for (const p of PALABRA.finditer(m.group(1))) {
        const w = formas.normalizar(p.group(0));
        if (!PALABRAS_DE_NUMERO.has(w)) break;
        palabras.push(w);
        fin = m.start(1) + p.end();
      }
      while (palabras.length && palabras[palabras.length - 1] === "y") palabras.pop();
      if (palabras.length) salida.push([m.start(), fin, palabras.join(" ")]);
    }
    return salida;
  }
  function montos(texto) {
    const cifras2 = MONTO.finditer(texto);
    if (!cifras2.length) return [];
    const suyas = cifras2.map(() => []);
    for (const [inicio, fin, frase] of frasesEnLetras(texto)) {
      let mejor = null;
      cifras2.forEach((m, i) => {
        let d;
        if (inicio >= m.end()) d = inicio - m.end();
        else if (fin <= m.start()) d = m.start() - fin;
        else d = 0;
        if (mejor === null || d < mejor[0]) mejor = [d, i];
      });
      if (mejor[0] <= CERCA) suyas[mejor[1]].push(frase);
    }
    const salida = [];
    cifras2.forEach((m, i) => {
      const esperadas = formasDeMonto(py.int(m.group(1).replaceAll(".", "")));
      const masCorta = [...esperadas].sort((a, b) => a.length - b.length)[0];
      for (const frase of suyas[i]) {
        if (!esperadas.has(frase)) salida.push([py.strip(m.group(0)), frase, masCorta]);
      }
    });
    return salida;
  }
  const CUIT = re(r`(?<![\d-])(\d{2})\s*-?\s*(\d{8})\s*-?\s*(\d)(?![\d-])`);
  const PESOS_CUIT = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  function cifras(s) {
    return Array.from(s, (c) => py.digito(c));
  }
  function suma(digitos, pesos) {
    let s = 0;
    for (let k = 0; k < Math.min(digitos.length, pesos.length); k++) s += digitos[k] * pesos[k];
    return s;
  }
  function verificador(diez) {
    const resto = suma(cifras(diez), PESOS_CUIT) % 11;
    const dv = 11 - resto;
    if (dv === 11) return 0;
    if (dv === 10) return null;
    return dv;
  }
  function cuits(texto) {
    const salida = [], vistos = new Set();
    for (const m of CUIT.finditer(texto)) {
      const diez = m.group(1) + m.group(2), dv = Number(py.int(m.group(3)));
      if (vistos.has(diez + dv)) continue;
      vistos.add(diez + dv);
      if (!["20", "23", "24", "25", "26", "27", "30", "33", "34"].includes(m.group(1))) continue;
      const esperado = verificador(diez);
      if (esperado === null) {
        salida.push([py.strip(m.group(0)), "esa combinación de prefijo y documento no puede tener CUIT: algún dígito está mal"]);
      } else if (esperado !== dv) {
        salida.push([py.strip(m.group(0)), `el dígito verificador no cierra: con esos diez dígitos tendría que terminar en ${esperado}`]);
      }
    }
    return salida;
  }
  const CBU = re(r`(?<![\d-])(\d{8})[\s-]?(\d{14})(?![\d-])`);
  const PESOS_BLOQUE_1 = [7, 1, 3, 9, 7, 1, 3];
  const PESOS_BLOQUE_2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];
  function dvCbu(digitos, pesos) {
    if (typeof digitos === "string") digitos = cifras(digitos);
    return (10 - suma(digitos, pesos) % 10) % 10;
  }
  function cbus(texto) {
    const salida = [], vistos = new Set();
    for (const m of CBU.finditer(texto)) {
      const b1 = m.group(1), b2 = m.group(2);
      if (vistos.has(b1 + "\0" + b2)) continue;
      vistos.add(b1 + "\0" + b2);
      const c1 = cifras(b1), c2 = cifras(b2);
      const malos = [];
      if (dvCbu(c1.slice(0, 7), PESOS_BLOQUE_1) !== c1[7]) {
        malos.push("el del primer bloque -banco y sucursal-");
      }
      if (dvCbu(c2.slice(0, 13), PESOS_BLOQUE_2) !== c2[13]) {
        malos.push("el del segundo bloque -la cuenta-");
      }
      if (malos.length) {
        salida.push([py.strip(m.group(0)), "el dígito verificador no cierra: " + malos.join(" y ")]);
      }
    }
    return salida;
  }
  function valor(m) {
    const centavos = (m.group(2) || "0").padEnd(2, "0");
    return [py.int(m.group(1).replaceAll(".", "")), py.int(centavos)];
  }
  function claveDe(v) {
    return v[0] + "," + v[1];
  }
  function montosContraAuto(cuerpo, autos) {
    if (!py.strip(autos)) return [];
    const enAutos = new Set(MONTO.finditer(autos).map((m) => claveDe(valor(m))));
    const autosNorm = formas.normalizar(autos);
    const salida = [], vistos = new Set();
    for (const m of MONTO.finditer(cuerpo)) {
      const v = valor(m), clave = claveDe(v);
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      if (enAutos.has(clave)) continue;
      if ([...formasDeMonto(v[0])].some((f) => formas.aparece(f, autosNorm))) continue;
      salida.push([py.strip(m.group(0)), "el cuerpo pide esta suma y el auto transcripto no la dice, ni en números ni en letras"]);
    }
    return salida;
  }
  const cuentas = { formasDeMonto, montos, verificador, cuits, cbus, montosContraAuto, dvCbu, PESOS_BLOQUE_1, PESOS_BLOQUE_2 };
  if (typeof module === "object" && module.exports) module.exports = cuentas;
  else M.cuentas = cuentas;
})(typeof globalThis !== "undefined" ? globalThis : this);
