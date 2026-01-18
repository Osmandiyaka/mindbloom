import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
    @ApiProperty()
    access_token: string;

    @ApiProperty({ required: false, nullable: true })
    tenantSlug: string | null;

    @ApiProperty({ default: false })
    isHost: boolean;

    @ApiProperty()
    user: {
        id: string;
        tenantId: string | null;
        email: string;
        name: string;
        roleId: string | null;
        roleIds: string[];
        role: any;
    };
}
