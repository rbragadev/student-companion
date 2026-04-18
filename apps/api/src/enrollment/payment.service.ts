import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Payment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentQuoteService } from './enrollment-quote.service';
import { NotificationService } from '../notification/notification.service';

type CheckoutState =
  | 'available'
  | 'blocked_waiting_approval'
  | 'blocked_rejected'
  | 'blocked_missing_quote'
  | 'paid';

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
    return ['rejected', 'cancelled', 'denied'].includes(status);
  }

  private isApprovalReadyStatus(status: string): boolean {
    return ['approved', 'enrolled'].includes(status);
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
        enrollmentIntent: { select: { id: true, status: true, deniedReason: true } },
        pricing: true,
      },
    });
    if (!enrollment) {
      throw new NotFoundException(`Matrícula ${enrollmentId} não encontrada`);
    }

    const quote = await this.enrollmentQuoteService.findLatestByIntent(enrollment.enrollmentIntent.id);
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
      reason =
        enrollment.enrollmentIntent.deniedReason ??
        'A proposta foi rejeitada/cancelada e o checkout está bloqueado.';
    } else if (!quote) {
      state = 'blocked_missing_quote';
      reason = 'Ainda não há quote válida vinculada a esta matrícula.';
    } else if (
      !enrollment.course.auto_approve_intent &&
      !this.isApprovalReadyStatus(enrollment.status)
    ) {
      state = 'blocked_waiting_approval';
      reason = 'Aguardando aprovação operacional para liberar checkout.';
    }

    const currency = quote?.currency ?? enrollment.pricing?.currency ?? 'CAD';
    const totalAmount = quote
      ? this.toNumber(quote.totalAmount)
      : this.toNumber(enrollment.pricing?.packageTotalAmount ?? enrollment.pricing?.totalAmount);
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
      financial: context.financial,
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

      if (!['enrolled', 'completed'].includes(context.enrollment.status)) {
        const nextStatus = 'enrolled';
        await tx.enrollment.update({
          where: { id: enrollmentId },
          data: { status: nextStatus },
        });
        await tx.enrollmentStatusHistory.create({
          data: {
            enrollmentId,
            fromStatus: context.enrollment.status,
            toStatus: nextStatus,
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

  async findAll(filters?: { enrollmentId?: string; studentId?: string }) {
    return this.prisma.payment.findMany({
      where: {
        enrollmentId: filters?.enrollmentId,
        enrollment: filters?.studentId ? { studentId: filters.studentId } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
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
          select: { id: true, type: true, totalAmount: true, downPaymentAmount: true, currency: true },
        },
      },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException(`Pagamento ${id} não encontrado`);
    }
    return payment;
  }
}
