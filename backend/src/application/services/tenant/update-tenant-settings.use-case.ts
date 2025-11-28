import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { TenantSettings } from '../../../domain/tenant/entities/tenant.entity';
import { UpdateTenantSettingsCommand } from '../../ports/in/commands/update-tenant-settings.command';

@Injectable()
export class UpdateTenantSettingsUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(command: UpdateTenantSettingsCommand): Promise<TenantSettings> {
        const tenant = await this.tenantRepository.findById(command.tenantId);
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        const merged: TenantSettings = {
            ...tenant.settings,
            ...command.settings,
            customization: {
                ...(tenant.settings?.customization || {}),
                ...(command.settings.customization || {}),
            },
            academicYear: command.settings.academicYear || tenant.settings?.academicYear,
        };

        const updated = await this.tenantRepository.update(tenant.id, {
            settings: merged,
        });

        return updated.settings || {};
    }
}
