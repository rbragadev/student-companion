# Student Companion API

Backend NestJS 11 + Prisma 7 + PostgreSQL.

## Stack

- **NestJS 11** + **TypeScript**
- **Prisma 7** + `@prisma/adapter-pg`
- **PostgreSQL 16**
- **bcrypt** (salt 10) para hashing de senhas
- **@nestjs/jwt** — JWT com expiração de 30 dias

## Estrutura

```
apps/api/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── auth/               # AuthModule, AuthService, AuthController
│   ├── user/               # UserModule, UserService, UserController
│   ├── permission/         # PermissionModule (GET /permission)
│   ├── admin-profile/      # CRUD de perfis + set de permissões
│   ├── school/
│   ├── course/
│   ├── accommodation/
│   ├── place/
│   ├── review/
│   ├── recommendation/     # Strategy + Rule pattern
│   │   ├── interfaces/
│   │   ├── rules/          # accommodation / course / place / school
│   │   ├── strategies/
│   │   └── factories/
│   ├── prisma/             # PrismaService
│   ├── app.module.ts
│   └── main.ts
└── Dockerfile
```

## Executar

```bash
make api          # dev watch (local, roda prisma generate automaticamente)
make up           # postgres + api via Docker (seed automático)
make db-push      # aplica schema sem migrations
make seed         # seed manual
```

## Variáveis de Ambiente

```bash
# apps/api/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/student_companion"
JWT_SECRET="student-companion-dev-secret"
```

---

## Endpoints

> Todos os endpoints retornam envelope `{ statusCode, message, data }`.

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/login` | Login com e-mail e senha |

**Request:**
```json
{ "email": "raphael@studentcompanion.dev", "password": "senha123" }
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "token": "<JWT>",
    "user": { "id": "...", "email": "...", "firstName": "...", "role": "STUDENT" }
  }
}
```

JWT payload: `{ sub, email, role }`. Expiração: 30 dias.

---

### Usuários

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/users` | Criar usuário |
| `GET` | `/users/admin` | Listar usuários com role ADMIN/SUPER_ADMIN |
| `GET` | `/users/admin/:id` | Buscar usuário admin por id |
| `POST` | `/users/admin` | Criar usuário admin (com senha, role e perfis) |
| `PATCH` | `/users/admin/:id` | Atualizar usuário admin (dados e perfis) |
| `DELETE` | `/users/admin/:id` | Excluir usuário admin |
| `GET` | `/users/:id` | Buscar usuário com preferências |
| `GET` | `/users/:id/permissions` | Permissões efetivas do usuário (union dos perfis) |
| `PUT` | `/users/:id/admin-profiles` | Substituir perfis administrativos do usuário |
| `POST` | `/users/:id/preferences` | Criar/atualizar preferências |

---

### Permissões e Perfis Admin

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/permission` | Listar permissões |
| `GET` | `/admin-profile` | Listar perfis admin |
| `GET` | `/admin-profile/:id` | Detalhe de perfil (permissões e usuários) |
| `POST` | `/admin-profile` | Criar perfil |
| `PATCH` | `/admin-profile/:id` | Atualizar perfil |
| `DELETE` | `/admin-profile/:id` | Excluir perfil não-sistêmico |
| `PUT` | `/admin-profile/:id/permissions` | Substituir permissões do perfil |

Exemplo `PUT /admin-profile/:id/permissions`:

```json
{
  "permissionIds": ["clz...", "clz..."]
}
```

---

### Escolas · Cursos · Acomodações · Lugares · Avaliações

| Recurso | Endpoints |
|---------|-----------|
| Escolas | `GET/POST /school`, `GET /school/:id` |
| Cursos | `GET/POST /course`, `GET /course/:id` |
| Acomodações | `GET/POST /accommodation`, `GET/PATCH /accommodation/:id` |
| Lugares | `GET/POST /place`, `GET/PATCH/DELETE /place/:id`, `?category=X` |
| Avaliações | `GET/POST /review`, `GET /review/:id`, `PATCH /review/:id`, `GET /review/user/:userId`, `GET /review?reviewableType=X&reviewableId=Y` |

---

### Recomendações

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/recommendation/:userId?type=X&limit=N` | Por tipo |
| `GET` | `/recommendation/:userId/mixed?limit=N` | Todos os tipos misturados |

`type`: `accommodation` · `course` · `place` · `school`

**Response item:**
```json
{
  "id": "...",
  "type": "accommodation",
  "title": "Modern Studio Downtown",
  "subtitle": "Vancouver • $950/month",
  "score": 87.5,
  "badge": "Top Trip",
  "imageUrl": "https://...",
  "data": { /* entidade completa */ }
}
```

**Pesos por estratégia:**

| Estratégia | Regras |
|------------|--------|
| Accommodation | Budget (0.4) · Rating (0.25) · Distance* (0.15) · Type preference (0.1) · Bonus (0.1) |
| Course | Budget (0.4) · Rating (0.3) · English level (0.2) · Horas/semana (0.1) |
| School | Rating (0.4) · Variedade de cursos (0.25) · Localização (0.2) · Parceria (0.15) |
| Place | Rating (0.5) · Student favorite (0.3) · Deal (0.2) |

> *Distance retorna score neutro (50) — cálculo Haversine pendente.

---

## Banco de Dados

### Models

| Model | Campos-chave |
|-------|-------------|
| `users` | id, email, passwordHash, role, firstName, lastName |
| `user_preferences` | userId, destinationCity, budget ranges, englishLevel, preferredAccommodationTypes |
| `school` | name, location, isPartner, rating, badges |
| `course` | schoolId, programName, weeklyHours, priceInCents, targetAudience |
| `accommodation` | title, accommodationType, price, coords, ratings, isPartner, isTopTrip |
| `place` | name, category, coords, isStudentFavorite, hasDeal, hours (JSON) |
| `review` | userId, reviewableType, reviewableId, rating, comment |
| `permission` | key, description |
| `admin_profile` | name, label, isSystem |
| `admin_profile_permission` | profileId + permissionId |
| `user_admin_profile` | userId + profileId |

### Roles

```prisma
enum Role {
  STUDENT
  ADMIN
  SUPER_ADMIN
}
```

### Usuários de Seed (senha: `senha123`)

| E-mail | Role |
|--------|------|
| `raphael@studentcompanion.dev` | STUDENT |
| `emily@studentcompanion.dev` | STUDENT |
| `lucas@studentcompanion.dev` | STUDENT |
| `admin@studentcompanion.dev` | ADMIN |
| `superadmin@studentcompanion.dev` | SUPER_ADMIN |
| `operador@studentcompanion.dev` | ADMIN |

Seed cria também: 3 escolas · 6 cursos · 6 acomodações · 6 lugares · 6 reviews (Vancouver/Toronto) + permissões administrativas + perfis (`super_admin`, `admin`, `operador`) + vínculos iniciais de usuários admin.

---

## Docker

`docker-compose.yml` na raiz: serviços `postgres` (5432) + `api` (3000).

`apps/api/Dockerfile` — build multi-stage. Entrypoint: `prisma db push → seed → node dist/main`.

```bash
make up     # sobe tudo com build
make down   # para containers
make logs   # logs da API em tempo real
```
