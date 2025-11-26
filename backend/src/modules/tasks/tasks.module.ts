import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskSchema } from '../../infrastructure/persistence/mongoose/schemas/task.schema';
import { TaskCompletionSchema } from '../../infrastructure/persistence/mongoose/schemas/task-completion.schema';
import { TaskHistorySchema } from '../../infrastructure/persistence/mongoose/schemas/task-history.schema';

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
export class TasksModule { }
