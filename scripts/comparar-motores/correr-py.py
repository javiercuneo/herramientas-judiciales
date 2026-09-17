# -*- coding: utf-8 -*-
"""Corre el anonimizador del pipeline sobre el mismo corpus y escupe JSON.

Todo el material es inventado. No hay un solo dato de una causa real.
"""
import io, json, sys, os, subprocess

# La ruta al repositorio del pipeline NO se escribe aca: este repositorio es
# publico y la ruta dibuja el arbol de uno privado. Se resuelve en la maquina,
# igual que  datos.listaPrivada  y  datos.verificador:
#     git config --global rutas.pipeline "<ruta>"
# La variable de entorno PIPELINE_DIR la pisa, para CI o para una prueba.
def _dir_pipeline():
    d = os.environ.get('PIPELINE_DIR')
    if d:
        return d
    try:
        d = subprocess.check_output(['git', 'config', '--get', 'rutas.pipeline'],
                                    stderr=subprocess.DEVNULL).decode('utf-8').strip()
    except Exception:
        d = ''
    if not d:
        sys.exit('No se pudo resolver el repositorio del pipeline.\n'
                 'Configuralo:  git config --global rutas.pipeline "<ruta>"\n'
                 'o exporta PIPELINE_DIR.')
    return d

sys.path.insert(0, _dir_pipeline())
from pipeline import sanitizar as s

corpus = json.load(io.open(sys.argv[1], encoding='utf-8'))
salida = {}

for caso in corpus:
    texto, error = '', None
    try:
        r = s.anonimizar(caso['texto'], None)
        texto = r if isinstance(r, str) else (r[0] if isinstance(r, (tuple, list)) else str(r))
    except Exception as e:
        error = '%s: %s' % (type(e).__name__, e)

    candidatos, caratula = [], []
    try:
        candidatos = list(s.candidatos_a_nombre(caso['texto']) or [])
    except Exception as e:
        error = error or '%s: %s' % (type(e).__name__, e)
    try:
        caratula = list(s.partes_de_caratula(caso['texto']) or [])
    except Exception as e:
        error = error or '%s: %s' % (type(e).__name__, e)

    salida[caso['id']] = {
        'texto': texto,
        'candidatos': [c if isinstance(c, str) else str(c) for c in candidatos],
        'caratula': [c if isinstance(c, str) else str(c) for c in caratula],
        'error': error,
    }

io.open(sys.argv[2], 'w', encoding='utf-8').write(json.dumps(salida, ensure_ascii=False, indent=1))
print('ok, %d casos' % len(salida))
