import { ApiProperty } from '@nestjs/swagger';

export class TenantEditionResponseDto {
    @ApiProperty({ description: 'Edition code' })
    editionCode!: string;

    @ApiProperty({ description: 'Edition display name' })
    editionName!: string;

    @ApiProperty({ description: 'Feature keys enabled for this tenant' })
    features!: string[];

    @ApiProperty({ description: 'Module keys enabled for this tenant', required: false, type: [String] })
    modules?: string[];
}
