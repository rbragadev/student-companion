# 🎯 Sistema de Recomendação - Arquitetura SOLID

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Fluxo de Execução](#fluxo-de-execução)
3. [Arquitetura](#arquitetura)
4. [Implementação Completa](#implementação-completa)
5. [Como Adicionar Novas Regras](#como-adicionar-novas-regras)
6. [Próximos Passos](#próximos-passos)

---

## 🎨 Visão Geral

Este sistema de recomendação foi construído seguindo os princípios **SOLID** e utiliza os padrões:
- **Strategy Pattern**: Para separar algoritmos de recomendação por tipo (Accommodation, Course, Place)
- **Rule Pattern**: Para modularizar regras de scoring independentes e reutilizáveis
- **Factory Pattern**: Para criação dinâmica de strategies baseado no tipo de recomendação

### Benefícios da Arquitetura

✅ **Single Responsibility**: Cada classe tem uma única responsabilidade
✅ **Open/Closed**: Adicione novas regras sem modificar código existente
✅ **Extensível**: Adicione novas condições facilmente
✅ **Testável**: Cada regra pode ser testada isoladamente
✅ **Manutenível**: Código organizado e fácil de entender

---

## 🔄 Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Cliente faz requisição                                       │
│    GET /recommendation/{userId}?type=accommodation&limit=5      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. RecommendationController recebe a requisição                 │
│    - Valida parâmetros (DTO)                                   │
│    - Encaminha para RecommendationService                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. RecommendationService                                        │
│    a) Busca preferências do usuário no banco                   │
│    b) Obtém Strategy apropriada via StrategyFactory            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Strategy.fetchEntities()                                     │
│    - AccommodationStrategy → busca accommodations               │
│    - CourseStrategy → busca courses                            │
│    - PlaceStrategy → busca places                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Para cada entidade:                                          │
│                                                                 │
│    a) Verifica elegibilidade (Rule.isEligible())               │
│       ├─ BudgetRule: preço dentro do orçamento?                │
│       ├─ DistanceRule: distância aceitável?                    │
│       └─ Se FALHAR em qualquer regra → PULA entidade           │
│                                                                 │
│    b) Se elegível, calcula score (Rule.calculate())            │
│       ├─ BudgetRule (40%): quão bom é o preço?                 │
│       ├─ RatingRule (25%): rating 0-5 → 0-100                  │
│       ├─ DistanceRule (15%): proximidade da escola             │
│       ├─ TypePreferenceRule (10%): tipo preferido?             │
│       └─ BonusRule (10%): parceiro/top trip?                   │
│                                                                 │
│    c) Combina scores ponderados                                │
│       finalScore = Σ(ruleScore × weight) / Σ(weights)          │
│                                                                 │
│    d) Mapeia para objeto Recommendation                        │
│       Strategy.mapToRecommendation(entity, score)              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Ordena por score (maior primeiro) e limita                  │
│    - sort((a,b) => b.score - a.score)                          │
│    - slice(0, limit)                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Retorna JSON com recomendações                              │
│    [                                                            │
│      {                                                          │
│        id, type, title, subtitle,                              │
│        score: 87.5,                                             │
│        badge, imageUrl, data                                    │
│      }                                                          │
│    ]                                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Exemplo de Cálculo de Score

Para uma **Accommodation** com:
- Preço: $850/week (budget: $500-$1000)
- Rating: 4.5/5
- Distância: 3km da escola (max: 10km)
- Tipo: Studio (preferido)
- isPartner: true

```
Budget Score     = 95 × 0.40 = 38.0
Rating Score     = 90 × 0.25 = 22.5
Distance Score   = 70 × 0.15 = 10.5
Type Score       = 100 × 0.10 = 10.0
Bonus Score      = 50 × 0.10 = 5.0
                           ─────
Final Score                = 86.0 ⭐
```

---

## 🏗️ Arquitetura

```
src/recommendation/
├── dto/
│   └── get-recommendations.dto.ts          # DTOs de validação
│
├── interfaces/
│   ├── scoring-rule.interface.ts           # Interface para regras
│   └── recommendation-strategy.interface.ts # Interface para strategies
│
├── rules/
│   ├── base-scoring.rule.ts                # Classe abstrata base
│   │
│   ├── accommodation/                       # Regras de Acomodação
│   │   ├── budget.rule.ts                  # Avalia budget (40%)
│   │   ├── rating.rule.ts                  # Avalia rating (25%)
│   │   ├── distance.rule.ts                # Avalia distância (15%)
│   │   ├── type-preference.rule.ts         # Avalia tipo preferido (10%)
│   │   └── bonus.rule.ts                   # Bônus parceiro/top (10%)
│   │
│   ├── course/                              # Regras de Curso
│   │   ├── budget.rule.ts                  # Avalia budget (40%)
│   │   ├── rating.rule.ts                  # Avalia rating (30%)
│   │   ├── english-level.rule.ts           # Avalia nível inglês (20%)
│   │   └── duration.rule.ts                # Avalia carga horária (10%)
│   │
│   └── place/                               # Regras de Lugar
│       ├── rating.rule.ts                  # Avalia rating (50%)
│       ├── student-favorite.rule.ts        # Favorito estudantes (30%)
│       └── deal.rule.ts                    # Tem promoção (20%)
│
├── strategies/
│   ├── accommodation.strategy.ts           # Strategy para Accommodations
│   ├── course.strategy.ts                  # Strategy para Courses
│   └── place.strategy.ts                   # Strategy para Places
│
├── factories/
│   └── strategy.factory.ts                 # Factory de Strategies
│
├── recommendation.service.ts               # Serviço principal
├── recommendation.controller.ts            # Controller REST
└── recommendation.module.ts                # Module NestJS
```

---

## 💻 Implementação Completa

### 1. DTOs

```typescript
// apps/api/src/recommendation/dto/get-recommendations.dto.ts
import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum RecommendationType {
  ACCOMMODATION = 'accommodation',
  COURSE = 'course',
  PLACE = 'place',
}

export class GetRecommendationsDto {
  @IsEnum(RecommendationType)
  type: RecommendationType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}
```

