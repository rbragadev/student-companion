import { Injectable } from '@nestjs/common';
import { Course, UserPreferences } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecommendationStrategy,
  Recommendation,
} from '../interfaces/recommendation-strategy.interface';
import { ScoringRule, RecommendableEntity } from '../interfaces/scoring-rule.interface';
import { CourseBudgetRule } from '../rules/course/budget.rule';
import { CourseRatingRule } from '../rules/course/rating.rule';
import { CourseEnglishLevelRule } from '../rules/course/english-level.rule';
import { CourseDurationRule } from '../rules/course/duration.rule';

@Injectable()
export class CourseStrategy implements RecommendationStrategy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetRule: CourseBudgetRule,
    private readonly ratingRule: CourseRatingRule,
    private readonly englishLevelRule: CourseEnglishLevelRule,
    private readonly durationRule: CourseDurationRule,
  ) {}

  async fetchEntities(userPreferences: UserPreferences): Promise<Course[]> {
    return this.prisma.course.findMany({
      include: {
        school: true,
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

  mapToRecommendation(entity: RecommendableEntity, score: number): Recommendation {
    const course = entity as Course & { school: { name: string } };
    
    // Usa o primeiro badge do array de badges
    const badge = course.badges?.[0] || '';
    
    return {
      id: course.id,
      type: 'course',
      title: course.programName,
      subtitle: `${course.weeklyHours}h/week • ${course.school.name}`,
      score: Math.round(score * 10) / 10,
      badge,
      imageUrl: course.images?.[0] || 'https://via.placeholder.com/150',
      data: course,
    };
  }
}