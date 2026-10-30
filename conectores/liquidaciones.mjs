// La tasa de justicia y el prorrateo del art. 730, consultables desde codigo.
//
// Es el tercer registro de los conectores, al lado de nucleo.mjs (plazos) y
// anonimizar.mjs, y cuelga de los mismos dos transportes: http.mjs y mcp.mjs.
//
// LO QUE ESTE ARCHIVO NO HACE ES CALCULAR. Carga calculadoras/js/tasa.js y
// calculadoras/js/prorrateo.js --los mismos que consumen las pantallas desde
// el 29/10/2026-- y traduce sus objetos a JSON. No hay una sola cuenta propia
// aca: ni un subtotal. Una segunda implementacion de una cuenta con
// consecuencia juridica es el modo de falla que produjo el bug de la feria.
//
// LAS REGLAS DEL CONTRATO, las mismas de plazos:
//   - con un dato faltante, ilegible o fuera de rango la respuesta es
//     `ok: false` y el motivo, y NO trae importes. No hay medio resultado: la
//     pantalla puede poner el aviso al lado del numero; del otro lado de un
//     conector no hay nadie leyendo.
//   - las fechas viajan como AAAA-MM-DD y los montos como numero. Los
//     numeros salen tal como los da el motor, sin redondear: redondear es
//     presentacion, y un redondeo de aca podria no coincidir con el de la
//     pantalla.
//
// Los datos del sistema --el monto fijo del art. 6 y la UMA-- se leen del
// repositorio, de los mismos JSON que lee el sitio, y la respuesta dice cual
// se uso y de que acto sale.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ErrorDeEntrada } from './nucleo.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

let motores = null;

async function cargar() {
    if (motores) return motores;
    const ventana = {};
    const fetchLocal = async (url) => {
        const limpia = String(url).split('?')[0].replace(/^\.\.\//, '');
        const texto = await readFile(join(RAIZ, limpia), 'utf8');
        return { ok: true, status: 200, json: async () => JSON.parse(texto) };
    };
    // El orden importa: los dos motores buscan el lector de importes ya
    // colgado de `window`.
    for (const archivo of ['importes.js', 'tasa.js', 'prorrateo.js']) {
        const fuente = await readFile(join(RAIZ, 'calculadoras', 'js', archivo), 'utf8');
        new Function('window', 'fetch', fuente)(ventana, fetchLocal);
    }
    motores = { T: ventana.Tasa, P: ventana.Prorrateo };
    return motores;
}

function fechaOpcional(texto, campo) {
    if (texto === undefined || texto === null || texto === '') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto).trim());
    const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (!m || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
        throw new ErrorDeEntrada(`${campo} tiene que ser una fecha que exista, con el formato AAAA-MM-DD.`);
    }
    return m[0];
}

// Un booleano puede llegar como texto por la query de HTTP o desde un modelo.
const booleano = (v) => v === true || v === 'true' || v === '1' || v === 1;

const describirValor = (v) => (v ? { valor: v.valor, vigencia: v.vigencia, norma: v.norma } : null);

// ---------------------------------------------------------------------------
// Tasa de justicia
// ---------------------------------------------------------------------------

/**
 * La tasa de justicia de la Ley 23.898 para un caso: un supuesto y uno o
 * varios renglones, que es exactamente lo que se carga en tasa.html.
 */
export async function tasaDeJusticia(entrada = {}) {
    const { T } = await cargar();
    const fecha = fechaOpcional(entrada.fecha, 'La fecha');

    const renglones = Array.isArray(entrada.renglones)
        ? entrada.renglones.map((r) => ({
            ...r,
            extranha: booleano(r?.extranha),
            ...(r && r.conSobretasa !== undefined ? { conSobretasa: booleano(r.conSobretasa) } : {})
        }))
        : entrada.renglones;

    // El monto fijo del art. 6, si un renglon lo necesita y no vino: el
    // vigente en la fecha --la de la demanda, si se dice; si no, hoy--.
    let montoFijo = entrada.montoFijo;
    let montoFijoUsado = null;
    const sup = T.porId(T.SUPUESTOS, entrada.supuesto);
    const usaFijo = !!sup && (renglones || []).some((r) => {
        const item = r && T.porId(sup.items, r.item);
        return item && T.porId(T.BASES, item.base)?.montoFijo;
    });
    if (usaFijo && (montoFijo === undefined || montoFijo === null || montoFijo === '')) {
        const serie = await T.cargarMontoFijo();
        const vigente = T.montoFijoVigente(serie.valores || [], fecha);
        if (!vigente) {
            return { ok: false, problema: `No hay un monto fijo del art. 6 vigente${fecha ? ' el ' + fecha : ''} en data/tasa-monto-fijo.json.` };
        }
        montoFijo = vigente.valor;
        montoFijoUsado = describirValor(vigente);
    }

    const r = T.liquidarCaso({
        supuesto: entrada.supuesto,
        testamento: booleano(entrada.testamento),
        montoFijo,
        renglones
    });
    if (r.problema) return { ok: false, problema: r.problema };

    return {
        ok: true,
        supuesto: { id: r.supuesto.id, rotulo: r.supuesto.rotulo },
        renglones: r.cuentas.map((c) => ({
            item: c.item.id,
            rotulo: c.item.rotulo,
            nombre: c.nombre || undefined,
            clase: c.clase.id,
            base: c.base.cita,
            alicuota: {
                id: c.alicuota.id,
                cita: c.alicuota.cita,
                ...(c.alicuota.tramos
                    ? { tramos: c.alicuota.tramos.map((t) => ({ hasta: t.hasta === Infinity ? null : t.hasta, tasa: t.tasa })) }
                    : c.alicuota.fija ? { sumaFija: true } : { tasa: c.alicuota.tasa })
            },
            importe: c.importe,
            factor: c.factor,
            titularidad: c.llevaTitularidad ? c.titularidad : undefined,
            imponible: c.imponible,
            tasaDeLey: c.tasaPelada,
            sobretasa: c.llevaSobretasa ? { puntos: c.puntosSobretasa, importe: c.sobretasa } : undefined,
            tasa: c.tasa,
            alicuotaEfectiva: c.montoFijo ? undefined : c.efectiva
        })),
        total: {
            imponible: r.totales.imponible,
            tasaDeLey: r.totales.pelada,
            sobretasa: r.totales.sobretasa,
            tasa: r.totales.tasa
        },
        // Las ampliaciones de demanda se liquidan como juicios independientes
        // (art. 8): con alguna, el total no se integra de una sola vez.
        ampliaciones: r.totales.art8,
        // Cuando se paga: las citas del art. 9 que rigen para estos renglones.
        momentos: r.momentos.map((m) => m[0]),
        montoFijo: montoFijoUsado
    };
}

