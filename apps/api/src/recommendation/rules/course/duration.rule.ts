import { Injectable } from '@nestjs/common';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';
import { Course, UserPreferences } from '@prisma/client';

@Injectable()
export class CourseDurationRule extends BaseScoringRule<Course, UserPreferences> {
  constructor() {
    super('CourseDuration', 0.1);
  }

  calculate(context: ScoringContext<Course, UserPreferences>): number {
    const weeklyHours = context.entity.weeklyHours || 20;

    // Normaliza: 20h = 50, 40h = 100, mais que 40h = 100
    const score = Math.min(100, (weeklyHours / 40) * 100);
    return this.normalize(score);
  }
}