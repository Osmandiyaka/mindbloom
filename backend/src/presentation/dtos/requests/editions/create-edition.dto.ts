import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateEditionDto {
    @ApiProperty({ description: 'System name (unique, lowercase)' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ description: 'Display name shown to users' })
    @IsString()
    @IsNotEmpty()
    displayName!: string;

    @ApiProperty({ description: 'Edition description', required: false })
    @IsOptional()
    @IsString()
    description?: string | null;

    @ApiProperty({ description: 'Whether edition is active', required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Sort order (ascending)', required: false, default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
