#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Arma las imagenes fijas del sitio:
//
//   favicon.ico            el icono de la pestania. Va en la RAIZ del sitio
//                          porque el navegador lo pide ahi solo, aunque la
//                          pagina no lo nombre; hasta el 18/9/2026 esa pedida
//                          devolvia el 404 entero en cada pagina.
//   assets/favicon.svg     el mismo icono en vectores, para pantallas densas.
//   assets/icono-180.png   el que usa el iPhone al guardar la pagina en la
//                          pantalla de inicio.
//   assets/og/<id>.png     la imagen que muestra WhatsApp o LinkedIn cuando se
//                          comparte el enlace de cada herramienta.
//
// Escribiente no usa este icono: tiene el suyo en escribiente/, que es el que
// instala como aplicacion, y la pestania muestra el mismo.
// uma-uhom.html tampoco usa estas imagenes de enlace: la suya lleva el valor
// vigente y la arma npm run og-uma.
//
// El icono son las iniciales, J y C, con el mismo tipografiado de trazos que
// las imagenes de enlace. Un tipografiado de pixeles es justo lo que se lee a
// 16 px: cada trazo cae sobre un pixel entero y no hay suavizado que lo borronee.
//
// SE CORRE A MANO y los resultados se versionan, como og-uma:
//   npm run imagenes
// Hay que correrlo si cambia el nombre de una herramienta o se agrega una. Un
// cambio en la lista de abajo sin correrlo deja la imagen vieja, y nada falla.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import { crearLienzo, anchoTexto, sinGlifo } from './png-trazos.mjs';

// El acento del tema claro, que es el color de la marca y el theme-color de
// Escribiente, con las letras en blanco. En la pestania el icono se ve sobre
// fondos claros y oscuros, asi que lleva su propio fondo.
const ACENTO_CLARO = [30, 69, 206];   // --accent claro, #1e45ce
const BLANCO = [255, 255, 255];

// Las imagenes de enlace, con los tokens oscuros: los mismos que og-uma.
const FONDO = [13, 15, 19];        // --bg oscuro
const TINTA = [237, 239, 243];     // --fg oscuro
const ACENTO = [122, 153, 255];    // --accent oscuro
const TENUE = [130, 138, 152];     // --faint oscuro

// ---------------------------------------------------------------------------
// Las paginas. El titulo es el mismo que dice la pagina; la segunda linea, la
// norma o lo que la pagina dice de si misma en su bajada. No se escribe aca
// nada que la pagina no diga.
// ---------------------------------------------------------------------------
const PAGINAS = [
  { id: 'tablero', titulo: 'Tablero de herramientas', linea: 'Plazos, honorarios y tasa de justicia' },
  { id: 'vencimientos', titulo: 'Plazos judiciales', linea: 'Días hábiles judiciales · CPCCN' },
  { id: 'caducidad', titulo: 'Caducidad de instancia', linea: 'Art. 310 CPCCN' },
  { id: 'entre-fechas', titulo: 'Días entre dos fechas', linea: 'Hábiles judiciales o corridos' },
  { id: 'mora', titulo: 'Inicio de la mora', linea: 'Firmeza de la sentencia y plazo de pago' },
  { id: 'regresiva', titulo: 'Calculadora regresiva', linea: 'Desde qué día empezar para llegar a tiempo' },
  { id: 'distancia', titulo: 'Ampliación por distancia', linea: 'Art. 158 CPCCN · Acordada 5/2010' },
  { id: 'honorarios-mediacion', titulo: 'Honorarios del mediador', linea: 'Escala del decreto 1467/11, según el 2536/15' },
  { id: 'ejecucion-estado', titulo: 'Ejecución contra el Estado', linea: 'Art. 170 Ley 11.672 · Art. 22 Ley 23.982' },
  { id: 'prorrateo', titulo: 'Prorrateo del art. 730', linea: 'Código Civil y Comercial' },
  { id: 'tasa', titulo: 'Tasa de justicia', linea: 'Ley 23.898 · Tribunales nacionales' },
  { id: 'escribiente', titulo: 'Escribiente', linea: 'PDF a Markdown y anonimización' },
  { id: 'asistente-clasico', titulo: 'Asistente de honorarios', linea: 'Ley 27.423 · La versión original' },
  { id: 'documentacion', titulo: 'Guía de uso', linea: 'Qué hace cada herramienta, y qué no' }
];

// ---------------------------------------------------------------------------
// El icono: J y C sobre una grilla de 16 x 16. Las letras ocupan 11 x 7, asi
// que quedan 2 columnas a la izquierda y 3 a la derecha; la J no usa su primera
// columna salvo en el gancho, y a ojo quedan centradas.
// ---------------------------------------------------------------------------
const INI_X = 2;
const INI_Y = 4;

// Las tres celdas de cada esquina que caen afuera de un radio de 2.
function esquinaRedonda(x, y, lado) {
  const dx = Math.min(x, lado - 1 - x);
  const dy = Math.min(y, lado - 1 - y);
  return dx + dy < 2;
}

function icono(escala, redondo) {
  const lado = 16 * escala;
  const l = crearLienzo(lado, lado, 4);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (redondo && esquinaRedonda(x, y, 16)) continue;
      l.rect(x * escala, y * escala, escala, escala, [...ACENTO_CLARO, 255]);
    }
  }
  l.escribir('JC', INI_X * escala, INI_Y * escala, escala, [...BLANCO, 255], escala);
  return l.png();
}

