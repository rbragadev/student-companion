import { Module } from '@nestjs/common';
import { EnrollmentIntentService } from './enrollment-intent.service';
import { EnrollmentIntentController } from './enrollment-intent.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationBridgeController } from './recommendation-bridge.controller';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentIntentController, RecommendationBridgeController],
  providers: [EnrollmentIntentService],
  exports: [EnrollmentIntentService],
})
export class EnrollmentIntentModule {}
