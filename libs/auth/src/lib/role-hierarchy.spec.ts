import { RoleHierarchy } from './role-hierarchy';
import { UserRole } from '@secure-tasks/data';

describe('RoleHierarchy', () => {
  describe('hasPermission', () => {
    it('should allow owner to access all roles', () => {
      expect(RoleHierarchy.hasPermission(UserRole.OWNER, UserRole.OWNER)).toBe(true);
      expect(RoleHierarchy.hasPermission(UserRole.OWNER, UserRole.ADMIN)).toBe(true);
      expect(RoleHierarchy.hasPermission(UserRole.OWNER, UserRole.VIEWER)).toBe(true);
    });

    it('should allow admin to access admin and viewer', () => {
      expect(RoleHierarchy.hasPermission(UserRole.ADMIN, UserRole.ADMIN)).toBe(true);
      expect(RoleHierarchy.hasPermission(UserRole.ADMIN, UserRole.VIEWER)).toBe(true);
      expect(RoleHierarchy.hasPermission(UserRole.ADMIN, UserRole.OWNER)).toBe(false);
    });

    it('should allow viewer to access only viewer', () => {
      expect(RoleHierarchy.hasPermission(UserRole.VIEWER, UserRole.VIEWER)).toBe(true);
      expect(RoleHierarchy.hasPermission(UserRole.VIEWER, UserRole.ADMIN)).toBe(false);
      expect(RoleHierarchy.hasPermission(UserRole.VIEWER, UserRole.OWNER)).toBe(false);
    });
  });

  describe('canAccessRole', () => {
    it('should follow role hierarchy correctly', () => {
      expect(RoleHierarchy.canAccessRole(UserRole.OWNER, UserRole.VIEWER)).toBe(true);
      expect(RoleHierarchy.canAccessRole(UserRole.VIEWER, UserRole.OWNER)).toBe(false);
      expect(RoleHierarchy.canAccessRole(UserRole.ADMIN, UserRole.VIEWER)).toBe(true);
    });
  });
});