### 2. Interfaces

```typescript
// apps/api/src/recommendation/interfaces/scoring-rule.interface.ts
import { Accommodation, Course, Place, UserPreferences } from '@prisma/client';

/**
 * União de tipos de entidades suportadas para recomendação
 */
export type RecommendableEntity = Accommodation | Course | Place;

/**
 * Contexto genérico para cálculo de scoring
 * @template TEntity - Tipo da entidade sendo avaliada
 * @template TPreferences - Tipo das preferências do usuário
 */
export interface ScoringContext<
  TEntity extends RecommendableEntity = RecommendableEntity,
  TPreferences extends UserPreferences = UserPreferences,
> {
  entity: TEntity;
  userPreferences: TPreferences;
  additionalData?: Record<string, unknown>;
}

/**
 * Interface para regras de scoring
 * @template TEntity - Tipo da entidade sendo avaliada
 * @template TPreferences - Tipo das preferências do usuário
 */
export interface ScoringRule<
  TEntity extends RecommendableEntity = RecommendableEntity,
  TPreferences extends UserPreferences = UserPreferences,
> {
  /**
   * Nome da regra para debugging
   */
  readonly name: string;

  /**
   * Peso da regra no cálculo final (0-1)
   */
  readonly weight: number;

  /**
   * Calcula o score (0-100) baseado na regra
   */
  calculate(context: ScoringContext<TEntity, TPreferences>): number;

  /**
   * Verifica se a entidade é elegível segundo esta regra
   * Retorna true se passar, false se deve ser excluída
   */
  isEligible(context: ScoringContext<TEntity, TPreferences>): boolean;
}
```

```typescript
// apps/api/src/recommendation/interfaces/recommendation-strategy.interface.ts
import { UserPreferences } from '@prisma/client';
import { ScoringRule, RecommendableEntity } from './scoring-rule.interface';

export interface Recommendation {
  id: string;
  type: 'accommodation' | 'course' | 'place' | 'school';
  title: string;
  subtitle?: string;
  score: number;
  badge?: string;
  imageUrl: string;
  data: RecommendableEntity;
}

export interface RecommendationStrategy {
  /**
   * Busca as entidades do banco de dados
   */
  fetchEntities(userPreferences: UserPreferences): Promise<RecommendableEntity[]>;

  /**
   * Retorna as regras de scoring para este tipo
   */
  getScoringRules(): ScoringRule[];

  /**
   * Transforma a entidade em um objeto Recommendation
   */
  mapToRecommendation(entity: RecommendableEntity, score: number): Recommendation;
}
```

### 3. Base Scoring Rule

```typescript
// apps/api/src/recommendation/rules/base-scoring.rule.ts
import { UserPreferences } from '@prisma/client';
import { 
  ScoringRule, 
  ScoringContext, 
  RecommendableEntity 
} from '../interfaces/scoring-rule.interface';

export abstract class BaseScoringRule<
  TEntity extends RecommendableEntity = RecommendableEntity,
  TPreferences extends UserPreferences = UserPreferences,
> implements ScoringRule<TEntity, TPreferences> {
  constructor(
    public readonly name: string,
    public readonly weight: number,
  ) {}

  abstract calculate(context: ScoringContext<TEntity, TPreferences>): number;

  /**
   * Por padrão, todas entidades são elegíveis
   * Override apenas em regras que precisam filtrar
   */
  isEligible(context: ScoringContext<TEntity, TPreferences>): boolean {
    return true;
  }

  /**
   * Normaliza score para 0-100
   */
  protected normalize(value: number, min: number = 0, max: number = 100): number {
    return Math.min(max, Math.max(min, value));
  }
}
```

### 4. Accommodation Rules

```typescript
// apps/api/src/recommendation/rules/accommodation/budget.rule.ts
import { Injectable } from '@nestjs/common';
import { Accommodation, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationBudgetRule extends BaseScoringRule<Accommodation, UserPreferences> {
  constructor() {
    super('AccommodationBudget', 0.4);
  }

  isEligible(context: ScoringContext<Accommodation, UserPreferences>): boolean {
    const price = context.entity.priceInCents / 100;
    const { budgetAccommodationMin, budgetAccommodationMax } = context.userPreferences;
    
    // Aceita até 20% acima do budget
    const maxAcceptable = budgetAccommodationMax * 1.2;
    return price >= budgetAccommodationMin && price <= maxAcceptable;
  }

  calculate(context: ScoringContext<Accommodation, UserPreferences>): number {
    const price = context.entity.priceInCents / 100;
    const { budgetAccommodationMin, budgetAccommodationMax } = context.userPreferences;

    // Muito abaixo do budget (pode ser suspeito)
    if (price < budgetAccommodationMin) {
      const diff = budgetAccommodationMin - price;
      const penalty = (diff / budgetAccommodationMin) * 70;
      return this.normalize(70 - penalty);
    }

    // Acima do budget (penalidade progressiva)
    if (price > budgetAccommodationMax) {
      const diff = price - budgetAccommodationMax;
      const penalty = (diff / budgetAccommodationMax) * 70;
      return this.normalize(30 - penalty, 0);
    }

    // Dentro do budget: melhor score para valores no meio da faixa
    const midpoint = (budgetAccommodationMin + budgetAccommodationMax) / 2;
    const range = budgetAccommodationMax - budgetAccommodationMin;
    const distanceFromMid = Math.abs(price - midpoint);
    const score = 100 - (distanceFromMid / range) * 30;

    return this.normalize(score);
  }
}
```

```typescript
// apps/api/src/recommendation/rules/accommodation/rating.rule.ts
import { Injectable } from '@nestjs/common';
import { Accommodation, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationRatingRule extends BaseScoringRule<Accommodation, UserPreferences> {
  constructor() {
    super('AccommodationRating', 0.25);
  }

  calculate(context: ScoringContext<Accommodation, UserPreferences>): number {
    const rating = context.entity.rating ?? 2.5; // Default neutro
    return this.normalize((rating / 5) * 100);
  }
}
```

