import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO for updating an existing user
 * All fields from CreateUserDto become optional
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
