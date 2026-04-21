import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, FinanceTransaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { UpdateFinanceTransactionStatusDto } from './dto/update-finance-transaction-status.dto';
import { CreateStandaloneAccommodationFinanceItemDto } from './dto/create-standalone-finance-item.dto';

type FinanceTransactionRow = {
  id: string;
  financeItemId: string;
  amount: Prisma.Decimal | number;
  currency: string;
  status: string;
  type: string;
  provider: string;
  providerReference?: string | null;
  paidAt?: Date | null;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type FinanceItemRow = {
  id: string;
  enrollmentId: string | null;
  quoteItemId?: string | null;
  itemType: string;
  sourceType: string;
  title: string;
  referenceId: string;
  startDate: Date | null;
  endDate: Date | null;
  amount: Prisma.Decimal | number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  transactions: FinanceTransactionRow[];
};

type EnrollmentDownPaymentRow = {
  id: string;
  amount: Prisma.Decimal | number;
  currency: string;
  paidAt: Date | null;
  createdAt: Date;
};

type FinanceItemEnrollment = {
  id: string;
  status: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  institution: { id: string; name: string };
  school: { id: string; name: string };
  course: { id: string; program_name: string };
  accommodation: { id: string; title: string; accommodationType?: string | null } | null;
} | null;

type StandaloneCreateInput = Pick<
  CreateStandaloneAccommodationFinanceItemDto,
  'accommodationPricingId' | 'startDate' | 'endDate' | 'enrollmentId' | 'title'
>;

type FinanceItemRowWithSummary = FinanceItemRow & {
  enrollment?: FinanceItemEnrollment | null;
};

@Injectable()
export class FinanceItemService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }

  private toDateOnly(value: string): Date {
    const parsed = this.parseIsoDate(value);
    return parsed;
  }

  private parseIsoDate(value: string): Date {
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || !trimmed.includes('T')) {
      const [year, month, day] = trimmed.split('-').map((part) => Number(part));
      if ([year, month, day].some((part) => Number.isNaN(part))) {
        throw new BadRequestException('Data inválida.');
      }
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Data inválida.');
    }
    return parsed;
  }

  private calculateStayDays(startDate: Date, endDate: Date) {
    const diffMs = endDate.getTime() - startDate.getTime();
    const stayDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (stayDays <= 0) {
      throw new BadRequestException('A data final deve ser maior que a data inicial.');
    }
    return stayDays;
  }

  private validateMinimumStay(stayDays: number, minimumStayDays: number, accommodationLabel: string) {
    if (minimumStayDays <= 0) {
      throw new BadRequestException(`Configuração inválida de permanência mínima para ${accommodationLabel}.`);
    }

    if (stayDays < minimumStayDays) {
      throw new BadRequestException(
        `A permanência mínima para ${accommodationLabel} é de ${minimumStayDays} dias.`,
      );
    }
  }

  private validateWindow(
    startDate: Date,
    endDate: Date,
    windowStartDate: Date | null,
    windowEndDate: Date | null,
  ) {
    if (windowStartDate && startDate < windowStartDate) {
      throw new BadRequestException(
        `A data inicial está antes da janela da acomodação (${windowStartDate.toISOString().slice(0, 10)}).`,
      );
    }

    if (windowEndDate && endDate > windowEndDate) {
      throw new BadRequestException(
        `A data final está depois da janela da acomodação (${windowEndDate.toISOString().slice(0, 10)}).`,
      );
    }
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(2));
  }

  private distributeAmount(total: number, items: Array<{ id: string; weight: number }>) {
    const safeTotal = this.roundMoney(Math.max(0, total));
    const validItems = items.filter((item) => item.weight > 0);
    if (safeTotal <= 0 || validItems.length === 0) {
      return new Map<string, number>();
    }

    const weightSum = validItems.reduce((sum, item) => sum + item.weight, 0);
    if (weightSum <= 0) {
      return new Map<string, number>();
    }

    const distribution = new Map<string, number>();
    let allocated = 0;

    validItems.forEach((item, index) => {
      const isLast = index === validItems.length - 1;
      const amount = isLast
        ? this.roundMoney(safeTotal - allocated)
        : this.roundMoney((safeTotal * item.weight) / weightSum);
      const safeAmount = this.roundMoney(Math.max(0, amount));
      distribution.set(item.id, safeAmount);
      allocated = this.roundMoney(allocated + safeAmount);
    });

    return distribution;
  }

  private validateWeeklyRange(startDate: Date, endDate: Date) {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const isSundayToSunday = startDate.getUTCDay() === 0 && endDate.getUTCDay() === 0;
    if (diffDays <= 0 || diffDays % 7 !== 0 || !isSundayToSunday) {
      throw new BadRequestException(
        'Período semanal inválido: use intervalo múltiplo de 7 dias e datas de domingo a domingo',
      );
    }
    return diffDays / 7;
  }

  private calculateFinanceSummary(item: Pick<FinanceItemRow, 'amount' | 'transactions'>) {
    const totalAmount = this.toNumber(item.amount);
    const paidAmount = item.transactions
      .filter((transaction) => transaction.status === 'paid')
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);
    const pendingAmount = item.transactions
      .filter((transaction) => transaction.status === 'pending')
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);
    const remainingAmount = Math.max(0, this.roundMoney(totalAmount - paidAmount));
    const paidRate = totalAmount > 0 ? Number(((paidAmount / totalAmount) * 100).toFixed(2)) : 0;

    return {
      totalAmount,
      paidAmount: this.roundMoney(paidAmount),
      pendingAmount: this.roundMoney(pendingAmount),
      remainingAmount,
      paidRate,
    };
  }

  private withSummary(item: FinanceItemRowWithSummary) {
    const summary = this.calculateFinanceSummary(item);
    return {
      ...item,
      amount: summary.totalAmount,
      paidAmount: summary.paidAmount,
      pendingAmount: summary.pendingAmount,
      remainingAmount: summary.remainingAmount,
      paidRate: summary.paidRate,
      transactions: item.transactions.map((transaction) => ({
        ...transaction,
        amount: this.toNumber(transaction.amount),
      })),
    };
  }

  async createStandaloneAccommodation(dto: StandaloneCreateInput) {
    const pricing = await this.prisma.accommodationPricing.findUnique({
      where: { id: dto.accommodationPricingId },
      include: {
        accommodation: {
          select: { id: true, title: true, accommodationType: true },
        },
      },
    });
    if (!pricing) {
      throw new NotFoundException(
        `Pricing de acomodação ${dto.accommodationPricingId} não encontrado`,
      );
    }

    const startDate = this.toDateOnly(dto.startDate);
    const endDate = this.toDateOnly(dto.endDate);
    this.validateWindow(
      startDate,
      endDate,
      pricing.windowStartDate ?? null,
      pricing.windowEndDate ?? null,
    );

    const stayDays = this.calculateStayDays(startDate, endDate);
    this.validateMinimumStay(stayDays, pricing.minimumStayDays, pricing.accommodation?.title ?? 'acomodação');

    const isPricePerDay = this.toNumber(pricing.pricePerDay) > 0;
    const amount = isPricePerDay
      ? this.roundMoney(this.toNumber(pricing.pricePerDay) * stayDays)
      : this.roundMoney(this.toNumber(pricing.basePrice) * this.validateWeeklyRange(startDate, endDate));

    if (dto.enrollmentId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: dto.enrollmentId },
        select: { id: true },
      });
      if (!enrollment) {
        throw new NotFoundException(`Matrícula ${dto.enrollmentId} não encontrada`);
      }
    }

    const title =
      dto.title?.trim() || `Acomodação: ${pricing.accommodation?.title ?? 'Item de acomodação'}`;

    const item = await this.prisma.financeItem.create({
      data: {
        enrollmentId: dto.enrollmentId ?? null,
        itemType: 'accommodation',
        sourceType: 'standalone_accommodation',
        title,
        referenceId: pricing.id,
        startDate,
        endDate,
        amount,
        currency: pricing.currency,
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.withSummary({
      ...(item as FinanceItemRow),
      enrollment: null,
    } as FinanceItemRowWithSummary);
  }

  async linkEnrollment(financeItemId: string, enrollmentId: string | null) {
    const existing = await this.prisma.financeItem.findUnique({
      where: { id: financeItemId },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
        enrollment: {
          select: {
            id: true,
            status: true,
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
            institution: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
            course: { select: { id: true, program_name: true } },
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException(`Item financeiro ${financeItemId} não encontrado`);
    }

    if (enrollmentId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: { id: true },
      });
      if (!enrollment) {
        throw new NotFoundException(`Matrícula ${enrollmentId} não encontrada`);
      }
    }

    const updated = await this.prisma.financeItem.update({
      where: { id: financeItemId },
      data: { enrollmentId },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
        enrollment: {
          select: {
            id: true,
            status: true,
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
            institution: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
            course: { select: { id: true, program_name: true } },
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
      },
    });

    return this.withSummary(updated as FinanceItemRowWithSummary);
  }

  private async syncFromLatestQuote(enrollmentId: string) {
    const latestQuote = await this.prisma.enrollmentQuote.findFirst({
      where: { enrollmentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        currency: true,
        items: {
          select: {
            id: true,
            itemType: true,
            referenceId: true,
            startDate: true,
            endDate: true,
            amount: true,
            coursePricing: {
              select: {
                id: true,
                course: {
                  select: { program_name: true },
                },
              },
            },
            accommodationPricing: {
              select: {
                id: true,
                accommodation: {
                  select: { title: true, accommodationType: true },
                },
              },
            },
          },
        },
      },
    });

    if (!latestQuote || latestQuote.items.length === 0) return;

    const quoteItems = latestQuote.items;
    const quotedItemIds = quoteItems.map((item) => item.id);

    await this.prisma.$transaction(async (tx) => {
      for (const quoteItem of quoteItems) {
        const title =
          quoteItem.itemType === 'course'
            ? `Curso: ${(quoteItem.coursePricing?.course?.program_name ?? 'Item de curso')}`
            : `Acomodação: ${(quoteItem.accommodationPricing?.accommodation?.title ?? 'Item de acomodação')}`;

        await tx.financeItem.upsert({
          where: { quoteItemId: quoteItem.id },
          create: {
            enrollmentId,
            quoteItemId: quoteItem.id,
            itemType: quoteItem.itemType,
            sourceType: 'quote_item',
            title,
            referenceId: quoteItem.referenceId,
            startDate: quoteItem.startDate,
            endDate: quoteItem.endDate,
            amount: quoteItem.amount,
            currency: latestQuote.currency,
          },
          update: {
            title,
            referenceId: quoteItem.referenceId,
            startDate: quoteItem.startDate,
            endDate: quoteItem.endDate,
            amount: quoteItem.amount,
            currency: latestQuote.currency,
          },
        });
      }

      await tx.financeItem.deleteMany({
        where: {
          enrollmentId,
          sourceType: 'quote_item',
          quoteItemId: { notIn: quotedItemIds },
          transactions: { none: {} },
        },
      });
    });
  }

  private async getLatestPaidDownPayment(enrollmentId: string): Promise<EnrollmentDownPaymentRow | null> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        enrollmentId,
        type: 'down_payment',
        status: 'paid',
      },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        amount: true,
        currency: true,
        paidAt: true,
        createdAt: true,
      },
    });

    return payment as EnrollmentDownPaymentRow | null;
  }

  private async syncDownPaymentTransactions(enrollmentId: string) {
    const paidDownPayment = await this.getLatestPaidDownPayment(enrollmentId);
    if (!paidDownPayment) return;

    await this.syncFromLatestQuote(enrollmentId);

    const financeItems = await this.prisma.financeItem.findMany({
      where: { enrollmentId, sourceType: 'quote_item' },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (financeItems.length === 0) return;

    const paymentReference = `checkout_down_payment:${paidDownPayment.id}`;
    const paymentAmount = this.toNumber(paidDownPayment.amount);
    if (paymentAmount <= 0) return;

    const courseItems = financeItems.filter((item) => item.itemType === 'course');
    const accommodationItems = financeItems.filter((item) => item.itemType === 'accommodation');

    const courseTotal = this.roundMoney(
      courseItems.reduce((sum, item) => sum + this.toNumber(item.amount), 0),
    );
    const accommodationTotal = this.roundMoney(
      accommodationItems.reduce((sum, item) => sum + this.toNumber(item.amount), 0),
    );
    const total = this.roundMoney(courseTotal + accommodationTotal);
    if (total <= 0) return;

    let courseAllocation = 0;
    let accommodationAllocation = 0;
    if (courseTotal > 0 && accommodationTotal > 0) {
      courseAllocation = this.roundMoney((paymentAmount * courseTotal) / total);
      accommodationAllocation = this.roundMoney(paymentAmount - courseAllocation);
    } else if (courseTotal > 0) {
      courseAllocation = this.roundMoney(paymentAmount);
    } else if (accommodationTotal > 0) {
      accommodationAllocation = this.roundMoney(paymentAmount);
    }

    const allocationByItem = new Map<string, number>();
    const courseDistribution = this.distributeAmount(
      courseAllocation,
      courseItems.map((item) => ({ id: item.id, weight: this.toNumber(item.amount) })),
    );
    const accommodationDistribution = this.distributeAmount(
      accommodationAllocation,
      accommodationItems.map((item) => ({ id: item.id, weight: this.toNumber(item.amount) })),
    );

    for (const [id, amount] of courseDistribution) {
      allocationByItem.set(id, amount);
    }
    for (const [id, amount] of accommodationDistribution) {
      allocationByItem.set(id, amount);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of financeItems) {
        const alreadyPosted = item.transactions.some(
          (transaction) => transaction.providerReference === paymentReference,
        );
        if (alreadyPosted) continue;

        const allocatedAmount = this.roundMoney(allocationByItem.get(item.id) ?? 0);
        if (allocatedAmount <= 0) continue;

        const paidAmount = this.roundMoney(
          item.transactions
            .filter((transaction) => transaction.status === 'paid')
            .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0),
        );
        const remainingAmount = this.roundMoney(this.toNumber(item.amount) - paidAmount);
        const postAmount = this.roundMoney(Math.min(allocatedAmount, Math.max(0, remainingAmount)));
        if (postAmount <= 0) continue;

        await tx.financeTransaction.create({
          data: {
            financeItemId: item.id,
            amount: postAmount,
            currency: item.currency,
            status: 'paid',
            type: 'down_payment',
            provider: 'checkout',
            providerReference: paymentReference,
            paidAt: paidDownPayment.paidAt ?? paidDownPayment.createdAt,
          },
        });
      }
    });
  }

  async listByEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true },
    });
    if (!enrollment) {
      throw new NotFoundException(`Matrícula ${enrollmentId} não encontrada`);
    }

    await this.syncDownPaymentTransactions(enrollmentId);

    const initialItems = await this.prisma.financeItem.findMany({
      where: { enrollmentId: enrollment.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const hasItems = initialItems.length > 0;
    if (!hasItems) {
      await this.syncFromLatestQuote(enrollmentId);
    }

    const items = hasItems
      ? initialItems
      : await this.prisma.financeItem.findMany({
          where: { enrollmentId: enrollment.id },
          include: { transactions: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        });

    return items.map((item) => {
      return this.withSummary(item as FinanceItemRowWithSummary);
    });
  }

  async getById(id: string) {
    let item = await this.prisma.financeItem.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
        enrollment: {
          select: {
            id: true,
            status: true,
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
            institution: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
            course: { select: { id: true, program_name: true } },
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Item financeiro ${id} não encontrado`);
    }

    if (item.enrollmentId) {
      await this.syncDownPaymentTransactions(item.enrollmentId);
      item = await this.prisma.financeItem.findUnique({
        where: { id },
        include: {
          transactions: {
            orderBy: { createdAt: 'asc' },
          },
          enrollment: {
            select: {
              id: true,
              status: true,
              student: { select: { id: true, firstName: true, lastName: true, email: true } },
              institution: { select: { id: true, name: true } },
              school: { select: { id: true, name: true } },
              course: { select: { id: true, program_name: true } },
              accommodation: { select: { id: true, title: true, accommodationType: true } },
            },
          },
        },
      });

      if (!item) {
        throw new NotFoundException(`Item financeiro ${id} não encontrado`);
      }
    }

    return this.withSummary(item as FinanceItemRowWithSummary);
  }

  async createTransactions(
    itemId: string,
    dto: CreateFinanceTransactionDto,
  ) {
    const item = await this.prisma.financeItem.findUnique({
      where: { id: itemId },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!item) {
      throw new NotFoundException(`Item financeiro ${itemId} não encontrado`);
    }

    const totalAmount = this.toNumber(item.amount);
    const paidAmount = item.transactions
      .filter((transaction) => transaction.status === 'paid')
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);

    const remainingAmount = this.roundMoney(totalAmount - paidAmount);
    if (remainingAmount <= 0) {
      throw new BadRequestException('Este item já está totalmente liquidado.');
    }

    const installmentAmount = this.roundMoney(dto.installmentAmount);
    const installments = dto.installments;
    if (installmentAmount <= 0) {
      throw new BadRequestException('Valor de parcela inválido.');
    }

    const targetAmount = this.roundMoney(installmentAmount * installments);
    if (targetAmount - remainingAmount > 0.0001) {
      throw new BadRequestException(
        'A soma das parcelas não pode ultrapassar o valor pendente do item.',
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const rows: FinanceTransaction[] = [];
      const dueDate =
        typeof dto.dueDateOffsetDays === 'number'
          ? new Date(Date.now() + dto.dueDateOffsetDays * 24 * 60 * 60 * 1000)
          : null;

      for (let idx = 0; idx < installments; idx += 1) {
        const isLast = idx === installments - 1;
        const sumPrevious = installmentAmount * idx;
        const amount = isLast
          ? this.roundMoney(targetAmount - sumPrevious)
          : installmentAmount;

        rows.push(
          await tx.financeTransaction.create({
            data: {
              financeItemId: item.id,
              amount,
              currency: item.currency,
              status: 'pending',
              type: `parcela-${idx + 1}`,
              dueDate: dueDate ?? undefined,
            },
          }),
        );
      }

      return rows;
    });

    return {
      ...item,
      createdTransactions: created.map((transaction) => ({
        ...transaction,
        amount: this.toNumber(transaction.amount),
      })),
      remainingBefore: remainingAmount,
      remainingAfter: this.roundMoney(remainingAmount - targetAmount),
    };
  }

  async updateTransactionStatus(
    transactionId: string,
    dto: UpdateFinanceTransactionStatusDto,
  ) {
    const existing = await this.prisma.financeTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!existing) {
      throw new NotFoundException(`Transação ${transactionId} não encontrada`);
    }

    const data = {
      status: dto.status,
      paidAt:
        dto.status === 'paid'
          ? new Date()
          : dto.status === 'pending'
            ? null
            : existing.paidAt ?? null,
    };

    const updated = await this.prisma.financeTransaction.update({
      where: { id: transactionId },
      data,
    });

    return {
      ...updated,
      amount: this.toNumber(updated.amount),
    };
  }
}
