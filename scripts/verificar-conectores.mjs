// ---------------------------------------------------------------
// Controla los dos conectores de conectores/.
//
//   npm run verificar-conectores
//
// Que existe: el computo de plazos y el anonimizador de Escribiente,
// expuestos por HTTP local (conectores/http.mjs) y por MCP sobre stdio
// (conectores/mcp.mjs). Los dos transportes cuelgan de dos registros:
// conectores/nucleo.mjs, que es el mismo motor de plazos que consumen
// las calculadoras, y conectores/anonimizar.mjs, que es el mismo motor
// que corre adentro de Escribiente.
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
    Array.isArray(indice.cuerpo?.endpoints) && indice.cuerpo.endpoints.length === 11,
    `GET / tiene que listar los once endpoints y lista ${indice.cuerpo?.endpoints?.length}`,
  )
  // El aviso de la anonimizacion va en el indice por lo mismo que el de
  // ok:false: es donde el que llama se entera de la regla antes de
  // toparse con ella.
  comprobar(
    /no se reemplazan solos/i.test(indice.cuerpo?.anonimizacion || ''),
    'GET / no avisa que los nombres propios no se reemplazan solos',
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
// El anonimizador, sobre los dos transportes
//
// Lo que se prueba aca NO es que anonimice --de eso se ocupa
// verificar-escribiente, con 292 comprobaciones sobre el motor-- sino
// las tres cosas que solo puede romper el conector:
//
//   - que la capa 2 se aplique sola. Un nombre propio tapado sin que
//     nadie lo confirme es texto corrompido: ninguna regla distingue a
//     la parte del autor de doctrina. El conector no tiene pantalla, y
//     es el unico lugar donde esa distincion se puede perder.
//   - que una etiqueta inventada pase. Reemplaza igual PERO apaga la
//     deteccion de lo que queda pegado al reemplazo, que es la fuga
//     E-01: medio apellido publicado en un archivo que se lee limpio.
//   - que un texto que falta devuelva un resultado. Un texto vacio
//     anonimizado da un texto vacio, y eso se lee como "no habia nada
//     que tapar".
// ---------------------------------------------------------------

const ESCRITO_DE_PRUEBA =
  'Comparece Ficticio, Juan Carlos, DNI 30.119.078, y ratifica. Firma el Sr. Qu1nteros, Anibal.'

async function probarAnonimizadorHttp() {
  // --- la capa 1 corre sola y la capa 2 NO ---
  const capa1 = await pedir('/anonimizar-texto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: ESCRITO_DE_PRUEBA }),
  })
  igual(capa1.estado, 200, 'POST /anonimizar-texto no contesta 200')
  igual(capa1.cuerpo?.ok, true, '/anonimizar-texto no contesta ok:true')
  comprobar(
    !capa1.cuerpo?.texto?.includes('30.119.078'),
    'el conector no tapo el DNI, que es capa 1 y va sin preguntarle a nadie',
  )
  comprobar(
    capa1.cuerpo?.texto?.includes('Ficticio, Juan Carlos'),
    'EL CONECTOR TAPO UN NOMBRE PROPIO SIN QUE NADIE LO CONFIRME: la capa 2 se aplico sola',
  )

  // --- y el nombre se propone, que es la otra mitad de la regla ---
  const propuestos = await pedir('/candidatos-a-nombre', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: ESCRITO_DE_PRUEBA }),
  })
  const textos = (propuestos.cuerpo?.candidatos || []).map((c) => c.texto)
  comprobar(
    textos.includes('Ficticio, Juan Carlos'),
    `/candidatos-a-nombre no propone el nombre que no tapo: ${textos.join(' | ')}`,
  )

  // --- confirmado, se tapa; y los restos vienen en la misma respuesta ---
  const capa2 = await pedir('/anonimizar-texto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texto: ESCRITO_DE_PRUEBA,
      elegidos: [{ texto: 'Juan Carlos', reemplazo: '[PERSONA_2]' }],
    }),
  })
  comprobar(
    capa2.cuerpo?.texto?.includes('[PERSONA_2]'),
    'el conector no aplica el reemplazo confirmado, ni con etiqueta numerada',
  )
  const restos = (capa2.cuerpo?.restos || []).map((r) => r.texto)
  comprobar(
    restos.includes('Ficticio'),
    `la respuesta no trae el apellido que quedo pegado a la etiqueta: ${restos.join(' | ')}`,
  )
  comprobar(
    typeof capa2.cuerpo?.aviso === 'string' && capa2.cuerpo.aviso.length > 0,
    'quedaron restos y la respuesta no lo dice en palabras',
  )

  // --- una etiqueta inventada se rechaza ANTES de tapar nada ---
  const inventada = await pedir('/anonimizar-texto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texto: ESCRITO_DE_PRUEBA,
      elegidos: [{ texto: 'Juan Carlos', reemplazo: '[PARTE]' }],
    }),
  })
  igual(inventada.cuerpo?.ok, false, 'una etiqueta inventada no se rechaza, y apaga la deteccion de restos')
  comprobar(
    inventada.cuerpo?.texto === undefined,
    'se rechazo la etiqueta y aun asi vino un texto anonimizado',
  )
  comprobar(
    /PERSONA/.test(inventada.cuerpo?.problema || ''),
    'el rechazo no dice cuales son las etiquetas validas',
  )

  // --- un texto que falta no devuelve un resultado ---
  for (const [ruta, cuerpo] of [
    ['/anonimizar-texto', {}],
    ['/candidatos-a-nombre', { texto: '   ' }],
    ['/restos-pegados', {}],
    ['/aparece-en-el-texto', { texto: 'algo' }],
  ]) {
    const r = await pedir(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
    igual(r.cuerpo?.ok, false, `${ruta} sin texto devolvio un resultado en vez del motivo`)
    comprobar(
      typeof r.cuerpo?.problema === 'string' && r.cuerpo.problema.length > 0,
      `${ruta} contesta ok:false sin decir por que`,
    )
  }

  // --- la caratula: el orden es contrato, y no haberla no es lista vacia ---
  const caratula = await pedir('/partes-de-caratula', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: 'autos FICTICIO, ANA c/ INVENTADO, LUIS s/ DANOS Y PERJUICIOS' }),
  })
  igual(caratula.cuerpo?.actor, 'FICTICIO, ANA', 'la caratula no da el actor primero')
  igual(caratula.cuerpo?.demandado, 'INVENTADO, LUIS', 'la caratula no da el demandado segundo')

  const sinCaratula = await pedir('/partes-de-caratula', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: 'Un escrito cualquiera, sin caratula adentro.' }),
  })
  igual(sinCaratula.cuerpo?.ok, false, 'sin caratula se devuelve una lista vacia, que se lee como "no hay partes"')

  // --- el cotejo de alias, tolerante al espaciado del PDF ---
  const alias = await pedir('/aparece-en-el-texto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: 'declaro ERNESTO   QUIROGA en la audiencia', frase: 'Ernesto Quiroga' }),
  })
  igual(alias.cuerpo?.aparece, true, 'el cotejo de alias no tolera el espaciado, y ahi los dos lados discrepan')
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
    // El anonimizador por el otro transporte: tiene que dar lo mismo que
    // por HTTP, que es el punto entero de que sean dos transportes finos.
    llamar(9, 'anonimizar_texto', { texto: ESCRITO_DE_PRUEBA }),
    llamar(10, 'anonimizar_texto', {
      texto: ESCRITO_DE_PRUEBA,
      elegidos: [{ texto: 'Juan Carlos', reemplazo: '[PERSONA_2]' }],
    }),
    llamar(11, 'anonimizar_texto', {
      texto: ESCRITO_DE_PRUEBA,
      elegidos: [{ texto: 'Juan Carlos', reemplazo: '[PARTE]' }],
    }),
    llamar(12, 'partes_de_caratula', { texto: 'Un escrito cualquiera, sin caratula adentro.' }),
  ])

  if (agotado) {
    mal(`el conector MCP no contesto en 20 segundos. stderr:\n${error.trim()}`)
    return
  }

  const init = porId.get(1)
  comprobar(init?.result?.protocolVersion === '2024-11-05', 'initialize no devuelve la version del protocolo')
  comprobar(!!init?.result?.serverInfo?.name, 'initialize no se identifica')

  const lista = porId.get(2)?.result?.tools
  comprobar(Array.isArray(lista) && lista.length === 11, `tools/list tiene que traer once y trae ${lista?.length}`)
  const nombres = (lista || []).map((t) => t.name).sort()
  igual(
    nombres.join(','),
    'anonimizar_texto,aparece_en_el_texto,candidatos_a_nombre,cobertura,dia_habil,' +
      'dias_habiles_entre,mora,partes_de_caratula,restos_pegados,siguiente_habil,vencimiento',
    'tools/list cambio los nombres de las herramientas',
  )
  // El aviso de cada familia es distinto porque el modo de falla es
  // distinto: en plazos el peligro es usar una fecha que no vino, en la
  // anonimizacion es tapar por adivinanza. Un aviso generico no sirve.
  comprobar(
    (lista || []).filter((t) => /no se reemplazan solos/i.test(t.description || '')).length === 5,
    'las cinco herramientas de anonimizacion tienen que avisarle al modelo que no elige el solo',
  )
  // `elegidos` es una lista de objetos y no un texto. Declararlo string
  // hace que un modelo mande un JSON adentro de un string y se lo
  // rechace por no ser una lista, sin que se entienda por que.
  const esquemaAnon = (lista || []).find((t) => t.name === 'anonimizar_texto')?.inputSchema
  igual(
    esquemaAnon?.properties?.elegidos?.type,
    'array',
    'anonimizar_texto declara los elegidos como texto y no como lista',
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

  // --- el anonimizador, las mismas tres reglas que por HTTP ---
  const soloCapa1 = cuerpoDe(porId.get(9))
  comprobar(
    !soloCapa1?.texto?.includes('30.119.078'),
    'MCP no tapo el DNI, que va sin preguntarle a nadie',
  )
  comprobar(
    soloCapa1?.texto?.includes('Ficticio, Juan Carlos'),
    'MCP TAPO UN NOMBRE PROPIO SIN CONFIRMAR: del otro lado hay un modelo, que es el que no puede elegir',
  )

  const conElegidos = cuerpoDe(porId.get(10))
  comprobar(conElegidos?.texto?.includes('[PERSONA_2]'), 'MCP no aplica el reemplazo confirmado')
  comprobar(
    (conElegidos?.restos || []).some((r) => r.texto === 'Ficticio'),
    'MCP no devuelve el apellido que quedo pegado a la etiqueta',
  )

  const etiquetaMala = porId.get(11)
  igual(cuerpoDe(etiquetaMala)?.ok, false, 'MCP acepta una etiqueta inventada')
  comprobar(
    etiquetaMala?.result?.isError === true,
    'MCP no marca isError con una etiqueta invalida, y el modelo lo lee como que tapo bien',
  )

  const sinCaratulaMcp = porId.get(12)
  igual(cuerpoDe(sinCaratulaMcp)?.ok, false, 'MCP devuelve lista vacia cuando no hay caratula')
  comprobar(
    sinCaratulaMcp?.result?.isError === true,
    'MCP no marca isError cuando no encontro caratula',
  )
}

