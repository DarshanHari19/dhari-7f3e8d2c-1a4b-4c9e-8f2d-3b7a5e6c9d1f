import { UserRole } from '@secure-tasks/data';

export class RoleHierarchy {
  private static hierarchy: Record<UserRole, UserRole[]> = {
    [UserRole.OWNER]: [UserRole.OWNER, UserRole.ADMIN, UserRole.VIEWER],
    [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.VIEWER],
    [UserRole.VIEWER]: [UserRole.VIEWER],
  };

  static hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    return this.hierarchy[userRole]?.includes(requiredRole) || false;
  }

  static canAccessRole(userRole: UserRole, targetRole: UserRole): boolean {
    return this.hierarchy[userRole]?.includes(targetRole) || false;
  }
}
