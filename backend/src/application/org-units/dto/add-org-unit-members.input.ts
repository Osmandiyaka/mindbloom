import { IsArray, IsOptional, IsString } from 'class-validator';

export class AddOrgUnitMembersInput {
    @IsString()
    tenantId!: string;

    @IsString()
    orgUnitId!: string;

    @IsArray()
    @IsString({ each: true })
    userIds!: string[];

    @IsOptional()
    @IsString()
    actorUserId?: string | null;
}
