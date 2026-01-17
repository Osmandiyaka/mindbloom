import { Inject } from '@nestjs/common';
import { ISchoolRepository, SCHOOL_REPOSITORY } from '../../../domain/ports/out/school-repository.port';
import { School, SchoolAddress, SchoolContact, SchoolSettings, SchoolStatus, SchoolType } from '../../../domain/school/entities/school.entity';

export class UpdateSchoolUseCase {
    constructor(
        @Inject(SCHOOL_REPOSITORY)
        private readonly schoolRepository: ISchoolRepository,
    ) { }

    async execute(command: {
        tenantId: string;
        id: string;
        name?: string;
        code?: string;
        type?: SchoolType;
        status?: SchoolStatus;
        domain?: string;
        address?: SchoolAddress;
        contact?: SchoolContact;
        settings?: SchoolSettings;
    }): Promise<School> {
        const existing = await this.schoolRepository.findById(command.id, command.tenantId);
        if (!existing) {
            throw new Error('School not found');
        }

        const mergedContact = command.contact
            ? { ...(existing.contact || {}), ...command.contact }
            : existing.contact;
        const contactWithDomain = command.domain
            ? { ...(mergedContact || {}), website: command.domain }
            : mergedContact;

        const updated = School.create({
            id: existing.id,
            tenantId: existing.tenantId,
            name: command.name ?? existing.name,
            code: command.code ?? existing.code,
            type: command.type ?? existing.type,
            status: command.status ?? existing.status,
            address: command.address ?? existing.address,
            contact: contactWithDomain,
            settings: command.settings ?? existing.settings,
            createdAt: existing.createdAt,
            updatedAt: new Date(),
        });

        return this.schoolRepository.update(updated);
    }
}
