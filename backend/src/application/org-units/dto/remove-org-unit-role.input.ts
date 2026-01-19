import { IsOptional, IsString } from 'class-validator';

export class RemoveOrgUnitRoleInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;

    @IsString()
    roleId!: string;

    @IsOptional()
    @IsString()
    actorUserId?: string | null;
}
