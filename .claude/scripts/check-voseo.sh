#!/bin/bash
# Post-tool-use hook: language-aware voseo + em/en dash check on edited .ts/.tsx files.
# Delegates to scripts/qa/lint-content.mjs (single source of truth): exact accented voseo
# forms + Spanish-only dash rule that skips EN/PT and debug strings. Exits 2 to block.

# Read stdin JSON and extract the edited file path.
INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)

[ -z "$FILE" ] && exit 0
case "$FILE" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

# Don't block if node is unavailable in the hook environment.
command -v node >/dev/null 2>&1 || exit 0

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LINTER="$SCRIPT_DIR/../../scripts/qa/lint-content.mjs"
[ -f "$LINTER" ] || exit 0

# Single-file mode exits 2 (block) on findings, 0 otherwise.
node "$LINTER" --file "$FILE"
