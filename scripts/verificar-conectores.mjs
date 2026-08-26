// ---------------------------------------------------------------
// Controla los dos conectores de conectores/.
//
//   npm run verificar-conectores
//
// Que existe: el computo de plazos expuesto por HTTP local
// (conectores/http.mjs) y por MCP sobre stdio (conectores/mcp.mjs),
// los dos sobre conectores/nucleo.mjs, que es el mismo motor que
// consumen las calculadoras.
//
// POR QUE HACE FALTA UN CONTROL PROPIO. `npm run verificar-plazos`
// cubre el motor: 34 comprobaciones sobre la aritmetica. No toca los
// conectores, y los conectores son otra clase de cosa. Lo que puede
// romperse aca no es una cuenta:
//
//   - que un transporte deje de arrancar;
//   - que se rompa el JSON-RPC o el formato de la respuesta HTTP;
//   - que cambie el nombre de un campo de entrada y el que llama del
//     otro lado reciba "falta el plazo" para siempre;
//   - y sobre todo, que un dato faltante deje de contestar ok:false y
//     empiece a devolver una fecha.
//
// Ese ultimo es el que justifica el archivo. La pantalla puede mostrar
// el aviso al lado del numero porque hay alguien leyendo; un conector
// no tiene a nadie del otro lado. Si el dia que falta la Acordada de
// una feria el conector devuelve una fecha igual, nadie se entera, y la
// fecha esta mal en el unico sentido que importa: hacia adelante.
//
// Hasta el 26/8/2026 nada de esto se probaba, y por eso la respuesta a
// "estan terminados los conectores" era "andan cuando los corro a
// mano".
//
// Los dos casos con fecha son los mismos de verificar-plazos, a
// proposito: si el motor y el conector dan distinto, el bug es del
// transporte y no del criterio.
//
// Salidas:
//   0  todo bien
//   1  algo no cierra. Se listan todas las fallas, no la primera.
// ---------------------------------------------------------------

import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const NODE = process.execPath

// Un puerto distinto del 8787 de fabrica: si alguien tiene el conector
// levantado mientras corre esto, no se pisan ni da un falso verde
// contra el proceso de al lado.
const PUERTO = 8799
const BASE = `http://127.0.0.1:${PUERTO}`

const fallas = []
const mal = (mensaje) => fallas.push(mensaje)
let comprobaciones = 0

function comprobar(condicion, mensaje) {
  comprobaciones++
  if (!condicion) mal(mensaje)
}

