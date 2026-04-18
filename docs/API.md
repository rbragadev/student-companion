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
│   ├── institution/         # CRUD de instituições
│   ├── unit/                # CRUD de unidades (vínculo com escola)
│   ├── class-group/         # CRUD de turmas (vínculo com curso)
│   ├── academic-period/     # CRUD de períodos da turma
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
| `GET` | `/users/student` | Listar usuários com role STUDENT |
| `GET` | `/users/admin/:id` | Buscar usuário admin por id |
| `POST` | `/users/admin` | Criar usuário admin (com senha, role e perfis) |
| `PATCH` | `/users/admin/:id` | Atualizar usuário admin (dados e perfis) |
| `DELETE` | `/users/admin/:id` | Excluir usuário admin |
| `GET` | `/users/:id` | Buscar usuário com preferências |
| `GET` | `/users/:id/permissions` | Permissões efetivas do usuário (union dos perfis) |
| `PUT` | `/users/:id/admin-profiles` | Substituir perfis administrativos do usuário |
| `POST` | `/users/:id/preferences` | Criar/atualizar preferências |

Status do aluno (`users.student_status`):
- `lead`
- `application_started`
- `pending_enrollment`
- `enrolled`

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

### Cadastro Estrutural

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET/POST` | `/institution` | Listar / criar instituição |
| `GET/PATCH/DELETE` | `/institution/:id` | Detalhe / editar / excluir instituição |
| `GET/POST` | `/unit` | Listar / criar unidade (`?schoolId=` opcional) |
| `GET/PATCH/DELETE` | `/unit/:id` | Detalhe / editar / excluir unidade |
| `GET/POST` | `/class-group` | Listar / criar turma (`?courseId=` opcional) |
| `GET/PATCH/DELETE` | `/class-group/:id` | Detalhe / editar / excluir turma |
| `GET/POST` | `/academic-period` | Listar / criar período da turma (`?classGroupId=` opcional) |
| `GET/PATCH/DELETE` | `/academic-period/:id` | Detalhe / editar / excluir período |
| `GET` | `/course/:id/offers` | Lista ofertas do curso (datas+pricing), com turma/período internos para validação |

Regras de relacionamento:
- Escola pertence a uma instituição.
- Unidade pertence a uma escola.
- Curso pertence a uma unidade.
- Turma pertence a um curso.
- Período pertence a uma turma.
- Curso também mantém vínculo com escola (compatibilidade do mobile).

Compatibilidade mobile:
- O app mobile continua consumindo `GET /school` e `GET /course`.
- No fechamento de pacote, o app consome `GET /course/:id/offers` e exibe apenas curso + datas (sem expor turma/período para o aluno).
- No domínio de cursos, a API mantém campos persistidos em `snake_case` (ex.: `program_name`, `price_in_cents`, `rating_count`) por compatibilidade histórica.
- O mobile normaliza esse contrato na camada `services/api/mappers/catalogMappers.ts`, convertendo para `camelCase` antes de chegar nas telas/hooks.
- O vínculo `course.school_id` permanece ativo para não quebrar a navegação/listagem no app.

### Intenção de Matrícula (Step A)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/enrollment-intents` | Cria intenção de matrícula para aluno |
| `GET` | `/enrollment-intents` | Lista intenções (`?studentId=&status=&studentStatus=&institutionId=&schoolId=`) |
| `GET` | `/enrollment-intents/recommended-accommodations?courseId=...` | Lista acomodações recomendadas para o contexto do curso |
| `GET` | `/enrollment-intents/recommended-accommodations?intentId=...` | Lista acomodações recomendadas para a escola da intenção |
| `GET` | `/enrollment-intents/:id` | Detalhe da intenção |
| `PATCH` | `/enrollment-intents/:id` | Edita curso/turma/período da intenção pendente |
| `PATCH` | `/enrollment-intents/:id/accommodation` | Seleciona/troca/remove acomodação da intenção |
| `PATCH` | `/enrollment-intents/:id/status` | Atualiza status operacional (`pending`, `cancelled`, `denied`) |

Payload de criação:

```json
{
  "studentId": "uuid",
  "courseId": "uuid",
  "classGroupId": "uuid",
  "academicPeriodId": "uuid"
}
```

Regras:
- valida a cadeia `course -> class_group -> academic_period`
- permite apenas 1 intenção **pendente** por aluno (validação de serviço)
- `accommodation` é opcional na intenção
- quando informada, deve ser uma acomodação ativa; recomendação por escola atua como prioridade de sugestão (não bloqueio)
- atualiza `users.student_status` no fluxo: `lead -> application_started -> pending_enrollment`
- histórico de intenções é preservado (`pending`, `converted`, `cancelled`, `denied`)

