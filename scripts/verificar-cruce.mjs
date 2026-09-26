// Banco cruzado: el hook de datos y el anonimizador, sobre el mismo material.
//
// POR QUE EXISTE, 26/9/2026. Hay dos piezas que buscan datos personales por su
// forma: scripts/verificar-datos.sh, que frena un commit, y
// escribiente/js/motor/anonimizar.js, que tapa un escrito antes de darselo a un
// modelo. Se escribieron por separado y cada una aprendio de sus fugas sin que
// la otra se enterara. Corridas juntas sobre el mismo banco aparecieron
// huecos de los dos lados: el hook no veia un celular sin el 54, que el motor
// tapa desde siempre, y marcaba como DNI un monto con espacio despues del signo;
// el motor deja en claro la cedula de la Policia Federal y la matricula sin dos
// puntos, que el hook frena.
//
// QUE HACE, que es lo que las ata una a la otra:
//
//   1. Cada caso de banco-cruzado/casos.json dice si lo tiene que ver el motor
//      y si lo tiene que ver el hook. Si alguno da otra cosa, falla.
//
//   2. Si los dos no coinciden, el caso tiene que decir por que: 'porque' para
//      una diferencia decidida, 'pendiente' para un hueco que falta decidir.
//      Un desacuerdo sin motivo escrito falla.
//
//   3. LA RETROALIMENTACION: cada regla del hook y cada regla del motor tiene
//      que aparecer en al menos un caso. Una regla nueva de cualquiera de los
//      dos lados hace fallar esto hasta que alguien le agrega su ejemplo, y al
//      agregarlo tiene que decir que hace el otro con ese mismo texto. Asi, lo
//      que aprende uno le llega al otro como pregunta, no como olvido.
//
// Las reglas del hook se leen EN VIVO de verificar-datos.sh --las lineas
// `buscar` y `buscar_todo`--, no se copian: una copia se desincroniza. Como
// JavaScript y el grep -P del hook no son el mismo motor de expresiones, al
// final se corre UNA vez el hook mismo sobre el banco entero y se exige que
// dispare exactamente las mismas reglas. Si no, la lectura se desvio y el
// resultado de arriba no vale.
//
// Todo el material es inventado y esta declarado en .datos-ejemplo.
//
// Correr con: npm run verificar-cruce

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    anonimizar,
    REGLAS_IDENTIFICADORES,
    REGLAS_NOMBRES,
} from '../escribiente/js/motor/anonimizar.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const VERIFICADOR = join(AQUI, 'verificar-datos.sh');
const BANCO = join(AQUI, 'banco-cruzado', 'casos.json');

let fallas = 0;
const falla = (msg) => { fallas++; console.log(`  \x1b[31mFALLA\x1b[0m  ${msg}`); };

