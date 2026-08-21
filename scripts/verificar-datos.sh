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

set -u
raiz=$(git rev-parse --show-toplevel)
fallas=0
avisos=0

rojo() { printf '\033[31m%s\033[0m\n' "$1"; }
amar() { printf '\033[33m%s\033[0m\n' "$1"; }

# Archivos agregados o modificados en el indice, sin los borrados.
mapfile -t archivos < <(git diff --cached --name-only --diff-filter=ACMR)
[ ${#archivos[@]} -eq 0 ] && exit 0

# El propio verificador queda fuera del barrido de contenido: lleva los patrones
# adentro y si no se excluye se bloquea a si mismo. Lo mismo para su documentacion.
excluir=(':(exclude)scripts/verificar-datos.sh')
agregado=$(git diff --cached -U0 --diff-filter=ACMR -- . "${excluir[@]}" | grep -a '^+' || true)

falla() { rojo "  BLOQUEA  $1"; printf '           %s\n' "$2"; fallas=$((fallas+1)); }
avisa() { amar "  REVISAR  $1"; printf '           %s\n' "$2"; avisos=$((avisos+1)); }

# --------------------------------------------------------------------------
# 1. Binarios ofimaticos: no se commitean nunca.
#    Un .docx es un zip: el texto es la mitad, el resto son metadatos, el
#    encabezado y el identificador del documento de origen.
# --------------------------------------------------------------------------
for a in "${archivos[@]}"; do
  case "${a,,}" in
    *.docx|*.doc|*.xlsx|*.xls|*.pptx|*.odt|*.rtf|*.pdf)
      falla "$a" "binario ofimatico: viaja con metadatos que no se ven al leerlo" ;;
  esac
done

# --------------------------------------------------------------------------
# 2. Patrones estructurados sobre el contenido agregado.
# --------------------------------------------------------------------------
buscar() { # buscar <regex> <motivo>
  local hit
  hit=$(printf '%s' "$agregado" | grep -a -n -P "^\+.*(?:$1)" | head -3)
  [ -n "$hit" ] && { falla "contenido" "$2"; printf '           %s\n' "$hit" | cut -c1-150; }
}

buscar '\bDNI\b[^0-9]{0,12}[0-9]' 'un numero detras de "DNI"'
buscar '\b(?:L\.?C\.?|L\.?E\.?|C\.?I\.?)\b[^0-9]{0,8}[0-9]{6,8}' 'documento de identidad (LC/LE/CI)'
buscar '\b[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}\b(?![0-9])' 'numero con forma de DNI (7-8 digitos con puntos)'
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
buscar 'scw\.pjn\.gov\.ar/scw/viewer' 'enlace directo al visor de expedientes del PJN'
buscar '\blex100\b|\bmesa virtual\b|\bSNE\b' 'vocabulario de sistemas internos del PJN'
buscar '\+?54\s*9?\s*(?:11|351|341|261|221)\s*[-. ]?[0-9]{4}[-. ]?[0-9]{4}' 'telefono argentino'
buscar '\b(?:4[0-9]{3}|5[0-9]{3})-[0-9]{4}\b' 'telefono fijo de CABA'
buscar '[A-Za-z0-9._%+-]+@(?!javiercuneo\.com\.ar|users\.noreply\.github\.com|anthropic\.com|example\.(?:com|org))[A-Za-z0-9.-]+\.[A-Za-z]{2,}' 'direccion de correo que no es propia ni de ejemplo'

# --------------------------------------------------------------------------
# 3. Lista privada de terminos: nombres, identificadores de oficina, apellidos
#    que ya se filtraron alguna vez. Vive FUERA del repositorio.
# --------------------------------------------------------------------------
lista=$(git config --get datos.listaPrivada || true)
[ -z "$lista" ] && lista="$raiz/../_material-real/terminos-privados.txt"
if [ -f "$lista" ]; then
  while IFS= read -r termino; do
    [ -z "$termino" ] && continue
    case "$termino" in \#*) continue;; esac
    if printf '%s' "$agregado" | grep -a -q -i -F "$termino"; then
      falla "contenido" "termino de la lista privada (no se imprime a proposito)"
    fi
  done < "$lista"
else
  avisa "lista privada" "no se encontro en $lista -- los terminos propios no se estan verificando"
fi

# --------------------------------------------------------------------------
# 4. Avisos: no bloquean, pero casi siempre marcan algo que conviene reescribir.
#    "real" es el mejor detector que hay para esto.
# --------------------------------------------------------------------------
for pat in 'expediente[s]? real' 'caso real' 'uso real' 'de verdad' 'fuga real' 'documentos? real' '\b[0-9]{2,4} fojas\b'; do
  if printf '%s' "$agregado" | grep -a -q -i -P "^\+.*$pat"; then
    avisa "redaccion" "aparece «$pat»: describi la forma, no el caso"
  fi
done

# --------------------------------------------------------------------------
echo
if [ $fallas -gt 0 ]; then
  rojo "Commit detenido: $fallas comprobacion(es) de datos personales."
  echo "Corregi, o si es un falso positivo: git commit --no-verify (y arregla el patron)."
  exit 1
fi
[ $avisos -gt 0 ] && amar "$avisos aviso(s). No bloquean." || echo "Datos: sin observaciones."
exit 0
