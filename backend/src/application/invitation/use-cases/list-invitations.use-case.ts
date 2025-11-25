import { Inject, Injectable } from '@nestjs/common';
import { INVITATION_REPOSITORY, InvitationRepository } from '../../../domain/invitation/ports/invitation.repository';
import { Invitation } from '../../../domain/invitation/entities/invitation.entity';

@Injectable()
export class ListInvitationsUseCase {
    constructor(
        @Inject(INVITATION_REPOSITORY)
        private readonly invitationRepository: InvitationRepository,
    ) { }

    async execute(tenantId: string): Promise<Invitation[]> {
        return this.invitationRepository.findByTenant(tenantId);
    }
}
