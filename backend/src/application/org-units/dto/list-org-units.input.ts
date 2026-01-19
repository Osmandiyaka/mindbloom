import { IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class ListOrgUnitsInput {
    @IsString()
    tenantId!: string;

    @IsOptional()
    @IsString()
    parentId?: string | null;

    @IsOptional()
    @IsIn(['active', 'archived'])
    status?: 'active' | 'archived';

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number;

    @IsOptional()
    @IsString()
    cursor?: string;
}
