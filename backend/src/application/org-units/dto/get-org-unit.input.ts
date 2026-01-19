import { IsString } from 'class-validator';

export class GetOrgUnitInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;
}
