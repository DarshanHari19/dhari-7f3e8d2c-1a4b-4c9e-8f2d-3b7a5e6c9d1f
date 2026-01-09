import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  async log(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details: string,
    ipAddress?: string
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
    });

    await this.auditLogRepository.save(auditLog);
    
    // Also log to console
    console.log(`[AUDIT] ${new Date().toISOString()} - User ${userId} ${action} ${resource} ${resourceId}`);
  }

  async getAuditLogs(filters?: {
    userId?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.timestamp', 'DESC');

    if (filters?.userId) {
      query.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters?.resource) {
      query.andWhere('audit.resource = :resource', { resource: filters.resource });
    }

    if (filters?.startDate) {
      query.andWhere('audit.timestamp >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('audit.timestamp <= :endDate', { endDate: filters.endDate });
    }

    return query.take(1000).getMany();
  }
}
