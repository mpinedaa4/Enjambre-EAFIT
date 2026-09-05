import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';

import { Activity } from './entities/activity.entity.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import { GroupsService } from '../groups/groups.service.js';
import { CommitteesService } from '../committees/committees.service.js';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activitiesRepository: Repository<Activity>,
    private readonly groupsService: GroupsService,
    private readonly committeesService: CommitteesService,
  ) {}

  async findById(id: number): Promise<Activity> {
    const activity = await this.activitiesRepository.findOneBy({ id });

    if (!activity) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    return activity;
  }

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const { groupId, committeeId, ...activityData } = createActivityDto;
    const group = await this.groupsService.findById(groupId);
    const committee = await this.committeesService.findById(committeeId);

    const activity = this.activitiesRepository.create({
      ...activityData,
      period: this.getCurrentPeriod(),
      group,
      committee,
    });

    return await this.activitiesRepository.save(activity);
  }

  async update(
    id: number,
    updateActivityDto: UpdateActivityDto,
  ): Promise<Activity> {
    const { groupId, committeeId, ...activityData } = updateActivityDto;
    
    const activity = await this.activitiesRepository.preload({
      id,
      ...activityData,
    });

    if (!activity) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    if (groupId) {
      const group = await this.groupsService.findById(groupId);
      activity.group = group;
    }

    if (committeeId) {
      const committee = await this.committeesService.findById(committeeId);
      activity.committee = committee;
    }

    return await this.activitiesRepository.save(activity);
  }

  async remove(id: number): Promise<DeleteResult> {
    return await this.activitiesRepository.delete(id);
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const semester = now.getMonth() < 6 ? 1 : 2;

    return `${year}-${semester}`;
  }
}