```typescript
// apps/api/src/recommendation/rules/accommodation/distance.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationDistanceRule extends BaseScoringRule {
  constructor() {
    super('AccommodationDistance', 0.15);
  }

  calculate(context: ScoringContext): number {
    const distance = context.entity.distanceToSchool;
    const maxDistance = context.userPreferences.maxDistanceToSchool ?? 10;

    if (!distance) {
      return 75; // Score neutro se não houver dados
    }

    if (distance > maxDistance) {
      return 0; // Muito longe
    }

    // Score linear: 100 para 0km, 0 para maxDistance
    const score = 100 - (distance / maxDistance) * 100;
    return this.normalize(score);
  }
}
```

```typescript
// apps/api/src/recommendation/rules/accommodation/type-preference.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationTypePreferenceRule extends BaseScoringRule {
  constructor() {
    super('AccommodationTypePreference', 0.1);
  }

  calculate(context: ScoringContext): number {
    const preferredTypes = context.userPreferences.preferredAccommodationTypes || [];
    
    if (preferredTypes.length === 0) {
      return 50; // Neutro se não houver preferência
    }

    const isPreferred = preferredTypes.includes(
      context.entity.accommodationType,
    );

    return isPreferred ? 100 : 30;
  }
}
```

```typescript
// apps/api/src/recommendation/rules/accommodation/bonus.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationBonusRule extends BaseScoringRule {
  constructor() {
    super('AccommodationBonus', 0.1);
  }

  calculate(context: ScoringContext): number {
    let score = 0;

    if (context.entity.isPartner) {
      score += 50; // Parceiros têm confiabilidade
    }

    if (context.entity.isTopTrip) {
      score += 50; // Top Trip = muito popular
    }

    return this.normalize(score);
  }
}
```

### 5. Course Rules

```typescript
// apps/api/src/recommendation/rules/course/budget.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class CourseBudgetRule extends BaseScoringRule {
  constructor() {
    super('CourseBudget', 0.4);
  }

  isEligible(context: ScoringContext): boolean {
    const price = context.entity.priceInCents / 100;
    const { budgetCourseMin, budgetCourseMax } = context.userPreferences;
    
    const maxAcceptable = budgetCourseMax * 1.2;
    return price >= budgetCourseMin && price <= maxAcceptable;
  }

  calculate(context: ScoringContext): number {
    const price = context.entity.priceInCents / 100;
    const { budgetCourseMin, budgetCourseMax } = context.userPreferences;

    if (price < budgetCourseMin) {
      const diff = budgetCourseMin - price;
      const penalty = (diff / budgetCourseMin) * 70;
      return this.normalize(70 - penalty);
    }

    if (price > budgetCourseMax) {
      const diff = price - budgetCourseMax;
      const penalty = (diff / budgetCourseMax) * 70;
      return this.normalize(30 - penalty, 0);
    }

    const midpoint = (budgetCourseMin + budgetCourseMax) / 2;
    const range = budgetCourseMax - budgetCourseMin;
    const distanceFromMid = Math.abs(price - midpoint);
    const score = 100 - (distanceFromMid / range) * 30;

    return this.normalize(score);
  }
}
```

```typescript
// apps/api/src/recommendation/rules/course/rating.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class CourseRatingRule extends BaseScoringRule {
  constructor() {
    super('CourseRating', 0.3);
  }

  calculate(context: ScoringContext): number {
    const rating = context.entity.rating ?? 2.5;
    return this.normalize((rating / 5) * 100);
  }
}
```

```typescript
// apps/api/src/recommendation/rules/course/english-level.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class CourseEnglishLevelRule extends BaseScoringRule {
  constructor() {
    super('CourseEnglishLevel', 0.2);
  }

  calculate(context: ScoringContext): number {
    const userLevel = context.userPreferences.englishLevel || 'intermediate';
    const targetAudience = context.entity.targetAudience || '';

    // Se o curso não especifica audience, score neutro
    if (!targetAudience) {
      return 60;
    }

    // Match exato = 100
    if (targetAudience.toLowerCase().includes(userLevel.toLowerCase())) {
      return 100;
    }

    // Match parcial = 70
    return 70;
  }
}
```

```typescript
// apps/api/src/recommendation/rules/course/duration.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class CourseDurationRule extends BaseScoringRule {
  constructor() {
    super('CourseDuration', 0.1);
  }

  calculate(context: ScoringContext): number {
    const weeklyHours = context.entity.weeklyHours || 20;

    // Normaliza: 20h = 50, 40h = 100, mais que 40h = 100
    const score = Math.min(100, (weeklyHours / 40) * 100);
    return this.normalize(score);
  }
}
```

### 6. Place Rules

```typescript
// apps/api/src/recommendation/rules/place/rating.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class PlaceRatingRule extends BaseScoringRule {
  constructor() {
    super('PlaceRating', 0.5);
  }

  calculate(context: ScoringContext): number {
    const rating = context.entity.rating ?? 2.5;
    return this.normalize((rating / 5) * 100);
  }
}
```

```typescript
// apps/api/src/recommendation/rules/place/student-favorite.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class PlaceStudentFavoriteRule extends BaseScoringRule {
  constructor() {
    super('PlaceStudentFavorite', 0.3);
  }

  calculate(context: ScoringContext): number {
    return context.entity.isStudentFavorite ? 100 : 40;
  }
}
```

```typescript
// apps/api/src/recommendation/rules/place/deal.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class PlaceDealRule extends BaseScoringRule {
  constructor() {
    super('PlaceDeal', 0.2);
  }

  calculate(context: ScoringContext): number {
    return context.entity.hasDeal ? 100 : 50;
  }
}
```

### 7. Strategies

