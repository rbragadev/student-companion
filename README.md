# 🎓 Student Companion

Plataforma para estudantes internacionais encontrarem acomodações, cursos e lugares em suas cidades de destino.

## 📋 Estrutura do Projeto

```
student-companion/
├── apps/
│   ├── api/          # Backend NestJS + Prisma
│   └── mobile/       # App React Native + Expo
├── infra/
│   └── docker/       # Docker Compose (PostgreSQL)
└── docs/             # Documentação técnica
```

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+
- Docker & Docker Compose
- npm

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir o banco de dados

```bash
cd infra/docker
docker-compose up -d
```

### 3. Configurar a API

```bash
cd apps/api

# Rodar migrations
npx prisma migrate dev

# (Opcional) Abrir Prisma Studio
npx prisma studio
```

### 4. Iniciar os serviços

#### Backend (API)
```bash
# Da raiz do projeto
npm run dev:api

# Ou direto da pasta apps/api
cd apps/api
npm run start:dev
```

API rodará em: `http://localhost:3000`

#### Mobile (Expo)
```bash
# Da raiz do projeto
npm run dev:mobile

# Ou direto da pasta apps/mobile
cd apps/mobile
npx expo start
```

## 📚 Documentação

Toda documentação técnica está em [`/docs`](./docs/):

- **[Sistema de Recomendação](./docs/RECOMMENDATION_SYSTEM.md)** - Arquitetura SOLID, regras de scoring, estratégias
- **[API Backend](./docs/API.md)** - Endpoints, estrutura, tecnologias
- **[Mobile App](./docs/MOBILE.md)** - Design system, componentes, navegação
- **[TODO](./docs/TODO.md)** - Roadmap de melhorias e features

## 🛠 Tecnologias

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- TypeScript

### Mobile
- React Native
- Expo
- NativeWind (Tailwind CSS)
- TypeScript

## 📝 Scripts Úteis

```bash
# Rodar testes
npm test

# Gerar Prisma Client
cd apps/api
npx prisma generate

# Criar nova migration
cd apps/api
npx prisma migrate dev --name nome_da_migration

# Limpar e rebuild
npm run clean
npm install
```

## 🤝 Contribuindo

1. Leia a documentação em [`/docs`](./docs/)
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

## 📄 Licença

MIT