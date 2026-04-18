import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ClassGroupService } from './class-group.service';
import { CreateClassGroupDto } from './dto/create-class-group.dto';
import { UpdateClassGroupDto } from './dto/update-class-group.dto';

@Controller('class-group')
export class ClassGroupController {
  constructor(private readonly classGroupService: ClassGroupService) {}

  @Post()
  create(@Body() dto: CreateClassGroupDto) {
    return this.classGroupService.create(dto);
  }

  @Get()
  findAll(@Query('unitId') unitId?: string, @Query('periodId') periodId?: string) {
    return this.classGroupService.findAll(unitId, periodId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classGroupService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassGroupDto) {
    return this.classGroupService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classGroupService.remove(id);
  }
}
