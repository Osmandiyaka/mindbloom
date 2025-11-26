import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFeePlanDto } from './dto/create-fee-plan.dto';
import { UpdateFeePlanDto } from './dto/update-fee-plan.dto';

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

    async update(id: string, dto: UpdateFeePlanDto) {
        return this.feePlanModel.findByIdAndUpdate(id, dto, { new: true });
    }

    async remove(id: string) {
        return this.feePlanModel.findByIdAndDelete(id);
    }
}
