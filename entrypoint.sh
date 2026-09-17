#!/bin/sh
set -e

# Run Prisma migrations & seed if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Waiting for PostgreSQL database to be ready..."
  max_retries=30
  count=0
  until npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma || [ $count -ge $max_retries ]; do
    echo "PostgreSQL not ready yet, retrying in 2s... ($((count+1))/$max_retries)"
    sleep 2
    count=$((count+1))
  done

  echo "🌱 Seeding master data and demo accounts..."
  pnpm --filter @svcm/db seed || true
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
  PORT=4000 API_PORT=4000 node apps/api/dist/main.js &
  API_PID=$!

  PORT=3000 pnpm --filter @svcm/web start &
  WEB_PID=$!

  trap "kill $API_PID $WEB_PID" INT TERM
  wait
fi
