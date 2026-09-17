#!/usr/bin/env bash
# Detiene un commit que traiga datos personales o material que no debe publicarse.
#
# Corre sobre lo que esta EN EL INDICE, no sobre el arbol: lo que se va a
# commitear es lo que importa.
#
# Los patrones de aca son genericos a proposito. Los terminos propios --nombres,
# identificadores de oficina, apellidos que ya se filtraron una vez-- NO van en
# este archivo: se leen de una lista privada, fuera del repositorio, indicada en
#   git config datos.listaPrivada <ruta>
# o, si no esta configurada, de   ../_material-real/terminos-privados.txt
# Una regla que enumera lo que oculta deja de ser una regla y pasa a ser un mapa.
#
# Salir de un falso positivo:  git commit --no-verify   (y arreglar el patron)
#
# ARCHIVOS DE EJEMPLO.  Un repositorio sobre testimonios necesita poder
# versionar un ejemplo inventado que un agente nuevo pueda correr sin pedir el
# material real --que es justo lo que este verificador viene a evitar-- y los
# patrones de forma no pueden distinguir un DNI inventado de uno real. Para eso
# esta  .datos-ejemplo  en la raiz del repositorio: una ruta por linea, con el
# motivo detras de un #. Ejemplo:
#
#     pruebas/corpus.json   # banco del anonimizador, 40 casos inventados
#
# QUE RELAJA Y QUE NO, que es lo unico que hace que esto no sea un agujero:
#
#   Relaja  los patrones de FORMA --DNI, CUIT, CBU, matricula, telefono,
#           caratula--, que son exactamente los que no pueden distinguir lo
#           inventado de lo real.
#
#   NUNCA   la lista privada de terminos, los binarios ofimaticos y el enlace al
#   relaja  visor del PJN. Esos tres no son formas: el primero nombra a alguien
#           de carne y hueso, el segundo trae metadatos que no se ven al leerlo,
#           y el tercero apunta a una causa concreta. Un archivo declarado
#           ejemplo que traiga uno de esos se bloquea igual.
#
#           El correo SI se relaja, y la primera version de esto lo tenia al
#           reves. Un correo es una forma como el DNI --se inventa igual, y el
#           patron ya tiene lista blanca de example.com--; lo que protege a una
#           persona real es la lista privada, que esta arriba. Dejarlo sin
#           relajar hacia que un banco de pruebas del anonimizador no se pudiera
#           versionar por tener adentro justo el caso que prueba esa regla.
#
# La declaracion se versiona, asi que aparece en el diff y alguien la puede
# discutir. Un `--no-verify` no aparece en ningun lado, y ademas saltea los
# otros trece controles del pre-commit.

set -u
raiz=$(git rev-parse --show-toplevel)
fallas=0
avisos=0

rojo() { printf '\033[31m%s\033[0m\n' "$1"; }
amar() { printf '\033[33m%s\033[0m\n' "$1"; }
gris() { printf '\033[90m%s\033[0m\n' "$1"; }

falla() { rojo "  BLOQUEA  $1"; printf '           %s\n' "$2"; fallas=$((fallas+1)); }
avisa() { amar "  REVISAR  $1"; printf '           %s\n' "$2"; avisos=$((avisos+1)); }

# DE DONDE SALE EL TEXTO A REVISAR.  Por defecto, del indice: es el modo del
# pre-commit y el unico que habia hasta el 17/9. Los otros dos existen porque
# el pre-commit solo ve lo que nace de el, y eso dejaba dos agujeros probados:
#
#   DATOS_RANGO=<a>..<b>   el contenido Y los mensajes de ese rango de commits.
#                          Lo usa el pre-push. Tapa el commit hecho con
#                          --no-verify, el que entra por merge --no-ff (un merge
#                          no dispara pre-commit), el cherry-pick y cualquier
#                          historia importada. Son commits que nunca pasaron por
#                          aca y que hasta hoy salian al remoto sin que nada los
#                          mirara.
#
#   DATOS_MENSAJE=<archivo>  un texto suelto. Lo usa el commit-msg. El mensaje de
#                          commit es superficie publicada y ningun barrido de
#                          archivos lo toca; ademas no se corrige sin reescribir
#                          la historia, asi que aca bloquea en vez de avisar.
#
MODO=indice
[ -n "${DATOS_RANGO:-}" ]   && MODO=rango
[ -n "${DATOS_MENSAJE:-}" ] && MODO=mensaje

