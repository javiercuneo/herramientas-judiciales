#!/usr/bin/env bash
# Instala el hook de pre-commit compartido para TODOS los repositorios de
# la maquina, presentes y futuros.
#
#   bash scripts/instalar-hooks.sh
#
# Antes esto ponia el hook repositorio por repositorio, leyendo una lista
# escrita a mano. Funcionaba, y tenia un agujero que no se ve: **un
# repositorio nuevo no quedaba cubierto y nadie avisaba**. La lista habia
# que acordarse de actualizarla, que es la misma clase de problema que el
# hook viene a resolver.
#
# Ahora se apunta `core.hooksPath` global a un directorio fuera de todo
# arbol de git, con una copia de `scripts/hooks/pre-commit` adentro. Desde
# ahi corre en cualquier repositorio, incluidos los que todavia no existen.
#
# LO QUE HAY QUE SABER ANTES DE CORRERLO:
#
#   - `core.hooksPath` global **desactiva `.git/hooks/` en todos los
#     repositorios de la maquina.** Lo que haya ahi deja de correr. Por eso
#     el hook compartido encadena a `<repo>/.githooks/pre-commit`: lo que
#     era propio de un repositorio se muda ahi y sigue corriendo.
#   - No pongas `core.hooksPath` por repositorio: pisa al global y el
#     control de datos personales deja de correr sin avisar.
#
# Para deshacerlo:  git config --global --unset core.hooksPath
#
# Variables (todas opcionales):
#   HOOKS_DIR       donde va la copia que corre. Default: $HOME/.git-hooks
#   LISTA_PRIVADA   ruta de la lista de terminos propios. Si se pasa, se
#                   guarda en la config global. **No tiene default y no se
#                   escribe en este archivo a proposito**: este repositorio
#                   es publico y la ruta de esa lista no tiene por que
#                   estarlo.

set -eu

raiz=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
verificador="$raiz/scripts/verificar-datos.sh"

# Los tres hooks compartidos. Eran uno solo hasta el 17/9/2026: el pre-commit.
# Los otros dos salieron de comprobar que el pre-commit solo ve lo que nace de
# el, y que habia dos caminos por los que salia material sin que nada lo mirara:
#
#   commit-msg  el mensaje no esta en el indice, asi que el pre-commit no lo ve
#               nunca. Dos hallazgos de la auditoria eran mensajes de commit.
#   pre-push    un merge no dispara pre-commit, y un --no-verify, un cherry-pick
#               o cualquier historia importada tampoco. Es la ultima puerta.
HOOKS=(pre-commit commit-msg pre-push)

HOOKS_DIR="${HOOKS_DIR:-$HOME/.git-hooks}"
LISTA_PRIVADA="${LISTA_PRIVADA:-}"

verde() { printf '\033[32m%s\033[0m\n' "$1"; }
amar()  { printf '\033[33m%s\033[0m\n' "$1"; }

for h in "${HOOKS[@]}"; do
  [ -f "$raiz/scripts/hooks/$h" ] || { echo "No esta $raiz/scripts/hooks/$h"; exit 1; }
done
[ -f "$verificador" ] || { echo "No esta $verificador"; exit 1; }

mkdir -p "$HOOKS_DIR"
for h in "${HOOKS[@]}"; do
  cp "$raiz/scripts/hooks/$h" "$HOOKS_DIR/$h"
  chmod +x "$HOOKS_DIR/$h"
done

git config --global core.hooksPath "$HOOKS_DIR"
git config --global datos.verificador "$verificador"
[ -n "$LISTA_PRIVADA" ] && git config --global datos.listaPrivada "$LISTA_PRIVADA"

verde "Hooks compartidos instalados: ${HOOKS[*]}"
echo "  corren desde  $HOOKS_DIR/"
echo "  verificador   $verificador"

lista=$(git config --global --get datos.listaPrivada || true)
if [ -n "$lista" ] && [ -f "$lista" ]; then
  echo "  lista privada configurada y encontrada"
else
  echo
  amar "La lista de terminos propios no esta configurada o no se encontro."
  amar "Los patrones genericos igual corren; los terminos propios no se verifican."
  echo "  LISTA_PRIVADA=<ruta> bash scripts/instalar-hooks.sh"
fi

# Los hooks viejos por repositorio quedan inertes -core.hooksPath los
# desactiva- pero siguen en disco y confunden al que los lea. Se listan y
# no se borran: borrar en el .git de otro repositorio no es de este script.
echo
sobrantes=0
while IFS= read -r h; do
  [ -f "$h" ] || continue
  sobrantes=$((sobrantes + 1))
  [ "$sobrantes" -eq 1 ] && amar "Hooks viejos que ya no corren (se pueden borrar a mano):"
  echo "  $h"
done < <(find "${REPOS_RAIZ:-/c/IA}" -maxdepth 6 -name node_modules -prune -o \
              -path '*/.git/hooks/pre-commit' -print 2>/dev/null)
[ "$sobrantes" -eq 0 ] && echo "No quedan hooks viejos por repositorio."

echo
# El ejemplo no lleva el numero escrito, y no es un descuido: cualquier
# literal que sirva para probar el control es, por definicion, un literal
# que el control bloquea. Antes que excluir este archivo del barrido
# -que lo dejaria sin proteger- se prefiere no escribirlo.
echo "Probalo en cualquier repositorio: stagea un archivo que traiga un documento"
echo "de identidad inventado, con puntos, y fijate que el commit se detenga."
