import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, User, Organization } from '../entities';
import { AuditService } from '../audit/audit.service';
import { UserRole, TaskStatus, TaskPriority } from '@secure-tasks/data';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;
  let organizationRepository: Repository<Organization>;
  let auditService: AuditService;

  const mockOwner: User = {
    id: 'owner-1',
    email: 'owner@test.com',
    username: 'owner',
    password: 'hashed',
    role: UserRole.OWNER,
    organizationId: 'org-1',
  } as User;

  const mockAdmin: User = {
    id: 'admin-1',
    email: 'admin@test.com',
    username: 'admin',
    password: 'hashed',
    role: UserRole.ADMIN,
    organizationId: 'org-1',
  } as User;

  const mockViewer: User = {
    id: 'viewer-1',
    email: 'viewer@test.com',
    username: 'viewer',
    password: 'hashed',
    role: UserRole.VIEWER,
    organizationId: 'org-2',
  } as User;

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    category: 'Development',
    priority: TaskPriority.HIGH,
    createdById: 'owner-1',
    organizationId: 'org-1',
    order: 1,
  } as Task;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task and log audit', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'Description',
        category: 'Development',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
      };

      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask);
      jest.spyOn(auditService, 'log').mockResolvedValue(undefined);

      const result = await service.create(createTaskDto, mockOwner, '127.0.0.1');

      expect(result).toEqual(mockTask);
      expect(taskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        createdById: mockOwner.id,
        organizationId: mockOwner.organizationId,
        status: TaskStatus.TODO,
      });
      expect(auditService.log).toHaveBeenCalledWith(
        mockOwner.id,
        'CREATE',
        'task',
        mockTask.id,
        expect.any(String),
        '127.0.0.1'
      );
    });
  });

  describe('findAll', () => {
    it('should return all tasks for owner', async () => {
      const tasks = [mockTask];
      jest.spyOn(organizationRepository, 'find').mockResolvedValue([]);
      
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(tasks),
      };
      jest.spyOn(taskRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await service.findAll(mockOwner);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(tasks);
    });

    it('should return all tasks for viewer role (no filtering)', async () => {
      const tasks = [mockTask];
      jest.spyOn(organizationRepository, 'find').mockResolvedValue([]);
      
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(tasks),
      };
      jest.spyOn(taskRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await service.findAll(mockViewer);

      // Viewers can see all tasks in their org (RBAC enforced on mutations)
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(tasks);
    });
  });

  describe('findOne', () => {
    it('should return task if user has access', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(organizationRepository, 'find').mockResolvedValue([]);

      const result = await service.findOne('task-1', mockOwner);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockOwner)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if viewer tries to access unassigned task', async () => {
      const unassignedTask = { ...mockTask, createdById: 'other-user', assignedToId: 'other-user' };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(unassignedTask);
      jest.spyOn(organizationRepository, 'find').mockResolvedValue([]);

      await expect(service.findOne('task-1', mockViewer)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update task and log audit', async () => {
      const updateDto = { title: 'Updated Title' };
      const updatedTask = { ...mockTask, ...updateDto };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(organizationRepository, 'find').mockResolvedValue([]);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(updatedTask);
      jest.spyOn(auditService, 'log').mockResolvedValue(undefined);

      const result = await service.update('task-1', updateDto, mockOwner, '127.0.0.1');

      expect(result.title).toBe('Updated Title');
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete task and log audit', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(organizationRepository, 'find').mockResolvedValue([]);
      jest.spyOn(taskRepository, 'remove').mockResolvedValue(mockTask);
      jest.spyOn(auditService, 'log').mockResolvedValue(undefined);

      await service.remove('task-1', mockOwner, '127.0.0.1');

      expect(taskRepository.remove).toHaveBeenCalledWith(mockTask);
      expect(auditService.log).toHaveBeenCalledWith(
        mockOwner.id,
        'DELETE',
        'task',
        'task-1',
        expect.any(String),
        '127.0.0.1'
      );
    });

    it('should throw ForbiddenException if viewer tries to delete task', async () => {
      const viewerTask = { ...mockTask, createdById: mockViewer.id, organizationId: mockViewer.organizationId };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(viewerTask);
      jest.spyOn(organizationRepository, 'find').mockResolvedValue([]);

      await expect(service.remove('task-1', mockViewer, '127.0.0.1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('RBAC Access Control', () => {
    it('should allow owner to access any task', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(organizationRepository, 'find').mockResolvedValue([]);

      const result = await service.findOne('task-1', mockOwner);
      expect(result).toBeDefined();
    });

    it('should allow admin to access tasks in their org', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(organizationRepository, 'find').mockResolvedValue([]);

      const result = await service.findOne('task-1', mockAdmin);
      expect(result).toBeDefined();
    });

    it('should restrict viewer to only their tasks', async () => {
      const viewerTask = { ...mockTask, assignedToId: mockViewer.id, organizationId: mockViewer.organizationId };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(viewerTask);
      jest.spyOn(organizationRepository, 'find').mockResolvedValue([]);

      const result = await service.findOne('task-1', mockViewer);
      expect(result).toBeDefined();
    });
  });
});
