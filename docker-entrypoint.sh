#!/bin/sh
set -e

# Wait for DATABASE_URL to be available
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Verify Prisma Client is available
if [ ! -d "node_modules/.prisma" ]; then
  echo "ERROR: Prisma Client not found. Regenerating..."
  npx prisma generate || {
    echo "ERROR: Failed to generate Prisma Client"
    exit 1
  }
fi

# Run database migrations
echo "Running database migrations..."

# Check for failed migrations and resolve them if possible
# Use BusyBox-compatible grep (no -P flag)
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)

if echo "$MIGRATION_STATUS" | grep -q "failed migrations"; then
  # Extract migration name using sed (BusyBox compatible)
  FAILED_MIGRATION=$(echo "$MIGRATION_STATUS" | grep "The \`" | sed "s/.*The \`\([^']*\)\`.*/\1/" | head -1 || true)
  
  if [ -n "$FAILED_MIGRATION" ]; then
    echo "WARNING: Found failed migration: $FAILED_MIGRATION"
    echo "Attempting to resolve failed migration..."
    
    # Try to resolve the failed migration as rolled back
    npx prisma migrate resolve --rolled-back "$FAILED_MIGRATION" || {
      echo "WARNING: Could not resolve failed migration automatically"
      echo "You may need to manually resolve it using:"
      echo "  npx prisma migrate resolve --rolled-back $FAILED_MIGRATION"
      echo "  or"
      echo "  npx prisma migrate resolve --applied $FAILED_MIGRATION"
      echo ""
      echo "Continuing with migration deployment..."
    }
  fi
fi

# Deploy migrations
npx prisma migrate deploy || {
  echo "ERROR: Migration deployment failed"
  echo "Check the migration status with: npx prisma migrate status"
  exit 1
}

# Start the server
echo "Starting server..."
exec node dist/server.js
