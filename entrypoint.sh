#!/bin/sh
set -e

echo "=========================================="
echo "🚀 Starting VService Repair System v2.2.0"
echo "=========================================="

if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Waiting for PostgreSQL and syncing database schema with Prisma..."
  # No --accept-data-loss: a schema change that would drop data makes prisma fail,
  # and the container stops instead of silently deleting production data.
  max_retries=15
  count=0
  until npx prisma db push --skip-generate; do
    count=`expr $count + 1`
    if [ $count -ge $max_retries ]; then
      echo "❌ prisma db push failed after $max_retries attempts (database unreachable or schema change would lose data). Aborting startup."
      exit 1
    fi
    echo "Schema push failed (attempt $count/$max_retries), retrying in 3s..."
    sleep 3
  done

  echo "🌱 Seeding master data and default accounts..."
  npm run db:seed || echo "Seed finished with warnings (skipped existing data)"

  echo "🧹 Running production data normalization..."
  npx tsx scripts/normalize-money-satang.ts --apply || echo "Money normalization skipped"
  if [ "$SEED_TEST_DATA" != "true" ] && [ "$SEED_TEST_DATA" != "1" ]; then
    npx tsx scripts/test-accounts.ts --disable --confirm || echo "Test account rotation skipped"
  fi
fi

echo "🌐 Starting Next.js web application on 0.0.0.0:${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}" -H 0.0.0.0
