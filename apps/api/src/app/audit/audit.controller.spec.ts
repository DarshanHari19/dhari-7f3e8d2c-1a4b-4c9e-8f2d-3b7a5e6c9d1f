import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { UserRole } from '@secure-tasks/data';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditService = {
    getAuditLogs: jest.fn(),
  };

  const mockOwner = {
    id: 'user-1',
    username: 'owner',
    email: 'owner@test.com',
    role: UserRole.OWNER,
    organizationId: 'org-1',
  };

  const mockAdmin = {
    id: 'user-2',
    username: 'admin',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    organizationId: 'org-1',
  };

  const mockAuditLogs = [
    {
      id: 'log-1',
      userId: 'user-1',
      action: 'CREATE',
      resource: 'task',
      resourceId: 'task-1',
      details: 'Created task',
      ipAddress: '127.0.0.1',
      timestamp: new Date(),
      user: mockOwner,
    },
    {
      id: 'log-2',
      userId: 'user-1',
      action: 'LOGIN',
      resource: 'auth',
      resourceId: null,
      details: 'User logged in',
      ipAddress: '127.0.0.1',
      timestamp: new Date(),
      user: mockOwner,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAuditLogs', () => {
    it('should return all audit logs for owner', async () => {
      mockAuditService.getAuditLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getAuditLogs({ user: mockOwner });

      expect(result).toEqual(mockAuditLogs);
      expect(service.getAuditLogs).toHaveBeenCalledWith({
        resource: undefined,
        userId: undefined,
      });
    });

    it('should return all audit logs for admin', async () => {
      mockAuditService.getAuditLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getAuditLogs({ user: mockAdmin });

      expect(result).toEqual(mockAuditLogs);
      expect(service.getAuditLogs).toHaveBeenCalled();
    });

    it('should filter audit logs by resource', async () => {
      const taskLogs = [mockAuditLogs[0]];
      mockAuditService.getAuditLogs.mockResolvedValue(taskLogs);

      const result = await controller.getAuditLogs(
        { user: mockOwner },
        'task'
      );

      expect(result).toEqual(taskLogs);
      expect(service.getAuditLogs).toHaveBeenCalledWith({
        resource: 'task',
        userId: undefined,
      });
    });

    it('should filter audit logs by userId', async () => {
      const userLogs = mockAuditLogs.filter(log => log.userId === 'user-1');
      mockAuditService.getAuditLogs.mockResolvedValue(userLogs);

      const result = await controller.getAuditLogs(
        { user: mockOwner },
        undefined,
        'user-1'
      );

      expect(result).toEqual(userLogs);
      expect(service.getAuditLogs).toHaveBeenCalledWith({
        resource: undefined,
        userId: 'user-1',
      });
    });

    it('should filter audit logs by both resource and userId', async () => {
      const filteredLogs = [mockAuditLogs[0]];
      mockAuditService.getAuditLogs.mockResolvedValue(filteredLogs);

      const result = await controller.getAuditLogs(
        { user: mockOwner },
        'task',
        'user-1'
      );

      expect(result).toEqual(filteredLogs);
      expect(service.getAuditLogs).toHaveBeenCalledWith({
        resource: 'task',
        userId: 'user-1',
      });
    });

    it('should return empty array when no logs match filters', async () => {
      mockAuditService.getAuditLogs.mockResolvedValue([]);

      const result = await controller.getAuditLogs(
        { user: mockOwner },
        'nonexistent'
      );

      expect(result).toEqual([]);
    });
  });
});
