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

  private async reconcileOrderPaymentStatus(orderId?: string | null) {
    if (!orderId) return;

    const [order, paidResult, pendingCount] = await Promise.all([
      this.prisma.order.findUnique({ where: { id: orderId }, select: { id: true, totalAmount: true } }),
      this.prisma.payment.aggregate({
        where: { orderId, status: 'paid' },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({
        where: { orderId, status: 'pending' },
      }),
    ]);
    if (!order) return;

    const paidAmount = this.toNumber(paidResult._sum.amount);
    const totalAmount = this.toNumber(order.totalAmount);
    const paymentStatus =
      paidAmount >= totalAmount && totalAmount > 0
        ? 'paid'
        : paidAmount > 0
          ? 'partially_paid'
          : pendingCount > 0
            ? 'pending'
            : 'pending';
    const status = paymentStatus === 'paid' ? 'paid' : 'submitted';

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        status,
      },
    });
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

    const order = await this.prisma.order.findFirst({
      where: { enrollmentId },
      orderBy: { updatedAt: 'desc' },
      include: {
        items: true,
      },
    });

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
    } else if (!order) {
      state = 'blocked_missing_quote';
      reason = 'Ainda não há order comercial válida vinculada a esta matrícula.';
    } else if (
      !enrollment.course.auto_approve_intent &&
      !this.isApprovalReadyStatus(enrollment.status)
    ) {
      state = 'blocked_waiting_approval';
      reason = 'Aguardando aprovação operacional para liberar checkout.';
    }

    const currency = order?.currency ?? quote?.currency ?? enrollment.pricing?.currency ?? 'CAD';
    const totalAmount = order
      ? this.toNumber((order as any).totalAmount)
      : quote
        ? this.toNumber(quote.totalAmount)
        : this.toNumber(enrollment.pricing?.packageTotalAmount ?? enrollment.pricing?.totalAmount);
    const downPaymentAmount = order
      ? this.toNumber((order as any).downPaymentAmount)
      : quote
        ? this.toNumber(quote.downPaymentAmount)
        : Number((totalAmount * 0.3).toFixed(2));
    const remainingAmount = order
      ? this.toNumber((order as any).remainingAmount)
      : quote
        ? this.toNumber(quote.remainingAmount)
        : Number((totalAmount - downPaymentAmount).toFixed(2));

    return {
      enrollment,
      order,
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
      order: context.order
        ? {
            id: context.order.id,
            type: context.order.type,
            status: context.order.status,
            paymentStatus: context.order.paymentStatus,
            courseAmount: this.toNumber((context.order as any).courseAmount),
            accommodationAmount: this.toNumber((context.order as any).accommodationAmount),
            fees: this.toNumber((context.order as any).fees),
            discounts: this.toNumber((context.order as any).discounts),
            totalAmount: this.toNumber((context.order as any).totalAmount),
            downPaymentPercentage: this.toNumber((context.order as any).downPaymentPercentage),
            downPaymentAmount: this.toNumber((context.order as any).downPaymentAmount),
            remainingAmount: this.toNumber((context.order as any).remainingAmount),
            commissionPercentage: this.toNumber((context.order as any).commissionPercentage),
            commissionAmount: this.toNumber((context.order as any).commissionAmount),
            commissionCourseAmount: this.toNumber((context.order as any).commissionCourseAmount),
            commissionAccommodationAmount: this.toNumber(
              (context.order as any).commissionAccommodationAmount,
            ),
          }
        : null,
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
          orderId: context.quote?.id
            ? (await tx.order.findUnique({
                where: { enrollmentQuoteId: context.quote.id },
                select: { id: true },
              }))?.id ?? context.order?.id ?? null
            : context.order?.id ?? null,
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

    await this.reconcileOrderPaymentStatus(payment.orderId);

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
        orderId:
          (
            await this.prisma.order.findFirst({
              where: {
                enrollmentQuoteId: dto.enrollmentQuoteId ?? invoice?.enrollmentQuoteId ?? undefined,
              },
              select: { id: true },
            })
          )?.id ?? null,
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
    await this.reconcileOrderPaymentStatus(created.orderId);
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
    await this.reconcileOrderPaymentStatus(updated.orderId);
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
