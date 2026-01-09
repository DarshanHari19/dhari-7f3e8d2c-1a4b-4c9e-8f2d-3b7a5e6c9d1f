import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '@secure-tasks/auth';
import { UserRole } from '@secure-tasks/data';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async getAuditLogs(
    @Request() req: any,
    @Query('resource') resource?: string,
    @Query('userId') userId?: string
  ) {
    return this.auditService.getAuditLogs({
      resource,
      userId,
    });
  }
}
