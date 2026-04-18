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
| `POST /enrollment-intents` | Criar intenção de matrícula (aluno + curso + turma + período) |
| `GET /enrollment-intents` | Listar intenções de matrícula (filtros: studentId/status/studentStatus/instituição/escola) |
| `GET /enrollment-intents/:id` | Detalhe de intenção de matrícula |
| `PATCH /enrollment-intents/:id` | Editar intenção pendente antes da confirmação |
| `PATCH /enrollment-intents/:id/status` | Operar status da intenção (`pending/cancelled/denied`) |
| `POST /enrollments/from-intent/:intentId` | Confirmar intenção e gerar matrícula real |
| `GET /enrollments` | Listar matrículas (`studentId/status/institutionId/schoolId`) |
| `GET /enrollments/active?studentId=...` | Buscar matrícula ativa do aluno |
| `GET /enrollments/journey/:studentId` | Consulta consolidada da jornada acadêmica |
| `GET /enrollments/:id/timeline` | Timeline da matrícula (status + docs + mensagens) |
| `GET /enrollments/:id` | Detalhe de matrícula |
| `PATCH /enrollments/:id` | Operar status e pricing da matrícula |
| `PATCH /enrollments/:id/status` | Operação legada de status da matrícula |
| `GET /enrollment-documents` | Listar documentos da matrícula |
| `POST /enrollment-documents` | Anexar documento à matrícula |
| `PATCH /enrollment-documents/:id` | Aprovar/rejeitar documento |
| `GET /enrollment-messages` | Listar mensagens da matrícula |
| `POST /enrollment-messages` | Enviar mensagem na matrícula |
| `GET /enrollment-messages/unread-count?studentId=...` | Contador de não lidas para o aluno |
| `PATCH /enrollment-messages/read?enrollmentId=...&userId=...` | Marcar mensagens como lidas |
| `GET /commission-config` | Listar configurações de comissão |
| `POST /commission-config` | Criar configuração de comissão |
| `PATCH /commission-config/:id` | Atualizar configuração de comissão |

---

### Escolas · Cursos · Acomodações · Lugares · Avaliações

| Recurso | Endpoints |
|---------|-----------|
| Escolas | `GET/POST /school`, `GET/PATCH/DELETE /school/:id` |
| Cursos | `GET/POST /course`, `GET/PATCH/DELETE /course/:id` |
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
| `school` | institutionId, name, location, isPartner, rating, badges |
| `unit` | schoolId, name, code, localização |
| `course` | unitId, school_id, program_name, weekly_hours, price_in_cents, target_audience |
| `class_group` | courseId, name, code, shift, status, capacity |
| `academic_period` | classGroupId, name, startDate, endDate, status |
| `enrollment_intent` | studentId, courseId, classGroupId, academicPeriodId, status, createdAt |
| `enrollment` | studentId, institutionId, schoolId, unitId, courseId, classGroupId, academicPeriodId, enrollmentIntentId, status |
| `enrollment_document` | enrollmentId, type, fileUrl, status, adminNote |
| `enrollment_message` | enrollmentId, senderId, message, createdAt |
| `enrollment_pricing` | enrollmentId, basePrice, fees, discounts, totalAmount, currency, commissionAmount |
| `commission_config` | scopeType, scopeId, percentage, fixedAmount |
| `enrollment_status_history` | enrollmentId, fromStatus, toStatus, reason, changedById |
| `enrollment_message_read` | enrollmentId, userId, lastReadAt |
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

1 instituição + 3 escolas + 3 unidades + 6 cursos + 3 turmas + 3 períodos da turma + intenções pendentes/editáveis + intenção convertida e matrícula ativa · 6 acomodações · 6 lugares · 6 reviews (Vancouver/Toronto).
Seed de pricing de acomodação é idempotente por `upsert` na chave `accommodationId + periodOption`, garantindo consistência mesmo sem reset total do banco.

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

### Integração Real (Escopo Acadêmico Coberto)

Diagnóstico atual:

| Recurso | Status | Observação |
|---------|--------|------------|
| Escolas (`/school`) | Integrado | Mobile consome endpoint real (`schoolApi`, `useSchools`) |
| Cursos (`/course`) | Integrado | Mobile consome endpoints reais (`courseApi`, `useCourses`, `useCourseById`) |
| Instituições | Parcial (admin/backend) | Disponível no SaaS/backend; não consumido diretamente no mobile neste step |
| Unidades | Parcial (admin/backend) | Disponível no SaaS/backend; não consumido diretamente no mobile neste step |
| Turmas | Parcial (admin/backend) | Disponível no SaaS/backend; não consumido diretamente no mobile neste step |
| Períodos da turma | Parcial (admin/backend) | Disponível no SaaS/backend; não consumido diretamente no mobile neste step |
| Intenção de matrícula (`/enrollment-intents`) | Integrado | Mobile cria intenção real e backend atualiza `studentStatus` |
| Matrícula (`/enrollments`) | Integrado | SaaS confirma intenção, gera matrícula e mobile lê matrícula ativa real |

