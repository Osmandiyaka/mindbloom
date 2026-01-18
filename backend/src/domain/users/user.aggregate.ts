import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { SchoolAccess, UserStatus } from './user.types';

type UserProps = {
    id: string;
    tenantId: string | null;
    email: string;
    name?: string;
    phone?: string | null;
    profilePicture?: string | null;
    gender?: string | null;
    dateOfBirth?: Date | null;
    status: UserStatus;
    roleIds: string[];
    roles?: Role[];
    permissions?: Permission[];
    schoolAccess: SchoolAccess;
    forcePasswordReset: boolean;
    mfaEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export class User {
    constructor(private readonly props: UserProps) { }

    get id() { return this.props.id; }
    get tenantId() { return this.props.tenantId; }
    get email() { return this.props.email; }
    get name() { return this.props.name ?? ''; }
    get phone() { return this.props.phone ?? null; }
    get profilePicture() { return this.props.profilePicture ?? null; }
    get gender() { return this.props.gender ?? null; }
    get dateOfBirth() { return this.props.dateOfBirth ?? null; }
    get status() { return this.props.status; }
    get roleIds() { return this.props.roleIds; }
    get roles() { return this.props.roles ?? []; }
    get permissions() { return this.props.permissions ?? []; }
    get schoolAccess() { return this.props.schoolAccess; }
    get forcePasswordReset() { return this.props.forcePasswordReset; }
    get mfaEnabled() { return this.props.mfaEnabled; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    get primaryRole(): Role | null {
        return this.roles.length ? this.roles[0] : null;
    }

    get primaryRoleId(): string | null {
        return this.roleIds.length ? this.roleIds[0] : null;
    }

    get role(): Role | null {
        return this.primaryRole;
    }

    get roleId(): string | null {
        return this.primaryRoleId;
    }

    isAdmin(): boolean {
        return this.roles.some(role => role.name === 'Tenant Admin' || role.name === 'Host Admin');
    }

    hasRolePermission(resource: string, action: string): boolean {
        return this.roles.some(role => role.hasPermission(resource, action));
    }

    hasPermission(permissionId: string): boolean {
        return this.permissions.some(p => p.id === permissionId);
    }

    addPermission(permission: Permission): User {
        if (this.hasPermission(permission.id)) {
            return this;
        }
        return new User({
            ...this.props,
            permissions: [...this.permissions, permission],
            updatedAt: new Date(),
        });
    }

    removePermission(permissionId: string): User {
        return new User({
            ...this.props,
            permissions: this.permissions.filter(p => p.id !== permissionId),
            updatedAt: new Date(),
        });
    }

    updateProfile(data: {
        name?: string;
        phone?: string | null;
        profilePicture?: string | null;
        gender?: string | null;
        dateOfBirth?: Date | null;
        status?: UserStatus;
    }): User {
        const next = {
            ...this.props,
            name: data.name ?? this.props.name,
            phone: data.phone ?? this.props.phone,
            profilePicture: data.profilePicture ?? this.props.profilePicture,
            gender: data.gender ?? this.props.gender,
            dateOfBirth: data.dateOfBirth ?? this.props.dateOfBirth,
            status: data.status ?? this.props.status,
            updatedAt: new Date(),
        };

        this.assertProfileCompleteness(next);
        return new User(next);
    }

    setSchoolAccess(schoolAccess: SchoolAccess): User {
        const normalized = normalizeSchoolAccess(schoolAccess);
        return new User({
            ...this.props,
            schoolAccess: normalized,
            updatedAt: new Date(),
        });
    }

    assignRoles(roleIds: string[], roles?: Role[]): User {
        const normalized = uniqueStrings(roleIds);
        return new User({
            ...this.props,
            roleIds: normalized,
            roles: roles ?? this.props.roles,
            updatedAt: new Date(),
        });
    }

    suspend(): User {
        return new User({ ...this.props, status: 'suspended', updatedAt: new Date() });
    }

    activate(): User {
        return new User({ ...this.props, status: 'active', updatedAt: new Date() });
    }

    static create(data: {
        id?: string;
        tenantId?: string | null;
        email: string;
        name?: string;
        phone?: string | null;
        profilePicture?: string | null;
        gender?: string | null;
        dateOfBirth?: Date | null;
        status?: UserStatus;
        roleIds?: string[];
        roles?: Role[];
        permissions?: Permission[];
        schoolAccess: SchoolAccess;
        forcePasswordReset?: boolean;
        mfaEnabled?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
    }): User {
        const now = new Date();
        const status = data.status ?? 'active';
        const next: UserProps = {
            id: data.id ?? crypto.randomUUID(),
            tenantId: data.tenantId ?? null,
            email: data.email,
            name: data.name ?? '',
            phone: data.phone ?? null,
            profilePicture: data.profilePicture ?? null,
            gender: data.gender ?? null,
            dateOfBirth: data.dateOfBirth ?? null,
            status,
            roleIds: uniqueStrings(data.roleIds ?? []),
            roles: data.roles ?? [],
            permissions: data.permissions ?? [],
            schoolAccess: normalizeSchoolAccess(data.schoolAccess),
            forcePasswordReset: data.forcePasswordReset ?? false,
            mfaEnabled: data.mfaEnabled ?? false,
            createdAt: data.createdAt ?? now,
            updatedAt: data.updatedAt ?? now,
        };

        const aggregate = new User(next);
        aggregate.assertProfileCompleteness(next);
        return aggregate;
    }

    private assertProfileCompleteness(props: UserProps): void {
        if (props.status === 'invited') {
            return;
        }
        if (!props.name?.trim()) {
            throw new Error('User name is required');
        }
    }
}

const uniqueStrings = (values: string[]): string[] => {
    return Array.from(new Set(values.map(value => value.trim()).filter(Boolean)));
};

const normalizeSchoolAccess = (access: SchoolAccess): SchoolAccess => {
    if (access.scope === 'all') {
        return { scope: 'all' };
    }
    const schoolIds = uniqueStrings(access.schoolIds);
    if (!schoolIds.length) {
        throw new Error('Selected school access requires at least one school');
    }
    return { scope: 'selected', schoolIds };
};