case "$MODO" in
  indice)
    mapfile -t archivos < <(git diff --cached --name-only --diff-filter=ACMR) ;;
  rango)
    # Por lo mismo que el diff: el listado tiene que ser de todos los commits,
    # no el neto. Un archivo agregado y borrado dentro del mismo push no sale en
    # el neto, y si la lista queda vacia el verificador sale por la puerta de
    # "nada que revisar" sin haber revisado nada.
    mapfile -t archivos < <(git log --name-only --format= --diff-filter=ACMR                             --diff-merges=first-parent "$DATOS_RANGO" | sort -u | grep -v '^$') ;;
  mensaje)
    archivos=("<mensaje de commit>") ;;
esac
[ ${#archivos[@]} -eq 0 ] && exit 0

# El propio verificador queda fuera del barrido de contenido: lleva los patrones
# adentro y si no se excluye se bloquea a si mismo. Lo mismo para su documentacion.
excluir=(':(exclude)scripts/verificar-datos.sh')

# Archivos declarados ejemplo en .datos-ejemplo. El porque, en la cabecera.
ejemplos=()
if [ -f "$raiz/.datos-ejemplo" ]; then
  n_linea=0
  while IFS= read -r linea || [ -n "$linea" ]; do
    n_linea=$((n_linea+1))
    # El \r de un checkout con finales de linea de Windows viaja pegado a la
    # ruta y la deja sin matchear, en silencio. Se limpia aca y no solo en
    # .gitattributes, porque esto corre en repositorios que no son este.
    linea="${linea%$'\r'}"
    case "$linea" in ''|'#'*) continue;; esac
    ruta="${linea%%#*}"
    motivo="${linea#*#}"
    # Sin las llaves de expansion: bash no tiene trim y esto es lo mas corto.
    ruta="$(printf '%s' "$ruta" | sed -e 's/[[:space:]]*$//' -e 's/^[[:space:]]*//')"
    motivo="$(printf '%s' "$motivo" | sed -e 's/[[:space:]]*$//' -e 's/^[[:space:]]*//')"
    if [ -z "$ruta" ]; then continue; fi
    # El motivo es obligatorio: una exencion sin motivo escrito es la que nadie
    # discute despues, porque no hay nada que discutir.
    if [ "$linea" = "$ruta" ] || [ -z "$motivo" ]; then
      falla ".datos-ejemplo:$n_linea" "la exencion no dice por que: escribi  $ruta # <motivo>"
      continue
    fi
    ejemplos+=("$ruta")
    excluir+=(":(exclude)$ruta")
  done < "$raiz/.datos-ejemplo"
fi

# Dos barridos, y la diferencia es el punto entero:
#   agregado      sin los ejemplos  -> los patrones de forma
#   agregado_todo con todo          -> lo que no se relaja nunca
case "$MODO" in
  indice)
    agregado=$(git diff --cached -U0 --diff-filter=ACMR -- . "${excluir[@]}" | grep -a '^+' || true)
    agregado_todo=$(git diff --cached -U0 --diff-filter=ACMR -- . ':(exclude)scripts/verificar-datos.sh' | grep -a '^+' || true)
    ;;
  rango)
    # git log -p  y NO  git diff <rango>:  el diff de un rango es el NETO, y un
    # dato que entra en un commit y se borra en otro del mismo push no aparece
    # en el neto --pero queda publicado igual--. Es el error que esta escrito en
    # H-01 y H-04: un commit que borra el dato lo deja igual de accesible y
    # ademas señala donde estaba. Hay que mirar commit por commit.
    #
    # --diff-merges=first-parent para que un merge muestre lo que trae: si no,
    # git omite el diff de los merges y ese era justo el agujero probado.
    #
    # Los mensajes entran al mismo barrido con un '+' adelante, para que los
    # patrones --anclados en ^\+-- los vean igual que una linea agregada.
    msgs=$(git log --format='%B%n%an%n%ae' "$DATOS_RANGO" | sed 's/^/+/')
    difs=$(git log -p -U0 --diff-filter=ACMR --diff-merges=first-parent "$DATOS_RANGO" -- . "${excluir[@]}" | grep -a '^+' || true)
    difs_todo=$(git log -p -U0 --diff-filter=ACMR --diff-merges=first-parent "$DATOS_RANGO" -- . ':(exclude)scripts/verificar-datos.sh' | grep -a '^+' || true)
    agregado=$(printf '%s\n%s\n' "$difs" "$msgs")
    agregado_todo=$(printf '%s\n%s\n' "$difs_todo" "$msgs")
    ;;
  mensaje)
    agregado=$(sed 's/^/+/' "$DATOS_MENSAJE")
    agregado_todo="$agregado"
    ;;