// ---------------------------------------------------------------------------
// Prorrateo del art. 730
// ---------------------------------------------------------------------------

/**
 * El prorrateo del art. 730 CCyC: si las costas pasan el 25 % del monto del
 * proceso, los honorarios regulados se reparten el tope en proporcion.
 */
export async function prorrateo730(entrada = {}) {
    const { P } = await cargar();
    const regulaciones = Array.isArray(entrada.regulaciones)
        ? entrada.regulaciones.map((f) => ({ monto: f?.monto, uma: booleano(f?.uma), iva: booleano(f?.iva), concepto: f?.concepto }))
        : entrada.regulaciones;

    // La UMA, si alguna regulacion esta en UMA y no vino: la vigente hoy, que
    // es la que toma la pantalla.
    let uma = entrada.uma;
    let umaUsada = null;
    if (Array.isArray(regulaciones) && regulaciones.some((f) => f.uma) && (uma === undefined || uma === null || uma === '')) {
        const serie = await P.cargarUma();
        const vigente = P.umaVigente(serie.valores || []);
        if (!vigente) return { ok: false, problema: 'No hay un valor de UMA vigente en data/serie-uma.json.' };
        uma = vigente.valor;
        umaUsada = describirValor(vigente);
    }

    // Con `tasa`, la tasa de justicia es la cargada; sin ella, el 3 % del
    // art. 2 de la Ley 23.898, como en la pantalla.
    const conTasa = !(entrada.tasa === undefined || entrada.tasa === null || entrada.tasa === '');
    const r = P.calcular({
        monto: entrada.monto,
        uma,
        tasaManual: conTasa,
        tasaImporte: entrada.tasa,
        tasaEnBase: entrada.tasaEnBase === undefined ? undefined : booleano(entrada.tasaEnBase),
        regulaciones
    });
    if (r.problema) return { ok: false, problema: r.problema };

    const k = r.cuenta;
    const p = k.prorrateo;
    return {
        ok: true,
        monto: k.monto,
        techo: p.techo,
        tasa: { importe: p.tasa, cargada: k.tasaManual, enLaBase: p.tasaEnBase },
        topeHonorarios: p.topeHonorarios,
        totalRegulado: p.totalRegulado,
        costas: p.costas,
        porcentajeDelProceso: p.porcentajeProceso,
        prorratea: p.prorratea,
        cobrado: p.cobrado,
        recorte: p.recorte,
        recortePorcentaje: p.recortePorcentaje,
        regulaciones: regulaciones.map((f, i) => ({
            concepto: f.concepto || undefined,
            regulado: k.regulados[i],
            participacion: k.participacion[i],
            prorrateado: p.reparto[i],
            prorrateadoEnUma: k.prorrateadoEnUma[i] ?? undefined
        })),
        uma: umaUsada || (k.hayUma ? { valor: k.uma } : null)
    };
}

// ---------------------------------------------------------------------------

// Lo que el modelo necesita para elegir: los supuestos y sus items, sacados
// del motor y no escritos a mano, para que no se desincronicen.
function listaDeSupuestos() {
    return motores.T.SUPUESTOS.map((s) => `${s.id} (${s.items.map((i) => i.id).join('|')})`).join('; ');
}

const AVISO = ' Si la respuesta trae "ok": false no hay resultado: el campo "problema" dice qué falta, y ese motivo hay que transmitirlo en vez de estimar un importe.';

