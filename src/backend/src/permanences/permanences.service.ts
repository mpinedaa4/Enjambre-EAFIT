import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';

import { Permanence } from './entities/permanence.entity.js';
import { CreatePermanenceDto } from './dto/create-permanence.dto.js';
import { UpdatePermanenceDto } from './dto/update-permanence.dto.js';
import { MembersService } from '../members/members.service.js';
import { ActivitiesService } from '../activities/activities.service.js';

@Injectable()
export class PermanencesService {
  constructor(
    @InjectRepository(Permanence)
    private readonly permanencesRepository: Repository<Permanence>,
    private readonly membersService: MembersService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async findById(id: number): Promise<Permanence> {
    const permanence = await this.permanencesRepository.findOneBy({ id });

    if (!permanence) {
      throw new NotFoundException(`Permanence with id ${id} not found`);
    }

    return permanence;
  }

  async findByMemberAndActivity(memberId: number, activityId: number): Promise<Permanence | null> {
    return await this.permanencesRepository.findOne({
      where: {
        member: { id: memberId },
        activity: { id: activityId },
      }
    });
  }

  async create(createPermanenceDto: CreatePermanenceDto): Promise<Permanence> {
    const { memberId, activityId, ...permanenceData } = createPermanenceDto;
    const existingPermanence = await this.findByMemberAndActivity(memberId, activityId);

    if (existingPermanence) {
      throw new ConflictException(
        `Permanence for member ${memberId} and activity ${activityId} already exists`,
      );
    }

    const member = await this.membersService.findById(memberId);
    const activity = await this.activitiesService.findById(activityId);

    const permanence = this.permanencesRepository.create({
      ...permanenceData,
      member,
      activity,
    });

    return await this.permanencesRepository.save(permanence);
  }

  async update(
    id: number,
    updatePermanenceDto: UpdatePermanenceDto,
  ): Promise<Permanence> {
    const { memberId, activityId, ...permanenceData } = updatePermanenceDto;
    const permanence = await this.permanencesRepository.preload({
      id,
      ...permanenceData,
    });

    if (!permanence) {
      throw new NotFoundException(`Permanence with id ${id} not found`);
    }

    if (memberId) {
      const member = await this.membersService.findById(memberId);
      permanence.member = member;
    }

    if (activityId) {
      const activity = await this.activitiesService.findById(activityId);
      permanence.activity = activity;
    }

    return await this.permanencesRepository.save(permanence);
  }

  async remove(id: number): Promise<DeleteResult> {
    return await this.permanencesRepository.delete(id);
  }
}