```typescript
// apps/api/src/recommendation/strategies/accommodation.strategy.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecommendationStrategy,
  Recommendation,
} from '../interfaces/recommendation-strategy.interface';
import { ScoringRule } from '../interfaces/scoring-rule.interface';
import { AccommodationBudgetRule } from '../rules/accommodation/budget.rule';
import { AccommodationRatingRule } from '../rules/accommodation/rating.rule';
import { AccommodationDistanceRule } from '../rules/accommodation/distance.rule';
import { AccommodationTypePreferenceRule } from '../rules/accommodation/type-preference.rule';
import { AccommodationBonusRule } from '../rules/accommodation/bonus.rule';

@Injectable()
export class AccommodationStrategy implements RecommendationStrategy {
  constructor(
    private prisma: PrismaService,
    private budgetRule: AccommodationBudgetRule,
    private ratingRule: AccommodationRatingRule,
    private distanceRule: AccommodationDistanceRule,
    private typePreferenceRule: AccommodationTypePreferenceRule,
    private bonusRule: AccommodationBonusRule,
  ) {}

  async fetchEntities(userPreferences: any): Promise<any[]> {
    return this.prisma.accommodation.findMany({
      include: {
        location: true,
      },
    });
  }

  getScoringRules(): ScoringRule[] {
    return [
      this.budgetRule,
      this.ratingRule,
      this.distanceRule,
      this.typePreferenceRule,
      this.bonusRule,
    ];
  }

  mapToRecommendation(entity: any, score: number): Recommendation {
    let badge = '';
    if (entity.isTopTrip) {
      badge = 'Top Trip';
    } else if (entity.goodFor) {
      badge = entity.goodFor.substring(0, 30);
    }

    return {
      id: entity.id,
      type: 'accommodation',
      title: entity.title,
      subtitle: `${entity.accommodationType} • $${(entity.priceInCents / 100).toFixed(0)}/${entity.priceUnit}`,
      score: Math.round(score * 10) / 10,
      badge,
      imageUrl: entity.images?.[0] || 'https://via.placeholder.com/150',
      data: entity,
    };
  }
}
```

```typescript
// apps/api/src/recommendation/strategies/course.strategy.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecommendationStrategy,
  Recommendation,
} from '../interfaces/recommendation-strategy.interface';
import { ScoringRule } from '../interfaces/scoring-rule.interface';
import { CourseBudgetRule } from '../rules/course/budget.rule';
import { CourseRatingRule } from '../rules/course/rating.rule';
import { CourseEnglishLevelRule } from '../rules/course/english-level.rule';
import { CourseDurationRule } from '../rules/course/duration.rule';

@Injectable()
export class CourseStrategy implements RecommendationStrategy {
  constructor(
    private prisma: PrismaService,
    private budgetRule: CourseBudgetRule,
    private ratingRule: CourseRatingRule,
    private englishLevelRule: CourseEnglishLevelRule,
    private durationRule: CourseDurationRule,
  ) {}

  async fetchEntities(userPreferences: any): Promise<any[]> {
    return this.prisma.course.findMany({
      include: {
        school: {
          include: {
            location: true,
          },
        },
      },
    });
  }

  getScoringRules(): ScoringRule[] {
    return [
      this.budgetRule,
      this.ratingRule,
      this.englishLevelRule,
      this.durationRule,
    ];
  }

  mapToRecommendation(entity: any, score: number): Recommendation {
    return {
      id: entity.id,
      type: 'course',
      title: entity.programName,
      subtitle: `${entity.weeklyHours}h/week • ${entity.school.name}`,
      score: Math.round(score * 10) / 10,
      badge: entity.badge || '',
      imageUrl: entity.images?.[0] || 'https://via.placeholder.com/150',
      data: entity,
    };
  }
}
```

```typescript
// apps/api/src/recommendation/strategies/place.strategy.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecommendationStrategy,
  Recommendation,
} from '../interfaces/recommendation-strategy.interface';
import { ScoringRule } from '../interfaces/scoring-rule.interface';
import { PlaceRatingRule } from '../rules/place/rating.rule';
import { PlaceStudentFavoriteRule } from '../rules/place/student-favorite.rule';
import { PlaceDealRule } from '../rules/place/deal.rule';

@Injectable()
export class PlaceStrategy implements RecommendationStrategy {
  constructor(
    private prisma: PrismaService,
    private ratingRule: PlaceRatingRule,
    private studentFavoriteRule: PlaceStudentFavoriteRule,
    private dealRule: PlaceDealRule,
  ) {}

  async fetchEntities(userPreferences: any): Promise<any[]> {
    return this.prisma.place.findMany({
      include: {
        location: true,
      },
    });
  }

  getScoringRules(): ScoringRule[] {
    return [this.ratingRule, this.studentFavoriteRule, this.dealRule];
  }

  mapToRecommendation(entity: any, score: number): Recommendation {
    let badge = '';
    if (entity.isStudentFavorite) {
      badge = '⭐ Student Favorite';
    } else if (entity.hasDeal) {
      badge = '🎉 Deal';
    }

    return {
      id: entity.id,
      type: 'place',
      title: entity.name,
      subtitle: entity.category,
      score: Math.round(score * 10) / 10,
      badge,
      imageUrl: entity.images?.[0] || 'https://via.placeholder.com/150',
      data: entity,
    };
  }
}
```

### 8. School Rules

```typescript
// apps/api/src/recommendation/rules/school/rating.rule.ts
import { Injectable } from '@nestjs/common';
import { School, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class SchoolRatingRule extends BaseScoringRule<School, UserPreferences> {
  constructor() {
    super('SchoolRating', 0.4);
  }

  calculate(context: ScoringContext<School, UserPreferences>): number {
    const rating = context.entity.rating;
    if (!rating) return 50;
    return this.normalize((Number(rating) / 5) * 100);
  }
}
```

