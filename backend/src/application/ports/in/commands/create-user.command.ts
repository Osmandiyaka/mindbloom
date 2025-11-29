export interface CreateUserCommand {
    tenantId: string;
    email: string;
    name: string;
    password: string;
    roleId?: string;
    profilePicture?: string;
    forcePasswordReset?: boolean;
    mfaEnabled?: boolean;
}
