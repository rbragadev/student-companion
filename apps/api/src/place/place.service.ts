import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { randomUUID } from 'node:crypto';

@Injectable()
export class PlaceService {
  constructor(private prisma: PrismaService) {}

  async create(createPlaceDto: CreatePlaceDto) {
    return this.prisma.place.create({
      data: {
        id: randomUUID(),
        ...createPlaceDto,
      },
    });
  }

  async findAll(category?: string) {
    const where = {
      isActive: true,
      ...(category && { category }),
    };

    return this.prisma.place.findMany({
      where,
      orderBy: [
        { isStudentFavorite: 'desc' },
        { rating: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    return this.prisma.place.findUnique({
      where: { id },
    });
  }

  async update(id: string, updatePlaceDto: UpdatePlaceDto) {
    return this.prisma.place.update({
      where: { id },
      data: updatePlaceDto,
    });
  }

  async remove(id: string) {
    return this.prisma.place.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
