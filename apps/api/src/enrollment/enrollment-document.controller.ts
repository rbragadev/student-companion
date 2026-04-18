import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnrollmentDocumentService } from './enrollment-document.service';
import { CreateEnrollmentDocumentDto } from './dto/create-enrollment-document.dto';
import { UpdateEnrollmentDocumentDto } from './dto/update-enrollment-document.dto';

@Controller('enrollment-documents')
export class EnrollmentDocumentController {
  constructor(private readonly enrollmentDocumentService: EnrollmentDocumentService) {}

  @Get()
  findAll(@Query('enrollmentId') enrollmentId?: string) {
    return this.enrollmentDocumentService.findAll(enrollmentId);
  }

  @Post()
  create(@Body() dto: CreateEnrollmentDocumentDto) {
    return this.enrollmentDocumentService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDocumentDto) {
    return this.enrollmentDocumentService.update(id, dto);
  }
}
