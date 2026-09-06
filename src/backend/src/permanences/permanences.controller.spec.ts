import { Test, TestingModule } from '@nestjs/testing';
import { DeleteResult } from 'typeorm';

import { PermanencesController } from './permanences.controller.js';
import { PermanencesService } from './permanences.service.js';
import { Permanence } from './entities/permanence.entity.js';
import { CreatePermanenceDto } from './dto/create-permanence.dto.js';
import { UpdatePermanenceDto } from './dto/update-permanence.dto.js';

describe('PermanencesController', () => {
  let controller: PermanencesController;
  let service: PermanencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermanencesController],
      providers: [
        {
          provide: PermanencesService,
          useValue: {
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PermanencesController>(PermanencesController);
    service = module.get<PermanencesService>(PermanencesService);
  });

  describe('findById', () => {
    it('should return a permanence', async () => {
      const permanence = {
        id: 1,
        percentage: 80,
      } as Permanence;

      vi.spyOn(service, 'findById').mockResolvedValue(permanence);

      const result = await controller.findById(1);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(permanence);
    });
  });

  describe('create', () => {
    it('should create and return a permanence', async () => {
      const dto: CreatePermanenceDto = {
        percentage: 80,
        memberId: 1,
        activityId: 2,
      };

      const permanence = {
        id: 1,
        percentage: 80,
      } as Permanence;

      vi.spyOn(service, 'create').mockResolvedValue(permanence);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(permanence);
    });
  });

  describe('update', () => {
    it('should update and return a permanence', async () => {
      const dto: UpdatePermanenceDto = {
        percentage: 90,
      };

      const permanence = {
        id: 1,
        percentage: 90,
      } as Permanence;

      vi.spyOn(service, 'update').mockResolvedValue(permanence);

      const result = await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(permanence);
    });
  });

  describe('remove', () => {
    it('should remove a permanence', async () => {
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
});

