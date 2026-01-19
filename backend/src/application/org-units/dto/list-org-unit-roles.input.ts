import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class ListOrgUnitRolesInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;

    @IsOptional()
    @IsBoolean()
    includeInherited?: boolean;
}
