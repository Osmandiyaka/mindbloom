import { Inject, Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Tenant, TenantPlan, TenantStatus, WeekStart, AcademicYearSettings } from '../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { CreateTenantCommand } from '../../ports/in/commands/create-tenant.command';
import { InitializeSystemRolesUseCase } from '../rbac/initialize-system-roles.use-case';
import { CreateUserUseCase } from '../user';
import { SYSTEM_ROLE_NAMES } from '../../../domain/rbac/entities/system-roles';

@Injectable()
export class CreateTenantUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
        private readonly initializeSystemRolesUseCase: InitializeSystemRolesUseCase,
        private readonly createUserUseCase: CreateUserUseCase,
    ) { }

    async execute(command: CreateTenantCommand): Promise<Tenant> {
        if (!command.name?.trim()) {
            throw new BadRequestException('Tenant name is required');
        }

        const baseSubdomain = this.slugify(command.subdomain || command.name);
        const subdomain = await this.ensureUniqueSubdomain(baseSubdomain);
        const schoolId = command.schoolId || this.generateSchoolId();
        const adminPassword = command.adminPassword || this.generateTemporaryPassword();
        const locale = command.locale || 'en-GB';
        const timezone = command.timezone || 'Europe/London';
        const weekStartsOn = (command.weekStartsOn as WeekStart) || WeekStart.MONDAY;
        const academicYear = this.resolveAcademicYear(command.academicYear);

        const tenant = Tenant.create({
            name: command.name,
            subdomain,
            ownerId: command.ownerId || null,
            contactEmail: command.contactEmail,
            contactPhone: command.contactPhone,
            address: command.address,
            logo: command.logo,
            plan: (command.plan || TenantPlan.TRIAL) as TenantPlan,
            status: (command.status || TenantStatus.PENDING) as TenantStatus,
            locale,
            timezone,
            weekStartsOn,
            academicYear,
            metadata: { schoolId, initialConfigRequired: true },
        });

        const createdTenant = await this.tenantRepository.create(tenant);

        try {
            const roles = await this.initializeSystemRolesUseCase.execute(createdTenant.id);
            const tenantAdminRole = roles.find((role) => role.name === SYSTEM_ROLE_NAMES.TENANT_ADMIN)
                || roles.find((role) => role.name === SYSTEM_ROLE_NAMES.SUPER_ADMIN);

            if (!tenantAdminRole) {
                throw new Error('Tenant Admin role could not be initialized');
            }

            const adminUser = await this.createUserUseCase.execute({
                tenantId: createdTenant.id,
                email: command.adminEmail,
                name: command.adminName,
                password: adminPassword,
                roleId: tenantAdminRole.id,
                forcePasswordReset: true,
            });

            return await this.tenantRepository.update(createdTenant.id, {
                ...createdTenant,
                ownerId: adminUser.id,
            } as Tenant);
        } catch (error) {
            await this.tenantRepository.delete(createdTenant.id);
            throw error;
        }
    }

    private slugify(value: string): string {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 32) || 'school';
    }

    private async ensureUniqueSubdomain(base: string): Promise<string> {
        let candidate = base;
        let counter = 1;
        while (await this.tenantRepository.findBySubdomain(candidate)) {
            candidate = `${base}-${counter}`;
            counter++;
            if (counter > 50) {
                throw new ConflictException('Unable to generate unique subdomain');
            }
        }
        return candidate;
    }

    private generateSchoolId(): string {
        return `SCH-${randomUUID().split('-')[0].toUpperCase()}`;
    }

    private generateTemporaryPassword(): string {
        const raw = randomUUID().replace(/-/g, '');
        return `${raw.slice(0, 6)}Aa!${raw.slice(6, 10)}`;
    }

    private resolveAcademicYear(input?: { start: Date | string; end: Date | string; name?: string; }): AcademicYearSettings | undefined {
        if (input?.start && input?.end) {
            return {
                start: new Date(input.start),
                end: new Date(input.end),
                name: input.name,
            };
        }

        const today = new Date();
        const year = today.getFullYear();
        const startYear = today.getMonth() >= 7 ? year : year - 1; // academic year starts Sep (month 8)
        const start = new Date(Date.UTC(startYear, 8, 1)); // Sep 1
        const end = new Date(Date.UTC(startYear + 1, 6, 31, 23, 59, 59, 999)); // July 31 next year
        return {
            start,
            end,
            name: `AY ${start.getUTCFullYear()}-${end.getUTCFullYear()}`,
        };
    }
}
