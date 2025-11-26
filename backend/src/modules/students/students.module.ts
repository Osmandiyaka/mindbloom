import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentStubSchema } from '../../infrastructure/persistence/mongoose/schemas/student-stub.schema';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'StudentStub', schema: StudentStubSchema }]),
    ],
    controllers: [StudentsController],
    providers: [StudentsService],
    exports: [StudentsService],
})
export class StudentsModule { }
