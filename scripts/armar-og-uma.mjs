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
// COMO SE HACE EL PNG SIN DEPENDENCIAS. El tipografiado de trazos y el formato
// escrito a mano viven en scripts/png-trazos.mjs, que comparte con
// scripts/armar-imagenes.mjs. El porque esta alla.
//
// SE CORRE A MANO, como npm run feriados o la carga de las series:
//   npm run og-uma
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import { crearLienzo, anchoTexto } from './png-trazos.mjs';

const ANCHO = 1200;
const ALTO = 630;

// Los mismos tokens del sistema visual, en su version oscura: la tarjeta que
// arma WhatsApp va sobre fondo claro y la imagen tiene que recortarse sola.
const FONDO = [13, 15, 19];        // --bg oscuro
const TINTA = [237, 239, 243];     // --fg oscuro
const ACENTO = [122, 153, 255];    // --accent oscuro
const TENUE = [130, 138, 152];     // --faint oscuro

const { rect, escribir, png: armarPng } = crearLienzo(ANCHO, ALTO);

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

const png = armarPng();

fs.writeFileSync('assets/og-uma.png', png);
console.log('assets/og-uma.png · ' + ANCHO + 'x' + ALTO + ' · ' +
  Math.round(png.length / 1024) + ' KB');
console.log('  UMA  ' + plataUma + '  rige desde ' + mesAnio(uma.vigencia));
console.log('  UHOM ' + plataUhom + '  rige desde ' + mesAnio(uhom.vigencia));
console.log('\nSe regenera cuando se cargue un valor nuevo en las series.');
