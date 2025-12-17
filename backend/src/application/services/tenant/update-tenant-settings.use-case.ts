import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { Tenant } from '../../../domain/tenant/entities/tenant.entity';
import { UpdateTenantSettingsCommand } from '../../ports/in/commands/update-tenant-settings.command';

@Injectable()
export class UpdateTenantSettingsUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(command: UpdateTenantSettingsCommand): Promise<Tenant> {
        const tenant = await this.tenantRepository.findById(command.tenantId);
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        if (command.settings.customization?.customDomain && command.settings.customization.customDomain !== tenant.customization?.customDomain) {
            const existing = await this.tenantRepository.findByCustomDomain(command.settings.customization.customDomain);
            if (existing && existing.id !== tenant.id) {
                throw new ConflictException('Custom domain is already in use');
            }
        }

        const updated = await this.tenantRepository.update(tenant.id, {
            ...tenant,
            ...command.settings,
            customization: {
                ...(tenant.customization || {}),
                ...(command.settings.customization || {}),
            },
            contactInfo: {
                ...(tenant.contactInfo || {}),
                ...(command.settings.contactInfo || {}),
                address: {
                    ...(tenant.contactInfo?.address || {}),
                    ...(command.settings.contactInfo?.address || {}),
                },
            },
            billing: {
                ...(tenant.billing || {}),
                ...(command.settings.billing || {}),
            },
            limits: {
                ...(tenant.limits || {}),
                ...(command.settings.limits || {}),
            },
            usage: {
                ...(tenant.usage || {}),
                ...(command.settings.usage || {}),
            },
            academicYear: {
                ...(tenant.academicYear || {}),
                ...(command.settings.academicYear || {}),
            },
            idTemplates: {
                ...(tenant as any).idTemplates || {},
                ...(command.settings as any).idTemplates || {},
            },
        } as any);

        return updated;
    }
}
