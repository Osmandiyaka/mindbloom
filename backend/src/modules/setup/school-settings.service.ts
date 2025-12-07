import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';
import { StorageManager } from '../../core/storage/storage.manager';
import * as path from 'path';

type UploadedFileType = {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size?: number;
};

@Injectable()
export class SchoolSettingsService {
    constructor(
        @InjectModel('SchoolSettings') private settingsModel: Model<any>,
        private readonly storageManager: StorageManager,
    ) {}

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

    async uploadAsset(type: 'logo' | 'favicon', file: UploadedFileType) {
        if (!file) throw new BadRequestException('File is required');

        const storage = this.storageManager.scoped('school');
        const ext = path.extname(file.originalname) || '';
        const safeType = type === 'logo' ? 'logo' : 'favicon';
        const fileName = `${safeType}-${Date.now()}${ext}`;
        const stored = await storage.upload(fileName, file.buffer, file.mimetype);

        const update: Record<string, any> = {};
        if (safeType === 'logo') update.logoUrl = stored.url || stored.key;
        if (safeType === 'favicon') update.faviconUrl = stored.url || stored.key;

        await this.settingsModel.findOneAndUpdate(
            {},
            { $set: update },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return stored;
    }
}
