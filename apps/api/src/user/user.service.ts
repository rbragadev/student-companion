import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User, UserPreferences } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserPreferencesDto } from './dto/create-user-preferences.dto';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

export type UserWithPreferences = User & {
  preferences: UserPreferences | null;
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly adminUserInclude = {
    adminProfiles: {
      include: { profile: { select: { id: true, name: true, label: true } } },
    },
  } as const;

  async findById(id: string): Promise<UserWithPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { preferences: true },
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  findAdminUsers() {
    return this.prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
      orderBy: { createdAt: 'asc' },
      include: this.adminUserInclude,
    });
  }

  findStudents() {
    return this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      orderBy: { createdAt: 'asc' },
      include: {
        preferences: true,
      },
    });
  }

  async findAdminUserById(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
      include: this.adminUserInclude,
    });
    if (!user) throw new NotFoundException(`Usuário admin ${userId} não encontrado`);
    return user;
  }

  async getEffectivePermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminProfiles: {
          include: {
            profile: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const keys = new Set<string>();
    for (const up of user.adminProfiles) {
      for (const pp of up.profile.permissions) {
        keys.add(pp.permission.key);
      }
    }

    return Array.from(keys);
  }

  async setAdminProfiles(userId: string, profileIds: string[]) {
    const user = await this.findById(userId);
    if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
      throw new BadRequestException('Somente usuários ADMIN/SUPER_ADMIN podem receber perfis');
    }

    const uniqueProfileIds = [...new Set(profileIds)];

    if (uniqueProfileIds.length > 0) {
      const existingProfiles = await this.prisma.adminProfile.findMany({
        where: { id: { in: uniqueProfileIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingProfiles.map((profile) => profile.id));
      const missingIds = uniqueProfileIds.filter((profileId) => !existingIds.has(profileId));

      if (missingIds.length > 0) {
        throw new BadRequestException(`Perfis inválidos: ${missingIds.join(', ')}`);
      }
    }

    await this.prisma.userAdminProfile.deleteMany({ where: { userId } });

    if (uniqueProfileIds.length > 0) {
      await this.prisma.userAdminProfile.createMany({
        data: uniqueProfileIds.map((profileId) => ({ userId, profileId })),
      });
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: this.adminUserInclude,
    });
  }

  async createAdminUser(dto: CreateAdminUserDto) {
    const role = dto.role ?? Role.ADMIN;
    if (role === Role.STUDENT) {
      throw new BadRequestException('Usuário administrativo não pode ter role STUDENT');
    }

    const profileIds = dto.profileIds ?? [];
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { password: _password, profileIds: _profileIds, ...baseData } = dto;

    const createdUser = await this.prisma.user.create({
      data: {
        ...baseData,
        id: randomUUID(),
        role,
        passwordHash,
      },
    });

    if (profileIds.length > 0) {
      await this.setAdminProfiles(createdUser.id, profileIds);
    }

    return this.findAdminUserById(createdUser.id);
  }

  async updateAdminUser(userId: string, dto: UpdateAdminUserDto) {
    await this.findAdminUserById(userId);

    const { password, profileIds, ...baseData } = dto;
    const data: Record<string, unknown> = { ...baseData };

    if (dto.role === Role.STUDENT) {
      throw new BadRequestException('Usuário administrativo não pode ter role STUDENT');
    }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    if (profileIds) {
      await this.setAdminProfiles(userId, profileIds);
    }

    return this.findAdminUserById(userId);
  }

  async removeAdminUser(userId: string) {
    const user = await this.findAdminUserById(userId);
    await this.prisma.user.delete({ where: { id: userId } });
    return { id: user.id, email: user.email };
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data: { ...data, id: randomUUID() } });
  }

  async createPreferences(
    userId: string,
    data: CreateUserPreferencesDto,
  ): Promise<UserPreferences> {
    return this.prisma.userPreferences.create({ data: { ...data, userId } });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data });
  }
}
