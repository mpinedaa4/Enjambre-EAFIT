import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should call authService.signIn with username and password', async () => {
      const signInDto = {
        username: 'john',
        password: 'password123',
      };

      const response = {
        access_token: 'jwt-token',
      };

      vi.spyOn(authService, 'signIn').mockResolvedValue(response);

      const result = await controller.signIn(signInDto);

      expect(authService.signIn).toHaveBeenCalledWith(
        'john',
        'password123',
      );

      expect(result).toBe(response);
    });

    it('should propagate an error when authentication fails', async () => {
      const signInDto = {
        username: 'john',
        password: 'wrong-password',
      };

      vi.spyOn(authService, 'signIn').mockRejectedValue(
        new UnauthorizedException(),
      );

      await expect(controller.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authService.signIn).toHaveBeenCalledWith(
        'john',
        'wrong-password',
      );
    });
  });
});

