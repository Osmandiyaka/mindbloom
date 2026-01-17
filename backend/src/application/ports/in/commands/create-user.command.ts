export interface CreateUserCommand {
    tenantId: string;
    email: string;
    name: string;
    password: string;
    roleId?: string;
    profilePicture?: string;
    gender?: string;
    dateOfBirth?: Date;
    phone?: string;
    forcePasswordReset?: boolean;
    mfaEnabled?: boolean;
}
