import { Injectable } from '@nestjs/common';
import { Course, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class CourseRatingRule extends BaseScoringRule<Course, UserPreferences> {
  constructor() {
    super('CourseRating', 0.3);
  }

  calculate(context: ScoringContext<Course, UserPreferences>): number {
    const rating = context.entity.rating ? Number(context.entity.rating) : 2.5;
    return this.normalize((rating / 5) * 100);
  }
}