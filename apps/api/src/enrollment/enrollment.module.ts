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
import { CoursePricingController } from './course-pricing.controller';
import { CoursePricingService } from './course-pricing.service';
import { AccommodationPricingController } from './accommodation-pricing.controller';
import { AccommodationPricingService } from './accommodation-pricing.service';
import { EnrollmentQuoteController } from './enrollment-quote.controller';
import { EnrollmentQuoteService } from './enrollment-quote.service';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { EnrollmentCheckoutController } from './enrollment-checkout.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, EnrollmentIntentModule, NotificationModule],
  controllers: [
    EnrollmentController,
    EnrollmentCheckoutController,
    EnrollmentDocumentController,
    EnrollmentMessageController,
    CommissionConfigController,
    CoursePricingController,
    AccommodationPricingController,
    EnrollmentQuoteController,
    PaymentController,
  ],
  providers: [
    EnrollmentService,
    EnrollmentDocumentService,
    EnrollmentMessageService,
    CommissionConfigService,
    CoursePricingService,
    AccommodationPricingService,
    EnrollmentQuoteService,
    PaymentService,
  ],
  exports: [CommissionConfigService, EnrollmentQuoteService],
})
export class EnrollmentModule {}
