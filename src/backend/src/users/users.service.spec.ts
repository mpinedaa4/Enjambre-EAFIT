import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  // Test inicial
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user when it exists', async () => {
      const user = {
        id: 1,
        username: 'john',
      } as User;

      vi.spyOn(repository, 'findOneBy').mockResolvedValue(user);

      const result = await service.findOne('john');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        username: 'john',
      });
      expect(result).toBe(user);
    });

    it('should return null when the user does not exist', async () => {
      vi.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      const result = await service.findOne('john');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        username: 'john',
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a user with the board role', async () => {
      const dto = {
        username: 'john',
        password: 'password123',
      };

      const user = {
        id: 1,
        username: 'john',
        password: 'password123',
        role: 'board',
      } as User;

      vi.spyOn(repository, 'findOneBy').mockResolvedValue(null);
      vi.spyOn(repository, 'create').mockReturnValue(user);
      vi.spyOn(repository, 'save').mockResolvedValue(user);

      const result = await service.create(dto);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        username: 'john',
      });

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        role: 'board',
      });

      expect(repository.save).toHaveBeenCalledWith(user);
      expect(result).toBe(user);
    });

    it('should throw BadRequestException when the username is already in use', async () => {
      const existingUser = {
        id: 1,
        username: 'john',
      } as User;

      const dto = {
        username: 'john',
        password: 'password123',
      };

      vi.spyOn(repository, 'findOneBy').mockResolvedValue(existingUser);

      await expect(service.create(dto)).rejects.toThrow(
        'The username is already in use',
      );

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
