#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Ensuring the initial Admin user exists..."
npx prisma db seed

exec "$@"
