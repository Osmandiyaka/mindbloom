import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AdmissionsService {
    constructor(@InjectModel('Admission') private admissionModel: Model<any>) { }

    async findAll() {
        return this.admissionModel.find().sort({ createdAt: -1 }).lean().exec();
    }

    async create(dto: any) {
        const created = new this.admissionModel(dto);
        return created.save();
    }

    async updateStatus(id: string, status: string) {
        const updated = await this.admissionModel.findByIdAndUpdate(
            id,
            { status, updatedAt: new Date() },
            { new: true }
        );
        if (!updated) throw new NotFoundException('Admission not found');
        return updated;
    }
}
