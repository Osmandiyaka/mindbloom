import { ApiProperty } from '@nestjs/swagger';

export class TenantEditionResponseDto {
    @ApiProperty({ description: 'Edition code (mapped from tenant plan for now)' })
    editionCode!: string;

    @ApiProperty({ description: 'Edition display name' })
    editionName!: string;

    @ApiProperty({ description: 'Feature keys enabled for this tenant' })
    features!: string[];
}
