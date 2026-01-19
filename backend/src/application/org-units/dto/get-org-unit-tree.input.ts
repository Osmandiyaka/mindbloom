import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetOrgUnitTreeInput {
    @IsString()
    tenantId!: string;

    @IsOptional()
    @IsIn(['active', 'archived'])
    status?: 'active' | 'archived';
}
