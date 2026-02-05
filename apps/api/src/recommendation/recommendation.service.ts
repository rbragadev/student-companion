import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StrategyFactory } from './factories/strategy.factory';
import { Recommendation } from './interfaces/recommendation-strategy.interface';
import { ScoringContext } from './interfaces/scoring-rule.interface';
import { RecommendationType } from './dto/get-recommendation.dto';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strategyFactory: StrategyFactory,
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
      .toSorted((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}