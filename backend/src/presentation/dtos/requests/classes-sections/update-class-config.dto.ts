import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsBoolean } from 'class-validator';

export class UpdateClassConfigDto {
    @ApiProperty({ required: false, enum: ['perAcademicYear', 'global'] })
    @IsOptional()
    @IsIn(['perAcademicYear', 'global'])
    classesScope?: 'perAcademicYear' | 'global';

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    requireGradeLink?: boolean;

    @ApiProperty({ required: false, enum: ['perClass', 'perClassPerSchool'] })
    @IsOptional()
    @IsIn(['perClass', 'perClassPerSchool'])
    sectionUniquenessScope?: 'perClass' | 'perClassPerSchool';
}
