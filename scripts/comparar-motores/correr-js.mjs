// Corre el motor de Escribiente sobre el corpus y escupe JSON por stdout.
// Todo el material es inventado: no hay un solo dato de una causa real.
import { readFileSync } from 'node:fs';
import {
  anonimizar,
  candidatosANombre,
  partesDeCaratula,
  // Relativo a este archivo: el motor vive en el mismo repositorio, asi que la
  // ruta no depende de donde este clonado ni de desde donde se corra.
} from '../../escribiente/js/motor/anonimizar.js';

const corpus = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const salida = {};

for (const caso of corpus) {
  let texto = '', error = null;
  try {
    const r = anonimizar(caso.texto, []);
    // anonimizar() puede devolver el texto pelado o un objeto con constancia.
    texto = typeof r === 'string' ? r : (r?.texto ?? r?.resultado ?? JSON.stringify(r));
  } catch (e) { error = String(e && e.message || e); }

  let candidatos = [], caratula = [];
  try { candidatos = candidatosANombre(caso.texto) || []; } catch (e) { error = error || String(e.message); }
  try { caratula = partesDeCaratula(caso.texto) || []; } catch (e) { error = error || String(e.message); }

  salida[caso.id] = {
    texto,
    candidatos: candidatos.map(c => (typeof c === 'string' ? c : (c?.nombre ?? c?.texto ?? JSON.stringify(c)))),
    caratula: caratula.map(c => (typeof c === 'string' ? c : (c?.nombre ?? JSON.stringify(c)))),
    error,
  };
}

process.stdout.write(JSON.stringify(salida, null, 1));
