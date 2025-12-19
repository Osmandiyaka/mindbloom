import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantController } from '../../presentation/controllers/tenant.controller';
import { GetTenantBySubdomainUseCase, GetTenantByIdUseCase, CreateTenantUseCase, GetTenantSettingsUseCase, UpdateTenantSettingsUseCase, ListTenantsUseCase, TenantManager } from '../../application/services/tenant';
import { TenantPlanMailer } from '../../application/services/tenant/tenant-plan.mailer';
import { TenantSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/tenant.schema';
import { MongooseTenantRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-tenant.repository';
import { EDITION_REPOSITORY, TENANT_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { EditionSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/edition.schema';
import { EditionFeatureSettingSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/edition-feature-setting.schema';
import { MongooseEditionRepository } from '../../infrastructure/adapters/persistence/mongoose/edition.repository';
import { EditionManager } from '../../application/services/subscription/edition-manager.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Tenant', schema: TenantSchema },
            { name: 'Edition', schema: EditionSchema },
            { name: 'EditionFeatureSetting', schema: EditionFeatureSettingSchema },
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
        {
            provide: EDITION_REPOSITORY,
            useClass: MongooseEditionRepository,
        },
        GetTenantBySubdomainUseCase,
        GetTenantByIdUseCase,
        CreateTenantUseCase,
        GetTenantSettingsUseCase,
        UpdateTenantSettingsUseCase,
        ListTenantsUseCase,
        TenantManager,
        EditionManager,
        TenantPlanMailer,
        PermissionGuard,
    ],
    exports: [
        TENANT_REPOSITORY,
        EDITION_REPOSITORY,
        GetTenantBySubdomainUseCase,
        GetTenantByIdUseCase,
        CreateTenantUseCase,
        GetTenantSettingsUseCase,
        UpdateTenantSettingsUseCase,
        ListTenantsUseCase,
        TenantManager,
        EditionManager,
    ],
})
export class TenantModule { }
