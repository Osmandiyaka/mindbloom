import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';

@Injectable()
export class SchoolSettingsService {
    constructor(@InjectModel('SchoolSettings') private settingsModel: Model<any>) {}

    async getSettings() {
        const existing = await this.settingsModel.findOne().lean().exec();
        return existing || {};
    }

    async upsertSettings(dto: UpdateSchoolSettingsDto) {
        return this.settingsModel
            .findOneAndUpdate(
                {},
                { $set: dto },
                { new: true, upsert: true, setDefaultsOnInsert: true },
            )
            .lean()
            .exec();
    }
}