const RENGLON = {
    type: 'object',
    properties: {
        item: { type: 'string', description: 'qué se valúa: uno de los ítems del supuesto' },
        importe: { type: 'number', description: 'el importe en pesos (en el desalojo, UN mes: la base de seis la multiplica el motor). Como texto se lee igual que en la pantalla: "10.800" es diez mil ochocientos' },
        titularidad: { type: 'number', description: 'porcentaje de la cosa que le toca a quien paga, de 0 a 100 (sólo inmuebles y muebles; sin él, 100)' },
        extranha: { type: 'boolean', description: 'sucesión: el bien está fuera de la jurisdicción nacional (art. 4 inc. g, 2ª parte)' },
        conSobretasa: { type: 'boolean', description: 'sucesión, inmuebles: aplicar la sobretasa de costumbre judicial (por defecto sí)' },
        sobretasa: { type: 'number', description: 'puntos de sobretasa (por defecto 5)' },
        clase: { type: 'string', enum: ['principal', 'ampliacion'], description: '"ampliacion" para una ampliación de demanda, que se liquida aparte (art. 8)' },
        nombre: { type: 'string', description: 'para distinguir el renglón en la respuesta (opcional)' }
    },
    required: ['item']
};

const REGULACION = {
    type: 'object',
    properties: {
        monto: { type: 'number', description: 'lo regulado, en pesos o en UMA. Como texto se lee igual que en la pantalla: "10.800" es diez mil ochocientos' },
        uma: { type: 'boolean', description: 'true si el monto está expresado en UMA' },
        iva: { type: 'boolean', description: 'true si se le suma el IVA (21 %)' },
        concepto: { type: 'string', description: 'quién o qué (opcional)' }
    },
    required: ['monto']
};

export const HERRAMIENTAS_LIQUIDACIONES = {
    tasa_de_justicia: {
        fn: tasaDeJusticia,
        get descripcion() {
            return 'La tasa de justicia de la Ley 23.898 (justicia nacional): monto imponible del art. 4, alícuota de los arts. 2 y 3, la escala concursal, la suma fija de los arts. 5 y 6, y cuándo se paga (art. 9). Supuestos e ítems: ' + listaDeSupuestos() + '.';
        },
        aviso: AVISO,
        entrada: {
            supuesto: 'qué juicio es: demanda, sucesion, desalojo, laboral, concurso, recurso, terceria, mensura, hipoteca o fija',
            renglones: 'lista de { item, importe, titularidad, extranha, conSobretasa, sobretasa, clase, nombre }',
            testamento: 'sucesión: es un testamento o hijuela de extraña jurisdicción, art. 3 inc. d (no mueve el número, cambia la cita)',
            montoFijo: 'la suma fija del art. 6, si se quiere otra que la vigente (opcional)',
            fecha: 'AAAA-MM-DD: el día de la demanda, para elegir la suma fija vigente (opcional; por defecto hoy)'
        },
        esquema: {
            type: 'object',
            properties: {
                supuesto: { type: 'string', description: 'qué juicio es' },
                renglones: { type: 'array', items: RENGLON, description: 'lo que se liquida, uno por bien o pretensión' },
                testamento: { type: 'boolean', description: 'sucesión: testamento o hijuela de extraña jurisdicción (art. 3 inc. d)' },
                montoFijo: { type: 'number', description: 'la suma fija del art. 6, si no es la vigente' },
                fecha: { type: 'string', description: 'AAAA-MM-DD, el día de la demanda (para la suma fija)' }
            },
            required: ['supuesto', 'renglones']
        }
    },
    prorrateo_730: {
        fn: prorrateo730,
        descripcion: 'El prorrateo del art. 730 del Código Civil y Comercial: si las costas de primera instancia superan el 25 % del monto del proceso, los honorarios regulados se reparten el tope en proporción. La tasa de justicia integra las costas: sin "tasa" se toma el 3 % del art. 2 de la Ley 23.898. No decide qué honorarios entran en la base (art. 730 in fine, mediador): eso lo decide quien carga las regulaciones.',
        aviso: AVISO,
        entrada: {
            monto: 'el monto de la sentencia, laudo o transacción, en pesos',
            regulaciones: 'lista de { monto, uma, iva, concepto }',
            tasa: 'la tasa de justicia, si no es el 3 % del monto (opcional)',
            tasaEnBase: 'false si la tasa no integra las costas (por defecto true)',
            uma: 'el valor de la UMA para las regulaciones en UMA (opcional; por defecto la vigente)'
        },
        esquema: {
            type: 'object',
            properties: {
                monto: { type: 'number', description: 'el monto del proceso, en pesos' },
                regulaciones: { type: 'array', items: REGULACION, description: 'los honorarios regulados' },
                tasa: { type: 'number', description: 'la tasa de justicia, si no es el 3 % del monto' },
                tasaEnBase: { type: 'boolean', description: 'false si la tasa no integra las costas' },
                uma: { type: 'number', description: 'el valor de la UMA, si no es el vigente' }
            },
            required: ['monto', 'regulaciones']
        }
    }
};

// La lista de supuestos de la descripcion sale del motor: se carga al
// importar, para que la descripcion este lista cuando la pida un transporte.
await cargar();