```typescript
// apps/api/src/recommendation/rules/school/programs-variety.rule.ts
import { Injectable } from '@nestjs/common';
import { School, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class SchoolProgramsVarietyRule extends BaseScoringRule<School, UserPreferences> {
  constructor() {
    super('SchoolProgramsVariety', 0.25);
  }

  calculate(context: ScoringContext<School, UserPreferences>): number {
    const programTypes = context.entity.programTypes || [];
    const score = Math.min(100, programTypes.length * 25);
    return this.normalize(score);
  }
}
```

```typescript
// apps/api/src/recommendation/rules/school/location.rule.ts
import { Injectable } from '@nestjs/common';
import { School, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class SchoolLocationRule extends BaseScoringRule<School, UserPreferences> {
  constructor() {
    super('SchoolLocation', 0.2);
  }

  calculate(context: ScoringContext<School, UserPreferences>): number {
    const preferredCities = context.userPreferences.preferredCities || [];
    if (preferredCities.length === 0) return 50;
    
    const schoolCity = context.entity.location?.city;
    if (!schoolCity) return 50;
    
    const isPreferred = preferredCities.some(
      (city) => city.toLowerCase() === schoolCity.toLowerCase(),
    );
    
    return isPreferred ? 100 : 30;
  }
}
```

```typescript
// apps/api/src/recommendation/rules/school/accreditation.rule.ts
import { Injectable } from '@nestjs/common';
import { School, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class SchoolAccreditationRule extends BaseScoringRule<School, UserPreferences> {
  constructor() {
    super('SchoolAccreditation', 0.15);
  }

  calculate(context: ScoringContext<School, UserPreferences>): number {
    let score = 0;
    if (context.entity.isAccredited) score += 60;
    if (context.entity.isPartner) score += 40;
    return this.normalize(score);
  }
}
```

### 9. School Strategy

```typescript
// apps/api/src/recommendation/strategies/school.strategy.ts
import { Injectable } from '@nestjs/common';
import { School, UserPreferences } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecommendationStrategy,
  Recommendation,
} from '../interfaces/recommendation-strategy.interface';
import { ScoringRule } from '../interfaces/scoring-rule.interface';
import { SchoolRatingRule } from '../rules/school/rating.rule';
import { SchoolProgramsVarietyRule } from '../rules/school/programs-variety.rule';
import { SchoolLocationRule } from '../rules/school/location.rule';
import { SchoolAccreditationRule } from '../rules/school/accreditation.rule';

@Injectable()
export class SchoolStrategy implements RecommendationStrategy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingRule: SchoolRatingRule,
    private readonly programsVarietyRule: SchoolProgramsVarietyRule,
    private readonly locationRule: SchoolLocationRule,
    private readonly accreditationRule: SchoolAccreditationRule,
  ) {}

  async fetchEntities(userPreferences: UserPreferences): Promise<School[]> {
    return this.prisma.school.findMany({
      include: {
        location: true,
        _count: { select: { courses: true } },
      },
    });
  }

  getScoringRules(): ScoringRule<School, UserPreferences>[] {
    return [
      this.ratingRule,
      this.programsVarietyRule,
      this.locationRule,
      this.accreditationRule,
    ];
  }

  mapToRecommendation(entity: School, score: number): Recommendation {
    let badge = '';
    if (entity.isPartner) {
      badge = '⭐ Partner';
    } else if (entity.isAccredited) {
      badge = '✓ Accredited';
    }

    const coursesCount = (entity as any)._count?.courses || 0;

    return {
      id: entity.id,
      type: 'school',
      title: entity.name,
      subtitle: `${entity.location?.city || 'Unknown'} • ${coursesCount} courses`,
      score: Math.round(score * 10) / 10,
      badge,
      imageUrl: entity.logoUrl || 'https://via.placeholder.com/150',
      data: entity,
    };
  }
}
```

### 10. Strategy Factory

```typescript
// apps/api/src/recommendation/factories/strategy.factory.ts
import { Injectable } from '@nestjs/common';
import { RecommendationType } from '../dto/get-recommendations.dto';
import { RecommendationStrategy } from '../interfaces/recommendation-strategy.interface';
import { AccommodationStrategy } from '../strategies/accommodation.strategy';
import { CourseStrategy } from '../strategies/course.strategy';
import { PlaceStrategy } from '../strategies/place.strategy';
import { SchoolStrategy } from '../strategies/school.strategy';

@Injectable()
export class StrategyFactory {
  constructor(
    private readonly accommodationStrategy: AccommodationStrategy,
    private readonly courseStrategy: CourseStrategy,
    private readonly placeStrategy: PlaceStrategy,
    private readonly schoolStrategy: SchoolStrategy,
  ) {}

  getStrategy(type: RecommendationType): RecommendationStrategy {
    switch (type) {
      case RecommendationType.ACCOMMODATION:
        return this.accommodationStrategy;
      case RecommendationType.COURSE:
        return this.courseStrategy;
      case RecommendationType.PLACE:
        return this.placeStrategy;
      case RecommendationType.SCHOOL:
        return this.schoolStrategy;
      default:
        throw new Error(`Unknown recommendation type: ${type}`);
    }
  }
}
```

### 9. Recommendation Service

```typescript
// apps/api/src/recommendation/recommendation.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationType } from './dto/get-recommendations.dto';
import { StrategyFactory } from './factories/strategy.factory';
import { Recommendation } from './interfaces/recommendation-strategy.interface';
import { ScoringContext } from './interfaces/scoring-rule.interface';

@Injectable()
export class RecommendationService {
  constructor(
    private prisma: PrismaService,
    private strategyFactory: StrategyFactory,
  ) {}

  async getRecommendations(
    userId: string,
    type: RecommendationType,
    limit: number,
  ): Promise<Recommendation[]> {
    // 1. Buscar preferências do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    if (!user || !user.preferences) {
      throw new NotFoundException('User preferences not found');
    }

    // 2. Obter strategy apropriada
    const strategy = this.strategyFactory.getStrategy(type);

    // 3. Buscar entidades
    const entities = await strategy.fetchEntities(user.preferences);

    // 4. Aplicar scoring rules
    const rules = strategy.getScoringRules();
    const recommendations: Recommendation[] = [];

    for (const entity of entities) {
      const context: ScoringContext = {
        entity,
        userPreferences: user.preferences,
      };

      // Verificar elegibilidade
      const isEligible = rules.every((rule) => rule.isEligible(context));
      if (!isEligible) {
        continue; // Pula esta entidade
      }

      // Calcular score ponderado
      let totalScore = 0;
      let totalWeight = 0;

      for (const rule of rules) {
        const ruleScore = rule.calculate(context);
        totalScore += ruleScore * rule.weight;
        totalWeight += rule.weight;
      }

      const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

      // Mapear para Recommendation
      const recommendation = strategy.mapToRecommendation(entity, finalScore);
      recommendations.push(recommendation);
    }

    // 5. Ordenar por score e limitar
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
```

