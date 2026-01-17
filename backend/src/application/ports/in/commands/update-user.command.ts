export interface UpdateUserCommand {
    userId: string;
    email?: string;
    name?: string;
    roleId?: string;
    profilePicture?: string;
    gender?: string;
    dateOfBirth?: Date;
    phone?: string;
    forcePasswordReset?: boolean;
    mfaEnabled?: boolean;
}
