#!/bin/sh
set -e

# Wait for DATABASE_URL to be available
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy || {
  echo "WARNING: Migration failed, but continuing..."
}

# Start the server
echo "Starting server..."
exec node dist/server.js
