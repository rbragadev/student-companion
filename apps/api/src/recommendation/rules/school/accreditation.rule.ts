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
    // Escola parceira recebe pontuação máxima
    // isAccredited não existe no schema atual
    const score = context.entity.isPartner ? 100 : 50;
    
    return this.normalize(score);
  }
}
