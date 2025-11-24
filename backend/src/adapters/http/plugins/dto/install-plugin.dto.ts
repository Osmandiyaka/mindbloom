import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class InstallPluginDto {
    @ApiProperty({ description: 'Plugin ID to install' })
    @IsString()
    pluginId: string;
}