esac


# --------------------------------------------------------------------------
# 1. Binarios ofimaticos: no se commitean nunca.
#    Un .docx es un zip: el texto es la mitad, el resto son metadatos, el
#    encabezado y el identificador del documento de origen.
# --------------------------------------------------------------------------
if [ "$MODO" != mensaje ]; then
  for a in "${archivos[@]}"; do
    case "${a,,}" in
      *.docx|*.doc|*.xlsx|*.xls|*.pptx|*.odt|*.rtf|*.pdf)
        falla "$a" "binario ofimatico: viaja con metadatos que no se ven al leerlo" ;;
    esac
  done
fi

# --------------------------------------------------------------------------
# 2. Patrones estructurados sobre el contenido agregado.
# --------------------------------------------------------------------------
buscar() { # buscar <regex> <motivo> -- patron de FORMA: los ejemplos quedan afuera
  local hit
  hit=$(printf '%s' "$agregado" | grep -a -n -P "^\+.*(?:$1)" | head -3)
  [ -n "$hit" ] && { falla "contenido" "$2"; printf '           %s\n' "$hit" | cut -c1-150; }
}

buscar_todo() { # igual, pero NO lo relaja ningun .datos-ejemplo
  local hit
  hit=$(printf '%s' "$agregado_todo" | grep -a -n -P "^\+.*(?:$1)" | head -3)
  [ -n "$hit" ] && { falla "contenido" "$2"; printf '           %s\n' "$hit" | cut -c1-150; }
}

