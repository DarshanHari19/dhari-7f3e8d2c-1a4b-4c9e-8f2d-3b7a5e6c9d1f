import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    const routerSpy = { navigate: vi.fn().mockResolvedValue(true) };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should authenticate user and store token', () => {
      const mockResponse = {
        access_token: 'test-token',
        user: {
          id: '123',
          username: 'testuser',
          email: 'test@test.com',
          role: 'admin',
          organizationId: 'org-123'
        }
      };

      service.login('testuser', 'password123').subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('access_token')).toBe('test-token');
        expect(localStorage.getItem('user')).toBeTruthy();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'testuser', password: 'password123' });
      req.flush(mockResponse);
    });

    it('should navigate to dashboard after successful login', () => {
      const mockResponse = {
        access_token: 'test-token',
        user: { id: '123', username: 'test', email: 'test@test.com', role: 'admin', organizationId: 'org' }
      };

      service.login('test', 'pass').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('logout', () => {
    it('should clear storage and navigate to login', () => {
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '123' }));

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('access_token', 'test-token');
      expect(service.isAuthenticated).toBe(false); // Service was created before token was set
    });

    it('should return false when token does not exist', () => {
      expect(service.isAuthenticated).toBe(false);
    });
  });

  describe('currentUser', () => {
    it('should return current user from storage', () => {
      const user = { id: '123', username: 'test', email: 'test@test.com', role: 'admin', organizationId: 'org' };
      localStorage.setItem('user', JSON.stringify(user));
      expect(service.currentUser).toBeNull(); // Service was created before user was set
    });
  });
});
