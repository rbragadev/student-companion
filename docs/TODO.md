# 📋 TODO - Student Companion

## 🔴 CRÍTICO - Integração Mobile com API

### Migração Mock → API Real (apps/mobile)

#### 1. Atualizar Interface `Recommendation` (mockData.ts)
- [ ] Adicionar campo `subtitle: string` - Gerado pela strategy (ex: "Vancouver • $950/month")
- [ ] Adicionar campo `score: number` - Score de recomendação (0-100)
- [ ] Alterar `badge?: string` para `badge: string` - Sempre presente (pode ser vazio)
- [ ] Alterar `image` para `imageUrl: string` - Nome usado pela API
- [ ] Adicionar campo `data: any` - Dados completos da entidade (Accommodation | Course | Place | School)
- [ ] Alterar type union para incluir `'place' | 'school'`
- [ ] **REMOVER campos descontinuados:**
  - ❌ `location?: string` → usar `data.location` ou extrair de `subtitle`
  - ❌ `price?: string` → calcular de `data.priceInCents`
  - ❌ `priceUnit?: string` → usar `data.priceUnit`
  - ❌ `rating?: number` → usar `data.rating`
  - ❌ `ratingCount?: number` → usar `data.ratingCount`
  - ❌ `features?: string[]` → usar `data.amenities` ou `data.features`
  - ❌ `distance?: string` → calcular de `data.distanceToSchool`
  - ❌ `isTopTrip?: boolean` → usar `data.isTopTrip`
  - ❌ `isPartner?: boolean` → usar `data.isPartner`
  - ❌ `accommodationType?` → usar `data.accommodationType`
  - ❌ `areaHint?: string` → usar `data.areaHint`

#### 2. Criar Interface `ApiResponse<T>` (mockData.ts ou types/)
```typescript
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}
```

#### 3. Atualizar Mock Data (mockData.ts)
- [ ] Alterar `getRecommendations()` para retornar formato da API:
  ```typescript
  {
    id: string,
    type: 'accommodation' | 'course' | 'place' | 'school',
    title: string,
    subtitle: string,  // Novo
    score: number,      // Novo
    badge: string,
    imageUrl: string,   // Renomeado
    data: {...}         // Novo
  }
  ```

#### 4. Atualizar Componentes que usam Recommendation
- [ ] **RecommendationCard.tsx** - Adaptar para usar `imageUrl` e extrair dados de `data.*`
- [ ] **AccommodationListCard.tsx** - Usar `data.priceInCents`, `data.rating`, etc
- [ ] **CourseCard.tsx** - Usar `data.school.name`, `data.weeklyHours`, etc
- [ ] **PlaceCard.tsx** - Usar `data.category`, `data.address`, etc
- [ ] **TopTripCard.tsx** - Usar `data.isTopTrip`, `data.goodFor`, etc
- [ ] **HomeHeader.tsx** - Se usa Recommendation, atualizar

#### 5. Criar Service de API Real (services/api/)
- [ ] Criar `recommendationApi.ts`:
  ```typescript
  export const recommendationApi = {
    getRecommendations: async (
      userId: string,
      type: 'accommodation' | 'course' | 'place' | 'school',
      limit?: number
    ) => {
      const { data } = await apiClient.get<ApiResponse<Recommendation[]>>(
        `/recommendation/${userId}`,
        { params: { type, limit } }
      );
      return data.data; // Extrai o array de dentro de "data"
    },
    
    getMixedRecommendations: async (userId: string, limit?: number) => {
      const { data } = await apiClient.get<ApiResponse<Recommendation[]>>(
        `/recommendation/${userId}/mixed`,
        { params: { limit } }
      );
      return data.data;
    },
  };
  ```

#### 6. Criar React Query Hook (hooks/api/)
- [ ] Criar `useRecommendations.ts`:
  ```typescript
  export const useRecommendations = (
    userId: string,
    type: 'accommodation' | 'course' | 'place' | 'school',
    limit?: number
  ) => {
    return useQuery({
      queryKey: ['recommendations', userId, type, limit],
      queryFn: () => recommendationApi.getRecommendations(userId, type, limit),
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  };
  
  export const useMixedRecommendations = (userId: string, limit?: number) => {
    return useQuery({
      queryKey: ['recommendations', userId, 'mixed', limit],
      queryFn: () => recommendationApi.getMixedRecommendations(userId, limit),
      staleTime: 5 * 60 * 1000,
    });
  };
  ```

#### 7. Migrar Telas
- [ ] **HomeScreen.tsx** - Trocar `getRecommendations()` por `useMixedRecommendations(userId, 10)`
- [ ] **CourseScreen.tsx** - Usar `useRecommendations(userId, 'course', 20)`
- [ ] **AccommodationScreen.tsx** - Usar `useRecommendations(userId, 'accommodation', 20)`
- [ ] **PlacesScreen.tsx** - Usar `useRecommendations(userId, 'place', 20)`

#### 8. Testes de Integração
- [ ] Testar com API local rodando
- [ ] Verificar estados de loading/error
- [ ] Validar formatação de preços (cents → display)
- [ ] Validar formatação de distância (km → display)
- [ ] Verificar badges e imagens

---

## 🔴 CRÍTICO - Database Schema (Prisma)

### School Model
- [ ] Adicionar campo `rating` (Decimal, 3,2) - Score baseado em avaliações
- [ ] Adicionar campo `ratingCount` (Int) - Número de avaliações
- [ ] Adicionar campo `badges` (String[]) - Múltiplos badges ["Partner", "Accredited", "Top Choice"]
- [ ] Adicionar campo `isAccredited` (Boolean) - Escola oficialmente acreditada
- [ ] Adicionar campo `programTypes` (String[]) - Tipos de programas ["General English", "IELTS", "Business"]
- [ ] Adicionar campo `distanceToCity` (Decimal) - Distância do centro em km
- [ ] Adicionar índices: `@@index([rating])`, `@@index([isPartner])`, `@@index([isAccredited])`

