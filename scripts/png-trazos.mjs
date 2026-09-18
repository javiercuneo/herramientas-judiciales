// ---------------------------------------------------------------------------
// Dibujar un PNG sin dependencias: una grilla de pixeles, un tipografiado de
// trazos rectos y el formato escrito a mano.
//
// Lo usan los dos scripts que arman imagenes del sitio:
//   scripts/armar-og-uma.mjs       la imagen de enlace de uma-uhom.html
//   scripts/armar-imagenes.mjs     el icono y las imagenes de enlace del resto
//
// POR QUE A MANO. No hay libreria de imagenes en este repositorio y no se va a
// agregar una para esto. Node trae zlib, que es lo unico dificil del formato:
// el resto son cabeceras. Las letras son rectangulos en una grilla de 5 x 7,
// que es todo lo que hace falta para un titulo, digitos y un pie.
//
// Estuvo adentro de armar-og-uma.mjs hasta el 18/9/2026, cuando hizo falta un
// segundo script. Se saco a un modulo en vez de copiarse: dos tipografiados
// iguales en dos archivos se desincronizan, y el dia que se corrige una letra
// se corrige en uno solo. Al mudarlo se comprobo que og-uma.png salia identica
// byte por byte.
// ---------------------------------------------------------------------------

import zlib from 'node:zlib';

// Cada glifo es una grilla de 5 de ancho por 7 de alto. Solo mayusculas:
// escribir() pasa el texto a mayusculas antes de dibujar.
export const G = {
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
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
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
  'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  'Q': ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  'W': ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  'X': ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  'Z': ['11111', '00010', '00010', '00100', '01000', '10000', '11111'],
  '·': ['00000', '00000', '00000', '00100', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000']
};

// Las vocales con tilde son la letra base mas una marca ARRIBA de la grilla, en
// las filas -3 y -2: la fila -1 queda vacia para que la tilde no se pegue a la
// letra. Quien escribe con tildes tiene que dejar tres filas libres arriba.
const TILDADAS = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' };

// Las letras de un texto que este tipografiado no sabe dibujar. escribir() las
// deja en blanco sin decir nada ---asi salio 'MARKDO N' la primera vez---, asi
// que un script que escribe texto fijo lo pregunta antes y aborta.
export function sinGlifo(texto) {
  return [...new Set([...texto.toUpperCase()].filter((ch) => !G[ch] && !TILDADAS[ch]))];
}

export function anchoTexto(texto, escala, esp) {
  return texto.length * (5 * escala + esp) - esp;
}

// canales: 3 (RGB) o 4 (RGBA). Los colores se pasan con la misma cantidad.
export function crearLienzo(ancho, alto, canales = 3) {
  const px = Buffer.alloc(ancho * alto * canales);

  function pintar(x, y, color) {
    if (x < 0 || y < 0 || x >= ancho || y >= alto) return;
    const i = (y * ancho + x) * canales;
    for (let c = 0; c < canales; c++) px[i + c] = color[c];
  }

  // El primer canal del pixel, o 0 fuera del lienzo.
  function leer(x, y) {
    if (x < 0 || y < 0 || x >= ancho || y >= alto) return 0;
    return px[(y * ancho + x) * canales];
  }

  function rect(x, y, w, h, color) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) pintar(i, j, color);
  }

  function escribir(texto, x, y, escala, color, esp) {
    esp = esp === undefined ? escala * 2 : esp;
    let cx = x;
    for (const ch of texto.toUpperCase()) {
      const base = TILDADAS[ch];
      const g = G[base || ch] || G[' '];
      for (let fila = 0; fila < 7; fila++) {
        for (let col = 0; col < 5; col++) {
          if (g[fila][col] === '1') rect(cx + col * escala, y + fila * escala, escala, escala, color);
        }
      }
      if (base) {
        rect(cx + 3 * escala, y - 3 * escala, escala, escala, color);
        rect(cx + 2 * escala, y - 2 * escala, escala, escala, color);
      }
      cx += 5 * escala + esp;
    }
    return cx - esp;
  }

  // Formato: cabecera, IHDR, IDAT comprimido con zlib e IEND. Cada fila del
  // bitmap lleva adelante un byte de filtro en 0 ---sin filtro---, que es lo
  // que exige la especificacion.
  function png() {
    const fila = ancho * canales;
    const crudo = Buffer.alloc(alto * (1 + fila));
    for (let y = 0; y < alto; y++) {
      crudo[y * (1 + fila)] = 0;
      px.copy(crudo, y * (1 + fila) + 1, y * fila, (y + 1) * fila);
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(ancho, 0);
    ihdr.writeUInt32BE(alto, 4);
    ihdr[8] = 8;                          // bits por canal
    ihdr[9] = canales === 4 ? 6 : 2;      // color: RGBA o RGB
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      trozo('IHDR', ihdr),
      trozo('IDAT', zlib.deflateSync(crudo, { level: 9 })),
      trozo('IEND', Buffer.alloc(0))
    ]);
  }

  return { ancho, alto, pintar, leer, rect, escribir, png };
}

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
