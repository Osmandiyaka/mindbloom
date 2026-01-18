import { IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class ListUsersInput {
    @IsString()
    tenantId!: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsIn(['active', 'suspended', 'invited'])
    status?: 'active' | 'suspended' | 'invited';

    @IsOptional()
    @IsString()
    roleId?: string;

    @IsOptional()
    @IsString()
    schoolId?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    pageSize?: number;
}
