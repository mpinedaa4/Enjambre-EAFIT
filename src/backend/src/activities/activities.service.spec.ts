import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';

import { ActivitiesService } from './activities.service.js';
import { GroupsService } from '../groups/groups.service.js';
import { CommitteesService } from '../committees/committees.service.js';
import { Activity } from './entities/activity.entity.js';
import { Group } from '../groups/entities/group.entity.js';
import { Committee } from '../committees/entities/committee.entity.js';
import { getCurrentPeriod } from '../utils/period.util.js';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let repository: Repository<Activity>;
  let groupsService: GroupsService;
  let committeesService: CommitteesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: getRepositoryToken(Activity),
          useValue: {
            findOneBy: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            preload: vi.fn(),
            delete: vi.fn(),
          },
        },
        {
          provide: GroupsService,
          useValue: {
            findById: vi.fn(),
          },
        },
        {
          provide: CommitteesService,
          useValue: {
            findById: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    repository = module.get<Repository<Activity>>(getRepositoryToken(Activity));

    groupsService = module.get<GroupsService>(GroupsService);
    committeesService = module.get<CommitteesService>(CommitteesService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Test inicial
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test 1
  it('should return an activity when it exists', async () => {
    const activity = {
      id: 1,
      name: 'Activity 1',
    } as Activity;

    vi.spyOn(repository, 'findOneBy').mockResolvedValue(activity);

    const result = await service.findById(1);

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(result).toBe(activity);
  });

  // Test 2
  it('should throw NotFoundException when activity does not exist', async () => {
    vi.spyOn(repository, 'findOneBy').mockResolvedValue(null);

    await expect(service.findById(1)).rejects.toThrow(
      'Activity with id 1 not found',
    );

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  // Test 3
  it('should create and save an activity', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-05'));

    const dto = {
      name: 'Activity 1',
      description: 'Description',
      weight: 10,
      groupId: 1,
      committeeId: 1,
    };

    const group = {
      id: 1,
      name: 'Group 1',
    } as Group;

    const committee = {
      id: 1,
      name: 'Committee 1',
    } as Committee;

    const activity = {
      id: 1,
      name: 'Activity 1',
      description: 'Description',
      weight: 10,
      period: '2026-2',
      group,
      committee,
    } as Activity;

    vi.spyOn(groupsService, 'findById').mockResolvedValue(group);
    vi.spyOn(committeesService, 'findById').mockResolvedValue(committee);

    vi.spyOn(repository, 'create').mockReturnValue(activity);
    vi.spyOn(repository, 'save').mockResolvedValue(activity);

    const result = await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Activity 1',
      description: 'Description',
      weight: 10,
      period: '2026-2',
      group,
      committee,
    });
    expect(repository.save).toHaveBeenCalledWith(activity);
    expect(result).toBe(activity);
  });

  // Test 4
  it('should create and save an activity without a null committee', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-05'));

    const dto = {
      name: 'Activity 1',
      description: 'Description',
      weight: 10,
      groupId: 1,
      committeeId: null,
    };

    const group = {
      id: 1,
      name: 'Group 1',
    } as Group;

    const activity = {
      id: 1,
      name: 'Activity 1',
      description: 'Description',
      weight: 10,
      period: '2026-2',
      group,
      committee: null,
    } as Activity;

    vi.spyOn(groupsService, 'findById').mockResolvedValue(group);

    vi.spyOn(repository, 'create').mockReturnValue(activity);
    vi.spyOn(repository, 'save').mockResolvedValue(activity);

    const result = await service.create(dto);

    expect(groupsService.findById).toHaveBeenCalledWith(1);
    expect(committeesService.findById).not.toHaveBeenCalled();

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Activity 1',
      description: 'Description',
      weight: 10,
      period: '2026-2',
      group,
      committee: null,
    });

    expect(repository.save).toHaveBeenCalledWith(activity);
    expect(result).toBe(activity);
  });

  // Test 5
  it('should update an existing activity', async () => {
    const activity = {
      id: 1,
      name: 'Old name',
      description: 'Description',
      weight: 10,
      period: '2026-2',
    } as Activity;

    const dto = {
      name: 'New name',
      weight: 20,
    };

    vi.spyOn(repository, 'preload').mockResolvedValue(activity);
    vi.spyOn(repository, 'save').mockResolvedValue(activity);

    const result = await service.update(1, dto);

    expect(repository.preload).toHaveBeenCalledWith({
      id: 1,
      name: 'New name',
      weight: 20,
    });

    expect(repository.save).toHaveBeenCalledWith(activity);
    expect(result).toBe(activity);
  });

  // Test 6
  it('should throw NotFoundException when updating a non-existing activity', async () => {
    vi.spyOn(repository, 'preload').mockResolvedValue(undefined);

    await expect(service.update(999, { name: 'New name' })).rejects.toThrow(
      'Activity with id 999 not found',
    );

    expect(repository.save).not.toHaveBeenCalled();
  });

  // Test 7
  it('should delete an activity', async () => {
    const deleteResult = {
      affected: 1,
    } as DeleteResult;

    vi.spyOn(repository, 'delete').mockResolvedValue(deleteResult);

    const result = await service.remove(1);

    expect(repository.delete).toHaveBeenCalledWith(1);
    expect(result).toBe(deleteResult);
  });
});

describe('getCurrentPeriod', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('current period', () => {
    it('should return the current period', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-05'));

      expect(getCurrentPeriod()).toBe('2026-2');
    });
  });

  describe('period 1 and period 2', () => {
    it('should return period 1 during the first semester', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-15'));

      expect(getCurrentPeriod()).toBe('2026-1');
    });

    it('should return period 2 during the second semester', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-15'));

      expect(getCurrentPeriod()).toBe('2026-2');
    });
  });

  describe('boundary dates', () => {
    it('should return period 1 on June 30', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-30'));

      expect(getCurrentPeriod()).toBe('2026-1');
    });

    it('should return period 2 on July 1', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-01'));

      expect(getCurrentPeriod()).toBe('2026-2');
    });

    it('should return period 2 on December 31', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-12-31'));

      expect(getCurrentPeriod()).toBe('2026-2');
    });

    it('should return period 1 on January 1', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2027-01-01'));

      expect(getCurrentPeriod()).toBe('2027-1');
    });
  });
});
