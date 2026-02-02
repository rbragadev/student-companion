import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';

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
      orderBy: [{ isTopTrip: 'desc' }, { rating: 'desc' }],
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
}
