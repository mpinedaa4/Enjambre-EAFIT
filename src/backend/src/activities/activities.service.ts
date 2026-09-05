import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';

import { Activity } from './entities/activity.entity.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import { getCurrentPeriod } from '../utils/period.util.js';
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
    const committee = committeeId === null
      ? null
      : await this.committeesService.findById(committeeId);
    
    if (!group) {
      throw new NotFoundException(`Group with id ${groupId} not found`);
    }

    if (committeeId !== null && !committee) {
      throw new NotFoundException(`Committee with id ${committeeId} not found`);
    }

    const activity = this.activitiesRepository.create({
      ...activityData,
      period: getCurrentPeriod(),
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

    if (committeeId !== undefined) {
      const committee = committeeId === null
      ? null
      : await this.committeesService.findById(committeeId);
      activity.committee = committee;
    }

    return await this.activitiesRepository.save(activity);
  }

  async remove(id: number): Promise<DeleteResult> {
    return await this.activitiesRepository.delete(id);
  }
}