buscar '\bDNI\b[^0-9]{0,12}[0-9]' 'un numero detras de "DNI"'
buscar '\b(?:L\.?C\.?|L\.?E\.?|C\.?I\.?)\b[^0-9]{0,8}[0-9]{6,8}' 'documento de identidad (LC/LE/CI)'
# El lookbehind es por los montos: un DNI no lleva signo de peso adelante, y en
# estos repositorios los montos judiciales aparecen todo el tiempo (la Acordada
# 21/2025 llevo el del art. 286 del CCyCN a $1.400.000). Sin el, cada monto de
# siete digitos bloquea un commit, y un control que da falsos positivos seguido
# es un control que se termina salteando siempre.
#
# Y el lookahead de los centavos es por lo mismo, agregado el 26/8/2026: un DNI
# NO LLEVA DECIMALES, asi que 1.500.000,00 no puede ser uno. No es aflojar el
# patron ---no deja pasar ninguna forma que un documento de identidad pueda
# tener--- sino sacarle una que nunca fue suya. Aparecio con los importes que
# fija scripts/pruebas-no-plazos.html, que son salidas de pantalla copiadas tal
# cual y por eso no se les puede poner el signo de peso adelante.
buscar '(?<![$])\b[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}\b(?![0-9])(?!,[0-9])' 'numero con forma de DNI (7-8 digitos con puntos)'
buscar '\b(?:20|23|24|27|30|33|34)\s*-\s*[0-9]{8}\s*-\s*[0-9]\b' 'CUIT/CUIL con guiones (ojo: puede llevar espacios)'
buscar '\b(?:20|23|24|27|30|33|34)[0-9]{9}\b' 'CUIT/CUIL de 11 digitos sin guiones -- contiene el DNI'
buscar '\b[0-9]{22}\b' 'CBU'
buscar '\bT[oº°]?\s*[:.]?\s*[0-9IVXLC]{1,6}\s*F[oº°]?\s*[:.]?\s*[0-9]{1,4}\b' 'matricula (tomo y folio)'
buscar '\bMatr[ií]cula\b\s*(?:N[oº°]?)?\s*[:.]?\s*[0-9IVXLC]' 'matricula'
# Las caratulas se pueden relajar por repositorio: en una wiki de jurisprudencia
# son el contenido, no una fuga. Con  git config datos.caratulas aviso  pasan a
# ser advertencia. Lo que NUNCA se relaja es la caratula de una causa propia:
# para eso esta la lista privada, que no depende de esta opcion.
modo_caratula=$(git config --get datos.caratulas || echo bloquea)
if [ "$modo_caratula" = "aviso" ]; then
  for pat in '[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ,.]{4,60}\s+c/\s+[A-ZÁÉÍÓÚÑ]' 'ACTORA?\s*:.{0,60}DEMANDAD'; do
    printf '%s' "$agregado" | grep -a -q -P "^\+.*(?:$pat)" && avisa "contenido" "hay una caratula; verifica que sea jurisprudencia publicada y no una causa propia"
  done
else
  buscar '[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ,.]{4,60}\s+c/\s+[A-ZÁÉÍÓÚÑ]' 'caratula "X c/ Y"'
  buscar 'ACTORA?\s*:.{0,60}DEMANDAD' 'caratula de incidente del PJN (ACTOR:/DEMANDADO:)'
fi
# Este NO lo relaja un .datos-ejemplo: un enlace al visor apunta a una causa
# concreta, y no hay forma de inventar uno que no siga apuntando a algo.
buscar_todo 'scw\.pjn\.gov\.ar/scw/viewer' 'enlace directo al visor de expedientes del PJN'
buscar '\blex100\b|\bmesa virtual\b|\bSNE\b' 'vocabulario de sistemas internos del PJN'
buscar '\+?54\s*9?\s*(?:11|351|341|261|221)\s*[-. ]?[0-9]{4}[-. ]?[0-9]{4}' 'telefono argentino'
# El \b no alcanza: dentro de un UUID (...19e5-4608-9946-6f22...) el tramo
# '4608-9946' tiene borde de palabra a los dos lados y pasaba por telefono.
# Los links del CIJ son todos UUID, asi que era un bloqueo garantizado sobre
# una wiki cuyas fuentes son links del CIJ. Ahora se exige que el numero no
# venga pegado a un guion ni a otro caracter de palabra.
buscar '(?<![-\w])(?:4[0-9]{3}|5[0-9]{3})-[0-9]{4}(?![-\w])' 'telefono fijo de CABA'
# La identidad con la que se firma NO es una fuga: el correo del autor viaja en
# cada commit publicado, lo muestra GitHub y no sale sin reescribir la historia.
# Sin esta guarda el pre-push --que barre  %an  y  %ae  del rango-- bloquea
# TODOS los push de quien no tenga un correo del dominio propio, que es el caso.
#
# NO se resuelve metiendo el dominio en la lista blanca de abajo: esa lista va
# DETRAS del arroba y  gmail.com  es medio mundo. Va como guarda de la direccion
# entera, y con el lookbehind puesto: sin el, grep arranca a matchear un
# caracter mas adelante --"aviercuneo@..."-- y la guarda no sirve de nada.
#
# Se leen de la configuracion y no se escriben aca, para que valga en cualquier
# repositorio y en cualquier maquina. Lo que el patron sigue cazando es el
# correo de OTRO adentro de un archivo o de un mensaje.
#
# SON VARIOS, y desde el 17/9 no uno solo. El pre-push barre los autores de
# TODO el rango, y en esta maquina se firma con un correo distinto segun el
# repositorio --y los commits viejos llevan el de entonces--. Con una sola
# guarda, el primer commit firmado con otro correo bloquea el push y no hay
# forma de corregirlo sin reescribir la historia. Se agregan con:
#     git config --global --add datos.correoPropio <direccion>
correos_propios=$(git config --get-all datos.correoPropio 2>/dev/null || true)
correo_actual=$(git config --get user.email || true)
[ -n "$correo_actual" ] && correos_propios=$(printf '%s\n%s' "$correos_propios" "$correo_actual")
guarda_propio=''
for c in $correos_propios; do
  [ -z "$c" ] && continue
  # Los dos unicos metacaracteres que puede traer una direccion, escapados con
  # una expresion cada uno: una clase de caracteres aca se le vuelve ilegible a
  # sed --corchetes y backslashes-- y la guarda quedaba vacia sin avisar.
  esc=$(printf '%s' "$c" | sed -e 's/\./\./g' -e 's/+/\+/g')
  guarda_propio="${guarda_propio}(?!${esc}\b)"
