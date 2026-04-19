import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';

@Controller()
export class UserPreferencesController {
  constructor(private readonly userService: UserService) {}

  @Get('user-preferences')
  getPreferences(@Query('userId') userId: string) {
    return this.userService.findPreferences(userId);
  }

  @Patch('user-preferences')
  updatePreferences(
    @Query('userId') userId: string,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    return this.userService.updatePreferences(userId, dto);
  }

  @Get('preferences/options')
  getOptions() {
    return this.userService.getPreferenceOptions();
  }
}
