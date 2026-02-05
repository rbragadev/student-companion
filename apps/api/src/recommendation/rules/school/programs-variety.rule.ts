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
    // Conta quantos cursos a escola oferece (via _count)
    const coursesCount = (context.entity as any)._count?.courses || 0;
    
    // Mais cursos = melhor variedade
    // 0 cursos = 0, 1-2 = 25, 3-4 = 50, 5-7 = 75, 8+ = 100
    let score = 0;
    if (coursesCount >= 8) score = 100;
    else if (coursesCount >= 5) score = 75;
    else if (coursesCount >= 3) score = 50;
    else if (coursesCount >= 1) score = 25;
    
    return this.normalize(score);
  }
}
