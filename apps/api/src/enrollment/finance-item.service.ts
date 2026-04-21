import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, FinanceTransaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { UpdateFinanceTransactionStatusDto } from './dto/update-finance-transaction-status.dto';

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
  enrollmentId: string;
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
};

@Injectable()
export class FinanceItemService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(2));
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

  async listByEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true },
    });
    if (!enrollment) {
      throw new NotFoundException(`Matrícula ${enrollmentId} não encontrada`);
    }

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
    });
  }

  async getById(id: string) {
    const item = await this.prisma.financeItem.findUnique({
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

    if (!item || !item.enrollment) {
      throw new NotFoundException(`Item financeiro ${id} não encontrado`);
    }

    const summary = this.calculateFinanceSummary(item);

    return {
      ...item,
      amount: summary.totalAmount,
      paidAmount: summary.paidAmount,
      pendingAmount: summary.pendingAmount,
      remainingAmount: summary.remainingAmount,
      paidRate: summary.paidRate,
      enrollment: item.enrollment as FinanceItemEnrollment,
      transactions: item.transactions.map((transaction) => ({
        ...transaction,
        amount: this.toNumber(transaction.amount),
      })),
    };
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
