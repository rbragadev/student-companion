# O que está implementado

Referência do estado atual do projeto. Atualizar conforme novas features forem adicionadas.

---

## Aplicações

| App | Tecnologia | Porta | Comando |
|-----|-----------|-------|---------|
| `apps/api` | NestJS 11 + Prisma 7 + PostgreSQL | 3000 | `make api` |
| `apps/mobile` | React Native 0.81 + Expo SDK 54 | — | `make mobile` |
| `apps/admin` | Next.js 15 + Tailwind CSS 4 | 3001 | `make admin` |

---

## Backend (NestJS + Prisma)

### Autenticação
| Endpoint | Descrição |
|----------|-----------|
| `POST /auth/login` | Login com e-mail e senha → JWT 30 dias + dados do usuário (inclui `role`) |

JWT payload: `{ sub, email, role }`. Campo `passwordHash` no model `User` (bcrypt, salt 10).

---

### Usuários
| Endpoint | Descrição |
|----------|-----------|
| `POST /users` | Criar usuário |
| `GET /users/:id` | Buscar usuário com preferências |
| `POST /users/:id/preferences` | Criar/atualizar preferências |

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

### Sistema de Recomendação
| Endpoint | Descrição |
|----------|-----------|
| `GET /recommendation/:userId?type=X&limit=N` | Recomendações por tipo |
| `GET /recommendation/:userId/mixed?limit=N` | Recomendações mistas |

`type`: `accommodation` · `course` · `place` · `school`

**Pesos por estratégia:**

| Estratégia | Regras (peso) |
|------------|--------------|
| Accommodation | Budget (0.4) · Rating (0.25) · Distance* (0.15) · Type preference (0.1) · Bonus (0.1) |
| Course | Budget (0.4) · Rating (0.3) · English level match (0.2) · Horas/semana (0.1) |
| School | Rating (0.4) · Variedade de cursos (0.25) · Localização (0.2) · Parceria (0.15) |
| Place | Rating (0.5) · Student favorite (0.3) · Deal (0.2) |

> *Distance rule retorna score neutro (50) — cálculo Haversine pendente.

---

### Roles e Permissões

Enum `Role` no Prisma: `STUDENT` · `ADMIN` · `SUPER_ADMIN`

O campo `role` é incluído no JWT. O mobile ignora o role; o admin valida antes de criar a sessão.

---

## Banco de Dados

PostgreSQL 16 · Prisma 7 · adapter `@prisma/adapter-pg`

| Model | Campos-chave |
|-------|-------------|
| `users` | id, email, passwordHash, role, firstName, lastName |
| `user_preferences` | userId, destinationCity, budget ranges, englishLevel, preferredAccommodationTypes |
| `school` | name, location, isPartner, rating, badges |
| `course` | school_id, program_name, weekly_hours, price_in_cents, target_audience |
| `accommodation` | title, accommodationType, price, coords, ratings detalhados, isPartner, isTopTrip |
| `place` | name, category, coords, isStudentFavorite, hasDeal, hours (JSON) |
| `review` | userId, reviewableType, reviewableId, rating, comment |

### Seed

Usuários de teste (senha: `senha123`):

| E-mail | Role | Perfil |
|--------|------|--------|
| `raphael@studentcompanion.dev` | STUDENT | Vancouver · study · intermediate |
| `emily@studentcompanion.dev` | STUDENT | Vancouver · college · advanced |
| `lucas@studentcompanion.dev` | STUDENT | Toronto · language exchange · beginner |
| `admin@studentcompanion.dev` | ADMIN | — |
| `superadmin@studentcompanion.dev` | SUPER_ADMIN | — |

3 escolas · 6 cursos · 6 acomodações · 6 lugares · 6 reviews (Vancouver/Toronto).

---

## Mobile (React Native + Expo)

### Telas

| Tela | O que mostra |
|------|-------------|
| LoginScreen | Formulário e-mail/senha. Exibe credenciais dev em modo `__DEV__`. |
| HomeScreen | Hero card + recomendações personalizadas (scroll horizontal) + atalhos. |
| ProfileScreen | Avatar, dados do usuário, preferências, interesses (mock), reviews, logout. |
| AccommodationScreen | Top Trips (scroll) + listagem completa com busca e filtros. |
| AccommodationDetailScreen | Galeria, detalhes, rating breakdown, regras, comodidades, host. |
| CourseScreen | Lista com busca e filtro por escola. |
| CourseDetailScreen | Galeria, detalhes, reviews. |
| PlacesScreen | Filtro por categoria, lista com deal/student favorite. |
| PlaceDetailScreen | Galeria, horários, comodidades, reviews. |
| CopilotScreen | Q&A estruturado com summary, prós/contras, confiança. (dados mock) |

### Autenticação

