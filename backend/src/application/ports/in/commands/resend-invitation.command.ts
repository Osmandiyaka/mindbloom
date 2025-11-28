export class ResendInvitationCommand {
    constructor(
        public readonly tenantId: string,
        public readonly invitationId: string,
    ) { }
}
