import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository } from '../../../../domain/tenant/ports/tenant.repository.interface';
import { TenantDocument } from '../schemas/tenant.schema';

@Injectable()
export class MongooseTenantRepository implements ITenantRepository {
    constructor(
        @InjectModel('Tenant')
        private readonly tenantModel: Model<TenantDocument>,
    ) { }

    async findAll(): Promise<Tenant[]> {
        const tenants = await this.tenantModel.find().exec();
        return tenants.map(this.toDomain);
    }

    async findById(id: string): Promise<Tenant | null> {
        const tenant = await this.tenantModel.findById(id).exec();
        return tenant ? this.toDomain(tenant) : null;
    }

    async findBySubdomain(subdomain: string): Promise<Tenant | null> {
        const tenant = await this.tenantModel.findOne({ subdomain }).exec();
        return tenant ? this.toDomain(tenant) : null;
    }

    async create(tenant: Tenant): Promise<Tenant> {
        const created = await this.tenantModel.create({
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            plan: tenant.plan,
            settings: tenant.settings,
        });

        return this.toDomain(created);
    }

    async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
        const updated = await this.tenantModel
            .findByIdAndUpdate(
                id,
                {
                    name: data.name,
                    subdomain: data.subdomain,
                    status: data.status,
                    plan: data.plan,
                    settings: data.settings,
                },
                { new: true }
            )
            .exec();

        if (!updated) {
            throw new Error(`Tenant with id ${id} not found`);
        }

        return this.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.tenantModel.findByIdAndDelete(id).exec();
    }

    private toDomain(doc: TenantDocument): Tenant {
        return new Tenant(
            doc._id.toString(),
            doc.name,
            doc.subdomain,
            doc.status as 'active' | 'suspended' | 'inactive',
            doc.plan as 'free' | 'basic' | 'premium' | 'enterprise',
            doc.settings,
            doc.createdAt,
            doc.updatedAt,
        );
    }
}