function igual(obtenido, esperado, mensaje) {
  comprobar(obtenido === esperado, `${mensaje}: se esperaba ${esperado} y vino ${obtenido}`)
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------
// El conector HTTP
// ---------------------------------------------------------------

async function conHttp(probar) {
  const proceso = spawn(NODE, [join(RAIZ, 'conectores', 'http.mjs')], {
    env: { ...process.env, PUERTO: String(PUERTO) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let salida = ''
  proceso.stdout.on('data', (d) => { salida += d })
  proceso.stderr.on('data', (d) => { salida += d })

  try {
    // Se espera a que conteste, no un tiempo fijo: en una maquina lenta
    // un sleep corto da un falso rojo y uno largo hace tardar de gusto.
    let vivo = false
    for (let intento = 0; intento < 60 && !vivo; intento++) {
      try {
        const r = await fetch(BASE + '/', { signal: AbortSignal.timeout(500) })
        vivo = r.ok
      } catch {
        await esperar(100)
      }
    }
    if (!vivo) {
      mal(`el conector HTTP no llego a escuchar en ${BASE}. Salida del proceso:\n${salida.trim()}`)
      return
    }
    await probar()
  } finally {
    proceso.kill()
  }
}

const pedir = async (ruta, opciones) => {
  const r = await fetch(BASE + ruta, opciones)
  let cuerpo = null
  try { cuerpo = await r.json() } catch { /* no era JSON */ }
  return { estado: r.status, tipo: r.headers.get('content-type') || '', cuerpo }
}

async function probarHttp() {
  // --- el indice ---
  const indice = await pedir('/')
  igual(indice.estado, 200, 'GET / no contesta 200')
  comprobar(/json/.test(indice.tipo), 'GET / no declara content-type JSON')
  comprobar(
    Array.isArray(indice.cuerpo?.endpoints) && indice.cuerpo.endpoints.length === 6,
    `GET / tiene que listar los seis endpoints y lista ${indice.cuerpo?.endpoints?.length}`,
  )
  // El aviso del indice es la unica forma que tiene el que llama de
  // enterarse de la regla antes de encontrarse un ok:false.
  comprobar(
    typeof indice.cuerpo?.aviso === 'string' && /ok/.test(indice.cuerpo.aviso),
    'GET / no trae el aviso de que ok:false no trae fecha',
  )

  // --- el caso testigo, por GET ---
  const v = await pedir('/vencimiento?fecha=2026-06-25&plazo=20')
  igual(v.estado, 200, 'GET /vencimiento no contesta 200')
  igual(v.cuerpo?.ok, true, 'GET /vencimiento no devuelve ok:true')
  igual(v.cuerpo?.vencimiento, '2026-08-11', 'GET /vencimiento mueve la fecha del caso testigo')
  igual(v.cuerpo?.plazo, 20, 'GET /vencimiento no devuelve el plazo como numero')
  comprobar(
    Array.isArray(v.cuerpo?.diasContados) && v.cuerpo.diasContados.length === 20,
    'GET /vencimiento no devuelve los 20 dias contados',
  )
  // Las fechas viajan como AAAA-MM-DD y nada mas: ni ISO completo ni
  // epoch, que arrastran hora y huso. Un plazo judicial no tiene hora.
  comprobar(
    (v.cuerpo?.diasContados || []).every((f) => /^\d{4}-\d{2}-\d{2}$/.test(f)),
    'GET /vencimiento devuelve fechas que no son AAAA-MM-DD pelado',
  )

  // --- el mismo caso, por POST, tiene que dar identico ---
  const vPost = await pedir('/vencimiento', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fecha: '2026-06-25', plazo: 20 }),
  })
  igual(vPost.cuerpo?.vencimiento, v.cuerpo?.vencimiento, 'POST y GET dan vencimientos distintos')

  // --- mora: el caso con el que se pidio todo esto ---
  const m = await pedir('/mora', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ notificacion: '2026-06-18', diasHabiles: 10, diasCorridos: 10 }),
  })
  igual(m.cuerpo?.ok, true, 'POST /mora no devuelve ok:true')
  igual(m.cuerpo?.firme, '2026-07-02', 'POST /mora mueve la fecha en que queda firme')
  igual(m.cuerpo?.vencimiento, '2026-07-12', 'POST /mora mueve la fecha de mora del caso testigo')

  // --- las otras cuatro herramientas contestan ---
  const habil = await pedir('/dia-habil?fecha=2026-07-09')
  igual(habil.cuerpo?.ok, true, 'GET /dia-habil no contesta')
  igual(habil.cuerpo?.habil, false, 'el 9 de julio de 2026 tiene que ser inhabil')
  comprobar(
    typeof habil.cuerpo?.motivo === 'string' && habil.cuerpo.motivo.length > 0,
    'GET /dia-habil no dice por que un dia es inhabil',
  )

  const sig = await pedir('/siguiente-habil?fecha=2026-07-09')
  igual(sig.cuerpo?.siguiente, '2026-07-13', 'GET /siguiente-habil no salta el puente del 10 de julio')

  const entre = await pedir('/dias-habiles-entre?desde=2026-06-25&hasta=2026-07-09')
  igual(entre.cuerpo?.ok, true, 'GET /dias-habiles-entre no contesta')
  comprobar(
    typeof entre.cuerpo?.habiles === 'number',
    'GET /dias-habiles-entre no devuelve un numero de habiles',
  )

  const cob = await pedir('/cobertura')
  igual(cob.cuerpo?.ok, true, 'GET /cobertura no contesta')
  comprobar(
    Array.isArray(cob.cuerpo?.feriadosCargados) && cob.cuerpo.feriadosCargados.includes(2026),
    'GET /cobertura no declara 2026 entre los años cargados',
  )

  // --- LA REGLA QUE MAS IMPORTA: sin dato, no hay fecha ---
  //
  // 2027 no tiene Acordada de feria cargada, y no la va a tener hasta
  // que la CSJN la dicte. Un plazo que la toca no puede devolver una
  // fecha: tiene que devolver ok:false y el motivo. Si esto se rompe,
  // el conector empieza a afirmar vencimientos que ninguna corrida
  // produce, y del otro lado no hay nadie leyendo un aviso.
  const sinDato = await pedir('/vencimiento?fecha=2027-06-25&plazo=20')
  igual(sinDato.estado, 200, 'un dato faltante no es un error del que llama: tiene que ser 200')
  igual(sinDato.cuerpo?.ok, false, 'un plazo que toca un año sin feria cargada devolvio ok distinto de false')
  comprobar(
    sinDato.cuerpo?.vencimiento === undefined && sinDato.cuerpo?.fecha === undefined,
    'con ok:false vino una fecha igual, que es exactamente lo que no puede pasar',
  )
  comprobar(
    typeof sinDato.cuerpo?.problema === 'string' && /2027/.test(sinDato.cuerpo.problema),
    'con ok:false el problema no nombra el año que falta',
  )

  // --- entradas invalidas ---
  const falta = await pedir('/vencimiento?fecha=2026-06-25')
  igual(falta.estado, 400, 'una entrada incompleta tiene que dar 400')
  igual(falta.cuerpo?.ok, false, 'una entrada incompleta tiene que dar ok:false')

  const noExiste = await pedir('/no-existe')
  igual(noExiste.estado, 404, 'una ruta que no existe tiene que dar 404')
  comprobar(
    typeof noExiste.cuerpo?.problema === 'string',
    'el 404 tiene que explicar en JSON, no en HTML',
  )
}

