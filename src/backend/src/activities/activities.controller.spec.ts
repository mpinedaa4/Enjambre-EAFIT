import { Test, TestingModule } from '@nestjs/testing';
import { DeleteResult } from 'typeorm';

import { ActivitiesController } from './activities.controller.js';
import { ActivitiesService } from './activities.service.js';
import { Activity } from './entities/activity.entity.js';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: ActivitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: {
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    service = module.get<ActivitiesService>(ActivitiesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Test 1
  it('should return an activity by id', async () => {
    const activity = {
      id: 1,
      name: 'Activity 1',
    } as Activity;

    vi.spyOn(service, 'findById').mockResolvedValue(activity);

    const result = await controller.findById(1);

    expect(service.findById).toHaveBeenCalledWith(1);
    expect(result).toBe(activity);
  });

  // Test 2
  it('should create an activity', async () => {
    const dto = {
      name: 'Activity 1',
      description: 'Description',
      weight: 10,
      groupId: 1,
      committeeId: null,
    };

    const activity = {
      id: 1,
      name: 'Activity 1',
      description: 'Description',
      weight: 10,
      period: '2026-2',
    } as Activity;

    vi.spyOn(service, 'create').mockResolvedValue(activity);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(activity);
  });

  // Test 3
  it('should update an activity', async () => {
    const dto = {
      name: 'Updated activity',
      weight: 20,
    };

    const activity = {
      id: 1,
      name: 'Updated activity',
      weight: 20,
    } as Activity;

    vi.spyOn(service, 'update').mockResolvedValue(activity);

    const result = await controller.update(1, dto);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toBe(activity);
  });

  // Test 4
  it('should remove an activity', async () => {
    const deleteResult = {
      affected: 1,
      raw: {},
    } as DeleteResult;

    vi.spyOn(service, 'remove').mockResolvedValue(deleteResult);

    const result = await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toBe(deleteResult);
  });
});
