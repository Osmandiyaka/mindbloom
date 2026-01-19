import { IsOptional, IsString } from 'class-validator';

export class RestoreOrgUnitInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;

    @IsOptional()
    @IsString()
    actorUserId?: string | null;
}