`AuthContext` → persiste token + userId no `AsyncStorage`. `tokenStore` injeta Bearer em todos os requests axios e chama `logout()` automaticamente em respostas 401.

### IP dinâmico

`expo-constants` detecta o IP da máquina de desenvolvimento via `Constants.expoConfig?.hostUri`. Sem necessidade de alterar IP manualmente.

### Hooks de dados

Todos usam TanStack Query (5min stale · 10min GC · retry 2x):
`useUserProfile` · `useSchools` · `useCourses` · `useAccommodations` · `usePlaces` · `useReviews` · `useRecommendations`

---

## Admin (Next.js 15)

Painel SaaS administrativo. Roda na porta **3001** (`make admin`).

### Autenticação e Sessão

- Login via `POST /auth/login` da API existente
- Token armazenado em cookie HTTP-only (`admin_token`, 30 dias)
- `middleware.ts` (Edge runtime, `jose`) verifica JWT e role em todas as rotas protegidas
- Usuários `STUDENT` são bloqueados mesmo com token válido
- Logout limpa o cookie e redireciona para `/login`

### Proteção de Rotas

```
/login          → público
/dashboard/*    → requer ADMIN ou SUPER_ADMIN
/schools/*      → requer ADMIN ou SUPER_ADMIN
... (todas as rotas do grupo (admin))
```

### Roles e Permissões

`ROLE_PERMISSIONS` em `src/types/permissions.types.ts` define o que cada role pode fazer. `hasPermission(role, permission)` é usado na sidebar (filtra nav items) e pode ser usado em qualquer page/action.

| Role | Acesso |
|------|--------|
| `STUDENT` | Bloqueado no admin |
| `ADMIN` | Dashboard + CRUD de escolas, cursos, acomodações, lugares · visualização de alunos |
| `SUPER_ADMIN` | Tudo (`*`) |

### Estrutura

```
apps/admin/
├── middleware.ts               # Proteção de rotas (Edge runtime)
└── src/
    ├── app/
    │   ├── (auth)/login/       # LoginForm (client) + Server Action
    │   └── (admin)/
    │       ├── layout.tsx      # Shell com Sidebar
    │       └── dashboard/      # Dashboard com stats reais da API
    ├── components/
    │   ├── layout/             # Sidebar, Header, NavItem, LogoutButton
    │   ├── ui/                 # Button, Input, Badge, DataTable, PageHeader
    │   │                       # LoadingState, EmptyState, ErrorState
    │   └── filters/            # FilterBar (search + selects)
    ├── lib/                    # session.ts, permissions.ts, api.ts, cn.ts
    ├── types/                  # auth.types.ts, permissions.types.ts
    └── config/navigation.ts    # Itens do menu com permissão associada
```

### Dashboard

Busca contagens reais da API (`/school`, `/course`, `/accommodation`, `/place`) em paralelo via `Promise.all`. Mostra cards de stats + grid de módulos futuros (Alunos, Instituições, Unidades, Turmas, Matrículas).

### Componentes genéricos prontos

| Componente | Uso |
|-----------|-----|
| `DataTable<T>` | Tabela tipada com loading/empty state e onRowClick |
| `FilterBar` | Barra de busca + selects dinâmicos |
| `PageHeader` | Título + descrição + slot de ações |
| `LoadingState` | Skeleton rows animados |
| `EmptyState` | Estado vazio com ícone, texto e ação opcional |
| `ErrorState` | Estado de erro com botão de retry |
| `Button` | 5 variants (primary, secondary, danger, ghost, outline) · 3 sizes · isLoading |
| `Input` | Com label, erro e hint integrados |
| `Badge` | 5 variants de cor |

---

## Infra

### Docker

`docker-compose.yml` na raiz: `postgres` (porta 5432) + `api` (porta 3000, seed automático).

`Dockerfile` em `apps/api/Dockerfile` — build multi-stage. Entrypoint: `prisma db push → seed → node dist/main`.

### Makefile

```
make setup    # tudo: deps + docker + schema + seed
make api      # NestJS watch mode
make mobile   # Expo
make admin    # Next.js admin (porta 3001)
make up       # Docker (postgres + api, com build)
make down     # Para containers
make seed     # Seed manual
make db-push  # Aplica schema
make help     # Lista todos os comandos
```

---

## Padrões de código

| Padrão | Onde |
|--------|------|
| Strategy + Rule Pattern | Sistema de recomendação |
| Server Actions | Formulário de login do admin |
| Server Components | Sidebar, Header, Dashboard (Next.js) |
| Context API + useMemo | AuthContext (mobile) |
| HTTP-only Cookie | Sessão do admin |
| Edge Middleware | Proteção de rotas (admin) |
| Response envelope `{ statusCode, message, data }` | Todos os endpoints da API |
