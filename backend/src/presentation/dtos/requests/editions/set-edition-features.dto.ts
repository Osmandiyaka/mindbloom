import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class EditionFeatureAssignmentDto {
    @ApiProperty({ description: 'Feature key' })
    @IsString()
    featureKey!: string;

    @ApiProperty({ description: 'Feature value as string' })
    @IsString()
    value!: string;
}

export class SetEditionFeaturesDto {
    @ApiProperty({ type: [EditionFeatureAssignmentDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EditionFeatureAssignmentDto)
    features!: EditionFeatureAssignmentDto[];
}
