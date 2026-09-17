# -*- coding: utf-8 -*-
"""Compara las dos salidas y arma la tabla de diferencias."""
import io, json, sys, re

import os
B = os.path.dirname(os.path.abspath(__file__))
corpus = {c['id']: c for c in json.load(io.open(B + r'\corpus.json', encoding='utf-8'))}
js = json.load(io.open(B + r'\salida-js.json', encoding='utf-8'))
py = json.load(io.open(B + r'\salida-py.json', encoding='utf-8'))

ETIQUETA = re.compile(r'\[[A-ZÁÉÍÓÚÑ_]+\]')

def etiquetas(t):
    return sorted(ETIQUETA.findall(t or ''))

iguales, difieren = [], []
for cid, caso in corpus.items():
    a, b = js[cid], py[cid]
    mismo_texto = a['texto'] == b['texto']
    if mismo_texto and sorted(a['candidatos']) == sorted(b['candidatos']) \
       and sorted(a['caratula']) == sorted(b['caratula']):
        iguales.append(cid)
        continue
    difieren.append({
        'id': cid,
        'familia': caso['familia'],
        'entrada': caso['texto'].replace('\n', ' / '),
        'js': a['texto'].replace('\n', ' / '),
        'py': b['texto'].replace('\n', ' / '),
        'js_etq': etiquetas(a['texto']),
        'py_etq': etiquetas(b['texto']),
        'js_cand': a['candidatos'],
        'py_cand': b['candidatos'],
        'js_car': a['caratula'],
        'py_car': b['caratula'],
        'err': (a['error'], b['error']),
    })

print('=' * 78)
print('%d casos: %d dan lo mismo, %d difieren' % (len(corpus), len(iguales), len(difieren)))
print('=' * 78)

# Lo que importa para la decision: donde el Python tapa algo que el JS NO tapa.
py_gana, js_gana, otras = [], [], []
for d in difieren:
    solo_py = [e for e in d['py_etq'] if d['py_etq'].count(e) > d['js_etq'].count(e)]
    solo_js = [e for e in d['js_etq'] if d['js_etq'].count(e) > d['py_etq'].count(e)]
    if solo_py:
        py_gana.append((d, solo_py))
    elif solo_js:
        js_gana.append((d, solo_js))
    else:
        otras.append(d)

print('\n### DONDE EL PYTHON TAPA ALGO QUE EL JS NO  (%d)' % len(py_gana))
print('### Es la unica pregunta que decide si se puede reemplazar.\n')
for d, etq in py_gana:
    print('  [%s] %s' % (d['familia'], d['id']))
    print('    entra : %s' % d['entrada'][:110])
    print('    js    : %s' % d['js'][:110])
    print('    py    : %s   <-- tapa de mas: %s' % (d['py'][:110], ','.join(etq)))
    print()

print('\n### DONDE EL JS TAPA ALGO QUE EL PYTHON NO  (%d)\n' % len(js_gana))
for d, etq in js_gana:
    print('  [%s] %s   (%s)' % (d['familia'], d['id'], ','.join(etq)))
    print('    entra : %s' % d['entrada'][:110])
    print('    js    : %s' % d['js'][:110])
    print('    py    : %s' % d['py'][:110])
    print()

print('\n### MISMAS ETIQUETAS, DISTINTO RESULTADO  (%d)\n' % len(otras))
for d in otras:
    print('  [%s] %s' % (d['familia'], d['id']))
    if d['js'] != d['py']:
        print('    js    : %s' % d['js'][:110])
        print('    py    : %s' % d['py'][:110])
    if sorted(d['js_cand']) != sorted(d['py_cand']):
        print('    cand js: %s' % d['js_cand'])
        print('    cand py: %s' % d['py_cand'])
    if sorted(d['js_car']) != sorted(d['py_car']):
        print('    carat js: %s' % d['js_car'])
        print('    carat py: %s' % d['py_car'])
    print()

print('\n### IDENTICOS (%d): %s' % (len(iguales), ', '.join(iguales)))
