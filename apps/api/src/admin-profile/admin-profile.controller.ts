import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { AdminProfileService } from './admin-profile.service';
import { CreateAdminProfileDto } from './dto/create-admin-profile.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';

@Controller('admin-profile')
export class AdminProfileController {
  constructor(private readonly adminProfileService: AdminProfileService) {}

  @Get()
  findAll() {
    return this.adminProfileService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.adminProfileService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateAdminProfileDto) {
    return this.adminProfileService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminProfileDto) {
    return this.adminProfileService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminProfileService.remove(id);
  }

  @Put(':id/permissions')
  setPermissions(@Param('id') id: string, @Body() dto: SetPermissionsDto) {
    return this.adminProfileService.setPermissions(id, dto.permissionIds);
  }
}
