import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../domain/entities/user.entity';

export class UserResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    roleId: string | null;

    @ApiProperty()
    role: any;

    @ApiProperty()
    profilePicture: string | null;

    @ApiProperty()
    createdAt: Date;

    static fromDomain(user: User): UserResponseDto {
        const dto = new UserResponseDto();
        dto.id = user.id;
        dto.email = user.email;
        dto.name = user.name;
        dto.roleId = user.roleId;
        dto.role = user.role ? {
            id: user.role.id,
            name: user.role.name,
            description: user.role.description,
            isSystemRole: user.role.isSystemRole,
            permissions: user.role.permissions
        } : null;
        dto.profilePicture = user.profilePicture;
        dto.createdAt = user.createdAt;
        return dto;
    }
}