done

# CASILLAS INSTITUCIONALES, desde el 2026-09-17. Un reglamento o un instructivo
# oficial nombra la casilla de una dependencia --a donde el propio instructivo
# manda a escribir-- y eso no es el correo de nadie: es una oficina. El patron
# no puede distinguirlas, asi que se declaran:
#     git config --global --add datos.correoInstitucional <direccion>
#
# UNA POR UNA Y NUNCA EL DOMINIO. La tentacion es poner  pjn.gov.ar  en la lista
# blanca de abajo y terminar, pero en ese dominio tambien viven las direcciones
# personales de los empleados judiciales --nombre.apellido@pjn.gov.ar--, o sea
# justo lo que este patron existe para cazar. Un dominio entero seria un agujero
# del tamano del Poder Judicial; una casilla declarada es una linea que alguien
# escribio a proposito y se puede discutir.
#
# Van aparte de datos.correoPropio y no mezcladas con el, porque no son lo
# mismo: una es la direccion de Javier y la otra la de una dependencia. El dia
# que haya que revisar que se dejo pasar, la diferencia importa.
correos_institucionales=$(git config --get-all datos.correoInstitucional 2>/dev/null || true)
for c in $correos_institucionales; do
  [ -z "$c" ] && continue
  esc=$(printf '%s' "$c" | sed -e 's/\./\./g' -e 's/+/\+/g')
  guarda_propio="${guarda_propio}(?!${esc}\b)"
done

buscar "(?<![A-Za-z0-9._%+-])${guarda_propio}[A-Za-z0-9._%+-]+@(?!javiercuneo\.com\.ar|users\.noreply\.github\.com|anthropic\.com|example\.(?:com|org))[A-Za-z0-9.-]+\.[A-Za-z]{2,}" 'direccion de correo que no es propia ni de ejemplo'