// --------------------------------------------------------------------------
// Las reglas del hook, leidas del archivo.
// --------------------------------------------------------------------------
const sh = readFileSync(VERIFICADOR, 'utf8');
const reglasHook = [];
const noLeidas = [];
for (const linea of sh.split('\n')) {
    if (!/^\s*buscar(?:_todo)?\s/.test(linea)) continue;
    // buscar '<patron>' '<motivo>'   o   buscar "<patron>" '<motivo>' (el del
    // correo, que lleva adentro la guarda de las direcciones propias; aca va
    // vacia, porque el banco no trae ninguna).
    const m = linea.match(/^\s*buscar(?:_todo)?\s+(?:'([^']*)'|"([^"]*)")\s+'([^']*)'\s*$/);
    if (!m) { noLeidas.push(linea.trim()); continue; }
    const fuente = m[1] ?? m[2].replace(/\$\{guarda_propio\}/g, '').replace(/\\\\/g, '\\');
    try {
        reglasHook.push({ motivo: m[3], re: new RegExp(`(?:${fuente})`) });
    } catch (e) {
        noLeidas.push(`${m[3]}: ${e.message}`);
    }
}
// Un `buscar` que no se pudo leer es una regla que el banco no ve: falla, no avisa.
noLeidas.forEach((l) => falla(`no pude leer esta regla del hook: ${l}`));
// El mismo motivo puede aparecer dos veces (caratulas en modo aviso y bloquea);
// cuenta como una regla.
const motivosHook = [...new Set(reglasHook.map((r) => r.motivo))];

const veHook = (texto) => [...new Set(
    reglasHook.filter((r) => texto.split('\n').some((l) => r.re.test(l))).map((r) => r.motivo))];

// --------------------------------------------------------------------------
// El motor.
// --------------------------------------------------------------------------
const reglasMotor = [...REGLAS_IDENTIFICADORES, ...REGLAS_NOMBRES].map((r) => r.nombre);
const veMotor = (texto) => Object.keys(anonimizar(texto, []).conteo);

// --------------------------------------------------------------------------
// El banco.
// --------------------------------------------------------------------------
// El enlace al visor del PJN no se puede escribir en ningun archivo: es de lo
// que el hook no exime nunca, ni en un banco declarado ejemplo (el porque, en
// la cabecera de verificar-datos.sh). El banco dice {VISOR} y se arma aca, en
// pedazos, igual que en verificar-datos-ejemplos.sh.
const VISOR = ['https://scw', 'pjn', 'gov', 'ar/scw/'].join('.') + 'view' + 'er.seam?id=abc';
const { casos } = JSON.parse(readFileSync(BANCO, 'utf8'));
for (const c of casos) c.texto = c.texto.replaceAll('{VISOR}', VISOR);
const usadasHook = new Set();
const usadasMotor = new Set();
const ids = new Set();
const pendientes = [];

console.log(`\nBanco cruzado: ${casos.length} casos, ${motivosHook.length} reglas del hook, ${reglasMotor.length} del motor\n`);

for (const c of casos) {
    if (ids.has(c.id)) falla(`${c.id}: id repetido`);
    ids.add(c.id);
    if (typeof c.motor !== 'boolean' || typeof c.hook !== 'boolean') {
        falla(`${c.id}: le falta decir motor y hook (true o false)`);
        continue;
    }
    const motor = veMotor(c.texto);
    const hook = veHook(c.texto);
    motor.forEach((r) => usadasMotor.add(r));
    hook.forEach((r) => usadasHook.add(r));

    if ((motor.length > 0) !== c.motor) {
        falla(`${c.id}: el banco dice que el motor ${c.motor ? 'lo tapa' : 'no lo toca'}, y ${motor.length ? `lo tapa (${motor.join(', ')})` : 'no lo toca'}`);
    }
    if ((hook.length > 0) !== c.hook) {
        falla(`${c.id}: el banco dice que el hook ${c.hook ? 'lo frena' : 'lo deja pasar'}, y ${hook.length ? `lo frena (${hook.join(', ')})` : 'lo deja pasar'}`);
    }
    if (c.motor !== c.hook && !c.porque && !c.pendiente) {
        falla(`${c.id}: el motor y el hook no coinciden y no dice por que ('porque' o 'pendiente')`);
    }
    if (c.porque && c.pendiente) falla(`${c.id}: o es 'porque' (decidido) o es 'pendiente', no los dos`);
    if (c.pendiente) pendientes.push(c);
}

// La retroalimentacion: ninguna regla de ninguno de los dos lados sin su caso.
for (const r of motivosHook) {
    if (!usadasHook.has(r)) {
        falla(`regla del hook sin caso en el banco: «${r}». Agrega un ejemplo y deci que hace el motor con el`);
    }
}
for (const r of reglasMotor) {
    if (!usadasMotor.has(r)) {
        falla(`regla del motor sin caso en el banco: «${r}». Agrega un ejemplo y deci que hace el hook con el`);
    }
}

// --------------------------------------------------------------------------
// La calibracion: el hook mismo, una vez, sobre el banco entero.
// --------------------------------------------------------------------------
const dir = mkdtempSync(join(tmpdir(), 'banco-cruzado-'));
try {
    const archivo = join(dir, 'banco.txt');
    writeFileSync(archivo, casos.map((c) => c.texto).join('\n') + '\n');
    const r = spawnSync('bash', [VERIFICADOR], {
        cwd: AQUI,
        encoding: 'utf8',
        env: { ...process.env, DATOS_MENSAJE: archivo },
    });
    if (r.error) {
        falla(`no pude correr el hook (${r.error.message}); sin la calibracion, lo de arriba no esta confirmado`);
    } else {
        const salida = (r.stdout || '').replace(/\x1b\[[0-9;]*m/g, '');
        // Cada bloqueo sale como "BLOQUEA  contenido" y el motivo en la linea de abajo.
        const lineas = salida.split('\n');
        const disparadas = new Set();
        lineas.forEach((l, i) => {
            if (/BLOQUEA\s+contenido/.test(l) && lineas[i + 1]) disparadas.add(lineas[i + 1].trim());
        });
        // Solo importan las reglas de forma: la lista privada y el vocabulario
        // de redaccion tambien corren en ese modo y no son de este banco.
        const reales = [...disparadas].filter((m) => motivosHook.includes(m));
        const leidas = [...usadasHook];
        for (const m of leidas) if (!reales.includes(m)) falla(`calibracion: la lectura dice que «${m}» salta en el banco y el hook no la dispara`);
        for (const m of reales) if (!leidas.includes(m)) falla(`calibracion: el hook dispara «${m}» y la lectura no la ve`);
    }
} finally {
    rmSync(dir, { recursive: true, force: true });
}

// --------------------------------------------------------------------------
if (pendientes.length) {
    console.log(`\n  \x1b[33mPendientes de decidir (${pendientes.length})\x1b[0m: huecos conocidos, no fallan.`);
    for (const c of pendientes) {
        console.log(`    ${c.id}  motor:${c.motor ? 'tapa' : 'no'}  hook:${c.hook ? 'frena' : 'no'}`);
    }
}
console.log('');
if (fallas) {
    console.log(`\x1b[31m${fallas} falla(s).\x1b[0m`);
    process.exit(1);
}
console.log(`\x1b[32mEl hook y el motor estan de acuerdo en los ${casos.length} casos, o dicen por que no.\x1b[0m`);
