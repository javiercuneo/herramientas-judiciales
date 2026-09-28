(function(raiz) {
  "use strict";
  const py = raiz.Motor ? raiz.Motor.py : require("./py.js");
  const re = py.re;
  const r = String.raw;
  const UNO_ANTES_DE_MIL = re(r`\buno\b(?= mil| millon)`);
  const SEPARADOR = re("([-/])");
  const ESPACIOS = re(r`\s+`);
  const PUNTUACION = re(r`[^\w\s/-]`);
  const GUION_O_BARRA = re(r`\s*([/-])\s*`);
  const DIGITOS = re(r`\d+`);
  const COMPUESTO = re(r`\d+(?:[-/]\d+)+`);
  const CORTADA = re(r`(\w) - (\w)`);
  const BORDES = re(r`^[^\w]+|[^\w]+$`);
  const UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciseis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidos", "veintitres", "veinticuatro", "veinticinco", "veintiseis", "veintisiete", "veintiocho", "veintinueve"];
  const DECENAS = { 30: "treinta", 40: "cuarenta", 50: "cincuenta", 60: "sesenta", 70: "setenta", 80: "ochenta", 90: "noventa" };
  const CENTENAS = { 100: "cien", 200: "doscientos", 300: "trescientos", 400: "cuatrocientos", 500: "quinientos", 600: "seiscientos", 700: "setecientos", 800: "ochocientos", 900: "novecientos" };
  function menorACien(n) {
    if (n < 30) return UNIDADES[n];
    const d = Math.floor(n / 10) * 10, u = n % 10;
    return u === 0 ? DECENAS[d] : DECENAS[d] + " y " + UNIDADES[u];
  }
  function menorAMil(n) {
    if (n < 100) return menorACien(n);
    const c = Math.floor(n / 100) * 100, r2 = n % 100;
    if (c === 100) return r2 === 0 ? "cien" : "ciento " + menorACien(r2);
    return r2 === 0 ? CENTENAS[c] : CENTENAS[c] + " " + menorACien(r2);
  }
  function enLetras(n) {
    n = BigInt(n);
    if (n < 1000n) return menorAMil(Number(n));
    if (n < 1000000n) {
      const miles = n / 1000n, resto2 = n % 1000n;
      const cab2 = miles === 1n ? "mil" : menorAMil(Number(miles)) + " mil";
      return resto2 === 0n ? cab2 : cab2 + " " + menorAMil(Number(resto2));
    }
    const millones = n / 1000000n, resto = n % 1000000n;
    const cab = millones === 1n ? "un millon" : enLetras(millones) + " millones";
    return resto === 0n ? cab : cab + " " + enLetras(resto);
  }
  function cifraPorCifra(digitos) {
    return Array.from(String(digitos), (c) => UNIDADES[py.digito(c)]).join(" ");
  }
  function formasDeNumero(digitos) {
    const d = String(digitos);
    const salida = new Set([d, cifraPorCifra(d)]);
    if (py.strip(d, "0") || d === "0") salida.add(enLetras(py.int(d)));
    for (const f of [...salida]) {
      if (f.endsWith("uno") && !f.includes(" mil")) continue;
      salida.add(UNO_ANTES_DE_MIL.sub("un", f));
    }
    return new Set([...salida].filter((f) => f));
  }
  const SEPARADORES = { "-": ["-", "guion", "guión", "- guion -", "- guión -"], "/": ["/", "barra", "/ barra /"] };
  function productos(listas) {
    let salida = [""];
    for (const l of listas) {
      const nueva = [];
      for (const a of salida) for (const b of l) nueva.push(a + b);
      salida = nueva;
    }
    return salida;
  }
  function formasCompuestas(dato, limite = 4e3) {
    const partes = SEPARADOR.split(py.strip(String(dato)));
    const piezas = [];
    for (const p of partes) {
      if (p !== null && Object.hasOwn(SEPARADORES, p)) piezas.push(SEPARADORES[p].map((s) => " " + s + " "));
      else if (py.isdigit(p)) piezas.push(py.sorted(formasDeNumero(p)));
      else if (py.strip(p)) piezas.push([p]);
    }
    let total = 1;
    for (const p of piezas) total *= p.length;
    if (total > limite) {
      throw new py.ValueError(`${dato}: ${total} formas, más que el límite ${limite}`);
    }
    return new Set(productos(piezas).map((f) => py.strip(ESPACIOS.sub(" ", f))));
  }
  const normalizados = new Map();
  function normalizar(t) {
    t = String(t);
    const ya = normalizados.get(t);
    if (ya !== void 0) return ya;
    if (normalizados.size > 5e4) normalizados.clear();
    const n = normalizarSinMemoria(t);
    normalizados.set(t, n);
    return n;
  }
  function normalizarSinMemoria(t) {
    t = py.lower(py.sinMarcas(t));
    t = t.replaceAll("º", "o").replaceAll("°", "o").replaceAll("´", "'");
    t = PUNTUACION.sub(" ", t);
    t = GUION_O_BARRA.sub(r` \1 `, t);
    return py.strip(ESPACIOS.sub(" ", t));
  }
  function aparece(forma, textoNormalizado) {
    const f = normalizar(forma);
    if (!f) return false;
    let i = textoNormalizado.indexOf(f);
    while (i !== -1) {
      const antes = Array.from(textoNormalizado.slice(Math.max(0, i - 2), i)).pop();
      const despues = String.fromCodePoint(textoNormalizado.codePointAt(i + f.length) || 0);
      if ((antes === void 0 || !py.esPalabra(antes)) && (i + f.length >= textoNormalizado.length || !py.esPalabra(despues))) {
        return true;
      }
      i = textoNormalizado.indexOf(f, i + 1);
    }
    return false;
  }
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const FECHA = re(String.raw`^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$`);
  function formasDeFecha(dato) {
    const m = FECHA.match(py.strip(String(dato)));
    if (!m) return new Set();
    const d = Number(py.int(m.group(1))), mes = Number(py.int(m.group(2)));
    const a = Number(py.int(m.group(3)));
    if (!(1 <= d && d <= 31 && 1 <= mes && mes <= 12)) return new Set();
    const dias = new Set([enLetras(d)]);
    if (d === 1) dias.add("primero");
    const anios = new Set([enLetras(a)]);
    if (a < 100) anios.add(enLetras(2e3 + a));
    else if (2e3 <= a && a <= 2099) anios.add(enLetras(a % 100));
    const salida = new Set([String(dato)]);
    for (const dd of dias) {
      for (const aa of anios) {
        salida.add(`${dd} de ${MESES[mes - 1]} de ${aa}`);
        salida.add(`${dd} de ${MESES[mes - 1]} del año ${aa}`);
        salida.add(`${dd} de ${MESES[mes - 1]} del ${aa}`);
        for (let sep of SEPARADORES["-"].concat(SEPARADORES["/"])) {
          sep = sep.length === 1 ? sep : " " + sep + " ";
          salida.add(`${dd}${sep}${MESES[mes - 1]}${sep}${aa}`);
        }
      }
    }
    return salida;
  }
  function todasLasFormas(dato) {
    const d = py.strip(String(dato));
    const formas2 = formasDeFecha(d);
    if (formas2.size) {
      try {
        for (const f of formasCompuestas(d)) formas2.add(f);
      } catch (e) {
        if (!(e instanceof py.ValueError)) throw e;
      }
      return formas2;
    }
    if (DIGITOS.fullmatch(d)) return formasDeNumero(d);
    if (COMPUESTO.fullmatch(d)) {
      try {
        return formasCompuestas(d);
      } catch (e) {
        if (e instanceof py.ValueError) return new Set([d]);
        throw e;
      }
    }
    return new Set();
  }
  const PALABRAS_DE_NUMERO = new Set([...UNIDADES, ...Object.values(DECENAS), ...Object.values(CENTENAS), "ciento", "mil", "millon", "millones", "un", "veintiun", "guion", "barra", "primero"]);
  function hayNumero(t) {
    return Array.from(t).some((c) => py.isdigit(c)) || py.split(t).some((p) => PALABRAS_DE_NUMERO.has(p));
  }
  const ORDINALES = [null, ["primero", "primer", "primera"], ["segundo", "segunda"], ["tercero", "tercer", "tercera"], ["cuarto", "cuarta"], ["quinto", "quinta"], ["sexto", "sexta"], ["septimo", "setimo", "septima", "setima"], ["octavo", "octava"], ["noveno", "novena"], ["decimo", "decima"]];
  const ORDINAL = re(r`^(\d{1,2})[°ºª]$`);
  const BORDES_ORDINAL = re(r`^[^\w°ºª]+|[^\w°ºª]+$`);
  function formasDeOrdinal(dato) {
    const m = ORDINAL.match(BORDES_ORDINAL.sub("", ESPACIOS.sub("", String(dato))));
    if (!m) return new Set();
    return new Set(ORDINALES[Number(py.int(m.group(1)))] || []);
  }
  const CON_MILES = re(r`\d{1,3}(?:\.\d{3})+`);
  const PALABRA_NUMERO = re(r`^(?:n[°º]|nro\.?|n[úu]m\.?|n[úu]mero)$`, "I");
  const NUMERO_PEGADO = re(r`^(n[°º]|nro\.)(?=\d)`, "I");
  const APERTURA = re(r`^[(«"“\[]+`);
  function sinPalabraNumero(t) {
    const p = py.split(NUMERO_PEGADO.sub(r`\1 `, APERTURA.sub("", py.strip(String(t)))));
    if (!p.length || !PALABRA_NUMERO.match(p[0])) return null;
    return p.slice(1).join(" ");
  }
  function equivalentes(a, b) {
    const na = normalizar(a), nb = normalizar(b);
    if (na === nb) return true;
    if (CORTADA.sub(r`\1\2`, na) === nb || CORTADA.sub(r`\1\2`, nb) === na) {
      return true;
    }
    if (na !== nb && na.replaceAll(" ", "") === nb.replaceAll(" ", "") && !hayNumero(na) && !hayNumero(nb)) {
      return true;
    }
    for (const [uno, otro] of [[a, nb], [b, na]]) {
      let limpio = BORDES.sub("", ESPACIOS.sub("", String(uno)));
      if (CON_MILES.fullmatch(limpio)) limpio = limpio.replaceAll(".", "");
      for (const f of todasLasFormas(limpio)) {
        if (normalizar(f) === otro) return true;
      }
      for (const f of formasDeOrdinal(uno)) {
        if (f === otro) return true;
      }
    }
    const [ra, rb] = [sinPalabraNumero(a), sinPalabraNumero(b)];
    if (ra !== null && rb !== null) return !py.strip(ra) && !py.strip(rb) || equivalentes(ra, rb);
    return false;
  }
  const EN_DIGITOS = re(r`(?<![\d.,])(?:\d{1,3}(?:\.\d{3})*(?:,\d+|\.-)` + r`|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}` + r`|\d+(?:[-/]\d+)+` + r`|\d{1,2}[°ºª]` + r`|\d{1,3}(?:\.\d{3})+(?!\d|[.,]\d)` + r`|\d+(?!\d|[.,]\d))`);
  const CON_TILDE = { veintidos: "veintidós", veintitres: "veintitrés", veintiseis: "veintiséis", dieciseis: "dieciséis", millon: "millón" };
  const SIN_TILDE = /\b(?:veintidos|veintitres|veintiseis|dieciseis|millon)\b/g;
  function enPalabras(texto) {
    return EN_DIGITOS.sub((m) => {
      const d = m.group(0);
      if (/,|\.-$/.test(d)) return d;
      return enPalabrasUno(d).replace(SIN_TILDE, (w) => CON_TILDE[w]);
    }, String(texto));
  }
  function enPalabrasUno(d) {
    {
      const fecha = FECHA.match(d);
      if (fecha) {
        const dia = Number(py.int(fecha.group(1))), mes = Number(py.int(fecha.group(2)));
        let anio = Number(py.int(fecha.group(3)));
        if (anio < 100) anio += 2e3;
        if (1 <= dia && dia <= 31 && 1 <= mes && mes <= 12) {
          return `${dia === 1 ? "primero" : enLetras(dia)} de ${MESES[mes - 1]} de ${enLetras(anio)}`;
        }
      }
      const ord = ORDINAL.match(d);
      if (ord) {
        const lista = ORDINALES[Number(py.int(ord.group(1)))];
        return lista ? lista[0] : d;
      }
      if (/[-/]/.test(d)) return d.split(/([-/])/).map((p) => /^\d+$/.test(p) ? enLetras(p) : p).join("");
      return enLetras(d.replaceAll(".", ""));
    }
  }
  const formas = { enPalabras, UNIDADES, DECENAS, CENTENAS, MESES, SEPARADORES, enLetras, cifraPorCifra, formasDeNumero, formasCompuestas, normalizar, aparece, formasDeFecha, formasDeOrdinal, todasLasFormas, equivalentes };
  if (typeof module === "object" && module.exports) module.exports = formas;
  else (raiz.Motor = raiz.Motor || {}).formas = formas;
})(typeof globalThis !== "undefined" ? globalThis : this);
