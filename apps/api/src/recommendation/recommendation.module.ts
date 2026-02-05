import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { PrismaModule } from '../prisma/prisma.module';

// Strategies
import { AccommodationStrategy } from './strategies/accommodation.strategy';
import { CourseStrategy } from './strategies/course.strategy';
import { PlaceStrategy } from './strategies/place.strategy';
import { SchoolStrategy } from './strategies/school.strategy';

// Factory
import { StrategyFactory } from './factories/strategy.factory';

// Accommodation Rules
import { AccommodationBudgetRule } from './rules/accommodation/budget.rule';
import { AccommodationRatingRule } from './rules/accommodation/rating.rule';
import { AccommodationDistanceRule } from './rules/accommodation/distance.rule';
import { AccommodationTypePreferenceRule } from './rules/accommodation/type-preference.rule';
import { AccommodationBonusRule } from './rules/accommodation/bonus.rule';

// Course Rules
import { CourseBudgetRule } from './rules/course/budget.rule';
import { CourseRatingRule } from './rules/course/rating.rule';
import { CourseEnglishLevelRule } from './rules/course/english-level.rule';
import { CourseDurationRule } from './rules/course/duration.rule';

// Place Rules
import { PlaceRatingRule } from './rules/place/rating.rule';
import { PlaceStudentFavoriteRule } from './rules/place/student-favorite.rule';
import { PlaceDealRule } from './rules/place/deal.rule';

// School Rules
import { SchoolRatingRule } from './rules/school/rating.rule';
import { SchoolProgramsVarietyRule } from './rules/school/programs-variety.rule';
import { SchoolLocationRule } from './rules/school/location.rule';
import { SchoolAccreditationRule } from './rules/school/accreditation.rule';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    StrategyFactory,
    
    // Strategies
    AccommodationStrategy,
    CourseStrategy,
    PlaceStrategy,
    SchoolStrategy,
    
    // Accommodation Rules
    AccommodationBudgetRule,
    AccommodationRatingRule,
    AccommodationDistanceRule,
    AccommodationTypePreferenceRule,
    AccommodationBonusRule,
    
    // Course Rules
    CourseBudgetRule,
    CourseRatingRule,
    CourseEnglishLevelRule,
    CourseDurationRule,
    
    // Place Rules
    PlaceRatingRule,
    PlaceStudentFavoriteRule,
    PlaceDealRule,
    
    // School Rules
    SchoolRatingRule,
    SchoolProgramsVarietyRule,
    SchoolLocationRule,
    SchoolAccreditationRule,
  ],
})
export class RecommendationModule {}