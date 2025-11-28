import { TenantSettings } from '../../../../domain/tenant/entities/tenant.entity';

export class UpdateTenantSettingsCommand {
    constructor(
        public readonly tenantId: string,
        public readonly settings: TenantSettings,
    ) { }
}
