import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activitiesRepository: Repository<Activity>,
  ) {}

  async findById(id: number): Promise<Activity> {
    const activity = await this.activitiesRepository.findOneBy({ id });

    if (!activity) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    return activity;
  }

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const activity = this.activitiesRepository.create({
      ...createActivityDto,
      period: this.getCurrentPeriod(),
    });

    return this.activitiesRepository.save(activity);
  }

  async update(
    id: number,
    updateActivityDto: UpdateActivityDto,
  ): Promise<Activity> {
    const activity = await this.findById(id);
    Object.assign(activity, updateActivityDto);

    return this.activitiesRepository.save(activity);
  }

  async remove(id: number): Promise<void> {
    const activity = await this.findById(id);

    await this.activitiesRepository.remove(activity);
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const semester = now.getMonth() < 6 ? 1 : 2;

    return `${year}-${semester}`;
  }
}
