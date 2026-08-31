#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Barrido de plazos del CPCCN sobre el TEXTO EXACTO de cada articulo.
//
// QUE HACE Y QUE NO. Lista cada mencion de un plazo con la ORACION LITERAL que
// la contiene, para que se cure a mano. NO decide si esa mencion es un plazo
// procesal de parte: hay edades ---arts. 234 y 426---, prescripciones, y plazos
// que corren contra el juez y no contra la parte ---art. 34---. Eso lo separa
// una persona leyendo, y el resultado curado vive en data/plazos-cpccn.json.
//
// POR QUE ASI Y NO PIDIENDOSELO A UN MODELO. Un modelo devuelve la tabla
// completa y bien ordenada, y ahi esta el problema: una fila inventada es
// indistinguible de una buena, y lo que se publica es cuantos dias tiene un
// plazo procesal. Aca cada fila arrastra la oracion del articulo, asi que una
// fila mal leida se ve al leerla.
//
// EL CODIGO ESCRIBE LOS PLAZOS DE CUATRO FORMAS, y hay que barrer las cuatro.
// La primera version de este barrido solo cubria la primera y perdio 63
// articulos ---entre ellos el art. 150, que es EL plazo de traslados, y el 124,
// que es el plazo de gracia---. Lo cazo cruzar el resultado contra una pasada
// previa hecha con otro modelo, que tenia peor precision y mejor cobertura:
//
//   1. "QUINCE (15) dias"       palabra + numeral entre parentesis
//   2. "sera de cinco dias"     el numero escrito con letras, sin numeral
//   3. "dentro de tercero dia"  ORDINAL en singular, que es como el Codigo
//                               escribe los plazos cortos de tramite
//   4. "DOS (2) primeras horas" con un adjetivo metido en el medio
//
// FUENTE: el texto por articulo del repositorio hermano `indice`, que no vive
// aca. Por eso esto NO corre en CI: se corre a mano cuando hay que rehacer el
// barrido, y lo que se versiona es el resultado curado.
//
//   node scripts/barrer-plazos-cpccn.mjs [ruta] > barrido.md   para revisar
//   node scripts/barrer-plazos-cpccn.mjs [ruta] --json          regenera el dato
// ---------------------------------------------------------------------------

import fs from 'node:fs';

// La ruta es el primer argumento que NO empiece con guion: si no se filtran las
// banderas, `--json` termina siendo la ruta del archivo de entrada.
const FUENTE = process.argv.slice(2).find((a) => !a.startsWith('-')) ||
               'C:/IA/indice/datos/obras/cpccn.jsonl';

// Los compuestos ---veinticuatro, veintiocho--- estan porque el Codigo los usa:
// el art. 138 dice "dentro de las veinticuatro horas", y sin ellos ese plazo no
// aparece en ninguna forma. Van ANTES que sus simples en la alternancia de la
// expresion regular, porque "veinte" matchearia el principio de "veinticuatro".
const CARDINALES = {
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, 'veintiséis': 26,
  veintisiete: 27, veintiocho: 28, veintinueve: 29, veintiuno: 21,
  'veintiún': 21, veintiuna: 21, veintidos: 22, 'veintidós': 22, veintitres: 23,
  'veintitrés': 23,
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13,
  catorce: 14, quince: 15, veinte: 20, treinta: 30, cuarenta: 40,
  cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100
};

// Entre el numero y la unidad el Codigo mete a veces un adjetivo, y el plazo de
// gracia es justamente uno de esos: el art. 124 dice "dentro de las DOS (2)
// PRIMERAS horas del despacho", que es la norma que esta calculadora cita en
// cada resultado. La lista es corta a proposito: aceptar "cualquier palabra"
// entre el numero y la unidad convierte "5 testigos por parte" en un plazo.
const INTERMEDIO = '(?:primer[ao]s?|[uú]ltim[ao]s?|h[aá]biles|corrid[ao]s|' +
                   'siguientes|posteriores|completos?)\\s+';

const ORDINALES = {
  primero: 1, primer: 1, segundo: 2, tercero: 3, tercer: 3, cuarto: 4,
  quinto: 5, sexto: 6, septimo: 7, 'séptimo': 7, octavo: 8, noveno: 9,
  decimo: 10, 'décimo': 10
};

const UNIDAD = 'd[ií]as?|meses|mes|horas?|años?|minutos?';

