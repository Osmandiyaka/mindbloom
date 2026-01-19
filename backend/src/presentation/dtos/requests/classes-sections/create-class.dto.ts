import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateClassDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    schoolIds: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    academicYearId?: string | null;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    gradeId?: string | null;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