### 10. Controller

```typescript
// apps/api/src/recommendation/recommendation.controller.ts
import { Controller, Get, Query, Param } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';

@Controller('recommendation')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get(':userId')
  async getRecommendations(
    @Param('userId') userId: string,
    @Query() query: GetRecommendationsDto,
  ) {
    return this.recommendationService.getRecommendations(
      userId,
      query.type,
      query.limit,
    );
  }
}
```

### 11. Module

```typescript
// apps/api/src/recommendation/recommendation.module.ts
import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { PrismaModule } from '../prisma/prisma.module';

// Strategies
import { AccommodationStrategy } from './strategies/accommodation.strategy';
import { CourseStrategy } from './strategies/course.strategy';
import { PlaceStrategy } from './strategies/place.strategy';
import { SchoolStrategy } from './strategies/school.strategy';

// Factory
import { StrategyFactory } from './factories/strategy.factory';

// Accommodation Rules
import { AccommodationBudgetRule } from './rules/accommodation/budget.rule';
import { AccommodationRatingRule } from './rules/accommodation/rating.rule';
import { AccommodationDistanceRule } from './rules/accommodation/distance.rule';
import { AccommodationTypePreferenceRule } from './rules/accommodation/type-preference.rule';
import { AccommodationBonusRule } from './rules/accommodation/bonus.rule';

// Course Rules
import { CourseBudgetRule } from './rules/course/budget.rule';
import { CourseRatingRule } from './rules/course/rating.rule';
import { CourseEnglishLevelRule } from './rules/course/english-level.rule';
import { CourseDurationRule } from './rules/course/duration.rule';

// Place Rules
import { PlaceRatingRule } from './rules/place/rating.rule';
import { PlaceStudentFavoriteRule } from './rules/place/student-favorite.rule';
import { PlaceDealRule } from './rules/place/deal.rule';

// School Rules
import { SchoolRatingRule } from './rules/school/rating.rule';
import { SchoolProgramsVarietyRule } from './rules/school/programs-variety.rule';
import { SchoolLocationRule } from './rules/school/location.rule';
import { SchoolAccreditationRule } from './rules/school/accreditation.rule';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    StrategyFactory,
    
    // Strategies
    AccommodationStrategy,
    CourseStrategy,
    PlaceStrategy,
    SchoolStrategy,
    
    // Accommodation Rules
    AccommodationBudgetRule,
    AccommodationRatingRule,
    AccommodationDistanceRule,
    AccommodationTypePreferenceRule,
    AccommodationBonusRule,
    
    // Course Rules
    CourseBudgetRule,
    CourseRatingRule,
    CourseEnglishLevelRule,
    CourseDurationRule,
    
    // Place Rules
    PlaceRatingRule,
    PlaceStudentFavoriteRule,
    PlaceDealRule,
    
    // School Rules
    SchoolRatingRule,
    SchoolProgramsVarietyRule,
    SchoolLocationRule,
    SchoolAccreditationRule,
  ],
})
export class RecommendationModule {}
```

### 12. Registrar no AppModule

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { RecommendationModule } from './recommendation/recommendation.module';

@Module({
  imports: [
    // ... outros módulos
    RecommendationModule,
  ],
  // ...
})
export class AppModule {}
```

---

## 🔧 Como Adicionar Novas Regras

### Exemplo: Adicionar regra "Reviews Recentes"

**1. Criar a Rule**

```typescript
// apps/api/src/recommendation/rules/accommodation/recent-reviews.rule.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationRecentReviewsRule extends BaseScoringRule {
  constructor() {
    super('AccommodationRecentReviews', 0.05); // 5% do peso total
  }

  calculate(context: ScoringContext): number {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const recentReviews = context.entity.reviews?.filter(
      (review) => new Date(review.createdAt).getTime() > thirtyDaysAgo,
    ).length ?? 0;
    
    // Mais reviews recentes = melhor (1 review = 10 pontos, cap em 100)
    return this.normalize(Math.min(100, recentReviews * 10));
  }
}
```

**2. Adicionar na Strategy**

```typescript
// apps/api/src/recommendation/strategies/accommodation.strategy.ts

// Adicionar import
import { AccommodationRecentReviewsRule } from '../rules/accommodation/recent-reviews.rule';

// Adicionar no construtor
constructor(
  private prisma: PrismaService,
  private budgetRule: AccommodationBudgetRule,
  private ratingRule: AccommodationRatingRule,
  private distanceRule: AccommodationDistanceRule,
  private typePreferenceRule: AccommodationTypePreferenceRule,
  private bonusRule: AccommodationBonusRule,
  private recentReviewsRule: AccommodationRecentReviewsRule, // NOVO
) {}

// Adicionar no getScoringRules()
getScoringRules(): ScoringRule[] {
  return [
    this.budgetRule,
    this.ratingRule,
    this.distanceRule,
    this.typePreferenceRule,
    this.bonusRule,
    this.recentReviewsRule, // NOVO
  ];
}
```

**3. Registrar no Module**

```typescript
// apps/api/src/recommendation/recommendation.module.ts

// Adicionar import
import { AccommodationRecentReviewsRule } from './rules/accommodation/recent-reviews.rule';

