// ---------------------------------------------------------------
// Controla las cifras de Honorio que este repositorio publica.
//
//   npm run verificar-honorio
//   npm run verificar-honorio -- --rapido
//
// `--rapido` controla solo lo que se lee de un archivo: la version y la
// cantidad de validaciones. Se saltea la enumeracion de recorridos, que
// arranca un proceso y tarda unos segundos. Es el modo que corre en el
// hook de pre-commit: ahi lo que se necesita es que no pasen los dos
// desfasajes que ya ocurrieron, no un informe completo.
//
// Honorio vive en otro repositorio y se publica en honorio.ar. De este
// lado quedaron tres paginas que hablan de el -index.html, README.md y
// documentacion.html- mas la tabla de recorridos de
// docs/domain/01_PROCESOS.md, y ninguna de las cuatro tiene build: la
// version, la cantidad de validaciones, los recorridos de la entrevista
// y los cruces del barrido estan escritos a mano.
//
// Envejecen solas y en silencio. El 14/8/2026 estaban las cuatro
// desactualizadas a la vez, y la de validaciones estaba mal de tres
// formas distintas -11, 16 y "dieciseis", cuando eran 17-, con el chip
// del propio index.html contradiciendose a setecientas lineas de
// distancia. El 21/8 el exhorto paso de dos preguntas a seis y movio los
// recorridos de 168 a 173 sin que nada de este lado se enterara.
//
// Este script es lo que faltaba: lee las cifras del motor y las compara
// contra lo que cada pagina dice. No arregla nada -no reescribe una
// pagina publicada por su cuenta- pero dice que archivo miente y en que
// numero.
//
// Necesita el clon de honorio/, que .gitignore ignora a proposito. Si no
// esta, avisa y sale bien: en CI no existe y no puede fallar por eso.
//
// Salidas:
//   0  las cifras coinciden, o honorio/ no esta en la copia de trabajo
//   1  alguna pagina dice algo que el motor no dice
// ---------------------------------------------------------------

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const HONORIO = join(RAIZ, 'honorio')
const RAPIDO = process.argv.includes('--rapido')

function salirSinHonorio(motivo) {
  console.log(`No se puede controlar: ${motivo}.`)
  console.log('Las cifras de Honorio salen de su repositorio, que acá está')
  console.log('ignorado. Cloná https://github.com/javiercuneo/honorio en honorio/')
  console.log('y volvé a correr esto antes de tocar index.html.')
  process.exit(0)
}

if (!existsSync(HONORIO)) salirSinHonorio('no hay un honorio/ en la copia de trabajo')

const TSX = join(HONORIO, 'node_modules', 'tsx', 'dist', 'cli.mjs')
if (!existsSync(TSX)) salirSinHonorio('honorio/ está sin instalar (falta node_modules/tsx)')

// ---- Lo que dice el motor ----

const versionMotor = JSON.parse(
  readFileSync(join(HONORIO, 'package.json'), 'utf8'),
).version

const validacionesMotor = readdirSync(join(HONORIO, 'lib', 'legal', '__tests__'))
  .filter((f) => f.endsWith('.validation.ts')).length

// La cuenta de recorridos no se deriva: la imprime la validacion que los
// enumera, que es la misma que despues los cruza. Cualquier otra forma de
// contarlos seria una segunda implementacion de la poda del wizard, y dos
// implementaciones de lo mismo es justo el problema que este script existe
// para evitar.
let porProceso = []
let recorridosMotor = 0
let procesosMotor = 0
let crucesMotor = 0

if (!RAPIDO) {
  console.log('Enumerando los recorridos de la entrevista (tarda unos segundos)...\n')

  const corrida = spawnSync(
    process.execPath,
    [TSX, join(HONORIO, 'lib', 'legal', '__tests__', 'retroceso.validation.ts')],
    { cwd: HONORIO, encoding: 'utf8' },
  )

  if (corrida.status !== 0) {
    console.error('La validación del flujo hacia atrás no pasó, así que sus cifras')
    console.error('no valen. Corré primero `npm run validate` desde honorio/.')
    process.exit(1)
  }

  const salida = corrida.stdout ?? ''

  porProceso = [...salida.matchAll(/^ {2}([a-z_]+) {2,}(\d+)$/gm)].map(
    ([, nombre, n]) => [nombre, Number(n)],
  )
  recorridosMotor = porProceso.reduce((a, [, n]) => a + n, 0)
  procesosMotor = porProceso.length

  const cruces = salida.match(/([\d.]+) cruces sin fuga/)
  crucesMotor = cruces ? Number(cruces[1].replace(/\./g, '')) : 0

  if (!recorridosMotor || !crucesMotor) {
    console.error('No se pudo leer la enumeración de recorridos en la salida de')
    console.error('retroceso.validation.ts. Cambió su formato: lo que hay que')
    console.error('ajustar es este script, no la landing.')
    process.exit(1)
  }

  if (crucesMotor !== recorridosMotor ** 2) {
    console.error(`El barrido cruza ${crucesMotor} pares y los recorridos son`)
    console.error(`${recorridosMotor}, que al cuadrado dan ${recorridosMotor ** 2}.`)
    console.error('Una de las dos cifras no es lo que este script cree que es.')
    process.exit(1)
  }
}

