import { forwardRef, Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TenantResolutionService } from './tenant-resolution.service';
import { TenantGuard } from './tenant.guard';
import { TenantModule } from '../../modules/tenant/tenant.module';
import { FeatureGateGuard } from '../guards/feature-gate.guard';
import { EntitlementGuard } from '../guards/entitlement.guard';

@Global()
@Module({
    imports: [DatabaseModule, forwardRef(() => TenantModule)],
    providers: [TenantResolutionService, TenantGuard, FeatureGateGuard, EntitlementGuard],
    exports: [DatabaseModule, TenantModule, TenantResolutionService, TenantGuard, FeatureGateGuard, EntitlementGuard],
})
export class TenantSupportModule { }
