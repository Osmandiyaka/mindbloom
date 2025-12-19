import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateEditionDto {
    @ApiProperty({ description: 'Display name', required: false })
    @IsOptional()
    @IsString()
    displayName?: string;

    @ApiProperty({ description: 'Description', required: false })
    @IsOptional()
    @IsString()
    description?: string | null;

    @ApiProperty({ description: 'Is active', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Sort order', required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
