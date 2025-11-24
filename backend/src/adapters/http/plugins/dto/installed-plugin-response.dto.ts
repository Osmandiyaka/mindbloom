import { ApiProperty } from '@nestjs/swagger';

export class InstalledPluginResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    tenantId: string;

    @ApiProperty()
    pluginId: string;

    @ApiProperty()
    version: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    settings: Record<string, any>;

    @ApiProperty()
    permissions: string[];

    @ApiProperty()
    installedAt: Date;

    @ApiProperty({ required: false })
    enabledAt?: Date;

    @ApiProperty({ required: false })
    disabledAt?: Date;

    @ApiProperty({ required: false })
    lastError?: string;

    @ApiProperty()
    updatedAt: Date;
}
