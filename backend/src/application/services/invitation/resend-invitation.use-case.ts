import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVITATION_REPOSITORY, InvitationRepository } from '../../../domain/ports/out/invitation-repository.port';
import { Invitation } from '../../../domain/invitation/entities/invitation.entity';
import { ResendInvitationCommand } from '../../ports/in/commands/resend-invitation.command';
import { InvitationMailer } from './invitation.mailer';

@Injectable()
export class ResendInvitationUseCase {
    constructor(
        @Inject(INVITATION_REPOSITORY)
        private readonly invitationRepository: InvitationRepository,
        private readonly invitationMailer: InvitationMailer,
    ) { }

    async execute(command: ResendInvitationCommand): Promise<Invitation> {
        const existing = await this.invitationRepository.findById(command.invitationId, command.tenantId);
        if (!existing) {
            throw new NotFoundException('Invitation not found');
        }
        await this.invitationMailer.sendInvitation(existing.email, existing.token, existing.roles, existing.expiresAt);
        const resent = existing.markSent();
        return this.invitationRepository.save(resent);
    }
}
