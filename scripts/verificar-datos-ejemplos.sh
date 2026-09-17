#!/usr/bin/env bash
# Banco de las dos salidas de verificar-datos.sh: `.datos-ejemplo` --lo que E-04
# pedia-- y la guarda del correo con el que se firma.
#
# POR QUE EXISTE. verificar-datos.sh es el verificador de TODOS los repositorios
# de la maquina: `core.hooksPath` global apunta a un hook que lo corre en
# cualquiera. Una exencion mal hecha ahi no afloja este repositorio: los afloja
# todos, y en silencio. Asi que la exencion tiene banco, y el banco exige ver
# BLOQUEAR donde tiene que bloquear —que es la mitad que nadie prueba—.
#
# QUE PRUEBA, en once casos:
#   - sin .datos-ejemplo nada cambia;
#   - declarado, el archivo pasa;
#   - lo que el marcador NO relaja: lista privada, binarios ofimaticos y el
#     enlace al visor del PJN --que este banco arma en tiempo de ejecucion, por
#     la misma razon por la que verificar-datos.sh se excluye a si mismo--;
#   - una exencion sin motivo escrito no vale;
#   - la exencion no se derrama al archivo de al lado;
#   - comentarios, lineas en blanco y rutas con espacios;
#   - y aparte, que el correo del AUTOR no bloquee el push mientras el de
#     cualquier otro si: el pre-push barre `%an` y `%ae` del rango, asi que sin
#     esa guarda ningun push pasa nunca.
#
# Cada caso corre en un repositorio de juguete que se crea y se borra, para no
# depender del estado del indice de nadie.
#
# Uso: npm run verificar-datos-ejemplos
set -u

VERIF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/verificar-datos.sh"
[ -f "$VERIF" ] && : || { echo "No esta $VERIF"; exit 2; }

BASE="$(mktemp -d)"
trap 'rm -rf "$BASE"' EXIT
ok=0; mal=0

rojo() { printf '\033[31m%s\033[0m\n' "$1"; }
verde() { printf '\033[32m%s\033[0m\n' "$1"; }
gris() { printf '\033[90m%s\033[0m\n' "$1"; }

# El material de los casos es inventado y esta construido aca adentro, en vez de
# leerse de un archivo: asi el banco no depende de nada que no venga en el clon.
# Cubre las cuatro formas que el marcador relaja.
fixture() {
  cat > "$1" <<'FIN'
Banco inventado. No hay un solo dato de una causa real.
El actor, 28.456.789, comparece por derecho propio.
La demandada, CUIT 30-71234567-4, no contesto el traslado.
Firma el letrado, T 145 F 872 del CPACF.
Se denuncia telefono 11 4567 8901 a los fines de las notificaciones.
Constituye domicilio electronico en estudio.martinez@mailficticio.com.ar.
FIN
}

nuevo_repo() {
  REPO="$BASE/r$RANDOM$RANDOM"; mkdir -p "$REPO/pruebas"
  git -C "$REPO" init -q
  git -C "$REPO" config user.email a@example.com
  git -C "$REPO" config user.name banco
  # Sin esto el hook global correria adentro del repositorio de juguete.
  git -C "$REPO" config core.hooksPath /dev/null
  # Lista privada vacia salvo que el caso la cargue: sin ninguna declarada el
  # verificador avisa, y el aviso ensucia la lectura del banco.
  : > "$REPO/lista.txt"
  git -C "$REPO" config datos.listaPrivada "$REPO/lista.txt"
}

caso() { # caso <nombre> <bloquea|pasa>
  local nombre="$1" esperado="$2" salida codigo real
  salida=$(cd "$REPO" && bash "$VERIF" 2>&1); codigo=$?
  real=$([ $codigo -ne 0 ] && echo bloquea || echo pasa)
  if [ "$real" = "$esperado" ]; then
    printf '  ok     %-50s %s\n' "$nombre" "$real"; ok=$((ok+1))
  else
    rojo "  FALLA  $nombre"
    printf '         esperaba %s y dio %s\n' "$esperado" "$real"
    printf '%s\n' "$salida" | sed 's/^/           /' | head -6
    mal=$((mal+1))
  fi
}

echo
echo "Banco de .datos-ejemplo"
echo "================================================================"

gris "  Sin declarar nada, nada cambia"
nuevo_repo; fixture "$REPO/pruebas/corpus.txt"
git -C "$REPO" add -A
caso "material con formas, sin declarar" bloquea

gris "  Declarado, pasa"
nuevo_repo; fixture "$REPO/pruebas/corpus.txt"
printf 'pruebas/corpus.txt  # banco inventado del anonimizador\n' > "$REPO/.datos-ejemplo"
git -C "$REPO" add -A
caso "el mismo material, declarado" pasa

