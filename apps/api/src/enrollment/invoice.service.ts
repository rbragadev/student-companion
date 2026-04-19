import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Invoice } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }

  private generateInvoiceNumber() {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const suffix = Math.floor(Math.random() * 90000 + 10000);
    return `INV-${y}${m}${d}-${suffix}`;
  }

  private async resolveQuoteContext(dto: CreateInvoiceDto) {
    const hasEnrollmentId = Boolean(dto.enrollmentId);
    const hasQuoteId = Boolean(dto.enrollmentQuoteId);
    if (!hasEnrollmentId && !hasQuoteId) {
      throw new BadRequestException('Informe enrollmentId ou enrollmentQuoteId para gerar invoice');
    }

    let enrollmentId = dto.enrollmentId ?? null;
    let quoteId = dto.enrollmentQuoteId ?? null;

    let quote = quoteId
      ? await this.prisma.enrollmentQuote.findUnique({
          where: { id: quoteId },
          include: { items: true },
        })
      : null;

    if (quoteId && !quote) {
      throw new NotFoundException(`Quote ${quoteId} não encontrada`);
    }

    if (!quote && enrollmentId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: {
          enrollmentIntentId: true,
        },
      });
      if (!enrollment) {
        throw new NotFoundException(`Matrícula ${enrollmentId} não encontrada`);
      }
      quote = await this.prisma.enrollmentQuote.findFirst({
        where: { enrollmentIntentId: enrollment.enrollmentIntentId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      quoteId = quote?.id ?? null;
    }

    if (!enrollmentId && quote?.enrollmentIntentId) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { enrollmentIntentId: quote.enrollmentIntentId },
        select: { id: true },
      });
      enrollmentId = enrollment?.id ?? null;
    }

    return { quote, enrollmentId, quoteId };
  }

  private buildItemsFromQuote(quote: {
    courseAmount: Prisma.Decimal;
    accommodationAmount: Prisma.Decimal;
    fees: Prisma.Decimal;
    discounts: Prisma.Decimal;
  }) {
    const items: Array<{ description: string; type: string; amount: number }> = [];
    const course = this.toNumber(quote.courseAmount);
    const accommodation = this.toNumber(quote.accommodationAmount);
    const fees = this.toNumber(quote.fees);
    const discounts = this.toNumber(quote.discounts);

    if (course > 0) {
      items.push({
        description: 'Curso',
        type: 'course',
        amount: course,
      });
    }

    if (accommodation > 0) {
      items.push({
        description: 'Acomodação',
        type: 'accommodation',
        amount: accommodation,
      });
    }

    if (fees > 0) {
      items.push({
        description: 'Taxas administrativas',
        type: 'fee',
        amount: fees,
      });
    }

    if (discounts > 0) {
      items.push({
        description: 'Desconto aplicado',
        type: 'discount',
        amount: -discounts,
      });
    }

    return items;
  }

  async reconcileStatus(invoiceId: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} não encontrada`);
    }

    if (invoice.status === 'cancelled') return invoice;

    const paid = await this.prisma.payment.aggregate({
      where: { invoiceId, status: 'paid' },
      _sum: { amount: true },
    });
    const paidAmount = this.toNumber(paid._sum.amount);
    const invoiceTotal = this.toNumber(invoice.totalAmount);

    let nextStatus: string = invoice.status;
    if (paidAmount >= invoiceTotal && invoiceTotal > 0) {
      nextStatus = 'paid';
    } else if (invoice.dueDate < new Date()) {
      nextStatus = 'overdue';
    } else if (invoice.status === 'draft') {
      nextStatus = 'draft';
    } else {
      nextStatus = 'pending';
    }

    if (nextStatus === invoice.status) {
      return invoice;
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: nextStatus },
    });
  }

  async findAll(filters?: {
    status?: string;
    institutionId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: Prisma.InvoiceWhereInput = {
      status: filters?.status,
      enrollment: filters?.institutionId ? { institutionId: filters.institutionId } : undefined,
      dueDate:
        filters?.dateFrom || filters?.dateTo
          ? {
              gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
              lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
            }
          : undefined,
    };

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        items: true,
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
        enrollmentQuote: {
          select: {
            id: true,
            type: true,
            downPaymentAmount: true,
            remainingAmount: true,
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
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            status: true,
            type: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    });

    for (const invoice of invoices) {
      if (invoice.status !== 'paid' && invoice.status !== 'cancelled') {
        await this.reconcileStatus(invoice.id);
      }
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        items: true,
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
        enrollmentQuote: {
          select: {
            id: true,
            type: true,
            downPaymentAmount: true,
            remainingAmount: true,
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
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            status: true,
            type: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        enrollment: {
          select: {
            id: true,
            status: true,
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
            institution: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true } },
            course: { select: { id: true, program_name: true } },
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
        enrollmentQuote: {
          include: {
            items: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} não encontrada`);
    }

    if (invoice.status !== 'paid' && invoice.status !== 'cancelled') {
      await this.reconcileStatus(id);
      return this.findOne(id);
    }

    return invoice;
  }

  async create(dto: CreateInvoiceDto) {
    const { quote, enrollmentId, quoteId } = await this.resolveQuoteContext(dto);

    if (!quote) {
      throw new BadRequestException(
        'Não foi possível gerar invoice sem quote. Gere o pacote antes de faturar.',
      );
    }

    const totalAmount = this.toNumber(quote.totalAmount);
    if (totalAmount <= 0) {
      throw new BadRequestException('Total da quote inválido para faturamento');
    }

    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('dueDate inválida');
    }

    const number = this.generateInvoiceNumber();
    const items = this.buildItemsFromQuote(quote);

    return this.prisma.invoice.create({
      data: {
        number,
        enrollmentId,
        enrollmentQuoteId: quoteId,
        totalAmount,
        dueDate,
        status: dto.status ?? 'pending',
        currency: quote.currency,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
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
        enrollmentQuote: {
          select: { id: true, type: true, downPaymentAmount: true, remainingAmount: true },
        },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto) {
    const current = await this.prisma.invoice.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Invoice ${id} não encontrada`);
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        items: true,
        enrollment: {
          select: {
            id: true,
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
            institution: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
            course: { select: { id: true, program_name: true } },
          },
        },
        payments: true,
      },
    });

    return updated;
  }
}
