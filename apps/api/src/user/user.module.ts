import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserPreferencesController } from './user-preferences.controller';

@Module({
  controllers: [UserController, UserPreferencesController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
