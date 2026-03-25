#!/bin/bash
# Post-tool-use hook: check for voseo patterns in edited .ts/.tsx files
# Receives JSON via stdin with tool_input.file_path

# Read stdin JSON
INPUT=$(cat)

# Extract file path from tool input
FILE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)

[ -z "$FILE" ] && exit 0

# Only check .ts/.tsx files
case "$FILE" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# Only check files with Spanish content (skip pure-code files)
grep -q "['\"'].*[a-záéíóúñü]" "$FILE" 2>/dev/null || exit 0

# Voseo patterns to detect
PATTERNS=(
  # Present tense vos conjugations
  '\bpodés\b' '\bquerés\b' '\bsabés\b' '\bsentís\b' '\btenés\b'
  '\bhacés\b' '\bvenís\b' '\bvolvés\b' '\bnecesitás\b' '\banimás\b'
  '\bjugás\b' '\bmostrás\b' '\bsos\b'
  # Vos imperatives
  '\bhacé\b' '\bponé\b' '\btomá\b' '\bvení\b' '\bdecí\b'
  '\bfijáte\b' '\bsentáte\b' '\bacercate\b' '\benfocate\b'
  # Argentine enclitic forms
  '\b[Dd]ecile\b' '\b[Pp]edile\b' '\b[Mm]antenele\b'
  '\b[Pp]onelo\b' '\b[Dd]ejalo\b' '\b[Ss]acalo\b'
  '\b[Ss]umalo\b' '\b[Mm]antenelo\b' '\b[Ii]ncluilo\b'
  '\b[Hh]aceme\b' '\b[Ee]xplicale\b'
  # Pronoun "vos" in prepositional phrases
  '\bde vos\b' '\ben vos\b' '\ba vos\b' '\bcon vos\b'
  # "acá" → use "aquí"
  '\bacá\b'
)

REGEX=$(IFS='|'; echo "${PATTERNS[*]}")

MATCHES=$(grep -n -E "$REGEX" "$FILE" 2>/dev/null | grep -E "['\"]" | head -5)

if [ -n "$MATCHES" ]; then
  echo "VOSEO DETECTADO en $(basename "$FILE")"
  echo "Usar tuteo (tu/usted), NO voseo. Ejemplos: podes->puedes, mira->mira, decile->dile, aca->aqui"
  echo ""
  echo "$MATCHES"
  exit 2
fi

exit 0
