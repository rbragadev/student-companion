import { Injectable } from '@nestjs/common';
import { Course, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class CourseEnglishLevelRule extends BaseScoringRule<Course, UserPreferences> {
  constructor() {
    super('CourseEnglishLevel', 0.2);
  }

  calculate(context: ScoringContext<Course, UserPreferences>): number {
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