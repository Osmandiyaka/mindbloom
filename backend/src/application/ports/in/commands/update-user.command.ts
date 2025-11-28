export interface UpdateUserCommand {
    userId: string;
    email?: string;
    name?: string;
    roleId?: string;
    profilePicture?: string;
}
