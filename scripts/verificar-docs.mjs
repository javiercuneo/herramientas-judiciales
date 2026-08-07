// ---------------------------------------------------------------
// scripts/verificar-docs.mjs
//
// Control mecanico de docs/domain/. No verifica que lo que dicen sea
// cierto —eso no se puede automatizar— pero si caza una clase entera de
// error que ya costo cara: la cita inventada.
//
// Revisa tres cosas:
//
//   1. Normas citadas. Cada `Ley NN.NNN` y cada `Decreto NNN/AAAA` tiene
//      que aparecer en el texto de la ley o estar en la lista blanca de
//      abajo, con el motivo escrito. Es el control que habria cazado el
//      «Decreto Reglamentario 218/2015» del 04, que no existe y ademas
//      era anterior a la ley que decia reglamentar.
//
//   2. Articulos de la Ley 27.423. Un `art. N` que no este en el texto
//      es una cita a un articulo inexistente. Los de otros codigos
//      —CPCCN, CCyCN— se reconocen por la sigla y no se controlan.
//
//   3. Identificadores de codigo entre backticks. Nombres de funcion,
//      de constante, de tipo, de clave del schema y rutas de archivo:
//      tienen que existir. Es el control que habria cazado los modulos
//      inventados del 01 —`escala_art21`, `valor_uma`,
//      `minimos_judiciales_calc`— que no existian en ninguna parte.
//
// Uso: npm run verificar-docs
//
// Sobre honorio/: el motor vive en otro repositorio y aca es un clon
// ignorado por git. Si no esta, los identificadores que solo pueden
// existir alli se informan como NO VERIFICABLES y el script no falla.
// Un rojo que depende de si alguien clono algo no sirve para nada.
// ---------------------------------------------------------------

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const DOMINIO = join(RAIZ, 'docs', 'domain')
const LEY = join(DOMINIO, '00_LEY_27423.md')

// Normas que se citan a proposito y no estan en el texto de la ley.
// Cada una con el motivo: si hay que agregar una, va con su razon.
const NORMAS_ESPERADAS = new Map([
  ['ley 27.423', 'es la ley que documenta todo esto'],
  ['ley 21.839', 'el arancel anterior; de ahi sale el 2-20 % de incidentes'],
  ['ley 22.172', 'exhortos, citada por el art. 50'],
  ['ley 27.802', 'sustituyo los arts. 60 y 61 bis (B.O. 06/03/2026)'],
  ['ley 24.441', 'ejecucion hipotecaria especial, en el bloque de lo que no se hace'],
  ['ley 26.589', 'mediacion; la calculadora del mediador es otra herramienta'],
  ['ley 5134', 'UMA de la Ciudad, citada para distinguirla de la nacional'],
  ['decreto 1077/2017', 'observo varios articulos al promulgar la ley'],
  ['decreto 157/2018', 'derogo el art. 36'],
  ['decreto 1467/11', 'reglamenta la mediacion de la Ley 26.589'],
])

// Directorios donde puede vivir un identificador del codigo.
const CORPUS = [
  'honorio',                        // el motor, clon ignorado por git
  'asistente-honorarios-clasico',   // el motor clasico, referencia historica
  'calculadoras',
  'scripts',
  'data',
]
const ARCHIVOS_SUELTOS = ['index.html', 'documentacion.html', 'package.json']
const EXT_CODIGO = new Set(['.ts', '.tsx', '.js', '.mjs', '.jsx', '.json', '.css', '.html'])
const IGNORAR_DIR = new Set(['node_modules', '.next', '.git', 'out', 'dist', 'build'])

// Palabras que aparecen entre backticks pero son prosa, no codigo.
const NO_ES_CODIGO = new Set(['si', 'no', 'null', 'true', 'false', 'undefined'])

const rojo = (t) => `\x1b[31m${t}\x1b[0m`
const verde = (t) => `\x1b[32m${t}\x1b[0m`
const gris = (t) => `\x1b[90m${t}\x1b[0m`
const amarillo = (t) => `\x1b[33m${t}\x1b[0m`

// ---- Recoleccion ----

function archivosDe(dir, acc = []) {
  let entradas
  try { entradas = readdirSync(dir) } catch { return acc }
  for (const e of entradas) {
    if (IGNORAR_DIR.has(e)) continue
    const p = join(dir, e)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) archivosDe(p, acc)
    else if (EXT_CODIGO.has(extname(e))) acc.push(p)
  }
  return acc
}

// `--sin-honorio` simula lo que ve CI, donde el clon del motor no esta.
// Sirve para comprobar que un cambio en los documentos no va a fallar
// alla por una razon que aca no se ve.
const simularCI = process.argv.includes('--sin-honorio')
const hayHonorio = !simularCI && existsSync(join(RAIZ, 'honorio', 'lib'))

