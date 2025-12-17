import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantController } from '../../presentation/controllers/tenant.controller';
import { GetTenantBySubdomainUseCase, GetTenantByIdUseCase, CreateTenantUseCase, GetTenantSettingsUseCase, UpdateTenantSettingsUseCase } from '../../application/services/tenant';
import { TenantPlanMailer } from '../../application/services/tenant/tenant-plan.mailer';
import { TenantSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/tenant.schema';
import { MongooseTenantRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-tenant.repository';
import { TENANT_REPOSITORY } from '../../domain/ports/out/tenant-repository.port';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../../infrastructure/mail/mail.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Tenant', schema: TenantSchema },
        ]),
        RolesModule,
        UsersModule,
        MailModule,
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
        TenantPlanMailer,
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
