import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../../domain/user/entities/user.entity';

export class UserResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    role: string;

    @ApiProperty()
    createdAt: Date;

    static fromDomain(user: User): UserResponseDto {
        const dto = new UserResponseDto();
        dto.id = user.id;
        dto.email = user.email;
        dto.name = user.name;
        dto.role = user.role;
        dto.createdAt = user.createdAt;
        return dto;
    }
}
