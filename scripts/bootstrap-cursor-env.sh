#!/usr/bin/env bash
# Bootstrap what can be automated without Supabase/Expo OAuth.
# Credentials + migrations require Supabase MCP (see AGENTS.md).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLIENT="$ROOT/client"

echo "==> Installing JS dependencies"
cd "$CLIENT"
npm install

echo "==> Checking client/.env"
if [ -f "$CLIENT/.env" ]; then
  echo "    ✓ client/.env exists"
else
  echo "    ✗ client/.env missing"
  echo ""
  echo "    In Cursor (with Supabase MCP connected), ask the agent:"
  echo '    "Use Supabase MCP: list_projects, get_project_url, get_publishable_keys'
  echo '     for the toodaloo project, then write client/.env."'
  echo ""
  echo "    Or copy the template: cp client/.env.example client/.env"
fi

echo "==> Running tests"
npm test

echo "==> Typecheck"
npx tsc --noEmit

echo ""
echo "Done. Next steps (Cursor agent with MCP):"
echo "  1. Supabase MCP → write client/.env (if missing)"
echo "  2. Supabase MCP → apply migrations from client/supabase/migrations/"
echo "  3. cd client && npm run start:mcp   (Mac, for Expo local MCP tools)"
echo "  4. Cursor Settings → Tools & MCP → confirm supabase + expo are green"
