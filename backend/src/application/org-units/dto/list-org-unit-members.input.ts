import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class ListOrgUnitMembersInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsBoolean()
    includeInherited?: boolean;
}
