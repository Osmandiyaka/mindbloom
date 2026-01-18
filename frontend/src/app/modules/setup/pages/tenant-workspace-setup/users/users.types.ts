export type UserStatus = 'active' | 'suspended' | 'invited';

export type SchoolAccess =
    | { scope: 'all' }
    | { scope: 'selected'; schoolIds: string[] };

export type UserRoleRef = {
    id: string;
    name: string;
};

export type ExistingUserRow = {
    kind: 'existing';
    id: string;
    name: string;
    email: string;
    roleId: string | null;
    roleName: string | null;
    roleIds: string[];
    status: UserStatus;
    schoolAccess: SchoolAccess;
    jobTitle?: string;
    department?: string;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    profilePicture?: string | null;
    notes?: string;
    lastLogin?: string;
    createdAt?: string;
};

export type PendingInviteRow = {
    kind: 'pendingInvite';
    id: string;
    email: string;
    roleId: string | null;
    roleName: string | null;
    roleIds: string[];
    status: 'invited';
    schoolAccess: SchoolAccess;
    createdAt?: string;
};

export type UserListItem = ExistingUserRow | PendingInviteRow;

export type CreateUserFormState = {
    name: string;
    email: string;
    phone: string;
    password: string;
    roleIds: string[];
    roleNames: string[];
    schoolAccessScope: 'all' | 'selected';
    selectedSchoolIds: string[];
    profilePicture: string | null;
    status: UserStatus;
    jobTitle: string;
    department: string;
    gender: string;
    dateOfBirth: string;
    notes: string;
    forcePasswordReset: boolean;
    sendInviteEmail: boolean;
    forceMfa: boolean;
    generatePassword: boolean;
};

export type CreateUserUiState = {
    showPassword: boolean;
    advancedOpen: boolean;
    rolePreviewOpen: boolean;
    discardOpen: boolean;
    notesOpen: boolean;
};

export type InviteUsersFormState = {
    emailInput: string;
    emails: string[];
    roleId: string | null;
    roleName: string | null;
    roleIds: string[];
    schoolAccessScope: 'all' | 'selected';
    selectedSchoolIds: string[];
    message: string;
    messageOpen: boolean;
};

export type EditUserFormState = {
    id: string;
    name: string;
    roleId: string | null;
    roleName: string | null;
    schoolAccessScope: 'all' | 'selected';
    selectedSchoolIds: string[];
    jobTitle: string;
    department: string;
};

export type RequestState = {
    status: 'idle' | 'loading' | 'success' | 'error';
    error?: string;
};
