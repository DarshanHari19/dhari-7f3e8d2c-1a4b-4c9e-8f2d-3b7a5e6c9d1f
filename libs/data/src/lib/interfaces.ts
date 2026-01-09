export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export enum Permission {
  CREATE_TASK = 'create_task',
  READ_TASK = 'read_task',
  UPDATE_TASK = 'update_task',
  DELETE_TASK = 'delete_task',
  READ_AUDIT_LOG = 'read_audit_log',
  MANAGE_USERS = 'manage_users',
}

export interface IUser {
  id: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganization {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: string;
  priority: TaskPriority;
  assignedToId?: string;
  createdById: string;
  organizationId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface IAuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress?: string;
  timestamp: Date;
}
