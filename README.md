# Student Companion

Plataforma para estudantes internacionais encontrarem acomodações, cursos e lugares em suas cidades de destino.

## Estrutura do Projeto

```
student-companion/
├── apps/
│   ├── api/        # Backend NestJS + Prisma + PostgreSQL
│   └── mobile/     # App React Native + Expo
├── docs/           # Documentação técnica
├── docker-compose.yml
└── Makefile

## Modelo de vendas (admin)

- Curso e acomodação são **itens de venda independentes**.
- A **matrícula** é o contexto operacional da operação do aluno.
- Separação operacional foi adotada na navegação:
  - `Curso` (item de curso)
  - `Pacote` (curso + acomodação em um mesmo bundle comercial)
  - `Acomodação` (item de acomodação)
- A **matrícula** pode referenciar curso e/ou acomodação, mas ela não é o item financeiro.
- A operação financeira é rastreada por `Order`:
  - `course`
  - `accommodation`
  - `package`
- A navegação "Operação" permite criar operação por contexto:
  - `Curso`: gerar item financeiro independente (`order.type = course`) com curso e janela.
  - `Pacote`: gerar a matrícula em contexto de pacote (curso + acomodação vinculados para o mesmo estudante), com rastreamento financeiro separado por item.
  - `Acomodação`: gerar item financeiro independente (`order.type = accommodation`) com janela própria.
- A **matrícula** pode referenciar curso e/ou acomodação, e isso organiza a operação comercial sem transformar matrícula em item financeiro.

### Fluxo financeiro atual

- Criação de matrícula não gera invoice/order automaticamente.
- Gerar ordem/item de venda pode ser feito manualmente pela operação correspondente (`Curso`, `Pacote` ou `Acomodação`) ou pela tela da matrícula.
- Após gerar a ordem, gerar invoice.
- Registrar o pagamento via checkout/fake apenas quando estiver no fluxo pretendido.

## Diretrizes de nomenclatura

- Curso = item principal de venda.
- Acomodação = item complementar de venda.
- Vínculo = curso + acomodação quando comercializados juntos.
```

## Pré-requisitos

- Node.js 18+
- Docker & Docker Compose
- npm

---

## Setup rápido (primeira vez)

```bash
make setup
```

Esse comando faz tudo: instala dependências, sobe o banco, aplica o schema e popula com dados de teste.

---

## Rodando em desenvolvimento

Após o setup, em dois terminais separados:

```bash
# Terminal 1 — backend
make api

# Terminal 2 — mobile
make mobile
```

A API sobe em `http://localhost:3000`.  
O Expo abre o QR code para rodar no simulador ou dispositivo físico.

---

## Rodando via Docker (API + banco juntos)

```bash
make up       # sobe postgres + API (seed automático na primeira vez)
make logs     # acompanha os logs da API
make down     # para tudo
```

---

## Usuários de teste

Senha padrão para todos: **`senha123`**

| Nome | E-mail | Perfil |
|------|--------|--------|
| Raphael Braga | `raphael@studentcompanion.dev` | Vancouver · study · intermediate |
| Emily Chen | `emily@studentcompanion.dev` | Vancouver · college · advanced |
| Lucas Costa | `lucas@studentcompanion.dev` | Toronto · language exchange · beginner |

No simulador, a tela de login exibe automaticamente as credenciais do Raphael.

---

## Todos os comandos disponíveis

```bash
make help
```

| Comando | O que faz |
|---------|-----------|
| `make setup` | Setup completo (instalar + banco + schema + seed) |
| `make api` | Inicia a API em modo watch (dev local) |
| `make mobile` | Inicia o Expo |
| `make up` | Sobe postgres + API via Docker |
| `make down` | Para os containers |
| `make build` | Rebuilda a imagem Docker da API |
| `make logs` | Logs da API em tempo real |
| `make db-push` | Aplica schema no banco sem migrations |
| `make seed` | Executa o seed manualmente |
| `make install` | Instala todas as dependências |

---

## Configuração manual (sem Makefile)

```bash
# 1. Instalar dependências
npm install

# 2. Banco de dados
docker compose up -d postgres

# 3. Schema + seed
cd apps/api
npx prisma db push
npm run db:seed

# 4. API
npm run start:dev

# 5. Mobile (outro terminal)
cd apps/mobile
npx expo start
```

---

## Documentação técnica

- [Sistema de Recomendação](./docs/RECOMMENDATION_SYSTEM.md)
- [API Backend](./docs/API.md)
- [Mobile App](./docs/MOBILE.md)
- [TODO / Roadmap](./docs/TODO.md)

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Backend | NestJS 11, Prisma 7, PostgreSQL 16, JWT |
| Mobile | React Native 0.81, Expo SDK 54, NativeWind, TanStack Query |
| Infra | Docker, Docker Compose |
