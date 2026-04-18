# Student Companion Admin

Painel SaaS administrativo. Next.js 15 + Tailwind CSS 4.

## Stack

- **Next.js 15** App Router + Server Components + Server Actions
- **TypeScript**
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme`)
- **jose** — verificação JWT em Edge Runtime
- **lucide-react** — ícones

## Executar

```bash
make admin    # inicia Next.js na porta 3001
```

Variáveis de ambiente:

```bash
# apps/admin/.env.local  (copiar de .env.local.example)
NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=student-companion-dev-secret
```

---

## Autenticação e Sessão

- Login via `POST /auth/login` da API
- Token armazenado em **cookie HTTP-only** (`admin_token`, 30 dias)
- `middleware.ts` (Edge runtime, `jose`) verifica JWT + role em toda rota protegida
- Usuários `STUDENT` são bloqueados mesmo com token válido
- Logout limpa o cookie e redireciona para `/login`

### Credenciais de acesso

| E-mail | Role |
|--------|------|
| `admin@studentcompanion.dev` | ADMIN |
| `superadmin@studentcompanion.dev` | SUPER_ADMIN |
| `operador@studentcompanion.dev` | ADMIN |

Senha: `senha123`

---

## Roles e Permissões

Permissões são dinâmicas e vêm da API:

| Fonte | Uso |
|------|-----|
| JWT (`role`) | Gate inicial de acesso ao painel (`ADMIN`/`SUPER_ADMIN`) |
| `/users/:id/permissions` | Permissões efetivas (union dos perfis atribuídos) |
| cookie `admin_permissions` | Cache de permissões para renderização de navegação |
| `lib/authorization.ts` | Guard server-side para rotas e server actions sensíveis |

`hasPermission(permissions, permission)` aplica regra especial: `admin.full` concede acesso irrestrito.

Permissões atuais de navegação:

- `users.read`
- `users.write`
- `roles.read`
- `roles.write`
- `permissions.read`
- `structure.read`
- `structure.write`
- `admin.full`

## Hierarquia Funcional (Fonte Única)

Ordem de setup no SaaS:

1. Instituições
2. Escolas (catálogo mobile, vinculadas à instituição)
3. Unidades (dependem de escola)
4. Cursos (dependem de unidade + escola)
5. Turmas (dependem de curso)
6. Períodos da turma (dependem de turma)

Definição de papéis para evitar sobreposição:
- `Instituição`: escopo administrativo do cliente no SaaS.
- `Escola`: catálogo acadêmico exibido no app (`/school`) e vinculado a uma instituição.
- `Unidade`: campus/unidade operacional vinculada à escola.
- `Curso`: oferta acadêmica vinculada à unidade e à escola; permanece consumida no mobile (`/course`).
- `Turma`: execução acadêmica vinculada a um curso.
- `Período da turma`: janela temporal interna vinculada a uma turma.

Observação:
- O backend mantém `course.school_id` para compatibilidade do mobile.
- A hierarquia administrativa agora usa `school -> unit -> course -> class_group -> academic_period`.

---

## Estrutura

```
apps/admin/
├── middleware.ts               # Proteção de rotas (Edge runtime)
└── src/
    ├── app/
    │   ├── globals.css         # @import "tailwindcss" + @theme colors
    │   ├── layout.tsx          # Root layout
    │   ├── page.tsx            # redirect → /dashboard
    │   ├── (auth)/login/
    │   │   ├── page.tsx        # Login page (Server Component)
    │   │   ├── login-form.tsx  # Formulário (Client, useActionState)
    │   │   └── actions.ts      # Server Actions: loginAction, logoutAction
    │   └── (admin)/
    │       ├── layout.tsx      # Shell com Sidebar
    │       ├── dashboard/      # Dashboard com stats reais da API
    │       ├── admin-users/    # Lista, criação e edição de usuários admin
    │       ├── institutions/   # CRUD de instituições
    │       ├── schools/        # CRUD de escolas (catálogo mobile)
    │       ├── units/          # CRUD de unidades
    │       ├── courses/        # CRUD de cursos (catálogo mobile)
    │       ├── class-groups/   # CRUD de turmas (por curso)
    │       ├── academic-periods/ # CRUD de períodos da turma
    │       ├── academic-structure/ # Consulta relacional com filtros encadeados
    │       ├── enrollment-intents/ # Lista e detalhe de intenções de matrícula
    │       ├── enrollments/    # Lista e detalhe operacional/financeiro das matrículas
    │       ├── accommodation-operations/ # Fechamento/faturamento de acomodação por matrícula
    │       ├── commission-config/ # Configuração de comissão por instituição/curso
    │       ├── financial-overview/ # Visão financeira inicial das comissões geradas
    │       ├── accommodations/ # Lista integrada com dados reais
    │       ├── places/         # Lista integrada com dados reais
    │       ├── students/       # Lista de usuários STUDENT
    │       ├── profiles/       # Lista, criação e edição de perfis
    │       └── permissions/    # Catálogo de permissões
    ├── components/
    │   ├── layout/             # Sidebar, Header, NavItem (client), LogoutButton
    │   ├── ui/                 # Componentes genéricos (ver abaixo)
    │   └── filters/            # FilterBar
    ├── lib/
    │   ├── session.ts          # getSession() — lê e verifica cookie
    │   ├── permissions.ts      # hasPermission(), ADMIN_ROLES
    │   ├── authorization.ts    # requirePermission() e assertActionPermission()
    │   ├── api.ts              # apiFetch<T>() — unwrap envelope da API
    │   └── cn.ts               # clsx + tailwind-merge
    ├── types/
    │   ├── auth.types.ts       # Session, Role, AdminUser, AdminProfile, Permission
    │   └── permissions.types.ts # Tipos de permissões de navegação
    └── config/navigation.ts    # Itens do menu com permissão associada
