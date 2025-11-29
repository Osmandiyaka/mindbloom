import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TenantResolutionService } from './tenant-resolution.service';
import { TenantGuard } from './tenant.guard';
import { TenantModule } from '../../modules/tenant/tenant.module';

@Global()
@Module({
    imports: [DatabaseModule, TenantModule],
    providers: [TenantResolutionService, TenantGuard],
    exports: [TenantResolutionService, TenantGuard],
})
export class TenantSupportModule { }
