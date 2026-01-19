import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateOrgUnitDto {
    @ApiProperty({ example: 'Finance', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'FIN', required: false })
    @IsOptional()
    @IsString()
    code?: string | null;

    @ApiProperty({ enum: ['organization', 'division', 'department', 'school', 'custom'], required: false })
    @IsOptional()
    @IsIn(['organization', 'division', 'department', 'school', 'custom'])
    type?: 'organization' | 'division' | 'department' | 'school' | 'custom';

    @ApiProperty({ enum: ['active', 'archived'], required: false })
    @IsOptional()
    @IsIn(['active', 'archived'])
    status?: 'active' | 'archived';

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
