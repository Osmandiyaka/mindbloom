import { IsString } from 'class-validator';

export class DeleteOrgUnitImpactInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;
}