// Las cuatro formas, en un solo barrido para que el orden de aparicion se
// conserve y una mencion no se cuente dos veces.
//
// EL \b DEL FINAL DE CADA UNIDAD NO ES ADORNO: sin el, "en un diario de los de
// mayor circulacion" ---art. 146--- sale como un plazo de "1 dia", porque "dia"
// esta adentro de "diario". Es la clase de fila que en una tabla de doscientas
// parece un plazo mas.
const PATRON = new RegExp(
  '(?:' +
    // 1. QUINCE (15) dias  /  DOS (2) primeras horas
    '\\b[A-Za-zÁÉÍÓÚÑáéíóúñ]+\\s*\\(\\s*(\\d{1,3})\\s*\\)\\s*(?:' + INTERMEDIO + ')?(' + UNIDAD + ')\\b' +
  '|' +
    // 2. 15 dias
    '\\b(\\d{1,3})\\s+(?:' + INTERMEDIO + ')?(' + UNIDAD + ')\\b' +
  '|' +
    // 3. cinco dias  /  veinticuatro horas
    '\\b(' + Object.keys(CARDINALES).join('|') + ')\\s+(?:' + INTERMEDIO + ')?(' + UNIDAD + ')\\b' +
  '|' +
    // 4. dentro de tercero dia  ---el ordinal va DELANTE de la unidad igual,
    //    pero en singular y sin numeral: "dentro del segundo dia"
    '\\b(' + Object.keys(ORDINALES).join('|') + ')\\s+(d[ií]a|mes|hora|año)\\b' +
  ')', 'gi'
);

function normalizarUnidad(u) {
  const s = u.toLowerCase();
  if (s.startsWith('dia') || s.startsWith('día')) return 'días';
  if (s.startsWith('mes')) return 'meses';
  if (s.startsWith('hora')) return 'horas';
  if (s.startsWith('minuto')) return 'minutos';
  return 'años';
}