// ---- Lo que dicen las páginas ----

const PALABRAS = [
  'cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho',
  'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis',
  'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuna', 'veintidós',
  'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
  'veintiocho', 'veintinueve', 'treinta',
]

const miles = (n) => n.toLocaleString('es-AR')

// Cada control nombra el archivo -que es lo unico que hace falta para
// arreglarlo- y arma el texto que la pagina tendria que tener. Si el patron
// no se encuentra, el control falla igual: una cifra que se dejo de escribir
// tambien es una desincronizacion.
const controles = [
  ['index.html', (v) => `versión <b>${v}</b>`, versionMotor, 'la versión de Honorio'],
  ['index.html', (v) => `<b>${v}</b> validaciones automáticas`, validacionesMotor, 'las validaciones del motor'],
  ['documentacion.html', (v) => `${PALABRAS[v] ?? v}\n    validaciones automáticas`, validacionesMotor, 'las validaciones del motor'],
]

// Los que dependen de la enumeracion. En --rapido no se controlan, y eso
// se dice al final: un control que no corrio no puede contarse como uno
// que paso.
if (!RAPIDO) {
  controles.push(
    ['index.html', (v) => `<b>${v}</b> tipos de proceso`, procesosMotor, 'los tipos de proceso'],
    ['index.html', (v) => `${miles(v)} cambios de rumbo posibles`, crucesMotor, 'los cruces del barrido'],
    ['index.html', (v) => `los ${v} recorridos`, recorridosMotor, 'los recorridos de la entrevista'],
    ['README.md', (v) => `${miles(v)} cruces`, crucesMotor, 'los cruces del barrido'],
    ['README.md', (v) => `los ${v} recorridos`, recorridosMotor, 'los recorridos de la entrevista'],
    ['docs/domain/01_PROCESOS.md', (v) => `| **Total** | **${v}** |`, recorridosMotor, 'el total de la tabla de recorridos'],
    ['docs/domain/01_PROCESOS.md', (v) => `${miles(v)} pares`, crucesMotor, 'los cruces del barrido'],
  )
}

const fallas = []

for (const [archivo, patron, valor, que] of controles) {
  const texto = readFileSync(join(RAIZ, archivo), 'utf8').replace(/\r\n/g, '\n')
  if (!texto.includes(patron(valor))) {
    fallas.push({ archivo, que, esperado: patron(valor) })
  }
}

// ---- El informe ----

console.log('Las cifras de Honorio, leídas del motor')
console.log('================================================================')
console.log(`  versión              ${versionMotor}`)
console.log(`  validaciones         ${validacionesMotor}`)
if (!RAPIDO) {
  console.log(`  tipos de proceso     ${procesosMotor}`)
  console.log(`  recorridos           ${miles(recorridosMotor)}`)
  console.log(`  cruces del barrido   ${miles(crucesMotor)}`)
  console.log('')
  for (const [nombre, n] of porProceso) {
    console.log(`    ${nombre.padEnd(28)} ${n}`)
  }
}
console.log('')

const pendiente = RAPIDO
  ? '\nLos recorridos y los cruces NO se controlaron: para eso, sin --rapido.'
  : ''

if (fallas.length === 0) {
  console.log(`Las ${controles.length} referencias de las páginas coinciden con el motor.${pendiente}`)
  process.exit(0)
}

console.error(`${fallas.length} referencia(s) quedaron viejas:`)
for (const f of fallas) {
  console.error(`  ${f.archivo}: ${f.que}`)
  console.error(`    tendría que decir: ${f.esperado.replace(/\n\s*/g, ' ')}`)
}
console.error('')
console.error('Y se revisa la prosa, no sólo el dígito: la enumeración que va al')
console.error('lado del número envejece igual que el número.')
process.exit(1)
