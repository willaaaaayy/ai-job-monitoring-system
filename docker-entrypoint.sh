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
  echo "WARNING: Found failed migrations in database"
  
  # Extract migration name using sed (BusyBox compatible)
  # Pattern: The `20240218000000_add_unique_constraint_and_update_status` migration
  # or: Following migration have failed: 20260217185655_add_multi_tenant_support
  FAILED_MIGRATION=$(echo "$MIGRATION_STATUS" | grep -E "(The \`|Following migration)" | sed -E "s/.*(The \`|Following migration have failed: )([^'[:space:]]+).*/\2/" | head -1 || true)
  
  if [ -n "$FAILED_MIGRATION" ]; then
    echo "Found failed migration: $FAILED_MIGRATION"
    echo "Attempting to resolve failed migration as rolled back..."
    
    # Try to resolve the failed migration as rolled back
    if npx prisma migrate resolve --rolled-back "$FAILED_MIGRATION" 2>&1; then
      echo "Successfully resolved failed migration: $FAILED_MIGRATION"
    else
      echo "WARNING: Could not resolve failed migration automatically"
      echo "Attempting to resolve as applied (if migration was partially applied)..."
      
      # Try to resolve as applied (in case migration was partially applied)
      if npx prisma migrate resolve --applied "$FAILED_MIGRATION" 2>&1; then
        echo "Successfully resolved failed migration as applied: $FAILED_MIGRATION"
      else
        echo "ERROR: Could not resolve failed migration automatically"
        echo "You need to manually resolve it using Railway Shell:"
        echo "  npx prisma migrate resolve --rolled-back $FAILED_MIGRATION"
        echo "  or"
        echo "  npx prisma migrate resolve --applied $FAILED_MIGRATION"
        echo ""
        echo "Then restart the container."
        exit 1
      fi
    fi
  else
    echo "WARNING: Could not extract failed migration name from status"
    echo "Migration status output:"
    echo "$MIGRATION_STATUS"
    echo ""
    echo "You may need to manually resolve failed migrations using Railway Shell"
  fi
fi

# Deploy migrations
echo "Deploying migrations..."
npx prisma migrate deploy || {
  echo "ERROR: Migration deployment failed"
  echo "Check the migration status with: npx prisma migrate status"
  exit 1
}

echo "Migrations deployed successfully"

# Start the server
echo "Starting server..."
exec node dist/server.js
