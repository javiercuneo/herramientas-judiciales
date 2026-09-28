(function(raiz) {
  "use strict";
  function SequenceMatcher(a, b) {
    this.a = a;
    this.b = b;
    this.matchingBlocks = null;
    this.opcodes = null;
    const b2j = new Map();
    for (let i = 0; i < b.length; i++) {
      let indices = b2j.get(b[i]);
      if (!indices) {
        indices = [];
        b2j.set(b[i], indices);
      }
      indices.push(i);
    }
    this.b2j = b2j;
  }
  SequenceMatcher.prototype.findLongestMatch = function(alo, ahi, blo, bhi) {
    const a = this.a, b = this.b, b2j = this.b2j;
    let besti = alo, bestj = blo, bestsize = 0;
    let j2len = new Map();
    for (let i = alo; i < ahi; i++) {
      const newj2len = new Map();
      const indices = b2j.get(a[i]);
      if (indices) {
        for (const j of indices) {
          if (j < blo) continue;
          if (j >= bhi) break;
          const k = (j2len.get(j - 1) || 0) + 1;
          newj2len.set(j, k);
          if (k > bestsize) {
            besti = i - k + 1;
            bestj = j - k + 1;
            bestsize = k;
          }
        }
      }
      j2len = newj2len;
    }
    while (besti > alo && bestj > blo && a[besti - 1] === b[bestj - 1]) {
      besti--;
      bestj--;
      bestsize++;
    }
    while (besti + bestsize < ahi && bestj + bestsize < bhi && a[besti + bestsize] === b[bestj + bestsize]) {
      bestsize++;
    }
    return { a: besti, b: bestj, size: bestsize };
  };
  SequenceMatcher.prototype.getMatchingBlocks = function() {
    if (this.matchingBlocks !== null) return this.matchingBlocks;
    const la = this.a.length, lb = this.b.length;
    const cola = [[0, la, 0, lb]];
    const bloques = [];
    while (cola.length) {
      const [alo, ahi, blo, bhi] = cola.pop();
      const x = this.findLongestMatch(alo, ahi, blo, bhi);
      const i = x.a, j = x.b, k = x.size;
      if (k) {
        bloques.push(x);
        if (alo < i && blo < j) cola.push([alo, i, blo, j]);
        if (i + k < ahi && j + k < bhi) cola.push([i + k, ahi, j + k, bhi]);
      }
    }
    bloques.sort((p, q) => p.a - q.a || p.b - q.b || p.size - q.size);
    let i1 = 0, j1 = 0, k1 = 0;
    const sueltos = [];
    for (const { a: i2, b: j2, size: k2 } of bloques) {
      if (i1 + k1 === i2 && j1 + k1 === j2) {
        k1 += k2;
      } else {
        if (k1) sueltos.push({ a: i1, b: j1, size: k1 });
        i1 = i2;
        j1 = j2;
        k1 = k2;
      }
    }
    if (k1) sueltos.push({ a: i1, b: j1, size: k1 });
    sueltos.push({ a: la, b: lb, size: 0 });
    this.matchingBlocks = sueltos;
    return sueltos;
  };
  SequenceMatcher.prototype.getOpcodes = function() {
    if (this.opcodes !== null) return this.opcodes;
    let i = 0, j = 0;
    const respuesta = [];
    for (const { a: ai, b: bj, size } of this.getMatchingBlocks()) {
      let etiqueta = "";
      if (i < ai && j < bj) etiqueta = "replace";
      else if (i < ai) etiqueta = "delete";
      else if (j < bj) etiqueta = "insert";
      if (etiqueta) respuesta.push([etiqueta, i, ai, j, bj]);
      i = ai + size;
      j = bj + size;
      if (size) respuesta.push(["equal", ai, i, bj, j]);
    }
    this.opcodes = respuesta;
    return respuesta;
  };
  const difflib = { SequenceMatcher };
  if (typeof module === "object" && module.exports) module.exports = difflib;
  else (raiz.Motor = raiz.Motor || {}).difflib = difflib;
})(typeof globalThis !== "undefined" ? globalThis : this);
