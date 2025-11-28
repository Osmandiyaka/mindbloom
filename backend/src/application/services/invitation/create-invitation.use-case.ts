import { Inject, Injectable } from '@nestjs/common';
import { Invitation, InvitationStatus } from '../../../domain/invitation/entities/invitation.entity';
import { INVITATION_REPOSITORY, InvitationRepository } from '../../../domain/ports/out/invitation-repository.port';
import { v4 as uuidv4 } from 'uuid';

export class CreateInvitationCommand {
    constructor(
        public readonly tenantId: string,
        public readonly email: string,
        public readonly roles: string[],
        public readonly expiresAt?: Date,
        public readonly createdBy?: string,
    ) { }
}

@Injectable()
export class CreateInvitationUseCase {
    constructor(
        @Inject(INVITATION_REPOSITORY)
        private readonly invitationRepository: InvitationRepository,
    ) { }

    async execute(command: CreateInvitationCommand): Promise<Invitation> {
        const token = uuidv4();
        const expires = command.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invitation = Invitation.create({
            tenantId: command.tenantId,
            email: command.email,
            roles: command.roles,
            expiresAt: expires,
            createdBy: command.createdBy || 'system',
            token,
        });

        const saved = await this.invitationRepository.create(invitation);
        return saved.markSent();
    }
}
