#!/bin/sh

# Run migrations based on the selected DB client
if [ "$DB_CLIENT" = "prisma" ]; then
  echo "Running Prisma migrations..."
  pnpm prisma:migrate
else
  echo "Running node-pg migrations..."
  ./dist/bin/streampot.js migrate
fi

# Start the server
./dist/bin/streampot.js serve --port=3000 --host=0.0.0.0