### Course Model
- [ ] Alterar campo `badge` de `String?` para `badges` (String[]) - Múltiplos badges
- [ ] Adicionar índices: `@@index([priceInCents])`, `@@index([targetAudience])`

### Accommodation Model
- [ ] Adicionar campo `distanceToSchool` (Decimal, 5,2) - Distância em km até a escola mais próxima
- [ ] Adicionar campo `badges` (String[]) - ["Top Trip", "Student Favorite", "Near Campus"]
- [ ] Adicionar índice: `@@index([distanceToSchool])`

### Place Model
- [ ] Adicionar campo `badges` (String[]) - ["Student Favorite", "Deal", "Top Rated"]

### UserPreferences Model
- [ ] Adicionar campo `preferredCities` (String[]) - Lista de cidades de interesse
- [ ] Documentar unidade de `maxDistanceToSchool` - deve ser em metros

---

## 🟡 IMPORTANTE - Regras de Scoring

### School Rules
- [ ] Atualizar `SchoolRatingRule` para usar campo `rating` do banco
- [ ] Atualizar `SchoolProgramsVarietyRule` para usar campo `programTypes`
- [ ] Atualizar `SchoolAccreditationRule` para usar campo `isAccredited`
- [ ] Implementar cálculo de distância em `SchoolLocationRule`

### Accommodation Rules
- [ ] Implementar lógica real de distância em `AccommodationDistanceRule` (Haversine formula)
- [ ] Usar campo `distanceToSchool` quando disponível
- [ ] Adicionar cache de cálculos de distância

### Course Rules
- [ ] Validar se `targetAudience` usa os mesmos valores que `englishLevel`
- [ ] Ajustar pesos das regras baseado em testes com usuários reais

### Place Rules
- [ ] Adicionar regra de distância para places próximos ao usuário
- [ ] Considerar horários de funcionamento na elegibilidade

---

## 🟢 MELHORIAS - Features

### Cache
- [ ] Implementar cache Redis para recomendações
- [ ] Cache key: `recommendations:{userId}:{type}:{limit}`
- [ ] TTL: 10 minutos
- [ ] Invalidar cache ao alterar preferências do usuário

### Logging & Debugging
- [ ] Adicionar logger detalhado com breakdown de scores por regra
- [ ] Log de tempo de execução de cada estratégia
- [ ] Métricas de performance (tempo de query, número de entidades avaliadas)

### Testes
- [ ] Testes unitários para todas as regras de scoring
- [ ] Testes de integração para cada estratégia
- [ ] Testes e2e para endpoints de recomendação
- [ ] Mock data factory para testes

### Analytics & Machine Learning
- [ ] Criar tabela `user_interactions` para rastrear comportamento
  ```sql
  - user_id, item_type, item_id, action (view/favorite/share/inquiry)
  - duration_seconds, created_at
  ```
- [ ] Implementar regra `UserInterestRule` baseada em histórico
- [ ] Filtro para itens já rejeitados pelo usuário
- [ ] A/B testing de diferentes pesos de regras

### API & Endpoints
- [ ] Adicionar paginação aos endpoints de recomendação
- [ ] Endpoint para feedback: `POST /recommendation/:id/feedback`
- [ ] Endpoint para explicação: `GET /recommendation/:id/explain` (mostra breakdown dos scores)
- [ ] Rate limiting por usuário

### Performance
- [ ] Otimizar queries com `select` específico de campos necessários
- [ ] Parallel execution de regras independentes
- [ ] Lazy loading de relações pesadas
- [ ] Considerar pre-calcular scores em background job

### User Experience
- [ ] Personalização de pesos por perfil de usuário
- [ ] "More like this" - recomendações similares a um item específico
- [ ] Diversificação de resultados (não mostrar só do mesmo tipo)
- [ ] Trending items (baseado em views/favorites recentes)

### Documentação
- [ ] Adicionar JSDoc em todas as regras explicando lógica
- [ ] Documento de decisões arquiteturais (ADR)
- [ ] Guia de como adicionar novas regras
- [ ] Diagramas de fluxo do sistema de recomendação
- [ ] Benchmark de performance

---

## 🎯 Roadmap - Sprints

### Sprint 1 - Database (Semana 1-2)
1. Criar migration com campos faltantes no Prisma
2. Popular campos novos com dados de teste
3. Atualizar regras para usar novos campos
4. Testes básicos de integração

**Resultado esperado:** Sistema de recomendação 100% funcional com todos os campos

### Sprint 2 - Performance (Semana 3-4)
1. Implementar cache Redis
2. Adicionar logging e métricas
3. Otimizar queries do Prisma
4. Benchmark de performance

**Resultado esperado:** API respondendo em <200ms para recomendações

### Sprint 3 - Testes & Qualidade (Semana 5-6)
1. Escrever testes unitários para todas as regras
2. Testes de integração para estratégias
3. Testes e2e para endpoints
4. Documentação completa com exemplos

**Resultado esperado:** Cobertura de testes >80%

### Sprint 4 - ML & Analytics (Semana 7-8)
1. Criar tabela de interações do usuário
2. Implementar tracking de comportamento
3. Primeira versão de personalização por histórico
4. Dashboard de métricas

**Resultado esperado:** Sistema aprende com comportamento do usuário