// ---------------------------------------------------------------

await conHttp(async () => {
  await probarHttp()
  await probarAnonimizadorHttp()
})
await probarMcp()

// El punto entero de que sean dos transportes finos sobre un nucleo:
// si dan distinto, el bug es de transporte. Se comprueba, no se supone.
{
  const { HERRAMIENTAS } = await import('../conectores/nucleo.mjs')
  comprobar(Object.keys(HERRAMIENTAS).length === 6, 'el nucleo de plazos dejo de exponer seis herramientas')
  const { HERRAMIENTAS_ANONIMIZAR } = await import('../conectores/anonimizar.mjs')
  comprobar(
    Object.keys(HERRAMIENTAS_ANONIMIZAR).length === 5,
    'el nucleo del anonimizador dejo de exponer cinco herramientas',
  )
}

console.log(`${comprobaciones} comprobaciones sobre los dos conectores.`)

if (fallas.length) {
  console.error(`\n${fallas.length} problema(s):`)
  for (const f of fallas) console.error('  ' + f)
  process.exit(1)
}

console.log('Los dos transportes arrancan, dan las mismas fechas que el motor,')
console.log('y cuando falta un dato no devuelven ninguna. El anonimizador corre')
console.log('la capa 1 solo y no tapa un nombre propio sin que alguien lo confirme.')
