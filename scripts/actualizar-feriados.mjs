// ---------------------------------------------------------------
// Baja los feriados nacionales de api.argentinadatos.com y los escribe
// en data/feriados.json.
//
//   npm run feriados
//
// Corre en el build y a mano, NUNCA en el navegador del visitante.
// Ese es todo el punto: hasta el 13/8/2026 cada calculadora que
// computa plazos le pedia los feriados a la API en cada carga, y
// cuando la API no contestaba —CORS intermitente, caida— el calculo
// seguia adelante sin ellos. Un feriado contado como habil adelanta el
// vencimiento: el plazo parece cumplirse antes de lo que se cumple.
//
// Es el mismo movimiento que hizo Honorio con la UMA en su 2.1.0, por
// la misma razon: un dato que decide un numero no puede depender de que
// un tercero conteste en el momento exacto en que alguien abre la
// pagina.
//
// POR QUE NO UNA SEGUNDA API. Seria cambiar un punto de falla por dos
// fuentes que pueden discrepar, y dos fuentes que discrepan en un
// feriado dan dos vencimientos distintos. Eso es peor que no tener
// ninguna, porque el error deja de ser visible. El archivo versionado
// es determinístico: si un feriado cambia, cambia en un commit, con
// fecha y con diff.
//
// Los asuetos por Acordada NO salen de aca: viven en
// data/dias-inhabiles.json, se cargan a mano y este script no los toca.
// Son dos cosas distintas y por eso son dos archivos distintos.
//
// Salidas:
//   0  con o sin cambios (el workflow mira el diff de git)
//   1  la API no se pudo leer, o lo que trajo no pasa los controles.
//      Falla fuerte y no toca el archivo: es preferible publicar con
//      los feriados de ayer que con un año a medias.
// ---------------------------------------------------------------

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = join(RAIZ, 'data', 'feriados.json')
const API = 'https://api.argentinadatos.com/v1/feriados'

// Desde 2021 porque es DEFAULT_MIN_YEAR en calendario-judicial.js, y
// hasta el año que viene porque los plazos se proyectan hacia adelante.
const DESDE = 2021
const HASTA = new Date().getFullYear() + 1

// Un año con menos de esto es un año a medias, no un año con pocos
// feriados: Argentina no baja de 15 ni en el año mas pelado. Si la API
// devuelve 3, algo se rompio del otro lado y no hay que guardarlo.
const MINIMO_POR_ANIO = 14

function morir(mensaje) {
  console.error('ERROR: ' + mensaje)
  console.error('El archivo no se toco.')
  process.exit(1)
}

async function traerAnio(anio) {
  const resp = await fetch(`${API}/${anio}`, { headers: { accept: 'application/json' } })
  if (!resp.ok) throw new Error(`${anio}: HTTP ${resp.status}`)

  const datos = await resp.json()
  if (!Array.isArray(datos)) throw new Error(`${anio}: la respuesta no es una lista`)
  if (datos.length < MINIMO_POR_ANIO) {
    throw new Error(`${anio}: ${datos.length} feriados, menos que el minimo de ${MINIMO_POR_ANIO}`)
  }

  return datos.map((f) => {
    // La fecha es lo unico que no se puede negociar: es la clave con la
    // que despues se pregunta si un dia es habil.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fecha || '')) {
      throw new Error(`${anio}: fecha con formato inesperado: ${JSON.stringify(f.fecha)}`)
    }
    if (!f.fecha.startsWith(String(anio))) {
      throw new Error(`${anio}: vino una fecha de otro año: ${f.fecha}`)
    }
    return { fecha: f.fecha, motivo: f.nombre || f.motivo || 'Feriado nacional' }
  })
}

const anios = {}
for (let anio = DESDE; anio <= HASTA; anio++) {
  try {
    anios[anio] = await traerAnio(anio)
    console.log(`  ${anio}  ${anios[anio].length} feriados`)
  } catch (e) {
    // Se aborta entero y a proposito. Un archivo con un año faltante es
    // exactamente el bug que este script viene a sacar: se veria bien y
    // daria mal una fecha de ese año.
    morir(e.message)
  }
}

const salida = {
  _comentario:
    'Generado por scripts/actualizar-feriados.mjs. No editar a mano: se pisa. ' +
    'Los asuetos por Acordada van en dias-inhabiles.json, que si se edita a mano.',
  fuente: API,
  actualizado: new Date().toISOString().slice(0, 10),
  desde: DESDE,
  hasta: HASTA,
  feriados: anios,
}

const nuevo = JSON.stringify(salida, null, 2) + '\n'

if (existsSync(SALIDA)) {
  const viejo = readFileSync(SALIDA, 'utf8')
  // Se compara sin la fecha de actualizacion, que cambia todos los dias
  // y ensuciaria el diff sin que haya cambiado un feriado.
  const sinFecha = (t) => t.replace(/"actualizado": "[^"]*",\n/, '')
  if (sinFecha(viejo) === sinFecha(nuevo)) {
    console.log('\nSin cambios.')
    process.exit(0)
  }
}

writeFileSync(SALIDA, nuevo, 'utf8')
console.log(`\nEscrito ${SALIDA}`)