const archivosCorpus = [
  ...CORPUS.filter((d) => !(simularCI && d === 'honorio'))
    .flatMap((d) => archivosDe(join(RAIZ, d))),
  ...ARCHIVOS_SUELTOS.map((f) => join(RAIZ, f)).filter((p) => existsSync(p)),
  // Este archivo se excluye a proposito: sus comentarios citan
  // identificadores inventados como ejemplos —`escala_art21` y
  // companiia— y si entrara al corpus se auto-validaria. Paso de
  // verdad la primera vez que se corrio la prueba de regresion.
].filter((p) => !p.replace(/\\/g, '/').endsWith('scripts/verificar-docs.mjs'))
const corpus = archivosCorpus.map((p) => {
  try { return readFileSync(p, 'utf8') } catch { return '' }
}).join('\n')

const textoLey = readFileSync(LEY, 'utf8')

// Articulos que la ley realmente tiene. Se toman solo los encabezados
// —«ARTICULO 21.-» o «Artículo 61 bis»—, no las menciones en prosa: si
// se aceptaran esas, un articulo citado por error pero nombrado en
// cualquier parte pasaria el control.
const articulosLey = new Set(
  [...textoLey.matchAll(/(?:ART[IÍ]CULO|Artículo)\s+(\d+)(\s+bis)?/g)]
    .map((m) => m[1] + (m[2] ? ' bis' : '')),
)

// Indice de nombres de archivo del corpus, para resolver menciones
// sueltas como `calculate.ts` sin exigir la ruta entera.
const basenames = new Set(archivosCorpus.map((p) => p.split(/[/\\]/).pop()))
const rutasNormalizadas = archivosCorpus.map((p) => p.replace(/\\/g, '/'))

/**
 * Los documentos terminan con una seccion que registra lo que decian y
 * no era cierto, y ahi las citas falsas estan a proposito: el 04 nombra
 * el «Decreto Reglamentario 218/2015» justamente para decir que no
 * existe. Esa seccion no se controla, o el registro de errores seria
 * imposible de escribir.
 *
 * Se corta desde el encabezado hasta el siguiente del mismo nivel o
 * superior.
 */
