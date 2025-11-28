import { ApiProperty } from '@nestjs/swagger';

export class PluginResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    pluginId: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    version: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    author: string;

    @ApiProperty()
    category: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    isOfficial: boolean;

    @ApiProperty()
    iconUrl: string;

    @ApiProperty()
    bannerUrl: string;

    @ApiProperty()
    screenshots: string[];

    @ApiProperty()
    price: number;

    @ApiProperty()
    downloads: number;

    @ApiProperty()
    rating: number;

    @ApiProperty()
    ratingCount: number;

    @ApiProperty()
    tags: string[];

    @ApiProperty()
    manifest: Record<string, any>;

    @ApiProperty()
    changelog: any[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ required: false })
    isInstalled?: boolean;

    @ApiProperty({ required: false })
    installedVersion?: string;

    @ApiProperty({ required: false })
    installedStatus?: string;
}
