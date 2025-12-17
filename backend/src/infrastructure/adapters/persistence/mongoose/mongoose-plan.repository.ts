import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { PlanRepository } from '../../../../domain/ports/out/plan-repository.port';
import { Plan, PlanModule, PlanStatus, BillingInterval } from '../../../../domain/subscription/entities/plan.entity';
import { PlanDocument, PlanModuleDocument } from './schemas/plan.schema';

@Injectable()
export class MongoosePlanRepository implements PlanRepository {
    private readonly logger = new Logger(MongoosePlanRepository.name);

    constructor(
        @InjectModel('Plan') private readonly planModel: Model<PlanDocument>,
        @InjectModel('PlanModule') private readonly planModuleModel: Model<PlanModuleDocument>,
        @InjectConnection() private readonly connection: Connection,
    ) { }

    async create(plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Plan> {
        const session = await this.connection.startSession();
        try {
            let createdPlan: PlanDocument;
            await session.withTransaction(async () => {
                createdPlan = await this.planModel.create([{ ...plan }], { session }).then((res) => res[0]);

                const modules = this.dedupeModules(plan.modules);
                if (modules.length) {
                    await this.planModuleModel.bulkWrite(
                        modules.map((m) => ({
                            updateOne: {
                                filter: { planId: createdPlan!._id, moduleKey: m.moduleKey },
                                update: { $set: { enabled: m.enabled } },
                                upsert: true,
                            },
                        })),
                        { session },
                    );
                }
            });

            const modules = await this.fetchModulesForPlan((createdPlan!._id as any).toString());
            return this.toDomain(createdPlan!, modules);
        } finally {
            session.endSession();
        }
    }

    async update(planId: string, update: Partial<Omit<Plan, 'id' | 'modules'>> & { modules?: PlanModule[] }): Promise<Plan> {
        const session = await this.connection.startSession();
        try {
            let updatedPlan: PlanDocument | null = null;
            await session.withTransaction(async () => {
                updatedPlan = await this.planModel.findByIdAndUpdate(
                    planId,
                    { $set: { ...update, updatedAt: new Date() } },
                    { new: true, session },
                );

                if (!updatedPlan) {
                    throw new Error('Plan not found');
                }

                if (update.modules) {
                    const modules = this.dedupeModules(update.modules);
                    const planObjectId = new Types.ObjectId(planId);
                    await this.planModuleModel.deleteMany({ planId: planObjectId }, { session });
                    if (modules.length) {
                        await this.planModuleModel.bulkWrite(
                            modules.map((m) => ({
                                updateOne: {
                                    filter: { planId: planObjectId, moduleKey: m.moduleKey },
                                    update: { $set: { enabled: m.enabled } },
                                    upsert: true,
                                },
                            })),
                            { session },
                        );
                    }
                }
            });

            if (!updatedPlan) {
                throw new Error('Plan not found');
            }

            const modules = await this.fetchModulesForPlan(planId);
            return this.toDomain(updatedPlan, modules);
        } finally {
            session.endSession();
        }
    }

    async findById(id: string): Promise<Plan | null> {
        const plan = await this.planModel.findById(id).exec();
        if (!plan) return null;
        const modules = await this.fetchModulesForPlan(id);
        return this.toDomain(plan, modules);
    }

    async findByName(name: string): Promise<Plan | null> {
        const plan = await this.planModel.findOne({ name }).exec();
        if (!plan) return null;
        const modules = await this.fetchModulesForPlan((plan._id as any).toString());
        return this.toDomain(plan, modules);
    }

    async list(params?: { status?: PlanStatus; page?: number; pageSize?: number }): Promise<{ data: Plan[]; total: number; page: number; pageSize: number }> {
        const filter: Record<string, any> = {};
        if (params?.status) {
            filter.status = params.status;
        }
        const page = Math.max(params?.page || 1, 1);
        const pageSize = Math.min(Math.max(params?.pageSize || 20, 1), 100);

        const [plans, total] = await Promise.all([
            this.planModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).exec(),
            this.planModel.countDocuments(filter),
        ]);

        const planIds = plans.map((p) => (p._id as any).toString());
        const modulesByPlan = await this.fetchModulesForPlans(planIds);

        return {
            data: plans.map((p) => this.toDomain(p, modulesByPlan[(p._id as any).toString()] || [])),
            total,
            page,
            pageSize,
        };
    }

    private toDomain(doc: PlanDocument, modules: PlanModule[]): Plan {
        return new Plan(
            (doc._id as any).toString(),
            doc.name,
            doc.description,
            doc.status as PlanStatus,
            doc.currency,
            doc.priceAmount,
            doc.billingInterval as BillingInterval,
            modules,
            doc.createdAt,
            doc.updatedAt,
        );
    }

    private dedupeModules(modules: PlanModule[]): PlanModule[] {
        const seen = new Set<string>();
        const result: PlanModule[] = [];
        for (const mod of modules || []) {
            if (seen.has(mod.moduleKey)) continue;
            seen.add(mod.moduleKey);
            result.push({ moduleKey: mod.moduleKey, enabled: !!mod.enabled });
        }
        return result;
    }

    private async fetchModulesForPlan(planId: string): Promise<PlanModule[]> {
        const docs = await this.planModuleModel.find({ planId }).exec();
        return docs.map((m) => ({ moduleKey: m.moduleKey as any, enabled: m.enabled }));
    }

    private async fetchModulesForPlans(planIds: string[]): Promise<Record<string, PlanModule[]>> {
        if (!planIds.length) return {};
        const docs = await this.planModuleModel.find({ planId: { $in: planIds } }).exec();
        const map: Record<string, PlanModule[]> = {};
        docs.forEach((d) => {
            const id = (d.planId as any).toString();
            if (!map[id]) map[id] = [];
            map[id].push({ moduleKey: d.moduleKey as any, enabled: d.enabled });
        });
        return map;
    }
}
