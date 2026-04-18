.PHONY: help up down build logs api mobile admin install setup seed db-push

help: ## Mostra os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ─── Docker ────────────────────────────────────────────────────────────────────

up: ## Sobe postgres + API via Docker (com seed automático)
	docker compose up -d --build

down: ## Para e remove os containers
	docker compose down

build: ## Rebuilda a imagem da API
	docker compose build api

logs: ## Mostra logs da API em tempo real
	docker compose logs -f api

# ─── Desenvolvimento local ─────────────────────────────────────────────────────

api: ## Inicia a API em modo watch (dev local)
	cd apps/api && npx prisma generate && npm run start:dev

mobile: ## Inicia o Expo (mobile)
	cd apps/mobile && npx expo start

admin: ## Inicia o painel admin Next.js (porta 3001)
	cd apps/admin && npm run dev

# ─── Banco de dados ────────────────────────────────────────────────────────────

db-push: ## Aplica o schema no banco sem migrations
	cd apps/api && npx prisma db push

seed: ## Executa o seed no banco
	cd apps/api && npm run db:seed

# ─── Setup inicial ─────────────────────────────────────────────────────────────

install: ## Instala todas as dependências
	npm install

setup: install ## Setup completo: deps + docker + schema + seed (api + admin)
	@echo "\n>>> Subindo banco de dados..."
	docker compose up -d postgres
	@echo ">>> Aguardando postgres ficar pronto..."
	@until docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
	@echo ">>> Aplicando schema..."
	cd apps/api && npx prisma db push
	@echo ">>> Gerando Prisma Client..."
	cd apps/api && npx prisma generate
	@echo ">>> Populando banco..."
	cd apps/api && npm run db:seed
	@echo "\n✓ Setup concluído!"
	@echo "  → make api    para iniciar o backend"
	@echo "  → make mobile para iniciar o mobile"
