import { Module } from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EnrollmentIntentModule } from '../enrollment-intent/enrollment-intent.module';
import { EnrollmentDocumentController } from './enrollment-document.controller';
import { EnrollmentDocumentService } from './enrollment-document.service';
import { EnrollmentMessageController } from './enrollment-message.controller';
import { EnrollmentMessageService } from './enrollment-message.service';
import { CommissionConfigController } from './commission-config.controller';
import { CommissionConfigService } from './commission-config.service';

@Module({
  imports: [PrismaModule, EnrollmentIntentModule],
  controllers: [
    EnrollmentController,
    EnrollmentDocumentController,
    EnrollmentMessageController,
    CommissionConfigController,
  ],
  providers: [
    EnrollmentService,
    EnrollmentDocumentService,
    EnrollmentMessageService,
    CommissionConfigService,
  ],
  exports: [CommissionConfigService],
})
export class EnrollmentModule {}
