import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, Organization } from '../entities';
import { UserRole } from '@secure-tasks/data';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let jwtService: JwtService;

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    role: UserRole.ADMIN,
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Org',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto = {
        email: 'new@example.com',
        username: 'newuser',
        password: 'password123',
        role: UserRole.VIEWER,
        organizationId: 'org-123',
      };

      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(mockOrganization as any);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      const result = await service.register(createUserDto);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user).toHaveProperty('id');
      expect(result.user).not.toHaveProperty('password');
      expect(organizationRepository.findOne).toHaveBeenCalled();
    });

    it('should auto-create organization if it does not exist', async () => {
      const createUserDto = {
        email: 'new@example.com',
        username: 'newuser',
        password: 'password123',
        role: UserRole.OWNER,
        organizationId: 'new-org',
      };

      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(organizationRepository, 'create').mockReturnValue(mockOrganization as any);
      jest.spyOn(organizationRepository, 'save').mockResolvedValue(mockOrganization as any);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      await service.register(createUserDto);

      expect(organizationRepository.create).toHaveBeenCalled();
      expect(organizationRepository.save).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithHashedPassword as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      const result = await service.login(loginDto);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for invalid username', async () => {
      const loginDto = {
        username: 'wronguser',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithHashedPassword as any);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid userId', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);

      const result = await service.validateUser('123');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['organization'],
      });
    });

    it('should return null for invalid userId', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateUser('invalid-id');

      expect(result).toBeNull();
    });
  });
});
