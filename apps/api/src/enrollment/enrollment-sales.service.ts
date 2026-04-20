import { Injectable } from '@nestjs/common';
import { EnrollmentQuoteService } from './enrollment-quote.service';

@Injectable()
export class EnrollmentSalesService {
  constructor(private readonly enrollmentQuoteService: EnrollmentQuoteService) {}

  async syncOrdersForEnrollment(enrollmentId: string) {
    return this.enrollmentQuoteService.syncOrderForEnrollment(enrollmentId);
  }
}
