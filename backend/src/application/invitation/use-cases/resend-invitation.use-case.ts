import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVITATION_REPOSITORY, InvitationRepository } from '../../../domain/invitation/ports/invitation.repository';
import { Invitation } from '../../../domain/invitation/entities/invitation.entity';

export class ResendInvitationCommand {
    constructor(
        public readonly tenantId: string,
        public readonly invitationId: string,
    ) { }
}

@Injectable()
export class ResendInvitationUseCase {
    constructor(
        @Inject(INVITATION_REPOSITORY)
        private readonly invitationRepository: InvitationRepository,
    ) { }

    async execute(command: ResendInvitationCommand): Promise<Invitation> {
        const existing = await this.invitationRepository.findById(command.invitationId, command.tenantId);
        if (!existing) {
            throw new NotFoundException('Invitation not found');
        }
        const resent = existing.markSent();
        return this.invitationRepository.save(resent);
    }
}
