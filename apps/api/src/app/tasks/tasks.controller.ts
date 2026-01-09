import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Ip,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from '@secure-tasks/data';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req: any, @Ip() ip: string) {
    return this.tasksService.create(createTaskDto, req.user, ip);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.tasksService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.tasksService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: any,
    @Ip() ip: string
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user, ip);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any, @Ip() ip: string) {
    return this.tasksService.remove(id, req.user, ip);
  }
}
