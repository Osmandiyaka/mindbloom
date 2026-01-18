import { CreateUserFormState, InviteUsersFormState, SchoolAccess, UserListItem, ExistingUserRow, PendingInviteRow, UserStatus } from './users.types';

export type CreateUserRequest = {
    name: string;
    email: string;
    password: string;
    roleIds: string[];
    schoolAccess: SchoolAccess;
    phone?: string;
    profilePicture?: string | null;
    jobTitle?: string;
    department?: string;
    gender?: string;
    dateOfBirth?: string;
    status?: UserStatus;
    forcePasswordReset?: boolean;
    mfaEnabled?: boolean;
};

export type InviteUsersRequest = {
    emails: string[];
    roleIds: string[];
    schoolAccess: SchoolAccess;
};

export type ApiUser = {
    id: string;
    email: string;
    name: string;
    roleIds?: string[];
    roles?: Array<{
        id: string;
        name: string;
        description?: string;
        isSystemRole?: boolean;
        isGlobal?: boolean;
        scopeType?: string;
        status?: string;
    }>;
    status?: UserStatus;
    schoolAccess?: SchoolAccess;
    profilePicture?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
    department?: string | null;
    createdAt?: string | Date;
};

const normalizeStatus = (status?: string): UserStatus => {
    if (status === 'suspended') return 'suspended';
    if (status === 'invited') return 'invited';
    return 'active';
};

export const mapApiUserToUserRow = (user: ApiUser): ExistingUserRow => ({
    kind: 'existing',
    id: user.id,
    name: user.name || '',
    email: user.email,
    roleId: user.roleIds?.[0] ?? null,
    roleName: user.roles?.[0]?.name ?? null,
    roleIds: user.roleIds ?? [],
    status: normalizeStatus(user.status),
    schoolAccess: user.schoolAccess ?? { scope: 'all' },
    phone: user.phone ?? undefined,
    profilePicture: user.profilePicture ?? null,
    jobTitle: user.jobTitle ?? undefined,
    department: user.department ?? undefined,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
});

export const mapInviteEmailToPendingRow = (
    email: string,
    roleIds: string[],
    schoolAccess: SchoolAccess,
): PendingInviteRow => ({
    kind: 'pendingInvite',
    id: crypto.randomUUID(),
    email,
    roleId: roleIds[0] ?? null,
    roleName: null,
    roleIds,
    status: 'invited',
    schoolAccess,
});

export const mapApiUserToListItem = (user: ApiUser): UserListItem => mapApiUserToUserRow(user);

const generateRandomPassword = (length = 16): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%*?';
    let result = '';
    for (let i = 0; i < length; i += 1) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const mapCreateUserFormToApiPayload = (form: CreateUserFormState): CreateUserRequest => {
    const schoolAccess: SchoolAccess = form.schoolAccessScope === 'selected'
        ? { scope: 'selected', schoolIds: form.selectedSchoolIds }
        : { scope: 'all' };
    return {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.generatePassword ? generateRandomPassword() : form.password.trim(),
        roleIds: form.roleIds,
        schoolAccess,
        phone: form.phone.trim() || undefined,
        profilePicture: form.profilePicture ?? undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        department: form.department.trim() || undefined,
        gender: form.gender.trim() || undefined,
        dateOfBirth: form.dateOfBirth.trim() || undefined,
        status: form.status,
        forcePasswordReset: form.forcePasswordReset,
        mfaEnabled: form.forceMfa,
    };
};

export const mapInviteUsersFormToApiPayload = (form: InviteUsersFormState): InviteUsersRequest => {
    const schoolAccess: SchoolAccess = form.schoolAccessScope === 'selected'
        ? { scope: 'selected', schoolIds: form.selectedSchoolIds }
        : { scope: 'all' };
    return {
        emails: form.emails,
        roleIds: form.roleIds,
        schoolAccess,
    };
};

export const mapEditUserFormToApiPayload = (form: CreateUserFormState): Partial<CreateUserRequest> => {
    const schoolAccess: SchoolAccess = form.selectedSchoolIds.length
        ? { scope: 'selected', schoolIds: form.selectedSchoolIds }
        : { scope: 'all' };
    return {
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        roleIds: form.roleIds,
        schoolAccess,
        phone: form.phone.trim() || undefined,
        profilePicture: form.profilePicture ?? undefined,
        gender: form.gender.trim() || undefined,
        dateOfBirth: form.dateOfBirth.trim() || undefined,
        status: form.status,
        forcePasswordReset: form.forcePasswordReset,
        mfaEnabled: form.forceMfa,
    };
};
