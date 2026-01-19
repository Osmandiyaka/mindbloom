import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AddOrgUnitMembersDto {
    @ApiProperty({ type: [String], example: ['507f1f77bcf86cd799439011'] })
    @IsArray()
    @IsString({ each: true })
    userIds: string[];
}
