import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantController } from '../../adapters/http/tenant/tenant.controller';
import { GetTenantBySubdomainUseCase, GetTenantByIdUseCase, CreateTenantUseCase } from '../../application/tenant/use-cases';
import { TenantSchema } from '../../infrastructure/persistence/mongoose/schemas/tenant.schema';
import { MongooseTenantRepository } from '../../infrastructure/persistence/mongoose/repositories/mongoose-tenant.repository';
import { TENANT_REPOSITORY } from '../../domain/tenant/ports/tenant.repository.interface';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Tenant', schema: TenantSchema },
        ]),
    ],
    controllers: [TenantController],
    providers: [
        {
            provide: TENANT_REPOSITORY,
            useClass: MongooseTenantRepository,
        },
        GetTenantBySubdomainUseCase,
        GetTenantByIdUseCase,
        CreateTenantUseCase,
    ],
    exports: [
        TENANT_REPOSITORY,
        GetTenantBySubdomainUseCase,
        GetTenantByIdUseCase,
        CreateTenantUseCase,
    ],
})
export class TenantModule { }