// Adicionar em providers
providers: [
  // ...
  AccommodationRecentReviewsRule, // NOVO
],
```

**Pronto! ✅ Sem quebrar nada!**

---

## 🚀 Próximos Passos

### 🎯 Fase 1: Melhorias Imediatas (1-2 semanas)

#### 1.1 **Cache de Recomendações**

```typescript
// Implementar cache Redis
@Injectable()
export class RecommendationService {
  constructor(
    private prisma: PrismaService,
    private strategyFactory: StrategyFactory,
    private cacheManager: Cache, // NOVO
  ) {}

  async getRecommendations(userId: string, type: RecommendationType, limit: number) {
    const cacheKey = `recommendations:${userId}:${type}:${limit}`;
    
    // Tentar buscar do cache (válido por 10 minutos)
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Se não houver cache, calcular
    const recommendations = await this.calculateRecommendations(userId, type, limit);
    
    // Salvar no cache
    await this.cacheManager.set(cacheKey, recommendations, 600); // 10 min
    
    return recommendations;
  }
}
```

**Benefício**: 10x mais rápido para requisições repetidas

---

#### 1.2 **Logging e Debugging**

```typescript
@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  async getRecommendations(...) {
    this.logger.log(`Calculating recommendations for user ${userId}, type: ${type}`);
    
    for (const entity of entities) {
      // Log scores de cada regra
      const scoreBreakdown = {};
      for (const rule of rules) {
        const score = rule.calculate(context);
        scoreBreakdown[rule.name] = score;
      }
      
      this.logger.debug(`Entity ${entity.id} scores:`, scoreBreakdown);
    }
  }
}
```

**Benefício**: Facilita debugging e ajuste de pesos

---

#### 1.3 **Testes Unitários**

```typescript
// apps/api/src/recommendation/rules/accommodation/budget.rule.spec.ts
describe('AccommodationBudgetRule', () => {
  let rule: AccommodationBudgetRule;

  beforeEach(() => {
    rule = new AccommodationBudgetRule();
  });

  it('should reject accommodation 20% above budget', () => {
    const context = {
      entity: { priceInCents: 120000 }, // $1200
      userPreferences: {
        budgetAccommodationMin: 500,
        budgetAccommodationMax: 1000,
      },
    };

    expect(rule.isEligible(context)).toBe(false);
  });

  it('should give highest score to mid-range prices', () => {
    const context = {
      entity: { priceInCents: 75000 }, // $750 (meio da faixa)
      userPreferences: {
        budgetAccommodationMin: 500,
        budgetAccommodationMax: 1000,
      },
    };

    const score = rule.calculate(context);
    expect(score).toBeGreaterThan(90);
  });
});
```

**Benefício**: Garantir que regras funcionam como esperado

---

### 🎯 Fase 2: Dados Comportamentais (2-4 semanas)

#### 2.1 **User Interactions Table**

```sql
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  item_type VARCHAR(50) NOT NULL, -- 'accommodation', 'course', 'place'
  item_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'view', 'favorite', 'share', 'inquiry'
  duration_seconds INT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_item (user_id, item_type, item_id),
  INDEX idx_user_action (user_id, action)
);
```

#### 2.2 **Nova Regra: User Interest**

```typescript
@Injectable()
export class AccommodationUserInterestRule extends BaseScoringRule {
  constructor(private prisma: PrismaService) {
    super('AccommodationUserInterest', 0.15);
  }

  async calculate(context: ScoringContext): Promise<number> {
    // Buscar interações do usuário com esta acomodação
    const interactions = await this.prisma.userInteraction.findMany({
      where: {
        userId: context.userPreferences.userId,
        itemType: 'accommodation',
        itemId: context.entity.id,
      },
    });

    let score = 50; // Base neutra

    // Views aumentam score
    const views = interactions.filter(i => i.action === 'view').length;
    score += views * 5; // +5 por view

    // Favorite = muito interesse
    const hasFavorited = interactions.some(i => i.action === 'favorite');
    if (hasFavorited) score += 50;

    return this.normalize(score);
  }
}
```

**Benefício**: Aprende preferências do usuário ao longo do tempo

---

#### 2.3 **Filtro: Itens Rejeitados**

```typescript
@Injectable()
export class RejectedItemsFilter {
  async filter(userId: string, items: RecommendableEntity[]): Promise<RecommendableEntity[]> {
    const rejected = await this.prisma.userInteraction.findMany({
      where: {
        userId,
        action: 'reject',
      },
      select: { itemId: true },
    });

    const rejectedIds = new Set(rejected.map(r => r.itemId));
    
    return items.filter(item => !rejectedIds.has(item.id));
  }
}
```

**Benefício**: Não mostra itens que usuário já descartou

---

### 🎯 Fase 3: Collaborative Filtering (1-2 meses)

#### 3.1 **Similaridade entre Usuários**

```typescript
@Injectable()
export class UserSimilarityService {
  /**
   * Encontra usuários similares baseado em:
   * - Budget similar
   * - Preferências de tipo
   * - Nível de inglês
   * - Nacionalidade
   */
  async findSimilarUsers(userId: string, limit: number = 50): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    // Query complexa para encontrar usuários similares
    const similar = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        preferences: {
          budgetAccommodationMin: {
            gte: user.preferences.budgetAccommodationMin * 0.8,
            lte: user.preferences.budgetAccommodationMin * 1.2,
          },
          englishLevel: user.preferences.englishLevel,
          // ... outros critérios
        },
      },
      take: limit,
    });

    return similar.map(u => u.id);
  }
}
```

#### 3.2 **Recomendação Colaborativa**

```typescript
@Injectable()
export class CollaborativeRecommendationRule extends BaseScoringRule {
  constructor(
    private prisma: PrismaService,
    private similarityService: UserSimilarityService,
  ) {
    super('CollaborativeRecommendation', 0.2);
  }

