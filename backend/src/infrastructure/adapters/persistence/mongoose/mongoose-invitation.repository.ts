import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invitation, InvitationStatus } from '../../../../domain/invitation/entities/invitation.entity';
import { InvitationRepository } from '../../../../domain/ports/out/invitation-repository.port';
import { InvitationDocument } from './schemas/invitation.schema';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';

@Injectable()
export class MongooseInvitationRepository extends TenantScopedRepository<InvitationDocument, Invitation> implements InvitationRepository {
    constructor(
        @InjectModel('Invitation')
        private readonly invitationModel: Model<InvitationDocument>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async findByTenant(tenantId: string): Promise<Invitation[]> {
        const resolved = this.requireTenant(tenantId);
        const docs = await this.invitationModel.find({ tenantId: resolved }).sort({ createdAt: -1 }).exec();
        return docs.map(this.toDomain);
    }

    async findById(id: string, tenantId: string): Promise<Invitation | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.invitationModel.findOne({ _id: id, tenantId: resolved }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByToken(token: string): Promise<Invitation | null> {
        const doc = await this.invitationModel.findOne({ token }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async create(invitation: Invitation): Promise<Invitation> {
        const doc = await this.invitationModel.create({
            tenantId: invitation.tenantId,
            email: invitation.email,
            roles: invitation.roles,
            status: invitation.status,
            token: invitation.token,
            expiresAt: invitation.expiresAt,
            createdBy: invitation.createdBy,
            sentAt: invitation.sentAt,
        });
        return this.toDomain(doc);
    }

    async save(invitation: Invitation): Promise<Invitation> {
        const updated = await this.invitationModel.findByIdAndUpdate(
            invitation.id,
            {
                tenantId: invitation.tenantId,
                email: invitation.email,
                roles: invitation.roles,
                status: invitation.status,
                token: invitation.token,
                expiresAt: invitation.expiresAt,
                createdBy: invitation.createdBy,
                sentAt: invitation.sentAt,
                updatedAt: new Date(),
            },
            { new: true }
        ).exec();
        if (!updated) {
            throw new Error('Invitation not found');
        }
        return this.toDomain(updated);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const resolved = this.requireTenant(tenantId);
        await this.invitationModel.deleteOne({ _id: id, tenantId: resolved }).exec();
    }

    async updateStatus(id: string, tenantId: string, status: InvitationStatus): Promise<Invitation | null> {
        const resolved = this.requireTenant(tenantId);
        const updated = await this.invitationModel.findOneAndUpdate(
            { _id: id, tenantId: resolved },
            { status, updatedAt: new Date() },
            { new: true }
        ).exec();
        return updated ? this.toDomain(updated) : null;
    }

    private toDomain(doc: InvitationDocument): Invitation {
        return new Invitation(
            doc._id.toString(),
            doc.tenantId,
            doc.email,
            doc.roles,
            doc.status as InvitationStatus,
            doc.token,
            doc.expiresAt,
            doc.createdBy,
            doc.createdAt,
            doc.updatedAt,
            doc.sentAt,
        );
    }
}
