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
        _count: {
          select: { course: true },
        },
      },
    });
  }

  getScoringRules(): ScoringRule<School, UserPreferences>[] {
    return [this.ratingRule, this.programsVarietyRule, this.locationRule, this.accreditationRule];
  }

  mapToRecommendation(entity: School, score: number): Recommendation {
    // Usa o primeiro badge do array de badges
    const badge = entity.badges?.[0] || '';

    // Pega a contagem de cursos do _count
    const coursesCount = (entity as any)._count?.course || 0;

    return {
      id: entity.id,
      type: 'school',
      title: entity.name,
      subtitle: `${entity.location || 'Unknown'} • ${coursesCount} courses`,
      location: entity.location || 'Unknown',
      score: Math.round(score * 10) / 10,
      badge,
      imageUrl: entity.logo || 'https://via.placeholder.com/150',
      data: entity,
    };
  }
}