// ---------------------------------------------------------------
// El conector MCP
// ---------------------------------------------------------------

// JSON-RPC por stdio: se manda todo junto y se leen las respuestas por
// id. El orden de llegada NO esta garantizado --el servidor contesta
// cuando termina cada una-- asi que indexar por id y no por posicion no
// es prolijidad: la primera version de esta prueba leia por posicion y
// pasaba de casualidad.
async function hablarMcp(peticiones) {
  return new Promise((resolve, reject) => {
    const proceso = spawn(NODE, [join(RAIZ, 'conectores', 'mcp.mjs')], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let salida = ''
    let error = ''
    const porId = new Map()

    const cortarSi = () => {
      if (porId.size >= peticiones.length) {
        proceso.kill()
        resolve({ porId, error })
      }
    }

    proceso.stdout.on('data', (d) => {
      salida += d
      const lineas = salida.split('\n')
      salida = lineas.pop()
      for (const linea of lineas) {
        if (!linea.trim()) continue
        try {
          const m = JSON.parse(linea)
          if (m.id !== undefined) porId.set(m.id, m)
        } catch { /* linea partida o ruido */ }
      }
      cortarSi()
    })
    proceso.stderr.on('data', (d) => { error += d })
    proceso.on('error', reject)

    const limite = setTimeout(() => {
      proceso.kill()
      resolve({ porId, error, agotado: true })
    }, 20000)
    proceso.on('close', () => { clearTimeout(limite); resolve({ porId, error }) })

    for (const p of peticiones) proceso.stdin.write(JSON.stringify(p) + '\n')
  })
}

const llamar = (id, nombre, args) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: { name: nombre, arguments: args },
})

// El contenido de una respuesta MCP es texto; adentro va el JSON.
function cuerpoDe(mensaje) {
  const texto = mensaje?.result?.content?.[0]?.text
  if (typeof texto !== 'string') return null
  try { return JSON.parse(texto) } catch { return null }
}

