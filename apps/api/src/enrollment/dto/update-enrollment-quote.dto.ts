import { PartialType } from '@nestjs/mapped-types';
import { CreateEnrollmentQuoteDto } from './create-enrollment-quote.dto';

export class UpdateEnrollmentQuoteDto extends PartialType(CreateEnrollmentQuoteDto) {}
