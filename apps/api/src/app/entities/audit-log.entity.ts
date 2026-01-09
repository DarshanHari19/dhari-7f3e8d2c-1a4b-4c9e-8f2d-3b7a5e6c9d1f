import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, user => user.auditLogs)
  user!: User;

  @Column()
  action!: string;

  @Column()
  resource!: string;

  @Column()
  resourceId!: string;

  @Column('text')
  details!: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  timestamp!: Date;
}
