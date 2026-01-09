import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { TaskStatus, TaskPriority } from '@secure-tasks/data';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column({ type: 'varchar', enum: TaskStatus, default: TaskStatus.TODO })
  status!: TaskStatus;

  @Column()
  category!: string;

  @Column({ type: 'varchar', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority!: TaskPriority;

  @Column({ nullable: true })
  assignedToId?: string;

  @ManyToOne(() => User, user => user.assignedTasks, { nullable: true })
  assignedTo?: User;

  @Column()
  createdById!: string;

  @ManyToOne(() => User, user => user.createdTasks)
  createdBy!: User;

  @Column()
  organizationId!: string;

  @ManyToOne(() => Organization, org => org.tasks)
  organization!: Organization;

  @Column({ type: 'integer', default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
