(function(raiz) {
  "use strict";
  const unicode = raiz.Motor ? raiz.Motor.unicode : require("./unicode.js");
  const W = `[${unicode.PALABRA}]`;
  const NO_W = `[^${unicode.PALABRA}]`;
  const D = `[${unicode.DECIMAL}]`;
  const NO_D = `[^${unicode.DECIMAL}]`;
  const S = `[${unicode.ESPACIO}]`;
  const NO_S = `[^${unicode.ESPACIO}]`;
  const BORDE = `(?:(?<=${W})(?!${W})|(?<!${W})(?=${W}))`;
  const NO_BORDE = `(?:(?<=${W})(?=${W})|(?<!${W})(?!${W}))`;
  class ValueError extends Error {
  }
  const SINTAXIS = "^$\\.*+?()[]{}|/";
  const EN_CLASE = SINTAXIS + "-&!#%,:;<=>@`~";
  const CONTROL = { n: "\\n", t: "\\t", r: "\\r", f: "\\f", v: "\\v" };
  function escaparEnClase(c) {
    return EN_CLASE.includes(c) ? "\\" + c : c;
  }
  function escape(src, i, enClase) {
    const c = src[i + 1];
    if (c === void 0) throw new Error(`patrón que termina en «\\»: ${src}`);
    const clases = enClase ? { w: W, W: NO_W, d: D, D: NO_D, s: S, S: NO_S } : { w: W, W: NO_W, d: D, D: NO_D, s: S, S: NO_S, b: BORDE, B: NO_BORDE, A: "(?<![\\s\\S])", Z: "(?![\\s\\S])" };
    if (c in clases) return [clases[c], 2];
    if (c in CONTROL) return [CONTROL[c], 2];
    if (c === "u") return [src.slice(i, i + 6), 6];
    if (c === "x") return [src.slice(i, i + 4), 4];
    if (/[0-9]/.test(c)) {
      if (enClase) throw new Error(`referencia adentro de una clase: ${src}`);
      const m = /^[0-9]{1,2}/.exec(src.slice(i + 1));
      return ["\\" + m[0], 1 + m[0].length];
    }
    if (/[A-Za-z]/.test(c)) throw new Error(`escape que no sé traducir: \\${c} en ${src}`);
    if (enClase) return [escaparEnClase(c), 2];
    return [SINTAXIS.includes(c) ? "\\" + c : c, 2];
  }
  function clase(src, i) {
    let j = i + 1;
    let out = "[";
    if (src[j] === "^") {
      out += "^";
      j++;
    }
    const elementos = [];
    let primero = true;
    while (j < src.length && (src[j] !== "]" || primero)) {
      primero = false;
      if (src[j] === "\\") {
        const [js, n] = escape(src, j, true);
        elementos.push([js, !js.startsWith("[")]);
        j += n;
      } else {
        elementos.push([src[j], true]);
        j++;
      }
    }
    if (src[j] !== "]") throw new Error(`clase sin cerrar: ${src}`);
    elementos.forEach(([js, suelto], k) => {
      if (js === "-") {
        const antes = elementos[k - 1], despues = elementos[k + 1];
        const rango = antes && despues && antes[1] && despues[1] && antes[0] !== "-";
        out += rango ? "-" : "\\-";
      } else if (suelto && js.length === 1) {
        out += escaparEnClase(js);
      } else {
        out += js;
      }
    });
    return [out + "]", j + 1];
  }
  function traducir(src, multilinea) {
    let out = "";
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") {
        const [js, n] = escape(src, i, false);
        out += js;
        i += n;
      } else if (c === "[") {
        const [js, sigue] = clase(src, i);
        out += js;
        i = sigue;
      } else if (c === ".") {
        out += "[^\\n]";
        i++;
      } else if (c === "^") {
        out += multilinea ? "(?<![^\\n])" : "(?<![\\s\\S])";
        i++;
      } else if (c === "$") {
        out += multilinea ? "(?![^\\n])" : "(?=\\n?(?![\\s\\S]))";
        i++;
      } else if (src.startsWith("(?P<", i)) {
        out += "(?<";
        i += 4;
      } else if (src.startsWith("(?P=", i) || /^\(\?[aiLmsux]/.test(src.slice(i))) {
        throw new Error(`construcción de Python que no sé traducir: ${src}`);
      } else {
        out += c;
        i++;
      }
    }
    return out;
  }
  class Coincidencia {
    constructor(r, patron) {
      this.r = r;
      this.patron = patron;
      this.indices = null;
    }
    group(g = 0) {
      const v = this.r[g];
      return v === void 0 ? null : v;
    }
    posiciones(g) {
      if (!this.indices) this.indices = this.patron.indicesEn(this.r.input, this.r.index);
      return this.indices[g];
    }
    start(g = 0) {
      if (g === 0) return this.r.index;
      const d = this.posiciones(g);
      return d ? d[0] : -1;
    }
    end(g = 0) {
      if (g === 0) return this.r.index + this.r[0].length;
      const d = this.posiciones(g);
      return d ? d[1] : -1;
    }
    groups() {
      return this.r.slice(1).map((v) => v === void 0 ? null : v);
    }
  }
  class Patron {
    constructor(src, banderas = "") {
      this.src = src;
      this.js = traducir(src, banderas.includes("M"));
      this.i = banderas.includes("I") ? "i" : "";
      this.buscador = new RegExp(this.js, "gv" + this.i);
      this.formas = {};
    }
    forma(nombre, js, banderas) {
      if (!this.formas[nombre]) this.formas[nombre] = new RegExp(js, banderas + this.i);
      return this.formas[nombre];
    }
    indicesEn(s, desde) {
      const x = this.forma("indices", this.js, "dyv");
      x.lastIndex = desde;
      return x.exec(s).indices;
    }
    search(s, desde = 0) {
      this.buscador.lastIndex = desde;
      const r = this.buscador.exec(s);
      return r ? new Coincidencia(r, this) : null;
    }
    match(s) {
      const x = this.forma("anclado", this.js, "yv");
      x.lastIndex = 0;
      const r = x.exec(s);
      return r ? new Coincidencia(r, this) : null;
    }
    fullmatch(s) {
      const x = this.forma("entero", `(?:${this.js})(?![\\s\\S])`, "yv");
      x.lastIndex = 0;
      const r = x.exec(s);
      return r ? new Coincidencia(r, this) : null;
    }
    finditer(s) {
      const salida = [];
      this.buscador.lastIndex = 0;
      let r;
      while ((r = this.buscador.exec(s)) !== null) {
        if (r[0] === "") throw new Error(`coincidencia vacía en ${this.src}`);
        salida.push(new Coincidencia(r, this));
      }
      return salida;
    }
    subn(reemplazo, s) {
      const armar = typeof reemplazo === "function" ? reemplazo : plantilla(reemplazo);
      let out = "", ultimo = 0, n = 0;
      for (const m of this.finditer(s)) {
        out += s.slice(ultimo, m.start());
        out += armar(m);
        ultimo = m.end();
        n++;
      }
      return [out + s.slice(ultimo), n];
    }
    sub(reemplazo, s) {
      return this.subn(reemplazo, s)[0];
    }
    split(s) {
      const salida = [];
      let ultimo = 0;
      for (const m of this.finditer(s)) {
        salida.push(s.slice(ultimo, m.start()));
        salida.push(...m.groups());
        ultimo = m.end();
      }
      salida.push(s.slice(ultimo));
      return salida;
    }
  }
  const plantillas = new Map();
  function plantilla(texto) {
    let armar = plantillas.get(texto);
    if (armar) return armar;
    const piezas = [];
    let fijo = "", ultimo = 0;
    for (const x of texto.matchAll(/\\(?:g<(\w+)>|([0-9]{1,2})|(.))/gs)) {
      fijo += texto.slice(ultimo, x.index);
      ultimo = x.index + x[0].length;
      const [, g, n, otro] = x;
      if (g !== void 0 || n !== void 0) {
        piezas.push(fijo, Number(g !== void 0 ? g : n));
        fijo = "";
      } else if (otro === "\\") {
        fijo += "\\";
      } else if (otro in CONTROL) {
        fijo += { n: "\n", t: "	", r: "\r", f: "\f", v: "\v" }[otro];
      } else {
        fijo += "\\" + otro;
      }
    }
    piezas.push(fijo + texto.slice(ultimo));
    armar = piezas.length === 1 ? () => piezas[0] : (m) => {
      let out = piezas[0];
      for (let k = 1; k < piezas.length; k += 2) {
        const v = m.group(piezas[k]);
        out += (v === null ? "" : v) + piezas[k + 1];
      }
      return out;
    };
    plantillas.set(texto, armar);
    return armar;
  }
  const cache = new Map();
  function re(src, banderas = "") {
    const clave = banderas + "\0" + src;
    let p = cache.get(clave);
    if (!p) {
      p = new Patron(src, banderas);
      cache.set(clave, p);
    }
    return p;
  }
  function escaparRe(s) {
    return String(s).replace(/[()[\]{}?*+\-|^$\\.&~# \t\n\r\v\f]/g, "\\$&");
  }
  const ES_ESPACIO = new RegExp(`^${S}$`, "v");
  const ES_DIGITO = new RegExp(`^[${unicode.DIGITO}]$`, "v");
  const ES_DECIMAL = new RegExp(`^${D}$`, "v");
  const MARCAS = new RegExp(`[${unicode.MARCA}]`, "gv");
  const ES_PALABRA = new RegExp(`^${W}$`, "v");
  function esPalabra(c) {
    return ES_PALABRA.test(c);
  }
  function isspace(c) {
    return ES_ESPACIO.test(c);
  }
  function isdigit(s) {
    if (!s) return false;
    for (const c of s) if (!ES_DIGITO.test(c)) return false;
    return true;
  }
  function saca(letras) {
    return letras === void 0 ? isspace : (c) => letras.includes(c);
  }
  function strip(s, letras) {
    return rstrip(lstrip(s, letras), letras);
  }
  function lstrip(s, letras) {
    const sale = saca(letras);
    let i = 0;
    while (i < s.length && sale(s[i])) i++;
    return i ? s.slice(i) : s;
  }
  function rstrip(s, letras) {
    const sale = saca(letras);
    let i = s.length;
    while (i > 0 && sale(s[i - 1])) i--;
    return i < s.length ? s.slice(0, i) : s;
  }
  const ESPACIOS = new RegExp(`${S}+`, "v");
  function split(s) {
    return s.split(ESPACIOS).filter((x) => x !== "");
  }
  function lower(s) {
    return s.toLowerCase();
  }
  function sinMarcas(s) {
    return s.normalize("NFD").replace(MARCAS, "");
  }
  function digito(c) {
    const cp = c.codePointAt(0);
    for (let k = unicode.CEROS.length - 1; k >= 0; k--) {
      const cero = unicode.CEROS[k];
      if (cp >= cero && cp <= cero + 9) return cp - cero;
    }
    throw new ValueError(`invalid literal for int() with base 10: '${c}'`);
  }
  function int(s) {
    const t = strip(String(s));
    let n = 0n;
    if (!t) throw new ValueError(`invalid literal for int() with base 10: '${s}'`);
    for (const c of t) {
      if (!ES_DECIMAL.test(c)) throw new ValueError(`invalid literal for int() with base 10: '${s}'`);
      n = n * 10n + BigInt(digito(c));
    }
    return n;
  }
  function comparar(a, b) {
    const x = Array.from(a), y = Array.from(b);
    for (let k = 0; k < Math.min(x.length, y.length); k++) {
      const d = x[k].codePointAt(0) - y[k].codePointAt(0);
      if (d) return d;
    }
    return x.length - y.length;
  }
  function sorted(lista) {
    return [...lista].sort(comparar);
  }
  const py = { re, escaparRe, ValueError, esPalabra, isspace, isdigit, strip, lstrip, rstrip, split, lower, sinMarcas, digito, int, sorted, comparar, traducir };
  if (typeof module === "object" && module.exports) module.exports = py;
  else (raiz.Motor = raiz.Motor || {}).py = py;
})(typeof globalThis !== "undefined" ? globalThis : this);
