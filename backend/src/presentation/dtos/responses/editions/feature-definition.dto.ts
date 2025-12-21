import { ApiProperty } from '@nestjs/swagger';
import { FeatureValueType } from '../../../../domain/features/feature-value-type';

export class FeatureDefinitionDto {
    @ApiProperty({ example: 'modules.attendance.enabled' })
    key!: string;

    @ApiProperty({ example: 'Attendance' })
    displayName!: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ example: 'Modules' })
    category!: string;

    @ApiProperty({ enum: FeatureValueType })
    valueType!: FeatureValueType;

    @ApiProperty({ example: 'true' })
    defaultValue!: string;

    @ApiProperty({ required: false, example: 'modules.academics.enabled' })
    parentKey?: string;

    @ApiProperty({ required: false, example: 'academics' })
    moduleKey?: string;

    @ApiProperty({ required: false, type: [String] })
    tags?: string[];

    @ApiProperty({ required: false, example: 10 })
    sortOrder?: number;
}
