# 🔧 Student Companion API

Backend da aplicação Student Companion construído com NestJS, Prisma e PostgreSQL.

## 🚀 Tecnologias

- **NestJS** - Framework Node.js progressivo
- **Prisma ORM** - Database toolkit com type-safety
- **PostgreSQL** - Banco de dados relacional
- **TypeScript** - Linguagem de programação
- **Docker** - Containerização do banco

## 🏗 Estrutura do Projeto

```
apps/api/
├── src/
│   ├── prisma/              # PrismaService
│   ├── user/                # Módulo de usuários
│   │   ├── dto/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.module.ts
│   ├── recommendation/      # Sistema de recomendação
│   │   ├── interfaces/      # Interfaces genéricas
│   │   ├── rules/           # Regras de scoring
│   │   │   ├── accommodation/
│   │   │   ├── course/
│   │   │   ├── place/
│   │   │   └── school/
│   │   ├── strategies/      # Estratégias por tipo
│   │   ├── factories/       # Factory de estratégias
│   │   ├── dto/
│   │   ├── recommendation.controller.ts
│   │   ├── recommendation.service.ts
│   │   └── recommendation.module.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma        # Schema do banco
│   └── migrations/          # Migrations do Prisma
├── test/
└── package.json
```

## 📡 Endpoints

### Users

#### GET /users/:id
Busca um usuário por ID com suas preferências.

**Response:**
```json
{
  "id": "user-123",
  "firstName": "Raphael",
  "lastName": "Braga",
  "email": "raphael@email.com",
  "preferences": {
    "destinationCity": "Vancouver",
    "destinationCountry": "Canada",
    "englishLevel": "intermediate",
    "budgetAccommodationMin": 800,
    "budgetAccommodationMax": 1200
  }
}
```

### Recomendações

#### GET /recommendation/:userId?type={type}&limit={limit}
Busca recomendações personalizadas para um usuário.

**Query Params:**
- `type` (obrigatório): `accommodation` | `course` | `place` | `school`
- `limit` (opcional): 1-50, padrão 10

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "item-123",
      "type": "accommodation",
      "title": "Modern Studio Downtown",
      "subtitle": "Vancouver • $950/month",
      "score": 87.5,
      "badge": "Top Trip",
      "imageUrl": "https://...",
      "data": { /* dados completos */ }
    }
  ]
}
```

#### GET /recommendation/:userId/mixed?limit={limit}
Busca recomendações de todos os tipos misturadas e ordenadas por score.

**Query Params:**
- `limit` (opcional): 1-50, padrão 10

**Response:** Mesmo formato acima, mas com tipos misturados

## 🧠 Sistema de Recomendação

Consulte a [documentação completa do sistema de recomendação](./RECOMMENDATION_SYSTEM.md).

### Arquitetura

- **Strategy Pattern** - Uma estratégia por tipo de entidade
- **Rule Pattern** - Regras de scoring modulares
- **Factory Pattern** - Criação de estratégias
- **SOLID Principles** - Código extensível e manutenível

### Tipos de Entidades

1. **Accommodation** - Acomodações
2. **Course** - Cursos de idiomas
3. **Place** - Lugares e atrações
4. **School** - Escolas de idioma

### Sistema de Scoring

Cada entidade é avaliada por múltiplas regras com pesos:

**Accommodation (5 regras):**
- Budget (40%)
- Rating (25%)
- Distance (15%)
- Type Preference (10%)
- Bonus (10%)

**Course (4 regras):**
- Budget (40%)
- Rating (30%)
- English Level (20%)
- Duration (10%)

**Place (3 regras):**
- Rating (50%)
- Student Favorite (30%)
- Deal (20%)

**School (4 regras):**
- Rating (40%)
- Programs Variety (25%)
- Location (20%)
- Accreditation (15%)

Score final: `Σ(ruleScore × weight) / Σ(weights)`

## 🗄 Database

### Models Principais

- **User** - Dados do usuário
- **UserPreferences** - Preferências e orçamentos
- **School** - Escolas de idioma
- **Course** - Cursos oferecidos
- **Accommodation** - Acomodações disponíveis
- **Place** - Lugares e atrações
- **Review** - Avaliações (polimórfico)

### Relacionamentos

```
User 1:1 UserPreferences
School 1:N Course
User 1:N Review
```

## 🚀 Setup e Execução

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)

### 1. Instalar dependências
```bash
npm install
```

### 2. Subir o banco de dados
```bash
cd ../../infra/docker
docker-compose up -d
```

### 3. Configurar variáveis de ambiente
```bash
# apps/api/.env
DATABASE_URL="postgresql://user:password@localhost:5432/student_companion"
```

### 4. Rodar migrations
```bash
cd apps/api
npx prisma migrate dev
```

### 5. (Opcional) Seed data
```bash
npx prisma db seed
```

### 6. Iniciar a API
```bash
# Da raiz
npm run dev:api

# Ou direto da pasta
cd apps/api
npm run start:dev
```

API rodará em: **http://localhost:3000**

## 🔧 Scripts Úteis

```bash
# Prisma Studio (UI do banco)
npx prisma studio

# Gerar Prisma Client
npx prisma generate

# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Reset do banco (cuidado!)
npx prisma migrate reset

# Rodar testes
npm test

# Testes E2E
npm run test:e2e

# Build para produção
npm run build
npm run start:prod
```

## 🧪 Testes

### Estrutura
```
test/
├── app.e2e-spec.ts
└── jest-e2e.json
```

### Executar
```bash
# Unitários
npm test

# E2E
npm run test:e2e

# Com coverage
npm run test:cov
```

## 📝 Validação

### DTOs com class-validator

```typescript
export class GetRecommendationsDto {
  @IsEnum(RecommendationType)
  type: RecommendationType;

  @IsOptional()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
```

### Pipes Globais
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

## 🔐 Segurança

### CORS
Configurado em `main.ts` para aceitar requisições do frontend.

### Validação
Todos os inputs são validados com class-validator.

### Sanitização
Prisma protege contra SQL Injection automaticamente.

## 📊 Performance

### Query Optimization
- Uso de `select` para campos específicos
- `include` apenas para relações necessárias
- Índices no banco para queries frequentes

### Caching (TODO)
- [ ] Implementar cache Redis
- [ ] Cache de recomendações (10min TTL)
- [ ] Invalidação ao atualizar preferências

## 🐛 Debug

### Logs
```typescript
// Habilitar logs do Prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}
```

### NestJS Logger
```bash
# Verbose mode
npm run start:dev -- --debug
```

## 🚢 Deploy

### Build
```bash
npm run build
```

### Variáveis de Ambiente (Produção)
```bash
DATABASE_URL=
NODE_ENV=production
PORT=3000
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["npm", "run", "start:prod"]
```

## 📚 Recursos

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## 🤝 Contribuindo

1. Leia a [documentação de recomendação](./RECOMMENDATION_SYSTEM.md)
2. Consulte o [TODO](./TODO.md) para tarefas pendentes
3. Siga os padrões SOLID ao adicionar novas features
4. Escreva testes para novas funcionalidades
