import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantController } from '../../presentation/controllers/tenant.controller';
import { GetTenantBySubdomainUseCase, GetTenantByIdUseCase, CreateTenantUseCase, GetTenantSettingsUseCase, UpdateTenantSettingsUseCase } from '../../application/tenant/use-cases';
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
        GetTenantSettingsUseCase,
        UpdateTenantSettingsUseCase,
    ],
    exports: [
        TENANT_REPOSITORY,
        GetTenantBySubdomainUseCase,
        GetTenantByIdUseCase,
        CreateTenantUseCase,
        GetTenantSettingsUseCase,
        UpdateTenantSettingsUseCase,
    ],
})
export class TenantModule { }
