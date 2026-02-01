# Student Companion API

Backend da aplicação Student Companion construído com NestJS e Prisma.

## Setup Inicial

### 1. Instalar dependências
```bash
npm install
```

### 2. Subir o banco de dados (Docker)
```bash
cd ../../infra/docker
docker-compose up -d
```

### 3. Rodar migrations
```bash
npx prisma migrate dev
```

### 4. (Opcional) Abrir Prisma Studio
```bash
npx prisma studio
```

### 5. Iniciar a API em modo desenvolvimento
Da raiz do monorepo:
```bash
npm run dev:api
```

Ou diretamente da pasta da API:
```bash
npm run start:dev
```

## Estrutura do Projeto

```
src/
├── prisma/         # Módulo do Prisma (PrismaService)
├── user/           # Módulo de usuários
│   ├── dto/        # Data Transfer Objects
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── user.module.ts
├── app.module.ts
└── main.ts
```

## Endpoints Disponíveis

### Users

#### GET /users/:id
Busca um usuário por ID.

**Exemplo de resposta:**
```json
{
  "id": "test-user-1",
  "firstName": "Raphael",
  "lastName": "Braga",
  "email": "raphael.braga@email.com",
  "phone": "+1 (604) 555-0123",
  "avatar": "https://api.dicebear.com/7.x/avataaars/png?seed=Raphael",
  "destination": {
    "city": "Vancouver",
    "country": "Canada"
  },
  "purpose": "study English",
  "budget": {
    "accommodation": "$800-1200/month",
    "course": "$1200-1600/month"
  },
  "englishLevel": "Intermediate",
  "arrivalDate": "March 2026",
  "hasUnreadNotifications": true,
  "notificationCount": 3
}
```

## Tecnologias

- **NestJS** - Framework Node.js
- **Prisma 7** - ORM com suporte a PostgreSQL adapter
- **PostgreSQL** - Banco de dados relacional
- **TypeScript** - Linguagem de programação

## Próximos Passos

- [ ] Implementar POST /users (criar usuário)
- [ ] Implementar PATCH /users/:id (atualizar usuário)
- [ ] Integrar com o frontend mobile
- [ ] Adicionar validação com class-validator
- [ ] Implementar testes unitários e e2e
