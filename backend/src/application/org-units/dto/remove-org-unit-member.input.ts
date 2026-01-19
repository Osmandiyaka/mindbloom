import { IsOptional, IsString } from 'class-validator';

export class RemoveOrgUnitMemberInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;

    @IsString()
    userId!: string;

    @IsOptional()
    @IsString()
    actorUserId?: string | null;
}
