# TODO - Student Companion

Tarefas pendentes por área. Atualizar conforme o trabalho avança.

---

## Admin — Módulos CRUD

Todos os módulos abaixo seguem o mesmo padrão: listagem com `DataTable` + `FilterBar`, página de detalhe/formulário, Server Actions para create/update/delete.

- [ ] **Escolas** — listagem + criar + editar + detalhes com cursos vinculados
- [ ] **Cursos** — listagem + criar + editar + filtro por escola
- [ ] **Acomodações** — listagem + criar + editar + filtro por tipo
- [ ] **Lugares** — listagem + criar + editar + filtro por categoria
- [ ] **Alunos** — listagem de usuários `STUDENT` + visualização de preferências (somente leitura)
- [ ] **Avaliações** — listagem de reviews + moderação (SUPER_ADMIN)

---

## API — Melhorias

- [ ] Implementar cálculo Haversine real em `AccommodationDistanceRule`
- [ ] Paginação nos endpoints de listagem (`/school`, `/accommodation`, etc.)
- [ ] Endpoint `POST /recommendation/:id/feedback` — feedback do usuário
- [ ] Endpoint `GET /recommendation/:id/explain` — breakdown de scores por regra
- [ ] Rate limiting por usuário (Guard NestJS + Redis)
- [ ] Cache Redis para recomendações (TTL 10min, invalidar ao atualizar preferências)

---

## Mobile — Funcionalidades

- [ ] **CopilotScreen** — integrar com API real (atualmente mock)
- [ ] Formulário de avaliação — criar review dentro de AccommodationDetailScreen, CourseDetailScreen, PlaceDetailScreen
- [ ] Favoritos — salvar itens localmente ou via API
- [ ] Notificações push (Expo Notifications)
- [ ] Modo offline — cache local com TanStack Query `persistQueryClient`

---

## Schema — Campos Pendentes

- [ ] `Accommodation.distanceToSchool` (Decimal, km) — necessário para `AccommodationDistanceRule` real
- [ ] `School.isAccredited` (Boolean) — necessário para `SchoolAccreditationRule`
- [ ] `School.programTypes` (String[]) — necessário para `SchoolProgramsVarietyRule`
- [ ] Tabela `user_interactions` — base para ML/personalização futura

---

## Qualidade

- [ ] Testes unitários para regras de scoring (accommodation, course, place, school)
- [ ] Testes de integração para endpoints de recomendação
- [ ] Testes E2E do admin com Playwright
