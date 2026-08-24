// ---------------------------------------------------------------
// Controla data/serie-uma.json y data/serie-uhom.json.
//
//   npm run verificar-series
//
// Estas dos series no las calcula nadie: se leyeron a mano de las
// acordadas de la CSJN y de las tablas del Ministerio, y despues se
// editan a mano cada vez que sale un valor nuevo. Un archivo asi se
// rompe de tres formas, y las tres dan un numero plausible:
//
//   - una vigencia repetida, porque se copio la fila de arriba y se
//     cambio el importe pero no la fecha;
//   - una serie que baja, porque se pego un valor viejo;
//   - una fecha de acto anterior a la vigencia, que es imposible: la
//     Corte no publica el valor antes del dia desde el que rige.
//     De los valores cargados, TODOS salieron despues.
//
// Ninguna de las tres la ve el ojo en un diff de 67 lineas. Por eso
// corre en el build, antes de armar el sitio: la pagina promete que el
// valor sale del acto, y una serie rota rompe esa promesa en silencio.
//
// Salidas:
//   0  todo bien
//   1  algo no cierra. Se listan todas las fallas, no la primera:
//      arreglar de a una y volver a correr es la forma de tardar cinco
//      veces mas.
// ---------------------------------------------------------------

import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const fallas = []

function mal(mensaje) {
  fallas.push(mensaje)
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

function esFechaValida(s) {
  if (!ISO.test(s)) return false
  const d = new Date(s + 'T00:00:00')
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

async function leer(nombre) {
  const texto = await readFile(join(RAIZ, 'data', nombre), 'utf8')
  const datos = JSON.parse(texto)
  if (!Array.isArray(datos.valores) || datos.valores.length === 0) {
    mal(`${nombre}: no tiene "valores", o esta vacio`)
    return null
  }
  if (!esFechaValida(datos.actualizado ?? '')) {
    mal(`${nombre}: "actualizado" no es una fecha AAAA-MM-DD (${datos.actualizado})`)
  }
  return datos
}

/** Lo que vale para las dos series. */
function controlarComun(nombre, valores) {
  const hoy = new Date().toISOString().slice(0, 10)
  const vistas = new Set()

  valores.forEach((v, i) => {
    const donde = `${nombre}[${i}]`

    if (!Number.isInteger(v.valor) || v.valor <= 0) {
      mal(`${donde}: "valor" no es un entero positivo (${v.valor})`)
    }
    if (!esFechaValida(v.vigencia ?? '')) {
      mal(`${donde}: "vigencia" no es una fecha AAAA-MM-DD (${v.vigencia})`)
      return
    }
    if (vistas.has(v.vigencia)) {
      mal(`${donde}: la vigencia ${v.vigencia} esta repetida`)
    }
    vistas.add(v.vigencia)

    // Un valor que rige desde una fecha futura seria un valor que todavia
    // no rige, mostrado como vigente. La pagina toma el ultimo.
    if (v.vigencia > hoy) {
      mal(`${donde}: la vigencia ${v.vigencia} es futura`)
    }
    if (v.url && !String(v.url).startsWith('https://')) {
      mal(`${donde}: la url no es https (${v.url})`)
    }
  })

  // El orden importa: la pagina toma el ULTIMO elemento como el vigente.
  // Un archivo ordenado al reves mostraria el valor de 2016.
  for (let i = 1; i < valores.length; i++) {
    const a = valores[i - 1]
    const b = valores[i]
    if (!(b.vigencia > a.vigencia)) {
      mal(`${nombre}: ${b.vigencia} no viene despues de ${a.vigencia}; la serie tiene que ir de la mas vieja a la mas nueva`)
    }
    if (b.valor < a.valor) {
      mal(`${nombre}: el valor baja de ${a.valor} (${a.vigencia}) a ${b.valor} (${b.vigencia})`)
    }
  }
}

const uma = await leer('serie-uma.json')
const uhom = await leer('serie-uhom.json')

if (uma) {
  controlarComun('serie-uma', uma.valores)

  uma.valores.forEach((v, i) => {
    const donde = `serie-uma[${i}]`
    if (!v.norma) mal(`${donde}: sin "norma". Un valor sin el acto que lo fija no se publica.`)
    if (v.acto === undefined) mal(`${donde}: sin "acto" (usa null si no se conoce)`)
    if (v.acto === null) return
    if (!esFechaValida(v.acto)) {
      mal(`${donde}: "acto" no es una fecha AAAA-MM-DD (${v.acto})`)
      return
    }
    // La resolucion no puede ser anterior al dia desde el que rige el valor
    // que fija. Si aparece una, o la fecha se cargo mal o la vigencia si.
    if (v.acto < v.vigencia && !v.sin_demora) {
      mal(`${donde}: el acto (${v.acto}) es anterior a la vigencia (${v.vigencia})`)
    }
  })
}

if (uhom) {
  controlarComun('serie-uhom', uhom.valores)

  uhom.valores.forEach((v, i) => {
    const donde = `serie-uhom[${i}]`
    // El nombre del PDF del Ministerio arranca con el numero de tabla, y la
    // pagina lo muestra. Sin eso no se puede volver al documento.
    if (!/^\d{2}_/.test(v.fuente ?? '')) {
      mal(`${donde}: "fuente" tiene que ser el archivo de la tabla, que empieza con su numero (${v.fuente})`)
    }
    // El UHOM rige por mes entero: todas las vigencias caen el dia 1.
    if (!/-01$/.test(v.vigencia ?? '')) {
      mal(`${donde}: la vigencia ${v.vigencia} no cae el dia 1; el UHOM rige por mes`)
    }
  })

  // No se exige que termine en cero. La regla del decreto dice que si, pero
  // noviembre de 2022 salio en 2003 y la tabla oficial construye toda su
  // escala sobre ese numero. Un control que lo rechace estaria rechazando un
  // valor oficial: se avisa y no se falla.
  const raros = uhom.valores.filter((v) => v.valor % 10 !== 0)
  if (raros.length) {
    console.log(
      `\nAviso: ${raros.length} valor(es) de UHOM no terminan en cero, contra la regla ` +
        `del decreto 2536/15: ${raros.map((v) => `${v.vigencia} (${v.valor})`).join(', ')}. ` +
        `Estan leidos de la tabla oficial y no son un error de carga.`,
    )
  }
}

console.log(
  `\nserie-uma: ${uma ? uma.valores.length : 0} valores` +
    ` | serie-uhom: ${uhom ? uhom.valores.length : 0} valores`,
)

if (fallas.length) {
  console.error(`\n${fallas.length} problema(s):`)
  for (const f of fallas) console.error('  ' + f)
  process.exit(1)
}

console.log('Las dos series cierran.')
