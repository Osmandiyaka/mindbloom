import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class AddOrgUnitRolesInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;

    @IsArray()
    @IsString({ each: true })
    roleIds!: string[];

    @IsIn(['appliesToUnitOnly', 'inheritsDown'])
    scope!: 'appliesToUnitOnly' | 'inheritsDown';

    @IsOptional()
    @IsString()
    actorUserId?: string | null;
}
