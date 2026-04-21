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
    const hasEnrollmentFilter = Boolean(filters?.institutionId || filters?.schoolId || filters?.courseId || filters?.status);

    const enrollmentWhere: Prisma.EnrollmentWhereInput = {
      ...(filters?.institutionId ? { institutionId: filters.institutionId } : {}),
      ...(filters?.schoolId ? { schoolId: filters.schoolId } : {}),
      ...(filters?.courseId ? { courseId: filters.courseId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    };

    const where: Prisma.FinanceItemWhereInput = (() => {
      if (!filters?.hasAccommodation) {
        return hasEnrollmentFilter
          ? { enrollment: enrollmentWhere }
          : {};
      }

      if (filters.hasAccommodation === 'with') {
        if (hasEnrollmentFilter) {
          return {
            enrollment: {
              ...enrollmentWhere,
              accommodation: {
                isNot: null,
              },
            },
          };
        }

        return {
          OR: [
            { itemType: 'accommodation' },
            { enrollment: { accommodation: { isNot: null } } },
          ],
        };
      }

      if (hasEnrollmentFilter) {
        return {
          enrollment: {
            ...enrollmentWhere,
            accommodation: null,
          },
        };
      }

      return {
        OR: [
          { itemType: { not: 'accommodation' } },
          { enrollment: { accommodation: null } },
        ],
      };
    })();

    const rows = await this.prisma.financeItem.findMany({
      where,
      include: {
        enrollment: {
          select: {
            id: true,
            status: true,
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
            institution: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
            course: { select: { id: true, program_name: true, auto_approve_intent: true } },
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
        transactions: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((item) => {
      const hasEnrollment = !!item.enrollment;
      const paidAmount = item.transactions
        .filter((transaction) => transaction.status === 'paid')
        .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);
      const pendingAmount = item.transactions
        .filter((transaction) => transaction.status === 'pending')
        .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);
      const emittedAmount = item.transactions
        .filter((transaction) => !['cancelled', 'failed'].includes(transaction.status))
        .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);
      const total = this.toNumber(item.amount);
      const remainingAmount = Math.max(0, Number((total - paidAmount).toFixed(2)));
      const hasTransactions = item.transactions.length > 0;

      let financialStatus = 'not_invoiced';
      if (hasTransactions) {
        financialStatus =
          paidAmount >= total
            ? 'paid'
            : pendingAmount > 0
              ? 'payment_pending'
              : paidAmount > 0
                ? 'partially_paid'
                : 'not_invoiced';
      }

      const isCourse = item.itemType === 'course';
      const isAccommodation = item.itemType === 'accommodation';
      const enrollment = item.enrollment;

      const student = enrollment?.student;
      const institution = enrollment?.institution;
      const school = enrollment?.school;
      const course = enrollment?.course;
      const accommodation = enrollment?.accommodation;

      return {
        id: item.id,
        enrollmentId: enrollment?.id,
        student: student
          ? {
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
            }
          : null,
        institution: institution
          ? { id: institution.id, name: institution.name }
          : null,
        school: school
          ? { id: school.id, name: school.name }
          : null,
        course: course
          ? { id: course.id, program_name: course.program_name, auto_approve_intent: course.auto_approve_intent }
          : null,
        accommodation: accommodation
          ? {
              id: accommodation.id,
              title: accommodation.title,
              accommodationType: accommodation.accommodationType,
            }
          : null,
        commercialStatus: hasEnrollment ? item.enrollment!.status : 'not_selected',
        financialStatus,
        totalAmount: total,
        downPaymentAmount: this.toNumber(emittedAmount),
        remainingAmount,
        paidAmount: Number(paidAmount.toFixed(2)),
        commissionAmount: 0,
        commissionPercentage: 0,
        currency: item.currency,
        courseAmount: isCourse ? total : 0,
        accommodationAmount: isAccommodation ? total : 0,
        quote: null,
        invoice: null,
        itemType: item.itemType,
        itemTitle: item.title,
        transactionsCount: item.transactions.length,
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
      if (sale.institution) {
        const institutionKey = sale.institution.id;
        const inst = byInstitution.get(institutionKey) ?? {
          institutionId: institutionKey,
          institution: sale.institution.name,
          total: 0,
        };
        inst.total += this.toNumber(sale.totalAmount);
        byInstitution.set(institutionKey, inst);
      }

      if (sale.course) {
        const courseKey = sale.course.id;
        const course = byCourse.get(courseKey) ?? {
          courseId: courseKey,
          course: sale.course.program_name,
          total: 0,
        };
        course.total += this.toNumber(sale.totalAmount);
        byCourse.set(courseKey, course);
      }

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