async function probarMcp() {
  const { porId, error, agotado } = await hablarMcp([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'verificar-conectores', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    llamar(3, 'vencimiento', { fecha: '2026-06-25', plazo: '20' }),
    // El mismo caso con el plazo como NUMERO y no como texto: el
    // esquema declara string porque JSON-RPC llega asi desde un modelo,
    // pero un cliente que mande un numero no puede recibir otra fecha.
    llamar(4, 'vencimiento', { fecha: '2026-06-25', plazo: 20 }),
    llamar(5, 'mora', { notificacion: '2026-06-18', diasHabiles: 10, diasCorridos: 10 }),
    llamar(6, 'vencimiento', { fecha: '2027-06-25', plazo: '20' }),
    llamar(7, 'cobertura', {}),
    llamar(8, 'dia_habil', { fecha: '2026-07-09' }),
  ])

  if (agotado) {
    mal(`el conector MCP no contesto en 20 segundos. stderr:\n${error.trim()}`)
    return
  }

  const init = porId.get(1)
  comprobar(init?.result?.protocolVersion === '2024-11-05', 'initialize no devuelve la version del protocolo')
  comprobar(!!init?.result?.serverInfo?.name, 'initialize no se identifica')

  const lista = porId.get(2)?.result?.tools
  comprobar(Array.isArray(lista) && lista.length === 6, `tools/list tiene que traer seis y trae ${lista?.length}`)
  const nombres = (lista || []).map((t) => t.name).sort()
  igual(
    nombres.join(','),
    'cobertura,dia_habil,dias_habiles_entre,mora,siguiente_habil,vencimiento',
    'tools/list cambio los nombres de las herramientas',
  )
  // La descripcion es la unica defensa contra que el modelo use igual
  // una fecha que no vino: se lo dice donde lo va a leer.
  comprobar(
    (lista || []).every((t) => /ok/.test(t.description || '') && /false/.test(t.description || '')),
    'alguna herramienta MCP no le avisa al modelo que ok:false no trae fecha',
  )
  comprobar(
    (lista || []).every((t) => t.inputSchema && t.inputSchema.type === 'object'),
    'alguna herramienta MCP no declara inputSchema',
  )

  const v = cuerpoDe(porId.get(3))
  igual(v?.ok, true, 'MCP vencimiento no devuelve ok:true')
  igual(v?.vencimiento, '2026-08-11', 'MCP vencimiento mueve la fecha del caso testigo')

  const vNum = cuerpoDe(porId.get(4))
  igual(vNum?.vencimiento, v?.vencimiento, 'MCP da distinto con el plazo como numero que como texto')

  const m = cuerpoDe(porId.get(5))
  igual(m?.vencimiento, '2026-07-12', 'MCP mora mueve la fecha del caso testigo')

  // La misma regla que en HTTP, y aca importa mas: del otro lado hay un
  // modelo, que es exactamente el que puede completar una fecha que no
  // le dieron.
  const sinDato = porId.get(6)
  const cuerpoSinDato = cuerpoDe(sinDato)
  igual(cuerpoSinDato?.ok, false, 'MCP no devolvio ok:false para un año sin feria cargada')
  comprobar(
    cuerpoSinDato?.vencimiento === undefined,
    'MCP devolvio una fecha junto con ok:false',
  )
  comprobar(
    sinDato?.result?.isError === true,
    'MCP no marca isError cuando no hay fecha, y el modelo lo lee como una respuesta buena',
  )

  const cob = cuerpoDe(porId.get(7))
  igual(cob?.ok, true, 'MCP cobertura no contesta')

  const habil = cuerpoDe(porId.get(8))
  igual(habil?.habil, false, 'MCP dia_habil dice que el 9 de julio de 2026 es habil')
}

// ---------------------------------------------------------------

await conHttp(probarHttp)
await probarMcp()

// El punto entero de que sean dos transportes finos sobre un nucleo:
// si dan distinto, el bug es de transporte. Se comprueba, no se supone.
{
  const { HERRAMIENTAS } = await import('../conectores/nucleo.mjs')
  comprobar(Object.keys(HERRAMIENTAS).length === 6, 'el nucleo dejo de exponer seis herramientas')
}

console.log(`${comprobaciones} comprobaciones sobre los dos conectores.`)

if (fallas.length) {
  console.error(`\n${fallas.length} problema(s):`)
  for (const f of fallas) console.error('  ' + f)
  process.exit(1)
}

console.log('Los dos transportes arrancan, dan las mismas fechas que el motor,')
console.log('y cuando falta un dato no devuelven ninguna.')
