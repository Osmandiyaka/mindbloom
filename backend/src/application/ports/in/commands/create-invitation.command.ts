export class CreateInvitationCommand {
    constructor(
        public readonly tenantId: string,
        public readonly email: string,
        public readonly roles: string[] = [],
        public readonly expiresAt?: Date,
        public readonly createdBy?: string,
    ) { }
}
