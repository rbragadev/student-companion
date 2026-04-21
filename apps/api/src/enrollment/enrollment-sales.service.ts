import { Injectable } from '@nestjs/common';
import { EnrollmentQuoteService } from './enrollment-quote.service';

type SyncOrderOverrides = {
  downPaymentPercentage?: number;
  downPaymentAmount?: number;
};

@Injectable()
export class EnrollmentSalesService {
  constructor(private readonly enrollmentQuoteService: EnrollmentQuoteService) {}

  async syncOrdersForEnrollment(
    enrollmentId: string,
    overrides?: SyncOrderOverrides,
  ) {
    return this.enrollmentQuoteService.syncOrderForEnrollment(enrollmentId, overrides);
  }
}
