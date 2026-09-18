#!/bin/sh
set -e

echo "=========================================="
echo "🚀 Starting VService Repair System v2.2.0"
echo "=========================================="

if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Syncing database schema with Prisma..."
  max_retries=15
  count=0
  until npx prisma db push --accept-data-loss --skip-generate || [ $count -ge $max_retries ]; do
    echo "PostgreSQL not ready yet, retrying in 3s..."
    sleep 3
    count=`expr $count + 1`
  done

  echo "🌱 Seeding master data and default accounts..."
  npm run db:seed || echo "Seed finished with warnings (skipped existing data)"
fi

echo "🌐 Starting Next.js web application on 0.0.0.0:${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}" -H 0.0.0.0
