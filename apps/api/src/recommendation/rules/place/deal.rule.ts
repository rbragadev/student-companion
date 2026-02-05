import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';
import { Place, UserPreferences } from '@prisma/client';

@Injectable()
export class PlaceDealRule extends BaseScoringRule<Place, UserPreferences> {
  constructor() {
    super('PlaceDeal', 0.2);
  }

  calculate(context: ScoringContext<Place, UserPreferences>): number {
    return context.entity.hasDeal ? 100 : 50;
  }
}