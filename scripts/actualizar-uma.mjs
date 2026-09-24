#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Carga en data/serie-uma.json la UMA nueva, leida de la resolucion de la CSJN.
//
//   npm run uma            carga lo que haya y escribe el archivo
//   npm run uma -- --seco  dice lo que cargaria, sin escribir
//
// POR QUE EXISTE. La serie se cargaba a mano y eso tenia un costo concreto: el
// 24/9/2026 honorio.ar ya calculaba con la Res. SGA 2372/2026 y este sitio
// ---el tablero, uma-uhom, prorrateo--- seguia con la de julio, porque el
// workflow de Honorio solo toca su propio repositorio. Una serie que depende de
// que alguien se acuerde queda vieja justo cuando importa.
//
// DE DONDE SALE CADA DATO, que es lo que no se podia perder al automatizar.
// La serie promete que cada valor se leyo DEL ACTO y no de una tabla ajena.
// Este script no afloja eso:
//
//   - honorio.ar/uma.json (la planilla que captura Honorio) se usa SOLO como
//     aviso de que salio una resolucion nueva y para saber el enlace al PDF.
//   - El valor, la vigencia, el numero de resolucion y la fecha del acto se
//     leen del PDF de la CSJN, con pdftotext, del punto resolutivo.
//   - Si el PDF y la planilla no dicen el mismo importe y la misma vigencia,
//     no se carga nada y el script falla. Dos fuentes que no coinciden son
//     trabajo para una persona, no para un cron.
//
// Lo que NO resuelve, y falla a proposito para que se cargue a mano: un PDF sin
// capa de texto (hubo ocho, entre 2020 y 2023), una acordada en vez de una
// resolucion SGA, o un resolutivo redactado distinto. En esos casos el mensaje
// dice que leer.
//
// Salidas: 0 si cargo o si no habia nada nuevo; 1 si algo no cerro. Si falla,
// no escribe: publicar con la UMA de ayer es mejor que con una inventada.
// ---------------------------------------------------------------------------

import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const SERIE = join(RAIZ, 'data', 'serie-uma.json')
const PLANILLA = 'https://honorio.ar/uma.json'
const SECO = process.argv.includes('--seco')

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const dos = (n) => String(n).padStart(2, '0')

function fecha(dia, mes, anio) {
  const m = MESES.indexOf(mes.toLowerCase())
  if (m < 0) return null
  const d = /^primero$/i.test(dia) ? 1 : parseInt(dia, 10)
  return `${anio}-${dos(m + 1)}-${dos(d)}`
}

/**
 * Lee del texto de la resolucion lo que va a la serie. Devuelve un objeto o
 * tira un Error que dice que no se encontro, para que el mensaje del workflow
 * alcance para cargarla a mano.
 */
