import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsString } from 'class-validator';

export class AddOrgUnitRolesDto {
    @ApiProperty({ type: [String], example: ['507f1f77bcf86cd799439011'] })
    @IsArray()
    @IsString({ each: true })
    roleIds: string[];

    @ApiProperty({ enum: ['appliesToUnitOnly', 'inheritsDown'] })
    @IsIn(['appliesToUnitOnly', 'inheritsDown'])
    scope: 'appliesToUnitOnly' | 'inheritsDown';
}
