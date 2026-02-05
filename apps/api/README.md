# 🔧 Student Companion API

Backend NestJS + Prisma + PostgreSQL

## 🚀 Quick Start

```bash
# 1. Instalar dependências (da raiz do projeto)
npm install

# 2. Subir o banco de dados
cd ../../infra/docker
docker-compose up -d

# 3. Rodar migrations
cd ../../apps/api
npx prisma migrate dev

# 4. Iniciar a API
npm run start:dev
```

API disponível em: **http://localhost:3000**

## 📚 Documentação Completa

Para documentação detalhada, consulte:

- **[Documentação da API](../../docs/API.md)** - Endpoints, estrutura, tecnologias
- **[Sistema de Recomendação](../../docs/RECOMMENDATION_SYSTEM.md)** - Arquitetura SOLID, regras de scoring
- **[TODO](../../docs/TODO.md)** - Roadmap de melhorias

## 🔧 Scripts Úteis

```bash
npx prisma studio        # UI do banco de dados
npx prisma generate      # Gerar Prisma Client
npm test                 # Testes unitários
npm run test:e2e        # Testes E2E
```

## 📡 Endpoints Principais

- `GET /users/:id` - Buscar usuário
- `GET /recommendation/:userId?type={type}` - Recomendações específicas
- `GET /recommendation/:userId/mixed` - Recomendações mistas

Veja a [documentação completa da API](../../docs/API.md) para mais detalhes.
