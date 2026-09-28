(function(raiz) {
  "use strict";
  const M = raiz.Motor || {};
  const py = M.py || require("./py.js");
  const formas = M.formas || require("./formas.js");
  const zonas = M.zonas || require("./zonas.js");
  const cuentas = M.cuentas || require("./cuentas.js");
  const REGIMEN = /Impuesto\s+y\s+R[eé]gimen\s+de\s+la\s+retenci[oó]n\s*:[ \t]*([^\n]*)\n?/i;
  const DEO = /^[ \t]*DEO\s+N\s*[°º]?\s*:?[^\n]*\n?/im;
  const CUERPO = new RegExp(String.raw`autos\s+caratulados\s+'(.*?)'\s+expte\.?\s+nro\.?\s+(.*?)\s+en\s+tr[aá]mite.*?` + String.raw`cuenta\s+N\s*[°º]?\s*(.*?)\s+bajo\s+titularidad\s+(.*?)\s+a\s+fin\s+de\s+que\s+se\s+proceda\s+a\s+transferir\s+` + String.raw`la\s+suma\s+de\s+(U\$S|US\$|\$)\s*([\d.]+(?:,\d{1,2})?)\s*(?:\((.*?)\))?\s*` + String.raw`en\s+concepto\s+de\s+(.*?)\s+a\s+la\s+cuenta\s+n[uú]mero\s+(.*?)\s+` + String.raw`del\s+(.*?)\s+sucursal\s*(.*?)\s*titularidad\s+de\s+(.*?)\s+` + String.raw`CUIT\s*/\s*CUIL\s*(.*?)\s+CBU\s*(.*?)\s*\.?\s*$`, "is");
  const MONTO = /(?:U\$S|US\$|\$)\s*([\d.]+)(?:,(\d{1,2}))?/g;
  const BANCOS = { "007": ["galicia"], "011": ["nacion"], "014": ["provincia"], "015": ["icbc"], "017": ["bbva", "frances"], "027": ["supervielle"], "029": ["ciudad"], "034": ["patagonia"], "044": ["hipotecario"], "072": ["santander", "rio"], "150": ["hsbc"], "191": ["credicoop"], "285": ["macro"], "299": ["comafi"] };
  const DE_RELLENO = new Set(["banco", "de", "la", "del", "el", "s", "a", "sa", "argentina", "argentino", "sucursal", "y", "e"]);
  const digitos = (s) => String(s).replace(/\D/g, "");
  const tapado = (s) => /^\[[^\]]*\]$/.test(py.strip(String(s)));
  function numerosDe(texto) {
    const salida = new Set();
    for (const m of texto.matchAll(/\d(?:[\d.\/-]|\s(?=\d))*/g)) salida.add(digitos(m[0]));
    return salida;
  }
  function valorDe(pesos, centavos) {
    return [BigInt(pesos.replaceAll(".", "") || "0"), Number((centavos || "0").padEnd(2, "0"))];
  }
  function montoEnAuto(texto, auto) {
    return cuentas.montosContraAuto("$ " + texto, auto).length === 0;
  }
  function partir(texto) {
    const fin = zonas.FIN_DOCUMENTO.search(texto);
    if (fin) texto = texto.slice(0, fin.start());
    const m = REGIMEN.exec(texto);
    if (!m) {
      throw new py.ValueError("no encontré el renglón «Impuesto y Régimen de la retención», que cierra el formulario del DEOX: ¿es un formulario de transferencia?");
    }
    let resto = texto.slice(m.index + m[0].length);
    let regimen = py.strip(m[1]);
    if (!regimen) {
      const sig = /^[ \t]*([^\n]*)\n?/.exec(resto);
      if (!/^\s*DEO\b/i.test(sig[1])) {
        regimen = py.strip(sig[1]);
        resto = resto.slice(sig[0].length);
      }
    }
    const deo = DEO.exec(resto);
    if (deo && deo.index < 80) resto = resto.slice(deo.index + deo[0].length);
    return { formulario: texto.slice(0, m.index), regimen, auto: resto };
  }
  function leer(formulario) {
    const plano = formulario.replace(/\s+/g, " ");
    const m = CUERPO.exec(plano);
    if (!m) {
      throw new py.ValueError("no pude leer los campos del formulario: el texto no tiene la forma que arma el DEOX («…a fin de que se proceda a transferir la suma de… a la cuenta número… CBU…»)");
    }
    const suc = /Sucursal\s*:[ \t]*([^\n]*)/i.exec(formulario);
    const [caratula, expte, cuentaOrigen, titularidadOrigen, moneda, suma, letras, concepto, cuentaDestino, banco, sucursalDestino, destinatario, cuit, cbu] = m.slice(1).map((x) => py.strip(x || ""));
    return { caratula, expte, sucursalOrigen: suc ? py.strip(suc[1]) : "", cuentaOrigen, titularidadOrigen, moneda, suma, letras, concepto, cuentaDestino, banco: banco.replace(/\s+sucursal$/i, ""), sucursalDestino, destinatario, cuit, cbu };
  }
  function campos(c, regimen, auto) {
    const salida = [];
    const hayAuto = !!py.strip(auto);
    const autoNorm = formas.normalizar(auto);
    const numeros = numerosDe(auto);
    const concepto = formas.normalizar(c.concepto);
    function numero(campo, valor, siFalta) {
      if (!valor) return salida.push(["FALTA", campo, "", "el formulario no lo trae"]);
      if (tapado(valor)) return salida.push(["SIN COTEJAR", campo, valor, "quedó anonimizado"]);
      if (!digitos(valor)) return salida.push(["SIN COTEJAR", campo, valor, "no tiene dígitos: quedó tapado"]);
      if (!hayAuto) return salida.push(["SIN COTEJAR", campo, valor, "no hay auto contra qué compararlo"]);
      if (numeros.has(digitos(valor))) return salida.push(["COINCIDE", campo, valor, "está en el auto"]);
      salida.push(["NO ESTA EN EL AUTO", campo, valor, siFalta]);
    }
    function palabras(campo, valor, sacar = new Set()) {
      if (!valor) return salida.push(["FALTA", campo, "", "el formulario no lo trae"]);
      if (!hayAuto) return salida.push(["SIN COTEJAR", campo, valor, "no hay auto contra qué compararlo"]);
      const todas = formas.normalizar(valor).split(" ").filter((w) => w);
      let buscar = todas.filter((w) => !sacar.has(w));
      if (!buscar.length) buscar = todas;
      const faltan = buscar.filter((w) => !formas.aparece(w, autoNorm));
      if (!faltan.length) return salida.push(["COINCIDE", campo, valor, "está en el auto"]);
      if (/\[[^\]]*\]/.test(valor)) {
        return salida.push(["SIN COTEJAR", campo, valor, "quedó anonimizado y en el auto no está esa etiqueta: mirar el original"]);
      }
      salida.push(["NO ESTA EN EL AUTO", campo, valor, `el auto no dice «${faltan.join(" ")}»`]);
    }
    numero("cuenta de origen", c.cuentaOrigen, "la cuenta de autos que dice el formulario no está en el auto");
    const tit = formas.normalizar(c.titularidadOrigen);
    if (!tit) {
      salida.push(["FALTA", "titularidad de la cuenta de origen", "", "el formulario no la trae"]);
    } else if (tit === "de autos" || tit === "autos" || tit === formas.normalizar(c.caratula)) {
      salida.push(["COINCIDE", "titularidad de la cuenta de origen", c.titularidadOrigen, "dice de autos o repite la carátula"]);
    } else {
      salida.push(["DIFERENCIA", "titularidad de la cuenta de origen", c.titularidadOrigen, "tiene que decir «de autos» o repetir la carátula"]);
    }
    const total = valorDe(...(/^([\d.]+)(?:,(\d{1,2}))?$/.exec(c.suma) || ["", c.suma, ""]).slice(1));
    if (!c.letras || !/[a-z]/i.test(c.letras)) {
      salida.push(["FALTA", "suma en letras", c.suma, "no encontré la suma en letras entre paréntesis"]);
    }
    const dolares = c.moneda !== "$";
    const monedaAuto = dolares ? /\b(dolares|u s s|us s)\b/.test(autoNorm) || /U\$S|US\$/i.test(auto) : /\bpesos\b/.test(autoNorm) || /(?<![A-Za-z])\$/.test(auto.replace(/U\$S|US\$/gi, ""));
    if (hayAuto && !monedaAuto) {
      salida.push(["DIFERENCIA", "moneda", dolares ? "dólares" : "pesos", `el auto no habla de ${dolares ? "dólares" : "pesos"}`]);
    }
    if (!hayAuto) {
      salida.push(["SIN COTEJAR", "suma", `${c.moneda} ${c.suma}`, "no hay auto contra qué compararla"]);
    } else if (montoEnAuto(c.suma, auto)) {
      salida.push(["COINCIDE", "suma", `${c.moneda} ${c.suma}`, "está en el auto"]);
    } else {
      salida.push(["NO ESTA EN EL AUTO", "suma", `${c.moneda} ${c.suma}`, "el auto no dice esta suma, ni en números ni en letras"]);
    }
    const partes = [...c.concepto.matchAll(MONTO)];
    if (partes.length) {
      let pesos = 0n, centavos = 0;
      for (const p of partes) {
        const [a, b] = valorDe(p[1], p[2]);
        pesos += a;
        centavos += b;
        const dice = py.strip(p[0]);
        if (!hayAuto) continue;
        if (montoEnAuto(p[1] + (p[2] ? "," + p[2] : ""), auto)) {
          salida.push(["COINCIDE", "parte de la suma", dice, "está en el auto"]);
        } else {
          salida.push(["NO ESTA EN EL AUTO", "parte de la suma", dice, "el auto no dice esta suma, ni en números ni en letras"]);
        }
      }
      pesos += BigInt(Math.floor(centavos / 100));
      centavos %= 100;
      if (pesos !== total[0] || centavos !== total[1]) {
        salida.push(["DIFERENCIA", "discriminación", c.concepto, `las partes suman ${pesos.toLocaleString("es-AR")}` + (centavos ? `,${String(centavos).padStart(2, "0")}` : "") + ` y el total es ${c.suma}`]);
      }
    }
    for (const [clave, nombre] of [["capital", "capital"], ["honorarios", "honorarios"], ["iva", "IVA"]]) {
      if (!formas.aparece(clave, concepto)) continue;
      if (!hayAuto) continue;
      if (formas.aparece(clave, autoNorm)) {
        salida.push(["COINCIDE", "concepto", nombre, "el auto también lo dice"]);
      } else {
        salida.push(["NO ESTA EN EL AUTO", "concepto", nombre, `el formulario transfiere en concepto de ${nombre} y el auto no lo nombra`]);
      }
    }
    numero("cuenta de destino", c.cuentaDestino, "el número de cuenta no está en el auto");
    palabras("banco de destino", c.banco, DE_RELLENO);
    palabras("titular de la cuenta de destino", c.destinatario);
    numero("CUIT/CUIL", c.cuit, "el CUIT del formulario no está en el auto");
    numero("CBU", c.cbu, "el CBU tiene que estar en el auto. Si lo dice otro auto, pegalo en el panel de los autos");
    const cbu = digitos(c.cbu);
    if (cbu.length === 22) {
      const claves = BANCOS[cbu.slice(0, 3)];
      const banco = formas.normalizar(c.banco);
      if (claves && banco && !claves.some((k) => formas.aparece(k, banco))) {
        salida.push(["DIFERENCIA", "banco del CBU", c.banco, `el CBU empieza con ${cbu.slice(0, 3)}, que es del banco ${claves[0]}`]);
      }
      const suc = digitos(c.sucursalDestino);
      if (suc && /^\s*\d+\s*$/.test(c.sucursalDestino) && Number(suc) !== Number(cbu.slice(3, 7))) {
        salida.push(["DIFERENCIA", "sucursal del CBU", c.sucursalDestino, `el CBU dice sucursal ${cbu.slice(3, 7)}`]);
      }
    }
    const reg = formas.normalizar(regimen);
    const diceIva = /\biva\b|responsable inscripto/.test(reg);
    if (!reg) {
      salida.push(["FALTA", "impuesto y régimen de la retención", "", "el formulario no lo trae"]);
    } else {
      let falla = "";
      const honorarios = formas.aparece("honorarios", concepto);
      if (formas.aparece("iva", concepto) && !diceIva) {
        falla = "el concepto discrimina IVA y el régimen no dice IVA responsable inscripto";
      } else if (/responsable inscripto/.test(autoNorm) && !diceIva) {
        falla = "el auto dice responsable inscripto y el régimen no";
      } else if (honorarios && !diceIva && !/ganancias/.test(reg)) {
        falla = "en honorarios el régimen es IVA responsable inscripto o ganancias";
      } else if (!honorarios && formas.aparece("capital", concepto) && !/\bimponible\b/.test(reg)) {
        falla = "el concepto es capital y el régimen no dice imponible";
      }
      salida.push(falla ? ["DIFERENCIA", "impuesto y régimen de la retención", regimen, falla] : ["COINCIDE", "impuesto y régimen de la retención", regimen, "va con el concepto y con el auto"]);
    }
    return salida;
  }
  function cotejar(texto, resolucion) {
    const { formulario, regimen, auto: abajo } = partir(texto);
    const c = leer(formulario);
    const auto = [abajo, resolucion].filter((t) => py.strip(t)).join("\n");
    const lista = campos(c, regimen, auto);
    if (!py.strip(auto)) {
      lista.unshift(["SIN COTEJAR", "el auto", "", "no hay nada abajo del formulario ni en el panel de los autos: sin el auto sólo se controlaron las cuentas"]);
    }
    return { tipo: "transferencia", sin_corte: "", diferencias: [], alineado: null, anclas: [], campos: lista, digitos: [], marcas: zonas.marcasDeTrabajo(formulario), rubros: [], montos: cuentas.montos(formulario), montos_auto: [], cuits: cuentas.cuits(formulario), cbus: cuentas.cbus(formulario), largos: [formulario.length, 0] };
  }
  const transferencia = { cotejar, partir, leer, campos, BANCOS };
  if (typeof module === "object" && module.exports) module.exports = transferencia;
  else M.transferencia = transferencia;
})(typeof globalThis !== "undefined" ? globalThis : this);
