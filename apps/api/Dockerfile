FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=apps/api

COPY apps/api ./apps/api

RUN cd apps/api && npx prisma generate
RUN npm run build -w apps/api

# ─────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Instala todas as deps (incluindo dev) para ter ts-node e prisma CLI no seed
RUN npm ci --workspace=apps/api

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY apps/api/.env.example ./apps/api/.env.example 2>/dev/null || true

COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
RUN chmod +x ./apps/api/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/apps/api/docker-entrypoint.sh"]
