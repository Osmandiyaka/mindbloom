import { IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateOrgUnitInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    code?: string | null;

    @IsOptional()
    @IsIn(['organization', 'division', 'department', 'school', 'custom'])
    type?: 'organization' | 'division' | 'department' | 'school' | 'custom';

    @IsOptional()
    @IsIn(['active', 'archived'])
    status?: 'active' | 'archived';

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @IsString()
    actorUserId?: string | null;
}
