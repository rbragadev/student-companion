import { Module } from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { PrismaModule } from '../prisma/prisma.module';
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
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { FinanceItemService } from './finance-item.service';
import { FinanceItemController } from './finance-item.controller';

@Module({
  imports: [PrismaModule, NotificationModule],
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
    InvoiceController,
    FinancialController,
    FinanceItemController,
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
    InvoiceService,
    FinancialService,
    FinanceItemService,
  ],
  exports: [CommissionConfigService, EnrollmentQuoteService],
})
export class EnrollmentModule {}
