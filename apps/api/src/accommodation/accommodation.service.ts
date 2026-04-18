import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';
import { UpsertSchoolAccommodationRecommendationDto } from './dto/upsert-school-accommodation-recommendation.dto';

@Injectable()
export class AccommodationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAccommodationDto: CreateAccommodationDto) {
    return this.prisma.accommodation.create({
      data: {
        id: randomUUID(),
        ...createAccommodationDto,
      },
    });
  }

  async findAll() {
    return this.prisma.accommodation.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ isTopTrip: 'desc' }, { score: 'desc' }, { rating: 'desc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.accommodation.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateAccommodationDto: UpdateAccommodationDto) {
    return this.prisma.accommodation.update({
      where: { id },
      data: updateAccommodationDto,
    });
  }

  async findRecommendedBySchool(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });
    if (!school) {
      throw new NotFoundException(`Escola ${schoolId} não encontrada`);
    }

    const recommendations = await this.prisma.schoolAccommodationRecommendation.findMany({
      where: {
        schoolId,
        isRecommended: true,
        accommodation: { isActive: true },
      },
      include: {
        accommodation: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return recommendations.map((item) => ({
      ...item.accommodation,
      isRecommendedBySchool: item.isRecommended,
      recommendationPriority: item.priority,
      recommendationBadge: item.badgeLabel ?? item.accommodation.badges[0] ?? null,
    }));
  }

  async findUpsellByEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, schoolId: true },
    });
    if (!enrollment) {
      throw new NotFoundException(`Matrícula ${enrollmentId} não encontrada`);
    }
    return this.findRecommendedBySchool(enrollment.schoolId);
  }

  async findSchoolRecommendations(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });
    if (!school) {
      throw new NotFoundException(`Escola ${schoolId} não encontrada`);
    }

    const accommodations = await this.prisma.accommodation.findMany({
      where: { isActive: true },
      include: {
        schoolRecommendations: {
          where: { schoolId },
          take: 1,
        },
      },
      orderBy: [{ isTopTrip: 'desc' }, { score: 'desc' }, { rating: 'desc' }],
    });

    return accommodations.map((item) => {
      const recommendation = item.schoolRecommendations[0];
      return {
        ...item,
        isRecommendedBySchool: recommendation?.isRecommended ?? false,
        recommendationPriority: recommendation?.priority ?? 0,
        recommendationBadge: recommendation?.badgeLabel ?? null,
      };
    });
  }

  async upsertSchoolRecommendation(
    schoolId: string,
    accommodationId: string,
    dto: UpsertSchoolAccommodationRecommendationDto,
  ) {
    const [school, accommodation] = await Promise.all([
      this.prisma.school.findUnique({
        where: { id: schoolId },
        select: { id: true },
      }),
      this.prisma.accommodation.findUnique({
        where: { id: accommodationId },
        select: { id: true },
      }),
    ]);

    if (!school) {
      throw new NotFoundException(`Escola ${schoolId} não encontrada`);
    }
    if (!accommodation) {
      throw new NotFoundException(`Acomodação ${accommodationId} não encontrada`);
    }

    const recommendation =
      await this.prisma.schoolAccommodationRecommendation.upsert({
        where: {
          schoolId_accommodationId: {
            schoolId,
            accommodationId,
          },
        },
        create: {
          schoolId,
          accommodationId,
          isRecommended: dto.isRecommended ?? true,
          priority: dto.priority ?? 0,
          badgeLabel: dto.badgeLabel?.trim() ? dto.badgeLabel.trim() : null,
        },
        update: {
          ...(dto.isRecommended !== undefined ? { isRecommended: dto.isRecommended } : {}),
          ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
          ...(dto.badgeLabel !== undefined
            ? { badgeLabel: dto.badgeLabel.trim() ? dto.badgeLabel.trim() : null }
            : {}),
        },
      });

    return {
      ...recommendation,
      schoolId,
      accommodationId,
    };
  }
}
