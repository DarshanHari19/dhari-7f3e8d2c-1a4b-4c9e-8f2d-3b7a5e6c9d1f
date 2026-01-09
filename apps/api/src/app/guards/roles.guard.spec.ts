import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@secure-tasks/data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (user: any, roles?: UserRole[]): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    
    const context = createMockExecutionContext({ role: UserRole.VIEWER });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access if user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    
    const context = createMockExecutionContext(null);
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should allow owner to access admin-required endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    
    const context = createMockExecutionContext({ role: UserRole.OWNER });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow admin to access viewer-required endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.VIEWER]);
    
    const context = createMockExecutionContext({ role: UserRole.ADMIN });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny viewer access to admin-required endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    
    const context = createMockExecutionContext({ role: UserRole.VIEWER });
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny viewer access to owner-required endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OWNER]);
    
    const context = createMockExecutionContext({ role: UserRole.VIEWER });
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should allow access if user has any of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OWNER, UserRole.ADMIN]);
    
    const context = createMockExecutionContext({ role: UserRole.ADMIN });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });
});
