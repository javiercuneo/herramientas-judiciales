#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Arma assets/og-uma.png: la imagen que uma-uhom.html anuncia cuando se comparte
// el enlace en WhatsApp, LinkedIn o donde sea.
//
// POR QUE SE GENERA Y NO SE DIBUJA A MANO. La imagen lleva el valor vigente de
// las dos unidades, y esos valores se mueven ---la UMA casi todos los meses---.
// Una imagen dibujada a mano queda vieja en silencio: el enlace sigue
// compartiendose y anuncia un numero que ya no rige. Generarla desde
// data/serie-uma.json y data/serie-uhom.json la ata a la misma fuente que la
// pagina, y regenerarla es un comando.
//
// Y LLEVA LA VIGENCIA AL LADO DEL NUMERO, que es la decision que importa. Sin
// ella, una imagen vieja compartida en un chat dice un numero equivocado con
// cara de actual; con ella dice "rige desde julio de 2026", que es una
// afirmacion que sigue siendo CIERTA aunque la imagen haya quedado atras. Es el
// mismo criterio con el que la pagina muestra desde cuando no se revisan las
// series en vez de afirmar que no hay un valor posterior.
//
// COMO SE HACE EL PNG SIN DEPENDENCIAS. No hay libreria de imagenes en este
// repositorio y no se va a agregar una para esto. El script escribe el PNG a
// mano: arma la grilla de pixeles, la comprime con zlib ---que viene en Node---
// y le pone las cabeceras del formato. Las letras salen de un tipografiado
// propio de trazos rectos, que es todo lo que hace falta para digitos, un signo
// de pesos y un puñado de palabras.
//
// SE CORRE A MANO, como npm run feriados o la carga de las series:
//   npm run og-uma
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import zlib from 'node:zlib';

const ANCHO = 1200;
const ALTO = 630;

// Los mismos tokens del sistema visual, en su version oscura: la tarjeta que
// arma WhatsApp va sobre fondo claro y la imagen tiene que recortarse sola.
const FONDO = [13, 15, 19];        // --bg oscuro
const TINTA = [237, 239, 243];     // --fg oscuro
const ACENTO = [122, 153, 255];    // --accent oscuro
const TENUE = [130, 138, 152];     // --faint oscuro

