import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDocumentDto } from './dto/create-enrollment-document.dto';
import { UpdateEnrollmentDocumentDto } from './dto/update-enrollment-document.dto';

@Injectable()
export class EnrollmentDocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnrollmentDocumentDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      select: { id: true },
    });
    if (!enrollment) throw new NotFoundException(`Matrícula ${dto.enrollmentId} não encontrada`);

    return this.prisma.enrollmentDocument.create({
      data: {
        enrollmentId: dto.enrollmentId,
        type: dto.type,
        fileUrl: dto.fileUrl,
        status: dto.status ?? 'pending',
        adminNote: dto.adminNote,
      },
    });
  }

  findAll(enrollmentId?: string) {
    return this.prisma.enrollmentDocument.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateEnrollmentDocumentDto) {
    const current = await this.prisma.enrollmentDocument.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!current) throw new NotFoundException(`Documento ${id} não encontrado`);

    return this.prisma.enrollmentDocument.update({
      where: { id },
      data: {
        type: dto.type,
        fileUrl: dto.fileUrl,
        status: dto.status,
        adminNote: dto.adminNote,
      },
    });
  }
}
