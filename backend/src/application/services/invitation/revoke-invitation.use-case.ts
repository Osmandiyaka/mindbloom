import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVITATION_REPOSITORY, InvitationRepository } from '../../../domain/ports/out/invitation-repository.port';
import { Invitation } from '../../../domain/invitation/entities/invitation.entity';
import { RevokeInvitationCommand } from '../../ports/in/commands/revoke-invitation.command';

@Injectable()
export class RevokeInvitationUseCase {
    constructor(
        @Inject(INVITATION_REPOSITORY)
        private readonly invitationRepository: InvitationRepository,
    ) { }

    async execute(command: RevokeInvitationCommand): Promise<Invitation> {
        const existing = await this.invitationRepository.findById(command.invitationId, command.tenantId);
        if (!existing) {
            throw new NotFoundException('Invitation not found');
        }
        const revoked = existing.revoke();
        return this.invitationRepository.save(revoked);
    }
}