# --------------------------------------------------------------------------
# 3. Lista privada de terminos: nombres, identificadores de oficina, apellidos
#    que ya se filtraron alguna vez. Vive FUERA del repositorio.
# --------------------------------------------------------------------------
lista=$(git config --get datos.listaPrivada || true)
[ -z "$lista" ] && lista="$raiz/../_material-real/terminos-privados.txt"
if [ -f "$lista" ]; then
  # Una sola pasada con  grep -F -f  y no un grep por termino: la lista paso de
  # 24 a 65 el 17/9 y va a seguir creciendo, y un control que tarda es un
  # control que se termina salteando. El CR de un checkout con finales de linea
  # de Windows viaja pegado al termino y lo deja sin matchear, en silencio; por
  # eso el primer sed.
  # La lista tiene dos niveles, separados por la linea  #!SOLO-EN-PUBLICOS.
  # Arriba, lo que nombra gente de carne y hueso: se verifica siempre. Abajo,
  # el nombre y la estructura de los repositorios hermanos y la narrativa de
  # categoria F: solo en un repositorio publico, porque entre privados
  # nombrarse es el trabajo y bloquear ahi solo ensena a escribir --no-verify.
  #
  # El default es publico. Un repositorio que no declara nada se trata como el
  # caso peor:  git config datos.visibilidad privado
  visibilidad=$(git config --get datos.visibilidad || echo publico)
  if [ "$visibilidad" = privado ]; then
    fuente=$(sed '/^#!SOLO-EN-PUBLICOS/,$d' "$lista")
  else
    fuente=$(cat "$lista")
  fi
  patrones=$(printf '%s\n' "$fuente" | sed -e 's/\r$//' -e 's/[[:space:]]*$//' \
             | grep -v '^[[:space:]]*#' | grep -v '^[[:space:]]*$')
  if [ -n "$patrones" ]; then
    # agregado_todo y no agregado: un archivo declarado ejemplo que traiga un
    # termino de la lista privada se bloquea igual. Es la garantia que sostiene
    # todo lo demas.
    n=$(printf '%s\n' "$patrones" | grep -a -i -F -o -f - <(printf '%s' "$agregado_todo") \
        | sort -u | wc -l)
    if [ "$n" -gt 0 ]; then
      falla "contenido" "$n termino(s) de la lista privada (no se imprimen a proposito)"
    fi
  fi
else
  avisa "lista privada" "no se encontro en $lista -- los terminos propios no se estan verificando"
fi

# --------------------------------------------------------------------------
# 4. Redaccion: el vocabulario que delata que hubo material real.
#    "real" es el mejor detector que hay para esto: casi todos los hallazgos de
#    categoria F de la auditoria se encuentran buscando esa palabra.
#
#    En un archivo AVISA, porque un archivo se corrige con otro commit.
#    En un mensaje de commit BLOQUEA, porque un mensaje no se corrige sin
#    reescribir la historia. El 16/9 salio uno que decia "encontrados con
#    testimonios reales" y nadie lo vio: no habia control sobre el mensaje, y
#    el patron de entonces --documentos? real-- tampoco cubria "testimonios".
# --------------------------------------------------------------------------
for pat in 'expediente[s]? real' 'caso real' 'uso real' 'de verdad' 'fuga real' \
           '(?:documento|testimonio|resoluci[oó]n|sentencia|escrito|oficio|pericia)s? real' \
           'material real' 'datos reales' 'nombres reales' '\b[0-9]{2,4} fojas\b'; do
  if printf '%s' "$agregado" | grep -a -q -i -P "^\+.*$pat"; then
    if [ "$MODO" = mensaje ]; then
      falla "mensaje de commit" "aparece «$pat»: un mensaje no se corrige sin reescribir la historia"
    else
      avisa "redaccion" "aparece «$pat»: describi la forma, no el caso"
    fi
  fi
done

# --------------------------------------------------------------------------
# Las exenciones se dicen SIEMPRE. Una exencion silenciosa es una que nadie mira.
if [ ${#ejemplos[@]} -gt 0 ]; then
  echo
  gris "  Declarados ejemplo en .datos-ejemplo, exentos de los patrones de forma:"
  for e in "${ejemplos[@]}"; do
    if git diff --cached --name-only --diff-filter=ACMR -- "$e" | grep -aq .; then
      gris "    $e"
    else
      gris "    $e  (no entra en este commit)"
    fi
  done
  gris "  La lista privada, los binarios y el visor del PJN se verifican sobre"
  gris "  ellos igual."
fi

echo
if [ $fallas -gt 0 ]; then
  case "$MODO" in
    rango)   rojo "Detenido: $fallas comprobacion(es) de datos personales en lo que ibas a enviar." ;;
    mensaje) rojo "Mensaje detenido: $fallas comprobacion(es) de datos personales." ;;
    *)       rojo "Commit detenido: $fallas comprobacion(es) de datos personales."
             echo "Corregi, o si es un falso positivo: git commit --no-verify (y arregla el patron)." ;;
  esac
  exit 1
fi
[ $avisos -gt 0 ] && amar "$avisos aviso(s). No bloquean." || echo "Datos: sin observaciones."
exit 0
