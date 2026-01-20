import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateSectionDto {
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
    capacity?: number | null;

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