function iconoSvg() {
  // Mismas celdas que el PNG, como rectangulos de 1 x 1.
  const l = crearLienzo(16, 16, 1);
  l.escribir('JC', INI_X, INI_Y, 1, [1], 1);
  let celdas = '';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (l.leer(x, y)) celdas += 'M' + x + ' ' + y + 'h1v1h-1z';
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">' +
    '<rect width="16" height="16" rx="2" fill="#1e45ce"/>' +
    '<path fill="#fff" d="' + celdas + '"/></svg>\n';
}

// El .ico moderno puede llevar PNG adentro, y todos los navegadores actuales lo
// leen: cabecera de 6 bytes, una entrada de 16 por imagen, y las imagenes.
function ico(pngs) {
  const cab = Buffer.alloc(6);
  cab.writeUInt16LE(0, 0);
  cab.writeUInt16LE(1, 2);            // tipo: icono
  cab.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entradas = pngs.map(({ lado, png }) => {
    const e = Buffer.alloc(16);
    e[0] = lado; e[1] = lado;         // 0 significaria 256
    e[2] = 0; e[3] = 0;
    e.writeUInt16LE(1, 4);            // planos
    e.writeUInt16LE(32, 6);           // bits por pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([cab, ...entradas, ...pngs.map((p) => p.png)]);
}

// ---------------------------------------------------------------------------
// Las imagenes de enlace. Mismo esqueleto que og-uma: banda de acento arriba,
// una linea tenue, lo principal grande, y el dominio al pie.
// ---------------------------------------------------------------------------
const ANCHO = 1200;
const ALTO = 630;
const MARGEN = 80;
const UTIL = ANCHO - 2 * MARGEN;

// Parte el titulo en lineas que entren a esa escala. Devuelve null si no entra
// en dos.
function partir(texto, escala) {
  const palabras = texto.split(' ');
  const lineas = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? actual + ' ' + p : p;
    if (anchoTexto(prueba, escala, escala) <= UTIL) actual = prueba;
    else if (!actual) return null;
    else { lineas.push(actual); actual = p; }
  }
  lineas.push(actual);
  return lineas.length <= 2 ? lineas : null;
}

function imagenDeEnlace({ titulo, linea }) {
  const { rect, escribir, png } = crearLienzo(ANCHO, ALTO);
  rect(0, 0, ANCHO, ALTO, FONDO);
  rect(0, 0, ANCHO, 10, ACENTO);

  escribir('HERRAMIENTAS PARA LA PRÁCTICA JUDICIAL', MARGEN, 90, 3, TENUE, 8);

  // La escala mas grande a la que el titulo entra en una o dos lineas, y a la
  // que el bloque ---titulo y linea de abajo--- no pisa el pie. Entre linea y
  // linea del titulo van 5 filas: 3 para las tildes y 2 de aire.
  const ARRIBA = 180;
  const PIE = 490;
  const alto = (n, e) => (n - 1) * 12 * e + 7 * e + 50 + 7 * 4;
  let escala = 16, lineas;
  while (!(lineas = partir(titulo, escala)) || ARRIBA + alto(lineas.length, escala) > PIE) escala--;
  let y = ARRIBA;
  for (const l of lineas) {
    escribir(l, MARGEN, y, escala, TINTA, escala);
    y += 12 * escala;
  }
  y += 7 * escala - 12 * escala + 50;

  const escLinea = anchoTexto(linea, 4, 8) <= UTIL ? 4 : 3;
  escribir(linea, MARGEN, y, escLinea, ACENTO, 8);

  // El icono al pie, a la izquierda, y el dominio a la derecha.
  const lado = 4;
  for (let j = 0; j < 16; j++) {
    for (let i = 0; i < 16; i++) {
      if (!esquinaRedonda(i, j, 16)) rect(MARGEN + i * lado, 530 + j * lado, lado, lado, ACENTO);
    }
  }
  escribir('JC', MARGEN + INI_X * lado, 530 + INI_Y * lado, lado, FONDO, lado);
  const pie = 'JAVIERCUNEO.COM.AR';
  escribir(pie, ANCHO - MARGEN - anchoTexto(pie, 3, 8), 555, 3, TENUE, 8);

  return { escala, lineas: lineas.length, png: png() };
}

// ---------------------------------------------------------------------------

fs.writeFileSync('favicon.ico', ico([
  { lado: 16, png: icono(1, true) },
  { lado: 32, png: icono(2, true) },
  { lado: 48, png: icono(3, true) }
]));
fs.writeFileSync('assets/favicon.svg', iconoSvg());
// El iPhone redondea las esquinas por su cuenta: el cuadrado va lleno.
fs.writeFileSync('assets/icono-180.png', (() => {
  const l = crearLienzo(180, 180, 4);
  l.rect(0, 0, 180, 180, [...ACENTO_CLARO, 255]);
  // 11 x 7 celdas de 10 px, centradas.
  l.escribir('JC', 35, 55, 10, [...BLANCO, 255], 10);
  return l.png();
})());
console.log('favicon.ico, assets/favicon.svg, assets/icono-180.png');

for (const p of PAGINAS) {
  const faltan = sinGlifo(p.titulo + p.linea);
  if (faltan.length) {
    console.error(p.id + ': el tipografiado no tiene ' + faltan.join(' ') + '. Agregalas en png-trazos.mjs.');
    process.exit(1);
  }
}

fs.mkdirSync('assets/og', { recursive: true });
for (const p of PAGINAS) {
  const r = imagenDeEnlace(p);
  fs.writeFileSync('assets/og/' + p.id + '.png', r.png);
  console.log('assets/og/' + p.id + '.png · escala ' + r.escala + ', ' + r.lineas +
    (r.lineas === 1 ? ' línea' : ' líneas') + ' · ' + Math.round(r.png.length / 1024) + ' KB');
}