Ajustes aplicados para fechar compatibilidade mobile:
- Normalização centralizada de payload em `apps/mobile/src/services/api/mappers/catalogMappers.ts` (snake_case -> camelCase).
- `schoolApi` e `courseApi` passaram a retornar dados mapeados e consistentes para hooks/telas.
- Remoção de fallback artificial de escola (`Unknown School`) no fluxo de cursos.
- Filtro de escola na lista de cursos passou a usar IDs reais do backend (sem modal fake/TODO).
- Endpoint de cursos passou a incluir `school.isPartner` no backend para refletir o estado real no mobile.
- Ação de iniciar matrícula no `CourseDetailScreen` passou a usar endpoints reais:
  `GET /class-group?courseId=...`, `GET /academic-period?classGroupId=...`, `POST /enrollment-intents`.
- `studentStatus` foi adicionado ao perfil do usuário e refletido no mobile após criação da intenção.
- Criação/edição de intenção no mobile migrou para tela dedicada (`EnrollmentIntentScreen`) sem alerts no fluxo principal.
- Perfil do mobile passou a exibir matrícula ativa real (`GET /enrollments/active?studentId=...`).
- Mobile ganhou tela de jornada acadêmica como índice (`GET /enrollments/journey/:studentId`) e tela dedicada de contexto da matrícula (`/enrollments/:id`) com dados acadêmicos, financeiro, chat, documentos e timeline.

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
    │       ├── dashboard/      # Dashboard com stats reais da API
    │       ├── academic-structure/ # Consulta da cadeia acadêmica com filtros encadeados
    │       ├── enrollment-intents/ # Lista + detalhe + edição + confirmação
    │       └── enrollments/        # Lista + detalhe de matrículas
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

### Estrutura Acadêmica

Tela de consulta operacional (`/academic-structure`) com dados reais da API:
`/institution`, `/school`, `/unit`, `/course`, `/class-group`, `/academic-period`.
Permite filtros encadeados por instituição, escola, unidade, curso e turma, e exibe os vínculos entre as entidades em cadeia.

### Intenções de Matrícula (Step A)

Tela de operação no SaaS:
- `/enrollment-intents` (listagem com filtros por status, instituição e escola)
- `/enrollment-intents/:id` (detalhe simples do vínculo aluno > curso > turma > período)

### Matrículas (Step B)

Fluxo no SaaS:
- `/enrollment-intents/:id/edit` para alteração da intenção pendente
- `/enrollment-intents/:id/confirm` para confirmação dedicada (sem alert)
- `/enrollments` e `/enrollments/:id` para consulta da matrícula real confirmada
- operação de status em intenção e matrícula no SaaS sem recriar domínio (`PATCH /enrollment-intents/:id/status`, `PATCH /enrollments/:id/status`)

### Checkout e Pagamento (Step Comercial)

- Checkout operacional por matrícula com estado real do backend:
  - `GET /enrollments/:id/checkout`
  - `POST /enrollments/:id/checkout`
- Pagamento fake da entrada:
  - `POST /enrollments/:id/checkout/pay-fake`
  - persistência em `payment` com status (`pending`, `paid`, `failed`, `cancelled`)
- Notificações do aluno:
  - `GET /notifications?userId=...`
  - `GET /notifications/unread-count?userId=...`
  - `PATCH /notifications/:id/read`
  - `PATCH /notifications/read-all`
- Aprovação manual:
  - checkout fica bloqueado enquanto proposta aguarda operação (`blocked_waiting_approval`);
  - ao aprovar/rejeitar, backend gera notificação e atualiza timeline/estado.
- Pricing e resumo financeiro no fluxo matrícula/checkout:
  - `GET /accommodation-pricing/resolve` exige pricing ativa real (sem fallback para `accommodation.priceInCents`);
  - `GET /enrollments/:id/package-summary` não usa fallback implícito de valor base da acomodação quando não existe quote/pricing válido.

### Componentes genéricos prontos

| Componente | Uso |
|-----------|-----|
| `DataTable<T>` | Tabela tipada com loading/empty state e getRowHref |
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
