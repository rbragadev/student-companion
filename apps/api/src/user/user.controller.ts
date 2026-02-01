import { Controller, Get, Param } from '@nestjs/common';
import { UserService, UserWithPreferences } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserWithPreferences> {
    return this.userService.findById(id);
  }
}
