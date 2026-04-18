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
    │       ├── units/          # CRUD de unidades
    │       ├── academic-periods/ # CRUD de períodos letivos
    │       ├── class-groups/   # CRUD de turmas
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
| `DataTable<T>` | Tabela tipada com colunas `Column<T>[]`, loading/empty state, `onRowClick` |
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
- `/units`, `/units/new`, `/units/[id]`
  CRUD real em `/unit` (com vínculo de instituição).
- `/academic-periods`, `/academic-periods/new`, `/academic-periods/[id]`
  CRUD real em `/academic-period`.
- `/class-groups`, `/class-groups/new`, `/class-groups/[id]`
  CRUD real em `/class-group` (com vínculo de unidade + período).

Fluxo único de dados:
- Admin atualiza dados reais.
- Backend central persiste e expõe.
- Mobile permanece consumindo o mesmo backend (sem fonte paralela).

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
