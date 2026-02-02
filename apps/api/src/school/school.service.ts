import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class SchoolService {

    constructor(private readonly prisma: PrismaService) { }

    async createSchool(data: CreateSchoolDto) {
        return this.prisma.school.create({
            data: {...data, id:randomUUID()},
        });
    }

    async getAllSchools() {
        return this.prisma.school.findMany();
    }

    async getSchoolById(id: string) {
        return this.prisma.school.findUnique({
            where: { id },
        });
    }
}
