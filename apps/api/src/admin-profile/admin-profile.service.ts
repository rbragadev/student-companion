import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminProfileDto } from './dto/create-admin-profile.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@Injectable()
export class AdminProfileService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.adminProfile.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { permissions: true, users: true } },
      },
    });
  }

  async findById(id: string) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        users: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, role: true },
            },
          },
        },
      },
    });

    if (!profile) throw new NotFoundException(`Perfil ${id} não encontrado`);
    return profile;
  }

  create(dto: CreateAdminProfileDto) {
    return this.prisma.adminProfile.create({ data: dto });
  }

  async update(id: string, dto: UpdateAdminProfileDto) {
    await this.findById(id);
    return this.prisma.adminProfile.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const profile = await this.findById(id);
    if (profile.isSystem) {
      throw new BadRequestException('Perfis de sistema não podem ser excluídos');
    }
    return this.prisma.adminProfile.delete({ where: { id } });
  }

  async setPermissions(id: string, permissionIds: string[]) {
    await this.findById(id);
    const uniquePermissionIds = [...new Set(permissionIds)];

    if (uniquePermissionIds.length > 0) {
      const existingPermissions = await this.prisma.permission.findMany({
        where: { id: { in: uniquePermissionIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingPermissions.map((p) => p.id));
      const missingIds = uniquePermissionIds.filter((permissionId) => !existingIds.has(permissionId));

      if (missingIds.length > 0) {
        throw new BadRequestException(`Permissões inválidas: ${missingIds.join(', ')}`);
      }
    }

    await this.prisma.adminProfilePermission.deleteMany({ where: { profileId: id } });

    if (uniquePermissionIds.length > 0) {
      await this.prisma.adminProfilePermission.createMany({
        data: uniquePermissionIds.map((permissionId) => ({ profileId: id, permissionId })),
      });
    }

    return this.findById(id);
  }
}
