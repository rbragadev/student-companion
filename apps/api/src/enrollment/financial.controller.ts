import { Controller, Get, Query } from '@nestjs/common';
import { FinancialService } from './financial.service';

@Controller()
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('financial-overview')
  getOverview() {
    return this.financialService.getOverview();
  }

  @Get('sales')
  getSales(
    @Query('institutionId') institutionId?: string,
    @Query('schoolId') schoolId?: string,
    @Query('courseId') courseId?: string,
    @Query('status') status?: string,
    @Query('hasAccommodation') hasAccommodation?: string,
  ) {
    return this.financialService.getSales({
      institutionId,
      schoolId,
      courseId,
      status,
      hasAccommodation,
    });
  }

  @Get('commissions')
  getCommissions(
    @Query('institutionId') institutionId?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.financialService.getCommissions({ institutionId, courseId });
  }

  @Get('reports')
  getReports() {
    return this.financialService.getReports();
  }
}
