import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserPreferences } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Tipo que representa User com preferences incluídas
export type UserWithPreferences = User & {
  preferences: UserPreferences | null;
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserWithPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
      }
      
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(data: CreateUserDto): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return user;
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    await this.findById(id);
    return this.prisma.user.update({ 
      where: { id }, 
      data 
    });
  }
}