### Matrícula Confirmada + Operação Financeira (Step B+)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/enrollments/from-intent/:intentId` | Converte intenção pendente em matrícula real |
| `GET` | `/enrollments` | Lista matrículas (`?studentId=&status=&institutionId=&schoolId=&accommodationStatus=`) |
| `GET` | `/enrollments/active?studentId=...` | Retorna matrícula ativa do aluno (ou `null`) |
| `GET` | `/enrollments/journey/:studentId` | Retorna visão consolidada: intenção pendente, matrícula ativa e históricos |
| `GET` | `/enrollments/:id/timeline` | Timeline consolidada da matrícula (status, docs, mensagens) |
| `GET` | `/enrollments/:id/package-summary` | Resumo financeiro consolidado do pacote (matrícula + acomodação) |
| `GET` | `/enrollments/:id` | Detalhe de matrícula |
| `PATCH` | `/enrollments/:id` | Atualiza status e/ou pricing (`basePrice`, `fees`, `discounts`, `currency`) |
| `PATCH` | `/enrollments/:id/accommodation` | Seleciona/troca/remove acomodação da matrícula |
| `PATCH` | `/enrollments/:id/accommodation-workflow` | Atualiza workflow operacional da acomodação (`not_selected`, `selected`, `approved`, `denied`, `closed`) |
| `PATCH` | `/enrollments/:id/status` | Atualização legada apenas de status |
| `GET` | `/enrollment-documents` | Lista documentos (`?enrollmentId=`) |
| `POST` | `/enrollment-documents` | Adiciona documento da matrícula |
| `PATCH` | `/enrollment-documents/:id` | Aprova/rejeita/atualiza documento |
| `GET` | `/enrollment-messages` | Lista mensagens (`?enrollmentId=` ou `?studentId=` e opcional `?channel=enrollment|accommodation`) |
| `POST` | `/enrollment-messages` | Envia mensagem vinculada à matrícula (opcional `channel`) |
| `GET` | `/enrollment-messages/unread-count?studentId=...` | Contador de mensagens não lidas para o aluno |
| `PATCH` | `/enrollment-messages/read?enrollmentId=...&userId=...` | Marca chat da matrícula como lido |
| `GET` | `/commission-config` | Lista regras de comissão (`?scopeType=&scopeId=`) |
| `POST` | `/commission-config` | Cria regra de comissão |
| `PATCH` | `/commission-config/:id` | Atualiza regra de comissão |
| `GET` | `/course-pricing` | Lista preços de curso por período (`?courseId=&academicPeriodId=&isActive=`) |
| `POST` | `/course-pricing` | Cria/atualiza preço por curso+período (upsert) |
| `PATCH` | `/course-pricing/:id` | Atualiza preço de curso |
| `GET` | `/course-pricing/resolve?courseId=...&academicPeriodId=...&startDate=...&endDate=...` | Resolve preço ativo e valor calculado conforme período selecionado |
| `GET` | `/accommodation-pricing` | Lista preços de acomodação (`?accommodationId=&periodOption=&isActive=`) |
| `POST` | `/accommodation-pricing` | Cria/atualiza preço por acomodação+período (upsert) |
| `PATCH` | `/accommodation-pricing/:id` | Atualiza preço de acomodação |
| `GET` | `/accommodation-pricing/resolve?accommodationId=...&periodOption=...&startDate=...&endDate=...` | Resolve preço ativo e valor calculado para o período selecionado |
| `POST` | `/quotes` | Gera quote consolidada do pacote (curso, acomodação opcional, entrada, saldo, comissão) |
| `GET` | `/quotes/:id` | Retorna detalhe da quote |
| `GET` | `/quotes/by-intent/:intentId` | Retorna a quote mais recente associada à intenção |
| `GET` | `/recommendations/accommodations?courseId=...` | Lista recomendações de acomodação por contexto do curso (máx. 3) |

Regras:
- intenção pode ser editada apenas enquanto `status = pending`
- uma intenção pode ser confirmada no máximo uma vez
- confirmação valida novamente a cadeia acadêmica completa
- confirmação cria matrícula com status inicial `application_started`
- confirmação carrega a acomodação selecionada na intenção (quando existir)
- acomodação possui workflow operacional no contexto da matrícula: `not_selected -> selected -> approved|denied -> closed`
- após `accommodationStatus = closed`, troca/remoção de acomodação é bloqueada
- confirmação marca intenção como `converted` (`converted_at` preenchido)
- intenção pendente só pode ser criada/alterada com preço ativo de curso para `course + academicPeriod`
- cursos suportam `period_type`:
  - `weekly`: validação por múltiplos de 7 dias com datas de domingo a domingo
  - `fixed`: datas dentro da janela do período acadêmico
- `auto_approve_intent` em curso prepara avanço automático do fluxo por regra do catálogo
- no fluxo mobile de fechamento:
  - quando `auto_approve_intent=true`, a etapa final segue para checkout
  - quando `auto_approve_intent=false`, a etapa final retorna “proposta enviada para aprovação”