gris "  Lo que el marcador NO relaja"
nuevo_repo
# El enlace se ARMA y no se escribe: esa regla no la relaja ningun marcador, asi
# que escrita literal este banco no se podria commitear. Es la misma razon por la
# que verificar-datos.sh se excluye a si mismo del barrido.
visor="scw.pjn.gov.ar"/scw/"viewer"
printf 'Ver https://%s/12345 para el detalle.\n' "$visor" > "$REPO/pruebas/x.md"
printf 'pruebas/x.md  # ejemplo\n' > "$REPO/.datos-ejemplo"
git -C "$REPO" add -A
caso "enlace al visor del PJN" bloquea

nuevo_repo
printf 'Comparece Melchiorre Dagostino y acompania documental.\n' > "$REPO/pruebas/x.md"
printf 'Melchiorre Dagostino\n' > "$REPO/lista.txt"
printf 'pruebas/x.md  # ejemplo\n' > "$REPO/.datos-ejemplo"
git -C "$REPO" add -A
caso "termino de la lista privada" bloquea

nuevo_repo
printf 'no soy un zip de verdad\n' > "$REPO/pruebas/ficha.docx"
printf 'pruebas/ficha.docx  # ejemplo\n' > "$REPO/.datos-ejemplo"
git -C "$REPO" add -A
caso "binario ofimatico, aunque este declarado" bloquea

gris "  La declaracion tiene que decir por que"
nuevo_repo; fixture "$REPO/pruebas/corpus.txt"
printf 'pruebas/corpus.txt\n' > "$REPO/.datos-ejemplo"
git -C "$REPO" add -A
caso "exencion sin motivo" bloquea

nuevo_repo; fixture "$REPO/pruebas/corpus.txt"
printf 'pruebas/corpus.txt   #   \n' > "$REPO/.datos-ejemplo"
git -C "$REPO" add -A
caso "exencion con el motivo vacio" bloquea

gris "  La exencion no se derrama"
nuevo_repo; fixture "$REPO/pruebas/corpus.txt"; fixture "$REPO/pruebas/otro.txt"
printf 'pruebas/corpus.txt  # banco inventado\n' > "$REPO/.datos-ejemplo"
git -C "$REPO" add -A
caso "uno declarado, el de al lado no" bloquea

gris "  Formato del archivo"
nuevo_repo; fixture "$REPO/pruebas/corpus.txt"
printf '# El banco del anonimizador\n\npruebas/corpus.txt  # material inventado\n' > "$REPO/.datos-ejemplo"
git -C "$REPO" add -A
caso "comentarios y lineas en blanco" pasa

nuevo_repo; mkdir -p "$REPO/casos de ejemplo"; fixture "$REPO/casos de ejemplo/corpus.txt"
printf 'casos de ejemplo/corpus.txt  # la carpeta lleva espacios en el nombre\n' > "$REPO/.datos-ejemplo"
git -C "$REPO" add -A
caso "ruta con espacios" pasa

nuevo_repo; fixture "$REPO/pruebas/corpus.txt"
printf 'pruebas/no-existe.txt  # quedo de un archivo que ya no esta\n' > "$REPO/.datos-ejemplo"
git -C "$REPO" add -A
caso "exencion que apunta a un archivo que no entra" bloquea

gris "  La guarda del correo con el que se firma"
# El pre-push barre el autor de cada commit del rango. Sin guarda, el correo
# propio bloquea TODOS los push; con una guarda de mas, deja de ver el de otro.
# Los cinco casos cubren las dos formas de equivocarse.
correo_test() { # correo_test <direccion> <bloquea|pasa> <nombre>
  nuevo_repo
  git -C "$REPO" config user.email javiercuneol@gmail.com
  printf 'Escribir a %s por el tema.\n' "$1" > "$REPO/pruebas/x.md"
  git -C "$REPO" add -A
  local salida real
  salida=$(cd "$REPO" && bash "$VERIF" 2>&1)
  if printf '%s' "$salida" | grep -q "correo que no es propia"; then real=bloquea; else real=pasa; fi
  if [ "$real" = "$2" ]; then
    printf '  ok     %-50s %s\n' "$3" "$real"; ok=$((ok+1))
  else
    rojo "  FALLA  $3"
    printf '         esperaba %s y dio %s\n' "$2" "$real"
    mal=$((mal+1))
  fi
}

correo_test 'javiercuneol@gmail.com'     pasa    'el correo con el que se firma'
correo_test 'tercero@otroestudio.com.ar' bloquea 'el correo de otro'
correo_test 'otro@gmail.com'             bloquea 'mismo dominio, otra persona'
correo_test 'xjaviercuneol@gmail.com'    bloquea 'el propio con un prefijo pegado'
correo_test 'hola@javiercuneo.com.ar'    pasa    'el dominio propio del sitio'

echo "================================================================"
if [ $mal -gt 0 ]; then
  rojo "$mal de $((ok+mal)) fallaron."
  exit 1
fi
verde "Los $ok casos pasan."
gris "Esto no dice que un ejemplo declarado sea inofensivo: dice que la"
gris "exencion alcanza solo a los patrones de forma, que no se derrama,"
gris "y que la guarda del correo propio no tapa el de otro."
exit 0
