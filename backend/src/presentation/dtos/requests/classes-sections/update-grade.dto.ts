import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateGradeDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    schoolIds?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    code?: string | null;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiProperty({ required: false, enum: ['active', 'archived'] })
    @IsOptional()
    @IsIn(['active', 'archived'])
    status?: 'active' | 'archived';
}
