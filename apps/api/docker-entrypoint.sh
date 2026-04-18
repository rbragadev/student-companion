#!/bin/sh
set -e

echo ">>> Aplicando schema no banco de dados..."
cd /app/apps/api
npx prisma db push --accept-data-loss

echo ">>> Populando banco de dados (seed)..."
npm run db:seed || echo "Seed falhou ou já foi executado, continuando..."

echo ">>> Iniciando API..."
exec node /app/apps/api/dist/main.js
