#!/bin/sh
# Runs on every container start (not just the first deploy), so a restart
# after a fresh deploy always reconciles the schema before the app boots.
set -e

echo "==> AssetFlow API: applying database migrations"
npx prisma migrate deploy

echo "==> AssetFlow API: starting server"
# exec replaces this shell with the node process, so SIGTERM from the
# orchestrator reaches node directly for a clean shutdown.
exec node dist/server.js
