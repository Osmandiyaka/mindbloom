import { Invitation, InvitationStatus } from '../entities/invitation.entity';

export const INVITATION_REPOSITORY = 'INVITATION_REPOSITORY';

export interface InvitationRepository {
    findByTenant(tenantId: string): Promise<Invitation[]>;
    findById(id: string, tenantId: string): Promise<Invitation | null>;
    findByToken(token: string): Promise<Invitation | null>;
    create(invitation: Invitation): Promise<Invitation>;
    save(invitation: Invitation): Promise<Invitation>;
    delete(id: string, tenantId: string): Promise<void>;
    updateStatus(id: string, tenantId: string, status: InvitationStatus): Promise<Invitation | null>;
}
