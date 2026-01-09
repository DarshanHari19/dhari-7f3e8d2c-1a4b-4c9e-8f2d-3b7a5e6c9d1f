import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, User, Organization } from '../entities';
import { CreateTaskDto, UpdateTaskDto, UserRole, TaskStatus } from '@secure-tasks/data';
import { AuditService } from '../audit/audit.service';
import { RoleHierarchy } from '@secure-tasks/auth';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private auditService: AuditService
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User, ipAddress?: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      createdById: user.id,
      organizationId: user.organizationId,
      status: createTaskDto.status || TaskStatus.TODO,
    });

    const savedTask = await this.taskRepository.save(task);

    await this.auditService.log(
      user.id,
      'CREATE',
      'task',
      savedTask.id,
      `Created task: ${savedTask.title}`,
      ipAddress
    );

    return savedTask;
  }

  async findAll(user: User): Promise<Task[]> {
    // Get user's organization and all child organizations
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.organization', 'organization')
      .where('task.organizationId IN (:...orgIds)', { orgIds: accessibleOrgIds });

    // All users (including viewers) can see all tasks in their org
    // RBAC enforcement happens on create/update/delete operations

    return query.orderBy('task.order', 'ASC').addOrderBy('task.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.checkTaskAccess(task, user, 'read');

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: User,
    ipAddress?: string
  ): Promise<Task> {
    const task = await this.findOne(id, user);
    await this.checkTaskAccess(task, user, 'update');

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    await this.auditService.log(
      user.id,
      'UPDATE',
      'task',
      task.id,
      `Updated task: ${task.title}`,
      ipAddress
    );

    return updatedTask;
  }

  async remove(id: string, user: User, ipAddress?: string): Promise<void> {
    const task = await this.findOne(id, user);
    await this.checkTaskAccess(task, user, 'delete');

    await this.taskRepository.remove(task);

    await this.auditService.log(
      user.id,
      'DELETE',
      'task',
      id,
      `Deleted task: ${task.title}`,
      ipAddress
    );
  }

  private async checkTaskAccess(task: Task, user: User, action: 'read' | 'update' | 'delete'): Promise<void> {
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    // Check if task belongs to accessible organization
    if (!accessibleOrgIds.includes(task.organizationId)) {
      throw new ForbiddenException('You do not have access to this task');
    }

    // Viewers can read but cannot update or delete
    if (user.role === UserRole.VIEWER) {
      if (action === 'update' || action === 'delete') {
        throw new ForbiddenException(`You do not have permission to ${action} tasks`);
      }
    }

    // Admins can manage all tasks in their org and child orgs
    // Owners can manage all tasks
  }

  private async getAccessibleOrganizationIds(user: User): Promise<string[]> {
    const orgIds = [user.organizationId];

    // Owners and Admins can access child organizations
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      const childOrgs = await this.getChildOrganizations(user.organizationId);
      orgIds.push(...childOrgs.map(org => org.id));
    }

    return orgIds;
  }

  private async getChildOrganizations(parentId: string): Promise<Organization[]> {
    const children = await this.organizationRepository.find({
      where: { parentId },
    });

    const allChildren = [...children];

    for (const child of children) {
      const grandChildren = await this.getChildOrganizations(child.id);
      allChildren.push(...grandChildren);
    }

    return allChildren;
  }
}