- pricing de pacote é calculado no backend:
  - `enrollmentAmount = basePrice + fees - discounts`
  - `accommodationAmount` vem do preço da acomodação vinculada (quando existir)
  - `packageTotalAmount = enrollmentAmount + accommodationAmount`
- comissão usa precedência: `course` override `institution`
- se existir configuração de comissão em `scopeType=accommodation`, ela também entra no cálculo do pacote
- comissão consolidada é salva em `enrollment_pricing` (`totalCommissionAmount`, `commissionAmount`, `commissionPercentage`)
- quote (`enrollment_quote`) é snapshot financeiro da escolha do momento, com tipos:
  - `course_only`
  - `course_with_accommodation`
  - `accommodation_only` (preparação futura)
- quote calcula:
  - `totalAmount = courseAmount + accommodationAmount + fees - discounts`
  - `downPaymentAmount = totalAmount * downPaymentPercentage`
  - `remainingAmount = totalAmount - downPaymentAmount`
- quote aceita `items` independentes com datas:
  - `itemType`: `course` | `accommodation`
  - `referenceId` (pricing de referência)
  - `startDate` / `endDate`
  - `amount` / `commissionAmount`
- `student_status` global do aluno prioriza matrícula ativa (qualquer estágio ativo do workflow)
- mudanças de status em intenção/matrícula recalculam `users.student_status` automaticamente:
  - matrícula com status final (`enrolled`/`active`) -> `enrolled`
  - matrícula operacional em andamento ou intenção pendente -> `pending_enrollment`
  - histórico sem pendência ativa -> `application_started`
  - sem histórico -> `lead`

Status operacionais de matrícula:
- `application_started`
- `documents_pending`
- `under_review`
- `approved`
- `enrolled`
- `rejected`
- `cancelled`

Status legados ainda aceitos para compatibilidade:
- `active`, `completed`, `denied`

Distinção conceitual:
- `institution`: escopo administrativo do cliente no SaaS.
- `school`: catálogo acadêmico consumido pelo app mobile.
- `unit`: unidade/campus operacional vinculada à escola.

---

### Escolas · Cursos · Acomodações · Lugares · Avaliações

| Recurso | Endpoints |
|---------|-----------|
| Escolas | `GET/POST /school`, `GET/PATCH/DELETE /school/:id` |
| Cursos | `GET/POST /course`, `GET/PATCH/DELETE /course/:id` |
| Acomodações | `GET/POST /accommodation`, `GET/PATCH /accommodation/:id`, `GET /accommodation/recommended/school/:schoolId`, `GET /accommodation/upsell/enrollment/:enrollmentId`, `GET /accommodation/recommendations/school/:schoolId`, `PATCH /accommodation/recommendations/school/:schoolId/:accommodationId` |
| Lugares | `GET/POST /place`, `GET/PATCH/DELETE /place/:id`, `?category=X` |

Regras de acomodação (upsell):
- `accommodation` é catálogo independente (sem vínculo obrigatório direto com escola).
- cada acomodação possui `score` próprio.
- recomendação contextual por escola fica na relação `school_accommodation_recommendation` (`schoolId`, `accommodationId`, `isRecommended`, `priority`, `badgeLabel`).
- upsell da matrícula usa a escola da matrícula como contexto e retorna apenas acomodações marcadas como recomendadas para aquela escola.
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
| `school` | institutionId, name, location, isPartner, rating, badges |
| `course` | unitId, schoolId, programName, weeklyHours, priceInCents, targetAudience |
| `accommodation` | title, accommodationType, price, coords, ratings, isPartner, isTopTrip |
| `place` | name, category, coords, isStudentFavorite, hasDeal, hours (JSON) |
| `review` | userId, reviewableType, reviewableId, rating, comment |
| `permission` | key, description |
| `admin_profile` | name, label, isSystem |
| `admin_profile_permission` | profileId + permissionId |
| `user_admin_profile` | userId + profileId |
| `institution` | name, description |
| `unit` | schoolId, name, code, localização |
| `class_group` | courseId, name, code, shift, status, capacity |
| `academic_period` | classGroupId, name, startDate, endDate, status |

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

Seed cria também: 3 escolas · 6 cursos · 6 acomodações · 6 lugares · 6 reviews (Vancouver/Toronto) + permissões administrativas + perfis (`super_admin`, `admin`, `operador`) + vínculos iniciais de usuários admin + cenário estrutural inicial (instituições, unidades, períodos e turmas).

---

## Docker

`docker-compose.yml` na raiz: serviços `postgres` (5432) + `api` (3000).

`apps/api/Dockerfile` — build multi-stage. Entrypoint: `prisma db push → seed → node dist/main`.

```bash
make up     # sobe tudo com build
make down   # para containers
make logs   # logs da API em tempo real
```
