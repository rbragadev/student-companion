import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCoursePricingDto } from './dto/create-course-pricing.dto';
import { UpdateCoursePricingDto } from './dto/update-course-pricing.dto';

@Injectable()
export class CoursePricingService {
  constructor(private readonly prisma: PrismaService) {}

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

  async resolvePrice(courseId: string, academicPeriodId: string) {
    const pricing = await this.prisma.coursePricing.findFirst({
      where: { courseId, academicPeriodId, isActive: true },
      include: {
        course: { select: { id: true, program_name: true, school: { select: { id: true, institutionId: true } } } },
        academicPeriod: { select: { id: true, name: true } },
      },
    });
    if (!pricing) {
      throw new NotFoundException(
        `Preço de curso não encontrado para courseId=${courseId} e academicPeriodId=${academicPeriodId}`,
      );
    }
    return pricing;
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
