import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    constructor(
        @InjectModel('Task') private taskModel: Model<any>,
        @InjectModel('TaskCompletion') private completionModel: Model<any>,
        @InjectModel('TaskHistory') private historyModel: Model<any>,
    ) { }

    async create(dto: CreateTaskDto, creatingUserId: string) {
        if (dto.assignmentType === 'User' && !dto.assignedToUserId) throw new BadRequestException('assignedToUserId required');
        if (dto.assignmentType === 'Role' && !dto.assignedToRole) throw new BadRequestException('assignedToRole required');

        const task = await this.taskModel.create({
            ...dto,
            createdBy: creatingUserId,
            taskType: dto.systemTaskKey ? 'SystemGenerated' : 'Manual',
        });
        await this.log(task.id, creatingUserId, 'Created');
        return task;
    }

    async findAll(filters: any = {}) {
        const query: any = { isDeleted: { $ne: true } };
        if (filters.status) query.status = { $in: filters.status };
        if (filters.priority) query.priority = { $in: filters.priority };
        if (filters.category) query.category = filters.category;
        if (filters.assignmentType) query.assignmentType = filters.assignmentType;
        if (filters.assignedToRole) query.assignedToRole = filters.assignedToRole;
        if (filters.assignedToUserId) query.assignedToUserId = filters.assignedToUserId;
        if (filters.searchTerm) query.title = { $regex: filters.searchTerm, $options: 'i' };
        if (filters.systemTaskKey) query.systemTaskKey = filters.systemTaskKey;
        return this.taskModel.find(query).sort({ priority: -1, dueDate: 1 }).lean().exec();
    }

    async findVisibleForUser(userId: string, roles: string[], activeOnly = false) {
        const query: any = {
            isDeleted: { $ne: true },
            $or: [
                { assignmentType: 'User', assignedToUserId: userId },
                { assignmentType: 'Role', assignedToRole: { $in: roles || [] } },
                { assignmentType: 'Broadcast' },
            ],
        };
        if (activeOnly) query.status = { $in: ['Pending', 'InProgress'] };
        const tasks = await this.taskModel.find(query).sort({ priority: -1, dueDate: 1 }).lean().exec();
        return Promise.all(tasks.map(async (t) => {
            if (t.assignmentType === 'Role') {
                const count = await this.completionModel.countDocuments({ taskId: t._id });
                const mine = await this.completionModel.exists({ taskId: t._id, userId });
                return { ...t, completionCount: count, isCompletedByMe: !!mine };
            }
            return t;
        }));
    }

    async findOne(id: string) {
        const task = await this.taskModel.findById(id).lean().exec();
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    async update(id: string, dto: UpdateTaskDto, userId: string) {
        const task = await this.taskModel.findById(id);
        if (!task) throw new NotFoundException('Task not found');
        Object.assign(task, dto);
        await task.save();
        await this.log(id, userId, 'Updated');
        return task;
    }

    async softDelete(id: string, userId: string) {
        const task = await this.taskModel.findById(id);
        if (!task) throw new NotFoundException('Task not found');
        task.isDeleted = true;
        await task.save();
        await this.log(id, userId, 'Deleted');
        return task;
    }

    async start(id: string, userId: string, roles: string[]) {
        const task = await this.validateAccess(id, userId, roles);
        task.status = 'InProgress';
        task.startedDate = new Date();
        await task.save();
        await this.log(id, userId, 'Started');
        return task;
    }

    async complete(id: string, userId: string, roles: string[]) {
        const task = await this.validateAccess(id, userId, roles);

        if (task.assignmentType === 'User' && task.assignedToUserId !== userId) throw new ForbiddenException('Not assigned to you');
        if (task.assignmentType === 'Role' && (!roles || !roles.includes(task.assignedToRole))) throw new ForbiddenException('Not assigned role');

        if (task.assignmentType === 'Role') {
            await this.completionModel.updateOne(
                { taskId: id, userId },
                { taskId: id, userId, completionDate: new Date() },
                { upsert: true },
            );
        }

        task.status = 'Completed';
        task.completedDate = new Date();
        task.completedBy = userId;
        await task.save();
        await this.log(id, userId, 'Completed');
        return task;
    }

    async cancel(id: string, userId: string) {
        const task = await this.taskModel.findById(id);
        if (!task) throw new NotFoundException('Task not found');
        task.status = 'Cancelled';
        await task.save();
        await this.log(id, userId, 'Cancelled');
        return task;
    }

    async getCompletions(id: string) {
        return this.completionModel.find({ taskId: id }).lean().exec();
    }

    async dashboardStats(userId: string, roles: string[]) {
        const tasks = await this.findVisibleForUser(userId, roles, false);
        const totals = tasks.length;
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;
        return { totals, completed, overdue };
    }

    async bulkCreate(items: CreateTaskDto[], userId: string) {
        const docs = items.map(dto => ({
            ...dto,
            createdBy: userId,
            taskType: dto.systemTaskKey ? 'SystemGenerated' : 'Manual',
        }));
        return this.taskModel.insertMany(docs);
    }

    // Simplified placeholder
    async generateSystemTasks() {
        return [];
    }

    private async validateAccess(id: string, userId: string, roles: string[]) {
        const task = await this.taskModel.findById(id);
        if (!task) throw new NotFoundException('Task not found');
        const visible = (task.assignmentType === 'User' && task.assignedToUserId === userId)
            || (task.assignmentType === 'Role' && roles?.includes(task.assignedToRole))
            || task.assignmentType === 'Broadcast'
            || task.createdBy === userId;
        if (!visible) throw new ForbiddenException('Not authorized');
        return task;
    }

    private async log(taskId: string, userId: string, action: string) {
        await this.historyModel.create({ taskId, userId, action, actionDate: new Date() });
    }
}