// ---------------------------------------------------------------------------
// Un tipografiado de trazos. Cada glifo es una lista de rectangulos en una
// grilla de 5 de ancho por 7 de alto, que despues se escala. Alcanza para lo
// que esta imagen dice y no pretende ser mas que eso.
// ---------------------------------------------------------------------------
const G = {
  '0': ['11111', '10001', '10001', '10001', '10001', '10001', '11111'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['11111', '00001', '00001', '11111', '10000', '10000', '11111'],
  '3': ['11111', '00001', '00001', '01111', '00001', '00001', '11111'],
  '4': ['10001', '10001', '10001', '11111', '00001', '00001', '00001'],
  '5': ['11111', '10000', '10000', '11111', '00001', '00001', '11111'],
  '6': ['11111', '10000', '10000', '11111', '10001', '10001', '11111'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['11111', '10001', '10001', '11111', '10001', '10001', '11111'],
  '9': ['11111', '10001', '10001', '11111', '00001', '00001', '11111'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '$': ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  'C': ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  'G': ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  'I': ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  'J': ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  'Z': ['11111', '00010', '00010', '00100', '01000', '10000', '11111'],
  'Ó': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  '·': ['00000', '00000', '00000', '00100', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000']
};

const lienzo = Buffer.alloc(ANCHO * ALTO * 3);

function pintar(x, y, color) {
  if (x < 0 || y < 0 || x >= ANCHO || y >= ALTO) return;
  const i = (y * ANCHO + x) * 3;
  lienzo[i] = color[0]; lienzo[i + 1] = color[1]; lienzo[i + 2] = color[2];
}

function rect(x, y, w, h, color) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) pintar(i, j, color);
}

function anchoTexto(texto, escala, esp) {
  return texto.length * (5 * escala + esp) - esp;
}

function escribir(texto, x, y, escala, color, esp) {
  esp = esp === undefined ? escala * 2 : esp;
  let cx = x;
  for (const ch of texto.toUpperCase()) {
    const g = G[ch] || G[' '];
    for (let fila = 0; fila < 7; fila++) {
      for (let col = 0; col < 5; col++) {
        if (g[fila][col] === '1') rect(cx + col * escala, y + fila * escala, escala, escala, color);
      }
    }
    cx += 5 * escala + esp;
  }
  return cx - esp;
}

// ---------------------------------------------------------------------------
// Los datos, de la misma fuente que la pagina.
// ---------------------------------------------------------------------------
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function ultimoVigente(serie) {
  // El ultimo cuya vigencia ya empezo, y no el ultimo del archivo: las dos
  // series se cargan por adelantado. Mismo criterio que usa la pagina.
  const hoy = new Date().toISOString().slice(0, 10);
  const vigentes = serie.valores.filter((v) => v.vigencia <= hoy);
  return vigentes.length ? vigentes[vigentes.length - 1] : serie.valores[serie.valores.length - 1];
}

function mesAnio(ymd) {
  const [a, m] = ymd.split('-');
  return MESES[parseInt(m, 10) - 1] + ' de ' + a;
}

const uma = ultimoVigente(JSON.parse(fs.readFileSync('data/serie-uma.json', 'utf8')));
const uhom = ultimoVigente(JSON.parse(fs.readFileSync('data/serie-uhom.json', 'utf8')));

// ---------------------------------------------------------------------------
// El dibujo.
// ---------------------------------------------------------------------------
rect(0, 0, ANCHO, ALTO, FONDO);
// Una banda de acento arriba, que es lo unico decorativo y lo que hace que la
// tarjeta se reconozca como del sitio.
rect(0, 0, ANCHO, 10, ACENTO);

escribir('VALOR VIGENTE', 80, 90, 4, TENUE, 10);

// La UMA, que es el numero por el que se comparte esta pagina.
escribir('UMA', 80, 170, 7, ACENTO, 14);
const plataUma = '$' + uma.valor.toLocaleString('es-AR');
escribir(plataUma, 80, 240, 14, TINTA, 12);
// La vigencia va PEGADA al numero y no al pie: es lo que hace que una imagen
// vieja compartida en un chat siga diciendo algo cierto.
escribir('RIGE DESDE ' + mesAnio(uma.vigencia).toUpperCase(), 80, 370, 4, TENUE, 10);

// El UHOM, mas chico: es la segunda unidad y la pagina lo trata asi.
escribir('UHOM', 80, 450, 5, ACENTO, 10);
const plataUhom = '$' + uhom.valor.toLocaleString('es-AR');
const finUhom = escribir(plataUhom, 80, 495, 7, TINTA, 8);
escribir('DESDE ' + mesAnio(uhom.vigencia).toUpperCase(), finUhom + 40, 510, 3, TENUE, 8);

const pie = 'JAVIERCUNEO.COM.AR';
escribir(pie, ANCHO - 80 - anchoTexto(pie, 3, 8), 555, 3, TENUE, 8);

// ---------------------------------------------------------------------------
// El PNG, escrito a mano. Formato: cabecera, IHDR, IDAT comprimido con zlib e
// IEND. Cada fila del bitmap lleva adelante un byte de filtro en 0 ---sin
// filtro---, que es lo que exige la especificacion.
// ---------------------------------------------------------------------------
function crc32(buf) {
  let c, tabla = crc32.tabla;
  if (!tabla) {
    tabla = crc32.tabla = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tabla[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = tabla[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

const crudo = Buffer.alloc(ALTO * (1 + ANCHO * 3));
for (let y = 0; y < ALTO; y++) {
  crudo[y * (1 + ANCHO * 3)] = 0;
  lienzo.copy(crudo, y * (1 + ANCHO * 3) + 1, y * ANCHO * 3, (y + 1) * ANCHO * 3);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(ANCHO, 0);
ihdr.writeUInt32BE(ALTO, 4);
ihdr[8] = 8;   // bits por canal
ihdr[9] = 2;   // color: RGB
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  trozo('IHDR', ihdr),
  trozo('IDAT', zlib.deflateSync(crudo, { level: 9 })),
  trozo('IEND', Buffer.alloc(0))
]);

fs.writeFileSync('assets/og-uma.png', png);
console.log('assets/og-uma.png · ' + ANCHO + 'x' + ALTO + ' · ' +
  Math.round(png.length / 1024) + ' KB');
console.log('  UMA  ' + plataUma + '  rige desde ' + mesAnio(uma.vigencia));
console.log('  UHOM ' + plataUhom + '  rige desde ' + mesAnio(uhom.vigencia));
console.log('\nSe regenera cuando se cargue un valor nuevo en las series.');
