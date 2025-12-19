import { Module } from '@nestjs/common';
import { SubscriptionJobsService } from '../../application/services/subscription/subscription-jobs.service';
import { TenantModule } from '../tenant/tenant.module';
import { PluginsModule } from '../plugins/plugins.module';

@Module({
    imports: [TenantModule, PluginsModule],
    providers: [SubscriptionJobsService],
})
export class SubscriptionJobsModule { }
