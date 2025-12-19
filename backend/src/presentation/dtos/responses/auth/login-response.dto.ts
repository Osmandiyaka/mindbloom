import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
    @ApiProperty()
    access_token: string;

    @ApiProperty()
    tenantSlug: string;

    @ApiProperty()
    user: {
        id: string;
        tenantId: string;
        email: string;
        name: string;
        roleId: string | null;
        role: any;
    };
}
