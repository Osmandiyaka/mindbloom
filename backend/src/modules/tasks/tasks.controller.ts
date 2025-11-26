import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    // In a real app, user/roles would come from auth context
    private parseUser(req: any) {
        const userId = req.headers['x-user-id'] || 'demo-user';
        const roles = req.headers['x-user-roles'] ? (req.headers['x-user-roles'] as string).split(',') : [];
        return { userId, roles };
    }

    @Post()
    create(@Body() dto: CreateTaskDto, @Query('userId') userId?: string) {
        return this.tasksService.create(dto, userId || 'demo-user');
    }

    @Get()
    findAll(@Query() query: any) {
        const filters: any = {};
        if (query.status) filters.status = query.status.split(',');
        if (query.priority) filters.priority = query.priority.split(',');
        if (query.category) filters.category = query.category;
        if (query.assignmentType) filters.assignmentType = query.assignmentType;
        if (query.assignedToRole) filters.assignedToRole = query.assignedToRole;
        if (query.assignedToUserId) filters.assignedToUserId = query.assignedToUserId;
        if (query.searchTerm) filters.searchTerm = query.searchTerm;
        return this.tasksService.findAll(filters);
    }

    @Get('my-tasks')
    myTasks(@Query('userId') userId: string, @Query('roles') roles: string) {
        return this.tasksService.findVisibleForUser(userId, roles ? roles.split(',') : [], false);
    }

    @Get('my-active-tasks')
    myActive(@Query('userId') userId: string, @Query('roles') roles: string) {
        return this.tasksService.findVisibleForUser(userId, roles ? roles.split(',') : [], true);
    }

    @Get('dashboard-stats')
    stats(@Query('userId') userId: string, @Query('roles') roles: string) {
        return this.tasksService.dashboardStats(userId, roles ? roles.split(',') : []);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tasksService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Query('userId') userId?: string) {
        return this.tasksService.update(id, dto, userId || 'demo-user');
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Query('userId') userId?: string) {
        return this.tasksService.softDelete(id, userId || 'demo-user');
    }

    @Post(':id/start')
    start(@Param('id') id: string, @Query('userId') userId: string, @Query('roles') roles: string) {
        return this.tasksService.start(id, userId, roles ? roles.split(',') : []);
    }

    @Post(':id/complete')
    complete(@Param('id') id: string, @Query('userId') userId: string, @Query('roles') roles: string) {
        return this.tasksService.complete(id, userId, roles ? roles.split(',') : []);
    }

    @Post(':id/cancel')
    cancel(@Param('id') id: string, @Query('userId') userId?: string) {
        return this.tasksService.cancel(id, userId || 'demo-user');
    }

    @Get(':id/completions')
    completions(@Param('id') id: string) {
        return this.tasksService.getCompletions(id);
    }

    @Post('bulk-create')
    bulk(@Body() dtos: CreateTaskDto[], @Query('userId') userId?: string) {
        return this.tasksService.bulkCreate(dtos, userId || 'demo-user');
    }

    @Post('generate-system-tasks')
    generate() {
        return this.tasksService.generateSystemTasks();
    }
}
