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

  echo "🧹 Running production data normalization & test-data isolation..."
  npx tsx scripts/normalize-money-satang.ts --apply || echo "Money normalization skipped"
  npx tsx scripts/mark-test-jobs.ts --apply || echo "Test job marking skipped"
  if [ "$SEED_TEST_DATA" != "true" ] && [ "$SEED_TEST_DATA" != "1" ]; then
    npx tsx scripts/test-accounts.ts --disable --confirm || echo "Test account rotation skipped"
  fi
fi

echo "🌐 Starting Next.js web application on 0.0.0.0:${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}" -H 0.0.0.0
