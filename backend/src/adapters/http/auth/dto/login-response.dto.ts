import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
    @ApiProperty()
    access_token: string;

    @ApiProperty()
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}
