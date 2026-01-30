#!/usr/bin/env bash

set -e

echo "🚀 Student Companion — Setup & Run"
echo "----------------------------------"

# ---------- helpers ----------
command_exists () {
  command -v "$1" >/dev/null 2>&1
}

# ---------- checks ----------
echo "🔎 Checking prerequisites..."

if ! command_exists node; then
  echo "❌ Node.js not found. Install Node LTS first."
  exit 1
fi

if ! command_exists npm; then
  echo "❌ npm not found."
  exit 1
fi

if ! command_exists docker; then
  echo "❌ Docker not found. Install Docker Desktop."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running. Start Docker Desktop."
  exit 1
fi

echo "✅ Prerequisites OK"

# ---------- install deps ----------
echo ""
echo "📦 Installing dependencies (npm workspaces)..."
npm install

# ---------- database ----------
echo ""
echo "🐘 Starting PostgreSQL (Docker)..."
cd infra/docker
docker compose up -d
cd ../..

# ---------- backend ----------
echo ""
echo "🧠 Setting up API (NestJS + Prisma)..."
cd apps/api

if [ ! -f ".env" ]; then
  echo "⚠️  .env not found. Trying to create from .env.example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ .env created from .env.example"
  else
    echo "❌ No .env or .env.example found in apps/api"
    exit 1
  fi
fi

echo "📐 Running Prisma migrations..."
# não falha o script se a migration já existir
npx prisma migrate dev --name init || true

echo "▶️ Starting API (NestJS)..."
npm run start:dev &
API_PID=$!

cd ../..

# ---------- mobile ----------
echo ""
echo "📱 Starting Expo app..."
cd apps/mobile
npm run start

# ---------- cleanup ----------
trap "echo '🛑 Shutting down API'; kill $API_PID" EXIT
