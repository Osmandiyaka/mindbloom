import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule, InjectModel } from '@nestjs/mongoose';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskSchema } from '../../infrastructure/persistence/mongoose/schemas/task.schema';
import { TaskCompletionSchema } from '../../infrastructure/persistence/mongoose/schemas/task-completion.schema';
import { TaskHistorySchema } from '../../infrastructure/persistence/mongoose/schemas/task-history.schema';
import { seedTasks } from './tasks.seed';
import { Model } from 'mongoose';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Task', schema: TaskSchema },
            { name: 'TaskCompletion', schema: TaskCompletionSchema },
            { name: 'TaskHistory', schema: TaskHistorySchema },
        ]),
    ],
    controllers: [TasksController],
    providers: [TasksService],
    exports: [TasksService],
})
export class TasksModule implements OnModuleInit {
    constructor(
        @InjectModel('Task') private readonly taskModel: Model<any>
    ) {}

    async onModuleInit() {
        // Seed tasks on startup (for demo/design). In production, move this to a dedicated seeder.
        await seedTasks(this.taskModel);
    }
}
