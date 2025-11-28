export class RevokeInvitationCommand {
    constructor(
        public readonly tenantId: string,
        public readonly invitationId: string,
    ) { }
}
