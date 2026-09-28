(function(raiz) {
  "use strict";
  const M = raiz.Motor || {};
  const py = M.py || require("./py.js");
  const zonas = M.zonas || require("./zonas.js");
  const r = String.raw;
  const RUBROS = [["a", "auto que declara los herederos", [r`declarar\s+en\s+cuanto\s+ha\s+lugar`, r`declar[oó]\s+que\s+por\s+fallecimiento`, r`le\s+sucede[nr]?\s+en\s+(?:el\s+)?car[áa]cter`, r`declaratoria\s+de\s+herederos\s+dictada`]], ["b", "auto que ordena la inscripción", [r`orden[oó]\s+la\s+inscripci[óo]n`, r`ordeno\s+la\s+inscripci[óo]n`, r`inscr[íi]base`, r`se\s+orden[ae]\s+la\s+inscripci[óo]n`, r`exp[íi]dase\s+(?:el\s+)?testimonio`, r`para\s+su\s+(?:presentaci[óo]n|inscripci[óo]n)\s+en\s+el\s+registro`]], ["c", "carátula del juicio, número de expediente y año", [r`s/\s*sucesi[óo]n`, r`\bsucesi[óo]n\s+ab[\s-]?intestato\b`, r`\[EXPTE\]`, r`\(\s*n?(?:ro|°|º)?\.?\s*\d{2,6}\s*/\s*\d{2,4}\s*\)`]], ["d", "juzgado y secretaría en que tramita", [r`juzgado\s+nacional\s+de\s+primera\s+instancia\s+en\s+lo\s+civil`, r`secretar[íi]a\s+[úu]nica`]], ["e", "individualización de los inmuebles", [r`unidad\s+funcional`, r`inmueble\s+(?:sito|ubicado|de\s+la\s+calle)`, r`bien\s+sito`]], ["f", "inscripción de dominio en el Registro", [r`matr[íi]cula`, r`\[MATRICULA\]`]], ["g", "clave de identificación tributaria de los herederos", [r`\bC\.?U\.?I\.?[TL]\.?\b`, r`clave\s+[úu]nica\s+de\s+identificaci[óo]n`, r`c[óo]digo\s+[úu]nico\s+de\s+identificaci[óo]n`, r`claves?\s+de\s+identificaci[óo]n\s+tributaria`, r`\[CUIT\]`]], ["h", "profesional matriculado autorizado al diligenciamiento", [r`autorizad[oa]s?\s+(?:para|a)\s+(?:correr\s+con\s+el\s+)?diligencia`, r`colegio\s+p[úu]blico\s+(?:de\s+)?abogados`, r`se\s+encuentran?\s+autorizad`, r`C\.?P\.?A\.?C\.?F`, r`\bTomo\b[^.\n]{0,60}\bFolio\b`]]];
  const LEYENDAS = [["firma digital", "la leyenda de firma electrónica del punto 2.1 del protocolo", [r`se\s+suscribe\s+electr[óo]nicamente`, r`eximid[oa]\s+de\s+(?:la\s+)?colocaci[óo]n\s+de\s+sello`]], ["autenticidad", "la leyenda de constatación de autenticidad, si la causa es de consulta pública", [r`constatar\s+su\s+autenticidad`, r`pjn\.gov\.ar`]]];
  const TRANSCRIPCION_AUTO = [r`\b(?:autos?|resoluci[óo]n(?:es)?|proveidos?|proveídos?|providencias?|` + r`decretos?)\s+que\s+(?:lo\s+|la\s+|los\s+)?ordenan?`, r`\bque\s+ordenan?\s+(?:el|la)\s+presente`, r`\bse\s+transcribe`, r`\bdicen?\s*:\s*[«“\"]`];
  const CARATULA = [r`autos\s+caratulados`, r`\bexpte?\.?\s*n`, r`\bexpediente\s+n`, r`\b\d{1,6}\s*/\s*(?:19|20)\d{2}\b`, r`\[EXPTE\]`];
  const JUZGADO = [r`juzgado\s+nacional\s+de\s+primera\s+instancia\s+en\s+lo\s+civil`, r`juzgado\s+(?:nacional\s+)?(?:en\s+lo\s+)?civil\s+n`, r`secretar[íi]a\s+(?:[úu]nica|n)`];
  const RUBROS_OFICIO = [["a", "destinatario", [r`\b(?:se[ñn]or(?:a|es)?|sr(?:a|es)?\.?)\s+(?:gerente|presidente|` + r`director|jefe|titular|responsable|encargad|juez|fiscal)`, r`^\s*(?:al|a\s+la)\s+(?:se[ñn]or|sr|banco|gerente|presidente|` + r`director|jefe|titular|registro)`, r`\bbanco\s+(?:central|de\s+la\s+naci[óo]n|de\s+la\s+ciudad)`]], ["b", "juzgado y secretaría en que tramita", JUZGADO], ["c", "carátula y número de expediente", CARATULA], ["d", "la transcripción del auto que ordena la medida", TRANSCRIPCION_AUTO], ["e", "el objeto de la medida", [r`\bembarg`, r`\binhib`, r`\bs[íi]rvase\b`, r`\ba\s+fin\s+de\b`, r`\bal\s+efecto\s+de\b`, r`\ba\s+los\s+efectos\s+de\b`]], ["f", "profesional autorizado al diligenciamiento", [r`autorizad[oa]s?\s+(?:para|a)\s+(?:correr\s+con\s+el\s+)?(?:el\s+)?` + r`diligencia`, r`colegio\s+p[úu]blico\s+(?:de\s+)?abogados`, r`se\s+encuentran?\s+autorizad`, r`queda[n]?\s+autorizad`, r`C\.?P\.?A\.?C\.?F`, r`\bTomo\b[^.\n]{0,60}\bFolio\b`]]];
  const LEY_22172 = [r`\b22\.?172\b`, r`veintid[óo]s\s+mil\s+ciento\s+setenta\s+y\s+dos`];
  const AL_RPI = [r`registro\s+(?:nacional\s+)?de\s+la\s+propiedad\s+inmueble`, r`\bR\.?\s?P\.?\s?I\.?\b`];
  const SOBRE_INMUEBLE = [r`\bembarg`, r`\blitis\b`, r`prohibici[óo]n\s+de\s+(?:innovar|contratar)`, r`\b(?:el|del|los|un|al)\s+inmuebles?\b`];
  const EMBARGO = [r`\bembarg`];
  const INHIBICION = [r`\binhibici[óo]n`];
  const LEVANTAMIENTO = [r`\blevantamiento`, r`\bl[eé]vantese\b`, r`\bdejar\s+sin\s+efecto`];
  const CONDICIONALES_OFICIO = [["22.172", "la constancia de competencia en razón de la materia (art. 3 de la ley 22.172)", [LEY_22172], [r`competente\s+en\s+raz[óo]n\s+de\s+la\s+materia`]], ["RPI e", "el inmueble sobre el que se hace efectiva la medida (RPI, medidas cautelares, e)", [AL_RPI, SOBRE_INMUEBLE], [r`inmueble\s+(?:ubicado|sito)`, r`\bde\s+la\s+calle\b`, r`nomenclatura\s+catastral`, r`unidad\s+funcional`, r`\[DOMICILIO\]`]], ["RPI e/g", "la titularidad de dominio, o que la medida es con prescindencia de titularidad (RPI, medidas cautelares, e y g)", [AL_RPI, SOBRE_INMUEBLE], [r`\btitularidad\b`, r`\btitular(?:es)?\s+(?:de\s+dominio|registral)`, r`\ba\s+nombre\s+de\b`, r`\bprescindencia\b`]], ["RPI f", "la inscripción de dominio del inmueble en el Registro (RPI, medidas cautelares, f)", [AL_RPI, SOBRE_INMUEBLE], [r`matr[íi]cula`, r`\bfolio\s+real\b`, r`\[MATRICULA\]`]], ["RPI h", "el monto de la medida, o que es sin monto (RPI, medidas cautelares, h)", [AL_RPI, EMBARGO], [r`\$\s*\d`, r`\bpesos\b`, r`\bsin\s+monto\b`]], ["RPI f-j", "el documento de identidad del inhibido, o los datos de inscripción si es una persona jurídica (RPI, inhibiciones, f a j)", [AL_RPI, INHIBICION], [r`\bD\.?\s?N\.?\s?I\b`, r`documento\s+(?:nacional\s+)?de\s+identidad`, r`\bpasaporte\b`, r`c[ée]dula\s+de\s+identidad`, r`libreta\s+(?:de\s+enrolamiento|c[íi]vica)`, r`\bL\.\s?[EC]\.`, r`\bC\.?U\.?I\.?[TL]\b`, r`\[DNI\]`, r`\[CUIT\]`, r`inscript[ao]\s+en\s+(?:la\s+)?(?:inspecci[óo]n|I\.?G\.?J)`]], ["RPI lev.", "el número y la fecha de inscripción de la medida que se levanta (RPI, levantamientos)", [AL_RPI, LEVANTAMIENTO], [r`presentaci[óo]n\s+(?:n|nro|n[úu]mero)`, r`inscript[ao]s?\s+bajo`, r`n[úu]mero\s+de\s+presentaci[óo]n`, r`\bbajo\s+(?:la\s+)?presentaci[óo]n`, r`\bentrada\s+(?:n|nro|n[úu]mero)`]]];
  const RUBROS_MANDAMIENTO = [["a", "el oficial de justicia que lo diligencia", [r`oficial\s+de\s+justicia`, r`oficial\s+notificador`, r`\bujier\b`, r`oficina\s+de\s+mandamientos`]], ["b", "el domicilio donde se constituye", [r`se\s+constituir[áa]`, r`\bsito\s+en\b`, r`domicilio\s+(?:ubicado|sito)`, r`\[DOMICILIO\]`]], ["c", "el carácter del domicilio (real, constituido, especial…)", [r`domicilio\s+(?:real|constituido|especial|legal|denunciado|procesal|` + r`contractual|convencional|fiscal|electr[óo]nico)`]], ["d", "carátula y número de expediente", CARATULA], ["e", "juzgado y secretaría en que tramita", JUZGADO], ["f", "la diligencia que se ordena", [r`\bintim`, r`\bembarg`, r`\bsecuestr`, r`\bdesaloj`, r`\blanzamiento`, r`\bconstat`, r`\bnotific`, r`\ballanamiento`]], ["g", "la transcripción del auto que lo ordena", TRANSCRIPCION_AUTO]];
  const INTIMACION_DE_PAGO = [r`intimaci[óo]n\s+de\s+pago`, r`\bd[ée]\s+y\s+pague\b`];
  const CONDICIONALES_MANDAMIENTO = [["pago", "el monto por el que se intima", [INTIMACION_DE_PAGO], [r`\$\s*\d`, r`\bpesos\b`]], ["remate", "la citación de remate para oponer excepciones", [INTIMACION_DE_PAGO], [r`cita(?:do|ci[óo]n)\s+de\s+remate`]], ["domicilio", "el emplazamiento a constituir domicilio", [INTIMACION_DE_PAGO], [r`constituir\s+domicilio`]], ["embargo", "el monto por el que se traba el embargo", [[r`\bembarg`]], [r`\$\s*\d`, r`\bpesos\b`, r`\bsin\s+monto\b`]]];
  const LISTAS = { testimonio: [RUBROS, []], oficio: [RUBROS_OFICIO, CONDICIONALES_OFICIO], mandamiento: [RUBROS_MANDAMIENTO, CONDICIONALES_MANDAMIENTO] };
  const SOLO_EN_EL_CUERPO = { mandamiento: new Set(["c"]) };
  function hay(patrones, texto) {
    return patrones.some((p) => py.re(p, "IM").search(texto) !== null);
  }
  function controlar(texto, tipo = "testimonio") {
    const [rubros, condicionales] = LISTAS[tipo];
    const cuerpo = zonas.cuerpoYAutos(texto)[0];
    const soloCuerpo = SOLO_EN_EL_CUERPO[tipo] || new Set();
    const salida = [];
    for (const [clave, exigencia, patrones] of rubros) {
      const donde = soloCuerpo.has(clave) ? cuerpo : texto;
      salida.push([clave, exigencia, hay(patrones, donde)]);
    }
    for (const [clave, exigencia, condiciones, patrones] of condicionales) {
      if (condiciones.every((c) => hay(c, texto))) {
        salida.push([clave, exigencia, hay(patrones, texto)]);
      }
    }
    for (const [clave, exigencia, patrones] of LEYENDAS) {
      salida.push([clave, exigencia, hay(patrones, texto)]);
    }
    return salida;
  }
  const checklist = { LISTAS, controlar };
  if (typeof module === "object" && module.exports) module.exports = checklist;
  else M.checklist = checklist;
})(typeof globalThis !== "undefined" ? globalThis : this);
