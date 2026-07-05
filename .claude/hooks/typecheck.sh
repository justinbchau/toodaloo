#!/usr/bin/env bash
# PostToolUse: after a TypeScript edit under client/, run tsc --noEmit and, if there
# are type errors, surface them to the model (exit 2) so it can fix them immediately.
# Fast-exits for any non-TS edit. Uses incremental compilation to keep repeat runs cheap.
set -uo pipefail

INPUT=$(cat)
FP=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""')

# Only care about .ts/.tsx files inside the client app.
case "$FP" in
  *client/*.ts|*client/*.tsx) : ;;
  *) exit 0 ;;
esac

CLIENT_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/client"
[[ -d "$CLIENT_DIR" ]] || exit 0

CACHE="${TMPDIR:-/tmp}/toodaloo-tsc.tsbuildinfo"
OUT=$(cd "$CLIENT_DIR" && npx tsc --noEmit --incremental --tsBuildInfoFile "$CACHE" 2>&1) || {
  # Report a bounded slice so we never flood context.
  COUNT=$(printf '%s\n' "$OUT" | grep -cE 'error TS' || true)
  printf 'tsc reported %s type error(s) after this edit (advisory):\n%s\n' \
    "$COUNT" "$(printf '%s\n' "$OUT" | grep -E 'error TS' | head -n 15)" >&2
  exit 2
}

exit 0
