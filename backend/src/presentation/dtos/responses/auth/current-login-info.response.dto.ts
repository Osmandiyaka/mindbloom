import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrentLoginInfoResult } from '../../../../application/services/auth/get-current-login-info.use-case';
import { Tenant, TenantStatus, ContactInfo } from '../../../../domain/tenant/entities/tenant.entity';
import { Role } from '../../../../domain/rbac/entities/role.entity';
import { User } from '../../../../domain/entities/user.entity';
import { TenantEditionResponseDto } from '../tenant/tenant-edition.response.dto';

class RoleDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ description: 'Role marked as system role' })
    isSystemRole!: boolean;

    @ApiProperty({ description: 'Role is global across tenants', required: false })
    isGlobal?: boolean;

    static fromDomain(role: Role): RoleDto {
        const dto = new RoleDto();
        dto.id = role.id;
        dto.name = role.name;
        dto.description = role.description;
        dto.isSystemRole = role.isSystemRole;
        dto.isGlobal = role.isGlobal;
        return dto;
    }
}

class UserLoginInfoDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    tenantId!: string;

    @ApiProperty()
    email!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty({ required: false })
    roleId!: string | null;

    @ApiProperty({ type: () => RoleDto, required: false })
    role!: RoleDto | null;

    @ApiProperty({ type: [String], description: 'Normalized permission keys granted to the user (role + direct)' })
    permissions!: string[];

    @ApiProperty({ description: 'Force password reset flag' })
    forcePasswordReset!: boolean;

    @ApiProperty({ description: 'MFA enabled flag' })
    mfaEnabled!: boolean;

    @ApiProperty({ description: 'Profile picture URL', required: false })
    profilePicture?: string | null;

    static fromDomain(user: User, permissionKeys: string[]): UserLoginInfoDto {
        const dto = new UserLoginInfoDto();
        dto.id = user.id;
        dto.tenantId = user.tenantId;
        dto.email = user.email;
        dto.name = user.name;
        dto.roleId = user.roleId;
        dto.role = user.role ? RoleDto.fromDomain(user.role) : null;
        dto.permissions = permissionKeys;
        dto.forcePasswordReset = user.forcePasswordReset;
        dto.mfaEnabled = user.mfaEnabled;
        dto.profilePicture = user.profilePicture;
        return dto;
    }
}

class TenantInfoDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty()
    subdomain!: string;

    @ApiPropertyOptional({ description: 'Tenant edition id (preferred)' })
    editionId?: string;

    @ApiProperty({ description: 'Tenant edition code (fallback to plan)' })
    edition!: string;

    @ApiProperty({ enum: TenantStatus })
    status!: TenantStatus;

    @ApiProperty({ description: 'Display locale for tenant' })
    locale!: string;

    @ApiProperty({ description: 'Timezone identifier' })
    timezone!: string;

    @ApiProperty({ type: [String], description: 'Tenant enabled modules' })
    enabledModules!: string[];

    @ApiProperty({ description: 'Primary tenant contact info' })
    contactInfo!: ContactInfo;

    static fromDomain(tenant: Tenant): TenantInfoDto {
        const dto = new TenantInfoDto();
        dto.id = tenant.id;
        dto.name = tenant.name;
        dto.subdomain = tenant.subdomain;
        dto.editionId = tenant.editionId ?? undefined;
        dto.edition = tenant.metadata?.editionCode ?? 'trial';
        dto.status = tenant.status;
        dto.locale = tenant.locale;
        dto.timezone = tenant.timezone;
        dto.enabledModules = tenant.enabledModules || [];
        dto.contactInfo = tenant.contactInfo;
        return dto;
    }
}

export class CurrentLoginInfoResponseDto {
    @ApiProperty({ type: () => UserLoginInfoDto })
    user!: UserLoginInfoDto;

    @ApiProperty({ type: () => TenantInfoDto })
    tenant!: TenantInfoDto;

    @ApiProperty({ type: () => TenantEditionResponseDto })
    edition!: TenantEditionResponseDto;

    static from(result: CurrentLoginInfoResult): CurrentLoginInfoResponseDto {
        const dto = new CurrentLoginInfoResponseDto();
        const permissionKeys = result.permissions || [];

        dto.user = UserLoginInfoDto.fromDomain(result.user, permissionKeys);
        dto.tenant = TenantInfoDto.fromDomain(result.tenant);
        dto.edition = {
            editionCode: result.edition.editionCode,
            editionName: result.edition.editionName,
            features: result.edition.features,
            modules: (result as any)?.edition?.modules ?? result.edition.features,
        } as TenantEditionResponseDto;
        return dto;
    }
}
