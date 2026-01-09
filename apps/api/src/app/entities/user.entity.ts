import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserRole } from '@secure-tasks/data';
import { Organization } from './organization.entity';
import { Task } from './task.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column({ type: 'varchar', enum: UserRole })
  role!: UserRole;

  @Column()
  organizationId!: string;

  @ManyToOne(() => Organization, org => org.users)
  organization!: Organization;

  @OneToMany(() => Task, task => task.createdBy)
  createdTasks!: Task[];

  @OneToMany(() => Task, task => task.assignedTo)
  assignedTasks!: Task[];

  @OneToMany(() => AuditLog, log => log.user)
  auditLogs!: AuditLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
