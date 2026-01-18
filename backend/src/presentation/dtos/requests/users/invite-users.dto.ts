import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SchoolAccessDto {
    @ApiProperty({ example: 'all', enum: ['all', 'selected'] })
    @IsIn(['all', 'selected'])
    scope!: 'all' | 'selected';

    @ApiProperty({ example: ['school-1'], required: false, type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    schoolIds?: string[];
}

export class InviteUsersDto {
    @ApiProperty({ example: ['user1@example.com', 'user2@example.com'], type: [String] })
    @IsArray()
    @IsEmail({}, { each: true })
    emails!: string[];

    @ApiProperty({ example: ['507f1f77bcf86cd799439011'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    roleIds?: string[];

    @ApiProperty({ required: false, type: SchoolAccessDto })
    @ValidateNested()
    @Type(() => SchoolAccessDto)
    @IsOptional()
    schoolAccess?: SchoolAccessDto;
}
