import { ApiProperty } from '@nestjs/swagger';
import { CurrentLoginInfoResult } from '../../../../application/services/auth/get-current-login-info.use-case';
import { TenantPlan, Tenant, TenantStatus, ContactInfo } from '../../../../domain/tenant/entities/tenant.entity';
import { Permission } from '../../../../domain/rbac/entities/permission.entity';
import { Role } from '../../../../domain/rbac/entities/role.entity';
import { User } from '../../../../domain/entities/user.entity';
import { TenantEditionResponseDto } from '../tenant/tenant-edition.response.dto';

class PermissionDto {
    @ApiProperty({ description: 'Permission identifier' })
    id!: string;

    @ApiProperty({ description: 'Resource key' })
    resource!: string;

    @ApiProperty({ description: 'Human readable name', required: false })
    displayName?: string;

    @ApiProperty({ type: [String], description: 'Actions granted for the resource' })
    actions!: string[];

    @ApiProperty({ description: 'Scope of the permission', required: false })
    scope?: string;

    @ApiProperty({ description: 'Optional description', required: false })
    description?: string;

    static fromDomain(permission: Permission): PermissionDto {
        const dto = new PermissionDto();
        dto.id = permission.id || permission.resource;
        dto.resource = permission.resource;
        dto.displayName = permission.displayName;
        dto.description = permission.description;
        dto.actions = (permission.actions || []).map((action) => String(action));
        dto.scope = permission.scope as any;
        return dto;
    }
}

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

    @ApiProperty({ type: [PermissionDto] })
    permissions!: PermissionDto[];

    static fromDomain(role: Role): RoleDto {
        const dto = new RoleDto();
        dto.id = role.id;
        dto.name = role.name;
        dto.description = role.description;
        dto.isSystemRole = role.isSystemRole;
        dto.isGlobal = role.isGlobal;
        dto.permissions = (role.permissions || []).map(PermissionDto.fromDomain);
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

    @ApiProperty({ type: [PermissionDto], description: 'Direct permissions assigned to the user' })
    permissions!: PermissionDto[];

    @ApiProperty({ description: 'Force password reset flag' })
    forcePasswordReset!: boolean;

    @ApiProperty({ description: 'MFA enabled flag' })
    mfaEnabled!: boolean;

    @ApiProperty({ description: 'Profile picture URL', required: false })
    profilePicture?: string | null;

    static fromDomain(user: User, directPermissions: PermissionDto[]): UserLoginInfoDto {
        const dto = new UserLoginInfoDto();
        dto.id = user.id;
        dto.tenantId = user.tenantId;
        dto.email = user.email;
        dto.name = user.name;
        dto.roleId = user.roleId;
        dto.role = user.role ? RoleDto.fromDomain(user.role) : null;
        dto.permissions = directPermissions;
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

    @ApiProperty({ enum: TenantPlan })
    plan!: TenantPlan;

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
        dto.plan = tenant.plan;
        dto.status = tenant.status;
        dto.locale = tenant.locale;
        dto.timezone = tenant.timezone;
        dto.enabledModules = tenant.enabledModules || [];
        dto.contactInfo = tenant.contactInfo;
        return dto;
    }
}

class PermissionSummaryDto {
    @ApiProperty({ type: [String], description: 'Normalized permission keys granted to the user' })
    effective!: string[];

    @ApiProperty({ type: [PermissionDto], description: 'Permissions coming from the user role' })
    role!: PermissionDto[];

    @ApiProperty({ type: [PermissionDto], description: 'Permissions assigned directly to the user' })
    direct!: PermissionDto[];
}

export class CurrentLoginInfoResponseDto {
    @ApiProperty({ type: () => UserLoginInfoDto })
    user!: UserLoginInfoDto;

    @ApiProperty({ type: () => TenantInfoDto })
    tenant!: TenantInfoDto;

    @ApiProperty({ type: () => TenantEditionResponseDto })
    edition!: TenantEditionResponseDto;

    @ApiProperty({ type: [RoleDto] })
    roles!: RoleDto[];

    @ApiProperty({ type: () => PermissionSummaryDto })
    permissions!: PermissionSummaryDto;

    static from(result: CurrentLoginInfoResult): CurrentLoginInfoResponseDto {
        const dto = new CurrentLoginInfoResponseDto();
        const directPermissions = result.permissions.direct.map(PermissionDto.fromDomain);
        const rolePermissions = result.permissions.role.map(PermissionDto.fromDomain);

        dto.user = UserLoginInfoDto.fromDomain(result.user, directPermissions);
        dto.tenant = TenantInfoDto.fromDomain(result.tenant);
        dto.edition = {
            editionCode: result.edition.editionCode,
            editionName: result.edition.editionName,
            features: result.edition.features,
        } as TenantEditionResponseDto;
        dto.roles = result.roles.map(RoleDto.fromDomain);
        dto.permissions = {
            effective: result.permissions.keys,
            role: rolePermissions,
            direct: directPermissions,
        } as PermissionSummaryDto;

        return dto;
    }
}
