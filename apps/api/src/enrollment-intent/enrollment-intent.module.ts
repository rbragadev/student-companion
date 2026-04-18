import { Module } from '@nestjs/common';
import { EnrollmentIntentService } from './enrollment-intent.service';
import { EnrollmentIntentController } from './enrollment-intent.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentIntentController],
  providers: [EnrollmentIntentService],
  exports: [EnrollmentIntentService],
})
export class EnrollmentIntentModule {}
