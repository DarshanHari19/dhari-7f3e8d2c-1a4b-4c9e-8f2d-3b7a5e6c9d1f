import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { AuthService } from './auth.service';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const authServiceSpy = { token: 'test-token' };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TaskService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should fetch tasks with authorization header', () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Task 1',
          description: 'Description 1',
          status: 'todo' as const,
          category: 'Development',
          priority: 'high' as const,
          createdById: 'user-1',
          organizationId: 'org-1',
          order: 1,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ];

      service.getTasks().subscribe(tasks => {
        expect(tasks).toEqual(mockTasks);
        expect(tasks.length).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(mockTasks);
    });
  });

  describe('createTask', () => {
    it('should create a task with proper payload', () => {
      const newTask = {
        title: 'New Task',
        description: 'New Description',
        category: 'Development',
        priority: 'medium' as const
      };

      const mockResponse = {
        ...newTask,
        id: '123',
        status: 'todo' as const,
        createdById: 'user-1',
        organizationId: 'org-1',
        order: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      service.createTask(newTask).subscribe(task => {
        expect(task.id).toBe('123');
        expect(task.title).toBe('New Task');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTask);
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(mockResponse);
    });
  });

  describe('updateTask', () => {
    it('should update a task', () => {
      const updates = { title: 'Updated Title', status: 'in_progress' as const };
      const mockResponse = {
        id: '123',
        ...updates,
        description: 'Description',
        category: 'Development',
        priority: 'high' as const,
        createdById: 'user-1',
        organizationId: 'org-1',
        order: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      service.updateTask('123', updates).subscribe(task => {
        expect(task.title).toBe('Updated Title');
        expect(task.status).toBe('in_progress');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks/123');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updates);
      req.flush(mockResponse);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', () => {
      service.deleteTask('123').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/tasks/123');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(null);
    });
  });
});