const ES_REGISTRO = /^(#{1,6})\s.*(no era as[íi]|no es as[íi]|dec[íi]a este documento)/i

function sinRegistroDeErrores(texto) {
  const lineas = texto.split('\n')
  const out = []
  let saltando = 0
  for (const l of lineas) {
    const h = /^(#{1,6})\s/.exec(l)
    if (saltando && h && h[1].length <= saltando) saltando = 0
    if (!saltando) {
      const m = ES_REGISTRO.exec(l)
      if (m) { saltando = m[1].length; continue }
    }
    if (!saltando) out.push(l)
  }
  return out.join('\n')
}

const docs = readdirSync(DOMINIO)
  .filter((f) => f.endsWith('.md') && f !== '00_LEY_27423.md')
  .map((f) => ({
    nombre: f,
    texto: sinRegistroDeErrores(readFileSync(join(DOMINIO, f), 'utf8')),
  }))

// ---- Controles ----

const fallas = []
const avisos = []
const noVerificables = new Set()

function normalizarNorma(tipo, numero) {
  return `${tipo.toLowerCase()} ${numero.replace(/\s/g, '')}`
}

for (const { nombre, texto } of docs) {
  // 1. Normas citadas
  const normas = [
    ...texto.matchAll(/\b(Ley)\s+N?[.°º]?\s?(\d{1,2}\.\d{3})/gi),
    ...texto.matchAll(/\b(Decreto)\s+(?:[A-Za-zÁÉÍÓÚáéíóú]+\s+)?N?[.°º]?\s?(\d{1,4}\/\d{2,4})/gi),
  ]
  for (const m of normas) {
    const clave = normalizarNorma(m[1], m[2])
    if (NORMAS_ESPERADAS.has(clave)) continue
    if (textoLey.includes(m[2])) continue
    fallas.push(`${nombre}: cita «${m[1]} ${m[2]}», que no esta en el texto de la ley ni en la lista de normas esperadas`)
  }

  // 2. Articulos de la Ley 27.423.
  //    Se saltean los que traen sigla de otro codigo pegada.
  const arts = [...texto.matchAll(/\bart[íi]?c?u?l?o?s?\.?\s+(\d{1,3})(\s+bis)?((\s+(inc\.|inciso)\s*[a-z]\)?)?)([^\n]{0,24})/gi)]
  for (const m of arts) {
    const num = m[1] + (m[2] ? ' bis' : '')
    const cola = (m[6] || '').toUpperCase()
    if (/CPCCN|CPC\b|CCYCN|C[OÓ]DIGO|DECRETO|LEY\s+N?[.°º]?\s?\d/.test(cola)) continue
    if (articulosLey.has(num)) continue
    avisos.push(`${nombre}: «art. ${num}» no figura en el texto de la Ley 27.423 (¿es de otro codigo? entonces nombralo)`)
  }

  // 3. Identificadores de codigo entre backticks
  const tokens = new Set(
    [...texto.matchAll(/`([^`\n]{2,80})`/g)].map((m) => m[1].trim()),
  )
  for (const tk of tokens) {
    if (/\s/.test(tk)) continue
    if (NO_ES_CODIGO.has(tk)) continue
    if (/^[\d.,%$/-]+$/.test(tk)) continue

    if (tk.includes('*')) continue          // patron, no una ruta concreta
    const limpio = tk.replace(/\(\)$/, '')

    // Un directorio: `docs/domain/`, `lib/legal/`
    if (limpio.endsWith('/')) {
      const sinBarra = limpio.slice(0, -1)
      if ([join(RAIZ, sinBarra), join(RAIZ, 'honorio', sinBarra)].some(existsSync)) continue
      if (!hayHonorio) { noVerificables.add(`${limpio} ${gris('(directorio de honorio/)')}`); continue }
      fallas.push(`${nombre}: menciona el directorio \`${tk}\`, que no existe`)
      continue
    }

    const tieneExtension = EXT_CODIGO.has(extname(limpio))

    // Un archivo, con ruta o solo con su nombre.
    if (tieneExtension) {
      const base = limpio.split('/').pop()
      if (basenames.has(base) && (!limpio.includes('/') || rutasNormalizadas.some((r) => r.endsWith('/' + limpio)))) continue
      if (!hayHonorio) { noVerificables.add(`${limpio} ${gris('(archivo de honorio/)')}`); continue }
      fallas.push(`${nombre}: menciona el archivo \`${tk}\`, que no existe en ninguna parte`)
      continue
    }

    // Con barra y sin extension no es una ruta: es `javiercuneo/honorio`
    // o algo por el estilo. No hay nada que verificar.
    if (limpio.includes('/')) continue

    // Una clave del schema con tilde o enie no existe: los
    // identificadores del codigo son ASCII. `sucesión` por `sucesion`
    // estaba en el 04.
    const sinTildes = limpio.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    if (sinTildes !== limpio && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(sinTildes)) {
      fallas.push(
        corpus.includes(sinTildes)
          ? `${nombre}: escribe \`${tk}\` con tilde; en el codigo la clave es \`${sinTildes}\``
          : `${nombre}: \`${tk}\` tiene tilde y ningun identificador del codigo la lleva`,
      )
      continue
    }

    const esIdent = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(limpio) &&
      (/_/.test(limpio) || /[a-z][A-Z]/.test(limpio) || /^[A-Z]/.test(limpio))
    if (!esIdent) continue

    if (corpus.includes(limpio)) continue
    if (!hayHonorio) {
      noVerificables.add(`${limpio} ${gris(`(citado en ${nombre})`)}`)
      continue
    }
    fallas.push(`${nombre}: menciona \`${tk}\`, que no aparece en ningun archivo del codigo`)
  }
}

// ---- Informe ----

console.log('\nControl mecanico de docs/domain/')
console.log('='.repeat(64))
console.log(`  documentos          ${docs.length}`)
console.log(`  archivos de codigo  ${archivosCorpus.length}`)
console.log(`  articulos de la ley ${articulosLey.size}`)
if (!hayHonorio) {
  console.log(amarillo('\n  honorio/ no esta en la copia de trabajo.'))
  console.log(amarillo('  Los identificadores del motor no se pueden verificar.'))
  console.log(gris('  Clonalo con: git clone https://github.com/javiercuneo/honorio.git honorio'))
}

if (noVerificables.size > 0) {
  const lista = [...noVerificables].sort()
  console.log(`\nNo verificables (${lista.length})`)
  // Sin el clon son casi cien y no aportan nada leerlos uno por uno:
  // lo que importa es que quedaron sin control, no cuales.
  if (lista.length > 12) {
    for (const n of lista.slice(0, 5)) console.log(`  ?  ${n}`)
    console.log(gris(`  …y ${lista.length - 5} mas. Con el clon de honorio/ se verifican todos.`))
  } else {
    for (const n of lista) console.log(`  ?  ${n}`)
  }
}

if (avisos.length > 0) {
  console.log(amarillo(`\nPara mirar a mano (${avisos.length})`))
  for (const a of avisos) console.log(amarillo(`  !  ${a}`))
}

if (fallas.length > 0) {
  console.log(rojo(`\nCitas que no se sostienen (${fallas.length})`))
  for (const f of fallas) console.log(rojo(`  x  ${f}`))
  console.log(rojo('\nUna cita inventada en un documento juridico es lo peor que puede haber.'))
  console.log(rojo('Verificala contra la fuente o sacala.\n'))
  process.exit(1)
}

console.log(verde('\nNinguna cita inventada.'))
console.log(gris('Esto no dice que los documentos sean ciertos: dice que lo que'))
console.log(gris('nombran existe. Lo demas se verifica leyendo el motor.\n'))