```

---

## Componentes Genéricos

| Componente | Uso |
|-----------|-----|
| `DataTable<T>` | Tabela tipada com colunas `Column<T>[]`, loading/empty state, `getRowHref` |
| `FilterBar` | Barra de busca + selects dinâmicos configuráveis |
| `PageHeader` | Título + descrição + slot de ações (children) |
| `LoadingState` | Skeleton rows animados |
| `EmptyState` | Estado vazio com ícone, texto e ação opcional |
| `ErrorState` | Estado de erro com botão de retry |
| `Button` | 5 variants: `primary`, `secondary`, `danger`, `ghost`, `outline` · 3 sizes · `isLoading` |
| `Input` | Com `label`, `error` e `hint` integrados |
| `Badge` | 5 variants de cor |

---

## Dashboard

Busca contagens reais em paralelo via `Promise.all` nos endpoints `/school`, `/course`, `/accommodation`, `/place`. Exibe stat cards + grid de módulos futuros.

## Módulos Administrativos Novos

- `/admin-users`:
  Lista usuários `ADMIN` e `SUPER_ADMIN`.
- `/admin-users/new`:
  Criação de usuário admin com role e perfis.
- `/admin-users/[id]`:
  Edição de dados, role e perfis; também permite exclusão do usuário.
- `/profiles`:
  Listagem de perfis com contagem de permissões/usuários.
- `/profiles/new`:
  Criação de perfil + seleção inicial de permissões.
- `/profiles/[id]`:
  Edição de label/descrição + substituição de permissões (`PUT /admin-profile/:id/permissions`).
- `/permissions`:
  Catálogo somente leitura de permissões (`GET /permission`).

## Cadastro Estrutural (Integração Real)

- `/institutions`, `/institutions/new`, `/institutions/[id]`
  CRUD real em `/institution`.
- `/schools`, `/schools/new`, `/schools/[id]`
  CRUD real em `/school` (catálogo acadêmico consumido no mobile).
- `/units`, `/units/new`, `/units/[id]`
  CRUD real em `/unit` (com vínculo de escola).
- `/courses`, `/courses/new`, `/courses/[id]`
  CRUD real em `/course` (com vínculo obrigatório de unidade e escola, preservando contrato do mobile).
- `/class-groups`, `/class-groups/new`, `/class-groups/[id]`
  CRUD real em `/class-group` (com vínculo obrigatório de curso).
- `/academic-periods`, `/academic-periods/new`, `/academic-periods/[id]`
  CRUD real em `/academic-period` (cada período pertence a uma turma).
- `/academic-structure`
  Consulta operacional da cadeia acadêmica com filtros dependentes:
  instituição -> escola -> unidade -> curso -> turma.
  Exibe de forma consolidada escolas, unidades, cursos, turmas e períodos relacionados.
- `/enrollment-intents`, `/enrollment-intents/[id]`
  Lista e detalhe das intenções de matrícula com filtros por status do aluno, instituição e escola.
- `/enrollment-intents/[id]/edit`
  Página dedicada para alterar curso/turma/período e acomodação da intenção pendente.
- `/enrollment-intents/[id]/confirm`
  Página dedicada para confirmar matrícula (conversão da intenção), podendo selecionar/trocar/remover acomodação antes da efetivação.
- `/students/[id]`
  Jornada acadêmica do aluno com intenção pendente, matrícula ativa e histórico completo.
- `/enrollments`, `/enrollments/[id]`
  Lista e detalhe de matrículas com workflow operacional (`application_started`, `documents_pending`, `under_review`, `approved`, `enrolled`, `rejected`, `cancelled`), pricing de pacote (matrícula + acomodação), comissão, documentos, mensagens e timeline.
- `/accommodation-operations`
  Operação dedicada para fechamento de acomodação e faturamento no contexto da matrícula (status da acomodação + acesso rápido ao detalhe da matrícula).
- `/commission-config`
  Configuração de comissão por instituição (global) e por curso (override), com nomes legíveis de domínio (instituição/escola/curso).
- `/financial-overview`
  Visão financeira operacional com matrícula, aluno, instituição, escola, curso, valor de matrícula e comissão.
- `/accommodations`, `/places`, `/students`
  Telas conectadas ao backend real para evitar módulos “soltos” no menu.
- `/accommodations` (evolução de upsell contextual)
  Catálogo independente + configuração de recomendação por escola (recomendada, prioridade e badge), com visualização de uso em intenções e matrículas.

Fluxo único de dados:
- Admin atualiza dados reais.
- Backend central persiste e expõe.
- Mobile permanece consumindo o mesmo backend (sem fonte paralela).

Status da integração mobile (escopo acadêmico já coberto):
- `school`: mobile consome `GET /school` real.
- `course`: mobile consome `GET /course` e `GET /course/:id` reais.
- Normalização de contrato (`snake_case` -> `camelCase`) ocorre no mobile em `services/api/mappers/catalogMappers.ts`, sem duplicar domínio no backend.
- Step A monetização: mobile cria intenção real em `POST /enrollment-intents` com seleção de curso/turma/período e o `studentStatus` volta atualizado pela API.
- Step B monetização: confirmação via SaaS usa `POST /enrollments/from-intent/:intentId`, converte intenção para matrícula real e inicia workflow operacional.
- O mobile reflete matrícula ativa via `GET /enrollments/active?studentId=...`.
- O mobile usa `GET /enrollments/journey/:studentId` como índice da jornada e abre contexto completo por matrícula em tela dedicada (`GET /enrollments/:id`, `/enrollments/:id/timeline`, `/enrollment-documents`, `/enrollment-messages`).
- Ao iniciar nova intenção, o mobile verifica e exibe em tela se já existe intenção pendente ou matrícula ativa, sem uso de alert nesse fluxo.
- O mobile exibe na jornada: timeline (`GET /enrollments/:id/timeline`), documentos (`GET/POST /enrollment-documents`) e mensagens (`GET/POST /enrollment-messages`) com dados reais do backend.
- O mobile exibe indicador de mensagens não lidas via `GET /enrollment-messages/unread-count?studentId=...` e sincroniza leitura com `PATCH /enrollment-messages/read`.
- Upload de documentos no mobile fica visível apenas em status compatível com etapa documental (`documents_pending`, `under_review`).
- Upsell de acomodação da matrícula usa dados reais com contexto da escola (`GET /accommodation/upsell/enrollment/:enrollmentId`), mostrando apenas acomodações recomendadas para a escola da matrícula com badge configurado no SaaS.
- No fluxo de intenção/matrícula:
  - mobile consome `GET /enrollment-intents/recommended-accommodations?courseId=...` para mostrar acomodação elegível no momento de iniciar a intenção;
  - intenção aceita seleção/troca/remoção de acomodação via `PATCH /enrollment-intents/:id/accommodation`;
  - matrícula aceita seleção/troca/remoção de acomodação via `PATCH /enrollments/:id/accommodation`;
  - financeiro consolidado do pacote é exposto por `GET /enrollments/:id/package-summary` e refletido no SaaS/mobile.
  - workflow de acomodação no contexto da matrícula é atualizado por `PATCH /enrollments/:id/accommodation-workflow`;
  - após status `closed`, a acomodação não pode mais ser trocada/removida;
  - chat da acomodação usa o mesmo endpoint de mensagens com canal dedicado (`channel=accommodation`), mantendo fonte única no backend.

## Sidebar (Ordem de Operação)

- Dashboard
- Configuração Acadêmica
  Instituições → Escolas (Catálogo App) → Unidades → Cursos → Turmas → Períodos da Turma → Estrutura Acadêmica
- Estrutura Física
  Acomodações → Lugares
- Pessoas e Acesso
  Alunos → Intenções de Matrícula → Matrículas → Comissões → Financeiro → Usuários Admin → Perfis → Permissões

Regras de exposição no menu:
- Itens dependentes só aparecem quando pré-requisitos existem (ex.: Turmas exige Curso; Períodos exige Turma).

## Regras de Autorização na UI

- Rotas server-side críticas usam `requirePermission(permission)`:
  `users.read`, `users.write`, `roles.read`, `roles.write`, `permissions.read`, `structure.read`, `structure.write`.
- Server actions sensíveis usam `assertActionPermission(permission)`:
  criação/edição/exclusão de usuários, perfis e cadastro estrutural.
- A sidebar continua filtrando navegação por permissão, mas agora não é o único gate.

---

## Padrões

| Padrão | Onde |
|--------|------|
| Server Actions + `useActionState` | Formulário de login |
| Server Components | Sidebar, Header, Dashboard, páginas de listagem |
| Client Components | NavItem (`usePathname`), LoginForm, LogoutButton |
| HTTP-only Cookie | Sessão do admin |
| Edge Middleware + `jose` | Proteção de rotas |
