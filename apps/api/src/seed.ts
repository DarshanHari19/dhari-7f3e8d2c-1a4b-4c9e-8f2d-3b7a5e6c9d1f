import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Organization, Task } from './app/entities';
import { UserRole, TaskStatus, TaskPriority } from '@secure-tasks/data';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'secure-tasks.db',
  entities: [User, Organization, Task],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Data Source initialized');

  // Create organizations
  const orgRepo = AppDataSource.getRepository(Organization);
  
  const parentOrg = orgRepo.create({
    name: 'Acme Corporation',
  });
  await orgRepo.save(parentOrg);

  const childOrg = orgRepo.create({
    name: 'Acme Engineering',
    parentId: parentOrg.id,
  });
  await orgRepo.save(childOrg);

  console.log('Organizations created');

  // Create users
  const userRepo = AppDataSource.getRepository(User);
  
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = userRepo.create({
    email: 'owner@acme.com',
    username: 'owner',
    password: ownerPassword,
    role: UserRole.OWNER,
    organizationId: parentOrg.id,
  });
  await userRepo.save(owner);

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepo.create({
    email: 'admin@acme.com',
    username: 'admin',
    password: adminPassword,
    role: UserRole.ADMIN,
    organizationId: parentOrg.id,
  });
  await userRepo.save(admin);

  const viewerPassword = await bcrypt.hash('viewer123', 10);
  const viewer = userRepo.create({
    email: 'viewer@acme.com',
    username: 'viewer',
    password: viewerPassword,
    role: UserRole.VIEWER,
    organizationId: childOrg.id,
  });
  await userRepo.save(viewer);

  console.log('Users created');
  console.log('Login credentials:');
  console.log('  Owner - username: owner, password: owner123');
  console.log('  Admin - username: admin, password: admin123');
  console.log('  Viewer - username: viewer, password: viewer123');

  // Create sample tasks
  const taskRepo = AppDataSource.getRepository(Task);

  const task1 = taskRepo.create({
    title: 'Setup authentication system',
    description: 'Implement JWT authentication with RBAC',
    status: TaskStatus.DONE,
    category: 'Development',
    priority: TaskPriority.HIGH,
    createdById: owner.id,
    organizationId: parentOrg.id,
    order: 1,
  });
  await taskRepo.save(task1);

  const task2 = taskRepo.create({
    title: 'Design database schema',
    description: 'Create ERD and implement TypeORM entities',
    status: TaskStatus.IN_PROGRESS,
    category: 'Development',
    priority: TaskPriority.HIGH,
    createdById: admin.id,
    assignedToId: viewer.id,
    organizationId: parentOrg.id,
    order: 2,
  });
  await taskRepo.save(task2);

  const task3 = taskRepo.create({
    title: 'Write API documentation',
    description: 'Document all API endpoints with examples',
    status: TaskStatus.TODO,
    category: 'Documentation',
    priority: TaskPriority.MEDIUM,
    createdById: admin.id,
    organizationId: childOrg.id,
    order: 3,
  });
  await taskRepo.save(task3);

  console.log('Sample tasks created');

  await AppDataSource.destroy();
  console.log('Seed completed successfully!');
}

seed().catch(error => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
