import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }

  async getOverview() {
    const [invoices, payments, enrollments] = await Promise.all([
      this.prisma.invoice.findMany({ select: { status: true, totalAmount: true, dueDate: true } }),
      this.prisma.payment.findMany({ select: { status: true, amount: true, paidAt: true, createdAt: true } }),
      this.prisma.enrollment.findMany({
        where: { pricing: { isNot: null } },
        select: {
          pricing: {
            select: {
              packageTotalAmount: true,
              totalAmount: true,
              totalCommissionAmount: true,
              commissionAmount: true,
              currency: true,
            },
          },
        },
      }),
    ]);

    const totalSold = enrollments.reduce(
      (sum, item) =>
        sum +
        this.toNumber(item.pricing?.packageTotalAmount ?? item.pricing?.totalAmount),
      0,
    );

    const totalInvoiced = invoices.reduce((sum, item) => sum + this.toNumber(item.totalAmount), 0);
    const totalReceived = payments
      .filter((item) => item.status === 'paid')
      .reduce((sum, item) => sum + this.toNumber(item.amount), 0);

    const totalPending = Math.max(0, totalInvoiced - totalReceived);

    const totalCommission = enrollments.reduce(
      (sum, item) =>
        sum +
        this.toNumber(item.pricing?.totalCommissionAmount ?? item.pricing?.commissionAmount),
      0,
    );

    const now = new Date();
    const overdueCount = invoices.filter(
      (item) => item.status === 'overdue' || (item.status === 'pending' && item.dueDate < now),
    ).length;

    const byMonth = new Map<string, { month: string; received: number }>();
    for (const payment of payments.filter((item) => item.status === 'paid')) {
      const date = payment.paidAt ?? payment.createdAt;
      const month = date.toISOString().slice(0, 7);
      const current = byMonth.get(month) ?? { month, received: 0 };
      current.received += this.toNumber(payment.amount);
      byMonth.set(month, current);
    }

    return {
      totals: {
        totalSold: Number(totalSold.toFixed(2)),
        totalInvoiced: Number(totalInvoiced.toFixed(2)),
        totalReceived: Number(totalReceived.toFixed(2)),
        totalPending: Number(totalPending.toFixed(2)),
        totalCommission: Number(totalCommission.toFixed(2)),
        overdueInvoices: overdueCount,
      },
      revenueByMonth: Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month)),
      currency: 'CAD',
    };
  }

  async getSales(filters?: {
    institutionId?: string;
    schoolId?: string;
    courseId?: string;
    status?: string;
    hasAccommodation?: string;
  }) {
    const rows = await this.prisma.enrollment.findMany({
      where: {
        institutionId: filters?.institutionId,
        schoolId: filters?.schoolId,
        courseId: filters?.courseId,
        status: filters?.status,
        accommodationId:
          filters?.hasAccommodation === 'with'
            ? { not: null }
            : filters?.hasAccommodation === 'without'
              ? null
              : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        institution: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
        course: { select: { id: true, program_name: true } },
        accommodation: { select: { id: true, title: true, accommodationType: true } },
        pricing: true,
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            type: true,
            downPaymentAmount: true,
            remainingAmount: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            paidAt: true,
            createdAt: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            number: true,
            status: true,
            totalAmount: true,
            dueDate: true,
          },
        },
      },
    });

    return rows.map((item) => {
      const latestQuote = item.quotes[0] ?? null;
      const latestInvoice = item.invoices[0] ?? null;
      const paidAmount = item.payments
        .filter((payment) => payment.status === 'paid')
        .reduce((sum, payment) => sum + this.toNumber(payment.amount), 0);

      const total = this.toNumber(
        item.pricing?.packageTotalAmount ?? item.pricing?.totalAmount ?? latestInvoice?.totalAmount,
      );

      return {
        id: item.id,
        student: item.student,
        institution: item.institution,
        school: item.school,
        course: item.course,
        accommodation: item.accommodation,
        commercialStatus: item.status,
        financialStatus: latestInvoice?.status ?? 'not_invoiced',
        totalAmount: total,
        downPaymentAmount: this.toNumber(latestQuote?.downPaymentAmount),
        remainingAmount:
          this.toNumber(latestQuote?.remainingAmount) || Math.max(0, total - paidAmount),
        paidAmount: Number(paidAmount.toFixed(2)),
        quote: latestQuote,
        invoice: latestInvoice,
        commissionAmount: this.toNumber(
          item.pricing?.totalCommissionAmount ?? item.pricing?.commissionAmount,
        ),
        commissionPercentage: this.toNumber(item.pricing?.commissionPercentage),
        currency: item.pricing?.currency ?? 'CAD',
      };
    });
  }

  async getCommissions(filters?: { institutionId?: string; courseId?: string }) {
    const rows = await this.prisma.enrollment.findMany({
      where: {
        institutionId: filters?.institutionId,
        courseId: filters?.courseId,
        pricing: { isNot: null },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        institution: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
        course: { select: { id: true, program_name: true } },
        accommodation: { select: { id: true, title: true, accommodationType: true } },
        pricing: true,
      },
    });

    return rows.map((item) => ({
      enrollmentId: item.id,
      student: item.student,
      institution: item.institution,
      school: item.school,
      course: item.course,
      accommodation: item.accommodation,
      commissionTotal: this.toNumber(
        item.pricing?.totalCommissionAmount ?? item.pricing?.commissionAmount,
      ),
      commissionCourse: this.toNumber(item.pricing?.enrollmentCommissionAmount),
      commissionAccommodation: this.toNumber(item.pricing?.accommodationCommissionAmount),
      commissionPercentage: this.toNumber(item.pricing?.commissionPercentage),
      source:
        this.toNumber(item.pricing?.enrollmentCommissionAmount) > 0
          ? 'course_or_institution'
          : 'institution',
      currency: item.pricing?.currency ?? 'CAD',
      createdAt: item.createdAt,
    }));
  }

  async getReports() {
    const [sales, invoices, commissions] = await Promise.all([
      this.getSales(),
      this.prisma.invoice.findMany({
        include: {
          enrollment: {
            select: {
              institution: { select: { id: true, name: true } },
              school: { select: { id: true, name: true } },
              course: { select: { id: true, program_name: true } },
              accommodation: { select: { id: true, title: true } },
            },
          },
        },
      }),
      this.getCommissions(),
    ]);

    const byInstitution = new Map<string, { institutionId: string; institution: string; total: number }>();
    const byCourse = new Map<string, { courseId: string; course: string; total: number }>();
    const byAccommodation = new Map<string, { accommodationId: string; accommodation: string; total: number }>();

    for (const sale of sales) {
      const institutionKey = sale.institution.id;
      const inst = byInstitution.get(institutionKey) ?? {
        institutionId: institutionKey,
        institution: sale.institution.name,
        total: 0,
      };
      inst.total += this.toNumber(sale.totalAmount);
      byInstitution.set(institutionKey, inst);

      const courseKey = sale.course.id;
      const course = byCourse.get(courseKey) ?? {
        courseId: courseKey,
        course: sale.course.program_name,
        total: 0,
      };
      course.total += this.toNumber(sale.totalAmount);
      byCourse.set(courseKey, course);

      if (sale.accommodation) {
        const accommodationKey = sale.accommodation.id;
        const accommodation = byAccommodation.get(accommodationKey) ?? {
          accommodationId: accommodationKey,
          accommodation: sale.accommodation.title,
          total: 0,
        };
        accommodation.total += this.toNumber(sale.totalAmount);
        byAccommodation.set(accommodationKey, accommodation);
      }
    }

    const invoiceStatus = {
      pending: invoices.filter((item) => item.status === 'pending').length,
      paid: invoices.filter((item) => item.status === 'paid').length,
      overdue: invoices.filter((item) => item.status === 'overdue').length,
      cancelled: invoices.filter((item) => item.status === 'cancelled').length,
      draft: invoices.filter((item) => item.status === 'draft').length,
    };

    const totalCommission = commissions.reduce((sum, row) => sum + this.toNumber(row.commissionTotal), 0);

    const commissionByInstitution = new Map<string, { institution: string; total: number }>();
    const commissionByCourse = new Map<string, { course: string; total: number }>();

    for (const row of commissions) {
      const inst = commissionByInstitution.get(row.institution.id) ?? {
        institution: row.institution.name,
        total: 0,
      };
      inst.total += this.toNumber(row.commissionTotal);
      commissionByInstitution.set(row.institution.id, inst);

      const course = commissionByCourse.get(row.course.id) ?? {
        course: row.course.program_name,
        total: 0,
      };
      course.total += this.toNumber(row.commissionTotal);
      commissionByCourse.set(row.course.id, course);
    }

    return {
      revenue: {
        totalSold: Number(sales.reduce((sum, item) => sum + this.toNumber(item.totalAmount), 0).toFixed(2)),
        totalReceived: Number(
          sales.reduce((sum, item) => sum + this.toNumber(item.paidAmount), 0).toFixed(2),
        ),
        totalPending: Number(
          sales
            .reduce(
              (sum, item) => sum + Math.max(0, this.toNumber(item.totalAmount) - this.toNumber(item.paidAmount)),
              0,
            )
            .toFixed(2),
        ),
      },
      revenueByInstitution: Array.from(byInstitution.values()).map((item) => ({
        ...item,
        total: Number(item.total.toFixed(2)),
      })),
      revenueByCourse: Array.from(byCourse.values()).map((item) => ({
        ...item,
        total: Number(item.total.toFixed(2)),
      })),
      revenueByAccommodation: Array.from(byAccommodation.values()).map((item) => ({
        ...item,
        total: Number(item.total.toFixed(2)),
      })),
      invoices: invoiceStatus,
      commissions: {
        total: Number(totalCommission.toFixed(2)),
        byInstitution: Array.from(commissionByInstitution.entries()).map(([id, row]) => ({
          institutionId: id,
          institution: row.institution,
          total: Number(row.total.toFixed(2)),
        })),
        byCourse: Array.from(commissionByCourse.entries()).map(([id, row]) => ({
          courseId: id,
          course: row.course,
          total: Number(row.total.toFixed(2)),
        })),
      },
      currency: 'CAD',
    };
  }
}
