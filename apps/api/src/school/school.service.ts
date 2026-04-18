import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class SchoolService {

    constructor(private readonly prisma: PrismaService) { }

    private async ensureInstitutionExists(institutionId: string) {
        const institution = await this.prisma.institution.findUnique({
            where: { id: institutionId },
        });

        if (!institution) {
            throw new NotFoundException(`Instituição ${institutionId} não encontrada`);
        }
    }

    async createSchool(data: CreateSchoolDto) {
        await this.ensureInstitutionExists(data.institutionId);

        return this.prisma.school.create({
            data: { ...data, id: randomUUID() },
        });
    }

    async getAllSchools() {
        return this.prisma.school.findMany({
            orderBy: { name: 'asc' },
            include: {
                institution: { select: { id: true, name: true } },
                _count: { select: { course: true } },
            },
        });
    }

    async getSchoolById(id: string) {
        const school = await this.prisma.school.findUnique({
            where: { id },
            include: {
                institution: { select: { id: true, name: true } },
                course: { orderBy: { program_name: 'asc' } },
            },
        });
        if (!school) throw new NotFoundException(`Escola ${id} não encontrada`);
        return school;
    }

    async updateSchool(id: string, data: UpdateSchoolDto) {
        await this.getSchoolById(id);

        if (data.institutionId) {
            await this.ensureInstitutionExists(data.institutionId);
        }

        return this.prisma.school.update({
            where: { id },
            data,
        });
    }

    async deleteSchool(id: string) {
        await this.getSchoolById(id);
        return this.prisma.school.delete({
            where: { id },
        });
    }
}
