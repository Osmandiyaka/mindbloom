import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClassConfigEntity } from '../../../../domain/academics/entities/class-config.entity';
import { IClassConfigRepository } from '../../../../domain/ports/out/class-config-repository.port';

type ClassConfigDoc = {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    classesScope: 'perAcademicYear' | 'global';
    requireGradeLink: boolean;
    sectionUniquenessScope: 'perClass' | 'perClassPerSchool';
    updatedAt?: Date;
    updatedBy?: Types.ObjectId | null;
};

@Injectable()
export class MongooseClassConfigRepository implements IClassConfigRepository {
    constructor(@InjectModel('ClassConfig') private readonly configModel: Model<ClassConfigDoc>) {}

    async get(tenantId: string): Promise<ClassConfigEntity | null> {
        const doc = await this.configModel.findOne({ tenantId }).lean().exec();
        return doc ? this.toEntity(doc) : null;
    }

    async upsert(entity: ClassConfigEntity): Promise<ClassConfigEntity> {
        const doc = await this.configModel
            .findOneAndUpdate(
                { tenantId: entity.tenantId },
                {
                    $set: {
                        classesScope: entity.classesScope,
                        requireGradeLink: entity.requireGradeLink,
                        sectionUniquenessScope: entity.sectionUniquenessScope,
                        updatedBy: entity.updatedBy ?? null,
                        updatedAt: new Date(),
                    },
                },
                { new: true, upsert: true },
            )
            .lean()
            .exec();
        return this.toEntity(doc as ClassConfigDoc);
    }

    private toEntity(doc: ClassConfigDoc): ClassConfigEntity {
        return new ClassConfigEntity({
            tenantId: doc.tenantId.toString(),
            classesScope: doc.classesScope ?? 'global',
            requireGradeLink: doc.requireGradeLink ?? false,
            sectionUniquenessScope: doc.sectionUniquenessScope ?? 'perClassPerSchool',
            updatedAt: doc.updatedAt,
            updatedBy: doc.updatedBy?.toString() ?? null,
        });
    }
}
