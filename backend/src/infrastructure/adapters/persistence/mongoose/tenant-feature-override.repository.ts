import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';
import { TenantFeatureOverrideDocument } from './schemas/tenant-feature-override.schema';

@Injectable()
export class MongooseTenantFeatureOverrideRepository extends TenantScopedRepository<TenantFeatureOverrideDocument, { tenantId: string; featureKey: string; value: string; }> {
    constructor(
        @InjectModel('TenantFeatureOverride') private readonly overrideModel: Model<TenantFeatureOverrideDocument>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async findMapByTenantId(tenantId: string): Promise<Record<string, string>> {
        const resolvedTenantId = this.requireTenant(tenantId);
        const filter = { tenantId: new Types.ObjectId(resolvedTenantId) };
        const rows = await this.overrideModel.find(filter).lean().exec();
        const map: Record<string, string> = {};
        for (const row of rows) {
            map[row.featureKey] = row.value;
        }
        return map;
    }
}
