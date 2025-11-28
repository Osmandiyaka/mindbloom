import { ApiProperty } from '@nestjs/swagger';

export class UpdatePluginSettingsDto {
    @ApiProperty({
        description: 'Plugin settings object',
        example: {
            apiKey: 'your-api-key',
            senderId: 'SENDER_ID',
            enableNotifications: true,
        },
    })
    settings: Record<string, any>;
}
