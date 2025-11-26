import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFeePlanDto } from './dto/create-fee-plan.dto';

@Injectable()
export class FeePlansService {
    constructor(@InjectModel('FeePlan') private feePlanModel: Model<any>) { }

    async findAll() {
        return this.feePlanModel.find().sort({ createdAt: -1 }).lean().exec();
    }

    async create(dto: CreateFeePlanDto) {
        const created = new this.feePlanModel({
            ...dto,
            currency: dto.currency || 'USD',
        });
        return created.save();
    }
}