  async calculate(context: ScoringContext): Promise<number> {
    // Encontrar usuários similares
    const similarUsers = await this.similarityService.findSimilarUsers(
      context.userPreferences.userId,
    );

    // Quantos usuários similares favoritaram/aplicaram para este item?
    const interactions = await this.prisma.userInteraction.count({
      where: {
        userId: { in: similarUsers },
        itemId: context.entity.id,
        action: { in: ['favorite', 'apply', 'inquiry'] },
      },
    });

    // Normalizar baseado no número de usuários similares
    const popularityRatio = interactions / similarUsers.length;
    return this.normalize(popularityRatio * 100);
  }
}
```

**Benefício**: "Pessoas como você também gostaram de..."

---

### 🎯 Fase 4: Machine Learning (3+ meses)

#### 4.1 **Learning to Rank**

```typescript
@Injectable()
export class MLRecommendationService {
  private model: any; // TensorFlow.js model

  async loadModel() {
    this.model = await tf.loadLayersModel('file://./models/ranking-model.json');
  }

  async predictScore(features: number[]): Promise<number> {
    const tensor = tf.tensor2d([features]);
    const prediction = this.model.predict(tensor) as tf.Tensor;
    const score = await prediction.data();
    return score[0] * 100; // Normalizar para 0-100
  }

  /**
   * Features: [
   *   budget_fit (0-1),
   *   rating (0-1),
   *   distance (0-1),
   *   type_match (0-1),
   *   user_views (0-1),
   *   similar_user_interest (0-1),
   *   ...
   * ]
   */
}
```

**Benefício**: Aprende automaticamente quais features são mais importantes

---

#### 4.2 **A/B Testing Framework**

```typescript
@Injectable()
export class RecommendationExperimentService {
  async getRecommendations(userId: string, type: RecommendationType) {
    // 50% usuários veem algoritmo A, 50% veem algoritmo B
    const variant = this.assignVariant(userId);

    let recommendations;
    if (variant === 'A') {
      recommendations = await this.getRecommendationsV1(userId, type);
    } else {
      recommendations = await this.getRecommendationsV2(userId, type);
    }

    // Track qual variante foi mostrada
    await this.trackExperiment(userId, variant, recommendations);

    return recommendations;
  }

  private assignVariant(userId: string): 'A' | 'B' {
    // Hash consistente para mesmo usuário sempre ver mesma variante
    const hash = hashCode(userId);
    return hash % 2 === 0 ? 'A' : 'B';
  }
}
```

**Benefício**: Testar melhorias antes de lançar para todos

---

### 🎯 Fase 5: Avançado (6+ meses)

#### 5.1 **Contextual Bandits**

- Algoritmo que aprende qual tipo de recomendação mostrar baseado em contexto
- Ex: Segunda-feira de manhã → recomendar cursos intensivos
- Ex: Sexta à noite → recomendar lugares para sair

#### 5.2 **Diversity & Serendipity**

- Não mostrar apenas itens "seguros"
- Incluir 1-2 opções "surpresa" que usuário não esperava mas pode gostar

#### 5.3 **Explainability**

```json
{
  "id": "acc-123",
  "score": 87.5,
  "explanation": {
    "mainReasons": [
      "Within your budget ($750 vs $500-$1000)",
      "Highly rated by students (4.5★)",
      "Close to school (3km)"
    ],
    "scoreBreakdown": {
      "budget": 38.0,
      "rating": 22.5,
      "distance": 10.5,
      "type": 10.0,
      "bonus": 5.0
    }
  }
}
```

---

## 📊 Métricas para Acompanhar

### Métricas de Performance

- **Response Time**: < 500ms para recommendations
- **Cache Hit Rate**: > 70%
- **Database Queries**: < 5 queries por request

### Métricas de Negócio

- **Click-Through Rate (CTR)**: % de recomendações clicadas
- **Conversion Rate**: % que resultam em inquiry/aplicação
- **Time to Conversion**: Quanto tempo até usuário agir
- **Recommendation Diversity**: Variedade de tipos recomendados

### Métricas de Qualidade

- **Average Score**: Score médio das recomendações
- **Score Distribution**: Histograma de scores
- **User Satisfaction**: Feedback explícito "foi útil?"

---

## 🔍 Debugging Tips

### Ver scores detalhados

```bash
# Habilitar logs em development
export LOG_LEVEL=debug

# Ver breakdown de scores por regra
curl "http://localhost:3000/recommendation/{userId}?type=accommodation&debug=true"
```

### Testar uma regra isoladamente

```typescript
const rule = new AccommodationBudgetRule();
const score = rule.calculate({
  entity: { priceInCents: 75000 },
  userPreferences: { budgetAccommodationMin: 500, budgetAccommodationMax: 1000 },
});
console.log('Budget score:', score); // Deve ser ~95-100
```

### Ajustar pesos dinamicamente

```typescript
// Criar endpoint admin para ajustar pesos
@Post('admin/weights')
async updateWeights(@Body() weights: WeightsDto) {
  // Atualizar pesos em tempo real sem redeploy
  this.budgetRule.weight = weights.budget;
  this.ratingRule.weight = weights.rating;
  // ...
}
```

---

## 🎓 Referências

- [Recommender Systems Handbook](https://www.recommenderhandbook.com/)
- [Netflix Recommendation System](https://netflixtechblog.com/netflix-recommendations-beyond-the-5-stars-part-1-55838468f429)
- [Spotify Discovery Weekly](https://engineering.atspotify.com/2015/12/discover-weekly/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)

---

## 📝 Conclusão

Esta arquitetura foi projetada para:

✅ **Começar simples** com dados existentes
✅ **Evoluir gradualmente** adicionando novas regras
✅ **Manter código limpo** seguindo SOLID
✅ **Facilitar testes** com regras isoladas
✅ **Escalar facilmente** com cache e otimizações

**Próximos passos recomendados:**
1. Implementar arquitetura básica (hoje)
2. Adicionar cache Redis (esta semana)
3. Implementar logging detalhado (esta semana)
4. Escrever testes unitários (próxima semana)
5. Coletar métricas e ajustar pesos (próximo mês)

Boa sorte! 🚀
