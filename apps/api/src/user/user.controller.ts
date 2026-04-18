import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { UserService, UserWithPreferences } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserPreferencesDto } from './dto/create-user-preferences.dto';
import { SetAdminProfilesDto } from './dto/set-admin-profiles.dto';
import { User, UserPreferences } from '@prisma/client';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('admin')
  findAdminUsers() {
    return this.userService.findAdminUsers();
  }

  @Get('student')
  findStudents() {
    return this.userService.findStudents();
  }

  @Get('admin/:id')
  findAdminUserById(@Param('id') id: string) {
    return this.userService.findAdminUserById(id);
  }

  @Post('admin')
  createAdminUser(@Body() dto: CreateAdminUserDto) {
    return this.userService.createAdminUser(dto);
  }

  @Patch('admin/:id')
  updateAdminUser(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.userService.updateAdminUser(id, dto);
  }

  @Delete('admin/:id')
  removeAdminUser(@Param('id') id: string) {
    return this.userService.removeAdminUser(id);
  }

  @Get(':id')
  getUser(@Param('id') id: string): Promise<UserWithPreferences> {
    return this.userService.findById(id);
  }

  @Get(':id/permissions')
  getPermissions(@Param('id') id: string): Promise<string[]> {
    return this.userService.getEffectivePermissions(id);
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Post(':id/preferences')
  createUserPreferences(
    @Param('id') id: string,
    @Body() preferencesData: CreateUserPreferencesDto,
  ): Promise<UserPreferences> {
    return this.userService.createPreferences(id, preferencesData);
  }

  @Put(':id/admin-profiles')
  setAdminProfiles(@Param('id') id: string, @Body() dto: SetAdminProfilesDto) {
    return this.userService.setAdminProfiles(id, dto.profileIds);
  }
}
