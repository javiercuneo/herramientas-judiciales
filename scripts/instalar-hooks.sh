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
plantilla="$raiz/scripts/hooks/pre-commit"
verificador="$raiz/scripts/verificar-datos.sh"

HOOKS_DIR="${HOOKS_DIR:-$HOME/.git-hooks}"
LISTA_PRIVADA="${LISTA_PRIVADA:-}"

verde() { printf '\033[32m%s\033[0m\n' "$1"; }
amar()  { printf '\033[33m%s\033[0m\n' "$1"; }

[ -f "$plantilla" ]   || { echo "No esta $plantilla"; exit 1; }
[ -f "$verificador" ] || { echo "No esta $verificador"; exit 1; }

mkdir -p "$HOOKS_DIR"
cp "$plantilla" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

git config --global core.hooksPath "$HOOKS_DIR"
git config --global datos.verificador "$verificador"
[ -n "$LISTA_PRIVADA" ] && git config --global datos.listaPrivada "$LISTA_PRIVADA"

verde "Hook compartido instalado."
echo "  corre desde   $HOOKS_DIR/pre-commit"
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
