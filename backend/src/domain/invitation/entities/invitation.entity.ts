export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    EXPIRED = 'expired',
    REVOKED = 'revoked',
    SENT = 'sent',
}

export class Invitation {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly email: string,
        public readonly roles: string[],
        public readonly status: InvitationStatus,
        public readonly token: string,
        public readonly expiresAt: Date,
        public readonly createdBy: string,
        public readonly createdAt: Date,
        public readonly updatedAt?: Date,
        public readonly sentAt?: Date,
    ) { }

    static create(props: {
        tenantId: string;
        email: string;
        roles: string[];
        expiresAt: Date;
        createdBy: string;
        token: string;
    }): Invitation {
        return new Invitation(
            '',
            props.tenantId,
            props.email.toLowerCase(),
            props.roles,
            InvitationStatus.PENDING,
            props.token,
            props.expiresAt,
            props.createdBy,
            new Date(),
        );
    }

    markSent(): Invitation {
        return new Invitation(
            this.id,
            this.tenantId,
            this.email,
            this.roles,
            InvitationStatus.SENT,
            this.token,
            this.expiresAt,
            this.createdBy,
            this.createdAt,
            new Date(),
            new Date(),
        );
    }

    revoke(): Invitation {
        return new Invitation(
            this.id,
            this.tenantId,
            this.email,
            this.roles,
            InvitationStatus.REVOKED,
            this.token,
            this.expiresAt,
            this.createdBy,
            this.createdAt,
            new Date(),
            this.sentAt,
        );
    }
}
