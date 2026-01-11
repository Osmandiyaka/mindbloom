import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { School, SchoolType, SchoolStatus } from '../../../../domain/school/entities/school.entity';
import { ISchoolRepository } from '../../../../domain/ports/out/school-repository.port';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';

type SchoolDocument = {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    name: string;
    code: string;
    type: string;
    status: string;
    domain?: string;
    address?: Record<string, any>;
    contact?: Record<string, any>;
    settings?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
};

@Injectable()
export class MongooseSchoolRepository extends TenantScopedRepository<SchoolDocument, School> implements ISchoolRepository {
    constructor(
        @InjectModel('School')
        private readonly schoolModel: Model<SchoolDocument>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async findAll(tenantId: string): Promise<School[]> {
        const resolved = this.requireTenant(tenantId);
        const docs = await this.schoolModel.find({ tenantId: new Types.ObjectId(resolved) }).sort({ name: 1 });
        return docs.map(doc => this.toDomain(doc));
    }

    async findById(id: string, tenantId: string): Promise<School | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.schoolModel.findOne({
            _id: new Types.ObjectId(id),
            tenantId: new Types.ObjectId(resolved),
        });
        return doc ? this.toDomain(doc) : null;
    }

    async findByCode(code: string, tenantId: string): Promise<School | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.schoolModel.findOne({
            code,
            tenantId: new Types.ObjectId(resolved),
        });
        return doc ? this.toDomain(doc) : null;
    }

    async create(school: School): Promise<School> {
        const tenantId = this.requireTenant(school.tenantId);
        const doc = new this.schoolModel({
            _id: new Types.ObjectId(school.id),
            tenantId: new Types.ObjectId(tenantId),
            name: school.name,
            code: school.code,
            type: school.type,
            status: school.status,
            address: school.address,
            contact: school.contact,
            settings: school.settings,
        });

        const saved = await doc.save();
        return this.toDomain(saved);
    }

    async count(tenantId: string): Promise<number> {
        const resolved = this.requireTenant(tenantId);
        return this.schoolModel.countDocuments({ tenantId: new Types.ObjectId(resolved) });
    }

    private toDomain(doc: SchoolDocument): School {
        return new School(
            doc._id.toString(),
            doc.tenantId.toString(),
            doc.name,
            doc.code,
            (doc.type as SchoolType) ?? SchoolType.MIXED,
            (doc.status as SchoolStatus) ?? SchoolStatus.PENDING_SETUP,
            doc.address,
            doc.contact,
            doc.settings,
            doc.createdAt,
            doc.updatedAt,
        );
    }
}
