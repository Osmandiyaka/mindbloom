import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class FeePlansService {
    constructor(@InjectModel('FeePlan') private feePlanModel: Model<any>) { }

    async findAll() {
        return this.feePlanModel.find().sort({ createdAt: -1 }).lean().exec();
    }

    async create(dto: any) {
        const created = new this.feePlanModel(dto);
        return created.save();
    }
}
