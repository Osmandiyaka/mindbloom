import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class TenantDiscoveryDto {
    @ApiProperty({ description: 'The email address used to discover a tenant' })
    @IsEmail()
    email: string;
}
