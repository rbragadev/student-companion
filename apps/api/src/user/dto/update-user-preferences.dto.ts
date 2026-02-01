import { PartialType } from '@nestjs/mapped-types';
import { CreateUserPreferencesDto } from './create-user-preferences.dto';

/**
 * DTO for updating user preferences
 * All fields from CreateUserPreferencesDto become optional
 */
export class UpdateUserPreferencesDto extends PartialType(CreateUserPreferencesDto) {}
