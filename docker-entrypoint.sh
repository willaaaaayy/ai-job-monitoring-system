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
npx prisma migrate deploy || {
  echo "ERROR: Migration failed"
  exit 1
}

# Start the server
echo "Starting server..."
exec node dist/server.js
