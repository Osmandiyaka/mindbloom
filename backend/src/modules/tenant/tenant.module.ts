import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantController } from '../../presentation/controllers/tenant.controller';
import { HostEditionsController } from '../../presentation/controllers/host-editions.controller';
import { HostTenantSubscriptionsController } from '../../presentation/controllers/host-tenant-subscriptions.controller';
import { GetTenantBySubdomainUseCase, GetTenantByIdUseCase, CreateTenantUseCase, GetTenantSettingsUseCase, UpdateTenantSettingsUseCase, ListTenantsUseCase, TenantManager } from '../../application/services/tenant';
import { TenantPlanMailer } from '../../application/services/tenant/tenant-plan.mailer';
import { TenantSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/tenant.schema';
import { MongooseTenantRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-tenant.repository';
import { EDITION_REPOSITORY, TENANT_FEATURE_OVERRIDE_REPOSITORY, TENANT_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { HostContextGuard } from '../../common/guards/host-context.guard';
import { EditionSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/edition.schema';
import { EditionFeatureSettingSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/edition-feature-setting.schema';
import { MongooseEditionRepository } from '../../infrastructure/adapters/persistence/mongoose/edition.repository';
import { EditionManager } from '../../application/services/subscription/edition-manager.service';
import { TenantFeatureOverrideSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/tenant-feature-override.schema';
import { MongooseTenantFeatureOverrideRepository } from '../../infrastructure/adapters/persistence/mongoose/tenant-feature-override.repository';
import { EffectiveFeatureResolver } from '../../application/services/features/effective-feature-resolver.service';
import { TenantContext } from '../../common/tenant/tenant.context';
import { FeatureValidationService } from '../../application/services/features/feature-validation.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Tenant', schema: TenantSchema },
            { name: 'Edition', schema: EditionSchema },
            { name: 'EditionFeatureSetting', schema: EditionFeatureSettingSchema },
            { name: 'TenantFeatureOverride', schema: TenantFeatureOverrideSchema },
        ]),
        RolesModule,
        UsersModule,
        MailModule,
    ],
    controllers: [TenantController, HostEditionsController, HostTenantSubscriptionsController],
    providers: [
        {
            provide: TENANT_REPOSITORY,
            useClass: MongooseTenantRepository,
        },
        {
            provide: EDITION_REPOSITORY,
            useClass: MongooseEditionRepository,
        },
        {
            provide: TENANT_FEATURE_OVERRIDE_REPOSITORY,
            useClass: MongooseTenantFeatureOverrideRepository,
        },
        GetTenantBySubdomainUseCase,
        GetTenantByIdUseCase,
        CreateTenantUseCase,
        GetTenantSettingsUseCase,
        UpdateTenantSettingsUseCase,
        ListTenantsUseCase,
        TenantManager,
        EditionManager,
        FeatureValidationService,
        EffectiveFeatureResolver,
        TenantPlanMailer,
        PermissionGuard,
        HostContextGuard,
        TenantContext,
    ],
    exports: [
        TENANT_REPOSITORY,
        EDITION_REPOSITORY,
        TENANT_FEATURE_OVERRIDE_REPOSITORY,
        GetTenantBySubdomainUseCase,
        GetTenantByIdUseCase,
        CreateTenantUseCase,
        GetTenantSettingsUseCase,
        UpdateTenantSettingsUseCase,
        ListTenantsUseCase,
        TenantManager,
        EditionManager,
        FeatureValidationService,
        EffectiveFeatureResolver,
        TenantContext,
    ],
})
export class TenantModule { }
