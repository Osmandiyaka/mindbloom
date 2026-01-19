import { IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateOrgUnitInput {
    @IsString()
    tenantId!: string;

    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsIn(['organization', 'division', 'department', 'school', 'custom'])
    type?: 'organization' | 'division' | 'department' | 'school' | 'custom';

    @IsOptional()
    @IsIn(['active', 'archived'])
    status?: 'active' | 'archived';

    @IsOptional()
    @IsString()
    parentId?: string | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @IsString()
    actorUserId?: string | null;
}
