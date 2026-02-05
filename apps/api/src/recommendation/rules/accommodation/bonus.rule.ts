import { Injectable } from '@nestjs/common';
import { Accommodation, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationBonusRule extends BaseScoringRule<Accommodation, UserPreferences> {
  constructor() {
    super('AccommodationBonus', 0.1);
  }

  calculate(context: ScoringContext<Accommodation, UserPreferences>): number {
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