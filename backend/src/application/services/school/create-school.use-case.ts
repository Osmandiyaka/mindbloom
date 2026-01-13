import { Inject, Injectable } from '@nestjs/common';
import { ISchoolRepository, SCHOOL_REPOSITORY } from '../../../domain/ports/out/school-repository.port';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { School, SchoolStatus, SchoolType } from '../../../domain/school/entities/school.entity';

@Injectable()
export class CreateSchoolUseCase {
    constructor(
        @Inject(SCHOOL_REPOSITORY)
        private readonly schoolRepository: ISchoolRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(input: {
        tenantId: string;
        name: string;
        code?: string;
        type?: SchoolType;
        status?: SchoolStatus;
        domain?: string;
    }): Promise<School> {
        const code = input.code?.trim() || await this.generateCode(input.tenantId);
        const existing = await this.schoolRepository.findByCode(code, input.tenantId);
        if (existing) {
            const updated = School.create({
                id: existing.id,
                tenantId: existing.tenantId,
                name: input.name,
                code,
                type: input.type ?? existing.type,
                status: input.status ?? existing.status,
                address: existing.address,
                contact: input.domain
                    ? { ...existing.contact, website: input.domain }
                    : existing.contact,
                settings: existing.settings,
                createdAt: existing.createdAt,
                updatedAt: new Date(),
            });
            return this.schoolRepository.update(updated);
        }
        const school = School.create({
            tenantId: input.tenantId,
            name: input.name,
            code,
            type: input.type,
            status: input.status,
            contact: input.domain ? { website: input.domain } : undefined,
        });

        return this.schoolRepository.create(school);
    }

    private async generateCode(tenantId: string): Promise<string> {
        const tenant = await this.tenantRepository.findById(tenantId);
        const prefixSource = tenant?.subdomain || tenant?.name || 'school';
        const prefix = prefixSource.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4) || 'SCH';
        const count = await this.schoolRepository.count(tenantId);

        for (let i = count + 1; i < count + 1000; i += 1) {
            const code = `${prefix}-${String(i).padStart(3, '0')}`;
            const exists = await this.schoolRepository.findByCode(code, tenantId);
            if (!exists) {
                return code;
            }
        }

        return `${prefix}-${Date.now().toString().slice(-6)}`;
    }
}
