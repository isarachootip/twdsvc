#!/bin/sh
set -e

# Run Prisma migrations if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Applying database migrations..."
  npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma || true
fi

# Run target according to APP_TARGET environment variable
if [ "$APP_TARGET" = "api" ]; then
  echo "🚀 Starting SVCM API service on port ${PORT:-4000}..."
  exec node apps/api/dist/main.js
elif [ "$APP_TARGET" = "web" ]; then
  echo "🚀 Starting SVCM Web service on port ${PORT:-3000}..."
  exec pnpm --filter @svcm/web start
else
  # Default: Start both API and Web
  echo "🚀 Starting both SVCM API (port 4000) and SVCM Web (port 3000)..."
  node apps/api/dist/main.js &
  API_PID=$!

  pnpm --filter @svcm/web start &
  WEB_PID=$!

  trap "kill $API_PID $WEB_PID" INT TERM
  wait
fi
