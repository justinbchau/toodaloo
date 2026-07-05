#!/usr/bin/env bash
# PreToolUse guard for a PUBLIC repo: block committing env files or genuine secrets.
# Deliberately does NOT flag the Supabase anon key/URL — those are EXPO_PUBLIC_ and
# shipped in the client by design. Targets service_role keys, private keys, and any
# attempt to write into / commit a .env* file (except .env.example).
set -euo pipefail

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')

block() {
  # Exit 2 => PreToolUse denies the call and shows this reason to the model.
  printf 'BLOCKED by guard-secrets hook (public repo): %s\n' "$1" >&2
  exit 2
}

# High-signal secret patterns. Anon JWTs are intentionally excluded.
SECRET_RE='service_role|SUPABASE_SERVICE_ROLE|-----BEGIN [A-Z ]*PRIVATE KEY-----|SUPABASE_SERVICE_KEY|SERVICE_ROLE_KEY'

case "$TOOL" in
  Write|Edit|MultiEdit)
    FP=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""')
    base=$(basename "$FP")
    if [[ "$base" == .env || "$base" == .env.* ]] && [[ "$base" != ".env.example" ]]; then
      block "writing to '$base' — env files hold secrets and must stay untracked. Use .env.example for shareable placeholders."
    fi
    ;;
  Bash)
    CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')
    # Only inspect git add/commit; everything else passes instantly.
    if printf '%s' "$CMD" | grep -Eq '\bgit\s+(add|commit)\b'; then
      # 1) Explicit env file in the command line.
      if printf '%s' "$CMD" | grep -Eq '(^|[[:space:]/])\.env($|[^a-zA-Z0-9._])' \
         && ! printf '%s' "$CMD" | grep -Eq '\.env\.example'; then
        block "the command references a .env file. Do not add/commit env files to a public repo."
      fi
      # 2) Scan whatever is already staged for real secret material.
      if git rev-parse --git-dir >/dev/null 2>&1; then
        STAGED=$(git diff --cached --no-color 2>/dev/null || true)
        if printf '%s' "$STAGED" | grep -Eq "$SECRET_RE"; then
          block "staged changes contain a secret pattern (service_role / private key). Remove it before committing."
        fi
        if git diff --cached --name-only 2>/dev/null | grep -Eq '(^|/)\.env($|\.)' \
           | grep -vq '\.env\.example'; then
          block "a .env file is staged for commit. Unstage it (git restore --staged <file>)."
        fi
      fi
    fi
    ;;
esac

exit 0
