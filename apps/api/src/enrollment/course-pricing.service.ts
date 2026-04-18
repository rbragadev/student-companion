import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCoursePricingDto } from './dto/create-course-pricing.dto';
import { UpdateCoursePricingDto } from './dto/update-course-pricing.dto';

@Injectable()
export class CoursePricingService {
  constructor(private readonly prisma: PrismaService) {}

  private parseIsoDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
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

  async create(dto: CreateCoursePricingDto) {
    const [course, period] = await Promise.all([
      this.prisma.course.findUnique({ where: { id: dto.courseId }, select: { id: true } }),
      this.prisma.academicPeriod.findUnique({
        where: { id: dto.academicPeriodId },
        select: { id: true, classGroup: { select: { courseId: true } } },
      }),
    ]);

    if (!course) throw new NotFoundException(`Curso ${dto.courseId} não encontrado`);
    if (!period) throw new NotFoundException(`Período ${dto.academicPeriodId} não encontrado`);
    if (period.classGroup.courseId !== dto.courseId) {
      throw new BadRequestException('Período não pertence ao curso informado');
    }

    return this.prisma.coursePricing.upsert({
      where: {
        courseId_academicPeriodId: {
          courseId: dto.courseId,
          academicPeriodId: dto.academicPeriodId,
        },
      },
      create: {
        courseId: dto.courseId,
        academicPeriodId: dto.academicPeriodId,
        duration: dto.duration,
        basePrice: dto.basePrice,
        currency: dto.currency ?? 'CAD',
        isActive: dto.isActive ?? true,
      },
      update: {
        duration: dto.duration,
        basePrice: dto.basePrice,
        currency: dto.currency ?? 'CAD',
        isActive: dto.isActive ?? true,
      },
      include: {
        course: { select: { id: true, program_name: true } },
        academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
      },
    });
  }

  findAll(filters?: { courseId?: string; academicPeriodId?: string; isActive?: string }) {
    return this.prisma.coursePricing.findMany({
      where: {
        courseId: filters?.courseId,
        academicPeriodId: filters?.academicPeriodId,
        isActive:
          filters?.isActive === undefined
            ? undefined
            : filters.isActive === 'true'
              ? true
              : filters.isActive === 'false'
                ? false
                : undefined,
      },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        course: { select: { id: true, program_name: true } },
        academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
      },
    });
  }

  async resolvePrice(
    courseId: string,
    academicPeriodId: string,
    options?: { startDate?: string; endDate?: string },
  ) {
    const pricing = await this.prisma.coursePricing.findFirst({
      where: { courseId, academicPeriodId, isActive: true },
      include: {
        course: {
          select: {
            id: true,
            program_name: true,
            period_type: true,
            school: { select: { id: true, institutionId: true } },
          },
        },
        academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
      },
    });
    if (!pricing) {
      throw new NotFoundException(
        `Preço de curso não encontrado para courseId=${courseId} e academicPeriodId=${academicPeriodId}`,
      );
    }

    const startDate = this.parseIsoDate(options?.startDate);
    const endDate = this.parseIsoDate(options?.endDate);
    let weeks = 0;
    let calculatedAmount = Number(pricing.basePrice);
    let pricingLabel = 'total price';

    if (pricing.course.period_type === 'weekly') {
      if (!startDate || !endDate) {
        throw new BadRequestException('startDate e endDate são obrigatórios para cursos weekly');
      }
      weeks = this.validateWeeklyRange(startDate, endDate);
      calculatedAmount = Number((Number(pricing.basePrice) * weeks).toFixed(2));
      pricingLabel = 'per week';
    } else {
      if (startDate && endDate) {
        if (startDate < pricing.academicPeriod.startDate || endDate > pricing.academicPeriod.endDate) {
          throw new BadRequestException(
            'Período fixo inválido: datas fora da janela do período acadêmico',
          );
        }
      }
    }

    return {
      ...pricing,
      calculatedAmount,
      weeks,
      pricingLabel,
    };
  }

  async update(id: string, dto: UpdateCoursePricingDto) {
    const current = await this.prisma.coursePricing.findUnique({
      where: { id },
      include: { academicPeriod: { select: { classGroup: { select: { courseId: true } } } } },
    });
    if (!current) throw new NotFoundException(`Course pricing ${id} não encontrado`);

    const courseId = dto.courseId ?? current.courseId;
    const academicPeriodId = dto.academicPeriodId ?? current.academicPeriodId;

    if (dto.courseId || dto.academicPeriodId) {
      const period = await this.prisma.academicPeriod.findUnique({
        where: { id: academicPeriodId },
        select: { id: true, classGroup: { select: { courseId: true } } },
      });
      if (!period) throw new NotFoundException(`Período ${academicPeriodId} não encontrado`);
      if (period.classGroup.courseId !== courseId) {
        throw new BadRequestException('Período não pertence ao curso informado');
      }
    }

    return this.prisma.coursePricing.update({
      where: { id },
      data: {
        courseId,
        academicPeriodId,
        duration: dto.duration,
        basePrice: dto.basePrice,
        currency: dto.currency,
        isActive: dto.isActive,
      },
      include: {
        course: { select: { id: true, program_name: true } },
        academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
      },
    });
  }
}
