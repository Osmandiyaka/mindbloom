import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntitlementRepository } from '../../../../domain/ports/out/entitlement-repository.port';
import { SchoolEntitlementDocument } from './schemas/school-entitlement.schema';
import { ModuleKey } from '../../../../domain/subscription/entities/plan.entity';

@Injectable()
export class MongooseEntitlementRepository implements EntitlementRepository {
    constructor(
        @InjectModel('SchoolEntitlement') private readonly entitlementModel: Model<SchoolEntitlementDocument>,
    ) { }

    async upsertMany(tenantId: string, planId: string, modules: Array<{ moduleKey: ModuleKey; enabled: boolean }>): Promise<void> {
        if (!modules.length) return;
        const now = new Date();
        await this.entitlementModel.bulkWrite(
            modules.map((mod) => ({
                updateOne: {
                    filter: { tenantId, moduleKey: mod.moduleKey },
                    update: {
                        $set: {
                            enabled: mod.enabled,
                            sourcePlanId: planId,
                            updatedAt: now,
                        },
                    },
                    upsert: true,
                },
            })),
        );
    }

    async disableMissingModules(tenantId: string, planId: string, moduleKeys: ModuleKey[]): Promise<void> {
        await this.entitlementModel.updateMany(
            {
                tenantId,
                sourcePlanId: planId,
                moduleKey: { $nin: moduleKeys },
            },
            { $set: { enabled: false, updatedAt: new Date() } },
        ).exec();
    }

    async findByTenantAndModule(tenantId: string, moduleKey: ModuleKey): Promise<{ enabled: boolean; sourcePlanId?: string } | null> {
        const doc = await this.entitlementModel.findOne({ tenantId, moduleKey }).exec();
        if (!doc) return null;
        return { enabled: doc.enabled, sourcePlanId: doc.sourcePlanId?.toString() };
    }
}
