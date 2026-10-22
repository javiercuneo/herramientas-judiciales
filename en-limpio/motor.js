// ---------------------------------------------------------------------------
// Pasar en limpio: el texto de un auto, copiado del PDF o del sistema, listo
// para pegar en un testimonio.
//
// NO TIENE REGLAS PROPIAS DE LO QUE ES RUIDO NI DE COMO SE ESCRIBE UN NUMERO.
// Las dos son de confronteitor y se usan tal cual vienen en confronte/motor/:
//
//   - el ruido: cotejo.sinEncabezados, sinMembretes, sinCodigos y sinIniciales,
//     las mismas que limpian el panel de los autos antes de confrontar;
//   - los numeros: formas.enPalabras, la que confronte usa para PROPONER la
//     correccion en letras en un testimonio (ESTADO de confronteitor, D44.3 y
//     H6: "todo va en letras").
//
// Si una de esas reglas cambia alla, cambia aca sola con la proxima copia
// (npm run traer-confronte). Una segunda lista de membretes escrita aca se
// desincronizaria con la de alla, y las dos herramientas dirian cosas
// distintas sobre el mismo auto.
//
// Lo que SI es propio de esta pagina, y por eso esta aca y probado en
// npm run verificar-en-limpio:
//
//   1. Unir los renglones en un solo bloque, punto y seguido.
//   2. Que numero NO se pasa a letras, y se deja a la vista: los montos con
//      decimales (los deja enPalabras) o con el signo $, los numeros largos -un CBU de 22
//      cifras saldria como "billones"-, las horas, lo pegado a una letra y los
//      ordinales mayores a diez.
//   3. La concordancia que enPalabras no hace: "veintiuno mil" es "veintiun
//      mil", y "1 de marzo" en una resolucion es "primero de marzo". Lo que no
//      se puede decidir sin saber el genero de lo que sigue ("21 fojas" o "21
//      dias") se corrige solo con una lista corta, y si no, se avisa.
//
// Devuelve el texto y, sobre todo, la cuenta de lo que hizo: que saco, que
// paso a letras y que dejo sin pasar. Una limpieza que no se puede auditar
// produce confianza sin fundarla.
//
// Codigo puro: no toca el DOM y corre en Node.
// ---------------------------------------------------------------------------
(function (raiz) {
  "use strict";

  const M = raiz.Motor || {};
  const formas = M.formas;
  const cotejo = M.cotejo;

  // El sello del sistema sin la almohadilla del principio: asi sale cuando el
  // copiado empieza justo en el primer numero. sinCodigos pide la almohadilla
  // adelante; el resto de la forma -tres grupos largos unidos por #- es la
  // misma y no puede ser texto de nadie.
  const CODIGO_SIN_ALMOHADILLA = /(?<![\w#])\d{5,}#\d{5,}#\d{5,}#?/g;

  // Un numero, con lo que lo acompana: puntos de miles, coma decimal,
  // separadores de matricula o fecha, el signo de ordinal y el ".-" de los
  // montos. Se toma entero y se le pregunta a enPalabras que hace con el.
  const NUMERO = /\d(?:[\d.,/-]*\d)?(?:[°ºª]|\.-)?/g;
  const LETRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;

  // Mas de nueve cifras seguidas no es una cantidad que se escriba en letras
  // en un auto: es un CBU, un codigo o un numero de cuenta.
  const LARGO = /\d{10,}/;

  const MASCULINOS = /^(?:d[íi]as?|a[ñn]os?|mes(?:es)?|pesos?|d[óo]lar(?:es)?|metros?|art[íi]culos?|incisos?|puntos?|cuerpos?|anexos?|lotes?)$/i;
  const FEMENINOS = /^(?:fojas?|fs\.?|cuotas?|horas?|semanas?|unidad(?:es)?|hect[áa]reas?|partes?|copias?|veces|personas?)$/i;
  const MESES = /^(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)$/i;

  function limpiar(entrada) {
    const sacado = [];
    let t = String(entrada == null ? "" : entrada);

    // Lo invisible que arrastra el copiado de un PDF.
    t = t.replace(/\r\n?/g, "\n").replace(/[   ]/g, " ")
         .replace(/[​-‍⁠﻿­]/g, "");

    // --- 1. El ruido, con las reglas de confronte.
    t = renglonesSacados(t, (x) => cotejo.sinEncabezados(x)[0], "encabezado del sistema", sacado);
    t = renglonesSacados(t, (x) => cotejo.sinMembretes(x)[0], "membrete o pie de página", sacado);

    for (const re of [/#\d{5,}#\d{5,}#\d{5,}#?/g, CODIGO_SIN_ALMOHADILLA]) {
      t = t.replace(re, (m) => {
        sacado.push({ que: "código del sistema", texto: m });
        return " ";
      });
    }

    const antes = t;
    t = cotejo.sinIniciales(t)[0];
    if (t !== antes) sacado.push({ que: "iniciales de quien proyectó", texto: diferencia(antes, t) });

    // --- 2. Un solo bloque. La palabra cortada al final del renglon se une
    // sin el guion, pero solo entre minusculas: "15-\n24328" es una matricula.
    t = t.replace(/([a-záéíóúüñ])-[ \t]*\n[ \t]*([a-záéíóúüñ])/g, "$1$2");
    t = t.replace(/\s+/g, " ");
    // El espacio antes de la puntuacion lo deja el PDF, no quien escribio.
    t = t.replace(/ +([,.;:)\]»”])/g, "$1").replace(/([(\[«“]) +/g, "$1");
    t = t.trim();

    // --- 3. Los numeros.
    const partes = [];
    const convertidos = [];
    const sinPasar = [];
    let ultimo = 0;
    for (const m of t.matchAll(NUMERO)) {
      const dato = m[0];
      const i = m.index, f = i + dato.length;
      const previo = t[i - 1] || "", siguiente = t[f] || "";
      let motivo = null;
      if (LETRA.test(previo) || LETRA.test(siguiente)) motivo = "pegado a una letra";
      else if (/\d$/.test(t.slice(0, i)) || /^\d/.test(t.slice(f))) motivo = "parte de un número más largo";
      else if (LARGO.test(dato)) motivo = "número largo: puede ser un CBU, una cuenta o un código";
      // "$ 150.000" en letras seria "$ ciento cincuenta mil": el signo no se
      // lee. Pasarlo bien es agregar "pesos", y eso ya es redactar.
      else if (/(?:\$|U\$S|USD)\s*$/i.test(t.slice(Math.max(0, i - 5), i))) motivo = "monto con signo: queda en números";
      else if (/^:\d/.test(t.slice(f)) || /\d:$/.test(t.slice(0, i))) motivo = "hora";

      let letras = null;
      if (!motivo) {
        letras = formas.enPalabras(dato);
        if (/\d/.test(letras)) {
          motivo = /,\d|\.-$/.test(dato) ? "monto con decimales o con «.-»: queda en números"
            : /[°ºª]$/.test(dato) ? "ordinal mayor a décimo" : "no sé leerlo";
          letras = null;
        }
      }

      partes.push({ t: t.slice(ultimo, i) });
      if (letras === null) {
        partes.push({ t: dato, tipo: "sin-pasar", motivo });
        sinPasar.push({ dato, motivo, contexto: contexto(t, i, f) });
      } else {
        const ajuste = concordar(letras, t.slice(f));
        partes.push({ t: ajuste.texto, tipo: ajuste.revisar ? "revisar" : "convertido", de: dato,
                      motivo: ajuste.revisar });
        convertidos.push({ de: dato, a: ajuste.texto, revisar: ajuste.revisar || null,
                           contexto: contexto(t, i, f) });
      }
      ultimo = f;
    }
    partes.push({ t: t.slice(ultimo) });

    const salida = partes.filter((p) => p.t !== "" || p.tipo);
    return {
      texto: salida.map((p) => p.t).join(""),
      partes: salida,
      sacado,
      convertidos,
      sinPasar,
      revisar: convertidos.filter((c) => c.revisar),
    };
  }

  // Aplica una limpieza por renglones y anota los renglones que se fueron.
  // Las de confronte sacan renglones enteros y en orden, asi que alcanza con
  // recorrer las dos listas a la par.
  function renglonesSacados(texto, limpieza, que, sacado) {
    const despues = limpieza(texto);
    const a = texto.split("\n"), b = despues.split("\n");
    let j = 0;
    for (const linea of a) {
      if (j < b.length && b[j] === linea) { j++; continue; }
      if (linea.trim()) sacado.push({ que, texto: linea.trim() });
    }
    return despues;
  }

  // Lo que se fue de `a` para quedar `b`, cuando lo que se fue es un tramo solo.
  function diferencia(a, b) {
    let i = 0;
    while (i < b.length && a[i] === b[i]) i++;
    let k = 0;
    while (k < b.length - i && a[a.length - 1 - k] === b[b.length - 1 - k]) k++;
    return a.slice(i, a.length - k).trim();
  }

  function contexto(t, i, f) {
    const a = Math.max(0, i - 40), b = Math.min(t.length, f + 40);
    return (a > 0 ? "…" : "") + t.slice(a, b).trim() + (b < t.length ? "…" : "");
  }

  // La concordancia que enPalabras no hace. `resto` es el texto que sigue.
  function concordar(letras, resto) {
    let texto = letras;
    // "veintiuno mil", "treinta y uno millones": el uno se apocopa siempre
    // delante de mil y de millon.
    texto = texto.replace(/\bveintiuno(?= (?:mil|millones)\b)/g, "veintiún")
                 .replace(/\buno(?= (?:mil|millones)\b)/g, "un");

    if (!/(?:^|\s|veinti)uno$/.test(texto)) return { texto };

    const palabras = resto.trim().split(/\s+/);
    const sig = (palabras[0] || "").replace(/[,.;:)»”]+$/, "");
    const cierra = /^[\s]*[,.;:)»”]/.test(resto) || !sig;

    // "1 de marzo": en una resolucion se escribe "primero".
    if (texto === "uno" && /^de$/i.test(sig) && MESES.test((palabras[1] || "").replace(/[,.;:]+$/, ""))) {
      return { texto: "primero" };
    }
    if (cierra || /^de[l]?$/i.test(sig)) return { texto };
    const base = texto.slice(0, -3);
    if (MASCULINOS.test(sig)) return { texto: base + (base.endsWith("veinti") ? "ún" : "un") };
    if (FEMENINOS.test(sig)) return { texto: base + "una" };
    return { texto, revisar: `«${texto} ${sig}»: puede ir «un» o «una» según lo que sigue` };
  }

  const enLimpio = { limpiar };
  if (typeof module === "object" && module.exports) module.exports = enLimpio;
  else (raiz.Motor = raiz.Motor || {}).enLimpio = enLimpio;
})(typeof globalThis !== "undefined" ? globalThis : this);
