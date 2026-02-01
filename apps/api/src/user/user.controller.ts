import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService, UserWithPreferences } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserPreferences } from '@prisma/client';
import { CreateUserPreferencesDto } from './dto/create-user-preferences.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserWithPreferences> {
    return this.userService.findById(id);
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Post(':id/preferences')
  async createUserPreferences(
    @Param('id') id: string,
    @Body() preferencesData: CreateUserPreferencesDto,
  ): Promise<UserPreferences> {
    // Lógica para criar ou atualizar as preferências do usuário
    // Pode envolver chamar um método no UserService
    return this.userService.createPreferences(id, preferencesData); // Retorna o usuário atualizado com preferências
  }
}
