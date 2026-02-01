import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToDto(user);
  }

  private mapToDto(user: any): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      destination: {
        city: user.destinationCity,
        country: user.destinationCountry,
      },
      purpose: user.purpose,
      budget: {
        accommodation: user.accommodationBudget,
        course: user.courseBudget,
      },
      englishLevel: user.englishLevel,
      arrivalDate: user.arrivalDate,
      hasUnreadNotifications: user.hasUnreadNotifications,
      notificationCount: user.notificationCount,
    };
  }
}