export function leerResolucion(texto) {
  // pdftotext parte las lineas donde las parte el PDF: se aplana todo.
  const t = texto.replace(/\s+/g, ' ')

  const norma = t.match(/RESOLUCI[OÓ]N\s+SGA\s+N\S{0,3}\s*(\d+)\s*\/\s*(\d{4})/i)
  if (!norma) throw new Error('no dice "RESOLUCION SGA N° .../AAAA": ¿es una acordada, o un PDF sin texto?')

  const acto = t.match(/Buenos Aires,\s*(\d{1,2}|primero)\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/i)
  if (!acto) throw new Error('no se encontro la fecha del acto ("Buenos Aires, D de MES de AAAA")')

  // El resolutivo: "...equivale a la suma de pesos ... ($105.991) a partir del
  // primero de agosto de 2026". Tiene que aparecer una sola vez: si aparecen
  // dos importes, la resolucion fija mas de un valor y eso se mira a mano.
  const re = /Unidad de Medida Arancelaria \(UMA\)[^$]{0,80}equivale a la suma de [^($]{0,200}\(\s*\$\s*([\d.]+)\s*\)\s*a partir del\s+(\d{1,2}|primero)\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/gi
  const hallados = [...t.matchAll(re)]
  if (hallados.length === 0) throw new Error('no se encontro el resolutivo "equivale a la suma de ... ($N) a partir del ..."')
  if (hallados.length > 1) throw new Error(`el resolutivo aparece ${hallados.length} veces: fija mas de un valor`)
  const [, importe, dia, mes, anio] = hallados[0]

  const resultado = {
    valor: parseInt(importe.replace(/\./g, ''), 10),
    vigencia: fecha(dia, mes, anio),
    norma: `Res. SGA ${norma[1]}/${norma[2]}`,
    acto: fecha(acto[1], acto[2], acto[3]),
  }
  if (!resultado.vigencia || !resultado.acto) throw new Error(`un mes que no se reconoce: "${mes}" o "${acto[2]}"`)
  return resultado
}

async function textoDelPdf(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} contesto ${r.status}`)
  const bytes = Buffer.from(await r.arrayBuffer())
  if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error(`${url} no devolvio un PDF`)
  const dir = await mkdtemp(join(tmpdir(), 'uma-'))
  try {
    const pdf = join(dir, 'res.pdf')
    await writeFile(pdf, bytes)
    return execFileSync('pdftotext', ['-enc', 'UTF-8', pdf, '-'], { encoding: 'utf8' })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function main() {
  const crudo = await readFile(SERIE, 'utf8')
  const serie = JSON.parse(crudo)
  const ultima = serie.valores[serie.valores.length - 1]

  const r = await fetch(PLANILLA)
  if (!r.ok) throw new Error(`${PLANILLA} contesto ${r.status}`)
  const planilla = await r.json()

  // Solo lo posterior a lo cargado. Las entradas viejas de la planilla no
  // traen vigencia, y tampoco hacen falta: la serie ya las tiene leidas.
  const nuevas = (planilla.historia ?? [])
    .filter((h) => h.vigencia && h.vigencia > ultima.vigencia)
    .sort((a, b) => a.vigencia.localeCompare(b.vigencia))

  if (nuevas.length === 0) {
    console.log(`Nada nuevo: la serie llega a ${ultima.vigencia} ($${ultima.valor}) y la planilla tambien.`)
    return
  }

  const cargar = []
  for (const h of nuevas) {
    if (!h.url) throw new Error(`la planilla trae ${h.valor} desde ${h.vigencia} sin enlace al acto: hay que cargarlo a mano`)
    let leido
    try {
      leido = leerResolucion(await textoDelPdf(h.url))
    } catch (e) {
      throw new Error(`${h.fuente ?? h.url}: ${e.message}. Cargarla a mano desde ${h.url}`)
    }
    if (leido.valor !== h.valor || leido.vigencia !== h.vigencia) {
      throw new Error(`${leido.norma} dice $${leido.valor} desde ${leido.vigencia}, y la planilla $${h.valor} desde ${h.vigencia}. No se carga ninguno`)
    }
    cargar.push({ ...leido, leido: 'texto', url: h.url })
  }

  for (const v of cargar) console.log(`${v.norma} (${v.acto}): $${v.valor} desde ${v.vigencia}`)
  if (SECO) return

  // Se escribe insertando texto al final del arreglo y no con JSON.stringify
  // del objeto entero: el archivo tiene comentarios largos y un formato que un
  // diff de 500 lineas reformateadas esconderia.
  const cierre = crudo.lastIndexOf('\n    }\n  ]')
  if (cierre < 0) throw new Error('data/serie-uma.json no termina como se espera ("    }\\n  ]")')
  const bloques = cargar.map((v) => '    ' + JSON.stringify(v, null, 2).replace(/\n/g, '\n    '))
  let nuevo = crudo.slice(0, cierre) + '\n    },\n' + bloques.join(',\n') + crudo.slice(cierre + '\n    }'.length)
  const hoy = new Date().toISOString().slice(0, 10)
  nuevo = nuevo.replace(/"actualizado": "\d{4}-\d{2}-\d{2}"/, `"actualizado": "${hoy}"`)
  JSON.parse(nuevo)
  await writeFile(SERIE, nuevo)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`No se cargo la UMA: ${e.message}`)
    process.exit(1)
  })
}
