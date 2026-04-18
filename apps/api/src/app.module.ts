import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { CourseModule } from './course/course.module';
import { ReviewModule } from './review/review.module';
import { SchoolModule } from './school/school.module';
import { AccommodationModule } from './accommodation/accommodation.module';
import { PlaceModule } from './place/place.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { AuthModule } from './auth/auth.module';
import { PermissionModule } from './permission/permission.module';
import { AdminProfileModule } from './admin-profile/admin-profile.module';
import { InstitutionModule } from './institution/institution.module';
import { UnitModule } from './unit/unit.module';
import { AcademicPeriodModule } from './academic-period/academic-period.module';
import { ClassGroupModule } from './class-group/class-group.module';
import { EnrollmentIntentModule } from './enrollment-intent/enrollment-intent.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    CourseModule,
    ReviewModule,
    SchoolModule,
    AccommodationModule,
    PlaceModule,
    RecommendationModule,
    PermissionModule,
    AdminProfileModule,
    InstitutionModule,
    UnitModule,
    AcademicPeriodModule,
    ClassGroupModule,
    EnrollmentIntentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
