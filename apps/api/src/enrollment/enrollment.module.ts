import { Module } from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EnrollmentIntentModule } from '../enrollment-intent/enrollment-intent.module';

@Module({
  imports: [PrismaModule, EnrollmentIntentModule],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
})
export class EnrollmentModule {}
