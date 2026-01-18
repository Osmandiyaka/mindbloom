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
    roleIds: string[];

    @ApiProperty({ required: false })
    status?: string;

    @ApiProperty({ required: false })
    schoolAccess?: any;

    @ApiProperty()
    profilePicture: string | null;

    @ApiProperty({ required: false })
    gender?: string | null;

    @ApiProperty({ required: false })
    dateOfBirth?: Date | null;

    @ApiProperty({ required: false })
    phone?: string | null;

    @ApiProperty()
    createdAt: Date;

    static fromDomain(user: User): UserResponseDto {
        const dto = new UserResponseDto();
        dto.id = user.id;
        dto.email = user.email;
        dto.name = user.name;
        dto.roleIds = user.roleIds;
        dto.status = user.status;
        dto.schoolAccess = user.schoolAccess;
        dto.profilePicture = user.profilePicture;
        dto.gender = user.gender ?? null;
        dto.dateOfBirth = user.dateOfBirth ?? null;
        dto.phone = user.phone ?? null;
        dto.createdAt = user.createdAt;
        return dto;
    }
}
