import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';

import { PermanencesService } from './permanences.service.js';
import { Permanence } from './entities/permanence.entity.js';
import { MembersService } from '../members/members.service.js';
import { ActivitiesService } from '../activities/activities.service.js';
import { Member } from '../members/entities/member.entity.js';
import { Activity } from '../activities/entities/activity.entity.js';

describe('PermanencesService', () => {
  let service: PermanencesService;
  let repository: Repository<Permanence>;
  let membersService: MembersService;
  let activitiesService: ActivitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermanencesService,
        {
          provide: getRepositoryToken(Permanence),
          useValue: {
            findOneBy: vi.fn(),
            findOne: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            preload: vi.fn(),
            delete: vi.fn(),
          },
        },
        {
          provide: MembersService,
          useValue: {
            findById: vi.fn(),
          },
        },
        {
          provide: ActivitiesService,
          useValue: {
            findById: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermanencesService>(PermanencesService);
    repository = module.get<Repository<Permanence>>(
      getRepositoryToken(Permanence),
    );

    membersService = module.get<MembersService>(MembersService);
    activitiesService = module.get<ActivitiesService>(ActivitiesService);
  });

  describe('findById', () => {
    it('should return a permanence when it exists', async () => {
      const permanence = {
        id: 1,
        percentage: 80,
      } as Permanence;

      vi.spyOn(repository, 'findOneBy').mockResolvedValue(permanence);

      const result = await service.findById(1);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(permanence);
    });

    it('should throw NotFoundException when permanence does not exist', async () => {
      vi.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(
        'Permanence with id 999 not found',
      );

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });
  });

  describe('findByMemberAndActivity', () => {
    it('should return a permanence when it exists', async () => {
      const permanence = {
        id: 1,
        percentage: 80,
      } as Permanence;

      vi.spyOn(repository, 'findOne').mockResolvedValue(permanence);

      const result = await service.findByMemberAndActivity(1, 2);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          member: { id: 1 },
          activity: { id: 2 },
        },
      });

      expect(result).toBe(permanence);
    });

    it('should return null when permanence does not exist', async () => {
      vi.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findByMemberAndActivity(1, 2);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          member: { id: 1 },
          activity: { id: 2 },
        },
      });

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a permanence', async () => {
      const dto = {
        percentage: 80,
        memberId: 1,
        activityId: 2,
      };

      const member = {
        id: 1,
        name: 'Member 1',
      } as Member;

      const activity = {
        id: 2,
        name: 'Activity 1',
      } as Activity;

      const permanence = {
        id: 1,
        percentage: 80,
        member,
        activity,
      } as Permanence;

      vi.spyOn(repository, 'findOne').mockResolvedValue(null);

      vi.spyOn(membersService, 'findById').mockResolvedValue(member);
      vi.spyOn(activitiesService, 'findById').mockResolvedValue(activity);

      vi.spyOn(repository, 'create').mockReturnValue(permanence);
      vi.spyOn(repository, 'save').mockResolvedValue(permanence);

      const result = await service.create(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          member: { id: 1 },
          activity: { id: 2 },
        },
      });

      expect(membersService.findById).toHaveBeenCalledWith(1);
      expect(activitiesService.findById).toHaveBeenCalledWith(2);

      expect(repository.create).toHaveBeenCalledWith({
        percentage: 80,
        member,
        activity,
      });

      expect(repository.save).toHaveBeenCalledWith(permanence);
      expect(result).toBe(permanence);
    });

    it('should throw ConflictException when the permanence already exists', async () => {
      const existingPermanence = {
        id: 1,
        percentage: 80,
      } as Permanence;

      vi.spyOn(repository, 'findOne').mockResolvedValue(existingPermanence);

      await expect(
        service.create({
          percentage: 90,
          memberId: 1,
          activityId: 2,
        }),
      ).rejects.toThrow(
        'Permanence for member 1 and activity 2 already exists',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          member: { id: 1 },
          activity: { id: 2 },
        },
      });

      expect(membersService.findById).not.toHaveBeenCalled();
      expect(activitiesService.findById).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing permanence', async () => {
      const permanence = {
        id: 1,
        percentage: 50,
      } as Permanence;

      const dto = {
        percentage: 80,
      };

      vi.spyOn(repository, 'preload').mockResolvedValue(permanence);
      vi.spyOn(repository, 'save').mockResolvedValue(permanence);

      const result = await service.update(1, dto);

      expect(repository.preload).toHaveBeenCalledWith({
        id: 1,
        percentage: 80,
      });

      expect(repository.save).toHaveBeenCalledWith(permanence);
      expect(result).toBe(permanence);
    });

    it('should update the member when memberId is provided', async () => {
      const permanence = {
        id: 1,
        percentage: 80,
      } as Permanence;

      const member = {
        id: 2,
        name: 'Member 2',
      } as Member;

      vi.spyOn(repository, 'preload').mockResolvedValue(permanence);
      vi.spyOn(membersService, 'findById').mockResolvedValue(member);
      vi.spyOn(repository, 'save').mockResolvedValue(permanence);

      const result = await service.update(1, {
        memberId: 2,
      });

      expect(repository.preload).toHaveBeenCalledWith({
        id: 1,
      });

      expect(membersService.findById).toHaveBeenCalledWith(2);
      expect(permanence.member).toBe(member);

      expect(repository.save).toHaveBeenCalledWith(permanence);
      expect(result).toBe(permanence);
    });

    it('should update the activity when activityId is provided', async () => {
      const permanence = {
        id: 1,
        percentage: 80,
      } as Permanence;

      const activity = {
        id: 2,
        name: 'Activity 2',
      } as Activity;

      vi.spyOn(repository, 'preload').mockResolvedValue(permanence);
      vi.spyOn(activitiesService, 'findById').mockResolvedValue(activity);
      vi.spyOn(repository, 'save').mockResolvedValue(permanence);

      const result = await service.update(1, {
        activityId: 2,
      });

      expect(repository.preload).toHaveBeenCalledWith({
        id: 1,
      });

      expect(activitiesService.findById).toHaveBeenCalledWith(2);
      expect(permanence.activity).toBe(activity);

      expect(repository.save).toHaveBeenCalledWith(permanence);
      expect(result).toBe(permanence);
    });

    it('should update member and activity when both are provided', async () => {
      const permanence = {
        id: 1,
        percentage: 80,
      } as Permanence;

      const member = {
        id: 2,
        name: 'Member 2',
      } as Member;

      const activity = {
        id: 3,
        name: 'Activity 3',
      } as Activity;

      vi.spyOn(repository, 'preload').mockResolvedValue(permanence);

      vi.spyOn(membersService, 'findById').mockResolvedValue(member);
      vi.spyOn(activitiesService, 'findById').mockResolvedValue(activity);

      vi.spyOn(repository, 'save').mockResolvedValue(permanence);

      const result = await service.update(1, {
        memberId: 2,
        activityId: 3,
      });

      expect(membersService.findById).toHaveBeenCalledWith(2);
      expect(activitiesService.findById).toHaveBeenCalledWith(3);

      expect(permanence.member).toBe(member);
      expect(permanence.activity).toBe(activity);

      expect(repository.save).toHaveBeenCalledWith(permanence);
      expect(result).toBe(permanence);
    });

    it('should throw NotFoundException when updating a non-existing permanence', async () => {
      vi.spyOn(repository, 'preload').mockResolvedValue(undefined);

      await expect(
        service.update(999, {
          percentage: 90,
        }),
      ).rejects.toThrow('Permanence with id 999 not found');

      expect(repository.save).not.toHaveBeenCalled();
      expect(membersService.findById).not.toHaveBeenCalled();
      expect(activitiesService.findById).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a permanence', async () => {
      const deleteResult = {
        affected: 1,
        raw: {},
      } as DeleteResult;

      vi.spyOn(repository, 'delete').mockResolvedValue(deleteResult);

      const result = await service.remove(1);

      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(deleteResult);
    });
  });
});

