import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task, Organization } from '../entities';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Organization]),
    AuditModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
