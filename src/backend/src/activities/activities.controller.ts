import { Controller, Body, Param, ParseIntPipe, Get, Post, Patch, Delete } from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { Activity } from './entities/activity.entity.js';
import { ActivitiesService } from './activities.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Activity> {
    return await this.activitiesService.findById(id);
  }

  @Post()
  async create(@Body() createActivityDto: CreateActivityDto): Promise<Activity> {
    return await this.activitiesService.create(createActivityDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateActivityDto: UpdateActivityDto,
  ): Promise<Activity> {
    return await this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<DeleteResult> {
    return await this.activitiesService.remove(id);
  }
}