// La oracion que contiene la mencion. Se corta por punto y no por renglon: los
// incisos del Codigo son un solo parrafo largo y cortar por renglon devuelve el
// articulo entero.
function oracionDe(texto, indice, largo) {
  let ini = texto.lastIndexOf('.', indice);
  ini = ini < 0 ? 0 : ini + 1;
  let fin = texto.indexOf('.', indice + largo);
  fin = fin < 0 ? texto.length : fin + 1;
  return texto.slice(ini, fin).replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// LA CURACION, que es lo unico de este archivo que no sale del barrido.
//
// El barrido no puede saber que "Traslado de la demanda" es el nombre con el
// que alguien lo busca, ni que los cinco dias de excepciones son los del
// ejecutivo. Eso son cuatro atajos y unas notas, y viven aca para que
// regenerar el JSON no las pise. La clave es cita|cantidad|unidad.
//
// Todo lo demas ---los dias, el articulo, la oracion--- sale del texto y no se
// escribe a mano en ningun lado.
// ---------------------------------------------------------------------------
const CURADO = {
  'art. 338 CPCCN|15|días': {
    rotulo: 'Traslado de la demanda',
    atajo: {
      orden: 1,
      rotulo: 'Traslado de la demanda',
      detalle: 'traslado de la demanda en el juicio ordinario (art. 338 CPCCN). Contra el Estado nacional, una provincia o una municipalidad son sesenta, por el mismo artículo'
    }
  },
  'art. 338 CPCCN|60|días': {
    rotulo: 'Traslado de la demanda contra el Estado nacional, una provincia o un municipio'
  },
  'art. 257 CPCCN|10|días': {
    rotulo: 'Recurso extraordinario federal: interposición y traslado',
    atajo: {
      orden: 2,
      rotulo: 'Traslado del recurso extraordinario',
      detalle: 'traslado del recurso extraordinario federal (art. 257 CPCCN, párrafo segundo). El plazo para interponerlo también es de diez, por el primer párrafo'
    }
  },
  'art. 244 CPCCN|5|días': {
    rotulo: 'Apelación',
    atajo: {
      orden: 3,
      rotulo: 'Apelación, traslados y vistas',
      detalle: 'apelación (art. 244 CPCCN), traslados y vistas salvo disposición en contrario (art. 150 CPCCN) y excepciones en el juicio ejecutivo (art. 542 CPCCN). En el ordinario las excepciones van con la contestación de la demanda, o sea dentro de los quince del art. 338'
    }
  },
  'art. 150 CPCCN|5|días': {
    rotulo: 'Traslados y vistas, salvo disposición en contrario'
  },
  'art. 542 CPCCN|5|días': {
    rotulo: 'Excepciones en el juicio ejecutivo',
    ojo: 'En el ordinario las excepciones no tienen plazo propio: van en el mismo escrito de contestación de la demanda (art. 346), o sea dentro de los quince del art. 338. Los cinco días son del ejecutivo.'
  },
  'art. 239 CPCCN|3|días': {
    rotulo: 'Revocatoria (reposición)',
    atajo: {
      orden: 4,
      rotulo: 'Revocatoria y plazos del sumarísimo',
      detalle: 'revocatoria o reposición (art. 239 CPCCN) y los plazos del juicio sumarísimo (art. 498, inc. 3 CPCCN), que excluye la contestación de la demanda y el memorial de apelación'
    }
  },
  'art. 498 CPCCN|3|días': {
    rotulo: 'Plazos del juicio sumarísimo',
    ojo: 'El propio inciso excluye la contestación de la demanda y el memorial de apelación: no todo plazo del sumarísimo es de tres días.'
  }
};

// Las unidades que entran al archivo de datos. Fuera quedan los años y los
// minutos, y NO es un descuido: los siete casos de años son edades ---arts. 234
// y 426---, antiguedad de matricula ---art. 563--- y terminos de prescripcion o
// caducidad que nadie escribe en un campo de dias habiles; el unico de minutos
// es la media hora de espera en una audiencia del art. 125. Estan en el barrido
// en markdown, que es donde se los mira.
const UNIDADES_QUE_ENTRAN = ['días', 'meses', 'horas'];

const lineas = fs.readFileSync(FUENTE, 'utf8').trim().split('\n');
const articulos = lineas.map((l) => JSON.parse(l));

const salida = [];
let menciones = 0;

for (const a of articulos) {
  const vistos = new Set();
  const filas = [];
  let m;
  PATRON.lastIndex = 0;

  while ((m = PATRON.exec(a.texto))) {
    let n, unidad, forma;
    if (m[1]) { n = +m[1]; unidad = m[2]; forma = 'numeral'; }
    else if (m[3]) { n = +m[3]; unidad = m[4]; forma = 'numeral'; }
    else if (m[5]) { n = CARDINALES[m[5].toLowerCase()]; unidad = m[6]; forma = 'letras'; }
    else { n = ORDINALES[m[7].toLowerCase()]; unidad = m[8]; forma = 'ordinal'; }

    unidad = normalizarUnidad(unidad);
    const clave = n + ' ' + unidad;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    filas.push({ n, unidad, forma, frase: oracionDe(a.texto, m.index, m[0].length) });
  }

  if (filas.length) {
    menciones += filas.length;
    salida.push({ ...a, filas });
  }
}

// ---------------------------------------------------------------------------
// MODO JSON: --json escribe data/plazos-cpccn.json, que es lo que consumen los
// atajos y el buscador de vencimientos.html.
//
// Se REGENERA, no se parchea: la curacion de arriba es lo unico escrito a mano,
// asi que volver a correr esto despues de que cambie el Codigo no pierde nada.
// ---------------------------------------------------------------------------
if (process.argv.includes('--json')) {
  const plazos = [];
  const sinCurar = new Set(Object.keys(CURADO));

  for (const a of salida) {
    for (const f of a.filas) {
      if (!UNIDADES_QUE_ENTRAN.includes(f.unidad)) continue;
      const clave = a.cita + '|' + f.n + '|' + f.unidad;
      const cur = CURADO[clave] || {};
      sinCurar.delete(clave);
      // El ROTULO va solo cuando esta curado. La rubrica del Codigo NO sirve
      // de rotulo: viene en mayusculas y SIN TILDES ---"Citacion de otros
      // causantes"--- y este repositorio no publica texto sin acentuar. Se
      // guarda igual porque es una buena clave de BUSQUEDA, y la busqueda
      // normaliza tildes de los dos lados.
      //
      // Y no hace falta un rotulo para que la fila diga algo: lo que contesta
      // la pregunta es la oracion literal del articulo, que si viene acentuada
      // porque es el texto de la ley.
      const fila = {
        cantidad: f.n,
        unidad: f.unidad,
        cita: a.cita,
        rubrica: a.rubrica || '',
        texto: f.frase,
        forma: f.forma
      };
      if (cur.rotulo) fila.rotulo = cur.rotulo;
      if (cur.atajo) fila.atajo = cur.atajo;
      if (cur.ojo) fila._ojo = cur.ojo;
      plazos.push(fila);
    }
  }

  // Una entrada curada que ya no matchea ninguna fila del barrido es una
  // curacion apuntando a un articulo que cambio de texto o de numero. No se
  // ignora en silencio: se aborta, porque el atajo perdido no se veria.
  if (sinCurar.size) {
    process.stderr.write('ABORTA: hay curación que no matchea ninguna fila del ' +
      'barrido, así que apunta a un texto que cambió:\n  ' +
      [...sinCurar].join('\n  ') + '\n');
    process.exit(1);
  }

  const doc = {
    _lo_que_es: 'Plazos del CPCCN, cada uno con el artículo del que sale y la ' +
      'oración literal que lo dice. Lo consumen los atajos y el buscador de ' +
      'calculadoras/vencimientos.html.',
    _de_donde_sale: 'Generado por scripts/barrer-plazos-cpccn.mjs --json sobre ' +
      'el texto exacto por artículo. El campo texto es transcripción y no ' +
      'resumen: es lo que permite discutir una entrada sin abrir el Código.',
    _sobre_la_rubrica: 'El campo rubrica es el encabezado del artículo tal como ' +
      'viene en el Código: en mayúsculas y sin tildes. Se usa para buscar y no ' +
      'se muestra como rótulo, porque nada sin acentuar se publica.',
    _lo_que_no_entra: 'Los años y los minutos. Los siete casos de años son ' +
      'edades (arts. 234 y 426), antigüedad de matrícula (art. 563) y términos ' +
      'que nadie escribe en un campo de días hábiles; el único de minutos es la ' +
      'media hora de espera del art. 125.',
    _ojo: 'Es un barrido mecánico y está EN DESARROLLO. Los números salen del ' +
      'texto, así que lo que puede pasar es que falte un plazo, no que uno esté ' +
      'mal. Lo que el barrido no distingue es qué plazo corre contra la PARTE y ' +
      'cuál contra el juez (art. 34) o el perito: por eso cada entrada se ' +
      'muestra con su oración literal, que lo dice sola.',
    estado: 'en desarrollo',
    actualizado: new Date().toISOString().slice(0, 10),
    plazos
  };

  fs.writeFileSync('data/plazos-cpccn.json', JSON.stringify(doc, null, 2) + '\n');
  process.stderr.write('data/plazos-cpccn.json: ' + plazos.length + ' plazos, ' +
    Object.keys(CURADO).length + ' curados\n');
  process.exit(0);
}

const L = [];
L.push('# Barrido de plazos del CPCCN');
L.push('');
L.push('Fuente: el texto exacto por artículo, ' + articulos.length + ' artículos.');
L.push('**' + salida.length + ' artículos** con alguna mención de plazo, **' +
       menciones + ' menciones distintas**.');
L.push('');
L.push('Cada fila trae la oración literal del artículo. Lo que hay que curar es');
L.push('cuáles son plazos procesales **de parte** ---los que sirven para la');
L.push('calculadora--- y cuáles no: edades, prescripciones, plazos que corren');
L.push('contra el juez, y menciones que no son plazos.');
L.push('');
L.push('La marca al final de cada fila dice **cómo estaba escrito** en el Código:');
L.push('`numeral` para «QUINCE (15) días», `letras` para «será de cinco días»,');
L.push('`ordinal` para «dentro de tercero día».');
L.push('');

for (const a of salida) {
  L.push('## ' + a.cita + (a.rubrica ? ' — ' + a.rubrica : '') +
         (a.estado_norma !== 'vigente' ? ' [' + a.estado_norma + ']' : ''));
  L.push('');
  for (const f of a.filas) {
    var u = f.n === 1 ? f.unidad.replace(/s$/, '').replace('mese', 'mes') : f.unidad;
    L.push('- **' + f.n + ' ' + u + '** — ' + f.frase + '  `' + f.forma + '`');
  }
  L.push('');
}

process.stdout.write(L.join('\n'));
process.stderr.write('artículos: ' + salida.length + '  menciones: ' + menciones + '\n');
