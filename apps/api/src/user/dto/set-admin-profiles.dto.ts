import { IsArray, IsString } from 'class-validator';

export class SetAdminProfilesDto {
  @IsArray()
  @IsString({ each: true })
  profileIds: string[];
}
