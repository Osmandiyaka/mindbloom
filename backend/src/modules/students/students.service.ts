import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class StudentsService {
    constructor(@InjectModel('StudentStub') private studentModel: Model<any>) { }

    async findAll() {
        return this.studentModel.find().sort({ createdAt: -1 }).lean().exec();
    }

    async create(dto: any) {
        const created = new this.studentModel(dto);
        return created.save();
    }
}
