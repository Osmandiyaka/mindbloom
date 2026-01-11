import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School, SchoolStatus, SchoolType } from '../../../../domain/school/entities/school.entity';

export class SchoolResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty()
    code!: string;

    @ApiProperty({ enum: SchoolType })
    type!: SchoolType;

    @ApiProperty({ enum: SchoolStatus })
    status!: SchoolStatus;

    @ApiPropertyOptional()
    domain?: string;

    static fromDomain(school: School): SchoolResponseDto {
        return {
            id: school.id,
            name: school.name,
            code: school.code,
            type: school.type,
            status: school.status,
            domain: school.contact?.website,
        };
    }
}
