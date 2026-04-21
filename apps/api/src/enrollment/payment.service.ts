import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Payment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentQuoteService } from './enrollment-quote.service';
import { NotificationService } from '../notification/notification.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

type CheckoutState =
  | 'available'
  | 'blocked_waiting_approval'
  | 'blocked_rejected'
  | 'blocked_missing_quote'
  | 'paid';

type DownPaymentAllocation = {
  base: {
    courseAmount: number;
    accommodationAmount: number;
    totalAmount: number;
  };
  downPayment: {
    total: number;
    course: number;
    accommodation: number;
  };
  remaining: {
    total: number;
    course: number;
    accommodation: number;
  };
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentQuoteService: EnrollmentQuoteService,
    private readonly notificationService: NotificationService,
  ) {}

  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }

  private isRejectedStatus(status: string): boolean {
    return ['rejected', 'cancelled', 'expired'].includes(status);
  }

  private isApprovalReadyStatus(status: string): boolean {
    return ['approved', 'checkout_available', 'payment_pending', 'partially_paid', 'paid', 'confirmed', 'enrolled'].includes(status);
  }

  private async reconcileInvoiceStatus(invoiceId?: string | null) {
    if (!invoiceId) return;

    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.status === 'cancelled') return;

    const paidAmountResult = await this.prisma.payment.aggregate({
      where: { invoiceId, status: 'paid' },
      _sum: { amount: true },
    });

    const paidAmount = this.toNumber(paidAmountResult._sum.amount);
    const totalAmount = this.toNumber(invoice.totalAmount);

    let status = invoice.status;
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = 'paid';
    } else if (invoice.dueDate < new Date()) {
      status = 'overdue';
    } else if (invoice.status !== 'draft') {
      status = 'pending';
    }

    if (status !== invoice.status) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status },
      });
    }
  }

  private allocateDownPayment(
    courseAmount: number,
    accommodationAmount: number,
    downPaymentAmount: number,
  ): DownPaymentAllocation {
    const safeCourse = Math.max(0, Number(courseAmount || 0));
    const safeAccommodation = Math.max(0, Number(accommodationAmount || 0));
    const safeTotal = Math.max(0, Number((safeCourse + safeAccommodation).toFixed(2)));
    const safeDownPayment = Math.max(0, Number(downPaymentAmount || 0));

    if (safeTotal <= 0 || safeDownPayment <= 0) {
      return {
        base: {
          courseAmount: safeCourse,
          accommodationAmount: safeAccommodation,
          totalAmount: safeTotal,
        },
        downPayment: {
          total: safeDownPayment,
          course: 0,
          accommodation: 0,
        },
        remaining: {
          total: safeTotal,
          course: safeCourse,
          accommodation: safeAccommodation,
        },
      };
    }

    if (safeAccommodation <= 0) {
      const courseDownPayment = Math.min(safeCourse, safeDownPayment);
      return {
        base: {
          courseAmount: safeCourse,
          accommodationAmount: 0,
          totalAmount: safeTotal,
        },
        downPayment: {
          total: safeDownPayment,
          course: Number(courseDownPayment.toFixed(2)),
          accommodation: 0,
        },
        remaining: {
          total: Number((safeTotal - courseDownPayment).toFixed(2)),
          course: Number((safeCourse - courseDownPayment).toFixed(2)),
          accommodation: 0,
        },
      };
    }

    if (safeCourse <= 0) {
      const accommodationDownPayment = Math.min(safeAccommodation, safeDownPayment);
      return {
        base: {
          courseAmount: 0,
          accommodationAmount: safeAccommodation,
          totalAmount: safeTotal,
        },
        downPayment: {
          total: safeDownPayment,
          course: 0,
          accommodation: Number(accommodationDownPayment.toFixed(2)),
        },
        remaining: {
          total: Number((safeTotal - accommodationDownPayment).toFixed(2)),
          course: 0,
          accommodation: Number((safeAccommodation - accommodationDownPayment).toFixed(2)),
        },
      };
    }

    const courseRatio = safeCourse / safeTotal;
    const rawCourseDownPayment = safeDownPayment * courseRatio;
    let courseDownPayment = Number(rawCourseDownPayment.toFixed(2));
    let accommodationDownPayment = Number((safeDownPayment - courseDownPayment).toFixed(2));

    // Clamp to avoid negative remnants with rounding edge-cases.
    if (courseDownPayment > safeCourse) {
      courseDownPayment = safeCourse;
      accommodationDownPayment = Number((safeDownPayment - courseDownPayment).toFixed(2));
    }
    if (accommodationDownPayment > safeAccommodation) {
      accommodationDownPayment = safeAccommodation;
      courseDownPayment = Number((safeDownPayment - accommodationDownPayment).toFixed(2));
    }

    const courseRemaining = Number((safeCourse - courseDownPayment).toFixed(2));
    const accommodationRemaining = Number((safeAccommodation - accommodationDownPayment).toFixed(2));
    const totalRemaining = Number((safeTotal - safeDownPayment).toFixed(2));

    return {
      base: {
        courseAmount: safeCourse,
        accommodationAmount: safeAccommodation,
        totalAmount: safeTotal,
      },
      downPayment: {
        total: safeDownPayment,
        course: courseDownPayment,
        accommodation: accommodationDownPayment,
      },
      remaining: {
        total: totalRemaining,
        course: courseRemaining,
        accommodation: accommodationRemaining,
      },
    };
  }

  private async resolveCheckoutContext(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        course: { select: { id: true, program_name: true, auto_approve_intent: true } },
        institution: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        classGroup: { select: { id: true, name: true, code: true } },
        academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
        accommodation: {
          select: { id: true, title: true, accommodationType: true, location: true, priceUnit: true },
        },
        pricing: true,
      },
    });
    if (!enrollment) {
      throw new NotFoundException(`Matrícula ${enrollmentId} não encontrada`);
    }

    const quote =
      (await this.enrollmentQuoteService.findByEnrollment(enrollment.id).catch(() => null)) ?? null;
    const payments = await this.prisma.payment.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'desc' },
    });

    const paidDownPayment = payments.find(
      (item) => item.type === 'down_payment' && item.status === 'paid',
    );

    let state: CheckoutState = 'available';
    let reason: string | null = null;

    if (paidDownPayment) {
      state = 'paid';
      reason = 'Entrada já confirmada para este pacote.';
    } else if (this.isRejectedStatus(enrollment.status)) {
      state = 'blocked_rejected';
      reason = 'A proposta foi rejeitada/cancelada e o checkout está bloqueado.';
    } else if (!quote) {
      state = 'blocked_missing_quote';
      reason = 'Ainda não há quote ativa para esta matrícula.';
    } else if (
      !enrollment.course.auto_approve_intent &&
      !this.isApprovalReadyStatus(enrollment.status)
    ) {
      state = 'blocked_waiting_approval';
      reason = 'Aguardando aprovação operacional para liberar checkout.';
    }

    const currency = quote?.currency ?? enrollment.pricing?.currency ?? 'CAD';
    const totalAmount = quote ? this.toNumber(quote.totalAmount) : this.toNumber(enrollment.pricing?.packageTotalAmount ?? enrollment.pricing?.totalAmount);
    const downPaymentAmount = quote
      ? this.toNumber(quote.downPaymentAmount)
      : Number((totalAmount * 0.3).toFixed(2));
    const remainingAmount = quote
      ? this.toNumber(quote.remainingAmount)
      : Number((totalAmount - downPaymentAmount).toFixed(2));

    return {
      enrollment,
      quote,
      payments,
      paidDownPayment,
      state,
      reason,
      financial: {
        currency,
        totalAmount,
        downPaymentAmount,
        remainingAmount,
      },
    };
  }

  async getCheckout(enrollmentId: string) {
    const context = await this.resolveCheckoutContext(enrollmentId);
    const courseAmount = context.quote
      ? this.toNumber(context.quote.courseAmount)
      : this.toNumber(context.enrollment.pricing?.enrollmentAmount);
    const accommodationAmount = context.quote
      ? this.toNumber(context.quote.accommodationAmount)
      : this.toNumber(context.enrollment.pricing?.accommodationAmount);
    const allocation = this.allocateDownPayment(
      courseAmount,
      accommodationAmount,
      context.financial.downPaymentAmount,
    );

    return {
      enrollmentId: context.enrollment.id,
      state: context.state,
      reason: context.reason,
      autoApproveIntent: context.enrollment.course.auto_approve_intent,
      student: context.enrollment.student,
      institution: context.enrollment.institution,
      school: context.enrollment.school,
      unit: context.enrollment.unit,
      course: context.enrollment.course,
      classGroup: context.enrollment.classGroup,
      academicPeriod: context.enrollment.academicPeriod,
      accommodation: context.enrollment.accommodation,
      enrollmentStatus: context.enrollment.status,
      quote: context.quote,
      packageStatus:
        context.state === 'paid'
          ? 'paid'
          : context.state === 'blocked_rejected'
            ? 'cancelled'
            : context.state === 'blocked_waiting_approval'
              ? 'awaiting_approval'
              : context.payments.some((item) => item.status === 'pending')
                ? 'payment_pending'
                : context.state === 'available'
                  ? 'checkout_available'
                  : 'draft',
      nextStep:
        context.state === 'paid'
          ? 'Pagamento confirmado.'
          : context.state === 'blocked_rejected'
            ? 'Pacote cancelado/negado.'
            : context.state === 'blocked_waiting_approval'
              ? 'Aguardando aprovação operacional.'
              : context.state === 'available'
                ? 'Prosseguir com pagamento da entrada.'
                : 'Gerar ou atualizar quote para liberar checkout.',
      financial: context.financial,
      financialBreakdown: allocation,
      payments: context.payments,
    };
  }

  async initializeCheckout(enrollmentId: string) {
    return this.getCheckout(enrollmentId);
  }

  async confirmFakeDownPayment(enrollmentId: string) {
    const context = await this.resolveCheckoutContext(enrollmentId);

    if (context.state === 'blocked_waiting_approval') {
      throw new BadRequestException('Checkout bloqueado: proposta ainda aguardando aprovação');
    }
    if (context.state === 'blocked_rejected') {
      throw new BadRequestException('Checkout bloqueado: proposta rejeitada/cancelada');
    }
    if (context.state === 'blocked_missing_quote') {
      throw new BadRequestException('Checkout bloqueado: quote não encontrada');
    }
    if (context.state === 'paid' && context.paidDownPayment) {
      return {
        payment: context.paidDownPayment,
        checkout: await this.getCheckout(enrollmentId),
      };
    }

    const amount = context.financial.downPaymentAmount;
    if (amount <= 0) {
      throw new BadRequestException('Valor de entrada inválido para pagamento');
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const pending = await tx.payment.create({
        data: {
          enrollmentId,
          enrollmentQuoteId: context.quote?.id ?? null,
          type: 'down_payment',
          amount,
          currency: context.financial.currency,
          status: 'pending',
          provider: 'fake',
        },
      });

      const paid = await tx.payment.update({
        where: { id: pending.id },
        data: {
          status: 'paid',
          providerReference: `fake_${Date.now()}`,
          paidAt: new Date(),
        },
      });

      if (!['paid', 'confirmed', 'enrolled'].includes(context.enrollment.status)) {
        let currentStatus = context.enrollment.status;

        // Checkout aberto passa por payment_pending antes de paid.
        if (['approved', 'checkout_available'].includes(currentStatus)) {
          await tx.enrollment.update({
            where: { id: enrollmentId },
            data: { status: 'payment_pending' },
          });
          await tx.enrollmentStatusHistory.create({
            data: {
              enrollmentId,
              fromStatus: currentStatus,
              toStatus: 'payment_pending',
              reason: 'Pagamento iniciado',
              changedById: null,
            },
          });
          currentStatus = 'payment_pending';
        }

        await tx.enrollment.update({
          where: { id: enrollmentId },
          data: { status: 'paid' },
        });
        await tx.enrollmentStatusHistory.create({
          data: {
            enrollmentId,
            fromStatus: currentStatus,
            toStatus: 'paid',
            reason: 'Pagamento de entrada confirmado (fake checkout)',
            changedById: null,
          },
        });
      }

      return paid;
    });

    await this.notificationService.create({
      userId: context.enrollment.student.id,
      type: 'payment_confirmed',
      title: 'Pagamento confirmado',
      message:
        'Recebemos a entrada do seu pacote. Sua matrícula segue para as próximas etapas operacionais.',
      metadata: {
        enrollmentId,
        paymentId: payment.id,
        amount: this.toNumber(payment.amount),
        currency: payment.currency,
      },
    });

    return {
      payment,
      checkout: await this.getCheckout(enrollmentId),
    };
  }

  async findAll(filters?: {
    enrollmentId?: string;
    enrollmentQuoteId?: string;
    studentId?: string;
    invoiceId?: string;
    institutionId?: string;
    status?: string;
  }) {
    return this.prisma.payment.findMany({
      where: {
        enrollmentId: filters?.enrollmentId,
        enrollmentQuoteId: filters?.enrollmentQuoteId,
        invoiceId: filters?.invoiceId,
        status: filters?.status,
        enrollment:
          filters?.studentId || filters?.institutionId
            ? {
                studentId: filters?.studentId,
                institutionId: filters?.institutionId,
              }
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            status: true,
            dueDate: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            status: true,
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
            institution: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
            course: { select: { id: true, program_name: true } },
          },
        },
        enrollmentQuote: {
          select: {
            id: true,
            type: true,
            totalAmount: true,
            downPaymentAmount: true,
            currency: true,
            coursePricing: {
              select: {
                id: true,
                course: { select: { id: true, program_name: true } },
              },
            },
            accommodationPricing: {
              select: {
                id: true,
                accommodation: { select: { id: true, title: true, accommodationType: true } },
              },
            },
          },
        },
      },
    });
  }

  async createManual(dto: CreatePaymentDto) {
    if (!dto.invoiceId && !dto.enrollmentId && !dto.enrollmentQuoteId) {
      throw new BadRequestException(
        'Informe invoiceId, enrollmentId ou enrollmentQuoteId para registrar pagamento',
      );
    }

    let invoice: {
      id: string;
      enrollmentId: string | null;
      enrollmentQuoteId: string | null;
      currency: string;
    } | null = null;
    if (dto.invoiceId) {
      invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.invoiceId },
        select: {
          id: true,
          enrollmentId: true,
          enrollmentQuoteId: true,
          currency: true,
        },
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice ${dto.invoiceId} não encontrada`);
      }
    }

    const created = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId ?? null,
        enrollmentId: dto.enrollmentId ?? invoice?.enrollmentId ?? null,
        enrollmentQuoteId: dto.enrollmentQuoteId ?? invoice?.enrollmentQuoteId ?? null,
        type: dto.type ?? 'down_payment',
        amount: dto.amount,
        currency: dto.currency ?? invoice?.currency ?? 'CAD',
        status: dto.status ?? 'pending',
        provider: dto.provider ?? 'manual',
        paidAt: dto.status === 'paid' ? new Date() : null,
        providerReference:
          dto.status === 'paid' ? `manual_${Date.now()}` : null,
      },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            status: true,
            dueDate: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            status: true,
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
            institution: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
            course: { select: { id: true, program_name: true } },
          },
        },
      },
    });

    await this.reconcileInvoiceStatus(created.invoiceId);
    return created;
  }

  async updateStatus(id: string, dto: UpdatePaymentStatusDto) {
    const current = await this.prisma.payment.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException(`Pagamento ${id} não encontrado`);
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: dto.status,
        paidAt: dto.status === 'paid' ? new Date() : null,
        providerReference:
          dto.status === 'paid'
            ? current.providerReference ?? `manual_${Date.now()}`
            : current.providerReference,
      },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            status: true,
            dueDate: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            status: true,
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
            institution: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
            course: { select: { id: true, program_name: true } },
          },
        },
      },
    });

    await this.reconcileInvoiceStatus(updated.invoiceId);
    return updated;
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });
    if (!payment) {
      throw new NotFoundException(`Pagamento ${id} não encontrado`);
    }
    return payment;
  }
}
