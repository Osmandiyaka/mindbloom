import { forwardRef, Module } from '@nestjs/common';
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
import { FeatureValidationService } from '../../application/services/features/feature-validation.service';
import { SubscriptionLifecycleService } from '../../application/services/subscription/subscription-lifecycle.service';
import { PluginsModule } from '../plugins/plugins.module';
import { ExpirationPolicyEngine } from '../../application/services/subscription/expiration-policy.engine';
import { InitializeGlobalEditionsUseCase } from '../../application/services/subscription/initialize-global-editions.use-case';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
class EditionsInitializer implements OnApplicationBootstrap {
    private readonly logger = new Logger(EditionsInitializer.name);

    constructor(private readonly initializeGlobalEditions: InitializeGlobalEditionsUseCase) { }

    async onApplicationBootstrap(): Promise<void> {
        try {
            const editions = await this.initializeGlobalEditions.execute();
            this.logger.log(`Global editions ready (${editions.length})`);
        } catch (err) {
            this.logger.error('Failed to initialize global editions', err?.stack || String(err));
            throw err;
        }
    }
}

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
        PluginsModule,
    ],
    controllers: [TenantController, HostEditionsController, HostTenantSubscriptionsController, (require('../../presentation/controllers/editions.controller').EditionsController)],
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
        ExpirationPolicyEngine,
        SubscriptionLifecycleService,
        FeatureValidationService,
        EffectiveFeatureResolver,
        TenantPlanMailer,
        PermissionGuard,
        HostContextGuard,
        // Edition initializer machinery
        InitializeGlobalEditionsUseCase,
        EditionsInitializer,
        {
            provide: 'EDITIONS_INITIALIZER_RUNNER',
            useFactory: async (initializer: EditionsInitializer) => initializer.onApplicationBootstrap(),
            inject: [EditionsInitializer],
        },
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
        ExpirationPolicyEngine,
        SubscriptionLifecycleService,
        FeatureValidationService,
        EffectiveFeatureResolver,
        InitializeGlobalEditionsUseCase,
    ],
})
export class TenantModule { }
