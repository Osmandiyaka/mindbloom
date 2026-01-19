import { IsOptional, IsString } from 'class-validator';

export class DeleteOrgUnitInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;

    @IsOptional()
    @IsString()
    confirmationText?: string;

    @IsOptional()
    @IsString()
    actorUserId?: string | null;
}
