import { Invitation, InvitationStatus } from '../../invitation/entities/invitation.entity';
import { INVITATION_REPOSITORY } from './repository.tokens';

export interface InvitationRepository {
    findByTenant(tenantId: string): Promise<Invitation[]>;
    findById(id: string, tenantId: string): Promise<Invitation | null>;
    findByToken(token: string): Promise<Invitation | null>;
    create(invitation: Invitation): Promise<Invitation>;
    save(invitation: Invitation): Promise<Invitation>;
    delete(id: string, tenantId: string): Promise<void>;
    updateStatus(id: string, tenantId: string, status: InvitationStatus): Promise<Invitation | null>;
}

export { INVITATION_REPOSITORY } from './repository.tokens';
