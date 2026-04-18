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

Senha: `senha123`

---

## Roles e Permissões

`ROLE_PERMISSIONS` em `src/types/permissions.types.ts`:

| Role | Acesso |
|------|--------|
| `STUDENT` | Bloqueado |
| `ADMIN` | Dashboard + CRUD escolas, cursos, acomodações, lugares · visualização de alunos |
| `SUPER_ADMIN` | Tudo (`*`) |

`hasPermission(role, permission)` é usado na sidebar para filtrar itens de navegação.

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
    │       └── dashboard/      # Dashboard com stats reais da API
    ├── components/
    │   ├── layout/             # Sidebar, Header, NavItem (client), LogoutButton
    │   ├── ui/                 # Componentes genéricos (ver abaixo)
    │   └── filters/            # FilterBar
    ├── lib/
    │   ├── session.ts          # getSession() — lê e verifica cookie
    │   ├── permissions.ts      # hasPermission(), ADMIN_ROLES
    │   ├── api.ts              # apiFetch<T>() — unwrap envelope da API
    │   └── cn.ts               # clsx + tailwind-merge
    ├── types/
    │   ├── auth.types.ts       # Session, Role
    │   └── permissions.types.ts # Permission, ROLE_PERMISSIONS
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

---

## Padrões

| Padrão | Onde |
|--------|------|
| Server Actions + `useActionState` | Formulário de login |
| Server Components | Sidebar, Header, Dashboard, páginas de listagem |
| Client Components | NavItem (`usePathname`), LoginForm, LogoutButton |
| HTTP-only Cookie | Sessão do admin |
| Edge Middleware + `jose` | Proteção de rotas |
