import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = {
        username: 'john',
        password: 'password123',
      };

      const user = {
        id: 1,
        username: 'john',
        role: 'board',
      } as User;

      vi.spyOn(service, 'create').mockResolvedValue(user);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(user);
    });

    it('should show an error when the service fails', async () => {
      const dto = {
        username: 'john',
        password: 'password123',
      };

      vi.spyOn(service, 'create').mockRejectedValue(
        new Error('Something went wrong'),
      );

      await expect(controller.create(dto)).rejects.toThrow(
        'Something went wrong',
      );

      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });
});
